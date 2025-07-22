/**
 * Migration utilities for detecting and handling data migrations
 */
export class MigrationHelpers {

  /**
   * Check if localStorage contains data that needs migration
   */
  static hasLocalStorageData() {
    const templates = JSON.parse(localStorage.getItem('templates') || '[]');
    const workflows = JSON.parse(localStorage.getItem('workflows') || '[]');
    const folders = JSON.parse(localStorage.getItem('folders') || '[]');
    const snippets = JSON.parse(localStorage.getItem('snippets') || '[]');

    return {
      hasData: templates.length > 0 || workflows.length > 0 || folders.length > 0 || snippets.length > 0,
      counts: {
        templates: templates.length,
        workflows: workflows.length,
        folders: folders.length,
        snippets: snippets.length
      },
      data: { templates, workflows, folders, snippets }
    };
  }

  /**
   * Get database status to compare with local data
   */
  static async getDatabaseStatus() {
    try {
      const response = await fetch('/api/migrate/status');
      const data = await response.json();
      return data.success ? data.data : null;
    } catch (error) {
      console.error('Failed to get database status:', error);
      return null;
    }
  }

  /**
   * Auto-detect if migration is needed
   */
  static async shouldMigrate() {
    const localData = this.hasLocalStorageData();
    const dbStatus = await this.getDatabaseStatus();

    if (!localData.hasData) {
      return { 
        shouldMigrate: false, 
        reason: 'no_local_data' 
      };
    }

    if (!dbStatus) {
      return { 
        shouldMigrate: true, 
        reason: 'database_unavailable',
        localData: localData.counts
      };
    }

    const dbCounts = dbStatus.database_stats;
    const localCounts = localData.counts;

    // If database is empty but local has data
    const dbEmpty = Object.values(dbCounts).every(count => count === 0);
    if (dbEmpty && localData.hasData) {
      return {
        shouldMigrate: true,
        reason: 'empty_database',
        localData: localCounts,
        databaseData: dbCounts
      };
    }

    // If local data is significantly different from database
    const significantDifference = Object.keys(localCounts).some(key => {
      const localCount = localCounts[key] || 0;
      const dbCount = dbCounts[key] || 0;
      return Math.abs(localCount - dbCount) > 0;
    });

    if (significantDifference) {
      return {
        shouldMigrate: true,
        reason: 'data_mismatch',
        localData: localCounts,
        databaseData: dbCounts
      };
    }

    return {
      shouldMigrate: false,
      reason: 'data_synchronized',
      localData: localCounts,
      databaseData: dbCounts
    };
  }

