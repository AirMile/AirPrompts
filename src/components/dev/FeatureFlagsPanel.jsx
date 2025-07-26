import React, { useState } from 'react';
import { useFeatureFlags, useFeature } from '../../contexts/FeatureFlagsContext';

/**
 * Feature Flags Developer Panel
 * 
 * Allows developers to view and override feature flags during development
 * Only visible when SHOW_DEBUG_INFO flag is enabled
 */
const FeatureFlagsPanel = () => {
  const { flags, override, clearOverrides, getFlag } = useFeatureFlags();
  const showDebug = useFeature('SHOW_DEBUG_INFO');
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Don't render if debug mode is off
  if (!showDebug) return null;

  // Filter flags based on search
  const filteredFlags = Object.keys(flags).filter(flag =>
    flag.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group flags by category
  const categorizedFlags = filteredFlags.reduce((acc, flagName) => {
    let category = 'Other';
    
    if (flagName.startsWith('USE_')) category = 'Core Features';
    else if (flagName.startsWith('ENABLE_')) category = 'Optional Features';
    else if (flagName.includes('DEBUG') || flagName.includes('DEV')) category = 'Developer';
    else if (flagName.includes('PERFORMANCE')) category = 'Performance';
    
    if (!acc[category]) acc[category] = [];
    acc[category].push(flagName);
    
    return acc;
  }, {});

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 z-50 bg-primary-500 text-white p-3 rounded-full shadow-lg hover:bg-primary-600 transition-colors"
        title="Feature Flags"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>

      {/* Panel */}
      {isOpen && (
        <div className="fixed inset-0 z-40 overflow-hidden">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setIsOpen(false)} />
          
          <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white dark:bg-secondary-800 shadow-xl overflow-y-auto">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-secondary-900 dark:text-secondary-100">
                  Feature Flags
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

              {/* Search */}
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Search flags..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-secondary-300 dark:border-secondary-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-secondary-700 dark:text-white"
                />
              </div>

              {/* Clear Overrides Button */}
              <div className="mb-6">
                <button
                  onClick={() => {
                    if (window.confirm('Clear all feature flag overrides?')) {
                      clearOverrides();
                    }
                  }}
                  className="w-full px-4 py-2 bg-danger-500 text-white rounded-lg hover:bg-danger-600 transition-colors"
                >
                  Clear All Overrides
                </button>
              </div>

              {/* Flags by Category */}
              {Object.entries(categorizedFlags).map(([category, categoryFlags]) => (
                <div key={category} className="mb-6">
                  <h3 className="text-lg font-semibold text-secondary-800 dark:text-secondary-200 mb-3">
                    {category}
                  </h3>
                  
                  <div className="space-y-3">
                    {categoryFlags.map(flagName => {
                      const flag = getFlag(flagName);
                      const isOverridden = flag.source === 'override';
                      
                      return (
                        <div 
                          key={flagName} 
                          className={`p-4 rounded-lg border ${
                            isOverridden 
                              ? 'border-warning-400 bg-warning-50 dark:bg-warning-900/20' 
                              : 'border-secondary-200 dark:border-secondary-600 bg-white dark:bg-secondary-700'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium text-secondary-900 dark:text-secondary-100">
                                  {flagName}
                                </h4>
                                {isOverridden && (
                                  <span className="text-xs px-2 py-1 bg-warning-200 dark:bg-warning-800 text-warning-800 dark:text-warning-200 rounded">
                                    Overridden
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-secondary-600 dark:text-secondary-400 mt-1">
                                {flag.description}
                              </p>
                              <p className="text-xs text-secondary-500 dark:text-secondary-500 mt-1">
                                Source: {flag.source}
                              </p>
                            </div>
                            
                            <label className="relative inline-flex items-center cursor-pointer ml-4">
                              <input
                                type="checkbox"
                                checked={flags[flagName]}
                                onChange={(e) => override(flagName, e.target.checked)}
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-secondary-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-secondary-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-secondary-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-secondary-600 peer-checked:bg-primary-600"></div>
                            </label>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FeatureFlagsPanel;