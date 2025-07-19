import React, { useState, useMemo, useCallback } from 'react';
import { Star, Workflow, FileText, Layers, Play, Edit, Trash2, GripVertical, Settings, X } from 'lucide-react';
import WidgetContainer from './WidgetContainer.jsx';
import CollapsibleSection from '../common/CollapsibleSection.jsx';
import { useUserPreferences } from '../../hooks/useUserPreferences.js';
import { 
  getFolderFavorites, 
  getFolderItems, 
  toggleFolderFavorite,
  updateItemFolderOrder,
  updateFolderFavoriteOrder,
  isItemFavoriteInFolder
} from '../../types/template.types.js';

/**
 * FolderManagementWidget - Displays folder-specific favorites and items with drag-and-drop ordering
 * 
 * Features:
 * - 4 hoofdsecties: Favorites, Workflows, Templates, Snippets
 * - Folder-specifieke filtering
 * - Drag-and-drop reordering per sectie
 * - Auto-save van volgorde wijzigingen
 * - Integration met bestaande functionaliteit
 */
const FolderManagementWidget = ({
  templates = [],
  workflows = [],
  snippets = [],
  selectedFolderId = 'general',
  onExecuteItem = () => {},
  onEditTemplate = () => {},
  onEditWorkflow = () => {},
  onEditSnippet = () => {},
  onDeleteTemplate = () => {},
  onDeleteWorkflow = () => {},
  onDeleteSnippet = () => {},
  onUpdateTemplate = () => {},
  onUpdateWorkflow = () => {},
  onUpdateSnippet = () => {},
  widgetId = 'folder-management-widget',
  onRemove = () => {}
}) => {
  const { dashboard, updateDashboard } = useUserPreferences();
  const [showConfig, setShowConfig] = useState(false);
  const [draggedItem, setDraggedItem] = useState(null);
  const [draggedFromSection, setDraggedFromSection] = useState(null);
  
  // Get widget configuration
  const widgetConfig = dashboard.widgets?.[widgetId] || {
    showFavorites: true,
    showWorkflows: true,
    showTemplates: true,
    showSnippets: true,
    maxItemsPerSection: 10,
    showDescription: true,
    showTags: false
  };

  // Bereken items per sectie met memoization voor performance
  const folderFavorites = useMemo(() => {
    const allItems = [
      ...getFolderFavorites(templates, selectedFolderId).map(t => ({...t, type: 'template'})),
      ...getFolderFavorites(workflows, selectedFolderId).map(w => ({...w, type: 'workflow'})),
      ...getFolderFavorites(snippets, selectedFolderId).map(s => ({...s, type: 'snippet'}))
    ];
    return allItems.sort((a, b) => 
      (a.folderFavorites?.[selectedFolderId]?.favoriteOrder || 0) - 
      (b.folderFavorites?.[selectedFolderId]?.favoriteOrder || 0)
    ).slice(0, widgetConfig.maxItemsPerSection);
  }, [templates, workflows, snippets, selectedFolderId, widgetConfig.maxItemsPerSection]);

  const folderWorkflows = useMemo(() => 
    getFolderItems(workflows, selectedFolderId).slice(0, widgetConfig.maxItemsPerSection), 
    [workflows, selectedFolderId, widgetConfig.maxItemsPerSection]
  );

  const folderTemplates = useMemo(() => 
    getFolderItems(templates, selectedFolderId).slice(0, widgetConfig.maxItemsPerSection), 
    [templates, selectedFolderId, widgetConfig.maxItemsPerSection]
  );

  const folderSnippets = useMemo(() => 
    getFolderItems(snippets, selectedFolderId).slice(0, widgetConfig.maxItemsPerSection), 
    [snippets, selectedFolderId, widgetConfig.maxItemsPerSection]
  );

  // Get type-specific color
  const getTypeColor = (type) => {
    switch (type) {
      case 'workflow':
        return 'bg-green-600 text-green-100';
      case 'template':
        return 'bg-blue-600 text-blue-100';
      case 'snippet':
        return 'bg-purple-600 text-purple-100';
      default:
        return 'bg-gray-600 text-gray-100';
    }
  };

  // Get appropriate handler functions
  const getHandlers = (item) => {
    const type = item.type;
    return {
      onEdit: type === 'workflow' ? onEditWorkflow : 
              type === 'template' ? onEditTemplate : onEditSnippet,
      onDelete: type === 'workflow' ? onDeleteWorkflow : 
                type === 'template' ? onDeleteTemplate : onDeleteSnippet,
      onUpdate: type === 'workflow' ? onUpdateWorkflow :
                type === 'template' ? onUpdateTemplate : onUpdateSnippet
    };
  };

  // Handle item execution
  const handleExecute = useCallback((item) => {
    onExecuteItem({ item, type: item.type });
  }, [onExecuteItem]);

  // Handle favorite toggle
  const handleFavoriteToggle = useCallback((item) => {
    const handlers = getHandlers(item);
    const updatedItem = toggleFolderFavorite(item, selectedFolderId);
    handlers.onUpdate(updatedItem);
  }, [selectedFolderId, getHandlers]);

  // Handle configuration changes
  const handleConfigChange = useCallback((updates) => {
    const newConfig = { ...widgetConfig, ...updates };
    updateDashboard({
      widgets: {
        ...dashboard.widgets,
        [widgetId]: newConfig
      }
    });
  }, [widgetConfig, updateDashboard, dashboard.widgets, widgetId]);

  // Drag and drop handlers (basic setup - will be enhanced in Fase 3)
  const handleDragStart = useCallback((e, item, sectionType) => {
    setDraggedItem(item);
    setDraggedFromSection(sectionType);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDrop = useCallback((e, targetIndex, sectionType) => {
    e.preventDefault();
    // Basic implementation - will be enhanced in Fase 3
    setDraggedItem(null);
    setDraggedFromSection(null);
  }, []);

  // ItemCard component
  const ItemCard = ({ item, type, onExecute, onEdit, onDelete, onFavoriteToggle, sectionType }) => {
    const isFavorite = isItemFavoriteInFolder(item, selectedFolderId);
    const isDragging = draggedItem?.id === item.id;
    
    return (
      <div 
        className={`flex items-center gap-2 p-2 bg-gray-800 rounded border border-gray-700 hover:border-gray-600 transition-colors ${
          isDragging ? 'opacity-50 transform rotate-1' : ''
        }`}
        draggable
        onDragStart={(e) => handleDragStart(e, item, sectionType)}
      >
        <GripVertical className="w-4 h-4 text-gray-500 cursor-grab hover:text-gray-400" />
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`px-2 py-1 text-xs rounded ${getTypeColor(type)}`}>
              {type}
            </span>
            <span className="text-sm font-medium text-gray-100 truncate">
              {item.name}
            </span>
          </div>
          {widgetConfig.showDescription && item.description && (
            <p className="text-xs text-gray-400 truncate">{item.description}</p>
          )}
          {widgetConfig.showTags && item.tags && item.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {item.tags.slice(0, 2).map((tag, index) => (
                <span key={index} className="px-1 py-0.5 bg-gray-700 text-gray-300 rounded text-xs">
                  {tag}
                </span>
              ))}
              {item.tags.length > 2 && (
                <span className="px-1 py-0.5 bg-gray-700 text-gray-300 rounded text-xs">
                  +{item.tags.length - 2}
                </span>
              )}
            </div>
          )}
        </div>
        
        <div className="flex gap-1">
          <button 
            onClick={() => onExecute(item)} 
            className="p-1 text-gray-400 hover:text-green-400 rounded"
            title="Execute"
          >
            <Play className="w-4 h-4" />
          </button>
          <button 
            onClick={() => onEdit(item)} 
            className="p-1 text-gray-400 hover:text-blue-400 rounded"
            title="Edit"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button 
            onClick={() => onFavoriteToggle(item)} 
            className={`p-1 rounded ${isFavorite ? 'text-yellow-400' : 'text-gray-400 hover:text-yellow-400'}`}
            title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Star className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
          </button>
          <button 
            onClick={() => onDelete(item.id)} 
            className="p-1 text-gray-400 hover:text-red-400 rounded"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <WidgetContainer
      widgetId={widgetId}
      title="Folder Management"
      defaultPosition={{ x: 360, y: 20 }}
      defaultSize={{ width: 320, height: 500 }}
      minSize={{ width: 280, height: 300 }}
      maxSize={{ width: 600, height: 800 }}
      isConfigurable={true}
      onConfigure={() => setShowConfig(true)}
      onRemove={onRemove}
      className="folder-management-widget"
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
                Max Items Per Section: {widgetConfig.maxItemsPerSection}
              </label>
              <input
                type="range"
                min="3"
                max="20"
                value={widgetConfig.maxItemsPerSection}
                onChange={(e) => handleConfigChange({ maxItemsPerSection: parseInt(e.target.value) })}
                className="w-full"
              />
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
            
            <div className="space-y-2">
              <h5 className="text-sm font-medium text-gray-200">Visible Sections</h5>
              {[
                { key: 'showFavorites', label: 'Favorites' },
                { key: 'showWorkflows', label: 'Workflows' },
                { key: 'showTemplates', label: 'Templates' },
                { key: 'showSnippets', label: 'Snippets' }
              ].map(({ key, label }) => (
                <label key={key} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={widgetConfig[key]}
                    onChange={(e) => handleConfigChange({ [key]: e.target.checked })}
                    className="rounded border-gray-600 bg-gray-700 text-blue-600"
                  />
                  <span className="text-sm text-gray-300">{label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Widget Content */}
      <div className="space-y-3 h-full overflow-y-auto">
        {/* Favorites Section */}
        {widgetConfig.showFavorites && (
          <CollapsibleSection 
            title="Favorites"
            icon={<Star className="w-4 h-4 text-yellow-400 fill-current" />}
            defaultOpen={true}
            count={folderFavorites.length}
          >
            <div 
              className="space-y-1"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, 0, 'favorites')}
            >
              {folderFavorites.length === 0 ? (
                <div className="text-center py-4 text-gray-400">
                  <Star className="w-6 h-6 mx-auto mb-2 opacity-50" />
                  <p className="text-xs">No favorites in this folder</p>
                </div>
              ) : (
                folderFavorites.map((item) => (
                  <ItemCard
                    key={`fav-${item.type}-${item.id}`}
                    item={item}
                    type={item.type}
                    onExecute={handleExecute}
                    onEdit={getHandlers(item).onEdit}
                    onDelete={getHandlers(item).onDelete}
                    onFavoriteToggle={handleFavoriteToggle}
                    sectionType="favorites"
                  />
                ))
              )}
            </div>
          </CollapsibleSection>
        )}
        
        {/* Workflows Section */}
        {widgetConfig.showWorkflows && (
          <CollapsibleSection 
            title="Workflows"
            icon={<Workflow className="w-4 h-4 text-green-400" />}
            defaultOpen={true}
            count={folderWorkflows.length}
          >
            <div 
              className="space-y-1"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, 0, 'workflows')}
            >
              {folderWorkflows.length === 0 ? (
                <div className="text-center py-4 text-gray-400">
                  <Workflow className="w-6 h-6 mx-auto mb-2 opacity-50" />
                  <p className="text-xs">No workflows in this folder</p>
                </div>
              ) : (
                folderWorkflows.map((item) => (
                  <ItemCard
                    key={`workflow-${item.id}`}
                    item={item}
                    type="workflow"
                    onExecute={handleExecute}
                    onEdit={getHandlers({...item, type: 'workflow'}).onEdit}
                    onDelete={getHandlers({...item, type: 'workflow'}).onDelete}
                    onFavoriteToggle={handleFavoriteToggle}
                    sectionType="workflows"
                  />
                ))
              )}
            </div>
          </CollapsibleSection>
        )}
        
        {/* Templates Section */}
        {widgetConfig.showTemplates && (
          <CollapsibleSection 
            title="Templates"
            icon={<FileText className="w-4 h-4 text-blue-400" />}
            defaultOpen={true}
            count={folderTemplates.length}
          >
            <div 
              className="space-y-1"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, 0, 'templates')}
            >
              {folderTemplates.length === 0 ? (
                <div className="text-center py-4 text-gray-400">
                  <FileText className="w-6 h-6 mx-auto mb-2 opacity-50" />
                  <p className="text-xs">No templates in this folder</p>
                </div>
              ) : (
                folderTemplates.map((item) => (
                  <ItemCard
                    key={`template-${item.id}`}
                    item={item}
                    type="template"
                    onExecute={handleExecute}
                    onEdit={getHandlers({...item, type: 'template'}).onEdit}
                    onDelete={getHandlers({...item, type: 'template'}).onDelete}
                    onFavoriteToggle={handleFavoriteToggle}
                    sectionType="templates"
                  />
                ))
              )}
            </div>
          </CollapsibleSection>
        )}
        
        {/* Snippets Section */}
        {widgetConfig.showSnippets && (
          <CollapsibleSection 
            title="Snippets"
            icon={<Layers className="w-4 h-4 text-purple-400" />}
            defaultOpen={true}
            count={folderSnippets.length}
          >
            <div 
              className="space-y-1"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, 0, 'snippets')}
            >
              {folderSnippets.length === 0 ? (
                <div className="text-center py-4 text-gray-400">
                  <Layers className="w-6 h-6 mx-auto mb-2 opacity-50" />
                  <p className="text-xs">No snippets in this folder</p>
                </div>
              ) : (
                folderSnippets.map((item) => (
                  <ItemCard
                    key={`snippet-${item.id}`}
                    item={item}
                    type="snippet"
                    onExecute={handleExecute}
                    onEdit={getHandlers({...item, type: 'snippet'}).onEdit}
                    onDelete={getHandlers({...item, type: 'snippet'}).onDelete}
                    onFavoriteToggle={handleFavoriteToggle}
                    sectionType="snippets"
                  />
                ))
              )}
            </div>
          </CollapsibleSection>
        )}
      </div>
    </WidgetContainer>
  );
};

export default FolderManagementWidget;