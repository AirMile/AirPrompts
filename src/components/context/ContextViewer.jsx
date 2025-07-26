import React from 'react';
import MarkdownRenderer from '../common/MarkdownRenderer';

/**
 * Context viewer component for view mode
 */
const ContextViewer = ({ content, contentMeasureRef }) => {
  if (!content?.trim()) {
    return null;
  }

  return (
    <div 
      ref={contentMeasureRef}
      className="px-12 py-4 h-full overflow-y-auto"
    >
      <MarkdownRenderer content={content} />
    </div>
  );
};

export default ContextViewer;