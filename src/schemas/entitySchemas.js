// Entity validation schemas for BaseEditor
export const templateSchema = {
  fields: [
    {
      name: 'name',
      type: 'text',
      label: 'Template Name',
      required: true,
      placeholder: 'Enter template name...',
      validation: (value) => {
        if (!value || value.trim().length === 0) return 'Template name is required';
        if (value.length > 100) return 'Template name must be less than 100 characters';
        return null;
      }
    },
    {
      name: 'description',
      type: 'textarea',
      label: 'Description',
      placeholder: 'Brief description...',
      rows: 4,
      validation: (value) => {
        if (value && value.length > 500) return 'Description must be less than 500 characters';
        return null;
      }
    },
    {
      name: 'folderIds',
      type: 'multiselect',
      label: 'Folders',
      placeholder: 'Select one or more folders...',
      required: false
    },
    {
      name: 'snippetTags',
      type: 'tags',
      label: 'Snippet Tags',
      placeholder: 'Enter snippet tags separated by commas...',
      helperText: 'Only snippets with these tags will be shown when using this template'
    },
    {
      name: 'content',
      type: 'textarea',
      label: 'Template Content',
      required: true,
      placeholder: 'Write your template here. Use {variable_name} for input fields and {{tagname}} for snippet dropdowns...',
      rows: 8,
      helperText: 'Use single curly braces {} to create input variables, like {topic} or {audience}. Use double curly braces for snippet dropdowns: {{tagname}}',
      validation: (value) => {
        if (!value || value.trim().length === 0) return 'Template content is required';
        return null;
      }
    }
  ]
};

export const workflowSchema = {
  fields: [
    {
      name: 'name',
      type: 'text',
      label: 'Workflow Name',
      required: true,
      placeholder: 'Enter workflow name...',
      validation: (value) => {
        if (!value || value.trim().length === 0) return 'Workflow name is required';
        if (value.length > 100) return 'Workflow name must be less than 100 characters';
        return null;
      }
    },
    {
      name: 'description',
      type: 'textarea',
      label: 'Description',
      placeholder: 'Brief description...',
      rows: 4,
      validation: (value) => {
        if (value && value.length > 500) return 'Description must be less than 500 characters';
        return null;
      }
    },
    {
      name: 'folderIds',
      type: 'multiselect',
      label: 'Folders',
      placeholder: 'Select folders...',
      required: false
    },
    {
      name: 'steps',
      type: 'custom',
      label: 'Workflow Steps',
      required: true,
      validation: (value) => {
        if (!value || !Array.isArray(value) || value.length === 0) return 'At least one step is required';
        return null;
      }
    }
  ]
};

export const snippetSchema = {
  fields: [
    {
      name: 'name',
      type: 'text',
      label: 'Snippet Name',
      required: true,
      placeholder: 'Enter snippet name...',
      validation: (value) => {
        if (!value || value.trim().length === 0) return 'Snippet name is required';
        if (value.length > 100) return 'Snippet name must be less than 100 characters';
        return null;
      }
    },
    {
      name: 'description',
      type: 'textarea',
      label: 'Description',
      placeholder: 'Brief description...',
      rows: 3,
      validation: (value) => {
        if (value && value.length > 500) return 'Description must be less than 500 characters';
        return null;
      }
    },
    {
      name: 'folderIds',
      type: 'multiselect',
      label: 'Folders',
      placeholder: 'Select folders...',
      required: false
    },
    {
      name: 'tags',
      type: 'tags',
      label: 'Tags',
      required: true,
      placeholder: 'Add tags (press Enter or comma to add)...',
      helperText: 'Tags help organize snippets by purpose, style, or context',
      validation: (value) => {
        if (!value || !Array.isArray(value) || value.length === 0) return 'At least one tag is required';
        return null;
      }
    },
    {
      name: 'content',
      type: 'textarea',
      label: 'Content',
      required: true,
      placeholder: 'Enter snippet content...',
      rows: 8,
      validation: (value) => {
        if (!value || value.trim().length === 0) return 'Snippet content is required';
        return null;
      }
    },
    {
      name: 'enabled',
      type: 'checkbox',
      label: 'Enabled',
      helperText: 'Snippet will be available for selection'
    },
    {
      name: 'favorite',
      type: 'checkbox',
      label: 'Mark as Favorite'
    }
  ]
};

export const addonSchema = {
  fields: [
    {
      name: 'name',
      type: 'text',
      label: 'Name',
      required: true,
      placeholder: 'Enter addon name',
      validation: (value) => {
        if (!value || value.trim().length === 0) return 'Addon name is required';
        if (value.length > 100) return 'Addon name must be less than 100 characters';
        return null;
      }
    },
    {
      name: 'description',
      type: 'text',
      label: 'Description',
      placeholder: 'Brief description of the addon'
    },
    {
      name: 'tags',
      type: 'tags',
      label: 'Tags',
      required: true,
      placeholder: 'Enter tags separated by commas...',
      helperText: 'Common tags: enhancement, formatting, quality, accessibility, technical',
      validation: (value) => {
        if (!value || !Array.isArray(value) || value.length === 0) return 'At least one tag is required';
        return null;
      }
    },
    {
      name: 'folderId',
      type: 'select',
      label: 'Folder',
      required: true
    },
    {
      name: 'content',
      type: 'textarea',
      label: 'Content',
      required: true,
      placeholder: 'Enter the addon content that will be added to templates',
      rows: 6,
      validation: (value) => {
        if (!value || value.trim().length === 0) return 'Addon content is required';
        return null;
      }
    },
    {
      name: 'enabled',
      type: 'checkbox',
      label: 'Enabled',
      helperText: 'Addon will be available for selection'
    }
  ]
};

export const insertSchema = {
  fields: [
    {
      name: 'name',
      type: 'text',
      label: 'Insert Name',
      required: true,
      placeholder: 'Enter insert name...',
      validation: (value) => {
        if (!value || value.trim().length === 0) return 'Insert name is required';
        if (value.length > 100) return 'Insert name must be less than 100 characters';
        return null;
      }
    },
    {
      name: 'description',
      type: 'textarea',
      label: 'Description',
      placeholder: 'Brief description...',
      rows: 4
    },
    {
      name: 'folderId',
      type: 'select',
      label: 'Folder',
      required: true
    },
    {
      name: 'tags',
      type: 'tags',
      label: 'Tags',
      required: true,
      placeholder: 'Add tags (press Enter or comma to add)...',
      validation: (value) => {
        if (!value || !Array.isArray(value) || value.length === 0) return 'At least one tag is required';
        return null;
      }
    },
    {
      name: 'content',
      type: 'textarea',
      label: 'Content',
      required: true,
      placeholder: 'Enter insert content...',
      rows: 8,
      validation: (value) => {
        if (!value || value.trim().length === 0) return 'Insert content is required';
        return null;
      }
    }
  ]
};

// Helper to get schema by entity type
export const getSchemaByType = (entityType) => {
  const schemas = {
    template: templateSchema,
    workflow: workflowSchema,
    snippet: snippetSchema,
    addon: addonSchema,
    insert: insertSchema
  };
  
  return schemas[entityType] || null;
};