import React, { useEffect } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { AppProvider } from '../../store/appStore.jsx';
import { queryClient } from '../../store/queryClient';

// Component to prefetch data
function DataPrefetcher({ children }) {
  useEffect(() => {
    // Prefetch data on mount
    const prefetchData = async () => {
      await Promise.all([
        queryClient.prefetchQuery({
          queryKey: ['templates', 'list', {}],
          queryFn: () => import('../../services/storage/StorageService').then(m => m.StorageService.getTemplates())
        }),
        queryClient.prefetchQuery({
          queryKey: ['workflows', 'list', {}],
          queryFn: () => import('../../services/storage/StorageService').then(m => m.StorageService.getWorkflows())
        }),
        queryClient.prefetchQuery({
          queryKey: ['snippets', 'list', {}],
          queryFn: () => import('../../services/storage/StorageService').then(m => m.StorageService.getSnippets())
        })
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
      {import.meta.env.DEV && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}