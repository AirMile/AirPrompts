// src/store/appStore.js
import { createContext, useContext, useReducer, useCallback } from 'react';

const AppStateContext = createContext();
const AppDispatchContext = createContext();

const initialState = {
  templates: [],
  workflows: [],
  snippets: [],
  folders: [],
  ui: {
    searchQuery: '',
    selectedFolderId: 'home',
    viewMode: 'grid',
    isLoading: false,
    error: null
  },
  // Database-ready state additions
  sync: {
    lastSync: null,
    syncStatus: 'idle', // idle | syncing | error
    pendingChanges: []
  },
  meta: {
    isOnline: true,
    apiAvailable: false,
    storageMode: 'localStorage' // localStorage | api | hybrid
  }
};

function appReducer(state, action) {
  switch (action.type) {
    case 'SET_TEMPLATES':
      return { ...state, templates: action.payload };
    case 'ADD_TEMPLATE':
      return {
        ...state,
        templates: [...state.templates, action.payload]
      };
    case 'UPDATE_TEMPLATE':
      return {
        ...state,
        templates: state.templates.map(t => 
          t.id === action.payload.id ? action.payload : t
        )
      };
    case 'DELETE_TEMPLATE':
      return {
        ...state,
        templates: state.templates.filter(t => t.id !== action.payload)
      };
    case 'SET_WORKFLOWS':
      return { ...state, workflows: action.payload };
    case 'ADD_WORKFLOW':
      return {
        ...state,
        workflows: [...state.workflows, action.payload]
      };
    case 'UPDATE_WORKFLOW':
      return {
        ...state,
        workflows: state.workflows.map(w => 
          w.id === action.payload.id ? action.payload : w
        )
      };
    case 'DELETE_WORKFLOW':
      return {
        ...state,
        workflows: state.workflows.filter(w => w.id !== action.payload)
      };
    case 'SET_SNIPPETS':
      return { ...state, snippets: action.payload };
    case 'ADD_SNIPPET':
      return {
        ...state,
        snippets: [...state.snippets, action.payload]
      };
    case 'UPDATE_SNIPPET':
      return {
        ...state,
        snippets: state.snippets.map(s => 
          s.id === action.payload.id ? action.payload : s
        )
      };
    case 'DELETE_SNIPPET':
      return {
        ...state,
        snippets: state.snippets.filter(s => s.id !== action.payload)
      };
    case 'SET_UI':
      return {
        ...state,
        ui: { ...state.ui, ...action.payload }
      };
    case 'SET_LOADING':
      return {
        ...state,
        ui: { ...state.ui, isLoading: action.payload }
      };
    case 'SET_ERROR':
      return {
        ...state,
        ui: { ...state.ui, error: action.payload }
      };
    case 'ADD_PENDING_CHANGE':
      return {
        ...state,
        sync: {
          ...state.sync,
          pendingChanges: [...state.sync.pendingChanges, action.payload]
        }
      };
    case 'SET_SYNC_STATUS':
      return {
        ...state,
        sync: { ...state.sync, syncStatus: action.payload }
      };
    case 'SET_META':
      return {
        ...state,
        meta: { ...state.meta, ...action.payload }
      };
    default:
      return state;
  }
}

export function AppProvider({ children, initialData }) {
  const [state, dispatch] = useReducer(appReducer, {
    ...initialState,
    ...initialData
  });
  
  return (
    <AppStateContext.Provider value={state}>
      <AppDispatchContext.Provider value={dispatch}>
        {children}
      </AppDispatchContext.Provider>
    </AppStateContext.Provider>
  );
}

export function useAppState() {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error('useAppState must be used within AppProvider');
  }
  return context;
}

export function useAppDispatch() {
  const context = useContext(AppDispatchContext);
  if (!context) {
    throw new Error('useAppDispatch must be used within AppProvider');
  }
  return context;
}