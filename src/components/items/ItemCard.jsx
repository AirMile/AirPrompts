import React, { memo } from 'react';
import { FileText, Workflow, Tag, Folder, Heart, Play, Edit2, Trash2 } from 'lucide-react';
import { useItemColors } from '../../hooks/useItemColors';
import { useOptimizedCallbacks } from '../../hooks/useOptimizedCallbacks';

/**
 * ItemCard component for grid view
 * Displays item in a card format with all actions
 */
export const ItemCard = memo(({ 
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
    <div className={`relative group h-full ${getColorClasses(item.type, 'card')} rounded-lg shadow-sm hover:shadow-md transition-all duration-200 p-4`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2 text-secondary-700 dark:text-secondary-300">
          {getIcon()}
          <span className="text-xs uppercase font-medium">{item.type}</span>
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

      {/* Content */}
      <div className="space-y-2 mb-4">
        <h3 className="font-medium text-secondary-900 dark:text-secondary-100 line-clamp-2">
          {item.name}
        </h3>
        {item.description && (
          <p className="text-sm text-secondary-600 dark:text-secondary-400 line-clamp-2">
            {item.description}
          </p>
        )}
        <div className="flex items-center gap-2 text-xs text-secondary-500 dark:text-secondary-500">
          <Folder className="w-3 h-3" />
          {item.folderIds?.map(folderId => getFolderName(folderId)).join(', ') || 'Uncategorized'}
        </div>
        <p className="text-xs text-secondary-500 dark:text-secondary-500">
          {getItemDetails()}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 mt-auto">
        <button
          onClick={callbacks.handleExecute}
          className={`flex-1 px-3 py-2 ${getColorClasses(item.type, 'button')} rounded text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2`}
        >
          <Play className="w-4 h-4" />
          Execute
        </button>
        <button
          onClick={callbacks.handleEdit}
          className="p-2 text-secondary-600 dark:text-secondary-400 hover:text-secondary-900 dark:hover:text-secondary-100 hover:bg-secondary-100 dark:hover:bg-secondary-700 rounded transition-colors"
        >
          <Edit2 className="w-4 h-4" />
        </button>
        <button
          onClick={callbacks.handleDelete}
          className="p-2 text-danger-500 hover:text-danger-700 hover:bg-danger-50 dark:hover:bg-danger-900/20 rounded transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
});

ItemCard.displayName = 'ItemCard';

export default ItemCard;