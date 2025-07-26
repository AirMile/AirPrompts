import { useCallback } from 'react';

/**
 * @typedef {Object} OptimizedCallbacks
 * @property {Function} handleExecute - Optimized execute handler
 * @property {Function} handleEdit - Optimized edit handler
 * @property {Function} handleDelete - Optimized delete handler
 * @property {Function} handleToggleFavorite - Optimized toggle favorite handler
 * @property {Function} handleDuplicate - Optimized duplicate handler
 * @property {Function} handleExport - Optimized export handler
 * @property {Function} handleShare - Optimized share handler
 */

/**
 * Custom hook that returns optimized callbacks for item operations
 * Centralizes callback optimization logic to prevent unnecessary re-renders
 * 
 * @param {Object} item - The item to operate on
 * @param {Object} actions - Action handlers object
 * @param {Function} actions.execute - Execute item handler
 * @param {Function} actions.edit - Edit item handler
 * @param {Function} actions.delete - Delete item handler
 * @param {Function} actions.toggleFavorite - Toggle favorite handler
 * @param {Function} [actions.duplicate] - Duplicate item handler
 * @param {Function} [actions.export] - Export item handler
 * @param {Function} [actions.share] - Share item handler
 * @param {Object} options - Additional options
 * @param {string} [options.itemType] - Override item type
 * @param {Function} [options.onActionComplete] - Callback after action completes
 * @returns {OptimizedCallbacks} Optimized callback functions
 */
export const useOptimizedCallbacks = (item, actions, options = {}) => {
  const { itemType = item?.type, onActionComplete } = options;

  const handleExecute = useCallback(() => {
    if (!item || !actions.execute) return;
    
    actions.execute(item, itemType);
    onActionComplete?.('execute', item);
  }, [item, itemType, actions.execute, onActionComplete]);

  const handleEdit = useCallback(() => {
    if (!item || !actions.edit) return;
    
    actions.edit(item);
    onActionComplete?.('edit', item);
  }, [item, actions.edit, onActionComplete]);

  const handleDelete = useCallback(() => {
    if (!item || !actions.delete) return;
    
    actions.delete(itemType, item.id);
    onActionComplete?.('delete', item);
  }, [item?.id, itemType, actions.delete, onActionComplete]);

  const handleToggleFavorite = useCallback(() => {
    if (!item || !actions.toggleFavorite) return;
    
    actions.toggleFavorite(item, itemType);
    onActionComplete?.('toggleFavorite', item);
  }, [item, itemType, actions.toggleFavorite, onActionComplete]);

  const handleDuplicate = useCallback(() => {
    if (!item || !actions.duplicate) return;
    
    actions.duplicate(item, itemType);
    onActionComplete?.('duplicate', item);
  }, [item, itemType, actions.duplicate, onActionComplete]);

  const handleExport = useCallback(() => {
    if (!item || !actions.export) return;
    
    actions.export(item, itemType);
    onActionComplete?.('export', item);
  }, [item, itemType, actions.export, onActionComplete]);

  const handleShare = useCallback(() => {
    if (!item || !actions.share) return;
    
    actions.share(item, itemType);
    onActionComplete?.('share', item);
  }, [item, itemType, actions.share, onActionComplete]);

  return {
    handleExecute,
    handleEdit,
    handleDelete,
    handleToggleFavorite,
    handleDuplicate,
    handleExport,
    handleShare
  };
};

/**
 * Hook for optimizing event handlers with preventDefault and stopPropagation
 * 
 * @param {Function} handler - The event handler to optimize
 * @param {Array} deps - Dependencies for the callback
 * @returns {Function} Optimized event handler
 */
export const useOptimizedEventHandler = (handler, deps = []) => {
  return useCallback((event) => {
    event.preventDefault();
    event.stopPropagation();
    handler(event);
  }, deps);
};

/**
 * Hook for optimizing keyboard event handlers
 * 
 * @param {Object} keyHandlers - Object mapping keys to handlers
 * @param {Array} deps - Dependencies for the callback
 * @returns {Function} Optimized keyboard event handler
 */
export const useOptimizedKeyHandler = (keyHandlers, deps = []) => {
  return useCallback((event) => {
    const handler = keyHandlers[event.key];
    if (handler) {
      event.preventDefault();
      handler(event);
    }
  }, deps);
};