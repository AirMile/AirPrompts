/**
 * Base Component Library
 * 
 * Reusable components for consistent UI across entity types
 * 
 * Components:
 * - BaseEditor: Unified editor for all entities
 * - BaseCard: Consistent card display for all entities
 * - FieldRenderer: Dynamic form field rendering
 * 
 * Usage:
 * ```jsx
 * import { BaseEditor, BaseCard } from '@/components/base';
 * 
 * // Editor example
 * <BaseEditor
 *   entity={template}
 *   entityType="template"
 *   schema={templateSchema}
 *   onSave={handleSave}
 *   onCancel={handleCancel}
 * />
 * 
 * // Card example
 * <BaseCard
 *   item={template}
 *   entityType="template"
 *   onExecute={handleExecute}
 *   onEdit={handleEdit}
 *   onDelete={handleDelete}
 *   onToggleFavorite={handleToggleFavorite}
 * />
 * ```
 */

export { default as BaseEditor } from './BaseEditor';
export { default as BaseCard } from './BaseCard';
export { default as EditorLayout } from './EditorLayout';
export { default as EditorHeader } from './EditorHeader';
export { default as EditorForm } from './EditorForm';
export { default as EditorActions } from './EditorActions';
export { default as FieldRenderer } from './FieldRenderer';