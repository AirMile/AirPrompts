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
        relative flex items-center
        ${isDragging ? 'z-50 opacity-70 bg-gray-700 rounded-lg shadow-2xl' : ''}
        ${className}
      `}
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className={`
          flex-shrink-0 mr-3 p-1 rounded
          text-gray-500 hover:text-gray-400 hover:bg-gray-700
          cursor-grab active:cursor-grabbing
          transition-colors
          ${disabled ? 'hidden' : ''}
        `}
        aria-label="Drag to reorder"
      >
        <GripVertical className="w-4 h-4" />
      </div>

      {/* List Item Content */}
      <div className="flex-1 min-w-0">
        {children}
      </div>
    </div>
  );
};

export default SortableListItem;