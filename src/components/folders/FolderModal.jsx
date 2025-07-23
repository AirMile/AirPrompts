import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { X, Search } from 'lucide-react';
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
  const [selectedIcon, setSelectedIcon] = useState('Folder');
  const [errors, setErrors] = useState({});
  const [iconSearchQuery, setIconSearchQuery] = useState('');

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

  // Reset form when modal opens/closes
  useEffect(() => {
    if (folder) {
      setName(folder.name);
      setSelectedIcon(folder.icon || 'Folder');
    } else {
      setName('');
      setSelectedIcon('Folder');
    }
    setErrors({});
    setIconSearchQuery('');
  }, [folder, isOpen]);

  const validateForm = useCallback(() => {
    const newErrors = {};
    
    if (!name.trim()) {
      newErrors.name = 'Naam is verplicht';
    } else if (name.length > 50) {
      newErrors.name = 'Naam mag maximaal 50 karakters zijn';
    } else {
      // Check for duplicate names in same parent folder
      const parentId = folder?.parentId || parentFolder?.id || 'root';
      const siblingFolders = folders.filter(f => 
        f.parentId === parentId && 
        f.id !== folder?.id
      );
      
      if (siblingFolders.some(f => f.name.toLowerCase() === name.trim().toLowerCase())) {
        newErrors.name = 'Een map met deze naam bestaat al in deze locatie';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [name, folder, parentFolder, folders]);

  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const parentId = folder?.parentId || parentFolder?.id || 'root';
    const now = new Date().toISOString();
    
    const folderData = {
      name: name.trim(),
      icon: selectedIcon,
      parentId,
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
  }, [name, selectedIcon, folder, parentFolder, validateForm, onSave, onClose]);

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
              {folder ? 'Map bewerken' : 'Nieuwe map'}
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
          {/* Parent folder info */}
          {parentFolder && (
            <div className="mb-4 p-3 bg-secondary-100 dark:bg-secondary-700 rounded-lg">
              <p className="text-sm text-secondary-600 dark:text-secondary-400">
                Deze map wordt aangemaakt in: <span className="font-medium">{parentFolder.name}</span>
              </p>
            </div>
          )}

          {/* Name input */}
          <div className="mb-6">
            <label htmlFor="folder-name" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
              Map naam
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
              placeholder="Voer map naam in..."
              autoFocus
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name}</p>
            )}
          </div>

          {/* Icon selector */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
              Kies een icoon
            </label>
            
            {/* Selected icon preview */}
            <div className="mb-4 p-4 bg-secondary-100 dark:bg-secondary-700 rounded-lg flex items-center gap-3">
              <SelectedIconComponent className="w-8 h-8 text-primary-600 dark:text-primary-400" />
              <div>
                <p className="text-sm font-medium text-secondary-900 dark:text-secondary-100">
                  {name || 'Nieuwe map'}
                </p>
                <p className="text-xs text-secondary-500 dark:text-secondary-400">
                  Geselecteerd icoon: {selectedIcon}
                </p>
              </div>
            </div>

            {/* Icon search */}
            <div className="mb-3 relative">
              <input
                type="text"
                value={iconSearchQuery}
                onChange={(e) => setIconSearchQuery(e.target.value)}
                placeholder="Zoek iconen..."
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
                  className={`p-2 rounded-lg hover:bg-secondary-200 dark:hover:bg-secondary-700 transition-colors ${
                    selectedIcon === iconName 
                      ? 'bg-primary-100 dark:bg-primary-900/30 ring-1 ring-primary-500' 
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
              Annuleren
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg"
            >
              {folder ? 'Opslaan' : 'Map aanmaken'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FolderModal;