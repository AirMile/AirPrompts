import React, { useState, useEffect } from 'react';
import TemplateEditor from './templates/TemplateEditor.jsx';
import ItemExecutor from './common/ItemExecutor.jsx';
import Homepage from './dashboard/Homepage.jsx';
import WorkflowEditor from './workflows/WorkflowEditor.jsx';
import SnippetEditor from './snippets/SnippetEditor.jsx';
import ErrorBoundary from './common/ErrorBoundary.jsx';
import Loading from './common/Loading.jsx';
import ErrorMessage from './common/ErrorMessage.jsx';
import { PreferencesProvider } from '../contexts/PreferencesContext.jsx';
import { usePersistedAppState } from '../hooks/usePersistedState.js';
import { loadAllData, getStorageInfo } from '../utils/dataStorage.js';
import defaultTemplates from '../data/defaultTemplates.json';
import defaultWorkflows from '../data/defaultWorkflows.json';
import defaultSnippets from '../data/defaultSnippets.json';
import defaultFolders from '../data/defaultFolders.json';

const PromptTemplateSystem = () => {
  // Load initial data from localStorage with fallback to defaults
  const initialData = loadAllData({
    templates: defaultTemplates,
    workflows: defaultWorkflows,
    snippets: defaultSnippets,
    folders: defaultFolders,
  });

  // Use persisted state that auto-saves to localStorage
  const {
    templates,
    workflows,
    snippets,
    folders,
    setTemplates,
    setWorkflows,
    setSnippets,
    setFolders,
    updateTemplate,
    updateWorkflow,
    updateSnippet,
    deleteTemplate,
    deleteWorkflow,
    deleteSnippet,
  } = usePersistedAppState(initialData, {
    debounceMs: 300, // Snellere save voor betere UX
    onSaveError: (type, error) => {
      console.error(`💾 Error bij opslaan van ${type}:`, error);
      setError(`Kon ${type} niet opslaan. Wijzigingen kunnen verloren gaan.`);
    },
    onSaveSuccess: () => {},
  });

  // UI state (niet persistent)
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [editingWorkflow, setEditingWorkflow] = useState(null);
  const [editingSnippet, setEditingSnippet] = useState(null);
  const [executingItem, setExecutingItem] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFolderId, setSelectedFolderId] = useState('home');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Log storage info bij opstarten
  useEffect(() => {
    const storageInfo = getStorageInfo();
    if (storageInfo.available) {
      if (initialData.migrated) {
        // Migration already completed
      }
    } else {
      console.warn('⚠️ LocalStorage niet beschikbaar, wijzigingen gaan verloren bij refresh');
      setError('LocalStorage niet beschikbaar. Wijzigingen worden niet opgeslagen.');
    }
  }, [initialData.migrated]);

  // Save handlers voor editors
  const handleSaveTemplate = (template) => {
    try {
      setIsLoading(true);
      setError(null);

      if (template.id && templates.find((t) => t.id === template.id)) {
        // Update bestaande template
        setTemplates(templates.map((t) => (t.id === template.id ? template : t)));
      } else {
        // Nieuwe template
        setTemplates([...templates, { ...template, id: Date.now() }]);
      }
      setEditingTemplate(null);
    } catch (err) {
      setError(`Kon template niet opslaan: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveWorkflow = (workflow) => {
    try {
      setIsLoading(true);
      setError(null);

      if (workflow.id && workflows.find((w) => w.id === workflow.id)) {
        // Update bestaande workflow
        setWorkflows(workflows.map((w) => (w.id === workflow.id ? workflow : w)));
      } else {
        // Nieuwe workflow
        setWorkflows([...workflows, { ...workflow, id: Date.now() }]);
      }
      setEditingWorkflow(null);
    } catch (err) {
      setError(`Kon workflow niet opslaan: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSnippet = (snippet) => {
    try {
      setIsLoading(true);
      setError(null);

      if (snippet.id && snippets.find((s) => s.id === snippet.id)) {
        // Update bestaande snippet
        setSnippets(snippets.map((s) => (s.id === snippet.id ? snippet : s)));
      } else {
        // Nieuwe snippet
        setSnippets([...snippets, { ...snippet, id: Date.now() }]);
      }
      setEditingSnippet(null);
    } catch (err) {
      setError(`Kon snippet niet opslaan: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateFolder = (parentId = 'root') => {
    const folderName = prompt('Voer folder naam in:');
    if (folderName && folderName.trim()) {
      const newFolder = {
        id: `folder_${Date.now()}`,
        name: folderName.trim(),
        parentId: parentId,
        type: 'folder',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setFolders([...folders, newFolder]);
    }
  };

  if (executingItem) {
    return (
      <PreferencesProvider>
        <ErrorBoundary message="An error occurred while executing this item. Please try again or go back to the dashboard.">
          <ItemExecutor
            item={executingItem.item}
            type={executingItem.type}
            snippets={snippets}
            onComplete={() => {
              setExecutingItem(null);
            }}
            onCancel={() => {
              setExecutingItem(null);
            }}
            onEdit={(snippet) => {
              setExecutingItem(null);
              setEditingSnippet(snippet);
            }}
          />
        </ErrorBoundary>
      </PreferencesProvider>
    );
  }

  if (editingTemplate !== null) {
    return (
      <PreferencesProvider>
        <ErrorBoundary message="An error occurred while editing the template. Your changes may not have been saved.">
          <TemplateEditor
            template={editingTemplate}
            folders={folders}
            onSave={handleSaveTemplate}
            onCancel={() => {
              setEditingTemplate(null);
            }}
          />
        </ErrorBoundary>
      </PreferencesProvider>
    );
  }

  if (editingWorkflow !== null) {
    return (
      <PreferencesProvider>
        <ErrorBoundary message="An error occurred while editing the workflow. Your changes may not have been saved.">
          <WorkflowEditor
            workflow={editingWorkflow}
            templates={templates}
            snippets={snippets}
            workflows={workflows}
            folders={folders}
            onSave={handleSaveWorkflow}
            onCancel={() => {
              setEditingWorkflow(null);
            }}
          />
        </ErrorBoundary>
      </PreferencesProvider>
    );
  }

  if (editingSnippet !== null) {
    return (
      <PreferencesProvider>
        <ErrorBoundary message="An error occurred while editing the snippet. Your changes may not have been saved.">
          <SnippetEditor
            snippet={editingSnippet}
            folders={folders}
            onSave={handleSaveSnippet}
            onCancel={() => {
              setEditingSnippet(null);
            }}
          />
        </ErrorBoundary>
      </PreferencesProvider>
    );
  }

  return (
    <PreferencesProvider>
      <ErrorBoundary message="An error occurred while loading the dashboard. Please refresh the page or try again later.">
        <div className="min-h-screen bg-gray-900">
          {/* Global Error Message */}
          {error && (
            <div className="fixed top-4 right-4 z-50 max-w-md">
              <ErrorMessage error={error} onDismiss={() => setError(null)} variant="critical" />
            </div>
          )}

          {/* Global Loading Overlay */}
          {isLoading && (
            <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center">
              <div className="bg-gray-800 rounded-lg p-6">
                <Loading message="Saving..." size="large" />
              </div>
            </div>
          )}

          <Homepage
            templates={templates}
            workflows={workflows}
            snippets={snippets}
            folders={folders}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            selectedFolderId={selectedFolderId}
            setSelectedFolderId={setSelectedFolderId}
            onEditTemplate={setEditingTemplate}
            onEditWorkflow={setEditingWorkflow}
            onEditSnippet={setEditingSnippet}
            onExecuteItem={(data) => {
              setExecutingItem(data);
            }}
            onDeleteTemplate={deleteTemplate}
            onDeleteWorkflow={deleteWorkflow}
            onDeleteSnippet={deleteSnippet}
            onUpdateTemplate={updateTemplate}
            onUpdateWorkflow={updateWorkflow}
            onUpdateSnippet={updateSnippet}
            setTemplates={setTemplates}
            setWorkflows={setWorkflows}
            setSnippets={setSnippets}
            onCreateFolder={handleCreateFolder}
          />
        </div>
      </ErrorBoundary>
    </PreferencesProvider>
  );
};

export default PromptTemplateSystem;
