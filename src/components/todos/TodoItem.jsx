import React from 'react';
import { Check, Circle, Clock, Calendar, Edit2, Trash2, AlertCircle, Folders } from 'lucide-react';
import { useDeleteTodoMutation } from '../../hooks/queries/useTodosQuery';
import { useUserPreferences } from '../../hooks/domain/useUserPreferences';
import { format, formatDistanceToNow, isPast } from 'date-fns';
import { nl } from 'date-fns/locale';

const priorityConfig = {
  critical: {
    color: 'text-danger-600 dark:text-danger-400',
    bgColor: 'bg-danger-50 dark:bg-danger-900/20',
    borderColor: 'border-danger-300 dark:border-danger-600',
    label: 'Kritiek',
    icon: AlertCircle
  },
  important: {
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-50 dark:bg-orange-900/20',
    borderColor: 'border-orange-300 dark:border-orange-600',
    label: 'Belangrijk'
  },
  should: {
    color: 'text-warning-600 dark:text-warning-400',
    bgColor: 'bg-warning-50 dark:bg-warning-900/20',
    borderColor: 'border-warning-300 dark:border-warning-600',
    label: 'Zou moeten'
  },
  could: {
    color: 'text-success-600 dark:text-success-400',
    bgColor: 'bg-success-50 dark:bg-success-900/20',
    borderColor: 'border-success-300 dark:border-success-600',
    label: 'Zou kunnen'
  },
  nice_to_have: {
    color: 'text-secondary-600 dark:text-secondary-400',
    bgColor: 'bg-secondary-50 dark:bg-secondary-800/50',
    borderColor: 'border-secondary-300 dark:border-secondary-600',
    label: 'Nice to have'
  }
};

const timeEstimateLabels = {
  '1h': '1 uur',
  'few_hours': 'Paar uur',
  'day': '1 dag',
  'days': 'Meerdere dagen',
  'week': '1 week',
  'weeks': 'Meerdere weken'
};

const TodoItem = ({ todo, onStatusChange, onEdit }) => {
  const deleteMutation = useDeleteTodoMutation();
  const { confirmActions } = useUserPreferences();
  const priority = priorityConfig[todo.priority];
  const PriorityIcon = priority.icon;
  
  const handleStatusToggle = () => {
    // Cycle through statuses: to_do -> doing -> done -> to_do
    const nextStatus = {
      to_do: 'doing',
      doing: 'done',
      done: 'to_do'
    };
    
    console.log('[DEBUG] TodoItem - handleStatusToggle:', {
      todoId: todo.id,
      currentStatus: todo.status,
      nextStatus: nextStatus[todo.status]
    });
    
    onStatusChange(todo.id, nextStatus[todo.status]);
  };
  
  const handleDelete = (e) => {
    e.stopPropagation();
    console.log('[DEBUG] TodoItem - handleDelete called for todo:', todo.id);
    
    // Check user preferences for delete confirmation
    if (!confirmActions.deleteTodo || window.confirm('Are you sure you want to delete this todo?')) {
      console.log('[DEBUG] TodoItem - User confirmed deletion, calling mutation');
      deleteMutation.mutate(todo.id);
    } else {
      console.log('[DEBUG] TodoItem - User cancelled deletion');
    }
  };
  
  const handleEdit = (e) => {
    e.stopPropagation();
    onEdit(todo);
  };
  
  // Check if deadline is overdue
  const isOverdue = todo.deadline && isPast(new Date(todo.deadline)) && todo.status !== 'done';
  
  // Format deadline
  const formatDeadline = () => {
    if (!todo.deadline) return null;
    
    const deadlineDate = new Date(todo.deadline);
    if (todo.deadline_type === 'relative') {
      return formatDistanceToNow(deadlineDate, { addSuffix: true, locale: nl });
    }
    return format(deadlineDate, 'd MMM yyyy', { locale: nl });
  };
  
  return (
    <div
      className={`
        group p-3 rounded-lg border cursor-pointer transition-all
        ${priority.bgColor} ${priority.borderColor}
        ${todo.status === 'done' ? 'opacity-60' : ''}
        hover:shadow-sm
      `}
      onClick={handleStatusToggle}
    >
      <div className="flex items-start gap-2">
        {/* Status checkbox */}
        <div className="mt-0.5">
          {todo.status === 'done' ? (
            <div className={`w-5 h-5 rounded flex items-center justify-center ${priority.color} ${priority.bgColor}`}>
              <Check className="w-3 h-3" />
            </div>
          ) : todo.status === 'doing' ? (
            <div className={`w-5 h-5 rounded-full border-2 ${priority.borderColor} ${priority.bgColor}`}>
              <div className={`w-full h-full rounded-full ${priority.bgColor} animate-pulse`} />
            </div>
          ) : (
            <Circle className={`w-5 h-5 ${priority.color}`} />
          )}
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2">
            <h4 className={`text-sm font-medium ${todo.status === 'done' ? 'line-through' : ''} ${priority.color} break-words`}>
              {todo.title}
            </h4>
            {PriorityIcon && todo.priority === 'critical' && (
              <PriorityIcon className="w-3.5 h-3.5 text-red-600 flex-shrink-0 mt-0.5" />
            )}
          </div>
          
          {todo.description && (
            <p className="text-xs text-gray-600 mt-1 line-clamp-2">
              {todo.description}
            </p>
          )}
          
          {/* Badges */}
          <div className="flex flex-wrap items-center gap-2 mt-2">
            {/* Priority badge */}
            <span className={`text-xs px-1.5 py-0.5 rounded ${priority.color} ${priority.bgColor} border ${priority.borderColor}`}>
              {priority.label}
            </span>
            
            {/* Time estimate */}
            {todo.time_estimate && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {timeEstimateLabels[todo.time_estimate]}
              </span>
            )}
            
            {/* Deadline */}
            {todo.deadline && (
              <span className={`text-xs px-1.5 py-0.5 rounded flex items-center gap-1 ${
                isOverdue ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'
              }`}>
                <Calendar className="w-3 h-3" />
                {formatDeadline()}
              </span>
            )}
            
            {/* Folder visibility badges */}
            {todo.is_global ? (
              <span className="text-xs px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center gap-1">
                🌐 Globaal
              </span>
            ) : (
              <>
                {/* Multi-folder badge */}
                {todo.folder_ids && todo.folder_ids.length > 1 && (
                  <span 
                    className="text-xs px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center gap-1 cursor-help"
                    title={`Zichtbaar in ${todo.folder_ids.length} folders${todo.folder_names ? ': ' + todo.folder_names.join(', ') : ''}`}
                  >
                    <Folders className="w-3 h-3" />
                    {todo.folder_ids.length}
                  </span>
                )}
                
                {/* Single folder indicator (only if not multi-folder) */}
                {(!todo.folder_ids || todo.folder_ids.length <= 1) && todo.folder_id && todo.folder_id !== 'root' && (
                  <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 flex items-center gap-1">
                    📁 Folder
                  </span>
                )}
              </>
            )}
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={handleEdit}
            className="p-1 hover:bg-white hover:bg-opacity-60 rounded transition-colors"
            title="Edit"
          >
            <Edit2 className="w-3.5 h-3.5 text-gray-600" />
          </button>
          <button
            onClick={handleDelete}
            className="p-1 hover:bg-white hover:bg-opacity-60 rounded transition-colors"
            title="Delete"
          >
            <Trash2 className="w-3.5 h-3.5 text-gray-600" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default TodoItem;