import React, { memo } from 'react';
import { Plus } from 'lucide-react';
import { DndContext, DragOverlay, closestCenter } from '@dnd-kit/core';
import CollapsibleSection from '../../../common/CollapsibleSection.jsx';
import DragCard from '../../../common/DragCard.jsx';
import Pagination from '../../../common/Pagination.jsx';
import { isItemFavoriteInFolder } from '../../../../types/template.types.js';

const DashboardSection = memo(function DashboardSection({
  section,
  selectedFolderId,
  onEdit,
  sensors,
  dragDrop,
  visibility,
  renderItems,
  handleFavoriteToggle,
  isLast = false
}) {
  const { type, data, pagination, fullData } = section;

  // Helper to get appropriate onEdit function
  const getEditHandler = () => {
    switch (type) {
      case 'workflows':
        return onEdit.onEditWorkflow;
      case 'templates':
        return onEdit.onEditTemplate;
      case 'snippets':
        return onEdit.onEditSnippet;
      default:
        return () => {};
    }
  };

  // Helper to get section title
  const getSectionTitle = () => {
    switch (type) {
      case 'favorites':
        return 'Favorites';
      case 'workflows':
        return 'Workflows';
      case 'templates':
        return 'Templates';
      case 'snippets':
        return 'Snippets';
      default:
        return type.charAt(0).toUpperCase() + type.slice(1);
    }
  };

  // Helper to get action button for sections that need it
  const getActionButton = () => {
    if (type === 'favorites') return null;
    
    const editHandler = getEditHandler();
    
    // Define complete button classes for each type to work with Tailwind purging
    const buttonClasses = {
      workflows: `
        p-3 bg-success-600 text-white rounded-lg font-semibold
        flex items-center justify-center
        hover:bg-success-700 hover:shadow-lg hover:scale-105
        focus:outline-none focus:ring-2 focus:ring-success-400 focus:ring-opacity-50
        transition-all duration-200 ease-in-out
        border border-success-500 hover:border-success-400
      `,
      templates: `
        p-3 bg-primary-600 text-white rounded-lg font-semibold
        flex items-center justify-center
        hover:bg-primary-700 hover:shadow-lg hover:scale-105
        focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-opacity-50
        transition-all duration-200 ease-in-out
        border border-primary-500 hover:border-primary-400
      `,
      snippets: `
        p-3 bg-purple-600 text-white rounded-lg font-semibold
        flex items-center justify-center
        hover:bg-purple-700 hover:shadow-lg hover:scale-105
        focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-opacity-50
        transition-all duration-200 ease-in-out
        border border-purple-500 hover:border-purple-400
      `
    };
    
    const className = buttonClasses[type] || buttonClasses.templates;
    
    return (
      <button
        onClick={() => editHandler({})}
        className={className}
        title={`New ${getSectionTitle().slice(0, -1)}`}
      >
        <Plus className="w-5 h-5" />
      </button>
    );
  };

  // Don't render favorites section if empty
  if (type === 'favorites' && data.length === 0) {
    return null;
  }

  return (
    <CollapsibleSection
      key={type}
      sectionId={type}
      title={getSectionTitle()}
      itemCount={fullData ? fullData.length : data.length}
      className="mb-6"
      externalVisible={visibility.isVisible}
      actionButton={getActionButton()}
      onVisibilityChange={(isVisible) => {
        visibility.setVisible(isVisible);
      }}
    >
      <DndContext 
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={dragDrop.handleDragStart}
        onDragEnd={dragDrop.handleDragEnd}
        onDragCancel={dragDrop.handleDragCancel}
      >
        {renderItems(data, type)}
        <DragOverlay>
          {dragDrop.dragOverlay ? (
            <DragCard
              key={dragDrop.dragOverlay.id}
              item={dragDrop.dragOverlay}
              index={0}
              type={dragDrop.dragOverlay.type || type.slice(0, -1)} // Remove 's' from plural
              sectionType={type}
              onExecute={({ item, type }) => {}}
              onEdit={() => {}}
              onDelete={() => {}}
              onToggleFavorite={(item) => handleFavoriteToggle(item, type)}
              isItemFavorite={(item) => isItemFavoriteInFolder(item, selectedFolderId)}
              keyboardNavigation={{}}
            />
          ) : null}
        </DragOverlay>
      </DndContext>
      {pagination && (
        <div>
          <Pagination 
            paginationHook={pagination}
            showInfo={true}
            showPageSizeSelector={true}
            variant="default"
          />
        </div>
      )}
    </CollapsibleSection>
  );
});

export default DashboardSection;