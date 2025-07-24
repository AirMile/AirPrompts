import React, { useState } from 'react';
import themeStore from '../../store/themeStore';
import { Check, Sun, Moon, ChevronDown } from 'lucide-react';

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
  
  // Debug: log available themes
  console.log('Available themes:', Object.keys(colorSchemes));
  
  const [isOpen, setIsOpen] = useState(false);
  const [lightDropdownOpen, setLightDropdownOpen] = useState(false);
  const [darkDropdownOpen, setDarkDropdownOpen] = useState(false);
  
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
    },
    charcoal: {
      light: ['#ECEFF1', '#CFD8DC', '#455A64', '#212834'],
      dark: ['#121212', '#1C1C1C', '#38B2AC', '#38B2AC']
    },
    dracula: {
      light: ['#F8F8F8', '#F1F1F4', '#8B5CF6', '#6B46C1'],
      dark: ['#282A36', '#44475A', '#8BE9FD', '#94F8B6']
    },
    onedark: {
      light: ['#FAFAFA', '#F3F3F3', '#0094FF', '#001E33'],
      dark: ['#282C34', '#2C323C', '#61AFEF', '#EBEB9D']
    },
    tokyo: {
      light: ['#FAF9FC', '#E0E4E8', '#3467B7', '#0A1525'],
      dark: ['#1A1B26', '#24283B', '#7AA2F7', '#C3CBD9']
    },
    catppuccin: {
      light: ['#EFF1F5', '#E6E9EF', '#1E66F5', '#0C3C7C'],
      dark: ['#1E1E2E', '#313244', '#89B4FA', '#CDD6F4']
    },
    ayu: {
      light: ['#FAFAFA', '#F2F2F2', '#FF7E00', '#331900'],
      dark: ['#1F2430', '#2D3443', '#FF8B33', '#CBCCC6']
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
            <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-secondary-800 rounded-lg shadow-xl border border-secondary-200 dark:border-secondary-700 z-50 max-h-[400px] overflow-hidden">
              <div className="p-2 max-h-[384px] overflow-y-auto">
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Light Mode Selection */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Sun className="w-5 h-5 text-amber-500" />
            <h4 className="font-medium text-secondary-900 dark:text-secondary-100">
              Lichte Modus
            </h4>
          </div>
          
          <div className="relative">
            <button
              onClick={() => setLightDropdownOpen(!lightDropdownOpen)}
              className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-white dark:bg-secondary-800 border border-secondary-300 dark:border-secondary-600 rounded-lg hover:border-secondary-400 dark:hover:border-secondary-500 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{colorSchemes[lightModeScheme].icon}</span>
                <span className="font-medium text-secondary-900 dark:text-secondary-100">
                  {colorSchemes[lightModeScheme].name}
                </span>
              </div>
              <ChevronDown className={`w-5 h-5 text-secondary-500 transition-transform ${lightDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {lightDropdownOpen && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setLightDropdownOpen(false)}
                />
                <div className="absolute top-full mt-2 w-full bg-white dark:bg-secondary-800 rounded-lg shadow-xl border border-secondary-200 dark:border-secondary-700 z-50 max-h-[400px] overflow-y-auto">
                  {Object.entries(colorSchemes).map(([key, scheme]) => {
                    const isSelected = lightModeScheme === key;
                    const colors = colorPreviews[key];
                    
                    return (
                      <button
                        key={key}
                        onClick={() => {
                          setLightModeScheme(key);
                          setLightDropdownOpen(false);
                        }}
                        className={`
                          w-full flex items-center gap-3 px-4 py-3 transition-colors text-left
                          ${isSelected 
                            ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400' 
                            : 'hover:bg-secondary-100 dark:hover:bg-secondary-700 text-secondary-700 dark:text-secondary-300'
                          }
                          ${key !== Object.keys(colorSchemes)[0] ? 'border-t border-secondary-100 dark:border-secondary-700' : ''}
                        `}
                      >
                        <span className="text-xl">{scheme.icon}</span>
                        <div className="flex-1">
                          <div className="font-medium">{scheme.name}</div>
                          {colors && colors.light && (
                            <div className="flex gap-1 mt-1">
                              {colors.light.map((color, i) => (
                                <div
                                  key={i}
                                  className="w-6 h-3 rounded"
                                  style={{ backgroundColor: color }}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                        {isSelected && (
                          <Check className="w-5 h-5" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Dark Mode Selection */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Moon className="w-5 h-5 text-blue-500" />
            <h4 className="font-medium text-secondary-900 dark:text-secondary-100">
              Donkere Modus
            </h4>
          </div>
          
          <div className="relative">
            <button
              onClick={() => setDarkDropdownOpen(!darkDropdownOpen)}
              className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-white dark:bg-secondary-800 border border-secondary-300 dark:border-secondary-600 rounded-lg hover:border-secondary-400 dark:hover:border-secondary-500 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{colorSchemes[darkModeScheme].icon}</span>
                <span className="font-medium text-secondary-900 dark:text-secondary-100">
                  {colorSchemes[darkModeScheme].name}
                </span>
              </div>
              <ChevronDown className={`w-5 h-5 text-secondary-500 transition-transform ${darkDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {darkDropdownOpen && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setDarkDropdownOpen(false)}
                />
                <div className="absolute top-full mt-2 w-full bg-white dark:bg-secondary-800 rounded-lg shadow-xl border border-secondary-200 dark:border-secondary-700 z-50 max-h-[400px] overflow-y-auto">
                  {Object.entries(colorSchemes).map(([key, scheme]) => {
                    const isSelected = darkModeScheme === key;
                    const colors = colorPreviews[key];
                    
                    return (
                      <button
                        key={key}
                        onClick={() => {
                          setDarkModeScheme(key);
                          setDarkDropdownOpen(false);
                        }}
                        className={`
                          w-full flex items-center gap-3 px-4 py-3 transition-colors text-left
                          ${isSelected 
                            ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400' 
                            : 'hover:bg-secondary-100 dark:hover:bg-secondary-700 text-secondary-700 dark:text-secondary-300'
                          }
                          ${key !== Object.keys(colorSchemes)[0] ? 'border-t border-secondary-100 dark:border-secondary-700' : ''}
                        `}
                      >
                        <span className="text-xl">{scheme.icon}</span>
                        <div className="flex-1">
                          <div className="font-medium">{scheme.name}</div>
                          {colors && colors.dark && (
                            <div className="flex gap-1 mt-1">
                              {colors.dark.map((color, i) => (
                                <div
                                  key={i}
                                  className="w-6 h-3 rounded"
                                  style={{ backgroundColor: color }}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                        {isSelected && (
                          <Check className="w-5 h-5" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

    </div>
  );
};

export default ThemeSelector;