import React, { useState, useEffect } from 'react';
import { BaseEditor } from '../base/BaseEditor';
import { templateSchema } from '../../schemas/entitySchemas';
import { extractAllVariables } from '../../types/template.types';
import { Tag } from 'lucide-react';
import { useItemColors } from '../../hooks/useItemColors';

// Custom component for template preview
const TemplatePreview = ({ formData }) => {
  const { getColorClasses } = useItemColors();
  const { variables, snippetVariables } = extractAllVariables(formData.content || '');

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100 mb-3">Preview</h3>
        <div className="bg-secondary-50 dark:bg-secondary-700 rounded-lg p-4 border border-secondary-300 dark:border-secondary-600">
          <div className="prose prose-sm max-w-none text-secondary-900 dark:text-secondary-100">
            {(formData.content || '').split(/(\{[^}]+\})/).map((part, index) => (
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
  );
};

const TemplateEditorV2 = ({ template, folders = [], onSave, onCancel }) => {
  // State to track the current form data for preview
  const [currentFormData, setCurrentFormData] = useState(() => {
    if (template) {
      return {
        ...template,
        folderIds: template.folderIds || (template.folderId ? [template.folderId] : []),
        snippetTags: template.snippetTags || []
      };
    }
    return {
      name: '',
      description: '',
      content: '',
      folderIds: [],
      snippetTags: []
    };
  });

  const handleSave = (formData) => {
    const { variables } = extractAllVariables(formData.content);
    
    const newTemplate = {
      // Only include ID for existing templates (updates)
      ...(template?.id && { id: template.id }),
      // API-compatible fields only
      name: formData.name,
      description: formData.description,
      content: formData.content,
      category: template?.category || formData.folderIds?.[0] || 'general',
      variables,
      favorite: template?.favorite || false,
      // Keep UI-specific fields separate for localStorage fallback
      folderIds: formData.folderIds || [],
      folderId: formData.folderIds?.[0] || 'general', // Backward compatibility
      snippetTags: formData.snippetTags || [],
      lastUsed: template?.lastUsed || new Date().toISOString()
    };
    
    return onSave(newTemplate);
  };

  // Transform template data for form
  const entityData = template ? {
    ...template,
    folderIds: template.folderIds || (template.folderId ? [template.folderId] : []),
    snippetTags: template.snippetTags || []
  } : null;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <BaseEditor
            entity={entityData}
            entityType="template"
            schema={templateSchema}
            onSave={handleSave}
            onCancel={onCancel}
            folders={folders}
            onFormChange={setCurrentFormData}
          />
        </div>
        <div className="lg:sticky lg:top-6 lg:self-start">
          <div className="bg-white dark:bg-secondary-800 rounded-xl shadow-lg p-6">
            <TemplatePreview formData={currentFormData} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplateEditorV2;