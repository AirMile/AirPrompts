import React, { memo } from 'react';
import { FileText, Workflow, Tag, Heart, Play, MoreVertical } from 'lucide-react';
import { useItemColors } from '../../hooks/useItemColors';
import { useOptimizedCallbacks } from '../../hooks/useOptimizedCallbacks';

/**
 * ItemCompactRow component for compact view
 * Displays item in a minimal row format
 */
export const ItemCompactRow = memo(({ 
  item, 
  onExecute, 
  onEdit, 
  onDelete, 
  onToggleFavorite
}) => {
  const { getColorClasses } = useItemColors();
  const callbacks = useOptimizedCallbacks(item, {
    execute: onExecute,
    edit: onEdit,
    delete: onDelete,
    toggleFavorite: onToggleFavorite
  });

  const getIcon = () => {
    const iconClass = `w-4 h-4 ${getColorClasses(item.type, 'icon')}`;
    switch (item.type) {
      case 'template':
        return <FileText className={iconClass} />;
      case 'workflow':
        return <Workflow className={iconClass} />;
      case 'snippet':
        return <Tag className={iconClass} />;
      default:
        return <FileText className={iconClass} />;
    }
  };

  const [showMenu, setShowMenu] = React.useState(false);

  return (
    <div className={`group flex items-center gap-3 px-4 py-2 hover:bg-secondary-50 dark:hover:bg-secondary-800 transition-colors`}>
      {/* Icon & Name */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {getIcon()}
        <span className="text-sm font-medium text-secondary-900 dark:text-secondary-100 truncate">
          {item.name}
        </span>
      </div>

      {/* Quick Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
        <button
          onClick={callbacks.handleExecute}
          className={`p-1 rounded transition-colors ${getColorClasses(item.type, 'icon')} hover:bg-secondary-100 dark:hover:bg-secondary-700`}
        >
          <Play className="w-3 h-3" />
        </button>
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1 text-secondary-400 hover:text-secondary-600 dark:hover:text-secondary-300 rounded transition-colors"
          >
            <MoreVertical className="w-3 h-3" />
          </button>
          {showMenu && (
            <div className="absolute right-0 mt-1 w-32 bg-white dark:bg-secondary-800 rounded-lg shadow-lg border border-secondary-200 dark:border-secondary-700 z-10">
              <button
                onClick={() => {
                  callbacks.handleEdit();
                  setShowMenu(false);
                }}
                className="w-full px-3 py-2 text-left text-sm hover:bg-secondary-50 dark:hover:bg-secondary-700 transition-colors"
              >
                Edit
              </button>
              <button
                onClick={() => {
                  callbacks.handleDelete();
                  setShowMenu(false);
                }}
                className="w-full px-3 py-2 text-left text-sm text-danger-600 hover:bg-danger-50 dark:hover:bg-danger-900/20 transition-colors"
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

ItemCompactRow.displayName = 'ItemCompactRow';

export default ItemCompactRow;