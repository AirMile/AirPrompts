import React, { useState, useEffect, useCallback } from 'react';
import { PreferencesContext } from './PreferencesContext.js';
import { 
  loadPreferences, 
  savePreferences, 
  resetPreferences,
  exportPreferences,
  importPreferences,
  DEFAULT_PREFERENCES
} from '../utils/preferencesStorage.js';

/**
 * Preferences Provider Component
 * Manages global user preferences state and localStorage persistence
 */
export const PreferencesProvider = ({ children }) => {
  const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load preferences on mount
  useEffect(() => {
    try {
      const loadedPreferences = loadPreferences();
      setPreferences(loadedPreferences);
      setError(null);
    } catch (err) {
      console.error('Failed to load preferences:', err);
      setError('Failed to load preferences');
      setPreferences(DEFAULT_PREFERENCES);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Update preferences and persist to localStorage
   * @param {Object} updates - Updates to apply (can be partial)
   */
  const updatePreferences = useCallback((updates) => {
    try {
      setPreferences(currentPreferences => {
        const newPreferences = { ...currentPreferences, ...updates };
        
        // Deep merge for nested objects
        Object.keys(updates).forEach(key => {
          if (typeof updates[key] === 'object' && updates[key] !== null && !Array.isArray(updates[key])) {
            newPreferences[key] = { ...currentPreferences[key], ...updates[key] };
          }
        });

        const success = savePreferences(newPreferences);
        if (!success) {
          throw new Error('Failed to save preferences');
        }
        
        return newPreferences;
      });
      
      setError(null);
    } catch (err) {
      console.error('Failed to update preferences:', err);
      setError('Failed to save preferences');
    }
  }, []);

  /**
   * Update a specific preference section
   * @param {string} section - Section name
   * @param {Object} updates - Updates to apply to the section
   */
  const updateSection = useCallback((section, updates) => {
    updatePreferences({ [section]: updates });
  }, [updatePreferences]);

  /**
   * Reset preferences to defaults
   */
  const resetToDefaults = useCallback(() => {
    try {
      const success = resetPreferences();
      if (success) {
        setPreferences(DEFAULT_PREFERENCES);
        setError(null);
      } else {
        throw new Error('Failed to reset preferences');
      }
    } catch (err) {
      console.error('Failed to reset preferences:', err);
      setError('Failed to reset preferences');
    }
  }, []);

  /**
   * Export preferences as JSON
   * @returns {string|null} JSON string or null if failed
   */
  const exportSettings = useCallback(() => {
    try {
      const exported = exportPreferences();
      setError(null);
      return exported;
    } catch (err) {
      console.error('Failed to export preferences:', err);
      setError('Failed to export preferences');
      return null;
    }
  }, []);

  /**
   * Import preferences from JSON
   * @param {string} jsonString - JSON string to import
   * @returns {boolean} Success status
   */
  const importSettings = useCallback((jsonString) => {
    try {
      const success = importPreferences(jsonString);
      if (success) {
        const newPreferences = loadPreferences();
        setPreferences(newPreferences);
        setError(null);
        return true;
      } else {
        throw new Error('Failed to import preferences');
      }
    } catch (err) {
      console.error('Failed to import preferences:', err);
      setError('Failed to import preferences');
      return false;
    }
  }, []);

  /**
   * Get a specific preference value with fallback
   * @param {string} path - Dot-separated path (e.g., 'layout.viewMode')
   * @param {any} fallback - Fallback value if not found
   * @returns {any} Preference value or fallback
   */
  const getPreference = useCallback((path, fallback = null) => {
    try {
      const keys = path.split('.');
      let value = preferences;
      
      for (const key of keys) {
        if (value && typeof value === 'object' && key in value) {
          value = value[key];
        } else {
          return fallback;
        }
      }
      
      return value;
    } catch (err) {
      console.error('Failed to get preference:', err);
      return fallback;
    }
  }, [preferences]);

  /**
   * Set a specific preference value
   * @param {string} path - Dot-separated path (e.g., 'layout.viewMode')
   * @param {any} value - Value to set
   */
  const setPreference = useCallback((path, value) => {
    try {
      const keys = path.split('.');
      const updates = {};
      let current = updates;
      
      // Build nested object structure
      for (let i = 0; i < keys.length - 1; i++) {
        current[keys[i]] = {};
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      
      updatePreferences(updates);
    } catch (err) {
      console.error('Failed to set preference:', err);
      setError('Failed to set preference');
    }
  }, [updatePreferences]);

  // Context value
  const value = {
    // State
    preferences,
    loading,
    error,
    
    // Update methods
    updatePreferences,
    updateSection,
    resetToDefaults,
    
    // Import/Export
    exportSettings,
    importSettings,
    
    // Utility methods
    getPreference,
    setPreference,
    
    // Constants
    DEFAULT_PREFERENCES
  };

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
};

export default PreferencesProvider;