import React from 'react';
import { BaseEditor, BaseCard } from '@/components/base';
import { useActions } from '@/contexts/ActionsContext';

/**
 * Example: Using BaseEditor for a Template Editor
 */
export const TemplateEditorExample = ({ template, onClose }) => {
  const { create, update } = useActions();
  
  // Define validation schema
  const templateSchema = {
    fields: {
      name: {
        type: 'text',
        label: 'Template Name',
        placeholder: 'Enter template name',
        required: true,
        minLength: 3,
        maxLength: 100
      },
      description: {
        type: 'textarea',
        label: 'Description',
        placeholder: 'Describe what this template does',
        rows: 3,
        maxLength: 500
      },
      category: {
        type: 'select',
        label: 'Category',
        required: true,
        options: [
          { value: 'general', label: 'General' },
          { value: 'development', label: 'Development' },
          { value: 'writing', label: 'Writing' },
          { value: 'analysis', label: 'Analysis' }
        ]
      },
      content: {
        type: 'textarea',
        label: 'Template Content',
        placeholder: 'Enter your template with {variables}',
        required: true,
        rows: 10,
        hint: 'Use {variable_name} syntax for variables'
      },
      tags: {
        type: 'tags',
        label: 'Tags',
        placeholder: 'Add tags and press Enter',
        hint: 'Tags help with search and organization'
      },
      favorite: {
        type: 'checkbox',
        label: 'Mark as favorite'
      }
    },
    validate: (formData) => {
      const errors = {};
      
      // Custom validation: check for at least one variable
      if (formData.content && !formData.content.includes('{')) {
        errors.content = 'Template should include at least one {variable}';
      }
      
      return errors;
    }
  };
  
  const handleSave = async (formData) => {
    if (template?.id) {
      await update('template', template.id, formData);
    } else {
      await create('template', formData);
    }
    onClose();
  };
  
  return (
    <BaseEditor
      entity={template}
      entityType="template"
      schema={templateSchema}
      onSave={handleSave}
      onCancel={onClose}
    />
  );
};

/**
 * Example: Using BaseCard in a Grid Layout
 */
export const ItemGridExample = ({ items, type = 'template' }) => {
  const { execute, update, delete: deleteItem, toggleFavorite } = useActions();
  const [selectedItems, setSelectedItems] = React.useState(new Set());
  
  const handleExecute = (item) => {
    // Navigate to executor or open modal
    console.log('Execute:', item);
    execute(item, type);
  };
  
  const handleEdit = (item) => {
    // Open edit modal
    console.log('Edit:', item);
  };
  
  const handleDelete = async (item) => {
    if (window.confirm(`Delete ${item.name}?`)) {
      await deleteItem(type, item.id);
    }
  };
  
  const handleToggleFavorite = async (item) => {
    await toggleFavorite(item, type);
  };
  
  const handleCopy = async (item) => {
    const copiedItem = {
      ...item,
      id: undefined,
      name: `${item.name} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    await create(type, copiedItem);
  };
  
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
      {items.map(item => (
        <BaseCard
          key={item.id}
          item={item}
          entityType={type}
          onExecute={() => handleExecute(item)}
          onEdit={() => handleEdit(item)}
          onDelete={() => handleDelete(item)}
          onToggleFavorite={() => handleToggleFavorite(item)}
          onCopy={() => handleCopy(item)}
          isSelected={selectedItems.has(item.id)}
          customContent={
            type === 'workflow' && (
              <div className="text-xs text-secondary-500 mt-2">
                {item.steps?.length || 0} steps
              </div>
            )
          }
        />
      ))}
    </div>
  );
};

/**
 * Example: Custom Editor with Additional Fields
 */
export const WorkflowEditorExample = ({ workflow, onClose }) => {
  const { create, update } = useActions();
  
  const workflowSchema = {
    fields: {
      name: {
        type: 'text',
        label: 'Workflow Name',
        required: true
      },
      description: {
        type: 'textarea',
        label: 'Description',
        rows: 3
      },
      category: {
        type: 'select',
        label: 'Category',
        required: true,
        options: [
          { value: 'automation', label: 'Automation' },
          { value: 'analysis', label: 'Analysis' },
          { value: 'generation', label: 'Content Generation' }
        ]
      }
    }
  };
  
  const handleSave = async (formData) => {
    const workflowData = {
      ...formData,
      steps: workflow?.steps || [] // Preserve steps
    };
    
    if (workflow?.id) {
      await update('workflow', workflow.id, workflowData);
    } else {
      await create('workflow', workflowData);
    }
    onClose();
  };
  
  // Custom fields for workflow steps
  const customFields = (
    <div>
      <h3 className="text-lg font-semibold mb-2">Workflow Steps</h3>
      <div className="space-y-2">
        {(workflow?.steps || []).map((step, index) => (
          <div key={step.id} className="p-3 bg-secondary-100 dark:bg-secondary-800 rounded">
            Step {index + 1}: {step.name}
          </div>
        ))}
      </div>
      <button
        type="button"
        className="mt-2 text-primary-500 hover:text-primary-600"
      >
        + Add Step
      </button>
    </div>
  );
  
  return (
    <BaseEditor
      entity={workflow}
      entityType="workflow"
      schema={workflowSchema}
      onSave={handleSave}
      onCancel={onClose}
      customFields={customFields}
    />
  );
};

/**
 * Example: Using Multiple Entity Types
 */
export const MixedContentGrid = ({ templates, workflows, snippets }) => {
  const allItems = [
    ...templates.map(t => ({ ...t, type: 'template' })),
    ...workflows.map(w => ({ ...w, type: 'workflow' })),
    ...snippets.map(s => ({ ...s, type: 'snippet' }))
  ];
  
  // Sort by updated date
  allItems.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Recent Items</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {allItems.map(item => (
          <BaseCard
            key={`${item.type}-${item.id}`}
            item={item}
            entityType={item.type}
            // ... handlers
          />
        ))}
      </div>
    </div>
  );
};