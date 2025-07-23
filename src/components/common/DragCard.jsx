import React from 'react';
import { Edit, Trash2, Star, Workflow, FileText, Code, GripVertical } from 'lucide-react';
import { useItemColors } from '../../hooks/useItemColors.js';

const DragCard = ({ 
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

  const getTypeIcon = (itemType) => {
    const normalizedType = normalizeType(itemType);
    
    switch (normalizedType) {
      case 'workflow':
        return <Workflow className="w-5 h-5 text-success-600 dark:text-success-400" />;
      case 'template':
        return <FileText className="w-5 h-5 text-primary-600 dark:text-primary-400" />;
      case 'snippet':
        return <Code className="w-5 h-5 text-purple-600 dark:text-purple-400" />;
      default:
        return <FileText className="w-5 h-5 text-primary-600 dark:text-primary-400" />;
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

  const focusProps = keyboardNavigation.getFocusProps ? keyboardNavigation.getFocusProps(index, sectionType || type) : {};
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
          // Use original dark styling for classic dark theme
          const cardBackground = isClassicDark() 
            ? 'bg-secondary-800' 
            : 'bg-white dark:bg-secondary-800';
          const cardBorder = isClassicDark()
            ? 'border-secondary-700'
            : 'border-secondary-300 dark:border-secondary-700';
          
          return `
            ${cardBackground} rounded-lg shadow-md border ${cardBorder} p-4 
            hover:shadow-lg transition-all duration-200 flex flex-col
            focus:outline-none
            ${getColorClasses(actualItemType, 'hover')}
            ${isKeyboardFocused ? getKeyboardFocusColor(actualItemType) : ''}
          `;
        })()}
        onKeyDown={handleKeyDown}
        {...focusProps}
        aria-label={`${type === 'workflow' ? 'Workflow' : type === 'template' ? 'Template' : 'Snippet'}: ${item.name}${item.favorite ? ' (favorited)' : ''}`}
      >
      {/* Minimal Header for Drag State - Only Title and Description */}
      <div className="flex items-center gap-3 min-h-[4rem]">
        {/* Drag Handle */}
        <GripVertical className={`w-5 h-5 flex-shrink-0 ${isClassicDark() ? 'text-secondary-400' : 'text-secondary-600 dark:text-secondary-400'}`} />
        
        <div className="flex-1 pb-4">
          <h3 className={`font-semibold mb-2 ${isClassicDark() ? 'text-secondary-100' : 'text-secondary-900 dark:text-secondary-100'}`}>{item.name}</h3>
          <p className={`text-sm line-clamp-2 ${isClassicDark() ? 'text-secondary-300' : 'text-secondary-600 dark:text-secondary-300'}`}>
            {item.description || 'No description'}
          </p>
        </div>
      </div>
      </div>
    </>
  );
};

export default DragCard;