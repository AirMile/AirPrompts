import React from 'react';
import ResizableSection from '../common/ResizableSection';
import ContextEditor from '../context/ContextEditor';
import ContextViewer from '../context/ContextViewer';
import ContextResizeHandle from '../context/ContextResizeHandle';
import ContextActionButton from '../context/ContextActionButton';
import { useContextEditor } from '../../hooks/context/useContextEditor';
import { useContextHeight } from '../../hooks/context/useContextHeight';
import { useContextVisibility } from '../../hooks/context/useContextVisibility';
import './FolderDescription.css';

const FolderDescription = ({ 
  folder, 
  onUpdateDescription
}) => {
  // Custom hooks for modular functionality
  const editor = useContextEditor(folder, onUpdateDescription);
  const height = useContextHeight(folder?.id || 'home', editor.editValue, editor.isEditing);
  const visibility = useContextVisibility(folder?.id || 'home', editor.hasDescription, editor.startEdit);
  

  if (!folder) {
    return null;
  }

  // Enhanced expand toggle that supports section expansion
  const handleExpandToggle = (shouldExpand) => {
    visibility.handleExpandToggle(shouldExpand);
    
    // If expanding and entering edit mode, ensure section is visible
    if (shouldExpand && editor.isEditing) {
      // Section will already be expanded by visibility.handleExpandToggle
    }
  };

  return (
    <ResizableSection
      sectionId={`context-${folder?.id || 'home'}`}
      title="Context"
      count={editor.hasDescription ? 1 : 0}
      defaultVisible={false}
      onVisibilityChange={handleExpandToggle}
      externalVisible={visibility.isVisible}
      isResizable={false}
      isEditMode={editor.isEditing}
      minHeight={150}
      maxHeight={600}
      defaultHeight={300}
      onCreateNew={editor.hasDescription ? undefined : editor.startEdit}
      className="no-content-padding"
      alwaysCollapsible={true}
      hideChevronWhenEmpty={true}
      hasContent={!!editor.hasDescription}
      hideCount={true}
      actionButton={
        <ContextActionButton 
          hasDescription={editor.hasDescription}
          isEditing={editor.isEditing}
          onToggleEdit={editor.toggleEditMode}
          onStartEdit={editor.startEdit}
        />
      }
    >
      {editor.error && (
        <div className="mb-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
          <p className="text-sm text-red-600 dark:text-red-400">{editor.error}</p>
        </div>
      )}
      
      <div 
        className="bg-white dark:bg-secondary-800 border-l border-r border-t border-b border-secondary-200 dark:border-secondary-700 rounded-b-lg relative"
        style={{
          height: visibility.isVisible && !editor.isEditing 
            ? `${height.useAutoHeight ? height.autoCalculatedHeight : height.contentHeight}px` 
            : 'auto',
          overflowY: visibility.isVisible && !editor.isEditing && editor.editValue?.trim() ? 'auto' : 'visible',
          transition: height.useAutoHeight ? 'height 0.2s ease-in-out' : 'none'
        }}
      >
        {editor.isEditing ? (
          <ContextEditor 
            folder={folder}
            editValue={editor.editValue}
            editorRef={editor.editorRef}
            onInputChange={editor.handleInputChange}
            onBlur={editor.handleBlur}
            onScrollToCursor={editor.scrollToCursor}
          />
        ) : (
          <ContextViewer 
            content={editor.editValue}
            contentMeasureRef={height.contentMeasureRef}
          />
        )}
        
        <ContextResizeHandle 
          isVisible={!editor.isEditing && visibility.isVisible}
          useAutoHeight={height.useAutoHeight}
          autoCalculatedHeight={height.autoCalculatedHeight}
          maxHeight={height.constants.MAX_HEIGHT}
          isDraggingState={height.isDraggingState}
          onMouseDown={height.handleMouseDown}
        />
      </div>
    </ResizableSection>
  );
};

export default FolderDescription;