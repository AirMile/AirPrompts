import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { X, Search, Filter, Check, ChevronDown, ChevronUp } from 'lucide-react';
import useKeyboardNavigation from '../../hooks/useKeyboardNavigation.js';

/**
 * TagFilter component for multi-tag filtering with AND/OR modes
 * @param {Object} props - Component props
 * @param {Array} props.availableTags - All available tags from items
 * @param {Array} props.selectedTags - Currently selected tags
 * @param {Function} props.onTagsChange - Callback for tag selection changes
 * @param {string} props.filterMode - 'AND' or 'OR' filtering mode
 * @param {Function} props.onFilterModeChange - Callback for filter mode changes
 * @param {string} props.className - Additional CSS classes
 * @param {boolean} props.showFilterCount - Whether to show filter count
 * @param {number} props.filterCount - Number of items after filtering
 * @param {boolean} props.isExpanded - Whether the filter panel is expanded
 * @param {Function} props.onToggleExpanded - Callback for expanding/collapsing
 */
const TagFilter = ({
  availableTags = [],
  selectedTags = [],
  onTagsChange,
  filterMode = 'OR',
  onFilterModeChange,
  className = '',
  showFilterCount = true,
  filterCount = 0,
  isExpanded = false,
  onToggleExpanded
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  // Filter available tags based on search query
  const filteredTags = useMemo(() => {
    if (!searchQuery.trim()) return availableTags;
    
    const query = searchQuery.toLowerCase();
    return availableTags.filter(tag => 
      tag.toLowerCase().includes(query)
    );
  }, [availableTags, searchQuery]);

  // Sort tags with selected ones first
  const sortedTags = useMemo(() => {
    return [...filteredTags].sort((a, b) => {
      const aSelected = selectedTags.includes(a);
      const bSelected = selectedTags.includes(b);
      
      if (aSelected && !bSelected) return -1;
      if (!aSelected && bSelected) return 1;
      return a.localeCompare(b);
    });
  }, [filteredTags, selectedTags]);

  // Set up keyboard navigation for tags
  const tagNavigation = useKeyboardNavigation(sortedTags, {
    layout: 'list',
    onExecute: (tag) => handleTagToggle(tag),
    onSelection: () => {}, // No special selection handling needed
    disabled: !isExpanded
  });

  // Handle tag selection
  const handleTagToggle = (tag) => {
    const newSelectedTags = selectedTags.includes(tag)
      ? selectedTags.filter(t => t !== tag)
      : [...selectedTags, tag];
    
    onTagsChange(newSelectedTags);
  };

  // Handle clear all tags
  const handleClearAll = useCallback(() => {
    onTagsChange([]);
  }, [onTagsChange]);

  // Handle filter mode toggle
  const handleFilterModeToggle = useCallback(() => {
    onFilterModeChange(filterMode === 'AND' ? 'OR' : 'AND');
  }, [filterMode, onFilterModeChange]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showDropdown && !event.target.closest('.tag-filter-dropdown')) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDropdown]);

  // Handle keyboard navigation for tag list
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Only handle keyboard navigation when tag list is expanded and focused
      if (isExpanded && e.target.closest('.tag-filter')) {
        // Don't interfere with input typing
        if (e.target.tagName === 'INPUT') return;
        
        // Handle special TagFilter shortcuts
        if (e.key === 'Escape') {
          e.preventDefault();
          onToggleExpanded();
          return;
        }
        
        if (e.key === 'Enter' && e.target.closest('.filter-mode-button')) {
          e.preventDefault();
          handleFilterModeToggle();
          return;
        }
        
        if (e.key === 'c' && e.ctrlKey) {
          e.preventDefault();
          handleClearAll();
          return;
        }
        
        // Let keyboard navigation handle arrow keys and item execution
        if (tagNavigation.handleKeyDown) {
          tagNavigation.handleKeyDown(e);
        }
      }
    };

    if (isExpanded) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isExpanded, tagNavigation, onToggleExpanded, handleFilterModeToggle, handleClearAll]);

  // Don't render if no tags available
  if (availableTags.length === 0) {
    return null;
  }

  return (
    <div className={`tag-filter ${className}`}>
      {/* Filter Header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-300">Filter by Tags</span>
          {isExpanded && (
            <span className="text-xs text-gray-500 ml-2">
              (Use ↑↓ to navigate, Enter to select, Esc to close)
            </span>
          )}
        </div>
        
        {/* Filter Count */}
        {showFilterCount && selectedTags.length > 0 && (
          <span className="text-xs text-gray-400 bg-gray-800 px-2 py-1 rounded-full">
            {filterCount} items
          </span>
        )}

        {/* Expand/Collapse Button */}
        <button
          onClick={onToggleExpanded}
          className="ml-auto p-1 text-gray-400 hover:text-gray-300 transition-colors"
          aria-label={isExpanded ? 'Collapse filters' : 'Expand filters'}
        >
          {isExpanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Expanded Filter Panel */}
      {isExpanded && (
        <div className="space-y-4">
          {/* Selected Tags Display */}
          {selectedTags.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-gray-400">Selected:</span>
              {selectedTags.map(tag => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-blue-600 text-white text-xs rounded-full"
                >
                  {tag}
                  <button
                    onClick={() => handleTagToggle(tag)}
                    className="hover:bg-blue-700 rounded-full p-0.5 transition-colors"
                    aria-label={`Remove ${tag} filter`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              <button
                onClick={handleClearAll}
                className="text-xs text-gray-400 hover:text-gray-300 underline"
              >
                Clear all
              </button>
            </div>
          )}

          {/* Filter Mode Toggle */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">Filter mode:</span>
            <button
              onClick={handleFilterModeToggle}
              className={`filter-mode-button px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                filterMode === 'AND' 
                  ? 'bg-orange-600 text-white hover:bg-orange-700' 
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
              title={filterMode === 'AND' ? 'Items must have ALL selected tags' : 'Items must have ANY selected tags'}
              aria-label={`Filter mode: ${filterMode === 'AND' ? 'AND - items must have all selected tags' : 'OR - items must have any selected tags'}. Press Enter to toggle.`}
            >
              {filterMode === 'AND' ? 'AND (All tags)' : 'OR (Any tag)'}
            </button>
          </div>

          {/* Tag Search */}
          <div className="relative">
            <div className="flex items-center gap-2 bg-gray-800 border border-gray-600 rounded-lg p-2">
              <Search className="w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent text-gray-100 text-sm outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-gray-400 hover:text-gray-300 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Tag List */}
          <div 
            className="max-h-48 overflow-y-auto space-y-1"
            {...(tagNavigation.getContainerProps ? tagNavigation.getContainerProps() : {})}
          >
            {sortedTags.length === 0 ? (
              <div className="text-sm text-gray-400 text-center py-4">
                {searchQuery ? 'No tags found' : 'No tags available'}
              </div>
            ) : (
              sortedTags.map((tag, index) => {
                const isSelected = selectedTags.includes(tag);
                const focusProps = tagNavigation.getFocusProps ? tagNavigation.getFocusProps(index) : {};
                const isKeyboardFocused = focusProps['data-keyboard-focused'];
                
                return (
                  <label
                    key={tag}
                    {...focusProps}
                    className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                      isSelected 
                        ? 'bg-blue-600/20 border border-blue-600/50' 
                        : 'bg-gray-800 hover:bg-gray-700 border border-gray-600'
                    } ${
                      isKeyboardFocused 
                        ? 'ring-2 ring-blue-400 ring-opacity-75' 
                        : ''
                    }`}
                    onClick={() => handleTagToggle(tag)}
                  >
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleTagToggle(tag)}
                        className="sr-only"
                        tabIndex={-1}
                      />
                      <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                        isSelected 
                          ? 'bg-blue-600 border-blue-600' 
                          : 'border-gray-400 hover:border-gray-300'
                      }`}>
                        {isSelected && (
                          <Check className="w-3 h-3 text-white" />
                        )}
                      </div>
                    </div>
                    <span className={`text-sm ${isSelected ? 'text-blue-300' : 'text-gray-300'}`}>
                      {tag}
                    </span>
                  </label>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Collapsed State Summary */}
      {!isExpanded && selectedTags.length > 0 && (
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <span className="text-blue-400 font-medium">{selectedTags.length} tags selected</span>
          <span className="text-gray-500">({filterMode})</span>
        </div>
      )}
    </div>
  );
};

export default TagFilter;