# AirPrompts Data Migration Guide

## Overview

The AirPrompts migration system provides a complete solution for safely migrating data from legacy formats to the current schema version. It includes automatic backups, rollback capabilities, and zero-downtime migration support.

## Key Features

- **Progressive Migration**: Large datasets are migrated in batches to minimize performance impact
- **Dual-Read Support**: Seamless transition period where both old and new formats are supported
- **Automatic Rollback**: Failed migrations automatically restore from backup
- **Comprehensive Validation**: Data integrity checks at every step
- **Performance Monitoring**: Real-time tracking of migration performance
- **Zero Data Loss**: Multiple safeguards ensure no data is lost during migration

## Migration Architecture

### Core Components

1. **DataMigrationService** (`src/services/migration/DataMigrationService.js`)
   - Orchestrates the entire migration process
   - Manages version upgrades
   - Handles retry logic and failure recovery

2. **CompatibilityLayer** (`src/services/migration/CompatibilityLayer.js`)
   - Provides transparent access to data during migration
   - Handles format transformations
   - Manages dual-read period

3. **BackupService** (`src/services/migration/BackupService.js`)
   - Creates automatic backups before migration
   - Supports full and incremental backups
   - Enables quick rollback on failure

4. **DataValidator** (`src/services/migration/DataValidator.js`)
   - Validates data against schemas
   - Checks referential integrity
   - Ensures data consistency

5. **MigrationLogger** (`src/services/migration/MigrationLogger.js`)
   - Comprehensive logging of all migration activities
   - Audit trail for compliance
   - Error tracking and reporting

6. **PerformanceMonitor** (`src/services/migration/PerformanceMonitor.js`)
   - Real-time performance metrics
   - Throughput calculation
   - Memory usage tracking

## Usage

### Automatic Migration

The migration runs automatically when the app detects outdated data:

```javascript
import { useMigration } from './hooks/useMigration';

function App() {
  const migration = useMigration();
  
  if (migration.needsMigration) {
    // Show migration UI
  }
}
```

### Manual Migration

You can also trigger migration manually:

```javascript
import { dataMigrationService } from './services/migration/DataMigrationService';

// Run full migration
const result = await dataMigrationService.runPendingMigrations();

// Check migration status
const status = await dataMigrationService.checkMigrationStatus();
```

### Using the Compatibility Layer

During the transition period, use the compatibility layer for data access:

```javascript
import { useCompatibleStorage } from './hooks/useMigration';

function MyComponent() {
  const storage = useCompatibleStorage();
  
  // Read data (automatically handles legacy format)
  const templates = await storage.get('templates');
  
  // Save data (automatically migrates to new format)
  await storage.save('templates', newTemplate);
}
```

## Migration Flow

1. **Detection Phase**
   - Check current schema version
   - Scan for legacy data
   - Determine required migrations

2. **Preparation Phase**
   - Create full backup
   - Enable dual-read mode
   - Initialize performance monitoring

3. **Execution Phase**
   - Run migrations in order
   - Validate after each step
   - Track progress

4. **Verification Phase**
   - Check data integrity
   - Verify referential integrity
   - Ensure all data migrated

5. **Completion Phase**
   - Update schema version
   - Record migration history
   - Clean up legacy data

## Data Transformations

### Version 1.0.0 → 2.0.0
- Added folder support
- Added tags
- Converted snake_case to camelCase

### Version 2.0.0 → 3.0.0
- Added context support for templates
- Added performance settings
- Enhanced metadata

### Legacy Format Support
- Automatic detection of old storage keys
- Format transformation
- Field mapping and cleanup

## Backup and Recovery

### Creating Backups

```javascript
import { backupService } from './services/migration/BackupService';

// Create manual backup
const backup = await backupService.createFullBackup('Pre-update backup');

// List available backups
const backups = await backupService.listBackups();

// Restore from backup
await backupService.restoreBackup(backupId);
```

### Automatic Backups
- Created before every migration
- Retained for 7 days
- Maximum 5 backups stored

## Performance Considerations

### Progressive Migration
- Default batch size: 100 items
- Configurable delays between batches
- Memory usage monitoring

### Optimization Tips
1. Run migrations during low-usage periods
2. Monitor performance metrics
3. Adjust batch size for your dataset
4. Enable progressive mode for large migrations

## Troubleshooting

### Common Issues

1. **Migration Fails to Start**
   - Check browser storage limits
   - Ensure sufficient memory available
   - Verify no concurrent migrations

2. **Validation Errors**
   - Review migration logs
   - Check data integrity
   - Manually fix corrupt data

3. **Performance Issues**
   - Reduce batch size
   - Increase delays between batches
   - Clear browser cache

### Debug Mode

Enable detailed logging:

```javascript
import { migrationLogger } from './services/migration/MigrationLogger';

// Set log level to DEBUG
migrationLogger.setLogLevel('DEBUG');

// Query logs
const logs = await migrationLogger.queryLogs({
  level: 'ERROR',
  limit: 100
});

// Export logs
const exportedLogs = await migrationLogger.exportLogs('json');
```

## API Reference

### DataMigrationService

```javascript
// Check if migration is needed
const status = await dataMigrationService.checkMigrationStatus();

// Run all pending migrations
const result = await dataMigrationService.runPendingMigrations();

// Start progressive migration
await dataMigrationService.startProgressiveMigration();

// Get migration progress
const progress = dataMigrationService.getMigrationProgress();
```

### CompatibilityLayer

```javascript
// Enable dual-read mode
await compatibilityLayer.setDualReadMode(true, durationMs);

// Get migration statistics
const stats = await compatibilityLayer.getMigrationStats();

// Check if key is migrated
const isMigrated = compatibilityLayer.isMigrated('templates');
```

### BackupService

```javascript
// Create backup
const backup = await backupService.createFullBackup(description);

// Verify backup integrity
const verification = await backupService.verifyBackup(backupId);

// Delete old backup
await backupService.deleteBackup(backupId);
```

## Security Considerations

1. **Data Validation**: All migrated data is validated against strict schemas
2. **Backup Encryption**: Sensitive data can be encrypted in backups
3. **Audit Trail**: Complete logging of all migration activities
4. **Access Control**: Migration requires appropriate permissions

## Best Practices

1. **Always Test First**: Run migrations on test data before production
2. **Monitor Progress**: Use the migration UI to track progress
3. **Verify Results**: Check data integrity after migration
4. **Keep Backups**: Don't delete backups immediately after success
5. **Document Changes**: Log any manual interventions

## Support

If you encounter issues during migration:

1. Check the migration logs
2. Review error messages in the console
3. Verify data integrity
4. Create a manual backup before attempting fixes
5. Contact support with migration logs if needed