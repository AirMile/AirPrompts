import { LocalStorageAdapter } from '../LocalStorageAdapter';

describe('LocalStorageAdapter', () => {
  let adapter;
  let mockLocalStorage;

  beforeEach(() => {
    // Mock localStorage
    mockLocalStorage = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn(),
      key: jest.fn(),
      length: 0
    };
    
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      writable: true
    });
    
    adapter = new LocalStorageAdapter();
  });

  describe('get', () => {
    test('should retrieve and parse JSON data', async () => {
      const key = 'test-key';
      const value = { data: 'test' };
      
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(value));
      
      const result = await adapter.get(key);
      
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith(key);
      expect(result).toEqual(value);
    });

    test('should return null for non-existent keys', async () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      
      const result = await adapter.get('missing-key');
      
      expect(result).toBeNull();
    });

    test('should handle invalid JSON gracefully', async () => {
      const key = 'bad-json';
      
      mockLocalStorage.getItem.mockReturnValue('invalid json{');
      
      const result = await adapter.get(key);
      
      expect(result).toBeNull();
    });

    test('should return raw strings if not JSON', async () => {
      const key = 'string-key';
      const value = 'simple string';
      
      mockLocalStorage.getItem.mockReturnValue(value);
      
      const result = await adapter.get(key);
      
      expect(result).toBe(value);
    });
  });

  describe('set', () => {
    test('should stringify and store JSON data', async () => {
      const key = 'test-key';
      const value = { data: 'test' };
      
      await adapter.set(key, value);
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(key, JSON.stringify(value));
    });

    test('should store strings directly', async () => {
      const key = 'string-key';
      const value = 'simple string';
      
      await adapter.set(key, value);
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(key, value);
    });

    test('should handle circular references', async () => {
      const key = 'circular-key';
      const value = { data: 'test' };
      value.self = value;
      
      await expect(adapter.set(key, value)).rejects.toThrow();
    });

    test('should handle quota exceeded errors', async () => {
      const key = 'large-key';
      const value = { data: 'x'.repeat(10000000) };
      
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });
      
      await expect(adapter.set(key, value)).rejects.toThrow('QuotaExceededError');
    });
  });

  describe('remove', () => {
    test('should remove item from storage', async () => {
      const key = 'test-key';
      
      await adapter.remove(key);
      
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(key);
    });

    test('should not throw if key does not exist', async () => {
      mockLocalStorage.removeItem.mockImplementation(() => {
        // Simulating no error for non-existent key
      });
      
      await expect(adapter.remove('non-existent')).resolves.not.toThrow();
    });
  });

  describe('clear', () => {
    test('should clear all items', async () => {
      await adapter.clear();
      
      expect(mockLocalStorage.clear).toHaveBeenCalled();
    });
  });

  describe('getAllKeys', () => {
    test('should return all storage keys', async () => {
      const keys = ['key1', 'key2', 'key3'];
      
      mockLocalStorage.length = keys.length;
      mockLocalStorage.key.mockImplementation(index => keys[index]);
      
      const result = await adapter.getAllKeys();
      
      expect(result).toEqual(keys);
    });

    test('should return empty array when storage is empty', async () => {
      mockLocalStorage.length = 0;
      
      const result = await adapter.getAllKeys();
      
      expect(result).toEqual([]);
    });
  });

  describe('isAvailable', () => {
    test('should return true when localStorage is available', () => {
      expect(adapter.isAvailable()).toBe(true);
    });

    test('should return false when localStorage is not available', () => {
      Object.defineProperty(window, 'localStorage', {
        get: () => {
          throw new Error('localStorage not available');
        }
      });
      
      const newAdapter = new LocalStorageAdapter();
      expect(newAdapter.isAvailable()).toBe(false);
    });

    test('should test write capability', () => {
      const testKey = '__localStorage_test__';
      
      const result = adapter.isAvailable();
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(testKey, 'test');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(testKey);
      expect(result).toBe(true);
    });

    test('should return false if write test fails', () => {
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('Cannot write');
      });
      
      const result = adapter.isAvailable();
      
      expect(result).toBe(false);
    });
  });

  describe('getSize', () => {
    test('should calculate storage size in bytes', async () => {
      const data = {
        key1: 'value1',
        key2: { nested: 'data' },
        key3: 'x'.repeat(1000)
      };
      
      mockLocalStorage.length = Object.keys(data).length;
      mockLocalStorage.key.mockImplementation(index => Object.keys(data)[index]);
      mockLocalStorage.getItem.mockImplementation(key => {
        const value = data[key];
        return typeof value === 'string' ? value : JSON.stringify(value);
      });
      
      const size = await adapter.getSize();
      
      expect(size).toBeGreaterThan(1000); // At least 1KB due to key3
    });
  });

  describe('error handling', () => {
    test('should handle localStorage being blocked', async () => {
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('Access denied');
      });
      
      const result = await adapter.get('test-key');
      
      expect(result).toBeNull();
    });

    test('should handle corrupted data', async () => {
      const key = 'corrupted-key';
      
      // Return partially corrupted JSON
      mockLocalStorage.getItem.mockReturnValue('{"data": "test"');
      
      const result = await adapter.get(key);
      
      expect(result).toBeNull();
    });
  });

  describe('performance', () => {
    test('should handle large datasets efficiently', async () => {
      const largeData = Array(1000).fill(null).map((_, i) => ({
        id: i,
        data: `Item ${i}`,
        timestamp: Date.now()
      }));
      
      const startTime = Date.now();
      await adapter.set('large-dataset', largeData);
      const setTime = Date.now() - startTime;
      
      expect(setTime).toBeLessThan(100); // Should complete within 100ms
      expect(mockLocalStorage.setItem).toHaveBeenCalledTimes(1);
    });
  });
});