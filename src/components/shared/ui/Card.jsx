import React, { forwardRef } from 'react';

export const Card = forwardRef(function Card({ 
  className = '', 
  children, 
  variant = 'default', // default, template, workflow, snippet
  ...props 
}, ref) {
  // Get border color based on variant
  const getBorderColor = () => {
    switch(variant) {
      case 'template':
        return 'border-primary-500 dark:border-primary-400';
      case 'workflow':
        return 'border-success-500 dark:border-success-400';
      case 'snippet':
        return 'border-purple-500 dark:border-purple-400';
      default:
        return 'border-secondary-300 dark:border-secondary-600';
    }
  };

  return (
    <div 
      ref={ref}
      className={`bg-secondary-50 dark:bg-secondary-900 rounded-lg shadow-sm border-2 ${getBorderColor()} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
});

export const CardHeader = ({ className = '', children, ...props }) => (
  <div className={`px-6 py-4 border-b border-secondary-200 dark:border-secondary-700 ${className}`} {...props}>
    {children}
  </div>
);

export const CardBody = ({ className = '', children, ...props }) => (
  <div className={`px-6 py-4 ${className}`} {...props}>
    {children}
  </div>
);

export const CardFooter = ({ className = '', children, ...props }) => (
  <div className={`px-6 py-4 border-t border-secondary-200 dark:border-secondary-700 ${className}`} {...props}>
    {children}
  </div>
);

// Export as default for convenience
export default Card;