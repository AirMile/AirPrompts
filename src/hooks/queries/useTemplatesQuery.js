import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { StorageService } from '../../services/storage/StorageService';
import { useOfflineMutation } from './useOfflineMutation';
import * as localStorage from '../../utils/localStorageManager';
import defaultTemplates from '../../data/defaultTemplates.json';

// Keys voor query invalidation
export const templateKeys = {
  all: ['templates'],
  lists: () => [...templateKeys.all, 'list'],
  list: (filters) => [...templateKeys.lists(), { filters }],
  details: () => [...templateKeys.all, 'detail'],
  detail: (id) => [...templateKeys.details(), id]
};

// Fetch templates hook - API-first met localStorage fallback
export function useTemplates(filters = {}) {
  return useQuery({
    queryKey: templateKeys.list(filters),
    queryFn: async () => {
      // Direct localStorage access
      const templates = localStorage.getTemplates();
      
      // Apply filters if any
      if (Object.keys(filters).length === 0) {
        return templates;
      }
      
      return templates.filter(template => {
        // Apply any filters here
        if (filters.category && template.category !== filters.category) {
          return false;
        }
        if (filters.favorite !== undefined && template.favorite !== filters.favorite) {
          return false;
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

// Create template mutation
export function useCreateTemplate() {
  const queryClient = useQueryClient();
  
  return useOfflineMutation({
    mutationFn: async (templateData) => {
      // Direct localStorage create
      return localStorage.createTemplate(templateData);
    },
    queueOperation: (templateData) => ({
      type: 'createTemplate',
      data: templateData
    }),
    optimisticResponse: (templateData) => ({
      ...templateData,
      id: templateData.id || 'temp-' + Date.now()
    }),
    // Optimistic update
    onMutate: async (newTemplate) => {
      await queryClient.cancelQueries({ queryKey: templateKeys.lists() });
      
      const previousTemplates = queryClient.getQueryData(templateKeys.list({}));
      
      queryClient.setQueryData(templateKeys.list({}), (old = []) => [
        ...old,
        { ...newTemplate, id: 'temp-' + Date.now() }
      ]);
      
      return { previousTemplates };
    },
    // Rollback on error
    onError: (err, newTemplate, context) => {
      queryClient.setQueryData(
        templateKeys.list({}),
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
  
  return useOfflineMutation({
    mutationFn: async ({ id, ...updates }) => {
      // Direct localStorage update
      return localStorage.updateTemplate(id, updates);
    },
    queueOperation: ({ id, ...updates }) => ({
      type: 'updateTemplate',
      data: { id, ...updates }
    }),
    // Optimistic update specific template
    onMutate: async ({ id, ...updates }) => {
      await queryClient.cancelQueries({ 
        queryKey: templateKeys.detail(id) 
      });
      await queryClient.cancelQueries({ 
        queryKey: templateKeys.lists() 
      });
      
      const previousTemplate = queryClient.getQueryData(
        templateKeys.detail(id)
      );
      const previousTemplates = queryClient.getQueryData(
        templateKeys.list({})
      );
      
      // Update detail view
      queryClient.setQueryData(
        templateKeys.detail(id),
        (old) => ({ ...old, ...updates })
      );
      
      // Update list view
      queryClient.setQueryData(
        templateKeys.list({}),
        (old = []) => old.map(template => 
          template.id === id ? { ...template, ...updates } : template
        )
      );
      
      return { previousTemplate, previousTemplates };
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(
        templateKeys.detail(variables.id),
        context.previousTemplate
      );
      queryClient.setQueryData(
        templateKeys.list({}),
        context.previousTemplates
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
  
  return useOfflineMutation({
    mutationFn: async (id) => {
      // Direct localStorage delete
      console.log('🗑️ Deleting template with id:', id);
      const result = localStorage.deleteTemplate(id);
      if (result) {
        console.log('✅ Template deleted successfully');
        return { id, deleted: true };
      }
      throw new Error('Failed to delete template');
    },
    queueOperation: (id) => ({
      type: 'deleteTemplate',
      id: id
    }),
    // Optimistic delete
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: templateKeys.lists() });
      
      const previousTemplates = queryClient.getQueryData(templateKeys.list({}));
      
      queryClient.setQueryData(templateKeys.list({}), (old = []) => 
        old.filter(template => template.id !== id)
      );
      
      return { previousTemplates };
    },
    onError: (err, id, context) => {
      console.error('❌ Failed to delete template:', err);
      queryClient.setQueryData(
        templateKeys.list({}),
        context.previousTemplates
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: templateKeys.lists() });
    }
  });
}