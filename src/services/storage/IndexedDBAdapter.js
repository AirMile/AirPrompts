/**
 * IndexedDB adapter for the Storage Facade
 * Handles large data storage with async operations
 */
class IndexedDBAdapter {
  constructor() {
    this.dbName = 'AirPromptsDB';
    this.storeName = 'storage';
    this.version = 1;
    this.db = null;
    this.available = typeof indexedDB !== 'undefined';
  }

  async initialize() {
    if (!this.available) {
      console.warn('IndexedDB is not available');
      return false;
    }

    try {
      this.db = await this.openDB();
      return true;
    } catch (error) {
      console.error('Failed to initialize IndexedDB:', error);
      this.available = false;
      return false;
    }
  }

  openDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => {
        reject(new Error('Failed to open IndexedDB'));
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Create object store if it doesn't exist
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: 'key' });
        }
      };
    });
  }

  async ensureDB() {
    if (!this.db) {
      await this.initialize();
    }
    if (!this.db) {
      throw new Error('IndexedDB is not available');
    }
  }

  async get(key) {
    if (!this.available) return null;

    try {
      await this.ensureDB();
      
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([this.storeName], 'readonly');
        const store = transaction.objectStore(this.storeName);
        const request = store.get(key);

        request.onsuccess = () => {
          const result = request.result;
          resolve(result ? result.value : null);
        };

        request.onerror = () => {
          reject(new Error(`Failed to get item: ${key}`));
        };
      });
    } catch (error) {
      console.error(`IndexedDB get error for ${key}:`, error);
      return null;
    }
  }

  async set(key, value) {
    if (!this.available) {
      throw new Error('IndexedDB is not available');
    }

    try {
      await this.ensureDB();
      
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);
        const request = store.put({
          key,
          value,
          timestamp: Date.now()
        });

        request.onsuccess = () => {
          resolve(true);
        };

        request.onerror = () => {
          reject(new Error(`Failed to set item: ${key}`));
        };
      });
    } catch (error) {
      console.error(`IndexedDB set error for ${key}:`, error);
      throw error;
    }
  }

  async delete(key) {
    if (!this.available) return false;

    try {
      await this.ensureDB();
      
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);
        const request = store.delete(key);

        request.onsuccess = () => {
          resolve(true);
        };

        request.onerror = () => {
          reject(new Error(`Failed to delete item: ${key}`));
        };
      });
    } catch (error) {
      console.error(`IndexedDB delete error for ${key}:`, error);
      return false;
    }
  }

  async clear() {
    if (!this.available) return false;

    try {
      await this.ensureDB();
      
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);
        const request = store.clear();

        request.onsuccess = () => {
          resolve(true);
        };

        request.onerror = () => {
          reject(new Error('Failed to clear IndexedDB'));
        };
      });
    } catch (error) {
      console.error('IndexedDB clear error:', error);
      return false;
    }
  }

  async getSize() {
    if (!this.available) return 0;

    try {
      await this.ensureDB();
      
      // IndexedDB doesn't provide direct size info, so we estimate
      const keys = await this.getAllKeys();
      let totalSize = 0;
      
      for (const key of keys) {
        const value = await this.get(key);
        if (value) {
          totalSize += JSON.stringify(value).length;
        }
      }
      
      return totalSize;
    } catch (error) {
      console.error('Failed to calculate IndexedDB size:', error);
      return 0;
    }
  }

  async getAllKeys() {
    if (!this.available) return [];

    try {
      await this.ensureDB();
      
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([this.storeName], 'readonly');
        const store = transaction.objectStore(this.storeName);
        const request = store.getAllKeys();

        request.onsuccess = () => {
          resolve(request.result || []);
        };

        request.onerror = () => {
          reject(new Error('Failed to get all keys'));
        };
      });
    } catch (error) {
      console.error('Failed to get IndexedDB keys:', error);
      return [];
    }
  }
}

// Export singleton instance
export const indexedDBAdapter = new IndexedDBAdapter();

// Also export class for testing
export default IndexedDBAdapter;