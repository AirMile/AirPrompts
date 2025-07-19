import { useContext } from 'react';
import { PreferencesContext } from '../contexts/PreferencesContext.js';

/**
 * Custom hook to use preferences context
 * @returns {Object} Preferences context value
 */
export const usePreferences = () => {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error('usePreferences must be used within a PreferencesProvider');
  }
  return context;
};