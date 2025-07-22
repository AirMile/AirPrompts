import { useState, useEffect, useMemo } from 'react';
import { useUserPreferences } from '../domain/useUserPreferences.js';

/**
 * Custom hook for managing pagination state and logic
 * @param {Array} items - Array of items to paginate
 * @param {Object} options - Pagination options
 * @returns {Object} - Pagination state and functions
 */
const usePagination = (items = [], options = {}) => {
  const {
    initialPage = 1,
    initialPageSize = 12,
    storageKey = null, // e.g., 'pagination_templates'
    maxPagesToShow = 7,
    showPageSizeSelector = true,
    pageSizeOptions = [12, 24, 48, 96, 200],
    autoResetOnItemsChange = true
  } = options;

  // Use preferences system for pagination state
  const { getPaginationSettings, setPaginationSettings } = useUserPreferences();
  
  // Extract section type from storage key (e.g., 'templates_global' -> 'templates')
  const sectionType = storageKey ? storageKey.split('_')[0] : null;

  // State management using preferences system
  const [currentPage, setCurrentPage] = useState(() => {
    if (sectionType) {
      try {
        const settings = getPaginationSettings(sectionType);
        return settings.currentPage || initialPage;
      } catch (error) {
        console.warn('Error reading pagination page from preferences:', error);
        return initialPage;
      }
    }
    return initialPage;
  });

  const [pageSize, setPageSize] = useState(() => {
    if (sectionType) {
      try {
        const settings = getPaginationSettings(sectionType);
        return settings.pageSize || initialPageSize;
      } catch (error) {
        console.warn('Error reading pagination page size from preferences:', error);
        return initialPageSize;
      }
    }
    return initialPageSize;
  });

  // Computed values
  const totalItems = items.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  
  // Current page items
  const currentItems = useMemo(() => {
    return items.slice(startIndex, endIndex);
  }, [items, startIndex, endIndex]);

  // Page range for pagination display
  const pageRange = useMemo(() => {
    if (totalPages <= maxPagesToShow) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const half = Math.floor(maxPagesToShow / 2);
    let start = Math.max(1, currentPage - half);
    let end = Math.min(totalPages, start + maxPagesToShow - 1);

    if (end - start + 1 < maxPagesToShow) {
      start = Math.max(1, end - maxPagesToShow + 1);
    }

    const range = [];
    for (let i = start; i <= end; i++) {
      range.push(i);
    }

    return range;
  }, [currentPage, totalPages, maxPagesToShow]);

  // Show ellipsis indicators
  const showStartEllipsis = pageRange[0] > 1;
  const showEndEllipsis = pageRange[pageRange.length - 1] < totalPages;

  // Reset to first page when items change (if enabled)
  useEffect(() => {
    if (autoResetOnItemsChange && currentPage > 1) {
      const newTotalPages = Math.ceil(items.length / pageSize);
      if (currentPage > newTotalPages) {
        setCurrentPage(1);
      }
    }
  }, [items.length, pageSize, currentPage, autoResetOnItemsChange]);

  // Persist pagination state to preferences system
  useEffect(() => {
    if (sectionType) {
      try {
        setPaginationSettings(sectionType, {
          currentPage,
          pageSize
        });
      } catch (error) {
        console.warn('Error saving pagination state to preferences:', error);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, pageSize, sectionType]);

  // Navigation functions
  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const goToFirstPage = () => {
    setCurrentPage(1);
  };

  const goToLastPage = () => {
    setCurrentPage(totalPages);
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Page size change handler
  const changePageSize = (newPageSize) => {
    const newTotalPages = Math.ceil(totalItems / newPageSize);
    const newCurrentPage = Math.min(currentPage, newTotalPages);
    
    setPageSize(newPageSize);
    if (newCurrentPage !== currentPage) {
      setCurrentPage(newCurrentPage);
    }
  };

  // Reset pagination
  const resetPagination = () => {
    setCurrentPage(1);
    setPageSize(initialPageSize);
  };

  // Jump to page containing specific item
  const jumpToItem = (itemIndex) => {
    if (itemIndex >= 0 && itemIndex < totalItems) {
      const targetPage = Math.floor(itemIndex / pageSize) + 1;
      setCurrentPage(targetPage);
    }
  };

  // Utility functions
  const isFirstPage = currentPage === 1;
  const isLastPage = currentPage === totalPages;
  const hasNextPage = currentPage < totalPages;
  const hasPreviousPage = currentPage > 1;

  // Pagination info for display
  const paginationInfo = {
    currentPage,
    totalPages,
    totalItems,
    pageSize,
    startIndex: startIndex + 1, // 1-based for display
    endIndex,
    showingCount: currentItems.length,
    hasItems: totalItems > 0,
    isFirstPage,
    isLastPage,
    hasNextPage,
    hasPreviousPage
  };

  // Keyboard navigation support
  const handleKeyDown = (e) => {
    switch (e.key) {
      case 'ArrowLeft':
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          goToPreviousPage();
        }
        break;
      case 'ArrowRight':
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          goToNextPage();
        }
        break;
      case 'Home':
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          goToFirstPage();
        }
        break;
      case 'End':
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          goToLastPage();
        }
        break;
    }
  };

  // Performance metrics
  const getPerformanceMetrics = () => {
    return {
      totalItems,
      pageSize,
      totalPages,
      currentPage,
      itemsPerPage: pageSize,
      memoryUsage: `${currentItems.length} / ${totalItems} items loaded`,
      efficiency: `${((currentItems.length / totalItems) * 100).toFixed(1)}% loaded`
    };
  };

  return {
    // Current data
    currentItems,
    
    // Pagination state
    currentPage,
    totalPages,
    pageSize,
    totalItems,
    
    // Page range for display
    pageRange,
    showStartEllipsis,
    showEndEllipsis,
    
    // Navigation functions
    goToPage,
    goToFirstPage,
    goToLastPage,
    goToPreviousPage,
    goToNextPage,
    changePageSize,
    resetPagination,
    jumpToItem,
    
    // Utility functions
    isFirstPage,
    isLastPage,
    hasNextPage,
    hasPreviousPage,
    
    // Display info
    paginationInfo,
    
    // Options
    pageSizeOptions,
    showPageSizeSelector,
    
    // Event handlers
    handleKeyDown,
    
    // Performance
    getPerformanceMetrics
  };
};

export default usePagination;