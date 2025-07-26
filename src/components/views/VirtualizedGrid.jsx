import React, { memo, useCallback } from 'react';
import { useVirtualizedGrid } from '../../hooks/useVirtualization';

const VirtualizedGrid = memo(({ 
  items, 
  columns = 3, 
  gap = 16, 
  itemSize, 
  renderItem,
  virtualization = {},
  onItemsRendered,
  className = ''
}) => {
  // Use advanced grid virtualization
  const {
    containerRef,
    containerProps,
    visibleItems,
    totalSize,
    registerItem,
    scrollToItem,
    renderSpacer,
    metrics
  } = useVirtualizedGrid(items, {
    columns,
    gap,
    estimatedItemHeight: itemSize?.height || 220,
    ...virtualization,
    enableDebug: process.env.NODE_ENV === 'development'
  });

  // Callback for when items are rendered
  const handleItemRender = useCallback((index, element) => {
    registerItem(index, element);
    if (onItemsRendered) {
      onItemsRendered({ startIndex: index, stopIndex: index });
    }
  }, [registerItem, onItemsRendered]);

  return (
    <div 
      ref={containerRef}
      className={`w-full h-full overflow-auto ${className}`}
      {...containerProps}
    >
      {/* Top spacer for virtualization */}
      {renderSpacer('top')}
      
      {/* Grid container with proper styling */}
      <div 
        className="grid"
        style={{
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
          gap: `${gap}px`,
          padding: `${gap}px`,
          position: 'relative'
        }}
      >
        {visibleItems.map(item => (
          <div 
            key={item.id || `virtual-${item.virtualIndex}`}
            ref={el => handleItemRender(item.virtualIndex, el)}
            data-index={item.virtualIndex}
            style={{
              ...itemSize,
              position: 'relative',
              willChange: 'transform'
            }}
            className="transition-opacity duration-200"
          >
            {renderItem({ 
              item, 
              index: item.virtualIndex,
              style: { height: '100%', width: '100%' }
            })}
          </div>
        ))}
      </div>
      
      {/* Bottom spacer for virtualization */}
      {renderSpacer('bottom')}
      
      {/* Debug metrics in development */}
      {metrics && (
        <div className="fixed bottom-4 right-4 bg-black bg-opacity-75 text-white p-2 rounded text-xs font-mono z-50">
          <div>Visible: {metrics.visibleItems}/{metrics.totalItems}</div>
          <div>Renders: {metrics.renderCount}</div>
          <div>Columns: {columns}</div>
        </div>
      )}
    </div>
  );
});

VirtualizedGrid.displayName = 'VirtualizedGrid';

export default VirtualizedGrid;