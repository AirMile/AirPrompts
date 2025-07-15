import React, { useState } from 'react';
import { ArrowRight, Workflow, Trash2, Plus, X, FileText, Info, Tag, Layers, Search, Filter } from 'lucide-react';
import { createWorkflowStep } from '../../types/template.types.js';
import FolderSelector from '../common/FolderSelector.jsx';

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
  const filteredItems = items.filter(item => {
    const matchesSearch = !searchTerm || 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (type === 'snippet' && item.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())));
    const matchesFolder = !filterFolder || item.folderId === filterFolder;
    return matchesSearch && matchesFolder;
  });

  const uniqueFolders = [...new Set(items.map(item => item.folderId))]
    .map(id => folders.find(f => f.id === id))
    .filter(Boolean);
  
  return (
    <div>
      {/* Search and Filter Controls */}
      <div className="mb-3 space-y-2">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder={`Search ${type}s...`}
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-600 bg-gray-800 text-gray-100 rounded text-sm focus:ring-2 focus:ring-blue-400 focus:border-transparent"
            />
          </div>
          <div className="relative">
            <Filter className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <select
              value={filterFolder}
              onChange={(e) => onFilterChange(e.target.value)}
              className="pl-10 pr-3 py-2 border border-gray-600 bg-gray-800 text-gray-100 rounded text-sm focus:ring-2 focus:ring-blue-400 focus:border-transparent"
            >
              <option value="">All folders</option>
              {uniqueFolders.map(folder => (
                <option key={folder.id} value={folder.id}>{folder.name}</option>
              ))}
            </select>
          </div>
        </div>
        
        {/* Results count */}
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>{filteredItems.length} {type}(s) found</span>
          {(searchTerm || filterFolder) && (
            <button
              onClick={() => {
                onSearchChange('');
                onFilterChange('');
              }}
              className="text-blue-400 hover:text-blue-300"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Items List */}
      <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto">
        {filteredItems.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-lg mb-2">🔍</div>
            <p>No {type}s found</p>
            {searchTerm && <p className="text-sm">Try adjusting your search terms</p>}
          </div>
        ) : (
          filteredItems.map(item => (
            <button
              key={item.id}
              onClick={() => onItemSelect(item)}
              className="text-left p-2 border border-gray-600 bg-gray-700 text-gray-100 rounded hover:bg-gray-600 transition-colors"
            >
              {renderItem(item)}
            </button>
          ))
        )}
      </div>
    </div>
  );
};

