/**
 * LocalStorage adapter for the Storage Facade
 * Handles browser localStorage operations with JSON serialization
 */
class LocalStorageAdapter {
  constructor() {
    this.prefix = 'airprompts_';
    this.available = this.checkAvailability();
  }

  checkAvailability() {
    try {
      const testKey = '__localStorage_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return true;
    } catch (e) {
      console.warn('LocalStorage is not available:', e);
      return false;
    }
  }

  async get(key) {
    if (!this.available) return null;
    
    try {
      const item = localStorage.getItem(this.prefix + key);
      if (!item) return null;
      
      return JSON.parse(item);
    } catch (error) {
      console.error(`LocalStorage get error for ${key}:`, error);
      return null;
    }
  }

  async set(key, value) {
    if (!this.available) {
      throw new Error('LocalStorage is not available');
    }
    
    try {
      const serialized = JSON.stringify(value);
      localStorage.setItem(this.prefix + key, serialized);
      return true;
    } catch (error) {
      if (error.name === 'QuotaExceededError') {
        throw new Error('LocalStorage quota exceeded');
      }
      throw error;
    }
  }

  async delete(key) {
    if (!this.available) return false;
    
    try {
      localStorage.removeItem(this.prefix + key);
      return true;
    } catch (error) {
      console.error(`LocalStorage delete error for ${key}:`, error);
      return false;
    }
  }

  async clear() {
    if (!this.available) return false;
    
    try {
      // Only clear items with our prefix
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.prefix)) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => localStorage.removeItem(key));
      return true;
    } catch (error) {
      console.error('LocalStorage clear error:', error);
      return false;
    }
  }

  async getSize() {
    if (!this.available) return 0;
    
    let totalSize = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.prefix)) {
        const value = localStorage.getItem(key);
        totalSize += key.length + (value ? value.length : 0);
      }
    }
    
    return totalSize;
  }
}

export default LocalStorageAdapter;