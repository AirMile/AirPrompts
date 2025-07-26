/**
 * Error boundary components for graceful error handling
 * 
 * Usage:
 * - ErrorBoundary: General purpose error boundary
 * - ExecutorErrorBoundary: For execution-related errors
 * - EditorErrorBoundary: For editor-related errors
 * 
 * Example:
 * ```jsx
 * import { ErrorBoundary, EditorErrorBoundary } from '@/components/errors';
 * 
 * <ErrorBoundary>
 *   <YourComponent />
 * </ErrorBoundary>
 * 
 * <EditorErrorBoundary>
 *   <TemplateEditor />
 * </EditorErrorBoundary>
 * ```
 */

export { default as ErrorBoundary } from './ErrorBoundary';
export { default as ErrorFallback } from './ErrorFallback';
export { default as CriticalErrorFallback } from './CriticalErrorFallback';
export { default as ExecutorErrorBoundary } from './ExecutorErrorBoundary';
export { default as EditorErrorBoundary } from './EditorErrorBoundary';