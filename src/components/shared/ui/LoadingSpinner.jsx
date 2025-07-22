import React from 'react';
import { Loader2 } from 'lucide-react';

export const LoadingSpinner = ({ size = 24, className = '' }) => (
  <div className={`flex items-center justify-center ${className}`}>
    <Loader2 className="animate-spin text-primary-600" size={size} />
  </div>
);

export const LoadingOverlay = ({ message = 'Loading...' }) => (
  <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-50">
    <div className="text-center">
      <LoadingSpinner size={32} />
      <p className="mt-2 text-gray-600">{message}</p>
    </div>
  </div>
);

export const SkeletonCard = () => (
  <div className="animate-pulse">
    <div className="h-32 bg-gray-200 rounded-lg mb-2"></div>
    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
  </div>
);

export const SkeletonGrid = ({ count = 6 }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {[...Array(count)].map((_, i) => (
      <SkeletonCard key={i} />
    ))}
  </div>
);