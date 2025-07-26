import { storageFacade } from '../storage/StorageFacade';
import { legacyDataAdapter } from '../storage/LegacyDataAdapter';
import MigrationLogger from './MigrationLogger';
import DataValidator from './DataValidator';
import BackupService from './BackupService';
import { performanceMonitor } from './PerformanceMonitor';

/**
 * DataMigrationService - Handles complete data migration flow
 * 
 * Features:
 * - Progressive migration with minimal user impact
 * - Automatic rollback on failure
 * - Comprehensive validation at each step
 * - Detailed logging and audit trail
 * - Zero-downtime migration support
 */
class DataMigrationService {
  constructor() {
    this.logger = new MigrationLogger();
    this.validator = new DataValidator();
    this.backupService = new BackupService();
    this.isRunning = false;
    this.migrationQueue = [];
    this.completedMigrations = new Set();
    
    // Migration configuration
    this.config = {
      batchSize: 100,
      maxRetries: 3,
      retryDelay: 1000,
      validateAfterMigration: true,
      createBackup: true,
      progressiveMode: true,
      dualReadPeriod: 7 * 24 * 60 * 60 * 1000, // 7 days
    };
    
    // Available migrations (version -> migration function)
    this.migrations = new Map([
      ['1.0.0', this.migrateV1ToV2.bind(this)],
      ['2.0.0', this.migrateV2ToV3.bind(this)],
      ['3.0.0', this.migrateV3ToCurrent.bind(this)],
    ]);
  }

