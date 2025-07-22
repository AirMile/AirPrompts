import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { StorageService } from '../../services/storage/StorageService';
import { useOfflineMutation } from './useOfflineMutation';
import { loadWorkflowsWithFallback, saveWorkflowWithFallback } from '../../utils/dataStorage';
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
      // Gebruik API-first strategy
      const workflows = await loadWorkflowsWithFallback(defaultWorkflows);
      
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
      // Try API-first approach
      return await saveWorkflowWithFallback(workflowData, 'create');
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
      // Try API-first approach
      return await saveWorkflowWithFallback({ id, ...updates }, 'update');
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
      // Try API-first approach for delete
      try {
        const response = await fetch(`http://localhost:3001/api/workflows/${id}`, {
          method: 'DELETE'
        });
        
        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            console.log('✅ Workflow deleted via API:', id);
            return result.data;
          }
        }
        throw new Error('API request failed');
      } catch (error) {
        console.warn('⚠️ API failed, workflow delete queued for sync:', error.message);
        // Voor delete operations, we kunnen fallback naar localStorage
        return { id, deleted: true };
      }
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