import React, { useState, useMemo } from 'react';
import { Star, Play, Edit, Trash2, Settings, RefreshCw } from 'lucide-react';
import WidgetContainer from './WidgetContainer.jsx';
import { useUserPreferences } from '../../hooks/domain/useUserPreferences.js';
import useProgressiveLoading from '../../hooks/ui/useProgressiveLoading.js';
import { useIntersectionObserver } from '../../hooks/ui/useIntersectionObserver.js';

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

  // Get all favorite items - memoized voor performance
  const getAllFavorites = useMemo(() => {
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
  }, [workflows, templates, snippets]);

  // Filter and sort favorites - memoized voor performance
  const getFilteredFavorites = useMemo(() => {
    let favorites = getAllFavorites;
    
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
  }, [getAllFavorites, widgetConfig.filterType, widgetConfig.sortBy, widgetConfig.maxItems]);

  // Progressive loading voor favorites
  const favoritesProgressive = useProgressiveLoading(getFilteredFavorites, {
    batchSize: 20,
    virtualizationThreshold: 30
  });

  // Intersection observer voor lazy loading
  const { ref: intersectionRef, hasIntersected } = useIntersectionObserver({
    threshold: 0.1
  });

  // Alleen data laden als widget zichtbaar is
  const favorites = hasIntersected ? favoritesProgressive.items : [];

  // Get type-specific color
  const getTypeColor = (type) => {
    switch (type) {
      case 'workflow':
        return 'text-success-400 bg-success-600';
      case 'template':
        return 'text-primary-400 bg-primary-600';
      case 'snippet':
        return 'text-warning-400 bg-warning-600';
      default:
        return 'text-secondary-400 bg-secondary-600';
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

  return (
    <WidgetContainer
      ref={intersectionRef}
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
        <div className="absolute inset-0 glass z-50 p-4 overflow-auto animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-medium text-secondary-100">Widget Configuration</h4>
            <button
              onClick={() => setShowConfig(false)}
              className="btn-ghost btn-sm focus-visible"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="form-label">
                Max Items: {widgetConfig.maxItems}
              </label>
              <input
                type="range"
                min="3"
                max="20"
                value={widgetConfig.maxItems}
                onChange={(e) => handleConfigChange({ maxItems: parseInt(e.target.value) })}
                className="w-full accent-primary-500 focus-visible"
              />
            </div>
            
            <div>
              <label className="form-label">
                Sort By
              </label>
              <select
                value={widgetConfig.sortBy}
                onChange={(e) => handleConfigChange({ sortBy: e.target.value })}
                className="form-select focus-visible"
              >
                <option value="name">Name</option>
                <option value="recent">Recently Used</option>
                <option value="type">Type</option>
              </select>
            </div>
            
            <div>
              <label className="form-label">
                Filter Type
              </label>
              <select
                value={widgetConfig.filterType}
                onChange={(e) => handleConfigChange({ filterType: e.target.value })}
                className="form-select focus-visible"
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
                  className="rounded border-secondary-600 bg-secondary-700 text-blue-600"
                />
                <span className="text-sm text-secondary-300">Show Description</span>
              </label>
              
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={widgetConfig.showTags}
                  onChange={(e) => handleConfigChange({ showTags: e.target.checked })}
                  className="rounded border-secondary-600 bg-secondary-700 text-blue-600"
                />
                <span className="text-sm text-secondary-300">Show Tags</span>
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
            <Star className="w-5 h-5 text-warning-400 fill-current" />
            <span className="text-sm font-medium text-secondary-300">
              <span className="text-warning-400 font-bold">{favorites.length}</span> favorite{favorites.length !== 1 ? 's' : ''}
            </span>
          </div>
          <button
            onClick={() => setRefreshing(true)}
            className={`p-1 text-secondary-400 hover:text-secondary-200 rounded transition-transform ${
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
            <div className="text-center py-8 text-secondary-400">
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
                  className="list-item list-item-interactive animate-slide-in"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`badge ${colorClass.includes('green') ? 'badge-success' : colorClass.includes('blue') ? 'badge-primary' : 'badge-secondary'}`}>
                          {item.type}
                        </span>
                        <h4 className="text-sm font-medium text-secondary-100 truncate">
                          {item.name}
                        </h4>
                      </div>
                      
                      {widgetConfig.showDescription && item.description && (
                        <p className="text-xs text-secondary-400 mb-2 line-clamp-2">
                          {item.description}
                        </p>
                      )}
                      
                      {widgetConfig.showTags && item.tags && item.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {item.tags.slice(0, 3).map((tag, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-secondary-700 text-secondary-300 rounded text-xs"
                            >
                              {tag}
                            </span>
                          ))}
                          {item.tags.length > 3 && (
                            <span className="px-2 py-1 bg-secondary-700 text-secondary-300 rounded text-xs">
                              +{item.tags.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-1.5 ml-2">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleExecute(item);
                        }}
                        className="btn-primary btn-sm focus-visible animate-scale-in"
                        title="Execute"
                      >
                        <Play className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handlers.onEdit(item);
                        }}
                        className="btn-secondary btn-sm focus-visible"
                        title="Edit"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handlers.onDelete(item.id);
                        }}
                        className="btn-danger btn-sm focus-visible"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
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