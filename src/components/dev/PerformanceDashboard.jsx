import React, { useState, useEffect } from 'react';
import { useFeature } from '../../contexts/FeatureFlagsContext';
import { getAllMetrics } from '../../services/monitoring/performance';

/**
 * Performance Dashboard Component
 * 
 * Displays real-time performance metrics and web vitals
 * Only visible when SHOW_DEBUG_INFO is enabled
 */
const PerformanceDashboard = () => {
  const showDebug = useFeature('SHOW_DEBUG_INFO');
  const [isOpen, setIsOpen] = useState(false);
  const [metrics, setMetrics] = useState({ webVitals: {}, custom: {}, resources: {} });
  const [refreshInterval, setRefreshInterval] = useState(null);

  // Don't render if debug mode is off
  if (!showDebug) return null;

  // Update metrics periodically
  useEffect(() => {
    if (isOpen) {
      const updateMetrics = () => {
        setMetrics(getAllMetrics());
      };
      
      updateMetrics(); // Initial update
      const interval = setInterval(updateMetrics, 2000); // Update every 2 seconds
      setRefreshInterval(interval);
      
      return () => {
        clearInterval(interval);
        setRefreshInterval(null);
      };
    }
  }, [isOpen]);

  // Get rating color
  const getRatingColor = (rating) => {
    switch (rating) {
      case 'good': return 'text-success-600 bg-success-100';
      case 'needs-improvement': return 'text-warning-600 bg-warning-100';
      case 'poor': return 'text-danger-600 bg-danger-100';
      default: return 'text-secondary-600 bg-secondary-100';
    }
  };

  // Format metric value
  const formatValue = (value, unit = 'ms') => {
    if (typeof value !== 'number') return value;
    if (unit === 'ms') return `${Math.round(value)}ms`;
    if (unit === 'MB') return `${value.toFixed(1)}MB`;
    if (unit === '%') return `${value.toFixed(1)}%`;
    return value.toFixed(2);
  };

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 left-4 z-50 bg-primary-500 text-white p-3 rounded-full shadow-lg hover:bg-primary-600 transition-colors"
        title="Performance Dashboard"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      </button>

      {/* Dashboard Panel */}
      {isOpen && (
        <div className="fixed inset-0 z-40 overflow-hidden">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setIsOpen(false)} />
          
          <div className="absolute left-0 top-0 h-full w-full max-w-lg bg-white dark:bg-secondary-800 shadow-xl overflow-y-auto">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-secondary-900 dark:text-secondary-100">
                  Performance Dashboard
                </h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-secondary-500 hover:text-secondary-700 dark:hover:text-secondary-300"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Web Vitals Section */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-secondary-800 dark:text-secondary-200 mb-4">
                  Core Web Vitals
                </h3>
                
                <div className="space-y-3">
                  {Object.entries({
                    LCP: 'Largest Contentful Paint',
                    FID: 'First Input Delay',
                    CLS: 'Cumulative Layout Shift',
                    FCP: 'First Contentful Paint',
                    TTFB: 'Time to First Byte'
                  }).map(([key, label]) => {
                    const metric = metrics.webVitals[key];
                    if (!metric) return null;
                    
                    return (
                      <div key={key} className="bg-secondary-50 dark:bg-secondary-700 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-secondary-900 dark:text-secondary-100">
                            {label}
                          </h4>
                          <span className={`text-sm px-2 py-1 rounded ${getRatingColor(metric.rating)}`}>
                            {metric.rating}
                          </span>
                        </div>
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl font-bold text-secondary-900 dark:text-secondary-100">
                            {formatValue(metric.value, key === 'CLS' ? '' : 'ms')}
                          </span>
                          {metric.delta !== undefined && (
                            <span className="text-sm text-secondary-600 dark:text-secondary-400">
                              Δ {formatValue(metric.delta, key === 'CLS' ? '' : 'ms')}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Custom Metrics Section */}
              {Object.keys(metrics.custom).length > 0 && (
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-secondary-800 dark:text-secondary-200 mb-4">
                    Custom Metrics
                  </h3>
                  
                  <div className="space-y-2">
                    {Object.entries(metrics.custom).map(([name, metric]) => (
                      <div key={name} className="flex justify-between items-center p-3 bg-secondary-50 dark:bg-secondary-700 rounded">
                        <span className="text-secondary-700 dark:text-secondary-300">{name}</span>
                        <span className="font-medium text-secondary-900 dark:text-secondary-100">
                          {formatValue(
                            metric.value || metric,
                            name.includes('memory') ? (name.includes('usage') ? '%' : 'MB') : 'ms'
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Resource Metrics Section */}
              {Object.keys(metrics.resources).length > 0 && (
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-secondary-800 dark:text-secondary-200 mb-4">
                    Resource Loading
                  </h3>
                  
                  <div className="space-y-2">
                    {Object.entries(metrics.resources).map(([type, data]) => (
                      <div key={type} className="p-3 bg-secondary-50 dark:bg-secondary-700 rounded">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-medium text-secondary-900 dark:text-secondary-100 capitalize">
                            {type}
                          </span>
                          <span className="text-sm text-secondary-600 dark:text-secondary-400">
                            {data.count} files
                          </span>
                        </div>
                        <div className="text-sm text-secondary-600 dark:text-secondary-400">
                          <span>Avg: {formatValue(data.avgDuration)}</span>
                          {data.totalSize > 0 && (
                            <span className="ml-3">
                              Size: {(data.totalSize / 1024 / 1024).toFixed(2)}MB
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Info Section */}
              <div className="mt-6 p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
                <p className="text-sm text-primary-700 dark:text-primary-300">
                  <strong>Tip:</strong> Performance metrics are collected in real-time. 
                  Poor ratings may indicate performance issues that need attention.
                </p>
              </div>

              {/* Legend */}
              <div className="mt-4 flex gap-4 text-xs">
                <div className="flex items-center gap-1">
                  <span className="w-3 h-3 bg-success-500 rounded"></span>
                  <span className="text-secondary-600 dark:text-secondary-400">Good</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-3 h-3 bg-warning-500 rounded"></span>
                  <span className="text-secondary-600 dark:text-secondary-400">Needs Improvement</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-3 h-3 bg-danger-500 rounded"></span>
                  <span className="text-secondary-600 dark:text-secondary-400">Poor</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PerformanceDashboard;