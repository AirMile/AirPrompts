import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, Folder } from 'lucide-react';

const FolderSelector = ({ 
  folders, 
  selectedFolderId, 
  onFolderSelect, 
  placeholder = "Select folder...",
  className = "",
  focusRingColor = "blue"
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredFolders, setFilteredFolders] = useState([]);
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  const focusRingClasses = {
    blue: 'focus:ring-blue-400',
    green: 'focus:ring-green-400',
    purple: 'focus:ring-purple-400'
  };

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

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const availableFolders = folders.filter(f => f.id !== 'root');
    
    if (!searchTerm) {
      setFilteredFolders(availableFolders);
      return;
    }

    const filtered = availableFolders.filter(folder =>
      folder.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredFolders(filtered);
  }, [folders, searchTerm]);

  const buildFolderHierarchy = (folders) => {
    const folderMap = new Map();
    folders.forEach(folder => {
      folderMap.set(folder.id, { ...folder, children: [] });
    });

    const rootChildren = [];
    folderMap.forEach(folder => {
      if (folder.parentId && folderMap.has(folder.parentId)) {
        folderMap.get(folder.parentId).children.push(folder);
      } else if (folder.parentId === 'root') {
        rootChildren.push(folder);
      }
    });

    return rootChildren;
  };

  const renderFolderOption = (folder, depth = 0) => {
    const indent = depth * 16;
    const isSelected = selectedFolderId === folder.id;
    
    return (
      <div key={folder.id}>
        <div
          className={`flex items-center px-3 py-2 cursor-pointer hover:bg-gray-700 transition-colors ${
            isSelected ? 'bg-gray-700 text-blue-400' : 'text-gray-300'
          }`}
          style={{ paddingLeft: `${12 + indent}px` }}
          onClick={() => {
            onFolderSelect(folder.id);
            setIsOpen(false);
            setSearchTerm('');
          }}
        >
          <Folder className="h-4 w-4 mr-2 flex-shrink-0" />
          <span className="truncate">{folder.name}</span>
          {isSelected && (
            <span className="ml-auto text-blue-400 text-sm">✓</span>
          )}
        </div>
        {folder.children && folder.children.map(child => 
          renderFolderOption(child, depth + 1)
        )}
      </div>
    );
  };

  const getSelectedFolderName = () => {
    const selectedFolder = folders.find(f => f.id === selectedFolderId);
    return selectedFolder ? selectedFolder.name : placeholder;
  };

  const hierarchicalFolders = buildFolderHierarchy(filteredFolders);

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      <button
        type="button"
        className={`w-full p-3 border border-gray-600 bg-gray-800 text-gray-100 rounded-lg focus:ring-2 ${focusRingClasses[focusRingColor]} focus:border-transparent flex items-center justify-between text-left`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center">
          <Folder className="h-4 w-4 mr-2 text-gray-400" />
          <span className={selectedFolderId ? 'text-gray-100' : 'text-gray-400'}>
            {getSelectedFolderName()}
          </span>
        </div>
        <ChevronDown 
          className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-gray-800 border border-gray-600 rounded-lg shadow-lg max-h-64 overflow-hidden">
          <div className="p-3 border-b border-gray-600">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search folders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-blue-400 focus:border-transparent text-sm"
              />
            </div>
          </div>
          
          <div className="max-h-48 overflow-y-auto">
            {filteredFolders.length === 0 ? (
              <div className="p-3 text-gray-500 text-center text-sm">
                {searchTerm ? 'No folders found' : 'No folders available'}
              </div>
            ) : searchTerm ? (
              filteredFolders.map(folder => renderFolderOption(folder, 0))
            ) : (
              hierarchicalFolders.map(folder => renderFolderOption(folder, 0))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FolderSelector;