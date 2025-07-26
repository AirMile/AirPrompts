import { storageFacade } from '../storage/StorageFacade';
import { indexedDBAdapter } from '../storage/IndexedDBAdapter';

/**
 * BackupService - Handles data backup and restore operations
 * 
 * Features:
 * - Full and incremental backups
 * - Compression for space efficiency
 * - Encrypted backup option
 * - Multiple backup retention
 * - Fast restore capabilities
 */
class BackupService {
  constructor() {
    this.maxBackups = 5;
    this.compressionEnabled = true;
    this.encryptionEnabled = false; // Can be enabled with encryption key
    
    // Backup metadata storage
    this.backupMetadataKey = 'backup_metadata';
    
    // Data keys to backup
    this.dataKeys = [
      'templates',
      'workflows',
      'snippets',
      'folders',
      'tags',
      'ui_preferences',
      'user_settings',
      'recent_items',
      'favorites'
    ];
  }

  /**
   * Create a full backup of all data
   */
  async createFullBackup(description = 'Manual backup') {
    const startTime = Date.now();
    
    try {
      // Generate backup ID
      const backupId = this.generateBackupId();
      
      // Collect all data
      const data = await this.collectData();
      
      // Calculate data size
      const dataSize = this.calculateDataSize(data);
      
      // Compress if enabled
      let backupData = data;
      if (this.compressionEnabled) {
        backupData = await this.compressData(data);
      }
      
      // Encrypt if enabled
      if (this.encryptionEnabled) {
        backupData = await this.encryptData(backupData);
      }
      
      // Create backup object
      const backup = {
        id: backupId,
        type: 'full',
        timestamp: new Date().toISOString(),
        description,
        dataKeys: Object.keys(data),
        originalSize: dataSize,
        compressedSize: this.calculateDataSize(backupData),
        compressed: this.compressionEnabled,
        encrypted: this.encryptionEnabled,
        version: await this.getSchemaVersion(),
        data: backupData
      };
      
      // Store backup
      await this.storeBackup(backup);
      
      // Clean up old backups
      await this.cleanupOldBackups();
      
      const duration = Date.now() - startTime;
      
      return {
        id: backupId,
        size: backup.compressedSize,
        duration,
        itemCount: this.countItems(data)
      };
      
    } catch (error) {
      console.error('Backup creation failed:', error);
      throw new Error(`Failed to create backup: ${error.message}`);
    }
  }

  /**
   * Create an incremental backup (only changed data)
   */
  async createIncrementalBackup(sinceBackupId = null) {
    const lastBackup = sinceBackupId 
      ? await this.getBackup(sinceBackupId)
      : await this.getLatestBackup();
    
    if (!lastBackup) {
      // No previous backup, create full backup
      return this.createFullBackup('Initial incremental backup');
    }
    
    const changes = await this.detectChanges(lastBackup);
    
    if (Object.keys(changes).length === 0) {
      return {
        id: null,
        message: 'No changes detected since last backup'
      };
    }
    
    const backupId = this.generateBackupId();
    
    const backup = {
      id: backupId,
      type: 'incremental',
      baseBackupId: lastBackup.id,
      timestamp: new Date().toISOString(),
      description: 'Incremental backup',
      changes,
      version: await this.getSchemaVersion()
    };
    
    await this.storeBackup(backup);
    
    return {
      id: backupId,
      changedKeys: Object.keys(changes),
      baseBackupId: lastBackup.id
    };
  }

