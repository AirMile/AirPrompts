import React, { useState, useEffect } from 'react';
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
  Maximize2
} from 'lucide-react';
import FolderModal from './FolderModal';
import { AVAILABLE_ICONS } from '../../constants/folderIcons';

const CollapsibleFolderTree = ({ 
  folders = [], 
  selectedFolderId, 
  onFolderSelect, 
  onCreateFolder,
  onUpdateFolder,
  onDeleteFolder,
  className = '',
  onSettingsClick,
  onAccountClick
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState(new Set(['root', 'general']));
  const [favoriteFolders, setFavoriteFolders] = useState(new Set());
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [editingFolder, setEditingFolder] = useState(null);
  const [parentFolderForNew, setParentFolderForNew] = useState(null);
  const [showContextMenu, setShowContextMenu] = useState(null);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  const [sortBy, setSortBy] = useState('name'); // 'name', 'date', 'type'

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

  // Get favorite folders for collapsed view
  const getFavoriteFolders = () => {
    return folders.filter(folder => favoriteFolders.has(folder.id));
  };

  // Build folder hierarchy
  const buildFolderTree = (parentId = null) => {
    let filteredFolders = folders.filter(folder => folder.parentId === parentId);
    
    // Apply favorites filter
    if (showOnlyFavorites && parentId === 'root') {
      filteredFolders = filteredFolders.filter(folder => favoriteFolders.has(folder.id));
    }
    
    // Apply sorting
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
        filteredFolders.sort((a, b) => a.name.localeCompare(b.name));
        break;
    }
    
    return filteredFolders;
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

  const handleDeleteFolder = (folderId) => {
    const hasSubfolders = folders.some(f => f.parentId === folderId);
    const warningMessage = hasSubfolders 
      ? 'Deze map bevat submappen. Weet je zeker dat je deze map en alle inhoud wilt verwijderen?'
      : 'Weet je zeker dat je deze map wilt verwijderen?';
    
    if (confirm(warningMessage)) {
      onDeleteFolder(folderId);
    }
    setShowContextMenu(null);
  };
  
  const collapseAll = () => {
    setExpandedFolders(new Set(['root']));
  };
  
  const expandAll = () => {
    const allFolderIds = new Set(['root']);
    folders.forEach(folder => {
      if (folder.id !== 'root') {
        allFolderIds.add(folder.id);
      }
    });
    setExpandedFolders(allFolderIds);
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

  const renderFolder = (folder, depth = 0, isFirst = false) => {
    const children = buildFolderTree(folder.id);
    const isExpanded = expandedFolders.has(folder.id);
    const isSelected = selectedFolderId === folder.id;
    const isFavorite = favoriteFolders.has(folder.id);
    const folderHasChildren = children.length > 0;
    const _isSelected = selectedFolderId === folder.id;

    return (
      <div key={folder.id}>
        <div
          className={`
            group flex items-center px-2 py-1.5 cursor-pointer rounded-md mb-0.5 relative
            ${isSelected 
              ? 'text-primary-600 dark:text-primary-400 bg-primary-50/50 dark:bg-primary-900/10' 
              : 'hover:bg-secondary-100 dark:hover:bg-secondary-700 text-secondary-700 dark:text-secondary-300'
            }
          `}
          style={{ paddingLeft: `${8 + depth * 16}px` }}
          onClick={() => onFolderSelect(folder.id)}
          onContextMenu={(e) => handleContextMenu(e, folder)}
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
      </div>
    );
  };

  const renderCollapsedView = () => {
    const favoriteFoldersList = getFavoriteFolders();
    
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
            onClick={() => onFolderSelect('home')}
            className={`w-full p-3 rounded-lg transition-colors relative ${
              selectedFolderId === 'home'
                ? 'text-primary-400 dark:text-primary-400'
                : 'hover:bg-secondary-200 dark:hover:bg-secondary-800 text-secondary-600 dark:text-secondary-400'
            }`}
            title="Home"
          >
            <Home className="w-5 h-5 mx-auto" />
            {selectedFolderId === 'home' && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary-500 dark:bg-primary-400 rounded-r" />
            )}
          </button>
        </div>

        {/* Favorite folders */}
        <div className="flex-1 overflow-y-auto px-2">
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
              <h2 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">Folders</h2>
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

        {/* Folder tree */}
        <div className="flex-1 overflow-y-auto p-2">
          {/* Home folder */}
          <div
            className={`
              flex items-center px-2 py-1.5 cursor-pointer rounded-md mb-0.5 relative
              ${selectedFolderId === 'home' 
                ? 'text-primary-600 dark:text-primary-400 bg-primary-50/50 dark:bg-primary-900/10' 
                : 'hover:bg-secondary-100 dark:hover:bg-secondary-700 text-secondary-700 dark:text-secondary-300'
              }
            `}
            onClick={() => onFolderSelect('home')}
          >
            <Home className="w-4 h-4 mr-2" />
            <span className="font-medium">Home</span>
          </div>

          {/* Other folders */}
          {rootFolders.map((folder, index) => renderFolder(folder, 0, index === 0))}
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