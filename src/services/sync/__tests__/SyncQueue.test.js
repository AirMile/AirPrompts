import { SyncQueue } from '../SyncQueue';

// Mock storage
const mockStorage = {
  get: jest.fn(),
  set: jest.fn(),
  remove: jest.fn()
};

jest.mock('../../storage', () => ({
  storage: mockStorage
}));

describe('SyncQueue', () => {
  let syncQueue;
  let mockSyncFunction;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSyncFunction = jest.fn().mockResolvedValue({ success: true });
    syncQueue = new SyncQueue({
      syncFunction: mockSyncFunction,
      maxRetries: 3,
      retryDelay: 100,
      batchSize: 5
    });
  });

  afterEach(() => {
    syncQueue.stop();
  });

  describe('enqueue operations', () => {
    test('should add operations to queue', async () => {
      const operation = {
        type: 'CREATE',
        entity: 'template',
        data: { id: '1', name: 'Test Template' }
      };
      
      await syncQueue.enqueue(operation);
      
      expect(syncQueue.getQueueSize()).toBe(1);
      expect(syncQueue.getPendingOperations()).toContainEqual(
        expect.objectContaining(operation)
      );
    });

    test('should assign unique IDs to operations', async () => {
      const operations = [
        { type: 'CREATE', entity: 'template', data: { id: '1' } },
        { type: 'UPDATE', entity: 'template', data: { id: '1' } }
      ];
      
      for (const op of operations) {
        await syncQueue.enqueue(op);
      }
      
      const pending = syncQueue.getPendingOperations();
      const ids = pending.map(op => op.id);
      
      expect(new Set(ids).size).toBe(ids.length); // All unique
    });

    test('should add timestamp to operations', async () => {
      const operation = { type: 'CREATE', entity: 'template', data: {} };
      
      await syncQueue.enqueue(operation);
      
      const pending = syncQueue.getPendingOperations();
      expect(pending[0].timestamp).toBeDefined();
      expect(pending[0].timestamp).toBeLessThanOrEqual(Date.now());
    });

    test('should merge consecutive operations on same entity', async () => {
      const entityId = 'template-1';
      
      await syncQueue.enqueue({
        type: 'UPDATE',
        entity: 'template',
        entityId,
        data: { name: 'First Update' }
      });
      
      await syncQueue.enqueue({
        type: 'UPDATE',
        entity: 'template',
        entityId,
        data: { name: 'Second Update', description: 'New description' }
      });
      
      const pending = syncQueue.getPendingOperations();
      
      expect(pending).toHaveLength(1);
      expect(pending[0].data).toEqual({
        name: 'Second Update',
        description: 'New description'
      });
    });
  });

  describe('sync processing', () => {
    test('should process queue automatically when started', async () => {
      await syncQueue.enqueue({ type: 'CREATE', entity: 'template', data: {} });
      
      syncQueue.start();
      
      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 150));
      
      expect(mockSyncFunction).toHaveBeenCalled();
      expect(syncQueue.getQueueSize()).toBe(0);
    });

    test('should batch operations', async () => {
      const operations = Array(8).fill(null).map((_, i) => ({
        type: 'CREATE',
        entity: 'template',
        data: { id: `template-${i}` }
      }));
      
      for (const op of operations) {
        await syncQueue.enqueue(op);
      }
      
      await syncQueue.processQueue();
      
      // Should be called twice: batch of 5 + batch of 3
      expect(mockSyncFunction).toHaveBeenCalledTimes(2);
      expect(mockSyncFunction.mock.calls[0][0]).toHaveLength(5);
      expect(mockSyncFunction.mock.calls[1][0]).toHaveLength(3);
    });

    test('should handle sync failures with retry', async () => {
      mockSyncFunction
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({ success: true });
      
      await syncQueue.enqueue({ type: 'CREATE', entity: 'template', data: {} });
      await syncQueue.processQueue();
      
      expect(mockSyncFunction).toHaveBeenCalledTimes(3);
      expect(syncQueue.getQueueSize()).toBe(0);
    });

    test('should respect max retries', async () => {
      mockSyncFunction.mockRejectedValue(new Error('Persistent error'));
      
      await syncQueue.enqueue({ type: 'CREATE', entity: 'template', data: {} });
      await syncQueue.processQueue();
      
      expect(mockSyncFunction).toHaveBeenCalledTimes(3); // maxRetries
      expect(syncQueue.getQueueSize()).toBe(1); // Still in queue
      expect(syncQueue.getFailedOperations()).toHaveLength(1);
    });

    test('should emit events during processing', async () => {
      const events = {
        processing: jest.fn(),
        success: jest.fn(),
        error: jest.fn(),
        complete: jest.fn()
      };
      
      Object.entries(events).forEach(([event, handler]) => {
        syncQueue.on(event, handler);
      });
      
      await syncQueue.enqueue({ type: 'CREATE', entity: 'template', data: {} });
      await syncQueue.processQueue();
      
      expect(events.processing).toHaveBeenCalled();
      expect(events.success).toHaveBeenCalled();
      expect(events.complete).toHaveBeenCalled();
      expect(events.error).not.toHaveBeenCalled();
    });
  });

  describe('offline handling', () => {
    test('should queue operations when offline', async () => {
      syncQueue.setOnlineStatus(false);
      
      await syncQueue.enqueue({ type: 'CREATE', entity: 'template', data: {} });
      
      // Should not attempt to sync when offline
      await syncQueue.processQueue();
      
      expect(mockSyncFunction).not.toHaveBeenCalled();
      expect(syncQueue.getQueueSize()).toBe(1);
    });

    test('should process queue when coming back online', async () => {
      syncQueue.setOnlineStatus(false);
      
      await syncQueue.enqueue({ type: 'CREATE', entity: 'template', data: {} });
      
      syncQueue.setOnlineStatus(true);
      
      // Should automatically process
      await new Promise(resolve => setTimeout(resolve, 150));
      
      expect(mockSyncFunction).toHaveBeenCalled();
      expect(syncQueue.getQueueSize()).toBe(0);
    });

    test('should persist queue to storage', async () => {
      const operations = [
        { type: 'CREATE', entity: 'template', data: { id: '1' } },
        { type: 'UPDATE', entity: 'workflow', data: { id: '2' } }
      ];
      
      for (const op of operations) {
        await syncQueue.enqueue(op);
      }
      
      await syncQueue.persistQueue();
      
      expect(mockStorage.set).toHaveBeenCalledWith(
        'sync-queue',
        expect.arrayContaining([
          expect.objectContaining(operations[0]),
          expect.objectContaining(operations[1])
        ])
      );
    });

    test('should restore queue from storage', async () => {
      const storedOperations = [
        { id: '1', type: 'CREATE', entity: 'template', data: {}, timestamp: Date.now() },
        { id: '2', type: 'UPDATE', entity: 'workflow', data: {}, timestamp: Date.now() }
      ];
      
      mockStorage.get.mockResolvedValue(storedOperations);
      
      const newQueue = new SyncQueue({ syncFunction: mockSyncFunction });
      await newQueue.restoreQueue();
      
      expect(newQueue.getQueueSize()).toBe(2);
      expect(newQueue.getPendingOperations()).toEqual(storedOperations);
    });
  });

  describe('conflict resolution', () => {
    test('should handle version conflicts', async () => {
      mockSyncFunction.mockRejectedValueOnce({
        code: 'VERSION_CONFLICT',
        serverVersion: 2,
        localVersion: 1
      });
      
      const conflictResolver = jest.fn().mockResolvedValue({
        resolved: true,
        data: { merged: true }
      });
      
      syncQueue.setConflictResolver(conflictResolver);
      
      await syncQueue.enqueue({
        type: 'UPDATE',
        entity: 'template',
        data: { version: 1 }
      });
      
      await syncQueue.processQueue();
      
      expect(conflictResolver).toHaveBeenCalled();
      expect(mockSyncFunction).toHaveBeenCalledTimes(2); // Retry after resolution
    });

    test('should skip operations that cannot be resolved', async () => {
      mockSyncFunction.mockRejectedValue({
        code: 'VERSION_CONFLICT'
      });
      
      const conflictResolver = jest.fn().mockResolvedValue({
        resolved: false,
        skip: true
      });
      
      syncQueue.setConflictResolver(conflictResolver);
      
      await syncQueue.enqueue({ type: 'UPDATE', entity: 'template', data: {} });
      await syncQueue.processQueue();
      
      expect(syncQueue.getQueueSize()).toBe(0);
      expect(syncQueue.getSkippedOperations()).toHaveLength(1);
    });
  });

  describe('priority handling', () => {
    test('should process high priority operations first', async () => {
      await syncQueue.enqueue({
        type: 'CREATE',
        entity: 'template',
        data: { id: 'low' },
        priority: 'low'
      });
      
      await syncQueue.enqueue({
        type: 'CREATE',
        entity: 'template',
        data: { id: 'high' },
        priority: 'high'
      });
      
      await syncQueue.enqueue({
        type: 'CREATE',
        entity: 'template',
        data: { id: 'normal' }
        // Default priority is normal
      });
      
      // Process one at a time to check order
      syncQueue.setBatchSize(1);
      
      await syncQueue.processQueue();
      
      const callOrder = mockSyncFunction.mock.calls.map(call => call[0][0].data.id);
      expect(callOrder).toEqual(['high', 'normal', 'low']);
    });
  });

  describe('operation deduplication', () => {
    test('should remove duplicate operations', async () => {
      const operation = {
        type: 'UPDATE',
        entity: 'template',
        entityId: 'template-1',
        data: { name: 'Updated' }
      };
      
      // Add same operation multiple times
      await syncQueue.enqueue(operation);
      await syncQueue.enqueue(operation);
      await syncQueue.enqueue(operation);
      
      expect(syncQueue.getQueueSize()).toBe(1);
    });

    test('should handle CREATE followed by DELETE', async () => {
      const entityId = 'template-1';
      
      await syncQueue.enqueue({
        type: 'CREATE',
        entity: 'template',
        entityId,
        data: { name: 'New Template' }
      });
      
      await syncQueue.enqueue({
        type: 'DELETE',
        entity: 'template',
        entityId
      });
      
      // Both operations should cancel out
      expect(syncQueue.getQueueSize()).toBe(0);
    });
  });

  describe('statistics and monitoring', () => {
    test('should track sync statistics', async () => {
      // Success
      await syncQueue.enqueue({ type: 'CREATE', entity: 'template', data: {} });
      await syncQueue.processQueue();
      
      // Failure
      mockSyncFunction.mockRejectedValue(new Error('Sync failed'));
      await syncQueue.enqueue({ type: 'UPDATE', entity: 'template', data: {} });
      await syncQueue.processQueue();
      
      const stats = syncQueue.getStatistics();
      
      expect(stats.totalOperations).toBe(2);
      expect(stats.successfulOperations).toBe(1);
      expect(stats.failedOperations).toBe(1);
      expect(stats.successRate).toBe(0.5);
      expect(stats.averageSyncTime).toBeGreaterThan(0);
    });

    test('should provide queue health status', () => {
      const health = syncQueue.getHealthStatus();
      
      expect(health).toMatchObject({
        queueSize: 0,
        isProcessing: false,
        isOnline: true,
        lastSyncTime: null,
        failureRate: 0
      });
    });
  });

  describe('cleanup and maintenance', () => {
    test('should clean up old failed operations', async () => {
      const oldTimestamp = Date.now() - (7 * 24 * 60 * 60 * 1000); // 7 days old
      
      // Mock failed operations
      syncQueue._failedOperations = [
        { id: '1', timestamp: oldTimestamp },
        { id: '2', timestamp: Date.now() }
      ];
      
      await syncQueue.cleanupOldOperations();
      
      expect(syncQueue.getFailedOperations()).toHaveLength(1);
      expect(syncQueue.getFailedOperations()[0].id).toBe('2');
    });

    test('should stop processing when destroyed', async () => {
      syncQueue.start();
      
      await syncQueue.enqueue({ type: 'CREATE', entity: 'template', data: {} });
      
      syncQueue.destroy();
      
      // Should not process after destroy
      await new Promise(resolve => setTimeout(resolve, 150));
      
      expect(mockSyncFunction).not.toHaveBeenCalled();
    });
  });
});