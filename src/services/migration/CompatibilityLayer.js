import { storageFacade } from '../storage/StorageFacade';
import { legacyDataAdapter } from '../storage/LegacyDataAdapter';
import { migrationLogger } from './MigrationLogger';

/**
 * CompatibilityLayer - Provides backward compatibility during migration
 * 
 * Features:
 * - Dual-read support (read from both old and new formats)
 * - Transparent fallbacks for missing data
 * - Version detection and handling
 * - Compatibility shims for API changes
 * - Gradual migration with zero downtime
 */
class CompatibilityLayer {
  constructor() {
    this.enabled = true;
    this.dualReadEnabled = true;
    this.fallbackEnabled = true;
    
    // Track which keys have been migrated
    this.migratedKeys = new Set();
    
    // Version compatibility mappings
    this.versionHandlers = new Map([
      ['1.0.0', this.handleV1Format.bind(this)],
      ['2.0.0', this.handleV2Format.bind(this)],
      ['3.0.0', this.handleV3Format.bind(this)]
    ]);
    
    // API compatibility shims
    this.apiShims = {
      // Old API -> New API mappings
      getTemplates: () => this.get('templates'),
      saveTemplate: (template) => this.save('templates', template),
      getWorkflows: () => this.get('workflows'),
      saveWorkflow: (workflow) => this.save('workflows', workflow),
      getUserPreferences: () => this.get('ui_preferences'),
      saveUserPreferences: (prefs) => this.set('ui_preferences', prefs)
    };
    
    // Initialize compatibility layer
    this.initialize();
  }

  /**
   * Initialize compatibility layer
   */
  async initialize() {
    // Check if dual-read period is still active
    const migrationStatus = await storageFacade.get('migration_status') || {};
    const dualReadEndTime = migrationStatus.dualReadEndTime;
    
    if (dualReadEndTime && Date.now() > dualReadEndTime) {
      this.dualReadEnabled = false;
      migrationLogger.info('Dual-read period has ended');
    }
    
    // Load list of migrated keys
    const migratedKeysList = await storageFacade.get('migrated_keys') || [];
    this.migratedKeys = new Set(migratedKeysList);
  }

  /**
   * Get data with backward compatibility
   */
  async get(key, options = {}) {
    try {
      // Try new format first
      let data = await storageFacade.get(key);
      
      // If not found and dual-read is enabled, try legacy format
      if (data === null && this.dualReadEnabled && !this.migratedKeys.has(key)) {
        migrationLogger.debug(`Attempting legacy read for key: ${key}`);
        
        data = await legacyDataAdapter.get(key);
        
        if (data !== null) {
          // Mark as migrated
          await this.markAsMigrated(key);
          
          // Save to new format for next time
          await storageFacade.set(key, data);
          
          migrationLogger.info(`Successfully migrated key through dual-read: ${key}`);
        }
      }
      
      // Apply version-specific transformations if needed
      if (data !== null && options.transform !== false) {
        data = await this.transformData(key, data);
      }
      
      // Apply fallbacks for missing data
      if (data === null && this.fallbackEnabled) {
        data = this.getDefaultData(key);
      }
      
      return data;
      
    } catch (error) {
      migrationLogger.error('Compatibility layer get error', error, { key });
      
      // Return default data on error
      if (this.fallbackEnabled) {
        return this.getDefaultData(key);
      }
      
      throw error;
    }
  }

  /**
   * Set data with compatibility handling
   */
  async set(key, value, options = {}) {
    try {
      // Transform data to current format
      const transformedValue = await this.transformDataForSave(key, value);
      
      // Save to new storage
      await storageFacade.set(key, transformedValue, options);
      
      // Mark as migrated
      await this.markAsMigrated(key);
      
      // If in dual-write mode, also update legacy storage
      if (options.dualWrite && this.dualReadEnabled) {
        try {
          const legacyValue = this.transformToLegacyFormat(key, value);
          localStorage.setItem(key, JSON.stringify(legacyValue));
        } catch (error) {
          migrationLogger.warn('Failed to dual-write to legacy storage', { key, error });
        }
      }
      
      return true;
      
    } catch (error) {
      migrationLogger.error('Compatibility layer set error', error, { key });
      throw error;
    }
  }

