import React from 'react';
import * as Icons from 'lucide-react';

/**
 * Editor Header Component - Consistent header for all editors
 */
const EditorHeader = ({ title, entityType, colorClasses }) => {
  // Get icon based on entity type
  const getIcon = () => {
    const iconMap = {
      template: Icons.FileText,
      workflow: Icons.GitBranch,
      snippet: Icons.Code,
      folder: Icons.Folder,
      addon: Icons.Package,
      insert: Icons.PlusSquare
    };
    
    const Icon = iconMap[entityType] || Icons.File;
    return <Icon className="w-6 h-6" />;
  };

  return (
    <div className={`px-6 py-4 border-b ${colorClasses.border} ${colorClasses.bg}`}>
      <div className="flex items-center gap-3">
        <div className={colorClasses.text}>
          {getIcon()}
        </div>
        <h1 className={`text-2xl font-bold ${colorClasses.text}`}>
          {title}
        </h1>
      </div>
    </div>
  );
};

export default EditorHeader;