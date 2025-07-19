import React, { useState } from 'react';
import TemplateEditor from './templates/TemplateEditor.jsx';
import ItemExecutor from './common/ItemExecutor.jsx';
import Homepage from './dashboard/Homepage.jsx';
import WorkflowEditor from './workflows/WorkflowEditor.jsx';
import SnippetEditor from './snippets/SnippetEditor.jsx';
import ErrorBoundary from './common/ErrorBoundary.jsx';
import Loading from './common/Loading.jsx';
import ErrorMessage from './common/ErrorMessage.jsx';
import { PreferencesProvider } from '../contexts/PreferencesContext.jsx';
import defaultTemplates from '../data/defaultTemplates.json';
import defaultWorkflows from '../data/defaultWorkflows.json';
import defaultSnippets from '../data/defaultSnippets.json';
import defaultFolders from '../data/defaultFolders.json';

const PromptTemplateSystem = () => {
  const [templates, setTemplates] = useState(defaultTemplates);
  const [workflows, setWorkflows] = useState(defaultWorkflows);
  const [snippets, setSnippets] = useState(defaultSnippets);
  const [folders, setFolders] = useState(defaultFolders);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [editingWorkflow, setEditingWorkflow] = useState(null);
  const [editingSnippet, setEditingSnippet] = useState(null);
  const [executingItem, setExecutingItem] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFolderId, setSelectedFolderId] = useState('home');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Main render logic
  const handleSaveTemplate = (template) => {
    try {
      setIsLoading(true);
      setError(null);
      
      if (template.id && templates.find(t => t.id === template.id)) {
        setTemplates(templates.map(t => t.id === template.id ? template : t));
      } else {
        setTemplates([...templates, { ...template, id: Date.now() }]);
      }
      setEditingTemplate(null);
    } catch (err) {
      setError(`Failed to save template: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveWorkflow = (workflow) => {
    try {
      setIsLoading(true);
      setError(null);
      
      if (workflow.id && workflows.find(w => w.id === workflow.id)) {
        setWorkflows(workflows.map(w => w.id === workflow.id ? workflow : w));
      } else {
        setWorkflows([...workflows, { ...workflow, id: Date.now() }]);
      }
      setEditingWorkflow(null);
    } catch (err) {
      setError(`Failed to save workflow: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSnippet = (snippet) => {
    try {
      setIsLoading(true);
      setError(null);
      
      if (snippet.id && snippets.find(s => s.id === snippet.id)) {
        setSnippets(snippets.map(s => s.id === snippet.id ? snippet : s));
      } else {
        setSnippets([...snippets, { ...snippet, id: Date.now() }]);
      }
      setEditingSnippet(null);
    } catch (err) {
      setError(`Failed to save snippet: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateFolder = (parentId = 'root') => {
    const folderName = prompt('Enter folder name:');
    if (folderName) {
      const newFolder = {
        id: `folder_${Date.now()}`,
        name: folderName,
        parentId: parentId,
        type: 'folder',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
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
              <ErrorMessage 
                error={error}
                onDismiss={() => setError(null)}
                variant="critical"
              />
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
            onDeleteTemplate={(id) => setTemplates(templates.filter(t => t.id !== id))}
            onDeleteWorkflow={(id) => setWorkflows(workflows.filter(w => w.id !== id))}
            onDeleteSnippet={(id) => setSnippets(snippets.filter(s => s.id !== id))}
            onCreateFolder={handleCreateFolder}
          />
        </div>
      </ErrorBoundary>
    </PreferencesProvider>
  );
};

export default PromptTemplateSystem;