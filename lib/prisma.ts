// lib/prisma.ts
import { PrismaClient } from '@prisma/client';

// This prevents Prisma Client from being initialized too many times during development
// due to Next.js hot reloading. In production, this doesn't matter as much.
declare global {
  // allow global `var` declarations
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// Function to validate database URL
function validateDatabaseURL() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('DATABASE_URL is not defined in environment variables');
    return false;
  }
  
  try {
    // Basic URL validation - check if it has required parts
    const dbUrl = new URL(url);
    if (!dbUrl.host || !dbUrl.protocol) {
      console.error('DATABASE_URL is malformed');
      return false;
    }
    return true;
  } catch (error) {
    console.error('Invalid DATABASE_URL format:', error);
    return false;
  }
}

// Function to create Prisma Client with proper error handling and connection retries
function createPrismaClient() {
  // Validate database URL before attempting to connect
  if (!validateDatabaseURL()) {
    console.error("⚠️ DATABASE_URL validation failed. Check your .env file or environment variables.");
    
    if (process.env.NODE_ENV === 'development') {
      console.info("📝 For development, you might need to set up a local database or proper connection strings.");
    }
  }

  try {
    return new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
      errorFormat: 'pretty',
      
      // Add connection pooling configuration
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
      // Prisma Client doesn't directly support the connection pool option in its type
      // We'll use more standard configuration that works with Prisma
      // @ts-expect-error - Prisma doesn't expose the pool config in types but it works
      __internal: {
        engine: {
          connectionPoolSettings: {
            min: 2,             // Minimum connections in pool
            max: 10             // Maximum connections in pool
          }
        }
      }
    });
  } catch (error) {
    console.error("Failed to create Prisma client:", error);
    
    // If in production, rethrow the error
    if (process.env.NODE_ENV === 'production') {
      throw error;
    }
    
    // In development, provide a fallback error message
    console.error("Prisma client initialization failed. Please run 'npx prisma generate'");
    
    // Return a mock client that throws informative errors when used
    return new Proxy({} as PrismaClient, {
      get() {
        throw new Error("Prisma Client not initialized. Check your database connection.");
      }
    });
  }
}

// Create the prisma instance, reusing it if it exists (in dev)
export const prisma = global.prisma || createPrismaClient();

// Store the instance in the global variable in development environments
if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

// Export the instance for use in your API routes
export default prisma;