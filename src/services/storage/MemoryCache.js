/**
 * In-memory cache adapter for the Storage Facade
 * Provides fast access with TTL support
 */
class MemoryCache {
  constructor() {
    this.cache = new Map();
    this.timers = new Map();
  }

  async get(key) {
    const item = this.cache.get(key);
    if (!item) return null;
    
    // Check if expired
    if (item.expiresAt && Date.now() > item.expiresAt) {
      await this.delete(key);
      return null;
    }
    
    return item.value;
  }

  async set(key, value, options = {}) {
    // Clear existing timer if any
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
      this.timers.delete(key);
    }
    
    const item = {
      value,
      createdAt: Date.now()
    };
    
    // Set expiration if TTL provided (in seconds)
    if (options.ttl) {
      const ttlMs = options.ttl * 1000;
      item.expiresAt = Date.now() + ttlMs;
      
      // Set timer to auto-delete
      const timer = setTimeout(() => {
        this.delete(key);
      }, ttlMs);
      
      this.timers.set(key, timer);
    }
    
    this.cache.set(key, item);
    return true;
  }

  async delete(key) {
    // Clear timer if exists
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
      this.timers.delete(key);
    }
    
    return this.cache.delete(key);
  }

  async clear() {
    // Clear all timers
    this.timers.forEach(timer => clearTimeout(timer));
    this.timers.clear();
    
    this.cache.clear();
    return true;
  }

  async has(key) {
    if (!this.cache.has(key)) return false;
    
    const item = this.cache.get(key);
    if (item.expiresAt && Date.now() > item.expiresAt) {
      await this.delete(key);
      return false;
    }
    
    return true;
  }

  async getSize() {
    let size = 0;
    for (const [key, item] of this.cache) {
      size += JSON.stringify(key).length + JSON.stringify(item.value).length;
    }
    return size;
  }

  async keys() {
    const validKeys = [];
    for (const [key, item] of this.cache) {
      if (!item.expiresAt || Date.now() <= item.expiresAt) {
        validKeys.push(key);
      }
    }
    return validKeys;
  }

  // Cleanup expired items periodically
  startCleanupInterval(intervalMs = 60000) {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpired();
    }, intervalMs);
  }

  stopCleanupInterval() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  cleanupExpired() {
    const now = Date.now();
    const keysToDelete = [];
    
    for (const [key, item] of this.cache) {
      if (item.expiresAt && now > item.expiresAt) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => this.delete(key));
  }
}

export default MemoryCache;