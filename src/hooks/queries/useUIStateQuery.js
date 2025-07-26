import { useState, useEffect, useCallback } from 'react';
import * as localStorage from '../../utils/localStorageManager';

// Hook for managing folder UI states
export const useFolderUIState = () => {
  const [folderStates, setFolderStates] = useState(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load folder states from localStorage
  const loadFolderStates = useCallback(async () => {
    try {
      setLoading(true);
      
      const states = localStorage.getFolderUIState();
      const statesMap = new Map();
      
      Object.entries(states).forEach(([folderId, state]) => {
        statesMap.set(folderId, Boolean(state.isExpanded));
      });
      
      setFolderStates(statesMap);
      setError(null);
    } catch (err) {
      console.error('Error loading folder UI states:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Set folder state (expanded/collapsed)
  const setFolderState = useCallback(async (folderId, isExpanded) => {
    try {
      console.log(`🔄 Setting folder state for: ${folderId} to ${isExpanded}`);
      
      // Optimistic update
      setFolderStates(prev => new Map(prev).set(folderId, isExpanded));

      // Save to localStorage
      localStorage.updateFolderUIState(folderId, isExpanded);
      
    } catch (err) {
      console.error('Error saving folder UI state:', err);
      setError(err.message);
      // Revert optimistic update
      await loadFolderStates();
    }
  }, [loadFolderStates]);

  // Get folder state
  const getFolderState = useCallback((folderId) => {
    // By default, folders should be expanded
    return folderStates.get(folderId) ?? true;
  }, [folderStates]);

  // Toggle folder state
  const toggleFolderState = useCallback((folderId) => {
    const currentState = getFolderState(folderId);
    return setFolderState(folderId, !currentState);
  }, [getFolderState, setFolderState]);

  // Load states on mount
  useEffect(() => {
    loadFolderStates();
  }, [loadFolderStates]);

  return {
    folderStates,
    loading,
    error,
    setFolderState,
    getFolderState,
    toggleFolderState,
    reloadStates: loadFolderStates
  };
};

// Hook for managing todo UI states
export const useTodoUIState = () => {
  const [todoStates, setTodoStates] = useState(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load todo states from localStorage
  const loadTodoStates = useCallback(async () => {
    try {
      setLoading(true);
      
      const todos = localStorage.getTodos();
      const statesMap = new Map();
      
      // For now, todos are not expanded by default
      todos.forEach(todo => {
        statesMap.set(todo.id, false);
      });
      
      setTodoStates(statesMap);
      setError(null);
    } catch (err) {
      console.error('Error loading todo UI states:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Set todo state (expanded/collapsed)
  const setTodoState = useCallback(async (todoId, isExpanded) => {
    try {
      console.log(`🔄 Setting todo state for: ${todoId} to ${isExpanded}`);
      
      // Optimistic update
      setTodoStates(prev => new Map(prev).set(todoId, isExpanded));
      
      // For now, we don't persist todo UI state to localStorage
      // but we could add it later if needed
      
    } catch (err) {
      console.error('Error saving todo UI state:', err);
      setError(err.message);
    }
  }, []);

  // Get todo state
  const getTodoState = useCallback((todoId) => {
    // By default, todos should be collapsed
    return todoStates.get(todoId) ?? false;
  }, [todoStates]);

  // Toggle todo state
  const toggleTodoState = useCallback((todoId) => {
    const currentState = getTodoState(todoId);
    return setTodoState(todoId, !currentState);
  }, [getTodoState, setTodoState]);

  // Load states on mount
  useEffect(() => {
    loadTodoStates();
  }, [loadTodoStates]);

  return {
    todoStates,
    loading,
    error,
    setTodoState,
    getTodoState,
    toggleTodoState,
    reloadStates: loadTodoStates
  };
};

// Hook for managing header UI states (per folder)
export const useHeaderUIState = () => {
  const [headerStates, setHeaderStates] = useState(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load header states from localStorage
  const loadHeaderStates = useCallback(async () => {
    try {
      setLoading(true);
      
      const states = localStorage.getHeaderUIState();
      const statesMap = new Map();
      
      Object.entries(states).forEach(([folderId, folderStates]) => {
        const folderMap = new Map();
        Object.entries(folderStates).forEach(([headerType, state]) => {
          folderMap.set(headerType, Boolean(state.isExpanded));
        });
        statesMap.set(folderId, folderMap);
      });
      
      setHeaderStates(statesMap);
      setError(null);
    } catch (err) {
      console.error('Error loading header UI states:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Set header state
  const setHeaderState = useCallback(async (folderId, headerType, isExpanded) => {
    try {
      console.log(`🔄 Setting header state for folder: ${folderId}, header: ${headerType} to ${isExpanded}`);
      
      // Optimistic update
      setHeaderStates(prev => {
        const newMap = new Map(prev);
        const folderStates = newMap.get(folderId) || new Map();
        folderStates.set(headerType, isExpanded);
        newMap.set(folderId, folderStates);
        return newMap;
      });

      // Save to localStorage
      localStorage.updateHeaderUIState(folderId, headerType, isExpanded);
      
    } catch (err) {
      console.error('Error saving header UI state:', err);
      setError(err.message);
      // Revert optimistic update
      await loadHeaderStates();
    }
  }, [loadHeaderStates]);

  // Get header state
  const getHeaderState = useCallback((folderId, headerType, defaultVisible = true) => {
    const folderStates = headerStates.get(folderId);
    if (!folderStates) return defaultVisible; // Use parameter
    return folderStates.get(headerType) ?? defaultVisible; // Use parameter
  }, [headerStates]);

  // Toggle header state
  const toggleHeaderState = useCallback((folderId, headerType) => {
    const currentState = getHeaderState(folderId, headerType);
    return setHeaderState(folderId, headerType, !currentState);
  }, [getHeaderState, setHeaderState]);

  // Load states on mount
  useEffect(() => {
    loadHeaderStates();
  }, [loadHeaderStates]);

  return {
    headerStates,
    loading,
    error,
    setHeaderState,
    getHeaderState,
    toggleHeaderState,
    reloadStates: loadHeaderStates
  };
};

// Hook for managing folder section visibility
export const useFolderSectionVisibility = (folderId, sectionType, defaultExpanded = true) => {
  const { getHeaderState, toggleHeaderState } = useHeaderUIState();
  
  const isVisible = getHeaderState(folderId, sectionType, defaultExpanded);
  
  const toggleVisibility = useCallback(() => {
    toggleHeaderState(folderId, sectionType);
  }, [folderId, sectionType, toggleHeaderState]);

  return {
    isVisible,
    toggleVisibility
  };
};

// Hook for managing section visibility (global)
export const useSectionVisibility = (sectionType, defaultExpanded = true) => {
  return useFolderSectionVisibility('global', sectionType, defaultExpanded);
};