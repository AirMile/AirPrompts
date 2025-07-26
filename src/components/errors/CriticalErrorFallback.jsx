import React from 'react';
import { AlertOctagon } from 'lucide-react';

/**
 * Minimal error fallback for critical errors
 * Used when error boundary encounters too many errors
 * Prevents error loops by showing minimal UI
 */
const CriticalErrorFallback = () => {
  const handleReload = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
      <div className="text-center max-w-sm p-8">
        <AlertOctagon className="w-16 h-16 text-red-500 mx-auto mb-4" />
        
        <h1 className="text-xl font-bold mb-2">
          Critical Error
        </h1>
        
        <p className="text-gray-400 mb-6">
          The application encountered multiple errors and cannot recover.
        </p>
        
        <button
          onClick={handleReload}
          className="px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
        >
          Reload Application
        </button>
        
        <p className="text-xs text-gray-500 mt-4">
          If this problem persists, please contact support.
        </p>
      </div>
    </div>
  );
};

export default CriticalErrorFallback;