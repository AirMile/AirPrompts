import { useState, useEffect, useRef } from 'react';
import useFolderSectionVisibility from '../ui/useFolderSectionVisibility';

/**
 * Enhanced context visibility hook with animation and auto-edit functionality
 */
export const useContextVisibility = (folderId, hasDescription, onStartEdit) => {
  const contextVisibility = useFolderSectionVisibility(folderId || 'home', 'context', false);
  const [isAnimating, setIsAnimating] = useState(false);
  const animationTimeoutRef = useRef(null);

  // Handle expand/collapse with animation timing and auto-edit
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
      
      // If there's no content, automatically start edit mode
      if (!hasDescription && onStartEdit) {
        onStartEdit();
      }
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

  return {
    isVisible: contextVisibility.isVisible,
    isAnimating,
    handleExpandToggle
  };
};