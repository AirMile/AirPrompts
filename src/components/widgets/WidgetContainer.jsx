import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Settings, X, Maximize2, Minimize2, Move } from 'lucide-react';
import { useUserPreferences } from '../../hooks/domain/useUserPreferences.js';

/**
 * WidgetContainer - A draggable and resizable container for dashboard widgets
 * 
 * Features:
 * - Drag and drop positioning
 * - Resize functionality
 * - Enable/disable toggles
 * - Configuration panels
 * - State persistence through preferences
 */
const WidgetContainer = ({
  widgetId,
  title,
  children,
  defaultPosition = { x: 0, y: 0 },
  defaultSize = { width: 300, height: 200 },
  minSize = { width: 250, height: 150 },
  maxSize = { width: 800, height: 600 },
  isConfigurable = true,
  onConfigure = () => {},
  onRemove = () => {},
  className = ''
}) => {
  const { dashboard, updateDashboard } = useUserPreferences();
  const containerRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [resizeStartPos, setResizeStartPos] = useState({ x: 0, y: 0 });
  const [resizeStartSize, setResizeStartSize] = useState({ width: 0, height: 0 });
  
  // Get widget configuration from preferences
  const widgetConfig = dashboard.widgets?.[widgetId] || {
    position: defaultPosition,
    size: defaultSize,
    enabled: true,
    maximized: false
  };

  const [position, setPosition] = useState(widgetConfig.position);
  const [size, setSize] = useState(widgetConfig.size);

  // Update preferences when widget state changes
  const updateWidgetConfig = useCallback((updates) => {
    const newConfig = { ...widgetConfig, ...updates };
    updateDashboard({
      widgets: {
        ...dashboard.widgets,
        [widgetId]: newConfig
      }
    });
  }, [widgetConfig, updateDashboard, dashboard.widgets, widgetId]);

  // Handle drag start
  const handleDragStart = (e) => {
    if (isMaximized) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    setIsDragging(true);
    
    // Prevent text selection during drag
    e.preventDefault();
  };

  // Handle drag move
  const handleDragMove = useCallback((e) => {
    if (!isDragging || isMaximized) return;
    
    const newPosition = {
      x: e.clientX - dragOffset.x,
      y: e.clientY - dragOffset.y
    };
    
    // Constrain to viewport
    const maxX = window.innerWidth - size.width;
    const maxY = window.innerHeight - size.height;
    
    newPosition.x = Math.max(0, Math.min(newPosition.x, maxX));
    newPosition.y = Math.max(0, Math.min(newPosition.y, maxY));
    
    setPosition(newPosition);
  }, [isDragging, isMaximized, dragOffset, size]);

  // Handle drag end
  const handleDragEnd = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      updateWidgetConfig({ position });
    }
  }, [isDragging, position, updateWidgetConfig]);

  // Handle resize start
  const handleResizeStart = (e) => {
    if (isMaximized) return;
    
    setResizeStartPos({ x: e.clientX, y: e.clientY });
    setResizeStartSize({ ...size });
    setIsResizing(true);
    
    e.preventDefault();
    e.stopPropagation();
  };

  // Handle resize move
  const handleResizeMove = useCallback((e) => {
    if (!isResizing || isMaximized) return;
    
    const deltaX = e.clientX - resizeStartPos.x;
    const deltaY = e.clientY - resizeStartPos.y;
    
    const newSize = {
      width: Math.max(minSize.width, Math.min(maxSize.width, resizeStartSize.width + deltaX)),
      height: Math.max(minSize.height, Math.min(maxSize.height, resizeStartSize.height + deltaY))
    };
    
    setSize(newSize);
  }, [isResizing, isMaximized, resizeStartPos, resizeStartSize, minSize, maxSize]);

  // Handle resize end
  const handleResizeEnd = useCallback(() => {
    if (isResizing) {
      setIsResizing(false);
      updateWidgetConfig({ size });
    }
  }, [isResizing, size, updateWidgetConfig]);

  // Handle maximize/minimize
  const handleToggleMaximize = () => {
    const newMaximized = !isMaximized;
    setIsMaximized(newMaximized);
    updateWidgetConfig({ maximized: newMaximized });
  };

  // Handle widget removal
  const handleRemove = () => {
    if (window.confirm(`Are you sure you want to remove the ${title} widget?`)) {
      updateWidgetConfig({ enabled: false });
      onRemove(widgetId);
    }
  };

  // Mouse event handlers
  useEffect(() => {
    const handleMouseMove = (e) => {
      handleDragMove(e);
      handleResizeMove(e);
    };
    
    const handleMouseUp = () => {
      handleDragEnd();
      handleResizeEnd();
    };
    
    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, dragOffset, resizeStartPos, resizeStartSize, position, size, handleDragMove, handleDragEnd, handleResizeMove, handleResizeEnd]);

  // Don't render if widget is disabled
  if (!widgetConfig.enabled) {
    return null;
  }

  const containerStyle = isMaximized 
    ? {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 1000
      }
    : {
        position: 'absolute',
        left: position.x,
        top: position.y,
        width: size.width,
        height: size.height,
        zIndex: isDragging ? 1000 : 100
      };

  return (
    <div
      ref={containerRef}
      className={`
        bg-gray-800 border border-gray-700 rounded-lg shadow-lg overflow-hidden
        ${isDragging ? 'cursor-move' : ''}
        ${isResizing ? 'cursor-se-resize' : ''}
        ${className}
      `}
      style={containerStyle}
    >
      {/* Widget Header */}
      <div
        className="flex items-center justify-between p-3 bg-gray-900 border-b border-gray-700 cursor-move"
        onMouseDown={handleDragStart}
      >
        <div className="flex items-center gap-2">
          <Move className="w-4 h-4 text-gray-400" />
          <h3 className="text-sm font-medium text-gray-100">{title}</h3>
        </div>
        
        <div className="flex items-center gap-1">
          {isConfigurable && (
            <button
              onClick={onConfigure}
              className="p-1 text-gray-400 hover:text-gray-200 hover:bg-gray-700 rounded"
              title="Configure widget"
            >
              <Settings className="w-4 h-4" />
            </button>
          )}
          
          <button
            onClick={handleToggleMaximize}
            className="p-1 text-gray-400 hover:text-gray-200 hover:bg-gray-700 rounded"
            title={isMaximized ? 'Minimize' : 'Maximize'}
          >
            {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          
          <button
            onClick={handleRemove}
            className="p-1 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded"
            title="Remove widget"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Widget Content */}
      <div className="p-4 overflow-auto" style={{ height: 'calc(100% - 57px)' }}>
        {children}
      </div>

      {/* Resize Handle */}
      {!isMaximized && (
        <div
          className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize"
          onMouseDown={handleResizeStart}
        >
          <div className="absolute bottom-1 right-1 w-2 h-2 bg-gray-600 rounded-sm" />
        </div>
      )}
    </div>
  );
};

export default WidgetContainer;