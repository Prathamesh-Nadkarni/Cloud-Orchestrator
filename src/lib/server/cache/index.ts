// Cache Abstraction Layer
// Currently mapping to a robust in-memory Map for local dev.
// Structured to be easily swapped for a Redis client (e.g. ioredis) in production.

const cacheStore = new Map<string, { value: any; expiresAt: number }>();

export class CacheService {
    /**
     * Sets a value in the cache with a Time-To-Live (TTL) in seconds.
     */
    static async set(key: string, value: any, ttlSeconds: number = 3600): Promise<void> {
        const expiresAt = Date.now() + ttlSeconds * 1000;
        cacheStore.set(key, { value, expiresAt });
    }

    /**
     * Retrieves a value from the cache. Returns null if missing or expired.
     */
    static async get<T>(key: string): Promise<T | null> {
        const entry = cacheStore.get(key);
        if (!entry) return null;

        if (Date.now() > entry.expiresAt) {
            cacheStore.delete(key);
            return null;
        }

        return entry.value as T;
    }

    /**
     * Deletes a value from the cache.
     */
    static async delete(key: string): Promise<void> {
        cacheStore.delete(key);
    }
}
