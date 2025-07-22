import { useState, useEffect } from 'react';
import { getUserItemColors, getItemColorClasses } from '../utils/itemColors.js';

/**
 * Custom hook for managing and responding to item color changes
 */
export const useItemColors = () => {
  const [itemColors, setItemColors] = useState(getUserItemColors());

  useEffect(() => {
    const handleColorChange = (event) => {
      setItemColors(event.detail || getUserItemColors());
    };

    // Listen for custom color change events
    window.addEventListener('itemColorsChanged', handleColorChange);
    
    return () => {
      window.removeEventListener('itemColorsChanged', handleColorChange);
    };
  }, []);

  return {
    itemColors,
    getColorClasses: getItemColorClasses
  };
};