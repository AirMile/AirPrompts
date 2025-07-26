import { useState, useEffect, useRef, useMemo, useCallback } from 'react';

/**
 * Advanced virtualization hook with Intersection Observer
 * Optimized for rendering 10,000+ items efficiently
 */
export const useVirtualization = (items, options = {}) => {
  const {
    estimatedItemSize = 100,
    overscan = 5,
    rootMargin = '100px',
    threshold = 0,
    horizontal = false,
    onVisibilityChange = null,
    enableDebug = false
  } = options;

  // State for visible range
  const [visibleRange, setVisibleRange] = useState({ 
    start: 0, 
    end: Math.min(50, items.length) 
  });
  
  // Performance metrics
  const [metrics, setMetrics] = useState({
    renderCount: 0,
    visibleItems: 0,
    totalItems: items.length,
    lastUpdateTime: Date.now()
  });

  // Refs
  const containerRef = useRef(null);
  const itemsRef = useRef(new Map());
  const observerRef = useRef(null);
  const sentinelRefs = useRef({ top: null, bottom: null });
  const scrollPositionRef = useRef(0);
  const isScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef(null);

  // Calculate total size for scroll placeholder
  const totalSize = useMemo(() => {
    return items.length * estimatedItemSize;
  }, [items.length, estimatedItemSize]);

  // Calculate visible items with overscan
  const visibleItems = useMemo(() => {
    const start = Math.max(0, visibleRange.start - overscan);
    const end = Math.min(items.length, visibleRange.end + overscan);
    
    return items.slice(start, end).map((item, index) => ({
      ...item,
      virtualIndex: start + index,
      virtualOffset: (start + index) * estimatedItemSize
    }));
  }, [items, visibleRange, overscan, estimatedItemSize]);

  // Update metrics
  useEffect(() => {
    if (enableDebug) {
      setMetrics(prev => ({
        ...prev,
        renderCount: prev.renderCount + 1,
        visibleItems: visibleItems.length,
        totalItems: items.length,
        lastUpdateTime: Date.now()
      }));
    }
  }, [visibleItems.length, items.length, enableDebug]);

  // Intersection Observer callback
  const handleIntersection = useCallback((entries) => {
    if (isScrollingRef.current) return; // Skip during active scrolling

    entries.forEach(entry => {
      const index = parseInt(entry.target.dataset.index, 10);
      
      if (entry.isIntersecting) {
        // Item is becoming visible
        setVisibleRange(prev => {
          const newStart = Math.min(prev.start, index);
          const newEnd = Math.max(prev.end, index);
          
          // Only update if there's a significant change
          if (newStart !== prev.start || newEnd !== prev.end) {
            return { start: newStart, end: newEnd };
          }
          return prev;
        });

        // Notify visibility change
        if (onVisibilityChange) {
          onVisibilityChange(index, true);
        }
      }
    });
  }, [onVisibilityChange]);

  // Setup Intersection Observer
  useEffect(() => {
    if (!containerRef.current) return;

    // Create observer with performance-optimized settings
    observerRef.current = new IntersectionObserver(handleIntersection, {
      root: containerRef.current,
      rootMargin,
      threshold,
      // Reduce observer overhead
      // @ts-ignore - trackVisibility is experimental
      trackVisibility: false,
      delay: 100
    });

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [handleIntersection, rootMargin, threshold]);

  // Observe/unobserve items
  useEffect(() => {
    if (!observerRef.current) return;

    const observer = observerRef.current;
    const itemsToObserve = new Set();

    // Observe visible items and boundary items
    visibleItems.forEach((item, index) => {
      const element = itemsRef.current.get(item.virtualIndex);
      if (element && !element.dataset.observed) {
        observer.observe(element);
        element.dataset.observed = 'true';
        itemsToObserve.add(item.virtualIndex);
      }
    });

    // Unobserve items that are no longer visible
    itemsRef.current.forEach((element, index) => {
      if (!itemsToObserve.has(index) && element.dataset.observed) {
        observer.unobserve(element);
        delete element.dataset.observed;
      }
    });
  }, [visibleItems]);

  // Handle scroll for better range updates
  const handleScroll = useCallback((e) => {
    const container = e.target;
    const scrollTop = container.scrollTop;
    const scrollLeft = container.scrollLeft;
    const scrollPos = horizontal ? scrollLeft : scrollTop;
    
    scrollPositionRef.current = scrollPos;
    isScrollingRef.current = true;

    // Clear existing timeout
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    // Update visible range based on scroll position
    const viewportSize = horizontal 
      ? container.clientWidth 
      : container.clientHeight;
    
    const startIndex = Math.floor(scrollPos / estimatedItemSize);
    const endIndex = Math.ceil((scrollPos + viewportSize) / estimatedItemSize);

    setVisibleRange({
      start: Math.max(0, startIndex),
      end: Math.min(items.length, endIndex)
    });

    // Debounce scroll end
    scrollTimeoutRef.current = setTimeout(() => {
      isScrollingRef.current = false;
    }, 150);
  }, [estimatedItemSize, horizontal, items.length]);

  // Register item ref
  const registerItem = useCallback((index, element) => {
    if (element) {
      itemsRef.current.set(index, element);
    } else {
      itemsRef.current.delete(index);
    }
  }, []);

  // Scroll to item
  const scrollToItem = useCallback((index, behavior = 'smooth') => {
    if (!containerRef.current) return;

    const offset = index * estimatedItemSize;
    const scrollOptions = {
      behavior,
      [horizontal ? 'left' : 'top']: offset
    };

    containerRef.current.scrollTo(scrollOptions);
  }, [estimatedItemSize, horizontal]);

  // Reset on items change
  useEffect(() => {
    setVisibleRange({ 
      start: 0, 
      end: Math.min(50, items.length) 
    });
    itemsRef.current.clear();
  }, [items.length]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  return {
    // Container props
    containerRef,
    containerProps: {
      onScroll: handleScroll,
      style: {
        overflow: 'auto',
        position: 'relative',
        height: '100%',
        width: '100%'
      }
    },
    
    // Virtualization data
    visibleItems,
    totalSize,
    
    // Methods
    registerItem,
    scrollToItem,
    
    // Metrics for debugging
    metrics: enableDebug ? metrics : null,
    
    // Render helpers
    renderSpacer: (position) => {
      const size = position === 'top' 
        ? visibleRange.start * estimatedItemSize
        : (items.length - visibleRange.end) * estimatedItemSize;
      
      if (size <= 0) return null;
      
      return (
        <div
          style={{
            [horizontal ? 'width' : 'height']: size,
            [horizontal ? 'height' : 'width']: '1px',
            pointerEvents: 'none'
          }}
          aria-hidden="true"
        />
      );
    }
  };
};

/**
 * Hook for virtual scrolling with dynamic item heights
 */
export const useDynamicVirtualization = (items, options = {}) => {
  const {
    estimatedItemSize = 100,
    overscan = 5,
    getItemHeight = () => estimatedItemSize,
    horizontal = false,
    cacheKey = 'default'
  } = options;

  // Cache for measured heights
  const heightCacheRef = useRef(new Map());
  const [heights, setHeights] = useState(() => new Map());

  // Calculate positions based on measured heights
  const itemPositions = useMemo(() => {
    const positions = new Map();
    let offset = 0;

    items.forEach((item, index) => {
      const height = heights.get(`${cacheKey}-${index}`) || estimatedItemSize;
      positions.set(index, { offset, height });
      offset += height;
    });

    return positions;
  }, [items, heights, estimatedItemSize, cacheKey]);

  // Total size with measured heights
  const totalSize = useMemo(() => {
    let total = 0;
    itemPositions.forEach(({ height }) => {
      total += height;
    });
    return total;
  }, [itemPositions]);

  // Measure item height
  const measureItem = useCallback((index, element) => {
    if (!element) return;

    const key = `${cacheKey}-${index}`;
    const measuredHeight = horizontal 
      ? element.offsetWidth 
      : element.offsetHeight;

    if (measuredHeight > 0 && measuredHeight !== heights.get(key)) {
      setHeights(prev => new Map(prev).set(key, measuredHeight));
      heightCacheRef.current.set(key, measuredHeight);
    }
  }, [horizontal, cacheKey, heights]);

  // Clear cache when items change significantly
  useEffect(() => {
    const currentSize = items.length;
    const cachedSize = heightCacheRef.current.size;
    
    if (Math.abs(currentSize - cachedSize) > 100) {
      heightCacheRef.current.clear();
      setHeights(new Map());
    }
  }, [items.length]);

  // Use the base virtualization with enhanced options
  const virtualization = useVirtualization(items, {
    ...options,
    estimatedItemSize
  });

  return {
    ...virtualization,
    measureItem,
    itemPositions,
    totalSize,
    getItemOffset: (index) => itemPositions.get(index)?.offset || 0,
    getItemHeight: (index) => itemPositions.get(index)?.height || estimatedItemSize
  };
};

/**
 * Hook for virtualized grid layouts
 */
export const useVirtualizedGrid = (items, options = {}) => {
  const {
    columns = 3,
    gap = 16,
    estimatedItemHeight = 200,
    overscan = 2
  } = options;

  // Calculate rows from items
  const rows = useMemo(() => {
    const result = [];
    for (let i = 0; i < items.length; i += columns) {
      result.push({
        index: Math.floor(i / columns),
        items: items.slice(i, i + columns)
      });
    }
    return result;
  }, [items, columns]);

  // Use virtualization on rows instead of individual items
  const virtualization = useVirtualization(rows, {
    estimatedItemSize: estimatedItemHeight + gap,
    overscan,
    ...options
  });

  return {
    ...virtualization,
    columns,
    gap,
    rowHeight: estimatedItemHeight
  };
};