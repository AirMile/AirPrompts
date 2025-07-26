import React, { useState } from 'react';
import { BaseEditor } from '../base/BaseEditor';
import { snippetSchema } from '../../schemas/entitySchemas';
import { createSnippet, validateSnippet } from '../../types/template.types';
import { useItemColors } from '../../hooks/useItemColors';

// Custom preview component for snippets
const SnippetPreview = ({ formData }) => {
  const { getColorClasses } = useItemColors();

  return (
    <div className="space-y-4">
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
                <span className="text-sm font-medium text-secondary-700 dark:text-secondary-300">Description: </span>
                <span className="text-secondary-900 dark:text-secondary-100">{formData.description}</span>
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
            {formData.enabled !== undefined && (
              <div className="mt-2">
                <span className="text-sm font-medium text-secondary-700 dark:text-secondary-300">Status: </span>
                <span className={`text-sm ${formData.enabled ? 'text-success-600 dark:text-success-400' : 'text-secondary-500'}`}>
                  {formData.enabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

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

const SnippetEditorV2 = ({ snippet, folders = [], onSave, onCancel }) => {
  const [currentFormData, setCurrentFormData] = useState(() => {
    if (snippet) {
      return { 
        ...snippet, 
        tags: snippet.tags || [],
        favorite: snippet.favorite || false,
        description: snippet.description || '',
        enabled: snippet.enabled !== false,
        folderIds: snippet.folderIds || (snippet.folderId ? [snippet.folderId] : [])
      };
    }
    const newSnippet = createSnippet();
    return {
      ...newSnippet,
      folderIds: []
    };
  });

  const handleSave = async (formData) => {
    // Prepare data for save handler
    const snippetData = {
      ...formData,
      updated_at: new Date().toISOString(),
      // Ensure all required API fields are present
      tags: formData.tags || [],
      favorite: formData.favorite || false,
      enabled: formData.enabled !== false,
      // Include both for backward compatibility
      folderIds: formData.folderIds,
      folderId: formData.folderIds?.[0] || 'snippets'
    };

    // Include ID for updates
    if (snippet?.id) {
      snippetData.id = snippet.id;
    }

    const validation = validateSnippet(snippetData);
    if (!validation.isValid) {
      throw new Error(validation.errors.join(', '));
    }

    return onSave(snippetData);
  };

  // Transform snippet data for form
  const entityData = snippet ? {
    ...snippet,
    folderIds: snippet.folderIds || (snippet.folderId ? [snippet.folderId] : []),
    tags: snippet.tags || [],
    enabled: snippet.enabled !== false,
    favorite: snippet.favorite || false
  } : null;

  return (
    <div className="max-w-6xl mx-auto p-6 animate-fade-in">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <BaseEditor
            entity={entityData}
            entityType="snippet"
            schema={snippetSchema}
            onSave={handleSave}
            onCancel={onCancel}
            folders={folders}
            onFormChange={setCurrentFormData}
          />
        </div>
        <div className="lg:sticky lg:top-6 lg:self-start">
          <div className="bg-white dark:bg-secondary-800 rounded-xl shadow-lg border border-secondary-200 dark:border-secondary-700 animate-slide-in p-6">
            <SnippetPreview formData={currentFormData} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SnippetEditorV2;