  /**
   * Save entity with compatibility (handles arrays)
   */
  async save(collectionKey, entity, options = {}) {
    const collection = await this.get(collectionKey) || [];
    
    if (entity.id) {
      // Update existing
      const index = collection.findIndex(item => item.id === entity.id);
      if (index >= 0) {
        collection[index] = entity;
      } else {
        collection.push(entity);
      }
    } else {
      // Add new
      entity.id = this.generateId();
      entity.createdAt = new Date().toISOString();
      collection.push(entity);
    }
    
    entity.updatedAt = new Date().toISOString();
    
    await this.set(collectionKey, collection, options);
    
    return entity;
  }

  /**
   * Delete entity with compatibility
   */
  async delete(collectionKey, entityId, options = {}) {
    const collection = await this.get(collectionKey) || [];
    const filtered = collection.filter(item => item.id !== entityId);
    
    await this.set(collectionKey, filtered, options);
    
    return { deleted: entityId };
  }

  /**
   * Transform data based on version
   */
  async transformData(key, data) {
    const version = await this.detectDataVersion(key, data);
    const currentVersion = '3.0.0';
    
    if (version === currentVersion) {
      return data;
    }
    
    migrationLogger.debug(`Transforming data from v${version} to v${currentVersion}`, { key });
    
    // Apply version-specific transformations
    let transformedData = data;
    
    if (version === '1.0.0' && this.versionHandlers.has('1.0.0')) {
      transformedData = await this.versionHandlers.get('1.0.0')(key, transformedData);
    }
    
    if (version <= '2.0.0' && this.versionHandlers.has('2.0.0')) {
      transformedData = await this.versionHandlers.get('2.0.0')(key, transformedData);
    }
    
    return transformedData;
  }

  /**
   * Version-specific handlers
   */
  async handleV1Format(key, data) {
    // V1 -> V2 transformations
    if (Array.isArray(data)) {
      return data.map(item => ({
        ...item,
        folderId: item.folderId || null,
        folderIds: item.folderIds || [],
        tags: item.tags || [],
        version: 2
      }));
    }
    
    return {
      ...data,
      version: 2
    };
  }

  async handleV2Format(key, data) {
    // V2 -> V3 transformations
    if (key === 'templates' && Array.isArray(data)) {
      return data.map(template => ({
        ...template,
        context: template.context || '',
        contextEnabled: template.contextEnabled || false,
        version: 3
      }));
    }
    
    if (key === 'ui_preferences') {
      return {
        ...data,
        performance: {
          enableVirtualization: true,
          enableLazyLoading: true,
          cacheSize: 100,
          ...data.performance
        },
        version: 3
      };
    }
    
    return {
      ...data,
      version: 3
    };
  }

  async handleV3Format(key, data) {
    // Current format, no transformation needed
    return data;
  }

  /**
   * Detect data version
   */
  async detectDataVersion(key, data) {
    // Check explicit version field
    if (data && data.version) {
      return data.version;
    }
    
    // Check array items for version
    if (Array.isArray(data) && data.length > 0 && data[0].version) {
      return data[0].version;
    }
    
    // Detect based on structure
    if (key === 'templates' && Array.isArray(data) && data.length > 0) {
      const sample = data[0];
      
      if (sample.contextEnabled !== undefined) {
        return '3.0.0';
      }
      
      if (sample.folderIds !== undefined) {
        return '2.0.0';
      }
      
      return '1.0.0';
    }
    
    // Default to oldest version
    return '1.0.0';
  }

