import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Clock, Filter, ChevronDown, ChevronUp, Sun, Moon } from 'lucide-react';
import { searchHistory, generateSearchSuggestions, debounceSearch } from '../../utils/searchUtils.js';
import themeStore from '../../store/themeStore.js';

/**
 * Advanced Search Component
 * Provides enhanced search functionality with suggestions, history, and filtering
 */
const AdvancedSearch = ({ 
  searchQuery, 
  setSearchQuery, 
  allItems = [], 
  onFilter,
  placeholder = "Search templates, workflows, snippets, and tags...",
  className = ""
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [searchHistoryList, setSearchHistoryList] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const [filters, setFilters] = useState({
    type: 'all', // 'all', 'templates', 'workflows', 'snippets'
    category: 'all',
    favoriteOnly: false,
    hasContent: false
  });
  
  const searchInputRef = useRef(null);
  const suggestionsRef = useRef(null);
  
  // Theme store
  const { isDarkMode, toggleDarkMode } = themeStore();
  
  // Load search history on component mount
  useEffect(() => {
    setSearchHistoryList(searchHistory.getHistory());
  }, []);
  
  // Generate suggestions based on input
  const debouncedGenerateSuggestions = debounceSearch((query) => {
    if (query.length >= 2) {
      const newSuggestions = generateSearchSuggestions(allItems, query);
      setSuggestions(newSuggestions);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, 200);
  
  // Handle search input changes
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    setSelectedSuggestionIndex(-1);
    
    if (value.trim()) {
      debouncedGenerateSuggestions(value);
    } else {
      setShowSuggestions(false);
      setSuggestions([]);
    }
  };
  
  // Handle search submission
  const handleSearchSubmit = (searchTerm = searchQuery) => {
    if (searchTerm.trim()) {
      searchHistory.addSearch(searchTerm.trim());
      setSearchHistoryList(searchHistory.getHistory());
    }
    setShowSuggestions(false);
    setSelectedSuggestionIndex(-1);
    
    // Apply filters if callback provided
    if (onFilter) {
      onFilter({ searchTerm, filters });
    }
  };
  
  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (!showSuggestions) return;
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedSuggestionIndex >= 0) {
          const selectedSuggestion = suggestions[selectedSuggestionIndex];
          setSearchQuery(selectedSuggestion);
          handleSearchSubmit(selectedSuggestion);
        } else {
          handleSearchSubmit();
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedSuggestionIndex(-1);
        break;
    }
  };
  
  // Handle suggestion selection
  const handleSuggestionClick = (suggestion) => {
    setSearchQuery(suggestion);
    handleSearchSubmit(suggestion);
  };
  
  // Handle filter changes
  const handleFilterChange = (filterType, value) => {
    const newFilters = { ...filters, [filterType]: value };
    setFilters(newFilters);
    
    if (onFilter) {
      onFilter({ searchTerm: searchQuery, filters: newFilters });
    }
  };
  
  // Clear search
  const clearSearch = () => {
    setSearchQuery('');
    setShowSuggestions(false);
    setSuggestions([]);
    setSelectedSuggestionIndex(-1);
    
    if (onFilter) {
      onFilter({ searchTerm: '', filters });
    }
  };
  
  // Clear search history
  const clearSearchHistory = () => {
    searchHistory.clearHistory();
    setSearchHistoryList([]);
  };
  
  // Handle history item click
  const handleHistoryClick = (historyItem) => {
    setSearchQuery(historyItem);
    handleSearchSubmit(historyItem);
  };
  
  // Get unique categories from all items
  const getUniqueCategories = () => {
    const categories = new Set();
    allItems.forEach(item => {
      if (item.category) {
        categories.add(item.category);
      }
    });
    return Array.from(categories).sort();
  };
  
  const uniqueCategories = getUniqueCategories();
  
  return (
    <div className={`relative ${className}`}>
      {/* Main Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400 dark:text-secondary-500 w-5 h-5" />
        <input
          ref={searchInputRef}
          type="text"
          placeholder={placeholder}
          value={searchQuery}
          onChange={handleSearchChange}
          onKeyDown={handleKeyDown}
          data-search-input="true"
          onFocus={() => {
            if (searchQuery.length >= 2) {
              setShowSuggestions(true);
            }
          }}
          onBlur={() => {
            // Delay hiding suggestions to allow for clicks
            setTimeout(() => setShowSuggestions(false), 200);
          }}
          className="w-full pl-10 pr-28 py-3 border border-secondary-300 dark:border-secondary-600 bg-white dark:bg-secondary-800 text-secondary-900 dark:text-secondary-100 rounded-lg focus:outline-none focus:border-primary-500 placeholder-secondary-400 dark:placeholder-secondary-500 transition-colors duration-200"
        />
        
        {/* Clear Button */}
        {searchQuery && (
          <button
            onClick={clearSearch}
            className="absolute right-20 top-1/2 transform -translate-y-1/2 text-secondary-400 hover:text-secondary-600 dark:hover:text-secondary-300"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        
        
        {/* Dark Mode Toggle */}
        <button
          onClick={toggleDarkMode}
          className="absolute right-12 top-1/2 transform -translate-y-1/2 text-secondary-400 hover:text-secondary-600 dark:hover:text-secondary-300 p-1 rounded-lg transition-colors"
          title={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
        >
          {isDarkMode ? (
            <Sun className="w-4 h-4" />
          ) : (
            <Moon className="w-4 h-4" />
          )}
        </button>
        
        {/* Advanced Search Toggle */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-secondary-400 hover:text-secondary-600 dark:hover:text-secondary-300"
        >
          <Filter className="w-4 h-4" />
        </button>
      </div>
      
      {/* Suggestions Dropdown */}
      {showSuggestions && (suggestions.length > 0 || searchHistoryList.length > 0) && (
        <div 
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-white dark:bg-secondary-800 border border-secondary-200 dark:border-secondary-600 rounded-lg shadow-xl max-h-80 overflow-y-auto"
        >
          {/* Search Suggestions */}
          {suggestions.length > 0 && (
            <div className="p-2">
              <div className="text-xs text-secondary-500 dark:text-secondary-400 mb-2 px-2">Suggestions</div>
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className={`w-full text-left px-3 py-2 rounded hover:bg-secondary-100 dark:hover:bg-secondary-700 text-secondary-900 dark:text-secondary-100 ${
                    selectedSuggestionIndex === index ? 'bg-secondary-100 dark:bg-secondary-700' : ''
                  }`}
                >
                  <Search className="w-4 h-4 inline mr-2" />
                  {suggestion}
                </button>
              ))}
            </div>
          )}
          
          {/* Search History */}
          {searchHistoryList.length > 0 && (
            <div className="p-2 border-t border-secondary-200 dark:border-secondary-600">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs text-secondary-500 dark:text-secondary-400 px-2">Recent Searches</div>
                <button
                  onClick={clearSearchHistory}
                  className="text-xs text-secondary-500 dark:text-secondary-400 hover:text-secondary-600 dark:hover:text-secondary-300 px-2"
                >
                  Clear
                </button>
              </div>
              {searchHistoryList.map((historyItem, index) => (
                <button
                  key={index}
                  onClick={() => handleHistoryClick(historyItem)}
                  className="w-full text-left px-3 py-2 rounded hover:bg-secondary-100 dark:hover:bg-secondary-700 text-secondary-900 dark:text-secondary-100"
                >
                  <Clock className="w-4 h-4 inline mr-2" />
                  {historyItem}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      
      {/* Advanced Filters */}
      {isExpanded && (
        <div className="mt-4 p-4 bg-white dark:bg-secondary-800 border border-secondary-200 dark:border-secondary-600 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-secondary-900 dark:text-secondary-100">Advanced Filters</h3>
            <button
              onClick={() => setIsExpanded(false)}
              className="text-secondary-400 hover:text-secondary-600 dark:hover:text-secondary-300"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Type Filter */}
            <div>
              <label className="block text-xs text-secondary-500 dark:text-secondary-400 mb-1">Type</label>
              <select
                value={filters.type}
                onChange={(e) => handleFilterChange('type', e.target.value)}
                className="w-full px-3 py-2 bg-secondary-50 dark:bg-secondary-700 border border-secondary-300 dark:border-secondary-600 rounded text-secondary-900 dark:text-secondary-100 text-sm"
              >
                <option value="all">All Types</option>
                <option value="templates">Templates</option>
                <option value="workflows">Workflows</option>
                <option value="snippets">Snippets</option>
              </select>
            </div>
            
            {/* Category Filter */}
            <div>
              <label className="block text-xs text-secondary-500 dark:text-secondary-400 mb-1">Category</label>
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="w-full px-3 py-2 bg-secondary-50 dark:bg-secondary-700 border border-secondary-300 dark:border-secondary-600 rounded text-secondary-900 dark:text-secondary-100 text-sm"
              >
                <option value="all">All Categories</option>
                {uniqueCategories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            
            {/* Favorites Only */}
            <div>
              <label className="flex items-center space-x-2 text-sm text-secondary-900 dark:text-secondary-100">
                <input
                  type="checkbox"
                  checked={filters.favoriteOnly}
                  onChange={(e) => handleFilterChange('favoriteOnly', e.target.checked)}
                  className="rounded border-secondary-400 dark:border-secondary-600 bg-secondary-50 dark:bg-secondary-700 text-primary-600 focus:ring-primary-500"
                />
                <span>Favorites Only</span>
              </label>
            </div>
            
            {/* Has Content */}
            <div>
              <label className="flex items-center space-x-2 text-sm text-secondary-900 dark:text-secondary-100">
                <input
                  type="checkbox"
                  checked={filters.hasContent}
                  onChange={(e) => handleFilterChange('hasContent', e.target.checked)}
                  className="rounded border-secondary-400 dark:border-secondary-600 bg-secondary-50 dark:bg-secondary-700 text-primary-600 focus:ring-primary-500"
                />
                <span>Has Content</span>
              </label>
            </div>
          </div>
          
          {/* Quick Actions */}
          <div className="mt-4 pt-3 border-t border-secondary-200 dark:border-secondary-600">
            <div className="flex items-center justify-between">
              <button
                onClick={() => {
                  setFilters({
                    type: 'all',
                    category: 'all',
                    favoriteOnly: false,
                    hasContent: false
                  });
                  if (onFilter) {
                    onFilter({ searchTerm: searchQuery, filters: {
                      type: 'all',
                      category: 'all',
                      favoriteOnly: false,
                      hasContent: false
                    }});
                  }
                }}
                className="text-sm text-secondary-500 dark:text-secondary-400 hover:text-secondary-600 dark:hover:text-secondary-300"
              >
                Clear Filters
              </button>
              
              <div className="text-xs text-secondary-500 dark:text-secondary-400">
                {Object.values(filters).some(f => f !== 'all' && f !== false) && (
                  <span>Filters applied</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedSearch;