import React, { useState } from 'react';
import { Save, X, Tag } from 'lucide-react';
import { DEFAULT_CATEGORIES, validateSnippet } from '../../types/template.types.js';

const InsertEditor = ({ insert, folders = [], onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: insert?.name || '',
    content: insert?.content || '',
    category: insert?.category || 'General',
    folderId: insert?.folderId || 'moods',
    tags: insert?.tags || []
  });
  const [tagInput, setTagInput] = useState('');
  const [errors, setErrors] = useState([]);

  const handleSave = () => {
    const insertData = {
      id: insert?.id,
      ...formData,
      updatedAt: new Date().toISOString()
    };

    const validation = validateSnippet(insertData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setErrors([]);
    onSave(insertData);
  };

  const handleAddTag = () => {
    const newTag = tagInput.trim().toLowerCase();
    if (newTag && !formData.tags.includes(newTag)) {
      setFormData({
        ...formData,
        tags: [...formData.tags, newTag]
      });
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(tag => tag !== tagToRemove)
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

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-gray-900 rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-100">
            {insert ? 'Edit Insert' : 'Create New Insert'}
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
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save Insert
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
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Insert Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full p-3 border border-gray-600 bg-gray-800 text-gray-100 rounded-lg focus:ring-2 focus:ring-green-400 focus:border-transparent"
                placeholder="Enter insert name..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Folder
              </label>
              <select
                value={formData.folderId}
                onChange={(e) => setFormData({...formData, folderId: e.target.value})}
                className="w-full p-3 border border-gray-600 bg-gray-800 text-gray-100 rounded-lg focus:ring-2 focus:ring-green-400 focus:border-transparent"
              >
                {folders.filter(f => f.id !== 'root').map(folder => (
                  <option key={folder.id} value={folder.id}>{folder.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                className="w-full p-3 border border-gray-600 bg-gray-800 text-gray-100 rounded-lg focus:ring-2 focus:ring-green-400 focus:border-transparent"
              >
                {DEFAULT_CATEGORIES.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Tags
              </label>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleKeyPress}
                    className="flex-1 p-3 border border-gray-600 bg-gray-800 text-gray-100 rounded-lg focus:ring-2 focus:ring-green-400 focus:border-transparent"
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
                  {formData.tags.map((tag, index) => (
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
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Content
              </label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({...formData, content: e.target.value})}
                className="w-full h-48 p-3 border border-gray-600 bg-gray-800 text-gray-100 rounded-lg focus:ring-2 focus:ring-green-400 focus:border-transparent"
                placeholder="Enter insert content..."
              />
            </div>
          </div>

          {/* Preview */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-100 mb-3">Preview</h3>
              <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 min-h-48">
                <div className="space-y-2">
                  <div>
                    <span className="text-sm font-medium text-gray-300">Name: </span>
                    <span className="text-gray-100">{formData.name || 'Untitled Insert'}</span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-300">Category: </span>
                    <span className="text-gray-100">{formData.category}</span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-300">Tags: </span>
                    <div className="inline-flex flex-wrap gap-1 mt-1">
                      {formData.tags.map((tag, index) => (
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
              <h4 className="text-sm font-semibold text-blue-100 mb-2">💡 How to use inserts</h4>
              <p className="text-sm text-blue-200">
                Use inserts in templates with the syntax: <code className="bg-blue-800 px-1 rounded">{'{insert:tagname}'}</code>
              </p>
              <p className="text-sm text-blue-200 mt-1">
                For example: <code className="bg-blue-800 px-1 rounded">{'{insert:mood}'}</code> will show all inserts tagged with "mood"
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InsertEditor;