import React, { memo } from 'react';
import { FixedSizeList } from 'react-window';

const VirtualizedList = memo(function VirtualizedList({ 
  items, 
  height = 600,
  itemHeight = 80,
  renderItem,
  className = ''
}) {
  const Row = ({ index, style }) => (
    <div style={style}>
      {renderItem(items[index], index)}
    </div>
  );
  
  return (
    <div className={className}>
      <FixedSizeList
        height={height}
        itemCount={items.length}
        itemSize={itemHeight}
        width="100%"
      >
        {Row}
      </FixedSizeList>
    </div>
  );
});

export default VirtualizedList;