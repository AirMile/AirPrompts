import React, { memo } from 'react';
import { FileText, Workflow, Tag, Folder, Heart, Play, Edit2, Trash2 } from 'lucide-react';
import { useItemColors } from '../../hooks/useItemColors';
import { useOptimizedCallbacks } from '../../hooks/useOptimizedCallbacks';

/**
 * ItemListRow component for list view
 * Displays item in a horizontal row format
 */
export const ItemListRow = memo(({ 
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
    <div className={`group flex items-center gap-4 p-4 ${getColorClasses(item.type, 'card')} rounded-lg hover:shadow-md transition-all duration-200`}>
      {/* Icon */}
      <div className={`flex-shrink-0 p-2 ${getColorClasses(item.type, 'icon')} rounded-lg`}>
        {getIcon()}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-secondary-900 dark:text-secondary-100 truncate">
              {item.name}
            </h3>
            {item.description && (
              <p className="text-sm text-secondary-600 dark:text-secondary-400 truncate">
                {item.description}
              </p>
            )}
            <div className="flex items-center gap-4 mt-1 text-xs text-secondary-500 dark:text-secondary-500">
              <span className="flex items-center gap-1">
                <Folder className="w-3 h-3" />
                {item.folderIds?.map(folderId => getFolderName(folderId)).join(', ') || 'Uncategorized'}
              </span>
              <span>{getItemDetails()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={callbacks.handleToggleFavorite}
          className={`p-2 rounded transition-colors ${
            item.favorite 
              ? 'text-danger-500 hover:text-danger-600' 
              : 'text-secondary-400 hover:text-secondary-600 dark:hover:text-secondary-300'
          }`}
        >
          <Heart className="w-4 h-4" fill={item.favorite ? 'currentColor' : 'none'} />
        </button>
        <button
          onClick={callbacks.handleExecute}
          className={`px-3 py-2 ${getColorClasses(item.type, 'button')} rounded text-sm font-medium transition-all duration-200 flex items-center gap-2`}
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

ItemListRow.displayName = 'ItemListRow';

export default ItemListRow;