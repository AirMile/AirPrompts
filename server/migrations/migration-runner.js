import LocalStorageMigrator from './migrate-from-localstorage.js';
import BackupManager from './backup-manager.js';
import { getDatabase } from '../database.js';

/**
 * Interactive Migration Runner
 * Provides safe, step-by-step migration with user validation
 */
class MigrationRunner {
  constructor() {
    this.migrator = new LocalStorageMigrator();
    this.backupManager = new BackupManager();
    this.db = getDatabase();
  }

  /**
   * Run complete migration process with user guidance
   * @param {Object|string} localStorageData - Raw localStorage data
   * @returns {Object} Migration result
   */
  async runMigrationWithUser(localStorageData) {
    console.log('🎯 Starting user-guided migration process...');
    console.log('=' .repeat(60));
    
    let backupInfo = null;
    
    try {
      // Step 1: Validate input data
      console.log('\\n📋 Step 1: Validating input data');
      const preview = this.migrator.previewMigration(localStorageData);
      
      console.log(`Found: ${preview.templates} templates, ${preview.workflows} workflows, ${preview.folders} folders`);
      console.log(`Total items to migrate: ${preview.totalItems}`);
      
      if (preview.totalItems === 0) {
        throw new Error('No data found to migrate');
      }

      // Step 2: Create backups
      console.log('\\n💾 Step 2: Creating system backups...');
      backupInfo = this.backupManager.createCompleteBackup(localStorageData);
      
      console.log('✅ Backups created successfully!');
      console.log(`- localStorage backup: ${backupInfo.backups.localStorage.path}`);
      console.log(`- Database backup: ${backupInfo.backups.database.path}`);
      
      // Step 3: Preview migration changes
      console.log('\\n🔍 Step 3: Migration preview:');
      this.displayMigrationPreview(preview);
      
      console.log('\\n⚠️  MIGRATION READY - User validation required');
      console.log('User should validate preview and approve before proceeding');
      
      return {
        step: 'preview_ready',
        preview,
        backupInfo,
        message: 'Migration preview ready. User validation required to proceed.',
        nextSteps: [
          'Review migration preview carefully',
          'Verify backup files were created',
          'Call executeMigration() to proceed with migration',
          'Or call rollback() to cancel and restore backups'
        ]
      };
      
    } catch (error) {
      console.error('❌ Migration preparation failed:', error);
      throw error;
    }
  }

  /**
   * Execute the actual migration (called after user approves preview)
   * @param {Object|string} localStorageData - Raw localStorage data
   * @param {Object} backupInfo - Backup information from preview step
   * @returns {Object} Migration result
   */
  async executeMigration(localStorageData, backupInfo) {
    console.log('\\n🚀 Step 4: Executing migration...');
    console.log('=' .repeat(60));
    
    try {
      // Execute migration
      const result = await this.migrator.migrate(localStorageData);
      
      // Step 5: Validation
      console.log('\\n✅ Step 5: Migration completed!');
      this.displayMigrationResults(result);
      
      return {
        step: 'completed',
        success: true,
        result,
        backupInfo,
        message: 'Migration completed successfully!',
        nextSteps: [
          'Restart the frontend application',
          'Test all functionality with migrated data',
          'Verify no data loss occurred',
          'Keep backups safe until system is fully validated'
        ]
      };
      
    } catch (error) {
      console.error('❌ Migration execution failed:', error);
      console.log('\\n🔄 Backups available for restoration:');
      if (backupInfo) {
        console.log(`- localStorage: ${backupInfo.backups.localStorage.path}`);
        console.log(`- Database: ${backupInfo.backups.database.path}`);
      }
      
      throw error;
    }
  }

  /**
   * Rollback migration using backups
   * @param {Object} backupInfo - Backup information
   * @returns {Object} Rollback result
   */
  async rollbackMigration(backupInfo) {
    console.log('\\n🔄 Rolling back migration...');
    
    try {
      let results = {};
      
      // Restore database if backup exists
      if (backupInfo?.backups?.database?.path) {
        results.database = this.backupManager.restoreDatabase(backupInfo.backups.database.path);
      }
      
      // Prepare localStorage restoration if backup exists
      if (backupInfo?.backups?.localStorage?.path) {
        results.localStorage = this.backupManager.restoreLocalStorage(backupInfo.backups.localStorage.path);
      }
      
      console.log('✅ Rollback completed!');
      
      return {
        success: true,
        results,
        message: 'Migration rolled back successfully',
        instructions: [
          'Database has been restored to pre-migration state',
          'Use provided script to restore localStorage data',
          'Restart both frontend and backend applications',
          'System should be back to original state'
        ]
      };
      
    } catch (error) {
      throw new Error(`Rollback failed: ${error.message}`);
    }
  }

