import React, { memo } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import FocusableCard from './FocusableCard';

/**
 * Sortable wrapper voor FocusableCard met drag & drop functionaliteit
 * @param {Object} props - Props voor FocusableCard plus sortable specifieke props
 * @param {Object} props.item - Item data
 * @param {string} props.id - Unieke ID voor sortable
 * @param {boolean} props.disabled - Of dragging disabled is
 * @param {...Object} cardProps - Alle andere props worden doorgegeven aan FocusableCard
 */
const SortableCard = memo(({ 
  item, 
  id, 
  disabled = false,
  ...cardProps 
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id, 
    disabled 
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${isDragging ? 'z-50' : ''}`}
    >
      {/* FocusableCard met drag functionaliteit */}
      <FocusableCard
        item={item}
        dragAttributes={attributes}
        dragListeners={listeners}
        isDragging={isDragging}
        {...cardProps}
      />
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for performance optimization
  // Only re-render if item or dragging state changes
  return (
    prevProps.item === nextProps.item &&
    prevProps.id === nextProps.id &&
    prevProps.disabled === nextProps.disabled &&
    // Compare key cardProps that might affect rendering
    prevProps.onExecute === nextProps.onExecute &&
    prevProps.onEdit === nextProps.onEdit &&
    prevProps.onDelete === nextProps.onDelete &&
    prevProps.onToggleFavorite === nextProps.onToggleFavorite
  );
});

SortableCard.displayName = 'SortableCard';

export default SortableCard;