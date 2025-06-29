import React, { useState } from 'react';
import { ArrowRight, Workflow, Trash2 } from 'lucide-react';
import { DEFAULT_CATEGORIES } from '../../types/template.types.js';

const WorkflowEditor = ({ workflow, templates, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: workflow?.name || '',
    description: workflow?.description || '',
    category: workflow?.category || 'General',
    steps: workflow?.steps || []
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

  const addTemplate = (template) => {
    const newStep = {
      id: `step_${Date.now()}`,
      templateId: template.id,
      name: `Step ${formData.steps.length + 1}: ${template.name}`,
      content: template.content,
      variables: template.variables
    };
    setFormData({
      ...formData,
      steps: [...formData.steps, newStep]
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
      [steps[currentIndex], steps[newIndex]] = [steps[newIndex], steps[currentIndex]];
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
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Workflow Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full p-3 border border-gray-600 bg-gray-800 text-gray-100 rounded-lg focus:ring-2 focus:ring-green-400 focus:border-transparent"
                placeholder="Enter workflow name..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full h-24 p-3 border border-gray-600 bg-gray-800 text-gray-100 rounded-lg focus:ring-2 focus:ring-green-400 focus:border-transparent"
                placeholder="Brief description..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                className="w-full p-3 border border-gray-600 bg-gray-800 text-gray-100 rounded-lg focus:ring-2 focus:ring-green-400 focus:border-transparent"
              >
                {DEFAULT_CATEGORIES.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-100 mb-3">Available Templates</h3>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {templates.map(template => (
                  <div key={template.id} className="p-3 border border-gray-600 bg-gray-800 text-gray-100 rounded-lg hover:bg-gray-700">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-100">{template.name}</h4>
                        <p className="text-sm text-gray-300">{template.description}</p>
                        <p className="text-xs text-gray-400">{template.variables.length} variables</p>
                      </div>
                      <button
                        onClick={() => addTemplate(template)}
                        className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Workflow Steps */}
          <div className="lg:col-span-2">
            <h3 className="text-lg font-semibold text-gray-100 mb-3">
              Workflow Steps ({formData.steps.length})
            </h3>
            
            {formData.steps.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-gray-600 rounded-lg">
                <Workflow className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Add templates from the left to build your workflow</p>
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
                          <h4 className="font-medium text-gray-100">{step.name}</h4>
                          <p className="text-sm text-gray-300">{step.variables.length} variables</p>
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
                    
                    <div className="bg-gray-900 rounded p-3 border border-gray-700">
                      <div className="text-sm text-gray-200 font-mono">
                        {step.content.split(/(\{[^}]+\})/).map((part, partIndex) => (
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

                    {index < formData.steps.length - 1 && (
                      <div className="flex justify-center mt-3">
                        <ArrowRight className="w-5 h-5 text-gray-400" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkflowEditor;
