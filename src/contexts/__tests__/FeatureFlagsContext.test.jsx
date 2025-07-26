import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { render, screen } from '../../tests/utils/test-utils';
import { 
  FeatureFlagsProvider, 
  useFeatureFlags, 
  useFeature, 
  Feature,
  withFeatureFlag 
} from '../FeatureFlagsContext';
import featureFlags from '../../services/featureFlags';

// Mock the feature flags service
jest.mock('../../services/featureFlags', () => ({
  default: {
    initialize: jest.fn(() => Promise.resolve()),
    setUserContext: jest.fn(),
    getAllFlags: jest.fn(() => ({
      TEST_FEATURE: true,
      DISABLED_FEATURE: false
    })),
    isEnabled: jest.fn((flag) => flag === 'TEST_FEATURE'),
    override: jest.fn(),
    clearOverrides: jest.fn(),
    getFlag: jest.fn((flag) => ({
      name: flag,
      enabled: flag === 'TEST_FEATURE',
      source: 'test',
      description: `Test description for ${flag}`
    })),
    subscribe: jest.fn(() => jest.fn())
  }
}));

describe('FeatureFlagsContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('FeatureFlagsProvider', () => {
    it('should initialize feature flags on mount', async () => {
      render(
        <FeatureFlagsProvider>
          <div>Test</div>
        </FeatureFlagsProvider>
      );

      await waitFor(() => {
        expect(featureFlags.initialize).toHaveBeenCalled();
      });
    });

    it('should set user context when provided', async () => {
      const userContext = { userId: 'test-user', isBetaUser: true };
      
      render(
        <FeatureFlagsProvider userContext={userContext}>
          <div>Test</div>
        </FeatureFlagsProvider>
      );

      await waitFor(() => {
        expect(featureFlags.setUserContext).toHaveBeenCalledWith(userContext);
      });
    });
  });

  describe('useFeatureFlags hook', () => {
    const wrapper = ({ children }) => (
      <FeatureFlagsProvider>{children}</FeatureFlagsProvider>
    );

    it('should provide feature flag methods', async () => {
      const { result } = renderHook(() => useFeatureFlags(), { wrapper });

      await waitFor(() => {
        expect(result.current.initialized).toBe(true);
      });

      expect(result.current).toHaveProperty('flags');
      expect(result.current).toHaveProperty('isEnabled');
      expect(result.current).toHaveProperty('override');
      expect(result.current).toHaveProperty('clearOverrides');
      expect(result.current).toHaveProperty('getFlag');
    });

    it('should check if a feature is enabled', async () => {
      const { result } = renderHook(() => useFeatureFlags(), { wrapper });

      await waitFor(() => {
        expect(result.current.initialized).toBe(true);
      });

      expect(result.current.isEnabled('TEST_FEATURE')).toBe(true);
      expect(result.current.isEnabled('DISABLED_FEATURE')).toBe(false);
    });

    it('should override a feature flag', async () => {
      const { result } = renderHook(() => useFeatureFlags(), { wrapper });

      await waitFor(() => {
        expect(result.current.initialized).toBe(true);
      });

      act(() => {
        result.current.override('NEW_FEATURE', true);
      });

      expect(featureFlags.override).toHaveBeenCalledWith('NEW_FEATURE', true);
    });

    it('should clear overrides', async () => {
      const { result } = renderHook(() => useFeatureFlags(), { wrapper });

      await waitFor(() => {
        expect(result.current.initialized).toBe(true);
      });

      act(() => {
        result.current.clearOverrides();
      });

      expect(featureFlags.clearOverrides).toHaveBeenCalled();
    });

    it('should throw error when used outside provider', () => {
      const { result } = renderHook(() => useFeatureFlags());

      expect(result.error).toEqual(
        Error('useFeatureFlags must be used within FeatureFlagsProvider')
      );
    });
  });

  describe('useFeature hook', () => {
    const wrapper = ({ children }) => (
      <FeatureFlagsProvider>{children}</FeatureFlagsProvider>
    );

    it('should return feature flag state', async () => {
      const { result } = renderHook(() => useFeature('TEST_FEATURE'), { wrapper });

      await waitFor(() => {
        expect(result.current).toBe(true);
      });
    });

    it('should return false for disabled features', async () => {
      const { result } = renderHook(() => useFeature('DISABLED_FEATURE'), { wrapper });

      await waitFor(() => {
        expect(result.current).toBe(false);
      });
    });
  });

  describe('Feature component', () => {
    it('should render children when feature is enabled', async () => {
      render(
        <FeatureFlagsProvider>
          <Feature flag="TEST_FEATURE">
            <div>Feature Content</div>
          </Feature>
        </FeatureFlagsProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Feature Content')).toBeInTheDocument();
      });
    });

    it('should not render children when feature is disabled', async () => {
      render(
        <FeatureFlagsProvider>
          <Feature flag="DISABLED_FEATURE">
            <div>Feature Content</div>
          </Feature>
        </FeatureFlagsProvider>
      );

      await waitFor(() => {
        expect(screen.queryByText('Feature Content')).not.toBeInTheDocument();
      });
    });

    it('should render fallback when feature is disabled', async () => {
      render(
        <FeatureFlagsProvider>
          <Feature flag="DISABLED_FEATURE" fallback={<div>Fallback Content</div>}>
            <div>Feature Content</div>
          </Feature>
        </FeatureFlagsProvider>
      );

      await waitFor(() => {
        expect(screen.queryByText('Feature Content')).not.toBeInTheDocument();
        expect(screen.getByText('Fallback Content')).toBeInTheDocument();
      });
    });
  });

  describe('withFeatureFlag HOC', () => {
    const TestComponent = () => <div>Test Component</div>;
    const FallbackComponent = () => <div>Fallback Component</div>;

    it('should render wrapped component when feature is enabled', async () => {
      const WrappedComponent = withFeatureFlag('TEST_FEATURE')(TestComponent);
      
      render(
        <FeatureFlagsProvider>
          <WrappedComponent />
        </FeatureFlagsProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Test Component')).toBeInTheDocument();
      });
    });

    it('should not render wrapped component when feature is disabled', async () => {
      const WrappedComponent = withFeatureFlag('DISABLED_FEATURE')(TestComponent);
      
      render(
        <FeatureFlagsProvider>
          <WrappedComponent />
        </FeatureFlagsProvider>
      );

      await waitFor(() => {
        expect(screen.queryByText('Test Component')).not.toBeInTheDocument();
      });
    });

    it('should render fallback component when provided and feature is disabled', async () => {
      const WrappedComponent = withFeatureFlag(
        'DISABLED_FEATURE', 
        FallbackComponent
      )(TestComponent);
      
      render(
        <FeatureFlagsProvider>
          <WrappedComponent />
        </FeatureFlagsProvider>
      );

      await waitFor(() => {
        expect(screen.queryByText('Test Component')).not.toBeInTheDocument();
        expect(screen.getByText('Fallback Component')).toBeInTheDocument();
      });
    });

    it('should preserve display name', () => {
      const WrappedComponent = withFeatureFlag('TEST_FEATURE')(TestComponent);
      expect(WrappedComponent.displayName).toBe('withFeatureFlag(TEST_FEATURE)(TestComponent)');
    });
  });
});