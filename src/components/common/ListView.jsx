import React from 'react';
import { Play, Edit, Trash2, Star, GripVertical, Workflow, FileText, Tag } from 'lucide-react';

const ListView = ({ 
  items = [],
  type = 'template',
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
        const isDraggingItem = draggedItem?.item.id === item.id;
        const canDropHere = draggedItem?.sectionType === type && draggedItem?.item.id !== item.id;
        const focusProps = keyboardNavigation.getFocusProps ? keyboardNavigation.getFocusProps(index) : {};
        const isKeyboardFocused = focusProps['data-keyboard-focused'];

        return (
          <div
            key={item.id}
            className={`
              bg-gray-800 rounded-lg border border-gray-700 p-4 
              hover:shadow-lg transition-all duration-200
              ${isDraggingItem ? 'opacity-50' : ''}
              ${canDropHere ? 'border-blue-400' : ''}
              ${isKeyboardFocused ? 'ring-2 ring-blue-400 ring-opacity-50' : ''}
            `}
            draggable={isReorderMode}
            onDragStart={(e) => onDragStart(e, item, type)}
            onDragOver={(e) => onDragOver(e)}
            onDrop={(e) => onDrop(e, item, type)}
            {...focusProps}
          >
            <div className="flex items-start gap-4">
              {/* Drag Handle */}
              {isReorderMode && (
                <div className="flex-shrink-0 pt-1">
                  <GripVertical className="w-4 h-4 text-gray-400 cursor-move" />
                </div>
              )}

              {/* Type Icon */}
              <div className="flex-shrink-0 pt-1">
                {getTypeIcon(type)}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-100 truncate">
                      {item.name}
                    </h3>
                    {item.favorite && (
                      <Star className="w-4 h-4 text-yellow-300 fill-current flex-shrink-0" />
                    )}
                  </div>
                  <div className="text-xs text-gray-400 flex-shrink-0">
                    {getItemDetail(item, type)}
                  </div>
                </div>

                <p className="text-sm text-gray-300 mb-3 line-clamp-2">
                  {item.description || 'No description'}
                </p>

                {/* Tags for snippets */}
                {type === 'snippet' && item.tags && item.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {item.tags.slice(0, 5).map((tag, tagIndex) => (
                      <span
                        key={tagIndex}
                        className="px-2 py-1 bg-gray-700 text-gray-300 border border-amber-600 rounded text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                    {item.tags.length > 5 && (
                      <span className="px-2 py-1 bg-gray-700 text-gray-300 rounded text-xs">
                        +{item.tags.length - 5}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => onExecute({ item, type })}
                  className={`
                    px-3 py-1.5 text-white rounded-md text-sm font-medium
                    flex items-center gap-1.5 ${getTypeColor(type)}
                    focus:outline-none focus:ring-2 focus:ring-opacity-50
                  `}
                  title="Execute"
                >
                  <Play className="w-3 h-3" />
                  Execute
                </button>

                <button
                  onClick={() => onEdit(item)}
                  className="
                    px-2 py-1.5 text-gray-300 border border-gray-600 rounded-md
                    hover:bg-gray-700 flex items-center justify-center
                    focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50
                  "
                  title="Edit"
                >
                  <Edit className="w-3 h-3" />
                </button>

                <button
                  onClick={() => onDelete(item.id)}
                  className="
                    px-2 py-1.5 text-red-400 border border-red-600 rounded-md
                    hover:bg-red-900 flex items-center justify-center
                    focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-opacity-50
                  "
                  title="Delete"
                >
                  <Trash2 className="w-3 h-3" />
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