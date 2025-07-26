import React from 'react';
import { useEntityForm } from '../../hooks/base/useEntityForm';
import { useEntityTheme } from '../../hooks/base/useEntityTheme';
import EditorErrorBoundary from '../errors/EditorErrorBoundary';
import EditorLayout from './EditorLayout';
import EditorHeader from './EditorHeader';
import EditorForm from './EditorForm';
import EditorActions from './EditorActions';
import FieldRenderer from './FieldRenderer';

/**
 * Base Editor Component - Reusable editor for all entity types
 * 
 * Features:
 * - Unified form handling with validation
 * - Entity-specific theming
 * - Error boundary protection
 * - Extensible with custom fields
 * 
 * @param {Object} props
 * @param {Object} props.entity - The entity being edited
 * @param {string} props.entityType - Type of entity (template, workflow, etc.)
 * @param {Object} props.schema - Validation schema for the form
 * @param {Function} props.onSave - Save handler
 * @param {Function} props.onCancel - Cancel handler
 * @param {ReactNode} props.customFields - Additional custom fields
 * @param {boolean} props.isLoading - Loading state
 */
export const BaseEditor = ({ 
  entity,
  entityType,
  schema,
  onSave,
  onCancel,
  customFields,
  isLoading = false,
  folders = [],
  customComponents = {},
  onFormChange,
  ...props
}) => {
  const { 
    formData, 
    errors, 
    touched,
    isDirty,
    handleChange, 
    handleBlur,
    validate,
    reset
  } = useEntityForm(entity, schema);
  
  const { getColorClasses } = useEntityTheme(entityType);

  // Call onFormChange when form data changes
  React.useEffect(() => {
    if (onFormChange) {
      onFormChange(formData);
    }
  }, [formData, onFormChange]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (validate()) {
      try {
        await onSave(formData);
      } catch (error) {
        console.error('Failed to save:', error);
      }
    }
  };

  const handleCancel = () => {
    if (isDirty) {
      const confirmed = window.confirm('You have unsaved changes. Are you sure you want to cancel?');
      if (!confirmed) return;
    }
    
    reset();
    onCancel();
  };

  const layoutClass = props.twoColumn ? 'grid grid-cols-1 lg:grid-cols-2 gap-6' : 'space-y-4';

  return (
    <EditorErrorBoundary>
      <EditorLayout>
        <EditorHeader 
          title={`${entity?.id ? 'Edit' : 'Create'} ${entityType}`}
          entityType={entityType}
          colorClasses={getColorClasses('header')}
        />
        
        <EditorForm onSubmit={handleSubmit}>
          <div className={layoutClass}>
            <div className="space-y-4">
              <FieldRenderer 
                fields={schema.fields} 
                data={formData} 
                errors={errors}
                touched={touched}
                onChange={handleChange}
                onBlur={handleBlur}
                folders={folders}
                customComponents={customComponents}
              />
            </div>
            
            {customFields && (
              <div className="space-y-4">
                {React.cloneElement(customFields, {
                  formData,
                  errors,
                  touched,
                  onChange: handleChange,
                  onBlur: handleBlur
                })}
              </div>
            )}
          </div>
          
          <EditorActions 
            onCancel={handleCancel}
            onReset={reset}
            isLoading={isLoading}
            isDirty={isDirty}
            colorClasses={getColorClasses('button')}
            isEdit={!!entity?.id}
          />
        </EditorForm>
      </EditorLayout>
    </EditorErrorBoundary>
  );
};

export default BaseEditor;