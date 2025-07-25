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
  Minimize2,
  Maximize2,
  Search,
  ArrowUpDown,
  Check,
  X
} from 'lucide-react';

// @dnd-kit imports DISABLED to prevent crashes
// import {
//   DndContext,
//   PointerSensor,
//   KeyboardSensor,
//   useSensor,
//   useSensors,
//   closestCenter,
//   DragOverlay
// } from '@dnd-kit/core';
// import {
//   SortableContext,
//   verticalListSortingStrategy,
//   sortableKeyboardCoordinates,
//   arrayMove
// } from '@dnd-kit/sortable';
// import {
//   useSortable
// } from '@dnd-kit/sortable';
// import { CSS } from '@dnd-kit/utilities';


import FolderModal from './FolderModal';
import { AVAILABLE_ICONS } from '../../constants/folderIcons';
import { useFolderUIState } from '../../hooks/queries/useUIStateQuery';
import { useUserPreferences } from '../../hooks/domain/useUserPreferences';
import { useFavorites } from '../../hooks/useFavorites';
import { createVirtualHomeFolder, getAllFoldersIncludingHome } from '../../utils/localStorageManager';
import ThemeToggle from '../common/ThemeToggle';
// Removed AdvancedSearch - using simple search input for folders only


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
  onAccountClick,
  // Search props - simple folder search only
  searchQuery = '',
  setSearchQuery
}) => {
  const queryClient = useQueryClient();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { favorites: favoriteFolders, toggle: toggleFolderFavorite, showOnlyFavorites: filterFavorites } = useFavorites('folders');
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  
  // Drag & Drop state
  const [activeFolder, setActiveFolder] = useState(null);
  const [hoverTarget, setHoverTarget] = useState(null);
  const [showSubfolderPreview, setShowSubfolderPreview] = useState(false);
  const [isDragModeEnabled, setIsDragModeEnabled] = useState(false); // FORCE DISABLED
  
  // Hover timer for subfolder creation
  const [hoverTimer, setHoverTimer] = useState(null);
  
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
  
  // Reorder mode state
  const [isReorderMode, setIsReorderMode] = useState(false);
  const [originalFolderOrder, setOriginalFolderOrder] = useState([]);
  const [modifiedFolders, setModifiedFolders] = useState(new Set());
  const [tempFolders, setTempFolders] = useState([]);

  // Configure drag & drop sensors with iOS-style long press - DISABLED
  // const sensors = useSensors(
  //   useSensor(PointerSensor, {
  //     activationConstraint: {
  //       delay: 500,           // 500ms long press like iOS
  //       tolerance: 5,         // 5px movement tolerance
  //     },
  //   }),
  //   useSensor(KeyboardSensor, {
  //     coordinateGetter: sortableKeyboardCoordinates,
  //   })
  // );

  // Drag event handlers
  const handleDragStart = (event) => {
    const { active } = event;
    const folder = folders.find(f => f.id === active.id);
    
    setActiveFolder(folder);
    
    // Haptic feedback simulation
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
    
    // Visual feedback for whole app
    document.body.classList.add('dragging-folder');
    
    console.log('🎯 Drag started for folder:', folder?.name);
  };

  const clearHoverTimer = useCallback(() => {
    if (hoverTimer) {
      clearTimeout(hoverTimer);
      setHoverTimer(null);
    }
    setHoverTarget(null);
    setShowSubfolderPreview(false);
  }, [hoverTimer]);

  const handleDragOver = (event) => {
    const { active, over } = event;
    
    if (!over || over.id === active.id) {
      clearHoverTimer();
      return;
    }
    
    // Start hover timer for subfolder creation
    if (!hoverTimer) {
      const timer = setTimeout(() => {
        setHoverTarget(over.id);
        setShowSubfolderPreview(true);
        
        // Subtle haptic feedback
        if (navigator.vibrate) {
          navigator.vibrate(25);
        }
        
        console.log('🎯 Hover target set:', over.id);
      }, 1000);
      
      setHoverTimer(timer);
    }
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    
    setActiveFolder(null);
    clearHoverTimer();
    document.body.classList.remove('dragging-folder');
    
    if (!over) {
      console.log('🎯 Drag ended - no valid drop target');
      return;
    }
    
    const activeFolder = folders.find(f => f.id === active.id);
    const overFolder = folders.find(f => f.id === over.id);
    
    if (active.id === over.id) {
      console.log('🎯 Drag ended - same folder, no action needed');
      return;
    }
    
    if (showSubfolderPreview && hoverTarget === over.id) {
      // Long hover detected - create subfolder
      console.log('🎯 Creating subfolder:', activeFolder?.name, 'inside', overFolder?.name);
      handleCreateSubfolder(activeFolder, overFolder);
    } else {
      // Short drag - move to sibling level of target folder
      console.log('🎯 Moving folder:', activeFolder?.name, 'to same level as', overFolder?.name);
      handleReorderFolders(activeFolder, overFolder);
    }
  };

  // Sync tempFolders in reorder mode (favorites now handled by useFavorites hook)
  useEffect(() => {
    // If we're in reorder mode and folders change (e.g., after save), update tempFolders
    if (isReorderMode && folders.length > 0) {
      console.log('🔄 Folders updated while in reorder mode, syncing tempFolders');
      setTempFolders([...folders]);
      setModifiedFolders(new Set()); // Clear modifications since data is now fresh
    }
  }, [folders, isReorderMode]);


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

  // Drag & Drop helper functions
  const canCreateSubfolder = (sourceFolder, targetFolder) => {
    // Prevent circular references
    if (isDescendantOf(sourceFolder.id, targetFolder.id)) {
      return false;
    }
    
    // Prevent self-nesting
    if (sourceFolder.id === targetFolder.id) {
      return false;
    }
    
    return true;
  };

  const isDescendantOf = (sourceId, targetId) => {
    const findDescendants = (parentId) => {
      return folders
        .filter(f => f.parentId === parentId)
        .reduce((descendants, child) => {
          return [...descendants, child.id, ...findDescendants(child.id)];
        }, []);
    };
    
    return findDescendants(targetId).includes(sourceId);
  };

  const handleCreateSubfolder = async (sourceFolder, targetFolder) => {
    if (!canCreateSubfolder(sourceFolder, targetFolder)) {
      console.warn('Cannot create subfolder - would create circular reference');
      return;
    }
    
    // Get existing subfolders to determine sort order
    const existingSubfolders = folders.filter(f => f.parentId === targetFolder.id);
    
    const updatedFolder = {
      ...sourceFolder,
      parentId: targetFolder.id,
      sortOrder: existingSubfolders.length, // Add at end
    };
    
    try {
      await onUpdateFolder(updatedFolder);
      console.log('✅ Successfully created subfolder');
    } catch (error) {
      console.error('❌ Failed to create subfolder:', error);
    }
  };

  const handleReorderFolders = async (activeFolder, overFolder) => {
    if (!onUpdateFolder) {
      console.warn('onUpdateFolder callback not provided');
      return;
    }
    
    const activeParentId = activeFolder.parentId || 'root';
    const overParentId = overFolder.parentId || 'root';
    
    // Check if it's cross-parent movement
    if (activeParentId !== overParentId) {
      console.log('🔄 Cross-parent movement detected - moving to sibling level');
      
      // Move active folder to same parent as over folder, positioned after it
      const targetParentId = overParentId;
      const siblingFolders = folders.filter(f => (f.parentId || 'root') === targetParentId);
      const overIndex = siblingFolders.findIndex(f => f.id === overFolder.id);
      
      const updatedFolder = {
        ...activeFolder,
        parentId: targetParentId === 'root' ? null : targetParentId,
        sortOrder: overIndex + 1 // Position after the over folder
      };
      
      try {
        await onUpdateFolder(updatedFolder);
        console.log('✅ Successfully moved folder to new parent');
      } catch (error) {
        console.error('❌ Failed to move folder:', error);
      }
      return;
    }
    
    // Same parent - reorder within same level
    if (!onReorderFolders) {
      console.warn('onReorderFolders callback not provided for same-parent reordering');
      return;
    }
    
    const siblingFolders = folders.filter(f => (f.parentId || 'root') === activeParentId);
    
    const activeIndex = siblingFolders.findIndex(f => f.id === activeFolder.id);
    const overIndex = siblingFolders.findIndex(f => f.id === overFolder.id);
    
    if (activeIndex !== -1 && overIndex !== -1) {
      const reorderedFolders = arrayMove(siblingFolders, activeIndex, overIndex);
      
      // Update sort orders
      const updatedFolders = reorderedFolders.map((folder, index) => ({
        ...folder,
        sortOrder: index
      }));
      
      onReorderFolders(updatedFolders);
    }
  };

  // Build folder hierarchy (moved before getAllDraggableFolderIds to fix hoisting issue)
  const buildFolderTree = useCallback((parentId = null) => {
    // Use tempFolders in reorder mode, otherwise use normal folders
    const foldersToUse = isReorderMode ? tempFolders : folders;
    
    // Special handling for favorites filter - show all favorite folders at root level
    if (showOnlyFavorites && parentId === 'root') {
      // Get all favorite folders regardless of their actual parent using the hook
      let filteredFolders = filterFavorites(foldersToUse);
      
      // Apply search filter if needed
      if (searchQuery && searchQuery.trim()) {
        const lowerSearchQuery = searchQuery.toLowerCase().trim();
        filteredFolders = filteredFolders.filter(folder => {
          // Check if folder name matches
          if (folder.name.toLowerCase().includes(lowerSearchQuery)) {
            return true;
          }
          // Check if folder description matches
          if (folder.description && folder.description.toLowerCase().includes(lowerSearchQuery)) {
            return true;
          }
          return false;
        });
      }
      
      // Sort favorite folders
      filteredFolders.sort((a, b) => {
        const sortOrderA = a.sortOrder !== undefined && a.sortOrder !== null ? a.sortOrder : 999;
        const sortOrderB = b.sortOrder !== undefined && b.sortOrder !== null ? b.sortOrder : 999;
        
        // If sortOrder is different, use that
        if (sortOrderA !== sortOrderB) {
          return sortOrderA - sortOrderB;
        }
        
        // If in reorder mode or sortOrder is the same, don't apply secondary sorting
        if (isReorderMode) {
          return 0;
        }
        
        // Apply secondary sorting based on sortBy setting
        switch (sortBy) {
          case 'date':
            return new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt);
          case 'type':
            const typeA = a.type || 'folder';
            const typeB = b.type || 'folder';
            return typeA.localeCompare(typeB);
          case 'name':
          default:
            return a.name.localeCompare(b.name);
        }
      });
      
      return filteredFolders;
    }
    
    // For non-favorites view or when looking at children in favorites view, use normal hierarchy
    if (showOnlyFavorites && parentId !== 'root') {
      // Don't show children when in favorites mode (since we show all favorites at root level)
      return [];
    }
    
    // Normal hierarchy handling
    // Normalize parentId - treat 'root', null, and undefined as the same
    const normalizedParentId = parentId === 'root' ? null : parentId;
    let filteredFolders = foldersToUse.filter(folder => {
      const folderParentId = folder.parentId === 'root' ? null : folder.parentId;
      return folderParentId === normalizedParentId;
    });
    
    // Apply search filter - show folders that match search query or have matching children
    if (searchQuery && searchQuery.trim()) {
      const lowerSearchQuery = searchQuery.toLowerCase().trim();
      filteredFolders = filteredFolders.filter(folder => {
        // Check if folder name matches
        if (folder.name.toLowerCase().includes(lowerSearchQuery)) {
          return true;
        }
        // Check if folder description matches
        if (folder.description && folder.description.toLowerCase().includes(lowerSearchQuery)) {
          return true;
        }
        // TODO: Could also check if any child folders match (recursive search)
        return false;
      });
    }
    
    // Always prioritize sortOrder first, then apply secondary sorting
    filteredFolders.sort((a, b) => {
      const sortOrderA = a.sortOrder !== undefined && a.sortOrder !== null ? a.sortOrder : 999;
      const sortOrderB = b.sortOrder !== undefined && b.sortOrder !== null ? b.sortOrder : 999;
      
      // If sortOrder is different, use that
      if (sortOrderA !== sortOrderB) {
        return sortOrderA - sortOrderB;
      }
      
      // If in reorder mode or sortOrder is the same, don't apply secondary sorting
      if (isReorderMode) {
        return 0;
      }
      
      // Apply secondary sorting based on sortBy setting
      switch (sortBy) {
        case 'date':
          return new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt);
        case 'type':
          const typeA = a.type || 'folder';
          const typeB = b.type || 'folder';
          return typeA.localeCompare(typeB);
        case 'name':
        default:
          return a.name.localeCompare(b.name);
      }
    });
    
    return filteredFolders;
  }, [folders, tempFolders, isReorderMode, expandedFolders, showOnlyFavorites, favoriteFolders, filterFavorites, sortBy, searchQuery]);


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
    
    // Use the hook's toggle function for persistence
    toggleFolderFavorite(folderId);
    
    // Keep the folder's favorite status in sync for compatibility
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

  const handleCreateNewFolder = (parentId) => {
    const parent = folders.find(f => f.id === parentId) || { id: 'root', name: 'Root' };
    setParentFolderForNew(parent);
    setEditingFolder(null);
    setShowFolderModal(true);
    setShowContextMenu(null);
  };

  const handleFavoriteToggle = (folderId) => {
    // Use the hook's toggle function for persistence
    toggleFolderFavorite(folderId);

    // Update the folder in the parent component for compatibility
    const folder = folders.find(f => f.id === folderId);
    if (folder && onUpdateFolder) {
      onUpdateFolder({
        ...folder,
        favorite: !folder.favorite
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
        ? 'This folder contains subfolders. Are you sure you want to delete this folder and all its content?'
        : 'Are you sure you want to delete this folder?';
      
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

  // Reorder mode functions
  const enterReorderMode = () => {
    
    // Use the folders as-is from props (parent component should ensure sortOrder)
    // Save original folder order for cancel functionality  
    setOriginalFolderOrder([...folders]);
    setTempFolders([...folders]);
    setModifiedFolders(new Set());
    setIsReorderMode(true);
  };

  const exitReorderMode = () => {
    setIsReorderMode(false);
    setOriginalFolderOrder([]);
    setModifiedFolders(new Set());
    setTempFolders([]);
  };

  const moveFolderUp = (folderId, parentId) => {
    
    // Update visual state immediately (tempFolders)
    updateFolderPositionVisually(folderId, parentId, 'up');
  };

  const updateFolderPositionVisually = (folderId, parentId, direction) => {
    
    const updatedFolders = [...tempFolders];
    // Normalize parentId for consistent comparison
    const normalizedParentId = parentId === 'root' ? null : parentId;
    const siblings = updatedFolders.filter(f => {
      const folderParentId = f.parentId === 'root' ? null : f.parentId;
      return folderParentId === normalizedParentId;
    }).sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
    
    
    const folderIndex = siblings.findIndex(f => f.id === folderId);
    
    let targetIndex;
    if (direction === 'up') {
      if (folderIndex <= 0) {
        return;
      }
      targetIndex = folderIndex - 1;
    } else { // direction === 'down'
      if (folderIndex === -1 || folderIndex >= siblings.length - 1) {
        return;
      }
      targetIndex = folderIndex + 1;
    }


    // Swap sortOrder with target sibling
    const currentFolder = siblings[folderIndex];
    const targetFolder = siblings[targetIndex];
    
    
    const tempOrder = currentFolder.sortOrder;
    currentFolder.sortOrder = targetFolder.sortOrder;
    targetFolder.sortOrder = tempOrder;

    // Update the global folders array
    const currentFolderGlobalIndex = updatedFolders.findIndex(f => f.id === folderId);
    const targetFolderGlobalIndex = updatedFolders.findIndex(f => f.id === targetFolder.id);
    
    
    updatedFolders[currentFolderGlobalIndex] = currentFolder;
    updatedFolders[targetFolderGlobalIndex] = targetFolder;

    
    // Update UI state immediately - this triggers re-render
    setTempFolders(updatedFolders);
    setModifiedFolders(prev => {
      const newSet = new Set([...prev, folderId, targetFolder.id]);
      return newSet;
    });
  };

  const moveFolderDown = (folderId, parentId) => {
    
    // Update visual state immediately (tempFolders)
    updateFolderPositionVisually(folderId, parentId, 'down');
  };

  const saveReorderChanges = async () => {
    if (modifiedFolders.size === 0) {
      exitReorderMode();
      return;
    }


    try {
      // Prepare updates for persistence
      const updates = Array.from(modifiedFolders).map(folderId => {
        const folder = tempFolders.find(f => f.id === folderId);
        if (!folder) {
          throw new Error(`Folder met ID ${folderId} niet gevonden`);
        }
        return {
          id: folder.id,
          sortOrder: folder.sortOrder
        };
      });


      // Save to localStorage (persistence layer)
      await onReorderFolders(tempFolders.filter(f => modifiedFolders.has(f.id)));
      
      exitReorderMode();
    } catch (error) {
      console.error('Failed to save reorder changes:', error);
      
      // Revert visual state to original on error
      setTempFolders([...originalFolderOrder]);
      setModifiedFolders(new Set());
      
      // In a real app, you'd show a toast notification here
      alert(`Er is een fout opgetreden bij het opslaan: ${error.message}`);
    }
  };

  const cancelReorderChanges = () => {
    // Revert to original folder order
    setTempFolders([...originalFolderOrder]);
    exitReorderMode();
  };

  // Helper functions for reorder mode
  const isFirstInParent = (folderId, parentId) => {
    const foldersToUse = isReorderMode ? tempFolders : folders;
    // Normalize parentId for consistent comparison
    const normalizedParentId = parentId === 'root' ? null : parentId;
    const siblings = foldersToUse
      .filter(f => {
        const folderParentId = f.parentId === 'root' ? null : f.parentId;
        return folderParentId === normalizedParentId;
      })
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
    return siblings.length > 0 && siblings[0].id === folderId;
  };

  const isLastInParent = (folderId, parentId) => {
    const foldersToUse = isReorderMode ? tempFolders : folders;
    // Normalize parentId for consistent comparison
    const normalizedParentId = parentId === 'root' ? null : parentId;
    const siblings = foldersToUse
      .filter(f => {
        const folderParentId = f.parentId === 'root' ? null : f.parentId;
        return folderParentId === normalizedParentId;
      })
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
    return siblings.length > 0 && siblings[siblings.length - 1].id === folderId;
  };

  const renderFolderIcon = (folder, isSelected) => {
    // Special handling for Home folder icon
    if (folder.isSpecial && folder.icon === 'Home') {
      const IconComponent = Home;
      return (
        <IconComponent 
          className={`w-4 h-4 mr-2 ${
            isSelected 
              ? 'text-primary-600 dark:text-primary-400' 
              : 'text-secondary-600 dark:text-secondary-400'
          }`}
        />
      );
    }
    
    const iconName = folder.icon || 'FolderClosed';
    const IconComponent = AVAILABLE_ICONS[iconName] || AVAILABLE_ICONS.FolderClosed;
    
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

  // SortableFolder component with drag & drop functionality
  const SortableFolder = ({ folder, depth, isHoverTarget }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({
      id: folder.id,
      data: {
        type: 'folder',
        folder,
      },
      transition: {
        duration: 350,
        easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)', // Spring easing
      },
    });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      ...getDragStyles(isDragging, isHoverTarget),
    };

    return (
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        className={getDragClassName(isDragging, isHoverTarget)}
        data-folder-id={folder.id}
      >
        {renderFolderContent(folder, depth, isDragging)}
      </div>
    );
  };

  // Helper functions for drag styling
  const getDragStyles = (isDragging, isHoverTarget) => {
    if (isDragging) {
      return {
        opacity: 0.3,
        transform: 'scale(0.95)',
        filter: 'grayscale(50%)',
      };
    }
    
    if (isHoverTarget) {
      return {
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        boxShadow: '0 0 0 2px rgba(59, 130, 246, 0.3)',
        transform: 'scale(1.02)',
        borderRadius: '8px',
      };
    }
    
    return {};
  };

  const getDragClassName = (isDragging, isHoverTarget) => {
    let classes = 'folder-item transition-all duration-200';
    
    if (isDragging) classes += ' dragging';
    if (isHoverTarget) classes += ' hover-target animate-pulse';
    
    return classes;
  };

  // Common folder content renderer
  const renderFolderContent = (folder, depth, isDragging = false) => {
    const children = buildFolderTree(folder.id);
    const isExpanded = expandedFolders.has(folder.id);
    const isSelected = selectedFolderId === folder.id;
    const isFavorite = favoriteFolders.has(folder.id);
    const folderHasChildren = children.length > 0;
    const isModified = isReorderMode && modifiedFolders.has(folder.id);

    return (
      <>
        <div
          data-folder-id={folder.id}
          className={`
            group flex items-center px-2 py-1.5 rounded-md mb-0.5 relative transition-all ${
              isReorderMode ? 'cursor-default' : 'cursor-pointer'
            }
            ${isSelected 
              ? 'text-primary-600 dark:text-primary-400 bg-primary-50/50 dark:bg-primary-900/10' 
              : 'hover:bg-secondary-100 dark:hover:bg-secondary-700 text-secondary-700 dark:text-secondary-300'
            }
            ${isReorderMode && !isModified
              ? 'opacity-75'
              : ''
            }
          `}
          style={{ paddingLeft: `${8 + depth * 16}px` }}
          onClick={() => !isReorderMode && onFolderSelect(folder.id)}
          onContextMenu={(e) => !isReorderMode && handleContextMenu(e, folder)}
        >
          {folderHasChildren ? (
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
          ) : (
            <div className="mr-1 p-1 w-6 h-6" />
          )}
          
          {renderFolderIcon(folder, isSelected)}
          
          <div className="flex-1 min-w-0">
            <span className="truncate block">{folder.name}</span>
          </div>
          
          {/* Actions */}
              {!isReorderMode && (
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
              )}
              
              {/* Context menu button */}
              {folder.id !== 'root' && !isReorderMode && (
                <button
                  data-folder-context
                  onClick={(e) => handleContextMenu(e, folder)}
                  className="ml-1 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-secondary-200 dark:hover:bg-secondary-700"
                  title="Meer opties"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
              )}

              {/* Reorder arrows - hidden for special folders like Home */}
              {isReorderMode && !folder.isSpecial && (
                <div className="flex flex-col ml-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      moveFolderUp(folder.id, folder.parentId);
                    }}
                    disabled={isFirstInParent(folder.id, folder.parentId)}
                    className={`p-1.5 hover:bg-secondary-200 dark:hover:bg-secondary-700 rounded transition-colors ${
                      isFirstInParent(folder.id, folder.parentId) 
                        ? 'opacity-30 cursor-not-allowed' 
                        : 'hover:bg-primary-100 dark:hover:bg-primary-900/30'
                    }`}
                    title="Omhoog verplaatsen"
                    aria-label={`${folder.name} omhoog verplaatsen`}
                  >
                    <ChevronUp className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      moveFolderDown(folder.id, folder.parentId);
                    }}
                    disabled={isLastInParent(folder.id, folder.parentId)}
                    className={`p-1.5 hover:bg-secondary-200 dark:hover:bg-secondary-700 rounded transition-colors ${
                      isLastInParent(folder.id, folder.parentId) 
                        ? 'opacity-30 cursor-not-allowed' 
                        : 'hover:bg-primary-100 dark:hover:bg-primary-900/30'
                    }`}
                    title="Omlaag verplaatsen"
                    aria-label={`${folder.name} omlaag verplaatsen`}
                  >
                    <ChevronDown className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                  </button>
                </div>
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
              {children.map((child) => renderFolder(child, depth + 1))}
            </div>
          )}
        </div>
      </>
    );
  };

  const renderFolder = (folder, depth = 0) => {
    if (isDragModeEnabled) {
      return (
        <SortableFolder 
          key={folder.id} 
          folder={folder} 
          depth={depth}
          isHoverTarget={hoverTarget === folder.id}
        />
      );
    }
    
    // Fallback to non-draggable version if drag mode is disabled
    return (
      <div key={folder.id} data-folder-id={folder.id}>
        {renderFolderContent(folder, depth)}
      </div>
    );
  };

  const renderCollapsedView = () => {
    const favoriteFoldersList = getFavoriteFolders();
    const subfoldersList = getSubfoldersForCollapsedView();
    
    // Check if root/home folder is marked as favorite
    const isRootFavorite = favoriteFolders.has('root');
    
    console.log('🔍 CollapsedView Debug:', {
      isCollapsed,
      favoriteFoldersCount: favoriteFoldersList.length,
      favoriteIds: favoriteFoldersList.map(f => f.id),
      favoriteNames: favoriteFoldersList.map(f => f.name),
      favoriteFoldersSet: Array.from(favoriteFolders),
      isRootFavorite,
      selectedFolderId,
      showOnlyFavorites,
      // Check if any favorite folder is actually the Home folder with different ID
      hasHomeInFavorites: favoriteFoldersList.some(f => f.name === 'Home' || f.id === 'root')
    });
    
    return (
      <div className="flex flex-col h-full bg-secondary-50 dark:bg-secondary-900 border-r border-secondary-200 dark:border-secondary-800">
        {/* Toggle button */}
        <div className="p-2 border-b border-secondary-200 dark:border-secondary-700 mb-4">
          <button
            onClick={() => setIsCollapsed(false)}
            className="w-full p-2 hover:bg-secondary-200 dark:hover:bg-secondary-800 rounded-lg transition-colors text-secondary-600 dark:text-secondary-400"
            title="Expand sidebar"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Home button - only show if it's marked as favorite */}
        {isRootFavorite && (
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
        )}

        {/* Scrollable content area */}
        <div className="flex-1 overflow-y-auto px-2">
          {/* Favorite folders - exclude any Home folders that might have slipped in */}
          {favoriteFoldersList
            .filter(folder => folder.id !== 'root' && folder.name !== 'Home')
            .map(folder => {
              const IconComponent = AVAILABLE_ICONS[folder.icon || 'FolderClosed'] || AVAILABLE_ICONS.FolderClosed;
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
            const IconComponent = AVAILABLE_ICONS[folder.icon || 'FolderClosed'] || AVAILABLE_ICONS.FolderClosed;
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
          {/* Search Button */}
          {setSearchQuery && (
            <button
              onClick={() => {
                // Expand sidebar and toggle search visibility
                setIsCollapsed(false);
                setIsSearchVisible(!isSearchVisible);
                
                // Focus search input after expansion and visibility toggle
                setTimeout(() => {
                  if (!isSearchVisible) {
                    const searchInput = document.querySelector('input[placeholder*="Search"]');
                    if (searchInput) searchInput.focus();
                  }
                }, 150);
              }}
              className={`w-full p-3 hover:bg-secondary-200 dark:hover:bg-secondary-800 rounded-lg transition-colors ${
                isSearchVisible 
                  ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400' 
                  : 'text-secondary-600 dark:text-secondary-400'
              }`}
              title={isSearchVisible ? "Hide Search" : "Show Search"}
            >
              <Search className="w-5 h-5 mx-auto" />
            </button>
          )}
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
                >
                  <FolderPlus className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsCollapsed(true)}
                  className="p-2 hover:bg-secondary-200 dark:hover:bg-secondary-800 rounded-lg transition-colors text-secondary-600 dark:text-secondary-400"
                  title="Collapse sidebar"
                >
                  <ChevronLeft className="w-5 h-5 text-secondary-600 dark:text-secondary-400" />
                </button>
              </div>
            </div>
          </div>
          
          {/* Simple Folder Search */}
          {setSearchQuery && isSearchVisible && (
            <div className="px-4 pb-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-secondary-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search folders..."
                  className="w-full pl-10 pr-4 py-2 text-sm border border-secondary-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-800 text-secondary-900 dark:text-secondary-100 placeholder-secondary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-secondary-400 hover:text-secondary-600 dark:hover:text-secondary-300"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          )}
          
          {/* Toolbar */}
          <div className="px-4 pb-3 flex items-center justify-between">
            <div className="flex items-center gap-1">
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
            
            
            {/* Reorder folders button */}
            <div className="relative">
              <button
                onClick={enterReorderMode}
                disabled={isReorderMode}
                className={`p-1.5 hover:bg-secondary-100 dark:hover:bg-secondary-800 rounded text-secondary-600 dark:text-secondary-400 flex items-center gap-1 ${
                  isReorderMode ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                title="Reorder folders"
                aria-label="Start reorder mode for folders"
              >
                <ArrowUpDown className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Reorder toolbar */}
        {isReorderMode && (
          <div className="flex items-center justify-between px-4 py-2 bg-primary-50 dark:bg-primary-900/20 border-b border-primary-200 dark:border-primary-800">
            <div className="flex items-center gap-2">
              <ArrowUpDown className="w-4 h-4 text-primary-600 dark:text-primary-400" />
              <span className="text-sm font-medium text-primary-700 dark:text-primary-300">
                Reorder
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={saveReorderChanges}
                className="p-2 rounded flex items-center justify-center hover:bg-primary-100 dark:hover:bg-primary-900/30 text-primary-600 dark:text-primary-400 transition-colors"
                title="Save changes"
              >
                <Check className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Folder tree with drag and drop */}
        <div className={`flex-1 overflow-y-auto p-2 ${isReorderMode ? 'bg-secondary-50/50 dark:bg-secondary-900/50' : ''}`}>
          {/* Home folder (not draggable) */}
          <div
            className={`
              group flex items-center px-2 py-1.5 cursor-pointer rounded-md mb-0.5 relative
              ${selectedFolderId === 'root' 
                ? 'text-primary-600 dark:text-primary-400 bg-primary-50/50 dark:bg-primary-900/10' 
                : 'hover:bg-secondary-100 dark:hover:bg-secondary-700 text-secondary-700 dark:text-secondary-300'
              }
            `}
            onClick={() => onFolderSelect('root')}
          >
            {/* Placeholder for chevron alignment */}
            <div className="mr-1 p-1 w-6 h-6" />
            <Home className="w-4 h-4 mr-2" />
            <div className="flex-1 min-w-0">
              <span className="font-medium">Home</span>
            </div>
            
            {/* Favorite button for Home folder */}
            {!isReorderMode && (
              <button
                onClick={(e) => {
                  toggleFavorite('root', e);
                  e.currentTarget.blur();
                }}
                className="ml-1 p-1 rounded border border-transparent hover:border-secondary-300 dark:hover:border-secondary-600 opacity-0 group-hover:opacity-100 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-opacity-50"
                title={favoriteFolders.has('root') ? 'Remove from favorites' : 'Add to favorites'}
              >
                <svg 
                  className={`w-4 h-4 text-secondary-600 dark:text-secondary-300 ${favoriteFolders.has('root') ? 'fill-current' : ''}`}
                  fill={favoriteFolders.has('root') ? 'currentColor' : 'none'}
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </button>
            )}
          </div>

          {/* Root folders with drag & drop */}
          {/* Drag mode temporarily disabled to prevent crashes */}
          <div>
            {rootFolders.map((folder) => renderFolder(folder, 0))}
          </div>
        </div>

        {/* Bottom buttons */}
        <div className="p-3 border-t border-secondary-200 dark:border-secondary-700 flex justify-between items-center">
          {/* Search Button */}
          {setSearchQuery && (
            <button
              onClick={() => {
                setIsSearchVisible(!isSearchVisible);
                
                // Focus search input after visibility toggle
                setTimeout(() => {
                  if (!isSearchVisible) {
                    const searchInput = document.querySelector('input[placeholder*="Search"]');
                    if (searchInput) searchInput.focus();
                  }
                }, 100);
              }}
              className={`p-2 hover:bg-secondary-100 dark:hover:bg-secondary-800 rounded-lg transition-colors ${
                isSearchVisible 
                  ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400' 
                  : 'text-secondary-600 dark:text-secondary-400'
              }`}
              title={isSearchVisible ? "Hide Search" : "Show Search"}
            >
              <Search className="w-4 h-4" />
            </button>
          )}
          
          {onAccountClick ? (
            <button
              onClick={onAccountClick}
              className="p-2 hover:bg-secondary-100 dark:hover:bg-secondary-800 rounded-lg text-secondary-600 dark:text-secondary-400 transition-colors"
              title="Account"
            >
              <User className="w-4 h-4" />
            </button>
          ) : setSearchQuery ? (
            <div className="w-8" />
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
      {showContextMenu && (
        <div
          className="fixed bg-white dark:bg-secondary-800 border border-secondary-300 dark:border-secondary-600 rounded-lg shadow-lg py-1 z-50"
          style={{ left: contextMenuPosition.x, top: contextMenuPosition.y }}
        >
          <button
            onClick={() => handleCreateNewFolder(showContextMenu)}
            className="w-full px-4 py-2 text-left hover:bg-secondary-100 dark:hover:bg-secondary-700 flex items-center gap-2"
          >
            <FolderPlus className="w-4 h-4" />
            <span>Nieuwe submap</span>
          </button>
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
            <span>Delete</span>
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