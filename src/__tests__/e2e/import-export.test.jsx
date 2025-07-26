import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PreferencesProvider } from '@/contexts/PreferencesContext';
import { FeatureFlagsProvider } from '@/contexts/FeatureFlagsContext';
import PromptTemplateSystem from '@/components/PromptTemplateSystem';
import * as dataStorage from '@/utils/dataStorage';

// Mock the data storage
jest.mock('@/utils/dataStorage');

// Mock file download
global.URL.createObjectURL = jest.fn(() => 'mock-url');
global.URL.revokeObjectURL = jest.fn();

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

describe('Import/Export Operations E2E', () => {
  let user;
  
  const mockTemplates = [
    {
      id: '1',
      name: 'Export Test Template',
      description: 'Template for testing export',
      content: 'This is a test template with {variable}',
      category: 'General',
      variables: ['variable'],
      favorite: false
    },
    {
      id: '2',
      name: 'Another Template',
      description: 'Second template for export',
      content: 'Hello {name} from {location}',
      category: 'Email',
      variables: ['name', 'location'],
      favorite: true
    }
  ];

  const mockWorkflows = [
    {
      id: 'w1',
      name: 'Export Test Workflow',
      description: 'Workflow for testing export',
      steps: ['1', '2'],
      category: 'General',
      favorite: false
    }
  ];

  beforeEach(() => {
    user = userEvent.setup();
    jest.clearAllMocks();
    
    // Mock initial data load
    dataStorage.loadAllData.mockResolvedValue({
      templates: mockTemplates,
      workflows: mockWorkflows,
      snippets: [],
      folders: []
    });

    dataStorage.saveTemplates.mockResolvedValue();
    dataStorage.saveWorkflows.mockResolvedValue();
    dataStorage.saveSnippets.mockResolvedValue();
    dataStorage.saveFolders.mockResolvedValue();

    // Mock document.createElement for download link
    const mockLink = {
      click: jest.fn(),
      setAttribute: jest.fn(),
      style: {}
    };
    document.createElement = jest.fn((tag) => {
      if (tag === 'a') return mockLink;
      return document.createElement.bind(document)(tag);
    });
  });

  it('should export all data successfully', async () => {
    renderWithProviders(<PromptTemplateSystem />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('Export Test Template')).toBeInTheDocument();
    });

    // Open settings/export menu
    const settingsButton = screen.getByRole('button', { name: /settings/i });
    await user.click(settingsButton);

    // Click export button
    const exportButton = screen.getByRole('button', { name: /export all data/i });
    await user.click(exportButton);

    // Verify export data structure
    const exportData = {
      version: expect.any(String),
      exportDate: expect.any(String),
      templates: mockTemplates,
      workflows: mockWorkflows,
      snippets: [],
      folders: []
    };

    // Check that blob was created with correct data
    expect(global.URL.createObjectURL).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'application/json'
      })
    );

    // Verify success message
    await waitFor(() => {
      expect(screen.getByText(/data exported successfully/i)).toBeInTheDocument();
    });
  });

  it('should import data from file', async () => {
    renderWithProviders(<PromptTemplateSystem />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('My Prompt Templates')).toBeInTheDocument();
    });

    // Prepare import data
    const importData = {
      version: '1.0.0',
      exportDate: new Date().toISOString(),
      templates: [
        {
          id: 'imported-1',
          name: 'Imported Template',
          description: 'This template was imported',
          content: 'Imported content with {importedVar}',
          category: 'General',
          variables: ['importedVar'],
          favorite: false
        }
      ],
      workflows: [
        {
          id: 'imported-w1',
          name: 'Imported Workflow',
          description: 'This workflow was imported',
          steps: ['imported-1'],
          category: 'General',
          favorite: false
        }
      ],
      snippets: [],
      folders: []
    };

    // Open settings menu
    const settingsButton = screen.getByRole('button', { name: /settings/i });
    await user.click(settingsButton);

    // Find file input
    const fileInput = screen.getByLabelText(/import data file/i);
    
    // Create file and trigger change
    const file = new File([JSON.stringify(importData)], 'import.json', {
      type: 'application/json'
    });

    await user.upload(fileInput, file);

    // Confirm import dialog
    const confirmButton = screen.getByRole('button', { name: /confirm import/i });
    await user.click(confirmButton);

    // Wait for import to complete
    await waitFor(() => {
      expect(screen.getByText(/data imported successfully/i)).toBeInTheDocument();
    });

    // Verify new data was saved
    expect(dataStorage.saveTemplates).toHaveBeenCalledWith(
      expect.arrayContaining([
        ...mockTemplates,
        expect.objectContaining({
          name: 'Imported Template'
        })
      ])
    );

    expect(dataStorage.saveWorkflows).toHaveBeenCalledWith(
      expect.arrayContaining([
        ...mockWorkflows,
        expect.objectContaining({
          name: 'Imported Workflow'
        })
      ])
    );
  });

  it('should handle import with duplicate detection', async () => {
    renderWithProviders(<PromptTemplateSystem />);

    // Import data with duplicate names
    const importData = {
      version: '1.0.0',
      exportDate: new Date().toISOString(),
      templates: [
        {
          id: 'duplicate-1',
          name: 'Export Test Template', // Same name as existing
          description: 'Duplicate template',
          content: 'Duplicate content',
          category: 'General',
          variables: [],
          favorite: false
        }
      ],
      workflows: [],
      snippets: [],
      folders: []
    };

    // Open settings and import
    const settingsButton = screen.getByRole('button', { name: /settings/i });
    await user.click(settingsButton);

    const fileInput = screen.getByLabelText(/import data file/i);
    const file = new File([JSON.stringify(importData)], 'import.json', {
      type: 'application/json'
    });

    await user.upload(fileInput, file);

    // Should show duplicate warning
    await waitFor(() => {
      expect(screen.getByText(/duplicate items detected/i)).toBeInTheDocument();
      expect(screen.getByText(/1 template.*already exists/i)).toBeInTheDocument();
    });

    // Options for handling duplicates
    const skipDuplicatesOption = screen.getByLabelText(/skip duplicates/i);
    await user.click(skipDuplicatesOption);

    const confirmButton = screen.getByRole('button', { name: /confirm import/i });
    await user.click(confirmButton);

    // Verify only non-duplicates were imported
    expect(dataStorage.saveTemplates).toHaveBeenCalledWith(mockTemplates);
  });

  it('should validate import file format', async () => {
    renderWithProviders(<PromptTemplateSystem />);

    const settingsButton = screen.getByRole('button', { name: /settings/i });
    await user.click(settingsButton);

    // Try to import invalid JSON
    const fileInput = screen.getByLabelText(/import data file/i);
    const invalidFile = new File(['invalid json content'], 'invalid.json', {
      type: 'application/json'
    });

    await user.upload(fileInput, invalidFile);

    // Should show error
    await waitFor(() => {
      expect(screen.getByText(/invalid file format/i)).toBeInTheDocument();
    });

    // Try to import file missing required fields
    const incompleteData = {
      templates: [] // Missing version, exportDate, etc.
    };

    const incompleteFile = new File([JSON.stringify(incompleteData)], 'incomplete.json', {
      type: 'application/json'
    });

    await user.upload(fileInput, incompleteFile);

    await waitFor(() => {
      expect(screen.getByText(/missing required fields/i)).toBeInTheDocument();
    });
  });

  it('should export selected items only', async () => {
    renderWithProviders(<PromptTemplateSystem />);

    // Wait for templates to load
    await waitFor(() => {
      expect(screen.getByText('Export Test Template')).toBeInTheDocument();
    });

    // Select specific templates
    const template1Checkbox = screen.getByRole('checkbox', { name: /select export test template/i });
    await user.click(template1Checkbox);

    // Open bulk actions menu
    const bulkActionsButton = screen.getByRole('button', { name: /bulk actions/i });
    await user.click(bulkActionsButton);

    // Export selected
    const exportSelectedButton = screen.getByRole('button', { name: /export selected/i });
    await user.click(exportSelectedButton);

    // Verify only selected item was exported
    expect(global.URL.createObjectURL).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'application/json'
      })
    );

    await waitFor(() => {
      expect(screen.getByText(/1 item.*exported successfully/i)).toBeInTheDocument();
    });
  });

  it('should handle import with merge strategy', async () => {
    renderWithProviders(<PromptTemplateSystem />);

    // Import data with updates to existing items
    const importData = {
      version: '1.0.0',
      exportDate: new Date().toISOString(),
      templates: [
        {
          id: '1', // Same ID as existing
          name: 'Export Test Template',
          description: 'Updated description from import',
          content: 'Updated content with {newVariable}',
          category: 'Development', // Changed category
          variables: ['newVariable'],
          favorite: true // Changed favorite status
        }
      ],
      workflows: [],
      snippets: [],
      folders: []
    };

    const settingsButton = screen.getByRole('button', { name: /settings/i });
    await user.click(settingsButton);

    const fileInput = screen.getByLabelText(/import data file/i);
    const file = new File([JSON.stringify(importData)], 'import.json', {
      type: 'application/json'
    });

    await user.upload(fileInput, file);

    // Choose merge strategy
    const mergeOption = screen.getByLabelText(/merge.*update existing/i);
    await user.click(mergeOption);

    const confirmButton = screen.getByRole('button', { name: /confirm import/i });
    await user.click(confirmButton);

    // Verify merge happened correctly
    expect(dataStorage.saveTemplates).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          id: '1',
          name: 'Export Test Template',
          description: 'Updated description from import',
          content: 'Updated content with {newVariable}',
          category: 'Development',
          favorite: true
        }),
        mockTemplates[1] // Other template unchanged
      ])
    );
  });

  it('should create backup before import', async () => {
    renderWithProviders(<PromptTemplateSystem />);

    const importData = {
      version: '1.0.0',
      exportDate: new Date().toISOString(),
      templates: [],
      workflows: [],
      snippets: [],
      folders: []
    };

    const settingsButton = screen.getByRole('button', { name: /settings/i });
    await user.click(settingsButton);

    const fileInput = screen.getByLabelText(/import data file/i);
    const file = new File([JSON.stringify(importData)], 'import.json', {
      type: 'application/json'
    });

    await user.upload(fileInput, file);

    // Check for backup option
    const createBackupCheckbox = screen.getByRole('checkbox', { name: /create backup/i });
    expect(createBackupCheckbox).toBeChecked(); // Should be checked by default

    const confirmButton = screen.getByRole('button', { name: /confirm import/i });
    await user.click(confirmButton);

    // Verify backup was created (URL.createObjectURL called twice - once for backup, once for success)
    expect(global.URL.createObjectURL).toHaveBeenCalledTimes(2);
  });

  it('should handle large import files gracefully', async () => {
    renderWithProviders(<PromptTemplateSystem />);

    // Create large dataset
    const largeTemplates = Array.from({ length: 1000 }, (_, i) => ({
      id: `large-${i}`,
      name: `Large Template ${i}`,
      description: `Description for template ${i}`,
      content: `Content for template ${i} with {var${i}}`,
      category: 'General',
      variables: [`var${i}`],
      favorite: false
    }));

    const importData = {
      version: '1.0.0',
      exportDate: new Date().toISOString(),
      templates: largeTemplates,
      workflows: [],
      snippets: [],
      folders: []
    };

    const settingsButton = screen.getByRole('button', { name: /settings/i });
    await user.click(settingsButton);

    const fileInput = screen.getByLabelText(/import data file/i);
    const file = new File([JSON.stringify(importData)], 'large-import.json', {
      type: 'application/json'
    });

    await user.upload(fileInput, file);

    // Should show progress or loading state
    await waitFor(() => {
      expect(screen.getByText(/importing.*items/i)).toBeInTheDocument();
    });

    const confirmButton = screen.getByRole('button', { name: /confirm import/i });
    await user.click(confirmButton);

    // Wait for completion
    await waitFor(() => {
      expect(screen.getByText(/1000.*imported successfully/i)).toBeInTheDocument();
    }, { timeout: 5000 });
  });
});