  /**
   * Run all pending migrations
   */
  async runPendingMigrations() {
    if (this.isRunning) {
      this.logger.warn('Migration already in progress');
      return { success: false, reason: 'Already running' };
    }

    this.isRunning = true;
    const monitor = performanceMonitor.startOperation('full_migration', {
      type: 'migration',
      scope: 'full'
    });
    
    try {
      this.logger.info('Starting data migration process');
      
      // Check migration status
      monitor.mark('status_check_start');
      const status = await this.checkMigrationStatus();
      monitor.mark('status_check_complete');
      
      if (!status.needed) {
        this.logger.info('No migrations needed');
        monitor.end({ success: true, migratedCount: 0 });
        return { success: true, migratedCount: 0 };
      }
      
      // Create backup if configured
      if (this.config.createBackup) {
        monitor.mark('backup_start');
        await this.createBackup();
        monitor.mark('backup_complete');
      }
      
      // Get pending migrations
      monitor.mark('get_migrations_start');
      const pendingMigrations = await this.getPendingMigrations();
      this.logger.info(`Found ${pendingMigrations.length} pending migrations`);
      monitor.mark('get_migrations_complete');
      
      // Run migrations
      monitor.mark('execute_migrations_start');
      const results = await this.executeMigrations(pendingMigrations);
      monitor.mark('execute_migrations_complete');
      
      // Validate results
      monitor.mark('validation_start');
      const validation = await this.validateMigrationResults(results);
      monitor.mark('validation_complete');
      
      if (!validation.success) {
        throw new Error('Migration validation failed');
      }
      
      // Record completion
      monitor.mark('record_completion_start');
      await this.recordMigrationCompletion(results);
      monitor.mark('record_completion_complete');
      
      const metrics = monitor.end({
        success: true,
        migratedCount: results.filter(r => r.success).length,
        totalItems: results.reduce((sum, r) => sum + (r.result?.itemCount || 0), 0)
      });
      
      this.logger.info(`Migration completed successfully in ${metrics.duration.toFixed(2)}ms`);
      
      return {
        success: true,
        results,
        duration: metrics.duration,
        migratedCount: results.filter(r => r.success).length,
        performanceMetrics: metrics
      };
      
    } catch (error) {
      this.logger.error('Migration failed', error);
      monitor.end({ success: false, error: error.message });
      
      // Attempt rollback
      if (this.config.createBackup) {
        await this.rollback();
      }
      
      throw error;
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Check if migration is needed
   */
  async checkMigrationStatus() {
    const currentVersion = await storageFacade.get('schema_version') || '1.0.0';
    const targetVersion = '3.0.0'; // Current schema version
    
    // Check for legacy data
    const legacyStatus = await legacyDataAdapter.checkMigrationStatus();
    
    return {
      needed: currentVersion !== targetVersion || legacyStatus.needed,
      currentVersion,
      targetVersion,
      legacyKeys: legacyStatus.keys
    };
  }

  /**
   * Get list of pending migrations
   */
  async getPendingMigrations() {
    const currentVersion = await storageFacade.get('schema_version') || '1.0.0';
    const migrations = [];
    
    // Add version migrations
    for (const [version, migration] of this.migrations) {
      if (this.isVersionNewer(version, currentVersion)) {
        migrations.push({
          type: 'version',
          version,
          migration
        });
      }
    }
    
    // Add legacy data migrations
    const legacyStatus = await legacyDataAdapter.checkMigrationStatus();
    if (legacyStatus.needed) {
      migrations.push({
        type: 'legacy',
        keys: legacyStatus.keys,
        migration: this.migrateLegacyData.bind(this)
      });
    }
    
    return migrations;
  }

  /**
   * Execute migrations
   */
  async executeMigrations(migrations) {
    const results = [];
    
    for (const migration of migrations) {
      const result = await this.executeSingleMigration(migration);
      results.push(result);
      
      if (!result.success && !this.config.progressiveMode) {
        // Stop on first failure in non-progressive mode
        break;
      }
    }
    
    return results;
  }

  /**
   * Execute single migration with retry logic
   */
  async executeSingleMigration(migration) {
    const operationId = `migration_${migration.type}_${migration.version || 'legacy'}`;
    const monitor = performanceMonitor.startOperation(operationId, {
      type: 'single_migration',
      migrationtype: migration.type,
      version: migration.version
    });
    
    let lastError = null;
    
    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        this.logger.info(`Executing migration: ${migration.type} v${migration.version || 'legacy'} (attempt ${attempt})`);
        
        monitor.mark(`attempt_${attempt}_start`);
        
        // Run the migration
        const result = await migration.migration();
        
        monitor.mark(`attempt_${attempt}_complete`);
        
        // Validate if configured
        if (this.config.validateAfterMigration) {
          monitor.mark('validation_start');
          await this.validateMigrationData(migration.type, result);
          monitor.mark('validation_complete');
        }
        
        const metrics = monitor.end({
          success: true,
          attempt,
          itemCount: result?.itemCount || result?.migrated?.length || 0
        });
        
        return {
          success: true,
          type: migration.type,
          version: migration.version,
          duration: metrics.duration,
          result,
          performanceMetrics: metrics
        };
        
      } catch (error) {
        lastError = error;
        this.logger.error(`Migration attempt ${attempt} failed:`, error);
        
        monitor.mark(`attempt_${attempt}_failed`);
        
        if (attempt < this.config.maxRetries) {
          await this.delay(this.config.retryDelay * attempt);
        }
      }
    }
    
    // All attempts failed
    const metrics = monitor.end({
      success: false,
      error: lastError.message,
      attempts: this.config.maxRetries
    });
    
    return {
      success: false,
      type: migration.type,
      version: migration.version,
      duration: metrics.duration,
      error: lastError,
      performanceMetrics: metrics
    };
  }

  /**
   * Migrate legacy data
   */
  async migrateLegacyData() {
    this.logger.info('Starting legacy data migration');
    
    const result = await legacyDataAdapter.migrateAll();
    
    this.logger.info('Legacy migration completed', {
      migrated: result.migrated.length,
      failed: result.failed.length,
      skipped: result.skipped.length
    });
    
    if (result.failed.length > 0) {
      throw new Error(`Failed to migrate ${result.failed.length} items`);
    }
    
    return result;
  }

  /**
   * Version-specific migrations
   */
  async migrateV1ToV2() {
    this.logger.info('Migrating from v1.0.0 to v2.0.0');
    
    // Add folder support to all items
    const itemTypes = ['templates', 'workflows', 'snippets'];
    
    for (const type of itemTypes) {
      const items = await storageFacade.get(type) || [];
      const migrated = items.map(item => ({
        ...item,
        folderId: item.folderId || null,
        folderIds: item.folderIds || [],
        tags: item.tags || []
      }));
      
      await storageFacade.set(type, migrated);
    }
    
    // Migrate UI preferences
    const uiPrefs = await storageFacade.get('ui_preferences') || {};
    await storageFacade.set('ui_preferences', {
      ...uiPrefs,
      defaultFolderId: null,
      expandedFolders: []
    });
    
    return { itemTypes: itemTypes.length };
  }

