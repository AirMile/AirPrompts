/**
 * Preferences Storage Utilities
 * Provides localStorage management for user preferences with error handling and migration support
 */

// Storage key for preferences
const PREFERENCES_STORAGE_KEY = 'airprompts_preferences_v1';

// Default preferences structure
export const DEFAULT_PREFERENCES = {
  layout: {
    viewMode: 'list', // 'grid', 'list'
    cardSize: 'medium', // 'small', 'medium', 'large'
    columnsPerRow: 4, // 2-8 columns
    density: 'comfortable' // 'compact', 'comfortable'
  },
  sections: {
    workflows: { visible: true, collapsed: false },
    templates: { visible: true, collapsed: false },
    snippets: { visible: true, collapsed: false }
  },
  dashboard: {
    showFavorites: true,
    showRecent: true,
    recentCount: 10,
    favoriteCount: 5
  },
  filtering: {
    defaultPageSize: 24,
    useInfiniteScroll: false,
    rememberFilters: true,
    // TagFilter state persistence
    selectedTags: [],
    filterMode: 'OR',
    isExpanded: false,
    category: 'all',
    favoriteOnly: false,
    hasContent: false,
    type: 'all'
  },
  pagination: {
    // Per-section pagination settings (key: sectionType, value: { pageSize, currentPage })
    templates: { pageSize: 12, currentPage: 1 },
    workflows: { pageSize: 12, currentPage: 1 },
    snippets: { pageSize: 12, currentPage: 1 },
    // Global pagination preferences
    defaultPageSize: 12,
    pageSizeOptions: [12, 24, 48, 96]
  },
  accessibility: {
    highContrast: false,
    reducedMotion: false,
    keyboardNavigation: true
  },
  confirmActions: {
    deleteFolder: false,
    deleteTemplate: false,
    deleteWorkflow: false,
    deleteSnippet: false,
    deleteTodo: false
  },
  search: {
    history: [], // Array of recent search terms
    maxHistory: 10 // Maximum number of search terms to keep
  },
  sectionVisibility: {
    // Per-section visibility state (key: sectionId, value: boolean)
  }
};

/**
 * Load preferences from localStorage
 * @returns {Object} User preferences or default preferences
 */
export const loadPreferences = () => {
  try {
    const stored = localStorage.getItem(PREFERENCES_STORAGE_KEY);
    if (!stored) {
      return { ...DEFAULT_PREFERENCES };
    }

    const parsed = JSON.parse(stored);
    
    // Merge with defaults to ensure all properties exist
    return mergeWithDefaults(parsed);
  } catch (error) {
    console.warn('Failed to load preferences:', error);
    return { ...DEFAULT_PREFERENCES };
  }
};

/**
 * Save preferences to localStorage
 * @param {Object} preferences - User preferences to save
 */
export const savePreferences = (preferences) => {
  try {
    const merged = mergeWithDefaults(preferences);
    localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(merged));
    return true;
  } catch (error) {
    console.error('Failed to save preferences:', error);
    return false;
  }
};

/**
 * Merge user preferences with defaults to ensure all properties exist
 * @param {Object} userPreferences - User preferences to merge
 * @returns {Object} Merged preferences
 */
const mergeWithDefaults = (userPreferences) => {
  const merged = { ...DEFAULT_PREFERENCES };
  
  // Deep merge each section
  Object.keys(DEFAULT_PREFERENCES).forEach(section => {
    if (userPreferences[section] && typeof userPreferences[section] === 'object') {
      merged[section] = { ...DEFAULT_PREFERENCES[section], ...userPreferences[section] };
    }
  });

  return merged;
};

/**
 * Update specific preference section
 * @param {string} section - Section name (e.g., 'layout', 'dashboard')
 * @param {Object} updates - Updates to apply to the section
 */
export const updatePreferenceSection = (section, updates) => {
  const current = loadPreferences();
  
  if (!current[section]) {
    console.warn(`Unknown preference section: ${section}`);
    return false;
  }

  const updated = {
    ...current,
    [section]: { ...current[section], ...updates }
  };

  return savePreferences(updated);
};

/**
 * Reset preferences to defaults
 */
