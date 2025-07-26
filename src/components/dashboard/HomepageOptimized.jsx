import React, { useEffect, useLayoutEffect, useRef, useMemo, useCallback, memo, useState } from 'react';
import { DndContext, DragOverlay, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, rectSortingStrategy } from '@dnd-kit/sortable';

// Optimized icon imports
import { Plus, Play, Edit, Trash2, Search, Workflow, FileText, Star, Tag, Puzzle, GripVertical } from '../../utils/icons';

// Components - these should be lazy loaded where appropriate
import CollapsibleFolderTree from '../folders/CollapsibleFolderTree.jsx';
import FolderBreadcrumb from '../folders/FolderBreadcrumb.jsx';
import FolderDescription from '../folders/FolderDescription.jsx';
import ListView from '../common/ListView.jsx';
import FocusableCard from '../common/FocusableCard.jsx';
import SortableCard from '../common/SortableCard.jsx';
import SortableListItem from '../common/SortableListItem.jsx';
import DragCard from '../common/DragCard.jsx';
import CollapsibleSection from '../common/CollapsibleSection.jsx';
import AdvancedSearch from '../search/AdvancedSearch.jsx';
import Pagination from '../common/Pagination.jsx';
import FavoritesWidget from '../widgets/FavoritesWidget.jsx';
import SettingsModal from '../settings/SettingsModal.jsx';
import MobileNavigation from '../navigation/MobileNavigation.jsx';
import CollapsibleTodoSidebar from '../todos/CollapsibleTodoSidebar.jsx';

// Hooks
import useKeyboardNavigation from '../../hooks/ui/useKeyboardNavigation.js';
import usePagination from '../../hooks/ui/usePagination.js';
import useFilters from '../../hooks/ui/useFilters.js';
import useDragAndDrop from '../../hooks/ui/useDragAndDrop.js';
import useProgressiveLoading from '../../hooks/ui/useProgressiveLoading.js';
import { useWidgets } from '../../hooks/domain/useWidgets.js';
import useSectionVisibility from '../../hooks/ui/useSectionVisibility.js';
import useFolderSectionVisibility from '../../hooks/ui/useFolderSectionVisibility.js';
import { performAdvancedSearch } from '../../utils/searchUtils.js';
import { useUserPreferences } from '../../hooks/domain/useUserPreferences.js';
import { useItemColors } from '../../hooks/useItemColors.js';
import { useFoldersQuery } from '../../hooks/queries/useFoldersQuery.js';
import { getRootFolder } from '../../utils/localStorageManager.js';
import { 
  getFolderFavorites, 
  getFolderItems,
  toggleFolderFavorite,
  isItemFavoriteInFolder
} from '../../types/template.types.js';

// Virtualized components
import { ViewModeManager } from '../../strategies/ViewModeStrategies';

/**
 * Memoized header component
 */
