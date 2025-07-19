import React from 'react';
import { Loader2, FileText, Layers, Tag } from 'lucide-react';

const Loading = ({ 
  message = 'Loading...',
  size = 'medium',
  variant = 'spinner',
  className = ''
}) => {
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-6 h-6',
    large: 'w-8 h-8'
  };

  const LoadingSpinner = () => (
    <div className={`flex items-center justify-center ${className}`}>
      <Loader2 className={`${sizeClasses[size]} animate-spin text-blue-500`} />
      {message && (
        <span className="ml-2 text-gray-300 text-sm">{message}</span>
      )}
    </div>
  );

  const LoadingCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="bg-gray-800 rounded-lg p-4 animate-pulse">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-gray-700 rounded"></div>
              <div className="w-24 h-4 bg-gray-700 rounded"></div>
            </div>
            <div className="w-5 h-5 bg-gray-700 rounded"></div>
          </div>
          <div className="space-y-2">
            <div className="w-full h-3 bg-gray-700 rounded"></div>
            <div className="w-3/4 h-3 bg-gray-700 rounded"></div>
            <div className="w-1/2 h-3 bg-gray-700 rounded"></div>
          </div>
          <div className="flex gap-2 mt-4">
            <div className="w-16 h-7 bg-gray-700 rounded"></div>
            <div className="w-16 h-7 bg-gray-700 rounded"></div>
          </div>
        </div>
      ))}
    </div>
  );

  const LoadingList = () => (
    <div className="space-y-3">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="bg-gray-800 rounded-lg p-4 animate-pulse">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gray-700 rounded"></div>
              <div>
                <div className="w-32 h-4 bg-gray-700 rounded mb-1"></div>
                <div className="w-48 h-3 bg-gray-700 rounded"></div>
              </div>
            </div>
            <div className="flex gap-2">
              <div className="w-8 h-8 bg-gray-700 rounded"></div>
              <div className="w-8 h-8 bg-gray-700 rounded"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const LoadingSection = () => (
    <div className="space-y-8">
      {/* Favorites Section */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-5 h-5 bg-gray-700 rounded animate-pulse"></div>
          <div className="w-20 h-5 bg-gray-700 rounded animate-pulse"></div>
        </div>
        <LoadingCards />
      </div>

      {/* Recent Section */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-5 h-5 bg-gray-700 rounded animate-pulse"></div>
          <div className="w-32 h-5 bg-gray-700 rounded animate-pulse"></div>
        </div>
        <LoadingList />
      </div>

      {/* Templates Section */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <FileText className="w-5 h-5 text-blue-500" />
          <div className="w-20 h-5 bg-gray-700 rounded animate-pulse"></div>
        </div>
        <LoadingCards />
      </div>
    </div>
  );

  switch (variant) {
    case 'cards':
      return <LoadingCards />;
    case 'list':
      return <LoadingList />;
    case 'sections':
      return <LoadingSection />;
    case 'spinner':
    default:
      return <LoadingSpinner />;
  }
};

export default Loading;