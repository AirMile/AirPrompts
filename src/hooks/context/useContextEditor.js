import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook for managing context editor state and auto-save functionality
 */
export const useContextEditor = (folder, onUpdateDescription) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(folder?.description || '');
  const [error, setError] = useState(null);
  const [saveStatus, setSaveStatus] = useState('idle'); // 'idle' | 'saving' | 'saved' | 'error'
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  const saveTimeoutRef = useRef(null);
  const lastSavedValueRef = useRef(folder?.description || '');
  const editorRef = useRef(null);

  const hasDescription = Boolean((editValue || folder?.description)?.trim());

  // Update edit value when folder changes, but preserve during editing
  useEffect(() => {
    if (!isEditing) {
      setEditValue(folder?.description || '');
      lastSavedValueRef.current = folder?.description || '';
      setHasUnsavedChanges(false);
    }
  }, [folder?.id, folder?.description, isEditing]);

  // Sync editValue when switching from edit to view mode
  useEffect(() => {
    if (isEditing && editValue === '' && folder?.description) {
      setEditValue(folder.description);
    }
  }, [isEditing, folder?.description]);

  // Auto-save functionality
  const handleAutoSave = useCallback(async (value, immediate = false) => {
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
      saveTimeoutRef.current = setTimeout(saveFunction, 300);
    }
  }, [folder?.id, onUpdateDescription]);

  // Auto-scroll to cursor position
  const scrollToCursor = useCallback(() => {
    requestAnimationFrame(() => {
      const textarea = editorRef.current;
      if (!textarea) return;
      
      const cursorPosition = textarea.selectionStart;
      const textBeforeCursor = textarea.value.substring(0, cursorPosition);
      const lines = textBeforeCursor.split('\n');
      const currentLine = lines.length;
      
      const lineHeight = parseInt(getComputedStyle(textarea).lineHeight, 10);
      const targetScroll = (currentLine - 5) * lineHeight;
      
      if (targetScroll > 0) {
        textarea.scrollTop = Math.max(0, targetScroll);
      }
    });
  }, []);

  // Input change handler
  const handleInputChange = useCallback((value) => {
    setEditValue(value || '');
    handleAutoSave(value || '');
    scrollToCursor();
  }, [handleAutoSave, scrollToCursor]);

  // Save on blur
  const handleBlur = useCallback(() => {
    if (hasUnsavedChanges) {
      handleAutoSave(editValue, true);
    }
  }, [hasUnsavedChanges, editValue, handleAutoSave]);

  // Setup auto-scroll on focus
  useEffect(() => {
    if (isEditing && editorRef.current) {
      const timer = setTimeout(() => {
        const textarea = editorRef.current;
        if (textarea) {
          textarea.focus();
        }
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [isEditing]);

  // Toggle edit mode
  const toggleEditMode = useCallback(async () => {
    if (isEditing) {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      
      await handleAutoSave(editValue, true);
      setIsEditing(false);
    } else {
      setEditValue(folder?.description || '');
      setIsEditing(true);
      setError(null);
    }
  }, [isEditing, editValue, folder?.description, handleAutoSave]);

  // Start edit mode
  const startEdit = useCallback(() => {
    setEditValue(folder?.description || '');
    setIsEditing(true);
    setError(null);
  }, [folder?.description]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  return {
    // State
    isEditing,
    editValue,
    error,
    saveStatus,
    hasUnsavedChanges,
    hasDescription,
    
    // Refs
    editorRef,
    
    // Handlers
    handleInputChange,
    handleBlur,
    toggleEditMode,
    startEdit,
    scrollToCursor,
    
    // Utilities
    manualSave: () => handleAutoSave(editValue, true)
  };
};