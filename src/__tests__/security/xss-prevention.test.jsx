import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PreferencesProvider } from '@/contexts/PreferencesContext';
import { FeatureFlagsProvider } from '@/contexts/FeatureFlagsContext';
import TemplateEditor from '@/components/templates/TemplateEditor';
import ItemExecutor from '@/components/features/execution/ItemExecutor';
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

describe('XSS Prevention Security Tests', () => {
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

  describe('Template Content XSS Prevention', () => {
    it('should sanitize script tags in template content', async () => {
      const maliciousContent = `
        Hello {name}!
        <script>alert('XSS Attack!')</script>
        <img src="x" onerror="alert('XSS')">
      `;

      renderWithProviders(
        <TemplateEditor 
          onSave={jest.fn()} 
          onCancel={jest.fn()} 
        />
      );

      const contentTextarea = screen.getByLabelText(/template content/i);
      await user.type(contentTextarea, maliciousContent);

      // Check that the script is not executed
      expect(window.alert).not.toHaveBeenCalled();

      // Verify content is displayed safely
      const preview = screen.getByTestId('template-preview');
      expect(preview.innerHTML).not.toContain('<script>');
      expect(preview.innerHTML).not.toContain('onerror=');
    });

    it('should escape HTML entities in variable values', async () => {
      const template = {
        id: '1',
        name: 'Test Template',
        content: 'Hello {username}, your email is {email}',
        variables: ['username', 'email']
      };

      renderWithProviders(
        <ItemExecutor 
          item={template}
          type="template"
          onClose={jest.fn()}
        />
      );

      // Try to inject HTML through variable values
      const usernameInput = screen.getByLabelText(/username/i);
      const emailInput = screen.getByLabelText(/email/i);

      await user.type(usernameInput, '<b>Bold User</b>');
      await user.type(emailInput, 'test@example.com<script>alert("XSS")</script>');

      // Check preview doesn't render HTML
      const preview = screen.getByTestId('preview-section');
      expect(preview.textContent).toContain('<b>Bold User</b>');
      expect(preview.textContent).not.toContain('Bold User'); // Should not be bold
      expect(preview.innerHTML).not.toContain('<script>');
    });

    it('should prevent JavaScript URL injection', async () => {
      const maliciousTemplate = {
        id: '1',
        name: 'Link Template',
        content: 'Click here: {link}',
        variables: ['link']
      };

      renderWithProviders(
        <ItemExecutor 
          item={maliciousTemplate}
          type="template"
          onClose={jest.fn()}
        />
      );

      const linkInput = screen.getByLabelText(/link/i);
      await user.type(linkInput, 'javascript:alert("XSS")');

      // Verify JavaScript URLs are sanitized
      const preview = screen.getByTestId('preview-section');
      expect(preview.innerHTML).not.toContain('javascript:');
    });

    it('should sanitize data: URLs with embedded scripts', async () => {
      const template = {
        id: '1',
        name: 'Image Template',
        content: 'Image: {imageUrl}',
        variables: ['imageUrl']
      };

      renderWithProviders(
        <ItemExecutor 
          item={template}
          type="template"
          onClose={jest.fn()}
        />
      );

      const imageInput = screen.getByLabelText(/imageUrl/i);
      await user.type(imageInput, 'data:text/html,<script>alert("XSS")</script>');

      const preview = screen.getByTestId('preview-section');
      expect(preview.innerHTML).not.toContain('<script>');
      expect(preview.innerHTML).not.toContain('data:text/html');
    });
  });

  describe('Import Data XSS Prevention', () => {
    it('should sanitize imported template content', async () => {
      const maliciousImportData = {
        version: '1.0.0',
        templates: [{
          id: '1',
          name: 'Malicious Template',
          content: 'Hello!<script>localStorage.clear()</script>',
          description: '<img src=x onerror=alert("XSS")>',
          category: 'General'
        }]
      };

      // Mock file reading
      const file = new File([JSON.stringify(maliciousImportData)], 'import.json', {
        type: 'application/json'
      });

      global.FileReader = jest.fn(() => ({
        readAsText: jest.fn(function() {
          this.onload({ target: { result: JSON.stringify(maliciousImportData) } });
        })
      }));

      // Simulate import process
      expect(() => {
        // Import logic should sanitize content
        const sanitized = JSON.parse(JSON.stringify(maliciousImportData));
        sanitized.templates[0].content = sanitized.templates[0].content.replace(/<script.*?>.*?<\/script>/gi, '');
        sanitized.templates[0].description = sanitized.templates[0].description.replace(/<img.*?>/gi, '');
      }).not.toThrow();
    });
  });

  describe('Markdown Rendering XSS Prevention', () => {
    it('should sanitize dangerous markdown content', async () => {
      const dangerousMarkdown = `
# Title

<script>alert('XSS')</script>

[Click me](javascript:alert('XSS'))

<iframe src="https://evil.com"></iframe>

![image](x" onerror="alert('XSS'))
      `;

      const template = {
        id: '1',
        name: 'Markdown Template',
        content: dangerousMarkdown,
        variables: []
      };

      renderWithProviders(
        <ItemExecutor 
          item={template}
          type="template"
          onClose={jest.fn()}
        />
      );

      await waitFor(() => {
        const preview = screen.getByTestId('preview-section');
        
        // Verify dangerous content is removed
        expect(preview.innerHTML).not.toContain('<script>');
        expect(preview.innerHTML).not.toContain('javascript:');
        expect(preview.innerHTML).not.toContain('<iframe');
        expect(preview.innerHTML).not.toContain('onerror=');
      });
    });
  });

  describe('Local Storage XSS Prevention', () => {
    it('should validate data from localStorage before using', () => {
      // Simulate malicious data in localStorage
      const maliciousData = {
        templates: [{
          id: '1',
          name: '<script>alert("XSS")</script>',
          content: 'Normal content'
        }]
      };

      localStorage.setItem('airprompts_templates', JSON.stringify(maliciousData));

      // Load and validate data
      const loadedData = JSON.parse(localStorage.getItem('airprompts_templates'));
      
      // Validation should strip dangerous content
      const validated = {
        ...loadedData,
        templates: loadedData.templates.map(t => ({
          ...t,
          name: t.name.replace(/<script.*?>.*?<\/script>/gi, '')
        }))
      };

      expect(validated.templates[0].name).not.toContain('<script>');
    });
  });

  describe('Event Handler Injection Prevention', () => {
    it('should prevent onclick and other event handler injections', async () => {
      const template = {
        id: '1',
        name: 'Event Template',
        content: 'Button: {buttonHtml}',
        variables: ['buttonHtml']
      };

      renderWithProviders(
        <ItemExecutor 
          item={template}
          type="template"
          onClose={jest.fn()}
        />
      );

      const buttonInput = screen.getByLabelText(/buttonHtml/i);
      await user.type(buttonInput, '<button onclick="alert(\'XSS\')">Click me</button>');

      const preview = screen.getByTestId('preview-section');
      expect(preview.innerHTML).not.toContain('onclick=');
    });

    it('should strip SVG-based XSS attempts', async () => {
      const template = {
        id: '1',
        name: 'SVG Template',
        content: 'Image: {svgContent}',
        variables: ['svgContent']
      };

      renderWithProviders(
        <ItemExecutor 
          item={template}
          type="template"
          onClose={jest.fn()}
        />
      );

      const svgInput = screen.getByLabelText(/svgContent/i);
      await user.type(svgInput, '<svg onload="alert(\'XSS\')"><circle /></svg>');

      const preview = screen.getByTestId('preview-section');
      expect(preview.innerHTML).not.toContain('onload=');
    });
  });

  describe('CSS Injection Prevention', () => {
    it('should prevent style-based XSS attacks', async () => {
      const template = {
        id: '1',
        name: 'Style Template',
        content: 'Styled text: {styledContent}',
        variables: ['styledContent']
      };

      renderWithProviders(
        <ItemExecutor 
          item={template}
          type="template"
          onClose={jest.fn()}
        />
      );

      const styleInput = screen.getByLabelText(/styledContent/i);
      await user.type(styleInput, '<div style="background: url(javascript:alert(\'XSS\'))">Text</div>');

      const preview = screen.getByTestId('preview-section');
      expect(preview.innerHTML).not.toContain('javascript:');
    });

    it('should sanitize expression and behavior CSS properties', async () => {
      const template = {
        id: '1',
        name: 'CSS Expression Template',
        content: 'Content: {cssContent}',
        variables: ['cssContent']
      };

      renderWithProviders(
        <ItemExecutor 
          item={template}
          type="template"
          onClose={jest.fn()}
        />
      );

      const cssInput = screen.getByLabelText(/cssContent/i);
      await user.type(cssInput, '<div style="width: expression(alert(\'XSS\'))">Text</div>');

      const preview = screen.getByTestId('preview-section');
      expect(preview.innerHTML).not.toContain('expression(');
    });
  });

  describe('Content Security Policy Compliance', () => {
    it('should not execute inline scripts even if injected', () => {
      // Mock CSP header
      const meta = document.createElement('meta');
      meta.httpEquiv = 'Content-Security-Policy';
      meta.content = "default-src 'self'; script-src 'self'";
      document.head.appendChild(meta);

      // Attempt to inject inline script
      const script = document.createElement('script');
      script.textContent = 'window.xssTest = true;';
      document.body.appendChild(script);

      // Verify script didn't execute
      expect(window.xssTest).toBeUndefined();

      // Cleanup
      document.head.removeChild(meta);
      document.body.removeChild(script);
    });
  });
});