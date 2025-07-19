import React, { useState, useEffect, useRef, useMemo } from 'react';

const VirtualGrid = ({ 
  items, 
  itemHeight = 200, 
  itemWidth = 300, 
  containerHeight = 600,
  columns = 4,
  overscan = 3,
  renderItem 
}) => {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef(null);

  // Calculate visible items based on scroll position
  const visibleItems = useMemo(() => {
    if (!items.length) return [];

    const rowHeight = itemHeight + 16; // Including gap
    const startRow = Math.floor(scrollTop / rowHeight);
    const endRow = Math.min(
      Math.ceil((scrollTop + containerHeight) / rowHeight) + overscan,
      Math.ceil(items.length / columns)
    );

    const visibleItemsArray = [];
    for (let row = Math.max(0, startRow - overscan); row < endRow; row++) {
      for (let col = 0; col < columns; col++) {
        const index = row * columns + col;
        if (index < items.length) {
          visibleItemsArray.push({
            index,
            item: items[index],
            top: row * rowHeight,
            left: col * (itemWidth + 16) // Including gap
          });
        }
      }
    }

    return visibleItemsArray;
  }, [items, scrollTop, containerHeight, itemHeight, itemWidth, columns, overscan]);

  // Total height of all items
  const totalHeight = Math.ceil(items.length / columns) * (itemHeight + 16);

  // Handle scroll events
  const handleScroll = (e) => {
    setScrollTop(e.target.scrollTop);
  };

  // Optimize scroll handling with throttling
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let ticking = false;
    const throttledScroll = (e) => {
      if (!ticking) {
        requestAnimationFrame(() => {
          handleScroll(e);
          ticking = false;
        });
        ticking = true;
      }
    };

    container.addEventListener('scroll', throttledScroll);
    return () => container.removeEventListener('scroll', throttledScroll);
  }, []);

  return (
    <div
      ref={containerRef}
      className="overflow-auto"
      style={{ height: containerHeight }}
    >
      <div
        className="relative"
        style={{ height: totalHeight }}
      >
        {visibleItems.map(({ index, item, top, left }) => (
          <div
            key={item.id || index}
            className="absolute"
            style={{
              top,
              left,
              width: itemWidth,
              height: itemHeight
            }}
          >
            {renderItem(item, index)}
          </div>
        ))}
      </div>
    </div>
  );
};

export default VirtualGrid;