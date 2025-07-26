/**
 * SessionStorage adapter for the Storage Facade
 * Handles browser sessionStorage for temporary data
 */
class SessionStorageAdapter {
  constructor() {
    this.prefix = 'airprompts_session_';
    this.available = this.checkAvailability();
  }

  checkAvailability() {
    try {
      const testKey = '__sessionStorage_test__';
      sessionStorage.setItem(testKey, 'test');
      sessionStorage.removeItem(testKey);
      return true;
    } catch (e) {
      console.warn('SessionStorage is not available:', e);
      return false;
    }
  }

  async get(key) {
    if (!this.available) return null;
    
    try {
      const item = sessionStorage.getItem(this.prefix + key);
      if (!item) return null;
      
      return JSON.parse(item);
    } catch (error) {
      console.error(`SessionStorage get error for ${key}:`, error);
      return null;
    }
  }

  async set(key, value) {
    if (!this.available) {
      throw new Error('SessionStorage is not available');
    }
    
    try {
      const serialized = JSON.stringify(value);
      sessionStorage.setItem(this.prefix + key, serialized);
      return true;
    } catch (error) {
      if (error.name === 'QuotaExceededError') {
        throw new Error('SessionStorage quota exceeded');
      }
      throw error;
    }
  }

  async delete(key) {
    if (!this.available) return false;
    
    try {
      sessionStorage.removeItem(this.prefix + key);
      return true;
    } catch (error) {
      console.error(`SessionStorage delete error for ${key}:`, error);
      return false;
    }
  }

  async clear() {
    if (!this.available) return false;
    
    try {
      // Only clear items with our prefix
      const keysToRemove = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && key.startsWith(this.prefix)) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => sessionStorage.removeItem(key));
      return true;
    } catch (error) {
      console.error('SessionStorage clear error:', error);
      return false;
    }
  }

  async getSize() {
    if (!this.available) return 0;
    
    let totalSize = 0;
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && key.startsWith(this.prefix)) {
        const value = sessionStorage.getItem(key);
        totalSize += key.length + (value ? value.length : 0);
      }
    }
    
    return totalSize;
  }
}

export default SessionStorageAdapter;