const WorkflowEditor = ({ workflow, templates, snippets = [], folders = [], onSave, onCancel }) => {
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
      id: workflow?.id || Date.now(),
      ...formData,
      steps: processedSteps,
      lastUsed: workflow?.lastUsed || new Date().toISOString(),
      favorite: workflow?.favorite || false
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
    setFormData({
      ...formData,
      steps: formData.steps.map(step => {
        if (step.id === stepId) {
          const updatedOptions = [...step.templateOptions, template];
          return {
            ...step,
            templateOptions: updatedOptions,
            name: step.templateOptions.length === 0 && step.snippetOptions.length === 0 ? `Step ${formData.steps.findIndex(s => s.id === stepId) + 1}: ${template.name}` : step.name
          };
        }
        return step;
      })
    });
  };

  const addSnippetToStep = (stepId, snippet) => {
    setFormData({
      ...formData,
      steps: formData.steps.map(step => {
        if (step.id === stepId) {
          const updatedOptions = [...(step.snippetOptions || []), snippet];
          return {
            ...step,
            snippetOptions: updatedOptions,
            name: step.templateOptions.length === 0 && step.snippetOptions.length === 0 ? `Step ${formData.steps.findIndex(s => s.id === stepId) + 1}: ${snippet.name}` : step.name
          };
        }
        return step;
      })
    });
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
      <div className="bg-gray-900 rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-100">
            {workflow ? 'Edit Workflow' : 'Create New Workflow'}
          </h2>
          <div className="flex gap-2">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-gray-300 border border-gray-600 rounded-lg hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Save Workflow
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Workflow Details */}
          <div className="space-y-4">
            <div>
              <label htmlFor="workflowName" className="block text-sm font-medium text-gray-300 mb-2">
                Workflow Name
              </label>
              <input
                type="text"
                id="workflowName"
                name="workflowName"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full p-3 border border-gray-600 bg-gray-800 text-gray-100 rounded-lg focus:ring-2 focus:ring-green-400 focus:border-transparent"
                placeholder="Enter workflow name..."
              />
            </div>

            <div>
              <label htmlFor="workflowDescription" className="block text-sm font-medium text-gray-300 mb-2">
                Description
              </label>
              <textarea
                id="workflowDescription"
                name="workflowDescription"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full h-32 p-3 border border-gray-600 bg-gray-800 text-gray-100 rounded-lg focus:ring-2 focus:ring-green-400 focus:border-transparent"
                placeholder="Brief description..."
              />
            </div>

            <div>
              <label htmlFor="workflowFolder" className="block text-sm font-medium text-gray-300 mb-2">
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
              <h3 className="text-lg font-semibold text-gray-100">
                Workflow Steps ({formData.steps.length})
              </h3>
            </div>
            
            {formData.steps.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-gray-600 rounded-lg">
                <Workflow className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-300 mb-2">Create Your First Step</h4>
                <p className="text-gray-500 mb-4">Choose the type of step to add to your workflow:</p>
                <div className="flex justify-center gap-3">
                  <button
                    onClick={() => addNewStep('template')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                  >
                    <FileText className="w-4 h-4" />
                    Template Step
                  </button>
                  <button
                    onClick={() => addNewStep('info')}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                  >
                    <Info className="w-4 h-4" />
                    Info Step
                  </button>
                  <button
                    onClick={() => addNewStep('insert')}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
                  >
                    <Tag className="w-4 h-4" />
                    Snippet Step
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {formData.steps.map((step, index) => (
                  <div key={step.id} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                          {index + 1}
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            {step.type === 'template' && <FileText className="w-4 h-4 text-blue-400" />}
                            {step.type === 'info' && <Info className="w-4 h-4 text-green-400" />}
                            {step.type === 'insert' && <Tag className="w-4 h-4 text-purple-400" />}
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
                              className="bg-transparent text-gray-100 font-medium border-none outline-none focus:bg-gray-700 px-2 py-1 rounded"
                              placeholder="Step name..."
                            />
                          </div>
                          <p className="text-sm text-gray-300">
                            {step.type === 'template' && `${step.templateOptions?.length || 0} template(s), ${step.snippetOptions?.length || 0} snippet(s)`}
                            {step.type === 'info' && 'Information step'}
                            {step.type === 'insert' && 'Snippet insert step'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => moveStep(step.id, 'up')}
                          disabled={index === 0}
                          className="p-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gray-300 transition-colors"
                          title="Move step up"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          onClick={() => moveStep(step.id, 'down')}
                          disabled={index === formData.steps.length - 1}
                          className="p-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gray-300 transition-colors"
                          title="Move step down"
                        >
                          ↓
                        </button>
                        <button
                          type="button"
                          onClick={() => removeStep(step.id)}
                          className="p-2 text-red-500 hover:text-red-700 hover:bg-red-900/20 rounded ml-2 transition-colors"
                          title="Delete step"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    {/* Step Content Based on Type */}
                    <div className="space-y-3">
                      {/* Info Step Content */}
                      {step.type === 'info' && (
                        <div className="border-2 border-dashed border-green-600 rounded-lg p-3">
                          <p className="text-sm text-green-400 mb-2">Information content:</p>
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
                            className="w-full h-24 p-3 border border-gray-600 bg-gray-800 text-gray-100 rounded-lg focus:ring-2 focus:ring-green-400 focus:border-transparent"
                            placeholder="Enter instructions or information for this step..."
                          />
                        </div>
                      )}
                      
                      {/* Insert Step Content */}
                      {step.type === 'insert' && !step.insertId && (
                        <div className="border-2 border-dashed border-purple-600 rounded-lg p-3">
                          <p className="text-sm text-purple-400 mb-3 flex items-center gap-2">
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
                                  <div className="text-xs text-gray-400 mt-1">{snippet.description}</div>
                                )}
                                <div className="text-xs text-gray-300 flex flex-wrap gap-1 mt-1">
                                  {snippet.tags.map(tag => (
                                    <span key={tag} className="px-1 py-0.5 bg-purple-100 text-purple-800 rounded text-xs">
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
                        <div className="bg-gray-900 rounded p-3 border border-gray-700">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Tag className="w-4 h-4 text-purple-400" />
                              <h4 className="font-medium text-gray-100">
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
                              className="p-1 text-red-500 hover:text-red-700"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="text-sm text-gray-200">
                            {step.insertContent}
                          </div>
                        </div>
                      )}
                      
                      {/* Show existing templates */}
                      {step.templateOptions?.map((template) => (
                        <div key={template.id} className="bg-gray-900 rounded p-3 border border-gray-700">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4 text-blue-400" />
                              <h4 className="font-medium text-gray-100">{template.name}</h4>
                            </div>
                            <button
                              onClick={() => removeTemplateFromStep(step.id, template.id)}
                              className="p-1 text-red-500 hover:text-red-700"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="text-sm text-gray-200 font-mono">
                            {template.content.split(/(\{[^}]+\})/).map((part, partIndex) => (
                              <span key={partIndex}>
                                {part.match(/\{[^}]+\}/) ? (
                                  <span className="bg-green-100 text-green-800 px-1 rounded">
                                    {part}
                                  </span>
                                ) : (
                                  part
                                )}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                      
                      {/* Show existing snippets */}
                      {step.snippetOptions?.map((snippet) => (
                        <div key={snippet.id} className="bg-gray-900 rounded p-3 border border-gray-700">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Layers className="w-4 h-4 text-purple-400" />
                              <h4 className="font-medium text-gray-100">{snippet.name}</h4>
                            </div>
                            <button
                              onClick={() => removeSnippetFromStep(step.id, snippet.id)}
                              className="p-1 text-red-500 hover:text-red-700"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="text-sm text-gray-200">
                            {snippet.content.length > 100 ? `${snippet.content.substring(0, 100)}...` : snippet.content}
                          </div>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {snippet.tags.map(tag => (
                              <span key={tag} className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                      
                      {/* Step Information Toggle - Available for all step types except info */}
                      {step.type !== 'info' ? (
                        !step.information || step.information === '' ? (
                          // CTA to add information
                          <div className="border-2 border-dashed border-green-600 rounded-lg p-4 text-center">
                            <p className="text-sm text-green-400 flex items-center justify-center gap-2 mb-2">
                              <Info className="w-4 h-4" />
                              Step Information (Optional)
                            </p>
                            <p className="text-sm text-gray-500 italic mb-3">
                              Include helpful information or instructions for this step.
                            </p>
                            <button
                              type="button"
                              onClick={() => {
                                setFormData({
                                  ...formData,
                                  steps: formData.steps.map(s => 
                                    s.id === step.id ? { ...s, information: ' ' } : s
                                  )
                                });
                              }}
                              className='px-4 py-2 rounded text-sm font-medium transition-colors bg-green-600 text-white hover:bg-green-700'
                            >
                              Add Information
                            </button>
                          </div>
                        ) : (
                          // View/edit information
                          <div className="border-2 border-solid border-green-700 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-sm text-green-400 flex items-center gap-2">
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
                                className='px-3 py-1 rounded text-xs font-medium transition-colors bg-red-600 text-white hover:bg-red-700 flex items-center gap-1'
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
                              className="w-full h-20 p-3 border border-gray-600 bg-gray-800 text-gray-100 rounded-lg focus:ring-2 focus:ring-green-400 focus:border-transparent"
                              placeholder="Add helpful information or instructions for this step..."
                            />
                            <p className="mt-1 text-xs text-gray-400">
                              This information will be displayed to users when executing this step
                            </p>
                          </div>
                        )
                      ) : null}
                      
                      {/* Snippet Tags Field - Only show when step has templates or snippets */}
                      {((step.templateOptions && step.templateOptions.length > 0) || 
                        (step.snippetOptions && step.snippetOptions.length > 0)) ? (
                        <div className="border border-gray-600 rounded-lg p-3">
                          <label className="block text-sm font-medium text-gray-300 mb-2">
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
                              className="flex-1 p-2 border border-gray-600 bg-gray-800 text-gray-100 rounded focus:ring-2 focus:ring-blue-400 focus:border-transparent text-sm"
                              placeholder="Add tags (press Enter or comma to add)..."
                            />
                            <button
                              onClick={() => handleAddTag(step.id)}
                              className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
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
                                  className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-sm flex items-center gap-1"
                                >
                                  {tag}
                                  <button
                                    onClick={() => handleRemoveTag(step.id, tag)}
                                    className="text-purple-600 hover:text-purple-800"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </span>
                              ))}
                            </div>
                          )}
                          
                          <p className="mt-1 text-xs text-gray-400">
                            Only snippets with these tags will be shown when executing this step
                          </p>
                        </div>
                      ) : null}
                      
                      {/* Add Options - Show when step has content or existing options */}
                      {(step.type === 'info' && step.content) || 
                       (step.type === 'insert' && step.insertId) ||
                       (step.templateOptions && step.templateOptions.length > 0) ||
                       (step.snippetOptions && step.snippetOptions.length > 0) ? (
                        <div className="border-2 border-dashed border-gray-600 rounded-lg p-3">
                          <p className="text-sm text-gray-400 mb-3">Add more options to step:</p>
                          
                          <div className="flex justify-center gap-2 mb-4">
                            <button
                              onClick={() => {
                                // Show template selection dropdown
                                const stepElement = document.getElementById(`template-dropdown-${step.id}`);
                                if (stepElement) {
                                  stepElement.style.display = stepElement.style.display === 'none' ? 'block' : 'none';
                                }
                              }}
                              className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
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
                              className="px-3 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 flex items-center gap-2"
                            >
                              <Layers className="w-4 h-4" />
                              Add Snippet
                            </button>
                          </div>
                          
                          {/* Template Selection Dropdown */}
                          <div id={`template-dropdown-${step.id}`} style={{ display: 'none' }} className="mb-4">
                            <p className="text-sm text-blue-400 mb-3 flex items-center gap-2">
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
                                  <div className="text-xs text-gray-300">{template.variables.length} variables</div>
                                  {template.description && (
                                    <div className="text-xs text-gray-400 mt-1">{template.description}</div>
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
                          <div id={`snippet-dropdown-${step.id}`} style={{ display: 'none' }}>
                            <p className="text-sm text-purple-400 mb-3 flex items-center gap-2">
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
                                    <div className="text-xs text-gray-400 mt-1">{snippet.description}</div>
                                  )}
                                  <div className="text-xs text-gray-300 flex flex-wrap gap-1 mt-1">
                                    {snippet.tags.map(tag => (
                                      <span key={tag} className="px-1 py-0.5 bg-purple-100 text-purple-800 rounded text-xs">
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
                        </div>
                      ) : null}
                      
                      {/* Template Step - Direct template selection */}
                      {step.type === 'template' && 
                       (!step.templateOptions || step.templateOptions.length === 0) &&
                       (!step.snippetOptions || step.snippetOptions.length === 0) ? (
                        <div className="border-2 border-dashed border-blue-600 rounded-lg p-3">
                          <p className="text-sm text-blue-400 mb-3 flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            Select template:
                          </p>
                          <SearchAndFilter
                            type="template"
                            items={templates}
                            onItemSelect={(template) => addTemplateToStep(step.id, template)}
                            renderItem={(template) => (
                              <div>
                                <div className="font-medium text-sm">{template.name}</div>
                                <div className="text-xs text-gray-300">{template.variables.length} variables</div>
                                {template.description && (
                                  <div className="text-xs text-gray-400 mt-1">{template.description}</div>
                                )}
                              </div>
                            )}
                            searchTerm={getSearchTerm(step.id, 'template')}
                            onSearchChange={(term) => setSearchTerm(step.id, 'template', term)}
                            filterFolder={getFilterFolder(step.id, 'template')}
                            onFilterChange={(folder) => setFilterFolder(step.id, 'template', folder)}
                            folders={folders}
                          />
                        </div>
                      ) : null}
                      
                      {/* Snippet Step - Direct snippet selection */}
                      {step.type === 'snippet' && 
                       (!step.templateOptions || step.templateOptions.length === 0) &&
                       (!step.snippetOptions || step.snippetOptions.length === 0) ? (
                        <div className="border-2 border-dashed border-purple-600 rounded-lg p-3">
                          <p className="text-sm text-purple-400 mb-3 flex items-center gap-2">
                            <Layers className="w-4 h-4" />
                            Select snippet:
                          </p>
                          <SearchAndFilter
                            type="snippet"
                            items={snippets}
                            onItemSelect={(snippet) => addSnippetToStep(step.id, snippet)}
                            renderItem={(snippet) => (
                              <div>
                                <div className="font-medium text-sm">{snippet.name}</div>
                                {snippet.description && (
                                  <div className="text-xs text-gray-400 mt-1">{snippet.description}</div>
                                )}
                                <div className="text-xs text-gray-300 flex flex-wrap gap-1 mt-1">
                                  {snippet.tags.map(tag => (
                                    <span key={tag} className="px-1 py-0.5 bg-purple-100 text-purple-800 rounded text-xs">
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                            searchTerm={getSearchTerm(step.id, 'snippet')}
                            onSearchChange={(term) => setSearchTerm(step.id, 'snippet', term)}
                            filterFolder={getFilterFolder(step.id, 'snippet')}
                            onFilterChange={(folder) => setFilterFolder(step.id, 'snippet', folder)}
                            folders={folders}
                          />
                        </div>
                      ) : null}
                    </div>
                  </div>
                ))}
                
                {/* Add Next Step Section */}
                <div className="text-center py-8 border-2 border-dashed border-gray-600 rounded-lg">
                  <h4 className="text-md font-medium text-gray-300 mb-2">Add Next Step</h4>
                  <p className="text-gray-500 mb-4">Choose the type of step to add to your workflow:</p>
                  <div className="flex justify-center gap-3">
                    <button
                      onClick={() => addNewStep('template')}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                    >
                      <FileText className="w-4 h-4" />
                      Template Step
                    </button>
                    <button
                      onClick={() => addNewStep('info')}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                    >
                      <Info className="w-4 h-4" />
                      Info Step
                    </button>
                    <button
                      onClick={() => addNewStep('insert')}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
                    >
                      <Tag className="w-4 h-4" />
                      Snippet Step
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
