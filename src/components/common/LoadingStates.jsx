import React from 'react';

/**
 * Skeleton loader for cards in grid view
 */
export const CardSkeleton = ({ count = 6 }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="bg-white dark:bg-secondary-800 rounded-lg p-4 shadow-sm"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <div className="skeleton skeleton-title"></div>
              <div className="skeleton skeleton-text w-3/4"></div>
            </div>
            <div className="skeleton skeleton-avatar w-8 h-8 rounded-md"></div>
          </div>
          <div className="space-y-2">
            <div className="skeleton skeleton-text"></div>
            <div className="skeleton skeleton-text"></div>
            <div className="skeleton skeleton-text w-2/3"></div>
          </div>
          <div className="flex items-center justify-between mt-4">
            <div className="skeleton skeleton-text w-20 h-6"></div>
            <div className="flex gap-2">
              <div className="skeleton w-8 h-8 rounded-md"></div>
              <div className="skeleton w-8 h-8 rounded-md"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * Skeleton loader for list items
 */
export const ListSkeleton = ({ count = 5 }) => {
  return (
    <div className="space-y-2 p-4">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="bg-white dark:bg-secondary-800 rounded-lg p-4 shadow-sm flex items-center gap-4"
        >
          <div className="skeleton w-10 h-10 rounded-md"></div>
          <div className="flex-1">
            <div className="skeleton skeleton-title mb-2"></div>
            <div className="skeleton skeleton-text w-2/3"></div>
          </div>
          <div className="flex gap-2">
            <div className="skeleton w-8 h-8 rounded-md"></div>
            <div className="skeleton w-8 h-8 rounded-md"></div>
            <div className="skeleton w-8 h-8 rounded-md"></div>
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * Skeleton loader for editor forms
 */
export const EditorSkeleton = () => {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-sm p-6">
        <div className="skeleton skeleton-title w-1/3 mb-6"></div>
        
        <div className="space-y-6">
          {/* Name field */}
          <div>
            <div className="skeleton skeleton-text w-20 mb-2"></div>
            <div className="skeleton h-10 rounded-md"></div>
          </div>
          
          {/* Description field */}
          <div>
            <div className="skeleton skeleton-text w-24 mb-2"></div>
            <div className="skeleton h-20 rounded-md"></div>
          </div>
          
          {/* Category field */}
          <div>
            <div className="skeleton skeleton-text w-20 mb-2"></div>
            <div className="skeleton h-10 rounded-md"></div>
          </div>
          
          {/* Content field */}
          <div>
            <div className="skeleton skeleton-text w-20 mb-2"></div>
            <div className="skeleton h-40 rounded-md"></div>
          </div>
          
          {/* Action buttons */}
          <div className="flex gap-4 pt-4">
            <div className="skeleton w-24 h-10 rounded-md"></div>
            <div className="skeleton w-24 h-10 rounded-md"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Loading spinner component
 */
export const LoadingSpinner = ({ size = 'md', color = 'primary' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };
  
  const colorClasses = {
    primary: 'text-primary-600',
    secondary: 'text-secondary-600',
    white: 'text-white'
  };
  
  return (
    <div className="flex items-center justify-center">
      <svg
        className={`animate-spin ${sizeClasses[size]} ${colorClasses[color]}`}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        ></circle>
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        ></path>
      </svg>
    </div>
  );
};

/**
 * Loading overlay for async operations
 */
export const LoadingOverlay = ({ isLoading, message = 'Loading...' }) => {
  if (!isLoading) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-secondary-800 rounded-lg p-6 flex flex-col items-center space-y-4">
        <LoadingSpinner size="lg" />
        <p className="text-secondary-700 dark:text-secondary-300">{message}</p>
      </div>
    </div>
  );
};

/**
 * Inline loading state for buttons
 */
export const ButtonLoading = ({ children, isLoading, ...props }) => {
  return (
    <button {...props} disabled={isLoading || props.disabled}>
      {isLoading ? (
        <span className="flex items-center gap-2">
          <LoadingSpinner size="sm" color="white" />
          <span>{children}</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
};

/**
 * Empty state component
 */
export const EmptyState = ({ 
  icon: Icon, 
  title, 
  description, 
  action,
  className = ''
}) => {
  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 ${className}`}>
      {Icon && (
        <div className="w-16 h-16 bg-secondary-100 dark:bg-secondary-800 rounded-full flex items-center justify-center mb-4">
          <Icon className="w-8 h-8 text-secondary-400" />
        </div>
      )}
      <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100 mb-2">
        {title}
      </h3>
      {description && (
        <p className="text-secondary-600 dark:text-secondary-400 text-center max-w-sm mb-6">
          {description}
        </p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
};

export default {
  CardSkeleton,
  ListSkeleton,
  EditorSkeleton,
  LoadingSpinner,
  LoadingOverlay,
  ButtonLoading,
  EmptyState
};