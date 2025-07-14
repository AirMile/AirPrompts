import React, { useState } from 'react';
import { ArrowRight, Workflow, Trash2, Plus, X, FileText, Info, Tag } from 'lucide-react';
import { createWorkflowStep } from '../../types/template.types.js';
import FolderSelector from '../common/FolderSelector.jsx';

const WorkflowEditor = ({ workflow, templates, inserts = [], folders = [], onSave, onCancel }) => {
  const [formData, setFormData] = useState(() => {
    return {
      name: workflow?.name || '',
      description: workflow?.description || '',
      folderId: workflow?.folderId || 'workflows',
      steps: workflow?.steps || [],
      addonTags: workflow?.addonTags || []
    };
  });

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
      templateOptions: type === 'template' ? [] : undefined
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
            name: step.templateOptions.length === 0 ? `Step ${formData.steps.findIndex(s => s.id === stepId) + 1}: ${template.name}` : step.name
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
        const targetTemplateOptions = steps[newIndex].templateOptions;
        
        steps[currentIndex] = {
          ...steps[currentIndex],
          templateOptions: targetTemplateOptions
        };
        
        steps[newIndex] = {
          ...steps[newIndex],
          templateOptions: currentTemplateOptions
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
                Addon Tags
              </label>
              <input
                type="text"
                value={formData.addonTags.join(', ')}
                onChange={(e) => {
                  const tags = e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag);
                  setFormData({...formData, addonTags: tags});
                }}
                className="w-full p-3 border border-gray-600 bg-gray-800 text-gray-100 rounded-lg focus:ring-2 focus:ring-green-400 focus:border-transparent"
                placeholder="Enter addon tags separated by commas (e.g., enhancement, quality, technical)"
              />
              <p className="mt-1 text-sm text-gray-400">
                Only addons with these tags will be shown when using this workflow
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
                    Insert Step
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
                            {step.type === 'template' && `${step.templateOptions?.length || 0} template option(s)`}
                            {step.type === 'info' && 'Information step'}
                            {step.type === 'insert' && 'Insert step'}
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
                      {step.type === 'template' && (
                        <>
                          {step.templateOptions?.map((template) => (
                            <div key={template.id} className="bg-gray-900 rounded p-3 border border-gray-700">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-medium text-gray-100">{template.name}</h4>
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
                          
                          {/* Add Template to Step */}
                          <div className="border-2 border-dashed border-gray-600 rounded-lg p-3">
                            <p className="text-sm text-gray-400 mb-2">Add template option:</p>
                            <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto">
                              {templates.filter(t => !step.templateOptions?.find(opt => opt.id === t.id)).map(template => (
                                <button
                                  key={template.id}
                                  onClick={() => addTemplateToStep(step.id, template)}
                                  className="text-left p-2 border border-gray-600 bg-gray-700 text-gray-100 rounded hover:bg-gray-600"
                                >
                                  <div className="font-medium text-sm">{template.name}</div>
                                  <div className="text-xs text-gray-300">{template.variables.length} variables</div>
                                </button>
                              ))}
                            </div>
                          </div>
                        </>
                      )}
                      
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
                      
                      {step.type === 'insert' && (
                        <div className="border-2 border-dashed border-purple-600 rounded-lg p-3">
                          <p className="text-sm text-purple-400 mb-2">Select insert to copy:</p>
                          <select
                            value={step.insertId || ''}
                            onChange={(e) => {
                              const selectedInsert = inserts.find(i => i.id == e.target.value);
                              setFormData({
                                ...formData,
                                steps: formData.steps.map(s => 
                                  s.id === step.id ? { 
                                    ...s, 
                                    insertId: e.target.value || null,
                                    insertContent: selectedInsert?.content || ''
                                  } : s
                                )
                              });
                            }}
                            className="w-full p-3 border border-gray-600 bg-gray-800 text-gray-100 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                          >
                            <option value="">Select an insert...</option>
                            {inserts.map(insert => (
                              <option key={insert.id} value={insert.id}>
                                {insert.name}
                              </option>
                            ))}
                          </select>
                          {step.insertContent && (
                            <div className="mt-2 p-2 bg-gray-900 rounded border border-gray-700">
                              <p className="text-xs text-purple-300 mb-1">Preview:</p>
                              <p className="text-sm text-gray-200">{step.insertContent}</p>
                            </div>
                          )}
                        </div>
                      )}
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
                      Insert Step
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
