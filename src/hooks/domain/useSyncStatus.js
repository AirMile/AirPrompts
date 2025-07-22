import { useEffect } from 'react';
import { useSyncQueue } from '../../services/sync/SyncQueue';
import { useOnlineStatusStore } from './useOnlineStatus';

/**
 * Hook to monitor sync queue status
 * Provides visibility into pending operations without UI
 */
export function useSyncStatus() {
  const syncQueue = useSyncQueue();
  const isOnline = useOnlineStatusStore((state) => state.isOnline);
  
  // Monitor and log sync status changes
  useEffect(() => {
    const pendingCount = syncQueue.getPendingCount();
    
    if (pendingCount > 0) {
      console.log(`Sync Queue: ${pendingCount} operations pending`);
      
      // If online and has pending operations, trigger sync
      if (isOnline) {
        console.log('Processing pending operations...');
        syncQueue.processQueue();
      }
    }
  }, [syncQueue.queue, isOnline]);
  
  // Auto-retry failed operations when coming back online
  useEffect(() => {
    if (isOnline) {
      const failedOps = syncQueue.queue.filter(op => op.status === 'error' && op.retries < 3);
      if (failedOps.length > 0) {
        console.log(`Retrying ${failedOps.length} failed operations`);
        syncQueue.retryFailed();
        setTimeout(() => syncQueue.processQueue(), 1000);
      }
    }
  }, [isOnline, syncQueue.queue]);
  
  return {
    pendingCount: syncQueue.getPendingCount(),
    syncStatus: syncQueue.syncStatus,
    lastSyncAt: syncQueue.lastSyncAt
  };
}