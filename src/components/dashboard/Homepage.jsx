import React, { useEffect, useRef, useMemo, useCallback, memo, useState } from 'react';
import { Plus, Play, Edit, Trash2, Search, Workflow, FileText, Star, Tag, Puzzle, GripVertical } from 'lucide-react';
import { DndContext, DragOverlay, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, rectSortingStrategy } from '@dnd-kit/sortable';
import CollapsibleFolderTree from '../folders/CollapsibleFolderTree.jsx';
import FolderBreadcrumb from '../folders/FolderBreadcrumb.jsx';
import ListView from '../common/ListView.jsx';
import FocusableCard from '../common/FocusableCard.jsx';
import SortableCard from '../common/SortableCard.jsx';
import SortableListItem from '../common/SortableListItem.jsx';
import DragCard from '../common/DragCard.jsx';
import CollapsibleSection from '../common/CollapsibleSection.jsx';
import AdvancedSearch from '../search/AdvancedSearch.jsx';
import Pagination from '../common/Pagination.jsx';
import FavoritesWidget from '../widgets/FavoritesWidget.jsx';
import SettingsModal from '../settings/SettingsModal.jsx';
import VirtualizedGrid from '../common/ui/VirtualizedGrid.jsx';
import VirtualizedCard from '../common/VirtualizedCard.jsx';
import OptimizedItemRenderer from '../common/OptimizedItemRenderer.jsx';
import MobileNavigation from '../navigation/MobileNavigation.jsx';
import useKeyboardNavigation from '../../hooks/ui/useKeyboardNavigation.js';
import usePagination from '../../hooks/ui/usePagination.js';
import useFilters from '../../hooks/ui/useFilters.js';
import useDragAndDrop from '../../hooks/ui/useDragAndDrop.js';
import useProgressiveLoading from '../../hooks/ui/useProgressiveLoading.js';
import { useWidgets } from '../../hooks/domain/useWidgets.js';
import useSectionVisibility from '../../hooks/ui/useSectionVisibility.js';
import { performAdvancedSearch } from '../../utils/searchUtils.js';
import { useUserPreferences } from '../../hooks/domain/useUserPreferences.js';
import { useItemColors } from '../../hooks/useItemColors.js';
import { 
  getFolderFavorites, 
  getFolderItems,
  toggleFolderFavorite,
  isItemFavoriteInFolder
} from '../../types/template.types.js';

/**
 * Custom collision detection that restricts dragging to section boundaries
 */
