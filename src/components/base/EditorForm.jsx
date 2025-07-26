import React from 'react';

/**
 * Editor Form Component - Form wrapper with consistent styling
 */
const EditorForm = ({ children, onSubmit, className = '' }) => {
  return (
    <form 
      onSubmit={onSubmit} 
      className={`p-6 space-y-6 ${className}`}
      noValidate
    >
      {children}
    </form>
  );
};

export default EditorForm;