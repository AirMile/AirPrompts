/**
 * Validation Utilities
 * 
 * Provides validation functions for API data structures
 * Ensures data integrity and type safety
 */

/**
 * Validation error class
 */
export class ValidationError extends Error {
  constructor(field, message, value = undefined) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
    this.value = value;
  }
}

/**
 * Validation result
 * @typedef {Object} ValidationResult
 * @property {boolean} valid - Whether validation passed
 * @property {ValidationError[]} errors - Array of validation errors
 */

/**
 * Base validators
 */
const validators = {
  required: (value, field) => {
    if (value === null || value === undefined || value === '') {
      throw new ValidationError(field, `${field} is required`, value);
    }
  },

  string: (value, field, options = {}) => {
    if (typeof value !== 'string') {
      throw new ValidationError(field, `${field} must be a string`, value);
    }
    
    if (options.minLength && value.length < options.minLength) {
      throw new ValidationError(field, `${field} must be at least ${options.minLength} characters`, value);
    }
    
    if (options.maxLength && value.length > options.maxLength) {
      throw new ValidationError(field, `${field} must be at most ${options.maxLength} characters`, value);
    }
    
    if (options.pattern && !options.pattern.test(value)) {
      throw new ValidationError(field, `${field} has invalid format`, value);
    }
  },

  number: (value, field, options = {}) => {
    if (typeof value !== 'number' || isNaN(value)) {
      throw new ValidationError(field, `${field} must be a number`, value);
    }
    
    if (options.min !== undefined && value < options.min) {
      throw new ValidationError(field, `${field} must be at least ${options.min}`, value);
    }
    
    if (options.max !== undefined && value > options.max) {
      throw new ValidationError(field, `${field} must be at most ${options.max}`, value);
    }
  },

  boolean: (value, field) => {
    if (typeof value !== 'boolean') {
      throw new ValidationError(field, `${field} must be a boolean`, value);
    }
  },

  array: (value, field, options = {}) => {
    if (!Array.isArray(value)) {
      throw new ValidationError(field, `${field} must be an array`, value);
    }
    
    if (options.minLength && value.length < options.minLength) {
      throw new ValidationError(field, `${field} must have at least ${options.minLength} items`, value);
    }
    
    if (options.maxLength && value.length > options.maxLength) {
      throw new ValidationError(field, `${field} must have at most ${options.maxLength} items`, value);
    }
    
    if (options.itemValidator) {
      value.forEach((item, index) => {
        try {
          options.itemValidator(item, `${field}[${index}]`);
        } catch (error) {
          throw new ValidationError(`${field}[${index}]`, error.message, item);
        }
      });
    }
  },

  enum: (value, field, allowedValues) => {
    if (!allowedValues.includes(value)) {
      throw new ValidationError(
        field, 
        `${field} must be one of: ${allowedValues.join(', ')}`, 
        value
      );
    }
  },

  uuid: (value, field) => {
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidPattern.test(value)) {
      throw new ValidationError(field, `${field} must be a valid UUID`, value);
    }
  },

  isoDate: (value, field) => {
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      throw new ValidationError(field, `${field} must be a valid ISO date`, value);
    }
  },

  email: (value, field) => {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(value)) {
      throw new ValidationError(field, `${field} must be a valid email`, value);
    }
  },

  hexColor: (value, field) => {
    const hexPattern = /^#[0-9A-F]{6}$/i;
    if (!hexPattern.test(value)) {
      throw new ValidationError(field, `${field} must be a valid hex color`, value);
    }
  }
};

/**
 * Entity validators
 */
export const validateBaseEntity = (entity) => {
  const errors = [];
  
  try {
    validators.required(entity.id, 'id');
    validators.uuid(entity.id, 'id');
    
    validators.required(entity.name, 'name');
    validators.string(entity.name, 'name', { minLength: 1, maxLength: 100 });
    
    if (entity.description !== undefined) {
      validators.string(entity.description, 'description', { maxLength: 500 });
    }
    
    validators.required(entity.favorite, 'favorite');
    validators.boolean(entity.favorite, 'favorite');
    
    validators.required(entity.createdAt, 'createdAt');
    validators.isoDate(entity.createdAt, 'createdAt');
    
    validators.required(entity.updatedAt, 'updatedAt');
    validators.isoDate(entity.updatedAt, 'updatedAt');
  } catch (error) {
    if (error instanceof ValidationError) {
      errors.push(error);
    } else {
      throw error;
    }
  }
  
  return { valid: errors.length === 0, errors };
};

