import { useCallback } from 'react';
import { useHeaderUIState } from '../queries/useUIStateQuery';

/**
 * Hook for managing section visibility state per folder with database persistence
 * @param {string} folderId - The folder ID this section belongs to
 * @param {string} sectionType - Type of section (templates, workflows, snippets, etc.)
 * @param {boolean} defaultVisible - Default visibility state
 * @returns {Object} { isVisible, toggle, setVisible, loading, error }
 */
const useFolderSectionVisibility = (folderId, sectionType, defaultVisible = true) => {
  const { getHeaderState, setHeaderState, loading, error } = useHeaderUIState();
  
  // Get current visibility state from the persistent store
  const isVisible = getHeaderState(folderId, sectionType, defaultVisible);
  
  // Toggle function with database persistence
  const toggle = useCallback(async () => {
    const newVisibility = !isVisible;
    try {
      await setHeaderState(folderId, sectionType, newVisibility);
    } catch (err) {
      console.error(`Error toggling section visibility for ${folderId}-${sectionType}:`, err);
    }
  }, [folderId, sectionType, isVisible, setHeaderState]);

  // Direct setter function with database persistence
  const setVisible = useCallback(async (visible) => {
    // Skip if state is already correct
    if (isVisible === visible) {
      return;
    }
    
    try {
      await setHeaderState(folderId, sectionType, visible);
    } catch (err) {
      console.error(`Error setting section visibility for ${folderId}-${sectionType}:`, err);
    }
  }, [folderId, sectionType, setHeaderState, isVisible]);

  return {
    isVisible,
    toggle,
    setVisible,
    loading,
    error
  };
};

export default useFolderSectionVisibility;