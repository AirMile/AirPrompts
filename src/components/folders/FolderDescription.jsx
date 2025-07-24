import { useState, useEffect, useRef } from 'react';
import { ChevronDownIcon, ChevronRightIcon, PencilIcon, PlusIcon, EyeIcon } from '@heroicons/react/24/outline';
import MarkdownRenderer from '../common/MarkdownRenderer';

const FolderDescription = ({ 
  folder, 
  onUpdateDescription,
  isUpdating = false 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(folder?.description || '');
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const textareaRef = useRef(null);
  const saveTimeoutRef = useRef(null);

  const hasDescription = folder?.description?.trim() && folder.description.trim().length > 0;
  
  // Update edit value when folder changes
  useEffect(() => {
    setEditValue(folder?.description || '');
  }, [folder?.id, folder?.description]);

  // Auto-focus textarea when entering edit mode and auto-resize
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      // Place cursor at end
      const length = textareaRef.current.value.length;
      textareaRef.current.setSelectionRange(length, length);
      // Auto-resize
      autoResize();
    }
  }, [isEditing]);

  // Auto-resize function
  const autoResize = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  };

  // Auto-save function with debouncing
  const handleAutoSave = async (value) => {
    // Clear previous timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set new timeout for auto-save
    saveTimeoutRef.current = setTimeout(async () => {
      if (value !== folder?.description) {
        try {
          await onUpdateDescription(folder.id, value);
          setError(null);
        } catch (error) {
          console.error('Auto-save failed:', error);
          setError('Auto-opslaan mislukt');
        }
      }
    }, 500); // Save after 500ms of no typing
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    
    // Validate length
    if (value.length > 50000) {
      setError('Beschrijving is te lang (max 50.000 tekens)');
      return;
    }
    
    setError(null);
    setEditValue(value);
    handleAutoSave(value);
    // Auto-resize on input
    autoResize();
  };

  const toggleEditMode = () => {
    if (isEditing) {
      // Switching to view mode - trigger final save if needed
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      if (editValue !== folder?.description) {
        onUpdateDescription(folder.id, editValue);
      }
      setIsEditing(false);
    } else {
      // Switching to edit mode
      setIsEditing(true);
      setIsExpanded(true);
      setError(null);
    }
  };

  const handleStartEdit = () => {
    setIsEditing(true);
    setIsExpanded(true);
    setError(null);
  };

  // Toon voor alle folders inclusief root
  if (!folder) {
    return null;
  }

  return (
    <div className={`collapsible-section section-boundary-restricted ${hasDescription ? 'mb-6' : 'mb-4'}`}>
      {/* Header */}
      <div className={`w-full flex items-center justify-between overflow-hidden transition-colors duration-200 group border ${
        hasDescription 
          ? 'bg-primary-50 dark:bg-primary-900/10 hover:bg-primary-100 dark:hover:bg-primary-900/20 has-[.action-button:hover]:bg-primary-50 dark:has-[.action-button:hover]:bg-primary-900/10 border-primary-200 dark:border-primary-800/50' 
          : 'bg-secondary-50 dark:bg-secondary-900/10 border-secondary-200 dark:border-secondary-800/50'
      } ${
        isExpanded 
          ? 'rounded-t-lg border-b-0' 
          : 'rounded-lg'
      }`}>
        <button
          onClick={hasDescription ? () => setIsExpanded(!isExpanded) : isExpanded ? () => setIsExpanded(false) : handleStartEdit}
          className="flex-1 flex items-center justify-between p-3 focus:outline-none"
          aria-expanded={isExpanded}
          aria-controls="context-content"
        >
          <div className="flex items-center space-x-2">
            {/* Collapse/Expand Icon - show if there is content OR if expanded without content */}
            {hasDescription || isExpanded ? (
              isExpanded ? (
                <ChevronDownIcon className="w-5 h-5 text-secondary-600 dark:text-secondary-400" />
              ) : (
                <ChevronRightIcon className="w-5 h-5 text-secondary-600 dark:text-secondary-400" />
              )
            ) : (
              <div className="w-5 h-5" /> // Empty space to maintain alignment
            )}
            
            {/* Section Title */}
            <h3 className="text-lg font-medium text-secondary-900 dark:text-secondary-100">
              {folder.id === 'root' ? 'Home Context' : 'Context'}
            </h3>
          </div>
        </button>
        
        {/* Action Button */}
        <div className="flex-shrink-0 p-3 action-button">
          <button
            onClick={hasDescription ? toggleEditMode : handleStartEdit}
            className="p-2 text-secondary-600 dark:text-secondary-400 hover:text-secondary-900 dark:hover:text-secondary-100 hover:bg-secondary-100 dark:hover:bg-secondary-800 rounded-lg transition-colors"
            title={isEditing ? "Terug naar weergave" : hasDescription ? "Bewerken" : "Context toevoegen"}
          >
            {isEditing ? (
              <EyeIcon className="w-4 h-4" />
            ) : hasDescription ? (
              <PencilIcon className="w-4 h-4" />
            ) : (
              <PlusIcon className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Content - CSS Grid Collapse Animation */}
      <div
        id="context-content"
        className="grid transition-[grid-template-rows] duration-300 ease-in-out"
        style={{
          gridTemplateRows: isExpanded ? '1fr' : '0fr'
        }}
        aria-hidden={!isExpanded}
      >
        <div className="overflow-hidden">
          <div 
            className="transition-all duration-300 ease-in-out"
            style={{
              opacity: isExpanded ? 1 : 0
            }}
          >
            {error && (
              <div className="mb-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}
            
            {isEditing ? (
              <div className="p-3 sm:p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-b-lg">
                <textarea
                  ref={textareaRef}
                  value={editValue}
                  onChange={handleInputChange}
                  className="w-full bg-transparent border-none outline-none resize-none text-gray-700 dark:text-gray-300 placeholder-gray-500 dark:placeholder-gray-400 font-normal focus:ring-0 focus:border-none focus:outline-none rounded-none"
                  style={{ 
                    minHeight: '1.5rem',
                    overflow: 'hidden',
                    border: 'none',
                    boxShadow: 'none',
                    borderRadius: '0',
                    fontSize: '0.875rem',
                    lineHeight: '1.25rem'
                  }}
                  placeholder={folder.id === 'root' ? 'Voeg algemene context, notities en links toe...' : `Voeg context, notities en links toe voor "${folder.name}"...`}
                />
              </div>
            ) : hasDescription ? (
              <div className="p-3 sm:p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-b-lg">
                <MarkdownRenderer content={folder.description} />
              </div>
            ) : (
              <div className="p-3 sm:p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-b-lg text-center">
                <p className="text-gray-500 dark:text-gray-400 mb-2">
                  {folder.id === 'root' ? 'Geen algemene context toegevoegd' : 'Geen beschrijving toegevoegd voor deze folder'}
                </p>
                <button
                  onClick={handleStartEdit}
                  className="text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 text-sm font-medium transition-colors"
                >
                  Voeg context toe
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FolderDescription;