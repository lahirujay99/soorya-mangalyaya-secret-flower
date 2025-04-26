// lib/rate-limit.ts
// A simple in-memory rate limiter for API routes
// For production with multiple instances, consider using Redis instead

interface RateLimiterOptions {
  interval: number; // Time window in milliseconds
  limit: number; // Maximum requests per window
  uniqueTokenPerInterval?: number; // Maximum number of unique users/tokens to track
}

interface RateLimiterResponse {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number; // Timestamp when the current window expires
}

// Storage for rate limiting - in a production multi-instance environment, use Redis instead
const tokenCache = new Map<string, { count: number; resetTime: number }>();

/**
 * Rate limiter utility for API routes
 */
export function rateLimit(options: RateLimiterOptions) {
  const { interval, limit, uniqueTokenPerInterval = 500 } = options;
  
  // Periodically clean up the token cache to prevent memory leaks
  setInterval(() => {
    const now = Date.now();
    for (const [key, value] of tokenCache.entries()) {
      if (value.resetTime < now) {
        tokenCache.delete(key);
      }
    }
  }, interval);

  return {
    /**
     * Check if the request should be rate limited
     * @param identifier The unique identifier for the request (e.g., IP or user ID)
     * @returns A response object indicating if the request is allowed
     */
    check: async (identifier: string): Promise<RateLimiterResponse> => {
      const now = Date.now();
      const key = `${identifier}`;
      
      // Clean up the cache if it gets too large
      if (tokenCache.size > uniqueTokenPerInterval) {
        // Remove random entries if we exceed the limit
        let count = 0;
        for (const key of tokenCache.keys()) {
          if (count > uniqueTokenPerInterval / 4) break;
          tokenCache.delete(key);
          count++;
        }
      }
      
      const tokenData = tokenCache.get(key) || {
        count: 0,
        resetTime: now + interval
      };
      
      // Check if window has expired and reset if needed
      if (tokenData.resetTime < now) {
        tokenData.count = 0;
        tokenData.resetTime = now + interval;
      }
      
      // Check if limit is exceeded
      const remaining = Math.max(0, limit - tokenData.count);
      const success = tokenData.count < limit;
      
      if (success) {
        // Increment counter only if we're under the limit
        tokenData.count++;
        tokenCache.set(key, tokenData);
      }
      
      return {
        success,
        limit,
        remaining,
        reset: tokenData.resetTime
      };
    }
  };
}

/**
 * Create a middleware function for applying rate limiting to Next.js API routes
 */
export function createRateLimitMiddleware(options: RateLimiterOptions) {
  const limiter = rateLimit(options);
  
  return async function rateLimitMiddleware(req: Request) {
    const ip = req.headers.get('x-forwarded-for') || 
               req.headers.get('x-real-ip') || 
               'unknown-ip';
    
    const result = await limiter.check(ip);
    
    if (!result.success) {
      return new Response(
        JSON.stringify({ 
          error: 'Too Many Requests', 
          message: 'Rate limit exceeded. Please try again later.' 
        }),
        { 
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': result.limit.toString(),
            'X-RateLimit-Remaining': result.remaining.toString(),
            'X-RateLimit-Reset': result.reset.toString(),
            'Retry-After': Math.ceil((result.reset - Date.now()) / 1000).toString()
          }
        }
      );
    }
    
    return null; // Continue processing the request
  };
}