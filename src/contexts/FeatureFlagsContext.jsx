import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import featureFlags, { subscribeToFeature } from '../services/featureFlags';

const FeatureFlagsContext = createContext({});

/**
 * Feature Flags Provider
 * 
 * Provides feature flag state and utilities to the entire application
 * Automatically updates when flags change
 */
export const FeatureFlagsProvider = ({ children, userContext }) => {
  const [flags, setFlags] = useState({});
  const [initialized, setInitialized] = useState(false);

  // Initialize feature flags
  useEffect(() => {
    const initializeFlags = async () => {
      try {
        // Set user context if provided
        if (userContext) {
          featureFlags.setUserContext(userContext);
        }
        
        // Initialize the service
        await featureFlags.initialize();
        
        // Get initial flag values
        setFlags(featureFlags.getAllFlags());
        setInitialized(true);
      } catch (error) {
        console.error('Failed to initialize feature flags:', error);
        setInitialized(true); // Still mark as initialized to prevent infinite loading
      }
    };

    initializeFlags();
  }, [userContext]);

  // Subscribe to all flag changes
  useEffect(() => {
    if (!initialized) return;

    const unsubscribers = [];
    
    // Subscribe to each flag
    Object.keys(flags).forEach(flagName => {
      const unsubscribe = subscribeToFeature(flagName, (newValue) => {
        setFlags(prev => ({
          ...prev,
          [flagName]: newValue
        }));
      });
      unsubscribers.push(unsubscribe);
    });

    // Cleanup subscriptions
    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }, [initialized, flags]);

  // Check if a feature is enabled
  const isEnabled = useCallback((flagName) => {
    return featureFlags.isEnabled(flagName);
  }, []);

  // Override a feature flag
  const override = useCallback((flagName, value) => {
    featureFlags.override(flagName, value);
    setFlags(prev => ({
      ...prev,
      [flagName]: value
    }));
  }, []);

  // Clear all overrides
  const clearOverrides = useCallback(() => {
    featureFlags.clearOverrides();
    setFlags(featureFlags.getAllFlags());
  }, []);

  // Get flag with metadata
  const getFlag = useCallback((flagName) => {
    return featureFlags.getFlag(flagName);
  }, []);

  const value = {
    flags,
    initialized,
    isEnabled,
    override,
    clearOverrides,
    getFlag
  };

  return (
    <FeatureFlagsContext.Provider value={value}>
      {children}
    </FeatureFlagsContext.Provider>
  );
};

/**
 * Hook to access feature flags
 */
export const useFeatureFlags = () => {
  const context = useContext(FeatureFlagsContext);
  
  if (!context) {
    throw new Error('useFeatureFlags must be used within FeatureFlagsProvider');
  }
  
  return context;
};

/**
 * Hook to check a specific feature flag
 */
export const useFeature = (flagName) => {
  const { isEnabled } = useFeatureFlags();
  return isEnabled(flagName);
};

/**
 * Component to conditionally render based on feature flag
 */
export const Feature = ({ flag, children, fallback = null }) => {
  const isEnabled = useFeature(flag);
  
  if (isEnabled) {
    return <>{children}</>;
  }
  
  return <>{fallback}</>;
};

/**
 * HOC to wrap components with feature flag check
 */
export const withFeatureFlag = (flagName, FallbackComponent = null) => {
  return (WrappedComponent) => {
    const WithFeatureFlagComponent = (props) => {
      const isEnabled = useFeature(flagName);
      
      if (isEnabled) {
        return <WrappedComponent {...props} />;
      }
      
      if (FallbackComponent) {
        return <FallbackComponent {...props} />;
      }
      
      return null;
    };
    
    WithFeatureFlagComponent.displayName = `withFeatureFlag(${flagName})(${WrappedComponent.displayName || WrappedComponent.name})`;
    
    return WithFeatureFlagComponent;
  };
};