import LegacyDataAdapter from '@/services/storage/LegacyDataAdapter';
import { storageFacade } from '@/services/storage/StorageFacade';

describe('LegacyDataAdapter', () => {
  let adapter;

  beforeEach(() => {
    // Clear all storage
    localStorage.clear();

    // Create new adapter instance
    adapter = new LegacyDataAdapter();

    // Mock storage facade
    jest.spyOn(storageFacade, 'get').mockImplementation(async () => {
      return null; // Simulate no data in new storage
    });

    jest.spyOn(storageFacade, 'set').mockImplementation(async () => {
      return true;
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Data migration', () => {
    it('should migrate templates from old format', async () => {
      // Set up legacy data
      const legacyTemplates = [
        {
          id: '123',
          name: 'Test Template',
          folder_id: 'folder1',
          created_at: '2023-01-01',
          is_favorite: true,
        },
      ];

      localStorage.setItem('templates', JSON.stringify(legacyTemplates));

      // Get data through adapter
      const result = await adapter.get('templates');

      // Check migration
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(
        expect.objectContaining({
          id: '123',
          name: 'Test Template',
          folderId: 'folder1',
          folderIds: ['folder1'],
          createdAt: '2023-01-01',
          favorite: true,
        })
      );

      // Check that old fields are removed
      expect(result[0].folder_id).toBeUndefined();
      expect(result[0].is_favorite).toBeUndefined();
    });

    it('should migrate UI preferences', async () => {
      const legacyPrefs = {
        view_mode: 'list',
        sidebar_collapsed: true,
        items_per_page: 50,
      };

      localStorage.setItem('ui-prefs', JSON.stringify(legacyPrefs));

      const result = await adapter.get('ui-prefs');

      expect(result).toEqual(
        expect.objectContaining({
          viewMode: 'list',
          sidebarCollapsed: true,
          itemsPerPage: 50,
          theme: 'system', // Default value
        })
      );
    });

    it('should migrate user settings', async () => {
      const legacySettings = {
        display_name: 'John Doe',
        notifications_enabled: false,
        auto_save: true,
      };

      localStorage.setItem('user_settings', JSON.stringify(legacySettings));

      const result = await adapter.get('user_settings');

      expect(result).toEqual(
        expect.objectContaining({
          displayName: 'John Doe',
          preferences: {
            notifications: false,
            autoSave: true,
            confirmDelete: true, // Default value
          },
        })
      );
    });

    it('should handle different key prefixes', async () => {
      // Test different prefix variations
      localStorage.setItem('airprompts_templates', JSON.stringify([{ id: '1' }]));
      localStorage.setItem('airprompts-workflows', JSON.stringify([{ id: '2' }]));
      localStorage.setItem('ap_snippets', JSON.stringify([{ id: '3' }]));

      const templates = await adapter.get('templates');
      const workflows = await adapter.get('workflows');
      const snippets = await adapter.get('snippets');

      expect(templates).toBeTruthy();
      expect(workflows).toBeTruthy();
      expect(snippets).toBeTruthy();
    });
  });

  describe('Migration status', () => {
    it('should check if migration is needed', async () => {
      // Add legacy data
      localStorage.setItem('templates', JSON.stringify([{ id: '1' }]));
      localStorage.setItem('workflows', JSON.stringify([{ id: '2' }]));

      const status = await adapter.checkMigrationStatus();

      expect(status.needed).toBe(true);
      expect(status.keys).toContain('templates');
      expect(status.keys).toContain('workflows');
    });

    it('should report no migration needed when data is already migrated', async () => {
      const status = await adapter.checkMigrationStatus();

      expect(status.needed).toBe(false);
      expect(status.keys).toHaveLength(0);
    });
  });

  describe('Batch migration', () => {
    it('should migrate all legacy data at once', async () => {
      // Set up multiple legacy data
      localStorage.setItem('templates', JSON.stringify([{ id: '1', name: 'Template' }]));
      localStorage.setItem('workflows', JSON.stringify([{ id: '2', name: 'Workflow' }]));
      localStorage.setItem('ui-prefs', JSON.stringify({ view_mode: 'grid' }));

      const results = await adapter.migrateAll();

      expect(results.migrated).toContain('templates');
      expect(results.migrated).toContain('workflows');
      expect(results.migrated).toContain('ui-prefs');
      expect(results.failed).toHaveLength(0);

      // Check that legacy data is cleaned up
      expect(localStorage.getItem('templates')).toBeNull();
      expect(localStorage.getItem('workflows')).toBeNull();
    });

    it('should handle migration failures gracefully', async () => {
      // Mock a failure
      storageFacade.set.mockImplementationOnce(() => {
        throw new Error('Storage error');
      });

      localStorage.setItem('templates', JSON.stringify([{ id: '1' }]));

      const results = await adapter.migrateAll();

      expect(results.failed).toHaveLength(1);
      expect(results.failed[0].key).toBe('templates');
      expect(results.failed[0].error).toContain('Storage error');
    });
  });

  describe('Data cleanup', () => {
    it('should clean up legacy data after successful migration', async () => {
      // Set up legacy data with variations
      localStorage.setItem('templates', 'data');
      localStorage.setItem('templates_backup', 'backup');
      localStorage.setItem('templates_temp', 'temp');
      localStorage.setItem('airprompts_templates', 'prefixed');

      await adapter.get('templates');

      // All variations should be cleaned up
      expect(localStorage.getItem('templates')).toBeNull();
      expect(localStorage.getItem('templates_backup')).toBeNull();
      expect(localStorage.getItem('templates_temp')).toBeNull();
      expect(localStorage.getItem('airprompts_templates')).toBeNull();
    });
  });

  describe('Edge cases', () => {
    it('should handle non-JSON legacy data', async () => {
      localStorage.setItem('templates', 'not json');

      const result = await adapter.get('templates');

      expect(result).toBe('not json');
    });

    it('should generate IDs for items without them', async () => {
      const legacyData = [{ name: 'No ID Template' }, { id: '123', name: 'Has ID' }];

      localStorage.setItem('templates', JSON.stringify(legacyData));

      const result = await adapter.get('templates');

      // Should only include items with valid IDs
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('123');
    });

    it('should handle empty arrays', async () => {
      localStorage.setItem('templates', JSON.stringify([]));

      const result = await adapter.get('templates');

      expect(result).toEqual([]);
    });
  });
});
