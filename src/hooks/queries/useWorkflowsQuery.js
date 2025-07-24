import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { StorageService } from '../../services/storage/StorageService';
import { useOfflineMutation } from './useOfflineMutation';
import * as localStorage from '../../utils/localStorageManager';
import defaultWorkflows from '../../data/defaultWorkflows.json';

// Keys voor query invalidation
export const workflowKeys = {
  all: ['workflows'],
  lists: () => [...workflowKeys.all, 'list'],
  list: (filters) => [...workflowKeys.lists(), { filters }],
  details: () => [...workflowKeys.all, 'detail'],
  detail: (id) => [...workflowKeys.details(), id]
};

// Fetch workflows hook - API-first met localStorage fallback
export function useWorkflows(filters = {}) {
  return useQuery({
    queryKey: workflowKeys.list(filters),
    queryFn: async () => {
      // Direct localStorage access
      const workflows = localStorage.getWorkflows();
      
      // Apply filters if any
      if (Object.keys(filters).length === 0) {
        return workflows;
      }
      
      return workflows.filter(workflow => {
        // Apply any filters here
        if (filters.category && workflow.category !== filters.category) {
          return false;
        }
        if (filters.favorite !== undefined && workflow.favorite !== filters.favorite) {
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

// Create workflow mutation
export function useCreateWorkflow() {
  const queryClient = useQueryClient();
  
  return useOfflineMutation({
    mutationFn: async (workflowData) => {
      // Direct localStorage create
      return localStorage.createWorkflow(workflowData);
    },
    queueOperation: (workflowData) => ({
      type: 'createWorkflow',
      data: workflowData
    }),
    optimisticResponse: (workflowData) => ({
      ...workflowData,
      id: workflowData.id || 'temp-' + Date.now()
    }),
    onMutate: async (newWorkflow) => {
      await queryClient.cancelQueries({ queryKey: workflowKeys.lists() });
      
      const previousWorkflows = queryClient.getQueryData(workflowKeys.list({}));
      
      queryClient.setQueryData(workflowKeys.list({}), (old = []) => [
        ...old,
        { ...newWorkflow, id: 'temp-' + Date.now() }
      ]);
      
      return { previousWorkflows };
    },
    onError: (err, newWorkflow, context) => {
      queryClient.setQueryData(
        workflowKeys.list({}),
        context.previousWorkflows
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: workflowKeys.lists() });
    }
  });
}

// Update workflow mutation
export function useUpdateWorkflow() {
  const queryClient = useQueryClient();
  
  return useOfflineMutation({
    mutationFn: async ({ id, ...updates }) => {
      // Direct localStorage update
      return localStorage.updateWorkflow(id, updates);
    },
    queueOperation: ({ id, ...updates }) => ({
      type: 'updateWorkflow',
      data: { id, ...updates }
    }),
    onMutate: async ({ id, ...updates }) => {
      await queryClient.cancelQueries({ 
        queryKey: workflowKeys.detail(id) 
      });
      await queryClient.cancelQueries({ 
        queryKey: workflowKeys.lists() 
      });
      
      const previousWorkflow = queryClient.getQueryData(
        workflowKeys.detail(id)
      );
      const previousWorkflows = queryClient.getQueryData(
        workflowKeys.list({})
      );
      
      // Update detail view
      queryClient.setQueryData(
        workflowKeys.detail(id),
        (old) => ({ ...old, ...updates })
      );
      
      // Update list view
      queryClient.setQueryData(
        workflowKeys.list({}),
        (old = []) => old.map(workflow => 
          workflow.id === id ? { ...workflow, ...updates } : workflow
        )
      );
      
      return { previousWorkflow, previousWorkflows };
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(
        workflowKeys.detail(variables.id),
        context.previousWorkflow
      );
      queryClient.setQueryData(
        workflowKeys.list({}),
        context.previousWorkflows
      );
    },
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: workflowKeys.detail(variables.id) 
      });
    }
  });
}

// Delete workflow mutation
export function useDeleteWorkflow() {
  const queryClient = useQueryClient();
  
  return useOfflineMutation({
    mutationFn: async (id) => {
      // Direct localStorage delete
      console.log('🗑️ Deleting workflow with id:', id);
      const result = localStorage.deleteWorkflow(id);
      if (result) {
        console.log('✅ Workflow deleted successfully');
        return { id, deleted: true };
      }
      throw new Error('Failed to delete workflow');
    },
    queueOperation: (id) => ({
      type: 'deleteWorkflow',
      id: id
    }),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: workflowKeys.lists() });
      
      const previousWorkflows = queryClient.getQueryData(workflowKeys.list({}));
      
      queryClient.setQueryData(workflowKeys.list({}), (old = []) => 
        old.filter(workflow => workflow.id !== id)
      );
      
      return { previousWorkflows };
    },
    onError: (err, id, context) => {
      queryClient.setQueryData(
        workflowKeys.list({}),
        context.previousWorkflows
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: workflowKeys.lists() });
    }
  });
}