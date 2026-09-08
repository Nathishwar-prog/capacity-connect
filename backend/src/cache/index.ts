/**
 * Enterprise Cache Service Adapter
 * Capacity Connect — High Performance In-Memory / Redis Caching
 * 
 * Supports TTL expiration and prefix-based pattern invalidation.
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

class InMemoryCache {
  private store = new Map<string, CacheEntry<any>>();

  public async get<T>(key: string): Promise<T | null> {
    const entry = this.store.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }

    return entry.value as T;
  }

  public async set<T>(key: string, value: T, ttlSeconds: number = 300): Promise<void> {
    const expiresAt = Date.now() + ttlSeconds * 1000;
    this.store.set(key, { value, expiresAt });
  }

  public async del(key: string): Promise<void> {
    this.store.delete(key);
  }

  public async delPrefix(prefix: string): Promise<void> {
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) {
        this.store.delete(key);
      }
    }
  }

  public async clear(): Promise<void> {
    this.store.clear();
  }
}

const inMemoryInstance = new InMemoryCache();

export const cacheService = {
  get: async <T>(key: string): Promise<T | null> => {
    return inMemoryInstance.get<T>(key);
  },
  set: async <T>(key: string, value: T, ttlSeconds: number = 300): Promise<void> => {
    return inMemoryInstance.set<T>(key, value, ttlSeconds);
  },
  del: async (key: string): Promise<void> => {
    return inMemoryInstance.del(key);
  },
  delPrefix: async (prefix: string): Promise<void> => {
    return inMemoryInstance.delPrefix(prefix);
  },
  clear: async (): Promise<void> => {
    return inMemoryInstance.clear();
  },
};

export default cacheService;
