import React from 'react';
import { Edit, Trash2, Star, Workflow, FileText, Code, GripVertical } from 'lucide-react';

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

  const getTypeIcon = (itemType) => {
    const normalizedType = normalizeType(itemType);
    
    switch (normalizedType) {
      case 'workflow':
        return <Workflow className="w-5 h-5 text-green-400" />;
      case 'template':
        return <FileText className="w-5 h-5 text-blue-400" />;
      case 'snippet':
        return <Code className="w-5 h-5 text-purple-400" />;
      default:
        return <FileText className="w-5 h-5 text-blue-400" />;
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
          return `
            bg-gray-800 rounded-lg shadow-md border border-gray-700 p-4 
            hover:shadow-lg transition-all duration-200 flex flex-col
            focus:outline-none
            ${getHoverBorderColor(actualItemType)}
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
        <GripVertical className="w-5 h-5 text-gray-400 flex-shrink-0" />
        
        <div className="flex-1 pb-4">
          <h3 className="font-semibold text-gray-100 mb-2">{item.name}</h3>
          <p className="text-sm text-gray-300 line-clamp-2">
            {item.description || 'No description'}
          </p>
        </div>
      </div>
      </div>
    </>
  );
};

export default DragCard;