import { useState, useEffect } from 'react';
import { useUIStore } from '../store/useUIStore';

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isAPIHealthy, setIsAPIHealthy] = useState(false);
  
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      checkAPIHealth();
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      setIsAPIHealthy(false);
    };
    
    const checkAPIHealth = async () => {
      try {
        // Future: ping your API endpoint
        const response = await fetch('/api/health', { 
          method: 'HEAD',
          cache: 'no-cache' 
        }).catch(() => null);
        
        setIsAPIHealthy(response?.ok || false);
      } catch {
        setIsAPIHealthy(false);
      }
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Check API health on mount and periodically
    checkAPIHealth();
    const interval = setInterval(checkAPIHealth, 30000); // 30s
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);
  
  return { 
    isOnline, 
    isAPIHealthy,
    connectionStatus: isAPIHealthy ? 'api' : isOnline ? 'online' : 'offline'
  };
}