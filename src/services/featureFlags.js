/**
 * Feature Flags Service
 *
 * Provides a centralized system for managing feature toggles
 * Supports environment-based configuration and runtime updates
 * Enables gradual rollout and A/B testing capabilities
 */

class FeatureFlagsService {
  constructor() {
    this.flags = new Map();
    this.listeners = new Map();
    this.userContext = null;
    this.initialized = false;

    // Default flags configuration
    this.defaultFlags = {
      // Core refactoring features
      USE_NEW_STORAGE_FACADE: false,
      USE_ERROR_BOUNDARIES: true,
      USE_PERFORMANCE_MONITORING: true,
      USE_VIRTUALIZED_LISTS: false,
      USE_BASE_COMPONENTS: false,

      // UI/UX features
      ENABLE_DARK_MODE: true,
      ENABLE_DRAG_DROP: true,
      ENABLE_ADVANCED_SEARCH: false,
      ENABLE_CONTEXT_MENUS: false,
      ENABLE_KEYBOARD_SHORTCUTS: true,

      // Performance features
      ENABLE_CODE_SPLITTING: false,
      ENABLE_LAZY_LOADING: true,
      ENABLE_SERVICE_WORKER: false,
      ENABLE_PREFETCHING: false,

      // Developer features
      SHOW_DEBUG_INFO: import.meta.env.DEV,
      ENABLE_DEV_TOOLS: import.meta.env.DEV,
      ENABLE_PERFORMANCE_MARKS: import.meta.env.DEV,

      // Experimental features
      ENABLE_AI_SUGGESTIONS: false,
      ENABLE_COLLABORATION: false,
      ENABLE_CLOUD_SYNC: false,
    };
  }

  /**
   * Initialize feature flags from various sources
   */
  async initialize() {
    if (this.initialized) return;

    try {
      // 1. Load from environment variables
      this.loadFromEnvironment();

      // 2. Load from localStorage (user overrides)
      this.loadFromLocalStorage();

      // 3. Load from remote config (if available)
      await this.loadFromRemote();

      // 4. Apply user context rules
      this.applyUserContext();

      this.initialized = true;
      console.log('Feature flags initialized:', this.getAllFlags());
    } catch (error) {
      console.error('Failed to initialize feature flags:', error);
      // Fall back to defaults
      this.useDefaults();
    }
  }

  /**
   * Load flags from environment variables
   */
  loadFromEnvironment() {
    // Check for VITE_FEATURE_* environment variables
    Object.entries(import.meta.env).forEach(([key, value]) => {
      if (key.startsWith('VITE_FEATURE_')) {
        const flagName = key.replace('VITE_FEATURE_', '');
        this.flags.set(flagName, value === 'true');
      }
    });
  }

  /**
   * Load user-specific overrides from localStorage
   */
  loadFromLocalStorage() {
    try {
      const stored = localStorage.getItem('airprompts_feature_flags');
      if (stored) {
        const overrides = JSON.parse(stored);
        Object.entries(overrides).forEach(([flag, value]) => {
          this.flags.set(flag, value);
        });
      }
    } catch (error) {
      console.error('Failed to load feature flags from localStorage:', error);
    }
  }

  /**
   * Load flags from remote configuration service
   */
  async loadFromRemote() {
    // Skip in development or if no endpoint configured
    if (import.meta.env.DEV || !import.meta.env.VITE_FLAGS_ENDPOINT) {
      return;
    }

    try {
      const response = await fetch(import.meta.env.VITE_FLAGS_ENDPOINT, {
        headers: {
          'X-User-Context': JSON.stringify(this.userContext),
        },
      });

      if (response.ok) {
        const remoteFlags = await response.json();
        Object.entries(remoteFlags).forEach(([flag, value]) => {
          this.flags.set(flag, value);
        });
      }
    } catch (error) {
      console.error('Failed to load remote feature flags:', error);
    }
  }

  /**
   * Use default flags configuration
   */
  useDefaults() {
    Object.entries(this.defaultFlags).forEach(([flag, value]) => {
      if (!this.flags.has(flag)) {
        this.flags.set(flag, value);
      }
    });
  }

  /**
   * Set user context for feature flag evaluation
   */
  setUserContext(context) {
    this.userContext = context;
    this.applyUserContext();
  }

  /**
   * Apply user-specific rules based on context
   */
  applyUserContext() {
    if (!this.userContext) return;

    // Example: Enable features for beta users
    if (this.userContext.isBetaUser) {
      this.flags.set('ENABLE_AI_SUGGESTIONS', true);
      this.flags.set('ENABLE_ADVANCED_SEARCH', true);
    }

    // Example: Enable features based on user plan
    if (this.userContext.plan === 'premium') {
      this.flags.set('ENABLE_CLOUD_SYNC', true);
      this.flags.set('ENABLE_COLLABORATION', true);
    }

    // Example: Gradual rollout based on user ID
    if (this.userContext.userId) {
      const hash = this.hashUserId(this.userContext.userId);

      // 10% rollout for virtualized lists
      if (hash % 100 < 10) {
        this.flags.set('USE_VIRTUALIZED_LISTS', true);
      }

      // 50% rollout for new storage
      if (hash % 100 < 50) {
        this.flags.set('USE_NEW_STORAGE_FACADE', true);
      }
    }
  }

