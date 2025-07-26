import React, { memo } from 'react';
import { Star, MoreVertical, Copy, Edit, Trash2, Play } from 'lucide-react';
import { useEntityTheme } from '@/hooks/base/useEntityTheme';

/**
 * Base Card Component - Reusable card for all entity types
 * 
 * Features:
 * - Entity-specific theming
 * - Consistent actions (favorite, edit, delete, execute)
 * - Hover effects and animations
 * - Memoized for performance
 * 
 * @param {Object} props
 * @param {Object} props.item - The entity to display
 * @param {string} props.entityType - Type of entity
 * @param {Function} props.onExecute - Execute handler
 * @param {Function} props.onEdit - Edit handler
 * @param {Function} props.onDelete - Delete handler
 * @param {Function} props.onToggleFavorite - Favorite toggle handler
 * @param {boolean} props.isSelected - Selection state
 * @param {ReactNode} props.customContent - Custom content to render
 */
export const BaseCard = memo(({ 
  item,
  entityType,
  onExecute,
  onEdit,
  onDelete,
  onToggleFavorite,
  onCopy,
  isSelected = false,
  customContent,
  className = ''
}) => {
  const { getColorClasses } = useEntityTheme(entityType);
  const colorClasses = getColorClasses('card');
  const buttonClasses = getColorClasses('button');
  const badgeClasses = getColorClasses('badge');

  const [showMenu, setShowMenu] = React.useState(false);

  const handleAction = (action, e) => {
    e.stopPropagation();
    action();
    setShowMenu(false);
  };

  return (
    <div 
      className={`
        relative group
        ${colorClasses.container}
        ${colorClasses.hover}
        ${isSelected ? colorClasses.selected : ''}
        rounded-lg p-4
        transition-all duration-200
        cursor-pointer
        ${className}
      `}
      onClick={() => onExecute && onExecute()}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-secondary-900 dark:text-secondary-100 truncate">
            {item.name}
          </h3>
          {item.category && (
            <span className={`inline-block mt-1 px-2 py-0.5 text-xs rounded ${badgeClasses}`}>
              {item.category}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-1 ml-2">
          {/* Favorite Button */}
          <button
            onClick={(e) => handleAction(onToggleFavorite, e)}
            className={`p-1.5 rounded transition-colors ${
              item.favorite 
                ? 'text-yellow-500 hover:text-yellow-600' 
                : 'text-secondary-400 hover:text-secondary-600'
            }`}
            title={item.favorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Star className={`w-4 h-4 ${item.favorite ? 'fill-current' : ''}`} />
          </button>
          
          {/* Menu Button */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className="p-1.5 text-secondary-400 hover:text-secondary-600 rounded transition-colors"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
            
            {/* Dropdown Menu */}
            {showMenu && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(false);
                  }}
                />
                <div className="absolute right-0 top-8 z-20 w-48 bg-white dark:bg-secondary-800 rounded-lg shadow-lg border border-secondary-200 dark:border-secondary-700 py-1">
                  {onExecute && (
                    <button
                      onClick={(e) => handleAction(onExecute, e)}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-secondary-100 dark:hover:bg-secondary-700 flex items-center gap-2"
                    >
                      <Play className="w-4 h-4" />
                      Execute
                    </button>
                  )}
                  
                  {onCopy && (
                    <button
                      onClick={(e) => handleAction(onCopy, e)}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-secondary-100 dark:hover:bg-secondary-700 flex items-center gap-2"
                    >
                      <Copy className="w-4 h-4" />
                      Copy
                    </button>
                  )}
                  
                  {onEdit && (
                    <button
                      onClick={(e) => handleAction(onEdit, e)}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-secondary-100 dark:hover:bg-secondary-700 flex items-center gap-2"
                    >
                      <Edit className="w-4 h-4" />
                      Edit
                    </button>
                  )}
                  
                  {onDelete && (
                    <>
                      <div className="border-t border-secondary-200 dark:border-secondary-700 my-1" />
                      <button
                        onClick={(e) => handleAction(onDelete, e)}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 flex items-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      
      {/* Description */}
      {item.description && (
        <p className="text-sm text-secondary-600 dark:text-secondary-400 line-clamp-2 mb-3">
          {item.description}
        </p>
      )}
      
      {/* Custom Content */}
      {customContent}
      
      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-secondary-500 dark:text-secondary-400">
        <div className="flex items-center gap-3">
          {item.tags && item.tags.length > 0 && (
            <span>
              {item.tags.length} tag{item.tags.length !== 1 ? 's' : ''}
            </span>
          )}
          {item.variables && item.variables.length > 0 && (
            <span>
              {item.variables.length} var{item.variables.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        
        {item.updatedAt && (
          <time dateTime={item.updatedAt} title={new Date(item.updatedAt).toLocaleString()}>
            {formatRelativeTime(item.updatedAt)}
          </time>
        )}
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for memo
  return (
    prevProps.item === nextProps.item &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.onExecute === nextProps.onExecute &&
    prevProps.onEdit === nextProps.onEdit &&
    prevProps.onDelete === nextProps.onDelete &&
    prevProps.onToggleFavorite === nextProps.onToggleFavorite &&
    prevProps.onCopy === nextProps.onCopy
  );
});

BaseCard.displayName = 'BaseCard';

// Helper function to format relative time
function formatRelativeTime(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now - date;
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  
  return date.toLocaleDateString();
}

export default BaseCard;