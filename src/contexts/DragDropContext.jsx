import React, { createContext, useContext, useState } from 'react';

const DragDropContext = createContext();

/**
 * DragDrop Context Provider voor global drag state management
 * @param {Object} props
 * @param {React.ReactNode} props.children
 */
export const DragDropProvider = ({ children }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [draggedItem, setDraggedItem] = useState(null);
  const [draggedItemType, setDraggedItemType] = useState(null);
  const [dropTargetSection, setDropTargetSection] = useState(null);

  const startDrag = (item, itemType) => {
    setIsDragging(true);
    setDraggedItem(item);
    setDraggedItemType(itemType);
  };

  const endDrag = () => {
    setIsDragging(false);
    setDraggedItem(null);
    setDraggedItemType(null);
    setDropTargetSection(null);
  };

  const setDropTarget = (sectionType) => {
    setDropTargetSection(sectionType);
  };

  const value = {
    isDragging,
    draggedItem,
    draggedItemType,
    dropTargetSection,
    startDrag,
    endDrag,
    setDropTarget
  };

  return (
    <DragDropContext.Provider value={value}>
      {children}
    </DragDropContext.Provider>
  );
};

/**
 * Hook om DragDrop context te gebruiken
 * @returns {Object} DragDrop context waarden
 */
export const useDragDropContext = () => {
  const context = useContext(DragDropContext);
  if (!context) {
    throw new Error('useDragDropContext must be used within a DragDropProvider');
  }
  return context;
};

export default DragDropContext;