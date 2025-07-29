/**
 * DataValidator - Comprehensive data validation for migrations
 *
 * Features:
 * - Schema validation
 * - Type checking
 * - Data integrity verification
 * - Custom validation rules
 * - Detailed error reporting
 */
class DataValidator {
  constructor() {
    // Built-in validators
    this.validators = {
      required: this.validateRequired.bind(this),
      type: this.validateType.bind(this),
      minLength: this.validateMinLength.bind(this),
      maxLength: this.validateMaxLength.bind(this),
      pattern: this.validatePattern.bind(this),
      enum: this.validateEnum.bind(this),
      custom: this.validateCustom.bind(this),
    };

    // Common patterns
    this.patterns = {
      email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      url: /^https?:\/\/.+/,
      uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      iso8601: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/,
    };
  }

  /**
   * Validate data against schema
   */
  async validateData(type, data, schema) {
    const errors = [];

    // Handle array data
    if (Array.isArray(data)) {
      for (let i = 0; i < data.length; i++) {
        const itemErrors = await this.validateItem(data[i], schema, `[${i}]`);
        errors.push(...itemErrors);
      }
    } else {
      const itemErrors = await this.validateItem(data, schema, '');
      errors.push(...itemErrors);
    }

    return {
      valid: errors.length === 0,
      errors,
      summary: this.generateErrorSummary(errors),
    };
  }

  /**
   * Validate single item
   */
  async validateItem(item, schema, path = '') {
    const errors = [];

    if (!item || typeof item !== 'object') {
      errors.push({
        path,
        error: 'Item must be an object',
        value: item,
      });
      return errors;
    }

    // Check required fields
    if (schema.required) {
      for (const field of schema.required) {
        if (
          !Object.prototype.hasOwnProperty.call(item, field) ||
          item[field] === null ||
          item[field] === undefined
        ) {
          errors.push({
            path: `${path}.${field}`,
            error: 'Required field missing',
            field,
          });
        }
      }
    }

    // Validate field types
    if (schema.types) {
      for (const [field, expectedType] of Object.entries(schema.types)) {
        if (Object.prototype.hasOwnProperty.call(item, field)) {
          const typeErrors = this.validateFieldType(item[field], expectedType, `${path}.${field}`);
          errors.push(...typeErrors);
        }
      }
    }

    // Custom validations
    if (schema.validations) {
      for (const [field, rules] of Object.entries(schema.validations)) {
        if (Object.prototype.hasOwnProperty.call(item, field)) {
          const ruleErrors = await this.validateFieldRules(item[field], rules, `${path}.${field}`);
          errors.push(...ruleErrors);
        }
      }
    }

    return errors;
  }

  /**
   * Validate field type
   */
  validateFieldType(value, expectedType, path) {
    const errors = [];

    // Handle multiple allowed types
    if (Array.isArray(expectedType)) {
      const validType = expectedType.some((type) => this.isValidType(value, type));

      if (!validType) {
        errors.push({
          path,
          error: `Invalid type. Expected one of: ${expectedType.join(', ')}`,
          actualType: this.getType(value),
          expectedTypes: expectedType,
        });
      }

      return errors;
    }

    // Single type validation
    if (!this.isValidType(value, expectedType)) {
      errors.push({
        path,
        error: `Invalid type. Expected: ${expectedType}`,
        actualType: this.getType(value),
        expectedType,
      });
    }

    return errors;
  }

  /**
   * Check if value matches expected type
   */
  isValidType(value, expectedType) {
    switch (expectedType) {
      case 'string':
        return typeof value === 'string';

      case 'number':
        return typeof value === 'number' && !isNaN(value);

      case 'boolean':
        return typeof value === 'boolean';

      case 'array':
        return Array.isArray(value);

      case 'object':
        return typeof value === 'object' && !Array.isArray(value) && value !== null;

      case 'null':
        return value === null;

      case 'date':
        return value instanceof Date || this.patterns.iso8601.test(value);

      case 'function':
        return typeof value === 'function';

      default:
        return false;
    }
  }

  /**
   * Get actual type of value
   */
  getType(value) {
    if (value === null) return 'null';
    if (Array.isArray(value)) return 'array';
    if (value instanceof Date) return 'date';
    return typeof value;
  }

  /**
   * Validate field against rules
   */
  async validateFieldRules(value, rules, path) {
    const errors = [];

    for (const [ruleName, ruleValue] of Object.entries(rules)) {
      if (this.validators[ruleName]) {
        const ruleErrors = await this.validators[ruleName](value, ruleValue, path);
        errors.push(...ruleErrors);
      }
    }

    return errors;
  }

  /**
   * Built-in validators
   */
  validateRequired(value, required, path) {
    const errors = [];

    if (required && (value === null || value === undefined || value === '')) {
      errors.push({
        path,
        error: 'Value is required',
        rule: 'required',
      });
    }

    return errors;
  }

  validateType(value, expectedType, path) {
    return this.validateFieldType(value, expectedType, path);
  }

