import React, { memo } from 'react';
import { FileText, Workflow, Tag, Heart, Play, Edit2, Trash2, Clock } from 'lucide-react';
import { useItemColors } from '../../hooks/useItemColors';
import { useOptimizedCallbacks } from '../../hooks/useOptimizedCallbacks';
import { formatDate } from '../../utils/helpers';

/**
 * TimelineItem component for timeline view
 * Displays item with time-based information
 */
export const TimelineItem = memo(({ 
  item, 
  onExecute, 
  onEdit, 
  onDelete, 
  onToggleFavorite,
  folders = []
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
        return <FileText className="w-5 h-5" />;
      case 'workflow':
        return <Workflow className="w-5 h-5" />;
      case 'snippet':
        return <Tag className="w-5 h-5" />;
      default:
        return <FileText className="w-5 h-5" />;
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

  const getFolderName = (folderId) => {
    const folder = folders.find(f => f.id === folderId);
    return folder?.name || folderId;
  };

  return (
    <div className="relative flex gap-4">
      {/* Timeline Line & Dot */}
      <div className="flex flex-col items-center">
        <div className={`w-4 h-4 rounded-full ${getColorClasses(item.type, 'background')} border-4 border-white dark:border-secondary-800 z-10`} />
        <div className="w-0.5 flex-1 bg-secondary-200 dark:bg-secondary-700" />
      </div>

      {/* Content */}
      <div className={`flex-1 ${getColorClasses(item.type, 'card')} rounded-lg p-4 mb-4`}>
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={`p-2 ${getColorClasses(item.type, 'icon')} rounded-lg`}>
              {getIcon()}
            </div>
            <div>
              <h3 className="font-medium text-secondary-900 dark:text-secondary-100">
                {item.name}
              </h3>
              <div className="flex items-center gap-2 text-xs text-secondary-500 dark:text-secondary-500">
                <Clock className="w-3 h-3" />
                <span>{formatDate(item.updatedAt || item.createdAt)}</span>
                <span>•</span>
                <span className="uppercase">{item.type}</span>
              </div>
            </div>
          </div>
          <button
            onClick={callbacks.handleToggleFavorite}
            className={`p-1 rounded transition-colors ${
              item.favorite 
                ? 'text-danger-500 hover:text-danger-600' 
                : 'text-secondary-400 hover:text-secondary-600 dark:hover:text-secondary-300'
            }`}
          >
            <Heart className="w-4 h-4" fill={item.favorite ? 'currentColor' : 'none'} />
          </button>
        </div>

        {/* Description */}
        {item.description && (
          <p className="text-sm text-secondary-600 dark:text-secondary-400 mb-3">
            {item.description}
          </p>
        )}

        {/* Metadata */}
        <div className="flex items-center gap-4 mb-3 text-xs text-secondary-500 dark:text-secondary-500">
          <span>{item.folderIds?.map(folderId => getFolderName(folderId)).join(', ') || 'Uncategorized'}</span>
          <span>{getItemDetails()}</span>
          {item.lastUsed && (
            <span>Last used: {formatDate(item.lastUsed)}</span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={callbacks.handleExecute}
            className={`px-3 py-2 ${getColorClasses(item.type, 'button')} rounded text-sm font-medium transition-all duration-200 flex items-center gap-2`}
          >
            <Play className="w-4 h-4" />
            Execute
          </button>
          <button
            onClick={callbacks.handleEdit}
            className="px-3 py-2 text-secondary-600 dark:text-secondary-400 hover:text-secondary-900 dark:hover:text-secondary-100 hover:bg-secondary-100 dark:hover:bg-secondary-700 rounded text-sm transition-colors"
          >
            <Edit2 className="w-4 h-4" />
            Edit
          </button>
          <button
            onClick={callbacks.handleDelete}
            className="px-3 py-2 text-danger-500 hover:text-danger-700 hover:bg-danger-50 dark:hover:bg-danger-900/20 rounded text-sm transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      </div>
    </div>
  );
});

TimelineItem.displayName = 'TimelineItem';

export default TimelineItem;