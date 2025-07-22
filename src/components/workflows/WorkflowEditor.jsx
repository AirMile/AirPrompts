import React, { useState } from 'react';
import { ArrowRight, Workflow, Trash2, Plus, X, FileText, Info, Tag, Layers, Search, Filter } from 'lucide-react';
import { createWorkflowStep } from '../../types/template.types.js';
import FolderSelector from '../shared/form/FolderSelector.jsx';
import { useItemColors } from '../../hooks/useItemColors.js';

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
  folders 
}) => {
  const filteredItems = (items || []).filter(item => {
    const matchesSearch = !searchTerm || 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (type === 'snippet' && (item.tags || []).some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())));
    const matchesFolder = !filterFolder || item.folderId === filterFolder;
    return matchesSearch && matchesFolder;
  });

  const uniqueFolders = [...new Set((items || []).map(item => item.folderId))]
    .map(id => (folders || []).find(f => f.id === id))
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
              {uniqueFolders.map(folder => (
                <option key={folder.id} value={folder.id}>{folder.name}</option>
              ))}
            </select>
          </div>
        </div>
        
        {/* Results count */}
        <div className="flex items-center justify-between text-xs text-secondary-600 dark:text-secondary-400">
          <span>{filteredItems.length} {type}(s) found</span>
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
          filteredItems.map(item => (
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

const WorkflowEditor = ({ workflow, templates, snippets = [], workflows = [], folders = [], onSave, onCancel }) => {
  const { getColorClasses } = useItemColors();
  
  const [formData, setFormData] = useState(() => {
    // Process existing workflow steps to handle info steps with snippetIds/templateId
    const processedSteps = workflow?.steps?.map(step => {
      if (step.type === 'info') {
        const processedStep = { ...step };
        
        // Convert snippetIds back to snippetOptions for editing
        if (step.snippetIds && step.snippetIds.length > 0) {
          processedStep.snippetOptions = step.snippetIds
            .map(id => snippets.find(s => s.id === id))
            .filter(Boolean);
        }
        
        // Convert templateId back to templateOptions for editing
        if (step.templateId) {
          const template = templates.find(t => t.id === step.templateId);
          if (template) {
            processedStep.templateOptions = [template];
          }
        }
        
        // Convert workflowIds back to workflowOptions for editing
        if (step.workflowIds && step.workflowIds.length > 0) {
          processedStep.workflowOptions = step.workflowIds
            .map(id => workflows.find(w => w.id === id))
            .filter(Boolean);
        }
        
        // Move info field to content for editing
        if (step.info && !step.content) {
          processedStep.content = step.info;
        }
        
        return processedStep;
      }
      return step;
    }) || [];
    
    return {
      name: workflow?.name || '',
      description: workflow?.description || '',
      folderId: workflow?.folderId || 'workflows',
      steps: processedSteps
    };
  });

  // Search and filter states
  const [searchStates, setSearchStates] = useState({});
  const [filterStates, setFilterStates] = useState({});
  
  // Tag input states for each step
  const [tagInputs, setTagInputs] = useState({});

  const getSearchTerm = (stepId, type) => searchStates[`${stepId}-${type}`] || '';
  const getFilterFolder = (stepId, type) => filterStates[`${stepId}-${type}`] || '';

  const setSearchTerm = (stepId, type, term) => {
    setSearchStates(prev => ({
      ...prev,
      [`${stepId}-${type}`]: term
    }));
  };

  const setFilterFolder = (stepId, type, folder) => {
    setFilterStates(prev => ({
      ...prev,
      [`${stepId}-${type}`]: folder
    }));
  };

  const getTagInput = (stepId) => tagInputs[stepId] || '';
  
  const setTagInput = (stepId, value) => {
    setTagInputs(prev => ({
      ...prev,
      [stepId]: value
    }));
  };

  const handleAddTag = (stepId) => {
    const newTag = getTagInput(stepId).trim().toLowerCase();
    const step = formData.steps.find(s => s.id === stepId);
    
    if (newTag && step && !step.snippetTags?.includes(newTag)) {
      setFormData({
        ...formData,
        steps: formData.steps.map(s => 
          s.id === stepId 
            ? { ...s, snippetTags: [...(s.snippetTags || []), newTag] }
            : s
        )
      });
      setTagInput(stepId, '');
    }
  };

  const handleRemoveTag = (stepId, tagToRemove) => {
    setFormData({
      ...formData,
      steps: formData.steps.map(s => 
        s.id === stepId 
          ? { ...s, snippetTags: (s.snippetTags || []).filter(tag => tag !== tagToRemove) }
          : s
      )
    });
  };

  const handleTagKeyPress = (e, stepId) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag(stepId);
    } else if (e.key === ',' || e.key === ' ') {
      e.preventDefault();
      handleAddTag(stepId);
    }
  };



  const handleSave = () => {
    // Process steps to handle info steps with snippets/templates
    const processedSteps = formData.steps.map(step => {
      if (step.type === 'info') {
        const processedStep = { ...step };
        
        // If info step has snippetOptions, convert to snippetIds
        if (step.snippetOptions && step.snippetOptions.length > 0) {
          processedStep.snippetIds = step.snippetOptions.map(s => s.id);
        }
        
        // If info step has templateOptions and only one, set templateId
        if (step.templateOptions && step.templateOptions.length === 1) {
          processedStep.templateId = step.templateOptions[0].id;
        }
        
        // If info step has workflowOptions, convert to workflowIds
        if (step.workflowOptions && step.workflowOptions.length > 0) {
          processedStep.workflowIds = step.workflowOptions.map(w => w.id);
        }
        
        // Store info content in the 'info' field
        if (step.content) {
          processedStep.info = step.content;
          delete processedStep.content;
        }
        
        return processedStep;
      }
      return step;
    });
    
    const newWorkflow = {
      // Only include ID for existing workflows (updates)
      ...(workflow?.id && { id: workflow.id }),
      // API-compatible fields only
      name: formData.name,
      description: formData.description,
      category: workflow?.category || formData.folderId || 'general',
      steps: processedSteps,
      favorite: workflow?.favorite || false,
      // Keep UI-specific fields separate for localStorage fallback
      folderId: formData.folderId,
      lastUsed: workflow?.lastUsed || new Date().toISOString()
    };
    onSave(newWorkflow);
  };

  const addNewStep = (type = 'template') => {
    const newStep = createWorkflowStep({
      name: `Step ${formData.steps.length + 1}`,
      type: type,
      templateOptions: [],
      snippetOptions: [],
      snippetTags: []
    });
    setFormData({
      ...formData,
      steps: [...formData.steps, newStep]
    });
  };

  const addTemplateToStep = (stepId, template) => {
    setFormData(prevData => ({
      ...prevData,
      steps: prevData.steps.map(step => {
        if (step.id === stepId) {
          // Check if template already exists to prevent duplicates
          const templateExists = step.templateOptions.some(t => t.id === template.id);
          if (templateExists) {
            return step;
          }
          
          // Add order field for chronological sorting
          const allExistingItems = [
            ...(step.templateOptions || []),
            ...(step.snippetOptions || []),
            ...(step.workflowOptions || [])
          ];
          const maxOrder = allExistingItems.reduce((max, item) => Math.max(max, item.order || 0), 0);
          
          const templateWithOrder = { ...template, order: maxOrder + 1 };
          const updatedOptions = [...step.templateOptions, templateWithOrder];
          
          return {
            ...step,
            templateOptions: updatedOptions,
            name: step.templateOptions.length === 0 && step.snippetOptions.length === 0 ? `Step ${prevData.steps.findIndex(s => s.id === stepId) + 1}: ${template.name}` : step.name
          };
        }
        return step;
      })
    }));
  };

  const addSnippetToStep = (stepId, snippet) => {
    setFormData(prevData => ({
      ...prevData,
      steps: prevData.steps.map(step => {
        if (step.id === stepId) {
          // Check if snippet already exists to prevent duplicates
          const snippetExists = (step.snippetOptions || []).some(s => s.id === snippet.id);
          if (snippetExists) {
            return step;
          }
          
          // Add order field for chronological sorting
          const allExistingItems = [
            ...(step.templateOptions || []),
            ...(step.snippetOptions || []),
            ...(step.workflowOptions || [])
          ];
          const maxOrder = allExistingItems.reduce((max, item) => Math.max(max, item.order || 0), 0);
          
          const snippetWithOrder = { ...snippet, order: maxOrder + 1 };
          const updatedOptions = [...(step.snippetOptions || []), snippetWithOrder];
          
          return {
            ...step,
            snippetOptions: updatedOptions,
            name: step.templateOptions.length === 0 && step.snippetOptions.length === 0 ? `Step ${prevData.steps.findIndex(s => s.id === stepId) + 1}: ${snippet.name}` : step.name
          };
        }
        return step;
      })
    }));
  };

  const removeTemplateFromStep = (stepId, templateId) => {
    setFormData({
      ...formData,
      steps: formData.steps.map(step => {
        if (step.id === stepId) {
          const updatedOptions = step.templateOptions.filter(t => t.id !== templateId);
          return {
            ...step,
            templateOptions: updatedOptions
          };
        }
        return step;
      })
    });
  };

  const removeSnippetFromStep = (stepId, snippetId) => {
    setFormData({
      ...formData,
      steps: formData.steps.map(step => {
        if (step.id === stepId) {
          const updatedOptions = (step.snippetOptions || []).filter(s => s.id !== snippetId);
          return {
            ...step,
            snippetOptions: updatedOptions
          };
        }
        return step;
      })
    });
  };

  const addWorkflowToStep = (stepId, workflowItem) => {
    setFormData(prevData => ({
      ...prevData,
      steps: prevData.steps.map(step => {
        if (step.id === stepId) {
          // Check if workflow already exists to prevent duplicates
          const workflowExists = (step.workflowOptions || []).some(w => w.id === workflowItem.id);
          if (workflowExists) {
            return step;
          }
          
          // Add order field for chronological sorting
          const allExistingItems = [
            ...(step.templateOptions || []),
            ...(step.snippetOptions || []),
            ...(step.workflowOptions || [])
          ];
          const maxOrder = allExistingItems.reduce((max, item) => Math.max(max, item.order || 0), 0);
          
          const workflowWithOrder = { ...workflowItem, order: maxOrder + 1 };
          const updatedOptions = [...(step.workflowOptions || []), workflowWithOrder];
          
          return {
            ...step,
            workflowOptions: updatedOptions,
            name: step.templateOptions?.length === 0 && step.snippetOptions?.length === 0 && (step.workflowOptions?.length === 0 || !step.workflowOptions) 
              ? `Step ${prevData.steps.findIndex(s => s.id === stepId) + 1}: ${workflowItem.name}` 
              : step.name
          };
        }
        return step;
      })
    }));
  };

  const removeWorkflowFromStep = (stepId, workflowId) => {
    setFormData({
      ...formData,
      steps: formData.steps.map(step => {
        if (step.id === stepId) {
          const updatedOptions = (step.workflowOptions || []).filter(w => w.id !== workflowId);
          return {
            ...step,
            workflowOptions: updatedOptions
          };
        }
        return step;
      })
    });
  };

  const removeStep = (stepId) => {
    setFormData({
      ...formData,
      steps: formData.steps.filter(step => step.id !== stepId)
    });
  };

  const moveStep = (stepId, direction) => {
    const steps = [...formData.steps];
    const currentIndex = steps.findIndex(step => step.id === stepId);
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    
    if (newIndex >= 0 && newIndex < steps.length) {
      // Swap the entire step objects
      const temp = steps[currentIndex];
      steps[currentIndex] = steps[newIndex];
      steps[newIndex] = temp;
      
      setFormData({ ...formData, steps });
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white dark:bg-secondary-900 rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-secondary-900 dark:text-secondary-100">
            {workflow ? 'Edit Workflow' : 'Create New Workflow'}
          </h2>
          <div className="flex gap-2">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-secondary-600 dark:text-secondary-300 border border-secondary-400 dark:border-secondary-600 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-700 transition-all duration-200"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-success-600 text-white rounded-lg hover:bg-success-700 transition-all duration-200"
            >
              Save Workflow
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Workflow Details */}
          <div className="space-y-4">
            <div>
              <label htmlFor="workflowName" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                Workflow Name
              </label>
              <input
                type="text"
                id="workflowName"
                name="workflowName"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full p-3 border border-secondary-300 dark:border-secondary-600 bg-white dark:bg-secondary-800 text-secondary-900 dark:text-secondary-100 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
                placeholder="Enter workflow name..."
              />
            </div>

            <div>
              <label htmlFor="workflowDescription" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                Description
              </label>
              <textarea
                id="workflowDescription"
                name="workflowDescription"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full h-32 p-3 border border-secondary-300 dark:border-secondary-600 bg-white dark:bg-secondary-800 text-secondary-900 dark:text-secondary-100 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
                placeholder="Brief description..."
              />
            </div>

            <div>
              <label htmlFor="workflowFolder" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                Folder
              </label>
              <FolderSelector
                id="workflowFolder"
                name="workflowFolder"
                folders={folders}
                selectedFolderId={formData.folderId}
                onFolderSelect={(folderId) => setFormData({...formData, folderId})}
                focusRingColor="green"
              />
            </div>

          </div>

          {/* Workflow Steps */}
          <div className="lg:col-span-2">
            <div className="mb-3">
              <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">
                Workflow Steps ({formData.steps.length})
              </h3>
            </div>
            
            {formData.steps.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-secondary-300 dark:border-secondary-600 rounded-lg">
                <Workflow className="w-12 h-12 text-secondary-500 dark:text-secondary-400 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-secondary-700 dark:text-secondary-300 mb-2">Create Your First Step</h4>
                <p className="text-secondary-600 dark:text-secondary-500 mb-4">Choose the type of step to add to your workflow:</p>
                <div className="flex justify-center gap-3">
                  <button
                    onClick={() => addNewStep('template')}
                    className={`px-4 py-2 ${getColorClasses('template', 'button')} rounded-lg flex items-center gap-2`}
                  >
                    <FileText className="w-4 h-4" />
                    Template Step
                  </button>
                  <button
                    onClick={() => addNewStep('info')}
                    className={`px-4 py-2 ${getColorClasses('info', 'button')} rounded-lg flex items-center gap-2`}
                  >
                    <Info className="w-4 h-4" />
                    Info Step
                  </button>
                  <button
                    onClick={() => addNewStep('insert')}
                    className={`px-4 py-2 ${getColorClasses('snippet', 'button')} rounded-lg flex items-center gap-2`}
                  >
                    <Tag className="w-4 h-4" />
                    Snippet Step
                  </button>
                  <button
                    onClick={() => addNewStep('workflow')}
                    className={`px-4 py-2 ${getColorClasses('workflow', 'button')} rounded-lg flex items-center gap-2`}
                  >
                    <Workflow className="w-4 h-4" />
                    Workflow Step
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {formData.steps.map((step, index) => (
                  <div key={step.id} className="bg-secondary-100 dark:bg-secondary-800 rounded-lg p-4 border border-secondary-300 dark:border-secondary-700">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 bg-success-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                          {index + 1}
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            {step.type === 'template' && <FileText className={`w-4 h-4 ${getColorClasses('template', 'icon')}`} />}
                            {step.type === 'info' && <Info className={`w-4 h-4 ${getColorClasses('info', 'icon')}`} />}
                            {step.type === 'insert' && <Tag className={`w-4 h-4 ${getColorClasses('snippet', 'icon')}`} />}
                            {step.type === 'workflow' && <Workflow className={`w-4 h-4 ${getColorClasses('workflow', 'icon')}`} />}
                            <input
                              type="text"
                              id={`stepName-${step.id}`}
                              name={`stepName-${step.id}`}
                              value={step.name}
                              onChange={(e) => {
                                setFormData({
                                  ...formData,
                                  steps: formData.steps.map(s => 
                                    s.id === step.id ? { ...s, name: e.target.value } : s
                                  )
                                });
                              }}
                              className="bg-transparent text-secondary-900 dark:text-secondary-100 font-medium border-none outline-none focus:bg-secondary-200 dark:focus:bg-secondary-700 px-2 py-1 rounded"
                              placeholder="Step name..."
                            />
                          </div>
                          <p className="text-sm text-secondary-600 dark:text-secondary-300">
                            {step.type === 'template' && `${step.templateOptions?.length || 0} template(s), ${step.snippetOptions?.length || 0} snippet(s)`}
                            {step.type === 'info' && 'Information step'}
                            {step.type === 'insert' && 'Snippet insert step'}
                            {step.type === 'workflow' && `${step.workflowOptions?.length || 0} workflow(s)`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => moveStep(step.id, 'up')}
                          disabled={index === 0}
                          className="p-2 text-secondary-600 dark:text-secondary-300 hover:text-secondary-900 dark:hover:text-white hover:bg-secondary-200 dark:hover:bg-secondary-700 rounded disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-secondary-600 dark:disabled:hover:text-secondary-300 transition-colors"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          onClick={() => moveStep(step.id, 'down')}
                          disabled={index === formData.steps.length - 1}
                          className="p-2 text-secondary-600 dark:text-secondary-300 hover:text-secondary-900 dark:hover:text-white hover:bg-secondary-200 dark:hover:bg-secondary-700 rounded disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-secondary-600 dark:disabled:hover:text-secondary-300 transition-colors"
                        >
                          ↓
                        </button>
                        <button
                          type="button"
                          onClick={() => removeStep(step.id)}
                          className="p-2 text-danger-500 hover:text-danger-700 hover:bg-danger-900/20 rounded ml-2 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    
                    {/* Step Content Based on Type */}
                    <div className="space-y-3">
                      {/* Info Step Content */}
                      {step.type === 'info' && (
                        <div className="border-2 border-dashed border-success-600 rounded-lg p-3">
                          <p className="text-sm text-success-400 mb-2">Information content:</p>
                          <textarea
                            id={`infoContent-${step.id}`}
                            name={`infoContent-${step.id}`}
                            value={step.content || ''}
                            onChange={(e) => {
                              setFormData({
                                ...formData,
                                steps: formData.steps.map(s => 
                                  s.id === step.id ? { ...s, content: e.target.value } : s
                                )
                              });
                            }}
                            className="w-full h-24 p-3 border border-secondary-300 dark:border-secondary-600 bg-white dark:bg-secondary-800 text-secondary-900 dark:text-secondary-100 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            placeholder="Enter instructions or information for this step..."
                          />
                        </div>
                      )}
                      
                      {/* Insert Step Content */}
                      {step.type === 'insert' && !step.insertId && (
                        <div className="border-2 border-dashed border-warning-600 rounded-lg p-3">
                          <p className="text-sm text-warning-400 mb-3 flex items-center gap-2">
                            <Tag className="w-4 h-4" />
                            Select snippet to copy:
                          </p>
                          <SearchAndFilter
                            type="snippet"
                            items={snippets}
                            onItemSelect={(snippet) => {
                              setFormData({
                                ...formData,
                                steps: formData.steps.map(s => 
                                  s.id === step.id ? { 
                                    ...s, 
                                    insertId: snippet.id,
                                    insertContent: snippet.content
                                  } : s
                                )
                              });
                            }}
                            renderItem={(snippet) => (
                              <div>
                                <div className="font-medium text-sm">{snippet.name}</div>
                                {snippet.description && (
                                  <div className="text-xs text-secondary-400 mt-1">{snippet.description}</div>
                                )}
                                <div className="text-xs text-secondary-300 flex flex-wrap gap-1 mt-1">
                                  {snippet.tags.map(tag => (
                                    <span key={tag} className="px-1 py-0.5 bg-warning-100 text-warning-800 rounded text-xs">
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                            searchTerm={getSearchTerm(`insert-${step.id}`, 'snippet')}
                            onSearchChange={(term) => setSearchTerm(`insert-${step.id}`, 'snippet', term)}
                            filterFolder={getFilterFolder(`insert-${step.id}`, 'snippet')}
                            onFilterChange={(folder) => setFilterFolder(`insert-${step.id}`, 'snippet', folder)}
                            folders={folders}
                          />
                        </div>
                      )}
                      
                      {/* Insert Step - Show selected snippet */}
                      {step.type === 'insert' && step.insertId && (
                        <div className="bg-secondary-200 dark:bg-secondary-900 rounded p-3 border border-secondary-300 dark:border-secondary-700">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Tag className="w-4 h-4 text-warning-400" />
                              <h4 className="font-medium text-secondary-900 dark:text-secondary-100">
                                {snippets.find(s => s.id == step.insertId)?.name || 'Selected Snippet'}
                              </h4>
                            </div>
                            <button
                              onClick={() => {
                                setFormData({
                                  ...formData,
                                  steps: formData.steps.map(s => 
                                    s.id === step.id ? { 
                                      ...s, 
                                      insertId: null,
                                      insertContent: ''
                                    } : s
                                  )
                                });
                              }}
                              className="p-1 text-danger-500 hover:text-danger-700"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="text-sm text-secondary-700 dark:text-secondary-200">
                            {step.insertContent}
                          </div>
                        </div>
                      )}
                      
                      {/* Show all items sorted by chronological order */}
                      {(() => {
                        // Combine all items with their order
                        const allItems = [
                          ...(step.templateOptions || []).map(template => ({
                            type: 'template',
                            item: template,
                            order: template.order || 0
                          })),
                          ...(step.snippetOptions || []).map(snippet => ({
                            type: 'snippet',
                            item: snippet,
                            order: snippet.order || 0
                          })),
                          ...(step.workflowOptions || []).map(workflowItem => ({
                            type: 'workflow',
                            item: workflowItem,
                            order: workflowItem.order || 0
                          }))
                        ];
                        
                        // Sort by order (chronological)
                        allItems.sort((a, b) => a.order - b.order);
                        
                        return allItems.map(({ type, item, order }, index) => {
                          if (type === 'template') {
                            return (
                              <div key={`template-${item.id || `temp-${type}-${index}`}`} className="bg-secondary-900 rounded p-3 border border-secondary-700">
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-primary-400" />
                                    <h4 className="font-medium text-secondary-900 dark:text-secondary-100">{item.name}</h4>
                                    <span className="text-xs text-secondary-600 dark:text-secondary-500">#{order}</span>
                                  </div>
                                  <button
                                    onClick={() => removeTemplateFromStep(step.id, item.id)}
                                    className="p-1 text-danger-500 hover:text-danger-700"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                                <div className="text-sm text-secondary-200 font-mono">
                                  {(item.content || '').split(/(\{[^}]+\})/).map((part, partIndex) => (
                                    <span key={partIndex}>
                                      {part.match(/\{[^}]+\}/) ? (
                                        <span className="bg-success-100 text-success-800 px-1 rounded">
                                          {part}
                                        </span>
                                      ) : (
                                        part
                                      )}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            );
                          } else if (type === 'snippet') {
                            return (
                              <div key={`snippet-${item.id || `temp-${type}-${index}`}`} className="bg-secondary-900 rounded p-3 border border-secondary-700">
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <Layers className="w-4 h-4 text-warning-400" />
                                    <h4 className="font-medium text-secondary-900 dark:text-secondary-100">{item.name}</h4>
                                    <span className="text-xs text-secondary-600 dark:text-secondary-500">#{order}</span>
                                  </div>
                                  <button
                                    onClick={() => removeSnippetFromStep(step.id, item.id)}
                                    className="p-1 text-danger-500 hover:text-danger-700"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                                <div className="text-sm text-secondary-700 dark:text-secondary-200">
                                  {item.content.length > 100 ? `${item.content.substring(0, 100)}...` : item.content}
                                </div>
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {item.tags.map(tag => (
                                    <span key={tag} className="px-2 py-1 bg-warning-100 text-warning-800 text-xs rounded">
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            );
                          } else if (type === 'workflow') {
                            return (
                              <div key={`workflow-${item.id || `temp-${type}-${index}`}`} className="bg-secondary-900 rounded p-3 border border-secondary-700">
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <Workflow className="w-4 h-4 text-orange-400" />
                                    <h4 className="font-medium text-secondary-900 dark:text-secondary-100">{item.name}</h4>
                                    <span className="text-xs text-secondary-600 dark:text-secondary-500">#{order}</span>
                                  </div>
                                  <button
                                    onClick={() => removeWorkflowFromStep(step.id, item.id)}
                                    className="p-1 text-danger-500 hover:text-danger-700"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                                <div className="text-sm text-secondary-700 dark:text-secondary-200">
                                  {item.steps?.length || 0} steps
                                  {item.description && ` - ${item.description}`}
                                </div>
                              </div>
                            );
                          }
                          return null;
                        });
                      })()}
                      
                      {/* Step Information - Only show when explicitly added */}
                      {step.type !== 'info' && step.information && step.information !== '' ? (
                        <div className="border-2 border-solid border-success-700 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-sm text-success-400 flex items-center gap-2">
                              <Info className="w-4 h-4" />
                              Step Information
                            </p>
                            <button
                              type="button"
                              onClick={() => {
                                setFormData({
                                  ...formData,
                                  steps: formData.steps.map(s => 
                                    s.id === step.id ? { ...s, information: '' } : s
                                  )
                                });
                              }}
                              className='px-3 py-1 rounded text-xs font-medium transition-colors bg-danger-600 text-white hover:bg-danger-700 flex items-center gap-1'
                            >
                              <Trash2 className="w-3 h-3" />
                              Remove
                            </button>
                          </div>
                          <textarea
                            id={`stepInformation-${step.id}`}
                            name={`stepInformation-${step.id}`}
                            value={step.information === ' ' ? '' : step.information || ''}
                            onChange={(e) => {
                              setFormData({
                                ...formData,
                                steps: formData.steps.map(s => 
                                  s.id === step.id ? { ...s, information: e.target.value } : s
                                )
                              });
                            }}
                            className="w-full h-20 p-3 border border-secondary-300 dark:border-secondary-600 bg-white dark:bg-secondary-800 text-secondary-900 dark:text-secondary-100 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            placeholder="Add helpful information or instructions for this step..."
                          />
                          <p className="mt-1 text-xs text-secondary-600 dark:text-secondary-400">
                            This information will be displayed to users when executing this step
                          </p>
                        </div>
                      ) : null}
                      
                      {/* Snippet Tags Field - Only show when step has templates or snippets */}
                      {((step.templateOptions && step.templateOptions.length > 0) || 
                        (step.snippetOptions && step.snippetOptions.length > 0)) ? (
                        <div className="border border-secondary-300 dark:border-secondary-600 rounded-lg p-3">
                          <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                            <Tag className="w-4 h-4 inline mr-1" />
                            Snippet Tags for this Step
                          </label>
                          
                          {/* Tag input field */}
                          <div className="flex gap-2 mb-3">
                            <input
                              type="text"
                              value={getTagInput(step.id)}
                              onChange={(e) => setTagInput(step.id, e.target.value)}
                              onKeyDown={(e) => handleTagKeyPress(e, step.id)}
                              className="flex-1 p-2 border border-secondary-300 dark:border-secondary-600 bg-white dark:bg-secondary-800 text-secondary-900 dark:text-secondary-100 rounded focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                              placeholder="Add tags (press Enter or comma to add)..."
                            />
                            <button
                              onClick={() => handleAddTag(step.id)}
                              className="px-3 py-2 bg-primary-600 text-white rounded hover:bg-primary-700"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                          
                          {/* Display existing tags */}
                          {step.snippetTags && step.snippetTags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-2">
                              {step.snippetTags.map(tag => (
                                <span 
                                  key={tag} 
                                  className="px-2 py-1 bg-warning-100 text-warning-800 rounded text-sm flex items-center gap-1"
                                >
                                  {tag}
                                  <button
                                    onClick={() => handleRemoveTag(step.id, tag)}
                                    className="text-warning-600 hover:text-warning-800"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </span>
                              ))}
                            </div>
                          )}
                          
                          <p className="mt-1 text-xs text-secondary-600 dark:text-secondary-400">
                            Only snippets with these tags will be shown when executing this step
                          </p>
                        </div>
                      ) : null}
                      
                      {/* Template Step Selection - Show when no templates selected yet */}
                      {step.type === 'template' && (!step.templateOptions || step.templateOptions.length === 0) ? (
                        <div className="border-2 border-dashed border-primary-600 rounded-lg p-3">
                          <p className="text-sm text-primary-400 mb-3 flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            Select Template:
                          </p>
                          <SearchAndFilter
                            type="template"
                            items={templates}
                            onItemSelect={(template) => {
                              addTemplateToStep(step.id, template);
                            }}
                            renderItem={(template) => (
                              <div>
                                <div className="font-medium text-sm">{template.name}</div>
                                <div className="text-xs text-secondary-300">{template.variables.length} variables</div>
                                {template.description && (
                                  <div className="text-xs text-secondary-400 mt-1">{template.description}</div>
                                )}
                              </div>
                            )}
                            searchTerm={getSearchTerm(`${step.id}-select`, 'template')}
                            onSearchChange={(term) => setSearchTerm(`${step.id}-select`, 'template', term)}
                            filterFolder={getFilterFolder(`${step.id}-select`, 'template')}
                            onFilterChange={(folder) => setFilterFolder(`${step.id}-select`, 'template', folder)}
                            folders={folders}
                          />
                        </div>
                      ) : null}
                      
                      {/* Workflow Step Selection - Show when no workflows selected yet */}
                      {step.type === 'workflow' && (!step.workflowOptions || step.workflowOptions.length === 0) ? (
                        <div className="border-2 border-dashed border-orange-600 rounded-lg p-3">
                          <p className="text-sm text-orange-400 mb-3 flex items-center gap-2">
                            <Workflow className="w-4 h-4" />
                            Select Workflow:
                          </p>
                          <SearchAndFilter
                            type="workflow"
                            items={workflows.filter(w => w.id !== workflow?.id)}
                            onItemSelect={(selectedWorkflow) => {
                              addWorkflowToStep(step.id, selectedWorkflow);
                            }}
                            renderItem={(workflowItem) => (
                              <div>
                                <div className="font-medium text-sm">{workflowItem.name}</div>
                                <div className="text-xs text-secondary-300">{workflowItem.steps?.length || 0} steps</div>
                                {workflowItem.description && (
                                  <div className="text-xs text-secondary-400 mt-1">{workflowItem.description}</div>
                                )}
                              </div>
                            )}
                            searchTerm={getSearchTerm(`${step.id}-select`, 'workflow')}
                            onSearchChange={(term) => setSearchTerm(`${step.id}-select`, 'workflow', term)}
                            filterFolder={getFilterFolder(`${step.id}-select`, 'workflow')}
                            onFilterChange={(folder) => setFilterFolder(`${step.id}-select`, 'workflow', folder)}
                            folders={folders}
                          />
                        </div>
                      ) : null}
                      
                      {/* Add Options - Show when step has content or existing options */}
                      {(step.type === 'info' && step.content) || 
                       (step.type === 'insert' && step.insertId) ||
                       (step.templateOptions && step.templateOptions.length > 0) ||
                       (step.snippetOptions && step.snippetOptions.length > 0) ||
                       (step.workflowOptions && step.workflowOptions.length > 0) ? (
                        <div className="border-2 border-dashed border-secondary-600 rounded-lg p-3">
                          <p className="text-sm text-secondary-600 dark:text-secondary-400 mb-3">Add more options to step:</p>
                          
                          <div className="flex justify-center gap-2 mb-4">
                            <button
                              onClick={() => {
                                // Show template selection dropdown
                                const stepElement = document.getElementById(`template-dropdown-${step.id}`);
                                if (stepElement) {
                                  stepElement.style.display = stepElement.style.display === 'none' ? 'block' : 'none';
                                }
                              }}
                              className={`px-3 py-2 ${getColorClasses('template', 'button')} rounded flex items-center gap-2`}
                            >
                              <FileText className="w-4 h-4" />
                              Add Template
                            </button>
                            
                            <button
                              onClick={() => {
                                // Show snippet selection dropdown
                                const stepElement = document.getElementById(`snippet-dropdown-${step.id}`);
                                if (stepElement) {
                                  stepElement.style.display = stepElement.style.display === 'none' ? 'block' : 'none';
                                }
                              }}
                              className={`px-3 py-2 ${getColorClasses('snippet', 'button')} rounded flex items-center gap-2`}
                            >
                              <Layers className="w-4 h-4" />
                              Add Snippet
                            </button>
                            
                            <button
                              onClick={() => {
                                // Show workflow selection dropdown
                                const stepElement = document.getElementById(`workflow-dropdown-${step.id}`);
                                if (stepElement) {
                                  stepElement.style.display = stepElement.style.display === 'none' ? 'block' : 'none';
                                }
                              }}
                              className={`px-3 py-2 ${getColorClasses('workflow', 'button')} rounded flex items-center gap-2`}
                            >
                              <Workflow className="w-4 h-4" />
                              Add Workflow
                            </button>
                            
                            {/* Add Info button - only show if step doesn't have information yet and step is not an info step */}
                            {step.type !== 'info' && (!step.information || step.information === '') && (
                              <button
                                onClick={() => {
                                  setFormData({
                                    ...formData,
                                    steps: formData.steps.map(s => 
                                      s.id === step.id ? { ...s, information: ' ' } : s
                                    )
                                  });
                                }}
                                className="px-3 py-2 bg-success-600 text-white rounded hover:bg-success-700 flex items-center gap-2"
                              >
                                <Info className="w-4 h-4" />
                                Add Info
                              </button>
                            )}
                          </div>
                          
                          {/* Template Selection Dropdown */}
                          <div id={`template-dropdown-${step.id}`} style={{ display: 'none' }} className="mb-4">
                            <p className="text-sm text-primary-400 mb-3 flex items-center gap-2">
                              <FileText className="w-4 h-4" />
                              Select Template:
                            </p>
                            <SearchAndFilter
                              type="template"
                              items={templates.filter(t => !step.templateOptions?.find(opt => opt.id === t.id))}
                              onItemSelect={(template) => {
                                addTemplateToStep(step.id, template);
                                document.getElementById(`template-dropdown-${step.id}`).style.display = 'none';
                              }}
                              renderItem={(template) => (
                                <div>
                                  <div className="font-medium text-sm">{template.name}</div>
                                  <div className="text-xs text-secondary-300">{template.variables.length} variables</div>
                                  {template.description && (
                                    <div className="text-xs text-secondary-400 mt-1">{template.description}</div>
                                  )}
                                </div>
                              )}
                              searchTerm={getSearchTerm(`${step.id}-add`, 'template')}
                              onSearchChange={(term) => setSearchTerm(`${step.id}-add`, 'template', term)}
                              filterFolder={getFilterFolder(`${step.id}-add`, 'template')}
                              onFilterChange={(folder) => setFilterFolder(`${step.id}-add`, 'template', folder)}
                              folders={folders}
                            />
                          </div>
                          
                          {/* Snippet Selection Dropdown */}
                          <div id={`snippet-dropdown-${step.id}`} style={{ display: 'none' }} className="mb-4">
                            <p className="text-sm text-warning-400 mb-3 flex items-center gap-2">
                              <Layers className="w-4 h-4" />
                              Select Snippet:
                            </p>
                            <SearchAndFilter
                              type="snippet"
                              items={snippets.filter(s => !step.snippetOptions?.find(opt => opt.id === s.id))}
                              onItemSelect={(snippet) => {
                                addSnippetToStep(step.id, snippet);
                                document.getElementById(`snippet-dropdown-${step.id}`).style.display = 'none';
                              }}
                              renderItem={(snippet) => (
                                <div>
                                  <div className="font-medium text-sm">{snippet.name}</div>
                                  {snippet.description && (
                                    <div className="text-xs text-secondary-400 mt-1">{snippet.description}</div>
                                  )}
                                  <div className="text-xs text-secondary-300 flex flex-wrap gap-1 mt-1">
                                    {(snippet.tags || []).map(tag => (
                                      <span key={tag} className="px-1 py-0.5 bg-warning-100 text-warning-800 rounded text-xs">
                                        {tag}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                              searchTerm={getSearchTerm(`${step.id}-add`, 'snippet')}
                              onSearchChange={(term) => setSearchTerm(`${step.id}-add`, 'snippet', term)}
                              filterFolder={getFilterFolder(`${step.id}-add`, 'snippet')}
                              onFilterChange={(folder) => setFilterFolder(`${step.id}-add`, 'snippet', folder)}
                              folders={folders}
                            />
                          </div>
                          
                          {/* Workflow Selection Dropdown */}
                          <div id={`workflow-dropdown-${step.id}`} style={{ display: 'none' }}>
                            <p className="text-sm text-orange-400 mb-3 flex items-center gap-2">
                              <Workflow className="w-4 h-4" />
                              Select Workflow:
                            </p>
                            <SearchAndFilter
                              type="workflow"
                              items={workflows.filter(w => w.id !== workflow?.id && !step.workflowOptions?.find(opt => opt.id === w.id))}
                              onItemSelect={(selectedWorkflow) => {
                                addWorkflowToStep(step.id, selectedWorkflow);
                                document.getElementById(`workflow-dropdown-${step.id}`).style.display = 'none';
                              }}
                              renderItem={(workflowItem) => (
                                <div>
                                  <div className="font-medium text-sm">{workflowItem.name}</div>
                                  <div className="text-xs text-secondary-300">{workflowItem.steps?.length || 0} steps</div>
                                  {workflowItem.description && (
                                    <div className="text-xs text-secondary-400 mt-1">{workflowItem.description}</div>
                                  )}
                                </div>
                              )}
                              searchTerm={getSearchTerm(`${step.id}-add`, 'workflow')}
                              onSearchChange={(term) => setSearchTerm(`${step.id}-add`, 'workflow', term)}
                              filterFolder={getFilterFolder(`${step.id}-add`, 'workflow')}
                              onFilterChange={(folder) => setFilterFolder(`${step.id}-add`, 'workflow', folder)}
                              folders={folders}
                            />
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>
                ))}
                
                {/* Add Next Step Section */}
                <div className="text-center py-8 border-2 border-dashed border-secondary-300 dark:border-secondary-600 rounded-lg">
                  <h4 className="text-md font-medium text-secondary-700 dark:text-secondary-300 mb-2">Add Next Step</h4>
                  <p className="text-secondary-600 dark:text-secondary-500 mb-4">Choose the type of step to add to your workflow:</p>
                  <div className="flex justify-center gap-3">
                    <button
                      onClick={() => addNewStep('template')}
                      className={`px-4 py-2 ${getColorClasses('template', 'button')} rounded-lg flex items-center gap-2`}
                    >
                      <FileText className="w-4 h-4" />
                      Template Step
                    </button>
                    <button
                      onClick={() => addNewStep('info')}
                      className={`px-4 py-2 ${getColorClasses('info', 'button')} rounded-lg flex items-center gap-2`}
                    >
                      <Info className="w-4 h-4" />
                      Info Step
                    </button>
                    <button
                      onClick={() => addNewStep('insert')}
                      className={`px-4 py-2 ${getColorClasses('snippet', 'button')} rounded-lg flex items-center gap-2`}
                    >
                      <Tag className="w-4 h-4" />
                      Snippet Step
                    </button>
                    <button
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
        </div>
      </div>
    </div>
  );
};

export default WorkflowEditor;
