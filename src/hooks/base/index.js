/**
 * Base Hooks for component library
 * 
 * Hooks:
 * - useEntityForm: Form state management with validation
 * - useEntityTheme: Entity-specific theming
 * 
 * Usage:
 * ```js
 * import { useEntityForm, useEntityTheme } from '@/hooks/base';
 * 
 * const { formData, errors, handleChange } = useEntityForm(data, schema);
 * const { getColorClasses } = useEntityTheme('template');
 * ```
 */

export { default as useEntityForm } from './useEntityForm';
export { default as useEntityTheme } from './useEntityTheme';