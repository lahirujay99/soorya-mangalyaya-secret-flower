// app/api/submit/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma'; // Import the singleton instance
import { z } from 'zod'; // Using Zod for validation
import { createRateLimitMiddleware } from '@/lib/rate-limit';
import { tokenCache } from '@/lib/cache'; // Import the cache for invalidation
import { getCurrentDateInSriLankaTimezone } from '@/lib/date-utils'; // Import the timezone utility

// Define expected input schema using Zod - updated to focus on flower name guessing
const submitSchema = z.object({
  tokenCode: z.string().min(1, 'Token is required'),
  contestType: z.literal('flower'), // Only allow flower contest type
  fullName: z.string().min(1, 'Full Name is required'),
  contactNumber: z.string().min(1, 'Contact Number is required'),
  secretFlowerName: z.string().min(1, 'Secret flower name guess is required'),
});

// Configure rate limiting - more strict for submissions (5 per minute)
const rateLimitMiddleware = createRateLimitMiddleware({
  interval: 60 * 1000, // 1 minute
  limit: 5,            // 5 submission attempts per minute per IP
});

// Add response caching headers to improve performance
const addCacheHeaders = (response: NextResponse) => {
  try {
    // Set private cache to prevent sensitive data being cached by CDNs
    response.headers.set('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
  } catch (e) {
    console.error('Error setting cache headers:', e);
  }
  return response;
};

// Define a type for Prisma error handling
interface PrismaError {
  code?: string;
  meta?: {
    modelName?: string;
    [key: string]: unknown;
  };
}

export async function POST(req: NextRequest) {
  try {
    // Apply rate limiting with better error handling
    try {
      const rateLimit = await rateLimitMiddleware(req);
      if (rateLimit) return rateLimit;
    } catch (rateLimitError) {
      console.error('Rate limit error:', rateLimitError);
      // Continue processing if rate limiting fails
    }
  
    // Parse JSON with error handling
    let body;
    try {
      body = await req.json();
      console.log('Request body:', body);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      return addCacheHeaders(
        NextResponse.json(
          { message: "Invalid request format" },
          { status: 400 }
        )
      );
    }

    // Validate Input Data
    const validation = submitSchema.safeParse(body);
    if (!validation.success) {
      console.log('Validation errors:', validation.error.errors);
      const response = NextResponse.json(
        { 
          message: "Invalid input", 
          errors: validation.error.errors.map(err => ({
            path: err.path.join('.'),
            message: err.message
          }))
        },
        { status: 400 }
      );
      return addCacheHeaders(response);
    }

    const { tokenCode, fullName, contactNumber, secretFlowerName } = validation.data;
    
    // Create cache key outside of transaction for later use
    const cacheKey = `token:${tokenCode}`;

    // Get current time in Sri Lanka timezone using our utility function
    const submittedAt = getCurrentDateInSriLankaTimezone();

    // Execute core logic within a Prisma Transaction with optimized queries
    try {
      const result = await prisma.$transaction(async (tx) => {
        // Find the token with only fields we need (optimized query)
        const token = await tx.token.findUnique({
          where: { token_code: tokenCode },
          select: {
            id: true,
            is_valid: true,
            is_used: true
          }
        });

        // Validate token status INSIDE the transaction
        if (!token) {
          throw new Error('INVALID_TOKEN');
        }
        if (!token.is_valid) {
          throw new Error('TOKEN_NOT_VALID');
        }
        if (token.is_used) {
          throw new Error('TOKEN_ALREADY_USED');
        }

        // Create the flowerResponse record with Sri Lanka timezone
        const response = await tx.flowerResponse.create({
          data: {
            id: crypto.randomUUID(), // Generate a random UUID for the response
            contest_type: 'flower',
            full_name: fullName,
            contact_number: contactNumber,
            secret_flower_name: secretFlowerName,
            token_id: token.id,
            submitted_at: submittedAt, // Use our timezone-adjusted timestamp
          },
          select: {
            id: true
          }
        });

        // Mark the token as used and link the response ID (optimized update)
        await tx.token.update({
          where: { id: token.id },
          data: {
            is_used: true,
            used_at: submittedAt, // Use the same timestamp for consistency
          },
          select: {
            id: true
          }
        });

        return { responseId: response.id, tokenId: token.id };
      });

      // Invalidate the token cache since the token status has changed
      try {
        tokenCache.delete(cacheKey);
        
        // Cache the new token status (used) to prevent duplicate submissions
        tokenCache.set(
          cacheKey, 
          { message: "This token has already been used.", valid: false }, 
          10 * 60000 // Cache for 10 minutes
        );
      } catch (cacheError) {
        console.error('Cache update error:', cacheError);
        // Continue even if cache fails
      }

      // Return Success Response with proper cache headers
      const successResponse = NextResponse.json(
        { message: "Submission successful!", responseId: result.responseId },
        { status: 200 }
      );
      return addCacheHeaders(successResponse);
    } catch (txError: unknown) {
      // Handle transaction errors
      console.error("Transaction Error:", txError);
      
      if (txError instanceof Error) {
        if (txError.message === 'INVALID_TOKEN') {
            return addCacheHeaders(NextResponse.json({ message: "Invalid token provided." }, { status: 400 }));
        }
        if (txError.message === 'TOKEN_NOT_VALID') {
            return addCacheHeaders(NextResponse.json({ message: "This token is not valid for the contest." }, { status: 400 }));
        }
        if (txError.message === 'TOKEN_ALREADY_USED') {
            return addCacheHeaders(NextResponse.json({ message: "This token has already been used." }, { status: 409 }));
        }
      }
      
      // Handle Prisma specific errors - use our defined interface instead of any
      const error = txError as PrismaError;
      if (error.code === 'P2002') {
          return addCacheHeaders(NextResponse.json({ message: "Error processing submission (duplicate)." }, { status: 409 }));
      }
      if (error.code === 'P2022') {
          return addCacheHeaders(NextResponse.json({ 
            message: "Database schema error - please contact support.",
            detail: error.meta?.modelName ? `Error in model: ${error.meta.modelName}` : undefined
          }, { status: 500 }));
      }
      
      throw txError; // Re-throw for general handler
    }
  } catch (error: unknown) {
    console.error("Submission Error:", error);
    
    // Generic Server Error
    return addCacheHeaders(NextResponse.json(
      { message: "An error occurred during submission." },
      { status: 500 }
    ));
  }
}