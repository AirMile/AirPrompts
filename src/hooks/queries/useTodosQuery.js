import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as localStorage from '../../utils/localStorageManager';

// Fetch todos with optional filters
export const useTodosQuery = ({ folderId, status, priority, showGlobal = true } = {}) => {
  return useQuery({
    queryKey: ['todos', { folderId, status, priority, showGlobal }],
    queryFn: async () => {
      console.log('[DEBUG] useTodosQuery - Fetching todos with params:', {
        folderId, status, priority, showGlobal
      });
      
      // Get all todos from localStorage
      const allTodos = localStorage.getTodos();
      
      // Filter todos based on criteria
      let filteredTodos = allTodos;
      
      // Filter by folder
      if (folderId) {
        filteredTodos = filteredTodos.filter(todo => {
          if (showGlobal && todo.is_global) return true;
          return todo.folder_id === folderId || 
                 (todo.folderIds && todo.folderIds.includes(folderId));
        });
      }
      
      // Filter by status
      if (status && status !== 'all') {
        filteredTodos = filteredTodos.filter(todo => todo.status === status);
      }
      
      // Filter by priority
      if (priority && priority !== 'all') {
        filteredTodos = filteredTodos.filter(todo => todo.priority === priority);
      }
      
      // Sort by sort_order
      filteredTodos.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
      
      console.log('[DEBUG] useTodosQuery - Filtered todos:', {
        totalCount: allTodos.length,
        filteredCount: filteredTodos.length,
        data: filteredTodos
      });
      
      return filteredTodos;
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
      const todo = localStorage.getTodo(todoId);
      if (!todo) throw new Error('Todo not found');
      return todo;
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
      
      const newTodo = localStorage.createTodo({
        ...todoData,
        status: todoData.status || 'to_do',
        priority: todoData.priority || 'could',
        is_global: todoData.is_global || false,
        sort_order: todoData.sort_order || Date.now()
      });
      
      console.log('[DEBUG] useCreateTodoMutation - Todo created:', newTodo);
      
      return newTodo;
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
      const updatedTodo = localStorage.updateTodo(id, todoData);
      if (!updatedTodo) throw new Error('Failed to update todo');
      return updatedTodo;
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
      
      const updatedTodo = localStorage.updateTodo(id, { status });
      if (!updatedTodo) throw new Error('Failed to update todo status');
      
      console.log('[DEBUG] useUpdateTodoStatusMutation - Status updated:', updatedTodo);
      
      return updatedTodo;
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
      
      const success = localStorage.deleteTodo(id);
      if (!success) throw new Error('Failed to delete todo');
      
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
      // Update each todo's sort_order
      updates.forEach(update => {
        localStorage.updateTodo(update.id, { sort_order: update.sort_order });
      });
      return true;
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
      const allTodos = localStorage.getTodos();
      
      // Filter todos for this folder
      const folderTodos = allTodos.filter(todo => 
        todo.folder_id === folderId || 
        (todo.folderIds && todo.folderIds.includes(folderId)) ||
        todo.is_global
      );
      
      // Calculate stats
      const stats = {
        total: folderTodos.length,
        by_status: {
          to_do: folderTodos.filter(t => t.status === 'to_do').length,
          doing: folderTodos.filter(t => t.status === 'doing').length,
          done: folderTodos.filter(t => t.status === 'done').length
        },
        by_priority: {
          critical: folderTodos.filter(t => t.priority === 'critical').length,
          important: folderTodos.filter(t => t.priority === 'important').length,
          should: folderTodos.filter(t => t.priority === 'should').length,
          could: folderTodos.filter(t => t.priority === 'could').length,
          nice_to_have: folderTodos.filter(t => t.priority === 'nice_to_have').length
        }
      };
      
      return stats;
    },
    enabled: !!folderId,
    staleTime: 60000, // 1 minute
  });
};