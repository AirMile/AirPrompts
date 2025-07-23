import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Clock, Sun, Moon } from 'lucide-react';
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
  const [suggestions, setSuggestions] = useState([]);
  const [searchHistoryList, setSearchHistoryList] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  
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
    
    // Apply search if callback provided
    if (onFilter) {
      onFilter({ searchTerm });
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
  
  
  // Clear search
  const clearSearch = () => {
    setSearchQuery('');
    setShowSuggestions(false);
    setSuggestions([]);
    setSelectedSuggestionIndex(-1);
    
    if (onFilter) {
      onFilter({ searchTerm: '' });
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
          className="w-full pl-10 pr-20 py-3 border border-secondary-300 dark:border-secondary-600 bg-white dark:bg-secondary-800 text-secondary-900 dark:text-secondary-100 rounded-lg focus:outline-none focus:border-primary-500 placeholder-secondary-400 dark:placeholder-secondary-500"
        />
        
        {/* Clear Button */}
        {searchQuery && (
          <button
            onClick={clearSearch}
            className="absolute right-12 top-1/2 transform -translate-y-1/2 text-secondary-400 hover:text-secondary-600 dark:hover:text-secondary-300"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        
        
        {/* Dark Mode Toggle */}
        <button
          onClick={toggleDarkMode}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-secondary-400 hover:text-secondary-600 dark:hover:text-secondary-300 p-1 rounded-lg"
          title={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
        >
          {isDarkMode ? (
            <Sun className="w-4 h-4" />
          ) : (
            <Moon className="w-4 h-4" />
          )}
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
      
    </div>
  );
};

export default AdvancedSearch;