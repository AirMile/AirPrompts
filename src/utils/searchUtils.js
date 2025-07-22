/**
 * Advanced search utilities for AirPrompts
 * Provides enhanced search functionality with fuzzy matching, ranking, and performance optimization
 */

/**
 * Fuzzy search utility for matching search terms
 * @param {string} searchTerm - The search term to match against
 * @param {string} text - The text to search within
 * @returns {number} - Match score (0-1), higher means better match
 */
export const fuzzyMatch = (searchTerm, text) => {
  if (!searchTerm || !text) return 0;
  
  const term = searchTerm.toLowerCase();
  const target = text.toLowerCase();
  
  // Exact match gets highest score
  if (target === term) return 1.0;
  
  // Starts with gets high score
  if (target.startsWith(term)) return 0.9;
  
  // Contains gets medium score
  if (target.includes(term)) return 0.7;
  
  // Fuzzy character matching
  let score = 0;
  let termIndex = 0;
  
  for (let i = 0; i < target.length && termIndex < term.length; i++) {
    if (target[i] === term[termIndex]) {
      score += 1 / target.length;
      termIndex++;
    }
  }
  
  return termIndex === term.length ? Math.max(score, 0.3) : 0;
};

/**
 * Extract searchable fields from an item
 * @param {Object} item - The item to extract search fields from
 * @param {string} itemType - Type of item ('template', 'workflow', 'snippet')
 * @returns {Array} - Array of searchable field values
 */
export const getSearchFields = (item, itemType) => {
  const baseFields = [
    item.name || '',
    item.description || '',
    item.category || '',
    ...(item.tags || [])
  ];
  
  // Add type-specific fields
  switch (itemType) {
    case 'template':
      return [
        ...baseFields,
        item.content || '',
        ...(item.variables || [])
      ];
    case 'workflow':
      return [
        ...baseFields,
        ...(item.steps || []).map(step => step.name || ''),
        ...(item.steps || []).map(step => step.description || '')
      ];
    case 'snippet':
      return [
        ...baseFields,
        item.content || '',
        item.language || ''
      ];
    default:
      return baseFields;
  }
};

/**
 * Calculate relevance score for a search result
 * @param {Object} item - The item to score
 * @param {string} searchTerm - The search term
 * @param {string} itemType - Type of item
 * @returns {number} - Relevance score (0-1)
 */
export const calculateRelevanceScore = (item, searchTerm, itemType) => {
  if (!searchTerm) return 1;
  
  const searchFields = getSearchFields(item, itemType);
  let maxScore = 0;
  let totalScore = 0;
  let fieldCount = 0;
  
  // Weight different fields differently
  const fieldWeights = {
    name: 3.0,
    description: 2.0,
    content: 1.5,
    category: 1.0,
    tags: 2.0,
    variables: 1.0,
    language: 1.0
  };
  
  searchFields.forEach((field, index) => {
    if (field) {
      const score = fuzzyMatch(searchTerm, field);
      if (score > 0) {
        // Determine field weight based on position and content
        let weight = 1.0;
        if (index === 0) weight = fieldWeights.name;
        else if (index === 1) weight = fieldWeights.description;
        else if (field === item.content) weight = fieldWeights.content;
        else if (field === item.category) weight = fieldWeights.category;
        else if (item.tags && item.tags.includes(field)) weight = fieldWeights.tags;
        
        const weightedScore = score * weight;
        totalScore += weightedScore;
        maxScore = Math.max(maxScore, weightedScore);
        fieldCount++;
      }
    }
  });
  
  // Combine max score with average score
  const averageScore = fieldCount > 0 ? totalScore / fieldCount : 0;
  return Math.max(maxScore * 0.7 + averageScore * 0.3, 0);
};

/**
 * Highlight search terms in text
 * @param {string} text - The text to highlight
 * @param {string} searchTerm - The term to highlight
 * @returns {string} - HTML string with highlighted terms
 */
export const highlightSearchTerm = (text, searchTerm) => {
  if (!text || !searchTerm) return text;
  
  const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  return text.replace(regex, '<mark class="search-highlight">$1</mark>');
};

/**
 * Advanced search function with ranking and filtering
 * @param {Array} items - Array of items to search
 * @param {string} searchTerm - The search term
 * @param {string} itemType - Type of items being searched
 * @param {Object} options - Search options
 * @returns {Array} - Ranked search results
 */
export const performAdvancedSearch = (items, searchTerm, itemType, options = {}) => {
  const {
    minScore = 0.1,
    maxResults = 100,
    fuzzySearch: _fuzzySearch = true,
    sortBy = 'relevance'
  } = options;
  
  if (!searchTerm) return items;
  
  const searchResults = items
    .map(item => ({
      ...item,
      relevanceScore: calculateRelevanceScore(item, searchTerm, itemType)
    }))
    .filter(item => item.relevanceScore >= minScore);
  
  // Sort by relevance or other criteria
  switch (sortBy) {
    case 'relevance':
      searchResults.sort((a, b) => b.relevanceScore - a.relevanceScore);
      break;
    case 'name':
      searchResults.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case 'date':
      searchResults.sort((a, b) => new Date(b.lastUsed || b.created) - new Date(a.lastUsed || a.created));
      break;
    default:
      break;
  }
  
  return searchResults.slice(0, maxResults);
};

/**
 * Search history management
 */
// Import search history helpers from preferences
import { searchHistoryHelpers } from './preferencesStorage.js';

class SearchHistory {
  constructor(maxHistory = 10) {
    this.maxHistory = maxHistory;
  }
  
  getHistory() {
    try {
      return searchHistoryHelpers.getHistory();
    } catch (error) {
      console.warn('Error reading search history:', error);
      return [];
    }
  }
  
  addSearch(searchTerm) {
    if (!searchTerm || !searchTerm.trim()) return;
    
    try {
      searchHistoryHelpers.addSearch(searchTerm);
    } catch (error) {
      console.warn('Error saving search history:', error);
    }
  }
  
  clearHistory() {
    try {
      searchHistoryHelpers.clearHistory();
    } catch (error) {
      console.warn('Error clearing search history:', error);
    }
  }
}

export const searchHistory = new SearchHistory();

/**
 * Generate search suggestions based on existing data
 * @param {Array} allItems - All items to analyze for suggestions
 * @param {string} partial - Partial search term
 * @returns {Array} - Array of suggested search terms
 */
export const generateSearchSuggestions = (allItems, partial) => {
  if (!partial || partial.length < 2) return [];
  
  const suggestions = new Set();
  const partialLower = partial.toLowerCase();
  
  allItems.forEach(item => {
    const fields = getSearchFields(item, item.type);
    fields.forEach(field => {
      if (field && field.toLowerCase().includes(partialLower)) {
        // Extract words that start with the partial term
        const words = field.toLowerCase().split(/\s+/);
        words.forEach(word => {
          if (word.startsWith(partialLower) && word.length > partialLower.length) {
            suggestions.add(word);
          }
        });
        
        // Also suggest the full field if it contains the partial term
        if (field.toLowerCase().startsWith(partialLower)) {
          suggestions.add(field);
        }
      }
    });
  });
  
  return Array.from(suggestions).slice(0, 8); // Limit to 8 suggestions
};

/**
 * Debounced search function
 * @param {Function} searchFunction - The search function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} - Debounced function
 */
export const debounceSearch = (searchFunction, delay = 300) => {
  let timeoutId;
  
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => searchFunction(...args), delay);
  };
};

/**
 * Search performance metrics
 */
export const searchMetrics = {
  trackSearch: (searchTerm, resultCount, searchTime) => {
    // In a real app, you might send this to analytics
    console.log(`Search: "${searchTerm}", Results: ${resultCount}, Time: ${searchTime}ms`);
  },
  
  measureSearchTime: (searchFunction) => {
    return (...args) => {
      const startTime = performance.now();
      const result = searchFunction(...args);
      const endTime = performance.now();
      
      // Track the search if it's a real search with results
      if (args[1] && result.length !== args[0].length) {
        searchMetrics.trackSearch(args[1], result.length, endTime - startTime);
      }
      
      return result;
    };
  }
};

export default {
  fuzzyMatch,
  getSearchFields,
  calculateRelevanceScore,
  highlightSearchTerm,
  performAdvancedSearch,
  searchHistory,
  generateSearchSuggestions,
  debounceSearch,
  searchMetrics
};