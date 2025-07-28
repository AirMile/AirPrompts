import React from 'react';
import MultiSelectFolderSelector from '../shared/form/MultiSelectFolderSelector.jsx';
import FolderSelector from '../shared/form/FolderSelector.jsx';
import { Tag, X, Plus } from 'lucide-react';

const FieldRenderer = ({
  fields,
  data,
  errors = {},
  touched = {},
  onChange,
  onBlur,
  folders = [],
  customComponents = {},
}) => {
  const renderField = (field) => {
    const value = data[field.name] || '';
    const error = errors[field.name];
    const isTouched = touched[field.name];
    const showError = error && isTouched;

    // Check for custom component first
    if (customComponents[field.name]) {
      const CustomComponent = customComponents[field.name];
      return (
        <CustomComponent
          field={field}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          error={showError ? error : null}
          data={data}
        />
      );
    }

    switch (field.type) {
      case 'text':
        return (
          <div>
            <label
              htmlFor={field.name}
              className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2"
            >
              {field.label} {field.required && '*'}
            </label>
            <input
              type="text"
              id={field.name}
              name={field.name}
              value={value}
              onChange={onChange}
              onBlur={onBlur}
              className={`w-full p-3 border ${
                showError
                  ? 'border-danger-500 dark:border-danger-400'
                  : 'border-secondary-300 dark:border-secondary-600'
              } bg-secondary-50 dark:bg-secondary-700 text-secondary-900 dark:text-secondary-100 rounded-lg focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-500 focus:border-primary-500 dark:focus:border-primary-500 transition-all duration-200`}
              placeholder={field.placeholder}
              required={field.required}
            />
            {showError && (
              <p className="mt-1 text-sm text-danger-600 dark:text-danger-400">{error}</p>
            )}
            {field.helperText && !showError && (
              <p className="mt-1 text-sm text-secondary-600 dark:text-secondary-400">
                {field.helperText}
              </p>
            )}
          </div>
        );

      case 'textarea':
        return (
          <div>
            <label
              htmlFor={field.name}
              className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2"
            >
              {field.label} {field.required && '*'}
            </label>
            <textarea
              id={field.name}
              name={field.name}
              value={value}
              onChange={onChange}
              onBlur={onBlur}
              rows={field.rows || 4}
              className={`w-full p-3 border ${
                showError
                  ? 'border-danger-500 dark:border-danger-400'
                  : 'border-secondary-300 dark:border-secondary-600'
              } bg-secondary-50 dark:bg-secondary-700 text-secondary-900 dark:text-secondary-100 rounded-lg focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-500 focus:border-primary-500 dark:focus:border-primary-500 transition-all duration-200 ${
                field.name === 'content' ? 'font-mono text-sm' : ''
              }`}
              placeholder={field.placeholder}
              required={field.required}
            />
            {showError && (
              <p className="mt-1 text-sm text-danger-600 dark:text-danger-400">{error}</p>
            )}
            {field.helperText && !showError && (
              <p className="mt-1 text-sm text-secondary-600 dark:text-secondary-400">
                {field.helperText}
              </p>
            )}
          </div>
        );

      case 'multiselect':
        return (
          <div>
            <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
              {field.label} {field.required && '*'}
            </label>
            <MultiSelectFolderSelector
              folders={folders}
              selectedFolderIds={value || []}
              onFoldersSelect={(folderIds) =>
                onChange({
                  target: { name: field.name, value: folderIds, type: 'multiselect' },
                })
              }
              placeholder={field.placeholder}
            />
            {showError && (
              <p className="mt-1 text-sm text-danger-600 dark:text-danger-400">{error}</p>
            )}
            {field.helperText && !showError && (
              <p className="mt-1 text-sm text-secondary-600 dark:text-secondary-400">
                {field.helperText}
              </p>
            )}
          </div>
        );

      case 'select':
        return (
          <div>
            <label
              htmlFor={field.name}
              className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2"
            >
              {field.label} {field.required && '*'}
            </label>
            <FolderSelector
              id={field.name}
              name={field.name}
              folders={folders}
              selectedFolderId={value}
              onFolderSelect={(folderId) =>
                onChange({
                  target: { name: field.name, value: folderId, type: 'select' },
                })
              }
            />
            {showError && (
              <p className="mt-1 text-sm text-danger-600 dark:text-danger-400">{error}</p>
            )}
            {field.helperText && !showError && (
              <p className="mt-1 text-sm text-secondary-600 dark:text-secondary-400">
                {field.helperText}
              </p>
            )}
          </div>
        );

      case 'tags':
        return (
          <TagsField
            key={field.name}
            field={field}
            value={value}
            onChange={onChange}
            onBlur={onBlur}
            error={showError ? error : null}
          />
        );

      case 'checkbox':
        return (
          <div>
            <label className="flex items-center text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
              <input
                type="checkbox"
                name={field.name}
                checked={value || false}
                onChange={onChange}
                className="mr-2 h-4 w-4 text-primary-600 bg-white dark:bg-secondary-700 border-secondary-300 dark:border-secondary-600 rounded focus:ring-primary-400"
              />
              {field.label}
            </label>
            {field.helperText && (
              <p className="ml-6 text-sm text-secondary-600 dark:text-secondary-400">
                {field.helperText}
              </p>
            )}
          </div>
        );

      case 'custom':
        // For custom fields, we expect the parent to provide a custom component
        return null;

      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {fields.map((field) => (
        <div key={field.name}>{renderField(field)}</div>
      ))}
    </div>
  );
};

// Tags field component
const TagsField = ({ field, value, onChange, onBlur, error }) => {
  const [tagInput, setTagInput] = React.useState('');
  const tags = Array.isArray(value) ? value : [];

  const handleAddTag = () => {
    const newTag = tagInput.trim().toLowerCase();
    if (newTag && !tags.includes(newTag)) {
      onChange({
        target: {
          name: field.name,
          value: [...tags, newTag],
          type: 'tags',
        },
      });
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    onChange({
      target: {
        name: field.name,
        value: tags.filter((tag) => tag !== tagToRemove),
        type: 'tags',
      },
    });
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    } else if (e.key === ',') {
      e.preventDefault();
      handleAddTag();
    }
  };

  // Handle pasting comma-separated values
  const handlePaste = (e) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    const pastedTags = pastedText
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter((t) => t);
    const uniqueNewTags = pastedTags.filter((tag) => !tags.includes(tag));

    if (uniqueNewTags.length > 0) {
      onChange({
        target: {
          name: field.name,
          value: [...tags, ...uniqueNewTags],
          type: 'tags',
        },
      });
    }
  };

  // Common tags for suggestions
  const commonTags = [
    'enhancement',
    'formatting',
    'quality',
    'accessibility',
    'technical',
    'analysis',
    'urgency',
    'financial',
    'creativity',
    'productivity',
    'context',
    'detailed',
    'structured',
    'guide',
    'examples',
    'practical',
    'standards',
    'professional',
    'beginner',
    'simple',
    'advanced',
    'expert',
    'comparison',
    'balanced',
    'quick',
    'immediate',
    'budget',
    'cost-effective',
    'innovative',
    'unique',
    'risk',
    'planning',
    'actionable',
    'results',
    'mood',
    'tone',
    'style',
  ];

  return (
    <div>
      <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
        {field.label} {field.required && '*'}
      </label>
      <div className="space-y-2">
        <div className="flex gap-2">
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleKeyPress}
            onPaste={handlePaste}
            onBlur={onBlur}
            name={field.name}
            className="flex-1 p-3 border border-secondary-300 dark:border-secondary-600 bg-secondary-50 dark:bg-secondary-700 text-secondary-900 dark:text-secondary-100 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
            placeholder={field.placeholder}
          />
          <button
            type="button"
            onClick={handleAddTag}
            className="w-12 h-12 flex items-center justify-center bg-primary-600 hover:bg-primary-700 text-white rounded-md transition-all duration-200"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1 px-3 py-1 bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 rounded-full text-sm"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="ml-1 text-primary-600 dark:text-primary-300 hover:text-primary-800 dark:hover:text-primary-100"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        {field.helperText && !error && (
          <p className="text-sm text-secondary-600 dark:text-secondary-400">{field.helperText}</p>
        )}

        {/* Common tags suggestions */}
        {field.name === 'tags' && (
          <div className="mt-2">
            <p className="text-sm text-secondary-600 dark:text-secondary-400 mb-1">Common tags:</p>
            <div className="flex flex-wrap gap-1">
              {commonTags
                .filter((tag) => !tags.includes(tag))
                .slice(0, 20)
                .map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => {
                      onChange({
                        target: {
                          name: field.name,
                          value: [...tags, tag],
                          type: 'tags',
                        },
                      });
                    }}
                    className="px-2 py-1 bg-secondary-100 dark:bg-secondary-700 text-secondary-700 dark:text-secondary-300 rounded text-xs hover:bg-secondary-200 dark:hover:bg-secondary-600 transition-colors"
                  >
                    {tag}
                  </button>
                ))}
            </div>
          </div>
        )}

        {error && <p className="text-sm text-danger-600 dark:text-danger-400">{error}</p>}
      </div>
    </div>
  );
};

export default FieldRenderer;
