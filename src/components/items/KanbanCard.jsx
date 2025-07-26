import React, { memo } from 'react';
import { FileText, Workflow, Tag, Heart, Play, Edit2, Trash2, GripVertical } from 'lucide-react';
import { useItemColors } from '../../hooks/useItemColors';
import { useOptimizedCallbacks } from '../../hooks/useOptimizedCallbacks';

/**
 * KanbanCard component for kanban board view
 * Displays item as a draggable card
 */
export const KanbanCard = memo(({ 
  item, 
  onExecute, 
  onEdit, 
  onDelete, 
  onToggleFavorite,
  isDragging = false
}) => {
  const { getColorClasses } = useItemColors();
  const callbacks = useOptimizedCallbacks(item, {
    execute: onExecute,
    edit: onEdit,
    delete: onDelete,
    toggleFavorite: onToggleFavorite
  });

  const getIcon = () => {
    switch (item.type) {
      case 'template':
        return <FileText className="w-4 h-4" />;
      case 'workflow':
        return <Workflow className="w-4 h-4" />;
      case 'snippet':
        return <Tag className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getItemDetails = () => {
    switch (item.type) {
      case 'template':
        return `${item.variables?.length || 0} variables`;
      case 'workflow':
        return `${item.steps?.length || 0} steps`;
      case 'snippet':
        return `${item.tags?.length || 0} tags`;
      default:
        return '';
    }
  };

  return (
    <div 
      className={`
        ${getColorClasses(item.type, 'card')} 
        rounded-lg p-3 cursor-move transition-all duration-200
        ${isDragging ? 'opacity-50 shadow-xl' : 'shadow-sm hover:shadow-md'}
      `}
    >
      {/* Drag Handle & Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <GripVertical className="w-4 h-4 text-secondary-400" />
          <div className={`${getColorClasses(item.type, 'icon')}`}>
            {getIcon()}
          </div>
        </div>
        <button
          onClick={callbacks.handleToggleFavorite}
          className={`p-1 rounded transition-colors ${
            item.favorite 
              ? 'text-danger-500 hover:text-danger-600' 
              : 'text-secondary-400 hover:text-secondary-600'
          }`}
        >
          <Heart className="w-3 h-3" fill={item.favorite ? 'currentColor' : 'none'} />
        </button>
      </div>

      {/* Content */}
      <div className="space-y-1 mb-3">
        <h4 className="font-medium text-sm text-secondary-900 dark:text-secondary-100 line-clamp-2">
          {item.name}
        </h4>
        {item.description && (
          <p className="text-xs text-secondary-600 dark:text-secondary-400 line-clamp-2">
            {item.description}
          </p>
        )}
        <p className="text-xs text-secondary-500">
          {getItemDetails()}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        <button
          onClick={callbacks.handleExecute}
          className={`flex-1 px-2 py-1 ${getColorClasses(item.type, 'button')} rounded text-xs font-medium transition-all duration-200 flex items-center justify-center gap-1`}
        >
          <Play className="w-3 h-3" />
          Execute
        </button>
        <button
          onClick={callbacks.handleEdit}
          className="p-1 text-secondary-600 dark:text-secondary-400 hover:text-secondary-900 dark:hover:text-secondary-100 hover:bg-secondary-100 dark:hover:bg-secondary-700 rounded transition-colors"
        >
          <Edit2 className="w-3 h-3" />
        </button>
        <button
          onClick={callbacks.handleDelete}
          className="p-1 text-danger-500 hover:text-danger-700 hover:bg-danger-50 dark:hover:bg-danger-900/20 rounded transition-colors"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
});

KanbanCard.displayName = 'KanbanCard';

export default KanbanCard;