import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { StorageService } from '../services/storage/StorageService';

// Keys voor query invalidation
export const workflowKeys = {
  all: ['workflows'],
  lists: () => [...workflowKeys.all, 'list'],
  list: (filters) => [...workflowKeys.lists(), { filters }],
  details: () => [...workflowKeys.all, 'detail'],
  detail: (id) => [...workflowKeys.details(), id]
};

// Fetch workflows hook
export function useWorkflows(filters = {}) {
  return useQuery({
    queryKey: workflowKeys.list(filters),
    queryFn: () => StorageService.getWorkflows(filters),
    keepPreviousData: true,
    placeholderData: []
  });
}

// Create workflow mutation
export function useCreateWorkflow() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (workflowData) => StorageService.createWorkflow(workflowData),
    onMutate: async (newWorkflow) => {
      await queryClient.cancelQueries({ queryKey: workflowKeys.lists() });
      
      const previousWorkflows = queryClient.getQueryData(workflowKeys.lists());
      
      queryClient.setQueryData(workflowKeys.lists(), (old = []) => [
        ...old,
        { ...newWorkflow, id: 'temp-' + Date.now() }
      ]);
      
      return { previousWorkflows };
    },
    onError: (err, newWorkflow, context) => {
      queryClient.setQueryData(
        workflowKeys.lists(),
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
  
  return useMutation({
    mutationFn: ({ id, ...updates }) => 
      StorageService.updateWorkflow({ id, ...updates }),
    onMutate: async ({ id, ...updates }) => {
      await queryClient.cancelQueries({ 
        queryKey: workflowKeys.detail(id) 
      });
      
      const previousWorkflow = queryClient.getQueryData(
        workflowKeys.detail(id)
      );
      
      queryClient.setQueryData(
        workflowKeys.detail(id),
        (old) => ({ ...old, ...updates })
      );
      
      return { previousWorkflow };
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(
        workflowKeys.detail(variables.id),
        context.previousWorkflow
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
  
  return useMutation({
    mutationFn: (id) => StorageService.deleteWorkflow(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: workflowKeys.lists() });
      
      const previousWorkflows = queryClient.getQueryData(workflowKeys.lists());
      
      queryClient.setQueryData(workflowKeys.lists(), (old = []) => 
        old.filter(workflow => workflow.id !== id)
      );
      
      return { previousWorkflows };
    },
    onError: (err, id, context) => {
      queryClient.setQueryData(
        workflowKeys.lists(),
        context.previousWorkflows
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: workflowKeys.lists() });
    }
  });
}