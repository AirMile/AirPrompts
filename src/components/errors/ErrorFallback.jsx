import React, { useState } from 'react';
import { AlertTriangle, RefreshCw, Home, ChevronDown, ChevronUp } from 'lucide-react';

/**
 * Default error fallback component with:
 * - User-friendly error message
 * - Retry functionality
 * - Development mode error details
 * - Navigation options
 */
const ErrorFallback = ({ error, resetError, errorInfo }) => {
  const [showDetails, setShowDetails] = useState(false);
  const isDevelopment = import.meta.env.DEV;

  const handleGoHome = () => {
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary-50 dark:bg-secondary-900">
      <div className="max-w-md w-full bg-white dark:bg-secondary-800 rounded-lg shadow-lg p-6">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-10 h-10 text-red-500" />
            </div>
          </div>
          
          <h1 className="text-2xl font-bold text-secondary-900 dark:text-secondary-100 mb-2">
            Oops! Something went wrong
          </h1>
          
          <p className="text-secondary-600 dark:text-secondary-400 mb-6">
            {error?.message || 'An unexpected error occurred while rendering this component.'}
          </p>
          
          <div className="flex gap-3 justify-center mb-4">
            <button
              onClick={resetError}
              className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
            
            <button
              onClick={handleGoHome}
              className="flex items-center gap-2 px-4 py-2 bg-secondary-200 dark:bg-secondary-700 text-secondary-700 dark:text-secondary-200 rounded-lg hover:bg-secondary-300 dark:hover:bg-secondary-600 transition-colors focus:outline-none focus:ring-2 focus:ring-secondary-500"
            >
              <Home className="w-4 h-4" />
              Go Home
            </button>
          </div>
          
          {isDevelopment && error && (
            <>
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="inline-flex items-center gap-1 text-sm text-primary-500 hover:text-primary-600 transition-colors"
              >
                {showDetails ? (
                  <>
                    <ChevronUp className="w-4 h-4" />
                    Hide Details
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4" />
                    Show Details
                  </>
                )}
              </button>
              
              {showDetails && (
                <div className="mt-4 text-left">
                  <div className="p-4 bg-secondary-100 dark:bg-secondary-900 rounded-lg border border-secondary-200 dark:border-secondary-700">
                    <div className="mb-3">
                      <h3 className="text-sm font-semibold text-secondary-700 dark:text-secondary-300 mb-1">
                        Error Message:
                      </h3>
                      <p className="text-sm text-red-600 dark:text-red-400 font-mono">
                        {error.toString()}
                      </p>
                    </div>
                    
                    {error.stack && (
                      <div className="mb-3">
                        <h3 className="text-sm font-semibold text-secondary-700 dark:text-secondary-300 mb-1">
                          Stack Trace:
                        </h3>
                        <pre className="text-xs text-secondary-600 dark:text-secondary-400 font-mono overflow-x-auto">
                          {error.stack}
                        </pre>
                      </div>
                    )}
                    
                    {errorInfo?.componentStack && (
                      <div>
                        <h3 className="text-sm font-semibold text-secondary-700 dark:text-secondary-300 mb-1">
                          Component Stack:
                        </h3>
                        <pre className="text-xs text-secondary-600 dark:text-secondary-400 font-mono overflow-x-auto">
                          {errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ErrorFallback;