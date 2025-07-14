import React from 'react';
import { Plus, Play, Edit, Trash2, Search, Workflow, FileText, Star, Tag, Puzzle } from 'lucide-react';
import FolderTree from '../folders/FolderTree.jsx';
import FolderBreadcrumb from '../folders/FolderBreadcrumb.jsx';

const Homepage = ({ 
  templates, 
  workflows, 
  snippets,
  folders,
  searchQuery,
  setSearchQuery,
  selectedFolderId,
  setSelectedFolderId,
  onEditTemplate, 
  onEditWorkflow, 
  onEditSnippet,
  onExecuteItem,
  onDeleteTemplate,
  onDeleteWorkflow,
  onDeleteSnippet,
  onCreateFolder
}) => {
  // Get all descendant folder IDs for the selected folder
  const getFolderDescendants = (folderId) => {
    const descendants = new Set();
    descendants.add(folderId);
    
    const addChildren = (parentId) => {
      const children = (folders || []).filter(f => f.parentId === parentId);
      children.forEach(child => {
        descendants.add(child.id);
        addChildren(child.id);
      });
    };
    
    addChildren(folderId);
    return descendants;
  };

  // Special handling for Home folder to show root content
  const getFilteredItems = (items, getSearchFields) => {
    return (items || []).filter(item => {
      // Folder filtering logic
      let folderMatch = false;
      if (!selectedFolderId || selectedFolderId === 'root') {
        folderMatch = true; // Show all for root
      } else if (selectedFolderId === 'home') {
        // For Home folder, show items from root and immediate children, but exclude deep project nesting
        folderMatch = !item.folderId || item.folderId === 'root' || 
          (item.folderId !== 'projects' && item.folderId !== 'ai-character-story' && 
           item.folderId !== 'prompt-website' && item.folderId !== 'rogue-lite-game' &&
           item.folderId !== 'content');
      } else {
        const currentFolderIds = getFolderDescendants(selectedFolderId);
        folderMatch = currentFolderIds.has(item.folderId);
      }
      
      // Search filtering
      if (searchQuery === '') {
        return folderMatch;
      }
      
      const searchFields = getSearchFields(item);
      const searchMatch = searchFields.some(field => 
        field && field.toLowerCase().includes(searchQuery.toLowerCase())
      );
      
      return folderMatch && searchMatch;
    });
  };

  const filteredTemplates = getFilteredItems(templates, (item) => [item.name, item.description]);

  const filteredWorkflows = getFilteredItems(workflows, (item) => [item.name, item.description]);

  const filteredSnippets = getFilteredItems(snippets, (item) => [item.name, item.description, item.content, ...(item.tags || [])]);

  // Create sections with their data and default order
  const sections = [
    { type: 'workflows', data: filteredWorkflows, defaultOrder: 1 },
    { type: 'templates', data: filteredTemplates, defaultOrder: 2 },
    { type: 'snippets', data: filteredSnippets, defaultOrder: 3 }
  ];

  // Sort sections - if in Home folder, use fixed order, otherwise sort by count
  const sortedSections = selectedFolderId === 'home' 
    ? sections.sort((a, b) => a.defaultOrder - b.defaultOrder) // Fixed order for Home
    : sections.sort((a, b) => {
        if (b.data.length !== a.data.length) {
          return b.data.length - a.data.length; // Highest count first
        }
        return a.defaultOrder - b.defaultOrder; // Default order as tiebreaker
      });

  const renderSection = (section, isLast = false) => {
    const { type, data } = section;
    
    switch (type) {
      case 'workflows':
        return (
          <div className={isLast ? '' : 'mb-8'} key="workflows">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-100 flex items-center gap-2">
                <Workflow className="w-5 h-5 text-gray-300" />
                Workflows ({data.length})
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
              {data.map(workflow => (
                <div key={workflow.id} className="bg-gray-800 rounded-lg shadow-md border border-gray-700 p-4 hover:shadow-lg transition-shadow">
                  <div className="mb-3">
                    <div className="flex items-start justify-between">
                      <h3 className="font-semibold text-gray-100 mb-1">{workflow.name}</h3>
                      <div className="flex items-center gap-1">
                        {workflow.favorite && <Star className="w-4 h-4 text-yellow-300 fill-current" />}
                      </div>
                    </div>
                    <p className="text-sm text-gray-300 mb-2">{workflow.description}</p>
                    <div className="text-xs text-gray-400">
                      {workflow.steps?.length || 0} steps
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => onExecuteItem({item: workflow, type: 'workflow'})}
                      className="flex-1 px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center justify-center gap-2 text-sm font-medium"
                    >
                      <Play className="w-4 h-4" />
                      Execute
                    </button>
                    <button
                      onClick={() => onEditWorkflow(workflow)}
                      className="px-3 py-2 text-gray-300 border border-gray-600 rounded-md hover:bg-gray-700 flex items-center justify-center"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDeleteWorkflow(workflow.id)}
                      className="px-3 py-2 text-red-400 border border-red-600 rounded-md hover:bg-red-900 flex items-center justify-center"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'templates':
        return (
          <div className={isLast ? '' : 'mb-8'} key="templates">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-100 flex items-center gap-2">
                <FileText className="w-5 h-5 text-gray-300" />
                Templates ({data.length})
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
              {data.map(template => (
                <div key={template.id} className="bg-gray-800 rounded-lg shadow-md border border-gray-700 p-4 hover:shadow-lg transition-shadow">
                  <div className="mb-3">
                    <div className="flex items-start justify-between">
                      <h3 className="font-semibold text-gray-100 mb-1">{template.name}</h3>
                      <div className="flex items-center gap-1">
                        {template.favorite && <Star className="w-4 h-4 text-yellow-300 fill-current" />}
                      </div>
                    </div>
                    <p className="text-sm text-gray-300 mb-2">{template.description}</p>
                    <div className="text-xs text-gray-400">
                      {template.variables?.length || 0} variables
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => onExecuteItem({item: template, type: 'template'})}
                      className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center justify-center gap-2 text-sm font-medium"
                    >
                      <Play className="w-4 h-4" />
                      Execute
                    </button>
                    <button
                      onClick={() => onEditTemplate(template)}
                      className="px-3 py-2 text-gray-300 border border-gray-600 rounded-md hover:bg-gray-700 flex items-center justify-center"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDeleteTemplate(template.id)}
                      className="px-3 py-2 text-red-400 border border-red-600 rounded-md hover:bg-red-900 flex items-center justify-center"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'snippets':
        return (
          <div className={isLast ? '' : 'mb-8'} key="snippets">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-100 flex items-center gap-2">
                <Tag className="w-5 h-5 text-gray-300" />
                Snippets ({data.length})
              </h2>
              <button
                onClick={() => onEditSnippet({})}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2 font-semibold"
              >
                <Plus className="w-4 h-4" />
                New Snippet
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.map(snippet => (
                <div key={snippet.id} className="bg-gray-800 rounded-lg shadow-md border border-gray-700 p-4 hover:shadow-lg transition-shadow">
                  <div className="mb-3">
                    <div className="flex items-start justify-between">
                      <h3 className="font-semibold text-gray-100 mb-1">{snippet.name}</h3>
                      <div className="flex items-center gap-1">
                        {snippet.favorite && <Star className="w-4 h-4 text-yellow-300 fill-current" />}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1 mb-2">
                      {(snippet.tags || []).slice(0, 3).map((tag, index) => (
                        <span key={index} className="px-2 py-1 bg-gray-800 text-gray-300 border border-amber-600 rounded text-xs">
                          {tag}
                        </span>
                      ))}
                      {(snippet.tags || []).length > 3 && (
                        <span className="px-2 py-1 bg-gray-700 text-gray-300 rounded text-xs">
                          +{(snippet.tags || []).length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => onExecuteItem({item: snippet, type: 'snippet'})}
                      className="flex-1 px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 flex items-center justify-center gap-2 text-sm font-medium"
                    >
                      <Play className="w-4 h-4" />
                      Execute
                    </button>
                    <button
                      onClick={() => onEditSnippet(snippet)}
                      className="px-3 py-2 text-gray-300 border border-gray-600 rounded-md hover:bg-gray-700 flex items-center justify-center"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDeleteSnippet(snippet.id)}
                      className="px-3 py-2 text-red-400 border border-red-600 rounded-md hover:bg-red-900 flex items-center justify-center"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );


      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen bg-gray-900">
      {/* Sidebar */}
      <div className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col">
        <FolderTree
          folders={folders || []}
          selectedFolderId={selectedFolderId}
          onFolderSelect={setSelectedFolderId}
          onCreateFolder={onCreateFolder}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto p-6">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-100 mb-2">Prompt Templates & Workflows</h1>
            <p className="text-gray-300">Create, manage, and execute prompt templates and multi-step workflows</p>
            
            {/* Breadcrumb */}
            <div className="mt-4">
              <FolderBreadcrumb
                folders={folders || []}
                currentFolderId={selectedFolderId}
                onFolderSelect={setSelectedFolderId}
              />
            </div>
          </div>

          {/* Search */}
          <div className="mb-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                id="searchQuery"
                name="searchQuery"
                placeholder="Search templates, workflows, and snippets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-600 bg-gray-800 text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent placeholder-gray-400"
              />
            </div>
          </div>

          {/* Dynamic Sections */}
          {sortedSections.map((section, index) => 
            renderSection(section, index === sortedSections.length - 1)
          )}
        </div>
      </div>
    </div>
  );
};

export default Homepage;