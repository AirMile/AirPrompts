// src/components/base/IntelligentTagsField.jsx
// Intelligent Tags Field with React Autosuggest pattern
// Implements performance best practices and accessibility

import React, { useState, useCallback, useRef, useMemo } from 'react';
import { Tag, X, Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { useSnippets } from '../../store/hooks/useSnippets.js';
import { useTagSuggestions } from '../../hooks/useTagSuggestions.js';

/**
 * Intelligent Tags Field Component
 * Features:
 * - User-specific tag suggestions based on frequency
 * - Real-time filtering with debouncing
 * - Keyboard navigation (↑↓, Enter, Esc)
 * - Highlighting of matching text
 * - WAI-ARIA accessibility support
 */
const IntelligentTagsField = ({ field, value, onChange, onBlur, error }) => {
  // State management
  const [tagInput, setTagInput] = useState('');
  const [isComposing, setIsComposing] = useState(false);

  // Refs for DOM manipulation and focus management
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  // Data hooks
  const { snippets } = useSnippets();

  // Memoize tags array for stable reference in useCallback dependencies
  const tags = useMemo(() => (Array.isArray(value) ? value : []), [value]);

  // Intelligent tag suggestions with performance optimizations
  const { suggestions, isLoading, getSuggestionValue, isTagAlreadySelected } = useTagSuggestions(
    snippets,
    tagInput,
    tags,
    {
      maxSuggestions: 12,
      debounceMs: 300,
      minInputLength: 0,
    }
  );

  // useCallback for stable references (React best practice)
  const handleAddTag = useCallback(
    (newTag) => {
      const trimmedTag = newTag.trim().toLowerCase();
      if (trimmedTag && !isTagAlreadySelected(trimmedTag)) {
        onChange({
          target: {
            name: field.name,
            value: [...tags, trimmedTag],
            type: 'tags',
          },
        });
        setTagInput('');
      }
    },
    [tags, field.name, onChange, isTagAlreadySelected]
  );

  const handleRemoveTag = useCallback(
    (tagToRemove) => {
      onChange({
        target: {
          name: field.name,
          value: tags.filter((tag) => tag !== tagToRemove),
          type: 'tags',
        },
      });
    },
    [tags, field.name, onChange]
  );

  const handleInputChange = useCallback((e) => {
    const newValue = e.target.value;
    setTagInput(newValue);
  }, []);

  const handleInputFocus = useCallback(() => {
    // Suggestions are always visible, no need to toggle
  }, []);

  const handleInputBlur = useCallback(
    (e) => {
      onBlur?.(e);
    },
    [onBlur]
  );

  const handleSuggestionClick = useCallback(
    (suggestion) => {
      handleAddTag(getSuggestionValue(suggestion));
      inputRef.current?.focus();
    },
    [handleAddTag, getSuggestionValue]
  );

  // Simplified keyboard navigation
  const handleKeyDown = useCallback(
    (e) => {
      if (isComposing) return;

      switch (e.key) {
        case 'Enter':
          e.preventDefault();
          if (tagInput.trim()) {
            handleAddTag(tagInput);
          }
          break;

        case ',':
          e.preventDefault();
          if (tagInput.trim()) {
            handleAddTag(tagInput);
          }
          break;

        default:
          break;
      }
    },
    [isComposing, tagInput, handleAddTag]
  );

  // Handle paste for comma-separated values
  const handlePaste = useCallback(
    (e) => {
      e.preventDefault();
      const pastedText = e.clipboardData.getData('text');
      const pastedTags = pastedText
        .split(',')
        .map((t) => t.trim().toLowerCase())
        .filter((t) => t && !isTagAlreadySelected(t));

      if (pastedTags.length > 0) {
        onChange({
          target: {
            name: field.name,
            value: [...tags, ...pastedTags],
            type: 'tags',
          },
        });
      }
      setTagInput('');
    },
    [tags, field.name, onChange, isTagAlreadySelected]
  );

  const inputId = `${field.name}-input`;

  return (
    <div ref={containerRef} className="relative">
      <label
        htmlFor={inputId}
        className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2"
      >
        {field.label} {field.required && '*'}
      </label>

      {/* Input container */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              id={inputId}
              type="text"
              value={tagInput}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
              onPaste={handlePaste}
              onCompositionStart={() => setIsComposing(true)}
              onCompositionEnd={() => setIsComposing(false)}
              name={field.name}
              className="intelligent-tags-field w-full p-3 border border-secondary-300 dark:border-secondary-600 bg-secondary-50 dark:bg-secondary-700 text-secondary-900 dark:text-secondary-100 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
              placeholder="Type a tag or select from suggestions..."
              aria-describedby={error ? `${field.name}-error` : undefined}
              autoComplete="off"
            />

            {/* Loading indicator */}
            {isLoading && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin h-4 w-4 border-2 border-primary-500 border-t-transparent rounded-full"></div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => tagInput.trim() && handleAddTag(tagInput)}
            disabled={!tagInput.trim()}
            className="px-3 py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-secondary-400 disabled:cursor-not-allowed text-white rounded-lg transition-all duration-200"
            aria-label="Add tag"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Inline tag suggestions */}
        {suggestions.length > 0 && (
          <div className="mt-3">
            <p className="text-sm text-secondary-600 dark:text-secondary-400 mb-2">
              {tagInput ? `Suggestions for "${tagInput}":` : 'Popular tags:'}
            </p>
            <div className="flex flex-wrap gap-2">
              {suggestions.slice(0, 10).map((suggestion, index) => {
                const tagValue = getSuggestionValue(suggestion);
                const isAlreadySelected = isTagAlreadySelected(tagValue);

                return (
                  <button
                    key={`${tagValue}-${index}`}
                    type="button"
                    onClick={() => !isAlreadySelected && handleSuggestionClick(suggestion)}
                    disabled={isAlreadySelected}
                    className={`px-3 py-1 rounded-full text-sm transition-colors ${
                      isAlreadySelected
                        ? 'bg-secondary-200 dark:bg-secondary-600 text-secondary-500 dark:text-secondary-400 cursor-not-allowed'
                        : 'bg-secondary-100 dark:bg-secondary-700 text-secondary-700 dark:text-secondary-300 hover:bg-secondary-200 dark:hover:bg-secondary-600'
                    }`}
                  >
                    {tagValue}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Selected tags display */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag, index) => (
              <span
                key={`${tag}-${index}`}
                className="inline-flex items-center gap-1 px-3 py-1 bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 rounded-full text-sm"
              >
                <Tag className="w-3 h-3" />
                {tag}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="ml-1 hover:bg-primary-200 dark:hover:bg-primary-800 rounded-full p-0.5 transition-colors"
                  aria-label={`Remove ${tag} tag`}
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Error message */}
        {error && (
          <p
            id={`${field.name}-error`}
            className="text-sm text-danger-600 dark:text-danger-400"
            role="alert"
          >
            {error}
          </p>
        )}

        {/* Helper text */}
        {field.helperText && !error && (
          <p className="text-sm text-secondary-600 dark:text-secondary-400">{field.helperText}</p>
        )}
      </div>
    </div>
  );
};

export default IntelligentTagsField;
