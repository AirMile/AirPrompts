/**
 * Data Storage Utilities voor AirPrompts
 * Handles API calls met localStorage fallback voor offline-first operaties
 */

import { useTemplatesAPI, useWorkflowsAPI, useFoldersAPI } from '../hooks/useAPI.js';

const STORAGE_KEYS = {
  TEMPLATES: 'airprompts_templates',
  WORKFLOWS: 'airprompts_workflows', 
  SNIPPETS: 'airprompts_snippets',
  FOLDERS: 'airprompts_folders',
  VERSION: 'airprompts_data_version'
};

const CURRENT_VERSION = '1.0';

/**
 * Check if localStorage is available
 * @returns {boolean}
 */
export const isLocalStorageAvailable = () => {
  try {
    const test = '__localStorage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch (e) {
    console.warn('LocalStorage niet beschikbaar:', e);
    return false;
  }
};

/**
 * Load data from localStorage with fallback
 * @param {string} key - Storage key
 * @param {any} defaultValue - Fallback value
 * @returns {any} Parsed data or default value
 */
export const loadFromStorage = (key, defaultValue) => {
  if (!isLocalStorageAvailable()) {
    console.warn(`LocalStorage niet beschikbaar, gebruik default waarde voor ${key}`);
    return defaultValue;
  }

  try {
    const item = localStorage.getItem(key);
    if (item === null) {
      return defaultValue;
    }

    const parsed = JSON.parse(item);
    return parsed;
  } catch (error) {
    console.error(`Error bij laden van ${key}:`, error);
    console.warn(`Gebruik default waarde voor ${key}`);
    return defaultValue;
  }
};

/**
 * Save data to localStorage
 * @param {string} key - Storage key
 * @param {any} data - Data to save
 * @returns {boolean} Success status
 */
export const saveToStorage = (key, data) => {
  if (!isLocalStorageAvailable()) {
    console.warn(`LocalStorage niet beschikbaar, kan ${key} niet opslaan`);
    return false;
  }

  try {
    const serialized = JSON.stringify(data);
    localStorage.setItem(key, serialized);
    return true;
  } catch (error) {
    if (error.name === 'QuotaExceededError') {
      console.error('LocalStorage quota overschreden voor', key);
      // Try to clear some space by removing old data
      clearOldData();
    } else {
      console.error(`Error bij opslaan van ${key}:`, error);
    }
    return false;
  }
};

/**
 * Load all application data with API-first, localStorage fallback strategy
 * @param {Object} defaults - Default data objects
 * @returns {Object} Loaded or default data
 */
export const loadAllData = (defaults) => {
  const data = {
    templates: loadFromStorage(STORAGE_KEYS.TEMPLATES, defaults.templates),
    workflows: loadFromStorage(STORAGE_KEYS.WORKFLOWS, defaults.workflows),
    snippets: loadFromStorage(STORAGE_KEYS.SNIPPETS, defaults.snippets),
    folders: loadFromStorage(STORAGE_KEYS.FOLDERS, defaults.folders)
  };

  // Check data version for migrations
  const version = loadFromStorage(STORAGE_KEYS.VERSION, null);
  if (version !== CURRENT_VERSION) {
    data.migrated = true;
    saveToStorage(STORAGE_KEYS.VERSION, CURRENT_VERSION);
  }

  return data;
};

/**
 * API-first data loading utilities
 * Deze functies proberen eerst API, dan localStorage fallback
 */

/**
 * Load templates with API-first strategy
 * @param {Array} fallbackData - LocalStorage fallback data
 * @returns {Promise<Array>} Templates array
 */
export const loadTemplatesWithFallback = async (fallbackData = []) => {
  try {
    // Try API first
    const response = await fetch('http://localhost:3001/api/templates');
    if (response.ok) {
      const result = await response.json();
      if (result.success) {
        console.log('📥 Templates loaded from API:', result.data.length);
        // Save to localStorage for offline access
        saveToStorage(STORAGE_KEYS.TEMPLATES, result.data);
        return result.data;
      }
    }
    throw new Error('API request failed');
  } catch (error) {
    console.warn('⚠️ API failed, using localStorage fallback:', error.message);
    const localData = loadFromStorage(STORAGE_KEYS.TEMPLATES, fallbackData);
    console.log('💾 Templates loaded from localStorage:', localData.length);
    return localData;
  }
};

