import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { X, Search, ChevronDown, ChevronRight } from 'lucide-react';
import { AVAILABLE_ICONS } from '../../constants/folderIcons';

/**
 * FolderModal Component
 * Modal voor het aanmaken en bewerken van folders
 */
const FolderModal = ({ 
  isOpen = false, 
  onClose, 
  onSave, 
  folder = null, 
  parentFolder = null, 
  folders = [] 
}) => {
  const [name, setName] = useState('');
  const [selectedParentId, setSelectedParentId] = useState('root');
  const [selectedIcon, setSelectedIcon] = useState('Folder');
  const [errors, setErrors] = useState({});
  const [iconSearchQuery, setIconSearchQuery] = useState('');
  const [folderSearchQuery, setFolderSearchQuery] = useState('');
  const [showFolderDropdown, setShowFolderDropdown] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState(new Set()); // Track expanded folders

  // Convert icon object to array format
  const iconList = useMemo(() => {
    return Object.entries(AVAILABLE_ICONS).map(([name, icon]) => ({
      name,
      icon
    }));
  }, []);

  // Filter icons based on search query
  const filteredIcons = useMemo(() => {
    if (!iconSearchQuery.trim()) return iconList;
    
    const query = iconSearchQuery.toLowerCase();
    return iconList.filter(({ name }) => 
      name.toLowerCase().includes(query)
    );
  }, [iconList, iconSearchQuery]);

  // Build folder hierarchy with indentation and expand/collapse support
  const buildFolderHierarchy = useCallback((foldersToProcess, parentId = 'root', level = 0, result = []) => {
    const childFolders = foldersToProcess
      .filter(f => f.parentId === parentId && f.id !== folder?.id)
      .sort((a, b) => a.name.localeCompare(b.name));

    childFolders.forEach(f => {
      const hasChildren = foldersToProcess.some(child => child.parentId === f.id && child.id !== folder?.id);
      
      result.push({
        ...f,
        level,
        hasChildren,
        displayName: '  '.repeat(level) + f.name
      });
      
      // Only add children if this folder is expanded
      if (hasChildren && expandedFolders.has(f.id)) {
        buildFolderHierarchy(foldersToProcess, f.id, level + 1, result);
      }
    });

    return result;
  }, [folder?.id, expandedFolders]);

  // Get filtered and hierarchical folder list
  const hierarchicalFolders = useMemo(() => {
    const availableFolders = folders.filter(f => f.type === 'folder');
    const hierarchy = buildFolderHierarchy(availableFolders);
    
    if (!folderSearchQuery.trim()) {
      return hierarchy;
    }
    
    const query = folderSearchQuery.toLowerCase();
    return hierarchy.filter(f => f.name.toLowerCase().includes(query));
  }, [folders, buildFolderHierarchy, folderSearchQuery]);

  // Get selected folder display name
  const selectedFolderName = useMemo(() => {
    if (selectedParentId === 'root') return 'Root (main folder)';
    const folder = folders.find(f => f.id === selectedParentId);
    return folder?.name || 'Unknown';
  }, [selectedParentId, folders]);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (folder) {
      setName(folder.name);
      setSelectedIcon(folder.icon || 'Folder');
      setSelectedParentId(folder.parentId || 'root');
    } else {
      setName('');
      setSelectedIcon('Folder');
      setSelectedParentId(parentFolder?.id || 'root');
    }
    setErrors({});
    setIconSearchQuery('');
    setFolderSearchQuery('');
    setShowFolderDropdown(false);
    setExpandedFolders(new Set()); // Reset expanded folders - start collapsed
  }, [folder, isOpen, parentFolder]);

  const validateForm = useCallback(() => {
    const newErrors = {};
    
    if (!name.trim()) {
      newErrors.name = 'Name is required';
    } else if (name.length > 50) {
      newErrors.name = 'Name can be maximum 50 characters';
    } else {
      // Check for duplicate names in same parent folder
      const siblingFolders = folders.filter(f => 
        f.parentId === selectedParentId && 
        f.id !== folder?.id
      );
      
      if (siblingFolders.some(f => f.name.toLowerCase() === name.trim().toLowerCase())) {
        newErrors.name = 'A folder with this name already exists in this location';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [name, folder, selectedParentId, folders]);

  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const now = new Date().toISOString();
    
    const folderData = {
      name: name.trim(),
      icon: selectedIcon,
      parentId: selectedParentId,
      type: 'folder',
      favorite: folder?.favorite || false,
      createdAt: folder?.createdAt || now,
      updatedAt: now
    };

    if (folder) {
      onSave({ ...folder, ...folderData });
    } else {
      onSave({
        id: `folder-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        ...folderData
      });
    }

    onClose();
  }, [name, selectedIcon, selectedParentId, folder, validateForm, onSave, onClose]);

  // Toggle folder expansion
  const toggleFolderExpansion = useCallback((folderId) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(folderId)) {
        newSet.delete(folderId);
      } else {
        newSet.add(folderId);
      }
      return newSet;
    });
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showFolderDropdown && !event.target.closest('.folder-dropdown-container')) {
        setShowFolderDropdown(false);
        setFolderSearchQuery('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showFolderDropdown]);

  if (!isOpen) return null;

  const SelectedIconComponent = AVAILABLE_ICONS[selectedIcon] || AVAILABLE_ICONS.Folder;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Modal */}
      <div className="relative bg-white dark:bg-secondary-800 rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-secondary-200 dark:border-secondary-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-secondary-900 dark:text-secondary-100">
              {folder ? 'Edit folder' : 'New folder'}
            </h2>
            <button
              onClick={onClose}
              className="p-1 rounded hover:bg-secondary-100 dark:hover:bg-secondary-700 text-secondary-500 dark:text-secondary-400"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {/* Parent folder selector */}
          <div className="mb-6 relative folder-dropdown-container">
            <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
              Parent folder
            </label>
            
            {/* Selected folder display */}
            <div
              onClick={() => setShowFolderDropdown(!showFolderDropdown)}
              className="w-full px-3 py-2 border rounded-lg cursor-pointer flex items-center justify-between focus:ring-1 focus:ring-primary-500 focus:border-primary-500 focus:outline-none dark:bg-secondary-700 dark:text-secondary-100 border-secondary-300 dark:border-secondary-600 bg-white dark:bg-secondary-700"
            >
              <span className="text-secondary-900 dark:text-secondary-100">
                {selectedFolderName}
              </span>
              {showFolderDropdown ? (
                <ChevronDown className="w-4 h-4 text-secondary-500" />
              ) : (
                <ChevronRight className="w-4 h-4 text-secondary-500" />
              )}
            </div>

            {/* Dropdown menu */}
            {showFolderDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-secondary-700 border border-secondary-300 dark:border-secondary-600 rounded-lg shadow-lg z-10 max-h-64 overflow-hidden">
                {/* Search input */}
                <div className="p-3 border-b border-secondary-200 dark:border-secondary-600">
                  <div className="relative">
                    <input
                      type="text"
                      value={folderSearchQuery}
                      onChange={(e) => setFolderSearchQuery(e.target.value)}
                      placeholder="Search folders..."
                      className="w-full px-3 py-2 pl-10 border rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-primary-500 focus:outline-none dark:bg-secondary-800 dark:text-secondary-100 border-secondary-300 dark:border-secondary-600 text-sm"
                    />
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-secondary-400" />
                  </div>
                </div>

                {/* Folder list */}
                <div className="max-h-48 overflow-y-auto">
                  {/* Root option */}
                  <div
                    onClick={() => {
                      setSelectedParentId('root');
                      setShowFolderDropdown(false);
                      setFolderSearchQuery('');
                    }}
                    className={`px-4 py-2 cursor-pointer hover:bg-secondary-100 dark:hover:bg-secondary-600 text-sm ${
                      selectedParentId === 'root' 
                        ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300' 
                        : 'text-secondary-900 dark:text-secondary-100'
                    }`}
                  >
                    Root (main folder)
                  </div>

                  {/* Hierarchical folder list */}
                  {hierarchicalFolders.map((f) => {
                    const FolderIcon = AVAILABLE_ICONS[f.icon] || AVAILABLE_ICONS.Folder;
                    const isExpanded = expandedFolders.has(f.id);
                    
                    return (
                      <div
                        key={f.id}
                        className={`px-4 py-2 cursor-pointer hover:bg-secondary-100 dark:hover:bg-secondary-600 text-sm flex items-center gap-2 ${
                          selectedParentId === f.id 
                            ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300' 
                            : 'text-secondary-900 dark:text-secondary-100'
                        }`}
                        style={{ paddingLeft: `${16 + (f.level * 20)}px` }}
                      >
                        {/* Expand/collapse button for folders with children */}
                        {f.hasChildren && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFolderExpansion(f.id);
                            }}
                            className="p-0.5 hover:bg-secondary-200 dark:hover:bg-secondary-600 rounded transition-colors flex-shrink-0"
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4 text-secondary-500" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-secondary-500" />
                            )}
                          </button>
                        )}
                        
                        {/* Spacer for folders without children to align with those that have children */}
                        {!f.hasChildren && (
                          <div className="w-5 h-5 flex-shrink-0" />
                        )}
                        
                        {/* Folder selection area */}
                        <div 
                          onClick={() => {
                            setSelectedParentId(f.id);
                            setShowFolderDropdown(false);
                            setFolderSearchQuery('');
                          }}
                          className="flex items-center gap-2 flex-1 min-w-0"
                        >
                          <FolderIcon className="w-4 h-4 text-primary-600 dark:text-primary-400 flex-shrink-0" />
                          <span className="truncate">{f.name}</span>
                        </div>
                      </div>
                    );
                  })}

                  {hierarchicalFolders.length === 0 && folderSearchQuery && (
                    <div className="px-4 py-3 text-sm text-secondary-500 dark:text-secondary-400 text-center">
                      No folders found
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Name input */}
          <div className="mb-6">
            <label htmlFor="folder-name" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
              Folder name
            </label>
            <input
              id="folder-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-primary-500 focus:outline-none dark:bg-secondary-700 dark:text-secondary-100 ${
                errors.name 
                  ? 'border-red-500 dark:border-red-500' 
                  : 'border-secondary-300 dark:border-secondary-600'
              }`}
              placeholder="Enter folder name..."
              autoFocus
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name}</p>
            )}
          </div>


          {/* Icon selector */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
              Choose an icon
            </label>
            

            {/* Icon search */}
            <div className="mb-3 relative">
              <input
                type="text"
                value={iconSearchQuery}
                onChange={(e) => setIconSearchQuery(e.target.value)}
                placeholder="Search icons..."
                className="w-full px-3 py-2 pl-10 border rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-primary-500 focus:outline-none dark:bg-secondary-700 dark:text-secondary-100 border-secondary-300 dark:border-secondary-600"
              />
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-secondary-400" />
            </div>

            {/* Icon grid */}
            <div className="grid grid-cols-8 gap-2 max-h-60 overflow-y-auto p-2 bg-secondary-50 dark:bg-secondary-900 rounded-lg scrollbar-thin scrollbar-thumb-secondary-300 dark:scrollbar-thumb-secondary-700 scrollbar-track-secondary-100 dark:scrollbar-track-secondary-800">
              {filteredIcons.map(({ name: iconName, icon: IconComponent }) => (
                <button
                  key={iconName}
                  type="button"
                  onClick={() => setSelectedIcon(iconName)}
                  className={`p-2 rounded-lg hover:bg-secondary-200 dark:hover:bg-secondary-700 transition-colors flex items-center justify-center ${
                    selectedIcon === iconName 
                      ? 'bg-primary-100 dark:bg-primary-900/30 ring-2 ring-primary-500' 
                      : ''
                  }`}
                  title={iconName}
                >
                  <IconComponent className="w-5 h-5 text-secondary-700 dark:text-secondary-300" />
                </button>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-secondary-700 dark:text-secondary-300 bg-white dark:bg-secondary-700 border border-secondary-300 dark:border-secondary-600 rounded-lg hover:bg-secondary-50 dark:hover:bg-secondary-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg"
            >
              {folder ? 'Save' : 'Create folder'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FolderModal;