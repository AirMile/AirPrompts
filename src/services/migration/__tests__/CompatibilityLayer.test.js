import CompatibilityLayer from '../CompatibilityLayer';
import { storageFacade } from '../../storage/StorageFacade';
import { legacyDataAdapter } from '../../storage/LegacyDataAdapter';

// Mock dependencies
jest.mock('../../storage/StorageFacade');
jest.mock('../../storage/LegacyDataAdapter');
jest.mock('../MigrationLogger');

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn((key) => store[key] || null),
    setItem: jest.fn((key, value) => { store[key] = value; }),
    removeItem: jest.fn((key) => { delete store[key]; }),
    clear: jest.fn(() => { store = {}; })
  };
})();

global.localStorage = localStorageMock;

describe('CompatibilityLayer', () => {
  let compatibilityLayer;

  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
    compatibilityLayer = new CompatibilityLayer();
  });

  describe('get with dual-read', () => {
    it('should try new format first', async () => {
      storageFacade.get.mockResolvedValue({ id: '1', name: 'Test' });

      const result = await compatibilityLayer.get('templates');

      expect(storageFacade.get).toHaveBeenCalledWith('templates');
      expect(legacyDataAdapter.get).not.toHaveBeenCalled();
      expect(result).toEqual({ id: '1', name: 'Test' });
    });

    it('should fall back to legacy format when not found', async () => {
      storageFacade.get.mockResolvedValue(null);
      legacyDataAdapter.get.mockResolvedValue([
        { id: '1', name: 'Legacy Template' }
      ]);

      compatibilityLayer.dualReadEnabled = true;
      compatibilityLayer.migratedKeys.clear();

      const result = await compatibilityLayer.get('templates');

      expect(legacyDataAdapter.get).toHaveBeenCalledWith('templates');
      expect(result).toEqual([{ id: '1', name: 'Legacy Template' }]);
    });

    it('should not use legacy if key is already migrated', async () => {
      storageFacade.get.mockResolvedValue(null);
      compatibilityLayer.migratedKeys.add('templates');

      const result = await compatibilityLayer.get('templates');

      expect(legacyDataAdapter.get).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it('should return default data when fallback is enabled', async () => {
      storageFacade.get.mockResolvedValue(null);
      compatibilityLayer.fallbackEnabled = true;

      const result = await compatibilityLayer.get('templates');

      expect(result).toEqual([]); // Default for templates
    });
  });

  describe('set with compatibility', () => {
    it('should save to new storage and mark as migrated', async () => {
      const data = { id: '1', name: 'Test' };
      storageFacade.set.mockResolvedValue(true);

      await compatibilityLayer.set('templates', data);

      expect(storageFacade.set).toHaveBeenCalledWith('templates', data, {});
      expect(compatibilityLayer.migratedKeys.has('templates')).toBe(true);
    });

    it('should dual-write when enabled', async () => {
      const data = [{ id: '1', name: 'Test', folderId: 'folder1' }];
      storageFacade.set.mockResolvedValue(true);
      compatibilityLayer.dualReadEnabled = true;

      await compatibilityLayer.set('templates', data, { dualWrite: true });

      expect(localStorage.setItem).toHaveBeenCalled();
      const savedData = JSON.parse(localStorage.getItem('templates'));
      expect(savedData[0].folder_id).toBe('folder1'); // Converted to snake_case
      expect(savedData[0].folderId).toBeUndefined();
    });
  });

  describe('data transformation', () => {
    it('should transform V1 to current format', async () => {
      const v1Data = [
        { id: '1', name: 'Template' }
      ];

      const result = await compatibilityLayer.handleV1Format('templates', v1Data);

      expect(result[0]).toMatchObject({
        id: '1',
        name: 'Template',
        folderId: null,
        folderIds: [],
        tags: [],
        version: 2
      });
    });

    it('should transform V2 to current format', async () => {
      const v2Data = [
        { id: '1', name: 'Template', folderId: 'folder1' }
      ];

      const result = await compatibilityLayer.handleV2Format('templates', v2Data);

      expect(result[0]).toMatchObject({
        id: '1',
        name: 'Template',
        context: '',
        contextEnabled: false,
        version: 3
      });
    });

    it('should detect data version correctly', async () => {
      const v1Data = [{ id: '1', name: 'Template' }];
      const v2Data = [{ id: '1', name: 'Template', folderIds: [] }];
      const v3Data = [{ id: '1', name: 'Template', contextEnabled: true }];

      expect(await compatibilityLayer.detectDataVersion('templates', v1Data)).toBe('1.0.0');
      expect(await compatibilityLayer.detectDataVersion('templates', v2Data)).toBe('2.0.0');
      expect(await compatibilityLayer.detectDataVersion('templates', v3Data)).toBe('3.0.0');
    });
  });

  describe('save and delete operations', () => {
    it('should save new entity', async () => {
      storageFacade.get.mockResolvedValue([]);
      storageFacade.set.mockResolvedValue(true);

      const entity = { name: 'New Template' };
      const result = await compatibilityLayer.save('templates', entity);

      expect(result.id).toBeDefined();
      expect(result.createdAt).toBeDefined();
      expect(result.updatedAt).toBeDefined();
      expect(storageFacade.set).toHaveBeenCalledWith(
        'templates',
        expect.arrayContaining([expect.objectContaining({ name: 'New Template' })]),
        {}
      );
    });

    it('should update existing entity', async () => {
      const existing = [
        { id: '1', name: 'Old Name' },
        { id: '2', name: 'Other' }
      ];
      storageFacade.get.mockResolvedValue(existing);
      storageFacade.set.mockResolvedValue(true);

      const updated = { id: '1', name: 'New Name' };
      await compatibilityLayer.save('templates', updated);

      expect(storageFacade.set).toHaveBeenCalledWith(
        'templates',
        expect.arrayContaining([
          expect.objectContaining({ id: '1', name: 'New Name' }),
          expect.objectContaining({ id: '2', name: 'Other' })
        ]),
        {}
      );
    });

    it('should delete entity', async () => {
      const existing = [
        { id: '1', name: 'Template 1' },
        { id: '2', name: 'Template 2' }
      ];
      storageFacade.get.mockResolvedValue(existing);
      storageFacade.set.mockResolvedValue(true);

      await compatibilityLayer.delete('templates', '1');

      expect(storageFacade.set).toHaveBeenCalledWith(
        'templates',
        [{ id: '2', name: 'Template 2' }],
        {}
      );
    });
  });

  describe('dual-read mode management', () => {
    it('should enable dual-read mode with duration', async () => {
      storageFacade.set.mockResolvedValue(true);

      await compatibilityLayer.setDualReadMode(true, 1000);

      expect(compatibilityLayer.dualReadEnabled).toBe(true);
      expect(storageFacade.set).toHaveBeenCalledWith(
        'migration_status',
        expect.objectContaining({
          dualReadEnabled: true,
          dualReadEndTime: expect.any(Number)
        })
      );
    });

    it('should disable dual-read mode', async () => {
      storageFacade.set.mockResolvedValue(true);

      await compatibilityLayer.setDualReadMode(false);

      expect(compatibilityLayer.dualReadEnabled).toBe(false);
      expect(storageFacade.set).toHaveBeenCalledWith(
        'migration_status',
        expect.objectContaining({
          dualReadEnabled: false
        })
      );
    });
  });

  describe('API shims', () => {
    it('should provide legacy API compatibility', async () => {
      storageFacade.get.mockResolvedValue([{ id: '1', name: 'Template' }]);
      
      const shim = compatibilityLayer.createApiShim();
      const templates = await shim.getTemplates();

      expect(templates).toEqual([{ id: '1', name: 'Template' }]);
    });

    it('should handle unknown API methods gracefully', async () => {
      const shim = compatibilityLayer.createApiShim();
      const result = await shim.unknownMethod('arg1', 'arg2');

      expect(result).toBeNull();
    });
  });

  describe('migration statistics', () => {
    it('should return migration stats', async () => {
      compatibilityLayer.migratedKeys.add('templates');
      compatibilityLayer.migratedKeys.add('workflows');
      storageFacade.get.mockResolvedValue({
        dualReadEndTime: Date.now() + 1000
      });

      const stats = await compatibilityLayer.getMigrationStats();

      expect(stats.totalKeys).toBe(2);
      expect(stats.migratedKeys).toContain('templates');
      expect(stats.migratedKeys).toContain('workflows');
      expect(stats.dualReadRemainingTime).toBeGreaterThan(0);
    });
  });
});