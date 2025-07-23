import React, { useState } from 'react';
import { Tag } from 'lucide-react';
import { extractAllVariables } from '../../types/template.types.js';
import MultiSelectFolderSelector from '../shared/form/MultiSelectFolderSelector.jsx';
import { useItemColors } from '../../hooks/useItemColors.js';

const TemplateEditor = ({ template, folders = [], onSave, onCancel }) => {
  const { getColorClasses } = useItemColors();
  const [formData, setFormData] = useState({
    name: template?.name || '',
    description: template?.description || '',
    content: template?.content || '',
    folderIds: template?.folderIds || (template?.folderId ? [template.folderId] : []),
    snippetTags: template?.snippetTags || []
  });

  const { variables, snippetVariables } = extractAllVariables(formData.content);

  const handleSave = () => {
    const newTemplate = {
      // Only include ID for existing templates (updates)
      ...(template?.id && { id: template.id }),
      // API-compatible fields only
      name: formData.name,
      description: formData.description,
      content: formData.content,
      category: template?.category || formData.folderId || 'general',
      variables,
      favorite: template?.favorite || false,
      // Keep UI-specific fields separate for localStorage fallback
      folderIds: formData.folderIds,
      folderId: formData.folderIds[0] || 'general', // Backward compatibility
      snippetTags: formData.snippetTags,
      lastUsed: template?.lastUsed || new Date().toISOString()
    };
    onSave(newTemplate);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white dark:bg-secondary-800 rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-secondary-900 dark:text-secondary-100">
            {template?.id ? 'Edit Template' : 'Create New Template'}
          </h2>
          <div className="flex gap-2">
            <button
              onClick={onCancel}
              className="px-4 py-2 bg-secondary-200 dark:bg-secondary-600 hover:bg-secondary-300 dark:hover:bg-secondary-700 text-secondary-800 dark:text-secondary-100 border border-secondary-300 dark:border-secondary-600 rounded-lg transition-all duration-200"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className={`px-4 py-2 ${getColorClasses('template', 'button')} rounded-lg`}
            >
              Save Template
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="templateName" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                Template Name
              </label>
              <input
                type="text"
                id="templateName"
                name="templateName"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full p-3 border border-secondary-300 dark:border-secondary-600 bg-secondary-50 dark:bg-secondary-700 text-secondary-900 dark:text-secondary-100 rounded-lg focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-500 focus:border-primary-500 dark:focus:border-primary-500 transition-all duration-200"
                placeholder="Enter template name..."
              />
            </div>

            <div>
              <label htmlFor="templateDescription" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                Description
              </label>
              <textarea
                id="templateDescription"
                name="templateDescription"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full h-32 p-3 border border-secondary-300 dark:border-secondary-600 bg-secondary-50 dark:bg-secondary-700 text-secondary-900 dark:text-secondary-100 rounded-lg focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-500 focus:border-primary-500 dark:focus:border-primary-500 transition-all duration-200"
                placeholder="Brief description..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                Folder
              </label>
              <MultiSelectFolderSelector
                folders={folders}
                selectedFolderIds={formData.folderIds}
                onFoldersSelect={(folderIds) => setFormData({...formData, folderIds})}
                placeholder="Selecteer een of meerdere folders..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                Snippet Tags
              </label>
              <input
                type="text"
                value={formData.snippetTags.join(', ')}
                onChange={(e) => {
                  const tags = e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag);
                  setFormData({...formData, snippetTags: tags});
                }}
                className="w-full p-3 border border-secondary-300 dark:border-secondary-600 bg-secondary-50 dark:bg-secondary-700 text-secondary-900 dark:text-secondary-100 rounded-lg focus:ring-2 focus:ring-primary-400 dark:focus:ring-primary-400 focus:border-transparent"
                placeholder="Enter snippet tags separated by commas (e.g., enhancement, quality, technical)"
              />
              <p className="mt-1 text-sm text-secondary-600 dark:text-secondary-400">
                Only snippets with these tags will be shown when using this template
              </p>
            </div>

            <div>
              <label htmlFor="templateContent" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                Template Content
              </label>
              <textarea
                id="templateContent"
                name="templateContent"
                value={formData.content}
                onChange={(e) => setFormData({...formData, content: e.target.value})}
                className="w-full h-48 p-3 border border-secondary-300 dark:border-secondary-600 bg-secondary-50 dark:bg-secondary-700 text-secondary-900 dark:text-secondary-100 rounded-lg focus:ring-2 focus:ring-primary-400 dark:focus:ring-primary-400 focus:border-transparent font-mono text-sm"
                placeholder="Write your template here. Use {variable_name} for input fields and {{tagname}} for snippet dropdowns..."
              />
              <div className="text-sm text-secondary-600 dark:text-secondary-400 mt-2 space-y-1">
                <p>Use single curly braces {'{}'} to create input variables, like <code className="bg-secondary-200 dark:bg-secondary-700 px-1 rounded">{'{topic}'}</code> or <code className="bg-secondary-200 dark:bg-secondary-700 px-1 rounded">{'{audience}'}</code></p>
                <p>Use double curly braces for snippet dropdowns: <code className="bg-secondary-200 dark:bg-secondary-700 px-1 rounded">{'{{tagname}}'}</code></p>
                <p>Example: <code className="bg-secondary-200 dark:bg-secondary-700 px-1 rounded">{'{{mood}}'}</code> shows all snippets tagged with "mood"</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100 mb-3">Preview</h3>
              <div className="bg-secondary-50 dark:bg-secondary-700 rounded-lg p-4 border border-secondary-300 dark:border-secondary-600">
                <div className="prose prose-sm max-w-none text-secondary-900 dark:text-secondary-100">
                  {formData.content.split(/(\{[^}]+\})/).map((part, index) => (
                    <span key={index}>
                      {part.match(/\{[^}]+\}/) ? (
                        <span 
                          className={`px-2 py-1 rounded text-sm font-medium ${
                            part.includes('insert:') 
                              ? getColorClasses('snippet', 'tag')
                              : getColorClasses('template', 'tag')
                          }`}
                        >
                          {part}
                        </span>
                      ) : (
                        part
                      )}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {variables.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100 mb-3">
                  Variables Found ({variables.length})
                </h3>
                <div className="space-y-2">
                  {variables.map((variable, index) => (
                    <div key={index} className={`flex items-center gap-2 p-2 rounded-lg ${getColorClasses('template', 'background')}`}>
                      <Tag className={`w-4 h-4 ${getColorClasses('template', 'icon')}`} />
                      <span className="text-sm font-medium text-secondary-900 dark:text-secondary-100">{variable}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {snippetVariables.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100 mb-3">
                  Insert Variables Found ({snippetVariables.length})
                </h3>
                <div className="space-y-2">
                  {snippetVariables.map((snippetVar, index) => (
                    <div key={index} className={`flex items-center gap-2 p-2 rounded-lg ${getColorClasses('snippet', 'background')}`}>
                      <Tag className={`w-4 h-4 ${getColorClasses('snippet', 'icon')}`} />
                      <span className="text-sm font-medium text-secondary-900 dark:text-secondary-100">
                        {snippetVar.placeholder} → tag: "{snippetVar.tag}"
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplateEditor;
