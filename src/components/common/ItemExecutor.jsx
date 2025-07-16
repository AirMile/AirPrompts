import React, { useState, useEffect } from 'react';
import { Copy, ArrowLeft, ArrowRight, Check, Info, Tag, Plus, Edit, FileText, Layers, Workflow } from 'lucide-react';
import { copyToClipboard } from '../../utils/clipboard.js';
import { extractAllVariables } from '../../types/template.types.js';

const ItemExecutor = ({ item, type, snippets = [], onComplete, onCancel, onEdit }) => {
  const isWorkflow = type === 'workflow';
  const steps = isWorkflow ? item.steps : [{ content: item.content, variables: item.variables }];
  
  // State voor huidige step
  const [currentStep, setCurrentStep] = useState(0);
  const currentStepData = steps[currentStep];
  
  // Different logic for different step types
  const getStepType = () => {
    if (!isWorkflow) return type; // Use the passed type prop for non-workflows
    
    // Check if info step has templates or snippets attached
    if (currentStepData.type === 'info') {
      // If info step has template or snippet IDs, treat it as template/snippet step
      if (currentStepData.templateId || currentStepData.snippetIds?.length > 0) {
        return currentStepData.snippetIds?.length > 0 && !currentStepData.templateId ? 'snippet' : 'template';
      }
    }
    
    return currentStepData.type || 'template';
  };
  
  const stepType = getStepType();
  
  // Filter snippets based on current step's snippet tags (for auto-append functionality)
  const getFilteredSnippets = () => {
    // For info steps and workflow steps, never show snippets
    if (stepType === 'info' || stepType === 'workflow') {
      return [];
    }
    
    // Get snippet tags from current step if workflow, otherwise from item
    const snippetTags = isWorkflow ? (currentStepData.snippetTags || []) : (item.snippetTags || []);
    
    // If no tags are specified, don't show any snippets
    if (!snippetTags || snippetTags.length === 0) {
      return [];
    }
    
    return snippets.filter(snippet => {
      if (!snippet.enabled) return false;
      if (!snippet.tags || snippet.tags.length === 0) return false;
      
      // Check if snippet has any of the step's tags
      return snippetTags.some(stepTag => 
        snippet.tags.some(snippetTag => 
          snippetTag.toLowerCase() === stepTag.toLowerCase()
        )
      );
    });
  };

  const filteredSnippets = getFilteredSnippets();
  const [variableValues, setVariableValues] = useState({});
  const [stepOutputs] = useState([]);
  const [copied, setCopied] = useState(false);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [selectedOptions, setSelectedOptions] = useState({}); // stepId -> { type: 'template'|'snippet', id: itemId }
  const [selectedSnippets, setSelectedSnippets] = useState(new Set()); // Set of snippet IDs

  // Track if we're in keyboard navigation mode
  const [keyboardNavigating, setKeyboardNavigating] = useState(new Set());

  // Track programmatic changes to prevent unwanted closing
  const [programmaticChange, setProgrammaticChange] = useState(new Set());


  
  // Get all available options (templates and snippets combined) for current step
  const getAllStepOptions = () => {
    if (!isWorkflow) {
      return [];
    }
    
    // Check if this is an info step with templates/snippets
    if (currentStepData.type === 'info' && (currentStepData.templateId || currentStepData.snippetIds?.length > 0)) {
      const options = [];
      
      // If info step has a template ID, load that template
      if (currentStepData.templateId) {
        // In a real app, you'd fetch the template from your data store
        // For now, we'll create a placeholder
        options.push({
          type: 'template',
          id: currentStepData.templateId,
          item: {
            id: currentStepData.templateId,
            name: `Template ${currentStepData.templateId}`,
            content: currentStepData.content || '',
            variables: currentStepData.variables || []
          }
        });
      }
      
      // If info step has snippet IDs, load those snippets
      if (currentStepData.snippetIds?.length > 0) {
        currentStepData.snippetIds.forEach(snippetId => {
          // In a real app, you'd fetch the snippet from your data store
          const snippet = snippets.find(s => s.id === snippetId);
          if (snippet) {
            const { variables } = extractAllVariables(snippet.content);
            options.push({
              type: 'snippet',
              id: snippet.id,
              item: {
                ...snippet,
                variables: variables || []
              }
            });
          }
        });
      }
      
      return options;
    }
    
    // Original logic for template and workflow steps
    if (currentStepData.type !== 'template' && currentStepData.type !== 'workflow') {
      return [];
    }
    const options = [];
    
    // Add template options
    if (currentStepData.templateOptions) {
      currentStepData.templateOptions.forEach(template => {
        options.push({
          type: 'template',
          id: template.id,
          item: template
        });
      });
    }
    
    // Add snippet options - convert snippets to template-like structure
    if (currentStepData.snippetOptions) {
      currentStepData.snippetOptions.forEach(snippet => {
        // Extract variables from snippet content
        const { variables } = extractAllVariables(snippet.content);
        options.push({
          type: 'snippet',
          id: snippet.id,
          item: {
            ...snippet,
            variables: variables || [] // Ensure snippets have variables array
          }
        });
      });
    }
    
    // Add workflow options - convert workflows to executable structure
    if (currentStepData.workflowOptions) {
      currentStepData.workflowOptions.forEach(workflowItem => {
        options.push({
          type: 'workflow',
          id: workflowItem.id,
          item: workflowItem
        });
      });
    }
    
    // If no explicit options but step has content, treat as single template option
    if (options.length === 0 && currentStepData.content && currentStepData.variables) {
      options.push({
        type: 'template',
        id: 'default',
        item: currentStepData
      });
    }
    return options;
  };

  // Get the current template or snippet for this step
  const getCurrentTemplate = () => {
    if (!isWorkflow) {
      return currentStepData;
    }
    
    // Handle info steps with templates/snippets
    if (currentStepData.type === 'info' && (currentStepData.templateId || currentStepData.snippetIds?.length > 0)) {
      const allOptions = getAllStepOptions();
      
      if (allOptions.length > 0) {
        const selectedOption = selectedOptions[currentStepData.id];
        
        if (selectedOption) {
          // Find the selected option
          const option = allOptions.find(opt => 
            opt.type === selectedOption.type && opt.id === selectedOption.id
          );
          if (option) return option.item;
        }
        
        // Only auto-select if there's exactly one option
        if (allOptions.length === 1) {
          return allOptions[0].item;
        }
        
        // Otherwise return undefined to force user selection
        return undefined;
      }
    }
    
    // Handle different step types
    if (currentStepData.type === 'template' || currentStepData.type === 'workflow') {
      const allOptions = getAllStepOptions();
      
      if (allOptions.length > 0) {
        const selectedOption = selectedOptions[currentStepData.id];
        
        if (selectedOption) {
          // Find the selected option
          const option = allOptions.find(opt => 
            opt.type === selectedOption.type && opt.id === selectedOption.id
          );
          if (option) {
            return option.item;
          }
        }
        
        // Only auto-select if there's exactly one option (including legacy single template/workflow)
        if (allOptions.length === 1) {
          return allOptions[0].item;
        }
        
        // Otherwise return undefined to force user selection
        return undefined;
      }
    }
    
    // For info and insert steps, or fallback to step data
    return currentStepData;
  };
  
  const currentTemplate = getCurrentTemplate();
  
  // Check if currentTemplate is actually a workflow (has steps property)
  const isNestedWorkflow = currentTemplate && Array.isArray(currentTemplate.steps);
  
  // Extract all variables including snippets from current template and sort by position
  const getAllTemplateVariables = () => {
    if (!currentTemplate || !currentTemplate.content) return { variables: [], snippetVariables: [], sortedVariables: [] };
    
    const { variables, snippetVariables } = extractAllVariables(currentTemplate.content);
    
    // Find all variables with their positions in the template
    const allMatches = [];
    const content = currentTemplate.content;
    
    // Find regular variables (single braces)
    variables.forEach(variable => {
      const placeholder = `{${variable}}`;
      const position = content.indexOf(placeholder);
      if (position !== -1) {
        allMatches.push({
          type: 'regular',
          variable,
          placeholder,
          position
        });
      }
    });
    
    // Find snippet variables (double braces)
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
      variables, 
      snippetVariables, 
      sortedVariables 
    };
  };
  
  const { snippetVariables, sortedVariables } = getAllTemplateVariables();
  const allVariables = sortedVariables.map(v => v.placeholder);

  // Helper function to focus next field
  const focusNextField = (currentIndex) => {
    const nextTabIndex = currentIndex + 2; // tabIndex starts at 1, so next is current + 1 + 1
    const nextInput = document.querySelector(`input[tabindex="${nextTabIndex}"], select[tabindex="${nextTabIndex}"]`);
    if (nextInput) {
      nextInput.focus();
      // Auto-expand dropdown if it's a select element
      if (nextInput.tagName === 'SELECT' && !nextInput.disabled) {
        const optionCount = nextInput.options.length;
        nextInput.size = Math.min(optionCount, 8);
        nextInput.style.zIndex = '1000';
        nextInput.style.maxHeight = '200px';
        nextInput.style.overflowY = 'auto';
        
        // Do NOT auto-select when focusing next field - let user navigate with arrow keys
      }
    }
  };

  
  // Auto-focus first input on mount and step changes
  useEffect(() => {
    const currentStepType = getStepType();
    const timer = setTimeout(() => {
      if (currentStepType === 'info' || currentStepType === 'insert') {
        // For info/insert steps, focus the action button
        const actionButton = document.querySelector('button[data-action-button="true"]');
        if (actionButton) {
          actionButton.focus();
        }
      } else {
        const firstInput = document.querySelector('input[data-first-input="true"], select[data-first-input="true"]');
        if (firstInput) {
          firstInput.focus();
          // Auto-expand dropdown if it's a select element
          if (firstInput.tagName === 'SELECT' && !firstInput.disabled) {
            const optionCount = firstInput.options.length;
            firstInput.size = Math.min(optionCount, 8);
            firstInput.style.zIndex = '1000';
            firstInput.style.maxHeight = '200px';
            firstInput.style.overflowY = 'auto';
            
            // Do NOT auto-select when initially focusing - let user navigate with arrow keys
          }
        }
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [currentStep]);

  // Auto-fill single option snippets
  useEffect(() => {
    if (snippetVariables.length === 0) return;
    
    const updatedValues = { ...variableValues };
    let hasUpdates = false;
    let autoFilledIndexes = [];
    
    snippetVariables.forEach((snippetVar, index) => {
      const filteredSnippets = snippets.filter(snippet => 
        snippet.tags.includes(snippetVar.tag)
      );
      
      // Auto-fill if exactly one option and not already filled
      if (filteredSnippets.length === 1 && !variableValues[snippetVar.placeholder]) {
        updatedValues[snippetVar.placeholder] = filteredSnippets[0].content;
        hasUpdates = true;
        autoFilledIndexes.push(index);
      }
    });
    
    if (hasUpdates) {
      setVariableValues(updatedValues);
      
      // Auto-advance focus if the first field was auto-filled
      if (autoFilledIndexes.length > 0) {
        setTimeout(() => {
          const sortedVars = getAllTemplateVariables().sortedVariables;
          
          // Check if the first field (index 0) was auto-filled
          const firstFieldAutoFilled = sortedVars.length > 0 && 
            sortedVars[0].type === 'snippet' && 
            autoFilledIndexes.some(idx => 
              snippetVariables[idx].placeholder === sortedVars[0].placeholder
            );
          
          if (firstFieldAutoFilled) {
            focusNextField(0);
          }
        }, 150);
      }
    }
  }, [snippetVariables, snippets, variableValues]);

  // Focus container for snippets without variables to enable Tab handling
  useEffect(() => {
    if (stepType === 'snippet' && sortedVariables.length === 0) {
      const timer = setTimeout(() => {
        const container = document.querySelector('div[tabindex="-1"]');
        if (container) {
          container.focus();
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [stepType, sortedVariables.length]);
  
  
  // If we have a nested workflow, render a recursive ItemExecutor for it
  if (isNestedWorkflow) {
    return (
      <ItemExecutor
        item={currentTemplate}
        type="workflow"
        snippets={snippets}
        onComplete={() => {
          if (currentStep + 1 < steps.length) {
            setCurrentStep(currentStep + 1);
          } else {
            onComplete();
          }
        }}
        onCancel={onCancel}
        onEdit={onEdit}
      />
    );
  }
  
  const handleVariableChange = (variable, value) => {
    setVariableValues(prev => ({
      ...prev,
      [variable]: value
    }));
  };

  // Special handler for dropdown changes that also handles auto-advance
  const handleDropdownChange = (variable, value, currentIndex) => {
    handleVariableChange(variable, value);
    
    // Auto-advance to next field when a selection is made
    if (value) {
      setTimeout(() => {
        focusNextField(currentIndex);
      }, 100);
    }
  };

  // Enhanced keyboard handler for dropdowns
  const handleDropdownKeyDown = (e, variable, currentIndex, isLast) => {
    if (e.key === 'Enter' || e.key === 'Tab') {
      // Stop keyboard navigation mode
      setKeyboardNavigating(prev => {
        const newSet = new Set(prev);
        newSet.delete(variable);
        return newSet;
      });
      
      // Always allow selection now, including empty value (no insert)
      const currentValue = variableValues[variable];
      // Check if we actually have a selection (not undefined)
      if (currentValue !== undefined) {
        e.preventDefault();
        
        // Close dropdown first
        const dropdown = e.target;
        dropdown.size = 1;
        dropdown.style.zIndex = '';
        dropdown.style.maxHeight = '';
        dropdown.style.overflowY = '';
        
        if (isLast && canProceed) {
          if (e.key === 'Enter') {
            handleCopyAndNext();
          } else if (e.key === 'Tab') {
            handleCopyAndNext();
          }
        } else {
          focusNextField(currentIndex);
        }
      }
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      
      // Start keyboard navigation mode
      setKeyboardNavigating(prev => {
        const newSet = new Set(prev);
        newSet.add(variable);
        return newSet;
      });
      
      // Handle circular navigation
      const dropdown = e.target;
      const allOptions = Array.from(dropdown.options);
      const validOptions = allOptions.filter(option => !option.disabled); // All options are now valid, including empty value
      
      // Find current position in valid options
      let currentIndex = -1;
      const currentlySelected = allOptions.find(option => option.selected);
      if (currentlySelected) {
        currentIndex = validOptions.findIndex(option => option.value === currentlySelected.value);
      }
      
      let newIndex;
      if (e.key === 'ArrowDown') {
        // If no selection or we're at the end, go to first option
        if (currentIndex === -1 || currentIndex >= validOptions.length - 1) {
          newIndex = 0;
        } else {
          newIndex = currentIndex + 1;
        }
      } else if (e.key === 'ArrowUp') {
        // If no selection or we're at the beginning, go to last option
        if (currentIndex === -1 || currentIndex <= 0) {
          newIndex = validOptions.length - 1;
        } else {
          newIndex = currentIndex - 1;
        }
      }
      
      // Change selection without triggering onChange
      const selectedOption = validOptions[newIndex];
      dropdown.selectedIndex = selectedOption.index;
      
      // Manually update the variable value without triggering dropdown close
      handleVariableChange(variable, selectedOption.value);
      
      return;
    } else if (e.key === 'Escape') {
      // Stop keyboard navigation mode
      setKeyboardNavigating(prev => {
        const newSet = new Set(prev);
        newSet.delete(variable);
        return newSet;
      });
      
      // Escape closes dropdown without selection
      const dropdown = e.target;
      dropdown.size = 1;
      dropdown.style.zIndex = '';
      dropdown.style.maxHeight = '';
      dropdown.style.overflowY = '';
      dropdown.blur();
    } else if (e.key === ' ') {
      // Space bar for dropdown interaction
      return;
    }
  };

  // Handler for dropdown focus - auto-open dropdown using size attribute
  const handleDropdownFocus = (e) => {
    const dropdown = e.target;
    if (dropdown.tagName === 'SELECT' && !dropdown.disabled) {
      // Expand dropdown by setting size attribute
      const optionCount = dropdown.options.length;
      dropdown.size = Math.min(optionCount, 8); // Show max 8 options
      dropdown.style.zIndex = '1000';
      dropdown.style.maxHeight = '200px';
      dropdown.style.overflowY = 'auto';
      
      // Set the current value if it's not already set (to support default empty string)
      const variable = dropdown.getAttribute('data-variable');
      if (variable && variableValues[variable] === undefined) {
        handleVariableChange(variable, dropdown.value);
      }
    }
  };

  // Handler for dropdown blur to close dropdown
  const handleDropdownBlur = (e) => {
    const dropdown = e.target;
    if (dropdown.tagName === 'SELECT') {
      // Stop keyboard navigation mode for this dropdown
      const variable = dropdown.getAttribute('data-variable');
      if (variable) {
        setKeyboardNavigating(prev => {
          const newSet = new Set(prev);
          newSet.delete(variable);
          return newSet;
        });
      }
      
      // Close dropdown by resetting size
      dropdown.size = 1;
      dropdown.style.zIndex = '';
      dropdown.style.maxHeight = '';
      dropdown.style.overflowY = '';
    }
  };

  // Handler for dropdown selection - only close if not keyboard navigating or programmatic
  const handleDropdownSelect = (variable, value, currentIndex) => {
    // Check if this is keyboard navigation or programmatic change
    if (keyboardNavigating.has(variable) || programmaticChange.has(variable)) {
      // Just update the value, don't close dropdown or advance
      handleVariableChange(variable, value);
      // Remove from programmatic change set
      setProgrammaticChange(prev => {
        const newSet = new Set(prev);
        newSet.delete(variable);
        return newSet;
      });
      return;
    }
    
    // This is mouse click - handle normally
    handleDropdownChange(variable, value, currentIndex);
    
    // Close the dropdown
    setTimeout(() => {
      const dropdown = document.querySelector(`select[tabindex="${currentIndex + 1}"]`);
      if (dropdown) {
        dropdown.size = 1;
        dropdown.style.zIndex = '';
        dropdown.style.maxHeight = '';
        dropdown.style.overflowY = '';
      }
    }, 100);
  };

  const generateOutput = () => {
    if (!currentTemplate || !currentTemplate.content) return '';
    let output = currentTemplate.content;
    
    // Replace regular variables
    Object.entries(variableValues).forEach(([key, value]) => {
      if (!key.startsWith('{insert:')) {
        output = output.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
      }
    });
    
    // Replace insert placeholders with selected insert content
    snippetVariables.forEach(snippetVar => {
      const insertValue = variableValues[snippetVar.placeholder];
      if (insertValue !== undefined) {
        // If insertValue is empty string, remove the placeholder entirely
        const replacementValue = insertValue === '' ? '' : insertValue;
        output = output.replace(new RegExp(`\\{\\{${snippetVar.tag}\\}\\}`, 'g'), replacementValue);
      }
    });
    
    // Append selected snippets content (for auto-append functionality)
    const snippetContent = Array.from(selectedSnippets)
      .map(snippetId => {
        const snippet = filteredSnippets.find(s => s.id === snippetId);
        return snippet ? snippet.content : '';
      })
      .filter(content => content.trim() !== '')
      .join('\n\n');
    
    if (snippetContent) {
      output += '\n\n' + snippetContent;
    }
    
    return output;
  };

  const handleKeyDown = (e, isLastInput = false, currentIndex = 0) => {
    if ((e.key === 'Tab' || e.key === 'Enter') && isLastInput && canProceed) {
      // If this is the last input and user tabs/enters, auto-copy (especially for snippets)
      e.preventDefault();
      handleCopyAndNext();
    } else if ((e.key === 'Tab' || e.key === 'Enter') && stepType === 'snippet' && canProceed) {
      // For snippets, always auto-copy on Tab/Enter regardless of position
      e.preventDefault();
      handleCopyAndNext();
    } else if (e.key === 'Enter' && !isLastInput) {
      // Move to next input field on Enter
      e.preventDefault();
      const nextInput = document.querySelector(`input[tabindex="${currentIndex + 2}"], textarea[tabindex="${currentIndex + 2}"]`);
      if (nextInput) {
        nextInput.focus();
      }
    }
  };

  const handleGlobalKeyDown = (e) => {
    if ((stepType === 'info' || stepType === 'insert' || stepType === 'snippet') && (e.key === 'Tab' || e.key === 'Enter')) {
      // For info/insert/snippet steps, Tab or Enter should move to next step or copy
      e.preventDefault();
      if (stepType === 'info') {
        handleNextStep();
      } else {
        handleCopyAndNext();
      }
    }
  };

  const handleNextStep = () => {
    // For info steps, just move to next step without copying
    if (isWorkflow && currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
      setVariableValues({});
      setSelectedSnippets(new Set()); // Reset addon selection for new step
    } else {
      onComplete();
    }
  };

  const handleCopyAndNext = async () => {
    let output;
    
    if (stepType === 'insert') {
      output = currentStepData.insertContent || '';
    } else {
      output = generateOutput();
    }
    
    // Append selected snippets content for insert steps too
    if (stepType === 'insert' && selectedSnippets.size > 0) {
      const snippetContent = Array.from(selectedSnippets)
        .map(snippetId => {
          const snippet = filteredSnippets.find(s => s.id === snippetId);
          return snippet ? snippet.content : '';
        })
        .filter(content => content.trim() !== '')
        .join('\n\n');
      
      if (snippetContent) {
        output += '\n\n' + snippetContent;
      }
    }
    
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
          setSelectedSnippets(new Set()); // Reset addon selection for new step
        } else {
          // Complete the execution
          onComplete();
        }
      }, 1500);
    }
  };


  const canProceed = (() => {
    if (stepType === 'info') return true; // Info steps don't need variables
    if (stepType === 'insert') return true; // Insert steps don't need variables
    return sortedVariables.every(varData => {
      if (varData.type === 'regular') {
        return variableValues[varData.variable]?.trim();
      } else {
        // For snippet variables, allow empty selection (no insert)
        return variableValues[varData.placeholder] !== undefined;
      }
    });
  })();
  
  const allStepOptions = getAllStepOptions();
  const hasMultipleOptions = allStepOptions.length > 1;
  const needsSelection = hasMultipleOptions && !selectedOptions[currentStepData.id];

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
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-gray-900 rounded-xl shadow-lg p-6" onKeyDown={handleGlobalKeyDown} tabIndex={-1}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-100">{item.name}</h2>
            {isWorkflow && (
              <div className="mt-2">
                <p className="text-gray-300 mb-2">
                  Step {currentStep + 1} of {steps.length}: {currentStepData.name}
                </p>
                {allStepOptions.length > 0 && (
                  <p className="text-sm text-green-300 mb-2">
                    {allStepOptions.length} option{allStepOptions.length > 1 ? 's' : ''} available
                    {allStepOptions.length > 1 && ': '}
                    {currentStepData.templateOptions?.length > 0 && ` ${currentStepData.templateOptions.length} template${currentStepData.templateOptions.length > 1 ? 's' : ''}`}
                    {currentStepData.templateOptions?.length > 0 && currentStepData.snippetOptions?.length > 0 && ','}
                    {currentStepData.snippetOptions?.length > 0 && ` ${currentStepData.snippetOptions.length} snippet${currentStepData.snippetOptions.length > 1 ? 's' : ''}`}
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
            {stepType === 'snippet' && onEdit && (
              <button
                onClick={() => onEdit(item)}
                className="px-4 py-2 bg-gray-700 text-gray-100 rounded-lg hover:bg-gray-600 flex items-center gap-2"
                tabIndex={allVariables.length + 3 || 3}
              >
                <Edit className="w-4 h-4" />
                Edit Snippet
              </button>
            )}
            <button
              onClick={stepType === 'info' ? handleNextStep : handleCopyAndNext}
              onKeyDown={(e) => e.key === 'Enter' && (stepType === 'info' ? handleNextStep() : handleCopyAndNext())}
              disabled={!canProceed || needsSelection}
              className={`px-4 py-2 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 ${
                stepType === 'snippet' 
                  ? 'bg-purple-600 hover:bg-purple-700' 
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
              tabIndex={allVariables.length + 1 || 1}
              data-action-button={stepType === 'info' || stepType === 'insert' || stepType === 'snippet' ? 'true' : undefined}
            >
              {stepType === 'info' ? (
                <ArrowRight className="w-4 h-4" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
              {stepType === 'info' ? (
                isWorkflow && currentStep < steps.length - 1 ? 'Next Step' : 'Complete'
              ) : stepType === 'insert' ? (
                isWorkflow && currentStep < steps.length - 1 ? 'Copy Insert & Next' : 'Copy Insert'
              ) : stepType === 'snippet' ? (
                isWorkflow && currentStep < steps.length - 1 ? 'Copy Snippet & Next' : 'Copy Snippet'
              ) : (
                isWorkflow && currentStep < steps.length - 1 ? 'Copy & Next Step' : 'Copy & Complete'
              )}
            </button>
          </div>
        </div>

        {/* Info Step - Only show centered info if no templates/snippets attached */}
        {stepType === 'info' && currentStepData.type === 'info' && !currentStepData.templateId && !currentStepData.snippetIds?.length && (
          <div className="max-w-4xl mx-auto mb-6">
            <div className="bg-green-900 rounded-lg p-6 border border-green-700">
              <h3 className="text-lg font-semibold text-green-100 mb-3 flex items-center gap-2">
                <Info className="w-5 h-5" />
                Information Step
              </h3>
              <div className="text-green-200 whitespace-pre-wrap">
                {currentStepData.info || currentStepData.content || 'No information provided for this step.'}
              </div>
            </div>
          </div>
        )}

        {/* Step Information - Show for all step types when available, including info from info steps */}
        {isWorkflow && (currentStepData.information || (currentStepData.type === 'info' && currentStepData.info)) && 
         (currentStepData.information?.trim() || currentStepData.info?.trim()) && 
         (currentStepData.information !== ' ' || currentStepData.info !== ' ') && (
          <div className="max-w-4xl mx-auto mb-6">
            <div className="bg-blue-900 rounded-lg p-4 border border-blue-700">
              <h3 className="text-sm font-semibold text-blue-100 mb-2 flex items-center gap-2">
                <Info className="w-4 h-4" />
                Step Information {(currentStepData.type === 'info' && (currentStepData.templateId || currentStepData.snippetIds?.length > 0)) ? '(optional)' : ''}
              </h3>
              <div className="text-blue-200 whitespace-pre-wrap text-sm">
                {currentStepData.information || currentStepData.info}
              </div>
            </div>
          </div>
        )}

        <div className={`grid gap-6 ${stepType === 'template' ? 'grid-cols-1 lg:grid-cols-12' : stepType === 'snippet' && sortedVariables.length > 0 ? 'grid-cols-1 lg:grid-cols-2' : stepType === 'snippet' ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2'}`}>
          <div className={`space-y-4 ${stepType === 'template' ? 'lg:col-span-3' : ''}`}>{(stepType === 'template' || (stepType === 'snippet' && sortedVariables.length > 0)) && (
            <>
              {stepType !== 'snippet' && (
                <h3 className="text-lg font-semibold text-gray-100 mb-3">Fill in Variables</h3>
              )}
              {needsSelection ? (
                <p className="text-gray-500 italic">Select an option above to see variables</p>
              ) : (
                <>
                  {/* Variables in order of appearance */}
                  {sortedVariables.map((varData, index) => {
                const isFirst = index === 0;
                const isLast = index === sortedVariables.length - 1;
                
                if (varData.type === 'regular') {
                  const variable = varData.variable;
                  return (
                    <div key={`regular-${index}-${variable}`} className="mb-4">
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
                    <div key={`snippet-${index}-${snippetVar.placeholder}`} className="mb-4 relative">
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        {snippetVar.tag.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} (Snippet)
                        {filteredSnippets.length === 1 && (
                          <span className="ml-2 text-sm text-green-400">(Auto-filled)</span>
                        )}
                        {filteredSnippets.length > 1 && (
                          <span className="ml-2 text-xs text-gray-500">(↑↓ arrows to navigate, Enter/Tab to select)</span>
                        )}
                      </label>
                      <select
                        value={variableValues[snippetVar.placeholder] || ''}
                        onChange={(e) => handleDropdownSelect(snippetVar.placeholder, e.target.value, index)}
                        onKeyDown={(e) => handleDropdownKeyDown(e, snippetVar.placeholder, index, isLast)}
                        onFocus={handleDropdownFocus}
                        onBlur={handleDropdownBlur}
                        className={`w-full p-3 border rounded-lg transition-all duration-200 ${
                          filteredSnippets.length <= 1 
                            ? 'border-gray-700 bg-gray-900 text-gray-400 cursor-not-allowed' 
                            : 'border-gray-600 bg-gray-800 text-gray-100 focus:ring-2 focus:ring-purple-400 focus:border-transparent cursor-pointer'
                        }`}
                        tabIndex={index + 1}
                        data-first-input={isFirst}
                        data-variable={snippetVar.placeholder}
                        disabled={filteredSnippets.length <= 1}
                      >
                        {filteredSnippets.length === 0 && (
                          <option value="">No snippets found with tag "{snippetVar.tag}"</option>
                        )}
                        {filteredSnippets.length === 1 && (
                          <option value={filteredSnippets[0].content}>
                            {filteredSnippets[0].name}
                          </option>
                        )}
                        {filteredSnippets.length > 1 && (
                          <>
                            <option value="">🚫 No snippet</option>
                            {filteredSnippets.map(snippet => (
                              <option key={snippet.id} value={snippet.content}>
                                {snippet.name}
                              </option>
                            ))}
                          </>
                        )}
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
              
                  {sortedVariables.length === 0 && stepType !== 'snippet' && (
                    <p className="text-gray-500">No variables to fill for this step.</p>
                  )}
                </>
              )}
            </>
          )}
            
            {/* Universal Option Selection */}
            {hasMultipleOptions && (
              <div>
                <h3 className="text-lg font-semibold text-gray-100 mb-3 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-green-400" />
                  Choose Option ({allStepOptions.length} available)
                </h3>
                <div className="space-y-2">
                  {allStepOptions.map((option) => {
                    const isSelected = selectedOptions[currentStepData.id]?.type === option.type && 
                                     selectedOptions[currentStepData.id]?.id === option.id;
                    const isTemplate = option.type === 'template';
                    const isWorkflow = option.type === 'workflow';
                    const isSnippet = option.type === 'snippet';
                    
                    return (
                      <div
                        key={`${option.type}-${option.id}`}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          isSelected
                            ? isTemplate 
                              ? 'border-blue-500 bg-blue-900/30'
                              : isWorkflow
                              ? 'border-orange-500 bg-orange-900/30'
                              : 'border-purple-500 bg-purple-900/30'
                            : 'border-gray-600 bg-gray-800 hover:bg-gray-700'
                        }`}
                        onClick={() => {
                          setSelectedOptions({
                            ...selectedOptions,
                            [currentStepData.id]: { type: option.type, id: option.id }
                          });
                          setVariableValues({}); // Reset variables when selection changes
                        }}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          {isTemplate ? (
                            <FileText className="w-4 h-4 text-blue-400" />
                          ) : isWorkflow ? (
                            <Workflow className="w-4 h-4 text-orange-400" />
                          ) : (
                            <Layers className="w-4 h-4 text-purple-400" />
                          )}
                          <span className={`text-xs px-2 py-1 rounded ${
                            isTemplate ? 'bg-blue-100 text-blue-800' : isWorkflow ? 'bg-orange-100 text-orange-800' : 'bg-purple-100 text-purple-800'
                          }`}>
                            {isTemplate ? 'Template' : isWorkflow ? 'Workflow' : 'Snippet'}
                          </span>
                        </div>
                        <h4 className="font-medium text-gray-100 mb-1">{option.item.name}</h4>
                        <p className="text-sm text-gray-300 mb-2">{option.item.description}</p>
                        <div className={`text-xs text-gray-400 p-2 rounded ${
                          isTemplate ? 'font-mono bg-gray-900' : 'bg-gray-900'
                        }`}>
                          {option.item.content && option.item.content.length > 100 
                            ? `${option.item.content.substring(0, 100)}...` 
                            : option.item.content || 'No content available'
                          }
                        </div>
                        {!isTemplate && option.item.tags && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {option.item.tags.map(tag => (
                              <span key={tag} className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            {/* Special handling for info steps with only snippets */}
            {stepType === 'snippet' && currentStepData.type === 'info' && currentStepData.snippetIds?.length > 0 && !hasMultipleOptions && (
              <div>
                <h3 className="text-lg font-semibold text-gray-100 mb-3 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-purple-400" />
                  Snippets for this Step
                </h3>
                <div className="space-y-2">
                  {currentStepData.snippetIds.map(snippetId => {
                    const snippet = snippets.find(s => s.id === snippetId);
                    if (!snippet) return null;
                    
                    return (
                      <div key={snippetId} className="p-3 border border-purple-500 bg-purple-900/30 rounded-lg">
                        <h4 className="font-medium text-gray-100 mb-1">{snippet.name}</h4>
                        <p className="text-sm text-gray-300 mb-2">{snippet.description}</p>
                        {snippet.tags && (
                          <div className="flex flex-wrap gap-1">
                            {snippet.tags.map(tag => (
                              <span key={tag} className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            {stepType === 'insert' && (
              <div className="bg-purple-900 rounded-lg p-4 border border-purple-700">
                <h3 className="text-lg font-semibold text-purple-100 mb-3 flex items-center gap-2">
                  <Tag className="w-5 h-5" />
                  Insert Step
                </h3>
                <div className="text-purple-200 whitespace-pre-wrap">
                  {currentStepData.insertContent || 'No insert selected for this step.'}
                </div>
                {selectedSnippets.size > 0 && (
                  <div className="mt-3 pt-3 border-t border-purple-700">
                    <p className="text-sm text-purple-300 mb-2">
                      + {selectedSnippets.size} snippet{selectedSnippets.size > 1 ? 's' : ''} will be appended
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Middle/Right Column - Preview (for template and snippet steps) */}
          {(stepType === 'template' || stepType === 'snippet') && (
            <div className={`space-y-4 ${stepType === 'template' ? 'lg:col-span-6' : ''}`}>
              <div>
                <h3 className="text-lg font-semibold text-gray-100 mb-3">{isWorkflow ? 'Current Step Preview' : 'Preview'}</h3>
                <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 min-h-48">
                  <div className="prose prose-sm max-w-none whitespace-pre-wrap">
                    {needsSelection ? (
                      <p className="text-gray-500 italic text-center py-8">
                        Select an option above to see the preview
                      </p>
                    ) : stepType === 'snippet' && currentStepData.type === 'info' && currentStepData.snippetIds?.length > 0 ? (
                      // For info steps with snippets, show the selected snippets content
                      <div>
                        {currentStepData.snippetIds.map(snippetId => {
                          const snippet = snippets.find(s => s.id === snippetId);
                          return snippet ? (
                            <div key={snippetId} className="mb-4">
                              <h4 className="font-semibold text-gray-100 mb-2">{snippet.name}</h4>
                              <div className="text-gray-300">{snippet.content}</div>
                            </div>
                          ) : null;
                        })}
                      </div>
                    ) : (
                      generateOutput()
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Right Column - Only show for template and workflow steps */}
          {stepType !== 'snippet' && (
            <div className={`space-y-4 ${stepType === 'template' ? 'lg:col-span-3' : ''}`}>
            {/* Snippet Selection - Show for templates and workflows */}
            {filteredSnippets.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-100 mb-3 flex items-center gap-2">
                  <Plus className="w-5 h-5 text-blue-400" />
                  Snippets
                </h3>
                <div className="space-y-2">
                  {filteredSnippets.map((snippet) => (
                      <div
                        key={snippet.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          selectedSnippets.has(snippet.id)
                            ? 'border-blue-500 bg-blue-900/30'
                            : 'border-gray-600 bg-gray-800 hover:bg-gray-700'
                        }`}
                        onClick={() => {
                          const newSelected = new Set(selectedSnippets);
                          if (newSelected.has(snippet.id)) {
                            newSelected.delete(snippet.id);
                          } else {
                            newSelected.add(snippet.id);
                          }
                          setSelectedSnippets(newSelected);
                        }}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 mt-1">
                            <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                              selectedSnippets.has(snippet.id)
                                ? 'bg-blue-500 border-blue-500'
                                : 'border-gray-400'
                            }`}>
                              {selectedSnippets.has(snippet.id) && (
                                <Check className="w-3 h-3 text-white" />
                              )}
                            </div>
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-100 mb-1">{snippet.name}</h4>
                            <p className="text-sm text-gray-300">{snippet.description}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Selected Snippets Preview - Show for all step types */}
            {selectedSnippets.size > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-100 mb-3 flex items-center gap-2">
                  <Plus className="w-5 h-5 text-blue-400" />
                  Selected Snippets ({selectedSnippets.size})
                </h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {Array.from(selectedSnippets).map((snippetId) => {
                    const snippet = filteredSnippets.find(s => s.id === snippetId);
                    if (!snippet) return null;
                    
                    return (
                      <div key={snippetId} className="bg-blue-900 rounded-lg p-3 border border-blue-700">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-medium text-blue-100">
                            {snippet.name}
                          </p>
                          <button
                            onClick={() => {
                              const newSelected = new Set(selectedSnippets);
                              newSelected.delete(snippetId);
                              setSelectedSnippets(newSelected);
                            }}
                            className="text-xs text-blue-300 hover:text-blue-100"
                          >
                            Remove
                          </button>
                        </div>
                        <div className="text-xs text-blue-200">
                          {snippet.description}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}


            {isWorkflow && stepType !== 'info' && (
              <div className="bg-blue-900 rounded-lg p-4 border border-blue-700">
                <h4 className="text-sm font-semibold text-blue-100 mb-2">💡 Workflow Tip</h4>
                <p className="text-sm text-blue-200">
                  Complete each step individually. Copy the prompt, use it with your AI, 
                  then return here for the next step in the workflow.
                </p>
              </div>
            )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ItemExecutor;
