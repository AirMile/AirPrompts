import React from 'react';
import { Grid, List } from 'lucide-react';

const ViewModeToggle = ({ 
  currentMode = 'list', 
  onModeChange = () => {},
  className = ''
}) => {
  const viewModes = [
    {
      id: 'list',
      icon: List,
      label: 'List View',
      description: 'Single-column list layout'
    },
    {
      id: 'grid',
      icon: Grid,
      label: 'Grid View',
      description: 'Standard grid layout with cards'
    }
  ];

  const handleModeChange = (mode) => {
    if (mode !== currentMode) {
      onModeChange(mode);
    }
  };

  const handleKeyDown = (event, mode) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleModeChange(mode);
    }
  };

  return (
    <div 
      className={`flex items-center bg-secondary-800 dark:bg-secondary-700 rounded-lg p-1 ${className}`}
      role="group"
      aria-label="View mode toggle"
      aria-describedby="view-mode-help"
    >
      {/* Hidden help text for screen readers */}
      <div id="view-mode-help" className="sr-only">
        Choose how items are displayed: Grid view shows items in a card grid, List view shows items in a single column.
      </div>
      
      {viewModes.map((mode) => {
        const Icon = mode.icon;
        const isActive = currentMode === mode.id;
        
        return (
          <button
            key={mode.id}
            onClick={() => handleModeChange(mode.id)}
            onKeyDown={(e) => handleKeyDown(e, mode.id)}
            className={`
              flex items-center justify-center px-3 py-2 rounded-md text-sm font-medium
              transition-colors duration-200 min-w-[80px] min-h-[44px] sm:min-h-[36px]
              ${isActive 
                ? 'bg-primary-600 text-white shadow-sm dark:bg-primary-500' 
                : 'text-secondary-300 hover:text-white hover:bg-secondary-700 dark:text-secondary-400 dark:hover:text-white dark:hover:bg-secondary-600'
              }
              focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-opacity-50
            `}
            role="radio"
            aria-checked={isActive}
            aria-label={`${mode.label}: ${mode.description}`}
          >
            <Icon className="w-4 h-4" aria-hidden="true" />
            <span className="ml-1 hidden sm:inline">{mode.label.split(' ')[0]}</span>
          </button>
        );
      })}
    </div>
  );
};

export default ViewModeToggle;