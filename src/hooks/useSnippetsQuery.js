import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { StorageService } from '../services/storage/StorageService';

// Keys voor query invalidation
export const snippetKeys = {
  all: ['snippets'],
  lists: () => [...snippetKeys.all, 'list'],
  list: (filters) => [...snippetKeys.lists(), { filters }],
  details: () => [...snippetKeys.all, 'detail'],
  detail: (id) => [...snippetKeys.details(), id]
};

// Fetch snippets hook
export function useSnippets(filters = {}) {
  return useQuery({
    queryKey: snippetKeys.list(filters),
    queryFn: () => StorageService.getSnippets(filters),
    keepPreviousData: true,
    placeholderData: []
  });
}

// Create snippet mutation
export function useCreateSnippet() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (snippetData) => StorageService.createSnippet(snippetData),
    onMutate: async (newSnippet) => {
      await queryClient.cancelQueries({ queryKey: snippetKeys.lists() });
      
      const previousSnippets = queryClient.getQueryData(snippetKeys.lists());
      
      queryClient.setQueryData(snippetKeys.lists(), (old = []) => [
        ...old,
        { ...newSnippet, id: 'temp-' + Date.now() }
      ]);
      
      return { previousSnippets };
    },
    onError: (err, newSnippet, context) => {
      queryClient.setQueryData(
        snippetKeys.lists(),
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
  
  return useMutation({
    mutationFn: ({ id, ...updates }) => 
      StorageService.updateSnippet({ id, ...updates }),
    onMutate: async ({ id, ...updates }) => {
      await queryClient.cancelQueries({ 
        queryKey: snippetKeys.detail(id) 
      });
      
      const previousSnippet = queryClient.getQueryData(
        snippetKeys.detail(id)
      );
      
      queryClient.setQueryData(
        snippetKeys.detail(id),
        (old) => ({ ...old, ...updates })
      );
      
      return { previousSnippet };
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(
        snippetKeys.detail(variables.id),
        context.previousSnippet
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
  
  return useMutation({
    mutationFn: (id) => StorageService.deleteSnippet(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: snippetKeys.lists() });
      
      const previousSnippets = queryClient.getQueryData(snippetKeys.lists());
      
      queryClient.setQueryData(snippetKeys.lists(), (old = []) => 
        old.filter(snippet => snippet.id !== id)
      );
      
      return { previousSnippets };
    },
    onError: (err, id, context) => {
      queryClient.setQueryData(
        snippetKeys.lists(),
        context.previousSnippets
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: snippetKeys.lists() });
    }
  });
}