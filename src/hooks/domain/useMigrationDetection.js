import { useState, useEffect } from 'react';
import { loadFromStorage, STORAGE_KEYS } from '../../utils/dataStorage';

/**
 * Hook voor smart detection van migratie behoeften
 * Detecteert automatisch of er localStorage data is die gemigreerd moet worden
 */
export const useMigrationDetection = () => {
  const [migrationNeeded, setMigrationNeeded] = useState(false);
  const [localDataStats, setLocalDataStats] = useState(null);
  const [isChecking, setIsChecking] = useState(true);
  const [lastCheck, setLastCheck] = useState(null);

  // Check localStorage voor bestaande data
  const checkMigrationNeeded = () => {
    setIsChecking(true);
    
    try {
      const data = {
        templates: loadFromStorage(STORAGE_KEYS.TEMPLATES, []),
        workflows: loadFromStorage(STORAGE_KEYS.WORKFLOWS, []),
        snippets: loadFromStorage(STORAGE_KEYS.SNIPPETS, []),
        folders: loadFromStorage(STORAGE_KEYS.FOLDERS, [])
      };

      const stats = {
        templates: data.templates.length,
        workflows: data.workflows.length,
        snippets: data.snippets.length,
        folders: data.folders.length,
        total: data.templates.length + data.workflows.length + data.snippets.length + data.folders.length
      };

      setLocalDataStats(stats);
      setMigrationNeeded(stats.total > 0);
      setLastCheck(new Date().toISOString());
      
      console.log('🔍 Migration check completed:', stats);
    } catch (error) {
      console.error('❌ Migration check failed:', error);
      setMigrationNeeded(false);
      setLocalDataStats(null);
    } finally {
      setIsChecking(false);
    }
  };

  // Check on mount en periodiek
  useEffect(() => {
    checkMigrationNeeded();
    
    // Check elke 30 seconden of er nieuwe localStorage data is
    const interval = setInterval(checkMigrationNeeded, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // Check wanneer localStorage verandert (storage event)
  useEffect(() => {
    const handleStorageChange = (e) => {
      const relevantKeys = Object.values(STORAGE_KEYS);
      if (relevantKeys.includes(e.key)) {
        console.log('📦 LocalStorage changed, checking migration need...');
        setTimeout(checkMigrationNeeded, 1000); // Slight delay to ensure all changes are persisted
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Manual recheck functie
  const recheckMigration = () => {
    checkMigrationNeeded();
  };

  // Mark migration as completed (clear localStorage)
  const markMigrationCompleted = () => {
    try {
      Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
      
      setMigrationNeeded(false);
      setLocalDataStats({ templates: 0, workflows: 0, snippets: 0, folders: 0, total: 0 });
      
      console.log('✅ Migration marked as completed, localStorage cleared');
    } catch (error) {
      console.error('❌ Failed to clear localStorage:', error);
    }
  };

  // Get migration priority based on data amount
  const getMigrationPriority = () => {
    if (!localDataStats || localDataStats.total === 0) return 'none';
    if (localDataStats.total > 50) return 'high';
    if (localDataStats.total > 10) return 'medium';
    return 'low';
  };

  // Get user-friendly message
  const getMigrationMessage = () => {
    if (!migrationNeeded) return null;
    
    const { total, templates, workflows, snippets, folders } = localDataStats;
    const items = [];
    
    if (templates > 0) items.push(`${templates} template${templates !== 1 ? 's' : ''}`);
    if (workflows > 0) items.push(`${workflows} workflow${workflows !== 1 ? 's' : ''}`);
    if (snippets > 0) items.push(`${snippets} snippet${snippets !== 1 ? 's' : ''}`);
    if (folders > 0) items.push(`${folders} folder${folders !== 1 ? 's' : ''}`);
    
    return `We hebben ${total} item${total !== 1 ? 's' : ''} gevonden (${items.join(', ')}) die kunnen worden gemigreerd naar de database.`;
  };

  return {
    migrationNeeded,
    localDataStats,
    isChecking,
    lastCheck,
    recheckMigration,
    markMigrationCompleted,
    getMigrationPriority,
    getMigrationMessage
  };
};