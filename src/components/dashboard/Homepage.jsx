import React from 'react';
import { Plus, Play, Edit, Trash2, Search, Workflow, FileText, Star, Clock, Tag } from 'lucide-react';
import { DEFAULT_CATEGORIES } from '../../types/template.types.js';

const Homepage = ({ 
  templates, 
  workflows, 
  inserts,
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  onEditTemplate, 
  onEditWorkflow, 
  onEditInsert,
  onExecuteItem,
  onDeleteTemplate,
  onDeleteWorkflow,
  onDeleteInsert
}) => {
  const categories = ['All', ...DEFAULT_CATEGORIES];
  
  const filteredTemplates = templates.filter(template => 
    (selectedCategory === 'All' || template.category === selectedCategory) &&
    (template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
     template.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredWorkflows = workflows.filter(workflow =>
    (selectedCategory === 'All' || workflow.category === selectedCategory) &&
    (workflow.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
     workflow.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredInserts = inserts.filter(insert =>
    (selectedCategory === 'All' || insert.category === selectedCategory) &&
    (insert.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
     insert.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
     insert.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())))
  );

  const recentItems = [...templates, ...workflows]
    .sort((a, b) => new Date(b.lastUsed) - new Date(a.lastUsed))
    .slice(0, 4);

  const favoriteItems = [...templates, ...workflows].filter(item => item.favorite);

  // Create combined and deduplicated list for Quick Access section
  const quickAccessItems = new Map();

  // Add favorites first (they take priority)
  favoriteItems.forEach(item => {
    quickAccessItems.set(item.id, { ...item, isFavorite: true, itemType: templates.includes(item) ? 'template' : 'workflow' });
  });

  // Add recent items, but only if they're not already favorites
  recentItems.forEach(item => {
    if (!quickAccessItems.has(item.id)) {
      quickAccessItems.set(item.id, { ...item, isRecent: true, itemType: templates.includes(item) ? 'template' : 'workflow' });
    }
  });

  const uniqueQuickAccessItems = Array.from(quickAccessItems.values());

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-100 mb-2">Prompt Templates & Workflows</h1>
        <p className="text-gray-300">Create, manage, and execute prompt templates and multi-step workflows</p>
      </div>

      {/* Search and Filters */}
      <div className="mb-8 flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search templates and workflows..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-600 bg-gray-800 text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent placeholder-gray-400"
          />
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-4 py-3 border border-gray-600 bg-gray-800 text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent"
        >
          {categories.map(category => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>
      </div>

      {/* Quick Access */}
      {uniqueQuickAccessItems.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-100 mb-4 flex items-center gap-2">
            <Star className="w-5 h-5 text-gray-300" />
            Quick Access
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {uniqueQuickAccessItems.map(item => (
              <div key={`quick-access-${item.id}`} className="bg-gray-800 rounded-lg shadow-md border border-gray-700 p-4 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {item.itemType === 'template' ? (
                        <FileText className="w-4 h-4 text-gray-300" />
                      ) : (
                        <Workflow className="w-4 h-4 text-gray-300" />
                      )}
                      <h3 className="font-semibold text-gray-100">{item.name}</h3>
                    </div>
                    <p className="text-sm text-gray-300 mb-2">{item.description}</p>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-1 bg-gray-700 text-gray-200 text-xs rounded">{item.category}</span>
                      {item.isFavorite && <Star className="w-4 h-4 text-yellow-300 fill-current" />}
                      {item.isRecent && !item.isFavorite && <Clock className="w-4 h-4 text-blue-300" />}
                    </div>
                    <p className="text-xs text-gray-400">
                      {item.itemType === 'template' ? `${item.variables?.length || 0} variables` : `${item.steps?.length || 0} steps`}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => onExecuteItem({item, type: item.itemType})}
                  className="w-full px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center justify-center gap-2 font-semibold"
                >
                  <Play className="w-4 h-4" />
                  {item.itemType === 'template' ? 'Use Template' : 'Run Workflow'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Templates Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-100 flex items-center gap-2">
            <FileText className="w-5 h-5 text-gray-300" />
            Templates ({filteredTemplates.length})
          </h2>
          <button
            onClick={() => onEditTemplate({})}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 font-semibold"
          >
            <Plus className="w-4 h-4" />
            New Template
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.map(template => (
            <div key={template.id} className="bg-gray-800 rounded-lg shadow-md border border-gray-700 p-4 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-100 mb-1">{template.name}</h3>
                  <p className="text-sm text-gray-300 mb-2">{template.description}</p>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-1 bg-gray-700 text-gray-200 text-xs rounded">{template.category}</span>
                    {template.favorite && <Star className="w-4 h-4 text-yellow-300 fill-current" />}
                  </div>
                  <p className="text-xs text-gray-400">{template.variables.length} variables</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => onExecuteItem({item: template, type: 'template'})}
                  className="flex-1 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center justify-center gap-2 font-semibold"
                >
                  <Play className="w-4 h-4" />
                  Use
                </button>
                <button
                  onClick={() => onEditTemplate(template)}
                  className="px-3 py-2 border border-gray-600 text-gray-200 rounded hover:bg-gray-700"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDeleteTemplate(template.id)}
                  className="px-3 py-2 border border-red-700 text-red-400 rounded hover:bg-red-900"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Inserts Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-100 flex items-center gap-2">
            <Tag className="w-5 h-5 text-gray-300" />
            Inserts ({filteredInserts.length})
          </h2>
          <button
            onClick={() => onEditInsert({})}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2 font-semibold"
          >
            <Plus className="w-4 h-4" />
            New Insert
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredInserts.map(insert => (
            <div key={insert.id} className="bg-gray-800 rounded-lg shadow-md border border-gray-700 p-4 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-100 mb-1">{insert.name}</h3>
                  <p className="text-sm text-gray-300 mb-2 line-clamp-2">{insert.content}</p>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-1 bg-gray-700 text-gray-200 text-xs rounded">{insert.category}</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {insert.tags.slice(0, 3).map((tag, index) => (
                      <span key={index} className="px-2 py-1 bg-purple-900 text-purple-100 text-xs rounded">
                        {tag}
                      </span>
                    ))}
                    {insert.tags.length > 3 && (
                      <span className="px-2 py-1 bg-gray-600 text-gray-300 text-xs rounded">
                        +{insert.tags.length - 3}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => onEditInsert(insert)}
                  className="flex-1 px-3 py-2 border border-gray-600 text-gray-200 rounded hover:bg-gray-700 flex items-center justify-center gap-2"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={() => onDeleteInsert(insert.id)}
                  className="px-3 py-2 border border-red-700 text-red-400 rounded hover:bg-red-900"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Workflows Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-100 flex items-center gap-2">
            <Workflow className="w-5 h-5 text-gray-300" />
            Workflows ({filteredWorkflows.length})
          </h2>
          <button
            onClick={() => onEditWorkflow({})}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 font-semibold"
          >
            <Plus className="w-4 h-4" />
            New Workflow
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredWorkflows.map(workflow => (
            <div key={workflow.id} className="bg-gray-800 rounded-lg shadow-md border border-gray-700 p-4 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-100 mb-1">{workflow.name}</h3>
                  <p className="text-sm text-gray-300 mb-2">{workflow.description}</p>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-1 bg-gray-700 text-gray-200 text-xs rounded">{workflow.category}</span>
                    {workflow.favorite && <Star className="w-4 h-4 text-yellow-300 fill-current" />}
                  </div>
                  <p className="text-xs text-gray-400">{workflow.steps.length} steps</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => onExecuteItem({item: workflow, type: 'workflow'})}
                  className="flex-1 px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center justify-center gap-2 font-semibold"
                >
                  <Play className="w-4 h-4" />
                  Run
                </button>
                <button
                  onClick={() => onEditWorkflow(workflow)}
                  className="px-3 py-2 border border-gray-600 text-gray-200 rounded hover:bg-gray-700"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDeleteWorkflow(workflow.id)}
                  className="px-3 py-2 border border-red-700 text-red-400 rounded hover:bg-red-900"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Homepage;
