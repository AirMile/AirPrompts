import { StorageService } from '../StorageService';
import { LocalStorageAdapter } from '../LocalStorageAdapter';
import { SessionStorageAdapter } from '../SessionStorageAdapter';
import { IndexedDBAdapter } from '../IndexedDBAdapter';
import { MemoryCache } from '../MemoryCache';

// Mock the adapters
jest.mock('../LocalStorageAdapter');
jest.mock('../SessionStorageAdapter');
jest.mock('../IndexedDBAdapter');
jest.mock('../MemoryCache');

describe('StorageService', () => {
  let storageService;
  let mockLocalStorage;
  let mockSessionStorage;
  let mockIndexedDB;
  let mockMemoryCache;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Create mock instances
    mockLocalStorage = {
      get: jest.fn(),
      set: jest.fn(),
      remove: jest.fn(),
      clear: jest.fn(),
      getAllKeys: jest.fn(),
      isAvailable: jest.fn().mockReturnValue(true)
    };
    
    mockSessionStorage = {
      get: jest.fn(),
      set: jest.fn(),
      remove: jest.fn(),
      clear: jest.fn(),
      getAllKeys: jest.fn(),
      isAvailable: jest.fn().mockReturnValue(true)
    };
    
    mockIndexedDB = {
      get: jest.fn(),
      set: jest.fn(),
      remove: jest.fn(),
      clear: jest.fn(),
      getAllKeys: jest.fn(),
      isAvailable: jest.fn().mockResolvedValue(true)
    };
    
    mockMemoryCache = {
      get: jest.fn(),
      set: jest.fn(),
      remove: jest.fn(),
      clear: jest.fn(),
      has: jest.fn()
    };
    
    // Mock constructors
    LocalStorageAdapter.mockImplementation(() => mockLocalStorage);
    SessionStorageAdapter.mockImplementation(() => mockSessionStorage);
    IndexedDBAdapter.mockImplementation(() => mockIndexedDB);
    MemoryCache.mockImplementation(() => mockMemoryCache);
    
    storageService = new StorageService();
  });

  describe('initialization', () => {
    test('should create all storage adapters', () => {
      expect(LocalStorageAdapter).toHaveBeenCalled();
      expect(SessionStorageAdapter).toHaveBeenCalled();
      expect(IndexedDBAdapter).toHaveBeenCalled();
      expect(MemoryCache).toHaveBeenCalled();
    });
  });

  describe('get', () => {
    test('should check memory cache first', async () => {
      const key = 'test-key';
      const cachedValue = { data: 'cached' };
      
      mockMemoryCache.has.mockReturnValue(true);
      mockMemoryCache.get.mockReturnValue(cachedValue);
      
      const result = await storageService.get(key);
      
      expect(mockMemoryCache.has).toHaveBeenCalledWith(key);
      expect(mockMemoryCache.get).toHaveBeenCalledWith(key);
      expect(result).toBe(cachedValue);
      
      // Should not check other storages
      expect(mockLocalStorage.get).not.toHaveBeenCalled();
    });

    test('should fallback to localStorage if not in cache', async () => {
      const key = 'test-key';
      const storedValue = { data: 'stored' };
      
      mockMemoryCache.has.mockReturnValue(false);
      mockLocalStorage.get.mockResolvedValue(storedValue);
      
      const result = await storageService.get(key);
      
      expect(mockLocalStorage.get).toHaveBeenCalledWith(key);
      expect(mockMemoryCache.set).toHaveBeenCalledWith(key, storedValue);
      expect(result).toBe(storedValue);
    });

    test('should use custom storage type', async () => {
      const key = 'test-key';
      const value = { data: 'session' };
      
      mockSessionStorage.get.mockResolvedValue(value);
      
      const result = await storageService.get(key, { storage: 'session' });
      
      expect(mockSessionStorage.get).toHaveBeenCalledWith(key);
      expect(result).toBe(value);
    });

    test('should use IndexedDB for large data', async () => {
      const key = 'large-data';
      const largeValue = { data: 'x'.repeat(10000) };
      
      mockIndexedDB.get.mockResolvedValue(largeValue);
      
      const result = await storageService.get(key, { storage: 'indexed' });
      
      expect(mockIndexedDB.get).toHaveBeenCalledWith(key);
      expect(result).toBe(largeValue);
    });

    test('should return default value if key not found', async () => {
      const key = 'missing-key';
      const defaultValue = { default: true };
      
      mockMemoryCache.has.mockReturnValue(false);
      mockLocalStorage.get.mockResolvedValue(null);
      
      const result = await storageService.get(key, { defaultValue });
      
      expect(result).toBe(defaultValue);
    });
  });

  describe('set', () => {
    test('should store in both cache and persistent storage', async () => {
      const key = 'test-key';
      const value = { data: 'test' };
      
      await storageService.set(key, value);
      
      expect(mockMemoryCache.set).toHaveBeenCalledWith(key, value);
      expect(mockLocalStorage.set).toHaveBeenCalledWith(key, value);
    });

    test('should use specified storage type', async () => {
      const key = 'test-key';
      const value = { data: 'test' };
      
      await storageService.set(key, value, { storage: 'session' });
      
      expect(mockMemoryCache.set).toHaveBeenCalledWith(key, value);
      expect(mockSessionStorage.set).toHaveBeenCalledWith(key, value);
      expect(mockLocalStorage.set).not.toHaveBeenCalled();
    });

    test('should handle storage quota exceeded', async () => {
      const key = 'test-key';
      const value = { data: 'test' };
      
      mockLocalStorage.set.mockRejectedValue(new Error('QuotaExceededError'));
      
      await expect(storageService.set(key, value)).rejects.toThrow('QuotaExceededError');
    });

    test('should validate data before storing', async () => {
      const key = 'test-key';
      const circularRef = {};
      circularRef.self = circularRef;
      
      await expect(storageService.set(key, circularRef)).rejects.toThrow();
    });
  });

  describe('remove', () => {
    test('should remove from all storages', async () => {
      const key = 'test-key';
      
      await storageService.remove(key);
      
      expect(mockMemoryCache.remove).toHaveBeenCalledWith(key);
      expect(mockLocalStorage.remove).toHaveBeenCalledWith(key);
    });

    test('should handle specific storage type', async () => {
      const key = 'test-key';
      
      await storageService.remove(key, { storage: 'session' });
      
      expect(mockMemoryCache.remove).toHaveBeenCalledWith(key);
      expect(mockSessionStorage.remove).toHaveBeenCalledWith(key);
      expect(mockLocalStorage.remove).not.toHaveBeenCalled();
    });
  });

  describe('clear', () => {
    test('should clear all storages by default', async () => {
      await storageService.clear();
      
      expect(mockMemoryCache.clear).toHaveBeenCalled();
      expect(mockLocalStorage.clear).toHaveBeenCalled();
      expect(mockSessionStorage.clear).toHaveBeenCalled();
      expect(mockIndexedDB.clear).toHaveBeenCalled();
    });

    test('should clear specific storage type', async () => {
      await storageService.clear({ storage: 'local' });
      
      expect(mockLocalStorage.clear).toHaveBeenCalled();
      expect(mockSessionStorage.clear).not.toHaveBeenCalled();
      expect(mockIndexedDB.clear).not.toHaveBeenCalled();
    });

    test('should clear by prefix', async () => {
      const prefix = 'temp-';
      const keys = ['temp-1', 'temp-2', 'other-1'];
      
      mockLocalStorage.getAllKeys.mockResolvedValue(keys);
      
      await storageService.clear({ prefix });
      
      expect(mockLocalStorage.remove).toHaveBeenCalledWith('temp-1');
      expect(mockLocalStorage.remove).toHaveBeenCalledWith('temp-2');
      expect(mockLocalStorage.remove).not.toHaveBeenCalledWith('other-1');
    });
  });

  describe('batch operations', () => {
    test('should get multiple keys at once', async () => {
      const keys = ['key1', 'key2', 'key3'];
      const values = { key1: 'value1', key2: 'value2', key3: 'value3' };
      
      mockLocalStorage.get.mockImplementation(key => Promise.resolve(values[key]));
      
      const result = await storageService.getMultiple(keys);
      
      expect(result).toEqual(values);
      expect(mockLocalStorage.get).toHaveBeenCalledTimes(3);
    });

    test('should set multiple key-value pairs', async () => {
      const items = {
        key1: 'value1',
        key2: 'value2',
        key3: 'value3'
      };
      
      await storageService.setMultiple(items);
      
      expect(mockLocalStorage.set).toHaveBeenCalledTimes(3);
      expect(mockLocalStorage.set).toHaveBeenCalledWith('key1', 'value1');
      expect(mockLocalStorage.set).toHaveBeenCalledWith('key2', 'value2');
      expect(mockLocalStorage.set).toHaveBeenCalledWith('key3', 'value3');
    });
  });

  describe('storage availability', () => {
    test('should check if storage is available', async () => {
      mockLocalStorage.isAvailable.mockReturnValue(true);
      mockIndexedDB.isAvailable.mockResolvedValue(true);
      
      const localAvailable = await storageService.isAvailable('local');
      const indexedAvailable = await storageService.isAvailable('indexed');
      
      expect(localAvailable).toBe(true);
      expect(indexedAvailable).toBe(true);
    });

    test('should fallback when primary storage is unavailable', async () => {
      const key = 'test-key';
      const value = { data: 'test' };
      
      mockLocalStorage.isAvailable.mockReturnValue(false);
      mockSessionStorage.isAvailable.mockReturnValue(true);
      
      await storageService.set(key, value);
      
      expect(mockSessionStorage.set).toHaveBeenCalledWith(key, value);
      expect(mockLocalStorage.set).not.toHaveBeenCalled();
    });
  });

  describe('data expiration', () => {
    test('should store with expiration time', async () => {
      const key = 'expiring-key';
      const value = { data: 'test' };
      const ttl = 3600; // 1 hour
      
      await storageService.set(key, value, { ttl });
      
      const storedCall = mockLocalStorage.set.mock.calls[0];
      expect(storedCall[0]).toBe(key);
      expect(storedCall[1]).toHaveProperty('value', value);
      expect(storedCall[1]).toHaveProperty('expiresAt');
    });

    test('should return null for expired data', async () => {
      const key = 'expired-key';
      const expiredData = {
        value: { data: 'test' },
        expiresAt: Date.now() - 1000 // Expired 1 second ago
      };
      
      mockMemoryCache.has.mockReturnValue(false);
      mockLocalStorage.get.mockResolvedValue(expiredData);
      
      const result = await storageService.get(key);
      
      expect(result).toBeNull();
      expect(mockLocalStorage.remove).toHaveBeenCalledWith(key);
    });
  });

  describe('error handling', () => {
    test('should handle storage errors gracefully', async () => {
      const key = 'test-key';
      const error = new Error('Storage error');
      
      mockLocalStorage.get.mockRejectedValue(error);
      mockSessionStorage.get.mockRejectedValue(error);
      
      const result = await storageService.get(key);
      
      expect(result).toBeNull();
    });

    test('should emit error events', async () => {
      const key = 'test-key';
      const error = new Error('Storage error');
      const errorHandler = jest.fn();
      
      storageService.on('error', errorHandler);
      mockLocalStorage.set.mockRejectedValue(error);
      
      await expect(storageService.set(key, 'value')).rejects.toThrow();
      
      expect(errorHandler).toHaveBeenCalledWith({
        operation: 'set',
        key,
        error
      });
    });
  });

  describe('storage migration', () => {
    test('should migrate data between storage types', async () => {
      const key = 'migrate-key';
      const value = { data: 'migrate' };
      
      mockLocalStorage.get.mockResolvedValue(value);
      
      await storageService.migrate(key, 'local', 'indexed');
      
      expect(mockLocalStorage.get).toHaveBeenCalledWith(key);
      expect(mockIndexedDB.set).toHaveBeenCalledWith(key, value);
      expect(mockLocalStorage.remove).toHaveBeenCalledWith(key);
    });

    test('should handle migration failures', async () => {
      const key = 'migrate-key';
      const value = { data: 'migrate' };
      
      mockLocalStorage.get.mockResolvedValue(value);
      mockIndexedDB.set.mockRejectedValue(new Error('Migration failed'));
      
      await expect(storageService.migrate(key, 'local', 'indexed')).rejects.toThrow('Migration failed');
      
      // Should not remove from source on failure
      expect(mockLocalStorage.remove).not.toHaveBeenCalled();
    });
  });
});