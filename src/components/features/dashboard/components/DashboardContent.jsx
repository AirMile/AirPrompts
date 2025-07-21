import React, { memo } from 'react';
import DashboardSection from './DashboardSection.jsx';

const DashboardContent = memo(function DashboardContent({
  sections,
  selectedFolderId,
  onEdit,
  sensors,
  dragDropHandlers,
  visibilityStates,
  renderItems,
  handleFavoriteToggle
}) {
  return (
    <div className="dashboard-content">
      {/* Dynamic Sections */}
      {sections.map((section, index) => {
        const { type } = section;
        const dragDrop = dragDropHandlers[`${type}DragDrop`];
        const visibility = visibilityStates[`${type}Visibility`];
        
        return (
          <DashboardSection
            key={type}
            section={section}
            selectedFolderId={selectedFolderId}
            onEdit={onEdit}
            sensors={sensors}
            dragDrop={dragDrop}
            visibility={visibility}
            renderItems={renderItems}
            handleFavoriteToggle={handleFavoriteToggle}
            isLast={index === sections.length - 1}
          />
        );
      })}
    </div>
  );
});

export default DashboardContent;