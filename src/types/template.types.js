// Template type definitions and utility functions

/**
 * Extract snippet variables from template content
 * @param {string} content - Template content with {{tagname}} placeholders
 * @returns {Object[]} Array of snippet variable objects
 */
export const extractSnippetVariables = (content) => {
  const snippetMatches = content.match(/\{\{([^}]+)\}\}/g);
  return snippetMatches ? snippetMatches.map(match => {
    const tag = match.match(/\{\{([^}]+)\}\}/)[1];
    return {
      type: 'snippet',
      tag,
      placeholder: match
    };
  }) : [];
};

/**
 * Extract regular variables from template content (excluding inserts)
 * @param {string} content - Template content with {variable} placeholders
 * @returns {string[]} Array of variable names
 */
export const extractVariables = (content) => {
  // First remove all double brace patterns from content to avoid conflicts
  let cleanContent = content;
  const doubleMatches = content.match(/\{\{([^}]+)\}\}/g) || [];
  doubleMatches.forEach(doubleMatch => {
    cleanContent = cleanContent.replace(doubleMatch, '');
  });
  
  // Then extract single brace patterns from the clean content
  const matches = cleanContent.match(/\{([^}]+)\}/g);
  if (!matches) return [];
  
  return [...new Set(matches.map(match => match.slice(1, -1)))];
};

/**
 * Extract all variables (both regular and snippet) from template content
 * @param {string} content - Template content
 * @returns {Object} Object with regular variables and snippet variables
 */
export const extractAllVariables = (content) => {
  return {
    variables: extractVariables(content),
    snippetVariables: extractSnippetVariables(content)
  };
};

/**
 * Create a new template with default values
 * @param {Object} data - Template data
 * @returns {Object} Complete template object
 */
export const createTemplate = (data = {}) => {
  const now = new Date().toISOString();
  const content = data.content || '';
  
  return {
    id: data.id || Date.now(),
    name: data.name || '',
    description: data.description || '',
    content,
    folderId: data.folderId || 'general',
    variables: data.variables || extractVariables(content),
    snippetTags: data.snippetTags || [],
    lastUsed: data.lastUsed || now,
    favorite: data.favorite || false,
    folderFavorites: data.folderFavorites || {}, // { [folderId]: { isFavorite: boolean, favoriteOrder: number } }
    folderOrder: data.folderOrder || {}, // { [folderId]: number } - voor algemene item volgorde per folder
    createdAt: data.createdAt || now,
    updatedAt: data.updatedAt || now
  };
};

/**
 * Create a new workflow step with template and snippet options
 * @param {Object} data - Step data
 * @returns {Object} Complete workflow step object
 */
export const createWorkflowStep = (data = {}) => {
  return {
    id: data.id || `step_${Date.now()}`,
    name: data.name || '',
    type: data.type || 'template', // 'template', 'info', 'insert', 'workflow'
    templateOptions: data.templateOptions || [], // For template steps
    snippetOptions: data.snippetOptions || [], // For snippet steps
    workflowOptions: data.workflowOptions || [], // For workflow steps
    selectedTemplateId: data.selectedTemplateId || null, // For execution
    selectedSnippetId: data.selectedSnippetId || null, // For execution
    selectedWorkflowId: data.selectedWorkflowId || null, // For execution
    variables: data.variables || [],
    content: data.content || '', // For info steps
    information: data.information || '', // Information text shown with any step type
    insertId: data.insertId || null, // For insert steps
    insertContent: data.insertContent || '', // For insert steps
    snippetTags: data.snippetTags || [] // Tags to filter snippets in this step
  };
};

/**
 * Create a new workflow with default values
 * @param {Object} data - Workflow data
 * @returns {Object} Complete workflow object
 */
export const createWorkflow = (data = {}) => {
  const now = new Date().toISOString();
  
  return {
    id: data.id || Date.now(),
    name: data.name || '',
    description: data.description || '',
    steps: data.steps || [],
    folderId: data.folderId || 'workflows',
    snippetTags: data.snippetTags || [],
    lastUsed: data.lastUsed || now,
    favorite: data.favorite || false,
    folderFavorites: data.folderFavorites || {}, // { [folderId]: { isFavorite: boolean, favoriteOrder: number } }
    folderOrder: data.folderOrder || {}, // { [folderId]: number } - voor algemene item volgorde per folder
    createdAt: data.createdAt || now,
    updatedAt: data.updatedAt || now
  };
};

/**
 * Create a new folder with default values
 * @param {Object} data - Folder data
 * @returns {Object} Complete folder object
 */
export const createFolder = (data = {}) => {
  const now = new Date().toISOString();
  
  return {
    id: data.id || Date.now(),
    name: data.name || '',
    parentId: data.parentId || null,
    type: 'folder',
    createdAt: data.createdAt || now,
    updatedAt: data.updatedAt || now
  };
};

