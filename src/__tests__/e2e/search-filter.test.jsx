import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PreferencesProvider } from '@/contexts/PreferencesContext';
import { FeatureFlagsProvider } from '@/contexts/FeatureFlagsContext';
import PromptTemplateSystem from '@/components/PromptTemplateSystem';
import * as dataStorage from '@/utils/dataStorage';

// Mock the data storage
jest.mock('@/utils/dataStorage');

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

describe('Search and Filter Functionality E2E', () => {
  let user;
  
  const mockTemplates = [
    {
      id: '1',
      name: 'Email Introduction',
      description: 'Professional email introduction template',
      content: 'Dear {recipient}, I hope this email finds you well...',
      category: 'Email',
      variables: ['recipient'],
      favorite: true
    },
    {
      id: '2',
      name: 'Code Review Request',
      description: 'Request code review from team members',
      content: 'Hi team, I have completed {feature} and would appreciate a review...',
      category: 'Development',
      variables: ['feature'],
      favorite: false
    },
    {
      id: '3',
      name: 'Meeting Summary',
      description: 'Summarize meeting outcomes and action items',
      content: 'Meeting Date: {date}\nAttendees: {attendees}\nKey Points: {points}',
      category: 'Meeting',
      variables: ['date', 'attendees', 'points'],
      favorite: false
    },
    {
      id: '4',
      name: 'Bug Report Template',
      description: 'Template for reporting bugs with all necessary details',
      content: 'Bug Title: {title}\nSteps to Reproduce: {steps}\nExpected: {expected}\nActual: {actual}',
      category: 'Development',
      variables: ['title', 'steps', 'expected', 'actual'],
      favorite: true
    },
    {
      id: '5',
      name: 'Customer Support Response',
      description: 'Respond to customer inquiries professionally',
      content: 'Hello {customerName}, Thank you for reaching out...',
      category: 'Support',
      variables: ['customerName'],
      favorite: false
    }
  ];

  const mockWorkflows = [
    {
      id: 'w1',
      name: 'Development Workflow',
      description: 'Complete development cycle workflow',
      steps: ['2', '4'],
      category: 'Development',
      favorite: true
    },
    {
      id: 'w2',
      name: 'Customer Onboarding',
      description: 'Onboard new customers step by step',
      steps: ['1', '5'],
      category: 'Support',
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
  });

  it('should filter items by search query', async () => {
    renderWithProviders(<PromptTemplateSystem />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('Email Introduction')).toBeInTheDocument();
      expect(screen.getByText('Code Review Request')).toBeInTheDocument();
      expect(screen.getByText('Meeting Summary')).toBeInTheDocument();
    });

    // Search for "email"
    const searchInput = screen.getByPlaceholderText(/search templates/i);
    await user.type(searchInput, 'email');

    // Should only show email-related templates
    await waitFor(() => {
      expect(screen.getByText('Email Introduction')).toBeInTheDocument();
      expect(screen.queryByText('Code Review Request')).not.toBeInTheDocument();
      expect(screen.queryByText('Meeting Summary')).not.toBeInTheDocument();
    });

    // Clear search
    await user.clear(searchInput);

    // All templates should be visible again
    await waitFor(() => {
      expect(screen.getByText('Email Introduction')).toBeInTheDocument();
      expect(screen.getByText('Code Review Request')).toBeInTheDocument();
      expect(screen.getByText('Meeting Summary')).toBeInTheDocument();
    });
  });

  it('should filter by category', async () => {
    renderWithProviders(<PromptTemplateSystem />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('Email Introduction')).toBeInTheDocument();
    });

    // Select Development category
    const categoryFilter = screen.getByLabelText(/filter by category/i);
    await user.selectOptions(categoryFilter, 'Development');

    // Should only show Development templates
    await waitFor(() => {
      expect(screen.getByText('Code Review Request')).toBeInTheDocument();
      expect(screen.getByText('Bug Report Template')).toBeInTheDocument();
      expect(screen.queryByText('Email Introduction')).not.toBeInTheDocument();
      expect(screen.queryByText('Meeting Summary')).not.toBeInTheDocument();
    });

    // Select All categories
    await user.selectOptions(categoryFilter, '');

    // All templates should be visible
    await waitFor(() => {
      expect(screen.getByText('Email Introduction')).toBeInTheDocument();
      expect(screen.getByText('Code Review Request')).toBeInTheDocument();
      expect(screen.getByText('Meeting Summary')).toBeInTheDocument();
    });
  });

  it('should filter by favorites', async () => {
    renderWithProviders(<PromptTemplateSystem />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('Email Introduction')).toBeInTheDocument();
    });

    // Click favorites filter
    const favoritesToggle = screen.getByRole('checkbox', { name: /show favorites only/i });
    await user.click(favoritesToggle);

    // Should only show favorite templates
    await waitFor(() => {
      expect(screen.getByText('Email Introduction')).toBeInTheDocument();
      expect(screen.getByText('Bug Report Template')).toBeInTheDocument();
      expect(screen.queryByText('Code Review Request')).not.toBeInTheDocument();
      expect(screen.queryByText('Meeting Summary')).not.toBeInTheDocument();
    });

    // Toggle off favorites
    await user.click(favoritesToggle);

    // All templates should be visible again
    await waitFor(() => {
      expect(screen.getByText('Email Introduction')).toBeInTheDocument();
      expect(screen.getByText('Code Review Request')).toBeInTheDocument();
      expect(screen.getByText('Meeting Summary')).toBeInTheDocument();
    });
  });

  it('should combine search and category filters', async () => {
    renderWithProviders(<PromptTemplateSystem />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('Email Introduction')).toBeInTheDocument();
    });

    // Select Development category
    const categoryFilter = screen.getByLabelText(/filter by category/i);
    await user.selectOptions(categoryFilter, 'Development');

    // Search within Development category
    const searchInput = screen.getByPlaceholderText(/search templates/i);
    await user.type(searchInput, 'bug');

    // Should only show Bug Report Template
    await waitFor(() => {
      expect(screen.getByText('Bug Report Template')).toBeInTheDocument();
      expect(screen.queryByText('Code Review Request')).not.toBeInTheDocument();
      expect(screen.queryByText('Email Introduction')).not.toBeInTheDocument();
    });
  });

  it('should search in workflows tab', async () => {
    renderWithProviders(<PromptTemplateSystem />);

    // Switch to workflows tab
    const workflowsTab = screen.getByRole('tab', { name: /workflows/i });
    await user.click(workflowsTab);

    // Wait for workflows to load
    await waitFor(() => {
      expect(screen.getByText('Development Workflow')).toBeInTheDocument();
      expect(screen.getByText('Customer Onboarding')).toBeInTheDocument();
    });

    // Search for "development"
    const searchInput = screen.getByPlaceholderText(/search workflows/i);
    await user.type(searchInput, 'development');

    // Should only show Development Workflow
    await waitFor(() => {
      expect(screen.getByText('Development Workflow')).toBeInTheDocument();
      expect(screen.queryByText('Customer Onboarding')).not.toBeInTheDocument();
    });
  });

  it('should show empty state when no results match', async () => {
    renderWithProviders(<PromptTemplateSystem />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('Email Introduction')).toBeInTheDocument();
    });

    // Search for non-existent item
    const searchInput = screen.getByPlaceholderText(/search templates/i);
    await user.type(searchInput, 'xyz123nonexistent');

    // Should show empty state
    await waitFor(() => {
      expect(screen.getByText(/no templates found/i)).toBeInTheDocument();
      expect(screen.getByText(/try adjusting your search/i)).toBeInTheDocument();
    });
  });

  it('should maintain filters when switching tabs', async () => {
    renderWithProviders(<PromptTemplateSystem />);

    // Set search query
    const searchInput = screen.getByPlaceholderText(/search templates/i);
    await user.type(searchInput, 'development');

    // Switch to workflows tab
    const workflowsTab = screen.getByRole('tab', { name: /workflows/i });
    await user.click(workflowsTab);

    // Search should persist and filter workflows
    await waitFor(() => {
      expect(screen.getByText('Development Workflow')).toBeInTheDocument();
      expect(screen.queryByText('Customer Onboarding')).not.toBeInTheDocument();
    });

    // Switch back to templates
    const templatesTab = screen.getByRole('tab', { name: /templates/i });
    await user.click(templatesTab);

    // Search should still be active
    await waitFor(() => {
      expect(searchInput.value).toBe('development');
    });
  });

  it('should update favorite status and maintain filter', async () => {
    renderWithProviders(<PromptTemplateSystem />);

    // Enable favorites filter
    const favoritesToggle = screen.getByRole('checkbox', { name: /show favorites only/i });
    await user.click(favoritesToggle);

    // Should show only favorites
    await waitFor(() => {
      expect(screen.getByText('Email Introduction')).toBeInTheDocument();
      expect(screen.getByText('Bug Report Template')).toBeInTheDocument();
    });

    // Toggle favorite on Email Introduction (unfavorite it)
    const emailCard = screen.getByText('Email Introduction').closest('[role="article"]');
    const favoriteButton = within(emailCard).getByRole('button', { name: /favorite/i });
    await user.click(favoriteButton);

    // Email Introduction should disappear from favorites view
    await waitFor(() => {
      expect(screen.queryByText('Email Introduction')).not.toBeInTheDocument();
      expect(screen.getByText('Bug Report Template')).toBeInTheDocument();
    });
  });

  it('should handle case-insensitive search', async () => {
    renderWithProviders(<PromptTemplateSystem />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('Email Introduction')).toBeInTheDocument();
    });

    // Search with different cases
    const searchInput = screen.getByPlaceholderText(/search templates/i);
    await user.type(searchInput, 'EMAIL');

    // Should still find email templates
    await waitFor(() => {
      expect(screen.getByText('Email Introduction')).toBeInTheDocument();
    });

    // Try mixed case
    await user.clear(searchInput);
    await user.type(searchInput, 'BuG rEpOrT');

    // Should find Bug Report Template
    await waitFor(() => {
      expect(screen.getByText('Bug Report Template')).toBeInTheDocument();
      expect(screen.queryByText('Email Introduction')).not.toBeInTheDocument();
    });
  });

  it('should search in template descriptions', async () => {
    renderWithProviders(<PromptTemplateSystem />);

    // Search for text in description
    const searchInput = screen.getByPlaceholderText(/search templates/i);
    await user.type(searchInput, 'professional');

    // Should find templates with "professional" in description
    await waitFor(() => {
      expect(screen.getByText('Email Introduction')).toBeInTheDocument();
      expect(screen.getByText('Customer Support Response')).toBeInTheDocument();
      expect(screen.queryByText('Code Review Request')).not.toBeInTheDocument();
    });
  });
});