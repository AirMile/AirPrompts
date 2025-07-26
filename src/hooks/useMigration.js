import { useState, useEffect, useCallback } from 'react';
import { dataMigrationService } from '../services/migration/DataMigrationService';
import { compatibilityLayer } from '../services/migration/CompatibilityLayer';
import { backupService } from '../services/migration/BackupService';
import { showNotification } from '../utils/notifications';

/**
 * Hook for managing data migration
 */
export const useMigration = () => {
  const [migrationStatus, setMigrationStatus] = useState({
    isRunning: false,
    progress: 0,
    completed: false,
    error: null,
    needsMigration: null
  });

  // Check if migration is needed
  useEffect(() => {
    const checkMigration = async () => {
      try {
        const status = await dataMigrationService.checkMigrationStatus();
        setMigrationStatus(prev => ({
          ...prev,
          needsMigration: status.needed
        }));
      } catch (error) {
        console.error('Failed to check migration status:', error);
      }
    };

    checkMigration();
  }, []);

  // Start migration
  const startMigration = useCallback(async (options = {}) => {
    if (migrationStatus.isRunning) {
      return;
    }

    setMigrationStatus(prev => ({
      ...prev,
      isRunning: true,
      progress: 0,
      error: null
    }));

    try {
      // Enable dual-read mode
      await compatibilityLayer.setDualReadMode(true);

      // Run migration
      const result = await dataMigrationService.runPendingMigrations();

      if (result.success) {
        setMigrationStatus(prev => ({
          ...prev,
          isRunning: false,
          completed: true,
          progress: 100
        }));

        showNotification({
          type: 'success',
          title: 'Migration Completed',
          message: `Successfully migrated ${result.migratedCount} items`
        });
      } else {
        throw new Error('Migration failed');
      }

    } catch (error) {
      setMigrationStatus(prev => ({
        ...prev,
        isRunning: false,
        error: error.message,
        progress: 0
      }));

      showNotification({
        type: 'error',
        title: 'Migration Failed',
        message: error.message
      });
    }
  }, [migrationStatus.isRunning]);

  // Get progress updates
  useEffect(() => {
    if (!migrationStatus.isRunning) return;

    const interval = setInterval(() => {
      const progress = dataMigrationService.getMigrationProgress();
      setMigrationStatus(prev => ({
        ...prev,
        progress: progress.percentage
      }));
    }, 500);

    return () => clearInterval(interval);
  }, [migrationStatus.isRunning]);

  return {
    ...migrationStatus,
    startMigration
  };
};

/**
 * Hook for using compatibility layer
 */
export const useCompatibleStorage = () => {
  const get = useCallback(async (key, options) => {
    return compatibilityLayer.get(key, options);
  }, []);

  const set = useCallback(async (key, value, options) => {
    return compatibilityLayer.set(key, value, options);
  }, []);

  const save = useCallback(async (collectionKey, entity, options) => {
    return compatibilityLayer.save(collectionKey, entity, options);
  }, []);

  const remove = useCallback(async (collectionKey, entityId, options) => {
    return compatibilityLayer.delete(collectionKey, entityId, options);
  }, []);

  return {
    get,
    set,
    save,
    remove
  };
};

/**
 * Hook for backup management
 */
export const useBackup = () => {
  const [backups, setBackups] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  // Load backup list
  const loadBackups = useCallback(async () => {
    try {
      const list = await backupService.listBackups();
      setBackups(list);
    } catch (error) {
      console.error('Failed to load backups:', error);
    }
  }, []);

  // Load on mount
  useEffect(() => {
    loadBackups();
  }, [loadBackups]);

  // Create backup
  const createBackup = useCallback(async (description) => {
    if (isCreating) return;

    setIsCreating(true);

    try {
      const result = await backupService.createFullBackup(description);

      showNotification({
        type: 'success',
        title: 'Backup Created',
        message: `Backup created successfully (${(result.size / 1024).toFixed(1)}KB)`
      });

      await loadBackups();

    } catch (error) {
      showNotification({
        type: 'error',
        title: 'Backup Failed',
        message: error.message
      });
    } finally {
      setIsCreating(false);
    }
  }, [isCreating, loadBackups]);

  // Restore backup
  const restoreBackup = useCallback(async (backupId) => {
    if (isRestoring) return;

    const confirmed = window.confirm(
      'Are you sure you want to restore this backup? Current data will be replaced.'
    );

    if (!confirmed) return;

    setIsRestoring(true);

    try {
      const result = await backupService.restoreBackup(backupId);

      showNotification({
        type: 'success',
        title: 'Backup Restored',
        message: 'Data has been restored successfully'
      });

      // Reload the page to reflect changes
      window.location.reload();

    } catch (error) {
      showNotification({
        type: 'error',
        title: 'Restore Failed',
        message: error.message
      });
    } finally {
      setIsRestoring(false);
    }
  }, [isRestoring]);

  // Delete backup
  const deleteBackup = useCallback(async (backupId) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this backup?'
    );

    if (!confirmed) return;

    try {
      await backupService.deleteBackup(backupId);

      showNotification({
        type: 'success',
        title: 'Backup Deleted',
        message: 'Backup has been deleted'
      });

      await loadBackups();

    } catch (error) {
      showNotification({
        type: 'error',
        title: 'Delete Failed',
        message: error.message
      });
    }
  }, [loadBackups]);

  // Verify backup
  const verifyBackup = useCallback(async (backupId) => {
    try {
      const result = await backupService.verifyBackup(backupId);

      if (result.valid) {
        showNotification({
          type: 'success',
          title: 'Backup Valid',
          message: `Backup is valid with ${result.itemCount} items`
        });
      } else {
        showNotification({
          type: 'error',
          title: 'Backup Invalid',
          message: result.error || 'Backup validation failed'
        });
      }

    } catch (error) {
      showNotification({
        type: 'error',
        title: 'Verification Failed',
        message: error.message
      });
    }
  }, []);

  return {
    backups,
    isCreating,
    isRestoring,
    createBackup,
    restoreBackup,
    deleteBackup,
    verifyBackup,
    refreshBackups: loadBackups
  };
};

/**
 * Hook for migration statistics
 */
export const useMigrationStats = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const migrationStats = await compatibilityLayer.getMigrationStats();
        const backupList = await backupService.listBackups();

        setStats({
          migration: migrationStats,
          backups: {
            count: backupList.length,
            latest: backupList[0] || null
          }
        });
      } catch (error) {
        console.error('Failed to load migration stats:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();

    // Refresh stats every 5 seconds
    const interval = setInterval(loadStats, 5000);

    return () => clearInterval(interval);
  }, []);

  return {
    stats,
    loading
  };
};