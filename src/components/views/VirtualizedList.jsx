import React, { memo, useCallback } from 'react';
import { useVirtualization } from '../../hooks/useVirtualization';

const VirtualizedList = memo(({ 
  items, 
  gap = 8, 
  itemSize, 
  renderItem,
  virtualization = {},
  onItemsRendered,
  className = ''
}) => {
  // Use advanced list virtualization
  const {
    containerRef,
    containerProps,
    visibleItems,
    totalSize,
    registerItem,
    scrollToItem,
    renderSpacer,
    metrics
  } = useVirtualization(items, {
    estimatedItemSize: itemSize?.height || 80,
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
      <div style={{ padding: `${gap}px` }}>
        {/* Top spacer for virtualization */}
        {renderSpacer('top')}
        
        {/* List items */}
        <div className="space-y-0">
          {visibleItems.map((item, idx) => (
            <div 
              key={item.id || `virtual-${item.virtualIndex}`}
              ref={el => handleItemRender(item.virtualIndex, el)}
              data-index={item.virtualIndex}
              style={{ 
                marginBottom: idx < visibleItems.length - 1 ? `${gap}px` : 0,
                ...itemSize,
                willChange: 'transform'
              }}
              className="transition-all duration-200"
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
      </div>
      
      {/* Debug metrics in development */}
      {metrics && (
        <div className="fixed bottom-4 right-4 bg-black bg-opacity-75 text-white p-2 rounded text-xs font-mono z-50">
          <div>Visible: {metrics.visibleItems}/{metrics.totalItems}</div>
          <div>Renders: {metrics.renderCount}</div>
          <div>Item Height: {itemSize?.height || 80}px</div>
        </div>
      )}
    </div>
  );
});

VirtualizedList.displayName = 'VirtualizedList';

export default VirtualizedList;