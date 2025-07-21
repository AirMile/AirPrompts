import React, { useEffect } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { AppProvider } from '../../store/appStore';
import { queryClient } from '../../store/queryClient';

// Component to prefetch data
function DataPrefetcher({ children }) {
  useEffect(() => {
    // Prefetch data on mount
    const prefetchData = async () => {
      await Promise.all([
        queryClient.prefetchQuery(['templates', 'list', {}], () => 
          import('../../services/storage/StorageService').then(m => m.StorageService.getTemplates())
        ),
        queryClient.prefetchQuery(['workflows', 'list', {}], () => 
          import('../../services/storage/StorageService').then(m => m.StorageService.getWorkflows())
        ),
        queryClient.prefetchQuery(['snippets', 'list', {}], () => 
          import('../../services/storage/StorageService').then(m => m.StorageService.getSnippets())
        )
      ]);
    };
    
    prefetchData();
  }, []);
  
  return children;
}

export function AppProviders({ children, initialData }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AppProvider initialData={initialData}>
        <DataPrefetcher>
          {children}
        </DataPrefetcher>
      </AppProvider>
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}