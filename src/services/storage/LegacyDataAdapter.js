import { storageFacade } from './StorageFacade';

/**
 * Legacy Data Adapter - Handles migration from old storage keys and formats
 * 
 * Features:
 * - Maps old keys to new keys
 * - Transforms data formats (snake_case to camelCase)
 * - Automatic cleanup after successful migration
 * - Migration logging and tracking
 */
class LegacyDataAdapter {
  constructor(storage = null) {
    this.storage = storage || storageFacade;
    this.migrationLog = new Map();
    
    // Key mappings from old to new format
    this.keyMapping = {
      'templates': 'templates',
      'workflows': 'workflows',
      'snippets': 'snippets',
      'ui-prefs': 'ui_preferences',
      'user_settings': 'user_settings',
      'recent_items': 'recent_items',
      'favorites': 'favorites',
      'folders': 'folders',
      'tags': 'tags',
      'theme': 'theme_preference',
      'airprompts-templates': 'templates',
      'airprompts-workflows': 'workflows',
      'airprompts-snippets': 'snippets'
    };
  }

  /**
   * Get data with automatic migration from legacy format
   */
  async get(oldKey) {
    // Check if already migrated
    const migrationStatus = this.migrationLog.get(oldKey);
    if (migrationStatus?.completed) {
      return this.storage.get(migrationStatus.newKey);
    }

    const newKey = this.keyMapping[oldKey] || oldKey;
    
    // Try to get data with new key first
    let data = await this.storage.get(newKey);
    
    // If not found, try old key
    if (!data) {
      data = await this.getFromLegacyStorage(oldKey);
      
      if (data) {
        // Migrate to new format
        const migrated = await this.migrateData(data, oldKey);
        
        // Save with new key
        await this.storage.set(newKey, migrated);
        
        // Log migration
        this.migrationLog.set(oldKey, {
          completed: true,
          newKey,
          migratedAt: new Date().toISOString()
        });
        
        // Clean up old data
        await this.cleanupLegacyData(oldKey);
        
        return migrated;
      }
    }

    return data;
  }

  /**
   * Migrate all legacy data
   */
  async migrateAll() {
    const results = {
      migrated: [],
      failed: [],
      skipped: []
    };

    for (const [oldKey, newKey] of Object.entries(this.keyMapping)) {
      try {
        // Skip if already migrated
        if (this.migrationLog.get(oldKey)?.completed) {
          results.skipped.push(oldKey);
          continue;
        }

        // Check if data exists with new key
        const existingData = await this.storage.get(newKey);
        if (existingData) {
          results.skipped.push(oldKey);
          continue;
        }

        // Try to migrate
        const legacyData = await this.getFromLegacyStorage(oldKey);
        if (legacyData) {
          const migrated = await this.migrateData(legacyData, oldKey);
          await this.storage.set(newKey, migrated);
          await this.cleanupLegacyData(oldKey);
          
          this.migrationLog.set(oldKey, {
            completed: true,
            newKey,
            migratedAt: new Date().toISOString()
          });
          
          results.migrated.push(oldKey);
        }
      } catch (error) {
        console.error(`Failed to migrate ${oldKey}:`, error);
        results.failed.push({ key: oldKey, error: error.message });
      }
    }

    // Save migration log
    await this.storage.set('migration_log', {
      timestamp: new Date().toISOString(),
      results
    });

    return results;
  }

  /**
   * Get data from legacy storage (localStorage)
   */
  private async getFromLegacyStorage(key) {
    try {
      // Try different prefixes
      const prefixes = ['', 'airprompts_', 'airprompts-', 'ap_'];
      
      for (const prefix of prefixes) {
        const fullKey = prefix + key;
        const raw = localStorage.getItem(fullKey);
        if (raw) {
          try {
            return JSON.parse(raw);
          } catch (e) {
            // If not JSON, return as is
            return raw;
          }
        }
      }
      
      return null;
    } catch (error) {
      console.error(`Failed to parse legacy data for ${key}:`, error);
      return null;
    }
  }

  /**
   * Migrate data to new format
   */
  private async migrateData(data, type) {
    // Handle different data types
    switch (type) {
      case 'templates':
      case 'workflows':
      case 'snippets':
        return this.migrateEntityData(data);
      
      case 'ui-prefs':
      case 'ui_preferences':
        return this.migrateUIPreferences(data);
      
      case 'user_settings':
        return this.migrateUserSettings(data);
      
      case 'folders':
        return this.migrateFolders(data);
        
      case 'recent_items':
        return this.migrateRecentItems(data);
        
      default:
        return data;
    }
  }

