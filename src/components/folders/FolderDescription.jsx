import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronDownIcon, ChevronRightIcon, PencilIcon, PlusIcon, EyeIcon } from '@heroicons/react/24/outline';
import MDEditor from '@uiw/react-md-editor';
import MarkdownRenderer from '../common/MarkdownRenderer';
import './FolderDescription.css';

const FolderDescription = ({ 
  folder, 
  onUpdateDescription,
  isUpdating = false 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
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

  // Handle expand/collapse with animation timing
  const handleExpandToggle = (shouldExpand) => {
    if (shouldExpand === isExpanded) return;
    
    // Clear any existing animation timeout
    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current);
    }
    
    if (shouldExpand) {
      // Expanding: no delay needed
      setIsExpanded(true);
      setIsAnimating(false);
    } else {
      // Collapsing: start animation, delay border radius change
      setIsAnimating(true);
      setIsExpanded(false);
      
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
    console.log('handleAutoSave called with:', {
      value: value?.substring(0, 50) + '...',
      lastSaved: lastSavedValueRef.current?.substring(0, 50) + '...',
      immediate,
      hasChanges: value !== lastSavedValueRef.current
    });
    
    // Skip if no changes
    if (value === lastSavedValueRef.current) {
      console.log('No changes detected, skipping save');
      setHasUnsavedChanges(false);
      return;
    }
    
    setHasUnsavedChanges(true);
    
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    const saveFunction = async () => {
      console.log('Actually saving value:', value?.substring(0, 50) + '...');
      setSaveStatus('saving');
      try {
        await onUpdateDescription(folder.id, value);
        lastSavedValueRef.current = value;
        setHasUnsavedChanges(false);
        setSaveStatus('saved');
        setError(null);
        console.log('Save successful, lastSavedValueRef updated to:', value?.substring(0, 50) + '...');
        
        // Reset status after 2 seconds
        setTimeout(() => {
          setSaveStatus('idle');
        }, 2000);
      } catch (error) {
        setSaveStatus('error');
        setError('Opslaan mislukt');
        console.error('Save failed:', error);
      }
    };
    
    if (immediate) {
      console.log('Immediate save requested');
      await saveFunction();
    } else {
      console.log('Debounced save scheduled (300ms)');
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
    console.log('Input change - value length:', value?.length, 'first 50 chars:', value?.substring(0, 50));
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
        
        console.log('DEBUG - Simple textarea found:', textarea ? 'YES' : 'NO');
        
        if (textarea) {
          console.log('- Textarea value length:', textarea.value?.length);
          console.log('- Using simple textarea - cursor should work perfectly now!');
          
          // Focus the textarea
          textarea.focus();
        }
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [isEditing, scrollToCursor]);

  const toggleEditMode = async () => {
    if (isEditing) {
      console.log('Switching to view mode - saving changes...');
      console.log('Current editValue:', editValue);
      console.log('Folder description:', folder?.description);
      console.log('Has unsaved changes:', hasUnsavedChanges);
      
      // Save before switching to view mode
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      
      // Always save when leaving edit mode, regardless of flags
      await handleAutoSave(editValue, true);
      setIsEditing(false);
    } else {
      // When entering edit mode, ensure editValue is synced with folder description
      console.log('Switching to edit mode - syncing data...');
      console.log('Setting editValue to:', folder?.description || '');
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
    <div className={`collapsible-section section-boundary-restricted ${hasDescription ? 'mb-6' : 'mb-4'}`}>
      {/* Header */}
      <div className={`w-full flex items-center justify-between overflow-hidden group border ${
        hasDescription 
          ? 'bg-primary-50 dark:bg-primary-900/10 hover:bg-primary-100 dark:hover:bg-primary-900/20 has-[.action-button:hover]:bg-primary-50 dark:has-[.action-button:hover]:bg-primary-900/10 border-primary-200 dark:border-primary-800/50' 
          : 'bg-secondary-50 dark:bg-secondary-900/10 border-secondary-200 dark:border-secondary-800/50'
      } ${
        isExpanded || isAnimating
          ? 'rounded-t-lg' 
          : 'rounded-lg'
      } transition-colors duration-300 ease-in-out transition-[border-radius] duration-75 ease-out`}>
        <button
          onClick={hasDescription ? () => handleExpandToggle(!isExpanded) : isExpanded ? () => handleExpandToggle(false) : handleStartEdit}
          className="flex-1 flex items-center justify-between p-3 focus:outline-none"
          aria-expanded={isExpanded}
          aria-controls="context-content"
        >
          <div className="flex items-center space-x-2">
            {(hasDescription || isExpanded) ? (
              isExpanded ? (
                <ChevronDownIcon className="w-5 h-5 text-secondary-600 dark:text-secondary-400" />
              ) : (
                <ChevronRightIcon className="w-5 h-5 text-secondary-600 dark:text-secondary-400" />
              )
            ) : (
              <div className="w-5 h-5" />
            )}
            
            <h3 className="text-lg font-medium text-secondary-900 dark:text-secondary-100">
              Context
            </h3>
          </div>
        </button>
        
        <div className="flex-shrink-0 p-3 action-button">
          <button
            onClick={hasDescription ? toggleEditMode : handleStartEdit}
            className="p-2 text-secondary-600 dark:text-secondary-400 hover:text-secondary-900 dark:hover:text-secondary-100 hover:bg-secondary-100 dark:hover:bg-secondary-800 rounded-lg transition-colors"
            title={isEditing ? "Terug naar weergave" : hasDescription ? "Bewerken" : "Context toevoegen"}
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
              <div className="p-3 sm:p-4 bg-white dark:bg-secondary-800 border-l border-r border-b border-secondary-200 dark:border-secondary-700 rounded-b-lg">
                <textarea
                  ref={editorRef}
                  value={editValue}
                  onChange={(e) => handleInputChange(e.target.value)}
                  onBlur={handleBlur}
                  placeholder={folder.id === 'root' 
                    ? 'Voeg algemene context, notities en links toe...' 
                    : `Voeg context, notities en links toe voor "${folder.name}"...`}
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
              <div className="p-3 sm:p-4 bg-white dark:bg-secondary-800 border-l border-r border-b border-secondary-200 dark:border-secondary-700 rounded-b-lg">
                <MarkdownRenderer content={editValue} />
              </div>
            ) : (
              <div className="p-3 sm:p-4 bg-white dark:bg-secondary-800 border-l border-r border-b border-secondary-200 dark:border-secondary-700 rounded-b-lg text-center">
                <p className="text-secondary-500 dark:text-secondary-400 mb-2">
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