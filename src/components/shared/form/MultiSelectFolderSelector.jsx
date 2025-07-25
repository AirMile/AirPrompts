import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { ChevronDown, Search, Folder, X, Check } from 'lucide-react';

/**
 * MultiSelectFolderSelector Component
 * Allows selection of multiple folders with search and hierarchical display
 */
const MultiSelectFolderSelector = ({ 
  folders = [], 
  selectedFolderIds = [], 
  onFoldersSelect, 
  placeholder = "Select folders...",
  className = "",
  maxHeight = "max-h-64"
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when opening
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  // Filter folders based on search term
  const filteredFolders = useMemo(() => {
    const availableFolders = folders.filter(f => f.id !== 'root');
    
    if (!searchTerm) {
      return availableFolders;
    }

    return availableFolders.filter(folder =>
      folder.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [folders, searchTerm]);

  // Build hierarchical structure
  const buildFolderHierarchy = useCallback((folderList) => {
    const folderMap = new Map();
    folderList.forEach(folder => {
      folderMap.set(folder.id, { ...folder, children: [] });
    });

    const rootChildren = [];
    folderMap.forEach(folder => {
      if (folder.parentId && folderMap.has(folder.parentId)) {
        folderMap.get(folder.parentId).children.push(folder);
      } else if (folder.parentId === 'root' || !folder.parentId) {
        rootChildren.push(folder);
      }
    });

    return rootChildren;
  }, []);

  // Toggle folder selection
  const toggleFolder = useCallback((folderId) => {
    const newSelection = selectedFolderIds.includes(folderId)
      ? selectedFolderIds.filter(id => id !== folderId)
      : [...selectedFolderIds, folderId];
    
    onFoldersSelect(newSelection);
  }, [selectedFolderIds, onFoldersSelect]);

  // Remove specific folder
  const removeFolder = useCallback((folderId, e) => {
    e.stopPropagation();
    onFoldersSelect(selectedFolderIds.filter(id => id !== folderId));
  }, [selectedFolderIds, onFoldersSelect]);

  // Render folder option with checkbox
  const renderFolderOption = useCallback((folder, depth = 0) => {
    const indent = depth * 16;
    const isSelected = selectedFolderIds.includes(folder.id);
    
    return (
      <div key={folder.id}>
        <div
          className={`flex items-center px-3 py-2 cursor-pointer hover:bg-secondary-100 dark:hover:bg-secondary-700 transition-colors ${
            isSelected ? 'bg-primary-50 dark:bg-primary-900/20' : ''
          }`}
          style={{ paddingLeft: `${12 + indent}px` }}
          onClick={() => toggleFolder(folder.id)}
        >
          <div className={`
            w-4 h-4 mr-2 border-2 rounded flex items-center justify-center
            ${isSelected 
              ? 'bg-primary-600 border-primary-600 dark:bg-primary-500 dark:border-primary-500' 
              : 'border-secondary-400 dark:border-secondary-600'
            }
          `}>
            {isSelected && <Check className="w-3 h-3 text-white" />}
          </div>
          <Folder className="h-4 w-4 mr-2 flex-shrink-0 text-secondary-600 dark:text-secondary-400" />
          <span className="truncate text-secondary-900 dark:text-secondary-100">{folder.name}</span>
        </div>
        {folder.children && folder.children.length > 0 && 
          folder.children.map(child => renderFolderOption(child, depth + 1))
        }
      </div>
    );
  }, [selectedFolderIds, toggleFolder]);

  // Get selected folder names for display
  const getSelectedFoldersDisplay = useCallback(() => {
    if (selectedFolderIds.length === 0) {
      return placeholder;
    }
    
    const selectedFolders = folders.filter(f => selectedFolderIds.includes(f.id));
    if (selectedFolders.length <= 2) {
      return selectedFolders.map(f => f.name).join(', ');
    }
    
    return `${selectedFolders.length} folders selected`;
  }, [folders, selectedFolderIds, placeholder]);

  const hierarchicalFolders = buildFolderHierarchy(filteredFolders);

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      <div
        className={`
          w-full p-3 border-2 border-secondary-300 dark:border-secondary-600 
          bg-white dark:bg-secondary-800 rounded-lg cursor-pointer
          hover:border-secondary-400 dark:hover:border-secondary-500
          focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-primary-500
          transition-colors
        `}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center flex-1 min-w-0">
            <Folder className="h-4 w-4 mr-2 text-secondary-500 dark:text-secondary-400 flex-shrink-0" />
            
            {selectedFolderIds.length === 0 ? (
              <span className="text-secondary-500 dark:text-secondary-400">
                {placeholder}
              </span>
            ) : (
              <div className="flex flex-wrap gap-1 items-center flex-1">
                {selectedFolderIds.length <= 2 ? (
                  folders
                    .filter(f => selectedFolderIds.includes(f.id))
                    .map(folder => (
                      <span
                        key={folder.id}
                        className="inline-flex items-center px-2 py-1 rounded-md bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-300 text-sm"
                      >
                        {folder.name}
                        <button
                          onClick={(e) => removeFolder(folder.id, e)}
                          className="ml-1 hover:text-primary-600 dark:hover:text-primary-400"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))
                ) : (
                  <span className="text-secondary-700 dark:text-secondary-300 text-sm">
                    {getSelectedFoldersDisplay()}
                  </span>
                )}
              </div>
            )}
          </div>
          
          <ChevronDown 
            className={`h-4 w-4 text-secondary-500 dark:text-secondary-400 transition-transform flex-shrink-0 ml-2 ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </div>
      </div>

      {isOpen && (
        <div className={`absolute z-50 mt-1 w-full bg-white dark:bg-secondary-800 border border-secondary-300 dark:border-secondary-600 rounded-lg shadow-lg ${maxHeight} overflow-hidden`}>
          <div className="p-3 border-b border-secondary-200 dark:border-secondary-700">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary-500 dark:text-secondary-400" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search folders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 bg-secondary-100 dark:bg-secondary-700 border border-secondary-300 dark:border-secondary-600 rounded-md text-secondary-900 dark:text-secondary-100 placeholder-secondary-500 dark:placeholder-secondary-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
              />
            </div>
          </div>
          
          <div className="max-h-48 overflow-y-auto">
            {filteredFolders.length === 0 ? (
              <div className="p-3 text-secondary-600 dark:text-secondary-500 text-center text-sm">
                {searchTerm ? 'No folders found' : 'No folders available'}
              </div>
            ) : searchTerm ? (
              filteredFolders.map(folder => renderFolderOption(folder, 0))
            ) : (
              hierarchicalFolders.map(folder => renderFolderOption(folder, 0))
            )}
          </div>
          
          {selectedFolderIds.length > 0 && (
            <div className="p-3 border-t border-secondary-200 dark:border-secondary-700 bg-secondary-50 dark:bg-secondary-900/50">
              <div className="flex items-center justify-between text-sm">
                <span className="text-secondary-600 dark:text-secondary-400">
                  {selectedFolderIds.length} folder{selectedFolderIds.length !== 1 ? 's' : ''} selected
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onFoldersSelect([]);
                  }}
                  className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
                >
                  Clear all
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MultiSelectFolderSelector;