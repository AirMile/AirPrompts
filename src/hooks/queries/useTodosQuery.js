import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';

// Fetch todos with optional filters
export const useTodosQuery = ({ folderId, status, priority, showGlobal = true } = {}) => {
  return useQuery({
    queryKey: ['todos', { folderId, status, priority, showGlobal }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (folderId) params.append('folder_id', folderId);
      if (status) params.append('status', status);
      if (priority) params.append('priority', priority);
      params.append('show_global', showGlobal);
      
      console.log('[DEBUG] useTodosQuery - Fetching todos with params:', {
        folderId, status, priority, showGlobal,
        url: `${API_BASE_URL}/todos?${params}`
      });
      
      const response = await axios.get(`${API_BASE_URL}/todos?${params}`);
      
      console.log('[DEBUG] useTodosQuery - Response received:', {
        status: response.status,
        dataLength: response.data?.length || 0,
        data: response.data
      });
      
      return response.data;
    },
    staleTime: 30000, // 30 seconds
    onError: (error) => {
      console.error('[DEBUG] useTodosQuery - Error:', error);
    }
  });
};

// Fetch single todo
export const useTodoQuery = (todoId) => {
  return useQuery({
    queryKey: ['todos', todoId],
    queryFn: async () => {
      const response = await axios.get(`${API_BASE_URL}/todos/${todoId}`);
      return response.data;
    },
    enabled: !!todoId,
  });
};

// Create todo mutation
export const useCreateTodoMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (todoData) => {
      console.log('[DEBUG] useCreateTodoMutation - Creating todo:', todoData);
      
      const response = await axios.post(`${API_BASE_URL}/todos`, todoData);
      
      console.log('[DEBUG] useCreateTodoMutation - Todo created:', {
        status: response.status,
        data: response.data
      });
      
      return response.data;
    },
    onSuccess: (data) => {
      console.log('[DEBUG] useCreateTodoMutation - onSuccess called:', data);
      
      // Invalidate all todo queries to refresh the lists
      queryClient.invalidateQueries({ queryKey: ['todos'] });
      
      // Also invalidate folder stats if we track them
      if (data.folder_id) {
        queryClient.invalidateQueries({ queryKey: ['todoStats', data.folder_id] });
      }
    },
    onError: (error) => {
      console.error('[DEBUG] useCreateTodoMutation - Error:', error);
    }
  });
};

// Update todo mutation
export const useUpdateTodoMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...todoData }) => {
      const response = await axios.put(`${API_BASE_URL}/todos/${id}`, todoData);
      return response.data;
    },
    onSuccess: (data, variables) => {
      // Update specific todo cache
      queryClient.setQueryData(['todos', variables.id], data);
      
      // Invalidate list queries
      queryClient.invalidateQueries({ 
        queryKey: ['todos'], 
        predicate: (query) => {
          // Only invalidate list queries, not individual todo queries
          return query.queryKey.length === 2 && typeof query.queryKey[1] === 'object';
        }
      });
      
      // Invalidate stats
      if (data.folder_id) {
        queryClient.invalidateQueries({ queryKey: ['todoStats', data.folder_id] });
      }
    },
  });
};

// Update todo status mutation
export const useUpdateTodoStatusMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, status }) => {
      console.log('[DEBUG] useUpdateTodoStatusMutation - Updating status:', { id, status });
      
      const response = await axios.patch(`${API_BASE_URL}/todos/${id}/status`, { status });
      
      console.log('[DEBUG] useUpdateTodoStatusMutation - Status updated:', {
        status: response.status,
        data: response.data
      });
      
      return response.data;
    },
    onSuccess: (data, variables) => {
      console.log('[DEBUG] useUpdateTodoStatusMutation - onSuccess:', { data, variables });
      
      // Optimistically update the todo in cache
      queryClient.setQueryData(['todos', variables.id], data);
      
      // Invalidate list queries
      queryClient.invalidateQueries({ 
        queryKey: ['todos'], 
        predicate: (query) => {
          return query.queryKey.length === 2 && typeof query.queryKey[1] === 'object';
        }
      });
    },
    onError: (error) => {
      console.error('[DEBUG] useUpdateTodoStatusMutation - Error:', error);
    }
  });
};

// Delete todo mutation
export const useDeleteTodoMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id) => {
      console.log('[DEBUG] useDeleteTodoMutation - Deleting todo:', id);
      
      await axios.delete(`${API_BASE_URL}/todos/${id}`);
      
      console.log('[DEBUG] useDeleteTodoMutation - Todo deleted:', id);
      
      return id;
    },
    onSuccess: (id) => {
      console.log('[DEBUG] useDeleteTodoMutation - onSuccess:', id);
      
      // Remove from cache
      queryClient.removeQueries({ queryKey: ['todos', id] });
      
      // Invalidate list queries
      queryClient.invalidateQueries({ queryKey: ['todos'] });
    },
    onError: (error) => {
      console.error('[DEBUG] useDeleteTodoMutation - Error:', error);
    }
  });
};

// Batch update sort order mutation
export const useBatchUpdateTodoSortOrderMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (updates) => {
      await axios.patch(`${API_BASE_URL}/todos/batch-sort-order`, { updates });
    },
    onSuccess: () => {
      // Invalidate all todo list queries
      queryClient.invalidateQueries({ 
        queryKey: ['todos'], 
        predicate: (query) => {
          return query.queryKey.length === 2 && typeof query.queryKey[1] === 'object';
        }
      });
    },
  });
};

// Fetch todo stats for a folder
export const useTodoStatsQuery = (folderId) => {
  return useQuery({
    queryKey: ['todoStats', folderId],
    queryFn: async () => {
      const response = await axios.get(`${API_BASE_URL}/todos/stats/${folderId}`);
      return response.data;
    },
    enabled: !!folderId,
    staleTime: 60000, // 1 minute
  });
};