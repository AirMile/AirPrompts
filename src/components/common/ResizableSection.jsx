import React, { useRef, useEffect, useState, useCallback } from 'react';
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import useSectionVisibility from '../../hooks/ui/useSectionVisibility';
import { useItemColors } from '../../hooks/useItemColors.js';

/**
 * ResizableSection component with height adjustment functionality
 * Extends CollapsibleSection with vertical resize capability
 */
const ResizableSection = ({
  sectionId,
  title,
  itemCount = 0,
  count = 0,
  icon = null,
  children,
  defaultVisible = true,
  className = '',
  headerProps = {},
  actionButton = null,
  onVisibilityChange = null,
  externalVisible = null,
  isInitialLoad = false,
  onCreateNew = null,
  minHeight = 100,
  maxHeight = 500,
  defaultHeight = 250,
  isResizable = true,
  isEditMode = false,
  alwaysCollapsible = false,
  hideChevronWhenEmpty = false,
  hasContent = null,
  hideCount = false,
  ...restProps
}) => {
  const { isVisible: internalVisible, toggle } = useSectionVisibility(sectionId, defaultVisible);
  const { getColorClasses } = useItemColors();
  const isFirstRender = useRef(true);
  const sectionRef = useRef(null);
  const contentRef = useRef(null);
  const resizeHandleRef = useRef(null);
  const isDragging = useRef(false);
  const startY = useRef(0);
  const startHeight = useRef(0);
  
  // Use external visibility if provided, otherwise use internal state
  const isVisible = externalVisible !== null ? externalVisible : internalVisible;
  
  // Height state with localStorage persistence
  // Only use resizable functionality if not in edit mode
  const shouldBeResizable = isResizable && !isEditMode;
  
  const [contentHeight, setContentHeight] = useState(() => {
    if (!shouldBeResizable) return 'auto';
    const stored = localStorage.getItem(`section-height-${sectionId}`);
    return stored ? parseInt(stored, 10) : defaultHeight;
  });

  // Save height to localStorage when it changes
  useEffect(() => {
    if (shouldBeResizable && typeof contentHeight === 'number') {
      localStorage.setItem(`section-height-${sectionId}`, contentHeight.toString());
    }
  }, [contentHeight, sectionId, shouldBeResizable]);

  // Mouse down handler for resize
  const handleMouseDown = useCallback((e) => {
    if (!shouldBeResizable) return;
    
    e.preventDefault();
    isDragging.current = true;
    startY.current = e.clientY;
    startHeight.current = typeof contentHeight === 'number' ? contentHeight : defaultHeight;
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'ns-resize';
    document.body.style.userSelect = 'none';
  }, [contentHeight, defaultHeight, shouldBeResizable]);

  // Mouse move handler for resize
  const handleMouseMove = useCallback((e) => {
    if (!isDragging.current || !shouldBeResizable) return;
    
    const deltaY = e.clientY - startY.current;
    const newHeight = Math.max(
      minHeight,
      Math.min(maxHeight, startHeight.current + deltaY)
    );
    
    setContentHeight(newHeight);
  }, [minHeight, maxHeight, shouldBeResizable]);

  // Mouse up handler for resize
  const handleMouseUp = useCallback(() => {
    if (!shouldBeResizable) return;
    
    isDragging.current = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, [handleMouseMove, shouldBeResizable]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [handleMouseMove, handleMouseUp]);

  // Disable animations on first render or during initial load
  useEffect(() => {
    if ((isFirstRender.current || isInitialLoad) && sectionRef.current) {
      sectionRef.current.classList.add('no-transition');
      
      const timer = setTimeout(() => {
        if (sectionRef.current && !isInitialLoad) {
          sectionRef.current.classList.remove('no-transition');
        }
      }, 100);
      
      isFirstRender.current = false;
      
      return () => clearTimeout(timer);
    }
  }, [isInitialLoad]);

  const getCountBadgeColor = () => {
    return 'bg-secondary-100 dark:bg-secondary-800 text-secondary-600 dark:text-secondary-400 border border-secondary-200 dark:border-secondary-700';
  };

  const handleToggle = () => {
    const totalCount = count || itemCount || 0;
    
    // If alwaysCollapsible is true, always allow toggle regardless of content
    if (alwaysCollapsible) {
      if (externalVisible !== null && onVisibilityChange) {
        const newState = !externalVisible;
        onVisibilityChange(newState);
      } else {
        toggle();
      }
      return;
    }
    
    // Original logic for non-alwaysCollapsible sections
    if (totalCount === 0 && onCreateNew) {
      onCreateNew();
      return;
    }
    
    if (totalCount === 0) return;
    
    if (externalVisible !== null && onVisibilityChange) {
      const newState = !externalVisible;
      onVisibilityChange(newState);
    } else {
      toggle();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleToggle();
    }
  };

  const totalCount = count || itemCount || 0;
  const hasContentLocal = totalCount > 0;
  const spacingClass = 'mb-4';
  const cleanClassName = className.replace(/mb-\d+/g, '').trim();
  const dynamicClassName = cleanClassName ? `${cleanClassName} ${spacingClass}` : spacingClass;

  return (
    <div className={`resizable-section section-boundary-restricted ${dynamicClassName}`} {...restProps}>
      {/* Section Header */}
      <div className={`w-full flex items-center justify-between overflow-hidden transition-colors duration-200 group border ${
        (count || itemCount || 0) > 0 
          ? 'bg-primary-50 dark:bg-primary-900/10 hover:bg-primary-100 dark:hover:bg-primary-900/20 has-[.action-button:hover]:bg-primary-50 dark:has-[.action-button:hover]:bg-primary-900/10 border-primary-200 dark:border-primary-800/50' 
          : 'bg-secondary-50 dark:bg-secondary-900/10 border-secondary-200 dark:border-secondary-800/50'
      } ${
        isVisible ? 'rounded-t-lg border-b-0' : 'rounded-lg'
      } transition-[border-radius] duration-200 ease-out`}>
        <button
          type="button"
          onClick={handleToggle}
          onKeyDown={handleKeyDown}
          className={`flex-1 flex items-center justify-between p-3 focus:outline-none ${
            (count || itemCount || 0) === 0 && !onCreateNew && !alwaysCollapsible ? 'cursor-default' : 'cursor-pointer'
          }`}
          aria-expanded={isVisible}
          aria-controls={`section-content-${sectionId}`}
          disabled={(count || itemCount || 0) === 0 && !onCreateNew && !alwaysCollapsible}
          {...headerProps}
        >
          <div className="flex items-center space-x-2">
            {(hideChevronWhenEmpty && (hasContent !== null ? !hasContent : totalCount === 0) && !isVisible) ? (
              <div className="w-5 h-5" />
            ) : isVisible ? (
              <ChevronDownIcon className="w-5 h-5 text-secondary-600 dark:text-secondary-400" />
            ) : (
              <ChevronRightIcon className="w-5 h-5 text-secondary-600 dark:text-secondary-400" />
            )}
            
            {icon && (
              <div className="flex items-center">
                {icon}
              </div>
            )}
            
            <h3 className="text-lg font-medium text-secondary-900 dark:text-secondary-100">
              {title}
            </h3>
          </div>
          
          {(count > 0 || itemCount > 0) && !hideCount && (
            <span className={`inline-flex items-center justify-center min-w-[1.5rem] h-6 px-2 rounded-full text-xs font-medium tabular-nums ${getCountBadgeColor()}`}>
              {count || itemCount}
            </span>
          )}
        </button>
        
        {actionButton && (
          <div className="flex-shrink-0 p-3 action-button">
            {actionButton}
          </div>
        )}
      </div>

      {/* Section Content - Resizable */}
      <div
        ref={sectionRef}
        id={`section-content-${sectionId}`}
        className="grid transition-[grid-template-rows] duration-300 ease-in-out"
        style={{
          gridTemplateRows: isVisible ? '1fr' : '0fr'
        }}
        aria-hidden={!isVisible}
      >
        <div className="overflow-hidden">
          <div 
            ref={contentRef}
            className={`transition-all duration-300 ease-in-out ${
              (hasContent !== null ? hasContent : hasContentLocal) && !className.includes('no-content-padding') ? 'pt-4' : ''
            } relative`}
            style={{
              opacity: isVisible ? 1 : 0,
              height: isVisible && shouldBeResizable ? `${contentHeight}px` : 'auto',
              overflowY: isVisible && shouldBeResizable ? 'auto' : 'visible'
            }}
          >
            <div className={shouldBeResizable ? 'pr-2' : ''}>
              {children}
            </div>
            
            {/* Resize Handle - positioned within the content container */}
            {isVisible && shouldBeResizable && (
              <div
                ref={resizeHandleRef}
                className="absolute -bottom-0 left-0 right-0 h-2 cursor-ns-resize transition-colors duration-200 group"
                onMouseDown={handleMouseDown}
                title="Drag to resize"
                style={{ marginLeft: '1px', marginRight: '1px' }} // Account for border width
              >
                {/* Visual indicator */}
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-secondary-300 dark:bg-secondary-600 rounded-full group-hover:bg-primary-400 dark:group-hover:bg-primary-500 transition-colors duration-200"></div>
                {/* Invisible hover area for better UX */}
                <div className="absolute inset-0 hover:bg-primary-200/20 dark:hover:bg-primary-800/20 transition-colors duration-200"></div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResizableSection;