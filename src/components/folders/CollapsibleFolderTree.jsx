import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { 
  ChevronLeft, 
  ChevronRight, 
  Settings, 
  User, 
  MoreVertical, 
  Edit2, 
  Trash2, 
  Plus, 
  FolderPlus,
  Home,
  Star,
  ChevronDown,
  ChevronUp,
  SortAsc,
  Calendar,
  FileType,
  Minimize2,
  Maximize2,
  Move,
  GripVertical
} from 'lucide-react';
import { 
  DndContext, 
  DragOverlay, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  useDndMonitor
} from '@dnd-kit/core';
// Custom vertical axis modifier
const restrictToVerticalAxis = ({transform}) => {
  return {
    ...transform,
    x: 0,
  };
};
import { 
  SortableContext, 
  verticalListSortingStrategy, 
  useSortable 
} from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import FolderModal from './FolderModal';
import { AVAILABLE_ICONS } from '../../constants/folderIcons';
import { useFolderUIState } from '../../hooks/queries/useUIStateQuery';
import { useUserPreferences } from '../../hooks/domain/useUserPreferences';
import ThemeToggle from '../common/ThemeToggle';

// DndMonitor component for enhanced drag monitoring and feedback
const DndMonitor = () => {
  useDndMonitor({
    onDragStart(event) {
      console.log('🎯 Drag monitor: Drag started', {
        id: event.active.id,
        type: event.active.data.current?.type,
        name: event.active.data.current?.name
      });
      
      // Add visual feedback to body
      document.body.style.cursor = 'grabbing';
      document.body.classList.add('dragging-folder');
    },
    onDragMove(event) {
      // Could add proximity detection or other visual feedback here
    },
    onDragOver(event) {
      if (event.over) {
        console.log('🎯 Drag monitor: Over target', {
          over: event.over.id,
          active: event.active.id
        });
      }
    },
    onDragEnd(event) {
      console.log('🎯 Drag monitor: Drag ended', {
        active: event.active.id,
        over: event.over?.id,
        success: !!event.over
      });
      
      // Clean up visual feedback
      document.body.style.cursor = '';
      document.body.classList.remove('dragging-folder');
    },
    onDragCancel(event) {
      console.log('🎯 Drag monitor: Drag cancelled', event.active.id);
      
      // Clean up visual feedback
      document.body.style.cursor = '';
      document.body.classList.remove('dragging-folder');
    },
  });

  return null; // This component only monitors, doesn't render
};

const CollapsibleFolderTree = ({ 
  folders = [], 
  selectedFolderId, 
  onFolderSelect, 
  onCreateFolder,
  onUpdateFolder,
  onDeleteFolder,
  onReorderFolders,
  className = '',
  onSettingsClick,
  onAccountClick
}) => {
  const queryClient = useQueryClient();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [favoriteFolders, setFavoriteFolders] = useState(new Set());
  
  // Use persistent UI state hook
  const { getFolderState, setFolderState, setBatchFolderStates, loading: uiStateLoading } = useFolderUIState();
  
  // Use preferences for confirm actions
  const { confirmActions } = useUserPreferences();
  
  // Initialize expanded folders from persistent state
  const [expandedFolders, setExpandedFolders] = useState(() => {
    if (uiStateLoading) return new Set(['root', 'general']);
    const expanded = new Set();
    folders.forEach(folder => {
      if (getFolderState(folder.id, true)) { // default to expanded
        expanded.add(folder.id);
      }
    });
    return expanded;
  });
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [editingFolder, setEditingFolder] = useState(null);
  const [parentFolderForNew, setParentFolderForNew] = useState(null);
  const [showContextMenu, setShowContextMenu] = useState(null);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  const [sortBy, setSortBy] = useState('name'); // 'name', 'date', 'type'
  const [draggedFolder, setDraggedFolder] = useState(null);
  const [isDragModeEnabled, setIsDragModeEnabled] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [pendingUpdate, setPendingUpdate] = useState(null);
  const [activeDropZone, setActiveDropZone] = useState(null);
  
  // Refs for debouncing and preventing race conditions
  const updateTimeoutRef = useRef(null);
  const lastUpdateRef = useRef(null);
  const isUpdatingRef = useRef(false);

  // Initialize favorite folders from props
  useEffect(() => {
    const initialFavorites = new Set();
    folders.forEach(folder => {
      if (folder.favorite) {
        initialFavorites.add(folder.id);
      }
    });
    setFavoriteFolders(initialFavorites);
  }, [folders]);

  // Sync expanded folders with persistent UI state when it loads
  useEffect(() => {
    if (!uiStateLoading && folders.length > 0) {
      const expanded = new Set();
      folders.forEach(folder => {
        if (getFolderState(folder.id, true)) { // default to expanded
          expanded.add(folder.id);
        }
      });
      setExpandedFolders(expanded);
    }
  }, [uiStateLoading, folders, getFolderState]);

  // Get favorite folders for collapsed view
  const getFavoriteFolders = () => {
    return folders.filter(folder => favoriteFolders.has(folder.id));
  };

  const getSubfoldersForCollapsedView = () => {
    // Get contextual subfolders based on currently selected folder
    if (!selectedFolderId || selectedFolderId === 'root') {
      // If no folder selected or root selected, don't show any subfolders
      return [];
    }

    const selectedFolder = folders.find(f => f.id === selectedFolderId);
    if (!selectedFolder) return [];

    // If selected folder is a root folder, show its direct children
    if (selectedFolder.parentId === 'root' || !selectedFolder.parentId) {
      return folders.filter(folder => folder.parentId === selectedFolderId);
    }

    // If selected folder is a subfolder, show siblings (other children of same parent)
    return folders.filter(folder => 
      folder.parentId === selectedFolder.parentId && 
      folder.id !== selectedFolderId
    );
  };

  // Helper function to check if folder is part of active drop zone (parent or all children)
  const isPartOfActiveDropZone = (folderId) => {
    if (!activeDropZone) return false;
    
    // If this folder is the active drop zone
    if (folderId === activeDropZone) return true;
    
    // If this folder is a child of the active drop zone (recursively)
    const isChildOfActiveDropZone = (childId, targetParentId) => {
      const child = folders.find(f => f.id === childId);
      if (!child) return false;
      if (child.parentId === targetParentId) return true;
      if (child.parentId) return isChildOfActiveDropZone(child.parentId, targetParentId);
      return false;
    };
    
    if (isChildOfActiveDropZone(folderId, activeDropZone)) return true;
    
    // If this folder is the parent of the active drop zone
    const activeFolder = folders.find(f => f.id === activeDropZone);
    if (activeFolder && activeFolder.parentId === folderId) return true;
    
    return false;
  };

  // Custom collision detection optimized for nested folder structures
  const customCollisionDetection = useCallback((args) => {
    const { active } = args;
    
    // Use closestCenter as base but with some optimizations for nested items
    const centerCollisions = closestCenter(args);
    
    if (!centerCollisions || centerCollisions.length === 0) {
      return centerCollisions;
    }
    
    // Filter out invalid drop targets for nested folders
    const validCollisions = centerCollisions.filter(collision => {
      const targetFolder = folders.find(f => f.id === collision.id);
      const activeFolder = folders.find(f => f.id === active.id);
      
      if (!targetFolder || !activeFolder) return false;
      
      // Don't allow dropping on self or descendants
      if (checkIfDescendant(activeFolder.id, targetFolder.id, folders)) {
        return false;
      }
      
      return true;
    });
    
    return validCollisions.length > 0 ? validCollisions : centerCollisions;
  }, [folders]);

  // Setup drag and drop sensors with improved constraints for nested folders
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: { y: 10 }, // Only require vertical movement to start drag
        tolerance: { x: 8 }, // Allow horizontal tolerance but prevent accidental activation
      },
      // Bypass drag activation if clicking on expand/collapse or favorite buttons
      bypassActivationConstraint({event, activeNode}) {
        const target = event.target;
        const isExpandButton = target.closest('[data-folder-expand]');
        const isFavoriteButton = target.closest('[data-folder-favorite]');
        const isContextButton = target.closest('[data-folder-context]');
        
        // Also check if the activator node contains the target for better accuracy
        const isActivatorNode = activeNode?.activatorNode?.current?.contains?.(target);
        
        return isExpandButton || isFavoriteButton || isContextButton || !isActivatorNode;
      },
      // Enhanced activation feedback
      onActivation: (event) => {
        // Prevent default to avoid text selection during drag
        if (event.type === 'pointerdown') {
          event.preventDefault();
        }
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: () => ({ x: 0, y: 10 }), // Improve keyboard navigation for nested items
    })
  );

  // Debounced update function to prevent multiple simultaneous API calls
  const debouncedUpdateFolderSortOrder = useCallback(async (updatedFolders) => {
    // Clear any pending timeout
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
      updateTimeoutRef.current = null;
    }

    // If we're already updating, store this as a pending update
    if (isUpdatingRef.current) {
      setPendingUpdate(updatedFolders);
      return;
    }

    // Set timeout for debouncing
    updateTimeoutRef.current = setTimeout(async () => {
      await performFolderSortOrderUpdate(updatedFolders);
      
      // Check if there's a pending update
      if (pendingUpdate) {
        const pending = pendingUpdate;
        setPendingUpdate(null);
        // Perform the pending update after a short delay
        setTimeout(() => {
          debouncedUpdateFolderSortOrder(pending);
        }, 100);
      }
    }, 300); // 300ms debounce delay
  }, [pendingUpdate]);

  // Actual API call function
  const performFolderSortOrderUpdate = async (updatedFolders) => {
    if (isUpdatingRef.current) {
      return;
    }

    try {
      isUpdatingRef.current = true;
      
      const updates = updatedFolders.map(folder => ({
        id: folder.id,
        sort_order: folder.sortOrder
      }));

      // Prevent duplicate calls with same data
      const updateKey = JSON.stringify(updates.sort((a, b) => a.id.localeCompare(b.id)));
      if (lastUpdateRef.current === updateKey) {
        console.log('🔄 Skipping duplicate update');
        return;
      }
      lastUpdateRef.current = updateKey;

      console.log('🔄 Updating folder sort order:', updates);

      const response = await fetch(`${window.location.protocol}//${window.location.hostname}:3001/api/folders/batch-sort-order`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ updates })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to update folder sort order');
      }

      console.log('✅ Successfully updated folder sort order');
      
      // Invalidate the folders query to ensure fresh data on refresh
      queryClient.invalidateQueries({ queryKey: ['folders'] });
      
    } catch (error) {
      console.error('❌ Error updating folder sort order:', error);
      // Reset the last update ref on error so it can be retried
      lastUpdateRef.current = null;
    } finally {
      isUpdatingRef.current = false;
    }
  };

  // Handle drag start
  const handleDragStart = (event) => {
    // Prevent multiple simultaneous drags
    if (isDragging) {
      return;
    }
    
    setIsDragging(true);
    setActiveDropZone(null);
    const { active } = event;
    const folder = folders.find(f => f.id === active.id);
    
    // Calculate folder depth for visual feedback
    const calculateDepth = (folderId) => {
      let depth = 0;
      let currentFolder = folders.find(f => f.id === folderId);
      while (currentFolder && currentFolder.parentId && currentFolder.parentId !== 'root') {
        depth++;
        currentFolder = folders.find(f => f.id === currentFolder.parentId);
      }
      return depth;
    };
    
    const folderWithDepth = {
      ...folder,
      depth: calculateDepth(folder.id)
    };
    
    setDraggedFolder(folderWithDepth);
    console.log('🎯 Drag started for folder:', folder?.name, 'at depth:', folderWithDepth.depth);
  };

  // Handle drag end
  const handleDragEnd = async (event) => {
    const { active, over } = event;
    
    // Always reset drag state
    setDraggedFolder(null);
    setIsDragging(false);
    setActiveDropZone(null);

    if (!over || active.id === over.id) {
      console.log('🎯 Drag ended - no valid drop target');
      return;
    }

    // Get fresh folder data to avoid stale state issues
    const currentFolders = folders;
    
    // Find the folders being moved
    const activeFolder = currentFolders.find(f => f.id === active.id);
    const overFolder = currentFolders.find(f => f.id === over.id);

    if (!activeFolder || !overFolder) {
      console.log('🎯 Drag ended - folder not found');
      return;
    }

    console.log('🎯 Drag ended - moving', activeFolder.name, 'relative to', overFolder.name);

    // Check if we're trying to move a folder into itself or its descendants
    const isDescendant = checkIfDescendant(activeFolder.id, overFolder.id, currentFolders);
    if (isDescendant) {
      console.log('🎯 Drag ended - cannot move folder into its own descendant');
      return;
    }

    // Handle different scenarios:
    // 1. Reordering within the same parent
    // 2. Moving to a different parent (change parent relationship)
    
    if (activeFolder.parentId === overFolder.parentId) {
      // Scenario 1: Reordering within same parent
      handleSameParentReorder(activeFolder, overFolder, currentFolders);
    } else {
      // Scenario 2: Moving to different parent - insert as sibling of overFolder
      handleCrossParentMove(activeFolder, overFolder, currentFolders);
    }
  };

  // Check if targetId is a descendant of sourceId
  const checkIfDescendant = (sourceId, targetId, allFolders) => {
    const findDescendants = (parentId) => {
      const children = allFolders.filter(f => f.parentId === parentId);
      let descendants = [...children];
      children.forEach(child => {
        descendants = [...descendants, ...findDescendants(child.id)];
      });
      return descendants;
    };
    
    const descendants = findDescendants(sourceId);
    return descendants.some(desc => desc.id === targetId);
  };

  // Handle reordering within the same parent
  const handleSameParentReorder = (activeFolder, overFolder, currentFolders) => {
    const parentId = activeFolder.parentId;
    const siblingFolders = currentFolders
      .filter(f => f.parentId === parentId)
      .sort((a, b) => {
        const sortOrderA = a.sortOrder !== undefined ? a.sortOrder : 999;
        const sortOrderB = b.sortOrder !== undefined ? b.sortOrder : 999;
        if (sortOrderA !== sortOrderB) {
          return sortOrderA - sortOrderB;
        }
        return a.name.localeCompare(b.name);
      });
    
    const activeIndex = siblingFolders.findIndex(f => f.id === activeFolder.id);
    const overIndex = siblingFolders.findIndex(f => f.id === overFolder.id);
    
    console.log('🎯 Same parent reorder - active:', activeIndex, 'over:', overIndex);
    
    if (activeIndex !== overIndex && activeIndex !== -1 && overIndex !== -1) {
      const reorderedSiblings = [...siblingFolders];
      const [movedFolder] = reorderedSiblings.splice(activeIndex, 1);
      reorderedSiblings.splice(overIndex, 0, movedFolder);
      
      // Update sort orders
      const updatedFolders = reorderedSiblings.map((folder, index) => ({
        ...folder,
        sortOrder: index
      }));
      
      console.log('🎯 Same parent new order:', updatedFolders.map(f => ({ id: f.id, name: f.name, sortOrder: f.sortOrder })));
      
      // Update state and database
      updateFoldersAfterReorder(updatedFolders);
    }
  };

  // Handle moving to different parent
  const handleCrossParentMove = (activeFolder, overFolder, currentFolders) => {
    console.log('🎯 Cross parent move - moving', activeFolder.name, 'to be child of', overFolder.name);
    
    // Get the target parent (the folder we dropped ON becomes the new parent)
    const newParentId = overFolder.id;
    
    // Get all current children of the target folder
    const targetChildren = currentFolders
      .filter(f => f.parentId === newParentId && f.id !== activeFolder.id)
      .sort((a, b) => {
        const sortOrderA = a.sortOrder !== undefined ? a.sortOrder : 999;
        const sortOrderB = b.sortOrder !== undefined ? b.sortOrder : 999;
        if (sortOrderA !== sortOrderB) {
          return sortOrderA - sortOrderB;
        }
        return a.name.localeCompare(b.name);
      });
    
    // Create updated folder with new parent
    const updatedActiveFolder = {
      ...activeFolder,
      parentId: newParentId,
      sortOrder: 0 // Insert as first child
    };
    
    // Insert the moved folder as first child and reorder existing children
    const newChildren = [updatedActiveFolder, ...targetChildren];
    
    // Update sort orders for all children in target parent
    const updatedTargetChildren = newChildren.map((folder, index) => ({
      ...folder,
      sortOrder: index
    }));
    
    // Also need to update sort orders for remaining siblings in original parent
    const originalParentSiblings = currentFolders
      .filter(f => f.parentId === activeFolder.parentId && f.id !== activeFolder.id)
      .sort((a, b) => {
        const sortOrderA = a.sortOrder !== undefined ? a.sortOrder : 999;
        const sortOrderB = b.sortOrder !== undefined ? b.sortOrder : 999;
        if (sortOrderA !== sortOrderB) {
          return sortOrderA - sortOrderB;
        }
        return a.name.localeCompare(b.name);
      })
      .map((folder, index) => ({
        ...folder,
        sortOrder: index
      }));
    
    // Combine all updated folders
    const allUpdatedFolders = [...updatedTargetChildren, ...originalParentSiblings];
    
    console.log('🎯 Cross parent new arrangement:', {
      moved: updatedActiveFolder.name,
      newParent: newParentId,
      targetChildren: updatedTargetChildren.map(f => ({ id: f.id, name: f.name, sortOrder: f.sortOrder })),
      originalSiblings: originalParentSiblings.map(f => ({ id: f.id, name: f.name, sortOrder: f.sortOrder }))
    });
    
    // Update state and database
    updateFoldersAfterReorder(allUpdatedFolders, updatedActiveFolder);
  };

  // Common function to update folders after reorder
  const updateFoldersAfterReorder = (updatedFolders, folderWithNewParent = null) => {
    // For cross-parent moves, handle parent change first, then batch update
    if (folderWithNewParent && onUpdateFolder) {
      console.log('🔄 Updating folder parent first:', folderWithNewParent.name, 'to parent', folderWithNewParent.parentId);
      onUpdateFolder(folderWithNewParent);
      
      // Delay the sort order update to avoid conflicts
      setTimeout(() => {
        if (onReorderFolders) {
          onReorderFolders(updatedFolders);
        } else {
          debouncedUpdateFolderSortOrder(updatedFolders);
        }
      }, 200);
    } else {
      // For same-parent reorder, just update sort orders
      if (onReorderFolders) {
        onReorderFolders(updatedFolders);
      } else {
        debouncedUpdateFolderSortOrder(updatedFolders);
      }
    }
  };

  // Build folder hierarchy (moved before getAllDraggableFolderIds to fix hoisting issue)
  const buildFolderTree = useCallback((parentId = null) => {
    let filteredFolders = folders.filter(folder => folder.parentId === parentId);
    
    // Apply favorites filter
    if (showOnlyFavorites && parentId === 'root') {
      filteredFolders = filteredFolders.filter(folder => favoriteFolders.has(folder.id));
    }
    
    // Apply sorting - prioritize sortOrder if available, then fall back to other sorting
    switch (sortBy) {
      case 'date':
        filteredFolders.sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));
        break;
      case 'type':
        filteredFolders.sort((a, b) => {
          const typeA = a.type || 'folder';
          const typeB = b.type || 'folder';
          return typeA.localeCompare(typeB);
        });
        break;
      case 'name':
      default:
        // First sort by sortOrder if available, then by name
        filteredFolders.sort((a, b) => {
          const sortOrderA = a.sortOrder !== undefined ? a.sortOrder : 999;
          const sortOrderB = b.sortOrder !== undefined ? b.sortOrder : 999;
          
          if (sortOrderA !== sortOrderB) {
            return sortOrderA - sortOrderB;
          }
          
          return a.name.localeCompare(b.name);
        });
        break;
    }
    
    return filteredFolders;
  }, [folders, expandedFolders, showOnlyFavorites, favoriteFolders, sortBy]);

  // Get all draggable folder IDs for SortableContext
  const getAllDraggableFolderIds = useCallback(() => {
    if (!isDragModeEnabled) return [];
    
    const collectVisibleFolderIds = (parentId = 'root') => {
      const childrenFolders = buildFolderTree(parentId);
      let ids = [];
      
      childrenFolders.forEach(folder => {
        ids.push(folder.id);
        // If folder is expanded, also include its children
        if (expandedFolders.has(folder.id)) {
          ids.push(...collectVisibleFolderIds(folder.id));
        }
      });
      
      return ids;
    };
    
    return collectVisibleFolderIds();
  }, [folders, expandedFolders, isDragModeEnabled, buildFolderTree]);

  const toggleFolder = async (folderId) => {
    const newExpanded = new Set(expandedFolders);
    const isCurrentlyExpanded = newExpanded.has(folderId);
    const willBeExpanded = !isCurrentlyExpanded;
    
    if (isCurrentlyExpanded) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    
    // Update local state immediately for responsiveness
    setExpandedFolders(newExpanded);
    
    // Update persistent state in background
    try {
      await setFolderState(folderId, willBeExpanded);
    } catch (error) {
      console.error('Failed to save folder state:', error);
      // Optionally revert the local state if the database update fails
      // setExpandedFolders(expandedFolders);
    }
  };

  const toggleFavorite = (folderId, e) => {
    e.stopPropagation();
    const newFavorites = new Set(favoriteFolders);
    
    if (newFavorites.has(folderId)) {
      newFavorites.delete(folderId);
    } else {
      newFavorites.add(folderId);
    }
    
    setFavoriteFolders(newFavorites);
    
    // Update the folder's favorite status
    const folder = folders.find(f => f.id === folderId);
    if (folder && onUpdateFolder) {
      onUpdateFolder({ ...folder, favorite: !folder.favorite });
    }
  };

  const handleContextMenu = (e, folder) => {
    e.preventDefault();
    e.stopPropagation();
    setShowContextMenu(folder.id);
    setContextMenuPosition({ x: e.clientX, y: e.clientY });
  };

  const handleEditFolder = (folder) => {
    setEditingFolder(folder);
    setShowFolderModal(true);
    setShowContextMenu(null);
  };

  const handleFavoriteToggle = (folderId) => {
    const newFavorites = new Set(favoriteFolders);
    if (newFavorites.has(folderId)) {
      newFavorites.delete(folderId);
    } else {
      newFavorites.add(folderId);
    }
    setFavoriteFolders(newFavorites);

    // Update the folder in the parent component
    const folder = folders.find(f => f.id === folderId);
    if (folder && onUpdateFolder) {
      onUpdateFolder({
        ...folder,
        favorite: newFavorites.has(folderId)
      });
    }
  };

  const expandAll = async () => {
    const allFolderIds = new Set();
    const collectIds = (folderId) => {
      const children = folders.filter(f => f.parentId === folderId);
      children.forEach(child => {
        allFolderIds.add(child.id);
        collectIds(child.id);
      });
    };
    collectIds('root');
    
    // Update local state immediately
    setExpandedFolders(allFolderIds);
    
    // Update database in background
    try {
      const updates = Array.from(allFolderIds).map(folderId => ({
        folder_id: folderId,
        is_expanded: true
      }));
      
      // Use batch update for better performance
      await setBatchFolderStates(updates);
    } catch (error) {
      console.error('Failed to save expand all state:', error);
    }
  };

  const collapseAll = async () => {
    const previousExpanded = expandedFolders;
    
    // Update local state immediately
    setExpandedFolders(new Set());
    
    // Update database in background
    try {
      const updates = Array.from(previousExpanded).map(folderId => ({
        folder_id: folderId,
        is_expanded: false
      }));
      
      // Use batch update for better performance
      await setBatchFolderStates(updates);
    } catch (error) {
      console.error('Failed to save collapse all state:', error);
    }
  };

  const handleDeleteFolder = (folderId) => {
    if (confirmActions.deleteFolder) {
      const hasSubfolders = folders.some(f => f.parentId === folderId);
      const warningMessage = hasSubfolders 
        ? 'Deze map bevat submappen. Weet je zeker dat je deze map en alle inhoud wilt verwijderen?'
        : 'Weet je zeker dat je deze map wilt verwijderen?';
      
      if (confirm(warningMessage)) {
        onDeleteFolder(folderId);
      }
    } else {
      // Direct delete without confirmation
      onDeleteFolder(folderId);
    }
    setShowContextMenu(null);
  };
  

  const handleSaveFolder = (folderData) => {
    if (editingFolder) {
      onUpdateFolder(folderData);
    } else {
      onCreateFolder(folderData);
    }
  };

  const renderFolderIcon = (folder, isSelected) => {
    const iconName = folder.icon || 'Folder';
    const IconComponent = AVAILABLE_ICONS[iconName] || AVAILABLE_ICONS.Folder;
    
    return (
      <IconComponent 
        className={`w-4 h-4 mr-2 ${
          isSelected 
            ? 'text-primary-600 dark:text-primary-400' 
            : 'text-secondary-600 dark:text-secondary-400'
        }`}
      />
    );
  };

  // Separate sortable folder component to avoid conditional hook usage
  const SortableFolderItem = ({ folder, depth }) => {
    const {
      attributes,
      listeners,
      setNodeRef: setSortableRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ 
      id: folder.id,
      data: {
        type: 'folder',
        name: folder.name,
        parentId: folder.parentId,
        depth: depth,
        sortOrder: folder.sortOrder,
        canAcceptChildren: true
      }
    });

    const {
      setNodeRef: setDroppableRef,
      isOver,
    } = useDroppable({ 
      id: `drop-${folder.id}`,
      data: {
        type: 'folder-drop-zone',
        parentId: folder.id,
        accepts: ['folder'],
        depth: depth + 1
      }
    });

    // Update active drop zone when isOver changes
    useEffect(() => {
      if (isOver) {
        setActiveDropZone(folder.id);
      } else if (activeDropZone === folder.id) {
        setActiveDropZone(null);
      }
    }, [isOver, folder.id]);

    // Combine refs
    const setNodeRef = (node) => {
      setSortableRef(node);
      setDroppableRef(node);
    };

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
    };

    return (
      <div 
        ref={setNodeRef} 
        style={style}
        className={isOver ? 'drop-zone-active' : ''}
      >
        {renderFolderContent(folder, depth, true, attributes, listeners, isOver)}
      </div>
    );
  };

  // Regular folder component without sortable hooks
  const RegularFolderItem = ({ folder, depth }) => {
    return (
      <div>
        {renderFolderContent(folder, depth, false)}
      </div>
    );
  };

  // Common folder content renderer
  const renderFolderContent = (folder, depth, isDragable, attributes = {}, listeners = {}, isOver = false) => {
    const children = buildFolderTree(folder.id);
    const isExpanded = expandedFolders.has(folder.id);
    const isSelected = selectedFolderId === folder.id;
    const isFavorite = favoriteFolders.has(folder.id);
    const folderHasChildren = children.length > 0;
    const isInActiveDropZone = isPartOfActiveDropZone(folder.id);

    return (
      <>
        <div
          className={`
            group flex items-center px-2 py-1.5 rounded-md mb-0.5 relative
            ${isDragable && isDragModeEnabled ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'}
            ${isSelected 
              ? 'text-primary-600 dark:text-primary-400 bg-primary-50/50 dark:bg-primary-900/10' 
              : 'hover:bg-secondary-100 dark:hover:bg-secondary-700 text-secondary-700 dark:text-secondary-300'
            }
            ${isDragable && isDragModeEnabled ? 'border-2 border-dashed border-transparent hover:border-primary-300 dark:hover:border-primary-600' : ''}
            ${isOver ? 'bg-primary-100 dark:bg-primary-800/30 border-primary-400 dark:border-primary-500 shadow-md scale-105 transition-all duration-200' : ''}
            ${isInActiveDropZone && !isOver ? 'bg-primary-50 dark:bg-primary-900/20 border-2 border-primary-300 dark:border-primary-600 shadow-sm transition-all duration-200' : ''}
          `}
          style={{ paddingLeft: `${8 + depth * 16}px` }}
          onClick={(!isDragable || !isDragModeEnabled) ? () => onFolderSelect(folder.id) : undefined}
          onContextMenu={(!isDragable || !isDragModeEnabled) ? (e) => handleContextMenu(e, folder) : undefined}
          {...(isDragable && isDragModeEnabled ? { ...attributes, ...listeners } : {})}
        >
          {folderHasChildren && (
            <button
              data-folder-expand
              onClick={(e) => {
                e.stopPropagation();
                toggleFolder(folder.id);
              }}
              className="mr-1 p-1 hover:bg-secondary-200 dark:hover:bg-secondary-700 rounded"
            >
              <svg 
                className="w-4 h-4"
                style={{
                  transform: `rotate(${isExpanded ? 90 : 0}deg)`,
                  transition: 'transform 300ms cubic-bezier(0.4, 0, 0.2, 1)',
                }}
                fill="currentColor" 
                viewBox="0 0 20 20"
              >
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </button>
          )}
          {!folderHasChildren && <div className="w-4" />}
          
          {renderFolderIcon(folder, isSelected)}
          
          <span className="truncate flex-1">{folder.name}</span>
          
          {/* Obsidian-style "Move into" indicator */}
          {isOver && (
            <div className="flex items-center gap-1 ml-2 px-2 py-1 bg-primary-200 dark:bg-primary-700 text-primary-800 dark:text-primary-200 text-xs rounded-full font-medium animate-pulse">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              <span>Move into</span>
            </div>
          )}
          
          {/* Actions - only show when not in drag mode */}
          {(!isDragable || !isDragModeEnabled) && (
            <>
              <button
                data-folder-favorite
                onClick={(e) => {
                  toggleFavorite(folder.id, e);
                  e.currentTarget.blur(); // Remove focus after click
                }}
                className="ml-1 p-1 rounded border border-transparent hover:border-secondary-300 dark:hover:border-secondary-600 opacity-0 group-hover:opacity-100 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-opacity-50"
                title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
              >
                <svg 
                  className={`w-4 h-4 text-secondary-600 dark:text-secondary-300 ${isFavorite ? 'fill-current' : ''}`}
                  fill={isFavorite ? 'currentColor' : 'none'}
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </button>
              
              {/* Context menu button */}
              {folder.id !== 'root' && (
                <button
                  data-folder-context
                  onClick={(e) => handleContextMenu(e, folder)}
                  className="ml-1 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-secondary-200 dark:hover:bg-secondary-700"
                  title="Meer opties"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
              )}
            </>
          )}
        </div>

        <div 
          className={`overflow-hidden ${isExpanded && children.length > 0 ? '' : 'h-0'}`}
          style={{
            transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
            maxHeight: isExpanded && children.length > 0 ? '2000px' : '0',
            opacity: isExpanded && children.length > 0 ? 1 : 0,
          }}
        >
          {children.length > 0 && (
            <div style={{ paddingTop: '2px' }}>
              {children.map((child, index) => renderFolder(child, depth + 1, index === 0))}
            </div>
          )}
        </div>
      </>
    );
  };

  const renderFolder = (folder, depth = 0, isFirst = false) => {
    // Enable drag for all folders when drag mode is enabled (not just root-level)
    const isDragable = isDragModeEnabled;

    if (isDragable) {
      return <SortableFolderItem key={folder.id} folder={folder} depth={depth} />;
    }

    return <RegularFolderItem key={folder.id} folder={folder} depth={depth} />;
  };

  const renderCollapsedView = () => {
    const favoriteFoldersList = getFavoriteFolders();
    const subfoldersList = getSubfoldersForCollapsedView();
    
    return (
      <div className="flex flex-col h-full bg-secondary-50 dark:bg-secondary-900 border-r border-secondary-200 dark:border-secondary-800">
        {/* Toggle button */}
        <div className="p-2">
          <button
            onClick={() => setIsCollapsed(false)}
            className="w-full p-2 hover:bg-secondary-200 dark:hover:bg-secondary-800 rounded-lg transition-colors"
            title="Expand sidebar"
          >
            <ChevronRight className="w-5 h-5 text-secondary-400" />
          </button>
        </div>

        {/* Home button */}
        <div className="px-2 mb-2">
          <button
            onClick={() => onFolderSelect('root')}
            className={`w-full p-3 rounded-lg transition-colors relative ${
              selectedFolderId === 'root'
                ? 'text-primary-400 dark:text-primary-400'
                : 'hover:bg-secondary-200 dark:hover:bg-secondary-800 text-secondary-600 dark:text-secondary-400'
            }`}
            title="Home"
          >
            <Home className="w-5 h-5 mx-auto" />
            {selectedFolderId === 'root' && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary-500 dark:bg-primary-400 rounded-r" />
            )}
          </button>
        </div>

        {/* Scrollable content area */}
        <div className="flex-1 overflow-y-auto px-2">
          {/* Favorite folders */}
          {favoriteFoldersList.map(folder => {
            const IconComponent = AVAILABLE_ICONS[folder.icon || 'Folder'] || AVAILABLE_ICONS.Folder;
            const isSelected = selectedFolderId === folder.id;
            
            return (
              <button
                key={folder.id}
                onClick={() => onFolderSelect(folder.id)}
                className={`w-full p-3 rounded-lg mb-2 transition-colors relative ${
                  isSelected
                    ? 'text-primary-400 dark:text-primary-400'
                    : 'hover:bg-secondary-200 dark:hover:bg-secondary-800 text-secondary-600 dark:text-secondary-400'
                }`}
                title={folder.name}
              >
                <IconComponent className="w-5 h-5 mx-auto" />
                {isSelected && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary-500 dark:bg-primary-400 rounded-r" />
                )}
              </button>
            );
          })}

          {/* Separator between favorites and subfolders */}
          {favoriteFoldersList.length > 0 && subfoldersList.length > 0 && (
            <div className="border-t border-secondary-300 dark:border-secondary-700 my-3" />
          )}

          {/* Subfolders */}
          {subfoldersList.map(folder => {
            const IconComponent = AVAILABLE_ICONS[folder.icon || 'Folder'] || AVAILABLE_ICONS.Folder;
            const isSelected = selectedFolderId === folder.id;
            
            return (
              <button
                key={`sub-${folder.id}`}
                onClick={() => onFolderSelect(folder.id)}
                className={`w-full p-3 rounded-lg mb-2 transition-colors relative ${
                  isSelected
                    ? 'text-primary-400 dark:text-primary-400'
                    : 'hover:bg-secondary-200 dark:hover:bg-secondary-800 text-secondary-600 dark:text-secondary-400'
                }`}
                title={folder.name}
              >
                <IconComponent className="w-4 h-4 mx-auto opacity-75" />
                {isSelected && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary-500 dark:bg-primary-400 rounded-r" />
                )}
              </button>
            );
          })}
        </div>

        {/* Bottom icons */}
        <div className="px-2 pb-2 space-y-2 border-t border-secondary-300 dark:border-secondary-700 pt-2">
          {onAccountClick && (
            <button
              onClick={onAccountClick}
              className="w-full p-3 hover:bg-secondary-200 dark:hover:bg-secondary-800 rounded-lg transition-colors text-secondary-600 dark:text-secondary-400"
              title="Account"
            >
              <User className="w-5 h-5 mx-auto" />
            </button>
          )}
          <button
            onClick={onSettingsClick}
            className="w-full p-3 hover:bg-secondary-200 dark:hover:bg-secondary-800 rounded-lg transition-colors text-secondary-600 dark:text-secondary-400"
            title="Settings"
          >
            <Settings className="w-5 h-5 mx-auto" />
          </button>
          <div className="w-full p-3 flex justify-center">
            <ThemeToggle size="md" />
          </div>
        </div>
      </div>
    );
  };

  const renderExpandedView = () => {
    const rootFolders = buildFolderTree('root');
    
    return (
      <div className={`flex flex-col h-full bg-white dark:bg-secondary-900 ${className}`}>
        {/* Header with collapse button */}
        <div className="border-b border-secondary-200 dark:border-secondary-700">
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">Folders</h2>
                {isDragModeEnabled && (
                  <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 text-xs font-medium">
                    <Move className="w-3 h-3" />
                    <span>Drag Mode</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setParentFolderForNew(null);
                    setEditingFolder(null);
                    setShowFolderModal(true);
                  }}
                  className="p-2 hover:bg-secondary-100 dark:hover:bg-secondary-800 rounded-lg text-secondary-600 dark:text-secondary-400"
                  title="Create new folder"
                  disabled={isDragModeEnabled}
                >
                  <FolderPlus className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsCollapsed(true)}
                  className="p-2 hover:bg-secondary-100 dark:hover:bg-secondary-800 rounded-lg text-secondary-600 dark:text-secondary-400"
                  title="Collapse sidebar"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
          
          {/* Toolbar */}
          <div className="px-4 pb-3 flex items-center justify-between">
            <div className="flex items-center gap-1">
              {/* Drag mode toggle */}
              <button
                onClick={() => setIsDragModeEnabled(!isDragModeEnabled)}
                className={`p-1.5 rounded transition-colors ${
                  isDragModeEnabled 
                    ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400' 
                    : 'hover:bg-secondary-100 dark:hover:bg-secondary-800 text-secondary-600 dark:text-secondary-400'
                }`}
                title={isDragModeEnabled ? "Disable drag to reorder" : "Enable drag to reorder"}
              >
                <Move className="w-4 h-4" />
              </button>
              
              {/* Favorites filter */}
              <button
                onClick={() => setShowOnlyFavorites(!showOnlyFavorites)}
                className={`p-1.5 rounded transition-colors ${
                  showOnlyFavorites 
                    ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400' 
                    : 'hover:bg-secondary-100 dark:hover:bg-secondary-800 text-secondary-600 dark:text-secondary-400'
                }`}
                title={showOnlyFavorites ? "Show all folders" : "Show only favorites"}
              >
                <Star className={`w-4 h-4 ${showOnlyFavorites ? 'fill-current' : ''}`} />
              </button>
              
              {/* Toggle Expand/Collapse all */}
              <button
                onClick={() => {
                  // Check how many folders are expanded
                  const expandableFolders = folders.filter(f => 
                    folders.some(child => child.parentId === f.id)
                  );
                  const expandedCount = expandableFolders.filter(f => expandedFolders.has(f.id)).length;
                  const isExpanded = expandedCount > expandableFolders.length / 2;
                  
                  if (isExpanded) {
                    collapseAll();
                  } else {
                    expandAll();
                  }
                }}
                className="p-1.5 hover:bg-secondary-100 dark:hover:bg-secondary-800 rounded text-secondary-600 dark:text-secondary-400 flex items-center gap-1"
                title={expandedFolders.size > 1 ? "Collapse all folders" : "Expand all folders"}
              >
                {expandedFolders.size > 1 ? (
                  <Minimize2 className="w-4 h-4" />
                ) : (
                  <Maximize2 className="w-4 h-4" />
                )}
              </button>
            </div>
            
            {/* Sort dropdown */}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowContextMenu(showContextMenu === 'sort' ? null : 'sort');
                  setContextMenuPosition({ x: e.currentTarget.offsetLeft, y: e.currentTarget.offsetTop + e.currentTarget.offsetHeight });
                }}
                className="p-1.5 hover:bg-secondary-100 dark:hover:bg-secondary-800 rounded text-secondary-600 dark:text-secondary-400 flex items-center gap-1"
                title="Sort folders"
              >
                {sortBy === 'name' && <SortAsc className="w-4 h-4" />}
                {sortBy === 'date' && <Calendar className="w-4 h-4" />}
                {sortBy === 'type' && <FileType className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Folder tree with drag and drop */}
        <div className="flex-1 overflow-y-auto p-2">
          {/* Home folder (not draggable) */}
          <div
            className={`
              flex items-center px-2 py-1.5 cursor-pointer rounded-md mb-0.5 relative
              ${selectedFolderId === 'root' 
                ? 'text-primary-600 dark:text-primary-400 bg-primary-50/50 dark:bg-primary-900/10' 
                : 'hover:bg-secondary-100 dark:hover:bg-secondary-700 text-secondary-700 dark:text-secondary-300'
              }
            `}
            onClick={() => onFolderSelect('root')}
          >
            <Home className="w-4 h-4 mr-2" />
            <span className="font-medium">Home</span>
          </div>

          {/* Root folders with conditional drag and drop */}
          {isDragModeEnabled ? (
            <DndContext
              sensors={sensors}
              collisionDetection={customCollisionDetection}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              modifiers={[restrictToVerticalAxis]}
              autoScroll={{
                layoutShiftCompensation: false, // Disable for better performance with nested items
                threshold: {
                  x: 0.15,
                  y: 0.15,
                },
                acceleration: 8, // Slightly faster scroll for better UX
                interval: 8, // More frequent updates for smoother scrolling
              }}
              accessibility={{
                restoreFocus: false, // Let React handle focus management
              }}
              // Prevent new drags while one is already in progress
              disabled={isDragging}
            >
              <DndMonitor />
              <SortableContext items={getAllDraggableFolderIds()} strategy={verticalListSortingStrategy}>
                {rootFolders.map((folder) => renderFolder(folder, 0))}
              </SortableContext>
              
              <DragOverlay>
                {draggedFolder ? (
                  <div className="bg-white dark:bg-secondary-800 border border-primary-300 dark:border-primary-600 rounded-lg shadow-xl opacity-95 backdrop-blur-sm">
                    <div 
                      className="flex items-center py-2 px-3 relative"
                      style={{
                        paddingLeft: `${12 + (draggedFolder.depth || 0) * 16}px`
                      }}
                    >
                      {/* Depth indicator lines */}
                      {draggedFolder.depth > 0 && (
                        <div className="absolute left-0 top-0 bottom-0 flex">
                          {Array.from({ length: draggedFolder.depth }).map((_, index) => (
                            <div 
                              key={index}
                              className="w-4 border-l border-secondary-300 dark:border-secondary-600 opacity-50"
                              style={{ marginLeft: `${12 + index * 16}px` }}
                            />
                          ))}
                        </div>
                      )}
                      
                      {/* Folder icon */}
                      {(() => {
                        const IconComponent = AVAILABLE_ICONS[draggedFolder.icon || 'Folder'] || AVAILABLE_ICONS.Folder;
                        return <IconComponent className="w-4 h-4 mr-3 text-primary-600 dark:text-primary-400 flex-shrink-0" />;
                      })()}
                      
                      {/* Folder name */}
                      <span className="font-medium text-secondary-800 dark:text-secondary-100 truncate">
                        {draggedFolder.name}
                      </span>
                      
                      {/* Status indicator */}
                      <div className="ml-3 flex items-center gap-1 px-2 py-1 bg-primary-50 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 text-xs rounded-full font-medium flex-shrink-0">
                        <div className="w-1.5 h-1.5 bg-primary-500 dark:bg-primary-400 rounded-full animate-pulse"></div>
                      </div>
                    </div>
                    
                    {/* Subtle gradient overlay for depth */}
                    {draggedFolder.depth > 0 && (
                      <div 
                        className="absolute inset-0 pointer-events-none rounded-lg"
                        style={{
                          background: `linear-gradient(90deg, rgba(59, 130, 246, 0.05) 0%, transparent ${Math.min(draggedFolder.depth * 20, 60)}%)`
                        }}
                      />
                    )}
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          ) : (
            <div>
              {rootFolders.map((folder) => renderFolder(folder, 0))}
            </div>
          )}
        </div>

        {/* Bottom buttons */}
        <div className="p-3 border-t border-secondary-200 dark:border-secondary-700 flex justify-between">
          {onAccountClick ? (
            <button
              onClick={onAccountClick}
              className="p-2 hover:bg-secondary-100 dark:hover:bg-secondary-800 rounded-lg text-secondary-600 dark:text-secondary-400 transition-colors"
              title="Account"
            >
              <User className="w-4 h-4" />
            </button>
          ) : (
            <div className="w-8" />
          )}
          <button
            onClick={onSettingsClick}
            className="p-2 hover:bg-secondary-100 dark:hover:bg-secondary-800 rounded-lg text-secondary-600 dark:text-secondary-400 transition-colors"
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
          <ThemeToggle size="sm" />
        </div>
      </div>
    );
  };

  // Context menu
  useEffect(() => {
    const handleClickOutside = () => setShowContextMenu(null);
    if (showContextMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showContextMenu]);

  // Cleanup timeouts and refs on unmount
  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, []);

  return (
    <>
      <div 
        className={`h-full overflow-hidden ${isCollapsed ? 'w-16' : 'w-72'}`}
        style={{
          transition: 'width 400ms cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <div 
          className="relative w-full h-full"
          style={{
            transition: 'transform 400ms cubic-bezier(0.4, 0, 0.2, 1)',
            transform: isCollapsed ? 'translateX(0)' : 'translateX(0)',
          }}
        >
          {/* Always render both views but use opacity and pointer-events to show/hide */}
          <div 
            className={`absolute inset-0 ${!isCollapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
            style={{
              transition: 'opacity 300ms ease-in-out',
              transitionDelay: isCollapsed ? '100ms' : '0ms',
            }}
          >
            {renderCollapsedView()}
          </div>
          <div 
            className={`absolute inset-0 ${isCollapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
            style={{
              transition: 'opacity 300ms ease-in-out',
              transitionDelay: !isCollapsed ? '100ms' : '0ms',
            }}
          >
            {renderExpandedView()}
          </div>
        </div>
      </div>

      {/* Context Menu */}
      {showContextMenu && showContextMenu !== 'sort' && (
        <div
          className="fixed bg-white dark:bg-secondary-800 border border-secondary-300 dark:border-secondary-600 rounded-lg shadow-lg py-1 z-50"
          style={{ left: contextMenuPosition.x, top: contextMenuPosition.y }}
        >
          <button
            onClick={() => {
              const folder = folders.find(f => f.id === showContextMenu);
              handleEditFolder(folder);
            }}
            className="w-full px-4 py-2 text-left hover:bg-secondary-100 dark:hover:bg-secondary-700 flex items-center gap-2"
          >
            <Edit2 className="w-4 h-4" />
            <span>Bewerken</span>
          </button>
          <button
            onClick={() => handleDeleteFolder(showContextMenu)}
            className="w-full px-4 py-2 text-left hover:bg-secondary-100 dark:hover:bg-secondary-700 flex items-center gap-2 text-red-600 dark:text-red-400"
          >
            <Trash2 className="w-4 h-4" />
            <span>Verwijderen</span>
          </button>
        </div>
      )}
      
      {/* Sort Menu */}
      {showContextMenu === 'sort' && (
        <div
          className="absolute bg-white dark:bg-secondary-800 border border-secondary-300 dark:border-secondary-600 rounded-lg shadow-lg py-1 z-50"
          style={{ left: contextMenuPosition.x, top: contextMenuPosition.y }}
        >
          <button
            onClick={() => {
              setSortBy('name');
              setShowContextMenu(null);
            }}
            className={`w-full px-4 py-2 text-left hover:bg-secondary-100 dark:hover:bg-secondary-700 flex items-center gap-2 ${
              sortBy === 'name' ? 'text-primary-600 dark:text-primary-400' : ''
            }`}
          >
            <SortAsc className="w-4 h-4" />
            <span>Alfabetisch</span>
          </button>
          <button
            onClick={() => {
              setSortBy('date');
              setShowContextMenu(null);
            }}
            className={`w-full px-4 py-2 text-left hover:bg-secondary-100 dark:hover:bg-secondary-700 flex items-center gap-2 ${
              sortBy === 'date' ? 'text-primary-600 dark:text-primary-400' : ''
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Datum gewijzigd</span>
          </button>
          <button
            onClick={() => {
              setSortBy('type');
              setShowContextMenu(null);
            }}
            className={`w-full px-4 py-2 text-left hover:bg-secondary-100 dark:hover:bg-secondary-700 flex items-center gap-2 ${
              sortBy === 'type' ? 'text-primary-600 dark:text-primary-400' : ''
            }`}
          >
            <FileType className="w-4 h-4" />
            <span>Type</span>
          </button>
        </div>
      )}

      {/* Folder Modal */}
      {showFolderModal && (
        <FolderModal
          isOpen={showFolderModal}
          onClose={() => {
            setShowFolderModal(false);
            setEditingFolder(null);
            setParentFolderForNew(null);
          }}
          onSave={handleSaveFolder}
          folder={editingFolder}
          parentFolder={parentFolderForNew}
          folders={folders}
        />
      )}
    </>
  );
};

export default CollapsibleFolderTree;