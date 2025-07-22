import React from 'react';
import themeStore from '../../store/themeStore';
import { 
  ColorSwatchIcon, 
  SunIcon, 
  MoonIcon,
  SparklesIcon,
  AdjustmentsHorizontalIcon 
} from '@heroicons/react/24/outline';

const ThemeSettings = () => {
  const { 
    currentTheme, 
    themes, 
    customTheme,
    setTheme, 
    setCustomVariable,
    resetCustomTheme 
  } = themeStore();

  // Sample custom variables for demonstration
  const customVariables = [
    { name: 'font-size-base', label: 'Base Font Size', type: 'select', options: ['14px', '16px', '18px'] },
    { name: 'spacing-4', label: 'Base Spacing', type: 'select', options: ['0.75rem', '1rem', '1.25rem'] },
    { name: 'radius-base', label: 'Border Radius', type: 'select', options: ['0.25rem', '0.375rem', '0.5rem'] },
    { name: 'font-family-base', label: 'Font Family', type: 'select', options: [
      'system-ui, -apple-system, sans-serif',
      'Inter, system-ui, sans-serif',
      'Roboto, system-ui, sans-serif'
    ]}
  ];

  const themeIcons = {
    default: <ColorSwatchIcon className="w-5 h-5" />,
    purple: <SparklesIcon className="w-5 h-5" />,
    orange: <SunIcon className="w-5 h-5" />,
    dark: <MoonIcon className="w-5 h-5" />
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-secondary-900 mb-4">Theme Selection</h3>
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(themes).map(([key, theme]) => (
            <button
              key={key}
              onClick={() => setTheme(key)}
              className={`
                flex items-center gap-3 p-4 rounded-lg border-2 transition-all
                ${currentTheme === key
                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                  : 'border-secondary-200 hover:border-secondary-300 bg-white'
                }
              `}
            >
              {themeIcons[key]}
              <span className="font-medium">{theme.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-secondary-900 mb-4">
          <span className="flex items-center gap-2">
            <AdjustmentsHorizontalIcon className="w-5 h-5" />
            Custom Theme Variables
          </span>
        </h3>
        <div className="space-y-4">
          {customVariables.map((variable) => (
            <div key={variable.name} className="flex items-center justify-between">
              <label className="text-sm font-medium text-secondary-700">
                {variable.label}
              </label>
              <select
                className="px-3 py-2 border border-secondary-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                value={customTheme.variables[variable.name] || ''}
                onChange={(e) => setCustomVariable(variable.name, e.target.value)}
              >
                <option value="">Default</option>
                {variable.options.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          ))}
          
          {Object.keys(customTheme.variables).length > 0 && (
            <button
              onClick={resetCustomTheme}
              className="w-full mt-4 px-4 py-2 text-sm font-medium text-danger-600 bg-danger-50 rounded-lg hover:bg-danger-100 transition-colors"
            >
              Reset Custom Variables
            </button>
          )}
        </div>
      </div>

      <div className="pt-4 border-t border-secondary-200">
        <p className="text-sm text-secondary-600">
          Changes are applied immediately and saved automatically.
        </p>
      </div>
    </div>
  );
};

export default ThemeSettings;