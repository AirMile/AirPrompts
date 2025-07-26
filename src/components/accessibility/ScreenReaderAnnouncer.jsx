import React, { useState, useEffect } from 'react';

/**
 * Screen reader announcer for accessibility
 * Provides live region announcements for dynamic content changes
 */
export const ScreenReaderAnnouncer = () => {
  const [announcement, setAnnouncement] = useState('');
  const [politeAnnouncement, setPoliteAnnouncement] = useState('');

  useEffect(() => {
    // Listen for custom events to announce messages
    const handleAnnounce = (event) => {
      const { message, priority = 'polite' } = event.detail;
      
      if (priority === 'assertive') {
        setAnnouncement(message);
        // Clear after announcement
        setTimeout(() => setAnnouncement(''), 100);
      } else {
        setPoliteAnnouncement(message);
        setTimeout(() => setPoliteAnnouncement(''), 100);
      }
    };

    window.addEventListener('announce', handleAnnounce);
    return () => window.removeEventListener('announce', handleAnnounce);
  }, []);

  return (
    <>
      {/* Assertive announcements for urgent messages */}
      <div
        role="status"
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
      >
        {announcement}
      </div>
      
      {/* Polite announcements for general updates */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {politeAnnouncement}
      </div>
    </>
  );
};

/**
 * Utility function to announce messages to screen readers
 */
export const announce = (message, priority = 'polite') => {
  window.dispatchEvent(
    new CustomEvent('announce', {
      detail: { message, priority }
    })
  );
};

/**
 * Skip to main content link for keyboard navigation
 */
export const SkipToContent = ({ targetId = 'main-content' }) => {
  return (
    <a
      href={`#${targetId}`}
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 
                 bg-primary-600 text-white px-4 py-2 rounded-md focus:outline-none 
                 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
    >
      Skip to main content
    </a>
  );
};

/**
 * Visually hidden component for screen reader only content
 */
export const VisuallyHidden = ({ children, as: Component = 'span' }) => {
  return <Component className="sr-only">{children}</Component>;
};

/**
 * Focus trap component for modals and dialogs
 */
export const FocusTrap = ({ children, isActive = true }) => {
  const containerRef = React.useRef(null);
  
  useEffect(() => {
    if (!isActive) return;
    
    const container = containerRef.current;
    if (!container) return;
    
    // Get all focusable elements
    const focusableElements = container.querySelectorAll(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    
    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];
    
    // Focus first element
    firstFocusable?.focus();
    
    const handleTabKey = (e) => {
      if (e.key !== 'Tab') return;
      
      if (e.shiftKey) {
        if (document.activeElement === firstFocusable) {
          e.preventDefault();
          lastFocusable?.focus();
        }
      } else {
        if (document.activeElement === lastFocusable) {
          e.preventDefault();
          firstFocusable?.focus();
        }
      }
    };
    
    container.addEventListener('keydown', handleTabKey);
    return () => container.removeEventListener('keydown', handleTabKey);
  }, [isActive]);
  
  return <div ref={containerRef}>{children}</div>;
};

/**
 * Loading indicator with proper ARIA attributes
 */
export const AccessibleLoadingIndicator = ({ label = 'Loading' }) => {
  return (
    <div role="status" aria-label={label}>
      <span className="sr-only">{label}</span>
      <div className="animate-spin h-5 w-5 border-2 border-primary-600 border-t-transparent rounded-full" />
    </div>
  );
};

/**
 * Progress indicator with ARIA attributes
 */
export const AccessibleProgress = ({ value, max = 100, label }) => {
  const percentage = Math.round((value / max) * 100);
  
  return (
    <div
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-label={label}
      className="relative w-full h-2 bg-secondary-200 dark:bg-secondary-700 rounded-full overflow-hidden"
    >
      <div
        className="absolute inset-y-0 left-0 bg-primary-600 transition-all duration-300"
        style={{ width: `${percentage}%` }}
      />
      <span className="sr-only">{percentage}% complete</span>
    </div>
  );
};

/**
 * Accessible tooltip component
 */
export const AccessibleTooltip = ({ content, children }) => {
  const [isVisible, setIsVisible] = useState(false);
  const tooltipId = React.useId();
  
  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onFocus={() => setIsVisible(true)}
        onBlur={() => setIsVisible(false)}
        aria-describedby={isVisible ? tooltipId : undefined}
      >
        {children}
      </div>
      
      {isVisible && (
        <div
          id={tooltipId}
          role="tooltip"
          className="absolute z-10 px-2 py-1 text-sm text-white bg-gray-900 rounded-md 
                     -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap"
        >
          {content}
          <div className="absolute w-0 h-0 border-4 border-transparent border-t-gray-900 
                          top-full left-1/2 -translate-x-1/2" />
        </div>
      )}
    </div>
  );
};

export default {
  ScreenReaderAnnouncer,
  announce,
  SkipToContent,
  VisuallyHidden,
  FocusTrap,
  AccessibleLoadingIndicator,
  AccessibleProgress,
  AccessibleTooltip
};