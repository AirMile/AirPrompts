import React, { useState, useRef, useEffect } from 'react';

const FolderBreadcrumb = ({ folders = [], currentFolderId, onFolderSelect, className = '' }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
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

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (path.length === 0) return null;

  const shouldTruncate = path.length > 3;
  const displayPath = shouldTruncate ? [path[0], '...', ...path.slice(-2)] : path;

  return (
    <div className={`flex items-center space-x-1 text-sm ${className}`}>
      {displayPath.map((item, index) => (
        <React.Fragment key={typeof item === 'string' ? `ellipsis-${index}` : item.id}>
          {index > 0 && (
            <svg className="w-3 h-3 text-secondary-400 dark:text-secondary-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          )}
          
          {item === '...' ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="px-2 py-1 rounded hover:bg-secondary-100 dark:hover:bg-secondary-800 text-secondary-600 dark:text-secondary-400 hover:text-secondary-800 dark:hover:text-secondary-200"
                title="Show hidden folders"
              >
                ...
              </button>
              
              {showDropdown && (
                <div className="absolute top-full left-0 mt-1 bg-white dark:bg-secondary-800 border border-secondary-200 dark:border-secondary-700 rounded-md shadow-lg z-50 min-w-[200px]">
                  {path.slice(1, -2).map((folder) => (
                    <button
                      key={folder.id}
                      onClick={() => {
                        onFolderSelect(folder.id);
                        setShowDropdown(false);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-secondary-100 dark:hover:bg-secondary-700 text-secondary-700 dark:text-secondary-300 flex items-center space-x-2"
                    >
                      <svg className="w-4 h-4 text-primary-600 dark:text-primary-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                      </svg>
                      <span className="truncate">{folder.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => onFolderSelect(item.id)}
              className={`
                px-2 py-1 rounded hover:bg-secondary-100 dark:hover:bg-secondary-800
                ${index === displayPath.length - 1 
                  ? 'text-primary-600 dark:text-primary-400 font-medium' 
                  : 'text-secondary-600 dark:text-secondary-400 hover:text-secondary-800 dark:hover:text-secondary-200'
                }
              `}
            >
              {item.name}
            </button>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

export default FolderBreadcrumb;