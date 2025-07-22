import React, { useState } from 'react';
import { Plus, Eye, EyeOff, Settings, Grid, RotateCcw } from 'lucide-react';
import { useUserPreferences } from '../../hooks/domain/useUserPreferences.js';

/**
 * WidgetManager - Interface for managing dashboard widgets
 * 
 * Features:
 * - Add/remove widgets interface
 * - Widget configuration settings
 * - Widget layout management
 * - Widget preferences integration
 */
const WidgetManager = ({ 
  availableWidgets = [], 
  onWidgetToggle = () => {},
  onWidgetConfigure = () => {},
  onLayoutReset = () => {},
  className = ''
}) => {
  const { dashboard, updateDashboard } = useUserPreferences();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showLayoutSettings, setShowLayoutSettings] = useState(false);
  
  // Default available widgets
  const defaultWidgets = [
    {
      id: 'favorites-widget',
      name: 'Favorites',
      description: 'Quick access to your favorite items',
      category: 'Quick Access',
      icon: '⭐',
      defaultEnabled: true
    },
    {
      id: 'folder-management-widget',
      name: 'Folder Management',
      description: 'Folder-specific favorites and items with drag-and-drop ordering',
      category: 'Quick Access',
      icon: '📁',
      defaultEnabled: true
    },
    {
      id: 'stats-widget',
      name: 'Usage Statistics',
      description: 'View your usage patterns and metrics',
      category: 'Analytics',
      icon: '📊',
      defaultEnabled: false
    },
    {
      id: 'quick-actions-widget',
      name: 'Quick Actions',
      description: 'Shortcuts to common actions',
      category: 'Productivity',
      icon: '⚡',
      defaultEnabled: false
    }
  ];

  const widgets = availableWidgets.length > 0 ? availableWidgets : defaultWidgets;

  // Get current widget states
  const getWidgetState = (widgetId) => {
    return dashboard.widgets?.[widgetId] || {
      enabled: widgets.find(w => w.id === widgetId)?.defaultEnabled || false,
      position: { x: 0, y: 0 },
      size: { width: 300, height: 200 }
    };
  };

  // Toggle widget enabled state
  const handleWidgetToggle = (widgetId) => {
    const currentState = getWidgetState(widgetId);
    const newEnabled = !currentState.enabled;
    
    updateDashboard({
      widgets: {
        ...dashboard.widgets,
        [widgetId]: {
          ...currentState,
          enabled: newEnabled
        }
      }
    });
    
    onWidgetToggle(widgetId, newEnabled);
  };

  // Handle widget configuration
  const handleWidgetConfigure = (widgetId) => {
    onWidgetConfigure(widgetId);
  };

  // Reset all widget positions
  const handleLayoutReset = () => {
    if (window.confirm('Are you sure you want to reset all widget positions? This cannot be undone.')) {
      const resetWidgets = {};
      Object.keys(dashboard.widgets || {}).forEach(widgetId => {
        const widget = widgets.find(w => w.id === widgetId);
        if (widget) {
          resetWidgets[widgetId] = {
            ...dashboard.widgets[widgetId],
            position: { x: 0, y: 0 },
            size: { width: 300, height: 200 },
            maximized: false
          };
        }
      });
      
      updateDashboard({
        widgets: resetWidgets
      });
      
      onLayoutReset();
    }
  };

  // Get enabled widgets count
  const enabledCount = widgets.filter(widget => 
    getWidgetState(widget.id).enabled
  ).length;

  // Group widgets by category
  const groupedWidgets = widgets.reduce((groups, widget) => {
    const category = widget.category || 'Other';
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(widget);
    return groups;
  }, {});

  return (
    <div className={`widget-manager ${className}`}>
      {/* Manager Toggle Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors
          ${isExpanded 
            ? 'bg-blue-600 text-white hover:bg-blue-700' 
            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }
        `}
        title="Manage widgets"
      >
        <Grid className="w-4 h-4" />
        Widgets ({enabledCount})
      </button>

      {/* Expanded Widget Manager */}
      {isExpanded && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50">
          <div className="p-4 border-b border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-gray-100">Widget Manager</h3>
              <button
                onClick={() => setShowLayoutSettings(!showLayoutSettings)}
                className="p-1 text-gray-400 hover:text-gray-200 rounded"
                title="Layout settings"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
            
            {/* Layout Settings */}
            {showLayoutSettings && (
              <div className="mb-4 p-3 bg-gray-750 rounded-lg">
                <h4 className="text-sm font-medium text-gray-200 mb-2">Layout Settings</h4>
                <div className="space-y-2">
                  <button
                    onClick={handleLayoutReset}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 bg-gray-700 rounded hover:bg-gray-600 transition-colors"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Reset All Positions
                  </button>
                </div>
              </div>
            )}
            
            <p className="text-sm text-gray-400">
              {enabledCount} of {widgets.length} widgets enabled
            </p>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {Object.entries(groupedWidgets).map(([category, categoryWidgets]) => (
              <div key={category} className="p-4 border-b border-gray-700 last:border-b-0">
                <h4 className="text-sm font-medium text-gray-300 mb-3">{category}</h4>
                
                <div className="space-y-2">
                  {categoryWidgets.map(widget => {
                    const widgetState = getWidgetState(widget.id);
                    const isEnabled = widgetState.enabled;
                    
                    return (
                      <div
                        key={widget.id}
                        className={`
                          flex items-center justify-between p-3 rounded-lg border transition-colors
                          ${isEnabled 
                            ? 'border-blue-600 bg-blue-600/10' 
                            : 'border-gray-600 bg-gray-750'
                          }
                        `}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-lg">{widget.icon}</span>
                          <div>
                            <h5 className="text-sm font-medium text-gray-100">
                              {widget.name}
                            </h5>
                            <p className="text-xs text-gray-400">
                              {widget.description}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          {isEnabled && (
                            <button
                              onClick={() => handleWidgetConfigure(widget.id)}
                              className="p-1 text-gray-400 hover:text-gray-200 rounded"
                              title="Configure widget"
                            >
                              <Settings className="w-4 h-4" />
                            </button>
                          )}
                          
                          <button
                            onClick={() => handleWidgetToggle(widget.id)}
                            className={`
                              p-1 rounded transition-colors
                              ${isEnabled 
                                ? 'text-blue-400 hover:text-blue-300' 
                                : 'text-gray-400 hover:text-gray-200'
                              }
                            `}
                            title={isEnabled ? 'Hide widget' : 'Show widget'}
                          >
                            {isEnabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 border-t border-gray-700">
            <button
              onClick={() => setIsExpanded(false)}
              className="w-full px-3 py-2 text-sm text-gray-300 bg-gray-700 rounded hover:bg-gray-600 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WidgetManager;