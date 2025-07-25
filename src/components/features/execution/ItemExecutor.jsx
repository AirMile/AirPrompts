import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Copy, ArrowLeft, ArrowRight, Check, Info, Tag, Plus, Edit, FileText, Layers, Workflow } from 'lucide-react';
import { copyToClipboard } from '../../../utils/clipboard.js';
import { extractAllVariables } from '../../../types/template.types.js';
import { useItemColors } from '../../../hooks/useItemColors.js';

const ItemExecutor = ({ item, type, templates = [], workflows = [], snippets = [], onComplete, onCancel, onEdit }) => {
  const { getColorClasses } = useItemColors();
  const [repeatMode, setRepeatMode] = useState(false);

  // Check if classic dark theme is active
  const isClassicDark = () => {
    return document.documentElement.classList.contains('theme-classic-dark');
  };

  // Add safety check for item
  if (!item) {
    console.error('❌ ItemExecutor: item is undefined');
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-danger-900 dark:bg-danger-900 rounded-xl p-6 text-center">
          <h2 className="text-xl font-bold text-danger-100 dark:text-danger-100 mb-2">Error</h2>
          <p className="text-danger-200 dark:text-danger-200">No item data provided to execute.</p>
          <button onClick={onCancel} className="mt-4 px-4 py-2 bg-danger-700 dark:bg-danger-700 text-white rounded">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const isWorkflow = type === 'workflow' && item.steps && Array.isArray(item.steps);
  const steps = isWorkflow ? item.steps : [{ 
    content: item.content || '', 
    variables: item.variables || [],
    type: type === 'workflow' ? 'workflow' : type, // Add the type to the step data
    id: item.id,
    name: item.name
  }];
  
  
  
  // State voor huidige step
  const [currentStep, setCurrentStep] = useState(0);
  const currentStepData = steps?.[currentStep];
  
  // Safety check for steps and currentStepData
  if (!steps || steps.length === 0 || !currentStepData) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-danger-900 dark:bg-danger-900 rounded-xl p-6 text-center">
          <h2 className="text-xl font-bold text-danger-100 dark:text-danger-100 mb-2">Error</h2>
          <p className="text-danger-200 dark:text-danger-200">Invalid step data. Unable to execute item.</p>
          <button onClick={onCancel} className="mt-4 px-4 py-2 bg-danger-700 dark:bg-danger-700 text-white rounded">
            Go Back
          </button>
        </div>
      </div>
    );
  }
  
  // State for tracking selected options - must be defined before getStepType function
  const [selectedOptions, setSelectedOptions] = useState({}); // stepId -> { type: 'template'|'snippet', id: itemId }
  
  // Ref for Copy Snippet button auto-focus
  const copyButtonRef = useRef(null);
  
  // Different logic for different step types
  const getStepType = useCallback(() => {
    if (!isWorkflow) {
      // Type should already be normalized from Homepage, but double-check
      if (!type) {
        console.error('❌ ItemExecutor: type is undefined');
        return 'template'; // fallback
      }
      const normalizedType = type.endsWith('s') ? type.slice(0, -1) : type;
      return normalizedType;
    }
    
    // Check if an option has been selected from multiple options
    const selectedOption = selectedOptions[currentStepData.id];
    if (selectedOption) {
      // Return the type of the selected option
      return selectedOption.type;
    }
    
    // Count total items attached to this step
    const templateCount = (currentStepData.templateOptions?.length || 0) + 
                         (currentStepData.templateId ? 1 : 0);
    const snippetCount = (currentStepData.snippetOptions?.length || 0) + 
                        (currentStepData.snippetIds?.length || 0);
    const workflowCount = currentStepData.workflowOptions?.length || 0;
    const totalItems = templateCount + snippetCount + workflowCount;
    
    
    // If no items attached, it's a pure info step
    if (totalItems === 0) {
      return 'info';
    }
    
    // If exactly one item, use that item's type
    if (totalItems === 1) {
      if (templateCount === 1) return 'template';
      if (snippetCount === 1) return 'snippet';
      if (workflowCount === 1) return 'workflow';
    }
    
    // Multiple items = multi-choice step (treat as template type for UI)
    if (totalItems > 1) {
      // For now, use template UI for multi-choice
      return 'template';
    }
    
    // Legacy: Check if info step has templates or snippets attached
    if (currentStepData.type === 'info') {
      // If info step has template or snippet IDs, treat it as template/snippet step
      if (currentStepData.templateId || currentStepData.snippetIds?.length > 0) {
        return currentStepData.snippetIds?.length > 0 && !currentStepData.templateId ? 'snippet' : 'template';
      }
    }
    
    return currentStepData.type || 'template';
  }, [isWorkflow, type, currentStepData, selectedOptions]);

  const stepType = getStepType();

  // Auto-focus Copy Snippet button for snippets
  useEffect(() => {
    if (stepType === 'snippet' && copyButtonRef.current) {
      const timer = setTimeout(() => {
        copyButtonRef.current.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [stepType]);

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
  const [selectedSnippets, setSelectedSnippets] = useState(new Set()); // Set of snippet IDs

  // Track if we're in keyboard navigation mode
  const [keyboardNavigating, setKeyboardNavigating] = useState(new Set());

  // Track programmatic changes to prevent unwanted closing
  const [programmaticChange, setProgrammaticChange] = useState(new Set());

  // Track the highlighted option index for keyboard navigation
  const [highlightedOptionIndex, setHighlightedOptionIndex] = useState(0);

  // Add escape key handler
  useEffect(() => {
    const handleEscapeKey = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      }
    };

    document.addEventListener('keydown', handleEscapeKey);
    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [onCancel]);

  
  // Get all available options (templates and snippets combined) for current step
  const getAllStepOptions = useCallback(() => {
    
    if (!isWorkflow) {
      // Not a workflow, returning empty options
      return [];
    }
    
    // DEBUG: getAllStepOptions - templates available: ${templates.length}
    
    if (currentStepData.templateOptions?.length > 0) {
      // DEBUG: templateOptions available
    }
    
    
    // Handle info steps that have templateOptions/snippetOptions (new workflow format) - CHECK THIS FIRST!
    if (currentStepData.type === 'info' && (currentStepData.templateOptions?.length > 0 || currentStepData.snippetOptions?.length > 0)) {
      console.log('🟢 PRIORITIZED Info step with templateOptions/snippetOptions detected!');
      const options = [];
      
      // Process templateOptions
      if (currentStepData.templateOptions?.length > 0) {
        currentStepData.templateOptions.forEach(templateOption => {
          console.log('Processing templateOption:', templateOption);
          
          // Check if it's already a template object or just an ID
          let template;
          if (typeof templateOption === 'object' && templateOption.id) {
            // It's already a template object
            template = templateOption;
            console.log('Using template object directly:', template);
          } else {
            // It's an ID, find the template
            const templateId = templateOption;
            template = templates.find(t => t.id === templateId);
            console.log('Looking for template with ID:', templateId, 'Found:', template);
          }
          
          if (template) {
            const { variables } = extractAllVariables(template.content || '');
            console.log('Extracted variables from template:', variables);
            options.push({
              type: 'template',
              id: template.id,
              item: {
                ...template,
                variables: variables || []
              }
            });
          }
        });
      }
      
      // Process snippetOptions
      if (currentStepData.snippetOptions?.length > 0) {
        currentStepData.snippetOptions.forEach(snippetOption => {
          console.log('Processing snippetOption:', snippetOption);
          
          // Check if it's already a snippet object or just an ID
          let snippet;
          if (typeof snippetOption === 'object' && snippetOption.id) {
            // It's already a snippet object
            snippet = snippetOption;
            console.log('Using snippet object directly:', snippet);
          } else {
            // It's an ID, find the snippet
            const snippetId = snippetOption;
            snippet = snippets.find(s => s.id === snippetId);
            console.log('Looking for snippet with ID:', snippetId, 'Found:', snippet);
          }
          
          if (snippet) {
            const { variables } = extractAllVariables(snippet.content || '');
            console.log('Extracted variables from snippet:', variables);
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
      
      console.log('Returning prioritized options (templates + snippets):', options);
      return options;
    }
    
    // Check if this is an info step with templates/snippets (LEGACY)
    if (currentStepData.type === 'info' && (currentStepData.templateId || currentStepData.snippetIds?.length > 0)) {
      console.log('📦 Legacy info step detected');
    
      // Info step with template/snippet options
      const options = [];
      
      // If info step has a template ID, load that template
      if (currentStepData.templateId) {
        // Info step has templateId
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
        // Info step has snippetIds
        currentStepData.snippetIds.forEach(snippetId => {
          // In a real app, you'd fetch the snippet from your data store
          const snippet = snippets.find(s => s.id === snippetId);
          // Found snippet for ID
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
      
      // Final options for info step
      return options;
    }
    
    
    // Original logic for template and workflow steps
    if (currentStepData.type !== 'template' && currentStepData.type !== 'workflow') {
      return [];
    }
    const options = [];
    
    // Combine all items first to sort by order
    const allItems = [];
    
    // Check for legacy selectedTemplateId field
    if (currentStepData.selectedTemplateId && !currentStepData.templateOptions) {
      const template = templates.find(t => t.id === currentStepData.selectedTemplateId);
      if (template) {
        const { variables } = extractAllVariables(template.content || '');
        allItems.push({
          type: 'template',
          id: template.id,
          item: {
            ...template,
            variables: variables || []
          },
          order: 0
        });
      }
    }
    
    // Add template options
    if (currentStepData.templateOptions) {
      currentStepData.templateOptions.forEach(templateId => {
        // templateOptions might be just IDs, so we need to find the actual template
        const template = templates.find(t => t.id === templateId) || 
                        (typeof templateId === 'object' ? templateId : { id: templateId, name: `Template ${templateId}` });
        
        if (template) {
          const { variables } = extractAllVariables(template.content || '');
          allItems.push({
            type: 'template',
            id: template.id,
            item: {
              ...template,
              variables: variables || []
            },
            order: template.order || 0
          });
        }
      });
    }
    
    // Add snippet options - convert snippets to template-like structure
    if (currentStepData.snippetOptions) {
      currentStepData.snippetOptions.forEach(snippet => {
        // Extract variables from snippet content
        const { variables } = extractAllVariables(snippet.content);
        allItems.push({
          type: 'snippet',
          id: snippet.id,
          item: {
            ...snippet,
            variables: variables || [] // Ensure snippets have variables array
          },
          order: snippet.order || 0
        });
      });
    }
    
    // Add workflow options - convert workflows to executable structure
    if (currentStepData.workflowOptions) {
      currentStepData.workflowOptions.forEach(workflowItem => {
        allItems.push({
          type: 'workflow',
          id: workflowItem.id,
          item: workflowItem,
          order: workflowItem.order || 0
        });
      });
    }
    
    // Sort by order (chronological order of addition)
    allItems.sort((a, b) => a.order - b.order);
    
    
    // Convert to options format
    allItems.forEach(item => {
      options.push({
        type: item.type,
        id: item.id,
        item: item.item
      });
    });
    
    // If no explicit options but step has content, treat as single template option
    if (options.length === 0 && currentStepData.content && currentStepData.variables) {
      options.push({
        type: 'template',
        id: 'default',
        item: currentStepData
      });
    }
    
    return options;
  }, [isWorkflow, currentStepData, templates, workflows, snippets]);

  // Get the current template or snippet for this step
  const getCurrentTemplate = () => {
    // DEBUG: getCurrentTemplate
    
    if (!isWorkflow) {
      // Non-workflow, returning currentStepData
      return currentStepData;
    }
    
    // Handle info steps with templates/snippets (including new templateOptions format)
    // INFO step condition check
    
    if (currentStepData.type === 'info' && (currentStepData.templateId || currentStepData.snippetIds?.length > 0 || currentStepData.templateOptions?.length > 0)) {
      // INFO STEP WITH TEMPLATES DETECTED
      // Info step with templates/snippets
      const allOptions = getAllStepOptions();
      // allOptions for info step
      // All options for info step
      
      if (allOptions.length > 0) {
        const selectedOption = selectedOptions[currentStepData.id];
        // Selected option for info step
        
        if (selectedOption) {
          // Find the selected option
          const option = allOptions.find((opt, index) => {
            const optId = opt.id || opt.item?.id || index;
            return opt.type === selectedOption.type && optId === selectedOption.id;
          });
          // Found option for selection
          if (option) return option.item;
        }
        
        // Only auto-select if there's exactly one option
        if (allOptions.length === 1) {
          console.log('Auto-selecting single option:', allOptions[0]);
          console.log('Returning item:', allOptions[0].item);
          // Auto-selecting single option
          return allOptions[0].item;
        }
        
        // Otherwise return a placeholder to show the selection interface
        // Multiple options, returning placeholder for selection interface
        return {
          id: 'selection-placeholder',
          name: 'Select an option above',
          content: '',
          type: 'selection-placeholder'
        };
      }
    }
    
    // Handle different step types
    if (currentStepData.type === 'template' || currentStepData.type === 'workflow') {
      const allOptions = getAllStepOptions();
      
      if (allOptions.length > 0) {
        const selectedOption = selectedOptions[currentStepData.id];
        
        if (selectedOption) {
          // Find the selected option
          const option = allOptions.find((opt, index) => {
            const optId = opt.id || opt.item?.id || index;
            return opt.type === selectedOption.type && optId === selectedOption.id;
          });
          if (option) {
            return option.item;
          }
        }
        
        // Only auto-select if there's exactly one option (including legacy single template/workflow)
        if (allOptions.length === 1) {
          return allOptions[0].item;
        }
        
        // Otherwise return a placeholder to show the selection interface
        return {
          id: 'selection-placeholder',
          name: 'Select an option above',
          content: '',
          type: 'selection-placeholder'
        };
      }
    }
    
    // For info and insert steps, or fallback to step data
    // Fallback: returning currentStepData
    return currentStepData;
  };
  
  const currentTemplate = getCurrentTemplate();
  const allStepOptions = getAllStepOptions();
  const hasMultipleOptions = allStepOptions.length > 1;
  const needsSelection = hasMultipleOptions && !selectedOptions[currentStepData.id];
  
  // DEBUG: Main execution logic
  
  // Check if currentTemplate is actually a workflow (has steps property)
  const isNestedWorkflow = currentTemplate && Array.isArray(currentTemplate.steps);
  
  // Extract all variables including snippets from current template and sort by position
  const getAllTemplateVariables = useCallback(() => {
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
  }, [currentTemplate]);
  
  const { snippetVariables, sortedVariables } = getAllTemplateVariables();
  const allVariables = sortedVariables.map(v => v.placeholder);
  
  // DEBUG: Variables extraction
  

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
      const currentAllStepOptions = getAllStepOptions();
      const currentHasMultipleOptions = currentAllStepOptions.length > 1;
      const currentNeedsSelection = currentHasMultipleOptions && !selectedOptions[currentStepData.id];
      
      
      if (currentNeedsSelection) {
        // Focus the option selection area
        const optionSelectionArea = document.querySelector('div[tabIndex="0"]');
        if (optionSelectionArea) {
          optionSelectionArea.focus();
        }
      } else if (currentStepType === 'info' || currentStepType === 'insert') {
        // For info/insert steps, focus the action button
        const actionButton = document.querySelector('button[data-action-button="true"]');
        if (actionButton) {
          actionButton.focus();
        }
      } else {
        // Try to find the first input in the proper order
        let firstInput = document.querySelector('input[data-first-input="true"], select[data-first-input="true"]');
        if (!firstInput) {
          // If no marked first input, find the first visible and editable input in the form
          const allInputs = document.querySelectorAll('input:not([type="hidden"]):not([type="button"]):not([type="submit"]):not([readonly]):not([disabled]), select:not([disabled]), textarea:not([readonly]):not([disabled])');
          firstInput = allInputs[0]; // Get the first one in DOM order
        }
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
        } else {
          // If no input found, try again multiple times with increasing delays
          const retryFocus = (attempt = 1, maxAttempts = 10) => {
            const delay = attempt * 50; // 50ms, 100ms, 150ms, etc.
            setTimeout(() => {
              // Try to find the first input in the proper order
              let retryInput = document.querySelector('input[data-first-input="true"], select[data-first-input="true"]');
              if (!retryInput) {
                // If no marked first input, find the first visible and editable input in the form
                const allInputs = document.querySelectorAll('input:not([type="hidden"]):not([type="button"]):not([type="submit"]):not([readonly]):not([disabled]), select:not([disabled]), textarea:not([readonly]):not([disabled])');
                retryInput = allInputs[0]; // Get the first one in DOM order
              }
              if (retryInput) {
                retryInput.focus();
              } else if (attempt < maxAttempts) {
                retryFocus(attempt + 1, maxAttempts);
              } else {
              }
            }, delay);
          };
          retryFocus();
        }
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [currentStep, currentStepData.id]);

  // Reset highlighted option index when step changes or options change
  useEffect(() => {
    setHighlightedOptionIndex(0);
  }, [currentStep]);

  // Reset selection when step changes (don't auto-select, just highlight)
  useEffect(() => {
    const currentAllStepOptions = getAllStepOptions();
    const currentHasMultipleOptions = currentAllStepOptions.length > 1;
    
    if (currentHasMultipleOptions) {
      // Don't auto-select, just let the highlighted index stay at 0
      // User must manually select with Enter/Tab or mouse click
    }
  }, [currentStep, currentStepData.id, getAllStepOptions]);

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
  }, [snippetVariables, snippets, variableValues, getAllTemplateVariables]);

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
    if (e.key === 'Tab' && isLastInput && canProceed) {
      // If this is the last input and user tabs with all fields filled, auto-copy
      e.preventDefault();
      handleCopyAndNext();
    } else if (e.key === 'Enter' && isLastInput && canProceed) {
      // If this is the last input and user presses Enter, auto-copy (especially for snippets)
      e.preventDefault();
      handleCopyAndNext();
    } else if (e.key === 'Enter' && stepType === 'snippet' && canProceed) {
      // For snippets, always auto-copy on Enter regardless of position
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
    // Let Tab key work normally for navigation between fields (except for last input when done)
  };

  const handleGlobalKeyDown = (e) => {
    // Don't handle global keys if user is typing in an input field OR if user is navigating with Tab
    const activeElement = document.activeElement;
    const isInputFocused = activeElement && (
      activeElement.tagName === 'INPUT' || 
      activeElement.tagName === 'TEXTAREA' || 
      activeElement.tagName === 'SELECT'
    );
    
    // If an input is focused, let the browser handle the key event naturally
    if (isInputFocused) {
      return;
    }
    
    // Also don't handle Tab key if we're not in option selection mode (let normal focus flow work)
    const allStepOptions = getAllStepOptions();
    const hasMultipleOptions = allStepOptions.length > 1;
    const needsSelection = hasMultipleOptions && !selectedOptions[currentStepData.id];
    
    // If we don't need selection and user presses Tab, only return if it's not a snippet/info/insert step
    if (!needsSelection && e.key === 'Tab') {
      
      // For non-actionable steps, let browser handle Tab normally
      if (stepType !== 'snippet' && stepType !== 'info' && stepType !== 'insert') {
        return;
      }
      // For snippet/info/insert steps, let the logic below handle it
    }
    
    // Only log for Tab key to reduce noise
    if (e.key === 'Tab') {
    }
    
    // Handle keyboard navigation for option selection - only when we actually need selection
    if (needsSelection && hasMultipleOptions && allStepOptions.length > 0) {
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlightedOptionIndex(prevIndex => {
          const newIndex = prevIndex < allStepOptions.length - 1 ? prevIndex + 1 : 0;
          return newIndex;
        });
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlightedOptionIndex(prevIndex => {
          const newIndex = prevIndex > 0 ? prevIndex - 1 : allStepOptions.length - 1;
          return newIndex;
        });
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        e.stopPropagation();
        const selectedOption = allStepOptions[highlightedOptionIndex];
        if (selectedOption) {
          const selectedOptionId = selectedOption.id || selectedOption.item?.id || highlightedOptionIndex;
          const newSelection = { type: selectedOption.type, id: selectedOptionId };
          
          setSelectedOptions(prevOptions => {
            const newOptions = {
              ...prevOptions,
              [currentStepData.id]: newSelection
            };
            return newOptions;
          });
          setVariableValues({}); // Reset variables when selection changes
        }
      }
    } else if ((stepType === 'info' || stepType === 'insert' || stepType === 'snippet') && (e.key === 'Tab' || e.key === 'Enter')) {
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
    } else if (stepType === 'snippet') {
      // For snippets, use content as-is without variable processing
      output = currentTemplate?.content || '';
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
        
        if (repeatMode && (stepType === 'template' || stepType === 'workflow')) {
          // In repeat mode, reset variables but stay on current step
          setVariableValues({});
          setSelectedSnippets(new Set());
        } else if (isWorkflow && currentStep < steps.length - 1) {
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
    if (stepType === 'snippet') return true; // Snippets are always ready to copy
    return sortedVariables.every(varData => {
      if (varData.type === 'regular') {
        return variableValues[varData.variable]?.trim();
      } else {
        // For snippet variables, allow empty selection (no insert)
        return variableValues[varData.placeholder] !== undefined;
      }
    });
  })();
  
  
  // Debug selection state

  if (copied) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-gradient-to-br from-success-50 to-success-50 dark:from-success-900/20 dark:to-success-900/20 rounded-2xl shadow-2xl border border-success-200 dark:border-success-700 p-8 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-success-500 to-success-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Check className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-secondary-900 dark:text-secondary-100 mb-3">Gekopieerd naar Klembord!</h2>
          <p className="text-secondary-600 dark:text-secondary-300 text-lg leading-relaxed">
            {isWorkflow && currentStep < steps.length - 1
              ? "Gebruik deze prompt met AI, kom dan terug voor de volgende stap."
              : "Je prompt is gekopieerd en klaar voor gebruik."
            }
          </p>
          <div className="mt-6 flex items-center justify-center gap-2">
            <div className="w-2 h-2 bg-success-500 dark:bg-success-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-success-600 dark:text-success-400 font-medium">
              Automatisch doorgaan...
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-full lg:max-w-4xl mx-auto p-2 sm:p-4 bg-transparent">
      <div className="bg-gradient-to-br from-white to-secondary-50 dark:from-secondary-800 dark:to-secondary-900 rounded-xl sm:rounded-2xl shadow-2xl border border-secondary-300 dark:border-secondary-700 p-4 sm:p-6 lg:p-8" onKeyDown={handleGlobalKeyDown} tabIndex={-1}>
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                stepType === 'snippet' 
                  ? getColorClasses('snippet', 'gradient')
                  : stepType === 'workflow'
                  ? getColorClasses('workflow', 'gradient')
                  : getColorClasses('template', 'gradient')
              }`}>
                {stepType === 'snippet' ? (
                  <Layers className="w-6 h-6 text-white" />
                ) : stepType === 'workflow' ? (
                  <Workflow className="w-6 h-6 text-white" />
                ) : (
                  <FileText className="w-6 h-6 text-white" />
                )}
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-secondary-900 dark:text-white mb-1">{item.name}</h2>
                {item.category && (
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 bg-secondary-200 dark:bg-secondary-600/50 text-secondary-700 dark:text-secondary-300 rounded text-xs">
                      {item.category}
                    </span>
                  </div>
                )}
              </div>
            </div>
            
            
            {isWorkflow && (
              <div className="bg-secondary-100 dark:bg-secondary-800/50 rounded-lg p-4 border border-secondary-300 dark:border-secondary-600/50">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-secondary-900 dark:text-white flex items-center gap-2">
                    <div className="w-2 h-2 bg-primary-400 dark:bg-primary-400 rounded-full animate-pulse"></div>
                    Step {currentStep + 1} of {steps.length}
                  </h3>
                  {allStepOptions.length > 0 && (
                    <span className="text-sm text-success-400 dark:text-success-400 font-medium">
                      {allStepOptions.length} option{allStepOptions.length > 1 ? 's' : ''} available
                    </span>
                  )}
                </div>
                
                <p className="text-secondary-700 dark:text-secondary-300 mb-3 font-medium">{currentStepData.name}</p>
                
                {/* Enhanced Progress indicator */}
                <div className="flex items-center gap-2">
                  {steps.map((_, index) => (
                    <div key={index} className="flex items-center">
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                        index < currentStep
                          ? 'bg-success-500 dark:bg-success-500 text-white shadow-lg' // Completed
                          : index === currentStep
                          ? 'bg-primary-500 dark:bg-primary-500 text-white shadow-lg ring-2 ring-primary-300 dark:ring-primary-300' // Current
                          : 'bg-secondary-600 dark:bg-secondary-600 text-secondary-400 dark:text-secondary-400' // Upcoming
                      }`}>
                        {index < currentStep ? '✓' : index + 1}
                      </div>
                      {index < steps.length - 1 && (
                        <div className={`w-8 h-0.5 mx-1 ${
                          index < currentStep ? 'bg-success-500 dark:bg-success-500' : 'bg-secondary-600 dark:bg-secondary-600'
                        }`} />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-2 sm:gap-3 items-start">
            <button
              onClick={onCancel}
              className="px-4 sm:px-6 lg:px-8 py-2 sm:py-3 lg:py-4 text-sm sm:text-base text-secondary-600 dark:text-secondary-300 border border-secondary-400 dark:border-secondary-500 rounded-xl sm:rounded-2xl hover:bg-secondary-200 dark:hover:bg-secondary-700 hover:border-secondary-500 dark:hover:border-secondary-400 hover:text-secondary-800 dark:hover:text-white transition-all duration-300 font-semibold hover:shadow-lg transform hover:scale-105 bg-secondary-50 dark:bg-secondary-800/50 backdrop-blur-sm"
              tabIndex={stepType === 'snippet' ? 10 : allVariables.length + 2 || 2}
            >
              Cancel
            </button>
            {stepType === 'snippet' && onEdit && (
              <button
                onClick={() => onEdit(item)}
                className="px-4 sm:px-6 lg:px-8 py-2 sm:py-3 lg:py-4 text-sm sm:text-base bg-secondary-200 dark:bg-secondary-700 text-secondary-800 dark:text-secondary-100 rounded-xl sm:rounded-2xl hover:bg-secondary-300 dark:hover:bg-secondary-600 transition-all duration-300 flex items-center gap-2 sm:gap-3 font-semibold hover:shadow-lg transform hover:scale-105 border border-secondary-300 dark:border-secondary-600/50 hover:border-secondary-400 dark:hover:border-secondary-500"
                tabIndex={11}
              >
                <Edit className="w-5 h-5" />
                Edit Snippet
              </button>
            )}
            {/* Show repeat toggle for template and workflow steps when not needsSelection */}
            {!needsSelection && (stepType === 'template' || stepType === 'workflow') && (
              <label className="flex items-center gap-2 sm:gap-3 px-4 sm:px-6 lg:px-8 py-2 sm:py-3 lg:py-4 text-sm sm:text-base bg-secondary-200 dark:bg-secondary-700 text-secondary-800 dark:text-secondary-100 rounded-xl sm:rounded-2xl hover:bg-secondary-300 dark:hover:bg-secondary-600 transition-all duration-300 cursor-pointer font-semibold hover:shadow-lg transform hover:scale-105 border border-secondary-300 dark:border-secondary-600/50 hover:border-secondary-400 dark:hover:border-secondary-500">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={repeatMode}
                    onChange={(e) => setRepeatMode(e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`w-14 h-7 rounded-full transition-all duration-300 ${
                    repeatMode 
                      ? 'bg-gradient-to-r from-primary-500 to-primary-600 dark:from-primary-500 dark:to-primary-600'
                      : 'bg-secondary-400 dark:bg-secondary-600'
                  }`}>
                    <div className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow-lg transform transition-transform duration-300 ${
                      repeatMode ? 'translate-x-7' : 'translate-x-0'
                    }`} />
                  </div>
                </div>
                <span className="select-none">
                  Repeat
                </span>
              </label>
            )}
            <button
              onClick={needsSelection ? () => {
                // When "Select Option" is clicked, select the highlighted option
                const selectedOption = allStepOptions[highlightedOptionIndex];
                if (selectedOption) {
                  const selectedOptionId = selectedOption.id || selectedOption.item?.id || highlightedOptionIndex;
                  const newSelection = { type: selectedOption.type, id: selectedOptionId };
                  
                  setSelectedOptions(prevOptions => {
                    const newOptions = {
                      ...prevOptions,
                      [currentStepData.id]: newSelection
                    };
                    return newOptions;
                  });
                  setVariableValues({}); // Reset variables when selection changes
                }
              } : (stepType === 'info' ? handleNextStep : handleCopyAndNext)}
              onKeyDown={(e) => e.key === 'Enter' && (stepType === 'info' ? handleNextStep() : handleCopyAndNext())}
              disabled={!canProceed && !needsSelection}
              className={`px-4 sm:px-6 lg:px-8 py-2 sm:py-3 lg:py-4 text-sm sm:text-base rounded-xl sm:rounded-2xl font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 sm:gap-3 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105 lg:hover:scale-110 hover:-translate-y-1 relative overflow-hidden group ${
                stepType === 'snippet' 
                  ? getColorClasses('snippet', 'button-primary')
                  : stepType === 'workflow'
                  ? getColorClasses('workflow', 'button-primary')
                  : stepType === 'info'
                  ? getColorClasses('info', 'button-primary')
                  : getColorClasses('template', 'button-primary')
              }`}
              tabIndex={stepType === 'snippet' ? 1 : allVariables.length + 1 || 1}
              data-action-button={stepType === 'info' || stepType === 'insert' || stepType === 'snippet' ? 'true' : undefined}
              ref={stepType === 'snippet' ? copyButtonRef : null}
            >
              {/* Shimmer effect */}
              <div className="absolute inset-0 -top-1 -bottom-1 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out"></div>
              
              {needsSelection ? (
                <ArrowRight className="w-5 h-5 relative z-10" />
              ) : stepType === 'info' ? (
                <ArrowRight className="w-5 h-5 relative z-10" />
              ) : (
                <Copy className="w-5 h-5 relative z-10" />
              )}
              <span className="relative z-10">
                {needsSelection ? (
                  'Select Option'
                ) : stepType === 'info' ? (
                  isWorkflow && currentStep < steps.length - 1 ? 'Next Step' : 'Complete'
                ) : stepType === 'insert' ? (
                  isWorkflow && currentStep < steps.length - 1 ? 'Copy Insert & Next' : 'Copy Insert'
                ) : stepType === 'snippet' ? (
                  isWorkflow && currentStep < steps.length - 1 ? 'Copy Snippet & Next' : 'Copy Snippet'
                ) : (
                  isWorkflow && currentStep < steps.length - 1 ? 'Copy & Next Step' : 'Copy & Complete'
                )}
              </span>
            </button>
          </div>
        </div>

        {/* Info Step - Only show centered info if no templates/snippets attached */}
        {stepType === 'info' && currentStepData.type === 'info' && !currentStepData.templateId && !currentStepData.snippetIds?.length && (
          <div className="max-w-4xl mx-auto mb-6">
            <div className={`rounded-lg p-4 sm:p-6 ${getColorClasses('info', 'info-block')}`}>
              <h3 className={`text-base sm:text-lg font-semibold mb-3 flex items-center gap-2 ${getColorClasses('info', 'info-header')}`}>
                <Info className="w-5 h-5" />
                Information Step
              </h3>
              <div className={`whitespace-pre-wrap text-sm sm:text-base ${getColorClasses('info', 'info-text')}`}>
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
            <div className={`rounded-lg p-3 sm:p-4 ${getColorClasses('template', 'info-block')}`}>
              <h3 className={`text-xs sm:text-sm font-semibold mb-2 flex items-center gap-2 ${getColorClasses('template', 'info-header')}`}>
                <Info className="w-4 h-4" />
                Step Information {(currentStepData.type === 'info' && (currentStepData.templateId || currentStepData.snippetIds?.length > 0)) ? '(optional)' : ''}
              </h3>
              <div className={`whitespace-pre-wrap text-xs sm:text-sm ${getColorClasses('template', 'info-text')}`}>
                {currentStepData.information || currentStepData.info}
              </div>
            </div>
          </div>
        )}

        <div className={`grid gap-4 sm:gap-6 ${
          stepType === 'template' 
            ? 'grid-cols-1 lg:grid-cols-12' 
            : stepType === 'snippet' 
            ? 'grid-cols-1' 
            : !needsSelection  // Show 3 cols when preview shows, 2 cols when no preview
            ? 'grid-cols-1 lg:grid-cols-3'  
            : 'grid-cols-1 lg:grid-cols-2'   
        }`}>
          <div className={`space-y-4 ${stepType === 'template' ? 'lg:col-span-4' : needsSelection ? 'lg:col-span-3' : 'lg:col-span-2'}`}>
          {stepType === 'template' && (
            <>
              {stepType !== 'snippet' && (
                <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100 mb-3">{needsSelection ? 'Choose Option First' : 'Fill in Variables'}</h3>
              )}
              {needsSelection ? (
                <p className="text-secondary-600 dark:text-secondary-500 italic">Select an option above to see variables</p>
              ) : currentTemplate ? (
                <>
                  {/* Variables in order of appearance */}
                  {sortedVariables.map((varData, index) => {
                const isFirst = index === 0;
                const isLast = index === sortedVariables.length - 1;
                
                if (varData.type === 'regular') {
                  const variable = varData.variable;
                  return (
                    <div key={`regular-${index}-${variable}`} className="mb-4">
                      <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                        {variable.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </label>
                      {variable === 'previous_output' ? (
                        <textarea
                          value={variableValues[variable] || ''}
                          onChange={(e) => handleVariableChange(variable, e.target.value)}
                          onKeyDown={(e) => handleKeyDown(e, isLast, index)}
                          className="w-full h-24 p-3 border border-secondary-300 dark:border-secondary-600 bg-white dark:bg-secondary-800 text-secondary-900 dark:text-secondary-100 rounded-lg focus:ring-2 focus:ring-primary-400 dark:focus:ring-primary-400 focus:border-transparent"
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
                          className="w-full p-3 border border-secondary-300 dark:border-secondary-600 bg-white dark:bg-secondary-800 text-secondary-900 dark:text-secondary-100 rounded-lg focus:ring-2 focus:ring-primary-400 dark:focus:ring-primary-400 focus:border-transparent"
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
                      <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                        {snippetVar.tag.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} (Snippet)
                        {filteredSnippets.length === 1 && (
                          <span className="ml-2 text-sm text-success-400 dark:text-success-400">(Auto-filled)</span>
                        )}
                        {filteredSnippets.length > 1 && (
                          <span className="ml-2 text-xs text-secondary-500 dark:text-secondary-500">(↑↓ arrows to navigate, Enter/Tab to select)</span>
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
                            ? 'border-secondary-300 dark:border-secondary-700 bg-secondary-100 dark:bg-secondary-900 text-secondary-500 dark:text-secondary-400 cursor-not-allowed' 
                            : 'border-secondary-300 dark:border-secondary-600 bg-white dark:bg-secondary-800 text-secondary-900 dark:text-secondary-100 focus:ring-2 focus:ring-warning-400 dark:focus:ring-warning-400 focus:border-transparent cursor-pointer'
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
                        <p className="text-sm text-yellow-400 dark:text-yellow-400 mt-1">
                          No snippets found with tag "{snippetVar.tag}"
                        </p>
                      )}
                    </div>
                  );
                }
              })}
              
                  {sortedVariables.length === 0 && stepType !== 'snippet' && (
                    <p className="text-secondary-500 dark:text-secondary-500">No variables to fill for this step.</p>
                  )}
                </>
              ) : (
                <p className="text-secondary-500 dark:text-secondary-500 italic">Loading template...</p>
              )}
            </>
          )}
            
            {/* Universal Option Selection */}
            {hasMultipleOptions && needsSelection && (
              <div 
                tabIndex={0}
                onKeyDown={handleGlobalKeyDown}
                className="focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-opacity-50 rounded-lg p-1"
              >
                <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100 mb-3 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-success-400 dark:text-success-400" />
                  Choose Option ({allStepOptions.length} available)
                  <span className="text-xs text-secondary-600 dark:text-secondary-500 ml-auto">
                    ↑↓ navigate • Enter/Tab select
                  </span>
                </h3>
                <div className="space-y-2">
                  {allStepOptions.map((option, mapIndex) => {                    
                    const optionId = option.id || option.item?.id || mapIndex;
                    const isSelected = selectedOptions[currentStepData.id]?.type === option.type && 
                                     selectedOptions[currentStepData.id]?.id === optionId;
                    const isHighlighted = highlightedOptionIndex === mapIndex;
                    const isTemplate = option.type === 'template';
                    const isWorkflow = option.type === 'workflow';
                    
                    
                    return (
                      <div
                        key={`${option.type}-${optionId}`}
                        className={`p-3 border rounded-lg cursor-pointer transition-all duration-200 ${
                          isSelected
                            ? isTemplate 
                              ? `border-${getColorClasses('template', 'border').split(' ')[0].replace('border-', '')} ${getColorClasses('template', 'background')} shadow-lg`
                              : isWorkflow
                              ? `border-${getColorClasses('workflow', 'border').split(' ')[0].replace('border-', '')} ${getColorClasses('workflow', 'background')} shadow-lg`
                              : `border-${getColorClasses('snippet', 'border').split(' ')[0].replace('border-', '')} ${getColorClasses('snippet', 'background')} shadow-lg`
                            : isHighlighted
                            ? 'border-secondary-400 dark:border-secondary-400 bg-secondary-200 dark:bg-secondary-700 ring-2 ring-secondary-400 dark:ring-secondary-400 transform scale-[1.02]'
                            : 'border-secondary-300 dark:border-secondary-600 bg-white dark:bg-secondary-800 hover:bg-secondary-100 dark:hover:bg-secondary-700 hover:border-secondary-400 dark:hover:border-secondary-500'
                        }`}
                        onClick={() => {
                          setSelectedOptions({
                            ...selectedOptions,
                            [currentStepData.id]: { type: option.type, id: optionId }
                          });
                          setVariableValues({}); // Reset variables when selection changes
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                              {isTemplate ? (
                                <FileText className={`w-5 h-5 ${getColorClasses('template', 'icon')}`} />
                              ) : isWorkflow ? (
                                <Workflow className={`w-5 h-5 ${getColorClasses('workflow', 'icon')}`} />
                              ) : (
                                <Layers className={`w-5 h-5 ${getColorClasses('snippet', 'icon')}`} />
                              )}
                              <span className={`text-xs px-2 py-1 rounded font-medium ${
                                isTemplate ? getColorClasses('template', 'tag') : isWorkflow ? getColorClasses('workflow', 'tag') : getColorClasses('snippet', 'tag')
                              }`}>
                                {isTemplate ? 'Template' : isWorkflow ? 'Workflow' : 'Snippet'}
                              </span>
                            </div>
                            <div>
                              <h4 className="font-semibold text-secondary-900 dark:text-secondary-100 text-base">{option.item.name}</h4>
                              <p className="text-sm text-secondary-600 dark:text-secondary-400 mt-1 line-clamp-2">{option.item.description}</p>
                            </div>
                          </div>
                          <div className="text-xs text-secondary-600 dark:text-secondary-500 italic">
                            {isHighlighted && '← Select'}
                          </div>
                        </div>
                        
                        {/* Compact preview - only show first 2 lines */}
                        <div className="mt-2 text-xs text-secondary-600 dark:text-secondary-500 bg-secondary-100 dark:bg-secondary-900/50 p-2 rounded border-l-2 border-secondary-300 dark:border-secondary-600">
                          {option.item.content ? (
                            option.item.content.split('\n').slice(0, 2).join('\n') + 
                            (option.item.content.split('\n').length > 2 ? '\n...' : '')
                          ) : (
                            'No content preview available'
                          )}
                        </div>
                        
                        {/* Tags for non-templates */}
                        {!isTemplate && option.item.tags && option.item.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {option.item.tags.slice(0, 3).map(tag => (
                              <span key={tag} className={`px-2 py-1 text-xs rounded ${getColorClasses('snippet', 'tag')}`}>
                                {tag}
                              </span>
                            ))}
                            {option.item.tags.length > 3 && (
                              <span className="px-2 py-1 bg-secondary-600 dark:bg-secondary-600 text-secondary-300 dark:text-secondary-300 text-xs rounded">
                                +{option.item.tags.length - 3} more
                              </span>
                            )}
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
                <h3 className="text-lg font-semibold text-secondary-100 dark:text-secondary-100 mb-3 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-warning-400 dark:text-warning-400" />
                  Snippets for this Step
                </h3>
                <div className="space-y-2">
                  {currentStepData.snippetIds.map(snippetId => {
                    const snippet = snippets.find(s => s.id === snippetId);
                    if (!snippet) return null;
                    
                    return (
                      <div key={snippetId} className={`p-3 border rounded-lg ${getColorClasses('snippet', 'border')} ${getColorClasses('snippet', 'background')}`}>
                        <h4 className="font-medium text-secondary-100 dark:text-secondary-100 mb-1">{snippet.name}</h4>
                        <p className="text-sm text-secondary-300 dark:text-secondary-300 mb-2">{snippet.description}</p>
                        {snippet.tags && (
                          <div className="flex flex-wrap gap-1">
                            {snippet.tags.map(tag => (
                              <span key={tag} className={`px-2 py-1 text-xs rounded ${getColorClasses('snippet', 'tag')}`}>
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
              <div className="bg-secondary-800 dark:bg-secondary-800 rounded-lg p-4 border border-secondary-600 dark:border-secondary-600">
                <h3 className="text-lg font-semibold text-secondary-100 dark:text-secondary-100 mb-3 flex items-center gap-2">
                  <Tag className="w-5 h-5" />
                  Insert Step
                </h3>
                <div className="text-secondary-200 dark:text-secondary-200 whitespace-pre-wrap">
                  {currentStepData.insertContent || 'No insert selected for this step.'}
                </div>
                {selectedSnippets.size > 0 && (
                  <div className="mt-3 pt-3 border-t border-secondary-600 dark:border-secondary-600">
                    <p className="text-sm text-secondary-300 dark:text-secondary-300 mb-2">
                      + {selectedSnippets.size} snippet{selectedSnippets.size > 1 ? 's' : ''} will be appended
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Snippet Preview - Enhanced centered layout */}
          {stepType === 'snippet' && (
            <div className="max-w-4xl mx-auto">
              
              <div className="bg-gradient-to-br from-secondary-700 via-secondary-750 to-secondary-800 dark:from-secondary-700 dark:via-secondary-750 dark:to-secondary-800 rounded-2xl p-6 border border-secondary-500/50 dark:border-secondary-500/50 shadow-2xl relative overflow-hidden">
                
                {/* Snippet metadata */}
                {currentTemplate && !needsSelection && (
                  <div className="mb-6 relative">
                    
                    {/* Description placed at top for better visibility */}
                    {(currentTemplate.description || item.description) && (
                      <div className="mb-4">
                        <p className="text-secondary-200 dark:text-secondary-200 text-base leading-relaxed bg-secondary-800/30 dark:bg-secondary-800/30 rounded-lg p-4">
                          {currentTemplate.description || item.description}
                        </p>
                      </div>
                    )}
                    
                    {currentTemplate.tags && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-secondary-400 dark:text-secondary-400 flex items-center gap-2">
                          <Tag className="w-4 h-4" />
                          Tags
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {currentTemplate.tags.map(tag => (
                            <span key={tag} className={`group px-4 py-2 text-sm rounded-lg transition-all duration-200 cursor-default flex items-center gap-2 ${getColorClasses('snippet', 'tag')}`}>
                              <div className={`w-2 h-2 ${getColorClasses('snippet', 'icon').replace('text-', 'bg-')} rounded-full transition-colors duration-200`}></div>
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Content preview */}
                <div className="relative">
                  
                  <div className="bg-gradient-to-br from-secondary-900/80 to-secondary-800/60 dark:from-secondary-900/80 dark:to-secondary-800/60 rounded-xl p-6 border border-secondary-500/40 dark:border-secondary-500/40 min-h-64 relative overflow-hidden backdrop-blur-sm">
                    
                    <div className="prose prose-sm max-w-none relative">
                      {needsSelection ? (
                        <div className="text-center py-16">
                          <div className="w-16 h-16 bg-gradient-to-br from-secondary-700 to-secondary-800 dark:from-secondary-700 dark:to-secondary-800 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-secondary-600 dark:border-secondary-600">
                            <Layers className="w-8 h-8 text-secondary-400 dark:text-secondary-400" />
                          </div>
                          <p className="text-secondary-400 dark:text-secondary-400 italic text-lg">
                            Select an option above to see the preview
                          </p>
                        </div>
                      ) : stepType === 'snippet' && currentStepData.type === 'info' && currentStepData.snippetIds?.length > 0 ? (
                        // For info steps with snippets, show the selected snippets content
                        <div className="space-y-6">
                          {currentStepData.snippetIds.map(snippetId => {
                            const snippet = snippets.find(s => s.id === snippetId);
                            return snippet ? (
                              <div key={snippetId} className="bg-gradient-to-r from-secondary-800/70 to-secondary-750/70 dark:from-secondary-800/70 dark:to-secondary-750/70 rounded-xl p-6 border border-secondary-600/40 dark:border-secondary-600/40 backdrop-blur-sm">
                                <div className="text-secondary-100 dark:text-secondary-100 leading-loose text-base font-mono bg-secondary-900/40 dark:bg-secondary-900/40 rounded-lg p-4 border border-secondary-600/30 dark:border-secondary-600/30">
                                  {snippet.content}
                                </div>
                              </div>
                            ) : null;
                          })}
                        </div>
                      ) : (
                        // For snippets, show content as-is without variable processing
                        <div className="relative">
                          {currentTemplate?.content ? (
                            <div className="bg-secondary-900/60 dark:bg-secondary-900/60 rounded-xl p-6 border border-secondary-600/40 dark:border-secondary-600/40">
                              <pre className="text-secondary-100 dark:text-secondary-100 leading-loose text-base font-mono whitespace-pre-wrap overflow-x-auto">
                                {currentTemplate.content}
                              </pre>
                            </div>
                          ) : (
                            <div className="text-center py-12">
                              <div className="w-12 h-12 bg-secondary-700 dark:bg-secondary-700 rounded-xl flex items-center justify-center mx-auto mb-4">
                                <FileText className="w-6 h-6 text-secondary-400 dark:text-secondary-400" />
                              </div>
                              <p className="text-secondary-400 dark:text-secondary-400 italic text-lg">No content available</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Template Preview - Only show when not selecting and not needsSelection */}
          {stepType === 'template' && !needsSelection && (
            <div className={`space-y-4 lg:col-span-6`}>
              <div>
                <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100 mb-3">{isWorkflow ? 'Preview' : 'Preview'}</h3>
                <div className="bg-white dark:bg-secondary-800 rounded-lg p-4 border border-secondary-300 dark:border-secondary-700 min-h-48">
                  <div className="prose prose-sm max-w-none whitespace-pre-wrap text-secondary-900 dark:text-secondary-100">
                    {generateOutput()}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Right Column - Only show for template and workflow steps */}
          {stepType !== 'snippet' && (
            <div className={`space-y-4 ${stepType === 'template' ? 'lg:col-span-2' : ''}`}>
            {/* Snippet Selection - Show for templates and workflows */}
            {filteredSnippets.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100 mb-3 flex items-center gap-2">
                  <Plus className="w-5 h-5 text-primary-400 dark:text-primary-400" />
                  Snippets
                </h3>
                <div className="space-y-2">
                  {filteredSnippets.map((snippet) => (
                      <div
                        key={snippet.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          selectedSnippets.has(snippet.id)
                            ? `${getColorClasses('template', 'border')} ${getColorClasses('template', 'background')}`
                            : 'border-secondary-300 dark:border-secondary-600 bg-white dark:bg-secondary-800 hover:bg-secondary-100 dark:hover:bg-secondary-700'
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
                                ? 'bg-primary-500 dark:bg-primary-500 border-primary-500 dark:border-primary-500'
                                : 'border-secondary-400 dark:border-secondary-400'
                            }`}>
                              {selectedSnippets.has(snippet.id) && (
                                <Check className="w-3 h-3 text-white" />
                              )}
                            </div>
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-secondary-900 dark:text-secondary-100 mb-1">{snippet.name}</h4>
                            <p className="text-sm text-secondary-600 dark:text-secondary-300">{snippet.description}</p>
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
                <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100 mb-3 flex items-center gap-2">
                  <Plus className="w-5 h-5 text-primary-400 dark:text-primary-400" />
                  Selected Snippets ({selectedSnippets.size})
                </h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {Array.from(selectedSnippets).map((snippetId) => {
                    const snippet = filteredSnippets.find(s => s.id === snippetId);
                    if (!snippet) return null;
                    
                    return (
                      <div key={snippetId} className={`rounded-lg p-3 ${getColorClasses('template', 'info-block')}`}>
                        <div className="flex items-center justify-between mb-1">
                          <p className={`text-sm font-medium ${getColorClasses('template', 'info-header')}`}>
                            {snippet.name}
                          </p>
                          <button
                            onClick={() => {
                              const newSelected = new Set(selectedSnippets);
                              newSelected.delete(snippetId);
                              setSelectedSnippets(newSelected);
                            }}
                            className="text-xs text-primary-300 dark:text-primary-300 hover:text-primary-100 dark:hover:text-primary-100"
                          >
                            Remove
                          </button>
                        </div>
                        <div className="text-xs text-primary-200 dark:text-primary-200">
                          {snippet.description}
                        </div>
                      </div>
                    );
                  })}
                </div>
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
