import React, { memo } from 'react';
import FolderBreadcrumb from '../../../folders/FolderBreadcrumb.jsx';
import AdvancedSearch from '../../../search/AdvancedSearch.jsx';

const DashboardHeader = memo(function DashboardHeader({ 
  folders,
  currentFolderId,
  onFolderSelect,
  searchQuery,
  setSearchQuery,
  allItems,
  onFilter,
  searchPlaceholder = "Search templates, workflows, snippets, and tags..."
}) {
  return (
    <div className="dashboard-header mb-6">
      {/* Breadcrumb */}
      <div className="mb-6">
        <FolderBreadcrumb
          folders={folders || []}
          currentFolderId={currentFolderId}
          onFolderSelect={onFolderSelect}
        />
      </div>

      {/* Search */}
      <div className="mb-6">
        <AdvancedSearch
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          allItems={allItems}
          onFilter={onFilter}
          placeholder={searchPlaceholder}
        />
      </div>
    </div>
  );
});

export default DashboardHeader;