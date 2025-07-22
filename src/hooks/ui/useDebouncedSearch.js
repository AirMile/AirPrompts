import { useState, useEffect, useCallback } from 'react';

export function useDebouncedSearch(searchFn, delay = 300) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setError(null);
      return;
    }
    
    setIsSearching(true);
    setError(null);
    
    const timeoutId = setTimeout(async () => {
      try {
        const searchResults = await searchFn(query);
        setResults(searchResults);
        setError(null);
      } catch (err) {
        setError(err.message || 'Search failed');
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, delay);
    
    return () => clearTimeout(timeoutId);
  }, [query, searchFn, delay]);
  
  const clearSearch = useCallback(() => {
    setQuery('');
    setResults([]);
    setError(null);
    setIsSearching(false);
  }, []);
  
  return {
    query,
    setQuery,
    results,
    isSearching,
    error,
    clearSearch
  };
}