import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CacheService } from './index';

describe('CacheService', () => {
    beforeEach(async () => {
        // Empty the cache if we could, but let's just clear specific keys inside tests.
    });

    it('should set and get a value correctly', async () => {
        await CacheService.set('test_key', { foo: 'bar' }, 10);
        const val = await CacheService.get<{ foo: string }>('test_key');
        expect(val).toEqual({ foo: 'bar' });
    });

    it('should return null for expired keys', async () => {
        // Set a cache with -1 TTL so it's instantly expired
        await CacheService.set('expired_key', 'stale', -1);
        const val = await CacheService.get('expired_key');
        expect(val).toBeNull();
    });

    it('should delete a key correctly', async () => {
        await CacheService.set('del_key', 'value', 10);
        await CacheService.delete('del_key');
        const val = await CacheService.get('del_key');
        expect(val).toBeNull();
    });
});
