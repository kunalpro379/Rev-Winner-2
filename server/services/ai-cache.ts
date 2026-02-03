// Ultra-fast in-memory cache for AI responses (30 second TTL)
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class AIResponseCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private readonly DEFAULT_TTL = 30000; // 30 seconds

  set<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
    
    console.log(` Cache SET: ${key.substring(0, 50)}...`);
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      console.log(`❌ Cache MISS: ${key.substring(0, 50)}...`);
      return null;
    }

    const age = Date.now() - entry.timestamp;
    
    if (age > entry.ttl) {
      this.cache.delete(key);
      console.log(`⏰ Cache EXPIRED (${age}ms): ${key.substring(0, 50)}...`);
      return null;
    }

    console.log(`Cache HIT (${age}ms old): ${key.substring(0, 50)}...`);
    return entry.data as T;
  }

  invalidate(pattern: string): number {
    let count = 0;
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
        count++;
      }
    }
    
    if (count > 0) {
      console.log(`🗑️  Cache INVALIDATED: ${count} keys matching "${pattern}"`);
    }
    
    return count;
  }

  clear(): void {
    this.cache.clear();
    console.log(`🧹 Cache CLEARED`);
  }

  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()).map(k => k.substring(0, 50)),
    };
  }
}

export const aiCache = new AIResponseCache();
