import { useState, useEffect, useCallback } from 'react';

const BASE_URL = `${window.location.protocol}//${window.location.hostname}:3001/api/ui-state`;

// Hook for managing folder UI states
export const useFolderUIState = () => {
  const [folderStates, setFolderStates] = useState(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load folder states from database
  const loadFolderStates = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${BASE_URL}/folders`);
      
      if (!response.ok) {
        throw new Error('Failed to load folder UI states');
      }
      
      const result = await response.json();
      const statesMap = new Map();
      
      result.data.forEach(state => {
        statesMap.set(state.folder_id, Boolean(state.is_expanded));
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
      // Check if folder actually exists before trying to save state
      console.log(`🔄 Setting folder state for: ${folderId} to ${isExpanded}`);
      
      // Optimistic update
      setFolderStates(prev => new Map(prev).set(folderId, isExpanded));

      const response = await fetch(`${BASE_URL}/folder`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          folder_id: folderId,
          is_expanded: isExpanded
        })
      });

      if (!response.ok) {
        // Check if it's a foreign key constraint error (folder doesn't exist)
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          errorData = { error: { message: 'Unknown error' } };
        }
        
        console.warn(`⚠️  Failed to save UI state for folder ${folderId}:`, errorData);
        
        // Revert optimistic update on error
        setFolderStates(prev => {
          const newMap = new Map(prev);
          newMap.set(folderId, !isExpanded);
          return newMap;
        });
        
        // If it's a foreign key error, silently continue (folder doesn't exist)
        const errorString = JSON.stringify(errorData);
        if (response.status === 500 && errorString.includes('FOREIGN KEY constraint failed')) {
          console.log(`📝 Folder ${folderId} doesn't exist in database, continuing without saving state`);
          return; // Don't throw error, just continue
        }
        
        throw new Error('Failed to update folder UI state');
      }

      setError(null);
    } catch (err) {
      console.error('Error setting folder UI state:', err);
      setError(err.message);
    }
  }, []);

  // Get folder state (with default fallback)
  const getFolderState = useCallback((folderId, defaultExpanded = true) => {
    return folderStates.has(folderId) ? folderStates.get(folderId) : defaultExpanded;
  }, [folderStates]);

  // Batch update multiple folder states
  const setBatchFolderStates = useCallback(async (updates) => {
    try {
      // Optimistic update
      setFolderStates(prev => {
        const newMap = new Map(prev);
        updates.forEach(({ folder_id, is_expanded }) => {
          newMap.set(folder_id, is_expanded);
        });
        return newMap;
      });

      const response = await fetch(`${BASE_URL}/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          folder_states: updates
        })
      });

      if (!response.ok) {
        // Revert optimistic update on error
        await loadFolderStates();
        throw new Error('Failed to batch update folder UI states');
      }

      setError(null);
    } catch (err) {
      console.error('Error batch updating folder UI states:', err);
      setError(err.message);
    }
  }, [loadFolderStates]);

  useEffect(() => {
    loadFolderStates();
  }, [loadFolderStates]);

  return {
    folderStates,
    loading,
    error,
    setFolderState,
    getFolderState,
    setBatchFolderStates,
    reloadFolderStates: loadFolderStates
  };
};

// Hook for managing header UI states per folder
export const useHeaderUIState = () => {
  const [headerStates, setHeaderStates] = useState(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load header states from database
  const loadHeaderStates = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${BASE_URL}/headers`);
      
      if (!response.ok) {
        throw new Error('Failed to load header UI states');
      }
      
      const result = await response.json();
      const statesMap = new Map();
      
      result.data.forEach(state => {
        const key = `${state.folder_id}-${state.header_type}`;
        statesMap.set(key, Boolean(state.is_expanded));
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

  // Load header states for specific folder
  const loadHeaderStatesForFolder = useCallback(async (folderId) => {
    try {
      const response = await fetch(`${BASE_URL}/headers/${folderId}`);
      
      if (!response.ok) {
        throw new Error('Failed to load header UI states for folder');
      }
      
      const result = await response.json();
      
      setHeaderStates(prev => {
        const newMap = new Map(prev);
        result.data.forEach(state => {
          const key = `${state.folder_id}-${state.header_type}`;
          newMap.set(key, Boolean(state.is_expanded));
        });
        return newMap;
      });
      
      setError(null);
    } catch (err) {
      console.error('Error loading header UI states for folder:', err);
      setError(err.message);
    }
  }, []);

  // Set header state (expanded/collapsed)
  const setHeaderState = useCallback(async (folderId, headerType, isExpanded) => {
    try {
      const key = `${folderId}-${headerType}`;
      
      // Skip if state is already correct
      const currentState = headerStates.has(key) ? headerStates.get(key) : true;
      if (currentState === isExpanded) {
        return;
      }
      
      // Optimistic update
      setHeaderStates(prev => new Map(prev).set(key, isExpanded));

      const response = await fetch(`${BASE_URL}/header`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          folder_id: folderId,
          header_type: headerType,
          is_expanded: isExpanded
        })
      });

      if (!response.ok) {
        // Revert optimistic update on error
        setHeaderStates(prev => {
          const newMap = new Map(prev);
          newMap.set(key, !isExpanded);
          return newMap;
        });
        throw new Error('Failed to update header UI state');
      }

      setError(null);
    } catch (err) {
      console.error('Error setting header UI state:', err);
      setError(err.message);
    }
  }, [headerStates]);

  // Get header state (with default fallback)
  const getHeaderState = useCallback((folderId, headerType, defaultExpanded = true) => {
    const key = `${folderId}-${headerType}`;
    return headerStates.has(key) ? headerStates.get(key) : defaultExpanded;
  }, [headerStates]);

  // Batch update multiple header states
  const setBatchHeaderStates = useCallback(async (updates) => {
    try {
      // Optimistic update
      setHeaderStates(prev => {
        const newMap = new Map(prev);
        updates.forEach(({ folder_id, header_type, is_expanded }) => {
          const key = `${folder_id}-${header_type}`;
          newMap.set(key, is_expanded);
        });
        return newMap;
      });

      const response = await fetch(`${BASE_URL}/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          header_states: updates
        })
      });

      if (!response.ok) {
        // Revert optimistic update on error
        await loadHeaderStates();
        throw new Error('Failed to batch update header UI states');
      }

      setError(null);
    } catch (err) {
      console.error('Error batch updating header UI states:', err);
      setError(err.message);
    }
  }, [loadHeaderStates]);

  useEffect(() => {
    loadHeaderStates();
  }, [loadHeaderStates]);

  return {
    headerStates,
    loading,
    error,
    setHeaderState,
    getHeaderState,
    setBatchHeaderStates,
    loadHeaderStatesForFolder,
    reloadHeaderStates: loadHeaderStates
  };
};

// Combined hook for both folder and header UI states
export const useUIState = () => {
  const folderHook = useFolderUIState();
  const headerHook = useHeaderUIState();

  const loading = folderHook.loading || headerHook.loading;
  const error = folderHook.error || headerHook.error;

  // Combined batch update for both folder and header states
  const setBatchUIStates = useCallback(async (folderUpdates = [], headerUpdates = []) => {
    try {
      const response = await fetch(`${BASE_URL}/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          folder_states: folderUpdates.length > 0 ? folderUpdates : undefined,
          header_states: headerUpdates.length > 0 ? headerUpdates : undefined
        })
      });

      if (!response.ok) {
        throw new Error('Failed to batch update UI states');
      }

      // Reload both states
      await Promise.all([
        folderHook.reloadFolderStates(),
        headerHook.reloadHeaderStates()
      ]);

    } catch (err) {
      console.error('Error batch updating UI states:', err);
      throw err;
    }
  }, [folderHook.reloadFolderStates, headerHook.reloadHeaderStates]);

  return {
    // Folder states
    folderStates: folderHook.folderStates,
    setFolderState: folderHook.setFolderState,
    getFolderState: folderHook.getFolderState,
    setBatchFolderStates: folderHook.setBatchFolderStates,
    
    // Header states
    headerStates: headerHook.headerStates,
    setHeaderState: headerHook.setHeaderState,
    getHeaderState: headerHook.getHeaderState,
    setBatchHeaderStates: headerHook.setBatchHeaderStates,
    loadHeaderStatesForFolder: headerHook.loadHeaderStatesForFolder,
    
    // Combined
    setBatchUIStates,
    loading,
    error,
    
    // Reload functions
    reloadFolderStates: folderHook.reloadFolderStates,
    reloadHeaderStates: headerHook.reloadHeaderStates
  };
};