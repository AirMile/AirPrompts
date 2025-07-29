import React, { useState, useCallback } from 'react';
import {
  Workflow,
  Trash2,
  Plus,
  X,
  FileText,
  Info,
  Tag,
  Search,
  Filter,
  GitBranch,
} from 'lucide-react';
import {
  createWorkflowStep,
  createStepOption,
  addNestedComponent,
  removeNestedComponent,
} from '../../types/template.types.js';
import { useItemColors } from '../../hooks/useItemColors.js';
import NestedComponentCreator from './NestedComponentCreator.jsx';

// Separate SearchAndFilter component to prevent re-renders
const SearchAndFilter = ({
  type,
  items,
  onItemSelect,
  renderItem,
  searchTerm,
  onSearchChange,
  filterFolder,
  onFilterChange,
  folders,
}) => {
  const filteredItems = (items || []).filter((item) => {
    const matchesSearch =
      !searchTerm ||
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (type === 'snippet' &&
        (item.tags || []).some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase())));
    const matchesFolder = !filterFolder || item.folderId === filterFolder;
    return matchesSearch && matchesFolder;
  });

  const uniqueFolders = [...new Set((items || []).map((item) => item.folderId))]
    .map((id) => (folders || []).find((f) => f.id === id))
    .filter(Boolean);

  return (
    <div>
      {/* Search and Filter Controls */}
      <div className="mb-3 space-y-2">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400" />
            <input
              type="text"
              placeholder={`Search ${type}s...`}
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-secondary-300 dark:border-secondary-600 bg-white dark:bg-secondary-800 text-secondary-900 dark:text-secondary-100 rounded text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
            />
          </div>
          <div className="relative">
            <Filter className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400" />
            <select
              value={filterFolder}
              onChange={(e) => onFilterChange(e.target.value)}
              className="pl-10 pr-3 py-2 border border-secondary-300 dark:border-secondary-600 bg-white dark:bg-secondary-800 text-secondary-900 dark:text-secondary-100 rounded text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
            >
              <option value="">All folders</option>
              {uniqueFolders.map((folder) => (
                <option key={folder.id} value={folder.id}>
                  {folder.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Results count */}
        <div className="flex items-center justify-between text-xs text-secondary-600 dark:text-secondary-400">
          <span>
            {filteredItems.length} {type}(s) found
          </span>
          {(searchTerm || filterFolder) && (
            <button
              onClick={() => {
                onSearchChange('');
                onFilterChange('');
              }}
              className="text-primary-400 hover:text-primary-300 transition-all duration-200"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Items List */}
      <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto">
        {filteredItems.length === 0 ? (
          <div className="text-center py-8 text-secondary-600 dark:text-secondary-500">
            <div className="text-lg mb-2">🔍</div>
            <p>No {type}s found</p>
            {searchTerm && <p className="text-sm">Try adjusting your search terms</p>}
          </div>
        ) : (
          filteredItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onItemSelect(item)}
              className="text-left p-2 border border-secondary-300 dark:border-secondary-600 bg-secondary-100 dark:bg-secondary-700 text-secondary-900 dark:text-secondary-100 rounded hover:bg-secondary-200 dark:hover:bg-secondary-600 transition-all duration-200"
            >
              {renderItem(item)}
            </button>
          ))
        )}
      </div>
    </div>
  );
};

/**
 * Workflow Steps Editor Component
 * Handles the complex workflow steps UI as a custom field for BaseEditor
 */
