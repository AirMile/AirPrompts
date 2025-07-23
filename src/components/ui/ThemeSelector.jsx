import React, { useState } from 'react';
import themeStore from '../../store/themeStore';
import { Check, Sun, Moon } from 'lucide-react';

// Fixed theme selector with proper error handling - v2

const ThemeSelector = ({ compact = false }) => {
  const { 
    isDarkMode, 
    lightModeScheme,
    darkModeScheme,
    colorSchemes, 
    setTheme,
    setLightModeScheme,
    setDarkModeScheme
  } = themeStore();
  
  const [isOpen, setIsOpen] = useState(false);
  
  // Computed current scheme for compact view
  const currentColorScheme = isDarkMode ? darkModeScheme : lightModeScheme;

  // Color previews for each theme
  const colorPreviews = {
    blue: {
      light: ['#EFF6FF', '#DBEAFE', '#3B82F6', '#1E40AF'],
      dark: ['#111827', '#1F2937', '#3B82F6', '#60A5FA']
    },
    orange: {
      light: ['#FFF8F0', '#FED7AA', '#F97316', '#9A3412'],
      dark: ['#1A1A1A', '#2D2D2D', '#FF8C42', '#FFD700']
    },
    purple: {
      light: ['#FAF5FF', '#E9D5FF', '#A855F7', '#6B21A8'],
      dark: ['#0D0D12', '#18181B', '#9333EA', '#C084FC']
    },
    green: {
      light: ['#F0FDF4', '#BBF7D0', '#22C55E', '#166534'],
      dark: ['#171717', '#262626', '#22C55E', '#4ADE80']
    },
    classic: {
      light: ['#F9FAFB', '#F3F4F6', '#3B82F6', '#1E40AF'],
      dark: ['#111827', '#1F2937', '#3B82F6', '#60A5FA']
    },
    grey: {
      light: ['#FAFAFA', '#F5F5F5', '#6B7280', '#374151'],
      dark: ['#1F2937', '#374151', '#9CA3AF', '#E5E7EB']
    }
  };

  if (compact) {
    // Compact dropdown version for navbar
    return (
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3 py-2 text-sm text-secondary-700 hover:text-secondary-900 dark:text-secondary-300 dark:hover:text-secondary-100 transition-colors"
        >
          <span className="text-lg">{colorSchemes[currentColorScheme].icon}</span>
          <span className="hidden sm:inline">{colorSchemes[currentColorScheme].name}</span>
        </button>
        
        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsOpen(false)}
            />
            <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-secondary-800 rounded-lg shadow-xl border border-secondary-200 dark:border-secondary-700 z-50">
              <div className="p-2">
                {Object.entries(colorSchemes).map(([key, scheme]) => (
                  <button
                    key={key}
                    onClick={() => {
                      setTheme(key, isDarkMode);
                      setIsOpen(false);
                    }}
                    className={`
                      w-full flex items-center gap-3 p-3 rounded-lg transition-colors
                      ${currentColorScheme === key 
                        ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400' 
                        : 'hover:bg-secondary-100 dark:hover:bg-secondary-700 text-secondary-700 dark:text-secondary-300'
                      }
                    `}
                  >
                    <span className="text-2xl">{scheme.icon}</span>
                    <div className="flex-1 text-left">
                      <div className="font-medium">{scheme.name}</div>
                      <div className="flex gap-1 mt-1">
                        {colorPreviews[key] && colorPreviews[key][isDarkMode ? 'dark' : 'light'] ? colorPreviews[key][isDarkMode ? 'dark' : 'light'].map((color, i) => (
                          <div
                            key={i}
                            className="w-4 h-4 rounded"
                            style={{ backgroundColor: color }}
                          />
                        )) : null}
                      </div>
                    </div>
                    {currentColorScheme === key && (
                      <Check className="w-4 h-4" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  // Full grid version for settings page with separate light/dark selection
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100 mb-4">
          Kies Je Thema's
        </h3>
      </div>

      {/* Light Mode Selection */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Sun className="w-5 h-5 text-amber-500" />
          <h4 className="font-medium text-secondary-900 dark:text-secondary-100">
            Lichte Modus Thema
          </h4>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {Object.entries(colorSchemes).map(([key, scheme]) => {
            const isSelected = lightModeScheme === key;
            const colors = colorPreviews[key];
            
            // Skip if colors are not defined
            if (!colors) return null;
            
            return (
              <button
                key={`light-${key}`}
                onClick={() => {
                  setLightModeScheme(key);
                }}
                className={`
                  relative p-4 rounded-xl border-2 transition-all text-left
                  ${isSelected 
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 shadow-lg scale-105' 
                    : 'border-secondary-200 dark:border-secondary-700 hover:border-secondary-300 dark:hover:border-secondary-600 bg-white dark:bg-secondary-800'
                  }
                `}
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">{scheme.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className={`font-medium text-sm truncate ${isSelected ? 'text-primary-700 dark:text-primary-400' : 'text-secondary-900 dark:text-secondary-100'}`}>
                      {scheme.name}
                    </div>
                  </div>
                  {isSelected && (
                    <div className="bg-primary-500 text-white rounded-full p-0.5">
                      <Check className="w-3 h-3" />
                    </div>
                  )}
                </div>

                <div className="flex gap-1">
                  {colors && colors.light ? colors.light.map((color, i) => (
                    <div
                      key={i}
                      className="h-4 flex-1 rounded"
                      style={{ backgroundColor: color }}
                    />
                  )) : null}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Dark Mode Selection */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Moon className="w-5 h-5 text-blue-500" />
          <h4 className="font-medium text-secondary-900 dark:text-secondary-100">
            Donkere Modus Thema
          </h4>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {Object.entries(colorSchemes).map(([key, scheme]) => {
            const isSelected = darkModeScheme === key;
            const colors = colorPreviews[key];
            
            // Skip if colors are not defined
            if (!colors) return null;
            
            return (
              <button
                key={`dark-${key}`}
                onClick={() => {
                  setDarkModeScheme(key);
                }}
                className={`
                  relative p-4 rounded-xl border-2 transition-all text-left
                  ${isSelected 
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/10 shadow-lg scale-105' 
                    : 'border-secondary-200 dark:border-secondary-700 hover:border-secondary-300 dark:hover:border-secondary-600 bg-white dark:bg-secondary-800'
                  }
                `}
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">{scheme.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className={`font-medium text-sm truncate ${isSelected ? 'text-primary-700 dark:text-primary-400' : 'text-secondary-900 dark:text-secondary-100'}`}>
                      {scheme.name}
                    </div>
                  </div>
                  {isSelected && (
                    <div className="bg-primary-500 text-white rounded-full p-0.5">
                      <Check className="w-3 h-3" />
                    </div>
                  )}
                </div>

                <div className="flex gap-1">
                  {colors && colors.dark ? colors.dark.map((color, i) => (
                    <div
                      key={i}
                      className="h-4 flex-1 rounded"
                      style={{ backgroundColor: color }}
                    />
                  )) : null}
                </div>
              </button>
            );
          })}
        </div>
      </div>

    </div>
  );
};

export default ThemeSelector;