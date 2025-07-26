import React, { useRef } from 'react';
import { useVirtualization } from '../../hooks/useVirtualization';

const CompactList = ({ 
  items, 
  gap = 4, 
  itemSize, 
  renderItem,
  virtualization = {}
}) => {
  const containerRef = useRef(null);
  
  // Use virtualization for large lists
  const { visibleItems, totalHeight } = useVirtualization(
    items,
    {
      ...virtualization,
      containerRef
    }
  );

  const itemsToRender = virtualization && items.length > 50 ? visibleItems : items;

  return (
    <div 
      ref={containerRef}
      className="w-full h-full overflow-auto bg-white dark:bg-secondary-900 rounded-lg shadow-sm"
      style={{ maxHeight: '100vh' }}
    >
      <div 
        className="divide-y divide-secondary-200 dark:divide-secondary-700"
        style={{ 
          minHeight: totalHeight ? `${totalHeight}px` : 'auto'
        }}
      >
        {itemsToRender.map((item, index) => (
          <div 
            key={item.id || index}
            style={itemSize}
            data-index={index}
            data-sentinel={index % 20 === 0 ? true : undefined}
            className="hover:bg-secondary-50 dark:hover:bg-secondary-800 transition-colors duration-150"
          >
            {renderItem({ item, index })}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CompactList;