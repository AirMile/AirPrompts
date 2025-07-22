import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class BackupManager {
  constructor() {
    this.backupDir = path.join(process.cwd(), 'backups');
    this.ensureBackupDirectory();
  }

  /**
   * Ensure backup directory exists
   */
  ensureBackupDirectory() {
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
      console.log(`📁 Created backup directory: ${this.backupDir}`);
    }
  }

  /**
   * Create backup of localStorage data
   * @param {Object} localStorageData - Data from localStorage
   * @returns {string} Backup file path
   */
  createLocalStorageBackup(localStorageData) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `localStorage-backup-${timestamp}.json`;
    const filepath = path.join(this.backupDir, filename);
    
    const backup = {
      timestamp: new Date().toISOString(),
      source: 'localStorage',
      version: '1.0',
      data: localStorageData,
      metadata: {
        itemCounts: {
          templates: this.countItems(localStorageData.templates),
          workflows: this.countItems(localStorageData.workflows),
          folders: this.countItems(localStorageData.folders)
        },
        totalSize: JSON.stringify(localStorageData).length,
        description: 'Complete localStorage backup before migration'
      },
      instructions: {
        restore: [
          '1. Stop the AirPrompts application',
          '2. Open browser developer tools (F12)',
          '3. Go to Application > Local Storage > http://localhost:5173',
          '4. Clear all airprompts_* keys',
          '5. Use the restoration script to restore data',
          '6. Reload the application'
        ]
      }
    };
    
    try {
      fs.writeFileSync(filepath, JSON.stringify(backup, null, 2));
      console.log(`📦 localStorage backup created: ${filename}`);
      console.log(`📊 Backup contains: ${backup.metadata.itemCounts.templates} templates, ${backup.metadata.itemCounts.workflows} workflows, ${backup.metadata.itemCounts.folders} folders`);
      return filepath;
    } catch (error) {
      throw new Error(`Failed to create localStorage backup: ${error.message}`);
    }
  }

  /**
   * Create backup of SQLite database
   * @returns {string} Backup file path
   */
  createDatabaseBackup() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const sourceFile = path.join(process.cwd(), 'server', 'database.db');
    const backupFile = path.join(this.backupDir, `database-backup-${timestamp}.db`);
    const metadataFile = path.join(this.backupDir, `database-backup-${timestamp}.json`);
    
    try {
      if (!fs.existsSync(sourceFile)) {
        throw new Error('Database file not found for backup');
      }

      // Create database file backup
      fs.copyFileSync(sourceFile, backupFile);
      
      // Create metadata file
      const metadata = {
        timestamp: new Date().toISOString(),
        source: 'SQLite Database',
        version: '1.0',
        originalPath: sourceFile,
        backupPath: backupFile,
        fileSize: fs.statSync(backupFile).size,
        description: 'Complete SQLite database backup',
        instructions: {
          restore: [
            '1. Stop the AirPrompts backend server',
            '2. Replace server/database.db with this backup file',
            '3. Restart the backend server',
            '4. Verify data integrity through API endpoints'
          ]
        }
      };

      fs.writeFileSync(metadataFile, JSON.stringify(metadata, null, 2));
      
      console.log(`📦 Database backup created: ${path.basename(backupFile)}`);
      console.log(`📋 Metadata saved: ${path.basename(metadataFile)}`);
      console.log(`💾 Backup size: ${(metadata.fileSize / 1024).toFixed(1)} KB`);
      
      return backupFile;
    } catch (error) {
      throw new Error(`Failed to create database backup: ${error.message}`);
    }
  }

  /**
   * Create complete system backup (both localStorage and database)
   * @param {Object} localStorageData - Data from localStorage
   * @returns {Object} Backup information
   */
  createCompleteBackup(localStorageData) {
    console.log('🔄 Creating complete system backup...');
    
    try {
      const localStorageBackup = this.createLocalStorageBackup(localStorageData);
      const databaseBackup = this.createDatabaseBackup();
      
      const backupInfo = {
        timestamp: new Date().toISOString(),
        backups: {
          localStorage: {
            path: localStorageBackup,
            type: 'localStorage',
            status: 'completed'
          },
          database: {
            path: databaseBackup,
            type: 'SQLite',
            status: 'completed'
          }
        },
        summary: {
          totalBackups: 2,
          backupDirectory: this.backupDir,
          instructions: 'Use individual backup files to restore specific components'
        }
      };
      
      // Save backup summary
      const summaryFile = path.join(this.backupDir, `backup-summary-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
      fs.writeFileSync(summaryFile, JSON.stringify(backupInfo, null, 2));
      
      console.log('✅ Complete system backup created successfully!');
      return backupInfo;
    } catch (error) {
      throw new Error(`Failed to create complete backup: ${error.message}`);
    }
  }

  /**
   * Restore localStorage from backup
   * @param {string} backupFilePath - Path to backup file
   * @returns {Object} Restoration instructions
   */
  restoreLocalStorage(backupFilePath) {
    try {
      if (!fs.existsSync(backupFilePath)) {
        throw new Error(`Backup file not found: ${backupFilePath}`);
      }

      const backup = JSON.parse(fs.readFileSync(backupFilePath, 'utf-8'));
      
      console.log(`🔄 Preparing localStorage restoration from ${path.basename(backupFilePath)}`);
      console.log(`📅 Backup created: ${backup.timestamp}`);
      
      // Generate restoration script
      const restoreScript = this.generateLocalStorageRestoreScript(backup.data);
      const scriptPath = path.join(this.backupDir, `restore-script-${Date.now()}.js`);
      fs.writeFileSync(scriptPath, restoreScript);
      
      return {
        success: true,
        backupInfo: backup.metadata,
        instructions: backup.instructions?.restore || [
          '1. Open browser developer tools',
          '2. Go to Application > Local Storage',
          '3. Clear all airprompts_* keys',
          '4. Run the generated restore script',
          '5. Reload the application'
        ],
        restoreScript: scriptPath,
        data: backup.data
      };
    } catch (error) {
      throw new Error(`Failed to prepare localStorage restoration: ${error.message}`);
    }
  }

  /**
   * Restore database from backup
   * @param {string} backupFilePath - Path to backup database file
   * @returns {Object} Restoration result
   */
  restoreDatabase(backupFilePath) {
    try {
      if (!fs.existsSync(backupFilePath)) {
        throw new Error(`Backup file not found: ${backupFilePath}`);
      }

      const targetFile = path.join(process.cwd(), 'server', 'database.db');
      const backupTargetFile = path.join(process.cwd(), 'server', `database-backup-current-${Date.now()}.db`);
      
      // Create backup of current database if it exists
      if (fs.existsSync(targetFile)) {
        fs.copyFileSync(targetFile, backupTargetFile);
        console.log(`📦 Current database backed up to: ${path.basename(backupTargetFile)}`);
      }
      
      // Restore from backup
      fs.copyFileSync(backupFilePath, targetFile);
      
      console.log(`🔄 Database restored from ${path.basename(backupFilePath)}`);
      
      return {
        success: true,
        restored: targetFile,
        backupOfCurrent: backupTargetFile,
        message: 'Database restored successfully. Restart the server to use restored data.'
      };
    } catch (error) {
      throw new Error(`Failed to restore database: ${error.message}`);
    }
  }

  /**
   * List all available backups
   * @returns {Array} List of backup files
   */
  listBackups() {
    try {
      const files = fs.readdirSync(this.backupDir);
      const backups = {
        localStorage: [],
        database: [],
        summaries: []
      };
      
      files.forEach(file => {
        const filePath = path.join(this.backupDir, file);
        const stats = fs.statSync(filePath);
        
        const fileInfo = {
          name: file,
          path: filePath,
          size: stats.size,
          created: stats.birthtime,
          modified: stats.mtime
        };
        
        if (file.includes('localStorage-backup') && file.endsWith('.json')) {
          backups.localStorage.push(fileInfo);
        } else if (file.includes('database-backup') && file.endsWith('.db')) {
          backups.database.push(fileInfo);
        } else if (file.includes('backup-summary') && file.endsWith('.json')) {
          backups.summaries.push(fileInfo);
        }
      });
      
      // Sort by creation date (newest first)
      Object.keys(backups).forEach(type => {
        backups[type].sort((a, b) => new Date(b.created) - new Date(a.created));
      });
      
      return backups;
    } catch (error) {
      throw new Error(`Failed to list backups: ${error.message}`);
    }
  }

  /**
   * Generate JavaScript code for localStorage restoration
   * @param {Object} data - Data to restore
   * @returns {string} JavaScript code
   */
  generateLocalStorageRestoreScript(data) {
    return `
// AirPrompts localStorage Restoration Script
// Generated on: ${new Date().toISOString()}

console.log('🔄 Starting localStorage restoration...');

// Clear existing data
const keys = Object.keys(localStorage);
const airpromptsKeys = keys.filter(key => key.startsWith('airprompts'));
airpromptsKeys.forEach(key => {
  localStorage.removeItem(key);
  console.log('🗑️ Removed:', key);
});

// Restore data
const data = ${JSON.stringify(data, null, 2)};

// Restore templates
if (data.templates) {
  localStorage.setItem('airprompts_templates', JSON.stringify(data.templates));
  console.log('📄 Restored', data.templates.length, 'templates');
}

// Restore workflows
if (data.workflows) {
  localStorage.setItem('airprompts_workflows', JSON.stringify(data.workflows));
  console.log('⚡ Restored', data.workflows.length, 'workflows');
}

// Restore folders
if (data.folders) {
  localStorage.setItem('airprompts_folders', JSON.stringify(data.folders));
  console.log('📁 Restored', data.folders.length, 'folders');
}

console.log('✅ localStorage restoration completed!');
console.log('🔄 Please reload the application to see restored data.');
`;
  }

  /**
   * Count items in array, handling various formats
   * @param {any} items - Items to count
   * @returns {number} Item count
   */
  countItems(items) {
    if (!items) return 0;
    if (Array.isArray(items)) return items.length;
    if (typeof items === 'string') {
      try {
        const parsed = JSON.parse(items);
        return Array.isArray(parsed) ? parsed.length : 0;
      } catch {
        return 0;
      }
    }
    return 0;
  }

  /**
   * Cleanup old backups (keep only the 10 most recent)
   * @param {number} keepCount - Number of backups to keep
   */
  cleanupOldBackups(keepCount = 10) {
    try {
      const backups = this.listBackups();
      
      Object.keys(backups).forEach(type => {
        const files = backups[type];
        if (files.length > keepCount) {
          const filesToDelete = files.slice(keepCount);
          filesToDelete.forEach(file => {
            fs.unlinkSync(file.path);
            console.log(`🗑️ Deleted old backup: ${file.name}`);
          });
        }
      });
      
      console.log(`🧹 Backup cleanup completed (keeping ${keepCount} most recent)`);
    } catch (error) {
      console.warn(`⚠️  Backup cleanup failed: ${error.message}`);
    }
  }
}

export default BackupManager;