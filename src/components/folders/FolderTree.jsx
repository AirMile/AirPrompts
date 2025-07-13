import React, { useState } from 'react';

const FolderTree = ({ 
  folders = [], 
  selectedFolderId, 
  onFolderSelect, 
  onCreateFolder,
  className = '' 
}) => {
  const [expandedFolders, setExpandedFolders] = useState(new Set(['root', 'general']));

  // Build folder hierarchy
  const buildFolderTree = (parentId = null) => {
    return folders
      .filter(folder => folder.parentId === parentId)
      .sort((a, b) => a.name.localeCompare(b.name));
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

  const renderFolder = (folder, level = 0) => {
    const isExpanded = expandedFolders.has(folder.id);
    const isSelected = selectedFolderId === folder.id;
    const children = buildFolderTree(folder.id);
    const folderHasChildren = hasChildren(folder.id);

    return (
      <div key={folder.id} className="select-none">
        <div
          className={`
            flex items-center px-2 py-1 cursor-pointer rounded-md text-sm
            hover:bg-gray-100 dark:hover:bg-gray-800
            ${isSelected ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'}
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
          
          <span className="truncate">{folder.name}</span>
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

        <div className="space-y-1">
          {topLevelFolders.map(folder => renderFolder(folder))}
        </div>
      </div>
    </div>
  );
};

export default FolderTree;