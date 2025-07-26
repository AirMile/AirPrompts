import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useWebWorker } from './useWebWorker';
import { debounce } from '../utils/helpers';

/**
 * Optimized search hook with Web Worker support
 */
export const useOptimizedSearch = (items, options = {}) => {
  const {
    searchFields = ['name', 'description', 'content'],
    debounceMs = 300,
    minSearchLength = 2,
    maxResults = 100,
    enableFuzzy = true,
    enableWebWorker = true
  } = options;

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(items);
  const [isSearching, setIsSearching] = useState(false);
  const searchIndexRef = useRef(null);
  const abortControllerRef = useRef(null);

  // Web Worker for search
  const searchWorker = useWebWorker((data) => {
    const { items, query, searchFields, enableFuzzy, maxResults } = data;
    
    if (!query || query.length < 2) {
      return items;
    }

    const searchTerms = query.toLowerCase().split(/\s+/).filter(Boolean);
    
    // Score each item
    const scoredItems = items.map(item => {
      let score = 0;
      
      searchTerms.forEach(term => {
        searchFields.forEach(field => {
          const fieldValue = String(item[field] || '').toLowerCase();
          
          // Exact match
          if (fieldValue.includes(term)) {
            score += 10;
          }
          
          // Word boundary match
          const wordBoundaryRegex = new RegExp(`\\b${term}`, 'i');
          if (wordBoundaryRegex.test(fieldValue)) {
            score += 5;
          }
          
          // Fuzzy match (if enabled)
          if (enableFuzzy) {
            const fuzzyScore = calculateFuzzyScore(term, fieldValue);
            score += fuzzyScore * 2;
          }
        });
      });
      
      return { item, score };
    });
    
    // Sort by score and return top results
    return scoredItems
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, maxResults)
      .map(({ item }) => item);
  });

  // Build search index
  const buildSearchIndex = useCallback(() => {
    if (!enableWebWorker || items.length < 1000) {
      // For small datasets, skip indexing
      return null;
    }

    const index = new Map();
    
    items.forEach((item, idx) => {
      searchFields.forEach(field => {
        const text = String(item[field] || '').toLowerCase();
        const words = text.split(/\s+/);
        
        words.forEach(word => {
          if (word.length >= minSearchLength) {
            if (!index.has(word)) {
              index.set(word, new Set());
            }
            index.get(word).add(idx);
          }
        });
      });
    });
    
    return index;
  }, [items, searchFields, minSearchLength, enableWebWorker]);

  // Initialize search index
  useEffect(() => {
    searchIndexRef.current = buildSearchIndex();
  }, [buildSearchIndex]);

  // Perform search
  const performSearch = useCallback(async (query) => {
    // Cancel previous search
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = new AbortController();
    const { signal } = abortControllerRef.current;
    
    setIsSearching(true);
    
    try {
      if (!query || query.trim().length < minSearchLength) {
        setSearchResults(items);
        setIsSearching(false);
        return;
      }

      let results;
      
      if (enableWebWorker && items.length > 500) {
        // Use Web Worker for large datasets
        results = await searchWorker.run({
          items,
          query,
          searchFields,
          enableFuzzy,
          maxResults
        });
      } else {
        // Perform search in main thread for small datasets
        results = performInlineSearch(items, query, {
          searchFields,
          enableFuzzy,
          maxResults,
          searchIndex: searchIndexRef.current
        });
      }
      
      if (!signal.aborted) {
        setSearchResults(results);
      }
    } catch (error) {
      if (!signal.aborted) {
        console.error('Search error:', error);
        setSearchResults([]);
      }
    } finally {
      if (!signal.aborted) {
        setIsSearching(false);
      }
    }
  }, [items, searchFields, minSearchLength, enableFuzzy, maxResults, enableWebWorker, searchWorker]);

  // Debounced search
  const debouncedSearch = useMemo(
    () => debounce(performSearch, debounceMs),
    [performSearch, debounceMs]
  );

  // Handle search query change
  const handleSearch = useCallback((query) => {
    setSearchQuery(query);
    debouncedSearch(query);
  }, [debouncedSearch]);

  // Clear search
  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setSearchResults(items);
    setIsSearching(false);
    
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, [items]);

  // Reset results when items change
  useEffect(() => {
    if (!searchQuery) {
      setSearchResults(items);
    } else {
      debouncedSearch(searchQuery);
    }
  }, [items]);

  return {
    searchQuery,
    searchResults,
    isSearching,
    handleSearch,
    clearSearch,
    resultCount: searchResults.length,
    hasResults: searchResults.length > 0
  };
};

// Inline search for small datasets
function performInlineSearch(items, query, options) {
  const { searchFields, enableFuzzy, maxResults, searchIndex } = options;
  const searchTerms = query.toLowerCase().split(/\s+/).filter(Boolean);
  
  // Use index if available
  if (searchIndex && searchTerms.length === 1) {
    const term = searchTerms[0];
    const indexedIds = new Set();
    
    // Get all items that contain the search term
    searchIndex.forEach((ids, word) => {
      if (word.includes(term)) {
        ids.forEach(id => indexedIds.add(id));
      }
    });
    
    return Array.from(indexedIds)
      .map(id => items[id])
      .filter(Boolean)
      .slice(0, maxResults);
  }
  
  // Fall back to linear search
  const results = items.filter(item => {
    return searchTerms.every(term => {
      return searchFields.some(field => {
        const fieldValue = String(item[field] || '').toLowerCase();
        
        if (fieldValue.includes(term)) {
          return true;
        }
        
        if (enableFuzzy && calculateFuzzyScore(term, fieldValue) > 0.7) {
          return true;
        }
        
        return false;
      });
    });
  });
  
  return results.slice(0, maxResults);
}

// Simple fuzzy matching score
function calculateFuzzyScore(needle, haystack) {
  if (needle.length > haystack.length) return 0;
  
  let score = 0;
  let needleIndex = 0;
  
  for (let i = 0; i < haystack.length && needleIndex < needle.length; i++) {
    if (haystack[i] === needle[needleIndex]) {
      score++;
      needleIndex++;
    }
  }
  
  return needleIndex === needle.length ? score / needle.length : 0;
}

// Search highlight component
export const SearchHighlight = ({ text, query, className = '' }) => {
  if (!query || !text) {
    return <span className={className}>{text}</span>;
  }
  
  const searchTerms = query.toLowerCase().split(/\s+/).filter(Boolean);
  let highlightedText = text;
  
  searchTerms.forEach(term => {
    const regex = new RegExp(`(${term})`, 'gi');
    highlightedText = highlightedText.replace(regex, '<mark>$1</mark>');
  });
  
  return (
    <span 
      className={className}
      dangerouslySetInnerHTML={{ __html: highlightedText }}
    />
  );
};