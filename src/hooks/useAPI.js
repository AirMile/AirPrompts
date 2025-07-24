/**
 * useAPI Hook - LocalStorage Only Version
 * Tijdelijke vervanging voor database-gebaseerde API
 */

import { useState, useCallback } from 'react';
import * as localStorage from '../utils/localStorageManager.js';

// Initialize localStorage on first load
localStorage.initializeLocalStorage();

/**
 * Templates API
 */
export const useTemplatesAPI = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getAll = useCallback(async () => {
    setLoading(true);
    try {
      const templates = localStorage.getTemplates();
      setLoading(false);
      return { success: true, data: templates };
    } catch (err) {
      setError(err);
      setLoading(false);
      return { success: false, error: err.message };
    }
  }, []);

  const getById = useCallback(async (id) => {
    setLoading(true);
    try {
      const template = localStorage.getTemplate(id);
      setLoading(false);
      return { success: true, data: template };
    } catch (err) {
      setError(err);
      setLoading(false);
      return { success: false, error: err.message };
    }
  }, []);

  const create = useCallback(async (data) => {
    setLoading(true);
    try {
      const template = localStorage.createTemplate(data);
      setLoading(false);
      return { success: true, data: template };
    } catch (err) {
      setError(err);
      setLoading(false);
      return { success: false, error: err.message };
    }
  }, []);

  const update = useCallback(async (id, data) => {
    setLoading(true);
    try {
      const template = localStorage.updateTemplate(id, data);
      setLoading(false);
      return { success: true, data: template };
    } catch (err) {
      setError(err);
      setLoading(false);
      return { success: false, error: err.message };
    }
  }, []);

  const remove = useCallback(async (id) => {
    setLoading(true);
    try {
      localStorage.deleteTemplate(id);
      setLoading(false);
      return { success: true };
    } catch (err) {
      setError(err);
      setLoading(false);
      return { success: false, error: err.message };
    }
  }, []);

  return { getAll, getById, create, update, remove, loading, error };
};

/**
 * Workflows API
 */
export const useWorkflowsAPI = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getAll = useCallback(async () => {
    setLoading(true);
    try {
      const workflows = localStorage.getWorkflows();
      setLoading(false);
      return { success: true, data: workflows };
    } catch (err) {
      setError(err);
      setLoading(false);
      return { success: false, error: err.message };
    }
  }, []);

  const getById = useCallback(async (id) => {
    setLoading(true);
    try {
      const workflow = localStorage.getWorkflow(id);
      setLoading(false);
      return { success: true, data: workflow };
    } catch (err) {
      setError(err);
      setLoading(false);
      return { success: false, error: err.message };
    }
  }, []);

  const create = useCallback(async (data) => {
    setLoading(true);
    try {
      const workflow = localStorage.createWorkflow(data);
      setLoading(false);
      return { success: true, data: workflow };
    } catch (err) {
      setError(err);
      setLoading(false);
      return { success: false, error: err.message };
    }
  }, []);

  const update = useCallback(async (id, data) => {
    setLoading(true);
    try {
      const workflow = localStorage.updateWorkflow(id, data);
      setLoading(false);
      return { success: true, data: workflow };
    } catch (err) {
      setError(err);
      setLoading(false);
      return { success: false, error: err.message };
    }
  }, []);

  const remove = useCallback(async (id) => {
    setLoading(true);
    try {
      localStorage.deleteWorkflow(id);
      setLoading(false);
      return { success: true };
    } catch (err) {
      setError(err);
      setLoading(false);
      return { success: false, error: err.message };
    }
  }, []);

  return { getAll, getById, create, update, remove, loading, error };
};

/**
 * Snippets API
 */
export const useSnippetsAPI = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getAll = useCallback(async () => {
    setLoading(true);
    try {
      const snippets = localStorage.getSnippets();
      setLoading(false);
      return { success: true, data: snippets };
    } catch (err) {
      setError(err);
      setLoading(false);
      return { success: false, error: err.message };
    }
  }, []);

  const getById = useCallback(async (id) => {
    setLoading(true);
    try {
      const snippet = localStorage.getSnippet(id);
      setLoading(false);
      return { success: true, data: snippet };
    } catch (err) {
      setError(err);
      setLoading(false);
      return { success: false, error: err.message };
    }
  }, []);

  const create = useCallback(async (data) => {
    setLoading(true);
    try {
      const snippet = localStorage.createSnippet(data);
      setLoading(false);
      return { success: true, data: snippet };
    } catch (err) {
      setError(err);
      setLoading(false);
      return { success: false, error: err.message };
    }
  }, []);

  const update = useCallback(async (id, data) => {
    setLoading(true);
    try {
      const snippet = localStorage.updateSnippet(id, data);
      setLoading(false);
      return { success: true, data: snippet };
    } catch (err) {
      setError(err);
      setLoading(false);
      return { success: false, error: err.message };
    }
  }, []);

  const remove = useCallback(async (id) => {
    setLoading(true);
    try {
      localStorage.deleteSnippet(id);
      setLoading(false);
      return { success: true };
    } catch (err) {
      setError(err);
      setLoading(false);
      return { success: false, error: err.message };
    }
  }, []);

  return { getAll, getById, create, update, remove, loading, error };
};