/**
 * Default folder structure for the application
 */
export const DEFAULT_FOLDERS = [
  { id: 'root', name: 'Root', parentId: null },
  { id: 'general', name: 'Home', parentId: 'root' },
  { id: 'workshop', name: 'Workshop', parentId: 'root' }
];


/**
 * Template validation rules
 */
export const TEMPLATE_VALIDATION = {
  name: {
    required: true,
    minLength: 1,
    maxLength: 100
  },
  description: {
    required: false,
    maxLength: 500
  },
  content: {
    required: true,
    minLength: 1
  },
};

/**
 * Validate template data
 * @param {Object} template - Template to validate
 * @returns {Object} Validation result with isValid boolean and errors array
 */
export const validateTemplate = (template) => {
  const errors = [];
  
  if (!template.name || template.name.trim().length === 0) {
    errors.push('Template name is required');
  }
  
  if (template.name && template.name.length > TEMPLATE_VALIDATION.name.maxLength) {
    errors.push(`Template name must be less than ${TEMPLATE_VALIDATION.name.maxLength} characters`);
  }
  
  if (!template.content || template.content.trim().length === 0) {
    errors.push('Template content is required');
  }
  
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Create a new snippet with default values (replaces both addons and inserts)
 * @param {Object} data - Snippet data
 * @returns {Object} Complete snippet object
 */
export const createSnippet = (data = {}) => {
  const now = new Date().toISOString();
  
  return {
    id: data.id || crypto.randomUUID(),
    name: data.name || '',
    description: data.description || '',
    content: data.content || '',
    tags: data.tags || [],
    favorite: data.favorite || false, // API expects favorite field
    folder_id: data.folder_id || null, // API uses folder_id not folderId
    folderId: data.folderId || 'moods', // Keep for backwards compatibility
    enabled: data.enabled !== undefined ? data.enabled : true,
    folderFavorites: data.folderFavorites || {}, // { [folderId]: { isFavorite: boolean, favoriteOrder: number } }
    folderOrder: data.folderOrder || {}, // { [folderId]: number } - voor algemene item volgorde per folder
    created_at: data.created_at || now, // API uses snake_case
    updated_at: data.updated_at || now, // API uses snake_case
    createdAt: data.createdAt || now, // Keep for backwards compatibility
    updatedAt: data.updatedAt || now // Keep for backwards compatibility
  };
};

/**
 * Snippet validation rules (unified for both addon and insert functionality)
 */
export const SNIPPET_VALIDATION = {
  name: {
    required: true,
    minLength: 1,
    maxLength: 100
  },
  description: {
    required: false,
    maxLength: 500
  },
  content: {
    required: true,
    minLength: 1
  },
  tags: {
    required: true,
    minLength: 1
  },
};

/**
 * Validate snippet data (unified validation for addon and insert functionality)
 * @param {Object} snippet - Snippet to validate
 * @returns {Object} Validation result with isValid boolean and errors array
 */
export const validateSnippet = (snippet) => {
  const errors = [];
  
  if (!snippet.name || snippet.name.trim().length === 0) {
    errors.push('Snippet name is required');
  }
  
  if (snippet.name && snippet.name.length > SNIPPET_VALIDATION.name.maxLength) {
    errors.push(`Snippet name must be less than ${SNIPPET_VALIDATION.name.maxLength} characters`);
  }
  
  if (!snippet.content || snippet.content.trim().length === 0) {
    errors.push('Snippet content is required');
  }
  
  if (snippet.description && snippet.description.length > SNIPPET_VALIDATION.description.maxLength) {
    errors.push(`Snippet description must be less than ${SNIPPET_VALIDATION.description.maxLength} characters`);
  }
  
  if (!snippet.tags || !Array.isArray(snippet.tags) || snippet.tags.length === 0) {
    errors.push('At least one tag is required');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Create a new addon with default values
 * @param {Object} data - Addon data
 * @returns {Object} Complete addon object
 */
export const createAddon = (data = {}) => {
  const now = new Date().toISOString();
  
  return {
    id: data.id || Date.now(),
    name: data.name || '',
    description: data.description || '',
    content: data.content || '',
    tags: data.tags || [],
    folderId: data.folderId || 'general',
    enabled: data.enabled !== undefined ? data.enabled : true,
    createdAt: data.createdAt || now,
    updatedAt: data.updatedAt || now
  };
};

/**
 * Addon validation rules
 */
export const ADDON_VALIDATION = {
  name: {
    required: true,
    minLength: 1,
    maxLength: 100
  },
  description: {
    required: false,
    maxLength: 500
  },
  content: {
    required: true,
    minLength: 1
  },
  tags: {
    required: true,
    minLength: 1
  },
};

/**
 * Validate addon data
 * @param {Object} addon - Addon to validate
 * @returns {Object} Validation result with isValid boolean and errors array
 */
export const validateAddon = (addon) => {
  const errors = [];
  
  if (!addon.name || addon.name.trim().length === 0) {
    errors.push('Addon name is required');
  }
  
  if (addon.name && addon.name.length > ADDON_VALIDATION.name.maxLength) {
    errors.push(`Addon name must be less than ${ADDON_VALIDATION.name.maxLength} characters`);
  }
  
  if (!addon.content || addon.content.trim().length === 0) {
    errors.push('Addon content is required');
  }
  
  if (addon.description && addon.description.length > ADDON_VALIDATION.description.maxLength) {
    errors.push(`Addon description must be less than ${ADDON_VALIDATION.description.maxLength} characters`);
  }
  
  if (!addon.tags || !Array.isArray(addon.tags) || addon.tags.length === 0) {
    errors.push('At least one tag is required');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// ====================================
// FOLDER-SPECIFIC FAVORITES SYSTEM
// ====================================

/**
 * Get all favorite items from a specific folder
 * @param {Array} items - Array of templates, workflows, or snippets
 * @param {string} folderId - Folder ID to filter by
 * @returns {Array} Sorted array of favorite items
 */
export const getFolderFavorites = (items, folderId) => {
  return items.filter(item => 
    item.folderFavorites?.[folderId]?.isFavorite === true
  ).sort((a, b) => 
    (a.folderFavorites?.[folderId]?.favoriteOrder || 0) - 
    (b.folderFavorites?.[folderId]?.favoriteOrder || 0)
  );
};

/**
 * Get all items from a specific folder sorted by their folder order
 * @param {Array} items - Array of templates, workflows, or snippets
 * @param {string} folderId - Folder ID to filter by
 * @returns {Array} Sorted array of folder items
 */
export const getFolderItems = (items, folderId) => {
  return items.filter(item => item.folderId === folderId)
    .sort((a, b) => 
      (a.folderOrder?.[folderId] || 0) - (b.folderOrder?.[folderId] || 0)
    );
};

/**
 * Update the folder order for a specific item
 * @param {Object} item - Item to update
 * @param {string} folderId - Folder ID
 * @param {number} newOrder - New order position
 * @returns {Object} Updated item
 */
export const updateItemFolderOrder = (item, folderId, newOrder) => {
  return {
    ...item,
    folderOrder: {
      ...item.folderOrder,
      [folderId]: newOrder
    }
  };
};

/**
 * Toggle favorite status for an item in a specific folder
 * @param {Object} item - Item to update
 * @param {string} folderId - Folder ID
 * @returns {Object} Updated item
 */
export const toggleFolderFavorite = (item, folderId) => {
  const currentFavorite = item.folderFavorites?.[folderId];
  const isFavorite = !currentFavorite?.isFavorite;
  
  return {
    ...item,
    folderFavorites: {
      ...item.folderFavorites,
      [folderId]: {
        isFavorite,
        favoriteOrder: currentFavorite?.favoriteOrder || 0
      }
    }
  };
};

/**
 * Update favorite order for an item in a specific folder
 * @param {Object} item - Item to update
 * @param {string} folderId - Folder ID
 * @param {number} newOrder - New favorite order position
 * @returns {Object} Updated item
 */
export const updateFolderFavoriteOrder = (item, folderId, newOrder) => {
  const currentFavorite = item.folderFavorites?.[folderId];
  
  return {
    ...item,
    folderFavorites: {
      ...item.folderFavorites,
      [folderId]: {
        isFavorite: currentFavorite?.isFavorite || false,
        favoriteOrder: newOrder
      }
    }
  };
};

/**
 * Migration helper to convert from old global favorites to folder-specific favorites
 * @param {Array} items - Array of items to migrate
 * @returns {Array} Migrated items
 */
export const migrateToFolderSystem = (items) => {
  return items.map(item => ({
    ...item,
    folderFavorites: item.folderFavorites || {},
    folderOrder: item.folderOrder || {},
    // Migrate old global favorite to folder-specific (for current folder)
    ...(item.favorite && {
      folderFavorites: {
        ...item.folderFavorites,
        [item.folderId || 'general']: {
          isFavorite: true,
          favoriteOrder: 0
        }
      }
    })
  }));
};

/**
 * Check if an item is favorite in a specific folder
 * @param {Object} item - Item to check
 * @param {string} folderId - Folder ID
 * @returns {boolean} True if item is favorite in folder
 */
export const isItemFavoriteInFolder = (item, folderId) => {
  return item.folderFavorites?.[folderId]?.isFavorite === true;
};