  /**
   * Simple hash function for user ID
   */
  hashUserId(userId) {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = (hash << 5) - hash + userId.charCodeAt(i);
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Check if a feature flag is enabled
   */
  isEnabled(flagName) {
    // Initialize if not done yet
    if (!this.initialized) {
      console.warn('Feature flags not initialized, using defaults');
      this.useDefaults();
    }

    return this.flags.get(flagName) ?? this.defaultFlags[flagName] ?? false;
  }

  /**
   * Get all active feature flags
   */
  getAllFlags() {
    const allFlags = {};

    // Include all default flags
    Object.keys(this.defaultFlags).forEach((flag) => {
      allFlags[flag] = this.isEnabled(flag);
    });

    // Include any additional flags
    this.flags.forEach((value, key) => {
      allFlags[key] = value;
    });

    return allFlags;
  }

  /**
   * Override a feature flag (for testing/debugging)
   */
  override(flagName, value) {
    this.flags.set(flagName, value);
    this.notifyListeners(flagName, value);

    // Persist override to localStorage
    this.saveOverrides();
  }

  /**
   * Clear all overrides
   */
  clearOverrides() {
    localStorage.removeItem('airprompts_feature_flags');
    this.flags.clear();
    this.useDefaults();

    // Notify all listeners
    this.flags.forEach((value, key) => {
      this.notifyListeners(key, value);
    });
  }

  /**
   * Save current overrides to localStorage
   */
  saveOverrides() {
    const overrides = {};
    this.flags.forEach((value, key) => {
      if (value !== this.defaultFlags[key]) {
        overrides[key] = value;
      }
    });

    if (Object.keys(overrides).length > 0) {
      localStorage.setItem('airprompts_feature_flags', JSON.stringify(overrides));
    } else {
      localStorage.removeItem('airprompts_feature_flags');
    }
  }

  /**
   * Subscribe to feature flag changes
   */
  subscribe(flagName, callback) {
    if (!this.listeners.has(flagName)) {
      this.listeners.set(flagName, new Set());
    }
    this.listeners.get(flagName).add(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.listeners.get(flagName);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.listeners.delete(flagName);
        }
      }
    };
  }

  /**
   * Notify listeners of flag changes
   */
  notifyListeners(flagName, value) {
    const callbacks = this.listeners.get(flagName);
    if (callbacks) {
      callbacks.forEach((callback) => {
        try {
          callback(value);
        } catch (error) {
          console.error(`Error in feature flag listener for ${flagName}:`, error);
        }
      });
    }
  }

  /**
   * Get feature flag with additional metadata
   */
  getFlag(flagName) {
    return {
      name: flagName,
      enabled: this.isEnabled(flagName),
      source: this.getFlagSource(flagName),
      description: this.getFlagDescription(flagName),
    };
  }

  /**
   * Determine where a flag value came from
   */
  getFlagSource(flagName) {
    if (import.meta.env[`VITE_FEATURE_${flagName}`] !== undefined) {
      return 'environment';
    }

    const stored = localStorage.getItem('airprompts_feature_flags');
    if (stored) {
      const overrides = JSON.parse(stored);
      if (overrides[flagName] !== undefined) {
        return 'override';
      }
    }

    if (
      this.flags.has(flagName) &&
      !Object.prototype.hasOwnProperty.call(this.defaultFlags, flagName)
    ) {
      return 'remote';
    }

    return 'default';
  }

  /**
   * Get human-readable description for a flag
   */
  getFlagDescription(flagName) {
    const descriptions = {
      USE_NEW_STORAGE_FACADE: 'Enable new storage abstraction layer',
      USE_ERROR_BOUNDARIES: 'Enable React error boundaries for better error handling',
      USE_PERFORMANCE_MONITORING: 'Enable performance tracking and monitoring',
      USE_VIRTUALIZED_LISTS: 'Enable virtualized rendering for large lists',
      USE_BASE_COMPONENTS: 'Use new unified base component system',
      ENABLE_DARK_MODE: 'Enable dark mode theme option',
      ENABLE_DRAG_DROP: 'Enable drag and drop functionality',
      ENABLE_ADVANCED_SEARCH: 'Enable advanced search features',
      ENABLE_CONTEXT_MENUS: 'Enable right-click context menus',
      ENABLE_KEYBOARD_SHORTCUTS: 'Enable keyboard shortcut support',
      ENABLE_CODE_SPLITTING: 'Enable code splitting for smaller bundles',
      ENABLE_LAZY_LOADING: 'Enable lazy loading of components',
      ENABLE_SERVICE_WORKER: 'Enable service worker for offline support',
      ENABLE_PREFETCHING: 'Enable resource prefetching',
      SHOW_DEBUG_INFO: 'Show debug information in UI',
      ENABLE_DEV_TOOLS: 'Enable developer tools integration',
      ENABLE_PERFORMANCE_MARKS: 'Enable performance mark logging',
      ENABLE_AI_SUGGESTIONS: 'Enable AI-powered suggestions',
      ENABLE_COLLABORATION: 'Enable real-time collaboration features',
      ENABLE_CLOUD_SYNC: 'Enable cloud synchronization',
    };

    return descriptions[flagName] || 'No description available';
  }
}

// Create singleton instance
const featureFlags = new FeatureFlagsService();

// Export service and helper functions
export default featureFlags;

export const isFeatureEnabled = (flagName) => featureFlags.isEnabled(flagName);
export const overrideFeature = (flagName, value) => featureFlags.override(flagName, value);
export const subscribeToFeature = (flagName, callback) =>
  featureFlags.subscribe(flagName, callback);
export const getAllFeatures = () => featureFlags.getAllFlags();
export const getFeature = (flagName) => featureFlags.getFlag(flagName);
