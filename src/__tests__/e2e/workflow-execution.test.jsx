import React from 'react';
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PreferencesProvider } from '@/contexts/PreferencesContext';
import { FeatureFlagsProvider } from '@/contexts/FeatureFlagsContext';
import PromptTemplateSystem from '@/components/PromptTemplateSystem';
import * as dataStorage from '@/utils/dataStorage';
import * as clipboard from '@/utils/clipboard';

// Mock the modules
jest.mock('@/utils/dataStorage');
jest.mock('@/utils/clipboard');

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

describe('Workflow Execution with Variables E2E', () => {
  let user;

  beforeEach(() => {
    user = userEvent.setup();
    jest.clearAllMocks();
    
    // Mock clipboard
    clipboard.copyToClipboard.mockResolvedValue(true);

    // Mock initial data with templates and workflows
    dataStorage.loadAllData.mockResolvedValue({
      templates: [
        {
          id: 'template-1',
          name: 'Introduction Template',
          description: 'Introduce yourself',
          content: 'Hello, my name is {name} and I work at {company}.',
          category: 'General',
          variables: ['name', 'company'],
          favorite: false
        },
        {
          id: 'template-2',
          name: 'Project Description',
          description: 'Describe a project',
          content: '{previous_output}\n\nI am working on a project called {projectName} which aims to {projectGoal}.',
          category: 'Development',
          variables: ['previous_output', 'projectName', 'projectGoal'],
          favorite: false
        },
        {
          id: 'template-3',
          name: 'Summary',
          description: 'Summarize the conversation',
          content: '{previous_output}\n\nIn summary, the key points are:\n- {keyPoint1}\n- {keyPoint2}',
          category: 'General',
          variables: ['previous_output', 'keyPoint1', 'keyPoint2'],
          favorite: false
        }
      ],
      workflows: [
        {
          id: 'workflow-1',
          name: 'Complete Introduction Workflow',
          description: 'A complete introduction with project details',
          steps: ['template-1', 'template-2', 'template-3'],
          category: 'Professional',
          favorite: false
        }
      ],
      snippets: [],
      folders: []
    });

    dataStorage.saveTemplates.mockResolvedValue();
    dataStorage.saveWorkflows.mockResolvedValue();
  });

  it('should execute a multi-step workflow with variable chaining', async () => {
    renderWithProviders(<PromptTemplateSystem />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('My Prompt Templates')).toBeInTheDocument();
    });

    // Switch to workflows tab
    const workflowsTab = screen.getByRole('tab', { name: /workflows/i });
    await user.click(workflowsTab);

    // Find and execute the workflow
    await waitFor(() => {
      expect(screen.getByText('Complete Introduction Workflow')).toBeInTheDocument();
    });

    const workflowCard = screen.getByText('Complete Introduction Workflow').closest('[role="article"]');
    const executeButton = within(workflowCard).getByRole('button', { name: /execute/i });
    await user.click(executeButton);

    // Should be on the executor page
    await waitFor(() => {
      expect(screen.getByText('Execute: Complete Introduction Workflow')).toBeInTheDocument();
    });

    // Step 1: Introduction Template
    expect(screen.getByText('Step 1 of 3: Introduction Template')).toBeInTheDocument();
    
    // Fill in variables for step 1
    const nameInput = screen.getByLabelText(/name/i);
    const companyInput = screen.getByLabelText(/company/i);
    
    await user.type(nameInput, 'John Doe');
    await user.type(companyInput, 'Acme Corp');

    // Preview should update
    const previewSection = screen.getByTestId('preview-section');
    await waitFor(() => {
      within(previewSection).getByText('Hello, my name is John Doe and I work at Acme Corp.');
    });

    // Proceed to next step
    const nextButton = screen.getByRole('button', { name: /next step/i });
    await user.click(nextButton);

    // Step 2: Project Description
    await waitFor(() => {
      expect(screen.getByText('Step 2 of 3: Project Description')).toBeInTheDocument();
    });

    // Previous output should be pre-filled
    const previousOutputField = screen.getByLabelText(/previous_output/i);
    expect(previousOutputField.value).toBe('Hello, my name is John Doe and I work at Acme Corp.');

    // Fill in project details
    const projectNameInput = screen.getByLabelText(/projectName/i);
    const projectGoalInput = screen.getByLabelText(/projectGoal/i);

    await user.type(projectNameInput, 'AI Assistant');
    await user.type(projectGoalInput, 'help users with their daily tasks');

    // Check preview
    await waitFor(() => {
      const preview = screen.getByTestId('preview-section');
      expect(within(preview).getByText(/I am working on a project called AI Assistant/)).toBeInTheDocument();
    });

    // Proceed to final step
    await user.click(screen.getByRole('button', { name: /next step/i }));

    // Step 3: Summary
    await waitFor(() => {
      expect(screen.getByText('Step 3 of 3: Summary')).toBeInTheDocument();
    });

    // Previous output should contain both previous steps
    const summaryPreviousOutput = screen.getByLabelText(/previous_output/i);
    expect(summaryPreviousOutput.value).toContain('Hello, my name is John Doe');
    expect(summaryPreviousOutput.value).toContain('I am working on a project called AI Assistant');

    // Fill in key points
    const keyPoint1Input = screen.getByLabelText(/keyPoint1/i);
    const keyPoint2Input = screen.getByLabelText(/keyPoint2/i);

    await user.type(keyPoint1Input, 'Working at Acme Corp on innovative projects');
    await user.type(keyPoint2Input, 'Building AI Assistant to enhance productivity');

    // Copy final result
    const copyButton = screen.getByRole('button', { name: /copy result/i });
    await user.click(copyButton);

    // Verify clipboard was called with complete output
    expect(clipboard.copyToClipboard).toHaveBeenCalledWith(
      expect.stringContaining('Hello, my name is John Doe')
    );
    expect(clipboard.copyToClipboard).toHaveBeenCalledWith(
      expect.stringContaining('Working at Acme Corp on innovative projects')
    );

    // Verify success message
    await waitFor(() => {
      expect(screen.getByText(/copied to clipboard/i)).toBeInTheDocument();
    });
  });

  it('should handle workflow with missing variables', async () => {
    renderWithProviders(<PromptTemplateSystem />);

    // Wait and switch to workflows
    await waitFor(() => {
      expect(screen.getByText('My Prompt Templates')).toBeInTheDocument();
    });

    const workflowsTab = screen.getByRole('tab', { name: /workflows/i });
    await user.click(workflowsTab);

    const workflowCard = screen.getByText('Complete Introduction Workflow').closest('[role="article"]');
    const executeButton = within(workflowCard).getByRole('button', { name: /execute/i });
    await user.click(executeButton);

    // Try to proceed without filling variables
    const nextButton = screen.getByRole('button', { name: /next step/i });
    await user.click(nextButton);

    // Should show validation errors
    await waitFor(() => {
      expect(screen.getByText(/please fill in all required variables/i)).toBeInTheDocument();
    });
  });

  it('should allow going back to previous steps', async () => {
    renderWithProviders(<PromptTemplateSystem />);

    // Navigate to workflow execution
    await waitFor(() => {
      expect(screen.getByText('My Prompt Templates')).toBeInTheDocument();
    });

    const workflowsTab = screen.getByRole('tab', { name: /workflows/i });
    await user.click(workflowsTab);

    const workflowCard = screen.getByText('Complete Introduction Workflow').closest('[role="article"]');
    const executeButton = within(workflowCard).getByRole('button', { name: /execute/i });
    await user.click(executeButton);

    // Fill step 1 and proceed
    await user.type(screen.getByLabelText(/name/i), 'Jane Smith');
    await user.type(screen.getByLabelText(/company/i), 'Tech Corp');
    await user.click(screen.getByRole('button', { name: /next step/i }));

    // Should be on step 2
    await waitFor(() => {
      expect(screen.getByText('Step 2 of 3: Project Description')).toBeInTheDocument();
    });

    // Go back to step 1
    const backButton = screen.getByRole('button', { name: /previous step/i });
    await user.click(backButton);

    // Should be back on step 1 with values preserved
    await waitFor(() => {
      expect(screen.getByText('Step 1 of 3: Introduction Template')).toBeInTheDocument();
      expect(screen.getByLabelText(/name/i).value).toBe('Jane Smith');
      expect(screen.getByLabelText(/company/i).value).toBe('Tech Corp');
    });
  });

  it('should handle workflow execution errors gracefully', async () => {
    // Mock clipboard error
    clipboard.copyToClipboard.mockRejectedValue(new Error('Clipboard access denied'));

    renderWithProviders(<PromptTemplateSystem />);

    // Navigate to workflow execution
    await waitFor(() => {
      expect(screen.getByText('My Prompt Templates')).toBeInTheDocument();
    });

    const workflowsTab = screen.getByRole('tab', { name: /workflows/i });
    await user.click(workflowsTab);

    const workflowCard = screen.getByText('Complete Introduction Workflow').closest('[role="article"]');
    const executeButton = within(workflowCard).getByRole('button', { name: /execute/i });
    await user.click(executeButton);

    // Fill variables
    await user.type(screen.getByLabelText(/name/i), 'Test User');
    await user.type(screen.getByLabelText(/company/i), 'Test Co');

    // Try to copy
    const copyButton = screen.getByRole('button', { name: /copy result/i });
    await user.click(copyButton);

    // Should show error message
    await waitFor(() => {
      expect(screen.getByText(/failed to copy to clipboard/i)).toBeInTheDocument();
    });
  });

  it('should save workflow execution history', async () => {
    renderWithProviders(<PromptTemplateSystem />);

    // Navigate and execute workflow
    await waitFor(() => {
      expect(screen.getByText('My Prompt Templates')).toBeInTheDocument();
    });

    const workflowsTab = screen.getByRole('tab', { name: /workflows/i });
    await user.click(workflowsTab);

    const workflowCard = screen.getByText('Complete Introduction Workflow').closest('[role="article"]');
    const executeButton = within(workflowCard).getByRole('button', { name: /execute/i });
    await user.click(executeButton);

    // Complete all steps
    // Step 1
    await user.type(screen.getByLabelText(/name/i), 'History Test');
    await user.type(screen.getByLabelText(/company/i), 'History Corp');
    await user.click(screen.getByRole('button', { name: /next step/i }));

    // Step 2
    await user.type(screen.getByLabelText(/projectName/i), 'Test Project');
    await user.type(screen.getByLabelText(/projectGoal/i), 'test workflow history');
    await user.click(screen.getByRole('button', { name: /next step/i }));

    // Step 3
    await user.type(screen.getByLabelText(/keyPoint1/i), 'Point 1');
    await user.type(screen.getByLabelText(/keyPoint2/i), 'Point 2');

    // Complete workflow
    const completeButton = screen.getByRole('button', { name: /complete workflow/i });
    await user.click(completeButton);

    // Should return to workflows list
    await waitFor(() => {
      expect(screen.getByText('Complete Introduction Workflow')).toBeInTheDocument();
      expect(screen.getByText(/workflow completed successfully/i)).toBeInTheDocument();
    });
  });
});