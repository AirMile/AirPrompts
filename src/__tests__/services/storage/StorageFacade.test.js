import StorageFacade from '@/services/storage/StorageFacade';

describe('StorageFacade', () => {
  let storage;

  beforeEach(() => {
    // Clear all storage
    localStorage.clear();
    sessionStorage.clear();
    
    // Create new instance for each test
    storage = new StorageFacade();
  });

  afterEach(() => {
    // Cleanup
    storage.destroy();
  });

  describe('Basic operations', () => {
    it('should set and get data', async () => {
      const testData = { name: 'Test', value: 123 };
      
      await storage.set('test_key', testData);
      const retrieved = await storage.get('test_key');
      
      expect(retrieved).toEqual(testData);
    });

    it('should return null for non-existent keys', async () => {
      const result = await storage.get('non_existent');
      expect(result).toBeNull();
    });

    it('should return default value when specified', async () => {
      const defaultValue = { default: true };
      const result = await storage.get('non_existent', { defaultValue });
      
      expect(result).toEqual(defaultValue);
    });

    it('should delete data', async () => {
      await storage.set('delete_test', { data: 'test' });
      await storage.delete('delete_test');
      
      const result = await storage.get('delete_test');
      expect(result).toBeNull();
    });

    it('should clear all data', async () => {
      await storage.set('key1', 'value1');
      await storage.set('key2', 'value2');
      
      await storage.clear();
      
      const result1 = await storage.get('key1');
      const result2 = await storage.get('key2');
      
      expect(result1).toBeNull();
      expect(result2).toBeNull();
    });
  });

  describe('Storage strategies', () => {
    it('should use session storage for temporary data', async () => {
      const tempData = { temp: true };
      await storage.set('temp_key', tempData, { temporary: true });
      
      // Should be in session storage
      const sessionData = JSON.parse(sessionStorage.getItem('airprompts_session_temp_key'));
      expect(sessionData).toEqual(tempData);
    });

    it('should use localStorage for small data', async () => {
      const smallData = { small: 'data' };
      await storage.set('small_key', smallData);
      
      // Should be in localStorage
      const localData = JSON.parse(localStorage.getItem('airprompts_small_key'));
      expect(localData).toEqual(smallData);
    });

    it('should handle large data appropriately', async () => {
      // Create large data (> 1MB)
      const largeArray = new Array(100000).fill('x'.repeat(20));
      const largeData = { data: largeArray };
      
      await storage.set('large_key', largeData);
      
      // Should still be retrievable
      const retrieved = await storage.get('large_key');
      expect(retrieved.data.length).toBe(100000);
    });
  });

  describe('Subscription system', () => {
    it('should notify subscribers on data change', async () => {
      const callback = jest.fn();
      const unsubscribe = storage.subscribe('sub_key', callback);
      
      await storage.set('sub_key', { value: 1 });
      
      expect(callback).toHaveBeenCalledWith({ value: 1 });
      
      unsubscribe();
    });

    it('should handle multiple subscribers', async () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      
      storage.subscribe('multi_key', callback1);
      storage.subscribe('multi_key', callback2);
      
      await storage.set('multi_key', 'test');
      
      expect(callback1).toHaveBeenCalledWith('test');
      expect(callback2).toHaveBeenCalledWith('test');
    });

    it('should unsubscribe correctly', async () => {
      const callback = jest.fn();
      const unsubscribe = storage.subscribe('unsub_key', callback);
      
      unsubscribe();
      
      await storage.set('unsub_key', 'test');
      
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('Error handling', () => {
    it('should handle storage quota exceeded', async () => {
      // Mock quota exceeded error
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = jest.fn(() => {
        throw new DOMException('QuotaExceededError');
      });
      
      await expect(
        storage.set('quota_test', { data: 'test' })
      ).rejects.toThrow();
      
      localStorage.setItem = originalSetItem;
    });

    it('should use fallback when primary storage fails', async () => {
      // Make localStorage unavailable
      const originalLocalStorage = global.localStorage;
      delete global.localStorage;
      
      const result = await storage.get('fallback_test', { 
        fallback: true,
        defaultValue: 'fallback' 
      });
      
      expect(result).toBe('fallback');
      
      global.localStorage = originalLocalStorage;
    });
  });

  describe('Metrics', () => {
    it('should track storage operations', async () => {
      await storage.set('metrics_key', 'value');
      await storage.get('metrics_key');
      await storage.get('non_existent');
      
      const metrics = storage.getMetrics();
      
      expect(metrics.sets).toBeGreaterThan(0);
      expect(metrics.hits.cache).toBeGreaterThan(0);
      expect(metrics.misses).toBeGreaterThan(0);
    });
  });

  describe('Storage info', () => {
    it('should provide storage size information', async () => {
      await storage.set('size_test', { data: 'test data' });
      
      const info = await storage.getStorageInfo();
      
      expect(info).toHaveProperty('localStorage');
      expect(info).toHaveProperty('sessionStorage');
      expect(info).toHaveProperty('indexedDB');
      expect(info).toHaveProperty('memoryCache');
      expect(info).toHaveProperty('total');
      expect(info.total).toBeGreaterThan(0);
    });
  });
});