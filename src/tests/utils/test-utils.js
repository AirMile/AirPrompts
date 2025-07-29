import React from 'react';
import { render as rtlRender } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FeatureFlagsProvider } from '../../contexts/FeatureFlagsContext';

/**
 * Custom render function that includes all necessary providers
 */
export function render(ui, options = {}) {
  const { initialFeatureFlags = {}, userContext = null, ...renderOptions } = options;

  // Mock feature flags service
  jest.mock('../../services/featureFlags', () => ({
    default: {
      isEnabled: jest.fn((flag) => initialFeatureFlags[flag] ?? false),
      getAllFlags: jest.fn(() => initialFeatureFlags),
      initialize: jest.fn(() => Promise.resolve()),
      setUserContext: jest.fn(),
      override: jest.fn(),
      clearOverrides: jest.fn(),
      getFlag: jest.fn((flag) => ({
        name: flag,
        enabled: initialFeatureFlags[flag] ?? false,
        source: 'test',
      })),
    },
  }));

  function Wrapper({ children }) {
    return <FeatureFlagsProvider userContext={userContext}>{children}</FeatureFlagsProvider>;
  }

  return {
    user: userEvent.setup(),
    ...rtlRender(ui, { wrapper: Wrapper, ...renderOptions }),
  };
}

/**
 * Create mock data for testing
 */
export const createMockTemplate = (overrides = {}) => ({
  id: 'template-1',
  name: 'Test Template',
  description: 'A test template',
  content: 'Hello {name}, this is a test template.',
  category: 'general',
  variables: ['name'],
  favorite: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

export const createMockWorkflow = (overrides = {}) => ({
  id: 'workflow-1',
  name: 'Test Workflow',
  description: 'A test workflow',
  steps: [
    { templateId: 'template-1', order: 0 },
    { templateId: 'template-2', order: 1 },
  ],
  category: 'automation',
  favorite: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

export const createMockSnippet = (overrides = {}) => ({
  id: 'snippet-1',
  name: 'Test Snippet',
  description: 'A test snippet',
  content: 'console.log("test");',
  language: 'javascript',
  category: 'code',
  favorite: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

/**
 * Wait for async updates
 */
export const waitForAsync = () => new Promise((resolve) => setTimeout(resolve, 0));

/**
 * Mock API responses
 */
export const mockAPIResponse = (data, options = {}) => {
  const { delay = 0, error = null } = options;

  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (error) {
        reject(error);
      } else {
        resolve({
          ok: true,
          json: async () => data,
          text: async () => JSON.stringify(data),
          status: 200,
          headers: new Headers({
            'content-type': 'application/json',
          }),
        });
      }
    }, delay);
  });
};

/**
 * Test performance metrics
 */
export const measureRenderTime = async (component) => {
  const start = performance.now();
  const result = render(component);
  await waitForAsync();
  const end = performance.now();

  return {
    ...result,
    renderTime: end - start,
  };
};

/**
 * Test accessibility
 */
export const checkAccessibility = async (container) => {
  // This is a simplified version. In a real app, you might use
  // jest-axe or a similar tool for comprehensive a11y testing
  const errors = [];

  // Check for missing alt text on images
  const images = container.querySelectorAll('img:not([alt])');
  if (images.length > 0) {
    errors.push(`${images.length} images missing alt text`);
  }

  // Check for missing labels on form controls
  const inputs = container.querySelectorAll('input:not([aria-label]):not([aria-labelledby])');
  const unlabeledInputs = Array.from(inputs).filter((input) => {
    const id = input.getAttribute('id');
    if (!id) return true;
    return !container.querySelector(`label[for="${id}"]`);
  });

  if (unlabeledInputs.length > 0) {
    errors.push(`${unlabeledInputs.length} form inputs missing labels`);
  }

  // Check for proper heading hierarchy
  const headings = Array.from(container.querySelectorAll('h1, h2, h3, h4, h5, h6'));
  let lastLevel = 0;
  headings.forEach((heading) => {
    const level = parseInt(heading.tagName[1]);
    if (level > lastLevel + 1) {
      errors.push(`Heading hierarchy broken: h${lastLevel} followed by h${level}`);
    }
    lastLevel = level;
  });

  return {
    accessible: errors.length === 0,
    errors,
  };
};

/**
 * Mock feature flag for testing
 */
export const withFeatureFlag = (flagName, enabled = true) => {
  return () => (props) => {
    return render(<div {...props} />, { initialFeatureFlags: { [flagName]: enabled } });
  };
};

// Re-export everything from React Testing Library
export * from '@testing-library/react';
export { userEvent };
