import React, { useState, useEffect } from 'react';
import { Palette, FileText, Info, Layers, Workflow } from 'lucide-react';
import { AVAILABLE_COLORS, getUserItemColors, saveUserItemColors } from '../../utils/itemColors.js';

const ColorOption = ({ color, isSelected, onSelect }) => {
  const colorClasses = {
    primary: 'bg-primary-500',
    success: 'bg-success-500', 
    warning: 'bg-warning-500',
    danger: 'bg-danger-500',
    orange: 'bg-orange-500',
    purple: 'bg-purple-500',
    pink: 'bg-pink-500',
    indigo: 'bg-indigo-500'
  };

  return (
    <button
      onClick={() => onSelect(color.value)}
      className={`
        w-10 h-10 rounded-lg border-2 transition-all duration-200 hover:scale-110
        ${colorClasses[color.value]}
        ${isSelected 
          ? 'border-secondary-900 dark:border-secondary-100 ring-2 ring-secondary-900 dark:ring-secondary-100' 
          : 'border-secondary-300 dark:border-secondary-600 hover:border-secondary-400 dark:hover:border-secondary-500'
        }
      `}
      title={color.name}
    />
  );
};

const ItemTypeRow = ({ type, label, icon: Icon, colors, onColorChange }) => {
  const currentColor = colors[type];

  return (
    <div className="flex items-center justify-between py-4 border-b border-secondary-200 dark:border-secondary-700 last:border-b-0">
      <div className="flex items-center gap-3">
        <div className={`
          w-10 h-10 rounded-lg flex items-center justify-center
          ${type === 'template' ? 'bg-primary-100 dark:bg-primary-900/30' :
            type === 'info' ? 'bg-success-100 dark:bg-success-900/30' :
            type === 'snippet' ? 'bg-warning-100 dark:bg-warning-900/30' :
            'bg-orange-100 dark:bg-orange-900/30'
          }
        `}>
          <Icon className={`
            w-5 h-5
            ${type === 'template' ? 'text-primary-600 dark:text-primary-400' :
              type === 'info' ? 'text-success-600 dark:text-success-400' :
              type === 'snippet' ? 'text-warning-600 dark:text-warning-400' :
              'text-orange-600 dark:text-orange-400'
            }
          `} />
        </div>
        <div>
          <h4 className="font-medium text-secondary-900 dark:text-secondary-100">
            {label}
          </h4>
          <p className="text-sm text-secondary-600 dark:text-secondary-400">
            Choose color for {label.toLowerCase()} items
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        {AVAILABLE_COLORS.map((color) => (
          <ColorOption
            key={color.id}
            color={color}
            isSelected={currentColor === color.value}
            onSelect={(colorValue) => onColorChange(type, colorValue)}
          />
        ))}
      </div>
    </div>
  );
};

const ItemColorSettings = () => {
  const [colors, setColors] = useState(getUserItemColors());

  const handleColorChange = (itemType, colorValue) => {
    const newColors = {
      ...colors,
      [itemType]: colorValue
    };
    setColors(newColors);
    saveUserItemColors(newColors);
    
    // Trigger a custom event to notify other components
    window.dispatchEvent(new CustomEvent('itemColorsChanged', { detail: newColors }));
  };

  const handleReset = () => {
    resetItemColors();
    setColors(getUserItemColors());
    
    // Trigger a custom event to notify other components
    window.dispatchEvent(new CustomEvent('itemColorsChanged', { detail: getUserItemColors() }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-secondary-900 dark:text-secondary-100 mb-2">
          Item Colors
        </h3>
      </div>

      <div className="bg-secondary-50 dark:bg-secondary-800/50 rounded-xl p-6 space-y-1">
        <ItemTypeRow
          type="template"
          label="Templates"
          icon={FileText}
          colors={colors}
          onColorChange={handleColorChange}
        />
        
        <ItemTypeRow
          type="info"
          label="Info Steps"
          icon={Info}
          colors={colors}
          onColorChange={handleColorChange}
        />
        
        <ItemTypeRow
          type="snippet"
          label="Snippets"
          icon={Layers}
          colors={colors}
          onColorChange={handleColorChange}
        />
        
        <ItemTypeRow
          type="workflow"
          label="Workflows"
          icon={Workflow}
          colors={colors}
          onColorChange={handleColorChange}
        />
      </div>

    </div>
  );
};

export default ItemColorSettings;