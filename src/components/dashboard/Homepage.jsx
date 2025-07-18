import React, { useEffect, useRef, useMemo, useCallback } from 'react';
import { Plus, Play, Edit, Trash2, Search, Workflow, FileText, Star, Tag, Puzzle, GripVertical } from 'lucide-react';
import { DndContext, DragOverlay, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, rectSortingStrategy } from '@dnd-kit/sortable';
import FolderTree from '../folders/FolderTree.jsx';
import FolderBreadcrumb from '../folders/FolderBreadcrumb.jsx';
import ListView from '../common/ListView.jsx';
import FocusableCard from '../common/FocusableCard.jsx';
import SortableCard from '../common/SortableCard.jsx';
import SortableListItem from '../common/SortableListItem.jsx';
import CollapsibleSection from '../common/CollapsibleSection.jsx';
import AdvancedSearch from '../search/AdvancedSearch.jsx';
import Pagination from '../common/Pagination.jsx';
import FavoritesWidget from '../widgets/FavoritesWidget.jsx';
import useKeyboardNavigation from '../../hooks/useKeyboardNavigation.js';
import usePagination from '../../hooks/usePagination.js';
import useFilters from '../../hooks/useFilters.js';
import useDragAndDrop from '../../hooks/useDragAndDrop.js';
import { useWidgets } from '../../hooks/useWidgets.js';
import { performAdvancedSearch } from '../../utils/searchUtils.js';
import { useUserPreferences } from '../../hooks/useUserPreferences.js';
import { 
  getFolderFavorites, 
  toggleFolderFavorite,
  isItemFavoriteInFolder
} from '../../types/template.types.js';

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
  onUpdateTemplate,
  onUpdateWorkflow, 
  onUpdateSnippet,
  onCreateFolder
}) => {
  // Use preferences system for view mode
  const { layout, updateLayout } = useUserPreferences();
  const viewMode = layout.viewMode;
  
  const setViewMode = (mode) => {
    updateLayout({ viewMode: mode });
  };
  
  // Initialize widgets system
  const { activeWidgets, widgetConfigs } = useWidgets();
  
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

  // Get folder-specific favorites from all items
  const favorites = useMemo(() => {
    const allItems = [];
    
    getFolderFavorites(filteredWorkflows, selectedFolderId).forEach(item => {
      allItems.push({ ...item, type: 'workflow' });
    });
    
    getFolderFavorites(filteredTemplates, selectedFolderId).forEach(item => {
      allItems.push({ ...item, type: 'template' });
    });
    
    getFolderFavorites(filteredSnippets, selectedFolderId).forEach(item => {
      allItems.push({ ...item, type: 'snippet' });
    });
    
    // Sort by favorite order
    return allItems.sort((a, b) => 
      (a.folderFavorites?.[selectedFolderId]?.favoriteOrder || 0) - 
      (b.folderFavorites?.[selectedFolderId]?.favoriteOrder || 0)
    );
  }, [filteredWorkflows, filteredTemplates, filteredSnippets, selectedFolderId]);

  
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

  // Setup drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  );

  // Drag and drop handlers for each section
  const favoritesReorderHandler = useCallback((reorderedItems) => {
    reorderedItems.forEach(item => {
      const itemType = item.type;
      if (itemType === 'workflow') {
        onUpdateWorkflow(item);
      } else if (itemType === 'template') {
        onUpdateTemplate(item);
      } else if (itemType === 'snippet') {
        onUpdateSnippet(item);
      }
    });
  }, [onUpdateWorkflow, onUpdateTemplate, onUpdateSnippet]);

  const workflowsReorderHandler = useCallback((reorderedItems) => {
    reorderedItems.forEach(item => onUpdateWorkflow(item));
  }, [onUpdateWorkflow]);

  const templatesReorderHandler = useCallback((reorderedItems) => {
    reorderedItems.forEach(item => onUpdateTemplate(item));
  }, [onUpdateTemplate]);

  const snippetsReorderHandler = useCallback((reorderedItems) => {
    reorderedItems.forEach(item => onUpdateSnippet(item));
  }, [onUpdateSnippet]);

  // Initialize drag and drop hooks for each section
  const favoritesDragDrop = useDragAndDrop({
    items: favorites,
    onReorder: favoritesReorderHandler,
    sectionType: 'favorites',
    selectedFolderId
  });

  const workflowsDragDrop = useDragAndDrop({
    items: workflowsPagination.currentItems,
    onReorder: workflowsReorderHandler,
    sectionType: 'workflows',
    selectedFolderId
  });

  const templatesDragDrop = useDragAndDrop({
    items: templatesPagination.currentItems,
    onReorder: templatesReorderHandler,
    sectionType: 'templates',
    selectedFolderId
  });

  const snippetsDragDrop = useDragAndDrop({
    items: snippetsPagination.currentItems,
    onReorder: snippetsReorderHandler,
    sectionType: 'snippets',
    selectedFolderId
  });

  // Handle favorite toggle for folder-specific favorites
  const handleFavoriteToggle = useCallback((item, sectionType) => {
    // Determine the item type from either the item itself or the section
    const itemType = item.type || 
      (sectionType === 'workflows' ? 'workflow' :
       sectionType === 'templates' ? 'template' :
       sectionType === 'snippets' ? 'snippet' : 
       'template');
    
    const updatedItem = toggleFolderFavorite(item, selectedFolderId);
    
    // Update the appropriate collection based on item type
    if (itemType === 'workflow') {
      onUpdateWorkflow(updatedItem);
    } else if (itemType === 'template') {
      onUpdateTemplate(updatedItem);
    } else if (itemType === 'snippet') {
      onUpdateSnippet(updatedItem);
    }
  }, [selectedFolderId, onUpdateWorkflow, onUpdateTemplate, onUpdateSnippet]);

  // Create sections with their data in fixed order - always show favorites section
  const sections = [
    { type: 'favorites', data: favorites },
    { type: 'workflows', data: workflowsPagination.currentItems, pagination: workflowsPagination, fullData: filteredWorkflows },
    { type: 'templates', data: templatesPagination.currentItems, pagination: templatesPagination, fullData: filteredTemplates },
    { type: 'snippets', data: snippetsPagination.currentItems, pagination: snippetsPagination, fullData: filteredSnippets }
  ];

  // Create a mapping of global index to section and local index
  const { allItems, sectionIndexMap } = useMemo(() => {
    const items = [];
    const indexMap = new Map();
    let globalIndex = 0;
    
    // Add favorites (always present, even if empty)
    favorites.forEach((item, localIndex) => {
      items.push(item);
      indexMap.set(globalIndex, { section: 'favorites', localIndex, item });
      globalIndex++;
    });
    
    // Add workflows (always present, even if empty)
    workflowsPagination.currentItems.forEach((item, localIndex) => {
      items.push(item);
      indexMap.set(globalIndex, { section: 'workflows', localIndex, item });
      globalIndex++;
    });
    
    // Add templates (always present, even if empty)
    templatesPagination.currentItems.forEach((item, localIndex) => {
      items.push(item);
      indexMap.set(globalIndex, { section: 'templates', localIndex, item });
      globalIndex++;
    });
    
    // Add snippets (always present, even if empty)
    snippetsPagination.currentItems.forEach((item, localIndex) => {
      items.push(item);
      indexMap.set(globalIndex, { section: 'snippets', localIndex, item });
      globalIndex++;
    });
    
    return { allItems: items, sectionIndexMap: indexMap };
  }, [favorites, workflowsPagination.currentItems, templatesPagination.currentItems, snippetsPagination.currentItems]);

  // Set up keyboard navigation
  const keyboardNavigation = useKeyboardNavigation(allItems, {
    layout: viewMode,
    columns: 4,
    onExecute: (item) => onExecuteItem({ item, type: item.type }),
    onSelection: () => {
      // Optional: could add selection highlight here
    }
  });

  // Add global Tab key listener for immediate card focus
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      // Handle Tab key for card navigation
      if (e.key === 'Tab') {
        const activeElement = document.activeElement;
        const isInSearchInput = activeElement?.hasAttribute('data-search-input');
        const isInCard = activeElement?.closest('[data-focusable-card]');
        
        // Skip handling if we're in an input/textarea (except when leaving search)
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
          // Only continue if we're leaving the search input with Tab (not Shift+Tab)
          if (!isInSearchInput || e.shiftKey) {
            return;
          }
        }
        
        // If we have items to navigate
        if (allItems.length > 0) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          
          // Determine next focus position
          if (!keyboardNavigation.isActive && !isInCard) {
            // Not in navigation mode and not in a card - focus first card
            keyboardNavigation.focusItem(0);
          } else if (keyboardNavigation.isActive) {
            // Already navigating - move to next/previous card
            const currentIndex = keyboardNavigation.focusedIndex;
            let nextIndex;
            
            if (e.shiftKey) {
              // Shift+Tab: Move backward
              nextIndex = currentIndex - 1;
              if (nextIndex < 0) {
                // At first card, wrap to last or exit to search
                if (document.querySelector('[data-search-input]')) {
                  // Exit navigation and focus search
                  keyboardNavigation.clearFocus();
                  document.querySelector('[data-search-input]').focus();
                  return;
                } else {
                  // No search, wrap to last card
                  nextIndex = allItems.length - 1;
                }
              }
            } else {
              // Tab: Move forward
              nextIndex = (currentIndex + 1) % allItems.length;
            }
            
            keyboardNavigation.focusItem(nextIndex);
          }
          
          // Ensure main content has focus for keyboard navigation
          if (mainContentRef.current && !mainContentRef.current.contains(document.activeElement)) {
            mainContentRef.current.focus();
          }
        }
      }
    };

    // Add with highest priority capture to intercept before other handlers
    document.addEventListener('keydown', handleGlobalKeyDown, true);
    return () => {
      document.removeEventListener('keydown', handleGlobalKeyDown, true);
    };
  }, [allItems.length, keyboardNavigation]);

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


  // Get the appropriate drag and drop handler for a section
  const getDragDropHandler = useCallback((sectionType) => {
    switch (sectionType) {
      case 'favorites': return favoritesDragDrop;
      case 'workflows': return workflowsDragDrop;
      case 'templates': return templatesDragDrop;
      case 'snippets': return snippetsDragDrop;
      default: return favoritesDragDrop;
    }
  }, [favoritesDragDrop, workflowsDragDrop, templatesDragDrop, snippetsDragDrop]);

  // Render items based on view mode
  const renderItems = useCallback((items, sectionType) => {
    const getEditFunction = (item) => {
      // For favorites and recent sections, use item.type
      if (sectionType === 'favorites' || sectionType === 'recent') {
        return item.type === 'workflow' ? onEditWorkflow : 
               item.type === 'template' ? onEditTemplate : onEditSnippet;
      }
      
      // For specific sections, use sectionType
      return sectionType === 'workflows' ? onEditWorkflow : 
             sectionType === 'templates' ? onEditTemplate : onEditSnippet;
    };

    const getDeleteFunction = (item) => {
      // For favorites and recent sections, use item.type
      if (sectionType === 'favorites' || sectionType === 'recent') {
        return item.type === 'workflow' ? onDeleteWorkflow : 
               item.type === 'template' ? onDeleteTemplate : onDeleteSnippet;
      }
      // For specific sections, use sectionType
      return sectionType === 'workflows' ? onDeleteWorkflow : 
             sectionType === 'templates' ? onDeleteTemplate : onDeleteSnippet;
    };

    const commonProps = {
      items: items,
      type: sectionType === 'workflows' ? 'workflow' : 
            sectionType === 'snippets' ? 'snippet' : 
            sectionType === 'templates' ? 'template' :
            'template', // Default fallback for mixed sections like 'recent' and 'favorites'
      onToggleFavorite: (item) => handleFavoriteToggle(item, sectionType),
      isItemFavorite: (item) => isItemFavoriteInFolder(item, selectedFolderId),
      onExecute: (executeData) => {
        // Handle both old signature (item) and new signature ({ item, type })
        const actualItem = executeData?.item || executeData;
        const executeType = executeData?.type;
        
        // Normalize type for consistency - always convert to singular
        let itemType = executeType || 
          ((sectionType === 'favorites' || sectionType === 'recent') 
            ? actualItem?.type 
            : sectionType);
        
        // Ensure type is singular
        if (itemType && itemType.endsWith('s')) {
          itemType = itemType.slice(0, -1);
        }
        
        // Final safety check - ensure we have both item and type
        if (!actualItem) {
          console.error('❌ Homepage onExecute: actualItem is undefined', { executeData });
          return;
        }
        
        if (!itemType) {
          console.error('❌ Homepage onExecute: itemType is undefined', { 
            executeData, 
            executeType, 
            sectionType, 
            actualItemType: actualItem?.type 
          });
          // Fallback to template if no type can be determined
          itemType = 'template';
        }
        
        onExecuteItem({ item: actualItem, type: itemType });
      },
      onEdit: (item) => {
        const editFunction = getEditFunction(item);
        editFunction(item);
      },
      onDelete: (itemId) => {
        // For sections with mixed types, we need to pass the item to get the right delete function
        const item = items.find(i => i.id === itemId);
        if (item) {
          const deleteFunction = getDeleteFunction(item);
          deleteFunction(itemId);
        }
      },
      keyboardNavigation: {
        ...keyboardNavigation,
        // Override getFocusProps to handle section-specific indexing
        getFocusProps: (localIndex, currentSection) => {
          // Use sectionType as fallback if currentSection is not provided
          const effectiveSection = currentSection || sectionType;
          
          // Find the global index for this item in this section
          let globalIndex = -1;
          for (const [gIndex, mapping] of sectionIndexMap.entries()) {
            if (mapping.section === effectiveSection && mapping.localIndex === localIndex) {
              globalIndex = gIndex;
              break;
            }
          }
          
          const isKeyboardFocused = keyboardNavigation.isActive && keyboardNavigation.focusedIndex === globalIndex;
          
          
          return {
            'data-keyboard-focused': isKeyboardFocused,
            'tabIndex': isKeyboardFocused ? 0 : -1,
            'aria-selected': isKeyboardFocused,
            'role': 'option',
            'aria-setsize': allItems.length,
            'aria-posinset': globalIndex + 1
          };
        }
      }
    };

    const itemIds = items.map(item => item.id);

    // Special handling for favorites and recent sections with mixed item types
    if (sectionType === 'favorites' || sectionType === 'recent') {
      switch (viewMode) {
        case 'list':
          return (
            <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {commonProps.items.map((item, index) => (
                  <SortableListItem key={item.id} id={item.id} item={item}>
                    <ListView 
                      {...commonProps} 
                      items={[item]} 
                      sectionType={sectionType}
                      hideDragHandle={true}
                    />
                  </SortableListItem>
                ))}
              </div>
            </SortableContext>
          );
        case 'grid':
        default:
          return (
            <SortableContext items={itemIds} strategy={rectSortingStrategy}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {commonProps.items.map((item, index) => (
                  <SortableCard
                    key={item.id}
                    id={item.id}
                    item={item}
                    index={index}
                    type={item.type}
                    sectionType={sectionType}
                    onExecute={commonProps.onExecute}
                    onEdit={() => getEditFunction(item)(item)}
                    onDelete={() => getDeleteFunction(item)(item.id)}
                    onToggleFavorite={commonProps.onToggleFavorite}
                    isItemFavorite={commonProps.isItemFavorite}
                    keyboardNavigation={{
                      ...commonProps.keyboardNavigation,
                      getFocusProps: () => commonProps.keyboardNavigation.getFocusProps(index, sectionType)
                    }}
                  />
                ))}
              </div>
            </SortableContext>
          );
      }
    }

    switch (viewMode) {
      case 'list':
        return (
          <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {commonProps.items.map((item, index) => (
                <SortableListItem key={item.id} id={item.id} item={item}>
                  <ListView 
                    {...commonProps} 
                    items={[item]} 
                    sectionType={sectionType}
                    hideDragHandle={true}
                  />
                </SortableListItem>
              ))}
            </div>
          </SortableContext>
        );
      case 'grid':
      default:
        return (
          <SortableContext items={itemIds} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {commonProps.items.map((item, index) => (
                <SortableCard
                  key={item.id}
                  id={item.id}
                  item={item}
                  index={index}
                  {...commonProps}
                  type={commonProps.type}
                  sectionType={sectionType}
                />
              ))}
            </div>
          </SortableContext>
        );
    }
  }, [viewMode, onExecuteItem, onEditWorkflow, onEditTemplate, onEditSnippet, onDeleteWorkflow, onDeleteTemplate, onDeleteSnippet, keyboardNavigation, allItems.length, sectionIndexMap, handleFavoriteToggle, selectedFolderId, getDragDropHandler]);

  const renderSection = useCallback((section, isLast = false) => {
    const { type, data, pagination, fullData } = section;
    
    switch (type) {
      case 'favorites':
        // Only render favorites section if there are favorites
        if (data.length === 0) {
          return null;
        }
        return (
          <CollapsibleSection
            key="favorites"
            sectionId="favorites"
            title="Favorites"
            itemCount={data.length}
            className="mb-6"
          >
            <DndContext 
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={favoritesDragDrop.handleDragStart}
              onDragEnd={favoritesDragDrop.handleDragEnd}
              onDragCancel={favoritesDragDrop.handleDragCancel}
            >
              {renderItems(data, 'favorites')}
              <DragOverlay>
                {favoritesDragDrop.dragOverlay ? (
                  <FocusableCard
                    item={favoritesDragDrop.dragOverlay}
                    type={favoritesDragDrop.dragOverlay.type}
                    isDragOverlay
                  />
                ) : null}
              </DragOverlay>
            </DndContext>
          </CollapsibleSection>
        );

      case 'workflows':
        return (
          <CollapsibleSection
            key="workflows"
            sectionId="workflows"
            title="Workflows"
            itemCount={fullData ? fullData.length : data.length}
            className="mb-6"
            actionButton={
              <button
                onClick={() => onEditWorkflow({})}
                className="
                  p-3 bg-green-600 text-white rounded-lg font-semibold
                  flex items-center justify-center
                  hover:bg-green-700 hover:shadow-lg hover:scale-105
                  focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-opacity-50
                  transition-all duration-200 ease-in-out
                  border border-green-500 hover:border-green-400
                "
                title="New Workflow"
              >
                <Plus className="w-5 h-5" />
              </button>
            }
          >
            <DndContext 
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={workflowsDragDrop.handleDragStart}
              onDragEnd={workflowsDragDrop.handleDragEnd}
              onDragCancel={workflowsDragDrop.handleDragCancel}
            >
              {renderItems(data, 'workflows')}
              <DragOverlay>
                {workflowsDragDrop.dragOverlay ? (
                  <FocusableCard
                    item={workflowsDragDrop.dragOverlay}
                    type="workflow"
                    isDragOverlay
                  />
                ) : null}
              </DragOverlay>
            </DndContext>
            {pagination && (
              <div>
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
            className="mb-6"
            actionButton={
              <button
                onClick={() => onEditTemplate({})}
                className="
                  p-3 bg-blue-600 text-white rounded-lg font-semibold
                  flex items-center justify-center
                  hover:bg-blue-700 hover:shadow-lg hover:scale-105
                  focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50
                  transition-all duration-200 ease-in-out
                  border border-blue-500 hover:border-blue-400
                "
                title="New Template"
              >
                <Plus className="w-5 h-5" />
              </button>
            }
          >
            <DndContext 
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={templatesDragDrop.handleDragStart}
              onDragEnd={templatesDragDrop.handleDragEnd}
              onDragCancel={templatesDragDrop.handleDragCancel}
            >
              {renderItems(data, 'templates')}
              <DragOverlay>
                {templatesDragDrop.dragOverlay ? (
                  <FocusableCard
                    item={templatesDragDrop.dragOverlay}
                    type="template"
                    isDragOverlay
                  />
                ) : null}
              </DragOverlay>
            </DndContext>
            {pagination && (
              <div>
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
            className="mb-6"
            actionButton={
              <button
                onClick={() => onEditSnippet({})}
                className="
                  p-3 bg-purple-600 text-white rounded-lg font-semibold
                  flex items-center justify-center
                  hover:bg-purple-700 hover:shadow-lg hover:scale-105
                  focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-opacity-50
                  transition-all duration-200 ease-in-out
                  border border-purple-500 hover:border-purple-400
                "
                title="New Snippet"
              >
                <Plus className="w-5 h-5" />
              </button>
            }
          >
            <DndContext 
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={snippetsDragDrop.handleDragStart}
              onDragEnd={snippetsDragDrop.handleDragEnd}
              onDragCancel={snippetsDragDrop.handleDragCancel}
            >
              {renderItems(data, 'snippets')}
              <DragOverlay>
                {snippetsDragDrop.dragOverlay ? (
                  <FocusableCard
                    item={snippetsDragDrop.dragOverlay}
                    type="snippet"
                    isDragOverlay
                  />
                ) : null}
              </DragOverlay>
            </DndContext>
            {pagination && (
              <div>
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
          onSettingsClick={() => {
            // Placeholder voor settings - kan later worden geïmplementeerd
            console.log('Settings clicked');
            alert('Settings functionaliteit komt binnenkort!');
          }}
        />
      </div>

      {/* Main Content */}
      <div 
        ref={mainContentRef}
        className="flex-1 overflow-y-auto overflow-x-hidden"
        tabIndex={-1}
        style={{ outline: 'none' }}
      >
        <div className="max-w-7xl mx-auto px-8 py-6">
          {/* Breadcrumb */}
          <div className="mb-6">
            <FolderBreadcrumb
              folders={folders || []}
              currentFolderId={selectedFolderId}
              onFolderSelect={setSelectedFolderId}
            />
          </div>

          {/* Search */}
          <div className="mb-6">
            <AdvancedSearch
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              allItems={[
                ...templates.map(t => ({ ...t, type: 'template' })),
                ...workflows.map(w => ({ ...w, type: 'workflow' })),
                ...snippets.map(s => ({ ...s, type: 'snippet' }))
              ]}
              onFilter={handleAdvancedFilter}
              placeholder="Search templates, workflows, snippets, and tags..."
            />
          </div>

          {/* Dynamic Sections */}
          {sections.map((section, index) => 
            renderSection(section, index === sections.length - 1)
          )}
        </div>
      </div>
      
      {/* Widgets Area */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="relative w-full h-full pointer-events-none">
          {/* Legacy Favorites Widget (if enabled) */}
          {activeWidgets.includes('favorites-widget') && (
            <div className="pointer-events-auto">
              <FavoritesWidget
                templates={templates}
                workflows={workflows}
                snippets={snippets}
                onExecuteItem={onExecuteItem}
                onEditTemplate={onEditTemplate}
                onEditWorkflow={onEditWorkflow}
                onEditSnippet={onEditSnippet}
                onDeleteTemplate={onDeleteTemplate}
                onDeleteWorkflow={onDeleteWorkflow}
                onDeleteSnippet={onDeleteSnippet}
                widgetId="favorites-widget"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Homepage;