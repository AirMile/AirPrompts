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
      
      // Process queue when online
      processQueue: async () => {
        const { queue } = get();
        const pending = queue.filter(item => item.status === 'pending');
        
        if (pending.length === 0) return;
        
        set({ syncStatus: 'syncing' });
        
        for (const item of pending) {
          try {
            // Process based on operation type
            switch (item.type) {
              case 'createTemplate':
                await StorageService.createTemplate(item.data);
                break;
              case 'updateTemplate':
                await StorageService.updateTemplate(item.data);
                break;
              case 'deleteTemplate':
                await StorageService.deleteTemplate(item.id);
                break;
              case 'createWorkflow':
                await StorageService.createWorkflow(item.data);
                break;
              case 'updateWorkflow':
                await StorageService.updateWorkflow(item.data);
                break;
              case 'deleteWorkflow':
                await StorageService.deleteWorkflow(item.id);
                break;
              case 'createSnippet':
                await StorageService.createSnippet(item.data);
                break;
              case 'updateSnippet':
                await StorageService.updateSnippet(item.data);
                break;
              case 'deleteSnippet':
                await StorageService.deleteSnippet(item.id);
                break;
            }
            
            // Mark as completed
            set((state) => ({
              queue: state.queue.map(q => 
                q.id === item.id 
                  ? { ...q, status: 'completed' }
                  : q
              )
            }));
          } catch (error) {
            // Handle retry logic
            set((state) => ({
              queue: state.queue.map(q => 
                q.id === item.id 
                  ? { 
                      ...q, 
                      status: 'error',
                      error: error.message,
                      retries: q.retries + 1
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
            queue: state.queue.filter(q => q.status !== 'completed')
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
            q.status === 'error' && q.retries < 3
              ? { ...q, status: 'pending' }
              : q
          )
        }));
      }
    }),
    {
      name: 'airprompts-sync-queue'
    }
  )
);