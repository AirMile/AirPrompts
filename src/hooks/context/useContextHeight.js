import { useState, useEffect, useRef, useCallback } from 'react';

const DEFAULT_HEIGHT = 300;
const MIN_HEIGHT = 40;
const MAX_HEIGHT = 400;

/**
 * Custom hook for managing context section height with auto/manual modes
 */
export const useContextHeight = (folderId, content, isEditing) => {
  const contentMeasureRef = useRef(null);
  const isDragging = useRef(false);
  const startY = useRef(0);
  const startHeight = useRef(0);
  const handlersRef = useRef({});
  const prevIsEditingRef = useRef(isEditing);

  // Height state with localStorage persistence
  const [contentHeight, setContentHeight] = useState(() => {
    const stored = localStorage.getItem(`context-height-${folderId}`);
    return stored ? parseInt(stored, 10) : DEFAULT_HEIGHT;
  });

  const [useAutoHeight, setUseAutoHeight] = useState(() => {
    const stored = localStorage.getItem(`context-height-mode-${folderId}`);
    return stored ? stored === 'auto' : true;
  });

  const [autoCalculatedHeight, setAutoCalculatedHeight] = useState(MIN_HEIGHT);
  const [isDraggingState, setIsDraggingState] = useState(false);

  // Save height and mode to localStorage
  useEffect(() => {
    const heightKey = `context-height-${folderId}`;
    const modeKey = `context-height-mode-${folderId}`;
    
    const timeoutId = setTimeout(() => {
      localStorage.setItem(heightKey, contentHeight.toString());
      localStorage.setItem(modeKey, useAutoHeight ? 'auto' : 'manual');
    }, 100);
    
    return () => clearTimeout(timeoutId);
  }, [contentHeight, useAutoHeight, folderId]);

  // Update height when folder changes
  useEffect(() => {
    if (!folderId) return;
    
    const heightKey = `context-height-${folderId}`;
    const modeKey = `context-height-mode-${folderId}`;
    
    const storedHeight = localStorage.getItem(heightKey);
    const storedMode = localStorage.getItem(modeKey);
    
    const folderHeight = storedHeight ? parseInt(storedHeight, 10) : DEFAULT_HEIGHT;
    const folderMode = storedMode ? storedMode === 'auto' : true;
    
    setContentHeight(folderHeight);
    setUseAutoHeight(folderMode);
  }, [folderId]);

  // Calculate auto height based on content
  const calculateAutoHeight = useCallback(() => {
    if (!contentMeasureRef.current || !content?.trim()) {
      return MIN_HEIGHT;
    }
    
    const containerElement = contentMeasureRef.current;
    const markdownContent = containerElement.querySelector('div, p, span') || containerElement;
    
    const containerRect = containerElement.getBoundingClientRect();
    const contentRect = markdownContent.getBoundingClientRect();
    
    const scrollHeight = containerElement.scrollHeight;
    const boundingHeight = containerRect.height;
    const actualContentHeight = contentRect.height;
    
    const paddingHeight = 32; // py-4 padding
    
    let computedHeight = Math.max(actualContentHeight, Math.min(scrollHeight, boundingHeight));
    
    // For short content, estimate based on line height
    if (computedHeight > MIN_HEIGHT * 3 && content.trim().split('\n').length <= 2) {
      const lineHeight = 20;
      const lines = content.trim().split('\n').length;
      computedHeight = lines * lineHeight;
    }
    
    const totalHeight = computedHeight + paddingHeight;
    return Math.max(MIN_HEIGHT, Math.min(MAX_HEIGHT, totalHeight));
  }, [content]);

  // Update auto calculated height when content changes
  useEffect(() => {
    if (useAutoHeight && !isEditing && content?.trim()) {
      // Check if we just switched from edit to view mode
      const justSwitchedToView = prevIsEditingRef.current && !isEditing;
      
      const updateHeight = () => {
        const newAutoHeight = calculateAutoHeight();
        setAutoCalculatedHeight(newAutoHeight);
      };
      
      if (justSwitchedToView) {
        // Immediate calculation for edit->view mode switches
        requestAnimationFrame(updateHeight);
      } else {
        // Small delay for content changes while in view mode
        requestAnimationFrame(() => {
          setTimeout(updateHeight, 50);
        });
      }
    } else if (!content?.trim()) {
      setAutoCalculatedHeight(MIN_HEIGHT);
    }
    
    // Update ref with current value
    prevIsEditingRef.current = isEditing;
  }, [content, useAutoHeight, isEditing, calculateAutoHeight]);

  // Create stable event handlers using refs
  const createMouseHandlers = useCallback(() => {
    const handleMouseMove = (e) => {
      if (!isDragging.current) return;
      
      const deltaY = e.clientY - startY.current;
      const newHeight = Math.max(
        MIN_HEIGHT,
        Math.min(MAX_HEIGHT, startHeight.current + deltaY)
      );
      
      setContentHeight(newHeight);
    };

    const handleMouseUp = () => {
      isDragging.current = false;
      setIsDraggingState(false);
      document.removeEventListener('mousemove', handlersRef.current.handleMouseMove);
      document.removeEventListener('mouseup', handlersRef.current.handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    return { handleMouseMove, handleMouseUp };
  }, []);

  // Update handlers ref when needed
  useEffect(() => {
    handlersRef.current = createMouseHandlers();
  }, [createMouseHandlers]);

  // Main mouse down handler
  const handleMouseDown = useCallback((e) => {
    if (isEditing) return;
    
    e.preventDefault();
    isDragging.current = true;
    setIsDraggingState(true);
    startY.current = e.clientY;
    
    const currentDisplayHeight = useAutoHeight ? autoCalculatedHeight : contentHeight;
    startHeight.current = currentDisplayHeight;
    
    if (useAutoHeight) {
      setUseAutoHeight(false);
      setContentHeight(currentDisplayHeight);
    }
    
    // Use the current handlers from ref
    document.addEventListener('mousemove', handlersRef.current.handleMouseMove);
    document.addEventListener('mouseup', handlersRef.current.handleMouseUp);
    document.body.style.cursor = 'ns-resize';
    document.body.style.userSelect = 'none';
  }, [contentHeight, autoCalculatedHeight, useAutoHeight, isEditing]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (handlersRef.current.handleMouseMove) {
        document.removeEventListener('mousemove', handlersRef.current.handleMouseMove);
      }
      if (handlersRef.current.handleMouseUp) {
        document.removeEventListener('mouseup', handlersRef.current.handleMouseUp);
      }
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, []);

  return {
    contentHeight,
    useAutoHeight,
    autoCalculatedHeight,
    isDraggingState,
    contentMeasureRef,
    handleMouseDown,
    resetToAutoHeight: useCallback(() => {
      setUseAutoHeight(true);
      setAutoCalculatedHeight(calculateAutoHeight());
    }, [calculateAutoHeight]),
    constants: {
      MIN_HEIGHT,
      MAX_HEIGHT
    }
  };
};