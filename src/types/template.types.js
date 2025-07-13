// Template type definitions and utility functions

/**
 * Extract insert variables from template content
 * @param {string} content - Template content with {insert:tagname} placeholders
 * @returns {Object[]} Array of insert variable objects
 */
export const extractSnippetVariables = (content) => {
  const insertMatches = content.match(/\{insert:([^}]+)\}/g);
  return insertMatches ? insertMatches.map(match => {
    const tag = match.match(/\{insert:([^}]+)\}/)[1];
    return {
      type: 'insert',
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
  const matches = content.match(/\{([^}]+)\}/g);
  if (!matches) return [];
  
  // Filter out insert variables
  return matches
    .map(match => match.slice(1, -1))
    .filter(variable => !variable.startsWith('insert:'));
};

/**
 * Extract all variables (both regular and insert) from template content
 * @param {string} content - Template content
 * @returns {Object} Object with regular variables and insert variables
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
    lastUsed: data.lastUsed || now,
    favorite: data.favorite || false,
    createdAt: data.createdAt || now,
    updatedAt: data.updatedAt || now
  };
};

/**
 * Create a new workflow step with template options
 * @param {Object} data - Step data
 * @returns {Object} Complete workflow step object
 */
export const createWorkflowStep = (data = {}) => {
  return {
    id: data.id || `step_${Date.now()}`,
    name: data.name || '',
    type: data.type || 'template', // 'template', 'info', 'insert'
    templateOptions: data.templateOptions || [], // For template steps
    selectedTemplateId: data.selectedTemplateId || null, // For execution
    variables: data.variables || [],
    content: data.content || '', // For info steps
    insertId: data.insertId || null, // For insert steps
    insertContent: data.insertContent || '' // For insert steps
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
    lastUsed: data.lastUsed || now,
    favorite: data.favorite || false,
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
  { id: 'general', name: 'General', parentId: 'root' },
  { id: 'content', name: 'Content', parentId: 'general' },
  { id: 'moods', name: 'Moods', parentId: 'general' },
  { id: 'workflows', name: 'Common Workflows', parentId: 'general' },
  { id: 'projects', name: 'Projects', parentId: 'root' },
  { id: 'archive', name: 'Archive', parentId: 'root' }
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
 * Create a new snippet with default values
 * @param {Object} data - Snippet data
 * @returns {Object} Complete snippet object
 */
export const createSnippet = (data = {}) => {
  const now = new Date().toISOString();
  
  return {
    id: data.id || Date.now(),
    name: data.name || '',
    content: data.content || '',
    tags: data.tags || [],
    folderId: data.folderId || 'moods',
    createdAt: data.createdAt || now,
    updatedAt: data.updatedAt || now
  };
};

/**
 * Snippet validation rules
 */
export const SNIPPET_VALIDATION = {
  name: {
    required: true,
    minLength: 1,
    maxLength: 100
  },
  content: {
    required: true,
    minLength: 1
  },
};

/**
 * Validate snippet data
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
  
  
  return {
    isValid: errors.length === 0,
    errors
  };
};
