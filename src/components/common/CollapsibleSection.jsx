import React from 'react';
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import useSectionVisibility from '../../hooks/ui/useSectionVisibility';
import { useItemColors } from '../../hooks/useItemColors.js';

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
  const { getColorClasses } = useItemColors();
  
  // Use external visibility if provided, otherwise use internal state
  const isVisible = externalVisible !== null ? externalVisible : internalVisible;
  

  // Use subtle neutral colors for count badges
  const getCountBadgeColor = () => {
    return 'bg-secondary-100 dark:bg-secondary-800 text-secondary-600 dark:text-secondary-400 border border-secondary-200 dark:border-secondary-700';
  };

  const handleToggle = () => {
    // Only allow toggle if there are items
    const totalCount = count || itemCount || 0;
    if (totalCount === 0) return;
    
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
      <div className={`w-full flex items-center justify-between rounded-lg overflow-hidden transition-colors duration-200 group border ${
        (count || itemCount || 0) > 0 
          ? 'bg-primary-50 dark:bg-primary-900/10 hover:bg-primary-100 dark:hover:bg-primary-900/20 has-[.action-button:hover]:bg-primary-50 dark:has-[.action-button:hover]:bg-primary-900/10 border-primary-200 dark:border-primary-800/50' 
          : 'bg-secondary-50 dark:bg-secondary-900/10 border-secondary-200 dark:border-secondary-800/50'
      }`}>
        <button
          type="button"
          onClick={handleToggle}
          onKeyDown={handleKeyDown}
          className={`flex-1 flex items-center justify-between p-3 focus:outline-none ${
            (count || itemCount || 0) === 0 ? 'cursor-default' : ''
          }`}
          aria-expanded={isVisible}
          aria-controls={`section-content-${sectionId}`}
          disabled={(count || itemCount || 0) === 0}
          {...headerProps}
        >
          <div className="flex items-center space-x-2">
            {/* Collapse/Expand Icon - only show if there are items */}
            {(count > 0 || itemCount > 0) ? (
              isVisible ? (
                <ChevronDownIcon className="w-5 h-5 text-secondary-600 dark:text-secondary-400" />
              ) : (
                <ChevronRightIcon className="w-5 h-5 text-secondary-600 dark:text-secondary-400" />
              )
            ) : (
              <div className="w-5 h-5" /> // Empty space to maintain alignment
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
          </div>
          
          {/* Item Count Badge */}
          {(count > 0 || itemCount > 0) && (
            <span className={`inline-flex items-center justify-center min-w-[1.5rem] h-6 px-2 rounded-full text-xs font-medium tabular-nums ${getCountBadgeColor()}`}>
              {count || itemCount}
            </span>
          )}
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