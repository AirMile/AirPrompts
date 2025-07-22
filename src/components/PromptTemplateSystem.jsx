import React, { useState, useEffect, Suspense } from 'react';
import { AppProviders } from './app/AppProviders';
import { useUIStore } from '../store/useUIStore';
import themeStore from '../store/themeStore.js';
import { 
  useTemplates, useCreateTemplate, useUpdateTemplate, useDeleteTemplate,
  useWorkflows, useCreateWorkflow, useUpdateWorkflow, useDeleteWorkflow,
  useSnippets, useCreateSnippet, useUpdateSnippet, useDeleteSnippet 
} from '../hooks/queries';
import { LoadingSpinner } from './shared/ui';

// Lazy load heavy components
const TemplateEditor = React.lazy(() => import('./templates/TemplateEditor.jsx'));
const ItemExecutor = React.lazy(() => import('./features/execution/ItemExecutor.jsx'));
const Homepage = React.lazy(() => import('./dashboard/Homepage.jsx'));
const WorkflowEditor = React.lazy(() => import('./workflows/WorkflowEditor.jsx'));
const SnippetEditor = React.lazy(() => import('./snippets/SnippetEditor.jsx'));

// Temporary API test component
import APITestComponent from './test/APITestComponent.jsx';

import ErrorBoundary from './shared/layout/ErrorBoundary.jsx';
import { PreferencesProvider } from '../contexts/PreferencesContext.jsx';
import { loadAllData } from '../utils/dataStorage.js';
import { createSaveHandler } from '../utils/entityHelpers.js';
import { useOnlineStatus } from '../hooks/domain/useOnlineStatus';
import { useSyncStatus } from '../hooks/domain/useSyncStatus';
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
  
  // Monitor online status
  const { isOnline, hasBeenOffline } = useOnlineStatus();
  
  // Monitor sync queue status
  const { pendingCount, syncStatus } = useSyncStatus();
  
  // Log status changes for debugging (functionality only, no UI)
  useEffect(() => {
    if (!isOnline) {
      console.log('App is offline - operations will be queued');
    } else if (hasBeenOffline) {
      console.log('App is back online - processing queued operations');
    }
  }, [isOnline, hasBeenOffline]);
  
  // Log sync queue status
  useEffect(() => {
    if (pendingCount > 0) {
      console.log(`Sync status: ${syncStatus}, ${pendingCount} operations pending`);
    }
  }, [pendingCount, syncStatus]);

  // Save handlers using helper
  const handleSaveTemplate = createSaveHandler({
    items: templates,
    createMutation: createTemplate,
    updateMutation: updateTemplate,
    onSuccess: () => setEditingTemplate(null),
    entityName: 'template'
  });

  const handleSaveWorkflow = createSaveHandler({
    items: workflows,
    createMutation: createWorkflow,
    updateMutation: updateWorkflow,
    onSuccess: () => setEditingWorkflow(null),
    entityName: 'workflow'
  });

  const handleSaveSnippet = createSaveHandler({
    items: snippets,
    createMutation: createSnippet,
    updateMutation: updateSnippet,
    onSuccess: () => setEditingSnippet(null),
    entityName: 'snippet'
  });

  // Render current view
  if (editingTemplate) {
    return (
      <Suspense fallback={<LoadingSpinner />}>
        <TemplateEditor 
          template={editingTemplate} 
          folders={folders}
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
          snippets={snippets}
          workflows={workflows}
          folders={folders}
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
          folders={folders}
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
          type={executingItem.type}
          templates={templates}
          workflows={workflows}
          snippets={snippets}
          onComplete={() => setExecutingItem(null)}
          onCancel={() => setExecutingItem(null)}
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
        onExecuteItem={({ item, type }) => setExecutingItem({ item, type })}
        onDeleteTemplate={(id) => deleteTemplate.mutate(id)}
        onDeleteWorkflow={(id) => deleteWorkflow.mutate(id)}
        onDeleteSnippet={(id) => deleteSnippet.mutate(id)}
        onUpdateTemplate={(template) => updateTemplate.mutate({ id: template.id, ...template })}
        onUpdateWorkflow={(workflow) => updateWorkflow.mutate({ id: workflow.id, ...workflow })}
        onUpdateSnippet={(snippet) => updateSnippet.mutate({ id: snippet.id, ...snippet })}
        onReorderTemplates={(reorderedTemplates) => {
          // Use optimistic updates for reordering
          reorderedTemplates.forEach(template => {
            updateTemplate.mutate({ id: template.id, ...template });
          });
        }}
        onReorderWorkflows={(reorderedWorkflows) => {
          reorderedWorkflows.forEach(workflow => {
            updateWorkflow.mutate({ id: workflow.id, ...workflow });
          });
        }}
        onReorderSnippets={(reorderedSnippets) => {
          reorderedSnippets.forEach(snippet => {
            updateSnippet.mutate({ id: snippet.id, ...snippet });
          });
        }}
        onCreateFolder={(folder) => setFolders([...folders, folder])}
      />
    </Suspense>
  );
};

// Main component with providers
const PromptTemplateSystem = () => {
  // Initialize theme system
  useEffect(() => {
    themeStore.getState().initializeTheme();
  }, []);

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

export default PromptTemplateSystem;