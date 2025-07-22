import { useState, useEffect, useCallback } from 'react';

/**
 * Hook for managing keyboard navigation across grid/list layouts
 * Provides arrow key navigation, Enter/Space execution, and focus management
 * 
 * @param {Array} items - Array of items to navigate through
 * @param {Object} options - Configuration options
 * @param {string} options.layout - Layout type: 'grid', 'list'
 * @param {number} options.columns - Number of columns in grid layout
 * @param {Function} options.onExecute - Callback when item is executed (Enter/Space)
 * @param {Function} options.onSelection - Callback when selection changes
 * @param {boolean} options.disabled - Whether keyboard navigation is disabled
 * @returns {Object} Navigation state and handlers
 */
export const useKeyboardNavigation = (items = [], options = {}) => {
  const {
    layout = 'grid',
    columns = 4,
    onExecute = () => {},
    onSelection = () => {},
    disabled = false
  } = options;

  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [isActive, setIsActive] = useState(false);
  const [lastFocusedId, setLastFocusedId] = useState(null);
  const [restoreFocus, setRestoreFocus] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchTimeout, setSearchTimeout] = useState(null);
  const [throttleTimeout, setThrottleTimeout] = useState(null);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (searchTimeout) clearTimeout(searchTimeout);
      if (throttleTimeout) clearTimeout(throttleTimeout);
    };
  }, [searchTimeout, throttleTimeout]);

  // Smart focus preservation when items change due to section visibility
  const handleItemsChange = useCallback((newItems, oldItems, currentFocusedIndex, sectionChanges = null) => {
    // Prevent infinite loops by checking if we actually need to change focus
    if (newItems.length === 0) {
      if (focusedIndex !== -1) {
        setFocusedIndex(-1);
        setIsActive(false);
        setLastFocusedId(null);
      }
      return;
    }

    // If no current focus, nothing to preserve
    if (currentFocusedIndex < 0 || !isActive) {
      return;
    }

    // Get the currently focused item from old items
    const currentFocusedItem = oldItems?.[currentFocusedIndex];
    if (!currentFocusedItem) {
      return;
    }

    // Try to find the same item in new items
    const newIndex = newItems.findIndex(item => item.id === currentFocusedItem.id);
    
    if (newIndex >= 0) {
      // Item still exists, only update if index actually changed
      if (newIndex !== focusedIndex) {
        setFocusedIndex(newIndex);
      }
    } else {
      // Item no longer exists, find the best alternative
      const bestAlternativeIndex = findBestAlternativeFocus(newItems, currentFocusedIndex, oldItems);
      if (bestAlternativeIndex !== focusedIndex) {
        setFocusedIndex(bestAlternativeIndex);
      }
    }
  }, [isActive, focusedIndex]);

  // Find the best alternative focus when current item is removed
  const findBestAlternativeFocus = useCallback((newItems, oldFocusedIndex, oldItems) => {
    if (newItems.length === 0) return -1;

    // Strategy for finding the next best focus position:
    // 1. If items were removed before current position, adjust index down
    // 2. If current item was removed, try next item, then previous
    // 3. If items were removed after current position, keep same index
    
    const currentItem = oldItems[oldFocusedIndex];
    
    // Count how many items before the current position were removed
    let itemsRemovedBefore = 0;
    for (let i = 0; i < oldFocusedIndex; i++) {
      const oldItem = oldItems[i];
      if (!newItems.find(newItem => newItem.id === oldItem.id)) {
        itemsRemovedBefore++;
      }
    }
    
    // Calculate the adjusted target index
    let targetIndex = oldFocusedIndex - itemsRemovedBefore;
    
    // Ensure target index is within bounds
    targetIndex = Math.max(0, Math.min(targetIndex, newItems.length - 1));
    
    
    return targetIndex;
  }, []);

  // Clear selection when items change, with smart focus restoration
  useEffect(() => {
    if (items.length === 0) {
      setFocusedIndex(-1);
      setIsActive(false);
      setLastFocusedId(null);
    } else if (focusedIndex >= items.length) {
      setFocusedIndex(items.length - 1);
    }
    
    // Restore focus if requested and we have a last focused item
    if (restoreFocus && lastFocusedId && items.length > 0) {
      const restoredIndex = items.findIndex(item => item.id === lastFocusedId);
      if (restoredIndex >= 0) {
        setFocusedIndex(restoredIndex);
        setIsActive(true);
      }
      setRestoreFocus(false);
    }
  }, [items, focusedIndex, restoreFocus, lastFocusedId]);

  // Notify parent of selection changes and track last focused item
  useEffect(() => {
    if (focusedIndex >= 0 && focusedIndex < items.length) {
      const currentItem = items[focusedIndex];
      onSelection(currentItem, focusedIndex);
      setLastFocusedId(currentItem.id);
    } else {
      onSelection(null, -1);
    }
  }, [focusedIndex, items, onSelection]);

  // Calculate movement based on layout
  const calculateNewIndex = useCallback((currentIndex, direction) => {
    const totalItems = items.length;
    if (totalItems === 0) return -1;

    switch (layout) {
      case 'list':
        // Simple up/down navigation for list layout
        switch (direction) {
          case 'up':
            return Math.max(0, currentIndex - 1);
          case 'down':
            return Math.min(totalItems - 1, currentIndex + 1);
          case 'left':
          case 'right':
            return currentIndex; // No horizontal movement in list
          default:
            return currentIndex;
        }

      case 'grid': {
        // Grid navigation with column-based movement
        const cols = columns;
        const currentRow = Math.floor(currentIndex / cols);
        const currentCol = currentIndex % cols;
        const totalRows = Math.ceil(totalItems / cols);

        switch (direction) {
          case 'up':
            if (currentRow > 0) {
              const newIndex = (currentRow - 1) * cols + currentCol;
              return Math.min(newIndex, totalItems - 1);
            }
            return currentIndex;

          case 'down':
            if (currentRow < totalRows - 1) {
              const newIndex = (currentRow + 1) * cols + currentCol;
              return Math.min(newIndex, totalItems - 1);
            }
            return currentIndex;

          case 'left':
            return Math.max(0, currentIndex - 1);

          case 'right':
            return Math.min(totalItems - 1, currentIndex + 1);

          default:
            return currentIndex;
        }
      }

      default:
        return currentIndex;
    }
  }, [items.length, layout, columns]);

  // Handle keyboard events with throttling for performance
  const handleKeyDown = useCallback((event) => {
    if (disabled || items.length === 0) return;

    const { key, ctrlKey, altKey } = event;

    // Skip if modifier keys are pressed (except Shift for some keys)
    if (ctrlKey || altKey) return;

    // Throttle navigation for large datasets (>100 items)
    if (items.length > 100 && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) {
      if (throttleTimeout) {
        return; // Skip if still throttling
      }
      
      const timeout = setTimeout(() => {
        setThrottleTimeout(null);
      }, 50); // 50ms throttle
      setThrottleTimeout(timeout);
    }

    switch (key) {
      case 'ArrowUp':
        event.preventDefault();
        setIsActive(true);
        setFocusedIndex(prev => {
          const current = prev === -1 ? 0 : prev;
          return calculateNewIndex(current, 'up');
        });
        break;

      case 'ArrowDown':
        event.preventDefault();
        setIsActive(true);
        setFocusedIndex(prev => {
          const current = prev === -1 ? 0 : prev;
          return calculateNewIndex(current, 'down');
        });
        break;

      case 'ArrowLeft':
        event.preventDefault();
        setIsActive(true);
        setFocusedIndex(prev => {
          const current = prev === -1 ? 0 : prev;
          return calculateNewIndex(current, 'left');
        });
        break;

      case 'ArrowRight':
        event.preventDefault();
        setIsActive(true);
        setFocusedIndex(prev => {
          const current = prev === -1 ? 0 : prev;
          return calculateNewIndex(current, 'right');
        });
        break;

      case 'Enter':
      case ' ':
        event.preventDefault();
        if (isActive && focusedIndex >= 0 && focusedIndex < items.length) {
          onExecute(items[focusedIndex], focusedIndex);
        }
        break;

      case 'Home':
        event.preventDefault();
        setIsActive(true);
        setFocusedIndex(0);
        break;

      case 'End':
        event.preventDefault();
        setIsActive(true);
        setFocusedIndex(items.length - 1);
        break;

      case 'PageUp':
        event.preventDefault();
        setIsActive(true);
        setFocusedIndex(prev => {
          const current = prev === -1 ? 0 : prev;
          const pageSize = layout === 'list' ? 10 : 12;
          return Math.max(0, current - pageSize);
        });
        break;

      case 'PageDown':
        event.preventDefault();
        setIsActive(true);
        setFocusedIndex(prev => {
          const current = prev === -1 ? 0 : prev;
          const pageSize = layout === 'list' ? 10 : 12;
          return Math.min(items.length - 1, current + pageSize);
        });
        break;

      case 'Tab':
        // Don't handle Tab in this hook - handled at higher level
        break;

      case 'Escape':
        event.preventDefault();
        setIsActive(false);
        setFocusedIndex(-1);
        break;

      default:
        // Handle type-ahead search for alphanumeric keys
        if (key.length === 1 && /^[a-zA-Z0-9\s]$/.test(key)) {
          event.preventDefault();
          setIsActive(true);
          
          // Clear existing timeout
          if (searchTimeout) {
            clearTimeout(searchTimeout);
          }
          
          const newQuery = searchQuery + key.toLowerCase();
          setSearchQuery(newQuery);
          
          // Optimized search for large datasets
          let matchingIndex = -1;
          
          if (items.length > 100) {
            // For large datasets, use a more efficient search strategy
            // Start from current position and search forward, then backward
            const startIndex = Math.max(0, focusedIndex);
            
            // Search forward from current position
            for (let i = startIndex; i < items.length; i++) {
              if (items[i].name.toLowerCase().includes(newQuery)) {
                matchingIndex = i;
                break;
              }
            }
            
            // If not found, search backward
            if (matchingIndex === -1) {
              for (let i = startIndex - 1; i >= 0; i--) {
                if (items[i].name.toLowerCase().includes(newQuery)) {
                  matchingIndex = i;
                  break;
                }
              }
            }
          } else {
            // For smaller datasets, use simple findIndex
            matchingIndex = items.findIndex(item => 
              item.name.toLowerCase().includes(newQuery)
            );
          }
          
          if (matchingIndex >= 0) {
            setFocusedIndex(matchingIndex);
          }
          
          // Clear search after 2 seconds of inactivity
          const timeout = setTimeout(() => {
            setSearchQuery('');
          }, 2000);
          setSearchTimeout(timeout);
        } else {
          // Allow other keys to bubble up
        }
        break;
    }
  }, [disabled, items, isActive, focusedIndex, calculateNewIndex, onExecute, layout, searchQuery, searchTimeout, throttleTimeout]);

  // Focus management utilities
  const focusItem = useCallback((index) => {
    if (index >= 0 && index < items.length) {
      setFocusedIndex(index);
      setIsActive(true);
      
      // Also focus the actual DOM element
      setTimeout(() => {
        const element = document.querySelector(`[data-focusable-card="true"][data-card-index="${index}"]`);
        if (element) {
          element.focus();
        }
      }, 10); // Small delay to ensure state update is applied
    } else {
    }
  }, [items.length]);

  const clearFocus = useCallback(() => {
    setFocusedIndex(-1);
    setIsActive(false);
  }, []);

  const moveFocus = useCallback((direction) => {
    setIsActive(true);
    setFocusedIndex(prev => {
      const current = prev === -1 ? 0 : prev;
      return calculateNewIndex(current, direction);
    });
  }, [calculateNewIndex]);

  // Focus restoration utilities
  const saveCurrentFocus = useCallback(() => {
    if (focusedIndex >= 0 && focusedIndex < items.length) {
      setLastFocusedId(items[focusedIndex].id);
    }
  }, [focusedIndex, items]);

  const restoreFocusToLastItem = useCallback(() => {
    if (lastFocusedId && items.length > 0) {
      setRestoreFocus(true);
    }
  }, [lastFocusedId, items.length]);

  const restoreFocusToItem = useCallback((itemId) => {
    if (itemId && items.length > 0) {
      setLastFocusedId(itemId);
      setRestoreFocus(true);
    }
  }, [items.length]);

  // Get current focused item
  const focusedItem = focusedIndex >= 0 && focusedIndex < items.length 
    ? items[focusedIndex] 
    : null;

  return {
    // State
    focusedIndex,
    focusedItem,
    isActive,
    lastFocusedId,
    searchQuery,
    
    // Event handlers
    handleKeyDown,
    
    // Utilities
    focusItem,
    clearFocus,
    moveFocus,
    handleItemsChange,
    
    // Focus restoration
    saveCurrentFocus,
    restoreFocusToLastItem,
    restoreFocusToItem,
    
    // Helper for getting focus styles and ARIA attributes
    getFocusProps: (index) => ({
      'data-keyboard-focused': isActive && focusedIndex === index,
      'tabIndex': isActive && focusedIndex === index ? 0 : -1,
      'aria-selected': isActive && focusedIndex === index,
      'role': 'option',
      'aria-setsize': items.length,
      'aria-posinset': index + 1,
      'aria-describedby': `keyboard-nav-help-${layout}`
    }),
    
    // Helper for getting container ARIA attributes
    getContainerProps: () => ({
      'role': 'listbox',
      'aria-label': `Navigate ${items.length} items using arrow keys. Press Enter to execute, Escape to exit navigation.`,
      'aria-activedescendant': isActive && focusedIndex >= 0 ? `item-${focusedIndex}` : undefined,
      'aria-multiselectable': false
    }),
    
    // Helper for getting keyboard help text
    getKeyboardHelpText: () => ({
      [`keyboard-nav-help-${layout}`]: `Use arrow keys to navigate. In ${layout} view: ${
        layout === 'list' ? 'Up/Down to move between items' : 
        'Arrow keys to move in grid, Left/Right within rows, Up/Down between rows'
      }. Press Enter or Space to execute, Home/End to jump to first/last item, Escape to exit.`
    })
  };
};

export default useKeyboardNavigation;