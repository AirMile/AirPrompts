import { useState, useEffect, useMemo, useCallback } from 'react';
import { useUserPreferences } from './useUserPreferences.js';
import { 
  optimizedFilter,
  extractAllTags, 
  validateFilters,
  clearFilterCache,
  getTagStats
} from '../utils/filterUtils.js';

/**
 * Custom hook for managing filter state and operations
 * @param {Object} itemCollections - Object containing arrays of items to filter
 * @param {Object} options - Configuration options
 * @returns {Object} Filter state and operations
 */
const useFilters = (itemCollections = {}, options = {}) => {
  const {
    persistFilters = true,
    defaultFilterMode = 'OR',
    enableTagAnalytics = true
  } = options;

  // Get preferences system for persistence
  const { filtering, updateFiltering } = useUserPreferences();

  // Local filter state
  const [localFilters, setLocalFilters] = useState(() => {
    const defaultFilters = {
      selectedTags: [],
      filterMode: defaultFilterMode,
      category: 'all',
      favoriteOnly: false,
      hasContent: false,
      type: 'all',
      isExpanded: false
    };
    
    // Use persisted filters if available and persistence is enabled
    if (persistFilters && filtering) {
      return {
        ...defaultFilters,
        ...filtering,
        // Override with any provided defaults
        filterMode: filtering.filterMode || defaultFilterMode
      };
    }
    
    return defaultFilters;
  });

  // Debounced filter update to prevent excessive re-renders
  const [debouncedFilters, setDebouncedFilters] = useState(localFilters);

  useEffect(() => {
    // Use longer debounce for tag filters to improve performance
    const debounceTime = localFilters.selectedTags?.length > 0 ? 300 : 150;
    
    const timeoutId = setTimeout(() => {
      setDebouncedFilters(localFilters);
    }, debounceTime);

    return () => clearTimeout(timeoutId);
  }, [localFilters]);

  // Persist filters to preferences after state update
  useEffect(() => {
    if (persistFilters) {
      updateFiltering(localFilters);
    }
  }, [localFilters, persistFilters, updateFiltering]);

  // Extract all available tags from all item collections
  const availableTags = useMemo(() => {
    return extractAllTags(itemCollections);
  }, [itemCollections]);

  // Update filter state
  const updateFilters = useCallback((updates) => {
    setLocalFilters(prev => {
      const newFilters = { ...prev, ...updates };
      return validateFilters(newFilters);
    });
  }, []);

  // Specific filter update functions
  const setSelectedTags = useCallback((tags) => {
    updateFilters({ selectedTags: tags });
  }, [updateFilters]);

  const setFilterMode = useCallback((mode) => {
    updateFilters({ filterMode: mode });
  }, [updateFilters]);

  const setCategory = useCallback((category) => {
    updateFilters({ category });
  }, [updateFilters]);

  const setFavoriteOnly = useCallback((favoriteOnly) => {
    updateFilters({ favoriteOnly });
  }, [updateFilters]);

  const setHasContent = useCallback((hasContent) => {
    updateFilters({ hasContent });
  }, [updateFilters]);

  const setType = useCallback((type) => {
    updateFilters({ type });
  }, [updateFilters]);

  const setIsExpanded = useCallback((isExpanded) => {
    updateFilters({ isExpanded });
  }, [updateFilters]);

  // Add tag to selected tags
  const addTag = useCallback((tag) => {
    if (!debouncedFilters.selectedTags.includes(tag)) {
      setSelectedTags([...debouncedFilters.selectedTags, tag]);
    }
  }, [debouncedFilters.selectedTags, setSelectedTags]);

  // Remove tag from selected tags
  const removeTag = useCallback((tag) => {
    setSelectedTags(debouncedFilters.selectedTags.filter(t => t !== tag));
  }, [debouncedFilters.selectedTags, setSelectedTags]);

  // Toggle tag selection
  const toggleTag = useCallback((tag) => {
    if (debouncedFilters.selectedTags.includes(tag)) {
      removeTag(tag);
    } else {
      addTag(tag);
    }
  }, [debouncedFilters.selectedTags, addTag, removeTag]);

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    const resetFilters = {
      selectedTags: [],
      filterMode: defaultFilterMode,
      category: 'all',
      favoriteOnly: false,
      hasContent: false,
      type: 'all'
    };
    
    updateFilters(resetFilters);
    
    // Clear cache when filters are reset
    clearFilterCache();
  }, [defaultFilterMode, updateFilters]);

  // Clear only tag filters
  const clearTagFilters = useCallback(() => {
    setSelectedTags([]);
  }, [setSelectedTags]);

  // Apply filters to a specific item collection with performance optimization
  const applyFilters = useCallback((items, itemType) => {
    if (!items || items.length === 0) return [];
    
    // Use optimized filtering for better performance with large datasets
    // Enable progressive loading for very large datasets
    const isVeryLarge = items.length > 10000;
    return optimizedFilter(items, debouncedFilters, itemType, {
      progressive: isVeryLarge,
      batchSize: 1000
    });
  }, [debouncedFilters]);

  // Get filtered results for all item collections
  const filteredCollections = useMemo(() => {
    const results = {};
    
    Object.keys(itemCollections).forEach(key => {
      const items = itemCollections[key];
      if (Array.isArray(items)) {
        // Determine item type from collection key
        let itemType = key;
        if (key.endsWith('s')) {
          itemType = key.slice(0, -1); // Remove 's' (templates -> template)
        }
        
        results[key] = applyFilters(items, itemType);
      }
    });
    
    return results;
  }, [itemCollections, applyFilters]);

  // Get tag statistics if analytics are enabled
  const tagStats = useMemo(() => {
    if (!enableTagAnalytics) return null;
    
    const stats = {};
    
    Object.keys(itemCollections).forEach(key => {
      const items = itemCollections[key];
      if (Array.isArray(items)) {
        let itemType = key;
        if (key.endsWith('s')) {
          itemType = key.slice(0, -1);
        }
        
        stats[key] = getTagStats(items, itemType);
      }
    });
    
    return stats;
  }, [itemCollections, enableTagAnalytics]);

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return debouncedFilters.selectedTags.length > 0 ||
           debouncedFilters.category !== 'all' ||
           debouncedFilters.favoriteOnly ||
           debouncedFilters.hasContent ||
           debouncedFilters.type !== 'all';
  }, [debouncedFilters]);

  // Get count of filtered items
  const getFilteredCount = useCallback((itemType) => {
    if (!itemCollections[itemType]) return 0;
    
    const filtered = applyFilters(itemCollections[itemType], itemType);
    return filtered.length;
  }, [itemCollections, applyFilters]);

  // Get total count of items affected by filters
  const totalFilteredCount = useMemo(() => {
    let total = 0;
    Object.keys(filteredCollections).forEach(key => {
      if (Array.isArray(filteredCollections[key])) {
        total += filteredCollections[key].length;
      }
    });
    return total;
  }, [filteredCollections]);

  // Get total count of all items
  const totalItemCount = useMemo(() => {
    let total = 0;
    Object.keys(itemCollections).forEach(key => {
      if (Array.isArray(itemCollections[key])) {
        total += itemCollections[key].length;
      }
    });
    return total;
  }, [itemCollections]);

  // Filter efficiency metrics
  const filterEfficiency = useMemo(() => {
    if (totalItemCount === 0) return 0;
    return ((totalFilteredCount / totalItemCount) * 100).toFixed(1);
  }, [totalFilteredCount, totalItemCount]);

  // Export filter configuration
  const exportFilters = useCallback(() => {
    return {
      timestamp: new Date().toISOString(),
      filters: debouncedFilters,
      availableTags,
      stats: {
        totalItems: totalItemCount,
        filteredItems: totalFilteredCount,
        efficiency: filterEfficiency
      }
    };
  }, [debouncedFilters, availableTags, totalItemCount, totalFilteredCount, filterEfficiency]);

  // Import filter configuration
  const importFilters = useCallback((config) => {
    try {
      if (config.filters) {
        const validated = validateFilters(config.filters);
        updateFilters(validated);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error importing filters:', error);
      return false;
    }
  }, [updateFilters]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      clearFilterCache();
    };
  }, []);

  return {
    // Filter state
    filters: debouncedFilters,
    availableTags,
    hasActiveFilters,
    
    // Filtered results
    filteredCollections,
    totalFilteredCount,
    totalItemCount,
    filterEfficiency,
    
    // Filter operations
    updateFilters,
    setSelectedTags,
    setFilterMode,
    setCategory,
    setFavoriteOnly,
    setHasContent,
    setType,
    setIsExpanded,
    
    // Tag operations
    addTag,
    removeTag,
    toggleTag,
    clearTagFilters,
    
    // General operations
    clearAllFilters,
    applyFilters,
    getFilteredCount,
    
    // Analytics
    tagStats,
    
    // Import/Export
    exportFilters,
    importFilters,
    
    // Specific filter values for convenience
    selectedTags: debouncedFilters.selectedTags,
    filterMode: debouncedFilters.filterMode,
    category: debouncedFilters.category,
    favoriteOnly: debouncedFilters.favoriteOnly,
    hasContent: debouncedFilters.hasContent,
    type: debouncedFilters.type,
    isExpanded: debouncedFilters.isExpanded
  };
};

export default useFilters;