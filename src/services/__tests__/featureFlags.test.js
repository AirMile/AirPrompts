import featureFlags, { 
  isFeatureEnabled, 
  overrideFeature, 
  getAllFeatures,
  getFeature 
} from '../featureFlags';

describe('FeatureFlagsService', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    // Reset the service
    featureFlags.flags.clear();
    featureFlags.initialized = false;
  });

  describe('initialization', () => {
    it('should initialize with default flags', async () => {
      await featureFlags.initialize();
      
      expect(featureFlags.initialized).toBe(true);
      expect(isFeatureEnabled('USE_ERROR_BOUNDARIES')).toBe(true);
      expect(isFeatureEnabled('SHOW_DEBUG_INFO')).toBe(false); // false in test env
    });

    it('should load flags from environment variables', async () => {
      process.env.REACT_APP_FEATURE_TEST_FLAG = 'true';
      
      await featureFlags.initialize();
      
      expect(isFeatureEnabled('TEST_FLAG')).toBe(true);
      
      delete process.env.REACT_APP_FEATURE_TEST_FLAG;
    });

    it('should load overrides from localStorage', async () => {
      const overrides = {
        USE_NEW_STORAGE_FACADE: true,
        ENABLE_ADVANCED_SEARCH: true
      };
      localStorage.setItem('airprompts_feature_flags', JSON.stringify(overrides));
      
      await featureFlags.initialize();
      
      expect(isFeatureEnabled('USE_NEW_STORAGE_FACADE')).toBe(true);
      expect(isFeatureEnabled('ENABLE_ADVANCED_SEARCH')).toBe(true);
    });

    it('should handle initialization errors gracefully', async () => {
      // Mock localStorage to throw error
      const originalGetItem = localStorage.getItem;
      localStorage.getItem = jest.fn(() => {
        throw new Error('Storage error');
      });
      
      await featureFlags.initialize();
      
      expect(featureFlags.initialized).toBe(true);
      expect(isFeatureEnabled('USE_ERROR_BOUNDARIES')).toBe(true); // Should fall back to defaults
      
      localStorage.getItem = originalGetItem;
    });
  });

  describe('feature flag operations', () => {
    beforeEach(async () => {
      await featureFlags.initialize();
    });

    it('should check if a feature is enabled', () => {
      expect(isFeatureEnabled('USE_ERROR_BOUNDARIES')).toBe(true);
      expect(isFeatureEnabled('NON_EXISTENT_FLAG')).toBe(false);
    });

    it('should override a feature flag', () => {
      expect(isFeatureEnabled('USE_VIRTUALIZED_LISTS')).toBe(false);
      
      overrideFeature('USE_VIRTUALIZED_LISTS', true);
      
      expect(isFeatureEnabled('USE_VIRTUALIZED_LISTS')).toBe(true);
    });

    it('should persist overrides to localStorage', () => {
      overrideFeature('USE_VIRTUALIZED_LISTS', true);
      
      const stored = JSON.parse(localStorage.getItem('airprompts_feature_flags'));
      expect(stored.USE_VIRTUALIZED_LISTS).toBe(true);
    });

    it('should get all feature flags', () => {
      const allFlags = getAllFeatures();
      
      expect(allFlags).toHaveProperty('USE_ERROR_BOUNDARIES');
      expect(allFlags).toHaveProperty('ENABLE_DARK_MODE');
      expect(Object.keys(allFlags).length).toBeGreaterThan(10);
    });

    it('should get flag metadata', () => {
      const flag = getFeature('USE_ERROR_BOUNDARIES');
      
      expect(flag).toEqual({
        name: 'USE_ERROR_BOUNDARIES',
        enabled: true,
        source: 'default',
        description: 'Enable React error boundaries for better error handling'
      });
    });
  });

  describe('user context', () => {
    beforeEach(async () => {
      await featureFlags.initialize();
    });

    it('should enable features for beta users', () => {
      featureFlags.setUserContext({ isBetaUser: true });
      
      expect(isFeatureEnabled('ENABLE_AI_SUGGESTIONS')).toBe(true);
      expect(isFeatureEnabled('ENABLE_ADVANCED_SEARCH')).toBe(true);
    });

    it('should enable features based on user plan', () => {
      featureFlags.setUserContext({ plan: 'premium' });
      
      expect(isFeatureEnabled('ENABLE_CLOUD_SYNC')).toBe(true);
      expect(isFeatureEnabled('ENABLE_COLLABORATION')).toBe(true);
    });

    it('should apply gradual rollout based on user ID', () => {
      // Test with different user IDs to ensure some get the feature and some don't
      const results = [];
      
      for (let i = 0; i < 100; i++) {
        featureFlags.flags.clear();
        featureFlags.useDefaults();
        featureFlags.setUserContext({ userId: `user-${i}` });
        results.push(isFeatureEnabled('USE_VIRTUALIZED_LISTS'));
      }
      
      // Should have some true and some false (approximately 10% true)
      const enabledCount = results.filter(r => r).length;
      expect(enabledCount).toBeGreaterThan(0);
      expect(enabledCount).toBeLessThan(100);
    });
  });

  describe('subscriptions', () => {
    beforeEach(async () => {
      await featureFlags.initialize();
    });

    it('should notify subscribers on flag changes', () => {
      const callback = jest.fn();
      const unsubscribe = featureFlags.subscribe('TEST_FLAG', callback);
      
      overrideFeature('TEST_FLAG', true);
      expect(callback).toHaveBeenCalledWith(true);
      
      overrideFeature('TEST_FLAG', false);
      expect(callback).toHaveBeenCalledWith(false);
      
      expect(callback).toHaveBeenCalledTimes(2);
    });

    it('should unsubscribe correctly', () => {
      const callback = jest.fn();
      const unsubscribe = featureFlags.subscribe('TEST_FLAG', callback);
      
      overrideFeature('TEST_FLAG', true);
      expect(callback).toHaveBeenCalledTimes(1);
      
      unsubscribe();
      
      overrideFeature('TEST_FLAG', false);
      expect(callback).toHaveBeenCalledTimes(1); // Should not be called again
    });

    it('should handle multiple subscribers', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      
      featureFlags.subscribe('TEST_FLAG', callback1);
      featureFlags.subscribe('TEST_FLAG', callback2);
      
      overrideFeature('TEST_FLAG', true);
      
      expect(callback1).toHaveBeenCalledWith(true);
      expect(callback2).toHaveBeenCalledWith(true);
    });
  });

  describe('clearOverrides', () => {
    beforeEach(async () => {
      await featureFlags.initialize();
    });

    it('should clear all overrides', () => {
      overrideFeature('USE_VIRTUALIZED_LISTS', true);
      overrideFeature('ENABLE_ADVANCED_SEARCH', true);
      
      expect(isFeatureEnabled('USE_VIRTUALIZED_LISTS')).toBe(true);
      expect(isFeatureEnabled('ENABLE_ADVANCED_SEARCH')).toBe(true);
      
      featureFlags.clearOverrides();
      
      expect(isFeatureEnabled('USE_VIRTUALIZED_LISTS')).toBe(false);
      expect(isFeatureEnabled('ENABLE_ADVANCED_SEARCH')).toBe(false);
    });

    it('should remove overrides from localStorage', () => {
      overrideFeature('USE_VIRTUALIZED_LISTS', true);
      expect(localStorage.getItem('airprompts_feature_flags')).not.toBeNull();
      
      featureFlags.clearOverrides();
      
      expect(localStorage.getItem('airprompts_feature_flags')).toBeNull();
    });
  });
});