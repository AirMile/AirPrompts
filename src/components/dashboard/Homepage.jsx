import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Plus, Play, Edit, Trash2, Search, Workflow, FileText, Star, Tag, Puzzle, GripVertical, Settings } from 'lucide-react';
import FolderTree from '../folders/FolderTree.jsx';
import FolderBreadcrumb from '../folders/FolderBreadcrumb.jsx';
import ViewModeToggle from '../common/ViewModeToggle.jsx';
import ListView from '../common/ListView.jsx';
import CompactView from '../common/CompactView.jsx';
import FocusableCard from '../common/FocusableCard.jsx';
import CollapsibleSection from '../common/CollapsibleSection.jsx';
import AdvancedSearch from '../search/AdvancedSearch.jsx';
import TagFilter from '../filters/TagFilter.jsx';
import Pagination from '../common/Pagination.jsx';
import useKeyboardNavigation from '../../hooks/useKeyboardNavigation.js';
import usePagination from '../../hooks/usePagination.js';
import useFilters from '../../hooks/useFilters.js';
import { performAdvancedSearch } from '../../utils/searchUtils.js';
import { useUserPreferences } from '../../hooks/useUserPreferences.js';

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
  const [draggedItem, setDraggedItem] = useState(null);
  // Use preferences system for view mode and item orders
  const { layout, updateLayout, getItemOrder, setItemOrder } = useUserPreferences();
  const viewMode = layout.viewMode;
  
  const setViewMode = (mode) => {
    updateLayout({ viewMode: mode });
  };
  const mainContentRef = useRef(null);
  
  // Initialize filter system with item collections
  const filterSystem = useFilters({
    templates,
    workflows,
    snippets
  }, {
    persistFilters: true,
    enableTagAnalytics: true,
    cacheResults: true
  });

  // Enhanced filtering with advanced search capabilities and tag filtering
  const getFilteredItems = useCallback((items, itemType) => {
    if (!items || items.length === 0) return [];
    
    // Apply folder filtering first
    const folderFiltered = items.filter(item => {
      // Folder filtering logic
      let folderMatch = false;
      if (!selectedFolderId || selectedFolderId === 'root') {
        // For root folder, only show items that actually belong to root
        folderMatch = !item.folderId || item.folderId === 'root';
      } else if (selectedFolderId === 'home') {
        // For Home folder, show items from root and immediate children, but exclude deep project nesting
        folderMatch = !item.folderId || item.folderId === 'root' || 
          (item.folderId !== 'projects' && item.folderId !== 'ai-character-story' && 
           item.folderId !== 'prompt-website' && item.folderId !== 'rogue-lite-game' &&
           item.folderId !== 'content');
      } else {
        // Only show items that belong directly to the selected folder
        folderMatch = item.folderId === selectedFolderId;
      }
      
      return folderMatch;
    });
    
    // Apply filter system (includes tag filtering, category, favorites, etc.)
    const filterSystemFiltered = filterSystem.applyFilters(folderFiltered, itemType);
    
    // Apply search if there's a search query
    if (!searchQuery || searchQuery.trim() === '') {
      return filterSystemFiltered;
    }
    
    // Use advanced search for better results
    return performAdvancedSearch(filterSystemFiltered, searchQuery, itemType, {
      minScore: 0.1,
      maxResults: 1000,
      sortBy: 'relevance'
    });
  }, [selectedFolderId, searchQuery, filterSystem]);

  const filteredTemplates = useMemo(() => getFilteredItems(templates, 'template'), [templates, getFilteredItems]);

  const filteredWorkflows = useMemo(() => getFilteredItems(workflows, 'workflow'), [workflows, getFilteredItems]);

  const filteredSnippets = useMemo(() => getFilteredItems(snippets, 'snippet'), [snippets, getFilteredItems]);

  // Get favorites from all items
  const favorites = useMemo(() => {
    const allItems = [];
    
    filteredWorkflows.filter(item => item.favorite).forEach(item => {
      allItems.push({ ...item, type: 'workflow' });
    });
    
    filteredTemplates.filter(item => item.favorite).forEach(item => {
      allItems.push({ ...item, type: 'template' });
    });
    
    filteredSnippets.filter(item => item.favorite).forEach(item => {
      allItems.push({ ...item, type: 'snippet' });
    });
    
    return allItems;
  }, [filteredWorkflows, filteredTemplates, filteredSnippets]);

  // Get recently used items
  const recentlyUsed = useMemo(() => {
    const allItems = [];
    
    filteredWorkflows.forEach(item => {
      if (item.lastUsed) {
        allItems.push({ ...item, type: 'workflow' });
      }
    });
    
    filteredTemplates.forEach(item => {
      if (item.lastUsed) {
        allItems.push({ ...item, type: 'template' });
      }
    });
    
    filteredSnippets.forEach(item => {
      if (item.lastUsed) {
        allItems.push({ ...item, type: 'snippet' });
      }
    });
    
    // Sort by lastUsed date (most recent first) and take top 10
    return allItems
      .sort((a, b) => new Date(b.lastUsed) - new Date(a.lastUsed))
      .slice(0, 10);
  }, [filteredWorkflows, filteredTemplates, filteredSnippets]);
  
  // Pagination hooks for each section
  const templatesPagination = usePagination(filteredTemplates, {
    initialPageSize: 12,
    storageKey: `templates_${selectedFolderId || 'global'}`,
    pageSizeOptions: [12, 24, 48, 96]
  });
  
  const workflowsPagination = usePagination(filteredWorkflows, {
    initialPageSize: 12,
    storageKey: `workflows_${selectedFolderId || 'global'}`,
    pageSizeOptions: [12, 24, 48, 96]
  });
  
  const snippetsPagination = usePagination(filteredSnippets, {
    initialPageSize: 12,
    storageKey: `snippets_${selectedFolderId || 'global'}`,
    pageSizeOptions: [12, 24, 48, 96]
  });
  
  // Handle advanced search filter changes
  const handleAdvancedFilter = ({ searchTerm, filters }) => {
    if (searchTerm !== searchQuery) {
      setSearchQuery(searchTerm);
    }
    // Update filter system with new filters
    filterSystem.updateFilters({
      type: filters.type,
      category: filters.category,
      favoriteOnly: filters.favoriteOnly,
      hasContent: filters.hasContent
    });
  };

  // Create sections with their data in fixed order
  const sections = [
    ...(favorites.length > 0 ? [{ type: 'favorites', data: favorites }] : []),
    ...(recentlyUsed.length > 0 ? [{ type: 'recent', data: recentlyUsed }] : []),
    { type: 'workflows', data: workflowsPagination.currentItems, pagination: workflowsPagination, fullData: filteredWorkflows },
    { type: 'templates', data: templatesPagination.currentItems, pagination: templatesPagination, fullData: filteredTemplates },
    { type: 'snippets', data: snippetsPagination.currentItems, pagination: snippetsPagination, fullData: filteredSnippets }
  ];

  // Combine all items for keyboard navigation (use paginated data)
  const allItems = useMemo(() => [
    ...favorites,
    ...recentlyUsed,
    ...workflowsPagination.currentItems,
    ...templatesPagination.currentItems,
    ...snippetsPagination.currentItems
  ], [favorites, recentlyUsed, workflowsPagination.currentItems, templatesPagination.currentItems, snippetsPagination.currentItems]);

  // Set up keyboard navigation
  const keyboardNavigation = useKeyboardNavigation(allItems, {
    layout: viewMode,
    columns: viewMode === 'compact' ? 6 : 4,
    onExecute: (item) => onExecuteItem({ item, type: item.type }),
    onSelection: () => {
      // Optional: could add selection highlight here
    }
  });

  // Add keyboard event listener to main content with throttling for large datasets
  useEffect(() => {
    let throttleTimer = null;
    const isLargeDataset = allItems.length > 100;
    
    const handleKeyDown = (e) => {
      // Only handle keyboard navigation when not in an input field
      if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
        // For large datasets, throttle navigation to improve performance
        if (isLargeDataset && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
          if (throttleTimer) return;
          
          throttleTimer = setTimeout(() => {
            throttleTimer = null;
          }, 50); // 50ms throttle for large datasets
        }
        
        // Handle pagination keyboard shortcuts
        if (e.ctrlKey || e.metaKey) {
          switch (e.key) {
            case 'ArrowLeft':
            case 'ArrowRight':
            case 'Home':
            case 'End':
              // Let pagination hooks handle these
              templatesPagination.handleKeyDown(e);
              workflowsPagination.handleKeyDown(e);
              snippetsPagination.handleKeyDown(e);
              break;
            default:
              keyboardNavigation.handleKeyDown(e);
          }
        } else {
          keyboardNavigation.handleKeyDown(e);
        }
      }
    };

    const mainContent = mainContentRef.current;
    if (mainContent) {
      mainContent.addEventListener('keydown', handleKeyDown);
      return () => {
        mainContent.removeEventListener('keydown', handleKeyDown);
        if (throttleTimer) clearTimeout(throttleTimer);
      };
    }
  }, [keyboardNavigation, templatesPagination, workflowsPagination, snippetsPagination, allItems.length]);

  const resetToDefaultOrder = () => {
    // Reset all section orders for current folder
    const sections = ['workflows', 'templates', 'snippets'];
    sections.forEach(sectionType => {
      setItemOrder(selectedFolderId, sectionType, {});
    });
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
      const currentOrder = getItemOrder(selectedFolderId, targetSectionType);
      
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
      
      // Get current sorted order to calculate correct positions
      const sortedItems = getSortedItems(sectionData, targetSectionType);
      const draggedOrder = sortedItems.findIndex(item => item.id === draggedId);
      const targetOrder = sortedItems.findIndex(item => item.id === targetId);
      
      // Create new order by reassigning all positions
      const newOrderMap = {};
      
      if (draggedOrder !== targetOrder) {
        // Create new arrangement of items
        const newArrangement = [...sortedItems];
        
        // Remove dragged item from current position
        const draggedItemData = newArrangement.splice(draggedOrder, 1)[0];
        
        // Insert at target position
        newArrangement.splice(targetOrder, 0, draggedItemData);
        
        // Assign new order indices
        newArrangement.forEach((item, index) => {
          newOrderMap[item.id] = index;
        });
      }
      
      Object.assign(newOrder, newOrderMap);
      
      setItemOrder(selectedFolderId, targetSectionType, newOrder);
    }
    
    setDraggedItem(null);
  };

  // Sort items within sections
  const getSortedItems = useCallback((items, sectionType) => {
    const currentOrder = getItemOrder(selectedFolderId, sectionType);
    
    return [...items].sort((a, b) => {
      const aOrder = currentOrder[a.id] ?? items.findIndex(item => item.id === a.id);
      const bOrder = currentOrder[b.id] ?? items.findIndex(item => item.id === b.id);
      return aOrder - bOrder;
    });
  }, [selectedFolderId, getItemOrder]);

  // Render items based on view mode
  const renderItems = useCallback((items, sectionType) => {
    const getEditFunction = (item) => {
      if (sectionType === 'favorites') {
        return item.type === 'workflow' ? onEditWorkflow : 
               item.type === 'template' ? onEditTemplate : onEditSnippet;
      }
      return sectionType === 'workflow' ? onEditWorkflow : 
             sectionType === 'template' ? onEditTemplate : onEditSnippet;
    };

    const getDeleteFunction = (item) => {
      if (sectionType === 'favorites') {
        return item.type === 'workflow' ? onDeleteWorkflow : 
               item.type === 'template' ? onDeleteTemplate : onDeleteSnippet;
      }
      return sectionType === 'workflow' ? onDeleteWorkflow : 
             sectionType === 'template' ? onDeleteTemplate : onDeleteSnippet;
    };

    const commonProps = {
      items: getSortedItems(items, sectionType),
      type: sectionType,
      onExecute: onExecuteItem,
      onEdit: getEditFunction,
      onDelete: getDeleteFunction,
      isReorderMode: false, // Disable reordering for favorites
      onDragStart: handleItemDragStart,
      onDragOver: (e) => { e.preventDefault(); e.stopPropagation(); },
      onDrop: handleItemDrop,
      draggedItem,
      keyboardNavigation
    };

    // Special handling for favorites and recent sections with mixed item types
    if (sectionType === 'favorites' || sectionType === 'recent') {
      switch (viewMode) {
        case 'list':
          return (
            <div className="space-y-2">
              {commonProps.items.map((item) => (
                <ListView 
                  key={item.id}
                  items={[item]} 
                  type={item.type}
                  onExecute={commonProps.onExecute}
                  onEdit={() => getEditFunction(item)(item)}
                  onDelete={() => getDeleteFunction(item)(item.id)}
                  isReorderMode={false}
                  onDragStart={commonProps.onDragStart}
                  onDragOver={commonProps.onDragOver}
                  onDrop={commonProps.onDrop}
                  draggedItem={commonProps.draggedItem}
                />
              ))}
            </div>
          );
        case 'compact':
          return (
            <CompactView
              items={commonProps.items}
              type={sectionType}
              onExecute={commonProps.onExecute}
              onEdit={(item) => getEditFunction(item)(item)}
              onDelete={(item) => getDeleteFunction(item)(item.id)}
              isReorderMode={false}
              onDragStart={commonProps.onDragStart}
              onDragOver={commonProps.onDragOver}
              onDrop={commonProps.onDrop}
              draggedItem={commonProps.draggedItem}
              keyboardNavigation={commonProps.keyboardNavigation}
            />
          );
        case 'grid':
        default:
          return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {commonProps.items.map((item, index) => (
                <FocusableCard
                  key={item.id}
                  item={item}
                  index={index}
                  type={item.type}
                  onExecute={commonProps.onExecute}
                  onEdit={() => getEditFunction(item)(item)}
                  onDelete={() => getDeleteFunction(item)(item.id)}
                  isReorderMode={false}
                  onDragStart={commonProps.onDragStart}
                  onDragOver={commonProps.onDragOver}
                  onDrop={commonProps.onDrop}
                  draggedItem={commonProps.draggedItem}
                />
              ))}
            </div>
          );
      }
    }

    switch (viewMode) {
      case 'list':
        return <ListView {...commonProps} />;
      case 'compact':
        return <CompactView {...commonProps} />;
      case 'grid':
      default:
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {commonProps.items.map((item, index) => (
              <FocusableCard
                key={item.id}
                item={item}
                index={index}
                {...commonProps}
              />
            ))}
          </div>
        );
    }
  }, [viewMode, getSortedItems, onExecuteItem, onEditWorkflow, onEditTemplate, onEditSnippet, onDeleteWorkflow, onDeleteTemplate, onDeleteSnippet, draggedItem, keyboardNavigation]);

  const renderSection = useCallback((section, isLast = false) => {
    const { type, data, pagination, fullData } = section;
    
    switch (type) {
      case 'favorites':
        return (
          <CollapsibleSection
            key="favorites"
            sectionId="favorites"
            title="Favorites"
            itemCount={data.length}
            className={`${isLast ? '' : 'mb-8'}`}
          >
            {renderItems(data, 'favorites')}
          </CollapsibleSection>
        );

      case 'recent':
        return (
          <CollapsibleSection
            key="recent"
            sectionId="recent"
            title="Recently Used"
            itemCount={data.length}
            className={`${isLast ? '' : 'mb-8'}`}
          >
            {renderItems(data, 'recent')}
          </CollapsibleSection>
        );

      case 'workflows':
        return (
          <CollapsibleSection
            key="workflows"
            sectionId="workflows"
            title="Workflows"
            itemCount={fullData ? fullData.length : data.length}
            className={`${isLast ? '' : 'mb-8'}`}
          >
            <div className="flex items-center justify-end mb-4">
              <button
                onClick={() => onEditWorkflow({})}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 font-semibold"
              >
                <Plus className="w-4 h-4" />
                New Workflow
              </button>
            </div>
            {renderItems(data, 'workflows')}
            {pagination && (
              <div className="mt-6">
                <Pagination 
                  paginationHook={pagination}
                  showInfo={true}
                  showPageSizeSelector={true}
                  variant="default"
                />
              </div>
            )}
          </CollapsibleSection>
        );

      case 'templates':
        return (
          <CollapsibleSection
            key="templates"
            sectionId="templates"
            title="Templates"
            itemCount={fullData ? fullData.length : data.length}
            className={`${isLast ? '' : 'mb-8'}`}
          >
            <div className="flex items-center justify-end mb-4">
              <button
                onClick={() => onEditTemplate({})}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 font-semibold"
              >
                <Plus className="w-4 h-4" />
                New Template
              </button>
            </div>
            {renderItems(data, 'templates')}
            {pagination && (
              <div className="mt-6">
                <Pagination 
                  paginationHook={pagination}
                  showInfo={true}
                  showPageSizeSelector={true}
                  variant="default"
                />
              </div>
            )}
          </CollapsibleSection>
        );

      case 'snippets':
        return (
          <CollapsibleSection
            key="snippets"
            sectionId="snippets"
            title="Snippets"
            itemCount={fullData ? fullData.length : data.length}
            className={`${isLast ? '' : 'mb-8'}`}
          >
            <div className="flex items-center justify-end mb-4">
              <button
                onClick={() => onEditSnippet({})}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2 font-semibold"
              >
                <Plus className="w-4 h-4" />
                New Snippet
              </button>
            </div>
            {renderItems(data, 'snippets')}
            {pagination && (
              <div className="mt-6">
                <Pagination 
                  paginationHook={pagination}
                  showInfo={true}
                  showPageSizeSelector={true}
                  variant="default"
                />
              </div>
            )}
          </CollapsibleSection>
        );

      default:
        return null;
    }
  }, [renderItems, onEditWorkflow, onEditTemplate, onEditSnippet]);

  return (
    <div className="flex h-screen bg-gray-900">
      {/* Sidebar */}
      <div className="w-72 bg-gray-800 border-r border-gray-700 flex flex-col flex-shrink-0">
        <FolderTree
          folders={folders || []}
          selectedFolderId={selectedFolderId}
          onFolderSelect={setSelectedFolderId}
          onCreateFolder={onCreateFolder}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="max-w-7xl mx-auto px-8 py-6">
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
              <div className="flex-1">
                <AdvancedSearch
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  allItems={[
                    ...templates.map(t => ({ ...t, type: 'template' })),
                    ...workflows.map(w => ({ ...w, type: 'workflow' })),
                    ...snippets.map(s => ({ ...s, type: 'snippet' }))
                  ]}
                  onFilter={handleAdvancedFilter}
                  placeholder="Search templates, workflows, and snippets..."
                />
              </div>
              <ViewModeToggle 
                currentMode={viewMode}
                onModeChange={setViewMode}
              />
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
            
            {/* Tag Filter */}
            {filterSystem.availableTags.length > 0 && (
              <div className="mb-4">
                <TagFilter
                  availableTags={filterSystem.availableTags}
                  selectedTags={filterSystem.selectedTags}
                  onTagsChange={filterSystem.setSelectedTags}
                  filterMode={filterSystem.filterMode}
                  onFilterModeChange={filterSystem.setFilterMode}
                  showFilterCount={true}
                  filterCount={filterSystem.totalFilteredCount}
                  isExpanded={filterSystem.isExpanded}
                  onToggleExpanded={() => filterSystem.setIsExpanded(!filterSystem.isExpanded)}
                  className="bg-gray-800 border border-gray-700 rounded-lg p-4"
                />
              </div>
            )}
            
            {isReorderMode && (
              <div className="bg-blue-900/20 border border-blue-600/30 rounded-lg p-4 mb-4">
                <p className="text-blue-300 text-sm">
                  <strong>Reorder Mode:</strong> Drag and drop cards within each section to change their display order. 
                  This order will be saved for the current folder.
                </p>
              </div>
            )}
          </div>

          {/* Dynamic Sections */}
          {sections.map((section, index) => 
            renderSection(section, index === sections.length - 1)
          )}
        </div>
      </div>
    </div>
  );
};

export default Homepage;