  /**
   * Display migration preview information
   * @param {Object} preview - Migration preview data
   */
  displayMigrationPreview(preview) {
    console.log('┌─ Migration Preview ─────────────────────────┐');
    console.log(`│ Templates: ${preview.templates.toString().padEnd(31)} │`);
    console.log(`│ Workflows: ${preview.workflows.toString().padEnd(31)} │`);
    console.log(`│ Folders:   ${preview.folders.toString().padEnd(31)} │`);
    console.log(`│ Total:     ${preview.totalItems.toString().padEnd(31)} │`);
    console.log('└─────────────────────────────────────────────┘');
    
    if (preview.preview.templates.length > 0) {
      console.log('\\nTemplate samples:');
      preview.preview.templates.forEach((t, i) => 
        console.log(`  ${i + 1}. ${t.name} (${t.id})`)
      );
    }
    
    if (preview.preview.workflows.length > 0) {
      console.log('\\nWorkflow samples:');
      preview.preview.workflows.forEach((w, i) => 
        console.log(`  ${i + 1}. ${w.name} (${w.id})`)
      );
    }
    
    if (preview.preview.folders.length > 0) {
      console.log('\\nFolder samples:');
      preview.preview.folders.forEach((f, i) => 
        console.log(`  ${i + 1}. ${f.name} (${f.id})`)
      );
    }
  }

  /**
   * Display migration results
   * @param {Object} result - Migration result
   */
  displayMigrationResults(result) {
    console.log('┌─ Migration Results ─────────────────────────┐');
    console.log(`│ Success Rate: ${result.summary.successRate}%`.padEnd(44) + ' │');
    console.log(`│ Total Found:  ${result.summary.totalFound}`.padEnd(44) + ' │');
    console.log(`│ Migrated:     ${result.summary.totalMigrated}`.padEnd(44) + ' │');
    console.log(`│ Errors:       ${result.summary.totalErrors}`.padEnd(44) + ' │');
    console.log('└─────────────────────────────────────────────┘');
    
    console.log('\\nDetailed Stats:');
    console.log(`📄 Templates: ${result.stats.templates.migrated}/${result.stats.templates.found} (${result.stats.templates.errors} errors)`);
    console.log(`⚡ Workflows: ${result.stats.workflows.migrated}/${result.stats.workflows.found} (${result.stats.workflows.errors} errors)`);
    console.log(`📁 Folders:   ${result.stats.folders.migrated}/${result.stats.folders.found} (${result.stats.folders.errors} errors)`);
    
    if (result.errors.length > 0) {
      console.log('\\n⚠️  Errors encountered:');
      result.errors.forEach((error, i) => 
        console.log(`  ${i + 1}. ${error}`)
      );
    }
  }

  /**
   * Get current database statistics
   * @returns {Object} Database stats
   */
  getDatabaseStats() {
    try {
      return {
        templates: this.db.prepare('SELECT COUNT(*) as count FROM templates').get().count,
        workflows: this.db.prepare('SELECT COUNT(*) as count FROM workflows').get().count,
        folders: this.db.prepare('SELECT COUNT(*) as count FROM folders').get().count,
        workflowSteps: this.db.prepare('SELECT COUNT(*) as count FROM workflow_steps').get().count
      };
    } catch (error) {
      throw new Error(`Failed to get database stats: ${error.message}`);
    }
  }

  /**
   * Validate database integrity
   * @returns {Object} Validation result
   */
  validateDatabaseIntegrity() {
    try {
      const checks = [];
      
      // Check for orphaned templates
      const orphanedTemplates = this.db.prepare(`
        SELECT COUNT(*) as count 
        FROM templates t 
        WHERE t.folder_id IS NOT NULL 
        AND NOT EXISTS (SELECT 1 FROM folders f WHERE f.id = t.folder_id)
      `).get().count;
      
      checks.push({
        check: 'Orphaned Templates',
        passed: orphanedTemplates === 0,
        count: orphanedTemplates
      });
      
      // Check for orphaned workflows
      const orphanedWorkflows = this.db.prepare(`
        SELECT COUNT(*) as count 
        FROM workflows w 
        WHERE w.folder_id IS NOT NULL 
        AND NOT EXISTS (SELECT 1 FROM folders f WHERE f.id = w.folder_id)
      `).get().count;
      
      checks.push({
        check: 'Orphaned Workflows',
        passed: orphanedWorkflows === 0,
        count: orphanedWorkflows
      });
      
      // Check for orphaned workflow steps
      const orphanedSteps = this.db.prepare(`
        SELECT COUNT(*) as count 
        FROM workflow_steps ws 
        WHERE NOT EXISTS (SELECT 1 FROM workflows w WHERE w.id = ws.workflow_id)
        OR NOT EXISTS (SELECT 1 FROM templates t WHERE t.id = ws.template_id)
      `).get().count;
      
      checks.push({
        check: 'Orphaned Workflow Steps',
        passed: orphanedSteps === 0,
        count: orphanedSteps
      });
      
      const allPassed = checks.every(check => check.passed);
      
      return {
        passed: allPassed,
        checks,
        message: allPassed ? 'Database integrity validated successfully' : 'Database integrity issues found'
      };
      
    } catch (error) {
      throw new Error(`Database integrity validation failed: ${error.message}`);
    }
  }
}

export default MigrationRunner;