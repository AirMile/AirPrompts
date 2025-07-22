import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { StorageService } from '../storage/StorageService';

// Sync queue voor offline operaties
export const useSyncQueue = create(
  persist(
    (set, get) => ({
      queue: [],
      syncStatus: 'idle', // idle | syncing | error
      lastSyncAt: null,
      
      // Add operation to queue
      addToQueue: (operation) => {
        const queueItem = {
          id: crypto.randomUUID(),
          timestamp: Date.now(),
          status: 'pending',
          retries: 0,
          ...operation
        };
        
        set((state) => ({ 
          queue: [...state.queue, queueItem] 
        }));
      },
      
      // Process queue when online with enhanced error handling
      processQueue: async () => {
        const { queue } = get();
        const pending = queue.filter(item => item.status === 'pending');
        
        if (pending.length === 0) return;
        
        set({ syncStatus: 'syncing' });
        
        // Process items by priority: create > update > delete
        const prioritized = pending.sort((a, b) => {
          const priorities = {
            create: 3,
            update: 2, 
            delete: 1
          };
          
          const aPriority = priorities[a.type?.split(/[A-Z]/)[0]] || 0;
          const bPriority = priorities[b.type?.split(/[A-Z]/)[0]] || 0;
          
          return bPriority - aPriority;
        });

        for (const item of prioritized) {
          try {
            // Add exponential backoff for retries
            if (item.retries > 0) {
              const delay = Math.min(1000 * Math.pow(2, item.retries - 1), 10000);
              await new Promise(resolve => setTimeout(resolve, delay));
            }

            let result;
            
            // Process based on operation type
            switch (item.type) {
              case 'createTemplate':
                result = await StorageService.createTemplate(item.data);
                break;
              case 'updateTemplate':
                result = await StorageService.updateTemplate(item.data);
                break;
              case 'deleteTemplate':
                result = await StorageService.deleteTemplate(item.id);
                break;
              case 'createWorkflow':
                result = await StorageService.createWorkflow(item.data);
                break;
              case 'updateWorkflow':
                result = await StorageService.updateWorkflow(item.data);
                break;
              case 'deleteWorkflow':
                result = await StorageService.deleteWorkflow(item.id);
                break;
              case 'createSnippet':
                result = await StorageService.createSnippet(item.data);
                break;
              case 'updateSnippet':
                result = await StorageService.updateSnippet(item.data);
                break;
              case 'deleteSnippet':
                result = await StorageService.deleteSnippet(item.id);
                break;
              default:
                throw new Error(`Unknown operation type: ${item.type}`);
            }
            
            // Mark as completed with result
            set((state) => ({
              queue: state.queue.map(q => 
                q.id === item.id 
                  ? { 
                      ...q, 
                      status: 'completed',
                      completedAt: Date.now(),
                      result: result
                    }
                  : q
              )
            }));
            
          } catch (error) {
            console.warn(`Sync failed for ${item.type}:`, error.message);
            
            const maxRetries = 3;
            const willRetry = item.retries < maxRetries;
            
            // Handle different error types
            let errorType = 'unknown';
            if (error.message.includes('409')) {
              errorType = 'conflict';
            } else if (error.message.includes('404')) {
              errorType = 'not_found';
            } else if (error.message.includes('network') || error.message.includes('fetch')) {
              errorType = 'network';
            }
            
            set((state) => ({
              queue: state.queue.map(q => 
                q.id === item.id 
                  ? { 
                      ...q, 
                      status: willRetry ? 'pending' : 'failed',
                      error: error.message,
                      errorType,
                      retries: q.retries + 1,
                      nextRetryAt: willRetry ? Date.now() + (1000 * Math.pow(2, q.retries)) : null
                    }
                  : q
              )
            }));
          }
        }
        
        set({ 
          syncStatus: 'idle',
          lastSyncAt: Date.now()
        });
        
        // Clean completed items after 5 minutes
        setTimeout(() => {
          set((state) => ({
            queue: state.queue.filter(q => 
              q.status !== 'completed' || 
              (Date.now() - q.completedAt) < 5 * 60 * 1000
            )
          }));
        }, 5 * 60 * 1000);
      },
      
      // Clear queue
      clearQueue: () => set({ queue: [] }),
      
      // Get pending count
      getPendingCount: () => {
        const { queue } = get();
        return queue.filter(q => q.status === 'pending').length;
      },
      
      // Retry failed operations
      retryFailed: () => {
        set((state) => ({
          queue: state.queue.map(q => 
            q.status === 'failed' && q.retries < 3
              ? { ...q, status: 'pending', nextRetryAt: null }
              : q
          )
        }));
      },
      
      // Get queue statistics
      getQueueStats: () => {
        const { queue } = get();
        return {
          total: queue.length,
          pending: queue.filter(q => q.status === 'pending').length,
          completed: queue.filter(q => q.status === 'completed').length,
          failed: queue.filter(q => q.status === 'failed').length,
          byType: queue.reduce((acc, item) => {
            acc[item.type] = (acc[item.type] || 0) + 1;
            return acc;
          }, {}),
          oldestPending: queue
            .filter(q => q.status === 'pending')
            .sort((a, b) => a.timestamp - b.timestamp)[0]
        };
      },
      
      // Handle conflict resolution (server wins strategy)
      resolveConflicts: () => {
        set((state) => ({
          queue: state.queue.filter(q => q.errorType !== 'conflict')
        }));
      },
      
      // Bulk operations for efficiency
      addBulkOperations: (operations) => {
        const bulkItems = operations.map(op => ({
          id: crypto.randomUUID(),
          timestamp: Date.now(),
          status: 'pending',
          retries: 0,
          ...op
        }));
        
        set((state) => ({ 
          queue: [...state.queue, ...bulkItems] 
        }));
      }
    }),
    {
      name: 'airprompts-sync-queue'
    }
  )
);