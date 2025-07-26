import DataMigrationService from '../DataMigrationService';
import { storageFacade } from '../../storage/StorageFacade';
import { legacyDataAdapter } from '../../storage/LegacyDataAdapter';
import BackupService from '../BackupService';

// Mock dependencies
jest.mock('../../storage/StorageFacade');
jest.mock('../../storage/LegacyDataAdapter');
jest.mock('../BackupService');
jest.mock('../MigrationLogger');
jest.mock('../DataValidator');

describe('DataMigrationService', () => {
  let migrationService;

  beforeEach(() => {
    jest.clearAllMocks();
    migrationService = new DataMigrationService();
  });

  describe('checkMigrationStatus', () => {
    it('should detect when migration is needed', async () => {
      storageFacade.get.mockResolvedValue('1.0.0');
      legacyDataAdapter.checkMigrationStatus.mockResolvedValue({
        needed: true,
        keys: ['templates', 'workflows']
      });

      const status = await migrationService.checkMigrationStatus();

      expect(status.needed).toBe(true);
      expect(status.currentVersion).toBe('1.0.0');
      expect(status.targetVersion).toBe('3.0.0');
      expect(status.legacyKeys).toEqual(['templates', 'workflows']);
    });

    it('should detect when no migration is needed', async () => {
      storageFacade.get.mockResolvedValue('3.0.0');
      legacyDataAdapter.checkMigrationStatus.mockResolvedValue({
        needed: false,
        keys: []
      });

      const status = await migrationService.checkMigrationStatus();

      expect(status.needed).toBe(false);
    });
  });

  describe('runPendingMigrations', () => {
    it('should complete successful migration', async () => {
      // Setup mocks
      migrationService.checkMigrationStatus = jest.fn().mockResolvedValue({
        needed: true,
        currentVersion: '1.0.0',
        targetVersion: '3.0.0'
      });

      migrationService.getPendingMigrations = jest.fn().mockResolvedValue([
        {
          type: 'version',
          version: '2.0.0',
          migration: jest.fn().mockResolvedValue({ success: true })
        }
      ]);

      migrationService.validateMigrationResults = jest.fn().mockResolvedValue({
        success: true
      });

      const result = await migrationService.runPendingMigrations();

      expect(result.success).toBe(true);
      expect(result.migratedCount).toBe(1);
    });

    it('should handle migration failure with rollback', async () => {
      migrationService.checkMigrationStatus = jest.fn().mockResolvedValue({
        needed: true
      });

      migrationService.getPendingMigrations = jest.fn().mockResolvedValue([
        {
          type: 'version',
          version: '2.0.0',
          migration: jest.fn().mockRejectedValue(new Error('Migration failed'))
        }
      ]);

      migrationService.createBackup = jest.fn().mockResolvedValue({
        id: 'backup_123'
      });

      migrationService.rollback = jest.fn().mockResolvedValue(true);

      await expect(migrationService.runPendingMigrations()).rejects.toThrow();
      expect(migrationService.rollback).toHaveBeenCalled();
    });

    it('should prevent concurrent migrations', async () => {
      migrationService.isRunning = true;

      const result = await migrationService.runPendingMigrations();

      expect(result.success).toBe(false);
      expect(result.reason).toBe('Already running');
    });
  });

  describe('migrateV1ToV2', () => {
    it('should add folder support to items', async () => {
      const templates = [
        { id: '1', name: 'Template 1' },
        { id: '2', name: 'Template 2' }
      ];

      storageFacade.get.mockResolvedValue(templates);
      storageFacade.set.mockResolvedValue(true);

      await migrationService.migrateV1ToV2();

      expect(storageFacade.set).toHaveBeenCalledWith(
        'templates',
        expect.arrayContaining([
          expect.objectContaining({
            id: '1',
            folderId: null,
            folderIds: [],
            tags: []
          })
        ])
      );
    });
  });

  describe('migrateV2ToV3', () => {
    it('should add context support to templates', async () => {
      const templates = [
        { id: '1', name: 'Template 1', content: 'Content' }
      ];

      storageFacade.get.mockResolvedValue(templates);
      storageFacade.set.mockResolvedValue(true);

      await migrationService.migrateV2ToV3();

      expect(storageFacade.set).toHaveBeenCalledWith(
        'templates',
        expect.arrayContaining([
          expect.objectContaining({
            id: '1',
            context: '',
            contextEnabled: false
          })
        ])
      );
    });
  });

  describe('performIntegrityCheck', () => {
    it('should validate data integrity', async () => {
      const templates = [
        { id: '1', name: 'Template 1', folderId: 'folder1' }
      ];
      const folders = [
        { id: 'folder1', name: 'Folder 1' }
      ];

      storageFacade.get
        .mockResolvedValueOnce(templates)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce(folders);

      const result = await migrationService.performIntegrityCheck();

      expect(result.valid).toBe(true);
      expect(result.checks.templates.valid).toBe(true);
    });

    it('should detect referential integrity issues', async () => {
      const templates = [
        { id: '1', name: 'Template 1', folderId: 'missing_folder' }
      ];
      const folders = [];

      storageFacade.get
        .mockResolvedValueOnce(templates)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce(folders);

      const result = await migrationService.performIntegrityCheck();

      expect(result.valid).toBe(false);
      expect(result.checks.references.issues).toHaveLength(1);
    });
  });

  describe('progressive migration', () => {
    it('should process migration queue in batches', async () => {
      migrationService.config.batchSize = 2;
      migrationService.migrationQueue = [
        { type: 'test', migration: jest.fn() },
        { type: 'test', migration: jest.fn() },
        { type: 'test', migration: jest.fn() }
      ];

      migrationService.executeSingleMigration = jest.fn()
        .mockResolvedValue({ success: true });

      await migrationService.processQueue();

      expect(migrationService.executeSingleMigration).toHaveBeenCalledTimes(3);
      expect(migrationService.migrationQueue).toHaveLength(0);
    });
  });

  describe('getMigrationProgress', () => {
    it('should calculate progress correctly', () => {
      migrationService.migrationQueue = [{ id: 1 }, { id: 2 }];
      migrationService.completedMigrations = new Set([3, 4, 5]);

      const progress = migrationService.getMigrationProgress();

      expect(progress.total).toBe(5);
      expect(progress.completed).toBe(3);
      expect(progress.remaining).toBe(2);
      expect(progress.percentage).toBe(60);
    });
  });
});