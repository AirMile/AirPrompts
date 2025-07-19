import React from 'react';
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import useSectionVisibility from '../../hooks/useSectionVisibility';

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
  actionButton = null
}) => {
  const { isVisible, toggle } = useSectionVisibility(sectionId, defaultVisible);

  // Get color based on section title/type
  const getCountBadgeColor = (title) => {
    const titleLower = title.toLowerCase();
    if (titleLower.includes('favorite')) {
      return 'bg-yellow-600 text-yellow-100';
    } else if (titleLower.includes('workflow')) {
      return 'bg-green-600 text-green-100';
    } else if (titleLower.includes('template')) {
      return 'bg-blue-600 text-blue-100';
    } else if (titleLower.includes('snippet')) {
      return 'bg-purple-600 text-purple-100';
    }
    return 'bg-blue-600 text-blue-100'; // default
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggle();
    }
  };

  return (
    <div className={`collapsible-section ${className}`}>
      {/* Section Header */}
      <div className="w-full flex items-center justify-between bg-gray-800 hover:bg-gray-700 rounded-lg overflow-hidden transition-colors duration-200 group has-[.action-button:hover]:bg-gray-800">
        <button
          type="button"
          onClick={toggle}
          onKeyDown={handleKeyDown}
          className="flex-1 flex items-center justify-start p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 ring-inset"
          aria-expanded={isVisible}
          aria-controls={`section-content-${sectionId}`}
          {...headerProps}
        >
          <div className="flex items-center space-x-2">
            {/* Collapse/Expand Icon */}
            {isVisible ? (
              <ChevronDownIcon className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronRightIcon className="w-5 h-5 text-gray-400" />
            )}
            
            {/* Section Icon */}
            {icon && (
              <div className="flex items-center">
                {icon}
              </div>
            )}
            
            {/* Section Title */}
            <h3 className="text-lg font-medium text-gray-100">
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