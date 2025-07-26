import React from 'react';
import ErrorBoundary from './ErrorBoundary';
import { AlertTriangle, RefreshCw, Save, Home } from 'lucide-react';

/**
 * Custom error fallback for editor components
 */
const EditorErrorFallback = ({ error, resetError }) => {
  const handleSaveDraft = () => {
    // Try to save any form data to localStorage
    try {
      const formData = document.querySelector('form')?.elements;
      if (formData) {
        const draft = {};
        for (let element of formData) {
          if (element.name && element.value) {
            draft[element.name] = element.value;
          }
        }
        localStorage.setItem('airprompts_editor_draft', JSON.stringify({
          data: draft,
          savedAt: new Date().toISOString(),
          error: error.toString()
        }));
        alert('Draft saved to browser storage');
      }
    } catch (e) {
      console.error('Failed to save draft:', e);
    }
  };

  const handleGoHome = () => {
    window.location.href = '/';
  };

  return (
    <div className="min-h-64 flex items-center justify-center p-8">
      <div className="text-center max-w-md">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-10 h-10 text-yellow-500" />
          </div>
        </div>
        
        <h2 className="text-xl font-semibold text-secondary-900 dark:text-secondary-100 mb-2">
          Editor Error
        </h2>
        
        <p className="text-secondary-600 dark:text-secondary-400 mb-6">
          The editor encountered an error. Your work might not be saved.
        </p>
        
        <div className="space-y-3">
          <button
            onClick={handleSaveDraft}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
          >
            <Save className="w-4 h-4" />
            Save Draft
          </button>
          
          <button
            onClick={resetError}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
          
          <button
            onClick={handleGoHome}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-secondary-200 dark:bg-secondary-700 text-secondary-700 dark:text-secondary-200 rounded-lg hover:bg-secondary-300 dark:hover:bg-secondary-600 transition-colors"
          >
            <Home className="w-4 h-4" />
            Go Home
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
 * Error boundary specifically for editor components
 */
const EditorErrorBoundary = ({ children }) => (
  <ErrorBoundary
    fallback={EditorErrorFallback}
    onError={(error) => console.error('Editor error:', error)}
  >
    {children}
  </ErrorBoundary>
);

export default EditorErrorBoundary;