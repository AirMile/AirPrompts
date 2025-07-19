import React, { useState, useEffect } from 'react';
import { createAddon, validateAddon } from '../../types/template.types';

const AddonEditor = ({ addon, onSave, onCancel, folders }) => {
  const [formData, setFormData] = useState(() => {
    if (addon) {
      return { ...addon };
    }
    return createAddon();
  });
  
  const [errors, setErrors] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (addon) {
      setFormData({ ...addon });
    }
  }, [addon]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleTagChange = (tagText) => {
    const tags = tagText.split(',').map(tag => tag.trim()).filter(tag => tag);
    setFormData(prev => ({
      ...prev,
      tags: tags
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const validation = validateAddon(formData);
    
    if (!validation.isValid) {
      setErrors(validation.errors);
      setIsSubmitting(false);
      return;
    }

    setErrors([]);
    
    try {
      const addonToSave = {
        ...formData,
        updatedAt: new Date().toISOString()
      };
      
      await onSave(addonToSave);
    } catch (error) {
      setErrors([error.message || 'An error occurred while saving']);
    } finally {
      setIsSubmitting(false);
    }
  };

  const commonTags = [
    'enhancement', 'formatting', 'quality', 'accessibility', 'technical', 'analysis', 
    'urgency', 'financial', 'creativity', 'productivity', 'context', 'detailed', 
    'structured', 'guide', 'examples', 'practical', 'standards', 'professional', 
    'beginner', 'simple', 'advanced', 'expert', 'comparison', 'balanced', 
    'quick', 'immediate', 'budget', 'cost-effective', 'innovative', 'unique', 
    'risk', 'planning', 'actionable', 'results'
  ];

  return (
    <div className="bg-gray-900 rounded-lg shadow-lg p-6 max-w-2xl mx-auto border border-orange-500">
      <h2 className="text-2xl font-bold mb-6 text-gray-100">
        {addon ? 'Edit Addon' : 'Create New Addon'}
      </h2>

      {errors.length > 0 && (
        <div className="mb-4 p-3 bg-red-900 border border-red-600 rounded-md">
          <ul className="text-red-200 text-sm">
            {errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
            Name *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-600 bg-gray-800 text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            placeholder="Enter addon name"
            required
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-2">
            Description
          </label>
          <input
            type="text"
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-600 bg-gray-800 text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            placeholder="Brief description of the addon"
          />
        </div>

        <div>
          <label htmlFor="tags" className="block text-sm font-medium text-gray-300 mb-2">
            Tags *
          </label>
          <input
            type="text"
            id="tags"
            name="tags"
            value={formData.tags ? formData.tags.join(', ') : ''}
            onChange={(e) => handleTagChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-600 bg-gray-800 text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            placeholder="Enter tags separated by commas (e.g., enhancement, formatting, quality)"
            required
          />
          <div className="mt-2 text-sm text-gray-400">
            <p className="mb-1">Common tags:</p>
            <div className="flex flex-wrap gap-1">
              {commonTags.map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => {
                    const currentTags = formData.tags || [];
                    if (!currentTags.includes(tag)) {
                      handleTagChange([...currentTags, tag].join(', '));
                    }
                  }}
                  className="px-2 py-1 bg-orange-800 text-orange-200 rounded text-xs hover:bg-orange-700 transition-colors"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div>
          <label htmlFor="folderId" className="block text-sm font-medium text-gray-300 mb-2">
            Folder
          </label>
          <select
            id="folderId"
            name="folderId"
            value={formData.folderId}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-600 bg-gray-800 text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            {folders.map(folder => (
              <option key={folder.id} value={folder.id}>
                {folder.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="content" className="block text-sm font-medium text-gray-300 mb-2">
            Content *
          </label>
          <textarea
            id="content"
            name="content"
            value={formData.content}
            onChange={handleInputChange}
            rows={6}
            className="w-full px-3 py-2 border border-gray-600 bg-gray-800 text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            placeholder="Enter the addon content that will be added to templates"
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
            className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
          />
          <label htmlFor="enabled" className="ml-2 block text-sm text-gray-300">
            Enabled (addon will be available for selection)
          </label>
        </div>

        <div className="bg-orange-900 p-4 rounded-md">
          <h3 className="text-sm font-medium text-gray-200 mb-2">How Addons Work:</h3>
          <ul className="text-sm text-gray-300 space-y-1">
            <li>• Addons are filtered by tags when creating templates/workflows</li>
            <li>• Multiple addons can be selected and added to any template</li>
            <li>• Addon content is appended to the template content</li>
            <li>• Use tags to organize addons by purpose, style, or context</li>
            <li>• Tags help users find relevant addons for specific use cases</li>
          </ul>
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-gray-300 bg-gray-700 rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : 'Save Addon'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddonEditor;