import React, { useState } from 'react';
import themeStore from '../../store/themeStore';
import { Check } from 'lucide-react';

const ThemeSelector = ({ compact = false }) => {
  const { 
    currentColorScheme, 
    isDarkMode, 
    colorSchemes, 
    setTheme 
  } = themeStore();
  
  const [isOpen, setIsOpen] = useState(false);

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
                        {colorPreviews[key][isDarkMode ? 'dark' : 'light'].map((color, i) => (
                          <div
                            key={i}
                            className="w-4 h-4 rounded"
                            style={{ backgroundColor: color }}
                          />
                        ))}
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

  // Full grid version for settings page
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100 mb-4">
          Choose Your Theme
        </h3>
        <p className="text-sm text-secondary-600 dark:text-secondary-400 mb-6">
          Select a color scheme. Use the sun/moon toggle in the search bar to switch between light and dark modes.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {Object.entries(colorSchemes).map(([key, scheme]) => {
          const isSelected = currentColorScheme === key;
          const colors = colorPreviews[key];
          
          return (
            <button
              key={key}
              onClick={() => setTheme(key, isDarkMode)}
              className={`
                relative p-6 rounded-xl border-2 transition-all text-left
                ${isSelected 
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/10 shadow-lg scale-105' 
                  : 'border-secondary-200 dark:border-secondary-700 hover:border-secondary-300 dark:hover:border-secondary-600 bg-white dark:bg-secondary-800'
                }
              `}
            >
              {/* Theme Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{scheme.icon}</span>
                  <div>
                    <h4 className={`font-semibold ${isSelected ? 'text-primary-700 dark:text-primary-400' : 'text-secondary-900 dark:text-secondary-100'}`}>
                      {scheme.name}
                    </h4>
                    <div className="text-xs text-secondary-500 dark:text-secondary-400 mt-0.5">
                      {isDarkMode ? 'Dark' : 'Light'} Mode
                    </div>
                  </div>
                </div>
                {isSelected && (
                  <div className="bg-primary-500 text-white rounded-full p-1">
                    <Check className="w-4 h-4" />
                  </div>
                )}
              </div>

              {/* Color Preview */}
              <div className="space-y-2">
                {/* Light mode preview */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-secondary-500 dark:text-secondary-400 w-12">Light:</span>
                  <div className="flex gap-1 flex-1">
                    {colors.light.map((color, i) => (
                      <div
                        key={i}
                        className="h-6 flex-1 rounded"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
                
                {/* Dark mode preview */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-secondary-500 dark:text-secondary-400 w-12">Dark:</span>
                  <div className="flex gap-1 flex-1">
                    {colors.dark.map((color, i) => (
                      <div
                        key={i}
                        className="h-6 flex-1 rounded"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Current indicator */}
              {isSelected && (
                <div className="absolute inset-0 rounded-xl ring-2 ring-primary-500 ring-offset-2 ring-offset-white dark:ring-offset-secondary-900 pointer-events-none" />
              )}
            </button>
          );
        })}
      </div>

      {/* Info */}
      <div className="mt-8 p-4 bg-secondary-100 dark:bg-secondary-800/50 rounded-lg">
        <p className="text-sm text-secondary-600 dark:text-secondary-400">
          <strong>Tip:</strong> Each theme has been carefully crafted with optimal contrast ratios for both light and dark modes. 
          The dark/light toggle in the search bar will switch between variants of your selected theme.
        </p>
      </div>
    </div>
  );
};

export default ThemeSelector;