  async migrateV2ToV3() {
    this.logger.info('Migrating from v2.0.0 to v3.0.0');
    
    // Add context support
    const templates = await storageFacade.get('templates') || [];
    const migrated = templates.map(template => ({
      ...template,
      context: template.context || '',
      contextEnabled: false
    }));
    
    await storageFacade.set('templates', migrated);
    
    // Add performance settings
    const settings = await storageFacade.get('user_settings') || {};
    await storageFacade.set('user_settings', {
      ...settings,
      performance: {
        enableVirtualization: true,
        enableLazyLoading: true,
        cacheSize: 100
      }
    });
    
    return { templatesCount: migrated.length };
  }

  async migrateV3ToCurrent() {
    this.logger.info('Migrating from v3.0.0 to current');
    
    // Add advanced features
    const templates = await storageFacade.get('templates') || [];
    const workflows = await storageFacade.get('workflows') || [];
    
    // Add version history support
    const migratedTemplates = templates.map(template => ({
      ...template,
      version: 1,
      versionHistory: [],
      collaborators: []
    }));
    
    const migratedWorkflows = workflows.map(workflow => ({
      ...workflow,
      version: 1,
      versionHistory: [],
      automationEnabled: false
    }));
    
    await storageFacade.set('templates', migratedTemplates);
    await storageFacade.set('workflows', migratedWorkflows);
    
    return {
      templatesCount: migratedTemplates.length,
      workflowsCount: migratedWorkflows.length
    };
  }

  /**
   * Validate migration data
   */
  async validateMigrationData(type, data) {
    const schemas = {
      templates: {
        required: ['id', 'name', 'content', 'category'],
        types: {
          id: 'string',
          name: 'string',
          content: 'string',
          category: 'string',
          folderId: ['string', 'null'],
          folderIds: 'array',
          tags: 'array',
          favorite: 'boolean',
          version: 'number'
        }
      },
      workflows: {
        required: ['id', 'name', 'steps', 'category'],
        types: {
          id: 'string',
          name: 'string',
          steps: 'array',
          category: 'string',
          version: 'number'
        }
      }
    };
    
    // Use validator to check data
    const isValid = await this.validator.validateData(type, data, schemas[type]);
    
    if (!isValid) {
      throw new Error(`Validation failed for ${type} migration`);
    }
  }

  /**
   * Validate migration results
   */
  async validateMigrationResults(results) {
    const failed = results.filter(r => !r.success);
    
    if (failed.length > 0) {
      this.logger.error(`${failed.length} migrations failed`);
      return {
        success: false,
        failedCount: failed.length,
        errors: failed.map(f => f.error)
      };
    }
    
    // Perform data integrity checks
    const integrityCheck = await this.performIntegrityCheck();
    
    return {
      success: integrityCheck.valid,
      failedCount: 0,
      integrity: integrityCheck
    };
  }

