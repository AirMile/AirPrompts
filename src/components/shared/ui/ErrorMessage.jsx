import React from 'react';
import { AlertCircle, RefreshCw, WifiOff } from 'lucide-react';

export const ErrorMessage = ({ 
  error, 
  onRetry, 
  type = 'error' // error | offline | empty
}) => {
  const configs = {
    error: {
      icon: AlertCircle,
      title: 'Something went wrong',
      message: error?.message || 'An unexpected error occurred',
      color: 'text-red-600'
    },
    offline: {
      icon: WifiOff,
      title: 'No connection',
      message: 'Check your internet connection',
      color: 'text-gray-600'
    },
    empty: {
      icon: AlertCircle,
      title: 'No results',
      message: 'Try a different search query',
      color: 'text-gray-500'
    }
  };
  
  const config = configs[type];
  const Icon = config.icon;
  
  return (
    <div className="flex flex-col items-center justify-center p-8">
      <Icon size={48} className={config.color} />
      <h3 className="text-lg font-semibold mt-4">{config.title}</h3>
      <p className="text-gray-600 mt-2 text-center max-w-md">
        {config.message}
      </p>
      {onRetry && (
        <button 
          onClick={onRetry}
          className="mt-4 inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          <RefreshCw size={16} className="mr-2" />
          Try again
        </button>
      )}
    </div>
  );
};