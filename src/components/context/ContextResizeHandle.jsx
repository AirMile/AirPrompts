import React from 'react';

/**
 * Context resize handle component
 */
const ContextResizeHandle = ({ 
  isVisible, 
  useAutoHeight, 
  autoCalculatedHeight, 
  maxHeight, 
  isDraggingState, 
  onMouseDown 
}) => {
  // Always show resize handle when visible, unless content is very small
  if (!isVisible) {
    return null;
  }
  
  // Only hide if using auto height and content is genuinely very small (not during transitions)
  if (useAutoHeight && autoCalculatedHeight > 0 && autoCalculatedHeight < maxHeight * 0.15) {
    return null;
  }

  return (
    <div
      className="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize transition-colors duration-200 group"
      title={useAutoHeight ? "Switch to manual resize" : "Drag to resize"}
      onMouseDown={onMouseDown}
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
  );
};

export default ContextResizeHandle;