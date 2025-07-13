import React, { useState } from 'react';
import TemplateEditor from './templates/TemplateEditor.jsx';
import ItemExecutor from './common/ItemExecutor.jsx';
import Homepage from './dashboard/Homepage.jsx';
import WorkflowEditor from './workflows/WorkflowEditor.jsx';
import InsertEditor from './inserts/InsertEditor.jsx';
import defaultTemplates from '../data/defaultTemplates.json';
import defaultWorkflows from '../data/defaultWorkflows.json';
import defaultInserts from '../data/defaultInserts.json';
import defaultFolders from '../data/defaultFolders.json';

const PromptTemplateSystem = () => {
  const [templates, setTemplates] = useState(defaultTemplates);
  const [workflows, setWorkflows] = useState(defaultWorkflows);
  const [inserts, setInserts] = useState(defaultInserts);
  const [folders, setFolders] = useState(defaultFolders);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [editingWorkflow, setEditingWorkflow] = useState(null);
  const [editingInsert, setEditingInsert] = useState(null);
  const [executingItem, setExecutingItem] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFolderId, setSelectedFolderId] = useState(null);

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

  const handleSaveInsert = (insert) => {
    if (insert.id && inserts.find(s => s.id === insert.id)) {
      setInserts(inserts.map(s => s.id === insert.id ? insert : s));
    } else {
      setInserts([...inserts, { ...insert, id: Date.now() }]);
    }
    setEditingInsert(null);
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
        inserts={inserts}
        onComplete={() => {
          setExecutingItem(null);
        }}
        onCancel={() => {
          setExecutingItem(null);
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
        inserts={inserts}
        folders={folders}
        onSave={handleSaveWorkflow}
        onCancel={() => {
          setEditingWorkflow(null);
        }}
      />
    );
  }

  if (editingInsert !== null) {
    return (
      <InsertEditor
        insert={editingInsert}
        folders={folders}
        onSave={handleSaveInsert}
        onCancel={() => {
          setEditingInsert(null);
        }}
      />
    );
  }

  return (
    <Homepage 
      templates={templates}
      workflows={workflows}
      inserts={inserts}
      folders={folders}
      searchQuery={searchQuery}
      setSearchQuery={setSearchQuery}
      selectedFolderId={selectedFolderId}
      setSelectedFolderId={setSelectedFolderId}
      onEditTemplate={setEditingTemplate}
      onEditWorkflow={setEditingWorkflow}
      onEditInsert={setEditingInsert}
      onExecuteItem={setExecutingItem}
      onDeleteTemplate={(id) => setTemplates(templates.filter(t => t.id !== id))}
      onDeleteWorkflow={(id) => setWorkflows(workflows.filter(w => w.id !== id))}
      onDeleteInsert={(id) => setInserts(inserts.filter(s => s.id !== id))}
      onCreateFolder={handleCreateFolder}
    />
  );
};

export default PromptTemplateSystem;