/**
 * Load workflows with API-first strategy
 * @param {Array} fallbackData - LocalStorage fallback data
 * @returns {Promise<Array>} Workflows array
 */
export const loadWorkflowsWithFallback = async (fallbackData = []) => {
  try {
    const response = await fetch('http://localhost:3001/api/workflows');
    if (response.ok) {
      const result = await response.json();
      if (result.success) {
        console.log('📥 Workflows loaded from API:', result.data.length);
        saveToStorage(STORAGE_KEYS.WORKFLOWS, result.data);
        return result.data;
      }
    }
    throw new Error('API request failed');
  } catch (error) {
    console.warn('⚠️ API failed, using localStorage fallback:', error.message);
    const localData = loadFromStorage(STORAGE_KEYS.WORKFLOWS, fallbackData);
    console.log('💾 Workflows loaded from localStorage:', localData.length);
    return localData;
  }
};

/**
 * Load folders with API-first strategy
 * @param {Array} fallbackData - LocalStorage fallback data
 * @returns {Promise<Array>} Folders array
 */
export const loadFoldersWithFallback = async (fallbackData = []) => {
  try {
    const response = await fetch('http://localhost:3001/api/folders');
    if (response.ok) {
      const result = await response.json();
      if (result.success) {
        console.log('📥 Folders loaded from API:', result.data.length);
        saveToStorage(STORAGE_KEYS.FOLDERS, result.data);
        return result.data;
      }
    }
    throw new Error('API request failed');
  } catch (error) {
    console.warn('⚠️ API failed, using localStorage fallback:', error.message);
    const localData = loadFromStorage(STORAGE_KEYS.FOLDERS, fallbackData);
    console.log('💾 Folders loaded from localStorage:', localData.length);
    return localData;
  }
};

/**
 * Save workflow with API-first strategy
 * @param {Object} workflow - Workflow to save
 * @param {string} action - 'create' or 'update'
 * @returns {Promise<Object>} Saved workflow
 */
export const saveWorkflowWithFallback = async (workflow, action = 'create') => {
  try {
    const url = action === 'update' 
      ? `http://localhost:3001/api/workflows/${workflow.id}`
      : 'http://localhost:3001/api/workflows';
    
    // Only send API-compatible fields
    const apiWorkflow = {
      ...(action === 'update' && workflow.id && { id: workflow.id }),
      name: workflow.name,
      description: workflow.description,
      category: workflow.category,
      // Convert steps to array of template IDs (API expects strings)
      steps: workflow.steps ? workflow.steps.map(step => {
        if (typeof step === 'string') {
          return step;
        }
        console.log('🔍 Processing workflow step:', step);
        // Try multiple ways to get a valid template ID
        const templateId = step.selectedTemplateId || step.templateId || 
                          (step.templateOptions && step.templateOptions[0]?.id) ||
                          (Array.isArray(step) && step[0]); // Legacy format
        console.log('📋 Extracted template ID:', templateId);
        return templateId;
      }).filter(Boolean) : [],
      favorite: workflow.favorite || false,
      // Support both folderIds (new) and folder_id (legacy)
      folderIds: workflow.folderIds || [],
      folder_id: workflow.folder_id || workflow.folderIds?.[0] || null,
      // Include folderFavorites for complete data
      folderFavorites: workflow.folderFavorites || {}
    };
    
    const response = await fetch(url, {
      method: action === 'update' ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(apiWorkflow)
    });

    if (response.ok) {
      const result = await response.json();
      if (result.success) {
        console.log(`✅ Workflow ${action}d via API:`, result.data.name);
        return result.data;
      }
    }
    
    // Log error response details for debugging
    const errorText = await response.text();
    console.error(`❌ API Error ${response.status}:`, errorText);
    throw new Error(`HTTP ${response.status}: ${errorText}`);
  } catch (error) {
    console.warn(`⚠️ API failed, workflow ${action} queued for sync:`, error.message);
    // Queue voor later sync wanneer API weer beschikbaar is
    queueOperation('workflow', action, workflow);
    return workflow;
  }
};

