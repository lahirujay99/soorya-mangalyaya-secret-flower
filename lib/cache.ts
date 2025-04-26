// lib/cache.ts
// Simple in-memory cache implementation for frequent data lookups
// In a production environment with multiple instances, consider using Redis instead

interface CacheEntry<T> {
  value: T;
  expiry: number; // Timestamp when this entry expires
}

class SimpleCache {
  private cache: Map<string, CacheEntry<any>>;
  private maxSize: number;

  constructor(maxSize = 1000) {
    this.cache = new Map();
    this.maxSize = maxSize;
    
    // Periodically clean expired items to prevent memory leaks
    setInterval(() => this.cleanup(), 60000); // Cleanup every minute
  }

  /**
   * Get a value from the cache
   * @param key The cache key
   * @returns The cached value or undefined if not found
   */
  get<T>(key: string): T | undefined {
    const entry = this.cache.get(key);
    
    // If entry doesn't exist or has expired
    if (!entry || entry.expiry < Date.now()) {
      if (entry) this.cache.delete(key);
      return undefined;
    }
    
    return entry.value as T;
  }

  /**
   * Store a value in the cache
   * @param key The cache key
   * @param value The value to store
   * @param ttlMs Time-to-live in milliseconds (default 1 minute)
   */
  set<T>(key: string, value: T, ttlMs = 60000): void {
    // If cache is at max size, remove oldest entries
    if (this.cache.size >= this.maxSize) {
      const entriesToDelete = Math.ceil(this.maxSize * 0.1); // Remove 10% of oldest entries
      const keys = Array.from(this.cache.keys());
      for (let i = 0; i < entriesToDelete && i < keys.length; i++) {
        this.cache.delete(keys[i]);
      }
    }
    
    this.cache.set(key, {
      value,
      expiry: Date.now() + ttlMs
    });
  }

  /**
   * Remove an item from the cache
   * @param key The cache key to remove
   */
  delete(key: string): void {
    this.cache.delete(key);
  }
  
  /**
   * Clear all items from the cache
   */
  clear(): void {
    this.cache.clear();
  }
  
  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiry < now) {
        this.cache.delete(key);
      }
    }
  }
  
  /**
   * Get cache size
   */
  get size(): number {
    return this.cache.size;
  }
}

// Create and export a singleton instance
export const tokenCache = new SimpleCache();
export default tokenCache;