  /**
   * Perform data integrity check
   */
  async performIntegrityCheck() {
    const checks = {
      templates: await this.checkEntityIntegrity('templates'),
      workflows: await this.checkEntityIntegrity('workflows'),
      snippets: await this.checkEntityIntegrity('snippets'),
      references: await this.checkReferentialIntegrity()
    };
    
    const valid = Object.values(checks).every(check => check.valid);
    
    return {
      valid,
      checks,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Check entity integrity
   */
  async checkEntityIntegrity(type) {
    const items = await storageFacade.get(type) || [];
    const issues = [];
    
    for (const item of items) {
      // Check for required fields
      if (!item.id || !item.name) {
        issues.push({ itemId: item.id, issue: 'Missing required fields' });
      }
      
      // Check for duplicates
      const duplicates = items.filter(i => i.id === item.id);
      if (duplicates.length > 1) {
        issues.push({ itemId: item.id, issue: 'Duplicate ID found' });
      }
    }
    
    return {
      valid: issues.length === 0,
      itemCount: items.length,
      issues
    };
  }

  /**
   * Check referential integrity
   */
  async checkReferentialIntegrity() {
    const templates = await storageFacade.get('templates') || [];
    const workflows = await storageFacade.get('workflows') || [];
    const folders = await storageFacade.get('folders') || [];
    const issues = [];
    
    // Check folder references
    const folderIds = new Set(folders.map(f => f.id));
    
    for (const template of templates) {
      if (template.folderId && !folderIds.has(template.folderId)) {
        issues.push({
          type: 'template',
          id: template.id,
          issue: `Invalid folder reference: ${template.folderId}`
        });
      }
    }
    
    // Check workflow template references
    const templateIds = new Set(templates.map(t => t.id));
    
    for (const workflow of workflows) {
      for (const step of workflow.steps || []) {
        if (step.templateId && !templateIds.has(step.templateId)) {
          issues.push({
            type: 'workflow',
            id: workflow.id,
            issue: `Invalid template reference: ${step.templateId}`
          });
        }
      }
    }
    
    return {
      valid: issues.length === 0,
      issues
    };
  }

  /**
   * Create backup before migration
   */
  async createBackup() {
    this.logger.info('Creating backup before migration');
    
    const backup = await this.backupService.createFullBackup();
    
    this.logger.info(`Backup created: ${backup.id}`);
    
    return backup;
  }

  /**
   * Rollback to previous state
   */
  async rollback() {
    this.logger.warn('Rolling back migration');
    
    try {
      const latestBackup = await this.backupService.getLatestBackup();
      
      if (!latestBackup) {
        throw new Error('No backup available for rollback');
      }
      
      await this.backupService.restoreBackup(latestBackup.id);
      
      this.logger.info('Rollback completed successfully');
      
    } catch (error) {
      this.logger.error('Rollback failed:', error);
      throw error;
    }
  }

  /**
   * Record migration completion
   */
  async recordMigrationCompletion(results) {
    const migrationRecord = {
      timestamp: new Date().toISOString(),
      version: '3.0.0',
      results: results.map(r => ({
        type: r.type,
        version: r.version,
        success: r.success,
        duration: r.duration
      })),
      totalDuration: results.reduce((sum, r) => sum + r.duration, 0)
    };
    
    // Update schema version
    await storageFacade.set('schema_version', '3.0.0');
    
    // Save migration history
    const history = await storageFacade.get('migration_history') || [];
    history.push(migrationRecord);
    await storageFacade.set('migration_history', history);
    
    this.logger.info('Migration completion recorded');
  }

  /**
   * Utility methods
   */
  isVersionNewer(version1, version2) {
    const v1Parts = version1.split('.').map(Number);
    const v2Parts = version2.split('.').map(Number);
    
    for (let i = 0; i < 3; i++) {
      if (v1Parts[i] > v2Parts[i]) return true;
      if (v1Parts[i] < v2Parts[i]) return false;
    }
    
    return false;
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Progressive migration methods
   */
  async startProgressiveMigration() {
    if (!this.config.progressiveMode) {
      throw new Error('Progressive mode is not enabled');
    }
    
    this.logger.info('Starting progressive migration');
    
    // Queue all pending migrations
    const pendingMigrations = await this.getPendingMigrations();
    this.migrationQueue = [...pendingMigrations];
    
    // Start processing queue
    this.processQueue();
  }

  async processQueue() {
    while (this.migrationQueue.length > 0) {
      const batch = this.migrationQueue.splice(0, this.config.batchSize);
      
      await Promise.all(
        batch.map(migration => this.executeSingleMigration(migration))
      );
      
      // Pause between batches to reduce load
      await this.delay(100);
    }
  }

  /**
   * Get migration progress
   */
  getMigrationProgress() {
    const total = this.migrationQueue.length + this.completedMigrations.size;
    const completed = this.completedMigrations.size;
    
    return {
      total,
      completed,
      remaining: this.migrationQueue.length,
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
      isRunning: this.isRunning
    };
  }
}

// Export singleton instance
export const dataMigrationService = new DataMigrationService();

// Also export class for testing
export default DataMigrationService;