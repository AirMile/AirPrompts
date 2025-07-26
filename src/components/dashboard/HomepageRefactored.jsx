import React, { useCallback } from 'react';
import { ViewModeManager } from '../../strategies/ViewModeStrategies';
import { DndContext, DragOverlay } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, rectSortingStrategy } from '@dnd-kit/sortable';

/**
 * Refactored render function using ViewModeManager
 * This can be integrated into the main Homepage component
 */
export const useViewModeRenderer = () => {
  const renderItemsWithViewMode = useCallback((items, sectionType, {
    viewMode,
    onToggleFavorite,
    isItemFavorite,
    onExecute,
    onEdit,
    onDelete,
    keyboardNavigation,
    dragDropHandler,
    folders = []
  }) => {
    // Transform items to include type if not present
    const normalizedItems = items.map(item => ({
      ...item,
      type: item.type || (
        sectionType === 'workflows' ? 'workflow' :
        sectionType === 'templates' ? 'template' :
        sectionType === 'snippets' ? 'snippet' :
        'template'
      )
    }));

    // Prepare props for ViewModeManager
    const viewModeProps = {
      items: normalizedItems,
      viewMode,
      folders,
      onExecute: (item) => {
        const executeType = item.type || sectionType.slice(0, -1); // Remove 's' from section type
        onExecute({ item, type: executeType });
      },
      onEdit,
      onDelete: (item) => onDelete(item.id),
      onToggleFavorite,
      // Additional props can be passed through
      keyboardNavigation,
      sectionType
    };

    // For drag and drop support, wrap with SortableContext
    if (dragDropHandler && dragDropHandler.activeId) {
      const itemIds = normalizedItems.map(item => item.id);
      const strategy = viewMode === 'list' ? verticalListSortingStrategy : rectSortingStrategy;
      
      return (
        <SortableContext items={itemIds} strategy={strategy}>
          <ViewModeManager {...viewModeProps} />
        </SortableContext>
      );
    }

    // Without drag and drop
    return <ViewModeManager {...viewModeProps} />;
  }, []);

  return { renderItemsWithViewMode };
};

/**
 * Example integration snippet for Homepage component
 * 
 * In Homepage component:
 * 
 * import { useViewModeRenderer } from './HomepageRefactored';
 * 
 * const Homepage = () => {
 *   const { renderItemsWithViewMode } = useViewModeRenderer();
 *   
 *   // Replace the existing renderItems function with:
 *   const renderItems = useCallback((items, sectionType) => {
 *     return renderItemsWithViewMode(items, sectionType, {
 *       viewMode,
 *       onToggleFavorite: (item) => handleFavoriteToggle(item, sectionType),
 *       isItemFavorite: (item) => isItemFavoriteInFolder(item, selectedFolderId),
 *       onExecute: onExecuteItem,
 *       onEdit: getEditFunction,
 *       onDelete: getDeleteFunction,
 *       keyboardNavigation,
 *       dragDropHandler: getDragDropHandler(sectionType),
 *       folders
 *     });
 *   }, [renderItemsWithViewMode, viewMode, ...other dependencies]);
 * };
 */