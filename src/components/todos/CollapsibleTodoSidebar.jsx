import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Plus, Filter, Calendar, Clock, AlertCircle } from 'lucide-react';
import { useTodosQuery, useUpdateTodoStatusMutation } from '../../hooks/queries/useTodosQuery';
import { useTodoSidebarState } from '../../hooks/ui/useTodoUIState';
import TodoItem from './TodoItem';
import TodoModal from './TodoModal';

const priorityColors = {
  critical: 'border-red-500 bg-red-50',
  important: 'border-orange-500 bg-orange-50',
  should: 'border-yellow-500 bg-yellow-50',
  could: 'border-green-500 bg-green-50',
  nice_to_have: 'border-gray-400 bg-gray-50'
};

const statusLabels = {
  to_do: 'To do',
  doing: 'In progress',
  done: 'Done'
};

const CollapsibleTodoSidebar = ({ currentFolderId }) => {
  const { isCollapsed, toggleSidebar } = useTodoSidebarState();
  const [showModal, setShowModal] = useState(false);
  const [editingTodo, setEditingTodo] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  
  // Fetch todos for current folder + global todos
  const { data: todos = [], isLoading, error } = useTodosQuery({
    folderId: currentFolderId,
    status: filterStatus === 'all' ? undefined : filterStatus,
    priority: filterPriority === 'all' ? undefined : filterPriority,
    showGlobal: true
  });

  // Debug logging commented out
  // React.useEffect(() => {
  //   console.log('[DEBUG] CollapsibleTodoSidebar - State update:', {
  //     currentFolderId,
  //     filterStatus,
  //     filterPriority,
  //     todosCount: todos.length,
  //     isLoading,
  //     error: error?.message
  //   });
  // }, [currentFolderId, filterStatus, filterPriority, todos.length, isLoading, error]);
  
  const updateStatusMutation = useUpdateTodoStatusMutation();
  
  // Group todos by status
  const groupedTodos = useMemo(() => {
    const groups = {
      to_do: [],
      doing: [],
      done: []
    };
    
    todos.forEach(todo => {
      if (groups[todo.status]) {
        groups[todo.status].push(todo);
      }
    });
    
    return groups;
  }, [todos]);
  
  // Count stats
  const stats = useMemo(() => {
    const counts = {
      total: todos.length,
      to_do: groupedTodos.to_do.length,
      doing: groupedTodos.doing.length,
      done: groupedTodos.done.length,
      critical: 0,
      overdue: 0
    };
    
    const now = new Date();
    todos.forEach(todo => {
      if (todo.priority === 'critical') counts.critical++;
      if (todo.deadline && new Date(todo.deadline) < now && todo.status !== 'done') {
        counts.overdue++;
      }
    });
    
    return counts;
  }, [todos, groupedTodos]);
  
  const handleStatusChange = (todoId, newStatus) => {
    console.log('[DEBUG] CollapsibleTodoSidebar - handleStatusChange:', { todoId, newStatus });
    updateStatusMutation.mutate({ id: todoId, status: newStatus });
  };
  
  const handleEdit = (todo) => {
    setEditingTodo(todo);
    setShowModal(true);
  };
  
  const handleCreate = () => {
    console.log('[DEBUG] CollapsibleTodoSidebar - handleCreate called');
    setEditingTodo(null);
    setShowModal(true);
  };
  
  const handleModalClose = () => {
    setShowModal(false);
    setEditingTodo(null);
  };
  
  if (error) {
    return (
      <div className="w-72 bg-white dark:bg-secondary-900 border-l border-secondary-200 dark:border-secondary-700 p-4">
        <div className="text-danger-600 dark:text-danger-400">Error loading todos: {error.message}</div>
      </div>
    );
  }
  
  return (
    <>
      <div className={`bg-white dark:bg-secondary-900 border-l border-secondary-200 dark:border-secondary-700 transition-all duration-300 ${
        isCollapsed ? 'w-16' : 'w-72'
      } flex flex-col h-full`}>
        {/* Header */}
        <div className="p-3 border-b border-secondary-200 dark:border-secondary-700 flex items-center">
          {!isCollapsed && (
            <>
              {/* Toggle button aan de linkerkant */}
              <button
                onClick={toggleSidebar}
                className="p-1.5 hover:bg-secondary-200 dark:hover:bg-secondary-700 rounded-md transition-colors mr-2"
                title="Collapse sidebar"
              >
                <ChevronRight className="w-5 h-5 text-secondary-600 dark:text-secondary-400" />
              </button>
              
              {/* Titel in het midden */}
              <h3 className="flex-1 font-semibold text-secondary-800 dark:text-secondary-200 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Todos
                {stats.total > 0 && (
                  <span className="text-xs text-secondary-500 dark:text-secondary-400">({stats.total})</span>
                )}
              </h3>
              
              {/* Plus button aan de rechterkant */}
              <button
                onClick={handleCreate}
                className="p-1.5 hover:bg-secondary-200 dark:hover:bg-secondary-700 rounded-md transition-colors"
                title="New todo"
              >
                <Plus className="w-4 h-4" />
              </button>
            </>
          )}
          {isCollapsed && (
            <button
              onClick={toggleSidebar}
              className="p-1.5 hover:bg-secondary-200 dark:hover:bg-secondary-700 rounded-md transition-colors mx-auto"
              title="Expand sidebar"
            >
              <ChevronLeft className="w-5 h-5 text-secondary-600 dark:text-secondary-400" />
            </button>
          )}
        </div>
        
        {!isCollapsed && (
          <>
            {/* Stats */}
            {stats.total > 0 && (
              <div className="p-3 border-b border-secondary-200 dark:border-secondary-700 grid grid-cols-3 gap-2 text-xs">
                <div className="text-center">
                  <div className="font-semibold text-primary-600 dark:text-primary-400">{stats.to_do}</div>
                  <div className="text-secondary-500 dark:text-secondary-400">To do</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-warning-600 dark:text-warning-400">{stats.doing}</div>
                  <div className="text-secondary-500 dark:text-secondary-400">In progress</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-success-600 dark:text-success-400">{stats.done}</div>
                  <div className="text-secondary-500 dark:text-secondary-400">Done</div>
                </div>
                {stats.critical > 0 && (
                  <div className="col-span-3 mt-2 flex items-center justify-center gap-2 text-danger-600 dark:text-danger-400">
                    <AlertCircle className="w-3 h-3" />
                    <span>{stats.critical} critical</span>
                  </div>
                )}
                {stats.overdue > 0 && (
                  <div className="col-span-3 flex items-center justify-center gap-2 text-danger-600 dark:text-danger-400">
                    <Calendar className="w-3 h-3" />
                    <span>{stats.overdue} overdue</span>
                  </div>
                )}
              </div>
            )}
            
            {/* Filters */}
            <div className="p-3 border-b border-secondary-200 dark:border-secondary-700 space-y-2">
              <div className="flex items-center gap-2">
                <Filter className="w-3 h-3 text-secondary-500 dark:text-secondary-400" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="flex-1 text-xs border border-secondary-300 dark:border-secondary-600 bg-secondary-50 dark:bg-secondary-700 text-secondary-800 dark:text-secondary-200 rounded px-2 py-1"
                >
                  <option value="all">All statuses</option>
                  <option value="to_do">To do</option>
                  <option value="doing">In progress</option>
                  <option value="done">Done</option>
                </select>
              </div>
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="w-full text-xs border border-secondary-300 dark:border-secondary-600 bg-secondary-50 dark:bg-secondary-700 text-secondary-800 dark:text-secondary-200 rounded px-2 py-1"
              >
                <option value="all">All priorities</option>
                <option value="critical">Critical</option>
                <option value="important">Important</option>
                <option value="should">Should do</option>
                <option value="could">Could do</option>
                <option value="nice_to_have">Nice to have</option>
              </select>
            </div>
            
            {/* Todo List */}
            <div className="flex-1 overflow-y-auto">
              {isLoading ? (
                <div className="p-4 text-center text-secondary-500 dark:text-secondary-400">Loading...</div>
              ) : todos.length === 0 ? (
                <div className="p-4 text-center text-secondary-500 dark:text-secondary-400">
                  <Clock className="w-8 h-8 mx-auto mb-2 text-secondary-300 dark:text-secondary-600" />
                  <p>No todos found</p>
                  <button
                    onClick={handleCreate}
                    className="mt-2 text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
                  >
                    Create your first todo
                  </button>
                </div>
              ) : (
                <div className="p-3 space-y-4">
                  {/* To Do section */}
                  {groupedTodos.to_do.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-secondary-600 dark:text-secondary-400 uppercase mb-2">
                        To do ({groupedTodos.to_do.length})
                      </h4>
                      <div className="space-y-2">
                        {groupedTodos.to_do.map(todo => (
                          <TodoItem
                            key={todo.id}
                            todo={todo}
                            onStatusChange={handleStatusChange}
                            onEdit={() => handleEdit(todo)}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Doing section */}
                  {groupedTodos.doing.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-secondary-600 dark:text-secondary-400 uppercase mb-2">
                        In progress ({groupedTodos.doing.length})
                      </h4>
                      <div className="space-y-2">
                        {groupedTodos.doing.map(todo => (
                          <TodoItem
                            key={todo.id}
                            todo={todo}
                            onStatusChange={handleStatusChange}
                            onEdit={() => handleEdit(todo)}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Done section */}
                  {groupedTodos.done.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-secondary-600 dark:text-secondary-400 uppercase mb-2">
                        Done ({groupedTodos.done.length})
                      </h4>
                      <div className="space-y-2 opacity-50">
                        {groupedTodos.done.map(todo => (
                          <TodoItem
                            key={todo.id}
                            todo={todo}
                            onStatusChange={handleStatusChange}
                            onEdit={() => handleEdit(todo)}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
      
      {/* Todo Modal */}
      {showModal && (
        <TodoModal
          todo={editingTodo}
          currentFolderId={currentFolderId}
          onClose={handleModalClose}
        />
      )}
    </>
  );
};

export default CollapsibleTodoSidebar;