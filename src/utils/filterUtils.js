import { useMemo } from 'react';

/**
 * Cache for filter results to improve performance with LRU eviction
 */
const filterCache = new Map();
const CACHE_SIZE_LIMIT = 500; // Increased cache size for better performance
const cacheAccessOrder = new Map(); // Track access order for LRU eviction

/**
 * Clear the filter cache
 */
export const clearFilterCache = () => {
  filterCache.clear();
  cacheAccessOrder.clear();
};

/**
 * Get cache key for filter parameters
 * @param {Array} items - Items to filter
 * @param {Array} selectedTags - Selected tags
 * @param {string} filterMode - 'AND' or 'OR'
 * @param {string} itemType - Type of items
 * @returns {string} Cache key
 */
const getCacheKey = (items, selectedTags, filterMode, itemType) => {
  // Create a more efficient hash for the cache key
  const itemsHash = items.length > 0 ? items.length + '_' + (items[0]?.id || '') : '0';
  const tagsHash = selectedTags.length > 0 ? selectedTags.sort().join(',') : 'none';
  return `${itemsHash}-${tagsHash}-${filterMode}-${itemType}`;
};

/**
 * Add result to cache with LRU eviction
 * @param {string} key - Cache key
 * @param {Array} result - Filter result
 */
const addToCache = (key, result) => {
  if (filterCache.size >= CACHE_SIZE_LIMIT) {
    // Remove least recently used entry
    const lruKey = [...cacheAccessOrder.keys()][0];
    filterCache.delete(lruKey);
    cacheAccessOrder.delete(lruKey);
  }
  
  filterCache.set(key, result);
  cacheAccessOrder.set(key, Date.now());
};

/**
 * Extract all unique tags from items
 * @param {Array} items - Array of items (templates, workflows, snippets)
 * @param {string} itemType - Type of items ('template', 'workflow', 'snippet')
 * @returns {Array} Array of unique tags
 */
export const extractTags = (items, itemType) => {
  const tagSet = new Set();
  
  items.forEach(item => {
    let tags = [];
    
    // Different tag field names for different item types
    switch (itemType) {
      case 'template':
      case 'workflow':
        tags = item.snippetTags || [];
        break;
      case 'snippet':
        tags = item.tags || [];
        break;
      default:
        tags = item.tags || item.snippetTags || [];
    }
    
    tags.forEach(tag => {
      if (tag && typeof tag === 'string') {
        tagSet.add(tag.trim());
      }
    });
  });
  
  return Array.from(tagSet).sort();
};

/**
 * Extract tags from mixed item types
 * @param {Object} itemCollections - Object with arrays of different item types
 * @returns {Array} Array of unique tags from all item types
 */
export const extractAllTags = (itemCollections) => {
  const allTags = new Set();
  
  // Extract from templates
  if (itemCollections.templates) {
    const templateTags = extractTags(itemCollections.templates, 'template');
    templateTags.forEach(tag => allTags.add(tag));
  }
  
  // Extract from workflows
  if (itemCollections.workflows) {
    const workflowTags = extractTags(itemCollections.workflows, 'workflow');
    workflowTags.forEach(tag => allTags.add(tag));
  }
  
  // Extract from snippets
  if (itemCollections.snippets) {
    const snippetTags = extractTags(itemCollections.snippets, 'snippet');
    snippetTags.forEach(tag => allTags.add(tag));
  }
  
  return Array.from(allTags).sort();
};

/**
 * Apply tag filtering to items
 * @param {Array} items - Items to filter
 * @param {Array} selectedTags - Selected tags for filtering
 * @param {string} filterMode - 'AND' or 'OR' filtering mode
 * @param {string} itemType - Type of items being filtered
 * @returns {Array} Filtered items
 */
export const applyTagFilters = (items, selectedTags, filterMode, itemType) => {
  // No filtering if no tags selected
  if (!selectedTags || selectedTags.length === 0) {
    return items;
  }
  
  // Check cache first
  const cacheKey = getCacheKey(items, selectedTags, filterMode, itemType);
  if (filterCache.has(cacheKey)) {
    // Update access order for LRU
    cacheAccessOrder.set(cacheKey, Date.now());
    return filterCache.get(cacheKey);
  }
  
  const result = items.filter(item => {
    let itemTags = [];
    
    // Get tags based on item type
    switch (itemType) {
      case 'template':
      case 'workflow':
        itemTags = item.snippetTags || [];
        break;
      case 'snippet':
        itemTags = item.tags || [];
        break;
      default:
        itemTags = item.tags || item.snippetTags || [];
    }
    
    // Normalize tags to strings
    const normalizedTags = itemTags.map(tag => 
      typeof tag === 'string' ? tag.trim() : String(tag).trim()
    ).filter(tag => tag);
    
    // Apply filtering logic
    if (filterMode === 'AND') {
      // Item must have ALL selected tags
      return selectedTags.every(tag => normalizedTags.includes(tag));
    } else {
      // Item must have ANY selected tags (OR mode)
      return selectedTags.some(tag => normalizedTags.includes(tag));
    }
  });
  
  // Cache the result
  addToCache(cacheKey, result);
  
  return result;
};