const DashboardHeader = memo(({ 
  searchQuery, 
  setSearchQuery, 
  viewMode, 
  setViewMode,
  isSearchActive,
  toggleSettings
}) => {
  const handleSearchChange = useCallback((e) => {
    setSearchQuery(e.target.value);
  }, [setSearchQuery]);

  return (
    <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 max-w-2xl">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Search templates, workflows, and snippets..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <ViewModeToggle viewMode={viewMode} onChange={setViewMode} />
            <button
              onClick={toggleSettings}
              className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              aria-label="Settings"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

DashboardHeader.displayName = 'DashboardHeader';

/**
 * Memoized view mode toggle
 */
const ViewModeToggle = memo(({ viewMode, onChange }) => {
  const modes = [
    { value: 'grid', icon: LayoutGrid, label: 'Grid view' },
    { value: 'list', icon: List, label: 'List view' },
    { value: 'compact', icon: Menu, label: 'Compact view' }
  ];

  return (
    <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
      {modes.map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          onClick={() => onChange(value)}
          className={`p-2 rounded ${
            viewMode === value 
              ? 'bg-white dark:bg-gray-700 shadow-sm' 
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          } transition-all`}
          aria-label={label}
          title={label}
        >
          <Icon className="w-4 h-4" />
        </button>
      ))}
    </div>
  );
});

ViewModeToggle.displayName = 'ViewModeToggle';

/**
 * Memoized section component
 */
const DashboardSection = memo(({ 
  title, 
  icon: Icon,
  items, 
  type,
  viewMode,
  onEdit,
  onDelete,
  onExecute,
  onToggleFavorite,
  onReorder,
  isVisible,
  onToggleVisibility,
  getColorClasses
}) => {
  // Memoize item actions
  const itemActions = useCallback((item) => ({
    onEdit: () => onEdit(item),
    onDelete: () => onDelete(item.id),
    onExecute: () => onExecute(item),
    onToggleFavorite: () => onToggleFavorite(item)
  }), [onEdit, onDelete, onExecute, onToggleFavorite]);

  if (!isVisible && items.length === 0) return null;

  return (
    <CollapsibleSection
      title={
        <div className="flex items-center gap-2">
          <Icon className="w-5 h-5" />
          <span>{title}</span>
          <span className="text-sm text-gray-500">({items.length})</span>
        </div>
      }
      isCollapsed={!isVisible}
      onToggleCollapse={onToggleVisibility}
      className="mb-6"
    >
      <div data-section-type={type}>
        {items.length > 0 ? (
          <ViewModeManager
            items={items}
            viewMode={viewMode}
            onEdit={onEdit}
            onDelete={onDelete}
            onExecute={onExecute}
            onToggleFavorite={onToggleFavorite}
            getColorClasses={getColorClasses}
          />
        ) : (
          <EmptyState type={type} />
        )}
      </div>
    </CollapsibleSection>
  );
});

DashboardSection.displayName = 'DashboardSection';

/**
 * Empty state component
 */
const EmptyState = memo(({ type }) => {
  const messages = {
    templates: 'No templates found. Create your first template to get started.',
    workflows: 'No workflows found. Create a workflow to chain templates together.',
    snippets: 'No snippets found. Add quick snippets for easy access.'
  };

  return (
    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
      <p>{messages[type] || 'No items found.'}</p>
    </div>
  );
});

EmptyState.displayName = 'EmptyState';

/**
 * Optimized Homepage component
 */
const HomepageOptimized = ({ 
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
  onUpdateTemplate,
  onUpdateWorkflow, 
  onUpdateSnippet,
  onReorderTemplates,
  onReorderWorkflows,
  onReorderSnippets,
  onCreateFolder,
  onUpdateFolder,
  onDeleteFolder,
  onReorderFolders,
  onToggleFolderFavorite
}) => {
  // Use preferences and hooks
  const { layout, updateLayout } = useUserPreferences();
  const { getColorClasses } = useItemColors();
  const viewMode = layout.viewMode;
  const setViewMode = useCallback((mode) => {
    updateLayout({ viewMode: mode });
  }, [updateLayout]);

  // Section visibility
  const {
    isTemplatesVisible,
    isWorkflowsVisible,
    isSnippetsVisible,
    toggleTemplatesVisibility,
    toggleWorkflowsVisibility,
    toggleSnippetsVisibility
  } = useSectionVisibility();

  // Settings modal
  const [showSettings, setShowSettings] = useState(false);
  const toggleSettings = useCallback(() => setShowSettings(prev => !prev), []);

  // Search and filtering
  const isSearchActive = searchQuery.length > 0;
  const filteredItems = useMemo(() => {
    if (!isSearchActive) {
      return {
        templates: templates || [],
        workflows: workflows || [],
        snippets: snippets || []
      };
    }

    return performAdvancedSearch(
      { templates, workflows, snippets },
      searchQuery
    );
  }, [templates, workflows, snippets, searchQuery, isSearchActive]);

  // Filter by folder if selected
  const folderFilteredItems = useMemo(() => {
    if (!selectedFolderId || selectedFolderId === 'root') {
      return filteredItems;
    }

    return {
      templates: filteredItems.templates.filter(t => 
        t.folderIds?.includes(selectedFolderId) || t.folderId === selectedFolderId
      ),
      workflows: filteredItems.workflows.filter(w => 
        w.folderIds?.includes(selectedFolderId) || w.folderId === selectedFolderId
      ),
      snippets: filteredItems.snippets.filter(s => 
        s.folderIds?.includes(selectedFolderId) || s.folderId === selectedFolderId
      )
    };
  }, [filteredItems, selectedFolderId]);

  // Memoized callbacks
  const handleToggleFavorite = useCallback((item, type) => {
    const updateFn = type === 'template' ? onUpdateTemplate 
                   : type === 'workflow' ? onUpdateWorkflow 
                   : onUpdateSnippet;
    
    updateFn({ ...item, favorite: !item.favorite });
  }, [onUpdateTemplate, onUpdateWorkflow, onUpdateSnippet]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <DashboardHeader
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        viewMode={viewMode}
        setViewMode={setViewMode}
        isSearchActive={isSearchActive}
        toggleSettings={toggleSettings}
      />

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 h-[calc(100vh-64px)] overflow-y-auto">
          <CollapsibleFolderTree
            folders={folders}
            selectedFolderId={selectedFolderId}
            onSelectFolder={setSelectedFolderId}
            onCreateFolder={onCreateFolder}
            onUpdateFolder={onUpdateFolder}
            onDeleteFolder={onDeleteFolder}
            onReorderFolders={onReorderFolders}
            templates={templates}
            workflows={workflows}
            snippets={snippets}
          />
        </aside>

        {/* Main content */}
        <main className="flex-1 p-6 overflow-y-auto h-[calc(100vh-64px)]">
          {selectedFolderId && selectedFolderId !== 'root' && (
            <FolderBreadcrumb
              folders={folders}
              selectedFolderId={selectedFolderId}
              onSelectFolder={setSelectedFolderId}
            />
          )}

          <div className="space-y-6">
            <DashboardSection
              title="Templates"
              icon={FileText}
              items={folderFilteredItems.templates}
              type="templates"
              viewMode={viewMode}
              onEdit={onEditTemplate}
              onDelete={onDeleteTemplate}
              onExecute={onExecuteItem}
              onToggleFavorite={(item) => handleToggleFavorite(item, 'template')}
              onReorder={onReorderTemplates}
              isVisible={isTemplatesVisible}
              onToggleVisibility={toggleTemplatesVisibility}
              getColorClasses={getColorClasses}
            />

            <DashboardSection
              title="Workflows"
              icon={Workflow}
              items={folderFilteredItems.workflows}
              type="workflows"
              viewMode={viewMode}
              onEdit={onEditWorkflow}
              onDelete={onDeleteWorkflow}
              onExecute={onExecuteItem}
              onToggleFavorite={(item) => handleToggleFavorite(item, 'workflow')}
              onReorder={onReorderWorkflows}
              isVisible={isWorkflowsVisible}
              onToggleVisibility={toggleWorkflowsVisibility}
              getColorClasses={getColorClasses}
            />

            <DashboardSection
              title="Snippets"
              icon={Puzzle}
              items={folderFilteredItems.snippets}
              type="snippets"
              viewMode={viewMode}
              onEdit={onEditSnippet}
              onDelete={onDeleteSnippet}
              onExecute={onExecuteItem}
              onToggleFavorite={(item) => handleToggleFavorite(item, 'snippet')}
              onReorder={onReorderSnippets}
              isVisible={isSnippetsVisible}
              onToggleVisibility={toggleSnippetsVisibility}
              getColorClasses={getColorClasses}
            />
          </div>
        </main>

        {/* Right sidebar */}
        <aside className="w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 h-[calc(100vh-64px)] overflow-y-auto">
          <FavoritesWidget
            templates={templates}
            workflows={workflows}
            snippets={snippets}
            onExecute={onExecuteItem}
            onEdit={(item, type) => {
              if (type === 'template') onEditTemplate(item);
              else if (type === 'workflow') onEditWorkflow(item);
              else onEditSnippet(item);
            }}
          />
        </aside>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <SettingsModal onClose={() => setShowSettings(false)} />
      )}

      {/* Mobile Navigation */}
      <MobileNavigation />

      {/* Todo Sidebar */}
      <CollapsibleTodoSidebar />
    </div>
  );
};

export default memo(HomepageOptimized);