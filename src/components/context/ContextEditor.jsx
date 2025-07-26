import React from 'react';

/**
 * Context editor component for edit mode
 */
const ContextEditor = ({ 
  folder, 
  editValue, 
  editorRef, 
  onInputChange, 
  onBlur, 
  onScrollToCursor 
}) => {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      setTimeout(onScrollToCursor, 50);
    }
  };

  const placeholder = folder?.id === 'root' 
    ? 'Add general context, notes and links...' 
    : `Add context, notes and links for "${folder?.name}"...`;

  return (
    <div className="px-12 py-4 h-full">
      <textarea
        ref={editorRef}
        value={editValue}
        onChange={(e) => onInputChange(e.target.value)}
        onBlur={onBlur}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="w-full h-full p-3 bg-transparent border-none outline-none resize-none text-secondary-900 dark:text-secondary-100 focus:ring-0 focus:border-none focus:outline-none context-textarea"
        style={{
          fontSize: '14px',
          lineHeight: '20px',
          fontFamily: 'Consolas, Monaco, "Courier New", monospace',
          minHeight: '200px'
        }}
      />
    </div>
  );
};

export default ContextEditor;