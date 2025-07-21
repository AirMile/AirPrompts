import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { StorageService } from '../services/storage/StorageService';

// Keys voor query invalidation
export const templateKeys = {
  all: ['templates'],
  lists: () => [...templateKeys.all, 'list'],
  list: (filters) => [...templateKeys.lists(), { filters }],
  details: () => [...templateKeys.all, 'detail'],
  detail: (id) => [...templateKeys.details(), id]
};

// Fetch templates hook
export function useTemplates(filters = {}) {
  return useQuery({
    queryKey: templateKeys.list(filters),
    queryFn: async () => {
      const StorageModule = await import('../services/storage/StorageService');
      return StorageModule.StorageService.getTemplates(filters);
    },
    // Keep previous data while fetching new
    keepPreviousData: true,
    // Placeholder data voor instant UI
    placeholderData: []
  });
}

// Create template mutation
export function useCreateTemplate() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (templateData) => StorageService.createTemplate(templateData),
    // Optimistic update
    onMutate: async (newTemplate) => {
      await queryClient.cancelQueries({ queryKey: templateKeys.lists() });
      
      const previousTemplates = queryClient.getQueryData(templateKeys.lists());
      
      queryClient.setQueryData(templateKeys.lists(), (old = []) => [
        ...old,
        { ...newTemplate, id: 'temp-' + Date.now() }
      ]);
      
      return { previousTemplates };
    },
    // Rollback on error
    onError: (err, newTemplate, context) => {
      queryClient.setQueryData(
        templateKeys.lists(),
        context.previousTemplates
      );
    },
    // Refetch on success
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: templateKeys.lists() });
    }
  });
}

// Update template mutation
export function useUpdateTemplate() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, ...updates }) => 
      StorageService.updateTemplate({ id, ...updates }),
    // Optimistic update specific template
    onMutate: async ({ id, ...updates }) => {
      await queryClient.cancelQueries({ 
        queryKey: templateKeys.detail(id) 
      });
      
      const previousTemplate = queryClient.getQueryData(
        templateKeys.detail(id)
      );
      
      queryClient.setQueryData(
        templateKeys.detail(id),
        (old) => ({ ...old, ...updates })
      );
      
      return { previousTemplate };
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(
        templateKeys.detail(variables.id),
        context.previousTemplate
      );
    },
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: templateKeys.detail(variables.id) 
      });
    }
  });
}

// Delete template mutation
export function useDeleteTemplate() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id) => StorageService.deleteTemplate(id),
    // Optimistic delete
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: templateKeys.lists() });
      
      const previousTemplates = queryClient.getQueryData(templateKeys.lists());
      
      queryClient.setQueryData(templateKeys.lists(), (old = []) => 
        old.filter(template => template.id !== id)
      );
      
      return { previousTemplates };
    },
    onError: (err, id, context) => {
      queryClient.setQueryData(
        templateKeys.lists(),
        context.previousTemplates
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: templateKeys.lists() });
    }
  });
}