import React, { useState, useEffect, Suspense } from 'react';
import { AppProviders } from './app/AppProviders';
import { useUIStore } from '../store/useUIStore';
import { useTemplates, useCreateTemplate, useUpdateTemplate, useDeleteTemplate } from '../hooks/useTemplatesQuery';
import { useWorkflows, useCreateWorkflow, useUpdateWorkflow, useDeleteWorkflow } from '../hooks/useWorkflowsQuery';
import { useSnippets, useCreateSnippet, useUpdateSnippet, useDeleteSnippet } from '../hooks/useSnippetsQuery';
import { LoadingSpinner } from './common/ui/LoadingStates';
import { ErrorMessage } from './common/ui/ErrorStates';

// Lazy load heavy components
const TemplateEditor = React.lazy(() => import('./templates/TemplateEditor.jsx'));
const ItemExecutor = React.lazy(() => import('./common/ItemExecutor.jsx'));
const Homepage = React.lazy(() => import('./dashboard/Homepage.jsx'));
const WorkflowEditor = React.lazy(() => import('./workflows/WorkflowEditor.jsx'));
const SnippetEditor = React.lazy(() => import('./snippets/SnippetEditor.jsx'));

import ErrorBoundary from './common/ErrorBoundary.jsx';
import { PreferencesProvider } from '../contexts/PreferencesContext.jsx';
import { loadAllData } from '../utils/dataStorage.js';
import defaultTemplates from '../data/defaultTemplates.json';
import defaultWorkflows from '../data/defaultWorkflows.json';
import defaultSnippets from '../data/defaultSnippets.json';
import defaultFolders from '../data/defaultFolders.json';

// Inner component that uses the hooks
const PromptTemplateSystemInner = () => {
  // Use Zustand for UI state
  const { searchQuery, setSearchQuery, selectedFolderId, setSelectedFolder } = useUIStore();
  
  // Use TanStack Query for data
  const { data: templates = [], isLoading: templatesLoading } = useTemplates();
  const { data: workflows = [], isLoading: workflowsLoading } = useWorkflows();
  const { data: snippets = [], isLoading: snippetsLoading } = useSnippets();
  
  // Mutations
  const createTemplate = useCreateTemplate();
  const updateTemplate = useUpdateTemplate();
  const deleteTemplate = useDeleteTemplate();
  
  const createWorkflow = useCreateWorkflow();
  const updateWorkflow = useUpdateWorkflow();
  const deleteWorkflow = useDeleteWorkflow();
  
  const createSnippet = useCreateSnippet();
  const updateSnippet = useUpdateSnippet();
  const deleteSnippet = useDeleteSnippet();

  // Local state for editing
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [editingWorkflow, setEditingWorkflow] = useState(null);
  const [editingSnippet, setEditingSnippet] = useState(null);
  const [executingItem, setExecutingItem] = useState(null);
  const [folders, setFolders] = useState(defaultFolders); // TODO: Move to Zustand

  const isLoading = templatesLoading || workflowsLoading || snippetsLoading;

  // Save handlers
  const handleSaveTemplate = async (template) => {
    try {
      if (template.id && templates.find(t => t.id === template.id)) {
        await updateTemplate.mutateAsync(template);
      } else {
        await createTemplate.mutateAsync(template);
      }
      setEditingTemplate(null);
    } catch (err) {
      console.error('Failed to save template:', err);
    }
  };

  const handleSaveWorkflow = async (workflow) => {
    try {
      if (workflow.id && workflows.find(w => w.id === workflow.id)) {
        await updateWorkflow.mutateAsync(workflow);
      } else {
        await createWorkflow.mutateAsync(workflow);
      }
      setEditingWorkflow(null);
    } catch (err) {
      console.error('Failed to save workflow:', err);
    }
  };

  const handleSaveSnippet = async (snippet) => {
    try {
      if (snippet.id && snippets.find(s => s.id === snippet.id)) {
        await updateSnippet.mutateAsync(snippet);
      } else {
        await createSnippet.mutateAsync(snippet);
      }
      setEditingSnippet(null);
    } catch (err) {
      console.error('Failed to save snippet:', err);
    }
  };

  // Render current view
  if (editingTemplate) {
    return (
      <Suspense fallback={<LoadingSpinner />}>
        <TemplateEditor 
          template={editingTemplate} 
          onSave={handleSaveTemplate} 
          onCancel={() => setEditingTemplate(null)}
        />
      </Suspense>
    );
  }

  if (editingWorkflow) {
    return (
      <Suspense fallback={<LoadingSpinner />}>
        <WorkflowEditor 
          workflow={editingWorkflow} 
          templates={templates}
          onSave={handleSaveWorkflow} 
          onCancel={() => setEditingWorkflow(null)}
        />
      </Suspense>
    );
  }

  if (editingSnippet) {
    return (
      <Suspense fallback={<LoadingSpinner />}>
        <SnippetEditor 
          snippet={editingSnippet}
          onSave={handleSaveSnippet} 
          onCancel={() => setEditingSnippet(null)}
        />
      </Suspense>
    );
  }

  if (executingItem) {
    return (
      <Suspense fallback={<LoadingSpinner />}>
        <ItemExecutor 
          item={executingItem.item}
          itemType={executingItem.itemType}
          templates={templates}
          workflows={workflows}
          onClose={() => setExecutingItem(null)}
        />
      </Suspense>
    );
  }

  // Show loading state while data is being fetched
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <LoadingSpinner size={48} />
        <span className="ml-4 text-lg">Loading data...</span>
      </div>
    );
  }

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Homepage
        templates={templates}
        workflows={workflows}
        snippets={snippets}
        folders={folders}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedFolderId={selectedFolderId}
        setSelectedFolderId={setSelectedFolder}
        onEditTemplate={setEditingTemplate}
        onEditWorkflow={setEditingWorkflow}
        onEditSnippet={setEditingSnippet}
        onExecuteItem={(item, itemType) => setExecutingItem({ item, itemType })}
        onDeleteTemplate={(id) => deleteTemplate.mutate(id)}
        onDeleteWorkflow={(id) => deleteWorkflow.mutate(id)}
        onDeleteSnippet={(id) => deleteSnippet.mutate(id)}
        onUpdateTemplate={(template) => updateTemplate.mutate(template)}
        onUpdateWorkflow={(workflow) => updateWorkflow.mutate(workflow)}
        onUpdateSnippet={(snippet) => updateSnippet.mutate(snippet)}
        setTemplates={(templates) => console.log('setTemplates called - migrate to TanStack Query')}
        setWorkflows={(workflows) => console.log('setWorkflows called - migrate to TanStack Query')}
        setSnippets={(snippets) => console.log('setSnippets called - migrate to TanStack Query')}
        onCreateFolder={(folder) => setFolders([...folders, folder])}
      />
    </Suspense>
  );
};

// Main component with providers
const PromptTemplateSystemNew = () => {
  // Load initial data
  const initialData = loadAllData({
    templates: defaultTemplates,
    workflows: defaultWorkflows,
    snippets: defaultSnippets,
    folders: defaultFolders
  });

  return (
    <ErrorBoundary>
      <AppProviders initialData={initialData}>
        <PreferencesProvider>
          <PromptTemplateSystemInner />
        </PreferencesProvider>
      </AppProviders>
    </ErrorBoundary>
  );
};

export default PromptTemplateSystemNew;