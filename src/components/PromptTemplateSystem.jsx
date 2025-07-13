import React, { useState, useEffect } from 'react';
import { Plus, Play, Edit, Copy, Trash2, ArrowRight, ArrowLeft, Check, Search, Tag, Workflow, FileText, Star, Clock } from 'lucide-react';
import { extractVariables, createTemplate, createWorkflow, createSnippet, DEFAULT_CATEGORIES } from '../types/template.types.js';
import { copyToClipboard } from '../utils/clipboard.js';
import TemplateEditor from './templates/TemplateEditor.jsx';
import ItemExecutor from './common/ItemExecutor.jsx';
import Homepage from './dashboard/Homepage.jsx';
import WorkflowEditor from './workflows/WorkflowEditor.jsx';
import SnippetEditor from './snippets/SnippetEditor.jsx';
import defaultTemplates from '../data/defaultTemplates.json';
import defaultWorkflows from '../data/defaultWorkflows.json';
import defaultSnippets from '../data/defaultSnippets.json';

const PromptTemplateSystem = () => {
  const [currentView, setCurrentView] = useState('home');
  const [templates, setTemplates] = useState(defaultTemplates);
  const [workflows, setWorkflows] = useState(defaultWorkflows);
  const [snippets, setSnippets] = useState(defaultSnippets);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [editingWorkflow, setEditingWorkflow] = useState(null);
  const [editingSnippet, setEditingSnippet] = useState(null);
  const [executingItem, setExecutingItem] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Main render logic
  const handleSaveTemplate = (template) => {
    if (template.id && templates.find(t => t.id === template.id)) {
      setTemplates(templates.map(t => t.id === template.id ? template : t));
    } else {
      setTemplates([...templates, { ...template, id: Date.now() }]);
    }
    setEditingTemplate(null);
    setCurrentView('home');
  };

  const handleSaveWorkflow = (workflow) => {
    if (workflow.id && workflows.find(w => w.id === workflow.id)) {
      setWorkflows(workflows.map(w => w.id === workflow.id ? workflow : w));
    } else {
      setWorkflows([...workflows, { ...workflow, id: Date.now() }]);
    }
    setEditingWorkflow(null);
    setCurrentView('home');
  };

  const handleSaveSnippet = (snippet) => {
    if (snippet.id && snippets.find(s => s.id === snippet.id)) {
      setSnippets(snippets.map(s => s.id === snippet.id ? snippet : s));
    } else {
      setSnippets([...snippets, { ...snippet, id: Date.now() }]);
    }
    setEditingSnippet(null);
    setCurrentView('home');
  };

  if (executingItem) {
    return (
      <ItemExecutor
        item={executingItem.item}
        type={executingItem.type}
        snippets={snippets}
        onComplete={() => {
          setExecutingItem(null);
          setCurrentView('home');
        }}
        onCancel={() => {
          setExecutingItem(null);
          setCurrentView('home');
        }}
      />
    );
  }

  if (editingTemplate !== null) {
    return (
      <TemplateEditor
        template={editingTemplate}
        onSave={handleSaveTemplate}
        onCancel={() => {
          setEditingTemplate(null);
          setCurrentView('home');
        }}
      />
    );
  }

  if (editingWorkflow !== null) {
    return (
      <WorkflowEditor
        workflow={editingWorkflow}
        templates={templates}
        onSave={handleSaveWorkflow}
        onCancel={() => {
          setEditingWorkflow(null);
          setCurrentView('home');
        }}
      />
    );
  }

  if (editingSnippet !== null) {
    return (
      <SnippetEditor
        snippet={editingSnippet}
        onSave={handleSaveSnippet}
        onCancel={() => {
          setEditingSnippet(null);
          setCurrentView('home');
        }}
      />
    );
  }

  return (
    <Homepage 
      templates={templates}
      workflows={workflows}
      snippets={snippets}
      searchQuery={searchQuery}
      setSearchQuery={setSearchQuery}
      selectedCategory={selectedCategory}
      setSelectedCategory={setSelectedCategory}
      onEditTemplate={setEditingTemplate}
      onEditWorkflow={setEditingWorkflow}
      onEditSnippet={setEditingSnippet}
      onExecuteItem={setExecutingItem}
      onDeleteTemplate={(id) => setTemplates(templates.filter(t => t.id !== id))}
      onDeleteWorkflow={(id) => setWorkflows(workflows.filter(w => w.id !== id))}
      onDeleteSnippet={(id) => setSnippets(snippets.filter(s => s.id !== id))}
    />
  );
};

export default PromptTemplateSystem;