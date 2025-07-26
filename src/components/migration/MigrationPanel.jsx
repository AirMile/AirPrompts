import React, { useState } from 'react';
import { useMigration, useBackup, useMigrationStats } from '../../hooks/useMigration';

/**
 * MigrationPanel - UI component for data migration management
 */
const MigrationPanel = ({ onClose }) => {
  const migration = useMigration();
  const backup = useBackup();
  const { stats, loading: statsLoading } = useMigrationStats();
  const [activeTab, setActiveTab] = useState('migration');
  const [backupDescription, setBackupDescription] = useState('');

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const formatDuration = (ms) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)} min`;
  };

  return (
    <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-secondary-900 dark:text-secondary-100">
          Data Migration & Backup
        </h2>
        <button
          onClick={onClose}
          className="text-secondary-500 hover:text-secondary-700 dark:hover:text-secondary-300"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-secondary-200 dark:border-secondary-700 mb-6">
        <button
          onClick={() => setActiveTab('migration')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'migration'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-secondary-600 dark:text-secondary-400'
          }`}
        >
          Migration
        </button>
        <button
          onClick={() => setActiveTab('backup')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'backup'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-secondary-600 dark:text-secondary-400'
          }`}
        >
          Backups
        </button>
        <button
          onClick={() => setActiveTab('stats')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'stats'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-secondary-600 dark:text-secondary-400'
          }`}
        >
          Statistics
        </button>
      </div>

      {/* Migration Tab */}
      {activeTab === 'migration' && (
        <div className="space-y-6">
          {/* Migration Status */}
          <div className="bg-secondary-50 dark:bg-secondary-900 rounded-lg p-4">
            <h3 className="font-semibold text-secondary-900 dark:text-secondary-100 mb-2">
              Migration Status
            </h3>
            
            {migration.needsMigration === null ? (
              <p className="text-secondary-600 dark:text-secondary-400">
                Checking migration status...
              </p>
            ) : migration.needsMigration ? (
              <div className="space-y-3">
                <p className="text-amber-600 dark:text-amber-400">
                  Data migration is required to update to the latest format.
                </p>
                
                {migration.isRunning ? (
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Migration Progress</span>
                      <span>{migration.progress}%</span>
                    </div>
                    <div className="w-full bg-secondary-200 dark:bg-secondary-700 rounded-full h-2">
                      <div
                        className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${migration.progress}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => migration.startMigration()}
                    className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 transition-colors"
                  >
                    Start Migration
                  </button>
                )}
              </div>
            ) : (
              <p className="text-green-600 dark:text-green-400">
                ✓ All data is up to date. No migration needed.
              </p>
            )}

            {migration.error && (
              <div className="mt-3 p-3 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded">
                <p className="text-red-800 dark:text-red-400 text-sm">
                  Error: {migration.error}
                </p>
              </div>
            )}

            {migration.completed && (
              <div className="mt-3 p-3 bg-green-100 dark:bg-green-900/20 border border-green-300 dark:border-green-700 rounded">
                <p className="text-green-800 dark:text-green-400 text-sm">
                  ✓ Migration completed successfully!
                </p>
              </div>
            )}
          </div>

          {/* Migration Info */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 dark:text-blue-400 mb-2">
              About Data Migration
            </h4>
            <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
              <li>• Automatic backup is created before migration</li>
              <li>• Zero downtime - you can continue using the app</li>
              <li>• Dual-read period ensures compatibility</li>
              <li>• Rollback available if issues occur</li>
            </ul>
          </div>
        </div>
      )}

      {/* Backup Tab */}
      {activeTab === 'backup' && (
        <div className="space-y-6">
          {/* Create Backup */}
          <div className="bg-secondary-50 dark:bg-secondary-900 rounded-lg p-4">
            <h3 className="font-semibold text-secondary-900 dark:text-secondary-100 mb-3">
              Create New Backup
            </h3>
            <div className="flex gap-3">
              <input
                type="text"
                value={backupDescription}
                onChange={(e) => setBackupDescription(e.target.value)}
                placeholder="Backup description (optional)"
                className="flex-1 px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded bg-white dark:bg-secondary-800"
              />
              <button
                onClick={() => {
                  backup.createBackup(backupDescription || 'Manual backup');
                  setBackupDescription('');
                }}
                disabled={backup.isCreating}
                className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 disabled:opacity-50 transition-colors"
              >
                {backup.isCreating ? 'Creating...' : 'Create Backup'}
              </button>
            </div>
          </div>

          {/* Backup List */}
          <div>
            <h3 className="font-semibold text-secondary-900 dark:text-secondary-100 mb-3">
              Available Backups
            </h3>
            
            {backup.backups.length === 0 ? (
              <p className="text-secondary-600 dark:text-secondary-400 text-center py-8">
                No backups available
              </p>
            ) : (
              <div className="space-y-2">
                {backup.backups.map((bk) => (
                  <div
                    key={bk.id}
                    className="border border-secondary-200 dark:border-secondary-700 rounded-lg p-4"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-medium text-secondary-900 dark:text-secondary-100">
                          {bk.description}
                        </h4>
                        <p className="text-sm text-secondary-600 dark:text-secondary-400 mt-1">
                          {formatDate(bk.timestamp)} • {formatBytes(bk.size)} • {bk.type}
                        </p>
                        {bk.dataKeys && (
                          <p className="text-xs text-secondary-500 dark:text-secondary-500 mt-1">
                            Contains: {bk.dataKeys.join(', ')}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => backup.verifyBackup(bk.id)}
                          className="text-sm px-3 py-1 text-secondary-600 dark:text-secondary-400 hover:text-secondary-800 dark:hover:text-secondary-200"
                        >
                          Verify
                        </button>
                        <button
                          onClick={() => backup.restoreBackup(bk.id)}
                          disabled={backup.isRestoring}
                          className="text-sm px-3 py-1 text-primary-600 hover:text-primary-800 disabled:opacity-50"
                        >
                          Restore
                        </button>
                        <button
                          onClick={() => backup.deleteBackup(bk.id)}
                          className="text-sm px-3 py-1 text-red-600 hover:text-red-800"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Statistics Tab */}
      {activeTab === 'stats' && (
        <div className="space-y-6">
          {statsLoading ? (
            <p className="text-secondary-600 dark:text-secondary-400 text-center py-8">
              Loading statistics...
            </p>
          ) : stats ? (
            <>
              {/* Migration Stats */}
              <div className="bg-secondary-50 dark:bg-secondary-900 rounded-lg p-4">
                <h3 className="font-semibold text-secondary-900 dark:text-secondary-100 mb-3">
                  Migration Statistics
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-secondary-600 dark:text-secondary-400">
                      Migrated Keys
                    </p>
                    <p className="text-2xl font-semibold text-secondary-900 dark:text-secondary-100">
                      {stats.migration.totalKeys}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-secondary-600 dark:text-secondary-400">
                      Dual-Read Status
                    </p>
                    <p className="text-lg font-medium">
                      {stats.migration.dualReadEnabled ? (
                        <span className="text-green-600 dark:text-green-400">Active</span>
                      ) : (
                        <span className="text-secondary-500">Inactive</span>
                      )}
                    </p>
                  </div>
                </div>
                
                {stats.migration.dualReadRemainingTime && (
                  <div className="mt-4 pt-4 border-t border-secondary-200 dark:border-secondary-700">
                    <p className="text-sm text-secondary-600 dark:text-secondary-400">
                      Dual-read period remaining: {formatDuration(stats.migration.dualReadRemainingTime)}
                    </p>
                  </div>
                )}
              </div>

              {/* Backup Stats */}
              <div className="bg-secondary-50 dark:bg-secondary-900 rounded-lg p-4">
                <h3 className="font-semibold text-secondary-900 dark:text-secondary-100 mb-3">
                  Backup Statistics
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-secondary-600 dark:text-secondary-400">
                      Total Backups
                    </p>
                    <p className="text-2xl font-semibold text-secondary-900 dark:text-secondary-100">
                      {stats.backups.count}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-secondary-600 dark:text-secondary-400">
                      Latest Backup
                    </p>
                    <p className="text-sm font-medium text-secondary-900 dark:text-secondary-100">
                      {stats.backups.latest 
                        ? formatDate(stats.backups.latest.timestamp)
                        : 'No backups yet'
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* Migrated Keys List */}
              {stats.migration.migratedKeys.length > 0 && (
                <div className="bg-secondary-50 dark:bg-secondary-900 rounded-lg p-4">
                  <h3 className="font-semibold text-secondary-900 dark:text-secondary-100 mb-3">
                    Migrated Data Keys
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {stats.migration.migratedKeys.map((key) => (
                      <span
                        key={key}
                        className="px-3 py-1 bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 rounded-full text-sm"
                      >
                        {key}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <p className="text-secondary-600 dark:text-secondary-400 text-center py-8">
              No statistics available
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default MigrationPanel;