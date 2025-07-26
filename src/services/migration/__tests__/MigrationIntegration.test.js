import { dataMigrationService } from '../DataMigrationService';
import { compatibilityLayer } from '../CompatibilityLayer';
import { backupService } from '../BackupService';
import { storageFacade } from '../../storage/StorageFacade';

/**
 * Integration tests for complete migration flow
 * Tests the interaction between all migration components
 */
describe('Migration Integration Tests', () => {
  // Mock localStorage
  const mockLocalStorage = (() => {
    let store = {};
    return {
      getItem: (key) => store[key] || null,
      setItem: (key, value) => { store[key] = value; },
      removeItem: (key) => { delete store[key]; },
      clear: () => { store = {}; },
      getAllKeys: () => Object.keys(store)
    };
  })();

  beforeEach(() => {
    // Clear all storage
    mockLocalStorage.clear();
    global.localStorage = mockLocalStorage;
    
    // Reset services
    jest.clearAllMocks();
  });

  describe('Complete Migration Flow', () => {
    it('should migrate legacy data to current format', async () => {
      // Setup legacy data
      const legacyTemplates = [
        {
          id: '1',
          name: 'Legacy Template',
          content: 'Hello {name}',
          created_at: '2023-01-01T00:00:00Z',
          is_favorite: true
        }
      ];

      const legacyWorkflows = [
        {
          id: 'w1',
          name: 'Legacy Workflow',
          steps: [{ template_id: '1', order: 0 }],
          folder_id: 'old_folder'
        }
      ];

      // Store in legacy format
      localStorage.setItem('templates', JSON.stringify(legacyTemplates));
      localStorage.setItem('workflows', JSON.stringify(legacyWorkflows));

      // Run migration
      const result = await dataMigrationService.runPendingMigrations();

      expect(result.success).toBe(true);
      expect(result.migratedCount).toBeGreaterThan(0);

      // Verify data was migrated correctly
      const migratedTemplates = await compatibilityLayer.get('templates');
      expect(migratedTemplates[0]).toMatchObject({
        id: '1',
        name: 'Legacy Template',
        content: 'Hello {name}',
        createdAt: '2023-01-01T00:00:00Z',
        favorite: true,
        context: '',
        contextEnabled: false,
        version: 3
      });

      // Verify old fields were removed
      expect(migratedTemplates[0].created_at).toBeUndefined();
      expect(migratedTemplates[0].is_favorite).toBeUndefined();
    });

    it('should handle partial migration failure with rollback', async () => {
      // Create initial backup
      await backupService.createFullBackup('Pre-migration backup');

      // Setup data that will fail validation
      const invalidData = [
        { name: 'Missing ID' }, // Invalid - no ID
        { id: '2', name: 'Valid Item', content: 'Content' }
      ];

      localStorage.setItem('templates', JSON.stringify(invalidData));

      // Mock validation to fail
      const originalValidate = dataMigrationService.validator.validateData;
      dataMigrationService.validator.validateData = jest.fn()
        .mockRejectedValue(new Error('Validation failed'));

      try {
        await dataMigrationService.runPendingMigrations();
      } catch (error) {
        expect(error.message).toContain('Validation failed');
      }

      // Verify rollback was triggered
      const latestBackup = await backupService.getLatestBackup();
      expect(latestBackup.description).toBe('Pre-migration backup');

      // Restore original validator
      dataMigrationService.validator.validateData = originalValidate;
    });
  });

  describe('Dual-Read Period', () => {
    it('should read from both old and new storage during dual-read', async () => {
      // Enable dual-read
      await compatibilityLayer.setDualReadMode(true);

      // Store data in old format only
      const oldData = [{ id: '1', name: 'Old Format', created_at: '2023-01-01' }];
      localStorage.setItem('templates', JSON.stringify(oldData));

      // First read should migrate data
      const firstRead = await compatibilityLayer.get('templates');
      expect(firstRead[0].createdAt).toBe('2023-01-01');
      expect(firstRead[0].created_at).toBeUndefined();

      // Verify data was saved to new storage
      const secondRead = await storageFacade.get('templates');
      expect(secondRead).toBeDefined();
      expect(secondRead[0].createdAt).toBe('2023-01-01');

      // Subsequent reads should use new storage
      const thirdRead = await compatibilityLayer.get('templates');
      expect(thirdRead).toEqual(secondRead);
    });

    it('should handle concurrent reads during migration', async () => {
      await compatibilityLayer.setDualReadMode(true);

      const oldData = [
        { id: '1', name: 'Item 1' },
        { id: '2', name: 'Item 2' },
        { id: '3', name: 'Item 3' }
      ];
      localStorage.setItem('templates', JSON.stringify(oldData));

      // Simulate concurrent reads
      const reads = await Promise.all([
        compatibilityLayer.get('templates'),
        compatibilityLayer.get('templates'),
        compatibilityLayer.get('templates')
      ]);

      // All reads should return the same data
      expect(reads[0]).toEqual(reads[1]);
      expect(reads[1]).toEqual(reads[2]);

      // Verify migration happened only once
      expect(compatibilityLayer.isMigrated('templates')).toBe(true);
    });
  });

  describe('Progressive Migration', () => {
    it('should migrate large datasets in batches', async () => {
      // Create large dataset
      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
        id: `item_${i}`,
        name: `Item ${i}`,
        content: `Content for item ${i}`,
        created_at: new Date(2023, 0, 1 + i).toISOString()
      }));

      localStorage.setItem('templates', JSON.stringify(largeDataset));

      // Configure small batch size
      dataMigrationService.config.batchSize = 50;
      dataMigrationService.config.progressiveMode = true;

      // Start progressive migration
      await dataMigrationService.startProgressiveMigration();

      // Check progress during migration
      let lastProgress = 0;
      const checkProgress = setInterval(() => {
        const progress = dataMigrationService.getMigrationProgress();
        expect(progress.percentage).toBeGreaterThanOrEqual(lastProgress);
        lastProgress = progress.percentage;
      }, 100);

      // Wait for completion
      await new Promise(resolve => {
        const checkCompletion = setInterval(() => {
          const progress = dataMigrationService.getMigrationProgress();
          if (progress.percentage === 100) {
            clearInterval(checkProgress);
            clearInterval(checkCompletion);
            resolve();
          }
        }, 100);
      });

      // Verify all data was migrated
      const migratedData = await compatibilityLayer.get('templates');
      expect(migratedData).toHaveLength(1000);
    });
  });

  describe('Data Integrity', () => {
    it('should maintain referential integrity during migration', async () => {
      // Setup related data
      const folders = [
        { id: 'folder1', name: 'Folder 1' },
        { id: 'folder2', name: 'Folder 2' }
      ];

      const templates = [
        { id: 't1', name: 'Template 1', folder_id: 'folder1' },
        { id: 't2', name: 'Template 2', folder_id: 'folder2' }
      ];

      const workflows = [
        {
          id: 'w1',
          name: 'Workflow 1',
          steps: [
            { template_id: 't1', order: 0 },
            { template_id: 't2', order: 1 }
          ]
        }
      ];

      localStorage.setItem('folders', JSON.stringify(folders));
      localStorage.setItem('templates', JSON.stringify(templates));
      localStorage.setItem('workflows', JSON.stringify(workflows));

      // Run migration
      await dataMigrationService.runPendingMigrations();

      // Verify integrity
      const integrityCheck = await dataMigrationService.performIntegrityCheck();
      expect(integrityCheck.valid).toBe(true);
      expect(integrityCheck.checks.references.valid).toBe(true);

      // Verify relationships are maintained
      const migratedTemplates = await compatibilityLayer.get('templates');
      const migratedWorkflows = await compatibilityLayer.get('workflows');

      expect(migratedTemplates[0].folderId).toBe('folder1');
      expect(migratedWorkflows[0].steps[0].templateId).toBe('t1');
    });

    it('should detect and report integrity violations', async () => {
      // Setup data with broken references
      const templates = [
        { id: 't1', name: 'Template 1', folder_id: 'missing_folder' }
      ];

      const workflows = [
        {
          id: 'w1',
          name: 'Workflow 1',
          steps: [{ template_id: 'missing_template', order: 0 }]
        }
      ];

      localStorage.setItem('templates', JSON.stringify(templates));
      localStorage.setItem('workflows', JSON.stringify(workflows));
      localStorage.setItem('folders', JSON.stringify([])); // No folders

      // Run migration
      await dataMigrationService.runPendingMigrations();

      // Check integrity
      const integrityCheck = await dataMigrationService.performIntegrityCheck();
      expect(integrityCheck.valid).toBe(false);
      expect(integrityCheck.checks.references.issues).toHaveLength(2);
    });
  });

  describe('Backup and Restore', () => {
    it('should create and restore full backup', async () => {
      // Setup test data
      const testData = {
        templates: [
          { id: '1', name: 'Template 1', content: 'Content 1' },
          { id: '2', name: 'Template 2', content: 'Content 2' }
        ],
        workflows: [
          { id: 'w1', name: 'Workflow 1', steps: [] }
        ],
        ui_preferences: {
          theme: 'dark',
          viewMode: 'grid'
        }
      };

      // Store test data
      for (const [key, value] of Object.entries(testData)) {
        await storageFacade.set(key, value);
      }

      // Create backup
      const backupResult = await backupService.createFullBackup('Test backup');
      expect(backupResult.id).toBeDefined();

      // Modify data
      await storageFacade.set('templates', []);
      await storageFacade.set('workflows', []);

      // Restore backup
      const restoreResult = await backupService.restoreBackup(backupResult.id);
      expect(restoreResult.success).toBe(true);

      // Verify data was restored
      const restoredTemplates = await storageFacade.get('templates');
      const restoredWorkflows = await storageFacade.get('workflows');

      expect(restoredTemplates).toEqual(testData.templates);
      expect(restoredWorkflows).toEqual(testData.workflows);
    });

    it('should verify backup integrity', async () => {
      // Create test data
      await storageFacade.set('templates', [
        { id: '1', name: 'Template 1' }
      ]);

      // Create backup
      const backupResult = await backupService.createFullBackup('Integrity test');

      // Verify backup
      const verification = await backupService.verifyBackup(backupResult.id);
      expect(verification.valid).toBe(true);
      expect(verification.dataKeys).toContain('templates');
      expect(verification.itemCount).toBeGreaterThan(0);
    });
  });

  describe('Performance Monitoring', () => {
    it('should track migration performance metrics', async () => {
      // Setup test data
      const templates = Array.from({ length: 100 }, (_, i) => ({
        id: `t${i}`,
        name: `Template ${i}`,
        content: `Content ${i}`
      }));

      localStorage.setItem('templates', JSON.stringify(templates));

      // Run migration with timing
      const startTime = Date.now();
      const result = await dataMigrationService.runPendingMigrations();
      const duration = Date.now() - startTime;

      expect(result.duration).toBeDefined();
      expect(result.duration).toBeLessThanOrEqual(duration);

      // Check storage metrics
      const metrics = storageFacade.getMetrics();
      expect(metrics.sets).toBeGreaterThan(0);
    });
  });
});