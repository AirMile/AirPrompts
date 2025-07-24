import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';

// Hook for managing todo expanded/collapsed state
export const useTodoUIState = () => {
  const queryClient = useQueryClient();
  const [localUIState, setLocalUIState] = useState({});
  
  // Fetch UI state from server
  const { data: serverUIState = {} } = useQuery({
    queryKey: ['todoUIState'],
    queryFn: async () => {
      const response = await axios.get(`${API_BASE_URL}/ui-state/todos`);
      return response.data.reduce((acc, state) => {
        acc[state.todo_id] = state.is_expanded;
        return acc;
      }, {});
    },
    staleTime: Infinity, // UI state doesn't change often
  });
  
  // Mutation for updating UI state
  const updateUIStateMutation = useMutation({
    mutationFn: async ({ todoId, isExpanded }) => {
      await axios.patch(`${API_BASE_URL}/ui-state/todos/${todoId}`, { is_expanded: isExpanded });
    },
    onSuccess: (_, variables) => {
      // Update local cache
      queryClient.setQueryData(['todoUIState'], (old = {}) => ({
        ...old,
        [variables.todoId]: variables.isExpanded,
      }));
    },
  });
  
  // Combined UI state (local overrides server)
  const uiState = { ...serverUIState, ...localUIState };
  
  // Toggle expanded state
  const toggleExpanded = useCallback((todoId) => {
    const newState = !uiState[todoId];
    
    // Update local state immediately for responsiveness
    setLocalUIState(prev => ({ ...prev, [todoId]: newState }));
    
    // Persist to server
    updateUIStateMutation.mutate({ todoId, isExpanded: newState });
  }, [uiState, updateUIStateMutation]);
  
  // Set expanded state
  const setExpanded = useCallback((todoId, isExpanded) => {
    // Update local state immediately
    setLocalUIState(prev => ({ ...prev, [todoId]: isExpanded }));
    
    // Persist to server
    updateUIStateMutation.mutate({ todoId, isExpanded });
  }, [updateUIStateMutation]);
  
  // Expand all todos
  const expandAll = useCallback((todoIds) => {
    const updates = {};
    todoIds.forEach(id => {
      updates[id] = true;
    });
    
    // Update local state
    setLocalUIState(prev => ({ ...prev, ...updates }));
    
    // Batch update to server
    todoIds.forEach(todoId => {
      updateUIStateMutation.mutate({ todoId, isExpanded: true });
    });
  }, [updateUIStateMutation]);
  
  // Collapse all todos
  const collapseAll = useCallback((todoIds) => {
    const updates = {};
    todoIds.forEach(id => {
      updates[id] = false;
    });
    
    // Update local state
    setLocalUIState(prev => ({ ...prev, ...updates }));
    
    // Batch update to server
    todoIds.forEach(todoId => {
      updateUIStateMutation.mutate({ todoId, isExpanded: false });
    });
  }, [updateUIStateMutation]);
  
  // Check if a todo is expanded
  const isExpanded = useCallback((todoId) => {
    return uiState[todoId] || false;
  }, [uiState]);
  
  return {
    isExpanded,
    toggleExpanded,
    setExpanded,
    expandAll,
    collapseAll,
    isLoading: updateUIStateMutation.isPending,
  };
};

// Hook for managing the todo sidebar collapsed state
export const useTodoSidebarState = () => {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    // Load from localStorage
    const saved = localStorage.getItem('todoSidebarCollapsed');
    return saved ? JSON.parse(saved) : false;
  });
  
  const toggleSidebar = useCallback(() => {
    setIsCollapsed(prev => {
      const newState = !prev;
      localStorage.setItem('todoSidebarCollapsed', JSON.stringify(newState));
      return newState;
    });
  }, []);
  
  const setSidebarCollapsed = useCallback((collapsed) => {
    setIsCollapsed(collapsed);
    localStorage.setItem('todoSidebarCollapsed', JSON.stringify(collapsed));
  }, []);
  
  return {
    isCollapsed,
    toggleSidebar,
    setSidebarCollapsed,
  };
};