/**
 * Save template with API-first strategy
 * @param {Object} template - Template to save
 * @param {string} action - 'create' or 'update'
 * @returns {Promise<Object>} Saved template
 */
export const saveTemplateWithFallback = async (template, action = 'create') => {
  try {
    const url = action === 'update' 
      ? `http://localhost:3001/api/templates/${template.id}`
      : 'http://localhost:3001/api/templates';
    
    // Only send API-compatible fields
    const apiTemplate = {
      ...(action === 'update' && template.id && { id: template.id }),
      name: template.name,
      description: template.description,
      content: template.content,
      category: template.category,
      variables: template.variables,
      favorite: template.favorite || false,
      // Support both folderIds (new) and folder_id (legacy)
      folderIds: template.folderIds || [],
      folder_id: template.folder_id || template.folderIds?.[0] || null,
      // Include folderFavorites for complete data
      folderFavorites: template.folderFavorites || {}
    };
    
    const response = await fetch(url, {
      method: action === 'update' ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(apiTemplate)
    });

    if (response.ok) {
      const result = await response.json();
      if (result.success) {
        console.log(`✅ Template ${action}d via API:`, result.data.name);
        return result.data;
      }
    }
    
    // Log error response details for debugging
    const errorText = await response.text();
    console.error(`❌ API Error ${response.status}:`, errorText);
    throw new Error(`HTTP ${response.status}: ${errorText}`);
  } catch (error) {
    console.warn(`⚠️ API failed, template ${action} queued for sync:`, error.message);
    // Queue voor later sync wanneer API weer beschikbaar is
    queueOperation('template', action, template);
    return template;
  }
};

/**
 * Simple operation queue voor offline operaties
 */
const SYNC_QUEUE_KEY = 'airprompts_sync_queue';

const queueOperation = (type, action, data) => {
  const queue = loadFromStorage(SYNC_QUEUE_KEY, []);
  queue.push({
    id: Date.now(),
    type,
    action,
    data,
    timestamp: new Date().toISOString()
  });
  saveToStorage(SYNC_QUEUE_KEY, queue);
  console.log(`📋 Operation queued: ${type} ${action}`);
};

/**
 * Load snippets with API-first strategy
 * @param {Array} fallbackData - LocalStorage fallback data
 * @returns {Promise<Array>} Snippets array
 */
export const loadSnippetsWithFallback = async (fallbackData = []) => {
  try {
    const response = await fetch('http://localhost:3001/api/snippets');
    if (response.ok) {
      const result = await response.json();
      if (result.success) {
        console.log('📥 Snippets loaded from API:', result.data.length);
        saveToStorage(STORAGE_KEYS.SNIPPETS, result.data);
        return result.data;
      }
    }
    throw new Error('API request failed');
  } catch (error) {
    console.warn('⚠️ API failed, using localStorage fallback:', error.message);
    const localData = loadFromStorage(STORAGE_KEYS.SNIPPETS, fallbackData);
    console.log('💾 Snippets loaded from localStorage:', localData.length);
    return localData;
  }
};

/**
 * Save snippet with API-first strategy
 * @param {Object} snippet - Snippet to save
 * @param {string} action - 'create' or 'update'
 * @returns {Promise<Object>} Saved snippet
 */
