import React, { useEffect } from 'react';
import { X, Menu } from 'lucide-react';
import CollapsibleFolderTree from '../folders/CollapsibleFolderTree.jsx';

/**
 * Mobile Navigation Component
 * Responsive overlay navigation voor mobile en tablet devices
 */
const MobileNavigation = ({
  isOpen = false,
  onToggle = () => {},
  folders = [],
  selectedFolderId = null,
  onFolderSelect = () => {},
  onCreateFolder = () => {},
  onUpdateFolder = () => {},
  onDeleteFolder = () => {},
  onReorderFolders = () => {},
  onSettingsClick = () => {},
  className = ''
}) => {
  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Close menu when folder is selected (mobile UX)
  const handleFolderSelect = (folderId) => {
    onFolderSelect(folderId);
    onToggle(false); // Close menu after selection
  };

  // Close menu on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onToggle(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onToggle]);

  return (
    <>
      {/* Mobile Menu Toggle Button */}
      <button
        onClick={() => onToggle(!isOpen)}
        className={`
          lg:hidden flex items-center justify-center
          w-10 h-10 rounded-lg
          bg-secondary-800 dark:bg-secondary-700
          text-secondary-300 dark:text-secondary-400
          hover:bg-secondary-700 dark:hover:bg-secondary-600
          hover:text-white dark:hover:text-white
          focus:outline-none focus:ring-2 focus:ring-primary-500
          transition-colors duration-200
          ${className}
        `}
        aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
        aria-expanded={isOpen}
      >
        {isOpen ? (
          <X className="w-5 h-5" />
        ) : (
          <Menu className="w-5 h-5" />
        )}
      </button>

      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="lg:hidden fixed inset-0 z-50 flex"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
        >
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
            onClick={() => onToggle(false)}
            aria-hidden="true"
          />
          
          {/* Mobile Navigation Panel */}
          <div className="relative flex flex-col w-80 max-w-xs bg-secondary-900 dark:bg-secondary-800 shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-secondary-700 dark:border-secondary-600">
              <h2 className="text-lg font-semibold text-secondary-100 dark:text-secondary-200">
                Navigation
              </h2>
              <button
                onClick={() => onToggle(false)}
                className="
                  flex items-center justify-center w-8 h-8 rounded-lg
                  text-secondary-400 dark:text-secondary-500
                  hover:text-secondary-200 dark:hover:text-secondary-300
                  hover:bg-secondary-800 dark:hover:bg-secondary-700
                  transition-colors duration-200
                  focus:outline-none focus:ring-2 focus:ring-primary-500
                "
                aria-label="Close navigation"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Folder Tree */}
            <div className="flex-1 overflow-y-auto">
              <CollapsibleFolderTree
                folders={folders}
                selectedFolderId={selectedFolderId}
                onFolderSelect={handleFolderSelect}
                onCreateFolder={onCreateFolder}
                onUpdateFolder={onUpdateFolder}
                onDeleteFolder={onDeleteFolder}
                onReorderFolders={onReorderFolders}
                onSettingsClick={onSettingsClick}
                className="h-full"
              />
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-secondary-700 dark:border-secondary-600">
              <button
                onClick={() => {
                  onSettingsClick();
                  onToggle(false);
                }}
                className="
                  w-full flex items-center justify-center px-4 py-3 rounded-lg
                  bg-secondary-800 dark:bg-secondary-700
                  text-secondary-300 dark:text-secondary-400
                  hover:bg-secondary-700 dark:hover:bg-secondary-600
                  hover:text-white dark:hover:text-white
                  transition-colors duration-200
                  focus:outline-none focus:ring-2 focus:ring-primary-500
                "
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Settings
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MobileNavigation;