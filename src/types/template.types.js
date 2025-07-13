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
    category: data.category || 'General',
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
    category: data.category || 'General',
    lastUsed: data.lastUsed || now,
    favorite: data.favorite || false,
    createdAt: data.createdAt || now,
    updatedAt: data.updatedAt || now
  };
};

/**
 * Default categories for templates and workflows
 */
export const DEFAULT_CATEGORIES = [
  'General',
  'Content Creation',
  'Development',
  'Analysis',
  'Marketing',
  'Research',
  'Documentation',
  'Planning',
  'Communication'
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
  category: {
    required: true,
    allowedValues: DEFAULT_CATEGORIES
  }
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
  
  if (!template.category || !DEFAULT_CATEGORIES.includes(template.category)) {
    errors.push('Valid category is required');
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
    category: data.category || 'General',
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
  category: {
    required: true,
    allowedValues: DEFAULT_CATEGORIES
  }
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
  
  if (!snippet.category || !DEFAULT_CATEGORIES.includes(snippet.category)) {
    errors.push('Valid category is required');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};
