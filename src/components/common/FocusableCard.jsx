import React from 'react';
import { Play, Edit, Trash2, Star, GripVertical, Workflow, FileText, Tag } from 'lucide-react';
import { useItemColors } from '../../hooks/useItemColors.js';

const FocusableCard = ({ 
  item,
  type = 'template',
  sectionType,
  index,
  onExecute = () => {},
  onEdit = () => {},
  onDelete = () => {},
  onToggleFavorite = () => {},
  isItemFavorite = () => false,
  keyboardNavigation = {}
}) => {
  const { getColorClasses } = useItemColors();

  // Check if classic dark theme is active
  const isClassicDark = () => {
    return document.documentElement.classList.contains('theme-classic-dark');
  };

  const getTypeColor = (itemType) => {
    const normalizedType = normalizeType(itemType);
    return getColorClasses(normalizedType, 'button');
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
    return `hover:border-2 ${getColorClasses(normalizedType, 'border').replace('border-', 'hover:border-')}`;
  };

  const getKeyboardFocusColor = (itemType) => {
    const normalizedType = normalizeType(itemType);
    const borderColor = getColorClasses(normalizedType, 'border');
    const bgColor = getColorClasses(normalizedType, 'background');
    return `${borderColor} border-2 ring-2 ring-opacity-50 ${bgColor}`;
  };

  const getTypeIcon = (itemType) => {
    const normalizedType = normalizeType(itemType);
    
    switch (normalizedType) {
      case 'workflow':
        return <Workflow className={`w-5 h-5 ${isClassicDark() ? 'text-secondary-400' : 'text-secondary-600 dark:text-secondary-400'}`} />;
      case 'template':
        return <FileText className={`w-5 h-5 ${isClassicDark() ? 'text-secondary-400' : 'text-secondary-600 dark:text-secondary-400'}`} />;
      case 'snippet':
        return <Tag className={`w-5 h-5 ${isClassicDark() ? 'text-secondary-400' : 'text-secondary-600 dark:text-secondary-400'}`} />;
      default:
        return <FileText className={`w-5 h-5 ${isClassicDark() ? 'text-secondary-400' : 'text-secondary-600 dark:text-secondary-400'}`} />;
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

  const focusProps = keyboardNavigation.getFocusProps ? keyboardNavigation.getFocusProps() : {};
  const isKeyboardFocused = focusProps['data-keyboard-focused'];
  const keyboardHelpText = keyboardNavigation.getKeyboardHelpText ? keyboardNavigation.getKeyboardHelpText() : {};
  




  // Handle Enter key to execute the item when focused
  const handleKeyDown = (e) => {
    if (isKeyboardFocused && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onExecute({ item, type: item.type || type });
    }
  };

  return (
    <>
      {/* Hidden keyboard help text for screen readers */}
      {Object.entries(keyboardHelpText).map(([id, text]) => (
        <div key={id} id={id} className="sr-only">
          {text}
        </div>
      ))}
      
      <div
        id={`item-${index}`}
        data-focusable-card="true"
        data-card-type={type}
        data-card-index={index}
        data-card-name={item.name}
        className={(() => {
          const actualItemType = item.type || type;
          const normalizedType = normalizeType(actualItemType);
          
          // Get border color based on type
          const getBorderColor = () => {
            switch (normalizedType) {
              case 'workflow':
                return 'border-success-600/50';
              case 'template':
                return 'border-primary-600/50';
              case 'snippet':
                return 'border-purple-600/50';
              default:
                return 'border-primary-600/50';
            }
          };
          
          // Use original dark styling for classic dark theme
          const cardBackground = isClassicDark() 
            ? 'bg-secondary-900' 
            : 'bg-white dark:bg-secondary-800';
          
          return `
            ${cardBackground} rounded-lg shadow-md border-2 ${getBorderColor()} p-4 
            hover:shadow-lg transition-all duration-200 flex flex-col
            focus:outline-none
            ${getHoverBorderColor(normalizedType)}
            ${isKeyboardFocused ? getKeyboardFocusColor(normalizedType) : ''}
          `;
        })()}
        onKeyDown={handleKeyDown}
        {...focusProps}
        aria-label={`${type === 'workflow' ? 'Workflow' : type === 'template' ? 'Template' : 'Snippet'}: ${item.name}${item.favorite ? ' (favorited)' : ''}`}
      >
      {/* Header */}
      <div className="mb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2 flex-1">
            {/* Type Icon */}
            {getTypeIcon(item.type || type)}
            <h3 className={`font-semibold mb-1 flex-1 ${isClassicDark() ? 'text-secondary-100' : 'text-secondary-900 dark:text-secondary-100'}`}>{item.name}</h3>
          </div>
        </div>
        
        <p className={`text-sm mb-2 line-clamp-2 ${isClassicDark() ? 'text-secondary-300' : 'text-secondary-600 dark:text-secondary-400'}`}>
          {item.description || 'No description'}
        </p>
        
        <div className={`text-xs ${isClassicDark() ? 'text-secondary-400' : 'text-secondary-500 dark:text-secondary-500'}`}>
          {getItemDetail(item, type)}
        </div>
      </div>


      {/* Actions */}
      <div className="flex gap-2 mt-auto" role="group" aria-label="Item actions">
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggleFavorite(item);
          }}
          className={`
            p-2.5 rounded-md flex items-center justify-center border
            focus:outline-none
            transition-all duration-200 hover:shadow-md
            ${isItemFavorite(item) 
              ? 'text-yellow-400 bg-yellow-900/20 border-yellow-600/50 hover:bg-yellow-900/40 hover:border-yellow-500' 
              : 'text-secondary-400 bg-secondary-700 border-secondary-600 hover:text-yellow-400 hover:bg-yellow-900/20 hover:border-yellow-600/50'
            }
          `}
          aria-label={`${isItemFavorite(item) ? 'Remove from' : 'Add to'} favorites`}
          title={isItemFavorite(item) ? 'Remove from favorites' : 'Add to favorites'}
        >
          <Star className={`w-4 h-4 ${isItemFavorite(item) ? 'fill-current' : ''}`} aria-hidden="true" />
        </button>

        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onEdit(item);
          }}
          className="
            flex-1 p-2.5 text-secondary-300 bg-secondary-700 border border-secondary-600 rounded-md
            hover:bg-secondary-600 hover:border-secondary-500 flex items-center justify-center
            focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-opacity-50
            transition-all duration-200 hover:shadow-md
          "
          aria-label={`Edit ${type} ${item.name}`}
          title="Edit"
        >
          <Edit className="w-4 h-4" aria-hidden="true" />
          <span className="sr-only">Edit</span>
        </button>

        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onDelete(item.id);
          }}
          className="
            p-2.5 text-red-400 bg-red-900/20 border border-red-600/50 rounded-md
            hover:bg-red-900/40 hover:border-red-500 hover:text-red-300 flex items-center justify-center
            focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-opacity-50
            transition-all duration-200 hover:shadow-md
          "
          aria-label={`Delete ${type} ${item.name}`}
          title="Delete"
        >
          <Trash2 className="w-4 h-4" aria-hidden="true" />
          <span className="sr-only">Delete</span>
        </button>
      </div>
    </div>
    </>
  );
};

export default FocusableCard;
