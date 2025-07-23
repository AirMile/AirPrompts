import React from 'react';
import { Play, Edit, Trash2, Star, GripVertical, Workflow, FileText, Tag } from 'lucide-react';
import { useItemColors } from '../../hooks/useItemColors.js';

const ListView = ({ 
  items = [],
  type = 'template',
  sectionType,
  onExecute = () => {},
  onEdit = () => {},
  onDelete = () => {},
  onToggleFavorite = () => {},
  isItemFavorite = () => false,
  keyboardNavigation = {},
  dragAttributes,
  dragListeners,
  isDragging = false,
  hideDragHandle = false
}) => {
  const { getColorClasses } = useItemColors();

  // Check if classic dark theme is active
  const isClassicDark = () => {
    return document.documentElement.classList.contains('theme-classic-dark');
  };

  const normalizeType = (itemType) => {
    switch (itemType) {
      case 'workflows':
      case 'workflow':
        return 'workflow';
      case 'templates':
      case 'template':
        return 'template';
      case 'snippets':
      case 'snippet':
        return 'snippet';
      default:
        return itemType;
    }
  };

  const getKeyboardFocusColor = (itemType) => {
    const normalizedType = normalizeType(itemType);
    return getColorClasses(normalizedType, 'border');
  };

  const getItemDetail = (item, itemType) => {
    switch (itemType) {
      case 'workflow':
        return `${item.steps?.length || 0} steps`;
      case 'template':
        return `${item.variables?.length || 0} variables`;
      case 'snippet':
        return item.tags?.length ? `${item.tags.length} tags` : 'No tags';
      default:
        return '';
    }
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-secondary-500 dark:text-secondary-400 text-lg">No items to display</div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((item, index) => {
        const focusProps = keyboardNavigation.getFocusProps ? keyboardNavigation.getFocusProps(index, sectionType || type) : {};
        const isKeyboardFocused = focusProps['data-keyboard-focused'];

        // Handle Enter key to execute the item when focused
        const handleKeyDown = (e) => {
          if (isKeyboardFocused && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            onExecute({ item, type: item.type || type });
          }
        };

        const actualItemType = item.type || type;
        
        
        return (
          <div
            key={item.id}
            data-focusable-card="true"
            data-card-type={type}
            data-card-index={index}
            data-card-name={item.name}
            className={(() => {
              // When keyboard focused, don't include the default border color to avoid conflicts
              const baseBorderClass = isKeyboardFocused ? '' : 
                (isClassicDark() ? 'border-secondary-700' : 'border-secondary-300 dark:border-secondary-700');
              const baseBackground = isClassicDark() ? 'bg-secondary-800' : 'bg-white dark:bg-secondary-800';
              const baseClasses = `relative ${baseBackground} rounded-lg border ${baseBorderClass} p-4 cursor-pointer hover:shadow-lg transition-all duration-200 focus:outline-none`;
              const hoverBorder = getColorClasses(actualItemType, 'hover');
              const focusBorder = isKeyboardFocused ? getKeyboardFocusColor(actualItemType) : '';
              
              const finalClasses = `${baseClasses} ${hoverBorder} ${focusBorder}`;
              
              
              return finalClasses;
            })()}
            onClick={() => onExecute({ item, type: item.type || type })}
            onKeyDown={handleKeyDown}
            {...focusProps}
          >
            
            <div className="flex items-center gap-4">

              {/* Drag Handle - where favorite button used to be */}
              {!hideDragHandle && (
                <div className="flex-shrink-0">
                  <div 
                    className="drag-handle group cursor-grab active:cursor-grabbing -m-3 p-4 opacity-60 hover:opacity-100 rounded transition-all duration-200"
                    {...dragAttributes}
                    {...dragListeners}
                  >
                    <GripVertical className={`w-5 h-5 group-hover:scale-105 transition-transform ${isClassicDark() ? 'text-secondary-500 group-hover:text-secondary-200' : 'text-secondary-500 dark:text-secondary-500 group-hover:text-secondary-700 dark:group-hover:text-secondary-200'}`} />
                  </div>
                </div>
              )}

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className={`font-semibold truncate ${isClassicDark() ? 'text-secondary-100' : 'text-secondary-900 dark:text-secondary-100'}`}>
                    {item.name}
                  </h3>
                </div>

                <p className={`text-sm mb-3 line-clamp-2 ${isClassicDark() ? 'text-secondary-300' : 'text-secondary-600 dark:text-secondary-300'}`}>
                  {item.description || 'No description'}
                </p>

              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {/* Favorite Button */}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onToggleFavorite(item);
                    e.currentTarget.blur(); // Remove focus after click
                  }}
                  className="
                    p-2.5 text-secondary-500 dark:text-secondary-400 bg-secondary-100 dark:bg-secondary-700 border border-secondary-300 dark:border-secondary-600 rounded-md
                    hover:bg-secondary-200 dark:hover:bg-secondary-600 hover:border-secondary-400 dark:hover:border-secondary-500 flex items-center justify-center
                    focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-opacity-50
                    transition-all duration-200 hover:shadow-md
                  "
                  aria-label={`${isItemFavorite(item) ? 'Remove from' : 'Add to'} favorites`}
                  title={isItemFavorite(item) ? 'Remove from favorites' : 'Add to favorites'}
                >
                  <Star className={`w-4 h-4 text-secondary-500 dark:text-secondary-400 ${isItemFavorite(item) ? 'fill-current' : ''}`} />
                </button>
                
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onEdit(item);
                  }}
                  className="
                    p-2.5 text-secondary-500 dark:text-secondary-400 bg-secondary-100 dark:bg-secondary-700 border border-secondary-300 dark:border-secondary-600 rounded-md
                    hover:bg-secondary-200 dark:hover:bg-secondary-600 hover:border-secondary-400 dark:hover:border-secondary-500 flex items-center justify-center
                    focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-opacity-50
                    transition-all duration-200 hover:shadow-md
                  "
                  title="Edit"
                >
                  <Edit className="w-4 h-4" />
                </button>

                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onDelete(item.id);
                  }}
                  className="
                    p-2.5 text-secondary-500 dark:text-secondary-400 bg-secondary-100 dark:bg-secondary-700 border border-secondary-300 dark:border-secondary-600 rounded-md
                    hover:bg-secondary-200 dark:hover:bg-secondary-600 hover:border-secondary-400 dark:hover:border-secondary-500 flex items-center justify-center
                    focus:outline-none focus:ring-2 focus:ring-secondary-400 focus:ring-opacity-50
                    transition-all duration-200 hover:shadow-md
                  "
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ListView;