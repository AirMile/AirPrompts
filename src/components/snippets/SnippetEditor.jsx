import React, { useState, useEffect } from 'react';
import { Save, X, Tag } from 'lucide-react';
import { createSnippet, validateSnippet } from '../../types/template.types.js';
import FolderSelector from '../common/FolderSelector.jsx';

const SnippetEditor = ({ snippet, folders = [], onSave, onCancel }) => {
  const [formData, setFormData] = useState(() => {
    if (snippet) {
      return { ...snippet, tags: snippet.tags || [] };
    }
    return createSnippet();
  });
  
  const [tagInput, setTagInput] = useState('');
  const [errors, setErrors] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (snippet) {
      setFormData({ ...snippet, tags: snippet.tags || [] });
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
    
    const snippetData = {
      id: snippet?.id,
      ...formData,
      updatedAt: new Date().toISOString()
    };

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
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-gray-900 rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-100">
            {snippet ? 'Edit Snippet' : 'Create New Snippet'}
          </h2>
          <div className="flex gap-2">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-gray-300 border border-gray-600 rounded-lg hover:bg-gray-700 flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {isSubmitting ? 'Saving...' : 'Save Snippet'}
            </button>
          </div>
        </div>

        {errors.length > 0 && (
          <div className="mb-6 p-4 bg-red-900 border border-red-700 rounded-lg">
            <h3 className="text-red-100 font-medium mb-2">Please fix the following errors:</h3>
            <ul className="text-red-200 text-sm space-y-1">
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
              <label htmlFor="snippetName" className="block text-sm font-medium text-gray-300 mb-2">
                Snippet Name *
              </label>
              <input
                type="text"
                id="snippetName"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-600 bg-gray-800 text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                placeholder="Enter snippet name..."
                required
              />
            </div>

            <div>
              <label htmlFor="snippetDescription" className="block text-sm font-medium text-gray-300 mb-2">
                Description
              </label>
              <textarea
                id="snippetDescription"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="w-full h-24 p-3 border border-gray-600 bg-gray-800 text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                placeholder="Brief description..."
              />
            </div>

            <div>
              <label htmlFor="snippetFolder" className="block text-sm font-medium text-gray-300 mb-2">
                Folder
              </label>
              <FolderSelector
                id="snippetFolder"
                name="snippetFolder"
                folders={folders}
                selectedFolderId={formData.folderId}
                onFolderSelect={(folderId) => setFormData({...formData, folderId})}
                focusRingColor="blue"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
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
                    className="flex-1 p-3 border border-gray-600 bg-gray-800 text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                    placeholder="Add tags (press Enter or comma to add)..."
                  />
                  <button
                    onClick={handleAddTag}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <Tag className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {(formData.tags || []).map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-blue-900 text-blue-100 rounded-full text-sm"
                    >
                      {tag}
                      <button
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-1 text-blue-300 hover:text-blue-100"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>

                <div className="mt-2">
                  <p className="text-sm text-gray-400 mb-1">Common tags:</p>
                  <div className="flex flex-wrap gap-1">
                    {commonTags.map(tag => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => {
                          if (!(formData.tags || []).includes(tag)) {
                            setFormData(prev => ({
                              ...prev,
                              tags: [...prev.tags, tag]
                            }));
                          }
                        }}
                        className="px-2 py-1 bg-blue-800 text-blue-200 rounded text-xs hover:bg-blue-700 transition-colors"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="snippetContent" className="block text-sm font-medium text-gray-300 mb-2">
                Content *
              </label>
              <textarea
                id="snippetContent"
                name="content"
                value={formData.content}
                onChange={handleInputChange}
                className="w-full h-48 p-3 border border-gray-600 bg-gray-800 text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent"
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
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="enabled" className="ml-2 block text-sm text-gray-300">
                Enabled (snippet will be available for selection)
              </label>
            </div>
          </div>

          {/* Preview and Usage */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-100 mb-3">Preview</h3>
              <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 min-h-48">
                <div className="space-y-2">
                  <div>
                    <span className="text-sm font-medium text-gray-300">Name: </span>
                    <span className="text-gray-100">{formData.name || 'Untitled Snippet'}</span>
                  </div>
                  {formData.description && (
                    <div>
                      <span className="text-sm font-medium text-gray-300">Description: </span>
                      <span className="text-gray-200">{formData.description}</span>
                    </div>
                  )}
                  <div>
                    <span className="text-sm font-medium text-gray-300">Tags: </span>
                    <div className="inline-flex flex-wrap gap-1 mt-1">
                      {(formData.tags || []).map((tag, index) => (
                        <span key={index} className="px-2 py-1 bg-blue-900 text-blue-100 rounded text-xs">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="mt-4">
                    <span className="text-sm font-medium text-gray-300">Content:</span>
                    <div className="mt-2 p-3 bg-gray-900 rounded border border-gray-700">
                      <div className="text-gray-200 whitespace-pre-wrap">
                        {formData.content || 'No content yet...'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-blue-900 rounded-lg p-4 border border-blue-700">
              <h4 className="text-sm font-semibold text-blue-100 mb-2">💡 How to use snippets</h4>
              <div className="text-sm text-blue-200 space-y-2">
                <p>
                  <strong>Manual insertion:</strong> Use snippets in templates with: <code className="bg-blue-800 px-1 rounded">{'{{'}</code><code className="bg-blue-800 px-1 rounded">tagname</code><code className="bg-blue-800 px-1 rounded">{'}}'}</code>
                </p>
                <p>
                  For example: <code className="bg-blue-800 px-1 rounded">{'{{mood}}'}</code> will show all snippets tagged with "mood"
                </p>
                <p>
                  <strong>Auto-append:</strong> Snippets can also be automatically appended to templates based on matching tags
                </p>
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <h4 className="text-sm font-semibold text-gray-100 mb-2">📋 Snippet Features</h4>
              <ul className="text-sm text-gray-300 space-y-1">
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