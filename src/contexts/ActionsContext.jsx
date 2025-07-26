import React, { createContext, useContext, useCallback, useMemo } from 'react';
import { useTemplatesQuery, useWorkflowsQuery, useSnippetsQuery } from '../hooks/queries';
import { showSuccessNotification, showErrorNotification, showWarningNotification } from '../utils/notifications';

const ActionsContext = createContext(null);

/**
 * Actions Provider with proper useCallback memoization
 * Provides unified interface for CRUD operations on all entity types
 */
export const ActionsProvider = ({ children }) => {
  // Get mutations from query hooks
  const { createTemplate, updateTemplate, deleteTemplate } = useTemplatesQuery();
  const { createWorkflow, updateWorkflow, deleteWorkflow } = useWorkflowsQuery();
  const { createSnippet, updateSnippet, deleteSnippet } = useSnippetsQuery();
  
  // Memoized action creators
  const create = useCallback(async (type, data) => {
    const mutations = {
      template: createTemplate,
      workflow: createWorkflow,
      snippet: createSnippet
    };
    
    try {
      const result = await mutations[type].mutateAsync(data);
      showSuccessNotification(`${type} created successfully`);
      return result;
    } catch (error) {
      showErrorNotification(`Failed to create ${type}`);
      throw error;
    }
  }, [createTemplate, createWorkflow, createSnippet]);
  
  const update = useCallback(async (type, id, data) => {
    const mutations = {
      template: updateTemplate,
      workflow: updateWorkflow,
      snippet: updateSnippet
    };
    
    try {
      const result = await mutations[type].mutateAsync({ id, ...data });
      showSuccessNotification(`${type} updated successfully`);
      return result;
    } catch (error) {
      showErrorNotification(`Failed to update ${type}`);
      throw error;
    }
  }, [updateTemplate, updateWorkflow, updateSnippet]);
  
  const deleteEntity = useCallback(async (type, id) => {
    const mutations = {
      template: deleteTemplate,
      workflow: deleteWorkflow,
      snippet: deleteSnippet
    };
    
    try {
      await mutations[type].mutateAsync(id);
      showSuccessNotification(`${type} deleted successfully`);
    } catch (error) {
      showErrorNotification(`Failed to delete ${type}`);
      throw error;
    }
  }, [deleteTemplate, deleteWorkflow, deleteSnippet]);
  
  const execute = useCallback((item, type) => {
    // Execution logic - this would navigate to executor or open modal
    console.log('Executing:', type, item.id);
    // In a real implementation, this would use navigation or modal context
  }, []);
  
  const toggleFavorite = useCallback(async (item, type) => {
    const updatedItem = { ...item, favorite: !item.favorite };
    return update(type, item.id, updatedItem);
  }, [update]);
  
  // Batch operations
  const batchUpdate = useCallback(async (type, ids, updates) => {
    const results = await Promise.allSettled(
      ids.map(id => update(type, id, updates))
    );
    
    const failed = results.filter(r => r.status === 'rejected').length;
    if (failed > 0) {
      showWarningNotification(`${failed} items failed to update`);
    }
    
    return results;
  }, [update]);
  
  const batchDelete = useCallback(async (type, ids) => {
    const results = await Promise.allSettled(
      ids.map(id => deleteEntity(type, id))
    );
    
    const failed = results.filter(r => r.status === 'rejected').length;
    if (failed > 0) {
      showWarningNotification(`${failed} items failed to delete`);
    }
    
    return results;
  }, [deleteEntity]);
  
  // Export operations
  const exportItems = useCallback(async (type, ids) => {
    // Implementation would fetch items and create export file
    console.log('Exporting:', type, ids);
    showSuccessNotification('Export started');
  }, []);
  
  const importItems = useCallback(async (type, data) => {
    // Implementation would parse and create items
    console.log('Importing:', type, data);
    showSuccessNotification('Import started');
  }, []);
  
  // Memoized actions object
  const actions = useMemo(() => ({
    create,
    update,
    delete: deleteEntity,
    execute,
    toggleFavorite,
    batchUpdate,
    batchDelete,
    exportItems,
    importItems
  }), [
    create, 
    update, 
    deleteEntity, 
    execute, 
    toggleFavorite, 
    batchUpdate, 
    batchDelete,
    exportItems,
    importItems
  ]);
  
  return (
    <ActionsContext.Provider value={actions}>
      {children}
    </ActionsContext.Provider>
  );
};

/**
 * Custom hook to use actions with stable references
 */
export const useActions = () => {
  const context = useContext(ActionsContext);
  if (!context) {
    throw new Error('useActions must be used within ActionsProvider');
  }
  return context;
};

export default ActionsContext;