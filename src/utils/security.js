import DOMPurify from 'dompurify';

/**
 * Security utilities for input validation and sanitization
 */

/**
 * Sanitize HTML content to prevent XSS attacks
 * @param {string} dirty - The potentially dangerous HTML string
 * @param {Object} options - DOMPurify options
 * @returns {string} - Sanitized HTML string
 */
export function sanitizeHtml(dirty, options = {}) {
  const defaultOptions = {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'br', 'p', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
    ALLOW_DATA_ATTR: false,
    RETURN_DOM: false,
    RETURN_DOM_FRAGMENT: false,
    RETURN_DOM_IMPORT: false,
    FORCE_BODY: true,
    SANITIZE_DOM: true,
    KEEP_CONTENT: true,
    IN_PLACE: false
  };
  
  return DOMPurify.sanitize(dirty, { ...defaultOptions, ...options });
}

/**
 * Sanitize plain text input (removes all HTML)
 * @param {string} input - The input string
 * @returns {string} - Plain text without HTML
 */
export function sanitizeText(input) {
  if (typeof input !== 'string') return '';
  
  // Remove all HTML tags
  const text = DOMPurify.sanitize(input, { ALLOWED_TAGS: [] });
  
  // Additional sanitization for special characters
  return text
    .replace(/[<>]/g, '') // Remove any remaining angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .trim();
}

/**
 * Validate and sanitize variable names
 * @param {string} variable - The variable name
 * @returns {string} - Sanitized variable name
 */
export function sanitizeVariableName(variable) {
  if (typeof variable !== 'string') return '';
  
  // Only allow alphanumeric, underscore, and dash
  return variable
    .replace(/[^a-zA-Z0-9_-]/g, '')
    .substring(0, 50); // Limit length
}

/**
 * Validate template content for security issues
 * @param {string} content - The template content
 * @returns {Object} - Validation result
 */
export function validateTemplateContent(content) {
  const issues = [];
  
  // Check for script tags
  if (/<script[^>]*>[\s\S]*?<\/script>/gi.test(content)) {
    issues.push('Script tags are not allowed in templates');
  }
  
  // Check for event handlers
  if (/on\w+\s*=/gi.test(content)) {
    issues.push('Event handlers are not allowed in templates');
  }
  
  // Check for javascript: protocol
  if (/javascript:/gi.test(content)) {
    issues.push('JavaScript protocol is not allowed');
  }
  
  // Check for data: protocol (can be used for XSS)
  if (/data:text\/html/gi.test(content)) {
    issues.push('Data URI with HTML content is not allowed');
  }
  
  return {
    isValid: issues.length === 0,
    issues
  };
}

/**
 * Escape special characters for display
 * @param {string} str - The string to escape
 * @returns {string} - Escaped string
 */
export function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  
  const escapeMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    '/': '&#x2F;'
  };
  
  return str.replace(/[&<>"'/]/g, char => escapeMap[char]);
}

/**
 * Validate input length
 * @param {string} input - The input to validate
 * @param {number} maxLength - Maximum allowed length
 * @returns {boolean} - Whether input is valid
 */
export function validateLength(input, maxLength) {
  if (typeof input !== 'string') return false;
  return input.length <= maxLength;
}

/**
 * Validate and sanitize file paths
 * @param {string} path - The file path
 * @returns {string} - Sanitized path or empty string if invalid
 */
export function sanitizePath(path) {
  if (typeof path !== 'string') return '';
  
  // Remove path traversal attempts
  const sanitized = path
    .replace(/\.\./g, '')
    .replace(/[\\\/]+/g, '/')
    .replace(/^[\\\/]+/, '')
    .replace(/[\\\/]+$/, '');
  
  // Only allow safe characters
  if (!/^[a-zA-Z0-9_\-./]+$/.test(sanitized)) {
    return '';
  }
  
  return sanitized;
}

/**
 * Validate JSON structure to prevent prototype pollution
 * @param {Object} obj - The object to validate
 * @returns {boolean} - Whether object is safe
 */
export function validateJsonStructure(obj) {
  const dangerous = ['__proto__', 'constructor', 'prototype'];
  
  function checkObject(o) {
    if (o === null || typeof o !== 'object') return true;
    
    for (const key in o) {
      if (dangerous.includes(key)) return false;
      if (!checkObject(o[key])) return false;
    }
    
    return true;
  }
  
  return checkObject(obj);
}

/**
 * Sanitize user input for safe display
 * @param {string} input - User input
 * @param {Object} options - Sanitization options
 * @returns {string} - Sanitized input
 */
export function sanitizeUserInput(input, options = {}) {
  const {
    maxLength = 10000,
    allowHtml = false,
    allowVariables = true
  } = options;
  
  if (typeof input !== 'string') return '';
  
  // Truncate to max length
  let sanitized = input.substring(0, maxLength);
  
  if (allowHtml) {
    sanitized = sanitizeHtml(sanitized);
  } else {
    sanitized = sanitizeText(sanitized);
  }
  
  // Preserve template variables if allowed
  if (allowVariables) {
    // Re-add properly formatted variables
    const variablePattern = /\{([a-zA-Z0-9_-]+)\}/g;
    const variables = input.match(variablePattern) || [];
    
    variables.forEach(variable => {
      const varName = variable.slice(1, -1);
      const sanitizedVar = sanitizeVariableName(varName);
      if (sanitizedVar) {
        sanitized = sanitized.replace(
          new RegExp(escapeRegex(variable), 'g'),
          `{${sanitizedVar}}`
        );
      }
    });
  }
  
  return sanitized;
}

/**
 * Escape string for use in regex
 * @param {string} str - String to escape
 * @returns {string} - Escaped string
 */
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Validate email address
 * @param {string} email - Email to validate
 * @returns {boolean} - Whether email is valid
 */
export function validateEmail(email) {
  if (typeof email !== 'string') return false;
  
  // Basic email validation
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email) && email.length <= 254;
}

/**
 * Generate CSRF token
 * @returns {string} - CSRF token
 */
export function generateCSRFToken() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Validate CSRF token
 * @param {string} token - Token to validate
 * @param {string} sessionToken - Session token to compare
 * @returns {boolean} - Whether token is valid
 */
export function validateCSRFToken(token, sessionToken) {
  if (!token || !sessionToken) return false;
  return token === sessionToken;
}

/**
 * Rate limit checker
 */
export class RateLimiter {
  constructor(maxRequests = 10, windowMs = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.requests = new Map();
  }
  
  check(identifier) {
    const now = Date.now();
    const requests = this.requests.get(identifier) || [];
    
    // Remove old requests
    const validRequests = requests.filter(time => now - time < this.windowMs);
    
    if (validRequests.length >= this.maxRequests) {
      return false;
    }
    
    validRequests.push(now);
    this.requests.set(identifier, validRequests);
    
    return true;
  }
  
  reset(identifier) {
    this.requests.delete(identifier);
  }
}