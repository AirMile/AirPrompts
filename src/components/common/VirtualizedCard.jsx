import React, { memo } from 'react';
import Card from '../shared/ui/Card.jsx';

/**
 * Virtualized wrapper voor Card component
 * Geoptimaliseerd voor gebruik met react-window
 */
const VirtualizedCard = memo(function VirtualizedCard({
  item,
  style,
  sectionType,
  onToggleFavorite,
  isItemFavorite,
  onExecute,
  onEdit,
  onDelete,
  showQuickActions = true,
  showDescription = true,
  keyboardNavigation,
  ...cardProps
}) {
  // Haal type op van item of section
  const itemType =
    item.type ||
    (sectionType === 'workflows'
      ? 'workflow'
      : sectionType === 'snippets'
        ? 'snippet'
        : 'template');

  return (
    <div
      style={style}
      className="p-2" // Padding voor grid spacing
    >
      <Card
        item={item}
        type={itemType}
        onToggleFavorite={() => onToggleFavorite?.(item)}
        isFavorite={isItemFavorite?.(item)}
        onExecute={() => onExecute?.({ item, type: itemType })}
        onEdit={() => onEdit?.(item)}
        onDelete={() => onDelete?.(item)}
        showQuickActions={showQuickActions}
        showDescription={showDescription}
        keyboardNavigation={keyboardNavigation}
        {...cardProps}
      />
    </div>
  );
});

export default VirtualizedCard;
