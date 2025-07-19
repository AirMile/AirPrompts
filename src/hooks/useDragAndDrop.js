import { useState, useCallback } from 'react';
import { arrayMove } from '@dnd-kit/sortable';

/**
 * Custom hook voor drag and drop functionaliteit
 * @param {Object} options
 * @param {Array} options.items - Array van items om te sorteren
 * @param {Function} options.onReorder - Callback voor reordering van items
 * @param {string} options.sectionType - Type sectie (favorites, templates, workflows, snippets)
 * @param {string} options.selectedFolderId - Huidige folder ID
 * @returns {Object} Drag and drop handlers en state
 */
export const useDragAndDrop = ({
  items,
  onReorder,
  sectionType,
  selectedFolderId
}) => {
  const [activeId, setActiveId] = useState(null);
  const [dragOverlay, setDragOverlay] = useState(null);

  const handleDragStart = useCallback((event) => {
    const { active } = event;
    setActiveId(active.id);
    
    // Vind het item dat gedragged wordt
    const draggedItem = items.find(item => item.id === active.id);
    setDragOverlay(draggedItem);
  }, [items]);

  const handleDragEnd = useCallback((event) => {
    const { active, over } = event;
    
    setActiveId(null);
    setDragOverlay(null);

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = items.findIndex(item => item.id === active.id);
    const newIndex = items.findIndex(item => item.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      const reorderedItems = arrayMove(items, oldIndex, newIndex);
      
      // Update order properties based on section type
      const updatedItems = reorderedItems.map((item, index) => {
        const orderKey = sectionType === 'favorites' ? 'favoriteOrder' : 'folderOrder';
        
        if (sectionType === 'favorites') {
          return {
            ...item,
            folderFavorites: {
              ...item.folderFavorites,
              [selectedFolderId]: {
                ...item.folderFavorites?.[selectedFolderId],
                favoriteOrder: index
              }
            }
          };
        } else {
          return {
            ...item,
            folderOrder: {
              ...item.folderOrder,
              [selectedFolderId]: index
            }
          };
        }
      });

      onReorder(updatedItems);
    }
  }, [items, onReorder, sectionType, selectedFolderId]);

  const handleDragCancel = useCallback(() => {
    setActiveId(null);
    setDragOverlay(null);
  }, []);

  return {
    activeId,
    dragOverlay,
    handleDragStart,
    handleDragEnd,
    handleDragCancel
  };
};

export default useDragAndDrop;