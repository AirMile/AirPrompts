import { useMutation } from '@tanstack/react-query';
import { useOnlineStatusStore } from '../domain/useOnlineStatus';
import { useSyncQueue } from '../../services/sync/SyncQueue';

/**
 * Helper hook to create offline-aware mutations
 * Automatically queues operations when offline
 */
export function useOfflineMutation(options) {
  const isOnline = useOnlineStatusStore((state) => state.isOnline);
  const addToQueue = useSyncQueue((state) => state.addToQueue);
  
  return useMutation({
    ...options,
    mutationFn: async (variables) => {
      // If offline, add to sync queue
      if (!isOnline && options.queueOperation) {
        const queueItem = options.queueOperation(variables);
        addToQueue(queueItem);
        
        // Return optimistic response if provided
        if (options.optimisticResponse) {
          return options.optimisticResponse(variables);
        }
        
        // Default optimistic response
        return { ...variables, id: variables.id || 'temp-' + Date.now() };
      }
      
      // If online, execute normal mutation
      return options.mutationFn(variables);
    }
  });
}