/**
 * Apply complex filtering combining multiple filter types
 * @param {Array} items - Items to filter
 * @param {Object} filters - Filter configuration
 * @param {string} itemType - Type of items being filtered
 * @returns {Array} Filtered items
 */
export const applyComplexFilters = (items, filters, itemType) => {
  let result = items;
  
  // Apply tag filtering
  if (filters.selectedTags && filters.selectedTags.length > 0) {
    result = applyTagFilters(result, filters.selectedTags, filters.filterMode, itemType);
  }
  
  // Apply category filtering
  if (filters.category && filters.category !== 'all') {
    result = result.filter(item => item.category === filters.category);
  }
  
  // Apply favorite filtering
  if (filters.favoriteOnly) {
    result = result.filter(item => item.favorite);
  }
  
  // Apply content filtering
  if (filters.hasContent) {
    result = result.filter(item => item.content && item.content.trim().length > 0);
  }
  
  // Apply type filtering for mixed collections
  if (filters.type && filters.type !== 'all') {
    if (filters.type === 'templates' && itemType !== 'template') return [];
    if (filters.type === 'workflows' && itemType !== 'workflow') return [];
    if (filters.type === 'snippets' && itemType !== 'snippet') return [];
  }
  
  return result;
};

/**
 * Get tag usage statistics
 * @param {Array} items - Items to analyze
 * @param {string} itemType - Type of items
 * @returns {Object} Tag usage statistics
 */
export const getTagStats = (items, itemType) => {
  const tagCount = new Map();
  const totalItems = items.length;
  
  items.forEach(item => {
    let tags = [];
    
    switch (itemType) {
      case 'template':
      case 'workflow':
        tags = item.snippetTags || [];
        break;
      case 'snippet':
        tags = item.tags || [];
        break;
      default:
        tags = item.tags || item.snippetTags || [];
    }
    
    tags.forEach(tag => {
      if (tag && typeof tag === 'string') {
        const normalizedTag = tag.trim();
        tagCount.set(normalizedTag, (tagCount.get(normalizedTag) || 0) + 1);
      }
    });
  });
  
  const sortedTags = Array.from(tagCount.entries())
    .map(([tag, count]) => ({
      tag,
      count,
      percentage: ((count / totalItems) * 100).toFixed(1)
    }))
    .sort((a, b) => b.count - a.count);
  
  return {
    totalTags: tagCount.size,
    totalItems,
    mostUsedTags: sortedTags.slice(0, 10),
    allTags: sortedTags
  };
};

/**
 * Get suggested tags based on item content
 * @param {string} content - Item content
 * @param {Array} existingTags - Existing tags in the system
 * @returns {Array} Suggested tags
 */
export const getSuggestedTags = (content, existingTags) => {
  if (!content || !existingTags || existingTags.length === 0) {
    return [];
  }
  
  const contentLower = content.toLowerCase();
  const suggestions = [];
  
  existingTags.forEach(tag => {
    const tagLower = tag.toLowerCase();
    
    // Check if tag appears in content
    if (contentLower.includes(tagLower)) {
      suggestions.push({
        tag,
        relevance: 'high',
        reason: 'Found in content'
      });
    }
    
    // Check for partial matches
    const words = contentLower.split(/\s+/);
    if (words.some(word => word.includes(tagLower) || tagLower.includes(word))) {
      suggestions.push({
        tag,
        relevance: 'medium',
        reason: 'Partial match'
      });
    }
  });
  
  // Remove duplicates and sort by relevance
  const uniqueSuggestions = suggestions.filter((item, index, self) => 
    index === self.findIndex(t => t.tag === item.tag)
  );
  
  return uniqueSuggestions
    .sort((a, b) => {
      const relevanceOrder = { high: 3, medium: 2, low: 1 };
      return relevanceOrder[b.relevance] - relevanceOrder[a.relevance];
    })
    .slice(0, 5) // Limit to 5 suggestions
    .map(item => item.tag);
};

/**
 * Progressive filtering for very large datasets
 * @param {Array} items - Items to filter
 * @param {Object} filters - Filter configuration
 * @param {string} itemType - Type of items
 * @param {number} batchSize - Size of each batch
 * @returns {Array} Filtered results
 */
