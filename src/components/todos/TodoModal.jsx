import React, { useState, useEffect } from 'react';
import { X, Save, Calendar, Clock, AlertCircle, Folder } from 'lucide-react';
import { useCreateTodoMutation, useUpdateTodoMutation } from '../../hooks/queries/useTodosQuery';
import { useFolders } from '../../hooks/queries/useFoldersQuery';
import MultiSelectFolderSelector from '../shared/form/MultiSelectFolderSelector';
import { format } from 'date-fns';

const priorityOptions = [
  { value: 'critical', label: 'Critical', color: 'text-red-600 bg-red-50 border-red-300' },
  { value: 'important', label: 'Important', color: 'text-orange-600 bg-orange-50 border-orange-300' },
  { value: 'should', label: 'Should do', color: 'text-yellow-600 bg-yellow-50 border-yellow-300' },
  { value: 'could', label: 'Could do', color: 'text-green-600 bg-green-50 border-green-300' },
  { value: 'nice_to_have', label: 'Nice to have', color: 'text-gray-600 bg-gray-50 border-gray-300' }
];

const timeEstimateOptions = [
  { value: '', label: 'No estimate' },
  { value: '1h', label: '1 hour' },
  { value: 'few_hours', label: 'Few hours' },
  { value: 'day', label: '1 day' },
  { value: 'days', label: 'Multiple days' },
  { value: 'week', label: '1 week' },
  { value: 'weeks', label: 'Multiple weeks' }
];

