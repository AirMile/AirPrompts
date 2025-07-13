import React from 'react';

const FolderBreadcrumb = ({ folders = [], currentFolderId, onFolderSelect, className = '' }) => {
  // Build path from root to current folder
  const buildPath = (folderId) => {
    const path = [];
    let currentFolder = folders.find(f => f.id === folderId);
    
    while (currentFolder) {
      path.unshift(currentFolder);
      currentFolder = folders.find(f => f.id === currentFolder.parentId);
    }
    
    return path;
  };

  const fullPath = currentFolderId ? buildPath(currentFolderId) : [];
  // Filter out root folder from breadcrumb
  const path = fullPath.filter(folder => folder.id !== 'root');

  if (path.length === 0) return null;

  return (
    <div className={`flex items-center space-x-1 text-sm ${className}`}>
      {path.map((folder, index) => (
        <React.Fragment key={folder.id}>
          {index > 0 && (
            <svg className="w-3 h-3 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          )}
          <button
            onClick={() => onFolderSelect(folder.id)}
            className={`
              px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800
              ${index === path.length - 1 
                ? 'text-blue-600 dark:text-blue-400 font-medium' 
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
              }
            `}
          >
            {folder.name}
          </button>
        </React.Fragment>
      ))}
    </div>
  );
};

export default FolderBreadcrumb;