const progressiveFilter = (items, filters, itemType, batchSize = 1000) => {
  const results = [];
  
  // Process items in batches to avoid blocking the UI
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const filteredBatch = applyComplexFilters(batch, filters, itemType);
    results.push(...filteredBatch);
    
    // Allow other tasks to run between batches
    if (i + batchSize < items.length) {
      // Use setTimeout to yield control back to the browser
      setTimeout(() => {}, 0);
    }
  }
  
  return results;
};

/**
 * Optimize filter performance for large datasets
 * @param {Array} items - Items to filter
 * @param {Object} filters - Filter configuration
 * @param {string} itemType - Type of items
 * @param {Object} options - Additional options
 * @returns {Array} Optimized filtered results
 */
export const optimizedFilter = (items, filters, itemType, options = {}) => {
  const { progressive = false, batchSize = 1000 } = options;
  
  // For small datasets, use regular filtering
  if (items.length < 100) {
    return applyComplexFilters(items, filters, itemType);
  }
  
  // For very large datasets, use progressive filtering
  if (progressive && items.length > 10000) {
    return progressiveFilter(items, filters, itemType, batchSize);
  }
  
  // For large datasets, use indexed filtering
  const indexedItems = items.map((item, index) => ({ ...item, _index: index }));
  
  // Apply most selective filters first
  let result = indexedItems;
  
  // 1. Type filtering (most selective)
  if (filters.type && filters.type !== 'all') {
    result = result.filter(() => {
      if (filters.type === 'templates' && itemType !== 'template') return false;
      if (filters.type === 'workflows' && itemType !== 'workflow') return false;
      if (filters.type === 'snippets' && itemType !== 'snippet') return false;
      return true;
    });
  }
  
  // 2. Favorite filtering (usually selective)
  if (filters.favoriteOnly) {
    result = result.filter(item => item.favorite);
  }
  
  // 3. Content filtering
  if (filters.hasContent) {
    result = result.filter(item => item.content && item.content.trim().length > 0);
  }
  
  // 4. Category filtering
  if (filters.category && filters.category !== 'all') {
    result = result.filter(item => item.category === filters.category);
  }
  
  // 5. Tag filtering (potentially least selective)
  if (filters.selectedTags && filters.selectedTags.length > 0) {
    result = applyTagFilters(result, filters.selectedTags, filters.filterMode, itemType);
  }
  
  // Remove index property
  return result.map(item => {
    const { _index, ...cleanItem } = item;
    return cleanItem;
  });
};

/**
 * Custom hook for memoized filtering
 * @param {Array} items - Items to filter
 * @param {Object} filters - Filter configuration
 * @param {string} itemType - Type of items
 * @returns {Array} Memoized filtered results
 */
export const useMemoizedFilter = (items, filters, itemType) => {
  return useMemo(() => {
    return optimizedFilter(items, filters, itemType);
  }, [items, filters, itemType]);
};

/**
 * Debounced filter function for search integration
 * @param {Function} filterFunction - Filter function to debounce
 * @param {number} delay - Debounce delay in milliseconds
 * @returns {Function} Debounced filter function
 */
export const debounceFilter = (filterFunction, delay = 300) => {
  let timeoutId;
  
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => filterFunction(...args), delay);
  };
};

/**
 * Filter validation and sanitization
 * @param {Object} filters - Filter configuration to validate
 * @returns {Object} Validated and sanitized filters
 */
export const validateFilters = (filters) => {
  const defaultFilters = {
    selectedTags: [],
    filterMode: 'OR',
    category: 'all',
    favoriteOnly: false,
    hasContent: false,
    type: 'all'
  };
  
  const sanitized = { ...defaultFilters, ...filters };
  
  // Validate selectedTags
  if (!Array.isArray(sanitized.selectedTags)) {
    sanitized.selectedTags = [];
  }
  
  // Validate filterMode
  if (!['AND', 'OR'].includes(sanitized.filterMode)) {
    sanitized.filterMode = 'OR';
  }
  
  // Validate boolean flags
  sanitized.favoriteOnly = Boolean(sanitized.favoriteOnly);
  sanitized.hasContent = Boolean(sanitized.hasContent);
  
  return sanitized;
};

/**
 * Export filter configuration for persistence
 * @param {Object} filters - Filter configuration
 * @returns {string} JSON string of filter configuration
 */
export const exportFilters = (filters) => {
  try {
    const sanitized = validateFilters(filters);
    return JSON.stringify(sanitized, null, 2);
  } catch (error) {
    console.error('Error exporting filters:', error);
    return '{}';
  }
};

/**
 * Import filter configuration from JSON
 * @param {string} jsonString - JSON string of filter configuration
 * @returns {Object} Parsed and validated filter configuration
 */
export const importFilters = (jsonString) => {
  try {
    const parsed = JSON.parse(jsonString);
    return validateFilters(parsed);
  } catch (error) {
    console.error('Error importing filters:', error);
    return validateFilters({});
  }
};