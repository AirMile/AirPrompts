// Item color configuration system
// Allows users to customize colors for different item types

// Default color mappings
export const DEFAULT_ITEM_COLORS = {
  template: 'primary',    // Blue
  info: 'success',       // Green  
  snippet: 'warning',    // Yellow/Orange
  workflow: 'orange'     // Orange
};

// Available color options
export const AVAILABLE_COLORS = [
  { id: 'primary', name: 'Blue', value: 'primary' },
  { id: 'success', name: 'Green', value: 'success' },
  { id: 'warning', name: 'Yellow', value: 'warning' },
  { id: 'danger', name: 'Red', value: 'danger' },
  { id: 'orange', name: 'Orange', value: 'orange' },
  { id: 'purple', name: 'Purple', value: 'purple' },
  { id: 'pink', name: 'Pink', value: 'pink' },
  { id: 'indigo', name: 'Indigo', value: 'indigo' }
];

// Storage key for user preferences
const STORAGE_KEY = 'airprompts-item-colors';

/**
 * Get user's custom item colors from localStorage
 */
export const getUserItemColors = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...DEFAULT_ITEM_COLORS, ...parsed };
    }
  } catch (error) {
    console.warn('Failed to load item colors:', error);
  }
  return DEFAULT_ITEM_COLORS;
};

/**
 * Save user's custom item colors to localStorage
 */
export const saveUserItemColors = (colors) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(colors));
  } catch (error) {
    console.warn('Failed to save item colors:', error);
  }
};

/**
 * Get color classes for a specific item type
 */
export const getItemColorClasses = (itemType, variant = 'base') => {
  const colors = getUserItemColors();
  const colorScheme = colors[itemType] || DEFAULT_ITEM_COLORS[itemType];
  
  switch (variant) {
    case 'button':
      return {
        primary: 'bg-primary-600 hover:bg-primary-700 text-white',
        success: 'bg-success-600 hover:bg-success-700 text-white',
        warning: 'bg-warning-600 hover:bg-warning-700 text-white',
        danger: 'bg-danger-600 hover:bg-danger-700 text-white',
        orange: 'bg-orange-600 hover:bg-orange-700 text-white',
        purple: 'bg-purple-600 hover:bg-purple-700 text-white',
        pink: 'bg-pink-600 hover:bg-pink-700 text-white',
        indigo: 'bg-indigo-600 hover:bg-indigo-700 text-white'
      }[colorScheme];
      
    case 'gradient':
      return {
        primary: 'bg-gradient-to-br from-primary-500 to-primary-600',
        success: 'bg-gradient-to-br from-success-500 to-success-600',
        warning: 'bg-gradient-to-br from-warning-500 to-warning-600',
        danger: 'bg-gradient-to-br from-danger-500 to-danger-600',
        orange: 'bg-gradient-to-br from-orange-500 to-orange-600',
        purple: 'bg-gradient-to-br from-purple-500 to-purple-600',
        pink: 'bg-gradient-to-br from-pink-500 to-pink-600',
        indigo: 'bg-gradient-to-br from-indigo-500 to-indigo-600'
      }[colorScheme];
      
    case 'icon':
      return {
        primary: 'text-primary-400 dark:text-primary-400',
        success: 'text-success-400 dark:text-success-400',
        warning: 'text-warning-400 dark:text-warning-400',
        danger: 'text-danger-400 dark:text-danger-400',
        orange: 'text-orange-400 dark:text-orange-400',
        purple: 'text-purple-400 dark:text-purple-400',
        pink: 'text-pink-400 dark:text-pink-400',
        indigo: 'text-indigo-400 dark:text-indigo-400'
      }[colorScheme];
      
    case 'border':
      return {
        primary: 'border-primary-500 dark:border-primary-500',
        success: 'border-success-500 dark:border-success-500',
        warning: 'border-warning-500 dark:border-warning-500',
        danger: 'border-danger-500 dark:border-danger-500',
        orange: 'border-orange-500 dark:border-orange-500',
        purple: 'border-purple-500 dark:border-purple-500',
        pink: 'border-pink-500 dark:border-pink-500',
        indigo: 'border-indigo-500 dark:border-indigo-500'
      }[colorScheme];
      
    case 'background':
      return {
        primary: 'bg-primary-100/50 dark:bg-primary-900/30',
        success: 'bg-success-100/50 dark:bg-success-900/30',
        warning: 'bg-warning-100/50 dark:bg-warning-900/30',
        danger: 'bg-danger-100/50 dark:bg-danger-900/30',
        orange: 'bg-orange-100/50 dark:bg-orange-900/30',
        purple: 'bg-purple-100/50 dark:bg-purple-900/30',
        pink: 'bg-pink-100/50 dark:bg-pink-900/30',
        indigo: 'bg-indigo-100/50 dark:bg-indigo-900/30'
      }[colorScheme];
      
    case 'tag':
      return {
        primary: 'bg-primary-100 dark:bg-primary-100 text-primary-800 dark:text-primary-800',
        success: 'bg-success-100 dark:bg-success-100 text-success-800 dark:text-success-800',
        warning: 'bg-warning-100 dark:bg-warning-100 text-warning-800 dark:text-warning-800',
        danger: 'bg-danger-100 dark:bg-danger-100 text-danger-800 dark:text-danger-800',
        orange: 'bg-orange-100 dark:bg-orange-100 text-orange-800 dark:text-orange-800',
        purple: 'bg-purple-100 dark:bg-purple-100 text-purple-800 dark:text-purple-800',
        pink: 'bg-pink-100 dark:bg-pink-100 text-pink-800 dark:text-pink-800',
        indigo: 'bg-indigo-100 dark:bg-indigo-100 text-indigo-800 dark:text-indigo-800'
      }[colorScheme];
      
    default:
      return colorScheme;
  }
};

/**
 * Reset item colors to defaults
 */
export const resetItemColors = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.warn('Failed to reset item colors:', error);
  }
};