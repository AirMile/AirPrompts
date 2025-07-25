import React, { useState, useEffect } from 'react';
import { AppProviders } from './app/AppProviders';
import { useUIStore } from '../store/useUIStore';
import themeStore from '../store/themeStore.js';
import { 
  useTemplates, useCreateTemplate, useUpdateTemplate, useDeleteTemplate,
  useWorkflows, useCreateWorkflow, useUpdateWorkflow, useDeleteWorkflow,
  useSnippets, useCreateSnippet, useUpdateSnippet, useDeleteSnippet,
  useToggleFolderFavorite
} from '../hooks/queries';
import { useFolders, useCreateFolder, useUpdateFolder, useDeleteFolder } from '../hooks/queries/useFoldersQuery';
import { useQueryClient } from '@tanstack/react-query';
import { LoadingSpinner } from './shared/ui';

// Lazy load heavy components for better performance
const Homepage = React.lazy(() => import('./dashboard/Homepage.jsx'));
const TemplateEditor = React.lazy(() => import('./templates/TemplateEditor.jsx'));
const WorkflowEditor = React.lazy(() => import('./workflows/WorkflowEditorRefactored.jsx'));
const SnippetEditor = React.lazy(() => import('./snippets/SnippetEditor.jsx'));
const ItemExecutor = React.lazy(() => import('./features/execution/ItemExecutor.jsx'));

// Preload critical components on idle
if ('requestIdleCallback' in window) {
  requestIdleCallback(() => {
    import('./dashboard/Homepage.jsx');
  }, { timeout: 2000 });
}

// Temporary API test component
import APITestComponent from './test/APITestComponent.jsx';

import ErrorBoundary from './shared/layout/ErrorBoundary.jsx';
import { PreferencesProvider } from '../contexts/PreferencesContext.jsx';
import { loadAllData } from '../utils/dataStorage.js';
import { createSaveHandler } from '../utils/entityHelpers.js';
import { useOnlineStatus } from '../hooks/domain/useOnlineStatus';
import { useSyncStatus } from '../hooks/domain/useSyncStatus';
import { clearFoldersData } from '../utils/localStorageManager';
import defaultTemplates from '../data/defaultTemplates.json';
import defaultWorkflows from '../data/defaultWorkflows.json';
import defaultSnippets from '../data/defaultSnippets.json';

