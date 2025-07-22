import { useState, useEffect } from 'react';
import { MigrationHelpers } from '../../utils/migrationHelpers';
import { useAPI } from '../useAPI';

/**
 * Hook for comprehensive migration management
 */
export function useMigration() {
  const [migrationState, setMigrationState] = useState({
    shouldMigrate: null,
    isChecking: false,
    isProcessing: false,
    hasLocalData: false,
    localDataCounts: null,
    databaseCounts: null,
    lastCheck: null,
    error: null
  });

  const { get, post } = useAPI();

  // Auto-check on mount and periodically
  useEffect(() => {
    checkMigrationStatus();
    
    // Check every 30 seconds if we think migration is needed
    const interval = setInterval(() => {
      if (migrationState.shouldMigrate) {
        checkMigrationStatus();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const checkMigrationStatus = async () => {
    setMigrationState(prev => ({ ...prev, isChecking: true, error: null }));

    try {
      const localData = MigrationHelpers.hasLocalStorageData();
      const migrationCheck = await MigrationHelpers.shouldMigrate();

      setMigrationState(prev => ({
        ...prev,
        shouldMigrate: migrationCheck.shouldMigrate,
        hasLocalData: localData.hasData,
        localDataCounts: localData.counts,
        databaseCounts: migrationCheck.databaseData || null,
        lastCheck: new Date().toISOString(),
        isChecking: false
      }));

      return migrationCheck;
    } catch (error) {
      setMigrationState(prev => ({
        ...prev,
        error: error.message,
        isChecking: false
      }));
      throw error;
    }
  };

  const startMigration = async (options = {}) => {
    setMigrationState(prev => ({ ...prev, isProcessing: true, error: null }));

    try {
      const localData = MigrationHelpers.hasLocalStorageData();
      
      if (!localData.hasData) {
        throw new Error('Geen lokale data om te migreren');
      }

      // Validate data before migration
      const validation = MigrationHelpers.validateMigrationData(localData.data);
      
      if (!validation.isValid && !options.ignoreValidationErrors) {
        throw new Error(`Data validation failed: ${validation.errors.join(', ')}`);
      }

      // Create backup if requested
      let backupInfo = null;
      if (options.createBackup !== false) {
        const backup = await MigrationHelpers.createPreMigrationBackup();
        if (!backup.success) {
          throw new Error(`Backup failed: ${backup.error}`);
        }
        backupInfo = backup;
      }

      // Execute migration
      let result;
      if (options.selectedTypes) {
        result = await MigrationHelpers.migrateSelected(options.selectedTypes, localData.data);
      } else if (options.useBatches) {
        result = await MigrationHelpers.migrateInBatches(localData.data, options.batchSize);
      } else {
        result = await post('/api/migrate/from-localstorage', localData.data);
      }

      if (!result.success) {
        throw new Error(result.error?.message || 'Migration failed');
      }

      // Cleanup after successful migration
      if (options.cleanupAfter !== false) {
        MigrationHelpers.cleanupAfterMigration();
      }

      // Update state
      setMigrationState(prev => ({
        ...prev,
        shouldMigrate: false,
        hasLocalData: false,
        localDataCounts: { templates: 0, workflows: 0, folders: 0, snippets: 0 },
        isProcessing: false
      }));

      return {
        success: true,
        result: result.data,
        backup: backupInfo,
        validation
      };

    } catch (error) {
      setMigrationState(prev => ({
        ...prev,
        error: error.message,
        isProcessing: false
      }));
      throw error;
    }
  };

  const previewMigration = async () => {
    try {
      const localData = MigrationHelpers.hasLocalStorageData();
      
      if (!localData.hasData) {
        return { hasData: false };
      }

      const validation = MigrationHelpers.validateMigrationData(localData.data);
      
      const response = await post('/api/migrate-advanced/preview', {
        localStorageData: localData.data
      });

      return {
        hasData: true,
        localData: localData.counts,
        validation,
        preview: response.success ? response.data : null,
        error: response.success ? null : response.error
      };
    } catch (error) {
      return {
        hasData: true,
        error: error.message
      };
    }
  };

  const rollbackMigration = async (backupKey) => {
    try {
      const result = await MigrationHelpers.rollbackMigration(backupKey);
      
      if (result.success) {
        // Re-check migration status after rollback
        await checkMigrationStatus();
      }
      
      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  return {
    // State
    ...migrationState,
    
    // Actions
    checkMigrationStatus,
    startMigration,
    previewMigration,
    rollbackMigration,
    
    // Computed properties
    get migrationRecommendation() {
      if (migrationState.isChecking) return 'checking';
      if (!migrationState.hasLocalData) return 'no_action_needed';
      if (migrationState.shouldMigrate) return 'migration_recommended';
      return 'data_synchronized';
    },
    
    get totalLocalItems() {
      if (!migrationState.localDataCounts) return 0;
      return Object.values(migrationState.localDataCounts).reduce((sum, count) => sum + count, 0);
    },
    
    get isReady() {
      return !migrationState.isChecking && !migrationState.isProcessing;
    }
  };
}