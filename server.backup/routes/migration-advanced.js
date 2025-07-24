import express from 'express';
import MigrationRunner from '../migrations/migration-runner.js';
import BackupManager from '../migrations/backup-manager.js';

const router = express.Router();

// Lazy initialization of migration components
let migrationRunner = null;
let backupManager = null;

const initializeMigrationComponents = () => {
  if (!migrationRunner) {
    migrationRunner = new MigrationRunner();
  }
  if (!backupManager) {
    backupManager = new BackupManager();
  }
};

/**
 * POST /api/migrate-advanced/preview
 * Preview migration without executing
 */
router.post('/preview', async (req, res) => {
  try {
    initializeMigrationComponents();
    const { localStorageData } = req.body;
    
    if (!localStorageData) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_DATA',
          message: 'localStorage data is required'
        }
      });
    }

    const result = await migrationRunner.runMigrationWithUser(localStorageData);
    
    res.json({
      success: true,
      data: result,
      meta: {
        timestamp: new Date().toISOString(),
        endpoint: '/api/migrate-advanced/preview'
      }
    });
    
  } catch (error) {
    console.error('Migration preview failed:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'PREVIEW_FAILED',
        message: error.message
      },
      meta: {
        timestamp: new Date().toISOString()
      }
    });
  }
});

/**
 * POST /api/migrate-advanced/execute
 * Execute migration after preview approval
 */
router.post('/execute', async (req, res) => {
  try {
    initializeMigrationComponents();
    const { localStorageData, backupInfo } = req.body;
    
    if (!localStorageData) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_DATA',
          message: 'localStorage data is required'
        }
      });
    }

    const result = await migrationRunner.executeMigration(localStorageData, backupInfo);
    
    res.json({
      success: true,
      data: result,
      meta: {
        timestamp: new Date().toISOString(),
        endpoint: '/api/migrate-advanced/execute'
      }
    });
    
  } catch (error) {
    console.error('Migration execution failed:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'MIGRATION_FAILED',
        message: error.message,
        details: process.env.NODE_ENV !== 'production' ? error.stack : undefined
      },
      meta: {
        timestamp: new Date().toISOString()
      }
    });
  }
});

/**
 * GET /api/migrate-advanced/backups
 * List available backup files
 */
router.get('/backups', async (req, res) => {
  try {
    initializeMigrationComponents();
    const backups = backupManager.listBackups();
    
    res.json({
      success: true,
      data: {
        backups,
        summary: {
          localStorage: backups.localStorage.length,
          database: backups.database.length,
          summaries: backups.summaries.length,
          total: backups.localStorage.length + backups.database.length + backups.summaries.length
        }
      },
      meta: {
        timestamp: new Date().toISOString(),
        endpoint: '/api/migrate-advanced/backups'
      }
    });
    
  } catch (error) {
    console.error('Backup listing failed:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'BACKUP_LIST_FAILED',
        message: error.message
      },
      meta: {
        timestamp: new Date().toISOString()
      }
    });
  }
});

export default router;