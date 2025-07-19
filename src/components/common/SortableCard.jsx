import React from 'react';
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
const SortableCard = ({ 
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
      className={`relative ${isDragging ? 'z-50' : ''}`}
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className={`
          absolute top-2 right-2 z-10 p-1 rounded
          bg-gray-700 hover:bg-gray-600 
          text-gray-400 hover:text-gray-300
          cursor-grab active:cursor-grabbing
          transition-colors
          ${isDragging ? 'opacity-50' : ''}
          ${disabled ? 'hidden' : ''}
        `}
        aria-label="Drag to reorder"
      >
        <GripVertical className="w-4 h-4" />
      </div>

      {/* FocusableCard */}
      <div className={`${isDragging ? 'opacity-70 rotate-1 shadow-2xl' : ''} transition-all duration-200`}>
        <FocusableCard
          item={item}
          {...cardProps}
        />
      </div>
    </div>
  );
};

export default SortableCard;