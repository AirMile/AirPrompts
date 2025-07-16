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
 */
const CollapsibleSection = ({
  sectionId,
  title,
  itemCount = 0,
  children,
  defaultVisible = true,
  className = '',
  headerProps = {}
}) => {
  const { isVisible, toggle } = useSectionVisibility(sectionId, defaultVisible);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggle();
    }
  };

  return (
    <div className={`collapsible-section ${className}`}>
      {/* Section Header */}
      <button
        type="button"
        onClick={toggle}
        onKeyDown={handleKeyDown}
        className="w-full flex items-center justify-between p-3 text-left bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
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
          
          {/* Section Title */}
          <h3 className="text-lg font-medium text-gray-100">
            {title}
          </h3>
          
          {/* Item Count Badge */}
          {itemCount > 0 && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-600 text-blue-100">
              {itemCount}
            </span>
          )}
        </div>
      </button>

      {/* Section Content */}
      <div
        id={`section-content-${sectionId}`}
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isVisible ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'
        }`}
        aria-hidden={!isVisible}
      >
        <div className="pt-4">
          {children}
        </div>
      </div>
    </div>
  );
};

export default CollapsibleSection;