const TodoModal = ({ todo, currentFolderId, onClose }) => {
  const createMutation = useCreateTodoMutation();
  const updateMutation = useUpdateTodoMutation();
  const { data: folders = [] } = useFolders();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'could',
    time_estimate: '',
    deadline: '',
    deadline_type: 'fixed',
    is_global: false,
    folder_id: currentFolderId || '',
    folder_ids: []
  });
  
  const [errors, setErrors] = useState({});
  const [showMultiFolders, setShowMultiFolders] = useState(true);
  const [visibilityMode, setVisibilityMode] = useState('global'); // 'global', 'home', 'specific'
  
  // Initialize form with todo data if editing
  useEffect(() => {
    if (todo) {
      const isGlobal = todo.is_global || false;
      const folderId = todo.folder_id || currentFolderId || '';
      
      setFormData({
        title: todo.title || '',
        description: todo.description || '',
        priority: todo.priority || 'could',
        time_estimate: todo.time_estimate || '',
        deadline: todo.deadline ? format(new Date(todo.deadline), 'yyyy-MM-dd') : '',
        deadline_type: todo.deadline_type || 'fixed',
        is_global: isGlobal,
        folder_id: folderId,
        folder_ids: todo.folder_ids && todo.folder_ids.length > 0 ? todo.folder_ids : (folderId && folderId !== 'root' ? [folderId] : [])
      });
      
      // Set visibility mode based on current values
      if (isGlobal) {
        setVisibilityMode('global');
      } else if (folderId === 'root' || !folderId) {
        setVisibilityMode('home');
      } else {
        setVisibilityMode('specific');
      }
      
      setShowMultiFolders(true);
    } else {
      // Default to current folder for new todos
      if (currentFolderId === 'root') {
        setVisibilityMode('home');
      } else if (currentFolderId) {
        setVisibilityMode('specific');
        setFormData(prev => ({
          ...prev,
          folder_id: currentFolderId,
          folder_ids: [currentFolderId]
        }));
      } else {
        setVisibilityMode('global');
      }
    }
  }, [todo, currentFolderId]);
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };
  
  const handleMultiFoldersSelect = (selectedFolderIds) => {
    setFormData(prev => ({
      ...prev,
      folder_ids: selectedFolderIds,
      // Set folder_id to first selected folder for backward compatibility
      folder_id: selectedFolderIds.length > 0 ? selectedFolderIds[0] : ''
    }));
  };
  
  const handleVisibilityModeChange = (mode) => {
    setVisibilityMode(mode);
    
    if (mode === 'global') {
      setFormData(prev => ({
        ...prev,
        folder_id: '',
        is_global: true
      }));
    } else if (mode === 'home') {
      setFormData(prev => ({
        ...prev,
        folder_id: 'root',
        is_global: false
      }));
    } else if (mode === 'specific') {
      setFormData(prev => ({
        ...prev,
        folder_id: currentFolderId || '',
        folder_ids: currentFolderId ? [currentFolderId] : [],
        is_global: false
      }));
    }
  };
  
  const handleSpecificFolderSelect = (folderId) => {
    setFormData(prev => ({
      ...prev,
      folder_id: folderId,
      is_global: false
    }));
  };
  
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    
    if (formData.deadline && formData.deadline_type === 'fixed') {
      const deadlineDate = new Date(formData.deadline);
      if (isNaN(deadlineDate.getTime())) {
        newErrors.deadline = 'Invalid date';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log('[DEBUG] TodoModal - handleSubmit called:', { formData, todo });
    
    if (!validateForm()) {
      console.log('[DEBUG] TodoModal - Form validation failed');
      return;
    }
    
    const todoData = {
      ...formData,
      title: formData.title.trim(),
      description: formData.description.trim(),
      deadline: formData.deadline || null,
      folder_ids: formData.folder_ids || []
    };
    
    console.log('[DEBUG] TodoModal - Prepared todoData:', todoData);
    
    try {
      if (todo) {
        console.log('[DEBUG] TodoModal - Updating existing todo');
        await updateMutation.mutateAsync({ id: todo.id, ...todoData });
      } else {
        console.log('[DEBUG] TodoModal - Creating new todo');
        await createMutation.mutateAsync(todoData);
      }
      console.log('[DEBUG] TodoModal - Todo saved successfully, closing modal');
      onClose();
    } catch (error) {
      console.error('[DEBUG] TodoModal - Error saving todo:', error);
      setErrors({ submit: 'An error occurred while saving' });
    }
  };
  
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-hidden mx-4 sm:mx-0">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-secondary-200 dark:border-secondary-700">
          <h2 className="text-lg font-semibold flex items-center gap-2 text-secondary-900 dark:text-secondary-100">
            {todo ? 'Edit todo' : 'New todo'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-secondary-100 dark:hover:bg-secondary-700 rounded-md transition-colors text-secondary-500 dark:text-secondary-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4 overflow-y-auto max-h-[calc(90vh-8rem)]">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium mb-1 text-secondary-700 dark:text-secondary-300">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="What needs to be done?"
              className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-secondary-700 text-secondary-900 dark:text-secondary-100 placeholder-secondary-500 dark:placeholder-secondary-400 ${
                errors.title ? 'border-red-500' : 'border-secondary-300 dark:border-secondary-600'
              } focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400`}
            />
            {errors.title && (
              <p className="text-red-500 text-xs mt-1">{errors.title}</p>
            )}
          </div>
          
          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-1 text-secondary-700 dark:text-secondary-300">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Extra details or notes..."
              rows={3}
              className="w-full px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-md bg-white dark:bg-secondary-700 text-secondary-900 dark:text-secondary-100 placeholder-secondary-500 dark:placeholder-secondary-400 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400"
            />
          </div>
          
          {/* Priority */}
          <div>
            <label className="block text-sm font-medium mb-1 text-secondary-700 dark:text-secondary-300">
              Priority
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {priorityOptions.map(option => (
                <label
                  key={option.value}
                  className={`
                    flex items-center gap-2 p-2 rounded-md border cursor-pointer transition-all
                    ${formData.priority === option.value ? option.color : 'border-secondary-300 dark:border-secondary-600 hover:bg-secondary-50 dark:hover:bg-secondary-700 text-secondary-700 dark:text-secondary-300'}
                  `}
                >
                  <input
                    type="radio"
                    name="priority"
                    value={option.value}
                    checked={formData.priority === option.value}
                    onChange={handleChange}
                    className="sr-only"
                  />
                  {option.value === 'critical' && <AlertCircle className="w-4 h-4" />}
                  <span className="text-sm">{option.label}</span>
                </label>
              ))}
            </div>
          </div>
          
          {/* Time estimate & Deadline */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Time estimate */}
            <div>
              <label className="block text-sm font-medium mb-1 flex items-center gap-1 text-secondary-700 dark:text-secondary-300">
                <Clock className="w-4 h-4" />
                Time estimate
              </label>
              <select
                name="time_estimate"
                value={formData.time_estimate}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-md bg-white dark:bg-secondary-700 text-secondary-900 dark:text-secondary-100 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400"
              >
                {timeEstimateOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Deadline */}
            <div>
              <label className="block text-sm font-medium mb-1 flex items-center gap-1 text-secondary-700 dark:text-secondary-300">
                <Calendar className="w-4 h-4" />
                Deadline
              </label>
              <input
                type="date"
                name="deadline"
                value={formData.deadline}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-md bg-white dark:bg-secondary-700 text-secondary-900 dark:text-secondary-100 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400"
              />
            </div>
          </div>
          
          {/* Folder assignment */}
          <div>
            <label className="block text-sm font-medium mb-1 flex items-center gap-1 text-secondary-700 dark:text-secondary-300">
              <Folder className="w-4 h-4" />
              Visibility
            </label>
            <div className="space-y-3">
              {/* Visibility mode radio buttons */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="visibilityMode"
                    value="global"
                    checked={visibilityMode === 'global'}
                    onChange={() => handleVisibilityModeChange('global')}
                    className="text-primary-500 focus:ring-primary-500 dark:focus:ring-primary-400"
                  />
                  <span className="text-sm text-secondary-700 dark:text-secondary-300">
                    🌐 Always visible (all folders)
                  </span>
                </label>
                
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="visibilityMode"
                    value="home"
                    checked={visibilityMode === 'home'}
                    onChange={() => handleVisibilityModeChange('home')}
                    className="text-primary-500 focus:ring-primary-500 dark:focus:ring-primary-400"
                  />
                  <span className="text-sm text-secondary-700 dark:text-secondary-300">
                    🏠 Only at Home
                  </span>
                </label>
                
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="visibilityMode"
                    value="specific"
                    checked={visibilityMode === 'specific'}
                    onChange={() => handleVisibilityModeChange('specific')}
                    className="text-primary-500 focus:ring-primary-500 dark:focus:ring-primary-400"
                  />
                  <span className="text-sm text-secondary-700 dark:text-secondary-300">
                    📁 Specific folders
                  </span>
                </label>
              </div>
              
              {/* Folder selector for specific folder mode */}
              {visibilityMode === 'specific' && (
                <div className="mt-3">
                  <label className="block text-sm font-medium mb-2 text-secondary-700 dark:text-secondary-300">
                    Folders
                  </label>
                  <MultiSelectFolderSelector
                    folders={folders}
                    selectedFolderIds={formData.folder_ids}
                    onFoldersSelect={handleMultiFoldersSelect}
                    placeholder="Select one or more folders..."
                    className="w-full"
                    maxHeight="max-h-48"
                  />
                  <p className="text-xs text-secondary-600 dark:text-secondary-400 mt-1">
                    💡 Select the folders where this todo should be visible
                  </p>
                </div>
              )}
            </div>
          </div>
          
          {/* Error message */}
          {errors.submit && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md text-red-700 dark:text-red-400 text-sm">
              {errors.submit}
            </div>
          )}
        </form>
        
        {/* Footer */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 p-4 border-t border-secondary-200 dark:border-secondary-700 bg-secondary-50 dark:bg-secondary-850">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-secondary-700 dark:text-secondary-300 hover:bg-secondary-200 dark:hover:bg-secondary-700 rounded-md transition-colors order-2 sm:order-1"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={createMutation.isPending || updateMutation.isPending}
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 order-1 sm:order-2"
          >
            <Save className="w-4 h-4" />
            {todo ? 'Save' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TodoModal;