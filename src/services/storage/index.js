/**
 * Storage Service Exports
 * 
 * Main exports:
 * - storageFacade: Main storage interface with unified API
 * - legacyDataAdapter: Handles migration from old storage formats
 * 
 * Usage:
 * ```js
 * import { storageFacade, legacyDataAdapter } from '@/services/storage';
 * 
 * // Regular storage operations
 * await storageFacade.set('key', value);
 * const data = await storageFacade.get('key');
 * 
 * // Subscribe to changes
 * const unsubscribe = storageFacade.subscribe('key', (newValue) => {
 *   console.log('Value changed:', newValue);
 * });
 * 
 * // Legacy data migration
 * const migrationStatus = await legacyDataAdapter.checkMigrationStatus();
 * if (migrationStatus.needed) {
 *   await legacyDataAdapter.migrateAll();
 * }
 * ```
 */

// Legacy exports (keep for backward compatibility)
export { StorageService } from './StorageService';

// New storage facade exports
export { storageFacade, default as StorageFacade } from './StorageFacade';
export { legacyDataAdapter, default as LegacyDataAdapter } from './LegacyDataAdapter';
export { default as LocalStorageAdapter } from './LocalStorageAdapter';
export { default as SessionStorageAdapter } from './SessionStorageAdapter';
export { default as IndexedDBAdapter } from './IndexedDBAdapter';
export { default as MemoryCache } from './MemoryCache';