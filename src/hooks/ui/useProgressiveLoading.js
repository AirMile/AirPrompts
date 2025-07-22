import { useState, useCallback, useMemo, useEffect } from 'react';

/**
 * Hook voor progressive loading van grote datasets
 * Laadt data in batches om performance te verbeteren
 * 
 * @param {Array} allItems - Alle items die geladen moeten worden
 * @param {Object} options - Configuratie opties
 * @param {number} options.batchSize - Aantal items per batch (default: 50)
 * @param {number} options.virtualizationThreshold - Threshold voor virtualization (default: 100)
 * @param {boolean} options.autoLoad - Automatisch volgende batch laden bij scroll (default: true)
 * @returns {Object} Loading state en functies
 */
export const useProgressiveLoading = (allItems = [], options = {}) => {
  const {
    batchSize = 50,
    virtualizationThreshold = 100,
    autoLoad = true
  } = options;

  const [loadedCount, setLoadedCount] = useState(batchSize);
  const [isLoading, setIsLoading] = useState(false);

  // Reset als allItems wijzigt
  useEffect(() => {
    setLoadedCount(batchSize);
  }, [allItems.length, batchSize]);

  // Berekende waarden
  const hasMore = useMemo(() => {
    return loadedCount < allItems.length;
  }, [loadedCount, allItems.length]);

  const shouldUseVirtualization = useMemo(() => {
    return allItems.length > virtualizationThreshold;
  }, [allItems.length, virtualizationThreshold]);

  const visibleItems = useMemo(() => {
    // Als we virtualization gebruiken, geef alle items terug (virtualized component bepaalt wat zichtbaar is)
    if (shouldUseVirtualization) {
      return allItems;
    }
    // Anders gebruik progressive loading
    return allItems.slice(0, loadedCount);
  }, [allItems, loadedCount, shouldUseVirtualization]);

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);
    
    // Simuleer async loading voor betere UX
    await new Promise(resolve => setTimeout(resolve, 100));
    
    setLoadedCount(prev => Math.min(prev + batchSize, allItems.length));
    setIsLoading(false);
  }, [isLoading, hasMore, batchSize, allItems.length]);

  const loadAll = useCallback(() => {
    setLoadedCount(allItems.length);
  }, [allItems.length]);

  const reset = useCallback(() => {
    setLoadedCount(batchSize);
  }, [batchSize]);

  // Performance metrics
  const stats = useMemo(() => ({
    totalItems: allItems.length,
    loadedItems: shouldUseVirtualization ? allItems.length : Math.min(loadedCount, allItems.length),
    loadingProgress: allItems.length > 0 ? (loadedCount / allItems.length) * 100 : 100,
    shouldUseVirtualization,
    isUsingProgressiveLoading: !shouldUseVirtualization && allItems.length > batchSize
  }), [allItems.length, loadedCount, shouldUseVirtualization, batchSize]);

  return {
    // Data
    items: visibleItems,
    allItems,
    
    // State
    isLoading,
    hasMore,
    shouldUseVirtualization,
    
    // Actions
    loadMore,
    loadAll,
    reset,
    
    // Utilities
    stats
  };
};

export default useProgressiveLoading;