  validateMinLength(value, minLength, path) {
    const errors = [];

    if (typeof value === 'string' && value.length < minLength) {
      errors.push({
        path,
        error: `Minimum length is ${minLength}`,
        actualLength: value.length,
        rule: 'minLength',
      });
    }

    if (Array.isArray(value) && value.length < minLength) {
      errors.push({
        path,
        error: `Minimum array length is ${minLength}`,
        actualLength: value.length,
        rule: 'minLength',
      });
    }

    return errors;
  }

  validateMaxLength(value, maxLength, path) {
    const errors = [];

    if (typeof value === 'string' && value.length > maxLength) {
      errors.push({
        path,
        error: `Maximum length is ${maxLength}`,
        actualLength: value.length,
        rule: 'maxLength',
      });
    }

    if (Array.isArray(value) && value.length > maxLength) {
      errors.push({
        path,
        error: `Maximum array length is ${maxLength}`,
        actualLength: value.length,
        rule: 'maxLength',
      });
    }

    return errors;
  }

  validatePattern(value, pattern, path) {
    const errors = [];

    if (typeof value !== 'string') {
      return errors;
    }

    // Handle named patterns
    const regex = this.patterns[pattern] || new RegExp(pattern);

    if (!regex.test(value)) {
      errors.push({
        path,
        error: `Value does not match pattern: ${pattern}`,
        value,
        rule: 'pattern',
      });
    }

    return errors;
  }

  validateEnum(value, allowedValues, path) {
    const errors = [];

    if (!allowedValues.includes(value)) {
      errors.push({
        path,
        error: `Value must be one of: ${allowedValues.join(', ')}`,
        actualValue: value,
        allowedValues,
        rule: 'enum',
      });
    }

    return errors;
  }

  async validateCustom(value, validator, path) {
    const errors = [];

    try {
      const result = await validator(value);

      if (result !== true) {
        errors.push({
          path,
          error: result || 'Custom validation failed',
          rule: 'custom',
        });
      }
    } catch (error) {
      errors.push({
        path,
        error: `Custom validation error: ${error.message}`,
        rule: 'custom',
      });
    }

    return errors;
  }

  /**
   * Generate error summary
   */
  generateErrorSummary(errors) {
    const summary = {
      totalErrors: errors.length,
      byPath: {},
      byRule: {},
      critical: [],
    };

    for (const error of errors) {
      // Group by path
      if (!summary.byPath[error.path]) {
        summary.byPath[error.path] = [];
      }
      summary.byPath[error.path].push(error);

      // Group by rule
      const rule = error.rule || 'other';
      if (!summary.byRule[rule]) {
        summary.byRule[rule] = 0;
      }
      summary.byRule[rule]++;

      // Identify critical errors
      if (error.rule === 'required' || error.error.includes('Invalid type')) {
        summary.critical.push(error);
      }
    }

    return summary;
  }

  /**
   * Validate entity relationships
   */
  async validateRelationships(data, relationships) {
    const errors = [];

    for (const [field, config] of Object.entries(relationships)) {
      const relatedIds = data[field];

      if (!relatedIds) continue;

      // Handle both single and multiple relationships
      const ids = Array.isArray(relatedIds) ? relatedIds : [relatedIds];

      for (const id of ids) {
        const exists = await config.validator(id);

        if (!exists) {
          errors.push({
            path: field,
            error: `Related ${config.type} not found: ${id}`,
            relatedId: id,
            relationType: config.type,
          });
        }
      }
    }

    return errors;
  }

  /**
   * Validate data consistency
   */
  validateConsistency(data) {
    const errors = [];

    // Check date consistency
    if (data.createdAt && data.updatedAt) {
      const created = new Date(data.createdAt);
      const updated = new Date(data.updatedAt);

      if (created > updated) {
        errors.push({
          path: 'dates',
          error: 'Created date cannot be after updated date',
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        });
      }
    }

    // Check array field consistency
    if (data.folderIds && data.folderId) {
      if (!data.folderIds.includes(data.folderId)) {
        errors.push({
          path: 'folders',
          error: 'Primary folder must be in folder list',
          folderId: data.folderId,
          folderIds: data.folderIds,
        });
      }
    }

    return errors;
  }

  /**
   * Sanitize data
   */
  sanitizeData(data, schema) {
    const sanitized = { ...data };

    // Remove unknown fields
    if (schema.strict) {
      const allowedFields = new Set([
        ...(schema.required || []),
        ...Object.keys(schema.types || {}),
        ...Object.keys(schema.validations || {}),
      ]);

      for (const field of Object.keys(sanitized)) {
        if (!allowedFields.has(field)) {
          delete sanitized[field];
        }
      }
    }

    // Apply field sanitizers
    if (schema.sanitizers) {
      for (const [field, sanitizer] of Object.entries(schema.sanitizers)) {
        if (Object.prototype.hasOwnProperty.call(sanitized, field)) {
          sanitized[field] = sanitizer(sanitized[field]);
        }
      }
    }

    return sanitized;
  }
}

// Export singleton instance
export const dataValidator = new DataValidator();

// Also export class for testing
export default DataValidator;
