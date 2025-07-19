import React from 'react';
import { Play, Edit, Trash2, Star, GripVertical, Workflow, FileText, Tag } from 'lucide-react';

const FocusableCard = ({ 
  item,
  type = 'template',
  sectionType,
  index,
  onExecute = () => {},
  onEdit = () => {},
  onDelete = () => {},
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
            ${getHoverBorderColor(actualItemType)}
            ${isKeyboardFocused ? getKeyboardFocusColor(actualItemType) : ''}
          `;
        })()}
        onKeyDown={handleKeyDown}
        {...focusProps}
        aria-label={`${type === 'workflow' ? 'Workflow' : type === 'template' ? 'Template' : 'Snippet'}: ${item.name}${item.favorite ? ' (favorited)' : ''}`}
      >
      {/* Header */}
      <div className="mb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-100 mb-1">{item.name}</h3>
          </div>
          <div className="flex items-center gap-1">
            {item.favorite && (
              <Star className="w-4 h-4 text-yellow-300 fill-current" />
            )}
          </div>
        </div>
        
        <p className="text-sm text-gray-300 mb-2 line-clamp-2">
          {item.description || 'No description'}
        </p>
        
        <div className="text-xs text-gray-400">
          {getItemDetail(item, type)}
        </div>
      </div>


      {/* Actions */}
      <div className="flex gap-2 mt-auto" role="group" aria-label="Item actions">
        <button
          onClick={() => onExecute({ item, type: item.type || type })}
          className={`
            flex-1 px-3 py-2 text-white rounded-md text-sm font-medium
            flex items-center justify-center gap-2 ${getTypeColor(type)}
            focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50
          `}
          aria-label={`Execute ${type} ${item.name}`}
        >
          <Play className="w-4 h-4" aria-hidden="true" />
          Execute
        </button>

        <button
          onClick={() => onEdit(item)}
          className="
            px-3 py-2 text-gray-300 border border-gray-600 rounded-md
            hover:bg-gray-700 flex items-center justify-center
            focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50
          "
          aria-label={`Edit ${type} ${item.name}`}
        >
          <Edit className="w-4 h-4" aria-hidden="true" />
          <span className="sr-only">Edit</span>
        </button>

        <button
          onClick={() => onDelete(item.id)}
          className="
            px-3 py-2 text-red-400 border border-red-600 rounded-md
            hover:bg-red-900 flex items-center justify-center
            focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-opacity-50
          "
          aria-label={`Delete ${type} ${item.name}`}
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
