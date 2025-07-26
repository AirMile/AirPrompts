import React, { useCallback, useMemo, memo } from 'react';
import { SortableContext, verticalListSortingStrategy, rectSortingStrategy } from '@dnd-kit/sortable';
import ListView from './ListView.jsx';
import SortableCard from './SortableCard.jsx';
import SortableListItem from './SortableListItem.jsx';
import VirtualizedGrid from './ui/VirtualizedGrid.jsx';
import VirtualizedCard from './VirtualizedCard.jsx';

/**
 * Geoptimaliseerde item renderer met virtualization support
 * Memoized to prevent unnecessary re-renders
 */
const OptimizedItemRenderer = memo(({
  items,
  sectionType,
  viewMode,
  shouldUseVirtualization = false,
  commonProps,
  getEditFunction,
  getDeleteFunction,
  getGlobalIndex,
  keyboardNavigation,
  allItems
}) => {
  
  const itemIds = useMemo(() => items.map(item => item.id), [items]);

  // Virtualized grid renderer
  const renderVirtualizedGrid = useCallback(() => {
    const renderGridItem = (item, index) => (
      <VirtualizedCard
        item={item}
        index={index}
        sectionType={sectionType}
        onToggleFavorite={() => commonProps.onToggleFavorite(item)}
        isItemFavorite={() => commonProps.isItemFavorite(item)}
        onExecute={() => commonProps.onExecute({ item, type: item.type || sectionType })}
        onEdit={() => getEditFunction(item)(item)}
        onDelete={() => getDeleteFunction(item)(item.id)}
        keyboardNavigation={keyboardNavigation}
      />
    );

    return (
      <VirtualizedGrid
        items={items}
        columnCount={4}
        height={600}
        rowHeight={200}
        renderItem={renderGridItem}
        className="w-full"
      />
    );
  }, [items, sectionType, commonProps, getEditFunction, getDeleteFunction, keyboardNavigation]);

  // Regular grid renderer (kleine datasets)
  const renderRegularGrid = useCallback(() => {
    return (
      <SortableContext items={itemIds} strategy={rectSortingStrategy}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {items.map((item, index) => (
            <SortableCard
              key={item.id}
              id={item.id}
              item={item}
              index={index}
              type={item.type}
              sectionType={sectionType}
              onExecute={commonProps.onExecute}
              onEdit={() => getEditFunction(item)(item)}
              onDelete={() => getDeleteFunction(item)(item.id)}
              onToggleFavorite={commonProps.onToggleFavorite}
              isItemFavorite={commonProps.isItemFavorite}
              keyboardNavigation={{
                ...commonProps.keyboardNavigation,
                getFocusProps: () => {
                  const globalIndex = getGlobalIndex(sectionType, index);
                  const isKeyboardFocused = keyboardNavigation.isActive && keyboardNavigation.focusedIndex === globalIndex;
                  
                  return {
                    'data-keyboard-focused': isKeyboardFocused,
                    'tabIndex': isKeyboardFocused ? 0 : -1,
                    'aria-selected': isKeyboardFocused,
                    'role': 'option',
                    'aria-setsize': allItems.length,
                    'aria-posinset': globalIndex >= 0 ? globalIndex + 1 : -1
                  };
                }
              }}
            />
          ))}
        </div>
      </SortableContext>
    );
  }, [items, itemIds, sectionType, commonProps, getEditFunction, getDeleteFunction, getGlobalIndex, keyboardNavigation, allItems]);

  // List view renderer
  const renderListView = useCallback(() => {
    return (
      <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {items.map((item, index) => (
            <SortableListItem key={item.id} id={item.id} item={item}>
              <ListView 
                {...commonProps} 
                items={[item]} 
                sectionType={sectionType}
                keyboardNavigation={{
                  ...commonProps.keyboardNavigation,
                  getFocusProps: () => {
                    const globalIndex = getGlobalIndex(sectionType, index);
                    const isKeyboardFocused = keyboardNavigation.isActive && keyboardNavigation.focusedIndex === globalIndex;
                    
                    return {
                      'data-keyboard-focused': isKeyboardFocused,
                      'tabIndex': isKeyboardFocused ? 0 : -1,
                      'aria-selected': isKeyboardFocused,
                      'role': 'option',
                      'aria-setsize': allItems.length,
                      'aria-posinset': globalIndex >= 0 ? globalIndex + 1 : -1
                    };
                  }
                }}
              />
            </SortableListItem>
          ))}
        </div>
      </SortableContext>
    );
  }, [items, itemIds, commonProps, sectionType, getGlobalIndex, keyboardNavigation, allItems]);

  // Performance indicator voor debugging
  const performanceStats = useMemo(() => ({
    totalItems: items.length,
    usingVirtualization: shouldUseVirtualization,
    viewMode,
    sectionType
  }), [items.length, shouldUseVirtualization, viewMode, sectionType]);

  // Console log voor performance monitoring tijdens development
  if (process.env.NODE_ENV === 'development' && items.length > 50) {
    console.log('📊 OptimizedItemRenderer Stats:', performanceStats);
  }

  // Render decision logic
  if (viewMode === 'list') {
    return renderListView();
  }

  // Grid mode
  if (shouldUseVirtualization && viewMode === 'grid') {
    return renderVirtualizedGrid();
  }

  return renderRegularGrid();
}, (prevProps, nextProps) => {
  // Custom comparison function for better performance
  // Only re-render if critical props change
  return (
    prevProps.items === nextProps.items &&
    prevProps.viewMode === nextProps.viewMode &&
    prevProps.sectionType === nextProps.sectionType &&
    prevProps.shouldUseVirtualization === nextProps.shouldUseVirtualization &&
    prevProps.keyboardNavigation.focusedIndex === nextProps.keyboardNavigation.focusedIndex &&
    prevProps.keyboardNavigation.isActive === nextProps.keyboardNavigation.isActive
  );
});

OptimizedItemRenderer.displayName = 'OptimizedItemRenderer';

export default OptimizedItemRenderer;