export const resetPreferences = () => {
  try {
    localStorage.removeItem(PREFERENCES_STORAGE_KEY);
    return true;
  } catch (error) {
    console.error('Failed to reset preferences:', error);
    return false;
  }
};

/**
 * Export preferences as JSON string
 * @returns {string} JSON string of preferences
 */
export const exportPreferences = () => {
  try {
    const preferences = loadPreferences();
    return JSON.stringify(preferences, null, 2);
  } catch (error) {
    console.error('Failed to export preferences:', error);
    return null;
  }
};

/**
 * Import preferences from JSON string
 * @param {string} jsonString - JSON string to import
 * @returns {boolean} Success status
 */
export const importPreferences = (jsonString) => {
  try {
    const parsed = JSON.parse(jsonString);
    return savePreferences(parsed);
  } catch (error) {
    console.error('Failed to import preferences:', error);
    return false;
  }
};

/**
 * Check if localStorage is available
 * @returns {boolean} Whether localStorage is available
 */
export const isLocalStorageAvailable = () => {
  try {
    const test = '__localStorage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
};

/**
 * Get storage usage information
 * @returns {Object} Storage usage stats
 */
export const getStorageInfo = () => {
  try {
    const preferences = localStorage.getItem(PREFERENCES_STORAGE_KEY);
    const preferencesSize = preferences ? preferences.length : 0;
    
    return {
      hasPreferences: !!preferences,
      preferencesSize,
      storageAvailable: isLocalStorageAvailable()
    };
  } catch {
    return {
      hasPreferences: false,
      preferencesSize: 0,
      storageAvailable: false
    };
  }
};

/**
 * Search history management helpers
 */
export const searchHistoryHelpers = {
  /**
   * Get search history from preferences
   * @returns {Array} Array of search terms
   */
  getHistory: () => {
    const preferences = loadPreferences();
    return preferences.search.history || [];
  },

  /**
   * Add a search term to history
   * @param {string} searchTerm - The search term to add
   */
  addSearch: (searchTerm) => {
    if (!searchTerm || !searchTerm.trim()) return;
    
    const preferences = loadPreferences();
    const history = preferences.search.history || [];
    const maxHistory = preferences.search.maxHistory || 10;
    
    // Remove existing instance and add to front
    const filtered = history.filter(term => term !== searchTerm);
    const updated = [searchTerm, ...filtered].slice(0, maxHistory);
    
    savePreferences({
      search: {
        ...preferences.search,
        history: updated
      }
    });
  },

  /**
   * Clear search history
   */
  clearHistory: () => {
    const preferences = loadPreferences();
    savePreferences({
      search: {
        ...preferences.search,
        history: []
      }
    });
  }
};

/**
 * Section visibility management helpers
 */
export const sectionVisibilityHelpers = {
  /**
   * Get section visibility state
   * @param {string} sectionId - The section identifier
   * @param {boolean} defaultVisible - Default visibility state
   * @returns {boolean} Whether the section is visible
   */
  getVisibility: (sectionId, defaultVisible = true) => {
    const preferences = loadPreferences();
    const visibility = preferences.sectionVisibility[sectionId];
    return visibility !== undefined ? visibility : defaultVisible;
  },

  /**
   * Set section visibility state
   * @param {string} sectionId - The section identifier
   * @param {boolean} isVisible - Whether the section should be visible
   */
  setVisibility: (sectionId, isVisible) => {
    const preferences = loadPreferences();
    savePreferences({
      sectionVisibility: {
        ...preferences.sectionVisibility,
        [sectionId]: isVisible
      }
    });
  },

  /**
   * Toggle section visibility
   * @param {string} sectionId - The section identifier
   * @param {boolean} defaultVisible - Default visibility state
   * @returns {boolean} New visibility state
   */
  toggleVisibility: (sectionId, defaultVisible = true) => {
    const currentVisibility = sectionVisibilityHelpers.getVisibility(sectionId, defaultVisible);
    const newVisibility = !currentVisibility;
    sectionVisibilityHelpers.setVisibility(sectionId, newVisibility);
    return newVisibility;
  }
};