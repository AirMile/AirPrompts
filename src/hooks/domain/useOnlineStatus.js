import { useEffect, useState } from 'react';
import { create } from 'zustand';

// Global online status store
export const useOnlineStatusStore = create((set) => ({
  isOnline: navigator.onLine,
  setOnline: (status) => set({ isOnline: status })
}));

// Hook to monitor online/offline status
export function useOnlineStatus() {
  const { isOnline, setOnline } = useOnlineStatusStore();
  const [hasBeenOffline, setHasBeenOffline] = useState(false);
  
  useEffect(() => {
    const handleOnline = () => {
      console.log('App is back online');
      setOnline(true);
      
      // Trigger sync queue processing when coming back online
      if (hasBeenOffline) {
        import('../../services/sync/SyncQueue').then(({ useSyncQueue }) => {
          const processQueue = useSyncQueue.getState().processQueue;
          processQueue();
        });
      }
    };
    
    const handleOffline = () => {
      console.log('App is offline');
      setOnline(false);
      setHasBeenOffline(true);
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Initial check
    if (!navigator.onLine) {
      handleOffline();
    }
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [hasBeenOffline, setOnline]);
  
  return { isOnline, hasBeenOffline };
}