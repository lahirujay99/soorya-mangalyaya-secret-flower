// app/api/validate-token/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { createRateLimitMiddleware } from '@/lib/rate-limit';
import { tokenCache } from '@/lib/cache';

// Simple validation schema for token
const tokenSchema = z.object({
  tokenCode: z.string().min(1, 'Token is required')
});

// Configure rate limiting - 15 requests per minute per IP
const rateLimitMiddleware = createRateLimitMiddleware({
  interval: 60 * 1000, // 1 minute
  limit: 15,           // 15 requests per interval
});

export async function POST(req: NextRequest) {
  try {
    // Apply rate limiting with safeguards
    try {
      const rateLimit = await rateLimitMiddleware(req);
      if (rateLimit) return rateLimit;
    } catch (rateLimitError) {
      console.error('Rate limit error:', rateLimitError);
      // Continue processing if rate limiting fails
    }
    
    // Parse request body with error handling
    let body;
    try {
      body = await req.json();
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      return NextResponse.json(
        { message: "Invalid request format", valid: false },
        { status: 400 }
      );
    }
    
    // Validate input data
    const validation = tokenSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { message: "Invalid input", valid: false },
        { status: 400 }
      );
    }
    
    const { tokenCode } = validation.data;
    
    // Create the cache key for this token validation
    const cacheKey = `token:${tokenCode}`;
    
    // Check cache first to reduce database load
    // Use try-catch to handle any cache-related errors
    let cachedToken = null;
    try {
      cachedToken = tokenCache.get(cacheKey);
      
      if (cachedToken) {
        console.log('Token validation cache hit:', tokenCode);
        return NextResponse.json(cachedToken);
      }
    } catch (cacheError) {
      console.error('Cache error:', cacheError);
      // Continue to database if cache fails
    }
    
    try {
      // Cache miss - check database
      console.log('Token validation cache miss:', tokenCode);
      
      // Check if token exists and is valid - optimize query with select statement
      const token = await prisma.token.findUnique({
        where: { token_code: tokenCode },
        select: {
          id: true,
          is_valid: true,
          is_used: true
        }
      });
      
      let response;
      
      // Token doesn't exist
      if (!token) {
        response = NextResponse.json(
          { message: "Invalid token provided.", valid: false },
          { status: 200 } // Using 200 status to handle in frontend
        );
        // Cache negative results for a short time (30 seconds)
        try {
          tokenCache.set(cacheKey, { message: "Invalid token provided.", valid: false }, 30000);
        } catch (e) {
          console.error('Error setting cache:', e);
        }
        return response;
      }
      
      // Token is used
      if (token.is_used) {
        response = NextResponse.json(
          { message: "This token has already been used.", valid: false },
          { status: 200 }
        );
        // Cache used tokens longer (5 minutes) as they won't change
        try {
          tokenCache.set(cacheKey, { message: "This token has already been used.", valid: false }, 5 * 60000);
        } catch (e) {
          console.error('Error setting cache:', e);
        }
        return response;
      }
      
      // Token is invalid
      if (!token.is_valid) {
        response = NextResponse.json(
          { message: "This token is not valid for the contest.", valid: false },
          { status: 200 }
        );
        // Cache invalid tokens longer (5 minutes)
        try {
          tokenCache.set(cacheKey, { message: "This token is not valid for the contest.", valid: false }, 5 * 60000);
        } catch (e) {
          console.error('Error setting cache:', e);
        }
        return response;
      }
      
      // Token is valid
      response = NextResponse.json(
        { message: "Token is valid", valid: true },
        { status: 200 }
      );
      
      // Cache valid tokens for a shorter time (1 minute) since they can change state
      try {
        tokenCache.set(cacheKey, { message: "Token is valid", valid: true }, 60000);
      } catch (e) {
        console.error('Error setting cache:', e);
      }
      return response;
      
    } catch (dbError) {
      console.error("Database error:", dbError);
      
      // Check if this is a Prisma initialization error
      if (dbError instanceof Error && dbError.message && dbError.message.includes("Prisma Client not initialized")) {
        return NextResponse.json(
          { message: "Database connection error. Please try again later.", valid: false },
          { status: 503 } // Service Unavailable
        );
      }
      
      return NextResponse.json(
        { message: "Database error occurred", valid: false },
        { status: 500 }
      );
    }
  } catch (error: unknown) {
    console.error("Token validation error:", error);
    return NextResponse.json(
      { message: "Error validating token", valid: false },
      { status: 500 }
    );
  }
}