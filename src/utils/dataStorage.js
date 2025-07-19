/**
 * Data Storage Utilities voor AirPrompts
 * Handles localStorage operations met error handling en fallbacks
 */

const STORAGE_KEYS = {
  TEMPLATES: 'airprompts_templates',
  WORKFLOWS: 'airprompts_workflows', 
  SNIPPETS: 'airprompts_snippets',
  FOLDERS: 'airprompts_folders',
  VERSION: 'airprompts_data_version'
};

const CURRENT_VERSION = '1.0';

/**
 * Check if localStorage is available
 * @returns {boolean}
 */
export const isLocalStorageAvailable = () => {
  try {
    const test = '__localStorage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch (e) {
    console.warn('LocalStorage niet beschikbaar:', e);
    return false;
  }
};

/**
 * Load data from localStorage with fallback
 * @param {string} key - Storage key
 * @param {any} defaultValue - Fallback value
 * @returns {any} Parsed data or default value
 */
export const loadFromStorage = (key, defaultValue) => {
  if (!isLocalStorageAvailable()) {
    console.warn(`LocalStorage niet beschikbaar, gebruik default waarde voor ${key}`);
    return defaultValue;
  }

  try {
    const item = localStorage.getItem(key);
    if (item === null) {
      console.log(`Geen data gevonden voor ${key}, gebruik default waarde`);
      return defaultValue;
    }

    const parsed = JSON.parse(item);
    console.log(`Data geladen van localStorage voor ${key}:`, parsed.length || Object.keys(parsed).length, 'items');
    return parsed;
  } catch (error) {
    console.error(`Error bij laden van ${key}:`, error);
    console.warn(`Gebruik default waarde voor ${key}`);
    return defaultValue;
  }
};

/**
 * Save data to localStorage
 * @param {string} key - Storage key
 * @param {any} data - Data to save
 * @returns {boolean} Success status
 */
export const saveToStorage = (key, data) => {
  if (!isLocalStorageAvailable()) {
    console.warn(`LocalStorage niet beschikbaar, kan ${key} niet opslaan`);
    return false;
  }

  try {
    const serialized = JSON.stringify(data);
    localStorage.setItem(key, serialized);
    console.log(`Data opgeslagen in localStorage voor ${key}:`, data.length || Object.keys(data).length, 'items');
    return true;
  } catch (error) {
    if (error.name === 'QuotaExceededError') {
      console.error('LocalStorage quota overschreden voor', key);
      // Try to clear some space by removing old data
      clearOldData();
    } else {
      console.error(`Error bij opslaan van ${key}:`, error);
    }
    return false;
  }
};

/**
 * Load all application data
 * @param {Object} defaults - Default data objects
 * @returns {Object} Loaded or default data
 */
export const loadAllData = (defaults) => {
  const data = {
    templates: loadFromStorage(STORAGE_KEYS.TEMPLATES, defaults.templates),
    workflows: loadFromStorage(STORAGE_KEYS.WORKFLOWS, defaults.workflows),
    snippets: loadFromStorage(STORAGE_KEYS.SNIPPETS, defaults.snippets),
    folders: loadFromStorage(STORAGE_KEYS.FOLDERS, defaults.folders)
  };

  // Check data version for migrations
  const version = loadFromStorage(STORAGE_KEYS.VERSION, null);
  if (version !== CURRENT_VERSION) {
    console.log(`Data migratie van versie ${version} naar ${CURRENT_VERSION}`);
    data.migrated = true;
    saveToStorage(STORAGE_KEYS.VERSION, CURRENT_VERSION);
  }

  return data;
};

/**
 * Save all application data
 * @param {Object} data - Data to save
 */
export const saveAllData = (data) => {
  const operations = [
    () => saveToStorage(STORAGE_KEYS.TEMPLATES, data.templates),
    () => saveToStorage(STORAGE_KEYS.WORKFLOWS, data.workflows), 
    () => saveToStorage(STORAGE_KEYS.SNIPPETS, data.snippets),
    () => saveToStorage(STORAGE_KEYS.FOLDERS, data.folders)
  ];

  let successes = 0;
  operations.forEach(operation => {
    if (operation()) successes++;
  });

  if (successes === operations.length) {
    console.log('✅ Alle data succesvol opgeslagen');
  } else {
    console.warn(`⚠️ ${successes}/${operations.length} operaties succesvol`);
  }

  return successes === operations.length;
};

/**
 * Save specific data type
 * @param {string} type - Data type (templates, workflows, snippets, folders)
 * @param {any} data - Data to save
 */
export const saveData = (type, data) => {
  const keyMap = {
    templates: STORAGE_KEYS.TEMPLATES,
    workflows: STORAGE_KEYS.WORKFLOWS,
    snippets: STORAGE_KEYS.SNIPPETS,
    folders: STORAGE_KEYS.FOLDERS
  };

  const key = keyMap[type];
  if (!key) {
    console.error(`Onbekend data type: ${type}`);
    return false;
  }

  return saveToStorage(key, data);
};

/**
 * Clear old or corrupted data
 */
export const clearOldData = () => {
  if (!isLocalStorageAvailable()) return;

  try {
    // Remove non-essential data if storage is full
    const keysToCheck = Object.values(STORAGE_KEYS);
    keysToCheck.forEach(key => {
      try {
        const item = localStorage.getItem(key);
        if (item && item.length > 100000) { // > 100KB
          console.warn(`Grote data gevonden voor ${key}, mogelijk corrupt`);
        }
      } catch (e) {
        console.warn(`Probleem met key ${key}, verwijderen...`);
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.error('Error bij opschonen van data:', error);
  }
};

/**
 * Clear all application data
 */
export const clearAllData = () => {
  if (!isLocalStorageAvailable()) return;

  Object.values(STORAGE_KEYS).forEach(key => {
    localStorage.removeItem(key);
  });
  
  console.log('🗑️ Alle opgeslagen data verwijderd');
};

/**
 * Get storage usage info
 * @returns {Object} Storage statistics
 */
export const getStorageInfo = () => {
  if (!isLocalStorageAvailable()) {
    return { available: false };
  }

  let totalSize = 0;
  const details = {};

  Object.entries(STORAGE_KEYS).forEach(([name, key]) => {
    const item = localStorage.getItem(key);
    const size = item ? new Blob([item]).size : 0;
    details[name.toLowerCase()] = {
      size,
      items: item ? JSON.parse(item).length || Object.keys(JSON.parse(item)).length : 0
    };
    totalSize += size;
  });

  return {
    available: true,
    totalSize,
    details,
    percentage: Math.round((totalSize / (5 * 1024 * 1024)) * 100) // Assume 5MB quota
  };
};

export { STORAGE_KEYS };