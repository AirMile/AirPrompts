import LocalStorageAdapter from './LocalStorageAdapter';
import SessionStorageAdapter from './SessionStorageAdapter';
import IndexedDBAdapter from './IndexedDBAdapter';
import MemoryCache from './MemoryCache';

/**
 * Storage Facade - Unified interface for all storage operations
 *
 * Features:
 * - Multiple storage backends (localStorage, sessionStorage, IndexedDB, memory)
 * - Automatic fallbacks and strategy selection
 * - Cross-tab synchronization
 * - Subscribe/unsubscribe pattern for reactive updates
 * - Performance metrics and monitoring
 */
class StorageFacade {
  constructor() {
    // Initialize different storage backends
    this.localStorage = new LocalStorageAdapter();
    this.indexedDB = new IndexedDBAdapter();
    this.memoryCache = new MemoryCache();
    this.sessionStorage = new SessionStorageAdapter();

    // Listeners for storage events
    this.listeners = new Map();

    // Metrics tracking
    this.metrics = {
      hits: { cache: 0, localStorage: 0, indexedDB: 0 },
      misses: 0,
      errors: 0,
      sets: 0,
    };

    // Configuration
    this.maxLocalStorageSize = 50 * 1024; // 50KB
    this.maxSize = 10 * 1024 * 1024; // 10MB

    // Initialize on creation
    this.initialized = false;
    this.initPromise = this.initialize();
  }

  async initialize() {
    if (this.initialized) return;

    try {
      // Initialize IndexedDB
      await this.indexedDB.initialize();

      // Start memory cache cleanup interval
      this.memoryCache.startCleanupInterval();

      // Setup cross-tab synchronization
      this.setupStorageSync();

      // Warm up cache with frequently accessed data
      await this.warmUpCache();

      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize StorageFacade:', error);
    }
  }

  async ensureInitialized() {
    if (!this.initialized) {
      await this.initPromise;
    }
  }

  async get(key, options = {}) {
    await this.ensureInitialized();

    try {
      // 1. Check memory cache (fastest)
      if (!options.skipCache) {
        const cached = await this.memoryCache.get(key);
        if (cached !== null) {
          this.recordMetrics('cache_hit', key);
          return cached;
        }
      }

      // 2. Check session storage (temporary data)
      if (options.useSession) {
        const sessionData = await this.sessionStorage.get(key);
        if (sessionData !== null) {
          await this.memoryCache.set(key, sessionData, { ttl: 300 }); // 5 min TTL
          return sessionData;
        }
      }

      // 3. Check localStorage (persistent, small data)
      const localData = await this.localStorage.get(key);
      if (localData !== null) {
        await this.memoryCache.set(key, localData);
        this.recordMetrics('localStorage_hit', key);
        return localData;
      }

      // 4. Check IndexedDB (persistent, large data)
      if (options.allowIndexedDB !== false) {
        const indexedData = await this.indexedDB.get(key);
        if (indexedData !== null) {
          // Promote to localStorage if small enough
          if (this.shouldPromoteToLocalStorage(indexedData)) {
            await this.localStorage.set(key, indexedData).catch(() => {});
          }
          await this.memoryCache.set(key, indexedData);
          this.recordMetrics('indexedDB_hit', key);
          return indexedData;
        }
      }

      this.recordMetrics('miss', key);
      return options.defaultValue ?? null;
    } catch (error) {
      console.error(`Storage facade error for ${key}:`, error);
      this.recordMetrics('error', key);

      // Try fallback storage
      if (options.fallback) {
        try {
          return (await this.localStorage.get(key)) || options.defaultValue;
        } catch (fallbackError) {
          console.error('Fallback storage also failed:', fallbackError);
        }
      }

      return options.defaultValue ?? null;
    }
  }

  async set(key, value, options = {}) {
    await this.ensureInitialized();

    try {
      // Validate data size
      const size = this.calculateSize(value);
      if (size > this.maxSize && !options.force) {
        throw new Error(`Data too large: ${size} bytes`);
      }

      // Update memory cache immediately
      await this.memoryCache.set(key, value, { ttl: options.ttl });

      // Determine storage strategy based on data size and type
      const strategy = this.determineStorageStrategy(value, options);

      switch (strategy) {
        case 'session':
          await this.sessionStorage.set(key, value);
          break;

        case 'local':
          await this.localStorage.set(key, value);
          break;

        case 'indexed':
          await this.indexedDB.set(key, value);
          // Also store metadata in localStorage
          await this.localStorage
            .set(`${key}_meta`, {
              size,
              updatedAt: new Date().toISOString(),
              location: 'indexedDB',
            })
            .catch(() => {});
          break;

        case 'distributed':
          // Large data split across multiple storage
          await this.distributeData(key, value);
          break;
      }

      // Notify listeners
      this.notifyListeners(key, value);

      // Sync across tabs
      this.broadcastChange(key, value);

      this.recordMetrics('set', key);
    } catch (error) {
      console.error(`Storage write error for ${key}:`, error);
      this.recordMetrics('set_error', key);
      throw error;
    }
  }

