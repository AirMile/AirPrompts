import React from 'react';

/**
 * Editor Layout Component - Consistent layout wrapper for editors
 */
const EditorLayout = ({ children, className = '' }) => {
  return (
    <div className={`max-w-4xl mx-auto p-6 ${className}`}>
      <div className="bg-white dark:bg-secondary-800 rounded-xl shadow-lg p-6">
        {children}
      </div>
    </div>
  );
};

export default EditorLayout;