import React, { useMemo } from 'react';
import { Layers } from 'lucide-react';

const KanbanBoard = ({ 
  items, 
  gap = 16, 
  itemSize, 
  renderItem,
  groupBy = 'category'
}) => {
  // Items should already be grouped from ViewModeStrategies
  const columns = useMemo(() => {
    if (typeof items === 'object' && !Array.isArray(items)) {
      return items;
    }
    
    // If not grouped, group them
    return items.reduce((groups, item) => {
      const group = item[groupBy] || 'Other';
      if (!groups[group]) {
        groups[group] = [];
      }
      groups[group].push(item);
      return groups;
    }, {});
  }, [items, groupBy]);

  const columnColors = {
    'general': 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
    'technical': 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800',
    'creative': 'bg-pink-50 dark:bg-pink-900/20 border-pink-200 dark:border-pink-800',
    'business': 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
    'workflows': 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800',
    'snippets': 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
    'Other': 'bg-secondary-50 dark:bg-secondary-900/20 border-secondary-200 dark:border-secondary-800'
  };

  return (
    <div 
      className="h-full overflow-x-auto overflow-y-hidden"
      style={{ padding: `${gap}px` }}
    >
      <div 
        className="flex h-full"
        style={{ gap: `${gap}px`, minWidth: 'max-content' }}
      >
        {Object.entries(columns).map(([columnName, columnItems]) => (
          <div 
            key={columnName}
            className={`flex-shrink-0 flex flex-col ${
              columnColors[columnName] || columnColors['Other']
            } rounded-lg border`}
            style={{ width: itemSize.width }}
          >
            <div className="p-4 border-b border-secondary-200 dark:border-secondary-700">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-secondary-900 dark:text-secondary-100 capitalize">
                  {columnName}
                </h3>
                <span className="text-sm text-secondary-600 dark:text-secondary-400 bg-white dark:bg-secondary-800 px-2 py-1 rounded-full">
                  {columnItems.length}
                </span>
              </div>
            </div>
            
            <div 
              className="flex-1 overflow-y-auto p-2 space-y-2"
              style={{ gap: `${gap / 2}px` }}
            >
              {columnItems.map((item, index) => (
                <div key={item.id || index}>
                  {renderItem({ item, index, column: columnName })}
                </div>
              ))}
              
              {columnItems.length === 0 && (
                <div className="text-center py-8 text-secondary-500 dark:text-secondary-400">
                  <Layers className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No items</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default KanbanBoard;