// Inner component that uses the hooks
const PromptTemplateSystemInner = () => {
  // Use Zustand for UI state
  const { searchQuery, setSearchQuery, selectedFolderId, setSelectedFolder } = useUIStore();
  
  // Get query client for cache management
  const queryClient = useQueryClient();
  
  // Use TanStack Query for data
  const { data: templates = [], isPending: templatesPending, isLoading: templatesLoading } = useTemplates();
  const { data: workflows = [], isPending: workflowsPending, isLoading: workflowsLoading } = useWorkflows();
  const { data: snippets = [], isPending: snippetsPending, isLoading: snippetsLoading } = useSnippets();
  const { data: folders = [], isPending: foldersPending, isLoading: foldersLoading } = useFolders();
  
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
  
  const toggleFolderFavorite = useToggleFolderFavorite();
  
  // Folder mutations
  const createFolderMutation = useCreateFolder();
  const updateFolderMutation = useUpdateFolder();
  const deleteFolderMutation = useDeleteFolder();

  // Local state for editing
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [editingWorkflow, setEditingWorkflow] = useState(null);
  const [editingSnippet, setEditingSnippet] = useState(null);
  const [executingItem, setExecutingItem] = useState(null);

  // Folder management functions
  const handleCreateFolder = (folderData) => {
    createFolderMutation.mutate(folderData);
  };

  const handleUpdateFolder = (folderData) => {
    updateFolderMutation.mutate(folderData);
  };

  const handleDeleteFolder = (folderId) => {
    deleteFolderMutation.mutate(folderId, {
      onSuccess: () => {
        // Reset selection if deleted folder was selected
        if (selectedFolderId === folderId) {
          setSelectedFolder('root');
        }
      }
    });
  };

  const handleReorderFolders = async (updatedFolders) => {
    // Use the server API to update folder sort orders
    const updates = updatedFolders.map(folder => ({
      id: folder.id,
      sort_order: folder.sortOrder
    }));
    
    try {
      console.log('🔄 Batch updating folder sort orders:', updates);
      
      // Optimistic update - update query cache immediately
      queryClient.setQueryData(['folders'], (oldData) => {
        if (!oldData) return oldData;
        
        const updateMap = new Map(updates.map(u => [u.id, u.sort_order]));
        
        // Update folders with new sort_order values
        const updatedFolders = oldData.map(folder => {
          if (updateMap.has(folder.id)) {
            const newSortOrder = updateMap.get(folder.id);
            return { 
              ...folder, 
              sort_order: newSortOrder,
              sortOrder: newSortOrder  // Also update camelCase version for UI
            };
          }
          return folder;
        });
        
        // Sort by parent_id first (nulls/root first), then by sort_order
        return updatedFolders.sort((a, b) => {
          // Group by parent - root folders first
          const aParent = a.parent_id || '';
          const bParent = b.parent_id || '';
          
          if (aParent !== bParent) {
            return aParent.localeCompare(bParent);
          }
          
          // Within same parent, sort by sort_order
          return (a.sort_order || 0) - (b.sort_order || 0);
        });
      });
      
      // Use localStorage directly instead of hook
      const { updateFoldersSortOrders } = await import('../utils/localStorageManager.js');
      const result = await updateFoldersSortOrders(updates);
      
      if (!result.success) {
        throw new Error('Failed to update folder sort order');
      }
      
      console.log('✅ Successfully updated folder sort orders');
      
      // Small delay before invalidating to allow server to process the update
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['folders'] });
      }, 100);
      
    } catch (error) {
      console.error('Error updating folder sort order:', error);
      // Revert optimistic update on error
      queryClient.invalidateQueries({ queryKey: ['folders'] });
    }
  };

  // Use isPending for initial loading state (TanStack Query v5)
  const isInitialLoading = templatesPending || workflowsPending || snippetsPending || foldersPending;
  const isFetching = templatesLoading || workflowsLoading || snippetsLoading || foldersLoading;
  
  // Debug logging commented out to reduce console noise
  // console.log('📊 PromptTemplateSystem render - Data counts:', {
  //   templates: templates?.length || 0,
  //   workflows: workflows?.length || 0,
  //   snippets: snippets?.length || 0,
  //   folders: folders?.length || 0
  // });
  
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
  
  // Debug helper - Make clearFoldersData available globally
  useEffect(() => {
    window.clearFoldersData = () => {
      clearFoldersData();
      // Invalidate folders query to reload from localStorage
      queryClient.invalidateQueries({ queryKey: ['folders'] });
      console.log('🔄 Refreshing folders from localStorage...');
    };
    
    // console.log('🛠️ Debug: Run window.clearFoldersData() to clear placeholder folders');
    
    return () => {
      delete window.clearFoldersData;
    };
  }, [queryClient]);

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
      <TemplateEditor 
        template={editingTemplate} 
        folders={folders}
        onSave={handleSaveTemplate} 
        onCancel={() => setEditingTemplate(null)}
      />
    );
  }

  if (editingWorkflow) {
    return (
      <WorkflowEditor 
        workflow={editingWorkflow} 
        templates={templates}
        snippets={snippets}
        workflows={workflows}
        folders={folders}
        onSave={handleSaveWorkflow} 
        onCancel={() => setEditingWorkflow(null)}
      />
    );
  }

  if (editingSnippet) {
    return (
      <SnippetEditor 
        snippet={editingSnippet}
        folders={folders}
        onSave={handleSaveSnippet} 
        onCancel={() => setEditingSnippet(null)}
      />
    );
  }

  if (executingItem) {
    return (
      <ItemExecutor 
        item={executingItem.item}
        type={executingItem.type}
        templates={templates}
        workflows={workflows}
        snippets={snippets}
        onComplete={() => setExecutingItem(null)}
        onCancel={() => setExecutingItem(null)}
      />
    );
  }

  // Force render Homepage - skip loading screen completely for debugging
  // TODO: Re-enable proper loading logic later

  return (
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
        onCreateFolder={handleCreateFolder}
        onUpdateFolder={handleUpdateFolder}
        onDeleteFolder={handleDeleteFolder}
        onReorderFolders={handleReorderFolders}
        onUpdateSnippet={(snippet) => updateSnippet.mutate({ id: snippet.id, ...snippet })}
        onToggleFolderFavorite={toggleFolderFavorite}
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
      />
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
    folders: []
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