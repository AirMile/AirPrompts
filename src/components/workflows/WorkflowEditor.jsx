import React, { useState, useCallback } from 'react';
import { ArrowRight, Workflow, Trash2, Plus, X, FileText, Info, Tag, Layers, Search, Filter } from 'lucide-react';
import { createWorkflowStep } from '../../types/template.types.js';
import FolderSelector from '../common/FolderSelector.jsx';

// Separate SearchAndFilter component to prevent re-renders
const SearchAndFilter = ({ 
  stepId, 
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
    return {
      name: workflow?.name || '',
      description: workflow?.description || '',
      folderId: workflow?.folderId || 'workflows',
      steps: workflow?.steps || [],
      snippetTags: workflow?.snippetTags || []
    };
  });

  // Search and filter states
  const [searchStates, setSearchStates] = useState({});
  const [filterStates, setFilterStates] = useState({});

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

  const filterTemplates = (stepId, allTemplates = templates) => {
    const searchTerm = getSearchTerm(stepId, 'template').toLowerCase();
    const filterFolder = getFilterFolder(stepId, 'template');
    
    return allTemplates.filter(template => {
      const matchesSearch = !searchTerm || 
        template.name.toLowerCase().includes(searchTerm) ||
        template.description?.toLowerCase().includes(searchTerm);
      const matchesFolder = !filterFolder || template.folderId === filterFolder;
      return matchesSearch && matchesFolder;
    });
  };

  const filterSnippets = (stepId, allSnippets = snippets) => {
    const searchTerm = getSearchTerm(stepId, 'snippet').toLowerCase();
    const filterFolder = getFilterFolder(stepId, 'snippet');
    
    return allSnippets.filter(snippet => {
      const matchesSearch = !searchTerm || 
        snippet.name.toLowerCase().includes(searchTerm) ||
        snippet.description?.toLowerCase().includes(searchTerm) ||
        snippet.tags.some(tag => tag.toLowerCase().includes(searchTerm));
      const matchesFolder = !filterFolder || snippet.folderId === filterFolder;
      return matchesSearch && matchesFolder;
    });
  };

  const getUniqueFolders = (items) => {
    const folderIds = [...new Set(items.map(item => item.folderId))];
    return folderIds.map(id => folders.find(f => f.id === id)).filter(Boolean);
  };

  const handleSave = () => {
    const newWorkflow = {
      id: workflow?.id || Date.now(),
      ...formData,
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
      snippetOptions: []
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
      // Only swap the content, not the entire step objects
      if (steps[currentIndex].type === 'template' && steps[newIndex].type === 'template') {
        const currentTemplateOptions = steps[currentIndex].templateOptions;
        const currentSnippetOptions = steps[currentIndex].snippetOptions || [];
        const targetTemplateOptions = steps[newIndex].templateOptions;
        const targetSnippetOptions = steps[newIndex].snippetOptions || [];
        
        steps[currentIndex] = {
          ...steps[currentIndex],
          templateOptions: targetTemplateOptions,
          snippetOptions: targetSnippetOptions
        };
        
        steps[newIndex] = {
          ...steps[newIndex],
          templateOptions: currentTemplateOptions,
          snippetOptions: currentSnippetOptions
        };
      } else {
        // For other step types, swap relevant content
        const currentContent = steps[currentIndex].content || '';
        const currentInsertId = steps[currentIndex].insertId;
        const currentInsertContent = steps[currentIndex].insertContent || '';
        
        const targetContent = steps[newIndex].content || '';
        const targetInsertId = steps[newIndex].insertId;
        const targetInsertContent = steps[newIndex].insertContent || '';
        
        steps[currentIndex] = {
          ...steps[currentIndex],
          content: targetContent,
          insertId: targetInsertId,
          insertContent: targetInsertContent
        };
        
        steps[newIndex] = {
          ...steps[newIndex],
          content: currentContent,
          insertId: currentInsertId,
          insertContent: currentInsertContent
        };
      }
      
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

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Snippet Tags
              </label>
              <input
                type="text"
                value={formData.snippetTags.join(', ')}
                onChange={(e) => {
                  const tags = e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag);
                  setFormData({...formData, snippetTags: tags});
                }}
                className="w-full p-3 border border-gray-600 bg-gray-800 text-gray-100 rounded-lg focus:ring-2 focus:ring-green-400 focus:border-transparent"
                placeholder="Enter snippet tags separated by commas (e.g., enhancement, quality, technical)"
              />
              <p className="mt-1 text-sm text-gray-400">
                Only snippets with these tags will be shown when using this workflow
              </p>
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
                          onClick={() => moveStep(step.id, 'up')}
                          disabled={index === 0}
                          className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-30"
                        >
                          ↑
                        </button>
                        <button
                          onClick={() => moveStep(step.id, 'down')}
                          disabled={index === formData.steps.length - 1}
                          className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-30"
                        >
                          ↓
                        </button>
                        <button
                          onClick={() => removeStep(step.id)}
                          className="p-1 text-red-500 hover:text-red-700 ml-2"
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
                            stepId={`insert-${step.id}`}
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
                      
                      {/* Step Information Toggle - Available for all step types except pure info */}
                      {step.type !== 'info' || (step.templateOptions && step.templateOptions.length > 0) || (step.snippetOptions && step.snippetOptions.length > 0) ? (
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
                              stepId={`${step.id}-add`}
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
                              stepId={`${step.id}-add`}
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
                            stepId={step.id}
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
                            stepId={step.id}
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
