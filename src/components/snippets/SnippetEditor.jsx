import React, { useCallback } from 'react';
import { BaseEditor } from '../base/BaseEditor';
import { snippetSchema } from '../../schemas/entitySchemas';
import { createSnippet } from '../../types/template.types.js';
import SnippetCustomFields from './SnippetCustomFields';
import IntelligentTagsField from '../base/IntelligentTagsField';

/**
 * Snippet Editor using BaseEditor pattern
 * Handles snippet creation and editing with proper validation
 */
const SnippetEditor = ({ snippet, folders = [], onSave, onCancel }) => {
  // Transform snippet data for save
  const handleSave = useCallback(
    (formData) => {
      const snippetData = {
        ...formData,
        updated_at: new Date().toISOString(),
        // Ensure all required API fields are present
        tags: formData.tags || [],
        favorite: formData.favorite || false,
        enabled: formData.enabled !== false, // Default to true
        // Include both for backward compatibility
        folderIds: formData.folderIds || [],
        folderId: formData.folderIds?.[0] || 'snippets',
      };

      // Include ID for updates
      if (snippet?.id) {
        snippetData.id = snippet.id;
      }

      onSave(snippetData);
    },
    [snippet, onSave]
  );

  // Prepare initial data with defaults
  const initialData = snippet
    ? {
        ...snippet,
        tags: snippet.tags || [],
        favorite: snippet.favorite || false,
        enabled: snippet.enabled !== false,
        description: snippet.description || '',
        // Support both old folderId and new folderIds
        folderIds: snippet.folderIds || (snippet.folderId ? [snippet.folderId] : []),
      }
    : {
        ...createSnippet(),
        folderIds: [],
      };

  // Custom components for enhanced UX
  const customComponents = {
    tags: IntelligentTagsField,
  };

  return (
    <BaseEditor
      entity={snippet}
      initialData={initialData}
      entityType="snippet"
      schema={snippetSchema}
      onSave={handleSave}
      onCancel={onCancel}
      folders={folders}
      customFields={<SnippetCustomFields />}
      customComponents={customComponents}
      twoColumn={true}
    />
  );
};

export default SnippetEditor;
