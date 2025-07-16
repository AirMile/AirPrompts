import React, { useState, useEffect } from 'react';

const FolderTree = ({ 
  folders = [], 
  selectedFolderId, 
  onFolderSelect, 
  onCreateFolder,
  className = '' 
}) => {
  const [expandedFolders, setExpandedFolders] = useState(new Set(['root', 'general']));
  const [isCompactView, setIsCompactView] = useState(false);
  const [favoriteFolders, setFavoriteFolders] = useState(new Set());

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
  };

  const expandAll = () => {
    const allFolderIds = new Set(folders.map(f => f.id));
    setExpandedFolders(allFolderIds);
  };

  const collapseAll = () => {
    setExpandedFolders(new Set(['root']));
  };

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
            hover:bg-gray-100 dark:hover:bg-gray-800
            text-gray-700 dark:text-gray-300
            ${isCompactView ? 'py-0.5' : 'py-1'}
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
              className="mr-1 p-0.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
            >
              <svg 
                className={`w-3 h-3 transform transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                fill="currentColor" 
                viewBox="0 0 20 20"
              >
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </button>
          )}
          {!folderHasChildren && <div className="w-4" />}
          
          <svg className="w-4 h-4 mr-2 text-yellow-600 dark:text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
          </svg>
          
          <span className="truncate flex-1">{folder.name}</span>
          
          <button
            onClick={(e) => toggleFavorite(folder.id, e)}
            className={`ml-1 p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity ${isFavorite ? 'opacity-100' : ''}`}
            title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <svg 
              className={`w-3 h-3 ${isFavorite ? 'text-yellow-500 fill-current' : 'text-gray-400'}`}
              fill={isFavorite ? 'currentColor' : 'none'}
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          </button>
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
    <div className={`h-full overflow-y-auto ${className}`}>
      <div className="p-3">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Folders
          </h3>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsCompactView(!isCompactView)}
              className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400"
              title={isCompactView ? 'Normal view' : 'Compact view'}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isCompactView ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                )}
              </svg>
            </button>
            {onCreateFolder && (
              <button
                onClick={() => onCreateFolder(selectedFolderId || 'root')}
                className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400"
                title="Create new folder"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Expand/Collapse All Buttons */}
        <div className="flex gap-1 mb-3">
            <button
              onClick={expandAll}
              className="flex-1 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              Expand All
            </button>
            <button
              onClick={collapseAll}
              className="flex-1 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              Collapse All
            </button>
        </div>

        {/* Favorites Section */}
        {favoriteFolders.size > 0 && (
          <div className="mb-4">
            <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">
              Favorites
            </h4>
            <div className="space-y-1 border-b border-gray-200 dark:border-gray-700 pb-3 mb-3">
              {Array.from(favoriteFolders)
                .map(id => folders.find(f => f.id === id))
                .filter(Boolean)
                .map(folder => (
                  <div
                    key={`fav-${folder.id}`}
                    className={`
                      flex items-center cursor-pointer rounded-md text-sm group
                      hover:bg-gray-100 dark:hover:bg-gray-800
                      text-gray-700 dark:text-gray-300
                      ${isCompactView ? 'py-0.5' : 'py-1'}
                    `}
                    style={{ paddingLeft: '8px', paddingRight: '8px' }}
                    onClick={() => onFolderSelect(folder.id)}
                  >
                    <div className="w-4 mr-1" />
                    <svg className="w-4 h-4 mr-2 text-yellow-600 dark:text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                    </svg>
                    <span className="truncate">{folder.name}</span>
                  </div>
                ))}
            </div>
          </div>
        )}

        <div className="space-y-1">
          {topLevelFolders.map(folder => renderFolder(folder))}
        </div>
      </div>
    </div>
  );
};

export default FolderTree;
