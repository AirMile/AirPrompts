import React, { useState, useEffect } from 'react';
import { Settings, User, MoreVertical, Edit2, Trash2, Plus, FolderPlus, ChevronDown, ChevronUp } from 'lucide-react';
import FolderModal from './FolderModal';
import { AVAILABLE_ICONS } from '../../constants/folderIcons';
import { useUserPreferences } from '../../hooks/domain/useUserPreferences';

const FolderTree = ({ 
  folders = [], 
  selectedFolderId, 
  onFolderSelect, 
  onCreateFolder,
  onUpdateFolder,
  onDeleteFolder,
  className = '',
  onSettingsClick
}) => {
  const [expandedFolders, setExpandedFolders] = useState(new Set(['root', 'general']));
  const [favoriteFolders, setFavoriteFolders] = useState(new Set());
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [editingFolder, setEditingFolder] = useState(null);
  const [parentFolderForNew, setParentFolderForNew] = useState(null);
  const [showContextMenu, setShowContextMenu] = useState(null);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  
  // Use preferences for confirm actions
  const { confirmActions } = useUserPreferences();

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

  // Build folder hierarchy
  const buildFolderTree = (parentId = null) => {
    return folders
      .filter(folder => folder.parentId === parentId)
      .sort((a, b) => {
        // Sort alphabetically only - don't prioritize favorites
        return a.name.localeCompare(b.name);
      });
  };

  const toggleFolder = (folderId) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  const hasChildren = (folderId) => {
    return folders.some(folder => folder.parentId === folderId);
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

  const expandAll = () => {
    const allFolderIds = new Set(folders.map(f => f.id));
    setExpandedFolders(allFolderIds);
  };

  const collapseAll = () => {
    setExpandedFolders(new Set(['root']));
  };

  // Helper functions
  const handleContextMenu = (e, folder) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setContextMenuPosition({ x: rect.right, y: rect.bottom });
    setShowContextMenu(folder.id);
  };

  const handleCreateNewFolder = (parentId) => {
    const parent = folders.find(f => f.id === parentId) || { id: 'root', name: 'Root' };
    setParentFolderForNew(parent);
    setEditingFolder(null);
    setShowFolderModal(true);
  };

  const handleEditFolder = (folder) => {
    setEditingFolder(folder);
    setParentFolderForNew(null);
    setShowFolderModal(true);
    setShowContextMenu(null);
  };

  const handleDeleteFolder = (folderId) => {
    if (confirmActions.deleteFolder) {
      // Check if folder has children or items
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

  const renderFolderIcon = (folder, isSelected) => {
    const iconName = folder.icon || 'Folder';
    const IconComponent = AVAILABLE_ICONS[iconName] || AVAILABLE_ICONS.Folder;
    
    return (
      <IconComponent 
        className={`w-4 h-4 mr-2 ${isSelected ? 'text-primary-700 dark:text-primary-300' : 'text-primary-600 dark:text-primary-400'}`}
      />
    );
  };

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setShowContextMenu(null);
    if (showContextMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showContextMenu]);

  const renderFolder = (folder, level = 0) => {
    const isExpanded = expandedFolders.has(folder.id);
    const _isSelected = selectedFolderId === folder.id;
    const isFavorite = favoriteFolders.has(folder.id);
    const children = buildFolderTree(folder.id);
    const folderHasChildren = hasChildren(folder.id);

    return (
      <div key={folder.id} className="select-none">
        <div
          className={`
            flex items-center px-2 cursor-pointer rounded-md text-sm group
            hover:bg-secondary-100 dark:hover:bg-secondary-800
            text-secondary-700 dark:text-secondary-300
            py-1
            ${_isSelected ? 'bg-primary-100 dark:bg-primary-900/20 text-primary-800 dark:text-primary-200' : ''}
          `}
          style={{ paddingLeft: `${level * 12 + 8}px` }}
          onClick={() => onFolderSelect(folder.id)}
        >
          {folderHasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleFolder(folder.id);
              }}
              className="mr-1 p-1 hover:bg-secondary-200 dark:hover:bg-secondary-700 rounded"
            >
              <svg 
                className={`w-4 h-4 transform transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                fill="currentColor" 
                viewBox="0 0 20 20"
              >
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </button>
          )}
          {!folderHasChildren && <div className="w-4" />}
          
          {renderFolderIcon(folder, _isSelected)}
          
          <span className="truncate flex-1">{folder.name}</span>
          
          <button
            onClick={(e) => {
              toggleFavorite(folder.id, e);
              e.currentTarget.blur(); // Remove focus after click
            }}
            className={`ml-1 p-1 rounded border border-transparent hover:border-secondary-300 dark:hover:border-secondary-600 opacity-0 group-hover:opacity-100 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-opacity-50 ${isFavorite ? 'opacity-100' : ''}`}
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
              onClick={(e) => handleContextMenu(e, folder)}
              className="ml-1 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-secondary-200 dark:hover:bg-secondary-700"
              title="Meer opties"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
          )}
        </div>

        {isExpanded && children.length > 0 && (
          <div>
            {children.map(child => renderFolder(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  // Skip root folder and show its children directly
  const topLevelFolders = buildFolderTree('root');

  return (
    <div className={`h-full flex flex-col ${className}`}>
      <div className="flex-1 overflow-y-auto">
        <div className="p-3">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-secondary-700 dark:text-secondary-300">
              Folders
            </h3>
            <div className="flex items-center gap-1">
              <button
                onClick={() => handleCreateNewFolder('root')}
                className="p-1 rounded hover:bg-secondary-100 dark:hover:bg-secondary-800 text-secondary-600 dark:text-secondary-400"
                title="Nieuwe map aanmaken"
              >
                <FolderPlus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Toggle Expand/Collapse Button */}
          <div className="mb-3">
            <button
              onClick={() => {
                // Check if most folders are expanded to determine toggle action
                const expandableFolders = folders.filter(f => hasChildren(f.id));
                const expandedCount = expandableFolders.filter(f => expandedFolders.has(f.id)).length;
                const isExpanded = expandedCount > expandableFolders.length / 2;
                
                if (isExpanded) {
                  collapseAll();
                } else {
                  expandAll();
                }
              }}
              className="w-full flex items-center justify-center gap-2 px-3 py-1.5 text-xs border border-secondary-300 dark:border-secondary-600 rounded text-secondary-600 dark:text-secondary-400 hover:bg-secondary-100 dark:hover:bg-secondary-800 transition-colors"
              title={expandedFolders.size > 1 ? "Collapse all folders" : "Expand all folders"}
            >
              {expandedFolders.size > 1 ? (
                <>
                  <ChevronUp className="w-3 h-3" />
                  <span>Collapse All</span>
                </>
              ) : (
                <>
                  <ChevronDown className="w-3 h-3" />
                  <span>Expand All</span>
                </>
              )}
            </button>
          </div>

          {/* Favorites Section */}
          {favoriteFolders.size > 0 && (
            <div className="mb-4">
              <h4 className="text-xs font-medium text-secondary-500 dark:text-secondary-400 mb-2 uppercase tracking-wide">
                Favorites
              </h4>
              <div className="space-y-1 border-b border-secondary-200 dark:border-secondary-700 pb-3 mb-3">
                {Array.from(favoriteFolders)
                  .map(id => folders.find(f => f.id === id))
                  .filter(Boolean)
                  .map(folder => {
                    const isSelected = selectedFolderId === folder.id;
                    return (
                    <div
                      key={`fav-${folder.id}`}
                      className={`
                        flex items-center cursor-pointer rounded-md text-sm group
                        hover:bg-secondary-100 dark:hover:bg-secondary-800
                        text-secondary-700 dark:text-secondary-300
                        py-1
                        ${isSelected ? 'bg-primary-100 dark:bg-primary-900/20 text-primary-800 dark:text-primary-200' : ''}
                      `}
                      style={{ paddingLeft: '8px', paddingRight: '8px' }}
                      onClick={() => onFolderSelect(folder.id)}
                    >
                      <div className="w-4 mr-1" />
                      {renderFolderIcon(folder, isSelected)}
                      <span className="truncate">{folder.name}</span>
                    </div>
                    );
                  })}
              </div>
            </div>
          )}

          <div className="space-y-1">
            {topLevelFolders.map(folder => renderFolder(folder))}
          </div>
        </div>
      </div>
      
      {/* Account & Settings Section */}
      <div className="border-t border-secondary-200 dark:border-secondary-700 p-3 bg-secondary-50 dark:bg-secondary-800">
        <div className="flex items-center justify-between">
          {/* Account Placeholder */}
          <div className="flex items-center gap-3 flex-1">
            <div className="w-8 h-8 bg-secondary-200 dark:bg-secondary-700 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-secondary-600 dark:text-secondary-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-secondary-700 dark:text-secondary-300 truncate">Account</div>
              <div className="text-xs text-secondary-500 dark:text-secondary-500">Not signed in</div>
            </div>
          </div>
          
          {/* Settings Button */}
          <button
            onClick={onSettingsClick}
            className="p-2 rounded-lg hover:bg-secondary-200 dark:hover:bg-secondary-700 text-secondary-600 dark:text-secondary-400 hover:text-secondary-700 dark:hover:text-secondary-300 transition-colors"
            title="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      {/* Context Menu */}
      {showContextMenu && (
        <div
          className="fixed bg-white dark:bg-secondary-800 rounded-lg shadow-lg border border-secondary-200 dark:border-secondary-700 py-1 z-50"
          style={{ left: contextMenuPosition.x, top: contextMenuPosition.y }}
        >
          <button
            onClick={() => {
              const folder = folders.find(f => f.id === showContextMenu);
              handleEditFolder(folder);
            }}
            className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-secondary-100 dark:hover:bg-secondary-700 w-full text-left"
          >
            <Edit2 className="w-4 h-4" />
            Bewerken
          </button>
          <button
            onClick={() => handleCreateNewFolder(showContextMenu)}
            className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-secondary-100 dark:hover:bg-secondary-700 w-full text-left"
          >
            <FolderPlus className="w-4 h-4" />
            Nieuwe submap
          </button>
          <hr className="my-1 border-secondary-200 dark:border-secondary-700" />
          <button
            onClick={() => handleDeleteFolder(showContextMenu)}
            className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 w-full text-left"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      )}
      
      {/* Folder Modal */}
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
    </div>
  );
};

export default FolderTree;