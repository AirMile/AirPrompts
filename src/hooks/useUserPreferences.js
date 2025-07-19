import { useCallback, useMemo } from 'react';
import { usePreferences } from './usePreferences.js';

/**
 * Custom hook for managing user preferences
 * Provides a convenient interface for accessing and updating preferences
 * @returns {Object} Preference management functions and state
 */
export const useUserPreferences = () => {
  const {
    preferences,
    loading,
    error,
    updatePreferences,
    updateSection,
    resetToDefaults,
    exportSettings,
    importSettings,
    getPreference,
    setPreference
  } = usePreferences();

  // Layout preferences
  const layout = useMemo(() => ({
    viewMode: preferences.layout.viewMode,
    cardSize: preferences.layout.cardSize,
    columnsPerRow: preferences.layout.columnsPerRow,
    density: preferences.layout.density
  }), [preferences.layout]);

  const updateLayout = useCallback((updates) => {
    updateSection('layout', updates);
  }, [updateSection]);

  // Section preferences
  const sections = useMemo(() => ({
    workflows: preferences.sections.workflows,
    templates: preferences.sections.templates,
    snippets: preferences.sections.snippets
  }), [preferences.sections]);

  const updateSections = useCallback((updates) => {
    updateSection('sections', updates);
  }, [updateSection]);

  const toggleSectionVisibility = useCallback((sectionName) => {
    const currentSection = preferences.sections[sectionName];
    if (currentSection) {
      updateSection('sections', {
        ...preferences.sections,
        [sectionName]: {
          ...currentSection,
          visible: !currentSection.visible
        }
      });
    }
  }, [preferences.sections, updateSection]);

  const toggleSectionCollapsed = useCallback((sectionName) => {
    const currentSection = preferences.sections[sectionName];
    if (currentSection) {
      updateSection('sections', {
        ...preferences.sections,
        [sectionName]: {
          ...currentSection,
          collapsed: !currentSection.collapsed
        }
      });
    }
  }, [preferences.sections, updateSection]);

  // Dashboard preferences
  const dashboard = useMemo(() => ({
    showFavorites: preferences.dashboard.showFavorites,
    showRecent: preferences.dashboard.showRecent,
    recentCount: preferences.dashboard.recentCount,
    favoriteCount: preferences.dashboard.favoriteCount
  }), [preferences.dashboard]);

  const updateDashboard = useCallback((updates) => {
    updateSection('dashboard', updates);
  }, [updateSection]);

  // Filtering preferences
  const filtering = useMemo(() => ({
    defaultPageSize: preferences.filtering.defaultPageSize,
    useInfiniteScroll: preferences.filtering.useInfiniteScroll,
    rememberFilters: preferences.filtering.rememberFilters
  }), [preferences.filtering]);

  const updateFiltering = useCallback((updates) => {
    updateSection('filtering', updates);
  }, [updateSection]);

  // Pagination preferences
  const pagination = useMemo(() => ({
    templates: preferences.pagination.templates,
    workflows: preferences.pagination.workflows,
    snippets: preferences.pagination.snippets,
    defaultPageSize: preferences.pagination.defaultPageSize,
    pageSizeOptions: preferences.pagination.pageSizeOptions
  }), [preferences.pagination]);

  const updatePagination = useCallback((updates) => {
    updateSection('pagination', updates);
  }, [updateSection]);

  const getPaginationSettings = useCallback((sectionType) => {
    return preferences.pagination[sectionType] || {
      pageSize: preferences.pagination.defaultPageSize,
      currentPage: 1
    };
  }, [preferences.pagination]);

  const setPaginationSettings = useCallback((sectionType, settings) => {
    updateSection('pagination', {
      [sectionType]: {
        ...preferences.pagination[sectionType],
        ...settings
      }
    });
  }, [updateSection, preferences.pagination]);

  // Accessibility preferences
  const accessibility = useMemo(() => ({
    highContrast: preferences.accessibility.highContrast,
    reducedMotion: preferences.accessibility.reducedMotion,
    keyboardNavigation: preferences.accessibility.keyboardNavigation
  }), [preferences.accessibility]);

  const updateAccessibility = useCallback((updates) => {
    updateSection('accessibility', updates);
  }, [updateSection]);


  // Search preferences
  const search = useMemo(() => ({
    history: preferences.search.history,
    maxHistory: preferences.search.maxHistory
  }), [preferences.search]);

  const updateSearch = useCallback((updates) => {
    updateSection('search', updates);
  }, [updateSection]);

  // Section visibility preferences
  const sectionVisibility = useMemo(() => ({
    ...preferences.sectionVisibility
  }), [preferences.sectionVisibility]);

  const updateSectionVisibility = useCallback((updates) => {
    updateSection('sectionVisibility', updates);
  }, [updateSection]);


  // View mode specific helpers
  const setViewMode = useCallback((viewMode) => {
    updateLayout({ viewMode });
  }, [updateLayout]);

  const setCardSize = useCallback((cardSize) => {
    updateLayout({ cardSize });
  }, [updateLayout]);

  const setDensity = useCallback((density) => {
    updateLayout({ density });
  }, [updateLayout]);

  // Grid layout helpers
  const getGridColumns = useCallback(() => {
    const { cardSize, columnsPerRow } = layout;
    
    // Return responsive grid classes based on card size and column preference
    switch (cardSize) {
      case 'small':
        return `grid-cols-1 md:grid-cols-${Math.min(columnsPerRow + 1, 6)} lg:grid-cols-${Math.min(columnsPerRow + 2, 8)}`;
      case 'large':
        return `grid-cols-1 md:grid-cols-${Math.max(columnsPerRow - 1, 2)} lg:grid-cols-${Math.max(columnsPerRow, 3)}`;
      default: // medium
        return `grid-cols-1 md:grid-cols-${columnsPerRow} lg:grid-cols-${columnsPerRow}`;
    }
  }, [layout]);

  const getCardSpacing = useCallback(() => {
    return layout.density === 'compact' ? 'gap-3' : 'gap-4';
  }, [layout]);

  const getCardPadding = useCallback(() => {
    return layout.density === 'compact' ? 'p-3' : 'p-4';
  }, [layout]);

  // Theme and accessibility helpers
  const shouldReduceMotion = useCallback(() => {
    return accessibility.reducedMotion;
  }, [accessibility.reducedMotion]);

  const shouldUseHighContrast = useCallback(() => {
    return accessibility.highContrast;
  }, [accessibility.highContrast]);

  const isKeyboardNavigationEnabled = useCallback(() => {
    return accessibility.keyboardNavigation;
  }, [accessibility.keyboardNavigation]);

  // Preference validation
  const validatePreferences = useCallback(() => {
    const issues = [];
    
    // Validate view mode
    if (!['grid', 'list'].includes(layout.viewMode)) {
      issues.push('Invalid view mode');
    }
    
    // Validate card size
    if (!['small', 'medium', 'large'].includes(layout.cardSize)) {
      issues.push('Invalid card size');
    }
    
    // Validate columns
    if (layout.columnsPerRow < 2 || layout.columnsPerRow > 8) {
      issues.push('Invalid column count');
    }
    
    // Validate page size
    if (filtering.defaultPageSize < 6 || filtering.defaultPageSize > 100) {
      issues.push('Invalid page size');
    }
    
    return issues;
  }, [layout, filtering]);

  return {
    // Core state
    preferences,
    loading,
    error,
    
    // Section-specific preferences
    layout,
    sections,
    dashboard,
    filtering,
    pagination,
    accessibility,
    search,
    sectionVisibility,
    
    // Update methods
    updatePreferences,
    updateLayout,
    updateSections,
    updateDashboard,
    updateFiltering,
    updatePagination,
    updateAccessibility,
    updateSearch,
    updateSectionVisibility,
    
    // Section helpers
    toggleSectionVisibility,
    toggleSectionCollapsed,
    
    // Pagination helpers
    getPaginationSettings,
    setPaginationSettings,
    
    // View mode helpers
    setViewMode,
    setCardSize,
    setDensity,
    
    // Layout helpers
    getGridColumns,
    getCardSpacing,
    getCardPadding,
    
    // Accessibility helpers
    shouldReduceMotion,
    shouldUseHighContrast,
    isKeyboardNavigationEnabled,
    
    // Utility methods
    resetToDefaults,
    exportSettings,
    importSettings,
    getPreference,
    setPreference,
    validatePreferences
  };
};

export default useUserPreferences;