export const validateTemplate = (template) => {
  const baseValidation = validateBaseEntity(template);
  const errors = [...baseValidation.errors];
  
  try {
    validators.required(template.content, 'content');
    validators.string(template.content, 'content', { maxLength: 10000 });
    
    validators.required(template.variables, 'variables');
    validators.array(template.variables, 'variables', {
      itemValidator: (item, field) => validators.string(item, field)
    });
    
    validators.required(template.category, 'category');
    validators.enum(template.category, 'category', [
      'general', 'business', 'technical', 'creative', 
      'personal', 'education', 'marketing', 'other'
    ]);
    
    if (template.tags) {
      validators.array(template.tags, 'tags', {
        itemValidator: (item, field) => validators.string(item, field, { maxLength: 50 })
      });
    }
    
    if (template.folderIds) {
      validators.array(template.folderIds, 'folderIds', {
        itemValidator: (item, field) => validators.uuid(item, field)
      });
    }
  } catch (error) {
    if (error instanceof ValidationError) {
      errors.push(error);
    } else {
      throw error;
    }
  }
  
  return { valid: errors.length === 0, errors };
};

export const validateWorkflow = (workflow) => {
  const baseValidation = validateBaseEntity(workflow);
  const errors = [...baseValidation.errors];
  
  try {
    validators.required(workflow.steps, 'steps');
    validators.array(workflow.steps, 'steps', {
      minLength: 1,
      itemValidator: (step, field) => {
        validators.required(step.id, `${field}.id`);
        validators.uuid(step.id, `${field}.id`);
        
        validators.required(step.templateId, `${field}.templateId`);
        validators.uuid(step.templateId, `${field}.templateId`);
        
        validators.required(step.order, `${field}.order`);
        validators.number(step.order, `${field}.order`, { min: 0 });
      }
    });
    
    validators.required(workflow.category, 'category');
    validators.enum(workflow.category, 'category', [
      'automation', 'process', 'analysis', 
      'generation', 'transformation', 'other'
    ]);
  } catch (error) {
    if (error instanceof ValidationError) {
      errors.push(error);
    } else {
      throw error;
    }
  }
  
  return { valid: errors.length === 0, errors };
};

export const validateSnippet = (snippet) => {
  const baseValidation = validateBaseEntity(snippet);
  const errors = [...baseValidation.errors];
  
  try {
    validators.required(snippet.content, 'content');
    validators.string(snippet.content, 'content', { maxLength: 50000 });
    
    validators.required(snippet.language, 'language');
    validators.string(snippet.language, 'language', { minLength: 1, maxLength: 50 });
    
    validators.required(snippet.category, 'category');
    validators.enum(snippet.category, 'category', [
      'code', 'query', 'config', 'script', 'command', 'other'
    ]);
  } catch (error) {
    if (error instanceof ValidationError) {
      errors.push(error);
    } else {
      throw error;
    }
  }
  
  return { valid: errors.length === 0, errors };
};

export const validateFolder = (folder) => {
  const baseValidation = validateBaseEntity(folder);
  const errors = [...baseValidation.errors];
  
  try {
    if (folder.parentId !== null && folder.parentId !== undefined) {
      validators.uuid(folder.parentId, 'parentId');
    }
    
    validators.required(folder.childIds, 'childIds');
    validators.array(folder.childIds, 'childIds', {
      itemValidator: (item, field) => validators.uuid(item, field)
    });
    
    validators.required(folder.color, 'color');
    validators.hexColor(folder.color, 'color');
    
    validators.required(folder.itemCount, 'itemCount');
    validators.number(folder.itemCount, 'itemCount', { min: 0 });
    
    if (folder.permissions) {
      validators.boolean(folder.permissions.canEdit, 'permissions.canEdit');
      validators.boolean(folder.permissions.canDelete, 'permissions.canDelete');
      validators.boolean(folder.permissions.canShare, 'permissions.canShare');
      validators.boolean(folder.permissions.canAddItems, 'permissions.canAddItems');
    }
  } catch (error) {
    if (error instanceof ValidationError) {
      errors.push(error);
    } else {
      throw error;
    }
  }
  
  return { valid: errors.length === 0, errors };
};

