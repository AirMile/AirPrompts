import { MemoryCache } from '../MemoryCache';

describe('MemoryCache', () => {
  let cache;

  beforeEach(() => {
    cache = new MemoryCache({ maxSize: 100, ttl: 3600 });
  });

  describe('basic operations', () => {
    test('should set and get values', () => {
      const key = 'test-key';
      const value = { data: 'test' };
      
      cache.set(key, value);
      const result = cache.get(key);
      
      expect(result).toEqual(value);
    });

    test('should return undefined for non-existent keys', () => {
      const result = cache.get('missing-key');
      
      expect(result).toBeUndefined();
    });

    test('should check if key exists', () => {
      const key = 'test-key';
      
      expect(cache.has(key)).toBe(false);
      
      cache.set(key, 'value');
      
      expect(cache.has(key)).toBe(true);
    });

    test('should remove values', () => {
      const key = 'test-key';
      const value = 'test-value';
      
      cache.set(key, value);
      expect(cache.has(key)).toBe(true);
      
      cache.remove(key);
      expect(cache.has(key)).toBe(false);
      expect(cache.get(key)).toBeUndefined();
    });

    test('should clear all values', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');
      
      expect(cache.size()).toBe(3);
      
      cache.clear();
      
      expect(cache.size()).toBe(0);
      expect(cache.has('key1')).toBe(false);
      expect(cache.has('key2')).toBe(false);
      expect(cache.has('key3')).toBe(false);
    });
  });

  describe('TTL (Time To Live)', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    test('should expire values after TTL', () => {
      const key = 'expiring-key';
      const value = 'expiring-value';
      const ttl = 1000; // 1 second
      
      cache.set(key, value, ttl);
      
      expect(cache.get(key)).toBe(value);
      
      // Advance time past TTL
      jest.advanceTimersByTime(1001);
      
      expect(cache.get(key)).toBeUndefined();
      expect(cache.has(key)).toBe(false);
    });

    test('should use default TTL when not specified', () => {
      const key = 'default-ttl-key';
      const value = 'value';
      
      cache.set(key, value);
      
      expect(cache.get(key)).toBe(value);
      
      // Advance time past default TTL (3600 seconds)
      jest.advanceTimersByTime(3601 * 1000);
      
      expect(cache.get(key)).toBeUndefined();
    });

    test('should handle Infinity TTL', () => {
      const key = 'eternal-key';
      const value = 'eternal-value';
      
      cache.set(key, value, Infinity);
      
      // Advance time significantly
      jest.advanceTimersByTime(Number.MAX_SAFE_INTEGER);
      
      expect(cache.get(key)).toBe(value);
    });
  });

  describe('LRU (Least Recently Used) eviction', () => {
    test('should evict least recently used items when max size reached', () => {
      const smallCache = new MemoryCache({ maxSize: 3 });
      
      smallCache.set('key1', 'value1');
      smallCache.set('key2', 'value2');
      smallCache.set('key3', 'value3');
      
      expect(smallCache.size()).toBe(3);
      
      // Add a fourth item, should evict key1
      smallCache.set('key4', 'value4');
      
      expect(smallCache.size()).toBe(3);
      expect(smallCache.has('key1')).toBe(false);
      expect(smallCache.has('key2')).toBe(true);
      expect(smallCache.has('key3')).toBe(true);
      expect(smallCache.has('key4')).toBe(true);
    });

    test('should update LRU order on get', () => {
      const smallCache = new MemoryCache({ maxSize: 3 });
      
      smallCache.set('key1', 'value1');
      smallCache.set('key2', 'value2');
      smallCache.set('key3', 'value3');
      
      // Access key1, making it most recently used
      smallCache.get('key1');
      
      // Add key4, should evict key2 (now least recently used)
      smallCache.set('key4', 'value4');
      
      expect(smallCache.has('key1')).toBe(true);
      expect(smallCache.has('key2')).toBe(false);
      expect(smallCache.has('key3')).toBe(true);
      expect(smallCache.has('key4')).toBe(true);
    });

    test('should update LRU order on set (update existing)', () => {
      const smallCache = new MemoryCache({ maxSize: 3 });
      
      smallCache.set('key1', 'value1');
      smallCache.set('key2', 'value2');
      smallCache.set('key3', 'value3');
      
      // Update key1, making it most recently used
      smallCache.set('key1', 'updated-value1');
      
      // Add key4, should evict key2
      smallCache.set('key4', 'value4');
      
      expect(smallCache.get('key1')).toBe('updated-value1');
      expect(smallCache.has('key2')).toBe(false);
    });
  });

  describe('statistics and monitoring', () => {
    test('should track hit and miss rates', () => {
      cache.set('key1', 'value1');
      
      // Hits
      cache.get('key1');
      cache.get('key1');
      
      // Misses
      cache.get('key2');
      cache.get('key3');
      cache.get('key4');
      
      const stats = cache.getStats();
      
      expect(stats.hits).toBe(2);
      expect(stats.misses).toBe(3);
      expect(stats.hitRate).toBeCloseTo(0.4); // 2/5
    });

    test('should track evictions', () => {
      const smallCache = new MemoryCache({ maxSize: 2 });
      
      smallCache.set('key1', 'value1');
      smallCache.set('key2', 'value2');
      smallCache.set('key3', 'value3'); // Evicts key1
      smallCache.set('key4', 'value4'); // Evicts key2
      
      const stats = smallCache.getStats();
      
      expect(stats.evictions).toBe(2);
    });

    test('should reset statistics', () => {
      cache.set('key1', 'value1');
      cache.get('key1');
      cache.get('missing');
      
      let stats = cache.getStats();
      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(1);
      
      cache.resetStats();
      
      stats = cache.getStats();
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(0);
      expect(stats.evictions).toBe(0);
    });
  });

  describe('memory management', () => {
    test('should estimate memory usage', () => {
      const data = {
        small: 'small value',
        medium: 'x'.repeat(100),
        large: 'y'.repeat(1000),
        object: { nested: { data: 'test' } }
      };
      
      Object.entries(data).forEach(([key, value]) => {
        cache.set(key, value);
      });
      
      const memoryUsage = cache.getMemoryUsage();
      
      expect(memoryUsage).toBeGreaterThan(1000); // At least 1KB
      expect(memoryUsage).toBeLessThan(10000); // Less than 10KB
    });

    test('should enforce memory limits', () => {
      // Create cache with 1KB limit
      const limitedCache = new MemoryCache({ maxMemory: 1024 });
      
      // Try to add data exceeding limit
      const largeData = 'x'.repeat(500);
      
      limitedCache.set('key1', largeData);
      limitedCache.set('key2', largeData);
      limitedCache.set('key3', largeData); // Should trigger eviction
      
      // Should have evicted some items to stay under limit
      expect(limitedCache.getMemoryUsage()).toBeLessThanOrEqual(1024);
    });
  });

  describe('advanced features', () => {
    test('should support custom key serialization', () => {
      const objectKey = { type: 'user', id: 123 };
      const value = 'user-data';
      
      cache.set(objectKey, value);
      
      // Should be able to retrieve with equivalent object
      const equivalentKey = { type: 'user', id: 123 };
      expect(cache.get(equivalentKey)).toBe(value);
    });

    test('should handle concurrent operations', () => {
      const operations = [];
      
      // Simulate concurrent sets
      for (let i = 0; i < 100; i++) {
        operations.push(Promise.resolve(cache.set(`key${i}`, `value${i}`)));
      }
      
      // Simulate concurrent gets
      for (let i = 0; i < 100; i++) {
        operations.push(Promise.resolve(cache.get(`key${i}`)));
      }
      
      return Promise.all(operations).then(() => {
        expect(cache.size()).toBeLessThanOrEqual(100); // Respects max size
      });
    });

    test('should provide cache warming', () => {
      const initialData = {
        key1: 'value1',
        key2: 'value2',
        key3: { nested: 'object' }
      };
      
      cache.warm(initialData);
      
      expect(cache.get('key1')).toBe('value1');
      expect(cache.get('key2')).toBe('value2');
      expect(cache.get('key3')).toEqual({ nested: 'object' });
    });

    test('should support cache serialization', () => {
      cache.set('key1', 'value1');
      cache.set('key2', { data: 'test' });
      
      const serialized = cache.serialize();
      
      const newCache = new MemoryCache({ maxSize: 100 });
      newCache.deserialize(serialized);
      
      expect(newCache.get('key1')).toBe('value1');
      expect(newCache.get('key2')).toEqual({ data: 'test' });
    });
  });

  describe('event handling', () => {
    test('should emit events on cache operations', () => {
      const events = {
        set: jest.fn(),
        get: jest.fn(),
        delete: jest.fn(),
        evict: jest.fn(),
        clear: jest.fn()
      };
      
      // Subscribe to events
      Object.entries(events).forEach(([event, handler]) => {
        cache.on(event, handler);
      });
      
      // Perform operations
      cache.set('key1', 'value1');
      cache.get('key1');
      cache.remove('key1');
      
      // Force eviction
      const smallCache = new MemoryCache({ maxSize: 1 });
      smallCache.on('evict', events.evict);
      smallCache.set('key1', 'value1');
      smallCache.set('key2', 'value2'); // Evicts key1
      
      cache.clear();
      
      // Verify events
      expect(events.set).toHaveBeenCalledWith({ key: 'key1', value: 'value1' });
      expect(events.get).toHaveBeenCalledWith({ key: 'key1', value: 'value1' });
      expect(events.delete).toHaveBeenCalledWith({ key: 'key1' });
      expect(events.evict).toHaveBeenCalledWith({ key: 'key1', reason: 'size' });
      expect(events.clear).toHaveBeenCalled();
    });
  });
});