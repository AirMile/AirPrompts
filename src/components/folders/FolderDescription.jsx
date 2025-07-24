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

  const hasDescription = folder?.description?.trim();
  
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

  // Toon alleen voor niet-root folders
  if (!folder || folder.id === 'root') {
    return null;
  }

  return (
    <div className="border border-gray-200/30 dark:border-gray-700/30 bg-white dark:bg-gray-900 rounded-lg mb-4 sm:mb-6 transition-all duration-200 ease-in-out">
      {/* Header */}
      <div className="flex items-center justify-between p-3 sm:p-4">
        <button
          onClick={hasDescription ? () => setIsExpanded(!isExpanded) : handleStartEdit}
          className="flex items-center gap-2 text-lg font-medium text-secondary-900 dark:text-secondary-100 hover:text-gray-900 dark:hover:text-gray-100 transition-colors w-full sm:w-auto text-left"
        >
          {hasDescription && (
            isExpanded ? (
              <ChevronDownIcon className="w-4 h-4 transition-transform duration-200" />
            ) : (
              <ChevronRightIcon className="w-4 h-4 transition-transform duration-200" />
            )
          )}
          Context
        </button>
        
        <button
          onClick={hasDescription ? toggleEditMode : handleStartEdit}
          className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
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

      {/* Content */}
      <div className={`overflow-hidden transition-all duration-200 ease-in-out ${isExpanded ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="px-3 sm:px-4 pb-3 sm:pb-4">
          {error && (
            <div className="mb-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}
          
          {isEditing ? (
            <div className="p-3 sm:p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
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
                placeholder={`Voeg context, notities en links toe voor "${folder.name}"...`}
              />
            </div>
          ) : hasDescription ? (
            <div className="p-3 sm:p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <MarkdownRenderer content={folder.description} />
            </div>
          ) : (
            <div className="p-3 sm:p-4 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
              <p className="text-gray-500 dark:text-gray-400 mb-2">Geen beschrijving toegevoegd voor deze folder</p>
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
  );
};

export default FolderDescription;