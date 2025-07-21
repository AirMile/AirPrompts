import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';

/**
 * Sortable wrapper voor ListView items met drag & drop functionaliteit
 * @param {Object} props
 * @param {Object} props.item - Item data
 * @param {string} props.id - Unieke ID voor sortable
 * @param {boolean} props.disabled - Of dragging disabled is
 * @param {React.ReactNode} props.children - ListView item content
 * @param {string} props.className - Extra CSS classes
 */
const SortableListItem = ({ 
  item, 
  id, 
  disabled = false,
  children,
  className = ''
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
      className={`
        ${isDragging ? 'z-50 opacity-0' : ''}
        ${className}
      `}
    >
      {/* Pass drag functionality to children */}
      {React.cloneElement(children, {
        dragAttributes: attributes,
        dragListeners: listeners,
        isDragging
      })}
    </div>
  );
};

export default SortableListItem;