  /**
   * Validate data integrity before migration
   */
  static validateMigrationData(data) {
    const errors = [];
    const warnings = [];

    // Validate templates
    if (data.templates) {
      data.templates.forEach((template, index) => {
        if (!template.id) errors.push(`Template ${index}: Missing ID`);
        if (!template.name) errors.push(`Template ${index}: Missing name`);
        if (!template.content) errors.push(`Template ${index}: Missing content`);
        if (!template.category) warnings.push(`Template ${index}: Missing category`);
      });
    }

    // Validate workflows
    if (data.workflows) {
      data.workflows.forEach((workflow, index) => {
        if (!workflow.id) errors.push(`Workflow ${index}: Missing ID`);
        if (!workflow.name) errors.push(`Workflow ${index}: Missing name`);
        if (!workflow.steps || !Array.isArray(workflow.steps)) {
          warnings.push(`Workflow ${index}: Invalid or missing steps`);
        }
      });
    }

    // Validate snippets
    if (data.snippets) {
      data.snippets.forEach((snippet, index) => {
        if (!snippet.id) errors.push(`Snippet ${index}: Missing ID`);
        if (!snippet.name) errors.push(`Snippet ${index}: Missing name`);
        if (!snippet.content) errors.push(`Snippet ${index}: Missing content`);
        if (!snippet.category) warnings.push(`Snippet ${index}: Missing category`);
      });
    }

    // Check for duplicate IDs across all entities
    const allIds = [];
    ['templates', 'workflows', 'folders', 'snippets'].forEach(type => {
      if (data[type]) {
        data[type].forEach(item => {
          if (item.id) {
            if (allIds.includes(item.id)) {
              errors.push(`Duplicate ID found: ${item.id}`);
            } else {
              allIds.push(item.id);
            }
          }
        });
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      summary: {
        totalItems: allIds.length,
        errorCount: errors.length,
        warningCount: warnings.length
      }
    };
  }

  /**
   * Create a backup before migration
   */
  static async createPreMigrationBackup() {
    try {
      const response = await fetch('/api/migrate/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await response.json();
      
      if (data.success) {
        // Also save to local storage as additional backup
        const backupKey = `migration-backup-${Date.now()}`;
        localStorage.setItem(backupKey, JSON.stringify(data.data));
        
        return {
          success: true,
          backup: data.data,
          localBackupKey: backupKey
        };
      }
      
      return { success: false, error: data.error };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Selective migration - choose what to migrate
   */
  static async migrateSelected(selectedTypes, data) {
    const migrationData = {};
    
    selectedTypes.forEach(type => {
      if (data[type]) {
        migrationData[type] = data[type];
      }
    });

    try {
      const response = await fetch('/api/migrate/from-localstorage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(migrationData)
      });
      return await response.json();
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Rollback capability - restore from backup
   */
  static async rollbackMigration(backupKey) {
    try {
      const backup = JSON.parse(localStorage.getItem(backupKey));
      
      if (!backup) {
        throw new Error('Backup not found');
      }

      // Restore to localStorage (basic rollback)
      const { data } = backup;
      
      if (data.templates) localStorage.setItem('templates', JSON.stringify(data.templates));
      if (data.workflows) localStorage.setItem('workflows', JSON.stringify(data.workflows));
      if (data.folders) localStorage.setItem('folders', JSON.stringify(data.folders));
      if (data.snippets) localStorage.setItem('snippets', JSON.stringify(data.snippets));

      return { success: true, message: 'Data restored to localStorage' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Clean up after successful migration
   */
  static cleanupAfterMigration() {
    // Remove migrated data from localStorage
    ['templates', 'workflows', 'folders', 'snippets'].forEach(key => {
      localStorage.removeItem(key);
    });

    // Clean up old backup keys (keep only recent ones)
    const allKeys = Object.keys(localStorage);
    const backupKeys = allKeys
      .filter(key => key.startsWith('migration-backup-'))
      .sort()
      .reverse();

    // Keep only the 3 most recent backups
    backupKeys.slice(3).forEach(key => {
      localStorage.removeItem(key);
    });
  }

  /**
   * Get migration progress info
   */
  static getMigrationProgress(operationId) {
    // This would connect to a real progress tracking system
    // For now, return a simple progress structure
    return {
      operationId,
      status: 'in_progress', // pending | in_progress | completed | failed
      progress: 0, // 0-100
      currentStep: 'validating',
      steps: ['validating', 'backing_up', 'migrating', 'verifying', 'cleanup'],
      estimatedTimeRemaining: null,
      errors: []
    };
  }

  /**
   * Performance optimization for large datasets
   */
  static async migrateInBatches(data, batchSize = 100) {
    const results = {
      templates: { imported: 0, errors: [] },
      workflows: { imported: 0, errors: [] },
      folders: { imported: 0, errors: [] },
      snippets: { imported: 0, errors: [] }
    };

    for (const [type, items] of Object.entries(data)) {
      if (!Array.isArray(items) || items.length === 0) continue;

      // Process in batches
      for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize);
        const batchData = { [type]: batch };

        try {
          const response = await fetch('/api/migrate/from-localstorage', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(batchData)
          });
          const result = await response.json();
          
          if (result.success && result.data.results) {
            const typeResult = result.data.results[type];
            if (typeResult) {
              results[type].imported += typeResult.imported;
              results[type].errors.push(...typeResult.errors);
            }
          }
        } catch (error) {
          results[type].errors.push({
            batch: `${i}-${Math.min(i + batchSize - 1, items.length - 1)}`,
            error: error.message
          });
        }

        // Small delay between batches to prevent overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    return { success: true, data: { results } };
  }
}