export const WorkflowStepsEditor = ({
  formData = {},
  value, // FieldRenderer passes this instead of formData
  data, // FieldRenderer also passes the entire form data
  onChange,
  templates = [],
  snippets = [],
  workflows = [],
  folders = [],
}) => {
  const { getColorClasses } = useItemColors();

  // Handle both formData (direct usage) and value/data (from FieldRenderer)
  const actualFormData = formData.steps ? formData : data || {};
  const steps = value || actualFormData?.steps || [];

  // Search and filter states
  const [searchStates, setSearchStates] = useState({});
  const [filterStates, setFilterStates] = useState({});

  // Tag input states for each step

  // Nested component creator state
  const [showNestedCreator, setShowNestedCreator] = useState(null); // { stepId, type }

  // Global component selector state
  const [showGlobalSelector, setShowGlobalSelector] = useState(null); // { stepId, type }

  // Choice option component creator state
  const [showChoiceOptionCreator, setShowChoiceOptionCreator] = useState(null); // { stepId, optionId, type }

  // Choice option library selector state - tracks which option is showing library selector
  const [showChoiceOptionLibrary, setShowChoiceOptionLibrary] = useState(null); // { stepId, optionId }

  const getSearchTerm = (stepId, type) => searchStates[`${stepId}-${type}`] || '';
  const getFilterFolder = (stepId, type) => filterStates[`${stepId}-${type}`] || '';

  const setSearchTerm = (stepId, type, term) => {
    setSearchStates((prev) => ({
      ...prev,
      [`${stepId}-${type}`]: term,
    }));
  };

  const setFilterFolder = (stepId, type, folder) => {
    setFilterStates((prev) => ({
      ...prev,
      [`${stepId}-${type}`]: folder,
    }));
  };

  const updateSteps = useCallback(
    (updatedSteps) => {
      // Check if we're being used in FieldRenderer context or direct usage
      if (data && !formData.steps) {
        // FieldRenderer context - use 'steps' as field name
        onChange({ target: { name: 'steps', value: updatedSteps, type: 'custom' } });
      } else {
        // Direct usage context
        onChange({ target: { name: 'steps', value: updatedSteps, type: 'custom' } });
      }
    },
    [onChange, data, formData]
  );

  const addNewStep = (type = 'template') => {
    const newStep = createWorkflowStep({
      name: `Step ${steps.length + 1}`,
      type: type,
      templateOptions: [],
      snippetOptions: [],
      snippetTags: [],
    });

    const updatedSteps = [...steps, newStep];
    updateSteps(updatedSteps);
  };

  const addTemplateToStep = (stepId, template) => {
    updateSteps(
      steps.map((step) => {
        if (step.id === stepId) {
          // Check if template already exists to prevent duplicates
          const templateExists = step.templateOptions.some((t) => t.id === template.id);
          if (templateExists) {
            return step;
          }

          // Add order field for chronological sorting
          const allExistingItems = [
            ...(step.templateOptions || []),
            ...(step.snippetOptions || []),
            ...(step.workflowOptions || []),
          ];
          const maxOrder = allExistingItems.reduce(
            (max, item) => Math.max(max, item.order || 0),
            0
          );

          const templateWithOrder = { ...template, order: maxOrder + 1 };
          const updatedOptions = [...step.templateOptions, templateWithOrder];

          return {
            ...step,
            templateOptions: updatedOptions,
            name:
              step.templateOptions.length === 0 && step.snippetOptions.length === 0
                ? `Step ${steps.findIndex((s) => s.id === stepId) + 1}: ${template.name}`
                : step.name,
          };
        }
        return step;
      })
    );
  };

  const addSnippetToStep = (stepId, snippet) => {
    updateSteps(
      steps.map((step) => {
        if (step.id === stepId) {
          // Check if snippet already exists to prevent duplicates
          const snippetExists = (step.snippetOptions || []).some((s) => s.id === snippet.id);
          if (snippetExists) {
            return step;
          }

          // Add order field for chronological sorting
          const allExistingItems = [
            ...(step.templateOptions || []),
            ...(step.snippetOptions || []),
            ...(step.workflowOptions || []),
          ];
          const maxOrder = allExistingItems.reduce(
            (max, item) => Math.max(max, item.order || 0),
            0
          );

          const snippetWithOrder = { ...snippet, order: maxOrder + 1 };
          const updatedOptions = [...(step.snippetOptions || []), snippetWithOrder];

          return {
            ...step,
            snippetOptions: updatedOptions,
            name:
              step.templateOptions.length === 0 && step.snippetOptions.length === 0
                ? `Step ${steps.findIndex((s) => s.id === stepId) + 1}: ${snippet.name}`
                : step.name,
          };
        }
        return step;
      })
    );
  };

  const removeTemplateFromStep = (stepId, templateId) => {
    updateSteps(
      steps.map((step) => {
        if (step.id === stepId) {
          const updatedOptions = step.templateOptions.filter((t) => t.id !== templateId);
          return {
            ...step,
            templateOptions: updatedOptions,
          };
        }
        return step;
      })
    );
  };

  const removeSnippetFromStep = (stepId, snippetId) => {
    updateSteps(
      steps.map((step) => {
        if (step.id === stepId) {
          const updatedOptions = (step.snippetOptions || []).filter((s) => s.id !== snippetId);
          return {
            ...step,
            snippetOptions: updatedOptions,
          };
        }
        return step;
      })
    );
  };

  const addWorkflowToStep = (stepId, workflowItem) => {
    updateSteps(
      steps.map((step) => {
        if (step.id === stepId) {
          // Check if workflow already exists to prevent duplicates
          const workflowExists = (step.workflowOptions || []).some((w) => w.id === workflowItem.id);
          if (workflowExists) {
            return step;
          }

          // Add order field for chronological sorting
          const allExistingItems = [
            ...(step.templateOptions || []),
            ...(step.snippetOptions || []),
            ...(step.workflowOptions || []),
          ];
          const maxOrder = allExistingItems.reduce(
            (max, item) => Math.max(max, item.order || 0),
            0
          );

          const workflowWithOrder = { ...workflowItem, order: maxOrder + 1 };
          const updatedOptions = [...(step.workflowOptions || []), workflowWithOrder];

          return {
            ...step,
            workflowOptions: updatedOptions,
            name:
              step.templateOptions?.length === 0 &&
              step.snippetOptions?.length === 0 &&
              (step.workflowOptions?.length === 0 || !step.workflowOptions)
                ? `Step ${steps.findIndex((s) => s.id === stepId) + 1}: ${workflowItem.name}`
                : step.name,
          };
        }
        return step;
      })
    );
  };

  const removeWorkflowFromStep = (stepId, workflowId) => {
    updateSteps(
      steps.map((step) => {
        if (step.id === stepId) {
          const updatedOptions = (step.workflowOptions || []).filter((w) => w.id !== workflowId);
          return {
            ...step,
            workflowOptions: updatedOptions,
          };
        }
        return step;
      })
    );
  };

  const removeStep = (stepId) => {
    updateSteps(steps.filter((step) => step.id !== stepId));
  };

  const moveStep = (stepId, direction) => {
    const newSteps = [...steps];
    const currentIndex = newSteps.findIndex((step) => step.id === stepId);
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

    if (newIndex >= 0 && newIndex < newSteps.length) {
      // Swap the entire step objects
      const temp = newSteps[currentIndex];
      newSteps[currentIndex] = newSteps[newIndex];
      newSteps[newIndex] = temp;

      updateSteps(newSteps);
    }
  };

  const updateStepField = (stepId, field, value) => {
    updateSteps(steps.map((s) => (s.id === stepId ? { ...s, [field]: value } : s)));
  };

  // Nested component handlers
  const handleCreateNestedComponent = (stepId, type, component) => {
    updateSteps(
      steps.map((step) => {
        if (step.id === stepId) {
          return addNestedComponent(step, type, component);
        }
        return step;
      })
    );
    setShowNestedCreator(null);
  };

  const handleRemoveNestedComponent = (stepId, type, componentId) => {
    updateSteps(
      steps.map((step) => {
        if (step.id === stepId) {
          return removeNestedComponent(step, type, componentId);
        }
        return step;
      })
    );
  };

  const showCreateNestedComponent = (stepId, type) => {
    setShowNestedCreator({ stepId, type });
  };

  // Choice option nested component handlers
  const handleCreateChoiceOptionComponent = (stepId, optionId, type, component) => {
    updateSteps(
      steps.map((step) => {
        if (step.id === stepId) {
          return {
            ...step,
            options: (step.options || []).map((opt) =>
              opt.id === optionId ? { ...opt, nestedComponent: component, componentId: null } : opt
            ),
          };
        }
        return step;
      })
    );
    setShowChoiceOptionCreator(null);
  };

  const showCreateChoiceOptionComponent = (stepId, optionId, type) => {
    setShowChoiceOptionCreator({ stepId, optionId, type });
  };

  // Global component handlers
  const showAddGlobalComponent = (stepId, type) => {
    setShowGlobalSelector({ stepId, type });
  };

  const handleAddGlobalComponent = (stepId, type, item) => {
    switch (type) {
      case 'template':
        addTemplateToStep(stepId, item);
        break;
      case 'snippet':
        addSnippetToStep(stepId, item);
        break;
      case 'workflow':
        addWorkflowToStep(stepId, item);
        break;
    }

    setShowGlobalSelector(null);
  };

  const handleRemoveGlobalComponent = (stepId, type, itemId) => {
    switch (type) {
      case 'template':
        removeTemplateFromStep(stepId, itemId);
        break;
      case 'snippet':
        removeSnippetFromStep(stepId, itemId);
        break;
      case 'workflow':
        removeWorkflowFromStep(stepId, itemId);
        break;
    }
  };

  // Render step type badge
  const renderStepTypeBadge = (type, isChoiceStep = false) => {
    if (isChoiceStep) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-secondary-100 text-secondary-700 dark:bg-secondary-800 dark:text-secondary-300">
          <GitBranch className="w-3 h-3" />
          Choice Step
        </span>
      );
    }
    const badges = {
      template: {
        icon: FileText,
        color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
        label: 'Template',
      },
      snippet: {
        icon: Tag,
        color: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300',
        label: 'Snippet',
      },
      insert: {
        icon: Tag,
        color: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300',
        label: 'Snippet',
      },
      workflow: {
        icon: Workflow,
        color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300',
        label: 'Workflow',
      },
      info: {
        icon: Info,
        color: 'bg-secondary-100 text-secondary-700 dark:bg-secondary-800 dark:text-secondary-300',
        label: 'Info',
      },
    };

    const badge = badges[type] || badges.info;
    const Icon = badge.icon;

    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${badge.color}`}
      >
        <Icon className="w-3 h-3" />
        {badge.label}
      </span>
    );
  };

  // Render global component selector (when adding from library)
  const renderGlobalComponentSelector = (step) => {
    if (!showGlobalSelector || showGlobalSelector.stepId !== step.id) return null;

    const { type } = showGlobalSelector;
    const items = type === 'template' ? templates : type === 'snippet' ? snippets : workflows;
    const searchTerm = getSearchTerm(step.id, `global-${type}`);
    const filterFolder = getFilterFolder(step.id, `global-${type}`);

    return (
      <div className="mt-4 p-4 bg-secondary-50 dark:bg-secondary-900/30 rounded-lg border border-secondary-200 dark:border-secondary-700">
        <div className="flex items-center justify-between mb-3">
          <h5 className="font-medium text-secondary-800 dark:text-secondary-200">
            Select {type.charAt(0).toUpperCase() + type.slice(1)}
          </h5>
          <button
            onClick={() => setShowGlobalSelector(null)}
            className="text-secondary-500 hover:text-secondary-700 dark:text-secondary-400 dark:hover:text-secondary-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <SearchAndFilter
          type={type}
          items={items}
          onItemSelect={(item) => handleAddGlobalComponent(step.id, type, item)}
          renderItem={(item) => (
            <div>
              <div className="font-medium text-secondary-900 dark:text-secondary-100">
                {item.name}
              </div>
              {item.description && (
                <div className="text-sm text-secondary-600 dark:text-secondary-400 mt-1">
                  {item.description}
                </div>
              )}
              {type === 'snippet' && item.tags && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {item.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-1 bg-secondary-200 dark:bg-secondary-700 text-secondary-700 dark:text-secondary-300 rounded text-xs"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
          searchTerm={searchTerm}
          onSearchChange={(term) => setSearchTerm(step.id, `global-${type}`, term)}
          filterFolder={filterFolder}
          onFilterChange={(folder) => setFilterFolder(step.id, `global-${type}`, folder)}
          folders={folders}
        />
      </div>
    );
  };

  // Render type-specific content for each step type
  const renderStepTypeContent = (step) => {
    switch (step.type) {
      case 'template':
        return renderTemplateStepContent(step);
      case 'snippet':
      case 'insert':
        return renderSnippetStepContent(step);
      case 'workflow':
        return renderWorkflowStepContent(step);
      case 'info':
        return null; // Info steps only have content, no selection
      default:
        return null;
    }
  };

  // Render content for template steps
  const renderTemplateStepContent = (step) => {
    const selectedTemplate = step.templateOptions?.[0] || null;
    const nestedTemplates = step.nestedComponents?.templates || [];

    return (
      <div className="mt-4 space-y-4">
        {/* Selected Template Display */}
        {selectedTemplate && (
          <div className={`p-4 rounded-lg ${getColorClasses('template', 'info-block')}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className={`w-5 h-5 ${getColorClasses('template', 'icon')}`} />
                <div>
                  <h6 className={`font-medium ${getColorClasses('template', 'info-header')}`}>
                    Selected Template
                  </h6>
                  <p className={`text-sm ${getColorClasses('template', 'info-text')}`}>
                    {selectedTemplate.name}
                  </p>
                </div>
              </div>
              <button
                onClick={() =>
                  handleRemoveGlobalComponent(step.id, 'template', selectedTemplate.id)
                }
                className={`${getColorClasses('template', 'icon')} hover:opacity-80`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Local Templates */}
        {nestedTemplates.length > 0 && (
          <div className="p-4 bg-primary-50 dark:bg-primary-900/30 rounded-lg border border-primary-200 dark:border-primary-700">
            <h6 className="font-medium text-primary-800 dark:text-primary-200 mb-2">
              Local Template
            </h6>
            {nestedTemplates.map((template) => (
              <div key={template.id} className="flex items-center justify-between">
                <span className="text-sm text-primary-700 dark:text-primary-300">
                  {template.name}
                </span>
                <button
                  onClick={() => handleRemoveNestedComponent(step.id, 'template', template.id)}
                  className="text-primary-600 dark:text-primary-400"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Template Selection */}
        {!selectedTemplate && nestedTemplates.length === 0 && (
          <div className="border-2 border-dashed border-secondary-300 dark:border-secondary-600 rounded-lg p-6 text-center">
            <FileText className="w-8 h-8 text-secondary-400 dark:text-secondary-500 mx-auto mb-3" />
            <p className="text-secondary-600 dark:text-secondary-400 mb-4">No template selected</p>
            <div className="flex justify-center gap-3">
              <button
                type="button"
                onClick={() => showAddGlobalComponent(step.id, 'template')}
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded transition-all duration-200"
              >
                Select from Library
              </button>
              <span className="text-secondary-500 dark:text-secondary-400 py-2">or</span>
              <button
                type="button"
                onClick={() => showCreateNestedComponent(step.id, 'template')}
                className="px-4 py-2 border border-primary-600 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded transition-all duration-200"
              >
                Create New
              </button>
            </div>
          </div>
        )}

        {/* Global Template Selector (when selecting) */}
        {showGlobalSelector &&
          showGlobalSelector.stepId === step.id &&
          showGlobalSelector.type === 'template' &&
          renderGlobalComponentSelector(step)}
      </div>
    );
  };

  // Render content for snippet steps
  const renderSnippetStepContent = (step) => {
    const selectedSnippets = step.snippetOptions || [];
    const nestedSnippets = step.nestedComponents?.snippets || [];

    return (
      <div className="mt-4 space-y-4">
        {/* Selected Snippets Display */}
        {selectedSnippets.length > 0 && (
          <div className={`p-4 rounded-lg ${getColorClasses('snippet', 'info-block')}`}>
            <h6 className={`font-medium mb-3 ${getColorClasses('snippet', 'info-header')}`}>
              Selected Snippets
            </h6>
            <div className="flex flex-wrap gap-2">
              {selectedSnippets.map((snippet) => (
                <div
                  key={snippet.id}
                  className={`flex items-center gap-2 px-3 py-1 rounded text-sm ${getColorClasses('snippet', 'button')}`}
                >
                  <Tag className="w-3 h-3" />
                  <span>{snippet.name}</span>
                  <button
                    onClick={() => handleRemoveGlobalComponent(step.id, 'snippet', snippet.id)}
                    className="hover:opacity-80"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Local Snippets */}
        {nestedSnippets.length > 0 && (
          <div className="p-4 bg-success-50 dark:bg-success-900/30 rounded-lg border border-success-200 dark:border-success-700">
            <h6 className="font-medium text-success-800 dark:text-success-200 mb-3">
              Local Snippets
            </h6>
            <div className="flex flex-wrap gap-2">
              {nestedSnippets.map((snippet) => (
                <div
                  key={snippet.id}
                  className="flex items-center gap-2 px-3 py-1 bg-success-100 dark:bg-success-900/50 text-success-800 dark:text-success-200 rounded text-sm"
                >
                  <Tag className="w-3 h-3" />
                  <span>{snippet.name}</span>
                  <button
                    onClick={() => handleRemoveNestedComponent(step.id, 'snippet', snippet.id)}
                    className="text-success-600 dark:text-success-400"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Snippet Selection/Creation */}
        <div className="border border-secondary-300 dark:border-secondary-600 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h6 className="font-medium text-secondary-800 dark:text-secondary-200">Add Snippets</h6>
            <span className="text-xs text-secondary-500 dark:text-secondary-400">
              Multiple selections allowed
            </span>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => showAddGlobalComponent(step.id, 'snippet')}
              className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded transition-all duration-200"
            >
              <Plus className="w-4 h-4 inline mr-2" />
              Add from Library
            </button>
            <button
              type="button"
              onClick={() => showCreateNestedComponent(step.id, 'snippet')}
              className="flex-1 px-4 py-2 border border-primary-600 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded transition-all duration-200"
            >
              <Plus className="w-4 h-4 inline mr-2" />
              Create New
            </button>
          </div>
        </div>

        {/* Global Snippet Selector (when selecting) */}
        {showGlobalSelector &&
          showGlobalSelector.stepId === step.id &&
          showGlobalSelector.type === 'snippet' &&
          renderGlobalComponentSelector(step)}
      </div>
    );
  };

  // Render content for workflow steps
  const renderWorkflowStepContent = (step) => {
    const selectedWorkflow = step.workflowOptions?.[0] || null;
    const nestedWorkflows = step.nestedComponents?.workflows || [];

    return (
      <div className="mt-4 space-y-4">
        {/* Selected Workflow Display */}
        {selectedWorkflow && (
          <div className={`p-4 rounded-lg ${getColorClasses('workflow', 'info-block')}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Workflow className={`w-5 h-5 ${getColorClasses('workflow', 'icon')}`} />
                <div>
                  <h6 className={`font-medium ${getColorClasses('workflow', 'info-header')}`}>
                    Selected Workflow
                  </h6>
                  <p className={`text-sm ${getColorClasses('workflow', 'info-text')}`}>
                    {selectedWorkflow.name}
                  </p>
                </div>
              </div>
              <button
                onClick={() =>
                  handleRemoveGlobalComponent(step.id, 'workflow', selectedWorkflow.id)
                }
                className={`${getColorClasses('workflow', 'icon')} hover:opacity-80`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Local Workflows */}
        {nestedWorkflows.length > 0 && (
          <div className="p-4 bg-secondary-50 dark:bg-secondary-900/30 rounded-lg border border-secondary-200 dark:border-secondary-700">
            <h6 className="font-medium text-secondary-800 dark:text-secondary-200 mb-2">
              Local Workflow
            </h6>
            {nestedWorkflows.map((workflow) => (
              <div key={workflow.id} className="flex items-center justify-between">
                <span className="text-sm text-secondary-700 dark:text-secondary-300">
                  {workflow.name}
                </span>
                <button
                  onClick={() => handleRemoveNestedComponent(step.id, 'workflow', workflow.id)}
                  className="text-secondary-600 dark:text-secondary-400"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Direct Workflow Selection - show selector directly when no workflow selected */}
        {!selectedWorkflow && nestedWorkflows.length === 0 && (
          <div className="mt-4 p-4 bg-secondary-50 dark:bg-secondary-900/30 rounded-lg border border-secondary-200 dark:border-secondary-700">
            <div className="flex items-center justify-between mb-3">
              <h5 className="font-medium text-secondary-800 dark:text-secondary-200">
                Select Workflow
              </h5>
            </div>

            <SearchAndFilter
              type="workflow"
              items={workflows}
              onItemSelect={(item) => handleAddGlobalComponent(step.id, 'workflow', item)}
              renderItem={(item) => (
                <div>
                  <div className="font-medium text-secondary-900 dark:text-secondary-100">
                    {item.name}
                  </div>
                  {item.description && (
                    <div className="text-sm text-secondary-600 dark:text-secondary-400 mt-1">
                      {item.description}
                    </div>
                  )}
                </div>
              )}
              searchTerm={getSearchTerm(step.id, `global-workflow`)}
              onSearchChange={(term) => setSearchTerm(step.id, `global-workflow`, term)}
              filterFolder={getFilterFolder(step.id, `global-workflow`)}
              onFilterChange={(folder) => setFilterFolder(step.id, `global-workflow`, folder)}
              folders={folders}
            />
          </div>
        )}
      </div>
    );
  };

  // Add option to a step
  const addOptionToStep = (stepId) => {
    const step = steps.find((s) => s.id === stepId);
    if (!step) return;

    const newOption = createStepOption({
      name: `Option ${(step.options?.length || 0) + 1}`,
      type: null, // User must choose the type
      order: step.options?.length || 0,
    });

    updateSteps(
      steps.map((s) => (s.id === stepId ? { ...s, options: [...(s.options || []), newOption] } : s))
    );
  };

  // Remove option from a step
  const removeOptionFromStep = (stepId, optionId) => {
    updateSteps(
      steps.map((s) =>
        s.id === stepId
          ? { ...s, options: (s.options || []).filter((opt) => opt.id !== optionId) }
          : s
      )
    );
  };

  // Update option in a step
  const updateOption = (stepId, optionId, field, value) => {
    updateSteps(
      steps.map((s) => {
        if (s.id === stepId) {
          return {
            ...s,
            options: (s.options || []).map((opt) =>
              opt.id === optionId ? { ...opt, [field]: value } : opt
            ),
          };
        }
        return s;
      })
    );
  };

  // Render choice options section
  const renderChoiceOptions = (step) => {
    if (!step.options || step.options.length === 0) {
      // Show Add Option button for all step types except info
      if (step.type === 'info') return null;

      return (
        <div className="mt-4 pt-4 border-t border-secondary-200 dark:border-secondary-600">
          <button
            type="button"
            onClick={() => addOptionToStep(step.id)}
            className="w-full py-2 border-2 border-dashed border-secondary-300 dark:border-secondary-600 rounded-lg text-secondary-600 dark:text-secondary-400 hover:border-secondary-400 hover:text-secondary-600 dark:hover:border-secondary-400 dark:hover:text-secondary-400 transition-all duration-200 flex items-center justify-center gap-2"
          >
            <GitBranch className="w-4 h-4" />
            Add Choice Option
          </button>
        </div>
      );
    }

    return (
      <div className="mt-4 pt-4 border-t border-secondary-200 dark:border-secondary-600">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-secondary-600 dark:text-secondary-400" />
            <h5 className="font-medium text-secondary-800 dark:text-secondary-200">
              Choice Options
            </h5>
          </div>
          <button
            type="button"
            onClick={() => addOptionToStep(step.id)}
            className="px-3 py-1 text-sm bg-secondary-100 text-secondary-700 dark:bg-secondary-800 dark:text-secondary-300 rounded hover:bg-secondary-200 dark:hover:bg-secondary-700 transition-all duration-200 flex items-center gap-1"
          >
            <Plus className="w-3 h-3" />
            Add Option
          </button>
        </div>

        <div className="space-y-3">
          {step.options.map((option) => (
            <div
              key={option.id}
              className="p-4 bg-secondary-50 dark:bg-secondary-900/20 rounded-lg border border-secondary-200 dark:border-secondary-700"
            >
              <div className="flex items-center justify-between mb-3">
                <input
                  type="text"
                  value={option.name}
                  onChange={(e) => updateOption(step.id, option.id, 'name', e.target.value)}
                  placeholder="Option name..."
                  className="font-medium bg-transparent border-none focus:outline-none text-secondary-800 dark:text-secondary-200"
                />
                <button
                  onClick={() => removeOptionFromStep(step.id, option.id)}
                  className="text-secondary-600 dark:text-secondary-400 hover:text-secondary-800 dark:hover:text-secondary-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Option Component Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-secondary-700 dark:text-secondary-300">
                  Select {step.type} for this option:
                </label>
                {renderOptionComponentSelector(step, option)}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Render component selector for an option
  const renderOptionComponentSelector = (step, option) => {
    // If no type selected yet, show type selector
    if (!option.type) {
      return (
        <div className="space-y-3">
          <p className="text-sm font-medium text-secondary-700 dark:text-secondary-300">
            Choose type for this option:
          </p>
          <div className="flex justify-center gap-3">
            <button
              type="button"
              onClick={() => updateOption(step.id, option.id, 'type', 'template')}
              className={`px-4 py-2 ${getColorClasses('template', 'button')} rounded-lg flex items-center gap-2`}
            >
              <FileText className="w-4 h-4" />
              Template Step
            </button>
            <button
              type="button"
              onClick={() => updateOption(step.id, option.id, 'type', 'info')}
              className={`px-4 py-2 ${getColorClasses('info', 'button')} rounded-lg flex items-center gap-2`}
            >
              <Info className="w-4 h-4" />
              Info Step
            </button>
            <button
              type="button"
              onClick={() => updateOption(step.id, option.id, 'type', 'snippet')}
              className={`px-4 py-2 ${getColorClasses('snippet', 'button')} rounded-lg flex items-center gap-2`}
            >
              <Tag className="w-4 h-4" />
              Snippet Step
            </button>
            <button
              type="button"
              onClick={() => updateOption(step.id, option.id, 'type', 'workflow')}
              className={`px-4 py-2 ${getColorClasses('workflow', 'button')} rounded-lg flex items-center gap-2`}
            >
              <Workflow className="w-4 h-4" />
              Workflow Step
            </button>
          </div>
        </div>
      );
    }

    // Type is selected, show component selector or info step content
    if (option.type === 'info') {
      return (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-secondary-600" />
              <span className="text-sm font-medium text-secondary-700 dark:text-secondary-300">
                Info Step
              </span>
            </div>
            <button
              onClick={() => {
                updateOption(step.id, option.id, 'type', null);
                updateOption(step.id, option.id, 'componentId', null);
              }}
              className="text-secondary-500 hover:text-secondary-700"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
          <p className="text-xs text-secondary-600 dark:text-secondary-400">
            Info steps don't require a component selection.
          </p>
        </div>
      );
    }

    // Get components based on option type
    const components =
      option.type === 'template'
        ? templates
        : option.type === 'snippet'
          ? snippets
          : option.type === 'workflow'
            ? workflows
            : [];

    const selectedComponent = option.componentId
      ? components.find((c) => c.id === option.componentId)
      : null;

    const hasNestedComponent = option.nestedComponent;

    // Show nested component if exists
    if (hasNestedComponent) {
      return (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {option.type === 'template' && <FileText className="w-4 h-4 text-blue-600" />}
              {option.type === 'snippet' && <Tag className="w-4 h-4 text-green-600" />}
              {option.type === 'workflow' && <Workflow className="w-4 h-4 text-purple-600" />}
              <span className="text-sm font-medium text-secondary-700 dark:text-secondary-300">
                {option.type.charAt(0).toUpperCase() + option.type.slice(1)} Step
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between p-3 bg-primary-50 dark:bg-primary-900/30 rounded border border-primary-300 dark:border-primary-600">
            <div className="flex items-center gap-2">
              {option.type === 'template' && <FileText className="w-4 h-4 text-blue-600" />}
              {option.type === 'snippet' && <Tag className="w-4 h-4 text-green-600" />}
              {option.type === 'workflow' && <Workflow className="w-4 h-4 text-purple-600" />}
              <div>
                <span className="text-sm font-medium">{hasNestedComponent.name}</span>
                <p className="text-xs text-primary-600 dark:text-primary-400">Local Component</p>
              </div>
            </div>
            <button
              onClick={() => {
                updateOption(step.id, option.id, 'componentId', null);
                updateOption(step.id, option.id, 'nestedComponent', null);
              }}
              className="text-secondary-500 hover:text-secondary-700"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      );
    }

    if (selectedComponent) {
      return (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {option.type === 'template' && <FileText className="w-4 h-4 text-blue-600" />}
              {option.type === 'snippet' && <Tag className="w-4 h-4 text-green-600" />}
              {option.type === 'workflow' && <Workflow className="w-4 h-4 text-purple-600" />}
              <span className="text-sm font-medium text-secondary-700 dark:text-secondary-300">
                {option.type.charAt(0).toUpperCase() + option.type.slice(1)} Step
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between p-3 bg-white dark:bg-secondary-800 rounded border border-secondary-300 dark:border-secondary-600">
            <div className="flex items-center gap-2">
              {option.type === 'template' && <FileText className="w-4 h-4 text-blue-600" />}
              {option.type === 'snippet' && <Tag className="w-4 h-4 text-green-600" />}
              {option.type === 'workflow' && <Workflow className="w-4 h-4 text-purple-600" />}
              <span className="text-sm font-medium">{selectedComponent.name}</span>
            </div>
            <button
              onClick={() => updateOption(step.id, option.id, 'componentId', null)}
              className="text-secondary-500 hover:text-secondary-700"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      );
    }

    // Show Library vs Create New choice
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          {option.type === 'template' && <FileText className="w-4 h-4 text-blue-600" />}
          {option.type === 'snippet' && <Tag className="w-4 h-4 text-green-600" />}
          {option.type === 'workflow' && <Workflow className="w-4 h-4 text-purple-600" />}
          <span className="text-sm font-medium text-secondary-700 dark:text-secondary-300">
            {option.type.charAt(0).toUpperCase() + option.type.slice(1)} Step
          </span>
        </div>

        {/* Component Selection - Direct SearchAndFilter for workflows, button interface for others */}
        <div className="border-2 border-dashed border-secondary-300 dark:border-secondary-600 rounded-lg p-4">
          <div className="flex items-center gap-2 justify-center mb-3">
            {option.type === 'template' && <FileText className="w-5 h-5 text-secondary-600" />}
            {option.type === 'snippet' && <Tag className="w-5 h-5 text-secondary-600" />}
            {option.type === 'workflow' && <Workflow className="w-5 h-5 text-secondary-600" />}
            <p className="text-secondary-700 dark:text-secondary-300">
              {option.type === 'workflow' ? 'Select Workflow' : `No ${option.type} selected`}
            </p>
          </div>

          {/* Direct SearchAndFilter for workflow types */}
          {option.type === 'workflow' ? (
            <SearchAndFilter
              type="workflow"
              items={workflows}
              onItemSelect={(item) => {
                updateOption(step.id, option.id, 'componentId', item.id);
              }}
              renderItem={(item) => (
                <div>
                  <div className="font-medium text-secondary-900 dark:text-secondary-100">
                    {item.name}
                  </div>
                  {item.description && (
                    <div className="text-sm text-secondary-600 dark:text-secondary-400 mt-1">
                      {item.description}
                    </div>
                  )}
                </div>
              )}
              searchTerm={getSearchTerm(step.id, `choice-${option.id}-workflow`)}
              onSearchChange={(term) =>
                setSearchTerm(step.id, `choice-${option.id}-workflow`, term)
              }
              filterFolder={getFilterFolder(step.id, `choice-${option.id}-workflow`)}
              onFilterChange={(folder) =>
                setFilterFolder(step.id, `choice-${option.id}-workflow`, folder)
              }
              folders={folders}
            />
          ) : (
            /* Direct SearchAndFilter for template and snippet types */
            <>
              {showChoiceOptionLibrary?.stepId === step.id &&
              showChoiceOptionLibrary?.optionId === option.id ? (
                <div>
                  <SearchAndFilter
                    type={option.type}
                    items={components}
                    onItemSelect={(item) => {
                      updateOption(step.id, option.id, 'componentId', item.id);
                      setShowChoiceOptionLibrary(null);
                    }}
                    renderItem={(item) => (
                      <div>
                        <div className="font-medium text-secondary-900 dark:text-secondary-100">
                          {item.name}
                        </div>
                        {item.description && (
                          <div className="text-sm text-secondary-600 dark:text-secondary-400 mt-1">
                            {item.description}
                          </div>
                        )}
                        {option.type === 'snippet' && item.tags && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {item.tags.map((tag) => (
                              <span
                                key={tag}
                                className="px-2 py-1 bg-secondary-200 dark:bg-secondary-700 text-secondary-700 dark:text-secondary-300 rounded text-xs"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                    searchTerm={getSearchTerm(step.id, `choice-${option.id}-${option.type}`)}
                    onSearchChange={(term) =>
                      setSearchTerm(step.id, `choice-${option.id}-${option.type}`, term)
                    }
                    filterFolder={getFilterFolder(step.id, `choice-${option.id}-${option.type}`)}
                    onFilterChange={(folder) =>
                      setFilterFolder(step.id, `choice-${option.id}-${option.type}`, folder)
                    }
                    folders={folders}
                  />
                  <div className="mt-3 text-center">
                    <button
                      type="button"
                      onClick={() => setShowChoiceOptionLibrary(null)}
                      className="px-3 py-1 text-sm text-secondary-600 dark:text-secondary-400 hover:text-secondary-800 dark:hover:text-secondary-200"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex justify-center gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      setShowChoiceOptionLibrary({ stepId: step.id, optionId: option.id })
                    }
                    className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded transition-all duration-200"
                  >
                    Select from Library
                  </button>
                  <span className="text-secondary-500 dark:text-secondary-400 py-2">or</span>
                  <button
                    type="button"
                    onClick={() => showCreateChoiceOptionComponent(step.id, option.id, option.type)}
                    className="px-4 py-2 border border-primary-600 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded transition-all duration-200"
                  >
                    Create New
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="space-y-4">
        <div className="mb-3">
          <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">
            Workflow Steps ({steps.length})
          </h3>
        </div>

        {steps.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-secondary-300 dark:border-secondary-600 rounded-lg">
            <Workflow className="w-12 h-12 text-secondary-500 dark:text-secondary-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-secondary-700 dark:text-secondary-300 mb-2">
              Create Your First Step
            </h4>
            <p className="text-secondary-600 dark:text-secondary-500 mb-4">
              Choose the type of step to add to your workflow:
            </p>
            <div className="flex justify-center gap-3">
              <button
                type="button"
                onClick={() => addNewStep('template')}
                className={`px-4 py-2 ${getColorClasses('template', 'button')} rounded-lg flex items-center gap-2`}
              >
                <FileText className="w-4 h-4" />
                Template Step
              </button>
              <button
                type="button"
                onClick={() => addNewStep('info')}
                className={`px-4 py-2 ${getColorClasses('info', 'button')} rounded-lg flex items-center gap-2`}
              >
                <Info className="w-4 h-4" />
                Info Step
              </button>
              <button
                type="button"
                onClick={() => addNewStep('insert')}
                className={`px-4 py-2 ${getColorClasses('snippet', 'button')} rounded-lg flex items-center gap-2`}
              >
                <Tag className="w-4 h-4" />
                Snippet Step
              </button>
              <button
                type="button"
                onClick={() => addNewStep('workflow')}
                className={`px-4 py-2 ${getColorClasses('workflow', 'button')} rounded-lg flex items-center gap-2`}
              >
                <Workflow className="w-4 h-4" />
                Workflow Step
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className="bg-white dark:bg-secondary-800 border border-secondary-200 dark:border-secondary-700 rounded-lg p-6"
              >
                {/* Step Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={step.name}
                        onChange={(e) => updateStepField(step.id, 'name', e.target.value)}
                        placeholder={`Step ${index + 1} name...`}
                        className="text-lg font-medium bg-transparent border-none focus:outline-none text-secondary-900 dark:text-secondary-100"
                      />
                      {renderStepTypeBadge(step.type, step.options && step.options.length > 0)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => moveStep(step.id, 'up')}
                      disabled={index === 0}
                      className="p-1 text-secondary-500 hover:text-secondary-700 dark:text-secondary-400 dark:hover:text-secondary-200 disabled:opacity-50"
                    >
                      ↑
                    </button>
                    <button
                      onClick={() => moveStep(step.id, 'down')}
                      disabled={index === steps.length - 1}
                      className="p-1 text-secondary-500 hover:text-secondary-700 dark:text-secondary-400 dark:hover:text-secondary-200 disabled:opacity-50"
                    >
                      ↓
                    </button>
                    <button
                      onClick={() => removeStep(step.id)}
                      className="p-1 text-danger-500 hover:text-danger-700 dark:text-danger-400 dark:hover:text-danger-200"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Step Content */}
                <div className="space-y-4">
                  <textarea
                    value={step.content || ''}
                    onChange={(e) => updateStepField(step.id, 'content', e.target.value)}
                    placeholder="Step description or content..."
                    rows={2}
                    className="w-full px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded bg-white dark:bg-secondary-800 text-secondary-900 dark:text-secondary-100"
                  />
                </div>

                {/* Type-specific content based on step type */}
                {renderStepTypeContent(step)}

                {/* Choice Options Section */}
                {renderChoiceOptions(step)}
              </div>
            ))}

            {/* Add Next Step Section */}
            <div className="text-center py-8 border-2 border-dashed border-secondary-300 dark:border-secondary-600 rounded-lg">
              <h4 className="text-md font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                Add Next Step
              </h4>
              <p className="text-secondary-600 dark:text-secondary-500 mb-4">
                Choose the type of step to add to your workflow:
              </p>
              <div className="flex justify-center gap-3">
                <button
                  type="button"
                  onClick={() => addNewStep('template')}
                  className={`px-4 py-2 ${getColorClasses('template', 'button')} rounded-lg flex items-center gap-2`}
                >
                  <FileText className="w-4 h-4" />
                  Template Step
                </button>
                <button
                  type="button"
                  onClick={() => addNewStep('info')}
                  className={`px-4 py-2 ${getColorClasses('info', 'button')} rounded-lg flex items-center gap-2`}
                >
                  <Info className="w-4 h-4" />
                  Info Step
                </button>
                <button
                  type="button"
                  onClick={() => addNewStep('insert')}
                  className={`px-4 py-2 ${getColorClasses('snippet', 'button')} rounded-lg flex items-center gap-2`}
                >
                  <Tag className="w-4 h-4" />
                  Snippet Step
                </button>
                <button
                  type="button"
                  onClick={() => addNewStep('workflow')}
                  className={`px-4 py-2 ${getColorClasses('workflow', 'button')} rounded-lg flex items-center gap-2`}
                >
                  <Workflow className="w-4 h-4" />
                  Workflow Step
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Nested Component Creator Modal */}
      {showNestedCreator && (
        <NestedComponentCreator
          stepId={showNestedCreator.stepId}
          initialType={showNestedCreator.type}
          onCreateComponent={(type, component) =>
            handleCreateNestedComponent(showNestedCreator.stepId, type, component)
          }
          onCancel={() => setShowNestedCreator(null)}
        />
      )}

      {/* Choice Option Component Creator Modal */}
      {showChoiceOptionCreator && (
        <NestedComponentCreator
          stepId={showChoiceOptionCreator.stepId}
          initialType={showChoiceOptionCreator.type}
          onCreateComponent={(type, component) =>
            handleCreateChoiceOptionComponent(
              showChoiceOptionCreator.stepId,
              showChoiceOptionCreator.optionId,
              type,
              component
            )
          }
          onCancel={() => setShowChoiceOptionCreator(null)}
        />
      )}
    </>
  );
};

export default WorkflowStepsEditor;
