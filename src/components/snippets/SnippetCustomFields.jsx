import React from 'react';

/**
 * Custom fields specific to the Snippet editor
 * Shows preview and usage information
 */
export const SnippetCustomFields = ({ formData }) => {
  return (
    <div className="space-y-4">
      {/* Preview */}
      <div>
        <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100 mb-3">
          Preview
        </h3>
        <div className="bg-secondary-50 dark:bg-secondary-700 rounded-lg p-4 border border-secondary-300 dark:border-secondary-600 min-h-48">
          <div className="text-secondary-800 dark:text-secondary-200 whitespace-pre-wrap">
            {formData.content || 'No content yet...'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SnippetCustomFields;
