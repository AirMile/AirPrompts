import React from 'react';
import { Play, Edit, Trash2, Star, GripVertical, Workflow, FileText, Tag } from 'lucide-react';

const FocusableCard = ({ 
  item,
  type = 'template',
  index,
  onExecute = () => {},
  onEdit = () => {},
  onDelete = () => {},
  isReorderMode = false,
  onDragStart = () => {},
  onDragOver = () => {},
  onDrop = () => {},
  draggedItem = null,
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

  const isDraggingItem = draggedItem?.item.id === item.id;
  const canDropHere = draggedItem?.sectionType === type && draggedItem?.item.id !== item.id;
  const focusProps = keyboardNavigation.getFocusProps ? keyboardNavigation.getFocusProps(index) : {};
  const isKeyboardFocused = focusProps['data-keyboard-focused'];
  const keyboardHelpText = keyboardNavigation.getKeyboardHelpText ? keyboardNavigation.getKeyboardHelpText() : {};

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
        className={`
          bg-gray-800 rounded-lg shadow-md border border-gray-700 p-4 
          hover:shadow-lg transition-all duration-200 flex flex-col
          ${isDraggingItem ? 'opacity-50' : ''}
          ${canDropHere ? 'border-blue-400' : ''}
          ${isKeyboardFocused ? 'ring-2 ring-blue-400 ring-opacity-75 ring-offset-2 ring-offset-gray-900' : ''}
        `}
        draggable={isReorderMode}
        onDragStart={(e) => onDragStart(e, item, type)}
        onDragOver={(e) => onDragOver(e)}
        onDrop={(e) => onDrop(e, item, type)}
        {...focusProps}
        aria-label={`${type === 'workflow' ? 'Workflow' : type === 'template' ? 'Template' : 'Snippet'}: ${item.name}${item.favorite ? ' (favorited)' : ''}`}
      >
      {/* Header */}
      <div className="mb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            {isReorderMode && (
              <GripVertical className="w-4 h-4 text-gray-400 cursor-move" />
            )}
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

      {/* Tags for snippets */}
      {type === 'snippet' && item.tags && item.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {item.tags.slice(0, 3).map((tag, tagIndex) => (
            <span
              key={tagIndex}
              className="px-2 py-1 bg-gray-800 text-gray-300 border border-amber-600 rounded text-xs"
            >
              {tag}
            </span>
          ))}
          {item.tags.length > 3 && (
            <span className="px-2 py-1 bg-gray-700 text-gray-300 rounded text-xs">
              +{item.tags.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 mt-auto" role="group" aria-label="Item actions">
        <button
          onClick={() => onExecute({ item, type })}
          className={`
            flex-1 px-3 py-2 text-white rounded-md text-sm font-medium
            flex items-center justify-center gap-2 ${getTypeColor(type)}
            focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50
          `}
          aria-label={`Execute ${type} ${item.name}`}
          title={`Execute ${type} ${item.name}`}
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
          title={`Edit ${type} ${item.name}`}
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
          title={`Delete ${type} ${item.name}`}
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
