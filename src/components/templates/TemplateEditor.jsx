import React, { useState } from 'react';
import { Tag } from 'lucide-react';
import { extractAllVariables } from '../../types/template.types.js';
import FolderSelector from '../common/FolderSelector.jsx';

const TemplateEditor = ({ template, folders = [], onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: template?.name || '',
    description: template?.description || '',
    content: template?.content || '',
    folderId: template?.folderId || 'general'
  });

  const { variables, snippetVariables } = extractAllVariables(formData.content);

  const handleSave = () => {
    const newTemplate = {
      id: template?.id || Date.now(),
      ...formData,
      variables,
      lastUsed: template?.lastUsed || new Date().toISOString(),
      favorite: template?.favorite || false
    };
    onSave(newTemplate);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-gray-900 rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-100">
            {template ? 'Edit Template' : 'Create New Template'}
          </h2>
          <div className="flex gap-2">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-gray-300 border border-gray-600 rounded-lg hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Save Template
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="templateName" className="block text-sm font-medium text-gray-300 mb-2">
                Template Name
              </label>
              <input
                type="text"
                id="templateName"
                name="templateName"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full p-3 border border-gray-600 bg-gray-800 text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                placeholder="Enter template name..."
              />
            </div>

            <div>
              <label htmlFor="templateDescription" className="block text-sm font-medium text-gray-300 mb-2">
                Description
              </label>
              <textarea
                id="templateDescription"
                name="templateDescription"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full h-32 p-3 border border-gray-600 bg-gray-800 text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                placeholder="Brief description..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Folder
              </label>
              <FolderSelector
                folders={folders}
                selectedFolderId={formData.folderId}
                onFolderSelect={(folderId) => setFormData({...formData, folderId})}
                focusRingColor="blue"
              />
            </div>


            <div>
              <label htmlFor="templateContent" className="block text-sm font-medium text-gray-300 mb-2">
                Template Content
              </label>
              <textarea
                id="templateContent"
                name="templateContent"
                value={formData.content}
                onChange={(e) => setFormData({...formData, content: e.target.value})}
                className="w-full h-48 p-3 border border-gray-600 bg-gray-800 text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent font-mono text-sm"
                placeholder="Write your template here. Use {variable_name} for input fields..."
              />
              <div className="text-sm text-gray-400 mt-2 space-y-1">
                <p>Use curly braces {'{}'} to create input variables, like {'{topic}'} or {'{audience}'}</p>
                <p>Use insert syntax for dropdowns: <code className="bg-gray-700 px-1 rounded">{'{insert:tagname}'}</code></p>
                <p>Example: <code className="bg-gray-700 px-1 rounded">{'{insert:mood}'}</code> shows all inserts tagged with "mood"</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-100 mb-3">Preview</h3>
              <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <div className="prose prose-sm max-w-none">
                  {formData.content.split(/(\{[^}]+\})/).map((part, index) => (
                    <span key={index}>
                      {part.match(/\{[^}]+\}/) ? (
                        <span 
                          className={`px-2 py-1 rounded text-sm font-medium ${
                            part.includes('insert:') 
                              ? 'bg-purple-100 text-purple-800' 
                              : 'bg-blue-100 text-blue-800'
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
                <h3 className="text-lg font-semibold text-gray-100 mb-3">
                  Variables Found ({variables.length})
                </h3>
                <div className="space-y-2">
                  {variables.map((variable, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-blue-900 rounded-lg">
                      <Tag className="w-4 h-4 text-blue-300" />
                      <span className="text-sm font-medium text-blue-100">{variable}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {snippetVariables.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-100 mb-3">
                  Insert Variables Found ({snippetVariables.length})
                </h3>
                <div className="space-y-2">
                  {snippetVariables.map((snippetVar, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-purple-900 rounded-lg">
                      <Tag className="w-4 h-4 text-purple-300" />
                      <span className="text-sm font-medium text-purple-100">
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