export const saveSnippetWithFallback = async (snippet, action = 'create') => {
  try {
    const url = action === 'update' 
      ? `http://localhost:3001/api/snippets/${snippet.id}`
      : 'http://localhost:3001/api/snippets';
    
    // Only send API-compatible fields (no ID in body as per API validation)
    const apiSnippet = {
      name: snippet.name,
      content: snippet.content,
      tags: snippet.tags || [],
      favorite: snippet.favorite || false,
      // Support both folderIds (new) and folder_id (legacy)
      folderIds: snippet.folderIds || [],
      folder_id: snippet.folder_id || snippet.folderIds?.[0] || null,
      // Include folderFavorites for complete data
      folderFavorites: snippet.folderFavorites || {}
    };
    
    const response = await fetch(url, {
      method: action === 'update' ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(apiSnippet)
    });

    if (response.ok) {
      const result = await response.json();
      if (result.success) {
        console.log(`✅ Snippet ${action}d via API:`, result.data.name);
        return result.data;
      }
    }
    
    // Log error response details for debugging
    const errorText = await response.text();
    console.error(`❌ API Error ${response.status}:`, errorText);
    throw new Error(`HTTP ${response.status}: ${errorText}`);
  } catch (error) {
    console.warn(`⚠️ API failed, snippet ${action} queued for sync:`, error.message);
    // Queue voor later sync wanneer API weer beschikbaar is
    queueOperation('snippet', action, snippet);
    return snippet;
  }
};

/**
 * Get pending sync operations count
 * @returns {number} Number of pending operations
 */
export const getPendingSyncCount = () => {
  const queue = loadFromStorage(SYNC_QUEUE_KEY, []);
  return queue.length;
};

/**
 * Save all application data
 * @param {Object} data - Data to save
 */
export const saveAllData = (data) => {
  const operations = [
    () => saveToStorage(STORAGE_KEYS.TEMPLATES, data.templates),
    () => saveToStorage(STORAGE_KEYS.WORKFLOWS, data.workflows), 
    () => saveToStorage(STORAGE_KEYS.SNIPPETS, data.snippets),
    () => saveToStorage(STORAGE_KEYS.FOLDERS, data.folders)
  ];

  let successes = 0;
  operations.forEach(operation => {
    if (operation()) successes++;
  });

  if (successes !== operations.length) {
    console.warn(`⚠️ ${successes}/${operations.length} operaties succesvol`);
  }

  return successes === operations.length;
};

/**
 * Save specific data type
 * @param {string} type - Data type (templates, workflows, snippets, folders)
 * @param {any} data - Data to save
 */
export const saveData = (type, data) => {
  const keyMap = {
    templates: STORAGE_KEYS.TEMPLATES,
    workflows: STORAGE_KEYS.WORKFLOWS,
    snippets: STORAGE_KEYS.SNIPPETS,
    folders: STORAGE_KEYS.FOLDERS
  };

  const key = keyMap[type];
  if (!key) {
    console.error(`Onbekend data type: ${type}`);
    return false;
  }

  return saveToStorage(key, data);
};

/**
 * Clear old or corrupted data
 */
export const clearOldData = () => {
  if (!isLocalStorageAvailable()) return;

  try {
    // Remove non-essential data if storage is full
    const keysToCheck = Object.values(STORAGE_KEYS);
    keysToCheck.forEach(key => {
      try {
        const item = localStorage.getItem(key);
        if (item && item.length > 100000) { // > 100KB
          console.warn(`Grote data gevonden voor ${key}, mogelijk corrupt`);
        }
      } catch (e) {
        console.warn(`Probleem met key ${key}, verwijderen...`);
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.error('Error bij opschonen van data:', error);
  }
};

/**
 * Clear all application data
 */
export const clearAllData = () => {
  if (!isLocalStorageAvailable()) return;

  Object.values(STORAGE_KEYS).forEach(key => {
    localStorage.removeItem(key);
  });
  
};

/**
 * Get storage usage info
 * @returns {Object} Storage statistics
 */
export const getStorageInfo = () => {
  if (!isLocalStorageAvailable()) {
    return { available: false };
  }

  let totalSize = 0;
  const details = {};

  Object.entries(STORAGE_KEYS).forEach(([name, key]) => {
    const item = localStorage.getItem(key);
    const size = item ? new Blob([item]).size : 0;
    details[name.toLowerCase()] = {
      size,
      items: item ? JSON.parse(item).length || Object.keys(JSON.parse(item)).length : 0
    };
    totalSize += size;
  });

  return {
    available: true,
    totalSize,
    details,
    percentage: Math.round((totalSize / (5 * 1024 * 1024)) * 100) // Assume 5MB quota
  };
};

export { STORAGE_KEYS };