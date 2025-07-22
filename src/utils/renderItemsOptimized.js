import React from 'react';
import OptimizedItemRenderer from '../components/common/OptimizedItemRenderer.jsx';

/**
 * Geoptimaliseerde renderItems functie met progressive loading en virtualization
 */
export const createOptimizedRenderItems = ({
  onEditWorkflow,
  onEditTemplate, 
  onEditSnippet,
  onDeleteWorkflow,
  onDeleteTemplate,
  onDeleteSnippet,
  handleFavoriteToggle,
  isItemFavoriteInFolder,
  selectedFolderId,
  keyboardNavigation,
  getGlobalIndex,
  allItems
}) => {
  
  const getEditFunction = (item, sectionType) => {
    // For favorites and recent sections, use item.type
    if (sectionType === 'favorites' || sectionType === 'recent') {
      return item.type === 'workflow' ? onEditWorkflow : 
             item.type === 'template' ? onEditTemplate : onEditSnippet;
    }
    
    // For specific sections, use sectionType
    return sectionType === 'workflows' ? onEditWorkflow : 
           sectionType === 'templates' ? onEditTemplate : onEditSnippet;
  };

  const getDeleteFunction = (item, sectionType) => {
    // For favorites and recent sections, use item.type
    if (sectionType === 'favorites' || sectionType === 'recent') {
      return item.type === 'workflow' ? onDeleteWorkflow : 
             item.type === 'template' ? onDeleteTemplate : onDeleteSnippet;
    }
    // For specific sections, use sectionType
    return sectionType === 'workflows' ? onDeleteWorkflow : 
           sectionType === 'templates' ? onDeleteTemplate : onDeleteSnippet;
  };

  return (items, sectionType, viewMode, progressiveData) => {
    // Gebruik progressive loading data als beschikbaar
    const actualItems = progressiveData ? progressiveData.items : items;
    const shouldUseVirtualization = progressiveData ? progressiveData.shouldUseVirtualization : false;

    const commonProps = {
      items: actualItems,
      type: sectionType === 'workflows' ? 'workflow' : 
            sectionType === 'snippets' ? 'snippet' : 
            sectionType === 'templates' ? 'template' :
            'template', // Default fallback for mixed sections like 'recent' and 'favorites'
      onToggleFavorite: (item) => handleFavoriteToggle(item, sectionType),
      isItemFavorite: (item) => isItemFavoriteInFolder(item, selectedFolderId),
      onExecute: (executeData) => {
        // Handle both old signature (item) and new signature ({ item, type })
        const actualItem = executeData?.item || executeData;
        const executeType = executeData?.type;
        
        // Normalize type for consistency - always convert to singular
        let itemType = executeType || 
          ((sectionType === 'favorites' || sectionType === 'recent') 
            ? actualItem?.type 
            : sectionType);
        
        // Ensure type is singular
        if (itemType && itemType.endsWith('s')) {
          itemType = itemType.slice(0, -1);
        }
        
        // Final safety check - ensure we have both item and type
        if (!actualItem) {
          return;
        }
        
        if (!itemType) {
          // Fallback to template if no type can be determined
          itemType = 'template';
        }
        
        // Call the appropriate execute handler
        switch (itemType) {
          case 'workflow':
            return executeWorkflowItem(actualItem);
          case 'template':
            return executeTemplateItem(actualItem);
          case 'snippet':
            return executeSnippetItem(actualItem);
          default:
            console.warn(`Unknown item type: ${itemType}. Defaulting to template.`);
            return executeTemplateItem(actualItem);
        }
      },
      keyboardNavigation
    };

    return (
      <OptimizedItemRenderer
        items={actualItems}
        sectionType={sectionType}
        viewMode={viewMode}
        shouldUseVirtualization={shouldUseVirtualization}
        commonProps={commonProps}
        getEditFunction={(item) => getEditFunction(item, sectionType)}
        getDeleteFunction={(item) => getDeleteFunction(item, sectionType)}
        getGlobalIndex={getGlobalIndex}
        keyboardNavigation={keyboardNavigation}
        allItems={allItems}
      />
    );
  };
};