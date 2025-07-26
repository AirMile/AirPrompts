import React from 'react';
import { useItemColors } from '../../hooks/useItemColors.js';

/**
 * Custom fields specific to the Snippet editor
 * Shows preview and usage information
 */
export const SnippetCustomFields = ({ formData }) => {
  const { getColorClasses } = useItemColors();

  return (
    <div className="space-y-4">
      {/* Preview */}
      <div>
        <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100 mb-3">Preview</h3>
        <div className="bg-secondary-50 dark:bg-secondary-700 rounded-lg p-4 border border-secondary-300 dark:border-secondary-600 min-h-48">
          <div className="space-y-2">
            <div>
              <span className="text-sm font-medium text-secondary-700 dark:text-secondary-300">Name: </span>
              <span className="text-secondary-900 dark:text-secondary-100">{formData.name || 'Untitled Snippet'}</span>
            </div>
            {formData.description && (
              <div>
                <span className="text-sm font-medium text-secondary-300">Description: </span>
                <span className="text-secondary-200">{formData.description}</span>
              </div>
            )}
            <div>
              <span className="text-sm font-medium text-secondary-700 dark:text-secondary-300">Tags: </span>
              <div className="inline-flex flex-wrap gap-1 mt-1">
                {(formData.tags || []).map((tag, index) => (
                  <span key={index} className={`px-2 py-1 ${getColorClasses('snippet', 'tag')} rounded text-xs`}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            <div className="mt-4">
              <span className="text-sm font-medium text-secondary-700 dark:text-secondary-300">Content:</span>
              <div className="mt-2 p-3 bg-white dark:bg-secondary-800 rounded border border-secondary-300 dark:border-secondary-600">
                <div className="text-secondary-800 dark:text-secondary-200 whitespace-pre-wrap">
                  {formData.content || 'No content yet...'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* How to use snippets */}
      <div className="bg-primary-50 dark:bg-primary-900 rounded-lg p-4 border border-primary-300 dark:border-primary-700">
        <h4 className="text-sm font-semibold text-primary-900 dark:text-primary-100 mb-2">💡 How to use snippets</h4>
        <div className="text-sm text-primary-800 dark:text-primary-200 space-y-2">
          <p>
            <strong>Manual insertion:</strong> Use snippets in templates with: <code className="bg-warning-200 dark:bg-warning-800 px-1 rounded">{'{{'}</code><code className="bg-warning-200 dark:bg-warning-800 px-1 rounded">tagname</code><code className="bg-warning-200 dark:bg-warning-800 px-1 rounded">{'}}'}</code>
          </p>
          <p>
            For example: <code className="bg-warning-200 dark:bg-warning-800 px-1 rounded">{'{{mood}}'}</code> will show all snippets tagged with "mood"
          </p>
          <p>
            <strong>Auto-append:</strong> Snippets can also be automatically appended to templates based on matching tags
          </p>
        </div>
      </div>

      {/* Snippet Features */}
      <div className="bg-secondary-50 dark:bg-secondary-700 rounded-lg p-4 border border-secondary-300 dark:border-secondary-600">
        <h4 className="text-sm font-semibold text-secondary-900 dark:text-secondary-100 mb-2">📋 Snippet Features</h4>
        <ul className="text-sm text-secondary-700 dark:text-secondary-300 space-y-1">
          <li>• Snippets replace both the old "addons" and "inserts" systems</li>
          <li>• Use tags to organize snippets by purpose, style, or context</li>
          <li>• Multiple snippets can be selected and added to any template</li>
          <li>• Tags help users find relevant snippets for specific use cases</li>
          <li>• Can be used both manually (with {'{{}}'} syntax) and automatically</li>
        </ul>
      </div>
    </div>
  );
};

export default SnippetCustomFields;