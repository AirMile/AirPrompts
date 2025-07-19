import React, { useState } from 'react';
import { Clock, Play, Edit, Trash2, X, RefreshCw } from 'lucide-react';
import WidgetContainer from './WidgetContainer.jsx';
import { useUserPreferences } from '../../hooks/useUserPreferences.js';

/**
 * RecentWidget - Displays recently used templates, workflows, and snippets
 * 
 * Features:
 * - Shows recently used items from all types
 * - Configurable time range and item count
 * - Quick execute functionality
 * - Integration with existing recent items system
 * - Real-time updates when items are used
 */
const RecentWidget = ({
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
  widgetId = 'recent-widget',
  onRemove = () => {}
}) => {
  const { dashboard, updateDashboard } = useUserPreferences();
  const [showConfig, setShowConfig] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Get widget configuration
  const widgetConfig = dashboard.widgets?.[widgetId] || {
    maxItems: 10,
    timeRange: 'week', // 'day', 'week', 'month', 'all'
    showDescription: true,
    showLastUsed: true,
    sortBy: 'recent', // 'recent', 'name', 'type'
    filterType: 'all' // 'all', 'templates', 'workflows', 'snippets'
  };

  // Get time range in milliseconds
  const getTimeRangeMs = (range) => {
    const now = Date.now();
    switch (range) {
      case 'day':
        return now - (24 * 60 * 60 * 1000);
      case 'week':
        return now - (7 * 24 * 60 * 60 * 1000);
      case 'month':
        return now - (30 * 24 * 60 * 60 * 1000);
      case 'all':
      default:
        return 0;
    }
  };

  // Get all recent items
  const getAllRecentItems = () => {
    const allItems = [];
    const timeThreshold = getTimeRangeMs(widgetConfig.timeRange);
    
    // Add recent workflows
    workflows.forEach(item => {
      if (item.lastUsed) {
        const lastUsedTime = new Date(item.lastUsed).getTime();
        if (lastUsedTime >= timeThreshold) {
          allItems.push({ ...item, type: 'workflow' });
        }
      }
    });
    
    // Add recent templates
    templates.forEach(item => {
      if (item.lastUsed) {
        const lastUsedTime = new Date(item.lastUsed).getTime();
        if (lastUsedTime >= timeThreshold) {
          allItems.push({ ...item, type: 'template' });
        }
      }
    });
    
    // Add recent snippets
    snippets.forEach(item => {
      if (item.lastUsed) {
        const lastUsedTime = new Date(item.lastUsed).getTime();
        if (lastUsedTime >= timeThreshold) {
          allItems.push({ ...item, type: 'snippet' });
        }
      }
    });
    
    return allItems;
  };

  // Filter and sort recent items
  const getFilteredRecentItems = () => {
    let recentItems = getAllRecentItems();
    
    // Apply type filter
    if (widgetConfig.filterType !== 'all') {
      const targetType = widgetConfig.filterType.slice(0, -1); // Remove 's' from 'templates' -> 'template'
      recentItems = recentItems.filter(item => item.type === targetType);
    }
    
    // Apply sorting
    switch (widgetConfig.sortBy) {
      case 'name':
        recentItems.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'type':
        recentItems.sort((a, b) => {
          if (a.type !== b.type) {
            return a.type.localeCompare(b.type);
          }
          return new Date(b.lastUsed) - new Date(a.lastUsed);
        });
        break;
      case 'recent':
      default:
        recentItems.sort((a, b) => new Date(b.lastUsed) - new Date(a.lastUsed));
        break;
    }
    
    // Limit items
    return recentItems.slice(0, widgetConfig.maxItems);
  };

  // Format time ago
  const formatTimeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
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

  const recentItems = getFilteredRecentItems();

  return (
    <WidgetContainer
      widgetId={widgetId}
      title="Recent Items"
      defaultPosition={{ x: 360, y: 20 }}
      defaultSize={{ width: 320, height: 400 }}
      minSize={{ width: 280, height: 200 }}
      maxSize={{ width: 600, height: 800 }}
      isConfigurable={true}
      onConfigure={handleConfigure}
      onRemove={onRemove}
      className="recent-widget"
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
                min="5"
                max="50"
                value={widgetConfig.maxItems}
                onChange={(e) => handleConfigChange({ maxItems: parseInt(e.target.value) })}
                className="w-full"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">
                Time Range
              </label>
              <select
                value={widgetConfig.timeRange}
                onChange={(e) => handleConfigChange({ timeRange: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100"
              >
                <option value="day">Last 24 Hours</option>
                <option value="week">Last Week</option>
                <option value="month">Last Month</option>
                <option value="all">All Time</option>
              </select>
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
                <option value="recent">Most Recent</option>
                <option value="name">Name</option>
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
                  checked={widgetConfig.showLastUsed}
                  onChange={(e) => handleConfigChange({ showLastUsed: e.target.checked })}
                  className="rounded border-gray-600 bg-gray-700 text-blue-600"
                />
                <span className="text-sm text-gray-300">Show Last Used Time</span>
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
            <Clock className="w-5 h-5 text-blue-400" />
            <span className="text-sm font-medium text-gray-300">
              <span className="text-blue-400 font-bold">{recentItems.length}</span> recent item{recentItems.length !== 1 ? 's' : ''}
            </span>
          </div>
          <button
            onClick={() => setRefreshing(true)}
            className={`p-1 text-gray-400 hover:text-gray-200 rounded transition-transform ${
              refreshing ? 'animate-spin' : ''
            }`}
            title="Refresh recent items"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Recent Items List */}
        <div className="space-y-2">
          {recentItems.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No recent items found</p>
              <p className="text-xs mt-1">
                Items will appear here after you use them
              </p>
            </div>
          ) : (
            recentItems.map((item) => {
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
                      
                      {widgetConfig.showLastUsed && (
                        <div className="flex items-center gap-1 mb-2">
                          <Clock className="w-3 h-3 text-gray-500" />
                          <span className="text-xs text-gray-500">
                            {formatTimeAgo(item.lastUsed)}
                          </span>
                        </div>
                      )}
                      
                      {widgetConfig.showDescription && item.description && (
                        <p className="text-xs text-gray-400 mb-2 line-clamp-2">
                          {item.description}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex gap-1.5 ml-2">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handlers.onEdit(item);
                        }}
                        className="p-2 text-gray-300 bg-gray-700 border border-gray-600 rounded-md hover:bg-gray-600 hover:border-gray-500 flex items-center justify-center transition-all duration-200 hover:shadow-md"
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
                        className="p-2 text-red-400 bg-red-900/20 border border-red-600/50 rounded-md hover:bg-red-900/40 hover:border-red-500 hover:text-red-300 flex items-center justify-center transition-all duration-200 hover:shadow-md"
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

export default RecentWidget;