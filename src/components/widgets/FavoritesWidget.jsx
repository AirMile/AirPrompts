import React, { useState } from 'react';
import { Star, Play, Edit, Trash2, Settings, RefreshCw } from 'lucide-react';
import WidgetContainer from './WidgetContainer.jsx';
import { useUserPreferences } from '../../hooks/useUserPreferences.js';

/**
 * FavoritesWidget - Displays favorite templates and workflows
 * 
 * Features:
 * - Shows favorite items from all types (templates, workflows, snippets)
 * - Quick execute functionality
 * - Configurable number of items displayed
 * - Integration with existing favorites system
 * - Real-time updates when favorites change
 */
const FavoritesWidget = ({
  templates = [],
  workflows = [],
  snippets = [],
  onExecuteItem = () => {},
  onEditTemplate = () => {},
  onEditWorkflow = () => {},
  onEditSnippet = () => {},
  onDeleteTemplate = () => {},
  onDeleteWorkflow = () => {},
  onDeleteSnippet = () => {},
  widgetId = 'favorites-widget',
  onRemove = () => {}
}) => {
  const { dashboard, updateDashboard } = useUserPreferences();
  const [showConfig, setShowConfig] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Get widget configuration
  const widgetConfig = dashboard.widgets?.[widgetId] || {
    maxItems: 5,
    showDescription: true,
    showTags: true,
    sortBy: 'name', // 'name', 'recent', 'type'
    filterType: 'all' // 'all', 'templates', 'workflows', 'snippets'
  };

  // Get all favorite items
  const getAllFavorites = () => {
    const allFavorites = [];
    
    // Add favorite workflows
    workflows.filter(item => item.favorite).forEach(item => {
      allFavorites.push({ ...item, type: 'workflow' });
    });
    
    // Add favorite templates
    templates.filter(item => item.favorite).forEach(item => {
      allFavorites.push({ ...item, type: 'template' });
    });
    
    // Add favorite snippets
    snippets.filter(item => item.favorite).forEach(item => {
      allFavorites.push({ ...item, type: 'snippet' });
    });
    
    return allFavorites;
  };

  // Filter and sort favorites
  const getFilteredFavorites = () => {
    let favorites = getAllFavorites();
    
    // Apply type filter
    if (widgetConfig.filterType !== 'all') {
      const targetType = widgetConfig.filterType.slice(0, -1); // Remove 's' from 'templates' -> 'template'
      favorites = favorites.filter(item => item.type === targetType);
    }
    
    // Apply sorting
    switch (widgetConfig.sortBy) {
      case 'recent':
        favorites.sort((a, b) => {
          const aDate = new Date(a.lastUsed || a.updatedAt || 0);
          const bDate = new Date(b.lastUsed || b.updatedAt || 0);
          return bDate - aDate;
        });
        break;
      case 'type':
        favorites.sort((a, b) => {
          if (a.type !== b.type) {
            return a.type.localeCompare(b.type);
          }
          return a.name.localeCompare(b.name);
        });
        break;
      case 'name':
      default:
        favorites.sort((a, b) => a.name.localeCompare(b.name));
        break;
    }
    
    // Limit items
    return favorites.slice(0, widgetConfig.maxItems);
  };

  // Get type-specific color
  const getTypeColor = (type) => {
    switch (type) {
      case 'workflow':
        return 'text-green-400 bg-green-600';
      case 'template':
        return 'text-blue-400 bg-blue-600';
      case 'snippet':
        return 'text-purple-400 bg-purple-600';
      default:
        return 'text-gray-400 bg-gray-600';
    }
  };

  // Get appropriate handler functions
  const getHandlers = (item) => {
    const type = item.type;
    return {
      onEdit: type === 'workflow' ? onEditWorkflow : 
              type === 'template' ? onEditTemplate : onEditSnippet,
      onDelete: type === 'workflow' ? onDeleteWorkflow : 
                type === 'template' ? onDeleteTemplate : onDeleteSnippet
    };
  };

  // Handle item execution
  const handleExecute = (item) => {
    setRefreshing(true);
    onExecuteItem({ item, type: item.type });
    
    // Reset refreshing state after a short delay
    setTimeout(() => setRefreshing(false), 500);
  };

  // Handle configuration changes
  const handleConfigChange = (updates) => {
    const newConfig = { ...widgetConfig, ...updates };
    updateDashboard({
      widgets: {
        ...dashboard.widgets,
        [widgetId]: newConfig
      }
    });
  };

  // Handle widget configuration
  const handleConfigure = () => {
    setShowConfig(true);
  };

  const favorites = getFilteredFavorites();

  return (
    <WidgetContainer
      widgetId={widgetId}
      title="Favorites"
      defaultPosition={{ x: 20, y: 20 }}
      defaultSize={{ width: 320, height: 400 }}
      minSize={{ width: 280, height: 200 }}
      maxSize={{ width: 600, height: 800 }}
      isConfigurable={true}
      onConfigure={handleConfigure}
      onRemove={onRemove}
      className="favorites-widget"
    >
      {/* Configuration Panel */}
      {showConfig && (
        <div className="absolute inset-0 bg-gray-900 bg-opacity-95 z-50 p-4 overflow-auto">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-medium text-gray-100">Widget Configuration</h4>
            <button
              onClick={() => setShowConfig(false)}
              className="text-gray-400 hover:text-gray-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">
                Max Items: {widgetConfig.maxItems}
              </label>
              <input
                type="range"
                min="3"
                max="20"
                value={widgetConfig.maxItems}
                onChange={(e) => handleConfigChange({ maxItems: parseInt(e.target.value) })}
                className="w-full"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">
                Sort By
              </label>
              <select
                value={widgetConfig.sortBy}
                onChange={(e) => handleConfigChange({ sortBy: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100"
              >
                <option value="name">Name</option>
                <option value="recent">Recently Used</option>
                <option value="type">Type</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">
                Filter Type
              </label>
              <select
                value={widgetConfig.filterType}
                onChange={(e) => handleConfigChange({ filterType: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100"
              >
                <option value="all">All Types</option>
                <option value="templates">Templates Only</option>
                <option value="workflows">Workflows Only</option>
                <option value="snippets">Snippets Only</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={widgetConfig.showDescription}
                  onChange={(e) => handleConfigChange({ showDescription: e.target.checked })}
                  className="rounded border-gray-600 bg-gray-700 text-blue-600"
                />
                <span className="text-sm text-gray-300">Show Description</span>
              </label>
              
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={widgetConfig.showTags}
                  onChange={(e) => handleConfigChange({ showTags: e.target.checked })}
                  className="rounded border-gray-600 bg-gray-700 text-blue-600"
                />
                <span className="text-sm text-gray-300">Show Tags</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Widget Content */}
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-400 fill-current" />
            <span className="text-sm font-medium text-gray-300">
              {favorites.length} favorite{favorites.length !== 1 ? 's' : ''}
            </span>
          </div>
          <button
            onClick={() => setRefreshing(true)}
            className={`p-1 text-gray-400 hover:text-gray-200 rounded transition-transform ${
              refreshing ? 'animate-spin' : ''
            }`}
            title="Refresh favorites"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Favorites List */}
        <div className="space-y-2">
          {favorites.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Star className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No favorites found</p>
              <p className="text-xs mt-1">Star some items to see them here</p>
            </div>
          ) : (
            favorites.map((item) => {
              const handlers = getHandlers(item);
              const colorClass = getTypeColor(item.type);
              
              return (
                <div
                  key={`${item.type}-${item.id}`}
                  className="p-3 bg-gray-750 border border-gray-600 rounded-lg hover:border-gray-500 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-1 text-xs rounded-full ${colorClass}`}>
                          {item.type}
                        </span>
                        <h4 className="text-sm font-medium text-gray-100 truncate">
                          {item.name}
                        </h4>
                      </div>
                      
                      {widgetConfig.showDescription && item.description && (
                        <p className="text-xs text-gray-400 mb-2 line-clamp-2">
                          {item.description}
                        </p>
                      )}
                      
                      {widgetConfig.showTags && item.tags && item.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {item.tags.slice(0, 3).map((tag, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-gray-700 text-gray-300 rounded text-xs"
                            >
                              {tag}
                            </span>
                          ))}
                          {item.tags.length > 3 && (
                            <span className="px-2 py-1 bg-gray-700 text-gray-300 rounded text-xs">
                              +{item.tags.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-1 ml-2">
                      <button
                        onClick={() => handleExecute(item)}
                        className="p-1 text-gray-400 hover:text-green-400 rounded"
                        title="Execute"
                      >
                        <Play className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handlers.onEdit(item)}
                        className="p-1 text-gray-400 hover:text-blue-400 rounded"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handlers.onDelete(item.id)}
                        className="p-1 text-gray-400 hover:text-red-400 rounded"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </WidgetContainer>
  );
};

export default FavoritesWidget;