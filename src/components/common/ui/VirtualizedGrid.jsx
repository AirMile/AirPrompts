import React, { memo } from 'react';
import { VariableSizeGrid } from 'react-window';

const VirtualizedGrid = memo(function VirtualizedGrid({
  items,
  columnCount = 3,
  height = 600,
  rowHeight = 200,
  renderItem,
  className = ''
}) {
  const rowCount = Math.ceil(items.length / columnCount);
  
  const Cell = ({ columnIndex, rowIndex, style }) => {
    const itemIndex = rowIndex * columnCount + columnIndex;
    if (itemIndex >= items.length) {
      return null;
    }
    
    return (
      <div style={style} className="p-2">
        {renderItem(items[itemIndex], itemIndex)}
      </div>
    );
  };
  
  const getColumnWidth = () => {
    // Calculate column width based on container width
    const containerWidth = typeof window !== 'undefined' 
      ? window.innerWidth - 100 // Account for padding/margins
      : 1200; // Default width for SSR
    return Math.floor(containerWidth / columnCount);
  };
  
  return (
    <div className={className}>
      <VariableSizeGrid
        columnCount={columnCount}
        columnWidth={getColumnWidth}
        height={height}
        rowCount={rowCount}
        rowHeight={() => rowHeight}
        width="100%"
      >
        {Cell}
      </VariableSizeGrid>
    </div>
  );
});

export default VirtualizedGrid;