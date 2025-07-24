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
  const { getColorClasses, itemColors } = useItemColors();


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
    return getColorClasses(normalizedType, 'hover-border') || 'hover:border-primary-500';
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
        return <Workflow className="w-5 h-5 text-secondary-600 dark:text-secondary-400" />;
      case 'template':
        return <FileText className="w-5 h-5 text-secondary-600 dark:text-secondary-400" />;
      case 'snippet':
        return <Tag className="w-5 h-5 text-secondary-600 dark:text-secondary-400" />;
      default:
        return <FileText className="w-5 h-5 text-secondary-600 dark:text-secondary-400" />;
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
          
          // Get border color based on type using dynamic colors
          const getBorderColor = () => {
            const colorClass = getColorClasses(normalizedType, 'border');
            return colorClass || 'border-primary-500';
          };
          
          const cardBackground = 'bg-white dark:bg-secondary-800';
          
          const getShadowClass = () => {
            return normalizedType === 'snippet' ? 'shadow-sm hover:shadow-md' : 'shadow-md hover:shadow-lg';
          };
          
          return `
            ${cardBackground} rounded-lg ${getShadowClass()} border-2 ${getBorderColor()} p-4 
            transition-all duration-200 ease-in-out flex flex-col
            focus:outline-none
            ${getHoverBorderColor(normalizedType)}
            hover:scale-[1.01] hover:-translate-y-0.5
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
            <h3 className="font-semibold mb-1 flex-1 text-secondary-900 dark:text-secondary-100">{item.name}</h3>
          </div>
        </div>
        
        <p className="text-sm mb-2 line-clamp-2 text-secondary-600 dark:text-secondary-400">
          {item.description || 'No description'}
        </p>
        
        <div className="text-xs text-secondary-500 dark:text-secondary-500">
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
            e.currentTarget.blur(); // Remove focus after click
          }}
          className="
            p-2.5 text-secondary-600 dark:text-secondary-300 bg-secondary-100 dark:bg-secondary-700 border border-secondary-300 dark:border-secondary-600 rounded-md
            hover:bg-secondary-200 dark:hover:bg-secondary-600 hover:border-secondary-400 dark:hover:border-secondary-500 flex items-center justify-center
            focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-opacity-50
            transition-all duration-200 hover:shadow-md
          "
          aria-label={`${isItemFavorite(item) ? 'Remove from' : 'Add to'} favorites`}
          title={isItemFavorite(item) ? 'Remove from favorites' : 'Add to favorites'}
        >
          <Star className={`w-4 h-4 text-secondary-600 dark:text-secondary-300 ${isItemFavorite(item) ? 'fill-current' : ''}`} aria-hidden="true" />
        </button>

        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onEdit(item);
          }}
          className="
            flex-1 p-2.5 text-secondary-600 dark:text-secondary-300 bg-secondary-100 dark:bg-secondary-700 border border-secondary-300 dark:border-secondary-600 rounded-md
            hover:bg-secondary-200 dark:hover:bg-secondary-600 hover:border-secondary-400 dark:hover:border-secondary-500 flex items-center justify-center
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
            p-2.5 text-secondary-600 dark:text-secondary-300 bg-secondary-100 dark:bg-secondary-700 border border-secondary-300 dark:border-secondary-600 rounded-md
            hover:bg-secondary-200 dark:hover:bg-secondary-600 hover:border-secondary-400 dark:hover:border-secondary-500 hover:text-secondary-700 dark:hover:text-secondary-200 flex items-center justify-center
            focus:outline-none focus:ring-2 focus:ring-secondary-400 focus:ring-opacity-50
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
