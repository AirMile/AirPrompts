// src/hooks/useTagSuggestions.js
// Custom hook for intelligent tag suggestions
// Implements React performance best practices with useCallback and useMemo

import { useState, useMemo, useCallback, useEffect } from 'react';
import {
  getCachedTagFrequency,
  filterTagSuggestions,
  getFallbackTags,
  clearTagAnalyticsCache,
} from '../utils/tagAnalytics.js';

/**
 * Custom hook for intelligent tag suggestions with performance optimizations
 * @param {Array} snippets - Available snippets data
 * @param {string} inputValue - Current input value
 * @param {Array} currentTags - Already selected tags to exclude
 * @param {Object} options - Configuration options
 * @returns {Object} Tag suggestions and related functions
 */
export const useTagSuggestions = (
  snippets = [],
  inputValue = '',
  currentTags = [],
  options = {}
) => {
  const {
    maxSuggestions = 15,
    debounceMs = 300,
    minInputLength = 0,
    enableFallback = true,
  } = options;

  const [debouncedInput, setDebouncedInput] = useState(inputValue);
  const [isLoading, setIsLoading] = useState(false);

  // Debounce input for performance - following React best practices
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedInput(inputValue);
      setIsLoading(false);
    }, debounceMs);

    if (inputValue !== debouncedInput) {
      setIsLoading(true);
    }

    return () => clearTimeout(timer);
  }, [inputValue, debounceMs, debouncedInput]);

  // Memoize tag frequency data - recalculate only when snippets change
  const tagFrequencyData = useMemo(() => {
    if (!Array.isArray(snippets) || snippets.length === 0) {
      return enableFallback ? getFallbackTags() : [];
    }

    try {
      return getCachedTagFrequency(snippets);
    } catch (error) {
      console.warn('Failed to get tag frequency data:', error);
      return enableFallback ? getFallbackTags() : [];
    }
  }, [snippets, enableFallback]);

  // Memoize available tags (excluding current tags)
  const availableTags = useMemo(() => {
    const currentTagsLower = currentTags.map((tag) => tag.toLowerCase());
    return tagFrequencyData.filter(
      (tagData) => !currentTagsLower.includes(tagData.tag.toLowerCase())
    );
  }, [tagFrequencyData, currentTags]);

  // Memoize filtered suggestions based on input
  const suggestions = useMemo(() => {
    if (debouncedInput.length < minInputLength) {
      // Show most popular tags when no input
      return availableTags.slice(0, maxSuggestions);
    }

    return filterTagSuggestions(availableTags, debouncedInput, maxSuggestions);
  }, [availableTags, debouncedInput, maxSuggestions, minInputLength]);

  // useCallback for stable function references
  const getSuggestionValue = useCallback((suggestion) => {
    return suggestion.tag;
  }, []);

  const getSuggestions = useCallback(
    (value) => {
      if (!value || value.length < minInputLength) {
        return availableTags.slice(0, maxSuggestions);
      }

      return filterTagSuggestions(availableTags, value, maxSuggestions);
    },
    [availableTags, maxSuggestions, minInputLength]
  );

  // Cache management functions
  const refreshCache = useCallback(() => {
    clearTagAnalyticsCache();
  }, []);

  const getTagStats = useCallback(() => {
    return {
      totalUniqueTags: tagFrequencyData.length,
      availableForSelection: availableTags.length,
      currentSuggestions: suggestions.length,
      isLoading,
    };
  }, [tagFrequencyData.length, availableTags.length, suggestions.length, isLoading]);

  // Check if a tag already exists
  const isTagAlreadySelected = useCallback(
    (tag) => {
      const tagLower = tag.toLowerCase();
      return currentTags.some((current) => current.toLowerCase() === tagLower);
    },
    [currentTags]
  );

  // Get tag frequency for a specific tag
  const getTagFrequency = useCallback(
    (tag) => {
      const tagData = tagFrequencyData.find((item) => item.tag.toLowerCase() === tag.toLowerCase());
      return tagData ? tagData.count : 0;
    },
    [tagFrequencyData]
  );

  // Highlight matching text in suggestions
  const highlightMatch = useCallback((text, query) => {
    if (!query || !text) return text;

    const queryLower = query.toLowerCase();
    const textLower = text.toLowerCase();
    const index = textLower.indexOf(queryLower);

    if (index === -1) return text;

    return {
      before: text.slice(0, index),
      match: text.slice(index, index + query.length),
      after: text.slice(index + query.length),
    };
  }, []);

  return {
    // Core suggestion data
    suggestions,
    tagFrequencyData,
    availableTags,

    // Loading states
    isLoading,

    // Helper functions with stable references
    getSuggestionValue,
    getSuggestions,
    isTagAlreadySelected,
    getTagFrequency,
    highlightMatch,

    // Cache management
    refreshCache,

    // Statistics and debugging
    getTagStats,

    // Configuration
    options: {
      maxSuggestions,
      debounceMs,
      minInputLength,
      enableFallback,
    },
  };
};

/**
 * Simplified hook for basic tag suggestions without advanced features
 * @param {Array} snippets - Available snippets data
 * @param {string} inputValue - Current input value
 * @param {Array} currentTags - Already selected tags
 * @returns {Array} Simple array of tag suggestions
 */
export const useSimpleTagSuggestions = (snippets, inputValue, currentTags = []) => {
  const { suggestions } = useTagSuggestions(snippets, inputValue, currentTags, {
    maxSuggestions: 10,
    debounceMs: 200,
    minInputLength: 0,
  });

  return suggestions.map((s) => s.tag);
};

export default useTagSuggestions;
