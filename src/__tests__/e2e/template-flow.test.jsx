import React from 'react';
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PreferencesProvider } from '@/contexts/PreferencesContext';
import { FeatureFlagsProvider } from '@/contexts/FeatureFlagsContext';
import PromptTemplateSystem from '@/components/PromptTemplateSystem';
import * as dataStorage from '@/utils/dataStorage';

// Mock the data storage
jest.mock('@/utils/dataStorage');

// Mock console methods to avoid noise in tests
const originalError = console.error;
const originalWarn = console.warn;
beforeAll(() => {
  console.error = jest.fn();
  console.warn = jest.fn();
});
afterAll(() => {
  console.error = originalError;
  console.warn = originalWarn;
});

// Helper function to render with providers
const renderWithProviders = (component) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { 
        retry: false,
        refetchOnWindowFocus: false,
      },
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

describe('Template Creation/Editing/Deletion Flow E2E', () => {
  let user;

  beforeEach(() => {
    user = userEvent.setup();
    // Reset all mocks
    jest.clearAllMocks();
    
    // Mock initial data load
    dataStorage.loadAllData.mockResolvedValue({
      templates: [],
      workflows: [],
      snippets: [],
      folders: []
    });

    dataStorage.saveTemplates.mockResolvedValue();
    dataStorage.saveWorkflows.mockResolvedValue();
    dataStorage.saveSnippets.mockResolvedValue();
    dataStorage.saveFolders.mockResolvedValue();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should complete full template lifecycle: create, edit, and delete', async () => {
    renderWithProviders(<PromptTemplateSystem />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('My Prompt Templates')).toBeInTheDocument();
    });

    // Step 1: Navigate to template creation
    const createButton = screen.getByRole('button', { name: /new template/i });
    await user.click(createButton);

    // Wait for template editor to load
    await waitFor(() => {
      expect(screen.getByText('Create New Template')).toBeInTheDocument();
    });

    // Step 2: Fill in template details
    const nameInput = screen.getByLabelText(/template name/i);
    const descriptionInput = screen.getByLabelText(/description/i);
    const contentTextarea = screen.getByLabelText(/template content/i);
    const categorySelect = screen.getByLabelText(/category/i);

    await user.type(nameInput, 'Test Template');
    await user.type(descriptionInput, 'This is a test template for E2E testing');
    await user.type(contentTextarea, 'Hello {name}, welcome to {company}!');
    await user.selectOptions(categorySelect, 'General');

    // Verify variables are detected
    await waitFor(() => {
      expect(screen.getByText('Detected Variables:')).toBeInTheDocument();
      expect(screen.getByText('name')).toBeInTheDocument();
      expect(screen.getByText('company')).toBeInTheDocument();
    });

    // Step 3: Save the template
    const saveButton = screen.getByRole('button', { name: /save template/i });
    await user.click(saveButton);

    // Wait for navigation back to homepage
    await waitFor(() => {
      expect(screen.getByText('My Prompt Templates')).toBeInTheDocument();
    });

    // Verify template appears in the list
    await waitFor(() => {
      expect(screen.getByText('Test Template')).toBeInTheDocument();
      expect(screen.getByText('This is a test template for E2E testing')).toBeInTheDocument();
    });

    // Verify save was called
    expect(dataStorage.saveTemplates).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'Test Template',
          description: 'This is a test template for E2E testing',
          content: 'Hello {name}, welcome to {company}!',
          category: 'General',
          variables: ['name', 'company']
        })
      ])
    );

    // Step 4: Edit the template
    const templateCard = screen.getByText('Test Template').closest('[role="article"]');
    const editButton = within(templateCard).getByRole('button', { name: /edit/i });
    await user.click(editButton);

    // Wait for editor to load with existing data
    await waitFor(() => {
      expect(screen.getByDisplayValue('Test Template')).toBeInTheDocument();
    });

    // Update template content
    const contentTextareaEdit = screen.getByLabelText(/template content/i);
    await user.clear(contentTextareaEdit);
    await user.type(contentTextareaEdit, 'Updated: Hello {firstName} {lastName}, welcome to {company}!');

    // Save the edited template
    const saveEditButton = screen.getByRole('button', { name: /save template/i });
    await user.click(saveEditButton);

    // Wait for navigation back
    await waitFor(() => {
      expect(screen.getByText('My Prompt Templates')).toBeInTheDocument();
    });

    // Verify updated content
    expect(dataStorage.saveTemplates).toHaveBeenLastCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'Test Template',
          content: 'Updated: Hello {firstName} {lastName}, welcome to {company}!',
          variables: ['firstName', 'lastName', 'company']
        })
      ])
    );

    // Step 5: Delete the template
    const updatedTemplateCard = screen.getByText('Test Template').closest('[role="article"]');
    const deleteButton = within(updatedTemplateCard).getByRole('button', { name: /delete/i });
    await user.click(deleteButton);

    // Confirm deletion in dialog
    const confirmDialog = screen.getByRole('dialog');
    const confirmButton = within(confirmDialog).getByRole('button', { name: /confirm/i });
    await user.click(confirmButton);

    // Verify template is removed
    await waitFor(() => {
      expect(screen.queryByText('Test Template')).not.toBeInTheDocument();
    });

    // Verify save was called with empty array
    expect(dataStorage.saveTemplates).toHaveBeenLastCalledWith([]);
  });

  it('should handle template validation errors', async () => {
    renderWithProviders(<PromptTemplateSystem />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('My Prompt Templates')).toBeInTheDocument();
    });

    // Navigate to template creation
    const createButton = screen.getByRole('button', { name: /new template/i });
    await user.click(createButton);

    // Try to save without filling required fields
    const saveButton = screen.getByRole('button', { name: /save template/i });
    await user.click(saveButton);

    // Check for validation errors
    await waitFor(() => {
      expect(screen.getByText(/template name is required/i)).toBeInTheDocument();
      expect(screen.getByText(/template content is required/i)).toBeInTheDocument();
    });

    // Fill only name and try again
    const nameInput = screen.getByLabelText(/template name/i);
    await user.type(nameInput, 'Incomplete Template');
    await user.click(saveButton);

    // Should still show content error
    await waitFor(() => {
      expect(screen.queryByText(/template name is required/i)).not.toBeInTheDocument();
      expect(screen.getByText(/template content is required/i)).toBeInTheDocument();
    });
  });

  it('should handle duplicate template names', async () => {
    // Mock existing template
    dataStorage.loadAllData.mockResolvedValue({
      templates: [{
        id: '1',
        name: 'Existing Template',
        description: 'Already exists',
        content: 'Some content',
        category: 'General',
        variables: [],
        favorite: false
      }],
      workflows: [],
      snippets: [],
      folders: []
    });

    renderWithProviders(<PromptTemplateSystem />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('Existing Template')).toBeInTheDocument();
    });

    // Create new template with same name
    const createButton = screen.getByRole('button', { name: /new template/i });
    await user.click(createButton);

    const nameInput = screen.getByLabelText(/template name/i);
    const contentTextarea = screen.getByLabelText(/template content/i);

    await user.type(nameInput, 'Existing Template');
    await user.type(contentTextarea, 'Different content');

    const saveButton = screen.getByRole('button', { name: /save template/i });
    await user.click(saveButton);

    // Should show duplicate name error
    await waitFor(() => {
      expect(screen.getByText(/template with this name already exists/i)).toBeInTheDocument();
    });
  });

  it('should support canceling template creation', async () => {
    renderWithProviders(<PromptTemplateSystem />);

    // Navigate to template creation
    const createButton = screen.getByRole('button', { name: /new template/i });
    await user.click(createButton);

    // Fill in some data
    const nameInput = screen.getByLabelText(/template name/i);
    await user.type(nameInput, 'Temporary Template');

    // Cancel creation
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);

    // Should return to homepage without saving
    await waitFor(() => {
      expect(screen.getByText('My Prompt Templates')).toBeInTheDocument();
      expect(screen.queryByText('Temporary Template')).not.toBeInTheDocument();
    });

    // Verify save was not called
    expect(dataStorage.saveTemplates).not.toHaveBeenCalled();
  });
});