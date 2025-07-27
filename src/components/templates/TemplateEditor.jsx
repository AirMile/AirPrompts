import React, { useCallback } from 'react';
import { BaseEditor } from '../base/BaseEditor';
import { templateSchema } from '../../schemas/entitySchemas';
import { extractAllVariables } from '../../types/template.types.js';
import TemplateCustomFields from './TemplateCustomFields';

/**
 * Template Editor using BaseEditor pattern
 * Handles template creation and editing with proper validation
 */
const TemplateEditor = ({ template, folders = [], onSave, onCancel }) => {
  // Transform template data for save
  const handleSave = useCallback((formData) => {
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
    
    onSave(newTemplate);
  }, [template, onSave]);

  // Prepare initial data with defaults
  const initialData = {
    name: template?.name || '',
    description: template?.description || '',
    content: template?.content || '',
    folderIds: template?.folderIds || (template?.folderId ? [template.folderId] : []),
    snippetTags: template?.snippetTags || []
  };

  return (
    <BaseEditor
      entity={template}
      initialData={initialData}
      entityType="template"
      schema={templateSchema}
      onSave={handleSave}
      onCancel={onCancel}
      folders={folders}
      customFields={<TemplateCustomFields />}
      twoColumn={true}
    />
  );
};

export default TemplateEditor;
