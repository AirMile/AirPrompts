import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Stale time: data blijft 5 minuten fresh
      staleTime: 5 * 60 * 1000,
      // Cache time: data blijft 10 minuten in cache
      cacheTime: 10 * 60 * 1000,
      // Retry logic
      retry: (failureCount, error) => {
        if (error.status === 404) return false;
        if (failureCount < 3) return true;
        return false;
      },
      // Refetch settings
      refetchOnWindowFocus: false,
      refetchOnReconnect: true
    },
    mutations: {
      // Optimistic updates by default
      onError: (error, variables, context) => {
        // Global error handling
        console.error('Mutation error:', error);
      }
    }
  }
});