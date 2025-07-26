import React from 'react';
import { Save, X, RefreshCw } from 'lucide-react';

/**
 * Editor Actions Component - Consistent action buttons for editors
 */
const EditorActions = ({ 
  onCancel, 
  onReset,
  isLoading, 
  isDirty,
  colorClasses,
  isEdit = false 
}) => {
  return (
    <div className="flex items-center justify-between pt-6 border-t border-secondary-200 dark:border-secondary-700">
      <button
        type="button"
        onClick={onReset}
        disabled={!isDirty || isLoading}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${colorClasses.ghost}`}
      >
        <RefreshCw className="w-4 h-4" />
        Reset
      </button>
      
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-secondary-200 dark:bg-secondary-700 text-secondary-700 dark:text-secondary-200 rounded-lg hover:bg-secondary-300 dark:hover:bg-secondary-600 transition-colors disabled:opacity-50"
        >
          <X className="w-4 h-4" />
          Cancel
        </button>
        
        <button
          type="submit"
          disabled={isLoading || !isDirty}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${colorClasses.primary}`}
        >
          {isLoading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              {isEdit ? 'Update' : 'Create'}
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default EditorActions;