// src/store/hooks/useTemplates.js
import { useCallback, useState, useEffect } from 'react';
import { useAppState, useAppDispatch } from '../appStore.jsx';
import { StorageService } from '../../services/storage/StorageService';

// Database-ready hook with loading states and error handling
export function useTemplates() {
  const { templates, meta } = useAppState();
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Fetch templates (localStorage now, API later)
  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    setError(null);
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      const data = await StorageService.getTemplates();
      dispatch({ type: 'SET_TEMPLATES', payload: data });
    } catch (err) {
      setError(err.message);
      dispatch({ type: 'SET_ERROR', payload: err.message });
      console.error('Failed to fetch templates:', err);
    } finally {
      setLoading(false);
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [dispatch]);
  
  // Auto-fetch on mount
  useEffect(() => {
    if (templates.length === 0) {
      fetchTemplates();
    }
  }, []); // Remove dependencies to prevent infinite loop
  
  const updateTemplate = useCallback(async (template) => {
    setLoading(true);
    try {
      // Optimistic update
      dispatch({ type: 'UPDATE_TEMPLATE', payload: template });
      
      // Persist (localStorage now, API later)
      await StorageService.updateTemplate(template);
      
      // Queue for sync if offline
      if (!meta.isOnline) {
        dispatch({ 
          type: 'ADD_PENDING_CHANGE', 
          payload: { type: 'update', entity: 'template', data: template }
        });
      }
    } catch (err) {
      // Rollback on error
      await fetchTemplates();
      throw err;
    } finally {
      setLoading(false);
    }
  }, [dispatch, meta.isOnline, fetchTemplates]);
  
  const deleteTemplate = useCallback(async (id) => {
    const backup = templates.find(t => t.id === id);
    
    try {
      // Optimistic delete
      dispatch({ type: 'DELETE_TEMPLATE', payload: id });
      
      await StorageService.deleteTemplate(id);
    } catch (err) {
      // Restore on error
      if (backup) {
        dispatch({ type: 'ADD_TEMPLATE', payload: backup });
      }
      throw err;
    }
  }, [dispatch, templates]);
  
  const addTemplate = useCallback(async (templateData) => {
    const template = {
      ...templateData,
      id: crypto.randomUUID(), // Future-proof ID generation
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    try {
      dispatch({ type: 'ADD_TEMPLATE', payload: template });
      await StorageService.createTemplate(template);
      return template;
    } catch (err) {
      await fetchTemplates(); // Rollback
      throw err;
    }
  }, [dispatch, fetchTemplates]);
  
  return {
    templates,
    loading,
    error,
    fetchTemplates,
    updateTemplate,
    deleteTemplate,
    addTemplate,
    // Utility functions
    getTemplateById: useCallback((id) => templates.find(t => t.id === id), [templates]),
    searchTemplates: useCallback((query) => templates.filter(t => 
      t.name.toLowerCase().includes(query.toLowerCase()) ||
      t.content.toLowerCase().includes(query.toLowerCase())
    ), [templates])
  };
}