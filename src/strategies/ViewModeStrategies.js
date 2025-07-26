import React, { memo, useState, useEffect, useMemo } from 'react';
import { debounce } from '../utils/helpers';

// Import view components (these will be created next)
import VirtualizedGrid from '../components/views/VirtualizedGrid';
import VirtualizedList from '../components/views/VirtualizedList';
import CompactList from '../components/views/CompactList';
import KanbanBoard from '../components/views/KanbanBoard';
import TimelineView from '../components/views/TimelineView';

// Import item components
import ItemCard from '../components/items/ItemCard';
import ItemListRow from '../components/items/ItemListRow';
import ItemCompactRow from '../components/items/ItemCompactRow';
import KanbanCard from '../components/items/KanbanCard';
import TimelineItem from '../components/items/TimelineItem';

// Helper functions
const groupBy = (items, key) => {
  return items.reduce((groups, item) => {
    const group = item[key] || 'Other';
    if (!groups[group]) {
      groups[group] = [];
    }
    groups[group].push(item);
    return groups;
  }, {});
};

const sortBy = (items, key) => {
  return [...items].sort((a, b) => {
    if (key === 'updatedAt' || key === 'createdAt') {
      return new Date(b[key]) - new Date(a[key]);
    }
    return String(a[key]).localeCompare(String(b[key]));
  });
};

export const ViewModeStrategies = {
  grid: {
    Component: VirtualizedGrid,
    getItemSize: (viewportWidth) => {
      // Responsive sizing
      if (viewportWidth < 640) return { width: '100%', height: 180 };
      if (viewportWidth < 1024) return { width: '50%', height: 200 };
      return { width: 300, height: 220 };
    },
    getColumns: (viewportWidth) => {
      if (viewportWidth < 640) return 1;
      if (viewportWidth < 1024) return 2;
      if (viewportWidth < 1536) return 3;
      return 4;
    },
    gap: 16,
    virtualization: {
      overscan: 2,
      scrollThreshold: 0.8,
      estimatedItemSize: 220
    },
    itemComponent: ItemCard
  },
  
  list: {
    Component: VirtualizedList,
    getItemSize: () => ({ width: '100%', height: 80 }),
    getColumns: () => 1,
    gap: 8,
    virtualization: {
      overscan: 5,
      scrollThreshold: 0.9,
      estimatedItemSize: 80
    },
    itemComponent: ItemListRow
  },
  
  compact: {
    Component: CompactList,
    getItemSize: () => ({ width: '100%', height: 48 }),
    getColumns: () => 1,
    gap: 4,
    virtualization: {
      overscan: 10,
      scrollThreshold: 0.95,
      estimatedItemSize: 48
    },
    itemComponent: ItemCompactRow
  },
  
  kanban: {
    Component: KanbanBoard,
    getItemSize: () => ({ width: 320, height: 'auto' }),
    getColumns: () => 'auto',
    gap: 16,
    virtualization: null, // Kanban uses different optimization
    itemComponent: KanbanCard,
    groupBy: 'category' // Group by category for kanban
  },
  
  timeline: {
    Component: TimelineView,
    getItemSize: () => ({ width: '100%', height: 'auto' }),
    getColumns: () => 1,
    gap: 24,
    virtualization: {
      overscan: 3,
      scrollThreshold: 0.85,
      estimatedItemSize: 120
    },
    itemComponent: TimelineItem,
    sortBy: 'updatedAt' // Sort by date for timeline
  }
};

// Intelligent View Mode Manager
export const ViewModeManager = memo(({ items, viewMode = 'grid', ...props }) => {
  const [viewportWidth, setViewportWidth] = useState(window.innerWidth);
  const strategy = ViewModeStrategies[viewMode];
  
  // Handle responsive updates
  useEffect(() => {
    const handleResize = debounce(() => {
      setViewportWidth(window.innerWidth);
    }, 300);
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  if (!strategy) {
    console.warn(`Unknown view mode: ${viewMode}, falling back to grid`);
    return <ViewModeManager items={items} viewMode="grid" {...props} />;
  }
  
  const { Component, itemComponent: ItemComponent, ...strategyProps } = strategy;
  
  // Apply strategy-specific transformations
  const processedItems = useMemo(() => {
    let result = [...items];
    
    // Apply grouping if specified
    if (strategyProps.groupBy) {
      result = groupBy(result, strategyProps.groupBy);
    }
    
    // Apply sorting if specified
    if (strategyProps.sortBy) {
      result = sortBy(result, strategyProps.sortBy);
    }
    
    return result;
  }, [items, strategyProps.groupBy, strategyProps.sortBy]);
  
  // Calculate responsive properties
  const responsiveProps = {
    ...strategyProps,
    columns: strategyProps.getColumns(viewportWidth),
    itemSize: strategyProps.getItemSize(viewportWidth)
  };
  
  return (
    <Component 
      items={processedItems}
      {...responsiveProps}
      renderItem={({ item, ...itemProps }) => (
        <ItemComponent item={item} viewMode={viewMode} {...itemProps} {...props} />
      )}
    />
  );
});