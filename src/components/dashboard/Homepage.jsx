import React, { useState, useEffect } from 'react';
import { Plus, Play, Edit, Trash2, Search, Workflow, FileText, Star, Tag, Puzzle, GripVertical, Settings } from 'lucide-react';
import FolderTree from '../folders/FolderTree.jsx';
import FolderBreadcrumb from '../folders/FolderBreadcrumb.jsx';

const Homepage = ({ 
  templates, 
  workflows, 
  snippets,
  folders,
  searchQuery,
  setSearchQuery,
  selectedFolderId,
  setSelectedFolderId,
  onEditTemplate, 
  onEditWorkflow, 
  onEditSnippet,
  onExecuteItem,
  onDeleteTemplate,
  onDeleteWorkflow,
  onDeleteSnippet,
  onCreateFolder
}) => {
  const [isReorderMode, setIsReorderMode] = useState(false);
  const [draggedSection, setDraggedSection] = useState(null);
  const [draggedItem, setDraggedItem] = useState(null);
  const [customOrder, setCustomOrder] = useState(() => {
    const saved = localStorage.getItem(`sectionOrder_${selectedFolderId || 'global'}`);
    return saved ? JSON.parse(saved) : { workflows: 1, templates: 2, snippets: 3 };
  });
  const [itemOrders, setItemOrders] = useState(() => {
    const saved = localStorage.getItem(`itemOrders_${selectedFolderId || 'global'}`);
    return saved ? JSON.parse(saved) : {};
  });

  // Save order to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(`sectionOrder_${selectedFolderId || 'global'}`, JSON.stringify(customOrder));
  }, [customOrder, selectedFolderId]);

  useEffect(() => {
    localStorage.setItem(`itemOrders_${selectedFolderId || 'global'}`, JSON.stringify(itemOrders));
  }, [itemOrders, selectedFolderId]);

  // Load order when folder changes
  useEffect(() => {
    const saved = localStorage.getItem(`sectionOrder_${selectedFolderId || 'global'}`);
    if (saved) {
      setCustomOrder(JSON.parse(saved));
    } else {
      setCustomOrder({ workflows: 1, templates: 2, snippets: 3 });
    }
    
    const savedItemOrders = localStorage.getItem(`itemOrders_${selectedFolderId || 'global'}`);
    if (savedItemOrders) {
      setItemOrders(JSON.parse(savedItemOrders));
    } else {
      setItemOrders({});
    }
  }, [selectedFolderId]);
  // Get all descendant folder IDs for the selected folder
  const getFolderDescendants = (folderId) => {
    const descendants = new Set();
    descendants.add(folderId);
    
    const addChildren = (parentId) => {
      const children = (folders || []).filter(f => f.parentId === parentId);
      children.forEach(child => {
        descendants.add(child.id);
        addChildren(child.id);
      });
    };
    
    addChildren(folderId);
    return descendants;
  };

  // Special handling for Home folder to show root content
  const getFilteredItems = (items, getSearchFields) => {
    return (items || []).filter(item => {
      // Folder filtering logic
      let folderMatch = false;
      if (!selectedFolderId || selectedFolderId === 'root') {
        folderMatch = true; // Show all for root
      } else if (selectedFolderId === 'home') {
        // For Home folder, show items from root and immediate children, but exclude deep project nesting
        folderMatch = !item.folderId || item.folderId === 'root' || 
          (item.folderId !== 'projects' && item.folderId !== 'ai-character-story' && 
           item.folderId !== 'prompt-website' && item.folderId !== 'rogue-lite-game' &&
           item.folderId !== 'content');
      } else {
        const currentFolderIds = getFolderDescendants(selectedFolderId);
        folderMatch = currentFolderIds.has(item.folderId);
      }
      
      // Search filtering
      if (searchQuery === '') {
        return folderMatch;
      }
      
      const searchFields = getSearchFields(item);
      const searchMatch = searchFields.some(field => 
        field && field.toLowerCase().includes(searchQuery.toLowerCase())
      );
      
      return folderMatch && searchMatch;
    });
  };

  const filteredTemplates = getFilteredItems(templates, (item) => [item.name, item.description]);

  const filteredWorkflows = getFilteredItems(workflows, (item) => [item.name, item.description]);

  const filteredSnippets = getFilteredItems(snippets, (item) => [item.name, item.description, item.content, ...(item.tags || [])]);

  // Create sections with their data and custom order
  const sections = [
    { type: 'workflows', data: filteredWorkflows, order: customOrder.workflows || 1 },
    { type: 'templates', data: filteredTemplates, order: customOrder.templates || 2 },
    { type: 'snippets', data: filteredSnippets, order: customOrder.snippets || 3 }
  ];

  // Sort sections by custom order
  const sortedSections = sections.sort((a, b) => a.order - b.order);

  // Handle drag and drop for section reordering
  const handleDragStart = (e, sectionType) => {
    setDraggedSection(sectionType);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, targetSectionType) => {
    e.preventDefault();
    
    if (draggedSection && draggedSection !== targetSectionType) {
      const draggedOrder = customOrder[draggedSection];
      const targetOrder = customOrder[targetSectionType];
      
      // Swap the orders
      setCustomOrder(prev => ({
        ...prev,
        [draggedSection]: targetOrder,
        [targetSectionType]: draggedOrder
      }));
    }
    
    setDraggedSection(null);
  };

  const resetToDefaultOrder = () => {
    setCustomOrder({ workflows: 1, templates: 2, snippets: 3 });
    setItemOrders({});
  };

  // Handle item drag and drop
  const handleItemDragStart = (e, item, sectionType) => {
    setDraggedItem({ item, sectionType });
    e.dataTransfer.effectAllowed = 'move';
    e.stopPropagation();
  };

  const handleItemDrop = (e, targetItem, targetSectionType) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (draggedItem && draggedItem.sectionType === targetSectionType && draggedItem.item.id !== targetItem.id) {
      const sectionKey = `${targetSectionType}_${selectedFolderId || 'global'}`;
      const currentOrder = itemOrders[sectionKey] || {};
      
      // Get all items in this section
      let sectionData;
      switch (targetSectionType) {
        case 'workflows': sectionData = filteredWorkflows; break;
        case 'templates': sectionData = filteredTemplates; break;
        case 'snippets': sectionData = filteredSnippets; break;
        default: return;
      }
      
      // Create new order based on target position
      const newOrder = { ...currentOrder };
      const draggedId = draggedItem.item.id;
      const targetId = targetItem.id;
      
      // Remove dragged item order
      const draggedOrder = newOrder[draggedId] || sectionData.findIndex(item => item.id === draggedId);
      const targetOrder = newOrder[targetId] || sectionData.findIndex(item => item.id === targetId);
      
      // Shift other items
      Object.keys(newOrder).forEach(id => {
        const itemOrder = newOrder[id];
        if (id !== draggedId) {
          if (draggedOrder < targetOrder) {
            // Moving down: shift items up
            if (itemOrder > draggedOrder && itemOrder <= targetOrder) {
              newOrder[id] = itemOrder - 1;
            }
          } else {
            // Moving up: shift items down
            if (itemOrder >= targetOrder && itemOrder < draggedOrder) {
              newOrder[id] = itemOrder + 1;
            }
          }
        }
      });
      
      // Set new position for dragged item
      newOrder[draggedId] = targetOrder;
      
      setItemOrders(prev => ({
        ...prev,
        [sectionKey]: newOrder
      }));
    }
    
    setDraggedItem(null);
  };

  // Sort items within sections
  const getSortedItems = (items, sectionType) => {
    const sectionKey = `${sectionType}_${selectedFolderId || 'global'}`;
    const currentOrder = itemOrders[sectionKey] || {};
    
    return [...items].sort((a, b) => {
      const aOrder = currentOrder[a.id] ?? items.findIndex(item => item.id === a.id);
      const bOrder = currentOrder[b.id] ?? items.findIndex(item => item.id === b.id);
      return aOrder - bOrder;
    });
  };

  const renderSection = (section, isLast = false) => {
    const { type, data } = section;
    const isDragging = draggedSection === type;
    const canDrop = draggedSection && draggedSection !== type;
    
    switch (type) {
      case 'workflows':
        return (
          <div 
            className={`${isLast ? '' : 'mb-8'} ${isDragging ? 'opacity-50' : ''} ${canDrop ? 'border-2 border-dashed border-green-500 rounded-lg p-2' : ''}`} 
            key="workflows"
            draggable={isReorderMode}
            onDragStart={(e) => handleDragStart(e, 'workflows')}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, 'workflows')}
          >
            <div className="flex items-center justify-between mb-4">
              {isReorderMode && (
                <div className="flex items-center mr-2 cursor-move">
                  <GripVertical className="w-5 h-5 text-gray-400" />
                </div>
              )}
              <h2 className="text-xl font-semibold text-gray-100 flex items-center gap-2">
                <Workflow className="w-5 h-5 text-gray-300" />
                Workflows ({data.length})
              </h2>
              <button
                onClick={() => onEditWorkflow({})}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 font-semibold"
              >
                <Plus className="w-4 h-4" />
                New Workflow
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {getSortedItems(data, 'workflows').map(workflow => {
                const isDraggingItem = draggedItem?.item.id === workflow.id;
                const canDropHere = draggedItem?.sectionType === 'workflows' && draggedItem?.item.id !== workflow.id;
                
                return (
                <div 
                  key={workflow.id} 
                  className={`bg-gray-800 rounded-lg shadow-md border border-gray-700 p-4 hover:shadow-lg transition-shadow ${
                    isDraggingItem ? 'opacity-50' : ''
                  } ${
                    canDropHere ? 'border-green-400' : ''
                  }`}
                  draggable={isReorderMode}
                  onDragStart={(e) => handleItemDragStart(e, workflow, 'workflows')}
                  onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                  onDrop={(e) => handleItemDrop(e, workflow, 'workflows')}
                >
                  <div className="mb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {isReorderMode && (
                          <GripVertical className="w-4 h-4 text-gray-400 cursor-move" />
                        )}
                        <h3 className="font-semibold text-gray-100 mb-1">{workflow.name}</h3>
                      </div>
                      <div className="flex items-center gap-1">
                        {workflow.favorite && <Star className="w-4 h-4 text-yellow-300 fill-current" />}
                      </div>
                    </div>
                    <p className="text-sm text-gray-300 mb-2">{workflow.description}</p>
                    <div className="text-xs text-gray-400">
                      {workflow.steps?.length || 0} steps
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => onExecuteItem({item: workflow, type: 'workflow'})}
                      className="flex-1 px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center justify-center gap-2 text-sm font-medium"
                    >
                      <Play className="w-4 h-4" />
                      Execute
                    </button>
                    <button
                      onClick={() => onEditWorkflow(workflow)}
                      className="px-3 py-2 text-gray-300 border border-gray-600 rounded-md hover:bg-gray-700 flex items-center justify-center"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDeleteWorkflow(workflow.id)}
                      className="px-3 py-2 text-red-400 border border-red-600 rounded-md hover:bg-red-900 flex items-center justify-center"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                );
              })}
            </div>
          </div>
        );

      case 'templates':
        return (
          <div 
            className={`${isLast ? '' : 'mb-8'} ${isDragging ? 'opacity-50' : ''} ${canDrop ? 'border-2 border-dashed border-blue-500 rounded-lg p-2' : ''}`} 
            key="templates"
            draggable={isReorderMode}
            onDragStart={(e) => handleDragStart(e, 'templates')}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, 'templates')}
          >
            <div className="flex items-center justify-between mb-4">
              {isReorderMode && (
                <div className="flex items-center mr-2 cursor-move">
                  <GripVertical className="w-5 h-5 text-gray-400" />
                </div>
              )}
              <h2 className="text-xl font-semibold text-gray-100 flex items-center gap-2">
                <FileText className="w-5 h-5 text-gray-300" />
                Templates ({data.length})
              </h2>
              <button
                onClick={() => onEditTemplate({})}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 font-semibold"
              >
                <Plus className="w-4 h-4" />
                New Template
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {getSortedItems(data, 'templates').map(template => {
                const isDraggingItem = draggedItem?.item.id === template.id;
                const canDropHere = draggedItem?.sectionType === 'templates' && draggedItem?.item.id !== template.id;
                
                return (
                <div 
                  key={template.id} 
                  className={`bg-gray-800 rounded-lg shadow-md border border-gray-700 p-4 hover:shadow-lg transition-shadow ${
                    isDraggingItem ? 'opacity-50' : ''
                  } ${
                    canDropHere ? 'border-blue-400' : ''
                  }`}
                  draggable={isReorderMode}
                  onDragStart={(e) => handleItemDragStart(e, template, 'templates')}
                  onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                  onDrop={(e) => handleItemDrop(e, template, 'templates')}
                >
                  <div className="mb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {isReorderMode && (
                          <GripVertical className="w-4 h-4 text-gray-400 cursor-move" />
                        )}
                        <h3 className="font-semibold text-gray-100 mb-1">{template.name}</h3>
                      </div>
                      <div className="flex items-center gap-1">
                        {template.favorite && <Star className="w-4 h-4 text-yellow-300 fill-current" />}
                      </div>
                    </div>
                    <p className="text-sm text-gray-300 mb-2">{template.description}</p>
                    <div className="text-xs text-gray-400">
                      {template.variables?.length || 0} variables
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => onExecuteItem({item: template, type: 'template'})}
                      className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center justify-center gap-2 text-sm font-medium"
                    >
                      <Play className="w-4 h-4" />
                      Execute
                    </button>
                    <button
                      onClick={() => onEditTemplate(template)}
                      className="px-3 py-2 text-gray-300 border border-gray-600 rounded-md hover:bg-gray-700 flex items-center justify-center"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDeleteTemplate(template.id)}
                      className="px-3 py-2 text-red-400 border border-red-600 rounded-md hover:bg-red-900 flex items-center justify-center"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                );
              })}
            </div>
          </div>
        );

      case 'snippets':
        return (
          <div 
            className={`${isLast ? '' : 'mb-8'} ${isDragging ? 'opacity-50' : ''} ${canDrop ? 'border-2 border-dashed border-purple-500 rounded-lg p-2' : ''}`} 
            key="snippets"
            draggable={isReorderMode}
            onDragStart={(e) => handleDragStart(e, 'snippets')}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, 'snippets')}
          >
            <div className="flex items-center justify-between mb-4">
              {isReorderMode && (
                <div className="flex items-center mr-2 cursor-move">
                  <GripVertical className="w-5 h-5 text-gray-400" />
                </div>
              )}
              <h2 className="text-xl font-semibold text-gray-100 flex items-center gap-2">
                <Tag className="w-5 h-5 text-gray-300" />
                Snippets ({data.length})
              </h2>
              <button
                onClick={() => onEditSnippet({})}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2 font-semibold"
              >
                <Plus className="w-4 h-4" />
                New Snippet
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {getSortedItems(data, 'snippets').map(snippet => {
                const isDraggingItem = draggedItem?.item.id === snippet.id;
                const canDropHere = draggedItem?.sectionType === 'snippets' && draggedItem?.item.id !== snippet.id;
                
                return (
                <div 
                  key={snippet.id} 
                  className={`bg-gray-800 rounded-lg shadow-md border border-gray-700 p-4 hover:shadow-lg transition-shadow ${
                    isDraggingItem ? 'opacity-50' : ''
                  } ${
                    canDropHere ? 'border-purple-400' : ''
                  }`}
                  draggable={isReorderMode}
                  onDragStart={(e) => handleItemDragStart(e, snippet, 'snippets')}
                  onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                  onDrop={(e) => handleItemDrop(e, snippet, 'snippets')}
                >
                  <div className="mb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {isReorderMode && (
                          <GripVertical className="w-4 h-4 text-gray-400 cursor-move" />
                        )}
                        <h3 className="font-semibold text-gray-100 mb-1">{snippet.name}</h3>
                      </div>
                      <div className="flex items-center gap-1">
                        {snippet.favorite && <Star className="w-4 h-4 text-yellow-300 fill-current" />}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1 mb-2">
                      {(snippet.tags || []).slice(0, 3).map((tag, index) => (
                        <span key={index} className="px-2 py-1 bg-gray-800 text-gray-300 border border-amber-600 rounded text-xs">
                          {tag}
                        </span>
                      ))}
                      {(snippet.tags || []).length > 3 && (
                        <span className="px-2 py-1 bg-gray-700 text-gray-300 rounded text-xs">
                          +{(snippet.tags || []).length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => onExecuteItem({item: snippet, type: 'snippet'})}
                      className="flex-1 px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 flex items-center justify-center gap-2 text-sm font-medium"
                    >
                      <Play className="w-4 h-4" />
                      Execute
                    </button>
                    <button
                      onClick={() => onEditSnippet(snippet)}
                      className="px-3 py-2 text-gray-300 border border-gray-600 rounded-md hover:bg-gray-700 flex items-center justify-center"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDeleteSnippet(snippet.id)}
                      className="px-3 py-2 text-red-400 border border-red-600 rounded-md hover:bg-red-900 flex items-center justify-center"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                );
              })}
            </div>
          </div>
        );


      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen bg-gray-900">
      {/* Sidebar */}
      <div className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col">
        <FolderTree
          folders={folders || []}
          selectedFolderId={selectedFolderId}
          onFolderSelect={setSelectedFolderId}
          onCreateFolder={onCreateFolder}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto p-6">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-100 mb-2">Prompt Templates & Workflows</h1>
            <p className="text-gray-300">Create, manage, and execute prompt templates and multi-step workflows</p>
            
            {/* Breadcrumb */}
            <div className="mt-4">
              <FolderBreadcrumb
                folders={folders || []}
                currentFolderId={selectedFolderId}
                onFolderSelect={setSelectedFolderId}
              />
            </div>
          </div>

          {/* Search and Controls */}
          <div className="mb-8">
            <div className="flex gap-4 items-center mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  id="searchQuery"
                  name="searchQuery"
                  placeholder="Search templates, workflows, and snippets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-600 bg-gray-800 text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent placeholder-gray-400"
                />
              </div>
              <button
                onClick={() => setIsReorderMode(!isReorderMode)}
                className={`px-4 py-3 rounded-lg flex items-center gap-2 font-medium transition-colors ${
                  isReorderMode 
                    ? 'bg-blue-600 text-white hover:bg-blue-700' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                <Settings className="w-4 h-4" />
                {isReorderMode ? 'Done' : 'Reorder'}
              </button>
              {isReorderMode && (
                <button
                  onClick={resetToDefaultOrder}
                  className="px-4 py-3 bg-gray-600 text-gray-300 rounded-lg hover:bg-gray-500 font-medium"
                >
                  Reset Order
                </button>
              )}
            </div>
            {isReorderMode && (
              <div className="bg-blue-900/20 border border-blue-600/30 rounded-lg p-4 mb-4">
                <p className="text-blue-300 text-sm">
                  <strong>Reorder Mode:</strong> Drag and drop the sections below to change their display order. 
                  This order will be saved for the current folder.
                </p>
              </div>
            )}
          </div>

          {/* Dynamic Sections */}
          {sortedSections.map((section, index) => 
            renderSection(section, index === sortedSections.length - 1)
          )}
        </div>
      </div>
    </div>
  );
};

export default Homepage;