  /**
   * Transform data for saving
   */
  async transformDataForSave(key, data) {
    // Ensure data has current version
    if (Array.isArray(data)) {
      return data.map(item => ({
        ...item,
        version: 3
      }));
    }
    
    return {
      ...data,
      version: 3
    };
  }

  /**
   * Transform to legacy format for dual-write
   */
  transformToLegacyFormat(key, data) {
    if (Array.isArray(data)) {
      return data.map(item => {
        const legacy = { ...item };
        
        // Convert camelCase to snake_case for legacy
        if (legacy.folderId !== undefined) {
          legacy.folder_id = legacy.folderId;
          delete legacy.folderId;
        }
        
        if (legacy.createdAt !== undefined) {
          legacy.created_at = legacy.createdAt;
          delete legacy.createdAt;
        }
        
        if (legacy.updatedAt !== undefined) {
          legacy.updated_at = legacy.updatedAt;
          delete legacy.updatedAt;
        }
        
        // Remove new fields
        delete legacy.version;
        delete legacy.contextEnabled;
        delete legacy.folderIds;
        
        return legacy;
      });
    }
    
    return data;
  }

  /**
   * Get default data for missing keys
   */
  getDefaultData(key) {
    const defaults = {
      templates: [],
      workflows: [],
      snippets: [],
      folders: [],
      tags: [],
      ui_preferences: {
        viewMode: 'grid',
        theme: 'system',
        sidebarCollapsed: false,
        version: 3
      },
      user_settings: {
        displayName: 'User',
        preferences: {
          notifications: true,
          autoSave: true,
          confirmDelete: true
        },
        version: 3
      },
      recent_items: [],
      favorites: []
    };
    
    return defaults[key] || null;
  }

  /**
   * Mark key as migrated
   */
  async markAsMigrated(key) {
    this.migratedKeys.add(key);
    
    const migratedKeysList = Array.from(this.migratedKeys);
    await storageFacade.set('migrated_keys', migratedKeysList);
  }

  /**
   * Check if key is migrated
   */
  isMigrated(key) {
    return this.migratedKeys.has(key);
  }

  /**
   * Enable/disable dual-read mode
   */
  async setDualReadMode(enabled, durationMs = 7 * 24 * 60 * 60 * 1000) {
    this.dualReadEnabled = enabled;
    
    if (enabled) {
      const endTime = Date.now() + durationMs;
      await storageFacade.set('migration_status', {
        dualReadEnabled: true,
        dualReadEndTime: endTime,
        startTime: Date.now()
      });
      
      migrationLogger.info('Dual-read mode enabled', {
        duration: durationMs,
        endTime: new Date(endTime).toISOString()
      });
    } else {
      await storageFacade.set('migration_status', {
        dualReadEnabled: false,
        endTime: Date.now()
      });
      
      migrationLogger.info('Dual-read mode disabled');
    }
  }

  /**
   * Generate unique ID
   */
  generateId() {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Create API shim for legacy code
   */
  createApiShim() {
    return new Proxy(this.apiShims, {
      get: (target, prop) => {
        if (target[prop]) {
          return target[prop];
        }
        
        // Default behavior: pass through to compatibility layer
        return (...args) => {
          migrationLogger.warn(`Unknown API method called: ${prop}`, { args });
          return null;
        };
      }
    });
  }

  /**
   * Get migration statistics
   */
  async getMigrationStats() {
    const stats = {
      migratedKeys: Array.from(this.migratedKeys),
      totalKeys: this.migratedKeys.size,
      dualReadEnabled: this.dualReadEnabled,
      fallbackEnabled: this.fallbackEnabled
    };
    
    // Add timing information
    const migrationStatus = await storageFacade.get('migration_status') || {};
    if (migrationStatus.dualReadEndTime) {
      stats.dualReadRemainingTime = Math.max(0, migrationStatus.dualReadEndTime - Date.now());
    }
    
    return stats;
  }
}

// Export singleton instance
export const compatibilityLayer = new CompatibilityLayer();

// Also export class for testing
export default CompatibilityLayer;