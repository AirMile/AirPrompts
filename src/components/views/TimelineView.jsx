import React, { useMemo } from 'react';
import { Calendar, Clock } from 'lucide-react';

const TimelineView = ({ 
  items, 
  gap = 24, 
  renderItem,
  virtualization = {}
}) => {
  // Group items by date
  const groupedByDate = useMemo(() => {
    const groups = {};
    
    items.forEach(item => {
      const date = new Date(item.updatedAt || item.createdAt);
      const dateKey = date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      
      if (!groups[dateKey]) {
        groups[dateKey] = {
          date: date,
          items: []
        };
      }
      
      groups[dateKey].items.push(item);
    });
    
    // Sort by date (newest first)
    return Object.entries(groups)
      .sort(([, a], [, b]) => b.date - a.date)
      .map(([dateKey, group]) => ({
        dateKey,
        ...group
      }));
  }, [items]);

  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isYesterday = (date) => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return date.toDateString() === yesterday.toDateString();
  };

  const getDateLabel = (date, dateKey) => {
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    return dateKey;
  };

  return (
    <div 
      className="w-full h-full overflow-auto"
      style={{ padding: `${gap}px` }}
    >
      <div className="max-w-4xl mx-auto">
        {groupedByDate.map(({ dateKey, date, items: dateItems }, groupIndex) => (
          <div key={dateKey} className="relative">
            {/* Date header */}
            <div className="sticky top-0 z-10 bg-white dark:bg-secondary-900 py-2">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 px-3 py-1 rounded-full">
                  <Calendar className="w-4 h-4" />
                  <span className="font-medium text-sm">
                    {getDateLabel(date, dateKey)}
                  </span>
                </div>
                <div className="flex-1 h-px bg-secondary-200 dark:bg-secondary-700" />
              </div>
            </div>

            {/* Timeline line */}
            <div className="absolute left-6 top-12 bottom-0 w-0.5 bg-secondary-200 dark:bg-secondary-700" />

            {/* Items for this date */}
            <div className="space-y-0 pl-12">
              {dateItems.map((item, index) => {
                const itemTime = new Date(item.updatedAt || item.createdAt);
                const timeString = itemTime.toLocaleTimeString('en-US', { 
                  hour: 'numeric', 
                  minute: '2-digit' 
                });

                return (
                  <div key={item.id || index} className="relative">
                    {/* Timeline dot */}
                    <div className="absolute -left-12 top-6 w-3 h-3 bg-primary-500 rounded-full border-2 border-white dark:border-secondary-900" />
                    
                    {/* Time label */}
                    <div className="absolute -left-28 top-4 text-xs text-secondary-500 dark:text-secondary-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {timeString}
                    </div>

                    {/* Item content */}
                    <div style={{ marginBottom: `${gap}px` }}>
                      {renderItem({ item, index, date: itemTime })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Spacing between date groups */}
            {groupIndex < groupedByDate.length - 1 && (
              <div style={{ height: `${gap * 2}px` }} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TimelineView;