  /**
   * Restore data from backup
   */
  async restoreBackup(backupId, options = {}) {
    const backup = await this.getBackup(backupId);
    
    if (!backup) {
      throw new Error(`Backup not found: ${backupId}`);
    }
    
    try {
      // Create a safety backup before restore
      if (options.createSafetyBackup !== false) {
        await this.createFullBackup('Pre-restore safety backup');
      }
      
      let dataToRestore = backup.data;
      
      // Decrypt if needed
      if (backup.encrypted) {
        dataToRestore = await this.decryptData(dataToRestore);
      }
      
      // Decompress if needed
      if (backup.compressed) {
        dataToRestore = await this.decompressData(dataToRestore);
      }
      
      // Handle incremental restore
      if (backup.type === 'incremental') {
        dataToRestore = await this.reconstructFromIncremental(backup);
      }
      
      // Restore data
      await this.restoreData(dataToRestore, options);
      
      return {
        success: true,
        restoredKeys: Object.keys(dataToRestore),
        backupId,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('Restore failed:', error);
      throw new Error(`Failed to restore backup: ${error.message}`);
    }
  }

  /**
   * Get list of available backups
   */
  async listBackups() {
    const metadata = await storageFacade.get(this.backupMetadataKey) || [];
    
    return metadata.map(backup => ({
      id: backup.id,
      type: backup.type,
      timestamp: backup.timestamp,
      description: backup.description,
      size: backup.compressedSize || backup.originalSize,
      dataKeys: backup.dataKeys,
      version: backup.version
    }));
  }

  /**
   * Get specific backup
   */
  async getBackup(backupId) {
    // Try IndexedDB first (for large backups)
    let backup = await indexedDBAdapter.get(`backup_${backupId}`);
    
    if (!backup) {
      // Fallback to regular storage
      backup = await storageFacade.get(`backup_${backupId}`);
    }
    
    return backup;
  }

  /**
   * Get latest backup
   */
  async getLatestBackup() {
    const backups = await this.listBackups();
    
    if (backups.length === 0) {
      return null;
    }
    
    // Sort by timestamp descending
    backups.sort((a, b) => 
      new Date(b.timestamp) - new Date(a.timestamp)
    );
    
    return this.getBackup(backups[0].id);
  }

  /**
   * Delete a backup
   */
  async deleteBackup(backupId) {
    // Remove from storage
    await Promise.all([
      storageFacade.delete(`backup_${backupId}`),
      indexedDBAdapter.delete(`backup_${backupId}`)
    ]);
    
    // Update metadata
    const metadata = await storageFacade.get(this.backupMetadataKey) || [];
    const updated = metadata.filter(backup => backup.id !== backupId);
    await storageFacade.set(this.backupMetadataKey, updated);
    
    return { deleted: true, backupId };
  }

  /**
   * Verify backup integrity
   */
  async verifyBackup(backupId) {
    const backup = await this.getBackup(backupId);
    
    if (!backup) {
      return { valid: false, error: 'Backup not found' };
    }
    
    try {
      // Verify data can be decompressed/decrypted
      let data = backup.data;
      
      if (backup.encrypted) {
        data = await this.decryptData(data);
      }
      
      if (backup.compressed) {
        data = await this.decompressData(data);
      }
      
      // Verify data structure
      const validation = this.validateBackupData(data);
      
      return {
        valid: validation.valid,
        errors: validation.errors,
        dataKeys: Object.keys(data),
        itemCount: this.countItems(data)
      };
      
    } catch (error) {
      return {
        valid: false,
        error: error.message
      };
    }
  }

  /**
   * Private helper methods
   */
  
  async collectData() {
    const data = {};
    
    for (const key of this.dataKeys) {
      const value = await storageFacade.get(key);
      if (value !== null) {
        data[key] = value;
      }
    }
    
    return data;
  }

  async storeBackup(backup) {
    const backupKey = `backup_${backup.id}`;
    
    // Store in IndexedDB for large backups
    if (backup.compressedSize > 100 * 1024) { // > 100KB
      await indexedDBAdapter.set(backupKey, backup);
    } else {
      await storageFacade.set(backupKey, backup);
    }
    
    // Update metadata
    const metadata = await storageFacade.get(this.backupMetadataKey) || [];
    metadata.push({
      id: backup.id,
      type: backup.type,
      timestamp: backup.timestamp,
      description: backup.description,
      dataKeys: backup.dataKeys,
      originalSize: backup.originalSize,
      compressedSize: backup.compressedSize,
      version: backup.version
    });
    
    await storageFacade.set(this.backupMetadataKey, metadata);
  }

  async cleanupOldBackups() {
    const backups = await this.listBackups();
    
    if (backups.length <= this.maxBackups) {
      return;
    }
    
    // Sort by timestamp descending
    backups.sort((a, b) => 
      new Date(b.timestamp) - new Date(a.timestamp)
    );
    
    // Delete oldest backups
    const toDelete = backups.slice(this.maxBackups);
    
    for (const backup of toDelete) {
      await this.deleteBackup(backup.id);
    }
  }

  async detectChanges(lastBackup) {
    const currentData = await this.collectData();
    const lastData = lastBackup.data;
    
    const changes = {};
    
    for (const key of this.dataKeys) {
      const current = currentData[key];
      const last = lastData[key];
      
      if (JSON.stringify(current) !== JSON.stringify(last)) {
        changes[key] = current;
      }
    }
    
    return changes;
  }

  async reconstructFromIncremental(incrementalBackup) {
    // Get base backup
    const baseBackup = await this.getBackup(incrementalBackup.baseBackupId);
    
    if (!baseBackup) {
      throw new Error('Base backup not found for incremental restore');
    }
    
    // Start with base data
    let data = { ...baseBackup.data };
    
    // Apply changes
    for (const [key, value] of Object.entries(incrementalBackup.changes)) {
      data[key] = value;
    }
    
    return data;
  }

  async restoreData(data, options = {}) {
    const keysToRestore = options.keys || Object.keys(data);
    
    for (const key of keysToRestore) {
      if (data.hasOwnProperty(key)) {
        await storageFacade.set(key, data[key]);
      }
    }
  }

  async compressData(data) {
    // Simple JSON compression (in production, use a proper compression library)
    const json = JSON.stringify(data);
    
    // Basic compression: remove whitespace and use shorter keys
    const compressed = json
      .replace(/\s+/g, ' ')
      .replace(/"(\w+)":/g, (match, key) => {
        // Shorten common keys
        const shortKeys = {
          'templates': 't',
          'workflows': 'w',
          'snippets': 's',
          'folders': 'f',
          'createdAt': 'ca',
          'updatedAt': 'ua',
          'description': 'd',
          'category': 'c'
        };
        return `"${shortKeys[key] || key}":`;
      });
    
    return compressed;
  }

  async decompressData(compressed) {
    // Reverse the compression
    const decompressed = compressed
      .replace(/"t":/g, '"templates":')
      .replace(/"w":/g, '"workflows":')
      .replace(/"s":/g, '"snippets":')
      .replace(/"f":/g, '"folders":')
      .replace(/"ca":/g, '"createdAt":')
      .replace(/"ua":/g, '"updatedAt":')
      .replace(/"d":/g, '"description":')
      .replace(/"c":/g, '"category":');
    
    return JSON.parse(decompressed);
  }

  async encryptData(data) {
    // Placeholder for encryption (implement with Web Crypto API)
    console.warn('Encryption not implemented, storing data as-is');
    return data;
  }

  async decryptData(encrypted) {
    // Placeholder for decryption
    console.warn('Decryption not implemented, returning data as-is');
    return encrypted;
  }

  calculateDataSize(data) {
    const json = typeof data === 'string' ? data : JSON.stringify(data);
    return new Blob([json]).size;
  }

  countItems(data) {
    let count = 0;
    
    for (const [key, value] of Object.entries(data)) {
      if (Array.isArray(value)) {
        count += value.length;
      } else if (typeof value === 'object' && value !== null) {
        count += Object.keys(value).length;
      } else {
        count += 1;
      }
    }
    
    return count;
  }

  validateBackupData(data) {
    const errors = [];
    
    // Check required keys
    const requiredKeys = ['templates', 'workflows'];
    for (const key of requiredKeys) {
      if (!data.hasOwnProperty(key)) {
        errors.push(`Missing required key: ${key}`);
      }
    }
    
    // Validate data types
    for (const [key, value] of Object.entries(data)) {
      if (this.dataKeys.includes(key)) {
        if (key.endsWith('s') && !Array.isArray(value)) {
          errors.push(`Expected array for ${key}, got ${typeof value}`);
        }
      }
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  generateBackupId() {
    return `backup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async getSchemaVersion() {
    return await storageFacade.get('schema_version') || '1.0.0';
  }
}

// Export singleton instance
export const backupService = new BackupService();

// Also export class for testing
export default BackupService;