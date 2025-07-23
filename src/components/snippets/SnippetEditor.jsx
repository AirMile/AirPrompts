import React, { useState, useEffect } from 'react';
import { Save, X, Tag } from 'lucide-react';
import { createSnippet, validateSnippet } from '../../types/template.types.js';
import MultiSelectFolderSelector from '../shared/form/MultiSelectFolderSelector.jsx';
import { useItemColors } from '../../hooks/useItemColors.js';

const SnippetEditor = ({ snippet, folders = [], onSave, onCancel }) => {
  const { getColorClasses } = useItemColors();
  const [formData, setFormData] = useState(() => {
    if (snippet) {
      return { 
        ...snippet, 
        tags: snippet.tags || [],
        favorite: snippet.favorite || false,
        description: snippet.description || '', // Ensure controlled input
        // Support both old folderId and new folderIds
        folderIds: snippet.folderIds || (snippet.folderId ? [snippet.folderId] : ['snippets'])
      };
    }
    const newSnippet = createSnippet();
    return {
      ...newSnippet,
      folderIds: [newSnippet.folderId || 'snippets']
    };
  });
  
  const [tagInput, setTagInput] = useState('');
  const [errors, setErrors] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (snippet) {
      setFormData({ 
        ...snippet, 
        tags: snippet.tags || [],
        favorite: snippet.favorite || false,
        description: snippet.description || '', // Ensure controlled input
        // Support both old folderId and new folderIds
        folderIds: snippet.folderIds || (snippet.folderId ? [snippet.folderId] : ['snippets'])
      });
    }
  }, [snippet]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    
    // Prepare data for save handler
    const snippetData = {
      ...formData,
      updated_at: new Date().toISOString(),
      // Ensure all required API fields are present
      tags: formData.tags || [],
      favorite: formData.favorite || false,
      // Include both for backward compatibility
      folderIds: formData.folderIds,
      folderId: formData.folderIds?.[0] || 'snippets'
    };

    // Include ID for updates (createSaveHandler needs it to determine update vs create)
    if (snippet?.id) {
      snippetData.id = snippet.id;
    }

    const validation = validateSnippet(snippetData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      setIsSubmitting(false);
      return;
    }

    setErrors([]);
    
    try {
      await onSave(snippetData);
    } catch (error) {
      setErrors([error.message || 'An error occurred while saving']);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddTag = () => {
    const newTag = tagInput.trim().toLowerCase();
    if (newTag && !(formData.tags || []).includes(newTag)) {
      setFormData({
        ...formData,
        tags: [...(formData.tags || []), newTag]
      });
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData({
      ...formData,
      tags: (formData.tags || []).filter(tag => tag !== tagToRemove)
    });
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    } else if (e.key === ',' || e.key === ' ') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const commonTags = [
    'enhancement', 'formatting', 'quality', 'accessibility', 'technical', 'analysis', 
    'urgency', 'financial', 'creativity', 'productivity', 'context', 'detailed', 
    'structured', 'guide', 'examples', 'practical', 'standards', 'professional', 
    'beginner', 'simple', 'advanced', 'expert', 'comparison', 'balanced', 
    'quick', 'immediate', 'budget', 'cost-effective', 'innovative', 'unique', 
    'risk', 'planning', 'actionable', 'results', 'mood', 'tone', 'style'
  ];

  return (
    <div className="max-w-6xl mx-auto p-6 animate-fade-in">
      <div className="bg-white dark:bg-secondary-800 rounded-xl shadow-lg border border-secondary-200 dark:border-secondary-700 animate-slide-in p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-secondary-900 dark:text-secondary-100">
            {snippet?.id ? 'Edit Snippet' : 'Create New Snippet'}
          </h2>
          <div className="flex gap-2">
            <button
              onClick={onCancel}
              className="px-4 py-2 bg-secondary-200 dark:bg-secondary-600 hover:bg-secondary-300 dark:hover:bg-secondary-700 text-secondary-800 dark:text-secondary-100 font-medium rounded-lg transition-all duration-200 focus-visible flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSubmitting}
              className={`px-4 py-2 ${getColorClasses('snippet', 'button')} font-medium rounded-lg transition-all duration-200 focus-visible disabled:opacity-50 flex items-center gap-2`}
            >
              {isSubmitting ? (
                <div className="loading-spinner" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {isSubmitting ? 'Saving...' : 'Save Snippet'}
            </button>
          </div>
        </div>

        {errors.length > 0 && (
          <div className="mb-6 p-4 bg-danger-50 dark:bg-danger-900 border border-danger-300 dark:border-danger-700 rounded-lg">
            <h3 className="text-danger-800 dark:text-danger-100 font-medium mb-2">Please fix the following errors:</h3>
            <ul className="text-danger-700 dark:text-danger-200 text-sm space-y-1">
              {errors.map((error, index) => (
                <li key={index}>• {error}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Form Fields */}
          <div className="space-y-4">
            <div>
              <label htmlFor="snippetName" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                Snippet Name *
              </label>
              <input
                type="text"
                id="snippetName"
                name="name"
                value={formData.name || ''}
                onChange={handleInputChange}
                className="w-full p-3 border border-secondary-300 dark:border-secondary-600 bg-secondary-50 dark:bg-secondary-700 text-secondary-900 dark:text-secondary-100 rounded-lg focus:ring-2 focus:ring-warning-500 focus:border-warning-500 transition-all duration-200"
                placeholder="Enter snippet name..."
                required
              />
            </div>

            <div>
              <label htmlFor="snippetDescription" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                Description
              </label>
              <textarea
                id="snippetDescription"
                name="description"
                value={formData.description || ''}
                onChange={handleInputChange}
                className="w-full h-24 p-3 border border-secondary-300 dark:border-secondary-600 bg-secondary-50 dark:bg-secondary-700 text-secondary-900 dark:text-secondary-100 rounded-lg focus:ring-2 focus:ring-warning-500 focus:border-warning-500 transition-all duration-200"
                placeholder="Brief description..."
              />
            </div>

            <div>
              <label htmlFor="snippetFolder" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                Folders
              </label>
              <MultiSelectFolderSelector
                folders={folders}
                selectedFolderIds={formData.folderIds}
                onFoldersSelect={(folderIds) => setFormData({...formData, folderIds})}
                placeholder="Selecteer folders..."
              />
            </div>

            <div>
              <label className="flex items-center text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                <input
                  type="checkbox"
                  name="favorite"
                  checked={formData.favorite || false}
                  onChange={handleInputChange}
                  className="mr-2 h-4 w-4 text-primary-600 bg-white dark:bg-secondary-700 border-secondary-300 dark:border-secondary-600 rounded focus:ring-warning-400"
                />
                Mark as Favorite
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                Tags *
              </label>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    id="snippetTags"
                    name="snippetTags"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleKeyPress}
                    className="flex-1 p-3 border border-secondary-300 dark:border-secondary-600 bg-secondary-50 dark:bg-secondary-700 text-secondary-900 dark:text-secondary-100 rounded-lg focus:ring-2 focus:ring-warning-500 focus:border-warning-500 transition-all duration-200"
                    placeholder="Add tags (press Enter or comma to add)..."
                  />
                  <button
                    onClick={handleAddTag}
                    className="px-3 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-all duration-200 focus-visible"
                  >
                    <Tag className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {(formData.tags || []).map((tag, index) => (
                    <span
                      key={index}
                      className={`inline-flex items-center gap-1 px-3 py-1 ${getColorClasses('snippet', 'tag')} rounded-full text-sm`}
                    >
                      {tag}
                      <button
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-1 text-primary-600 dark:text-primary-300 hover:text-primary-800 dark:hover:text-primary-100"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>

                <div className="mt-2">
                  <p className="text-sm text-secondary-600 dark:text-secondary-400 mb-1">Common tags:</p>
                  <div className="flex flex-wrap gap-1">
                    {commonTags.map(tag => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => {
                          if (!(formData.tags || []).includes(tag)) {
                            setFormData(prev => ({
                              ...prev,
                              tags: [...(prev.tags || []), tag]
                            }));
                          }
                        }}
                        className={`px-2 py-1 ${getColorClasses('snippet', 'tag')} rounded text-xs hover:bg-warning-200 dark:hover:bg-warning-700 transition-colors`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="snippetContent" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                Content *
              </label>
              <textarea
                id="snippetContent"
                name="content"
                value={formData.content || ''}
                onChange={handleInputChange}
                className="w-full h-48 p-3 border border-secondary-300 dark:border-secondary-600 bg-secondary-50 dark:bg-secondary-700 text-secondary-900 dark:text-secondary-100 rounded-lg focus:ring-2 focus:ring-warning-500 focus:border-warning-500 transition-all duration-200"
                placeholder="Enter snippet content..."
                required
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="enabled"
                name="enabled"
                checked={formData.enabled}
                onChange={handleInputChange}
                className="h-4 w-4 text-primary-600 focus:ring-warning-500 border-secondary-300 rounded"
              />
              <label htmlFor="enabled" className="ml-2 block text-sm text-secondary-300">
                Enabled (snippet will be available for selection)
              </label>
            </div>
          </div>

          {/* Preview and Usage */}
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
        </div>
      </div>
    </div>
  );
};

export default SnippetEditor;