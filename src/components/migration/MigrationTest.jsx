import React, { useState } from 'react';
import { useMigration } from '../../hooks/domain/useMigration';
import { useSyncQueue } from '../../services/sync/SyncQueue';
import MigrationWizard from './MigrationWizard';

/**
 * Test component voor migration functionaliteit
 * Kan gebruikt worden voor development en testing
 */
export function MigrationTest() {
  const [showWizard, setShowWizard] = useState(false);
  const migration = useMigration();
  const syncQueue = useSyncQueue();

  const createTestData = () => {
    const testData = {
      templates: [
        {
          id: 'test-template-1',
          name: 'Test Template',
          content: 'Dit is een test template met {variable}',
          category: 'Test',
          variables: ['variable'],
          favorite: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ],
      workflows: [
        {
          id: 'test-workflow-1', 
          name: 'Test Workflow',
          description: 'Test workflow met meerdere stappen',
          category: 'Test',
          steps: ['test-template-1'],
          favorite: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ],
      snippets: [
        {
          id: 'test-snippet-1',
          name: 'Test Snippet',
          content: 'Dit is test snippet content',
          category: 'Test',
          tags: ['test', 'snippet'],
          favorite: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ],
      folders: []
    };

    // Sla test data op in localStorage
    Object.entries(testData).forEach(([key, value]) => {
      localStorage.setItem(key, JSON.stringify(value));
    });

    // Refresh migration check
    migration.checkMigrationStatus();
  };

  const clearTestData = () => {
    ['templates', 'workflows', 'snippets', 'folders'].forEach(key => {
      localStorage.removeItem(key);
    });
    migration.checkMigrationStatus();
  };

  const addSyncOperation = () => {
    syncQueue.addToQueue({
      type: 'createTemplate',
      data: {
        id: crypto.randomUUID(),
        name: 'Test Sync Template',
        content: 'Test content voor sync queue',
        category: 'Test'
      }
    });
  };

  const queueStats = syncQueue.getQueueStats();

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Migration & Sync Test Dashboard</h2>
        
        {/* Migration Status */}
        <div className="bg-blue-50 p-4 rounded-lg mb-6">
          <h3 className="font-medium text-blue-900 mb-2">Migration Status</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-blue-600 font-medium">Recommendation:</span>
              <div className="capitalize">{migration.migrationRecommendation.replace('_', ' ')}</div>
            </div>
            <div>
              <span className="text-blue-600 font-medium">Local Items:</span>
              <div>{migration.totalLocalItems}</div>
            </div>
            <div>
              <span className="text-blue-600 font-medium">Should Migrate:</span>
              <div className={migration.shouldMigrate ? 'text-orange-600' : 'text-green-600'}>
                {migration.shouldMigrate ? 'Yes' : 'No'}
              </div>
            </div>
            <div>
              <span className="text-blue-600 font-medium">Status:</span>
              <div className={migration.isChecking ? 'text-yellow-600' : 'text-green-600'}>
                {migration.isChecking ? 'Checking...' : 'Ready'}
              </div>
            </div>
          </div>
          
          {migration.error && (
            <div className="mt-3 text-red-600 text-sm bg-red-50 p-2 rounded">
              Error: {migration.error}
            </div>
          )}
        </div>

        {/* Local Data Counts */}
        {migration.localDataCounts && (
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <h3 className="font-medium text-gray-900 mb-2">Local Data</h3>
            <div className="grid grid-cols-4 gap-4 text-sm">
              <div className="text-center">
                <div className="text-lg font-bold text-blue-600">{migration.localDataCounts.templates}</div>
                <div className="text-gray-600">Templates</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-green-600">{migration.localDataCounts.workflows}</div>
                <div className="text-gray-600">Workflows</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-purple-600">{migration.localDataCounts.snippets}</div>
                <div className="text-gray-600">Snippets</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-yellow-600">{migration.localDataCounts.folders}</div>
                <div className="text-gray-600">Folders</div>
              </div>
            </div>
          </div>
        )}

        {/* Sync Queue Status */}
        <div className="bg-green-50 p-4 rounded-lg mb-6">
          <h3 className="font-medium text-green-900 mb-2">Sync Queue Status</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-green-600 font-medium">Total:</span>
              <div>{queueStats.total}</div>
            </div>
            <div>
              <span className="text-green-600 font-medium">Pending:</span>
              <div className={queueStats.pending > 0 ? 'text-orange-600' : ''}>{queueStats.pending}</div>
            </div>
            <div>
              <span className="text-green-600 font-medium">Completed:</span>
              <div className="text-green-600">{queueStats.completed}</div>
            </div>
            <div>
              <span className="text-green-600 font-medium">Failed:</span>
              <div className={queueStats.failed > 0 ? 'text-red-600' : ''}>{queueStats.failed}</div>
            </div>
          </div>
          
          <div className="mt-2 text-xs">
            <span className="text-green-600 font-medium">Sync Status:</span>{' '}
            <span className={`capitalize ${
              syncQueue.syncStatus === 'syncing' ? 'text-blue-600' : 
              syncQueue.syncStatus === 'error' ? 'text-red-600' : 'text-green-600'
            }`}>
              {syncQueue.syncStatus}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={createTestData}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Create Test Data
          </button>
          
          <button
            onClick={clearTestData}
            className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
          >
            Clear Test Data
          </button>
          
          <button
            onClick={() => setShowWizard(true)}
            disabled={!migration.shouldMigrate}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
          >
            Open Migration Wizard
          </button>
          
          <button
            onClick={migration.checkMigrationStatus}
            disabled={migration.isChecking}
            className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700 disabled:opacity-50"
          >
            {migration.isChecking ? 'Checking...' : 'Refresh Status'}
          </button>
          
          <button
            onClick={addSyncOperation}
            className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
          >
            Add Sync Operation
          </button>
          
          <button
            onClick={() => syncQueue.processQueue()}
            disabled={syncQueue.syncStatus === 'syncing'}
            className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 disabled:opacity-50"
          >
            {syncQueue.syncStatus === 'syncing' ? 'Processing...' : 'Process Queue'}
          </button>
        </div>

        {/* Queue Details */}
        {queueStats.total > 0 && (
          <div className="mt-6 bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Queue Details</h4>
            <div className="text-sm text-gray-600">
              {Object.entries(queueStats.byType).map(([type, count]) => (
                <span key={type} className="inline-block mr-4">
                  {type}: {count}
                </span>
              ))}
            </div>
            
            {queueStats.oldestPending && (
              <div className="mt-2 text-xs text-gray-500">
                Oldest pending: {new Date(queueStats.oldestPending.timestamp).toLocaleString()}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Migration Wizard */}
      <MigrationWizard
        isOpen={showWizard}
        onClose={() => setShowWizard(false)}
        onComplete={(result) => {
          console.log('Migration completed:', result);
          setShowWizard(false);
        }}
      />
    </div>
  );
}

export default MigrationTest;