const createBoundedCollisionDetection = (sectionType) => {
  return (args) => {
    // Get the section element
    const sectionElement = document.querySelector(`[data-section-type="${sectionType}"]`);
    if (!sectionElement) {
      return closestCenter(args);
    }

    const sectionRect = sectionElement.getBoundingClientRect();
    const { pointerCoordinates } = args;

    // Check if pointer is within section bounds
    if (
      pointerCoordinates &&
      (pointerCoordinates.x < sectionRect.left ||
       pointerCoordinates.x > sectionRect.right ||
       pointerCoordinates.y < sectionRect.top ||
       pointerCoordinates.y > sectionRect.bottom)
    ) {
      // Pointer is outside section bounds, return empty array to prevent dropping
      return [];
    }

    // Use default collision detection within bounds
    return closestCenter(args);
  };
};

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
  onReorderTemplates,
  onReorderWorkflows,
  onReorderSnippets,
  onCreateFolder,
  onUpdateFolder,
  onDeleteFolder,
  onToggleFolderFavorite
}) => {
  // Use preferences system for view mode
  const { layout, updateLayout } = useUserPreferences();
  const { getColorClasses } = useItemColors();
  const viewMode = layout.viewMode;
  
  const setViewMode = (mode) => {
    updateLayout({ viewMode: mode });
  };
  
  // Initialize widgets system
  const { activeWidgets, widgetConfigs } = useWidgets();
  
  // Settings modal state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // Mobile navigation state
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  
  // Section visibility state
  const favoritesVisibility = useSectionVisibility('favorites', true);
  const workflowsVisibility = useSectionVisibility('workflows', true);
  const templatesVisibility = useSectionVisibility('templates', true);
  const snippetsVisibility = useSectionVisibility('snippets', true);
  
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

  // Helper function to apply folder order sorting
  const applySorting = useCallback((items) => {
    return items.sort((a, b) => 
      (a.folderOrder?.[selectedFolderId] || 0) - (b.folderOrder?.[selectedFolderId] || 0)
    );
  }, [selectedFolderId]);

  // Enhanced filtering with advanced search capabilities and tag filtering
  const getFilteredItems = useCallback((items, itemType) => {
    if (!items || items.length === 0) return [];
    
    // Apply folder filtering first
    const folderFiltered = items.filter(item => {
      // Support both single folderId and multiple folderIds
      let folderMatch = false;
      
      if (!selectedFolderId || selectedFolderId === 'root') {
        // For root folder, show items that belong to root
        if (item.folderIds && item.folderIds.length > 0) {
          folderMatch = item.folderIds.includes('root');
        } else {
          folderMatch = !item.folderId || item.folderId === 'root';
        }
      } else if (selectedFolderId === 'home') {
        // For Home folder, show items from root and immediate children
        if (item.folderIds && item.folderIds.length > 0) {
          folderMatch = item.folderIds.some(id => 
            !id || id === 'root' || 
            (id !== 'projects' && id !== 'ai-character-story' && 
             id !== 'prompt-website' && id !== 'rogue-lite-game' &&
             id !== 'content')
          );
        } else {
          folderMatch = !item.folderId || item.folderId === 'root' || 
            (item.folderId !== 'projects' && item.folderId !== 'ai-character-story' && 
             item.folderId !== 'prompt-website' && item.folderId !== 'rogue-lite-game' &&
             item.folderId !== 'content');
        }
      } else {
        // Check if item belongs to selected folder
        if (item.folderIds && item.folderIds.length > 0) {
          folderMatch = item.folderIds.includes(selectedFolderId);
        } else {
          folderMatch = item.folderId === selectedFolderId;
        }
      }
      
      return folderMatch;
    });
    
    // Apply filter system (includes tag filtering, category, favorites, etc.)
    const filterSystemFiltered = filterSystem.applyFilters(folderFiltered, itemType);
    
    // Apply search if there's a search query
    if (!searchQuery || searchQuery.trim() === '') {
      // Sort by folder order for consistent drag & drop behavior
      return applySorting(filterSystemFiltered);
    }
    
    // Use advanced search for better results, then apply sorting
    const searchResults = performAdvancedSearch(filterSystemFiltered, searchQuery, itemType, {
      minScore: 0.1,
      maxResults: 1000,
      sortBy: 'relevance'
    });
    
    // For search results, apply folder order sorting to maintain drag & drop consistency
    return applySorting(searchResults);
  }, [selectedFolderId, searchQuery, filterSystem, applySorting]);

  const filteredTemplates = useMemo(() => getFilteredItems(templates, 'template'), [templates, getFilteredItems]);

  const filteredWorkflows = useMemo(() => getFilteredItems(workflows, 'workflow'), [workflows, getFilteredItems]);

  const filteredSnippets = useMemo(() => getFilteredItems(snippets, 'snippet'), [snippets, getFilteredItems]);

  // Auto-collapse empty sections
  useEffect(() => {
    if (filteredWorkflows.length === 0 && workflowsVisibility.isVisible) {
      workflowsVisibility.setVisible(false);
    }
  }, [filteredWorkflows.length]);

  useEffect(() => {
    if (filteredTemplates.length === 0 && templatesVisibility.isVisible) {
      templatesVisibility.setVisible(false);
    }
  }, [filteredTemplates.length]);

  useEffect(() => {
    if (filteredSnippets.length === 0 && snippetsVisibility.isVisible) {
      snippetsVisibility.setVisible(false);
    }
  }, [filteredSnippets.length]);

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

  // Auto-collapse empty favorites section
  useEffect(() => {
    if (favorites.length === 0 && favoritesVisibility.isVisible) {
      favoritesVisibility.setVisible(false);
    }
  }, [favorites.length]);
  
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

  // Progressive loading voor performance optimization
  const templatesProgressive = useProgressiveLoading(filteredTemplates, {
    batchSize: 50,
    virtualizationThreshold: 100
  });
  
  const workflowsProgressive = useProgressiveLoading(filteredWorkflows, {
    batchSize: 50,
    virtualizationThreshold: 100
  });
  
  const snippetsProgressive = useProgressiveLoading(filteredSnippets, {
    batchSize: 50,
    virtualizationThreshold: 100
  });

  const favoritesProgressive = useProgressiveLoading(favorites, {
    batchSize: 30,
    virtualizationThreshold: 60
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
    // Update the complete workflows array with the reordered items
    const updatedWorkflows = workflows.map(workflow => {
      const reorderedItem = reorderedItems.find(item => item.id === workflow.id);
      return reorderedItem || workflow;
    });
    onReorderWorkflows(updatedWorkflows);
  }, [workflows, onReorderWorkflows]);

  const templatesReorderHandler = useCallback((reorderedItems) => {
    // Update the complete templates array with the reordered items
    const updatedTemplates = templates.map(template => {
      const reorderedItem = reorderedItems.find(item => item.id === template.id);
      return reorderedItem || template;
    });
    onReorderTemplates(updatedTemplates);
  }, [templates, onReorderTemplates]);

  const snippetsReorderHandler = useCallback((reorderedItems) => {
    // Update the complete snippets array with the reordered items
    const updatedSnippets = snippets.map(snippet => {
      const reorderedItem = reorderedItems.find(item => item.id === snippet.id);
      return reorderedItem || snippet;
    });
    onReorderSnippets(updatedSnippets);
  }, [snippets, onReorderSnippets]);

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
    
    // Check if item is currently a favorite in this folder
    const isFavorite = isItemFavoriteInFolder(item, selectedFolderId);
    
    // Toggle favorite using the API mutation
    if (onToggleFolderFavorite && onToggleFolderFavorite.mutate) {
      onToggleFolderFavorite.mutate({
        entityType: itemType,
        entityId: item.id,
        folderId: selectedFolderId,
        isFavorite: !isFavorite,
        favoriteOrder: item.folderFavorites?.[selectedFolderId]?.favoriteOrder || 0
      });
    }
    
    // Also update the item locally for optimistic updates
    const updatedItem = toggleFolderFavorite(item, selectedFolderId);
    
    // Update the appropriate collection based on item type
    if (itemType === 'workflow') {
      onUpdateWorkflow(updatedItem);
    } else if (itemType === 'template') {
      onUpdateTemplate(updatedItem);
    } else if (itemType === 'snippet') {
      onUpdateSnippet(updatedItem);
    }
  }, [selectedFolderId, onUpdateWorkflow, onUpdateTemplate, onUpdateSnippet, onToggleFolderFavorite]);

  // Create sections with their data in fixed order - always show favorites section
  const sections = [
    { type: 'favorites', data: favorites },
    { type: 'workflows', data: workflowsPagination.currentItems, pagination: workflowsPagination, fullData: filteredWorkflows },
    { type: 'templates', data: templatesPagination.currentItems, pagination: templatesPagination, fullData: filteredTemplates },
    { type: 'snippets', data: snippetsPagination.currentItems, pagination: snippetsPagination, fullData: filteredSnippets }
  ];

  // Create a mapping of global index to section and local index, only including visible sections
  const { allItems, sectionIndexMap } = useMemo(() => {
    const items = [];
    const indexMap = new Map();
    let globalIndex = 0;
    
    // Add favorites only if section is visible and has items
    if (favoritesVisibility.isVisible && favorites.length > 0) {
      favorites.forEach((item, localIndex) => {
        items.push(item);
        indexMap.set(globalIndex, { section: 'favorites', localIndex, item });
        globalIndex++;
      });
    }
    
    // Add workflows only if section is visible
    if (workflowsVisibility.isVisible) {
      workflowsPagination.currentItems.forEach((item, localIndex) => {
        items.push(item);
        indexMap.set(globalIndex, { section: 'workflows', localIndex, item });
        globalIndex++;
      });
    }
    
    // Add templates only if section is visible
    if (templatesVisibility.isVisible) {
      templatesPagination.currentItems.forEach((item, localIndex) => {
        items.push(item);
        indexMap.set(globalIndex, { section: 'templates', localIndex, item });
        globalIndex++;
      });
    }
    
    // Add snippets only if section is visible
    if (snippetsVisibility.isVisible) {
      snippetsPagination.currentItems.forEach((item, localIndex) => {
        items.push(item);
        indexMap.set(globalIndex, { section: 'snippets', localIndex, item });
        globalIndex++;
      });
    }
    
    return { allItems: items, sectionIndexMap: indexMap };
  }, [
    favorites.length, 
    workflowsPagination.currentItems.length,
    workflowsPagination.currentPage,
    templatesPagination.currentItems.length,
    templatesPagination.currentPage,
    snippetsPagination.currentItems.length,
    snippetsPagination.currentPage,
    favoritesVisibility.isVisible,
    workflowsVisibility.isVisible,
    templatesVisibility.isVisible,
    snippetsVisibility.isVisible,
    selectedFolderId
  ]);

  // Helper function to get global index for an item in a specific section
  const getGlobalIndex = useCallback((sectionType, localIndex) => {
    // Find the item in the sectionIndexMap
    for (const [globalIndex, mapEntry] of sectionIndexMap) {
      if (mapEntry.section === sectionType && mapEntry.localIndex === localIndex) {
        return globalIndex;
      }
    }
    return -1; // Not found (section might be collapsed)
  }, [sectionIndexMap]);


  // Set up keyboard navigation
  const keyboardNavigation = useKeyboardNavigation(allItems, {
    layout: viewMode,
    columns: 4,
    onExecute: (item) => onExecuteItem({ item, type: item.type }),
    onSelection: () => {
      // Optional: could add selection highlight here
    }
  });

  // Smart focus preservation when sections visibility changes
  // TEMPORARILY DISABLED to fix infinite loop - will re-enable with proper logic
  
  /*
  const previousAllItems = useRef(allItems);
  const previousVisibilityState = useRef({
    favorites: favoritesVisibility.isVisible,
    workflows: workflowsVisibility.isVisible,
    templates: templatesVisibility.isVisible,
    snippets: snippetsVisibility.isVisible
  });
  
  useEffect(() => {
    const oldItems = previousAllItems.current;
    const currentVisibilityState = {
      favorites: favoritesVisibility.isVisible,
      workflows: workflowsVisibility.isVisible,
      templates: templatesVisibility.isVisible,
      snippets: snippetsVisibility.isVisible
    };
    const oldVisibilityState = previousVisibilityState.current;
    
    // Check if visibility actually changed (not just focus index)
    const visibilityChanged = JSON.stringify(currentVisibilityState) !== JSON.stringify(oldVisibilityState);
    
    // Only handle if section visibility actually changed and we're actively navigating
    if (visibilityChanged && keyboardNavigation.isActive && oldItems.length !== allItems.length) {
      // Use smart focus preservation
      if (keyboardNavigation.handleItemsChange) {
        keyboardNavigation.handleItemsChange(allItems, oldItems, keyboardNavigation.focusedIndex);
      }
    }
    
    // Update refs for next comparison
    previousAllItems.current = allItems;
    previousVisibilityState.current = currentVisibilityState;
  }, [
    allItems.length, // Only length, not full array
    favoritesVisibility.isVisible,
    workflowsVisibility.isVisible,
    templatesVisibility.isVisible,
    snippetsVisibility.isVisible,
    keyboardNavigation.isActive
  ]);
  */
  
  // Simplified focus tracking
  const [focusState, setFocusState] = useState({
    itemId: null,
    section: null,
    index: -1,
    expandedSections: new Set()
  });
  const isProgrammaticFocusRef = useRef(false);
  const previousItemsLengthRef = useRef(allItems.length);

  // Single effect to handle focus preservation when sections change
  useEffect(() => {
    if (!keyboardNavigation.isActive) {
      setFocusState({ itemId: null, section: null, index: -1 });
      return;
    }

    const currentIndex = keyboardNavigation.focusedIndex;
    const currentItem = allItems[currentIndex];
    const currentSection = sectionIndexMap.get(currentIndex)?.section;
    const previousLength = previousItemsLengthRef.current;

    // Items array changed (section collapsed/expanded)
    if (previousLength !== allItems.length && previousLength > 0) {
      // Check if a section was expanded (items added)
      if (allItems.length > previousLength) {
        // Track which sections are currently visible
        const visibleSections = new Set();
        for (const [, entry] of sectionIndexMap) {
          visibleSections.add(entry.section);
        }
        
        // Determine which section was just expanded
        let newlyExpandedSection = null;
        
        // Check each possible section
        if (!focusState.expandedSections?.has('favorites') && visibleSections.has('favorites') && favoritesVisibility.isVisible) {
          newlyExpandedSection = 'favorites';
        } else if (!focusState.expandedSections?.has('workflows') && visibleSections.has('workflows') && workflowsVisibility.isVisible) {
          newlyExpandedSection = 'workflows';
        } else if (!focusState.expandedSections?.has('templates') && visibleSections.has('templates') && templatesVisibility.isVisible) {
          newlyExpandedSection = 'templates';
        } else if (!focusState.expandedSections?.has('snippets') && visibleSections.has('snippets') && snippetsVisibility.isVisible) {
          newlyExpandedSection = 'snippets';
        }
        
        // If we found a newly expanded section, focus on its first item
        if (newlyExpandedSection) {
          // Find the first item of the newly expanded section
          for (const [index, entry] of sectionIndexMap) {
            if (entry.section === newlyExpandedSection && entry.localIndex === 0) {
              isProgrammaticFocusRef.current = true;
              keyboardNavigation.focusItem(index);
              setTimeout(() => { isProgrammaticFocusRef.current = false; }, 0);
              
              const newItem = allItems[index];
              if (newItem) {
                setFocusState({
                  itemId: newItem.id,
                  section: newlyExpandedSection,
                  index: index,
                  expandedSections: visibleSections
                });
              }
              previousItemsLengthRef.current = allItems.length;
              return;
            }
          }
        }
      }
      
      // Check if focused item still exists in its section (for collapse case)
      const itemStillExists = focusState.itemId && 
        findItemIndexInSection(focusState.itemId, focusState.section) >= 0;

      if (!itemStillExists && focusState.itemId) {
        // Section collapsed - find alternative
        const bestIndex = findBestFocusAlternative(
          allItems,
          focusState.index,
          [],
          focusState.section
        );
        
        isProgrammaticFocusRef.current = true;
        keyboardNavigation.focusItem(bestIndex);
        setTimeout(() => { isProgrammaticFocusRef.current = false; }, 0);
        
        // Update to new position
        const newItem = allItems[bestIndex];
        if (newItem) {
          setFocusState({
            itemId: newItem.id,
            section: sectionIndexMap.get(bestIndex)?.section,
            index: bestIndex
          });
        }
        previousItemsLengthRef.current = allItems.length;
        return;
      }
    }

    // Update tracking for normal navigation
    if (!isProgrammaticFocusRef.current && currentItem) {
      const visibleSections = new Set();
      for (const [, entry] of sectionIndexMap) {
        visibleSections.add(entry.section);
      }
      
      setFocusState({
        itemId: currentItem.id,
        section: currentSection,
        index: currentIndex,
        expandedSections: visibleSections
      });
    }
    
    previousItemsLengthRef.current = allItems.length;
  }, [
    keyboardNavigation.focusedIndex,
    keyboardNavigation.isActive,
    allItems,
    sectionIndexMap,
    focusState.itemId,
    focusState.section,
    focusState.index
  ]);

  // Helper function to find item index in specific section (to handle ID collisions)
  const findItemIndexInSection = (itemId, targetSection) => {
    if (!itemId || !targetSection) return -1;
    
    // First check if the target section actually exists in the map
    const sectionsInMap = Array.from(sectionIndexMap.values()).map(entry => entry.section);
    const uniqueSections = [...new Set(sectionsInMap)];
    const targetSectionExists = uniqueSections.includes(targetSection);
    
    // If target section doesn't exist in the map, return -1 immediately
    if (!targetSectionExists) {
      return -1;
    }
    
    // Search through the sectionIndexMap to find the item in the specified section
    for (const [globalIndex, mapEntry] of sectionIndexMap) {
      if (mapEntry.section === targetSection && mapEntry.item.id === itemId) {
        return globalIndex;
      }
    }
    
    return -1;
  };

  // Helper function to count removed items before a certain index
  const countRemovedItemsBefore = (oldItems, newItems, focusedIndex) => {
    let removedBefore = 0;
    for (let i = 0; i < focusedIndex && i < oldItems.length; i++) {
      const wasRemoved = !newItems.find(newItem => newItem.id === oldItems[i].id);
      if (wasRemoved) removedBefore++;
    }
    return removedBefore;
  };

  // Helper function to find best alternative focus position with section awareness
  const findBestFocusAlternative = (newItems, previousIndex, previousItems, previousSection = null) => {
    if (newItems.length === 0) return -1;
    
    const previousItem = previousItems[previousIndex];
    
    // First strategy: if the same item exists, try to preserve section context
    if (previousItem) {
      // Look for the same item ID in the new items array, preferring the same section
      const allMatches = [];
      newItems.forEach((item, index) => {
        if (item.id === previousItem.id) {
          const itemSection = sectionIndexMap.get(index)?.section;
          allMatches.push({ index, section: itemSection });
        }
      });
      
      if (allMatches.length > 0) {
        // Prefer match in the same section as before
        const sameSectionMatch = allMatches.find(match => match.section === previousSection);
        const chosenMatch = sameSectionMatch || allMatches[0]; // fallback to first match
        
        return chosenMatch.index;
      }
    }
    
    // Second strategy: When item is removed (e.g., section collapsed), find nearest item
    // First check if the previous section still exists
    const sectionStillExists = Array.from(sectionIndexMap.values()).some(entry => entry.section === previousSection);
    
    if (!sectionStillExists && previousSection) {
      // The entire section was removed, find the next available item after that section
      // Get section order from the visible sections
      const visibleSections = [];
      const seenSections = new Set();
      for (const [index, entry] of sectionIndexMap) {
        if (!seenSections.has(entry.section)) {
          visibleSections.push(entry.section);
          seenSections.add(entry.section);
        }
      }
      
      // Find the best alternative when entire section is removed
      // Strategy: prefer items in sections that come after the removed section
      
      // Define section order
      const sectionOrder = ['favorites', 'workflows', 'templates', 'snippets'];
      const removedSectionIndex = sectionOrder.indexOf(previousSection);
      
      let bestIndex = -1;
      let bestSectionIndex = -1;
      let bestDistance = Infinity;
      
      // First pass: Look for items in sections that come after the removed section
      newItems.forEach((item, index) => {
        const itemSection = sectionIndexMap.get(index)?.section;
        const itemSectionIndex = sectionOrder.indexOf(itemSection);
        
        if (itemSectionIndex > removedSectionIndex) {
          // This item is in a section after the removed one
          const distance = Math.abs(index - previousIndex);
          if (bestSectionIndex === -1 || itemSectionIndex < bestSectionIndex || 
              (itemSectionIndex === bestSectionIndex && distance < bestDistance)) {
            bestIndex = index;
            bestSectionIndex = itemSectionIndex;
            bestDistance = distance;
          }
        }
      });
      
      // If no items found in later sections, look in earlier sections
      if (bestIndex === -1) {
        newItems.forEach((item, index) => {
          const itemSection = sectionIndexMap.get(index)?.section;
          const itemSectionIndex = sectionOrder.indexOf(itemSection);
          
          if (itemSectionIndex < removedSectionIndex && itemSectionIndex >= 0) {
            const distance = Math.abs(index - previousIndex);
            if (bestSectionIndex === -1 || 
                (removedSectionIndex - itemSectionIndex < removedSectionIndex - bestSectionIndex) ||
                (itemSectionIndex === bestSectionIndex && distance < bestDistance)) {
              bestIndex = index;
              bestSectionIndex = itemSectionIndex;
              bestDistance = distance;
            }
          }
        });
      }
      
      // Fallback: if still no match (shouldn't happen), take the closest item
      if (bestIndex === -1) {
        bestIndex = Math.min(previousIndex, newItems.length - 1);
      }
      
      return bestIndex;
    }
    
    // Second strategy: find the item that would be at the same visual position
    // Count how many items before the previous index were removed
    const removedBefore = countRemovedItemsBefore(previousItems, newItems, previousIndex);
    
    // Calculate target index - where the focus would naturally flow to
    let targetIndex = previousIndex - removedBefore;
    
    // If target goes beyond array, use last item
    if (targetIndex >= newItems.length) {
      targetIndex = newItems.length - 1;
    }
    
    // Ensure within bounds
    targetIndex = Math.max(0, targetIndex);
    
    const targetItem = newItems[targetIndex];
    const targetSection = sectionIndexMap.get(targetIndex)?.section;
    
    // Additional check: if the target item has the same ID as items in multiple sections,
    // try to find it in a section that makes more sense given the context
    if (targetItem && previousSection) {
      const allTargetMatches = [];
      newItems.forEach((item, index) => {
        if (item.id === targetItem.id) {
          const itemSection = sectionIndexMap.get(index)?.section;
          allTargetMatches.push({ index, section: itemSection });
        }
      });
      
      if (allTargetMatches.length > 1) {
        // Define section priority when previous section is removed
        const sectionOrder = ['favorites', 'workflows', 'templates', 'snippets'];
        const previousSectionIndex = sectionOrder.indexOf(previousSection);
        
        // Strategy: Avoid favorites unless it's the only option or we came from favorites
        let bestMatch = null;
        
        // First, try to find a match in a non-favorites section
        const nonFavoritesMatches = allTargetMatches.filter(match => match.section !== 'favorites');
        if (nonFavoritesMatches.length > 0) {
          // Among non-favorites, prefer the section closest to the previous section
          bestMatch = nonFavoritesMatches.reduce((best, current) => {
            const bestSectionIndex = sectionOrder.indexOf(best.section);
            const currentSectionIndex = sectionOrder.indexOf(current.section);
            const bestDistance = Math.abs(bestSectionIndex - previousSectionIndex);
            const currentDistance = Math.abs(currentSectionIndex - previousSectionIndex);
            return currentDistance < bestDistance ? current : best;
          });
        } else {
          // Only favorites available, use it
          bestMatch = allTargetMatches[0];
        }
        
        return bestMatch.index;
      }
    }
    
    return targetIndex;
  };

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
          } else {
            keyboardNavigation.focusItem(0);
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
  }, [allItems.length, keyboardNavigation.isActive, keyboardNavigation.focusedIndex, keyboardNavigation.focusItem, keyboardNavigation.clearFocus]);

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
  }, [keyboardNavigation.handleKeyDown, templatesPagination.handleKeyDown, workflowsPagination.handleKeyDown, snippetsPagination.handleKeyDown, allItems.length]);


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
          return;
        }
        
        if (!itemType) {
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
      keyboardNavigation
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
                      keyboardNavigation={{
                        ...commonProps.keyboardNavigation,
                        getFocusProps: () => {
                          // Calculate the global index for this card using the helper
                          const globalIndex = getGlobalIndex(sectionType, index);
                          const isKeyboardFocused = keyboardNavigation.isActive && keyboardNavigation.focusedIndex === globalIndex;
                          
                          return {
                            'data-keyboard-focused': isKeyboardFocused,
                            'tabIndex': isKeyboardFocused ? 0 : -1,
                            'aria-selected': isKeyboardFocused,
                            'role': 'option',
                            'aria-setsize': allItems.length,
                            'aria-posinset': globalIndex >= 0 ? globalIndex + 1 : -1
                          };
                        }
                      }}
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
                      getFocusProps: () => {
                        // Calculate the global index for this card using the helper
                        const globalIndex = getGlobalIndex(sectionType, index);
                        const isKeyboardFocused = keyboardNavigation.isActive && keyboardNavigation.focusedIndex === globalIndex;
                        
                        return {
                          'data-keyboard-focused': isKeyboardFocused,
                          'tabIndex': isKeyboardFocused ? 0 : -1,
                          'aria-selected': isKeyboardFocused,
                          'role': 'option',
                          'aria-setsize': allItems.length,
                          'aria-posinset': globalIndex >= 0 ? globalIndex + 1 : -1
                        };
                      }
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
                    keyboardNavigation={{
                      ...commonProps.keyboardNavigation,
                      getFocusProps: () => {
                        // Calculate the global index for this card using the helper
                        const globalIndex = getGlobalIndex(sectionType, index);
                        const isKeyboardFocused = keyboardNavigation.isActive && keyboardNavigation.focusedIndex === globalIndex;
                        
                        return {
                          'data-keyboard-focused': isKeyboardFocused,
                          'tabIndex': isKeyboardFocused ? 0 : -1,
                          'aria-selected': isKeyboardFocused,
                          'role': 'option',
                          'aria-setsize': allItems.length,
                          'aria-posinset': globalIndex >= 0 ? globalIndex + 1 : -1
                        };
                      }
                    }}
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
                    getFocusProps: () => {
                      // Calculate the global index for this card using the helper
                      const globalIndex = getGlobalIndex(sectionType, index);
                      const isKeyboardFocused = keyboardNavigation.isActive && keyboardNavigation.focusedIndex === globalIndex;
                      
                      return {
                        'data-keyboard-focused': isKeyboardFocused,
                        'tabIndex': isKeyboardFocused ? 0 : -1,
                        'aria-selected': isKeyboardFocused,
                        'role': 'option',
                        'aria-setsize': allItems.length,
                        'aria-posinset': globalIndex >= 0 ? globalIndex + 1 : -1
                      };
                    }
                  }}
                />
              ))}
            </div>
          </SortableContext>
        );
    }
  }, [viewMode, onExecuteItem, onEditWorkflow, onEditTemplate, onEditSnippet, onDeleteWorkflow, onDeleteTemplate, onDeleteSnippet, keyboardNavigation, allItems.length, sectionIndexMap, handleFavoriteToggle, selectedFolderId, getGlobalIndex]);

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
            externalVisible={favoritesVisibility.isVisible}
            onVisibilityChange={(isVisible) => {
              favoritesVisibility.setVisible(isVisible);
            }}
            data-section-type="favorites"
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
                  <DragCard
                      key={favoritesDragDrop.dragOverlay.id}
                      item={favoritesDragDrop.dragOverlay}
                      index={0}
                      type={favoritesDragDrop.dragOverlay.type}
                      sectionType="favorites"
                      onExecute={({ item, type }) => {}}
                      onEdit={() => {}}
                      onDelete={() => {}}
                      onToggleFavorite={(item) => handleFavoriteToggle(item, 'favorites')}
                      isItemFavorite={(item) => isItemFavoriteInFolder(item, selectedFolderId)}
                      keyboardNavigation={{}}
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
            externalVisible={workflowsVisibility.isVisible}
            actionButton={
              <button
                onClick={() => onEditWorkflow({})}
                className="p-2 text-secondary-600 dark:text-secondary-400 hover:text-secondary-900 dark:hover:text-secondary-100 hover:bg-secondary-100 dark:hover:bg-secondary-800 rounded-lg transition-colors"
                title="New Workflow"
              >
                <Plus className="w-4 h-4" />
              </button>
            }
            onVisibilityChange={(isVisible) => {
              workflowsVisibility.setVisible(isVisible);
            }}
            data-section-type="workflows"
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
                  <DragCard
                      key={workflowsDragDrop.dragOverlay.id}
                      item={workflowsDragDrop.dragOverlay}
                      index={0}
                      type="workflow"
                      sectionType="workflows"
                      onExecute={({ item, type }) => {}}
                      onEdit={() => {}}
                      onDelete={() => {}}
                      onToggleFavorite={(item) => handleFavoriteToggle(item, 'workflows')}
                      isItemFavorite={(item) => isItemFavoriteInFolder(item, selectedFolderId)}
                      keyboardNavigation={{}}
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
            externalVisible={templatesVisibility.isVisible}
            actionButton={
              <button
                onClick={() => onEditTemplate({})}
                className="p-2 text-secondary-600 dark:text-secondary-400 hover:text-secondary-900 dark:hover:text-secondary-100 hover:bg-secondary-100 dark:hover:bg-secondary-800 rounded-lg transition-colors"
                title="New Template"
              >
                <Plus className="w-4 h-4" />
              </button>
            }
            onVisibilityChange={(isVisible) => {
              templatesVisibility.setVisible(isVisible);
            }}
            data-section-type="templates"
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
                  <DragCard
                      key={templatesDragDrop.dragOverlay.id}
                      item={templatesDragDrop.dragOverlay}
                      index={0}
                      type="template"
                      sectionType="templates"
                      onExecute={({ item, type }) => {}}
                      onEdit={() => {}}
                      onDelete={() => {}}
                      onToggleFavorite={(item) => handleFavoriteToggle(item, 'templates')}
                      isItemFavorite={(item) => isItemFavoriteInFolder(item, selectedFolderId)}
                      keyboardNavigation={{}}
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
            externalVisible={snippetsVisibility.isVisible}
            actionButton={
              <button
                onClick={() => onEditSnippet({})}
                className="p-2 text-secondary-600 dark:text-secondary-400 hover:text-secondary-900 dark:hover:text-secondary-100 hover:bg-secondary-100 dark:hover:bg-secondary-800 rounded-lg transition-colors"
                title="New Snippet"
              >
                <Plus className="w-4 h-4" />
              </button>
            }
            onVisibilityChange={(isVisible) => {
              snippetsVisibility.setVisible(isVisible);
            }}
            data-section-type="snippets"
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
                  <DragCard
                      key={snippetsDragDrop.dragOverlay.id}
                      item={snippetsDragDrop.dragOverlay}
                      index={0}
                      type="snippet"
                      sectionType="snippets"
                      onExecute={({ item, type }) => {}}
                      onEdit={() => {}}
                      onDelete={() => {}}
                      onToggleFavorite={(item) => handleFavoriteToggle(item, 'snippets')}
                      isItemFavorite={(item) => isItemFavoriteInFolder(item, selectedFolderId)}
                      keyboardNavigation={{}}
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
    <div className="flex h-screen bg-secondary-50 dark:bg-secondary-900">
      {/* Mobile Navigation */}
      <MobileNavigation
        isOpen={isMobileNavOpen}
        onToggle={setIsMobileNavOpen}
        folders={folders || []}
        selectedFolderId={selectedFolderId}
        onFolderSelect={setSelectedFolderId}
        onCreateFolder={onCreateFolder}
        onUpdateFolder={onUpdateFolder}
        onDeleteFolder={onDeleteFolder}
        onSettingsClick={() => setIsSettingsOpen(true)}
      />

      {/* Desktop Sidebar */}
      <div className="hidden lg:flex bg-white dark:bg-secondary-900 border-r border-secondary-200 dark:border-secondary-700 flex-shrink-0 shadow-lg">
        <CollapsibleFolderTree
          folders={folders || []}
          selectedFolderId={selectedFolderId}
          onFolderSelect={setSelectedFolderId}
          onCreateFolder={onCreateFolder}
          onUpdateFolder={onUpdateFolder}
          onDeleteFolder={onDeleteFolder}
          onSettingsClick={() => setIsSettingsOpen(true)}
          onAccountClick={() => console.log('Account clicked')}
        />
      </div>

      {/* Main Content */}
      <div 
        ref={mainContentRef}
        className="flex-1 overflow-y-auto overflow-x-hidden"
        tabIndex={-1}
        style={{ outline: 'none' }}
      >
        {/* Mobile Header */}
        <div className="lg:hidden bg-white dark:bg-secondary-800 border-b border-secondary-200 dark:border-secondary-700 px-4 py-3 sticky top-0 z-40">
          <div className="flex items-center justify-between">
            <MobileNavigation
              isOpen={isMobileNavOpen}
              onToggle={setIsMobileNavOpen}
              folders={folders || []}
              selectedFolderId={selectedFolderId}
              onFolderSelect={setSelectedFolderId}
              onCreateFolder={onCreateFolder}
              onUpdateFolder={onUpdateFolder}
              onDeleteFolder={onDeleteFolder}
              onSettingsClick={() => setIsSettingsOpen(true)}
            />
            <h1 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100 truncate">
              {folders?.find(f => f.id === selectedFolderId)?.name || 'Home'}
            </h1>
            <div className="w-10" /> {/* Spacer for balance */}
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-6">
          {/* Breadcrumb - Desktop only */}
          <div className="hidden lg:block mb-6">
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
      
      {/* Settings Modal */}
      <SettingsModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
};

export default Homepage;