import React, { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

const Button = forwardRef(function Button({ 
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon: Icon,
  iconPosition = 'left',
  children,
  className = '',
  ...props
}, ref) {
  const baseClasses = 'inline-flex items-center justify-center transition-colors font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const variantClasses = {
    primary: 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500',
    secondary: 'bg-secondary-200 dark:bg-secondary-700 text-secondary-800 dark:text-secondary-100 hover:bg-secondary-300 dark:hover:bg-secondary-600 focus:ring-secondary-500',
    danger: 'bg-danger-600 text-white hover:bg-danger-700 focus:ring-danger-500',
    ghost: 'bg-transparent hover:bg-secondary-100 dark:hover:bg-secondary-800 focus:ring-secondary-500',
    success: 'bg-success-600 text-white hover:bg-success-700 focus:ring-success-500'
  };
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };
  
  const classes = `
    ${baseClasses}
    ${variantClasses[variant]}
    ${sizeClasses[size]}
    ${disabled || loading ? 'opacity-50 cursor-not-allowed' : ''}
    ${className}
  `.trim();
  
  const LoadingIcon = () => (
    <Loader2 className={`animate-spin ${children ? 'mr-2' : ''}`} size={16} />
  );
  
  return (
    <button
      ref={ref}
      className={classes}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <LoadingIcon />}
      {!loading && Icon && iconPosition === 'left' && <Icon className="mr-2" size={16} />}
      {children}
      {!loading && Icon && iconPosition === 'right' && <Icon className="ml-2" size={16} />}
    </button>
  );
});

export default Button;