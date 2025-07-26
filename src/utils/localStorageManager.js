/**
 * Local Storage Manager - Vervangt alle database/API functionaliteit
 * Tijdelijke oplossing totdat database opnieuw wordt opgebouwd
 */

// Simple UUID v4 generator
const uuidv4 = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

const STORAGE_KEYS = {
  TEMPLATES: 'airprompts_templates',
  WORKFLOWS: 'airprompts_workflows', 
  SNIPPETS: 'airprompts_snippets',
  FOLDERS: 'airprompts_folders',
  ROOT_FOLDER: 'airprompts_root_folder',
  FOLDER_FAVORITES: 'airprompts_folder_favorites',
  TODOS: 'airprompts_todos',
  FOLDER_UI_STATE: 'airprompts_folder_ui_state',
  HEADER_UI_STATE: 'airprompts_header_ui_state',
  TODO_UI_STATE: 'airprompts_todo_ui_state',
  VERSION: 'airprompts_data_version'
};

const CURRENT_VERSION = '2.0';

// Helper functions
const loadFromStorage = (key, defaultValue = []) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error loading ${key}:`, error);
    return defaultValue;
  }
};

const saveToStorage = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error(`Error saving ${key}:`, error);
    return false;
  }
};

// Root folder management (special case)
export const getRootFolder = () => {
  return loadFromStorage(STORAGE_KEYS.ROOT_FOLDER, { description: '' });
};

export const updateRootFolder = (data) => {
  try {
    const currentData = getRootFolder();
    const updatedData = { 
      ...currentData, 
      ...data, 
      updatedAt: new Date().toISOString() 
    };
    saveToStorage(STORAGE_KEYS.ROOT_FOLDER, updatedData);
    return updatedData;
  } catch (error) {
    console.error('Error updating root folder:', error);
    throw error;
  }
};

// Initialize default data if needed
export const initializeLocalStorage = async () => {
  const version = loadFromStorage(STORAGE_KEYS.VERSION);
  
  if (version !== CURRENT_VERSION) {
    console.log('🔄 Initializing/migrating localStorage data...');
    
    // Load default data
    try {
      // Import default data directly
      const { default: defaultTemplates } = await import('../data/defaultTemplates.json');
      const { default: defaultWorkflows } = await import('../data/defaultWorkflows.json');
      
      // Only set defaults if no data exists
      if (!localStorage.getItem(STORAGE_KEYS.TEMPLATES)) {
        saveToStorage(STORAGE_KEYS.TEMPLATES, defaultTemplates);
      }
      if (!localStorage.getItem(STORAGE_KEYS.WORKFLOWS)) {
        saveToStorage(STORAGE_KEYS.WORKFLOWS, defaultWorkflows);
      }
      if (!localStorage.getItem(STORAGE_KEYS.FOLDERS)) {
        // Start with empty folders array instead of default placeholder folders
        saveToStorage(STORAGE_KEYS.FOLDERS, []);
      }
      
      saveToStorage(STORAGE_KEYS.VERSION, CURRENT_VERSION);
      console.log('✅ LocalStorage initialized');
    } catch (error) {
      console.error('Error loading default data:', error);
    }
  }
};

// Template operations
export const getTemplates = () => {
  return loadFromStorage(STORAGE_KEYS.TEMPLATES);
};

export const getTemplate = (id) => {
  const templates = getTemplates();
  return templates.find(t => t.id === id);
};

export const createTemplate = (template) => {
  const templates = getTemplates();
  const newTemplate = {
    ...template,
    id: template.id || uuidv4(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  templates.push(newTemplate);
  saveToStorage(STORAGE_KEYS.TEMPLATES, templates);
  return newTemplate;
};

export const updateTemplate = (id, updates) => {
  const templates = getTemplates();
  const index = templates.findIndex(t => t.id === id);
  if (index !== -1) {
    templates[index] = {
      ...templates[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    saveToStorage(STORAGE_KEYS.TEMPLATES, templates);
    return templates[index];
  }
  return null;
};

export const deleteTemplate = (id) => {
  const templates = getTemplates();
  const filtered = templates.filter(t => t.id !== id);
  saveToStorage(STORAGE_KEYS.TEMPLATES, filtered);
  return true;
};

// Workflow operations
export const getWorkflows = () => {
  return loadFromStorage(STORAGE_KEYS.WORKFLOWS);
};

export const getWorkflow = (id) => {
  const workflows = getWorkflows();
  return workflows.find(w => w.id === id);
};

export const createWorkflow = (workflow) => {
  const workflows = getWorkflows();
  const newWorkflow = {
    ...workflow,
    id: workflow.id || uuidv4(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  workflows.push(newWorkflow);
  saveToStorage(STORAGE_KEYS.WORKFLOWS, workflows);
  return newWorkflow;
};

export const updateWorkflow = (id, updates) => {
  const workflows = getWorkflows();
  const index = workflows.findIndex(w => w.id === id);
  if (index !== -1) {
    workflows[index] = {
      ...workflows[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    saveToStorage(STORAGE_KEYS.WORKFLOWS, workflows);
    return workflows[index];
  }
  return null;
};

export const deleteWorkflow = (id) => {
  const workflows = getWorkflows();
  const filtered = workflows.filter(w => w.id !== id);
  saveToStorage(STORAGE_KEYS.WORKFLOWS, filtered);
  return true;
};

// Snippet operations
export const getSnippets = () => {
  return loadFromStorage(STORAGE_KEYS.SNIPPETS);
};

export const getSnippet = (id) => {
  const snippets = getSnippets();
  return snippets.find(s => s.id === id);
};

export const createSnippet = (snippet) => {
  const snippets = getSnippets();
  const newSnippet = {
    ...snippet,
    id: snippet.id || uuidv4(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  snippets.push(newSnippet);
  saveToStorage(STORAGE_KEYS.SNIPPETS, snippets);
  return newSnippet;
};

export const updateSnippet = (id, updates) => {
  const snippets = getSnippets();
  const index = snippets.findIndex(s => s.id === id);
  if (index !== -1) {
    snippets[index] = {
      ...snippets[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    saveToStorage(STORAGE_KEYS.SNIPPETS, snippets);
    return snippets[index];
  }
  return null;
};

export const deleteSnippet = (id) => {
  const snippets = getSnippets();
  const filtered = snippets.filter(s => s.id !== id);
  saveToStorage(STORAGE_KEYS.SNIPPETS, filtered);
  return true;
};

// Folder operations
export const getFolders = () => {
  return loadFromStorage(STORAGE_KEYS.FOLDERS);
};

export const getFolder = (id) => {
  const folders = getFolders();
  return folders.find(f => f.id === id);
};

export const createFolder = (folder) => {
  const folders = getFolders();
  const newFolder = {
    ...folder,
    id: folder.id || uuidv4(),
    sortOrder: folder.sortOrder || folders.length,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  folders.push(newFolder);
  saveToStorage(STORAGE_KEYS.FOLDERS, folders);
  return newFolder;
};

export const updateFolder = (id, updates) => {
  // Special handling for root folder
  if (id === 'root') {
    return updateRootFolder(updates);
  }
  
  const folders = getFolders();
  const index = folders.findIndex(f => f.id === id);
  if (index !== -1) {
    folders[index] = {
      ...folders[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    saveToStorage(STORAGE_KEYS.FOLDERS, folders);
    return folders[index];
  }
  return null;
};

export const deleteFolder = (id) => {
  const folders = getFolders();
  const filtered = folders.filter(f => f.id !== id);
  saveToStorage(STORAGE_KEYS.FOLDERS, filtered);
  
  // Also remove folder references from items
  const templates = getTemplates();
  const workflows = getWorkflows();
  const snippets = getSnippets();
  
  templates.forEach(t => {
    if (t.folderId === id) t.folderId = null;
    if (t.folderIds) t.folderIds = t.folderIds.filter(fid => fid !== id);
  });
  
  workflows.forEach(w => {
    if (w.folderId === id) w.folderId = null;
    if (w.folderIds) w.folderIds = w.folderIds.filter(fid => fid !== id);
  });
  
  snippets.forEach(s => {
    if (s.folderId === id) s.folderId = null;
    if (s.folderIds) s.folderIds = s.folderIds.filter(fid => fid !== id);
  });
  
  saveToStorage(STORAGE_KEYS.TEMPLATES, templates);
  saveToStorage(STORAGE_KEYS.WORKFLOWS, workflows);
  saveToStorage(STORAGE_KEYS.SNIPPETS, snippets);
  
  return true;
};

export const updateFolderSortOrders = (updates) => {
  const folders = getFolders();
  updates.forEach(update => {
    const folder = folders.find(f => f.id === update.id);
    if (folder) {
      folder.sortOrder = update.sort_order;
      folder.sort_order = update.sort_order;
    }
  });
  saveToStorage(STORAGE_KEYS.FOLDERS, folders);
  return folders;
};

// Todo operations
export const getTodos = () => {
  return loadFromStorage(STORAGE_KEYS.TODOS);
};

export const getTodo = (id) => {
  const todos = getTodos();
  return todos.find(t => t.id === id);
};

export const createTodo = (todo) => {
  const todos = getTodos();
  const newTodo = {
    ...todo,
    id: todo.id || Date.now(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  todos.push(newTodo);
  saveToStorage(STORAGE_KEYS.TODOS, todos);
  return newTodo;
};

export const updateTodo = (id, updates) => {
  const todos = getTodos();
  const index = todos.findIndex(t => t.id === id);
  if (index !== -1) {
    todos[index] = {
      ...todos[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    saveToStorage(STORAGE_KEYS.TODOS, todos);
    return todos[index];
  }
  return null;
};

export const deleteTodo = (id) => {
  const todos = getTodos();
  const filtered = todos.filter(t => t.id !== id);
  saveToStorage(STORAGE_KEYS.TODOS, filtered);
  return true;
};

// UI State operations
export const getFolderUIState = () => {
  return loadFromStorage(STORAGE_KEYS.FOLDER_UI_STATE, {});
};

export const updateFolderUIState = (folderId, isExpanded) => {
  const state = getFolderUIState();
  state[folderId] = { isExpanded, updatedAt: new Date().toISOString() };
  saveToStorage(STORAGE_KEYS.FOLDER_UI_STATE, state);
  return state[folderId];
};

export const getHeaderUIState = () => {
  return loadFromStorage(STORAGE_KEYS.HEADER_UI_STATE, {});
};

export const updateHeaderUIState = (folderId, headerType, isExpanded) => {
  const state = getHeaderUIState();
  if (!state[folderId]) state[folderId] = {};
  state[folderId][headerType] = { isExpanded, updatedAt: new Date().toISOString() };
  saveToStorage(STORAGE_KEYS.HEADER_UI_STATE, state);
  return state[folderId][headerType];
};

// Folder favorite operations
export const toggleFolderFavorite = (entityType, entityId, folderId, isFavorite) => {
  let items;
  let storageKey;
  
  switch (entityType) {
    case 'template':
      items = getTemplates();
      storageKey = STORAGE_KEYS.TEMPLATES;
      break;
    case 'workflow':
      items = getWorkflows();
      storageKey = STORAGE_KEYS.WORKFLOWS;
      break;
    case 'snippet':
      items = getSnippets();
      storageKey = STORAGE_KEYS.SNIPPETS;
      break;
    default:
      return null;
  }
  
  const item = items.find(i => i.id === entityId);
  if (item) {
    if (!item.folderFavorites) item.folderFavorites = {};
    
    if (isFavorite) {
      item.folderFavorites[folderId] = {
        favoriteOrder: Date.now(),
        updatedAt: new Date().toISOString()
      };
    } else {
      delete item.folderFavorites[folderId];
    }
    
    saveToStorage(storageKey, items);
    return item;
  }
  
  return null;
};

// Folder favorites operations (for folder sidebar)
export const getFolderFavorites = () => {
  try {
    const favorites = loadFromStorage(STORAGE_KEYS.FOLDER_FAVORITES, []);
    return new Set(favorites);
  } catch (error) {
    console.error('Error loading folder favorites:', error);
    return new Set();
  }
};

export const saveFolderFavorites = (favoritesSet) => {
  try {
    const favoritesArray = Array.from(favoritesSet);
    return saveToStorage(STORAGE_KEYS.FOLDER_FAVORITES, favoritesArray);
  } catch (error) {
    console.error('Error saving folder favorites:', error);
    return false;
  }
};

export const toggleFolderFavoriteById = (folderId) => {
  try {
    const favorites = getFolderFavorites();
    
    if (favorites.has(folderId)) {
      favorites.delete(folderId);
    } else {
      favorites.add(folderId);
    }
    
    const success = saveFolderFavorites(favorites);
    return success ? favorites : null;
  } catch (error) {
    console.error('Error toggling folder favorite:', error);
    return null;
  }
};

// Create virtual Home folder object for unified architecture
export const createVirtualHomeFolder = () => {
  try {
    const rootData = getRootFolder();
    return {
      id: 'root',
      name: 'Home',
      icon: 'Home', // Special icon identifier
      parentId: null,
      sortOrder: -1, // Always first
      isSpecial: true, // Flag for special behavior restrictions
      description: rootData.description || '',
      createdAt: '2024-01-01T00:00:00.000Z', // Virtual creation date
      updatedAt: rootData.updatedAt || new Date().toISOString(),
      // Standard folder properties for consistency
      favorite: false, // Handled by favorites system
      folderFavorites: {},
      folderOrder: {}
    };
  } catch (error) {
    console.error('Error creating virtual home folder:', error);
    // Fallback minimal object
    return {
      id: 'root',
      name: 'Home',
      icon: 'Home',
      parentId: null,
      sortOrder: -1,
      isSpecial: true,
      description: '',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: new Date().toISOString(),
      favorite: false,
      folderFavorites: {},
      folderOrder: {}
    };
  }
};

// Get all folders including virtual Home folder for unified handling
export const getAllFoldersIncludingHome = () => {
  try {
    const regularFolders = getFolders();
    const homeFolder = createVirtualHomeFolder();
    
    // Return Home folder first, then regular folders sorted by their sortOrder
    return [homeFolder, ...regularFolders.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))];
  } catch (error) {
    console.error('Error getting all folders including home:', error);
    return [createVirtualHomeFolder()]; // Fallback to just home folder
  }
};

// Migration helper for legacy folder favorites
export const migrateLegacyFolderFavorites = () => {
  try {
    // Check if there's any legacy data to migrate
    const legacyKey = 'folder-favorites-legacy';
    const legacyData = localStorage.getItem(legacyKey);
    
    if (legacyData && !localStorage.getItem(STORAGE_KEYS.FOLDER_FAVORITES)) {
      console.log('🔄 Migrating legacy folder favorites...');
      const parsed = JSON.parse(legacyData);
      saveFolderFavorites(new Set(parsed));
      localStorage.removeItem(legacyKey);
      console.log('✅ Legacy folder favorites migrated');
    }
  } catch (error) {
    console.error('Error migrating legacy folder favorites:', error);
  }
};

// Clear all data
export const clearAllData = () => {
  Object.values(STORAGE_KEYS).forEach(key => {
    localStorage.removeItem(key);
  });
};

// Clear only folders data - for debugging placeholder issue
export const clearFoldersData = () => {
  localStorage.removeItem(STORAGE_KEYS.FOLDERS);
  localStorage.removeItem(STORAGE_KEYS.VERSION); // Force re-initialization
  console.log('🗑️ Cleared folders data from localStorage');
};

// Ensure all folders have sortOrder
export const ensureFoldersSortOrder = () => {
  try {
    const folders = loadFromStorage(STORAGE_KEYS.FOLDERS, []);
    let needsUpdate = false;
    
    // Group folders by parent
    const foldersByParent = {};
    folders.forEach(folder => {
      const parentId = folder.parentId || 'root';
      if (!foldersByParent[parentId]) {
        foldersByParent[parentId] = [];
      }
      foldersByParent[parentId].push(folder);
    });
    
    // Assign sortOrder to folders that don't have one
    Object.keys(foldersByParent).forEach(parentId => {
      const siblings = foldersByParent[parentId];
      siblings.forEach((folder, index) => {
        if (folder.sortOrder === undefined || folder.sortOrder === null) {
          folder.sortOrder = index;
          needsUpdate = true;
          console.log(`🔧 Assigned sortOrder ${index} to folder: ${folder.name}`);
        }
      });
    });
    
    if (needsUpdate) {
      saveToStorage(STORAGE_KEYS.FOLDERS, folders);
      console.log('✅ Updated folders with missing sortOrder values');
    }
    
    return folders;
  } catch (error) {
    console.error('Error ensuring folder sort orders:', error);
    return loadFromStorage(STORAGE_KEYS.FOLDERS, []);
  }
};

// Update folder sort orders
export const updateFoldersSortOrders = async (updates) => {
  try {
    const folders = loadFromStorage(STORAGE_KEYS.FOLDERS, []);
    
    // Update each folder's sortOrder
    updates.forEach(update => {
      const folderIndex = folders.findIndex(f => f.id === update.id);
      if (folderIndex !== -1) {
        // Handle both sortOrder and sort_order for compatibility
        const newSortOrder = update.sortOrder ?? update.sort_order;
        folders[folderIndex].sortOrder = newSortOrder;
        folders[folderIndex].sort_order = newSortOrder; // Keep both fields in sync
        folders[folderIndex].updatedAt = new Date().toISOString();
        console.log(`💾 Updated folder ${folders[folderIndex].name} sortOrder to ${newSortOrder}`);
      }
    });
    
    // Save updated folders
    const success = saveToStorage(STORAGE_KEYS.FOLDERS, folders);
    
    return {
      success,
      data: success ? folders : null
    };
  } catch (error) {
    console.error('Error updating folder sort orders:', error);
    return {
      success: false,
      error: error.message
    };
  }
};