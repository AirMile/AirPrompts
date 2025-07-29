// Item color configuration system
// Allows users to customize colors for different item types

// Default color mappings
export const DEFAULT_ITEM_COLORS = {
  template: 'primary', // Blue
  info: 'success', // Green
  snippet: 'warning', // Yellow/Orange
  workflow: 'orange', // Orange
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
  { id: 'indigo', name: 'Indigo', value: 'indigo' },
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
        primary:
          'bg-primary-100/50 dark:bg-primary-900/50 hover:bg-primary-100/70 dark:hover:bg-primary-900/70 text-primary-700 dark:text-primary-300 border border-primary-500 dark:border-primary-600/50',
        success:
          'bg-success-100/50 dark:bg-success-900/50 hover:bg-success-100/70 dark:hover:bg-success-900/70 text-success-700 dark:text-success-300 border border-success-500 dark:border-success-600/50',
        warning:
          'bg-warning-100/50 dark:bg-warning-900/50 hover:bg-warning-100/70 dark:hover:bg-warning-900/70 text-warning-700 dark:text-warning-300 border border-warning-500 dark:border-warning-600/50',
        danger:
          'bg-danger-100/50 dark:bg-danger-900/50 hover:bg-danger-100/70 dark:hover:bg-danger-900/70 text-danger-700 dark:text-danger-300 border border-danger-500 dark:border-danger-600/50',
        orange:
          'bg-orange-100/50 dark:bg-orange-900/50 hover:bg-orange-100/70 dark:hover:bg-orange-900/70 text-orange-700 dark:text-orange-300 border border-orange-500 dark:border-orange-600/50',
        purple:
          'bg-purple-100/50 dark:bg-purple-900/50 hover:bg-purple-100/70 dark:hover:bg-purple-900/70 text-purple-700 dark:text-purple-300 border border-purple-500 dark:border-purple-600/50',
        pink: 'bg-pink-100/50 dark:bg-pink-900/50 hover:bg-pink-100/70 dark:hover:bg-pink-900/70 text-pink-700 dark:text-pink-300 border border-pink-500 dark:border-pink-600/50',
        indigo:
          'bg-indigo-100/50 dark:bg-indigo-900/50 hover:bg-indigo-100/70 dark:hover:bg-indigo-900/70 text-indigo-700 dark:text-indigo-300 border border-indigo-500 dark:border-indigo-600/50',
      }[colorScheme];

    case 'button-primary':
      return {
        primary:
          'bg-primary-600 dark:bg-primary-600 hover:bg-primary-700 dark:hover:bg-primary-700 text-white border border-primary-700 dark:border-primary-500',
        success:
          'bg-success-600 dark:bg-success-600 hover:bg-success-700 dark:hover:bg-success-700 text-white border border-success-700 dark:border-success-500',
        warning:
          'bg-warning-600 dark:bg-warning-600 hover:bg-warning-700 dark:hover:bg-warning-700 text-white border border-warning-700 dark:border-warning-500',
        danger:
          'bg-danger-600 dark:bg-danger-600 hover:bg-danger-700 dark:hover:bg-danger-700 text-white border border-danger-700 dark:border-danger-500',
        orange:
          'bg-orange-600 dark:bg-orange-600 hover:bg-orange-700 dark:hover:bg-orange-700 text-white border border-orange-700 dark:border-orange-500',
        purple:
          'bg-purple-600 dark:bg-purple-600 hover:bg-purple-700 dark:hover:bg-purple-700 text-white border border-purple-700 dark:border-purple-500',
        pink: 'bg-pink-600 dark:bg-pink-600 hover:bg-pink-700 dark:hover:bg-pink-700 text-white border border-pink-700 dark:border-pink-500',
        indigo:
          'bg-indigo-600 dark:bg-indigo-600 hover:bg-indigo-700 dark:hover:bg-indigo-700 text-white border border-indigo-700 dark:border-indigo-500',
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
        indigo: 'bg-gradient-to-br from-indigo-500 to-indigo-600',
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
        indigo: 'text-indigo-400 dark:text-indigo-400',
      }[colorScheme];

    case 'border':
      return {
        primary: 'border-primary-400 dark:border-primary-400',
        success: 'border-success-400 dark:border-success-400',
        warning: 'border-warning-400 dark:border-warning-400',
        danger: 'border-danger-400 dark:border-danger-400',
        orange: 'border-orange-400 dark:border-orange-400',
        purple: 'border-purple-400 dark:border-purple-400',
        pink: 'border-pink-400 dark:border-pink-400',
        indigo: 'border-indigo-400 dark:border-indigo-400',
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
        indigo: 'bg-indigo-100/50 dark:bg-indigo-900/30',
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
        indigo: 'bg-indigo-100 dark:bg-indigo-100 text-indigo-800 dark:text-indigo-800',
      }[colorScheme];

    case 'info-block':
      return {
        primary:
          'bg-primary-50 dark:bg-primary-950/50 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-800',
        success:
          'bg-success-50 dark:bg-success-900/30 text-success-700 dark:text-success-400 border border-success-200 dark:border-success-700',
        warning:
          'bg-warning-50 dark:bg-warning-950/50 text-warning-700 dark:text-warning-300 border border-warning-200 dark:border-warning-800',
        danger:
          'bg-danger-50 dark:bg-danger-950/50 text-danger-700 dark:text-danger-300 border border-danger-200 dark:border-danger-800',
        orange:
          'bg-orange-50 dark:bg-orange-950/50 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800',
        purple:
          'bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800',
        pink: 'bg-pink-50 dark:bg-pink-950/50 text-pink-700 dark:text-pink-300 border border-pink-200 dark:border-pink-800',
        indigo:
          'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800',
      }[colorScheme];

    case 'info-header':
      return {
        primary: 'text-primary-700 dark:text-primary-300',
        success: 'text-success-700 dark:text-success-400',
        warning: 'text-warning-700 dark:text-warning-300',
        danger: 'text-danger-700 dark:text-danger-300',
        orange: 'text-orange-700 dark:text-orange-300',
        purple: 'text-purple-700 dark:text-purple-300',
        pink: 'text-pink-700 dark:text-pink-300',
        indigo: 'text-indigo-700 dark:text-indigo-300',
      }[colorScheme];

    case 'info-text':
      return {
        primary: 'text-primary-600 dark:text-primary-400',
        success: 'text-success-600 dark:text-success-500',
        warning: 'text-warning-600 dark:text-warning-400',
        danger: 'text-danger-600 dark:text-danger-400',
        orange: 'text-orange-600 dark:text-orange-400',
        purple: 'text-purple-600 dark:text-purple-400',
        pink: 'text-pink-600 dark:text-pink-400',
        indigo: 'text-indigo-600 dark:text-indigo-400',
      }[colorScheme];

    case 'hover-border':
      return {
        primary: 'hover:border-primary-500 dark:hover:border-primary-500',
        success: 'hover:border-success-500 dark:hover:border-success-500',
        warning: 'hover:border-warning-500 dark:hover:border-warning-500',
        danger: 'hover:border-danger-500 dark:hover:border-danger-500',
        orange: 'hover:border-orange-500 dark:hover:border-orange-500',
        purple: 'hover:border-purple-500 dark:hover:border-purple-500',
        pink: 'hover:border-pink-500 dark:hover:border-pink-500',
        indigo: 'hover:border-indigo-500 dark:hover:border-indigo-500',
      }[colorScheme];

    case 'modal':
      return {
        primary: {
          text: 'text-primary-600 dark:text-primary-400',
          background: 'bg-primary-600',
          hover: 'hover:bg-primary-700',
          border: 'border-primary-200 dark:border-primary-700',
          backgroundLight: 'bg-primary-50 dark:bg-primary-900/20',
        },
        success: {
          text: 'text-success-600 dark:text-success-400',
          background: 'bg-success-600',
          hover: 'hover:bg-success-700',
          border: 'border-success-200 dark:border-success-700',
          backgroundLight: 'bg-success-50 dark:bg-success-900/20',
        },
        warning: {
          text: 'text-warning-600 dark:text-warning-400',
          background: 'bg-warning-600',
          hover: 'hover:bg-warning-700',
          border: 'border-warning-200 dark:border-warning-700',
          backgroundLight: 'bg-warning-50 dark:bg-warning-900/20',
        },
        danger: {
          text: 'text-danger-600 dark:text-danger-400',
          background: 'bg-danger-600',
          hover: 'hover:bg-danger-700',
          border: 'border-danger-200 dark:border-danger-700',
          backgroundLight: 'bg-danger-50 dark:bg-danger-900/20',
        },
        orange: {
          text: 'text-orange-600 dark:text-orange-400',
          background: 'bg-orange-600',
          hover: 'hover:bg-orange-700',
          border: 'border-orange-200 dark:border-orange-700',
          backgroundLight: 'bg-orange-50 dark:bg-orange-900/20',
        },
        purple: {
          text: 'text-purple-600 dark:text-purple-400',
          background: 'bg-purple-600',
          hover: 'hover:bg-purple-700',
          border: 'border-purple-200 dark:border-purple-700',
          backgroundLight: 'bg-purple-50 dark:bg-purple-900/20',
        },
        pink: {
          text: 'text-pink-600 dark:text-pink-400',
          background: 'bg-pink-600',
          hover: 'hover:bg-pink-700',
          border: 'border-pink-200 dark:border-pink-700',
          backgroundLight: 'bg-pink-50 dark:bg-pink-900/20',
        },
        indigo: {
          text: 'text-indigo-600 dark:text-indigo-400',
          background: 'bg-indigo-600',
          hover: 'hover:bg-indigo-700',
          border: 'border-indigo-200 dark:border-indigo-700',
          backgroundLight: 'bg-indigo-50 dark:bg-indigo-900/20',
        },
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