/**
 * Validate search query
 */
export const validateSearchQuery = (query) => {
  const errors = [];
  
  try {
    if (query.q !== undefined) {
      validators.string(query.q, 'q', { maxLength: 200 });
    }
    
    if (query.types) {
      validators.array(query.types, 'types', {
        itemValidator: (item, field) => 
          validators.enum(item, field, ['template', 'workflow', 'snippet'])
      });
    }
    
    if (query.limit !== undefined) {
      validators.number(query.limit, 'limit', { min: 1, max: 100 });
    }
    
    if (query.offset !== undefined) {
      validators.number(query.offset, 'offset', { min: 0 });
    }
  } catch (error) {
    if (error instanceof ValidationError) {
      errors.push(error);
    } else {
      throw error;
    }
  }
  
  return { valid: errors.length === 0, errors };
};

/**
 * Validate execution context
 */
export const validateExecutionContext = (context) => {
  const errors = [];
  
  try {
    validators.required(context.itemId, 'itemId');
    validators.uuid(context.itemId, 'itemId');
    
    validators.required(context.itemType, 'itemType');
    validators.enum(context.itemType, 'itemType', ['template', 'workflow', 'snippet']);
    
    validators.required(context.variables, 'variables');
    if (typeof context.variables !== 'object' || context.variables === null) {
      throw new ValidationError('variables', 'variables must be an object');
    }
    
    validators.required(context.mode, 'mode');
    validators.enum(context.mode, 'mode', ['interactive', 'batch', 'api', 'test']);
  } catch (error) {
    if (error instanceof ValidationError) {
      errors.push(error);
    } else {
      throw error;
    }
  }
  
  return { valid: errors.length === 0, errors };
};

/**
 * Sanitize user input
 */
export const sanitizeInput = (input, type = 'text') => {
  if (typeof input !== 'string') return input;
  
  // Remove null bytes
  let sanitized = input.replace(/\0/g, '');
  
  switch (type) {
    case 'text':
      // Basic text sanitization
      sanitized = sanitized.trim();
      break;
      
    case 'html':
      // Remove potentially dangerous HTML
      sanitized = sanitized
        .replace(/<script[^>]*>.*?<\/script>/gi, '')
        .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '');
      break;
      
    case 'filename':
      // Sanitize for filesystem
      sanitized = sanitized.replace(/[<>:"/\\|?*]/g, '-');
      break;
      
    case 'id':
      // Allow only alphanumeric, dash, underscore
      sanitized = sanitized.replace(/[^a-zA-Z0-9-_]/g, '');
      break;
  }
  
  return sanitized;
};

/**
 * Validate and sanitize a complete entity
 */
export const validateAndSanitize = (entity, type) => {
  // Sanitize string fields
  const sanitized = { ...entity };
  
  if (sanitized.name) {
    sanitized.name = sanitizeInput(sanitized.name);
  }
  
  if (sanitized.description) {
    sanitized.description = sanitizeInput(sanitized.description);
  }
  
  if (sanitized.content) {
    sanitized.content = sanitizeInput(sanitized.content, 'text');
  }
  
  // Validate based on type
  let validation;
  switch (type) {
    case 'template':
      validation = validateTemplate(sanitized);
      break;
    case 'workflow':
      validation = validateWorkflow(sanitized);
      break;
    case 'snippet':
      validation = validateSnippet(sanitized);
      break;
    case 'folder':
      validation = validateFolder(sanitized);
      break;
    default:
      validation = validateBaseEntity(sanitized);
  }
  
  if (validation.valid) {
    return { valid: true, data: sanitized };
  } else {
    return { valid: false, errors: validation.errors };
  }
};