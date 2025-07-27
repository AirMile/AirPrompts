import React, { useCallback } from 'react';
import { BaseEditor } from '../base/BaseEditor';
import { workflowSchema } from '../../schemas/entitySchemas';
import WorkflowStepsEditor from './WorkflowStepsEditor';

/**
 * Workflow Editor using BaseEditor pattern
 * Handles workflow creation and editing with proper validation
 */
const WorkflowEditorRefactored = ({ 
  workflow, 
  templates = [], 
  snippets = [], 
  workflows = [], 
  folders = [], 
  onSave, 
  onCancel 
}) => {
  // Process existing workflow steps to handle info steps with snippetIds/templateId
  const processStepsForEditing = (steps) => {
    return (steps || []).map(step => {
      const processedStep = { ...step };
      
      // Ensure nestedComponents structure exists
      if (!processedStep.nestedComponents) {
        processedStep.nestedComponents = {
          templates: [],
          snippets: [],
          workflows: []
        };
      }
      
      if (step.type === 'info') {
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
      }
      
      return processedStep;
    });
  };

  // Process steps for saving
  const processStepsForSaving = (steps) => {
    return steps.map(step => {
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
  };

  // Transform workflow data for save
  const handleSave = useCallback((formData) => {
    const processedSteps = processStepsForSaving(formData.steps || []);
    
    const newWorkflow = {
      // Only include ID for existing workflows (updates)
      ...(workflow?.id && { id: workflow.id }),
      // API-compatible fields only
      name: formData.name,
      description: formData.description,
      category: workflow?.category || formData.folderIds?.[0] || 'general',
      steps: processedSteps,
      favorite: workflow?.favorite || false,
      // Keep UI-specific fields separate for localStorage fallback
      folderIds: formData.folderIds || [],
      // Keep backward compatibility
      folderId: formData.folderIds?.[0] || 'workflows',
      lastUsed: workflow?.lastUsed || new Date().toISOString()
    };
    
    onSave(newWorkflow);
  }, [workflow, onSave]);

  // Prepare initial data with defaults
  const initialData = {
    name: workflow?.name || '',
    description: workflow?.description || '',
    // Support both old folderId and new folderIds
    folderIds: workflow?.folderIds || (workflow?.folderId ? [workflow.folderId] : []),
    steps: processStepsForEditing(workflow?.steps) || []
  };

  // Custom components for the FieldRenderer
  const customComponents = {
    steps: (props) => (
      <WorkflowStepsEditor
        {...props}
        templates={templates}
        snippets={snippets}
        workflows={workflows}
        folders={folders}
        currentWorkflowId={workflow?.id}
      />
    )
  };

  return (
    <BaseEditor
      entity={workflow}
      initialData={initialData}
      entityType="workflow"
      schema={workflowSchema}
      onSave={handleSave}
      onCancel={onCancel}
      folders={folders}
      customComponents={customComponents}
    />
  );
};

export default WorkflowEditorRefactored;