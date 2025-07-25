import React, { useState, useEffect, useRef, useCallback } from 'react';
import { PencilIcon, PlusIcon, EyeIcon } from '@heroicons/react/24/outline';
import MDEditor from '@uiw/react-md-editor';
import MarkdownRenderer from '../common/MarkdownRenderer';
import ResizableSection from '../common/ResizableSection';
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
  
  // Resize functionality
  const [contentHeight, setContentHeight] = useState(() => {
    const stored = localStorage.getItem(`context-height-${folder?.id || 'home'}`);
    return stored ? parseInt(stored, 10) : 300;
  });
  const [isDraggingState, setIsDraggingState] = useState(false);
  const isDragging = useRef(false);
  const startY = useRef(0);
  const startHeight = useRef(0);
  const minHeight = 150;
  const maxHeight = 600;

  const hasDescription = (editValue || folder?.description)?.trim();
  
  // Save height to localStorage when it changes
  useEffect(() => {
    const folderId = folder?.id || 'home';
    const storageKey = `context-height-${folderId}`;
    
    // Debounce the save to avoid excessive writes during drag
    const timeoutId = setTimeout(() => {
      localStorage.setItem(storageKey, contentHeight.toString());
    }, 100);
    
    return () => clearTimeout(timeoutId);
  }, [contentHeight, folder?.id]);
  
  // Update content height when folder changes
  useEffect(() => {
    if (!folder?.id) return;
    
    const folderId = folder.id;
    const storageKey = `context-height-${folderId}`;
    const stored = localStorage.getItem(storageKey);
    const folderHeight = stored ? parseInt(stored, 10) : 300;
    
    setContentHeight(folderHeight);
  }, [folder?.id]);
  
  // Update edit value when folder changes, but preserve during editing
  useEffect(() => {
    if (!isEditing) {
      // Only update when not editing
      setEditValue(folder?.description || '');
      lastSavedValueRef.current = folder?.description || '';
      setHasUnsavedChanges(false);
    }
  }, [folder?.id, folder?.description, isEditing]); // Include description and isEditing in dependencies
  
  // Resize handlers
  const handleMouseDown = useCallback((e) => {
    if (isEditing) return;
    
    e.preventDefault();
    isDragging.current = true;
    setIsDraggingState(true);
    startY.current = e.clientY;
    startHeight.current = contentHeight;
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'ns-resize';
    document.body.style.userSelect = 'none';
  }, [contentHeight, isEditing]);

  const handleMouseMove = useCallback((e) => {
    if (!isDragging.current) return;
    
    const deltaY = e.clientY - startY.current;
    const newHeight = Math.max(
      minHeight,
      Math.min(maxHeight, startHeight.current + deltaY)
    );
    
    setContentHeight(newHeight);
  }, [minHeight, maxHeight]);

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
    setIsDraggingState(false);
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, [handleMouseMove]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [handleMouseMove, handleMouseUp]);

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
    <ResizableSection
      sectionId={`context-${folder?.id || 'home'}`}
      title="Context"
      defaultVisible={contextVisibility.isVisible}
      onVisibilityChange={(isVisible) => handleExpandToggle(isVisible)}
      externalVisible={contextVisibility.isVisible}
      isResizable={false} // We'll handle resize manually in the content
      isEditMode={isEditing}
      minHeight={150}
      maxHeight={600}
      defaultHeight={300}
      onCreateNew={hasDescription ? undefined : handleStartEdit}
      className="no-content-padding" // Custom class to remove default padding
      actionButton={
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
      }
    >
      {error && (
        <div className="mb-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}
      
      <div 
        className="bg-white dark:bg-secondary-800 border-l border-r border-t border-b border-secondary-200 dark:border-secondary-700 rounded-b-lg relative"
        style={{ 
          height: contextVisibility.isVisible && !isEditing ? `${contentHeight}px` : 'auto',
          overflowY: contextVisibility.isVisible && !isEditing && editValue?.trim() ? 'auto' : 'visible'
        }}
      >
        {isEditing ? (
          <div className="px-12 py-4 h-full">
            <textarea
              ref={editorRef}
              value={editValue}
              onChange={(e) => handleInputChange(e.target.value)}
              onBlur={handleBlur}
              placeholder={folder.id === 'root' 
                ? 'Add general context, notes and links...' 
                : `Add context, notes and links for "${folder.name}"...`}
              className="w-full h-full p-3 bg-transparent border-none outline-none resize-none text-secondary-900 dark:text-secondary-100 focus:ring-0 focus:border-none focus:outline-none context-textarea"
              style={{
                fontSize: '14px',
                lineHeight: '20px',
                fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                minHeight: '200px'
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
          <div className="px-12 py-4 h-full overflow-y-auto">
            <MarkdownRenderer content={editValue} />
          </div>
        ) : (
          <div className="pl-4 pr-4 py-4 text-center h-full flex flex-col justify-center">
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
        
        {/* Custom Resize Handle positioned within the white container */}
        {!isEditing && contextVisibility.isVisible && (
          <div
            className="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize transition-colors duration-200 group"
            title="Drag to resize"
            onMouseDown={handleMouseDown}
          >
            {/* Visual indicator - visible on hover or while dragging */}
            <div className={`absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-1 rounded-full transition-all duration-300 ease-in-out ${
              isDraggingState 
                ? 'opacity-100 bg-primary-400 dark:bg-primary-500' 
                : 'opacity-0 group-hover:opacity-100 bg-secondary-300 dark:bg-secondary-600 group-hover:bg-primary-400 dark:group-hover:bg-primary-500'
            }`}></div>
            {/* Invisible hover area for better UX */}
            <div className="absolute inset-0 hover:bg-primary-200/20 dark:hover:bg-primary-800/20 transition-colors duration-200"></div>
          </div>
        )}
      </div>
    </ResizableSection>
  );
};

export default FolderDescription;