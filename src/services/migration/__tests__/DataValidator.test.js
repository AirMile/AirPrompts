import DataValidator from '../DataValidator';

describe('DataValidator', () => {
  let validator;

  beforeEach(() => {
    validator = new DataValidator();
  });

  describe('validateData', () => {
    it('should validate valid data against schema', async () => {
      const data = {
        id: '123',
        name: 'Test Template',
        content: 'Template content',
        category: 'general'
      };

      const schema = {
        required: ['id', 'name', 'content', 'category'],
        types: {
          id: 'string',
          name: 'string',
          content: 'string',
          category: 'string'
        }
      };

      const result = await validator.validateData('template', data, schema);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing required fields', async () => {
      const data = {
        id: '123',
        name: 'Test Template'
        // Missing content and category
      };

      const schema = {
        required: ['id', 'name', 'content', 'category'],
        types: {
          id: 'string',
          name: 'string',
          content: 'string',
          category: 'string'
        }
      };

      const result = await validator.validateData('template', data, schema);

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(2);
      expect(result.errors[0].error).toBe('Required field missing');
    });

    it('should validate array data', async () => {
      const data = [
        { id: '1', name: 'Item 1' },
        { id: '2', name: 'Item 2' }
      ];

      const schema = {
        required: ['id', 'name'],
        types: {
          id: 'string',
          name: 'string'
        }
      };

      const result = await validator.validateData('items', data, schema);

      expect(result.valid).toBe(true);
    });
  });

  describe('type validation', () => {
    it('should validate basic types correctly', () => {
      expect(validator.isValidType('hello', 'string')).toBe(true);
      expect(validator.isValidType(123, 'number')).toBe(true);
      expect(validator.isValidType(true, 'boolean')).toBe(true);
      expect(validator.isValidType([], 'array')).toBe(true);
      expect(validator.isValidType({}, 'object')).toBe(true);
      expect(validator.isValidType(null, 'null')).toBe(true);
    });

    it('should handle multiple allowed types', async () => {
      const errors = validator.validateFieldType(
        'value',
        ['string', 'null'],
        'field'
      );

      expect(errors).toHaveLength(0);

      const errors2 = validator.validateFieldType(
        null,
        ['string', 'null'],
        'field'
      );

      expect(errors2).toHaveLength(0);
    });

    it('should detect invalid types', async () => {
      const errors = validator.validateFieldType(
        123,
        'string',
        'field'
      );

      expect(errors).toHaveLength(1);
      expect(errors[0].error).toContain('Invalid type');
      expect(errors[0].actualType).toBe('number');
      expect(errors[0].expectedType).toBe('string');
    });
  });

  describe('validation rules', () => {
    it('should validate minLength for strings', () => {
      const errors = validator.validateMinLength('hi', 5, 'field');
      expect(errors).toHaveLength(1);
      expect(errors[0].error).toContain('Minimum length is 5');

      const errors2 = validator.validateMinLength('hello world', 5, 'field');
      expect(errors2).toHaveLength(0);
    });

    it('should validate maxLength for arrays', () => {
      const errors = validator.validateMaxLength([1, 2, 3, 4, 5], 3, 'field');
      expect(errors).toHaveLength(1);
      expect(errors[0].error).toContain('Maximum array length is 3');
    });

    it('should validate patterns', () => {
      const errors = validator.validatePattern(
        'invalid-email',
        'email',
        'field'
      );
      expect(errors).toHaveLength(1);

      const errors2 = validator.validatePattern(
        'test@example.com',
        'email',
        'field'
      );
      expect(errors2).toHaveLength(0);
    });

    it('should validate enum values', () => {
      const errors = validator.validateEnum(
        'invalid',
        ['option1', 'option2', 'option3'],
        'field'
      );
      expect(errors).toHaveLength(1);
      expect(errors[0].error).toContain('Value must be one of');

      const errors2 = validator.validateEnum(
        'option2',
        ['option1', 'option2', 'option3'],
        'field'
      );
      expect(errors2).toHaveLength(0);
    });

    it('should validate custom rules', async () => {
      const customValidator = (value) => {
        return value > 10 ? true : 'Value must be greater than 10';
      };

      const errors = await validator.validateCustom(5, customValidator, 'field');
      expect(errors).toHaveLength(1);
      expect(errors[0].error).toBe('Value must be greater than 10');

      const errors2 = await validator.validateCustom(15, customValidator, 'field');
      expect(errors2).toHaveLength(0);
    });
  });

  describe('validateConsistency', () => {
    it('should validate date consistency', () => {
      const data = {
        createdAt: '2024-01-02T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z' // Before created date
      };

      const errors = validator.validateConsistency(data);
      expect(errors).toHaveLength(1);
      expect(errors[0].error).toContain('Created date cannot be after updated date');
    });

    it('should validate folder consistency', () => {
      const data = {
        folderId: 'folder1',
        folderIds: ['folder2', 'folder3'] // Missing primary folder
      };

      const errors = validator.validateConsistency(data);
      expect(errors).toHaveLength(1);
      expect(errors[0].error).toContain('Primary folder must be in folder list');
    });
  });

  describe('sanitizeData', () => {
    it('should remove unknown fields in strict mode', () => {
      const data = {
        id: '123',
        name: 'Test',
        unknownField: 'should be removed',
        anotherUnknown: 123
      };

      const schema = {
        strict: true,
        required: ['id', 'name'],
        types: {
          id: 'string',
          name: 'string'
        }
      };

      const sanitized = validator.sanitizeData(data, schema);

      expect(sanitized).toEqual({
        id: '123',
        name: 'Test'
      });
      expect(sanitized.unknownField).toBeUndefined();
    });

    it('should apply custom sanitizers', () => {
      const data = {
        name: '  Test Name  ',
        email: 'TEST@EXAMPLE.COM'
      };

      const schema = {
        sanitizers: {
          name: (value) => value.trim(),
          email: (value) => value.toLowerCase()
        }
      };

      const sanitized = validator.sanitizeData(data, schema);

      expect(sanitized.name).toBe('Test Name');
      expect(sanitized.email).toBe('test@example.com');
    });
  });

  describe('error summary', () => {
    it('should generate comprehensive error summary', () => {
      const errors = [
        { path: 'field1', error: 'Required field missing', rule: 'required' },
        { path: 'field2', error: 'Invalid type', rule: 'type' },
        { path: 'field1', error: 'Too short', rule: 'minLength' }
      ];

      const summary = validator.generateErrorSummary(errors);

      expect(summary.totalErrors).toBe(3);
      expect(summary.byPath['field1']).toHaveLength(2);
      expect(summary.byRule['required']).toBe(1);
      expect(summary.critical).toHaveLength(2); // required and type errors
    });
  });
});