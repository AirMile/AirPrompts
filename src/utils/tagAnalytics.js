// src/utils/tagAnalytics.js
// Tag Analytics System for intelligent tag suggestions
// Based on React performance best practices with memoization

/**
 * Analyzes snippet tags to provide intelligent suggestions
 * Implements frequency-based sorting and caching for performance
 */

const CACHE_KEY = 'airprompts-tag-analytics';
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes

/**
 * Extract all tags from snippets and calculate frequency
 * @param {Array} snippets - Array of snippet objects
 * @returns {Array} Sorted array of tag objects with frequency data
 */
export const analyzeTagFrequency = (snippets) => {
  if (!Array.isArray(snippets) || snippets.length === 0) {
    return [];
  }

  // Count tag frequency
  const tagCounts = new Map();

  snippets.forEach((snippet) => {
    if (Array.isArray(snippet.tags)) {
      snippet.tags.forEach((tag) => {
        if (typeof tag === 'string' && tag.trim()) {
          const normalizedTag = tag.trim().toLowerCase();
          tagCounts.set(normalizedTag, (tagCounts.get(normalizedTag) || 0) + 1);
        }
      });
    }
  });

  // Convert to array and sort by frequency (descending)
  return Array.from(tagCounts.entries())
    .map(([tag, count]) => ({
      tag,
      count,
      percentage: Math.round((count / snippets.length) * 100),
    }))
    .sort((a, b) => b.count - a.count);
};

/**
 * Get cached tag frequency data or recalculate if expired
 * @param {Array} snippets - Current snippets array
 * @returns {Array} Tag frequency data
 */
export const getCachedTagFrequency = (snippets) => {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const { data, timestamp, snippetHash } = JSON.parse(cached);
      const currentHash = generateSnippetHash(snippets);

      // Check if cache is valid (not expired and data hasn't changed)
      if (Date.now() - timestamp < CACHE_EXPIRY && snippetHash === currentHash) {
        return data;
      }
    }
  } catch (error) {
    console.warn('Failed to load cached tag analytics:', error);
  }

  // Calculate fresh data and cache it
  const freshData = analyzeTagFrequency(snippets);
  cacheTagFrequency(freshData, snippets);
  return freshData;
};

/**
 * Cache tag frequency data with timestamp and data hash
 * @param {Array} tagData - Tag frequency data to cache
 * @param {Array} snippets - Source snippets for hash generation
 */
const cacheTagFrequency = (tagData, snippets) => {
  try {
    const cacheData = {
      data: tagData,
      timestamp: Date.now(),
      snippetHash: generateSnippetHash(snippets),
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
  } catch (error) {
    console.warn('Failed to cache tag analytics:', error);
  }
};

/**
 * Generate a simple hash of snippets for cache invalidation
 * @param {Array} snippets - Snippets array
 * @returns {string} Hash string
 */
const generateSnippetHash = (snippets) => {
  if (!Array.isArray(snippets)) return '';

  return snippets
    .map((s) => `${s.id}-${s.updatedAt}-${JSON.stringify(s.tags || [])}`)
    .join('|')
    .slice(0, 50); // Truncate for performance
};

/**
 * Filter tags based on input with fuzzy matching
 * @param {Array} tagFrequencyData - Tag frequency data
 * @param {string} inputValue - User input
 * @param {number} maxResults - Maximum results to return
 * @returns {Array} Filtered and sorted tag suggestions
 */
export const filterTagSuggestions = (tagFrequencyData, inputValue, maxResults = 15) => {
  if (!inputValue || !inputValue.trim()) {
    // Return most popular tags when no input
    return tagFrequencyData.slice(0, maxResults);
  }

  const query = inputValue.trim().toLowerCase();

  // Score-based filtering for better relevance
  const scoredTags = tagFrequencyData
    .map((tagData) => ({
      ...tagData,
      score: calculateTagScore(tagData.tag, query, tagData.count),
    }))
    .filter((tagData) => tagData.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults);

  return scoredTags;
};

/**
 * Calculate relevance score for a tag based on input and frequency
 * @param {string} tag - Tag to score
 * @param {string} query - User input query
 * @param {number} frequency - Tag usage frequency
 * @returns {number} Score (0 = no match, higher = better match)
 */
const calculateTagScore = (tag, query, frequency) => {
  if (!tag || !query) return 0;

  const tagLower = tag.toLowerCase();
  const queryLower = query.toLowerCase();

  // Exact match gets highest score
  if (tagLower === queryLower) {
    return 1000 + frequency;
  }

  // Starts with query gets high score
  if (tagLower.startsWith(queryLower)) {
    return 800 + frequency;
  }

  // Contains query gets medium score
  if (tagLower.includes(queryLower)) {
    return 400 + frequency;
  }

  // Fuzzy match for typos/partial matches
  if (fuzzyMatch(tagLower, queryLower)) {
    return 200 + frequency;
  }

  return 0;
};

/**
 * Simple fuzzy matching for typos and partial matches
 * @param {string} text - Text to match against
 * @param {string} query - Query to match
 * @returns {boolean} True if fuzzy match found
 */
const fuzzyMatch = (text, query) => {
  if (query.length < 2) return false;

  // Allow for one character difference
  let queryIndex = 0;
  let textIndex = 0;
  let mistakes = 0;
  const maxMistakes = Math.floor(query.length / 3);

  while (queryIndex < query.length && textIndex < text.length) {
    if (query[queryIndex] === text[textIndex]) {
      queryIndex++;
      textIndex++;
    } else {
      mistakes++;
      if (mistakes > maxMistakes) return false;

      // Try skipping character in text
      textIndex++;
    }
  }

  return queryIndex === query.length;
};

/**
 * Get fallback tags for new users or when no user tags exist
 * @returns {Array} Basic tag suggestions
 */
export const getFallbackTags = () => {
  return [
    { tag: 'development', count: 0 },
    { tag: 'formatting', count: 0 },
    { tag: 'quality', count: 0 },
    { tag: 'accessibility', count: 0 },
    { tag: 'technical', count: 0 },
  ];
};

/**
 * Clear tag analytics cache (useful when snippets are bulk updated)
 */
export const clearTagAnalyticsCache = () => {
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch (error) {
    console.warn('Failed to clear tag analytics cache:', error);
  }
};
