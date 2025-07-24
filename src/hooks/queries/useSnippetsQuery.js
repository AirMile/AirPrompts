import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { StorageService } from '../../services/storage/StorageService';
import { useOfflineMutation } from './useOfflineMutation';
import * as localStorage from '../../utils/localStorageManager';
import defaultSnippets from '../../data/defaultSnippets.json';

// Keys voor query invalidation
export const snippetKeys = {
  all: ['snippets'],
  lists: () => [...snippetKeys.all, 'list'],
  list: (filters) => [...snippetKeys.lists(), { filters }],
  details: () => [...snippetKeys.all, 'detail'],
  detail: (id) => [...snippetKeys.details(), id]
};

// Fetch snippets hook - API-first met localStorage fallback
export function useSnippets(filters = {}) {
  return useQuery({
    queryKey: snippetKeys.list(filters),
    queryFn: async () => {
      // Direct localStorage access
      const snippets = localStorage.getSnippets();
      
      // Apply filters if any
      if (Object.keys(filters).length === 0) {
        return snippets;
      }
      
      return snippets.filter(snippet => {
        // Apply any filters here
        if (filters.category && snippet.category !== filters.category) {
          return false;
        }
        if (filters.favorite !== undefined && snippet.favorite !== filters.favorite) {
          return false;
        }
        if (filters.tags && filters.tags.length > 0) {
          const hasMatchingTag = filters.tags.some(tag => 
            snippet.tags && snippet.tags.includes(tag)
          );
          if (!hasMatchingTag) return false;
        }
        return true;
      });
    },
    // Keep previous data while fetching new
    keepPreviousData: true,
    // Placeholder data voor instant UI
    placeholderData: [],
    // Retry less aggressively for better offline experience
    retry: 1,
    retryDelay: 2000,
    // Cache for 5 minutes
    staleTime: 5 * 60 * 1000
  });
}

// Create snippet mutation
export function useCreateSnippet() {
  const queryClient = useQueryClient();
  
  return useOfflineMutation({
    mutationFn: async (snippetData) => {
      // Direct localStorage create
      return localStorage.createSnippet(snippetData);
    },
    queueOperation: (snippetData) => ({
      type: 'createSnippet',
      data: snippetData
    }),
    optimisticResponse: (snippetData) => ({
      ...snippetData,
      id: snippetData.id || 'temp-' + Date.now()
    }),
    onMutate: async (newSnippet) => {
      await queryClient.cancelQueries({ queryKey: snippetKeys.lists() });
      
      const previousSnippets = queryClient.getQueryData(snippetKeys.list({}));
      
      queryClient.setQueryData(snippetKeys.list({}), (old = []) => [
        ...old,
        { ...newSnippet, id: 'temp-' + Date.now() }
      ]);
      
      return { previousSnippets };
    },
    onError: (err, newSnippet, context) => {
      queryClient.setQueryData(
        snippetKeys.list({}),
        context.previousSnippets
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: snippetKeys.lists() });
    }
  });
}

// Update snippet mutation
export function useUpdateSnippet() {
  const queryClient = useQueryClient();
  
  return useOfflineMutation({
    mutationFn: async ({ id, ...updates }) => {
      // Direct localStorage update
      return localStorage.updateSnippet(id, updates);
    },
    queueOperation: ({ id, ...updates }) => ({
      type: 'updateSnippet',
      data: { id, ...updates }
    }),
    onMutate: async ({ id, ...updates }) => {
      await queryClient.cancelQueries({ 
        queryKey: snippetKeys.detail(id) 
      });
      await queryClient.cancelQueries({ 
        queryKey: snippetKeys.lists() 
      });
      
      const previousSnippet = queryClient.getQueryData(
        snippetKeys.detail(id)
      );
      const previousSnippets = queryClient.getQueryData(
        snippetKeys.list({})
      );
      
      // Update detail view
      queryClient.setQueryData(
        snippetKeys.detail(id),
        (old) => ({ ...old, ...updates })
      );
      
      // Update list view
      queryClient.setQueryData(
        snippetKeys.list({}),
        (old = []) => old.map(snippet => 
          snippet.id === id ? { ...snippet, ...updates } : snippet
        )
      );
      
      return { previousSnippet, previousSnippets };
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(
        snippetKeys.detail(variables.id),
        context.previousSnippet
      );
      queryClient.setQueryData(
        snippetKeys.list({}),
        context.previousSnippets
      );
    },
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: snippetKeys.detail(variables.id) 
      });
    }
  });
}

// Delete snippet mutation
export function useDeleteSnippet() {
  const queryClient = useQueryClient();
  
  return useOfflineMutation({
    mutationFn: async (id) => {
      // Direct localStorage delete
      console.log('🗑️ Deleting snippet with id:', id);
      const result = localStorage.deleteSnippet(id);
      if (result) {
        console.log('✅ Snippet deleted successfully');
        return { id, deleted: true };
      }
      throw new Error('Failed to delete snippet');
    },
    queueOperation: (id) => ({
      type: 'deleteSnippet',
      id: id
    }),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: snippetKeys.lists() });
      
      const previousSnippets = queryClient.getQueryData(snippetKeys.list({}));
      
      queryClient.setQueryData(snippetKeys.list({}), (old = []) => 
        old.filter(snippet => snippet.id !== id)
      );
      
      return { previousSnippets };
    },
    onError: (err, id, context) => {
      console.error('❌ Failed to delete snippet:', err);
      queryClient.setQueryData(
        snippetKeys.list({}),
        context.previousSnippets
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: snippetKeys.lists() });
    }
  });
}