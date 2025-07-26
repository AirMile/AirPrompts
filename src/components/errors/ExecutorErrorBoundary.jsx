import React from 'react';
import ErrorBoundary from './ErrorBoundary';
import { AlertTriangle, RefreshCw, ArrowLeft } from 'lucide-react';

/**
 * Custom error fallback for the ItemExecutor component
 */
const ExecutorErrorFallback = ({ error, resetError }) => {
  const handleGoBack = () => {
    window.history.back();
  };

  return (
    <div className="min-h-64 flex items-center justify-center p-8">
      <div className="text-center max-w-md">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-10 h-10 text-orange-500" />
          </div>
        </div>
        
        <h2 className="text-xl font-semibold text-secondary-900 dark:text-secondary-100 mb-2">
          Execution Error
        </h2>
        
        <p className="text-secondary-600 dark:text-secondary-400 mb-6">
          Failed to execute the template or workflow. This might be due to invalid variables or a system error.
        </p>
        
        <div className="space-y-3">
          <button
            onClick={resetError}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
          
          <button
            onClick={handleGoBack}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-secondary-200 dark:bg-secondary-700 text-secondary-700 dark:text-secondary-200 rounded-lg hover:bg-secondary-300 dark:hover:bg-secondary-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>
        </div>
        
        {import.meta.env.DEV && error && (
          <details className="mt-4 text-left">
            <summary className="cursor-pointer text-sm text-primary-500 hover:text-primary-600">
              Error Details
            </summary>
            <div className="mt-2 p-3 bg-secondary-100 dark:bg-secondary-900 rounded text-xs font-mono">
              {error.toString()}
            </div>
          </details>
        )}
      </div>
    </div>
  );
};

/**
 * Error boundary specifically for the ItemExecutor
 */
const ExecutorErrorBoundary = ({ children }) => (
  <ErrorBoundary
    fallback={ExecutorErrorFallback}
    onError={(error) => console.error('Executor error:', error)}
  >
    {children}
  </ErrorBoundary>
);

export default ExecutorErrorBoundary;