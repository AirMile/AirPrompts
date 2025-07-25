import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronDownIcon, ChevronRightIcon, PencilIcon, PlusIcon, EyeIcon } from '@heroicons/react/24/outline';
import MDEditor from '@uiw/react-md-editor';
import MarkdownRenderer from '../common/MarkdownRenderer';
import useFolderSectionVisibility from '../../hooks/ui/useFolderSectionVisibility';
import './FolderDescription.css';

const FolderDescription = ({ 
  folder, 
  onUpdateDescription,
  isUpdating = false 
}) => {
  // Use folder-specific visibility state that persists across folder changes
  const contextVisibility = useFolderSectionVisibility(folder?.id || 'home', 'context', false);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(folder?.description || '');
  const [error, setError] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [saveStatus, setSaveStatus] = useState('idle'); // 'idle' | 'saving' | 'saved' | 'error'
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const saveTimeoutRef = useRef(null);
  const animationTimeoutRef = useRef(null);
  const lastSavedValueRef = useRef(folder?.description || '');
  const editorRef = useRef(null);

  const hasDescription = (editValue || folder?.description)?.trim();
  
  // Update edit value when folder changes, but preserve during editing
  useEffect(() => {
    if (!isEditing) {
      // Only update when not editing
      setEditValue(folder?.description || '');
      lastSavedValueRef.current = folder?.description || '';
      setHasUnsavedChanges(false);
    }
  }, [folder?.id, folder?.description, isEditing]); // Include description and isEditing in dependencies

  // Sync editValue when switching from edit to view mode
  useEffect(() => {
    if (isEditing && editValue === '' && folder?.description) {
      // If we're in edit mode but editValue is empty while folder has description, sync it
      setEditValue(folder.description);
    }
  }, [isEditing, folder?.description]);

  // Handle expand/collapse with animation timing and persistence
  const handleExpandToggle = (shouldExpand) => {
    if (shouldExpand === contextVisibility.isVisible) return;
    
    // Clear any existing animation timeout
    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current);
    }
    
    if (shouldExpand) {
      // Expanding: no delay needed
      contextVisibility.setVisible(true);
      setIsAnimating(false);
    } else {
      // Collapsing: start animation, delay border radius change
      setIsAnimating(true);
      contextVisibility.setVisible(false);
      
      // After 200ms (during animation), stop animation state for border radius
      animationTimeoutRef.current = setTimeout(() => {
        setIsAnimating(false);
      }, 200);
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
    };
  }, []);

  // Auto-save functionaliteit met visuele feedback
  const handleAutoSave = async (value, immediate = false) => {
    
    // Skip if no changes
    if (value === lastSavedValueRef.current) {
      setHasUnsavedChanges(false);
      return;
    }
    
    setHasUnsavedChanges(true);
    
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    const saveFunction = async () => {
      setSaveStatus('saving');
      try {
        await onUpdateDescription(folder.id, value);
        lastSavedValueRef.current = value;
        setHasUnsavedChanges(false);
        setSaveStatus('saved');
        setError(null);
        
        // Reset status after 2 seconds
        setTimeout(() => {
          setSaveStatus('idle');
        }, 2000);
      } catch (error) {
        setSaveStatus('error');
        setError('Save failed');
        console.error('Save failed:', error);
      }
    };
    
    if (immediate) {
      await saveFunction();
    } else {
      saveTimeoutRef.current = setTimeout(saveFunction, 300); // Faster debounce
    }
  };

  // Auto-scroll to cursor position (simplified for regular textarea)
  const scrollToCursor = useCallback(() => {
    // Small delay to ensure DOM is updated
    requestAnimationFrame(() => {
      const textarea = editorRef.current;
      if (!textarea) return;
      
      // For a simple textarea, we can use the built-in scrollIntoView
      // Focus already handles most cursor visibility
      const cursorPosition = textarea.selectionStart;
      const textBeforeCursor = textarea.value.substring(0, cursorPosition);
      const lines = textBeforeCursor.split('\n');
      const currentLine = lines.length;
      
      // Simple scroll to keep cursor in view
      const lineHeight = parseInt(getComputedStyle(textarea).lineHeight, 10);
      const targetScroll = (currentLine - 5) * lineHeight; // Keep 5 lines above cursor visible
      
      if (targetScroll > 0) {
        textarea.scrollTop = Math.max(0, targetScroll);
      }
    });
  }, []);

  const handleInputChange = (value) => {
    setEditValue(value || '');
    handleAutoSave(value || '');
    scrollToCursor();
  };
  
  // Save on blur
  const handleBlur = () => {
    if (hasUnsavedChanges) {
      handleAutoSave(editValue, true); // Immediate save
    }
  };
  
  // Manual save function
  const handleManualSave = () => {
    handleAutoSave(editValue, true);
  };

  // Setup auto-scroll on focus and initial load  
  useEffect(() => {
    if (isEditing && editorRef.current) {
      // Give textarea time to render
      const timer = setTimeout(() => {
        const textarea = editorRef.current;
        
        if (textarea) {
          // Focus the textarea
          textarea.focus();
        }
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [isEditing, scrollToCursor]);

  const toggleEditMode = async () => {
    if (isEditing) {
      
      // Save before switching to view mode
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      
      // Always save when leaving edit mode, regardless of flags
      await handleAutoSave(editValue, true);
      setIsEditing(false);
    } else {
      // When entering edit mode, ensure editValue is synced with folder description
      setEditValue(folder?.description || '');
      setIsEditing(true);
      handleExpandToggle(true);
      setError(null);
    }
  };

  const handleStartEdit = () => {
    // Ensure editValue is synced when starting to edit
    setEditValue(folder?.description || '');
    setIsEditing(true);
    handleExpandToggle(true);
    setError(null);
  };

  if (!folder) {
    return null;
  }

  return (
    <div className={`collapsible-section section-boundary-restricted mb-4`} data-section-type="context">
      {/* Header */}
      <div className={`w-full flex items-center justify-between overflow-hidden group border ${
        hasDescription 
          ? 'bg-primary-50 dark:bg-primary-900/10 hover:bg-primary-100 dark:hover:bg-primary-900/20 has-[.action-button:hover]:bg-primary-50 dark:has-[.action-button:hover]:bg-primary-900/10 border-primary-200 dark:border-primary-800/50' 
          : 'bg-secondary-50 dark:bg-secondary-900/10 border-secondary-200 dark:border-secondary-800/50'
      } ${
        contextVisibility.isVisible || isAnimating
          ? 'rounded-t-lg' 
          : 'rounded-lg'
      } transition-colors duration-300 ease-in-out transition-[border-radius] duration-75 ease-out`}>
        <button
          onClick={hasDescription ? () => handleExpandToggle(!contextVisibility.isVisible) : contextVisibility.isVisible ? () => handleExpandToggle(false) : handleStartEdit}
          className="flex-1 flex items-center justify-between p-3 focus:outline-none"
          aria-expanded={contextVisibility.isVisible}
          aria-controls="context-content"
        >
          <div className="flex items-center">
            <div className="w-5 h-5 mr-2">
              {(hasDescription || contextVisibility.isVisible) && (
                contextVisibility.isVisible ? (
                  <ChevronDownIcon className="w-5 h-5 text-secondary-600 dark:text-secondary-400" />
                ) : (
                  <ChevronRightIcon className="w-5 h-5 text-secondary-600 dark:text-secondary-400" />
                )
              )}
            </div>
            
            <h3 className="text-lg font-medium text-secondary-900 dark:text-secondary-100">
              Context
            </h3>
          </div>
        </button>
        
        <div className="flex-shrink-0 p-3 action-button">
          <button
            onClick={hasDescription ? toggleEditMode : handleStartEdit}
            className="p-2 text-secondary-600 dark:text-secondary-400 hover:text-secondary-900 dark:hover:text-secondary-100 hover:bg-secondary-100 dark:hover:bg-secondary-800 rounded-lg transition-colors"
            title={isEditing ? "Back to view" : hasDescription ? "Edit" : "Add context"}
          >
            {hasDescription ? (
              isEditing ? (
                <EyeIcon className="w-4 h-4" />
              ) : (
                <PencilIcon className="w-4 h-4" />
              )
            ) : (
              <PlusIcon className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      <div
        id="context-content"
        className="grid transition-[grid-template-rows] duration-300 ease-in-out"
        style={{
          gridTemplateRows: contextVisibility.isVisible ? '1fr' : '0fr'
        }}
        aria-hidden={!contextVisibility.isVisible}
      >
        <div className="overflow-hidden">
          <div 
            className="transition-all duration-300 ease-in-out"
            style={{
              opacity: contextVisibility.isVisible ? 1 : 0
            }}
          >
            {error && (
              <div className="mb-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}
            
            {isEditing ? (
              <div className="px-12 py-4 bg-white dark:bg-secondary-800 border-l border-r border-b border-secondary-200 dark:border-secondary-700 rounded-b-lg">
                <textarea
                  ref={editorRef}
                  value={editValue}
                  onChange={(e) => handleInputChange(e.target.value)}
                  onBlur={handleBlur}
                  placeholder={folder.id === 'root' 
                    ? 'Add general context, notes and links...' 
                    : `Add context, notes and links for "${folder.name}"...`}
                  className="w-full h-72 p-3 bg-transparent border-none outline-none resize-none text-secondary-900 dark:text-secondary-100 focus:ring-0 focus:border-none focus:outline-none context-textarea"
                  style={{
                    fontSize: '14px',
                    lineHeight: '20px',
                    fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                    minHeight: '300px'
                  }}
                  onKeyDown={(e) => {
                    // Extra scroll check on Enter
                    if (e.key === 'Enter') {
                      setTimeout(scrollToCursor, 50);
                    }
                  }}
                />
              </div>
            ) : editValue?.trim() ? (
              <div className="px-12 py-4 bg-white dark:bg-secondary-800 border-l border-r border-b border-secondary-200 dark:border-secondary-700 rounded-b-lg">
                <MarkdownRenderer content={editValue} />
              </div>
            ) : (
              <div className="pl-4 pr-4 py-4 bg-white dark:bg-secondary-800 border-l border-r border-b border-secondary-200 dark:border-secondary-700 rounded-b-lg text-center">
                <p className="text-secondary-500 dark:text-secondary-400 mb-2">
                  {folder.id === 'root' ? 'No general context added' : 'No description added for this folder'}
                </p>
                <button
                  onClick={handleStartEdit}
                  className="text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 text-sm font-medium transition-colors"
                >
                  Add context
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