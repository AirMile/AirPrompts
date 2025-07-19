import React from 'react';
import { Play, Edit, Trash2, Star, GripVertical, Workflow, FileText, Tag } from 'lucide-react';

const ListView = ({ 
  items = [],
  type = 'template',
  sectionType,
  onExecute = () => {},
  onEdit = () => {},
  onDelete = () => {},
  onToggleFavorite = () => {},
  isItemFavorite = () => false,
  keyboardNavigation = {}
}) => {
  const getTypeIcon = (itemType) => {
    switch (itemType) {
      case 'workflow':
        return <Workflow className="w-4 h-4 text-gray-300" />;
      case 'template':
        return <FileText className="w-4 h-4 text-gray-300" />;
      case 'snippet':
        return <Tag className="w-4 h-4 text-gray-300" />;
      default:
        return <FileText className="w-4 h-4 text-gray-300" />;
    }
  };

  const getTypeColor = (itemType) => {
    switch (itemType) {
      case 'workflow':
        return 'bg-green-600 hover:bg-green-700';
      case 'template':
        return 'bg-blue-600 hover:bg-blue-700';
      case 'snippet':
        return 'bg-purple-600 hover:bg-purple-700';
      default:
        return 'bg-blue-600 hover:bg-blue-700';
    }
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

  const getHoverBorderColor = (itemType) => {
    const normalizedType = normalizeType(itemType);
    
    switch (normalizedType) {
      case 'workflow':
        return 'hover:border-green-500 hover:border';
      case 'template':
        return 'hover:border-blue-400 hover:border';
      case 'snippet':
        return 'hover:border-purple-500 hover:border';
      default:
        return 'hover:border-blue-400 hover:border';
    }
  };

  const getKeyboardFocusColor = (itemType) => {
    const normalizedType = normalizeType(itemType);
    
    switch (normalizedType) {
      case 'workflow':
        return 'border-green-500 border';
      case 'template':
        return 'border-blue-400 border';
      case 'snippet':
        return 'border-purple-500 border';
      default:
        return 'border-blue-400 border';
    }
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
        <div className="text-gray-400 text-lg">No items to display</div>
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
              const baseBorderClass = isKeyboardFocused ? '' : 'border-gray-700';
              const baseClasses = `relative bg-gray-800 rounded-lg border ${baseBorderClass} p-4 cursor-pointer hover:shadow-lg transition-all duration-200`;
              const hoverBorder = getHoverBorderColor(actualItemType);
              const focusBorder = isKeyboardFocused ? getKeyboardFocusColor(actualItemType) : '';
              
              const finalClasses = `${baseClasses} ${hoverBorder} ${focusBorder}`;
              
              
              return finalClasses;
            })()}
            onClick={() => onExecute({ item, type: item.type || type })}
            onKeyDown={handleKeyDown}
            {...focusProps}
          >
            
            <div className="flex items-center gap-4">

              {/* Favorite Button */}
              <div className="flex-shrink-0">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFavorite(item);
                  }}
                  className={`
                    p-1 rounded-full transition-colors
                    ${isItemFavorite(item) 
                      ? 'text-yellow-400 hover:text-yellow-300' 
                      : 'text-gray-500 hover:text-gray-400'
                    }
                  `}
                  aria-label={`${isItemFavorite(item) ? 'Remove from' : 'Add to'} favorites`}
                >
                  <Star className={`w-5 h-5 ${isItemFavorite(item) ? 'fill-current' : ''}`} />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-semibold text-gray-100 truncate">
                    {item.name}
                  </h3>
                  {item.favorite && (
                    <Star className="w-4 h-4 text-yellow-300 fill-current flex-shrink-0" />
                  )}
                </div>

                <p className="text-sm text-gray-300 mb-3 line-clamp-2">
                  {item.description || 'No description'}
                </p>

              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onExecute({ item, type: item.type || type });
                  }}
                  className={`
                    px-4 py-2 text-white rounded-md text-sm font-medium
                    flex items-center gap-2 ${getTypeColor(item.type || type)}
                    focus:outline-none focus:ring-2 focus:ring-opacity-50
                  `}
                >
                  <Play className="w-4 h-4" />
                  Execute
                </button>

                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onEdit(item);
                  }}
                  className="
                    px-3 py-2 text-gray-300 border border-gray-600 rounded-md
                    hover:bg-gray-700 flex items-center justify-center
                    focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50
                  "
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
                    px-3 py-2 text-red-400 border border-red-600 rounded-md
                    hover:bg-red-900 flex items-center justify-center
                    focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-opacity-50
                  "
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