  /**
   * Migrate entity data (templates, workflows, snippets)
   */
  private migrateEntityData(data) {
    if (!Array.isArray(data)) return data;
    
    return data.map(item => ({
      ...item,
      // Transform snake_case to camelCase
      id: item.id || this.generateId(),
      folderId: item.folder_id || item.folderId,
      folderIds: item.folder_ids || (item.folder_id ? [item.folder_id] : []),
      lastUsed: item.last_used || item.lastUsed || new Date().toISOString(),
      createdAt: item.created_at || item.createdAt || new Date().toISOString(),
      updatedAt: item.updated_at || item.updatedAt || new Date().toISOString(),
      favorite: item.is_favorite || item.favorite || false,
      variables: item.variables || [],
      tags: item.tags || [],
      
      // Clean up old fields
      folder_id: undefined,
      folder_ids: undefined,
      last_used: undefined,
      created_at: undefined,
      updated_at: undefined,
      is_favorite: undefined
    })).filter(item => item.id); // Remove invalid items
  }

  /**
   * Migrate UI preferences
   */
  private migrateUIPreferences(data) {
    return {
      viewMode: data.view_mode || data.viewMode || 'grid',
      theme: data.theme || 'system',
      sidebarCollapsed: data.sidebar_collapsed || data.sidebarCollapsed || false,
      recentFolders: data.recent_folders || data.recentFolders || [],
      favoriteFilters: data.favorite_filters || data.favoriteFilters || [],
      lastVisitedRoute: data.last_visited_route || data.lastVisitedRoute || '/',
      itemsPerPage: data.items_per_page || data.itemsPerPage || 20,
      sortBy: data.sort_by || data.sortBy || 'updatedAt',
      sortOrder: data.sort_order || data.sortOrder || 'desc',
      ...data
    };
  }

  /**
   * Migrate user settings
   */
  private migrateUserSettings(data) {
    return {
      displayName: data.display_name || data.displayName || 'User',
      email: data.email || '',
      preferences: {
        notifications: data.notifications_enabled ?? data.preferences?.notifications ?? true,
        autoSave: data.auto_save ?? data.preferences?.autoSave ?? true,
        confirmDelete: data.confirm_delete ?? data.preferences?.confirmDelete ?? true,
        showTips: data.show_tips ?? data.preferences?.showTips ?? true,
        ...data.preferences
      },
      ...data
    };
  }

  /**
   * Migrate folders
   */
  private migrateFolders(data) {
    if (!Array.isArray(data)) return data;
    
    return data.map(folder => ({
      ...folder,
      id: folder.id || this.generateId(),
      parentId: folder.parent_id || folder.parentId || null,
      createdAt: folder.created_at || folder.createdAt || new Date().toISOString(),
      updatedAt: folder.updated_at || folder.updatedAt || new Date().toISOString(),
      itemCount: folder.item_count || folder.itemCount || 0,
      
      // Clean up old fields
      parent_id: undefined,
      created_at: undefined,
      updated_at: undefined,
      item_count: undefined
    }));
  }

  /**
   * Migrate recent items
   */
  private migrateRecentItems(data) {
    if (!Array.isArray(data)) return data;
    
    return data.map(item => ({
      ...item,
      accessedAt: item.accessed_at || item.accessedAt || new Date().toISOString(),
      itemType: item.item_type || item.itemType || 'template',
      itemId: item.item_id || item.itemId,
      
      // Clean up old fields
      accessed_at: undefined,
      item_type: undefined,
      item_id: undefined
    })).filter(item => item.itemId);
  }

  /**
   * Clean up legacy data
   */
  private async cleanupLegacyData(key) {
    try {
      // Remove with different prefixes
      const prefixes = ['', 'airprompts_', 'airprompts-', 'ap_'];
      
      for (const prefix of prefixes) {
        const fullKey = prefix + key;
        localStorage.removeItem(fullKey);
        
        // Also remove any related keys
        const relatedKeys = [
          `${fullKey}_backup`,
          `${fullKey}_temp`,
          `${fullKey}_old`,
          `${fullKey}_v1`,
          `${fullKey}_v2`
        ];
        
        relatedKeys.forEach(k => localStorage.removeItem(k));
      }
    } catch (error) {
      console.error(`Failed to cleanup legacy data for ${key}:`, error);
    }
  }

  /**
   * Generate unique ID
   */
  private generateId() {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Check if migration is needed
   */
  async checkMigrationStatus() {
    const status = {
      needed: false,
      keys: []
    };

    for (const oldKey of Object.keys(this.keyMapping)) {
      const legacyData = await this.getFromLegacyStorage(oldKey);
      if (legacyData && !this.migrationLog.get(oldKey)?.completed) {
        status.needed = true;
        status.keys.push(oldKey);
      }
    }

    return status;
  }
}

// Export singleton instance
export const legacyDataAdapter = new LegacyDataAdapter();

// Also export class for testing
export default LegacyDataAdapter;