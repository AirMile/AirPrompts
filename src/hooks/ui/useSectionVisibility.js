import { useState, useEffect } from 'react';
import { sectionVisibilityHelpers } from '../../utils/preferencesStorage.js';

/**
 * Hook for managing section visibility state with preferences persistence
 * @param {string} sectionId - Unique identifier for the section
 * @param {boolean} defaultVisible - Default visibility state
 * @returns {Object} { isVisible, toggle, setVisible }
 */
const useSectionVisibility = (sectionId, defaultVisible = true) => {
  // Initialize state from preferences or use default
  const [isVisible, setIsVisible] = useState(() => {
    try {
      return sectionVisibilityHelpers.getVisibility(sectionId, defaultVisible);
    } catch (error) {
      console.warn(`Error reading section visibility for ${sectionId}:`, error);
      return defaultVisible;
    }
  });

  // Persist to preferences whenever visibility changes
  useEffect(() => {
    try {
      sectionVisibilityHelpers.setVisibility(sectionId, isVisible);
    } catch (error) {
      console.warn(`Error saving section visibility for ${sectionId}:`, error);
    }
  }, [isVisible, sectionId]);

  // Toggle function
  const toggle = () => {
    setIsVisible(prev => {
      const newValue = !prev;
      try {
        sectionVisibilityHelpers.setVisibility(sectionId, newValue);
      } catch (error) {
        console.warn(`Error toggling section visibility for ${sectionId}:`, error);
      }
      return newValue;
    });
  };

  // Direct setter function
  const setVisible = (visible) => {
    setIsVisible(visible);
    try {
      sectionVisibilityHelpers.setVisibility(sectionId, visible);
    } catch (error) {
      console.warn(`Error setting section visibility for ${sectionId}:`, error);
    }
  };

  return {
    isVisible,
    toggle,
    setVisible
  };
};

export default useSectionVisibility;