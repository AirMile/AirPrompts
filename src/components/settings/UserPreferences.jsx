import React, { useState } from 'react';
import { X, Settings, Download, Upload, RotateCcw, Save, AlertCircle } from 'lucide-react';
import { useUserPreferences } from '../../hooks/useUserPreferences.js';

/**
 * Main User Preferences Settings Panel
 * Provides a comprehensive interface for managing all user preferences
 */
const UserPreferences = ({ isOpen, onClose }) => {
  const {
    loading,
    error,
    layout,
    sections,
    dashboard,
    filtering,
    pagination,
    accessibility,
    search,
    updateLayout,
    updateSections,
    updateDashboard,
    updateFiltering,
    updatePagination,
    updateAccessibility,
    updateSearch,
    resetToDefaults,
    exportSettings,
    importSettings,
    validatePreferences
  } = useUserPreferences();

  const [activeTab, setActiveTab] = useState('layout');
  const [importText, setImportText] = useState('');
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [exportedSettings, setExportedSettings] = useState('');

  // Handle settings export
  const handleExport = () => {
    const exported = exportSettings();
    if (exported) {
      setExportedSettings(exported);
      setShowExportDialog(true);
    }
  };

  // Handle settings import
  const handleImport = () => {
    if (importText.trim()) {
      const success = importSettings(importText);
      if (success) {
        setImportText('');
        setShowImportDialog(false);
      }
    }
  };

  // Handle reset to defaults
  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset all preferences to defaults? This cannot be undone.')) {
      resetToDefaults();
    }
  };

  // Copy exported settings to clipboard
  const copyToClipboard = () => {
    navigator.clipboard.writeText(exportedSettings);
  };

  if (!isOpen) return null;

  const validationIssues = validatePreferences();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <Settings className="w-6 h-6 text-blue-400" />
            <h2 className="text-2xl font-bold text-gray-100">User Preferences</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-200 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-900/20 border border-red-600/30 rounded-lg p-4 m-6 mb-0">
            <div className="flex items-center gap-2 text-red-300">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Validation Issues */}
        {validationIssues.length > 0 && (
          <div className="bg-yellow-900/20 border border-yellow-600/30 rounded-lg p-4 m-6 mb-0">
            <div className="flex items-center gap-2 text-yellow-300 mb-2">
              <AlertCircle className="w-5 h-5" />
              <span>Preference Issues:</span>
            </div>
            <ul className="text-yellow-200 text-sm ml-7">
              {validationIssues.map((issue, index) => (
                <li key={index}>• {issue}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex h-[calc(90vh-120px)]">
          {/* Sidebar */}
          <div className="w-64 bg-gray-900 border-r border-gray-700 p-4">
            <nav className="space-y-2">
              {[
                { id: 'layout', label: 'Layout & Display' },
                { id: 'sections', label: 'Sections' },
                { id: 'dashboard', label: 'Dashboard' },
                { id: 'filtering', label: 'Filtering' },
                { id: 'search', label: 'Search & History' },
                { id: 'pagination', label: 'Pagination' },
                { id: 'accessibility', label: 'Accessibility' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-gray-800'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>

            {/* Action Buttons */}
            <div className="mt-8 space-y-2">
              <button
                onClick={handleExport}
                className="w-full flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
              <button
                onClick={() => setShowImportDialog(true)}
                className="w-full flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Upload className="w-4 h-4" />
                Import
              </button>
              <button
                onClick={handleReset}
                className="w-full flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                Reset
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            {loading && (
              <div className="text-center py-8">
                <div className="text-gray-400">Loading preferences...</div>
              </div>
            )}

            {!loading && (
              <>
                {/* Layout Tab */}
                {activeTab === 'layout' && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-100">Layout & Display</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* View Mode */}
                      <div>
                        <label className="block text-sm font-medium text-gray-200 mb-2">
                          View Mode
                        </label>
                        <select
                          value={layout.viewMode}
                          onChange={(e) => updateLayout({ viewMode: e.target.value })}
                          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                        >
                          <option value="grid">Grid View</option>
                          <option value="list">List View</option>
                        </select>
                      </div>

                      {/* Card Size */}
                      <div>
                        <label className="block text-sm font-medium text-gray-200 mb-2">
                          Card Size
                        </label>
                        <select
                          value={layout.cardSize}
                          onChange={(e) => updateLayout({ cardSize: e.target.value })}
                          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                        >
                          <option value="small">Small</option>
                          <option value="medium">Medium</option>
                          <option value="large">Large</option>
                        </select>
                      </div>

                      {/* Columns Per Row */}
                      <div>
                        <label className="block text-sm font-medium text-gray-200 mb-2">
                          Columns Per Row: {layout.columnsPerRow}
                        </label>
                        <input
                          type="range"
                          min="2"
                          max="8"
                          value={layout.columnsPerRow}
                          onChange={(e) => updateLayout({ columnsPerRow: parseInt(e.target.value) })}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-gray-400 mt-1">
                          <span>2</span>
                          <span>8</span>
                        </div>
                      </div>

                      {/* Density */}
                      <div>
                        <label className="block text-sm font-medium text-gray-200 mb-2">
                          Density
                        </label>
                        <select
                          value={layout.density}
                          onChange={(e) => updateLayout({ density: e.target.value })}
                          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                        >
                          <option value="compact">Compact</option>
                          <option value="comfortable">Comfortable</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* Sections Tab */}
                {activeTab === 'sections' && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-100">Section Visibility</h3>
                    
                    <div className="space-y-4">
                      {Object.entries(sections).map(([key, section]) => (
                        <div key={key} className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                          <div>
                            <h4 className="font-medium text-gray-100 capitalize">{key}</h4>
                            <p className="text-sm text-gray-400">
                              {section.visible ? 'Visible' : 'Hidden'} • {section.collapsed ? 'Collapsed' : 'Expanded'}
                            </p>
                          </div>
                          <div className="flex items-center gap-4">
                            <label className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={section.visible}
                                onChange={(e) => updateSections({
                                  ...sections,
                                  [key]: { ...section, visible: e.target.checked }
                                })}
                                className="rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-400"
                              />
                              <span className="text-sm text-gray-300">Visible</span>
                            </label>
                            <label className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={section.collapsed}
                                onChange={(e) => updateSections({
                                  ...sections,
                                  [key]: { ...section, collapsed: e.target.checked }
                                })}
                                className="rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-400"
                              />
                              <span className="text-sm text-gray-300">Collapsed</span>
                            </label>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Dashboard Tab */}
                {activeTab === 'dashboard' && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-100">Dashboard Widgets</h3>
                    
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={dashboard.showFavorites}
                              onChange={(e) => updateDashboard({ showFavorites: e.target.checked })}
                              className="rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-400"
                            />
                            <span className="text-gray-300">Show Favorites Widget</span>
                          </label>
                          
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={dashboard.showRecent}
                              onChange={(e) => updateDashboard({ showRecent: e.target.checked })}
                              className="rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-400"
                            />
                            <span className="text-gray-300">Show Recent Items Widget</span>
                          </label>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-200 mb-2">
                              Recent Items Count: {dashboard.recentCount}
                            </label>
                            <input
                              type="range"
                              min="5"
                              max="20"
                              value={dashboard.recentCount}
                              onChange={(e) => updateDashboard({ recentCount: parseInt(e.target.value) })}
                              className="w-full"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-200 mb-2">
                              Favorites Count: {dashboard.favoriteCount}
                            </label>
                            <input
                              type="range"
                              min="3"
                              max="15"
                              value={dashboard.favoriteCount}
                              onChange={(e) => updateDashboard({ favoriteCount: parseInt(e.target.value) })}
                              className="w-full"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Filtering Tab */}
                {activeTab === 'filtering' && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-100">Filtering & Pagination</h3>
                    
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-200 mb-2">
                            Default Page Size
                          </label>
                          <select
                            value={filtering.defaultPageSize}
                            onChange={(e) => updateFiltering({ defaultPageSize: parseInt(e.target.value) })}
                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                          >
                            <option value="12">12 items</option>
                            <option value="24">24 items</option>
                            <option value="48">48 items</option>
                            <option value="96">96 items</option>
                          </select>
                        </div>

                        <div className="space-y-4">
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={filtering.useInfiniteScroll}
                              onChange={(e) => updateFiltering({ useInfiniteScroll: e.target.checked })}
                              className="rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-400"
                            />
                            <span className="text-gray-300">Use Infinite Scroll</span>
                          </label>
                          
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={filtering.rememberFilters}
                              onChange={(e) => updateFiltering({ rememberFilters: e.target.checked })}
                              className="rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-400"
                            />
                            <span className="text-gray-300">Remember Filter Settings</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Search Tab */}
                {activeTab === 'search' && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-100">Search & History</h3>
                    
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-200 mb-2">
                            Search History Size: {search.maxHistory}
                          </label>
                          <input
                            type="range"
                            min="5"
                            max="50"
                            value={search.maxHistory}
                            onChange={(e) => updateSearch({ maxHistory: parseInt(e.target.value) })}
                            className="w-full"
                          />
                          <div className="flex justify-between text-sm text-gray-400 mt-1">
                            <span>5</span>
                            <span>50</span>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-200 mb-2">
                            Current Search History ({search.history.length} items)
                          </label>
                          <div className="bg-gray-700 rounded-lg p-3 max-h-32 overflow-y-auto">
                            {search.history.length > 0 ? (
                              <div className="space-y-1">
                                {search.history.map((term, index) => (
                                  <div key={index} className="text-sm text-gray-300 px-2 py-1 bg-gray-600 rounded">
                                    {term}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-gray-400 text-center py-2">No search history yet</p>
                            )}
                          </div>
                          <button
                            onClick={() => updateSearch({ history: [] })}
                            className="mt-2 px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                          >
                            Clear History
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Pagination Tab */}
                {activeTab === 'pagination' && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-100">Pagination Settings</h3>
                    
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-200 mb-2">
                            Default Page Size
                          </label>
                          <select
                            value={pagination.defaultPageSize}
                            onChange={(e) => updatePagination({ defaultPageSize: parseInt(e.target.value) })}
                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                          >
                            {pagination.pageSizeOptions.map(size => (
                              <option key={size} value={size}>{size} items</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-200 mb-2">
                            Available Page Size Options
                          </label>
                          <div className="bg-gray-700 rounded-lg p-3">
                            <div className="flex flex-wrap gap-2">
                              {pagination.pageSizeOptions.map(size => (
                                <span key={size} className="px-2 py-1 bg-gray-600 text-gray-300 rounded text-sm">
                                  {size}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-gray-700 pt-4">
                        <h4 className="text-md font-medium text-gray-200 mb-3">Section-Specific Settings</h4>
                        <div className="space-y-3">
                          {Object.entries(pagination).filter(([key]) => 
                            ['templates', 'workflows', 'snippets'].includes(key)
                          ).map(([sectionType, settings]) => (
                            <div key={sectionType} className="flex items-center justify-between">
                              <span className="text-gray-300 capitalize">{sectionType}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-400">Page Size:</span>
                                <select
                                  value={settings.pageSize}
                                  onChange={(e) => updatePagination({
                                    [sectionType]: { ...settings, pageSize: parseInt(e.target.value) }
                                  })}
                                  className="px-2 py-1 bg-gray-700 border border-gray-600 rounded text-gray-100 text-sm"
                                >
                                  {pagination.pageSizeOptions.map(size => (
                                    <option key={size} value={size}>{size}</option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Accessibility Tab */}
                {activeTab === 'accessibility' && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-100">Accessibility</h3>
                    
                    <div className="space-y-4">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={accessibility.highContrast}
                          onChange={(e) => updateAccessibility({ highContrast: e.target.checked })}
                          className="rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-400"
                        />
                        <span className="text-gray-300">High Contrast Mode</span>
                      </label>
                      
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={accessibility.reducedMotion}
                          onChange={(e) => updateAccessibility({ reducedMotion: e.target.checked })}
                          className="rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-400"
                        />
                        <span className="text-gray-300">Reduced Motion</span>
                      </label>
                      
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={accessibility.keyboardNavigation}
                          onChange={(e) => updateAccessibility({ keyboardNavigation: e.target.checked })}
                          className="rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-400"
                        />
                        <span className="text-gray-300">Keyboard Navigation</span>
                      </label>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Import Dialog */}
        {showImportDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
            <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold text-gray-100 mb-4">Import Settings</h3>
              <textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder="Paste your exported settings here..."
                className="w-full h-32 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 focus:ring-2 focus:ring-blue-400 focus:border-transparent"
              />
              <div className="flex justify-end gap-2 mt-4">
                <button
                  onClick={() => setShowImportDialog(false)}
                  className="px-4 py-2 text-gray-300 hover:text-gray-100"
                >
                  Cancel
                </button>
                <button
                  onClick={handleImport}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Import
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Export Dialog */}
        {showExportDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
            <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold text-gray-100 mb-4">Export Settings</h3>
              <textarea
                value={exportedSettings}
                readOnly
                className="w-full h-32 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 focus:ring-2 focus:ring-blue-400 focus:border-transparent"
              />
              <div className="flex justify-end gap-2 mt-4">
                <button
                  onClick={() => setShowExportDialog(false)}
                  className="px-4 py-2 text-gray-300 hover:text-gray-100"
                >
                  Close
                </button>
                <button
                  onClick={copyToClipboard}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Copy to Clipboard
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserPreferences;