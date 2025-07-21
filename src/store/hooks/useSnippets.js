// src/store/hooks/useSnippets.js
import { useCallback, useState, useEffect } from 'react';
import { useAppState, useAppDispatch } from '../appStore.jsx';
import { StorageService } from '../../services/storage/StorageService';

export function useSnippets() {
  const { snippets, meta } = useAppState();
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const fetchSnippets = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await StorageService.getSnippets();
      dispatch({ type: 'SET_SNIPPETS', payload: data });
    } catch (err) {
      setError(err.message);
      console.error('Failed to fetch snippets:', err);
    } finally {
      setLoading(false);
    }
  }, [dispatch]);
  
  useEffect(() => {
    if (snippets.length === 0) {
      fetchSnippets();
    }
  }, []); // Remove dependencies to prevent infinite loop
  
  const updateSnippet = useCallback(async (snippet) => {
    setLoading(true);
    try {
      dispatch({ type: 'UPDATE_SNIPPET', payload: snippet });
      await StorageService.updateSnippet(snippet);
      
      if (!meta.isOnline) {
        dispatch({ 
          type: 'ADD_PENDING_CHANGE', 
          payload: { type: 'update', entity: 'snippet', data: snippet }
        });
      }
    } catch (err) {
      await fetchSnippets();
      throw err;
    } finally {
      setLoading(false);
    }
  }, [dispatch, meta.isOnline, fetchSnippets]);
  
  const deleteSnippet = useCallback(async (id) => {
    const backup = snippets.find(s => s.id === id);
    
    try {
      dispatch({ type: 'DELETE_SNIPPET', payload: id });
      await StorageService.deleteSnippet(id);
    } catch (err) {
      if (backup) {
        dispatch({ type: 'ADD_SNIPPET', payload: backup });
      }
      throw err;
    }
  }, [dispatch, snippets]);
  
  const addSnippet = useCallback(async (snippetData) => {
    const snippet = {
      ...snippetData,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    try {
      dispatch({ type: 'ADD_SNIPPET', payload: snippet });
      await StorageService.createSnippet(snippet);
      return snippet;
    } catch (err) {
      await fetchSnippets();
      throw err;
    }
  }, [dispatch, fetchSnippets]);
  
  return {
    snippets,
    loading,
    error,
    fetchSnippets,
    updateSnippet,
    deleteSnippet,
    addSnippet,
    getSnippetById: useCallback((id) => snippets.find(s => s.id === id), [snippets])
  };
}