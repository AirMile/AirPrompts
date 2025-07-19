import React from 'react';
import { AlertTriangle, X, RefreshCw } from 'lucide-react';

const ErrorMessage = ({ 
  error, 
  onDismiss, 
  onRetry, 
  className = '',
  variant = 'default'
}) => {
  if (!error) return null;

  const variants = {
    default: 'bg-red-900/50 border-red-500 text-red-100',
    subtle: 'bg-gray-800 border-gray-600 text-gray-300',
    critical: 'bg-red-600 border-red-500 text-white'
  };

  return (
    <div className={`border rounded-lg p-4 ${variants[variant]} ${className}`}>
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
        
        <div className="flex-1">
          <div className="text-sm font-medium">
            {typeof error === 'string' ? error : error.message || 'An error occurred'}
          </div>
          
          {error.details && (
            <div className="mt-1 text-xs opacity-75">
              {error.details}
            </div>
          )}
        </div>
        
        <div className="flex gap-2">
          {onRetry && (
            <button
              onClick={onRetry}
              className="text-red-300 hover:text-red-100 transition-colors"
              title="Retry"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
          
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="text-red-300 hover:text-red-100 transition-colors"
              title="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ErrorMessage;