/**
 * Folders API
 */
export const useFoldersAPI = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getAll = useCallback(async () => {
    setLoading(true);
    try {
      const folders = localStorage.getFolders();
      setLoading(false);
      return { success: true, data: folders };
    } catch (err) {
      setError(err);
      setLoading(false);
      return { success: false, error: err.message };
    }
  }, []);

  const getById = useCallback(async (id) => {
    setLoading(true);
    try {
      const folder = localStorage.getFolder(id);
      setLoading(false);
      return { success: true, data: folder };
    } catch (err) {
      setError(err);
      setLoading(false);
      return { success: false, error: err.message };
    }
  }, []);

  const create = useCallback(async (data) => {
    setLoading(true);
    try {
      const folder = localStorage.createFolder(data);
      setLoading(false);
      return { success: true, data: folder };
    } catch (err) {
      setError(err);
      setLoading(false);
      return { success: false, error: err.message };
    }
  }, []);

  const update = useCallback(async (id, data) => {
    setLoading(true);
    try {
      const folder = localStorage.updateFolder(id, data);
      setLoading(false);
      return { success: true, data: folder };
    } catch (err) {
      setError(err);
      setLoading(false);
      return { success: false, error: err.message };
    }
  }, []);

  const remove = useCallback(async (id) => {
    setLoading(true);
    try {
      localStorage.deleteFolder(id);
      setLoading(false);
      return { success: true };
    } catch (err) {
      setError(err);
      setLoading(false);
      return { success: false, error: err.message };
    }
  }, []);

  const updateSortOrders = useCallback(async (updates) => {
    setLoading(true);
    try {
      const folders = localStorage.updateFolderSortOrders(updates);
      setLoading(false);
      return { success: true, data: folders };
    } catch (err) {
      setError(err);
      setLoading(false);
      return { success: false, error: err.message };
    }
  }, []);

  return { getAll, getById, create, update, remove, updateSortOrders, loading, error };
};

/**
 * Todos API
 */
export const useTodosAPI = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getAll = useCallback(async () => {
    setLoading(true);
    try {
      const todos = localStorage.getTodos();
      setLoading(false);
      return { success: true, data: todos };
    } catch (err) {
      setError(err);
      setLoading(false);
      return { success: false, error: err.message };
    }
  }, []);

  const create = useCallback(async (data) => {
    setLoading(true);
    try {
      const todo = localStorage.createTodo(data);
      setLoading(false);
      return { success: true, data: todo };
    } catch (err) {
      setError(err);
      setLoading(false);
      return { success: false, error: err.message };
    }
  }, []);

  const update = useCallback(async (id, data) => {
    setLoading(true);
    try {
      const todo = localStorage.updateTodo(id, data);
      setLoading(false);
      return { success: true, data: todo };
    } catch (err) {
      setError(err);
      setLoading(false);
      return { success: false, error: err.message };
    }
  }, []);

  const remove = useCallback(async (id) => {
    setLoading(true);
    try {
      localStorage.deleteTodo(id);
      setLoading(false);
      return { success: true };
    } catch (err) {
      setError(err);
      setLoading(false);
      return { success: false, error: err.message };
    }
  }, []);

  return { getAll, create, update, remove, loading, error };
};

/**
 * UI State APIs
 */
export const useUIStateAPI = () => {
  const toggleFolderExpansion = useCallback(async (folderId, isExpanded) => {
    try {
      const state = localStorage.updateFolderUIState(folderId, isExpanded);
      return { success: true, data: state };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, []);

  const toggleHeaderExpansion = useCallback(async (folderId, headerType, isExpanded) => {
    try {
      const state = localStorage.updateHeaderUIState(folderId, headerType, isExpanded);
      return { success: true, data: state };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, []);

  const getFolderUIState = useCallback(async () => {
    try {
      const state = localStorage.getFolderUIState();
      return { success: true, data: state };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, []);

  const getHeaderUIState = useCallback(async () => {
    try {
      const state = localStorage.getHeaderUIState();
      return { success: true, data: state };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, []);

  return {
    toggleFolderExpansion,
    toggleHeaderExpansion,
    getFolderUIState,
    getHeaderUIState
  };
};

/**
 * Folder Favorites API
 */
export const useFolderFavoritesAPI = () => {
  const toggleFavorite = useCallback(async ({ entityType, entityId, folderId, isFavorite }) => {
    try {
      const item = localStorage.toggleFolderFavorite(entityType, entityId, folderId, isFavorite);
      return { success: true, data: item };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, []);

  return { toggleFavorite };
};