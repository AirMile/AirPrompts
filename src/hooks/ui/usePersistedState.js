import { useState, useEffect, useCallback, useRef } from 'react';
import { saveData } from '../../utils/dataStorage.js';

/**
 * Custom hook voor state die automatisch wordt opgeslagen in localStorage
 * @param {string} dataType - Type data (templates, workflows, snippets, folders)
 * @param {any} initialValue - Initiële waarde
 * @param {Object} options - Opties voor debouncing en foutafhandeling
 * @returns {[any, Function]} State waarde en setter function
 */
export const usePersistedState = (dataType, initialValue, options = {}) => {
  const {
    debounceMs = 500, // Debounce tijd in milliseconden
    onSaveError = (error) => console.error(`Save error voor ${dataType}:`, error),
    onSaveSuccess = () => {}
  } = options;

  const [state, setState] = useState(initialValue);
  const saveTimeoutRef = useRef(null);
  const previousStateRef = useRef(initialValue);

  // Debounced save functie
  const debouncedSave = useCallback((data) => {
    // Clear bestaande timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set nieuwe timeout
    saveTimeoutRef.current = setTimeout(() => {
      try {
        const success = saveData(dataType, data);
        if (success) {
          onSaveSuccess();
          previousStateRef.current = data;
        } else {
          onSaveError(new Error('Save operation failed'));
        }
      } catch (error) {
        onSaveError(error);
      }
    }, debounceMs);
  }, [dataType, debounceMs, onSaveError, onSaveSuccess]);

  // Custom setter die automatisch opslaat
  const setPersistedState = useCallback((newState) => {
    // Update state onmiddellijk voor UI responsiveness
    setState(newState);
    
    // Schedule save operation
    debouncedSave(newState);
  }, [debouncedSave]);

  // Effect om te detecteren wanneer state verandert van buitenaf
  useEffect(() => {
    // Check of state is veranderd en niet door onze setter
    if (state !== previousStateRef.current) {
      debouncedSave(state);
    }
  }, [state, debouncedSave]);

  // Cleanup timeout bij unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        // Force save bij unmount als er pending changes zijn
        if (state !== previousStateRef.current) {
          try {
            saveData(dataType, state);
          } catch (error) {
            console.error(`Error bij force save van ${dataType}:`, error);
          }
        }
      }
    };
  }, [dataType, state]);

  return [state, setPersistedState];
};

/**
 * Hook voor bulk state management met auto-save
 * @param {Object} initialData - Object met initial data
 * @param {Object} options - Opties voor save behavior
 * @returns {Object} State object en update functions
 */
export const usePersistedAppState = (initialData, options = {}) => {
  const {
    debounceMs = 500,
    onSaveError = (type, error) => console.error(`Save error voor ${type}:`, error),
    onSaveSuccess = (type) => {}
  } = options;

  // Individual persisted states
  const [templates, setTemplates] = usePersistedState('templates', initialData.templates, {
    debounceMs,
    onSaveError: (error) => onSaveError('templates', error),
    onSaveSuccess: () => onSaveSuccess('templates')
  });

  const [workflows, setWorkflows] = usePersistedState('workflows', initialData.workflows, {
    debounceMs,
    onSaveError: (error) => onSaveError('workflows', error),
    onSaveSuccess: () => onSaveSuccess('workflows')
  });

  const [snippets, setSnippets] = usePersistedState('snippets', initialData.snippets, {
    debounceMs,
    onSaveError: (error) => onSaveError('snippets', error),
    onSaveSuccess: () => onSaveSuccess('snippets')
  });

  const [folders, setFolders] = usePersistedState('folders', initialData.folders, {
    debounceMs,
    onSaveError: (error) => onSaveError('folders', error),
    onSaveSuccess: () => onSaveSuccess('folders')
  });

  // Convenience update functions voor item updates
  const updateTemplate = useCallback((template) => {
    setTemplates(prevTemplates => 
      prevTemplates.map(t => t.id === template.id ? template : t)
    );
  }, [setTemplates]);

  const updateWorkflow = useCallback((workflow) => {
    setWorkflows(prevWorkflows => 
      prevWorkflows.map(w => w.id === workflow.id ? workflow : w)
    );
  }, [setWorkflows]);

  const updateSnippet = useCallback((snippet) => {
    setSnippets(prevSnippets => 
      prevSnippets.map(s => s.id === snippet.id ? snippet : s)
    );
  }, [setSnippets]);

  const deleteTemplate = useCallback((id) => {
    setTemplates(prevTemplates => prevTemplates.filter(t => t.id !== id));
  }, [setTemplates]);

  const deleteWorkflow = useCallback((id) => {
    setWorkflows(prevWorkflows => prevWorkflows.filter(w => w.id !== id));
  }, [setWorkflows]);

  const deleteSnippet = useCallback((id) => {
    setSnippets(prevSnippets => prevSnippets.filter(s => s.id !== id));
  }, [setSnippets]);

  return {
    // State values
    templates,
    workflows,
    snippets,
    folders,
    
    // Setters
    setTemplates,
    setWorkflows,
    setSnippets,
    setFolders,
    
    // Update helpers
    updateTemplate,
    updateWorkflow,
    updateSnippet,
    
    // Delete helpers
    deleteTemplate,
    deleteWorkflow,
    deleteSnippet
  };
};

export default usePersistedState;