  async delete(key) {
    await this.ensureInitialized();

    // Remove from all storage layers
    await Promise.allSettled([
      this.memoryCache.delete(key),
      this.sessionStorage.delete(key),
      this.localStorage.delete(key),
      this.indexedDB.delete(key),
      this.localStorage.delete(`${key}_meta`),
    ]);

    this.notifyListeners(key, null);
    this.broadcastChange(key, null);
  }

  async clear() {
    await this.ensureInitialized();

    await Promise.allSettled([
      this.memoryCache.clear(),
      this.sessionStorage.clear(),
      this.localStorage.clear(),
      this.indexedDB.clear(),
    ]);

    // Notify all listeners
    this.listeners.forEach((callbacks, key) => {
      this.notifyListeners(key, null);
    });
  }

  // Subscribe to storage changes
  subscribe(key, callback) {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    this.listeners.get(key).add(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.listeners.get(key);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.listeners.delete(key);
        }
      }
    };
  }

  // Private methods
  determineStorageStrategy(value, options) {
    const size = JSON.stringify(value).length;

    if (options.temporary || options.ttl) return 'session';
    if (options.forceLocal) return 'local';
    if (size > 1024 * 1024) return 'indexed'; // > 1MB
    if (size > 100 * 1024) return 'distributed'; // > 100KB
    return 'local';
  }

  shouldPromoteToLocalStorage(data) {
    const size = JSON.stringify(data).length;
    return size < this.maxLocalStorageSize;
  }

  calculateSize(data) {
    return new Blob([JSON.stringify(data)]).size;
  }

  notifyListeners(key, value) {
    const callbacks = this.listeners.get(key);
    if (callbacks) {
      callbacks.forEach((callback) => {
        try {
          callback(value);
        } catch (error) {
          console.error('Listener error:', error);
        }
      });
    }
  }

  broadcastChange(key, value) {
    if (typeof BroadcastChannel !== 'undefined') {
      const channel = new BroadcastChannel('storage_sync');
      channel.postMessage({ key, value, timestamp: Date.now() });
      channel.close();
    }
  }

  setupStorageSync() {
    if (typeof BroadcastChannel !== 'undefined') {
      this.syncChannel = new BroadcastChannel('storage_sync');
      this.syncChannel.onmessage = (event) => {
        const { key, value } = event.data;
        // Update local cache
        this.memoryCache.set(key, value);
        // Notify local listeners
        this.notifyListeners(key, value);
      };
    }
  }

  async warmUpCache() {
    const keysToWarm = ['templates', 'workflows', 'snippets', 'ui_preferences', 'recent_items'];

    await Promise.all(keysToWarm.map((key) => this.get(key, { skipCache: true })));
  }

  async distributeData(key, value) {
    // Split large data across multiple storage locations
    const chunks = this.chunkData(value);
    const chunkKeys = [];

    for (let i = 0; i < chunks.length; i++) {
      const chunkKey = `${key}_chunk_${i}`;
      chunkKeys.push(chunkKey);

      // Store each chunk in localStorage or IndexedDB based on size
      const chunkSize = this.calculateSize(chunks[i]);
      if (chunkSize < this.maxLocalStorageSize) {
        await this.localStorage.set(chunkKey, chunks[i]);
      } else {
        await this.indexedDB.set(chunkKey, chunks[i]);
      }
    }

    // Store manifest in localStorage
    await this.localStorage.set(`${key}_manifest`, {
      type: 'distributed',
      chunks: chunkKeys,
      totalSize: this.calculateSize(value),
      createdAt: new Date().toISOString(),
    });
  }

  chunkData(data, chunkSize = 50 * 1024) {
    const jsonStr = JSON.stringify(data);
    const chunks = [];

    for (let i = 0; i < jsonStr.length; i += chunkSize) {
      chunks.push(jsonStr.slice(i, i + chunkSize));
    }

    return chunks;
  }

  recordMetrics(action, key) {
    switch (action) {
      case 'cache_hit':
        this.metrics.hits.cache++;
        break;
      case 'localStorage_hit':
        this.metrics.hits.localStorage++;
        break;
      case 'indexedDB_hit':
        this.metrics.hits.indexedDB++;
        break;
      case 'miss':
        this.metrics.misses++;
        break;
      case 'error':
      case 'set_error':
        this.metrics.errors++;
        break;
      case 'set':
        this.metrics.sets++;
        break;
    }

    // Send to analytics if configured
    if (window.analytics) {
      window.analytics.track('storage_operation', { action, key });
    }
  }

  // Public utility methods
  getMetrics() {
    return { ...this.metrics };
  }

  async getStorageInfo() {
    const [localSize, sessionSize, indexedSize, cacheSize] = await Promise.all([
      this.localStorage.getSize(),
      this.sessionStorage.getSize(),
      this.indexedDB.getSize(),
      this.memoryCache.getSize(),
    ]);

    return {
      localStorage: localSize,
      sessionStorage: sessionSize,
      indexedDB: indexedSize,
      memoryCache: cacheSize,
      total: localSize + sessionSize + indexedSize + cacheSize,
    };
  }

  // Cleanup method
  destroy() {
    this.memoryCache.stopCleanupInterval();
    if (this.syncChannel) {
      this.syncChannel.close();
    }
    this.listeners.clear();
  }
}

// Singleton instance
export const storageFacade = new StorageFacade();

// Also export class for testing
export default StorageFacade;
