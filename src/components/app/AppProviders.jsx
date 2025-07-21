import React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { AppProvider } from '../../store/appStore';
import { queryClient } from '../../store/queryClient';

export function AppProviders({ children, initialData }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AppProvider initialData={initialData}>
        {children}
      </AppProvider>
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}