import React, { useState } from 'react';
import TemplateEditor from './templates/TemplateEditor.jsx';
import ItemExecutor from './common/ItemExecutor.jsx';
import Homepage from './dashboard/Homepage.jsx';
import WorkflowEditor from './workflows/WorkflowEditor.jsx';
import SnippetEditor from './snippets/SnippetEditor.jsx';
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

  // Main render logic
  const handleSaveTemplate = (template) => {
    if (template.id && templates.find(t => t.id === template.id)) {
      setTemplates(templates.map(t => t.id === template.id ? template : t));
    } else {
      setTemplates([...templates, { ...template, id: Date.now() }]);
    }
    setEditingTemplate(null);
  };

  const handleSaveWorkflow = (workflow) => {
    if (workflow.id && workflows.find(w => w.id === workflow.id)) {
      setWorkflows(workflows.map(w => w.id === workflow.id ? workflow : w));
    } else {
      setWorkflows([...workflows, { ...workflow, id: Date.now() }]);
    }
    setEditingWorkflow(null);
  };

  const handleSaveSnippet = (snippet) => {
    if (snippet.id && snippets.find(s => s.id === snippet.id)) {
      setSnippets(snippets.map(s => s.id === snippet.id ? snippet : s));
    } else {
      setSnippets([...snippets, { ...snippet, id: Date.now() }]);
    }
    setEditingSnippet(null);
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
    );
  }

  if (editingTemplate !== null) {
    return (
      <TemplateEditor
        template={editingTemplate}
        folders={folders}
        onSave={handleSaveTemplate}
        onCancel={() => {
          setEditingTemplate(null);
        }}
      />
    );
  }

  if (editingWorkflow !== null) {
    return (
      <WorkflowEditor
        workflow={editingWorkflow}
        templates={templates}
        snippets={snippets}
        folders={folders}
        onSave={handleSaveWorkflow}
        onCancel={() => {
          setEditingWorkflow(null);
        }}
      />
    );
  }

  if (editingSnippet !== null) {
    return (
      <SnippetEditor
        snippet={editingSnippet}
        folders={folders}
        onSave={handleSaveSnippet}
        onCancel={() => {
          setEditingSnippet(null);
        }}
      />
    );
  }

  return (
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
      onExecuteItem={setExecutingItem}
      onDeleteTemplate={(id) => setTemplates(templates.filter(t => t.id !== id))}
      onDeleteWorkflow={(id) => setWorkflows(workflows.filter(w => w.id !== id))}
      onDeleteSnippet={(id) => setSnippets(snippets.filter(s => s.id !== id))}
      onCreateFolder={handleCreateFolder}
    />
  );
};

export default PromptTemplateSystem;