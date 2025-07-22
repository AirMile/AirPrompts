import React from 'react';
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import useSectionVisibility from '../../hooks/ui/useSectionVisibility';

/**
 * CollapsibleSection component for organizing content with expand/collapse functionality
 * @param {Object} props
 * @param {string} props.sectionId - Unique identifier for the section
 * @param {string} props.title - Section title
 * @param {number} props.itemCount - Number of items in the section
 * @param {React.ReactNode} props.children - Content to show when expanded
 * @param {boolean} props.defaultVisible - Default visibility state
 * @param {string} props.className - Additional CSS classes
 * @param {Object} props.headerProps - Additional props for the header button
 * @param {React.ReactNode} props.actionButton - Optional action button to display in header
 * @param {Function} props.onVisibilityChange - Callback when visibility changes
 * @param {boolean} props.externalVisible - External visibility state that overrides internal state
 */
const CollapsibleSection = ({
  sectionId,
  title,
  itemCount = 0,
  count = 0, // Support both itemCount and count for backward compatibility
  icon = null,
  children,
  defaultVisible = true,
  className = '',
  headerProps = {},
  actionButton = null,
  onVisibilityChange = null,
  externalVisible = null,
  ...restProps // Pass through any additional props
}) => {
  const { isVisible: internalVisible, toggle } = useSectionVisibility(sectionId, defaultVisible);
  
  // Use external visibility if provided, otherwise use internal state
  const isVisible = externalVisible !== null ? externalVisible : internalVisible;
  

  // Get color based on section title/type
  const getCountBadgeColor = (title) => {
    const titleLower = title.toLowerCase();
    if (titleLower.includes('favorite')) {
      return 'bg-yellow-600 dark:bg-yellow-500 text-yellow-100 dark:text-yellow-50';
    } else if (titleLower.includes('workflow')) {
      return 'bg-success-600 dark:bg-success-500 text-success-100 dark:text-success-50';
    } else if (titleLower.includes('template')) {
      return 'bg-primary-600 dark:bg-primary-500 text-primary-100 dark:text-primary-50';
    } else if (titleLower.includes('snippet')) {
      return 'bg-purple-600 dark:bg-purple-500 text-purple-100 dark:text-purple-50';
    }
    return 'bg-primary-600 dark:bg-primary-500 text-primary-100 dark:text-primary-50'; // default
  };

  const handleToggle = () => {
    if (externalVisible !== null && onVisibilityChange) {
      // When using external control, only call the callback
      const newState = !externalVisible;
      onVisibilityChange(newState);
    } else {
      // When using internal state, toggle normally
      toggle();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleToggle();
    }
  };

  return (
    <div className={`collapsible-section section-boundary-restricted ${className}`} {...restProps}>
      {/* Section Header */}
      <div className="w-full flex items-center justify-between bg-primary-50 dark:bg-primary-900/10 hover:bg-primary-100 dark:hover:bg-primary-900/20 rounded-lg overflow-hidden transition-colors duration-200 group has-[.action-button:hover]:bg-primary-50 dark:has-[.action-button:hover]:bg-primary-900/10">
        <button
          type="button"
          onClick={handleToggle}
          onKeyDown={handleKeyDown}
          className="flex-1 flex items-center justify-start p-3 focus:outline-none"
          aria-expanded={isVisible}
          aria-controls={`section-content-${sectionId}`}
          {...headerProps}
        >
          <div className="flex items-center space-x-2">
            {/* Collapse/Expand Icon */}
            {isVisible ? (
              <ChevronDownIcon className="w-5 h-5 text-secondary-600 dark:text-secondary-400" />
            ) : (
              <ChevronRightIcon className="w-5 h-5 text-secondary-600 dark:text-secondary-400" />
            )}
            
            {/* Section Icon */}
            {icon && (
              <div className="flex items-center">
                {icon}
              </div>
            )}
            
            {/* Section Title */}
            <h3 className="text-lg font-medium text-secondary-900 dark:text-secondary-100">
              {title}
            </h3>
            
            {/* Item Count Badge */}
            {(count > 0 || itemCount > 0) && (
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${getCountBadgeColor(title)}`}>
                {count || itemCount}
              </span>
            )}
          </div>
        </button>
        
        {/* Action Button */}
        {actionButton && (
          <div className="flex-shrink-0 p-3 action-button">
            {actionButton}
          </div>
        )}
      </div>

      {/* Section Content */}
      <div
        id={`section-content-${sectionId}`}
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isVisible ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'
        }`}
        aria-hidden={!isVisible}
      >
        <div className="pt-6">
          {children}
        </div>
      </div>
    </div>
  );
};

export default CollapsibleSection;