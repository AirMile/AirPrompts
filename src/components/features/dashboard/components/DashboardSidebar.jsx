import React, { memo } from 'react';
import FolderTree from '../../../folders/FolderTree.jsx';

const DashboardSidebar = memo(function DashboardSidebar({
  folders,
  selectedFolderId,
  onFolderSelect,
  onCreateFolder,
  onSettingsClick
}) {
  const handleSettingsClick = onSettingsClick || (() => {
    // Placeholder voor settings - kan later worden geïmplementeerd
    alert('Settings functionaliteit komt binnenkort!');
  });

  return (
    <div className="w-72 bg-gray-800 border-r border-gray-700 flex flex-col flex-shrink-0">
      <FolderTree
        folders={folders || []}
        selectedFolderId={selectedFolderId}
        onFolderSelect={onFolderSelect}
        onCreateFolder={onCreateFolder}
        onSettingsClick={handleSettingsClick}
      />
    </div>
  );
});

export default DashboardSidebar;