import React, { useState, useEffect } from 'react';
import { Copy, ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { copyToClipboard } from '../../utils/clipboard.js';
import { extractAllVariables } from '../../types/template.types.js';

const ItemExecutor = ({ item, type, snippets = [], onComplete, onCancel }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [variableValues, setVariableValues] = useState({});
  const [stepOutputs, setStepOutputs] = useState([]);
  const [copied, setCopied] = useState(false);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [copiedAgainId, setCopiedAgainId] = useState(null);
  const [selectedTemplates, setSelectedTemplates] = useState({}); // stepId -> templateId

  const isWorkflow = type === 'workflow';
  const steps = isWorkflow ? item.steps : [{ content: item.content, variables: item.variables }];
  const currentStepData = steps[currentStep];
  
  // Get the current template for this step
  const getCurrentTemplate = () => {
    if (!isWorkflow) return currentStepData;
    
    // If step has multiple template options, get selected one
    if (currentStepData.templateOptions && currentStepData.templateOptions.length > 0) {
      const selectedTemplateId = selectedTemplates[currentStepData.id];
      const selectedTemplate = currentStepData.templateOptions.find(t => t.id === selectedTemplateId);
      return selectedTemplate || currentStepData.templateOptions[0]; // Default to first option
    }
    
    // Legacy single template step
    return currentStepData;
  };
  
  const currentTemplate = getCurrentTemplate();
  
  // Extract all variables including snippets from current template and sort by position
  const getAllTemplateVariables = () => {
    if (!currentTemplate.content) return { variables: [], snippetVariables: [], sortedVariables: [] };
    
    const { variables: regularVariables, snippetVariables } = extractAllVariables(currentTemplate.content);
    
    // Find all variables with their positions in the template
    const allMatches = [];
    const content = currentTemplate.content;
    
    // Find regular variables
    const regularMatches = content.match(/\{([^}]+)\}/g) || [];
    regularMatches.forEach(match => {
      const variable = match.slice(1, -1);
      if (!variable.startsWith('snippet:')) {
        const position = content.indexOf(match);
        allMatches.push({
          type: 'regular',
          variable,
          placeholder: match,
          position
        });
      }
    });
    
    // Find snippet variables
    snippetVariables.forEach(snippetVar => {
      const position = content.indexOf(snippetVar.placeholder);
      allMatches.push({
        type: 'snippet',
        variable: snippetVar.tag,
        placeholder: snippetVar.placeholder,
        position,
        snippetVar
      });
    });
    
    // Sort by position in template
    const sortedVariables = allMatches.sort((a, b) => a.position - b.position);
    
    return { 
      variables: regularVariables, 
      snippetVariables, 
      sortedVariables 
    };
  };
  
  const { variables: regularVariables, snippetVariables, sortedVariables } = getAllTemplateVariables();
  const allVariables = sortedVariables.map(v => v.placeholder);
  
  // Auto-focus first input on mount and step changes
  useEffect(() => {
    const timer = setTimeout(() => {
      const firstInput = document.querySelector('input[data-first-input="true"]');
      if (firstInput) {
        firstInput.focus();
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [currentStep]);

  const handleVariableChange = (variable, value) => {
    setVariableValues(prev => ({
      ...prev,
      [variable]: value
    }));
  };

  const generateOutput = () => {
    let output = currentTemplate.content;
    
    // Replace regular variables
    Object.entries(variableValues).forEach(([key, value]) => {
      if (!key.startsWith('{snippet:')) {
        output = output.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
      }
    });
    
    // Replace snippet placeholders with selected snippet content
    snippetVariables.forEach(snippetVar => {
      const snippetValue = variableValues[snippetVar.placeholder];
      if (snippetValue) {
        output = output.replace(new RegExp(`\\{snippet:${snippetVar.tag}\\}`, 'g'), snippetValue);
      }
    });
    
    return output;
  };

  const handleKeyDown = (e, isLastInput = false, currentIndex = 0) => {
    if ((e.key === 'Tab' || e.key === 'Enter') && isLastInput && canProceed) {
      // If this is the last input and user tabs/enters, check if we can auto-copy
      if (currentStepData.variables?.length <= 3) {
        // Auto-copy for simple templates
        e.preventDefault();
        handleCopyAndNext();
      } else if (e.key === 'Tab') {
        // For complex templates, let tab naturally move to copy button
        return;
      } else if (e.key === 'Enter') {
        // For complex templates, Enter should still auto-copy
        e.preventDefault();
        handleCopyAndNext();
      }
    } else if (e.key === 'Enter' && !isLastInput) {
      // Move to next input field on Enter
      e.preventDefault();
      const nextInput = document.querySelector(`input[tabindex="${currentIndex + 2}"], textarea[tabindex="${currentIndex + 2}"]`);
      if (nextInput) {
        nextInput.focus();
      }
    }
  };

  const handleCopyAndNext = async () => {
    const output = generateOutput();
    const success = await copyToClipboard(output);
    
    if (success) {
      setCopied(true);
      setCompletedSteps([...completedSteps, { stepIndex: currentStep, output }]);
      
      setTimeout(() => {
        setCopied(false);
        
        if (isWorkflow && currentStep < steps.length - 1) {
          // Move to next step in workflow
          setCurrentStep(currentStep + 1);
          setVariableValues({});
        } else {
          // Complete the execution
          onComplete();
        }
      }, 1500);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setVariableValues({});
      // Remove the completed step we're going back to
      setCompletedSteps(completedSteps.filter(step => step.stepIndex !== currentStep - 1));
    }
  };

  const canProceed = allVariables.every(variable => 
    variableValues[variable]?.trim()
  );
  
  const hasTemplateOptions = isWorkflow && currentStepData.templateOptions && currentStepData.templateOptions.length > 1;
  const needsTemplateSelection = hasTemplateOptions && !selectedTemplates[currentStepData.id];

  if (copied) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Copied to Clipboard!</h2>
          <p className="text-gray-600">
            {isWorkflow && currentStep < steps.length - 1
              ? "Use this prompt with AI, then come back for the next step."
              : "Your prompt has been copied and is ready to use."
            }
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-gray-900 rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-100">{item.name}</h2>
            {isWorkflow && (
              <div className="mt-2">
                <p className="text-gray-300 mb-2">
                  Step {currentStep + 1} of {steps.length}: {currentStepData.name}
                </p>
                {hasTemplateOptions && (
                  <p className="text-sm text-blue-300 mb-2">
                    Template options available ({currentStepData.templateOptions.length})
                  </p>
                )}
                {/* Progress indicator */}
                <div className="flex items-center gap-2">
                  {steps.map((_, index) => (
                    <div
                      key={index}
                      className={`w-3 h-3 rounded-full ${
                        index < currentStep
                          ? 'bg-green-500' // Completed
                          : index === currentStep
                          ? 'bg-blue-500' // Current
                          : 'bg-gray-300' // Upcoming
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-gray-300 border border-gray-600 rounded-lg hover:bg-gray-700"
              tabIndex={allVariables.length + 2 || 2}
            >
              Cancel
            </button>
            {completedSteps.length > 0 && (
              <button
                onClick={handlePrevious}
                className="px-4 py-2 bg-gray-800 text-gray-100 rounded-lg hover:bg-gray-700 flex items-center gap-2"
                tabIndex={allVariables.length + 3 || 3}
              >
                <ArrowLeft className="w-4 h-4" />
                Previous Step
              </button>
            )}
            <button
              onClick={handleCopyAndNext}
              onKeyDown={(e) => e.key === 'Enter' && handleCopyAndNext()}
              disabled={!canProceed || needsTemplateSelection}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              tabIndex={allVariables.length + 1 || 1}
            >
              <Copy className="w-4 h-4" />
              {isWorkflow && currentStep < steps.length - 1 
                ? 'Copy & Next Step' 
                : 'Copy & Complete'
              }
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            {/* Template Selection */}
            {hasTemplateOptions && (
              <div>
                <h3 className="text-lg font-semibold text-gray-100 mb-3">Choose Template</h3>
                <div className="space-y-2">
                  {currentStepData.templateOptions.map((template) => (
                    <div
                      key={template.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedTemplates[currentStepData.id] === template.id
                          ? 'border-blue-500 bg-blue-900/30'
                          : 'border-gray-600 bg-gray-800 hover:bg-gray-700'
                      }`}
                      onClick={() => {
                        setSelectedTemplates({
                          ...selectedTemplates,
                          [currentStepData.id]: template.id
                        });
                        setVariableValues({}); // Reset variables when template changes
                      }}
                    >
                      <h4 className="font-medium text-gray-100 mb-1">{template.name}</h4>
                      <p className="text-sm text-gray-300 mb-2">{template.description}</p>
                      <div className="text-xs text-gray-400 font-mono bg-gray-900 p-2 rounded">
                        {template.content.length > 100 
                          ? `${template.content.substring(0, 100)}...` 
                          : template.content
                        }
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div>
              <h3 className="text-lg font-semibold text-gray-100 mb-3">Fill in Variables</h3>
              {needsTemplateSelection ? (
                <p className="text-gray-500 italic">Select a template above to see variables</p>
              ) : (
                <>
                  {/* Variables in order of appearance */}
                  {sortedVariables.map((varData, index) => {
                    const isFirst = index === 0;
                    const isLast = index === sortedVariables.length - 1;
                    
                    if (varData.type === 'regular') {
                      const variable = varData.variable;
                      return (
                        <div key={variable} className="mb-4">
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            {variable.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </label>
                          {variable === 'previous_output' ? (
                            <textarea
                              value={variableValues[variable] || ''}
                              onChange={(e) => handleVariableChange(variable, e.target.value)}
                              onKeyDown={(e) => handleKeyDown(e, isLast, index)}
                              className="w-full h-24 p-3 border border-gray-600 bg-gray-800 text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                              placeholder="Output from previous step..."
                              readOnly={variable === 'previous_output' && stepOutputs.length > 0}
                              tabIndex={index + 1}
                              data-first-input={isFirst}
                            />
                          ) : (
                            <input
                              type="text"
                              value={variableValues[variable] || ''}
                              onChange={(e) => handleVariableChange(variable, e.target.value)}
                              onKeyDown={(e) => handleKeyDown(e, isLast, index)}
                              className="w-full p-3 border border-gray-600 bg-gray-800 text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                              placeholder={`Enter ${variable.replace(/_/g, ' ')}...`}
                              tabIndex={index + 1}
                              data-first-input={isFirst}
                            />
                          )}
                        </div>
                      );
                    } else {
                      // Snippet variable
                      const snippetVar = varData.snippetVar;
                      const filteredSnippets = snippets.filter(snippet => 
                        snippet.tags.includes(snippetVar.tag)
                      );
                      
                      return (
                        <div key={snippetVar.placeholder} className="mb-4">
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            {snippetVar.tag.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} (Snippet)
                          </label>
                          <select
                            value={variableValues[snippetVar.placeholder] || ''}
                            onChange={(e) => handleVariableChange(snippetVar.placeholder, e.target.value)}
                            className="w-full p-3 border border-gray-600 bg-gray-800 text-gray-100 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                            tabIndex={index + 1}
                            data-first-input={isFirst}
                          >
                            <option value="">Select a {snippetVar.tag} snippet...</option>
                            {filteredSnippets.map(snippet => (
                              <option key={snippet.id} value={snippet.content}>
                                {snippet.name}
                              </option>
                            ))}
                          </select>
                          {filteredSnippets.length === 0 && (
                            <p className="text-sm text-yellow-400 mt-1">
                              No snippets found with tag "{snippetVar.tag}"
                            </p>
                          )}
                        </div>
                      );
                    }
                  })}
                  
                  {sortedVariables.length === 0 && (
                    <p className="text-gray-500">No variables to fill for this step.</p>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-100 mb-3">Current Step Preview</h3>
              <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 min-h-48">
                <div className="prose prose-sm max-w-none whitespace-pre-wrap">
                  {needsTemplateSelection ? (
                    <p className="text-gray-500 italic text-center py-8">
                      Select a template above to see the preview
                    </p>
                  ) : (
                    generateOutput()
                  )}
                </div>
              </div>
            </div>

            {isWorkflow && completedSteps.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-100 mb-3">Completed Steps</h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {completedSteps.map((completedStep, index) => (
                    <div key={index} className="bg-green-900 rounded-lg p-3 border border-green-700">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs font-medium text-green-100">
                          Step {completedStep.stepIndex + 1} ✓
                        </p>
                        <button
                          onClick={async () => {
                            const success = await copyToClipboard(completedStep.output);
                            if (success) {
                              setCopiedAgainId(completedStep.stepIndex);
                              setTimeout(() => setCopiedAgainId(null), 1500);
                            }
                          }}
                          className="text-xs text-green-300 hover:text-green-100"
                        >
                          {copiedAgainId === completedStep.stepIndex ? 'Copied! ✓' : 'Copy Again'}
                        </button>
                      </div>
                      <p className="text-sm text-gray-200 truncate">{completedStep.output}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {isWorkflow && (
              <div className="bg-blue-900 rounded-lg p-4 border border-blue-700">
                <h4 className="text-sm font-semibold text-blue-100 mb-2">💡 Workflow Tip</h4>
                <p className="text-sm text-blue-200">
                  Complete each step individually. Copy the prompt, use it with your AI, 
                  then return here for the next step in the workflow.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItemExecutor;
