// Template type definitions and utility functions

/**
 * Extract variables from template content
 * @param {string} content - Template content with {variable} placeholders
 * @returns {string[]} Array of variable names
 */
export const extractVariables = (content) => {
  const matches = content.match(/\{([^}]+)\}/g);
  return matches ? matches.map(match => match.slice(1, -1)) : [];
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
    templateOptions: data.templateOptions || [], // Array of template objects for choice
    selectedTemplateId: data.selectedTemplateId || null, // For execution
    variables: data.variables || []
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
