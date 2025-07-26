import { useState, useEffect, useCallback } from 'react';
import { 
  getFolderFavorites, 
  toggleFolderFavoriteById, 
  migrateLegacyFolderFavorites 
} from '../utils/localStorageManager';

/**
 * Custom hook for managing favorites with React best practices
 * @param {string} type - Type of favorites ('folders' currently, extensible for 'items')
 * @param {string} folderId - For future item favorites scoped to folders
 * @returns {Object} Favorites state and actions
 */
export const useFavorites = (type = 'folders', _folderId = null) => {
  // Lazy initial state to avoid expensive operations on every render
  const [favorites, setFavorites] = useState(() => {
    try {
      if (type === 'folders') {
        // Run migration on first load
        migrateLegacyFolderFavorites();
        return getFolderFavorites();
      }
      // Future: extend for items
      return new Set();
    } catch (error) {
      console.error('Error initializing favorites:', error);
      return new Set();
    }
  });

  // Sync with localStorage on mount and when external changes occur
  useEffect(() => {
    if (type === 'folders') {
      // Listen for storage events to sync across tabs/windows
      const handleStorageChange = (event) => {
        if (event.key === 'airprompts_folder_favorites') {
          try {
            const newFavorites = getFolderFavorites();
            setFavorites(newFavorites);
          } catch (error) {
            console.error('Error syncing favorites from storage:', error);
          }
        }
      };

      window.addEventListener('storage', handleStorageChange);
      return () => window.removeEventListener('storage', handleStorageChange);
    }
  }, [type]);

  // Memoized toggle function for performance
  const toggle = useCallback((id) => {
    if (type === 'folders') {
      try {
        const newFavorites = toggleFolderFavoriteById(id);
        if (newFavorites) {
          setFavorites(newFavorites);
          return newFavorites;
        } else {
          console.error('Failed to toggle folder favorite');
          return favorites;
        }
      } catch (error) {
        console.error('Error toggling favorite:', error);
        return favorites;
      }
    }
    // Future: handle item favorites
    return favorites;
  }, [type, favorites]);

  // Memoized has function for efficient checks
  const has = useCallback((id) => {
    return favorites.has(id);
  }, [favorites]);

  // Memoized filter function for showing only favorites
  const showOnlyFavorites = useCallback((items) => {
    if (!Array.isArray(items)) {
      console.warn('showOnlyFavorites expects an array of items');
      return [];
    }
    
    return items.filter(item => {
      if (!item || !item.id) {
        console.warn('Invalid item in favorites filter:', item);
        return false;
      }
      return favorites.has(item.id);
    });
  }, [favorites]);

  // Get favorites count for UI display
  const count = favorites.size;

  // Get favorites as array for iteration
  const asArray = useCallback(() => {
    return Array.from(favorites);
  }, [favorites]);

  // Clear all favorites
  const clear = useCallback(() => {
    if (type === 'folders') {
      try {
        const newFavorites = new Set();
        // TODO: Implement clearAllFolderFavorites in localStorage manager
        setFavorites(newFavorites);
      } catch (error) {
        console.error('Error clearing favorites:', error);
      }
    }
  }, [type]);

  return {
    favorites,        // The Set of favorite IDs
    toggle,          // Function to toggle favorite status
    has,             // Function to check if item is favorite  
    showOnlyFavorites, // Function to filter arrays to only favorites
    count,           // Number of favorites
    asArray,         // Get favorites as array
    clear            // Clear all favorites
  };
};

// Export default for convenience
export default useFavorites;