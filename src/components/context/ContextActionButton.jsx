import React from 'react';
import { PencilIcon, EyeIcon } from '@heroicons/react/24/outline';
import { Plus } from 'lucide-react';

/**
 * Context action button component (Edit/View/Add)
 */
const ContextActionButton = ({ 
  hasDescription, 
  isEditing, 
  onToggleEdit, 
  onStartEdit 
}) => {
  const handleClick = hasDescription ? onToggleEdit : onStartEdit;
  
  const getTitle = () => {
    if (isEditing) return "Back to view";
    if (hasDescription) return "Edit";
    return "Add context";
  };

  const getIcon = () => {
    if (hasDescription) {
      return isEditing ? (
        <EyeIcon className="w-4 h-4" />
      ) : (
        <PencilIcon className="w-4 h-4" />
      );
    }
    return <Plus className="w-4 h-4" />;
  };

  return (
    <button
      onClick={handleClick}
      className="p-2 text-secondary-600 dark:text-secondary-400 hover:text-secondary-900 dark:hover:text-secondary-100 hover:bg-secondary-100 dark:hover:bg-secondary-800 rounded-lg transition-colors"
      title={getTitle()}
    >
      {getIcon()}
    </button>
  );
};

export default ContextActionButton;