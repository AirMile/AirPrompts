import React, { useState } from 'react';
import { Plus, X, FileText, Tag, Save, Info } from 'lucide-react';
import { createTemplate, createSnippet } from '../../types/template.types.js';
import { useItemColors } from '../../hooks/useItemColors.js';

/**
 * NestedComponentCreator - Component for creating local/nested components within a workflow step
 * These components are stored locally within the step and not added to the global library
 */
const NestedComponentCreator = ({ 
  stepId, 
  onCreateComponent, 
  onCancel,
  initialType = 'template' 
}) => {
  const { getColorClasses } = useItemColors();
  const [showTypeSelector, setShowTypeSelector] = useState(!initialType);
  const [componentType, setComponentType] = useState(initialType || null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    content: '',
    information: ''
  });
  const [errors, setErrors] = useState({});

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };


  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.content.trim()) {
      newErrors.content = 'Content is required';
    }


    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreate = () => {
    if (!validateForm()) return;

    let newComponent;
    
    switch (componentType) {
      case 'template':
        newComponent = createTemplate({
          name: formData.name,
          description: formData.description,
          content: formData.content,
          information: formData.information,
          isNested: true,
          parentStepId: stepId
        });
        break;
        
      case 'snippet':
        newComponent = createSnippet({
          name: formData.name,
          description: formData.description,
          content: formData.content,
          information: formData.information,
          tags: [], // Local snippets don't need tags
          isNested: true,
          parentStepId: stepId
        });
        break;
        
      case 'info':
        // For info steps, create a simple object with basic properties
        newComponent = {
          id: `info_${Date.now()}`,
          name: formData.name,
          description: formData.description,
          content: formData.content,
          type: 'info',
          isNested: true,
          parentStepId: stepId
        };
        break;
        
      default:
        console.error('Invalid component type:', componentType);
        return;
    }

    onCreateComponent(componentType, newComponent);
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'template': return FileText;
      case 'snippet': return Tag;
      case 'info': return Info;
      default: return FileText;
    }
  };

  const TypeIcon = getTypeIcon(componentType);

  const handleTypeSelection = (type) => {
    setComponentType(type);
    setShowTypeSelector(false);
  };

  const handleBackToSelector = () => {
    setShowTypeSelector(true);
    setComponentType(null);
  };


  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              {showTypeSelector ? (
                <>
                  <Plus className="w-6 h-6 text-primary-500" />
                  <h2 className="text-xl font-semibold text-secondary-900 dark:text-secondary-100">
                    Create Local Component
                  </h2>
                </>
              ) : (
                <>
                  <button
                    onClick={handleBackToSelector}
                    className="text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-200 text-sm flex items-center gap-1"
                  >
                    ← Back
                  </button>
                  <TypeIcon className="w-6 h-6 text-primary-500" />
                  <h2 className="text-xl font-semibold text-secondary-900 dark:text-secondary-100">
                    Create Local {componentType.charAt(0).toUpperCase() + componentType.slice(1)}
                  </h2>
                </>
              )}
            </div>
            <button
              onClick={onCancel}
              className="p-1 text-secondary-500 hover:text-secondary-700 dark:text-secondary-400 dark:hover:text-secondary-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Info Box */}
          <div className="mb-6 p-4 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-700 rounded-lg">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-primary-600 dark:text-primary-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-primary-700 dark:text-primary-300">
                <p className="font-medium mb-1">Local Component</p>
                <p>
                  {showTypeSelector 
                    ? "This component will be created locally within this workflow step and won't be added to your global library. It's only available for use within this specific workflow."
                    : `This ${componentType} will be created locally within this workflow step and won't be added to your global library. It's only available for use within this specific workflow.`
                  }
                </p>
              </div>
            </div>
          </div>


          {showTypeSelector ? (
            /* Type Selector */
            <div className="text-center py-8">
              <h4 className="text-md font-medium text-secondary-700 dark:text-secondary-300 mb-2">Choose Component Type</h4>
              <p className="text-secondary-600 dark:text-secondary-500 mb-6">Choose the type of component to create:</p>
              <div className="flex justify-center gap-3">
                <button
                  type="button"
                  onClick={() => handleTypeSelection('template')}
                  className={`px-4 py-2 ${getColorClasses('template', 'button')} rounded-lg flex items-center gap-2`}
                >
                  <FileText className="w-4 h-4" />
                  Template Step
                </button>
                <button
                  type="button"
                  onClick={() => handleTypeSelection('info')}
                  className={`px-4 py-2 ${getColorClasses('info', 'button')} rounded-lg flex items-center gap-2`}
                >
                  <Info className="w-4 h-4" />
                  Info Step
                </button>
                <button
                  type="button"
                  onClick={() => handleTypeSelection('snippet')}
                  className={`px-4 py-2 ${getColorClasses('snippet', 'button')} rounded-lg flex items-center gap-2`}
                >
                  <Tag className="w-4 h-4" />
                  Snippet Step
                </button>
              </div>
            </div>
          ) : (
            /* Form Fields */
            <div className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder={`Enter ${componentType} name...`}
                className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-secondary-800 text-secondary-900 dark:text-secondary-100 transition-all duration-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                  errors.name ? 'border-danger-300 dark:border-danger-600' : 'border-secondary-300 dark:border-secondary-600'
                }`}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-danger-600 dark:text-danger-400">{errors.name}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder={`Describe this ${componentType}...`}
                rows={2}
                className="w-full px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-800 text-secondary-900 dark:text-secondary-100 transition-all duration-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-vertical"
              />
            </div>

            {/* Information field (for templates and snippets only) */}
            {(componentType === 'template' || componentType === 'snippet') && (
              <div>
                <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                  Step Information
                </label>
                <textarea
                  value={formData.information}
                  onChange={(e) => handleInputChange('information', e.target.value)}
                  placeholder="Step description or content..."
                  rows={2}
                  className="w-full px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-800 text-secondary-900 dark:text-secondary-100 transition-all duration-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-vertical text-sm"
                />
              </div>
            )}

            {/* Content (for templates, snippets, and info) */}
            {(componentType === 'template' || componentType === 'snippet' || componentType === 'info') && (
              <div>
                <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                  Content *
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => handleInputChange('content', e.target.value)}
                  placeholder={
                    componentType === 'template' 
                      ? 'Enter template content with {variables}...'
                      : componentType === 'snippet'
                      ? 'Enter snippet content...'
                      : 'Enter info step content...'
                  }
                  rows={6}
                  className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-secondary-800 text-secondary-900 dark:text-secondary-100 transition-all duration-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-vertical font-mono text-sm ${
                    errors.content ? 'border-danger-300 dark:border-danger-600' : 'border-secondary-300 dark:border-secondary-600'
                  }`}
                />
                {errors.content && (
                  <p className="mt-1 text-sm text-danger-600 dark:text-danger-400">{errors.content}</p>
                )}
              </div>
            )}

          </div>
          )}

          {/* Action Buttons - only show when not in type selector */}
          {!showTypeSelector && (
          <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-secondary-200 dark:border-secondary-600">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-secondary-700 dark:text-secondary-300 border border-secondary-300 dark:border-secondary-600 rounded-lg hover:bg-secondary-50 dark:hover:bg-secondary-700 transition-all duration-200"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCreate}
              className={`flex items-center gap-2 px-4 py-2 ${getColorClasses(componentType, 'button')} rounded-lg transition-all duration-200`}
            >
              <Save className="w-4 h-4" />
              Create {componentType.charAt(0).toUpperCase() + componentType.slice(1)}
            </button>
          </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NestedComponentCreator;