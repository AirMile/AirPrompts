# AirPrompts React Refactoring Plan - Database-Ready Architecture

## 📋 Project Overzicht

### Huidige State Analyse
- **Hoofdcomponent**: `PromptTemplateSystem.jsx` beheert alle state (templates, workflows, snippets, folders)
- **Homepage**: Zeer grote component (500+ regels) met meerdere verantwoordelijkheden
- **State Management**: Mix van useState en custom hooks, geen centrale state management
- **Component Structuur**: Basis organisatie aanwezig maar veel opportunities voor verbetering
- **Performance**: Geen memoization geïmplementeerd, potentiële re-render issues
- **Data Storage**: localStorage-only, geen API layer

### Refactoring Doelen
1. **Database-Ready Architecture**: Elke component voorbereid voor async data fetching
2. **API-First Design**: Hooks en state management klaar voor backend integratie
3. **Progressive Enhancement**: Werkt met localStorage, makkelijk te upgraden naar API
4. **Error & Loading States**: Ingebouwd vanaf het begin

### Prioriteiten
1. **Critical**: Homepage splitsen, async-ready state management
2. **Important**: API-compatible hooks, loading/error patterns
3. **Should Do**: Testing met mock API, migration utilities

## 🗂️ Folder Restructuring

### Huidige Structuur
```
src/
├── components/
│   ├── PromptTemplateSystem.jsx
│   ├── common/
│   ├── dashboard/
│   ├── templates/
│   ├── workflows/
│   ├── snippets/
│   ├── widgets/
│   ├── folders/
│   ├── filters/
│   ├── search/
│   └── settings/
├── contexts/
├── hooks/
├── data/
├── styles/
├── types/
└── utils/
```

### Nieuwe Structuur (Database-Ready)
```
src/
├── components/
│   ├── app/
│   │   ├── App.jsx
│   │   └── AppProviders.jsx
│   ├── common/
│   │   ├── ui/              # Pure UI componenten
│   │   ├── forms/           # Form componenten
│   │   └── layout/          # Layout componenten
│   ├── features/
│   │   ├── templates/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── api/         # API interface (future)
│   │   │   └── utils/
│   │   ├── workflows/
│   │   ├── snippets/
│   │   └── dashboard/
│   ├── widgets/
│   └── providers/           # Context providers
├── store/                   # Centralized state management
│   ├── slices/
│   └── hooks/
├── services/                # API services layer
│   ├── api/                 # API client (prepared for future)
│   ├── storage/             # Storage abstraction (localStorage → API)
│   └── sync/                # Data sync utilities
├── hooks/                   # Global hooks
├── utils/
├── types/
├── tests/
│   ├── unit/
│   ├── integration/
│   └── mocks/               # API mocks for testing
└── styles/
```

### PowerShell Commands voor Migratie

```powershell
# Navigeer naar project directory
cd D:\Users\mzeil\personalProjects\AirPrompts

# Maak nieuwe folder structuur
New-Item -ItemType Directory -Force -Path @(
    "src/components/app",
    "src/components/common/ui",
    "src/components/common/forms",
    "src/components/common/layout",
    "src/components/features/templates/components",
    "src/components/features/templates/hooks",
    "src/components/features/templates/utils",
    "src/components/features/workflows/components",
    "src/components/features/workflows/hooks",
    "src/components/features/workflows/utils",
    "src/components/features/snippets/components",
    "src/components/features/snippets/hooks",
    "src/components/features/snippets/utils",
    "src/components/features/dashboard/components",
    "src/components/features/dashboard/hooks",
    "src/components/features/dashboard/utils",
    "src/components/providers",
    "src/store/slices",
    "src/store/hooks",
    "src/services/api",
    "src/services/storage",
    "src/services/sync",
    "src/tests/unit",
    "src/tests/integration",
    "src/tests/mocks"
)
```

## 📅 Week-by-Week Implementation Plan

### Week 1: Foundation & Homepage Refactoring (Critical)

#### Dag 1-2: Project Setup & Store Implementation
- [ ] **Git branch aanmaken**
  ```bash
  cd D:\Users\mzeil\personalProjects\AirPrompts; git checkout -b refactor/week1-foundation
  ```

- [ ] **Implementeer centrale store met useReducer**
  - Bestand: `src/store/appStore.js`
  ```javascript
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
      case 'SET_UI':
        return {
          ...state,
          ui: { ...state.ui, ...action.payload }
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
  ```

- [ ] **Maak custom hooks voor store acties**
  - Bestand: `src/store/hooks/useTemplates.js`
  ```javascript
  // src/store/hooks/useTemplates.js
  import { useCallback, useState, useEffect } from 'react';
  import { useAppState, useAppDispatch } from '../appStore';
  import { StorageService } from '../../services/storage/StorageService';
  
  // Database-ready hook with loading states and error handling
  export function useTemplates() {
    const { templates, meta } = useAppState();
    const dispatch = useAppDispatch();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    
    // Fetch templates (localStorage now, API later)
    const fetchTemplates = useCallback(async () => {
      setLoading(true);
      setError(null);
      
      try {
        const data = await StorageService.getTemplates();
        dispatch({ type: 'SET_TEMPLATES', payload: data });
      } catch (err) {
        setError(err.message);
        console.error('Failed to fetch templates:', err);
      } finally {
        setLoading(false);
      }
    }, [dispatch]);
    
    // Auto-fetch on mount
    useEffect(() => {
      if (templates.length === 0) {
        fetchTemplates();
      }
    }, []);
    
    const updateTemplate = useCallback(async (template) => {
      setLoading(true);
      try {
        // Optimistic update
        dispatch({ type: 'UPDATE_TEMPLATE', payload: template });
        
        // Persist (localStorage now, API later)
        await StorageService.updateTemplate(template);
        
        // Queue for sync if offline
        if (!meta.isOnline) {
          dispatch({ 
            type: 'ADD_PENDING_CHANGE', 
            payload: { type: 'update', entity: 'template', data: template }
          });
        }
      } catch (err) {
        // Rollback on error
        await fetchTemplates();
        throw err;
      } finally {
        setLoading(false);
      }
    }, [dispatch, meta.isOnline, fetchTemplates]);
    
    const deleteTemplate = useCallback(async (id) => {
      const backup = templates.find(t => t.id === id);
      
      try {
        // Optimistic delete
        dispatch({ type: 'DELETE_TEMPLATE', payload: id });
        
        await StorageService.deleteTemplate(id);
      } catch (err) {
        // Restore on error
        if (backup) {
          dispatch({ type: 'ADD_TEMPLATE', payload: backup });
        }
        throw err;
      }
    }, [dispatch, templates]);
    
    const addTemplate = useCallback(async (templateData) => {
      const template = {
        ...templateData,
        id: crypto.randomUUID(), // Future-proof ID generation
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      try {
        dispatch({ type: 'ADD_TEMPLATE', payload: template });
        await StorageService.createTemplate(template);
        return template;
      } catch (err) {
        await fetchTemplates(); // Rollback
        throw err;
      }
    }, [dispatch, fetchTemplates]);
    
    return {
      templates,
      loading,
      error,
      fetchTemplates,
      updateTemplate,
      deleteTemplate,
      addTemplate,
      // Utility functions
      getTemplateById: (id) => templates.find(t => t.id === id),
      searchTemplates: (query) => templates.filter(t => 
        t.name.toLowerCase().includes(query.toLowerCase()) ||
        t.content.toLowerCase().includes(query.toLowerCase())
      )
    };
  }
  ```

- [ ] **Maak Storage Service Layer**
  - Bestand: `src/services/storage/StorageService.js`
  ```javascript
  // Storage abstraction layer - makkelijk te vervangen met API later
  class StorageServiceClass {
    constructor() {
      this.isAPIEnabled = false; // Toggle voor database migratie
      this.apiClient = null; // Future API client
    }
    
    // Generic error handler
    async handleStorageOperation(operation, fallback = null) {
      try {
        return await operation();
      } catch (error) {
        console.error('Storage operation failed:', error);
        if (fallback) return fallback();
        throw error;
      }
    }
    
    // Templates CRUD - localStorage now, API-ready interface
    async getTemplates() {
      if (this.isAPIEnabled && this.apiClient) {
        return this.apiClient.get('/templates');
      }
      
      return this.handleStorageOperation(() => {
        const data = localStorage.getItem('airprompts_templates');
        return data ? JSON.parse(data) : [];
      }, () => []);
    }
    
    async createTemplate(template) {
      if (this.isAPIEnabled && this.apiClient) {
        return this.apiClient.post('/templates', template);
      }
      
      const templates = await this.getTemplates();
      templates.push(template);
      localStorage.setItem('airprompts_templates', JSON.stringify(templates));
      return template;
    }
    
    async updateTemplate(template) {
      if (this.isAPIEnabled && this.apiClient) {
        return this.apiClient.put(`/templates/${template.id}`, template);
      }
      
      const templates = await this.getTemplates();
      const index = templates.findIndex(t => t.id === template.id);
      if (index !== -1) {
        templates[index] = { ...template, updatedAt: new Date().toISOString() };
        localStorage.setItem('airprompts_templates', JSON.stringify(templates));
      }
      return template;
    }
    
    async deleteTemplate(id) {
      if (this.isAPIEnabled && this.apiClient) {
        return this.apiClient.delete(`/templates/${id}`);
      }
      
      const templates = await this.getTemplates();
      const filtered = templates.filter(t => t.id !== id);
      localStorage.setItem('airprompts_templates', JSON.stringify(filtered));
      return id;
    }
    
    // Utility functions voor migration
    async exportAllData() {
      return {
        templates: await this.getTemplates(),
        workflows: await this.getWorkflows(),
        snippets: await this.getSnippets(),
        folders: await this.getFolders(),
        exportDate: new Date().toISOString(),
        version: '1.0'
      };
    }
    
    async importData(data) {
      // Validate data structure
      if (!data.templates || !Array.isArray(data.templates)) {
        throw new Error('Invalid import data structure');
      }
      
      // Import with conflict resolution
      for (const template of data.templates) {
        const existing = await this.getTemplateById(template.id);
        if (existing) {
          // Handle conflict (for now, skip)
          console.warn(`Template ${template.id} already exists, skipping`);
          continue;
        }
        await this.createTemplate(template);
      }
    }
    
    // Future: Enable API mode
    enableAPI(apiClient) {
      this.isAPIEnabled = true;
      this.apiClient = apiClient;
      console.log('Storage Service: API mode enabled');
    }
  }
  
  export const StorageService = new StorageServiceClass();
  ```

#### Dag 3-4: Homepage Component Splitting
- [ ] **Split Homepage in kleinere componenten**
  ```powershell
  # Maak component bestanden
  cd D:\Users\mzeil\personalProjects\AirPrompts
  New-Item -ItemType File -Path @(
    "src/components/features/dashboard/components/DashboardHeader.jsx",
    "src/components/features/dashboard/components/DashboardSidebar.jsx",
    "src/components/features/dashboard/components/ItemGrid.jsx",
    "src/components/features/dashboard/components/ItemList.jsx",
    "src/components/features/dashboard/components/SearchBar.jsx",
    "src/components/features/dashboard/components/FilterBar.jsx"
  )
  ```

- [ ] **DashboardHeader Component**
  - Bestand: `src/components/features/dashboard/components/DashboardHeader.jsx`
  ```javascript
  import React, { memo } from 'react';
  import { Plus, Search } from 'lucide-react';
  import SearchBar from './SearchBar';
  import ViewModeToggle from '../../../common/ViewModeToggle';
  
  const DashboardHeader = memo(function DashboardHeader({ 
    searchQuery, 
    onSearchChange, 
    viewMode, 
    onViewModeChange,
    onCreateNew 
  }) {
    return (
      <div className="dashboard-header bg-white shadow-sm p-4 mb-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800">
            Prompt Templates
          </h1>
          <button
            onClick={onCreateNew}
            className="btn btn-primary flex items-center gap-2"
          >
            <Plus size={20} />
            Nieuwe Template
          </button>
        </div>
        <div className="mt-4 flex gap-4">
          <SearchBar 
            value={searchQuery} 
            onChange={onSearchChange}
            placeholder="Zoek templates, workflows, snippets..."
          />
          <ViewModeToggle 
            mode={viewMode} 
            onChange={onViewModeChange} 
          />
        </div>
      </div>
    );
  });
  
  export default DashboardHeader;
  ```

- [ ] **ItemGrid Component met memoization**
  - Bestand: `src/components/features/dashboard/components/ItemGrid.jsx`
  ```javascript
  import React, { memo, useMemo } from 'react';
  import { Play, Edit, Trash2, Star } from 'lucide-react';
  import FocusableCard from '../../../common/FocusableCard';
  
  const ItemCard = memo(function ItemCard({ 
    item, 
    type, 
    onEdit, 
    onExecute, 
    onDelete, 
    onToggleFavorite 
  }) {
    return (
      <FocusableCard
        className="p-4 border rounded-lg hover:shadow-md transition-shadow"
        onSelect={() => onExecute(item)}
      >
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold text-gray-800">{item.name}</h3>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(item.id);
            }}
            className={`p-1 ${item.favorite ? 'text-yellow-500' : 'text-gray-400'}`}
          >
            <Star size={16} fill={item.favorite ? 'currentColor' : 'none'} />
          </button>
        </div>
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {item.description}
        </p>
        <div className="flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onExecute(item);
            }}
            className="btn btn-sm btn-primary"
          >
            <Play size={14} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(item);
            }}
            className="btn btn-sm btn-secondary"
          >
            <Edit size={14} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(item.id);
            }}
            className="btn btn-sm btn-danger"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </FocusableCard>
    );
  });
  
  const ItemGrid = memo(function ItemGrid({ 
    items, 
    type, 
    onEdit, 
    onExecute, 
    onDelete, 
    onToggleFavorite 
  }) {
    const itemCards = useMemo(() => 
      items.map(item => (
        <ItemCard
          key={item.id}
          item={item}
          type={type}
          onEdit={onEdit}
          onExecute={onExecute}
          onDelete={onDelete}
          onToggleFavorite={onToggleFavorite}
        />
      )),
      [items, type, onEdit, onExecute, onDelete, onToggleFavorite]
    );
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {itemCards}
      </div>
    );
  });
  
  export default ItemGrid;
  ```

- [ ] **Maak Loading & Error Components**
  - Bestand: `src/components/common/ui/LoadingStates.jsx`
  ```javascript
  import React from 'react';
  import { Loader2 } from 'lucide-react';
  
  export const LoadingSpinner = ({ size = 24, className = '' }) => (
    <div className={`flex items-center justify-center ${className}`}>
      <Loader2 className="animate-spin" size={size} />
    </div>
  );
  
  export const LoadingOverlay = ({ message = 'Loading...' }) => (
    <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-50">
      <div className="text-center">
        <LoadingSpinner size={32} />
        <p className="mt-2 text-gray-600">{message}</p>
      </div>
    </div>
  );
  
  export const SkeletonCard = () => (
    <div className="animate-pulse">
      <div className="h-32 bg-gray-200 rounded-lg mb-2"></div>
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
    </div>
  );
  ```

  - Bestand: `src/components/common/ui/ErrorStates.jsx`
  ```javascript
  import React from 'react';
  import { AlertCircle, RefreshCw, WifiOff } from 'lucide-react';
  import Button from './Button';
  
  export const ErrorMessage = ({ 
    error, 
    onRetry, 
    type = 'error' // error | offline | empty
  }) => {
    const configs = {
      error: {
        icon: AlertCircle,
        title: 'Er ging iets mis',
        message: error?.message || 'Een onverwachte fout is opgetreden',
        color: 'text-red-600'
      },
      offline: {
        icon: WifiOff,
        title: 'Geen verbinding',
        message: 'Controleer je internetverbinding',
        color: 'text-gray-600'
      },
      empty: {
        icon: AlertCircle,
        title: 'Geen resultaten',
        message: 'Probeer een andere zoekopdracht',
        color: 'text-gray-500'
      }
    };
    
    const config = configs[type];
    const Icon = config.icon;
    
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <Icon size={48} className={config.color} />
        <h3 className="text-lg font-semibold mt-4">{config.title}</h3>
        <p className="text-gray-600 mt-2 text-center max-w-md">
          {config.message}
        </p>
        {onRetry && (
          <Button 
            onClick={onRetry}
            variant="secondary"
            icon={RefreshCw}
            className="mt-4"
          >
            Probeer opnieuw
          </Button>
        )}
      </div>
    );
  };
  ```

#### Dag 5: Integratie & Testing
- [ ] **Update PromptTemplateSystem om nieuwe store te gebruiken**
  ```javascript
  // src/components/app/App.jsx
  import React from 'react';
  import { AppProvider } from '../../store/appStore';
  import Dashboard from '../features/dashboard/Dashboard';
  import { loadAllData } from '../../utils/dataStorage';
  
  function App() {
    const initialData = loadAllData();
    
    return (
      <AppProvider initialData={initialData}>
        <Dashboard />
      </AppProvider>
    );
  }
  
  export default App;
  ```

- [ ] **Test refactored components**
  ```powershell
  cd D:\Users\mzeil\personalProjects\AirPrompts; npm run dev
  ```

### Week 2: Modern State Management & Database Prep (Important)

#### Dag 1: Zustand + TanStack Query Setup
- [ ] **Installeer moderne state management libraries**
  ```powershell
  cd D:\Users\mzeil\personalProjects\AirPrompts
  npm install zustand @tanstack/react-query
  ```

- [ ] **Setup Zustand store voor UI state**
  - Bestand: `src/store/useUIStore.js`
  ```javascript
  import { create } from 'zustand';
  import { devtools, persist } from 'zustand/middleware';
  
  // UI state blijft client-side
  export const useUIStore = create(
    devtools(
      persist(
        (set) => ({
          // View preferences
          viewMode: 'grid',
          searchQuery: '',
          selectedFolderId: 'home',
          activeFilters: {},
          
          // UI actions
          setViewMode: (mode) => set({ viewMode: mode }),
          setSearchQuery: (query) => set({ searchQuery: query }),
          setSelectedFolder: (folderId) => set({ selectedFolderId: folderId }),
          updateFilters: (filters) => set({ activeFilters: filters }),
          
          // Reset UI state
          resetUI: () => set({
            searchQuery: '',
            activeFilters: {},
            selectedFolderId: 'home'
          })
        }),
        {
          name: 'airprompts-ui-storage',
          // Only persist user preferences
          partialize: (state) => ({ 
            viewMode: state.viewMode,
            selectedFolderId: state.selectedFolderId 
          })
        }
      )
    )
  );
  ```

- [ ] **Setup TanStack Query voor data fetching**
  - Bestand: `src/store/queryClient.js`
  ```javascript
  import { QueryClient } from '@tanstack/react-query';
  
  export const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        // Stale time: data blijft 5 minuten fresh
        staleTime: 5 * 60 * 1000,
        // Cache time: data blijft 10 minuten in cache
        cacheTime: 10 * 60 * 1000,
        // Retry logic
        retry: (failureCount, error) => {
          if (error.status === 404) return false;
          if (failureCount < 3) return true;
          return false;
        },
        // Refetch settings
        refetchOnWindowFocus: false,
        refetchOnReconnect: true
      },
      mutations: {
        // Optimistic updates by default
        onError: (error, variables, context) => {
          // Global error handling
          console.error('Mutation error:', error);
        }
      }
    }
  });
  ```

- [ ] **Database-ready hooks met TanStack Query**
  - Bestand: `src/hooks/useTemplatesQuery.js`
  ```javascript
  import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
  import { StorageService } from '../services/storage/StorageService';
  
  // Keys voor query invalidation
  export const templateKeys = {
    all: ['templates'],
    lists: () => [...templateKeys.all, 'list'],
    list: (filters) => [...templateKeys.lists(), { filters }],
    details: () => [...templateKeys.all, 'detail'],
    detail: (id) => [...templateKeys.details(), id]
  };
  
  // Fetch templates hook
  export function useTemplates(filters = {}) {
    return useQuery({
      queryKey: templateKeys.list(filters),
      queryFn: () => StorageService.getTemplates(filters),
      // Keep previous data while fetching new
      keepPreviousData: true,
      // Placeholder data voor instant UI
      placeholderData: []
    });
  }
  
  // Create template mutation
  export function useCreateTemplate() {
    const queryClient = useQueryClient();
    
    return useMutation({
      mutationFn: (templateData) => StorageService.createTemplate(templateData),
      // Optimistic update
      onMutate: async (newTemplate) => {
        await queryClient.cancelQueries({ queryKey: templateKeys.lists() });
        
        const previousTemplates = queryClient.getQueryData(templateKeys.lists());
        
        queryClient.setQueryData(templateKeys.lists(), (old = []) => [
          ...old,
          { ...newTemplate, id: 'temp-' + Date.now() }
        ]);
        
        return { previousTemplates };
      },
      // Rollback on error
      onError: (err, newTemplate, context) => {
        queryClient.setQueryData(
          templateKeys.lists(),
          context.previousTemplates
        );
      },
      // Refetch on success
      onSettled: () => {
        queryClient.invalidateQueries({ queryKey: templateKeys.lists() });
      }
    });
  }
  
  // Update template mutation
  export function useUpdateTemplate() {
    const queryClient = useQueryClient();
    
    return useMutation({
      mutationFn: ({ id, ...updates }) => 
        StorageService.updateTemplate({ id, ...updates }),
      // Optimistic update specific template
      onMutate: async ({ id, ...updates }) => {
        await queryClient.cancelQueries({ 
          queryKey: templateKeys.detail(id) 
        });
        
        const previousTemplate = queryClient.getQueryData(
          templateKeys.detail(id)
        );
        
        queryClient.setQueryData(
          templateKeys.detail(id),
          (old) => ({ ...old, ...updates })
        );
        
        return { previousTemplate };
      },
      onError: (err, variables, context) => {
        queryClient.setQueryData(
          templateKeys.detail(variables.id),
          context.previousTemplate
        );
      },
      onSettled: (data, error, variables) => {
        queryClient.invalidateQueries({ 
          queryKey: templateKeys.detail(variables.id) 
        });
      }
    });
  }
  ```

### Week 2 (Vervolg): Component Architecture & State Management (Important)

#### Dag 1-2: Templates Feature Module
- [ ] **Refactor TemplateEditor naar feature module**
  ```powershell
  # Verplaats template componenten
  cd D:\Users\mzeil\personalProjects\AirPrompts
  Move-Item src/components/templates/TemplateEditor.jsx src/components/features/templates/components/
  ```

- [ ] **Maak template-specifieke hooks**
  - Bestand: `src/components/features/templates/hooks/useTemplateForm.js`
  ```javascript
  import { useState, useCallback, useMemo } from 'react';
  import { extractVariables } from '../utils/templateUtils';
  
  export function useTemplateForm(initialTemplate = null) {
    const [formData, setFormData] = useState({
      name: initialTemplate?.name || '',
      description: initialTemplate?.description || '',
      content: initialTemplate?.content || '',
      category: initialTemplate?.category || 'general',
      tags: initialTemplate?.tags || [],
      variables: initialTemplate?.variables || []
    });
    
    const [errors, setErrors] = useState({});
    
    const updateField = useCallback((field, value) => {
      setFormData(prev => {
        const updated = { ...prev, [field]: value };
        
        // Auto-extract variables when content changes
        if (field === 'content') {
          updated.variables = extractVariables(value);
        }
        
        return updated;
      });
      
      // Clear error for this field
      if (errors[field]) {
        setErrors(prev => {
          const { [field]: _, ...rest } = prev;
          return rest;
        });
      }
    }, [errors]);
    
    const validate = useCallback(() => {
      const newErrors = {};
      
      if (!formData.name.trim()) {
        newErrors.name = 'Naam is verplicht';
      }
      if (!formData.content.trim()) {
        newErrors.content = 'Content is verplicht';
      }
      
      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    }, [formData]);
    
    const reset = useCallback(() => {
      setFormData({
        name: '',
        description: '',
        content: '',
        category: 'general',
        tags: [],
        variables: []
      });
      setErrors({});
    }, []);
    
    return {
      formData,
      errors,
      updateField,
      validate,
      reset
    };
  }
  ```

- [ ] **Optimaliseer TemplateEditor met nieuwe hooks**
  ```javascript
  // src/components/features/templates/components/TemplateEditor.jsx
  import React, { memo } from 'react';
  import { useTemplateForm } from '../hooks/useTemplateForm';
  import { useTemplates } from '../../../../store/hooks/useTemplates';
  
  const TemplateEditor = memo(function TemplateEditor({ 
    template, 
    onClose 
  }) {
    const { addTemplate, updateTemplate } = useTemplates();
    const { formData, errors, updateField, validate } = useTemplateForm(template);
    
    const handleSubmit = (e) => {
      e.preventDefault();
      
      if (!validate()) return;
      
      if (template?.id) {
        updateTemplate({ ...template, ...formData });
      } else {
        addTemplate(formData);
      }
      
      onClose();
    };
    
    return (
      <form onSubmit={handleSubmit} className="template-editor">
        {/* Form fields */}
      </form>
    );
  });
  
  export default TemplateEditor;
  ```

#### Dag 3-4: Common UI Components Library
- [ ] **Maak herbruikbare Button component**
  - Bestand: `src/components/common/ui/Button.jsx`
  ```javascript
  import React, { forwardRef } from 'react';
  
  const Button = forwardRef(function Button({ 
    variant = 'primary',
    size = 'md',
    disabled = false,
    loading = false,
    icon: Icon,
    iconPosition = 'left',
    children,
    className = '',
    ...props
  }, ref) {
    const baseClasses = 'inline-flex items-center justify-center transition-colors';
    
    const variantClasses = {
      primary: 'bg-primary-600 text-white hover:bg-primary-700',
      secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300',
      danger: 'bg-danger-600 text-white hover:bg-danger-700',
      ghost: 'bg-transparent hover:bg-gray-100'
    };
    
    const sizeClasses = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2',
      lg: 'px-6 py-3 text-lg'
    };
    
    const classes = `
      ${baseClasses}
      ${variantClasses[variant]}
      ${sizeClasses[size]}
      ${disabled || loading ? 'opacity-50 cursor-not-allowed' : ''}
      ${className}
    `;
    
    return (
      <button
        ref={ref}
        className={classes}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <Spinner className="mr-2" />}
        {Icon && iconPosition === 'left' && <Icon className="mr-2" size={16} />}
        {children}
        {Icon && iconPosition === 'right' && <Icon className="ml-2" size={16} />}
      </button>
    );
  });
  
  export default Button;
  ```

- [ ] **Maak Card component system**
  - Bestand: `src/components/common/ui/Card.jsx`
  ```javascript
  import React, { forwardRef } from 'react';
  
  export const Card = forwardRef(function Card({ 
    className = '', 
    children, 
    ...props 
  }, ref) {
    return (
      <div 
        ref={ref}
        className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  });
  
  export const CardHeader = ({ className = '', children, ...props }) => (
    <div className={`px-6 py-4 border-b border-gray-200 ${className}`} {...props}>
      {children}
    </div>
  );
  
  export const CardBody = ({ className = '', children, ...props }) => (
    <div className={`px-6 py-4 ${className}`} {...props}>
      {children}
    </div>
  );
  
  export const CardFooter = ({ className = '', children, ...props }) => (
    <div className={`px-6 py-4 border-t border-gray-200 ${className}`} {...props}>
      {children}
    </div>
  );
  ```

#### Dag 5: Workflows Feature Module
- [ ] **Refactor WorkflowEditor met performance optimalisaties**
  ```javascript
  // src/components/features/workflows/components/WorkflowEditor.jsx
  import React, { memo, useCallback, useMemo } from 'react';
  import { useWorkflows } from '../../../../store/hooks/useWorkflows';
  import { useTemplates } from '../../../../store/hooks/useTemplates';
  import WorkflowStep from './WorkflowStep';
  
  const WorkflowEditor = memo(function WorkflowEditor({ 
    workflow, 
    onClose 
  }) {
    const { templates } = useTemplates();
    const { addWorkflow, updateWorkflow } = useWorkflows();
    
    const availableTemplates = useMemo(() => 
      templates.map(t => ({ 
        value: t.id, 
        label: t.name,
        variables: t.variables || []
      })),
      [templates]
    );
    
    const handleStepChange = useCallback((index, updates) => {
      // Step update logic
    }, []);
    
    return (
      <div className="workflow-editor">
        {/* Editor implementation */}
      </div>
    );
  });
  
  export default WorkflowEditor;
  ```

### Week 3: Database Migration Prep & Performance (Important)

#### Dag 1: Offline-First Architecture
- [ ] **Implementeer offline detection**
  - Bestand: `src/hooks/useOnlineStatus.js`
  ```javascript
  import { useState, useEffect } from 'react';
  import { useUIStore } from '../store/useUIStore';
  
  export function useOnlineStatus() {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [isAPIHealthy, setIsAPIHealthy] = useState(false);
    
    useEffect(() => {
      const handleOnline = () => {
        setIsOnline(true);
        checkAPIHealth();
      };
      
      const handleOffline = () => {
        setIsOnline(false);
        setIsAPIHealthy(false);
      };
      
      const checkAPIHealth = async () => {
        try {
          // Future: ping your API endpoint
          const response = await fetch('/api/health', { 
            method: 'HEAD',
            cache: 'no-cache' 
          }).catch(() => null);
          
          setIsAPIHealthy(response?.ok || false);
        } catch {
          setIsAPIHealthy(false);
        }
      };
      
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      
      // Check API health on mount and periodically
      checkAPIHealth();
      const interval = setInterval(checkAPIHealth, 30000); // 30s
      
      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
        clearInterval(interval);
      };
    }, []);
    
    return { 
      isOnline, 
      isAPIHealthy,
      connectionStatus: isAPIHealthy ? 'api' : isOnline ? 'online' : 'offline'
    };
  }
  ```

- [ ] **Sync Queue voor offline changes**
  - Bestand: `src/services/sync/SyncQueue.js`
  ```javascript
  import { create } from 'zustand';
  import { persist } from 'zustand/middleware';
  
  // Sync queue voor offline operaties
  export const useSyncQueue = create(
    persist(
      (set, get) => ({
        queue: [],
        syncStatus: 'idle', // idle | syncing | error
        lastSyncAt: null,
        
        // Add operation to queue
        addToQueue: (operation) => {
          const queueItem = {
            id: crypto.randomUUID(),
            timestamp: Date.now(),
            status: 'pending',
            retries: 0,
            ...operation
          };
          
          set((state) => ({ 
            queue: [...state.queue, queueItem] 
          }));
        },
        
        // Process queue when online
        processQueue: async () => {
          const { queue } = get();
          const pending = queue.filter(item => item.status === 'pending');
          
          if (pending.length === 0) return;
          
          set({ syncStatus: 'syncing' });
          
          for (const item of pending) {
            try {
              // Process based on operation type
              switch (item.type) {
                case 'createTemplate':
                  await StorageService.createTemplate(item.data);
                  break;
                case 'updateTemplate':
                  await StorageService.updateTemplate(item.data);
                  break;
                case 'deleteTemplate':
                  await StorageService.deleteTemplate(item.id);
                  break;
              }
              
              // Mark as completed
              set((state) => ({
                queue: state.queue.map(q => 
                  q.id === item.id 
                    ? { ...q, status: 'completed' }
                    : q
                )
              }));
            } catch (error) {
              // Handle retry logic
              set((state) => ({
                queue: state.queue.map(q => 
                  q.id === item.id 
                    ? { 
                        ...q, 
                        status: 'error',
                        error: error.message,
                        retries: q.retries + 1
                      }
                    : q
                )
              }));
            }
          }
          
          set({ 
            syncStatus: 'idle',
            lastSyncAt: Date.now()
          });
          
          // Clean completed items after 5 minutes
          setTimeout(() => {
            set((state) => ({
              queue: state.queue.filter(q => q.status !== 'completed')
            }));
          }, 5 * 60 * 1000);
        },
        
        // Clear queue
        clearQueue: () => set({ queue: [] }),
        
        // Get pending count
        getPendingCount: () => {
          const { queue } = get();
          return queue.filter(q => q.status === 'pending').length;
        }
      }),
      {
        name: 'airprompts-sync-queue'
      }
    )
  );
  ```

#### Dag 2: React 19 Patterns Implementation
- [ ] **Implementeer Suspense voor data loading**
  - Bestand: `src/components/features/templates/components/TemplateListSuspense.jsx`
  ```javascript
  import React, { Suspense } from 'react';
  import { ErrorBoundary } from 'react-error-boundary';
  import { useTemplates } from '../../../../hooks/useTemplatesQuery';
  import { SkeletonCard, LoadingSpinner } from '../../../common/ui/LoadingStates';
  import { ErrorMessage } from '../../../common/ui/ErrorStates';
  import TemplateCard from './TemplateCard';
  
  // Resource-based component (React 19 pattern)
  function TemplateListContent({ filters }) {
    const { data: templates, isLoading, error } = useTemplates(filters);
    
    if (isLoading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      );
    }
    
    if (error) {
      throw error; // Let ErrorBoundary handle it
    }
    
    if (!templates?.length) {
      return <ErrorMessage type="empty" />;
    }
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map(template => (
          <TemplateCard key={template.id} template={template} />
        ))}
      </div>
    );
  }
  
  // Main component with Suspense boundary
  export default function TemplateListSuspense({ filters }) {
    return (
      <ErrorBoundary
        fallbackRender={({ error, resetErrorBoundary }) => (
          <ErrorMessage 
            error={error} 
            onRetry={resetErrorBoundary}
            type="error"
          />
        )}
      >
        <Suspense fallback={<LoadingSpinner />}>
          <TemplateListContent filters={filters} />
        </Suspense>
      </ErrorBoundary>
    );
  }
  ```

### Week 3 (Vervolg): Performance Optimization & Advanced Features (Important)

#### Dag 1-2: Implement Virtual Scrolling
- [ ] **Optimaliseer grote lijsten met react-window**
  ```powershell
  cd D:\Users\mzeil\personalProjects\AirPrompts; npm install react-window
  ```

- [ ] **VirtualizedList component**
  ```javascript
  // src/components/common/ui/VirtualizedList.jsx
  import React, { memo } from 'react';
  import { FixedSizeList } from 'react-window';
  
  const VirtualizedList = memo(function VirtualizedList({ 
    items, 
    height = 600,
    itemHeight = 80,
    renderItem 
  }) {
    const Row = ({ index, style }) => (
      <div style={style}>
        {renderItem(items[index], index)}
      </div>
    );
    
    return (
      <FixedSizeList
        height={height}
        itemCount={items.length}
        itemSize={itemHeight}
        width="100%"
      >
        {Row}
      </FixedSizeList>
    );
  });
  
  export default VirtualizedList;
  ```

#### Dag 3-4: Search & Filter Optimization
- [ ] **Implement debounced search**
  ```javascript
  // src/hooks/useDebouncedSearch.js
  import { useState, useEffect, useCallback } from 'react';
  
  export function useDebouncedSearch(searchFn, delay = 300) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    
    useEffect(() => {
      if (!query.trim()) {
        setResults([]);
        return;
      }
      
      setIsSearching(true);
      const timeoutId = setTimeout(async () => {
        const searchResults = await searchFn(query);
        setResults(searchResults);
        setIsSearching(false);
      }, delay);
      
      return () => clearTimeout(timeoutId);
    }, [query, searchFn, delay]);
    
    return {
      query,
      setQuery,
      results,
      isSearching
    };
  }
  ```

#### Dag 5: Lazy Loading Implementation
- [ ] **Implement code splitting voor routes**
  ```javascript
  // src/components/app/App.jsx
  import React, { lazy, Suspense } from 'react';
  import { AppProvider } from '../../store/appStore';
  import Loading from '../common/Loading';
  
  const Dashboard = lazy(() => import('../features/dashboard/Dashboard'));
  const TemplateEditor = lazy(() => import('../features/templates/components/TemplateEditor'));
  const WorkflowEditor = lazy(() => import('../features/workflows/components/WorkflowEditor'));
  
  function App() {
    return (
      <AppProvider>
        <Suspense fallback={<Loading />}>
          {/* Routes */}
        </Suspense>
      </AppProvider>
    );
  }
  ```

### Week 4: Database Integration Foundation (Critical)

#### Dag 1-2: API Client Setup
- [ ] **Maak API client abstraction**
  - Bestand: `src/services/api/apiClient.js`
  ```javascript
  // API Client die makkelijk kan switchen tussen mock en real API
  class APIClient {
    constructor(config = {}) {
      this.baseURL = config.baseURL || 'http://localhost:3001/api';
      this.timeout = config.timeout || 10000;
      this.interceptors = [];
      this.mockMode = config.mockMode || true; // Start met mocks
    }
    
    // Generic request handler
    async request(endpoint, options = {}) {
      // Mock mode voor development
      if (this.mockMode) {
        return this.mockRequest(endpoint, options);
      }
      
      const url = `${this.baseURL}${endpoint}`;
      const config = {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        signal: AbortSignal.timeout(this.timeout)
      };
      
      try {
        const response = await fetch(url, config);
        
        if (!response.ok) {
          throw new APIError(
            response.statusText,
            response.status,
            await response.json()
          );
        }
        
        return await response.json();
      } catch (error) {
        if (error.name === 'AbortError') {
          throw new APIError('Request timeout', 408);
        }
        throw error;
      }
    }
    
    // Mock implementation voor testing
    async mockRequest(endpoint, options = {}) {
      // Simuleer network delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Mock responses based on endpoint
      if (endpoint.includes('/templates')) {
        if (options.method === 'POST') {
          return { 
            success: true, 
            data: { ...JSON.parse(options.body), id: crypto.randomUUID() }
          };
        }
        // Return mock templates
        return { 
          success: true, 
          data: getMockTemplates() 
        };
      }
      
      throw new APIError('Not found', 404);
    }
    
    // Convenience methods
    get(endpoint, options) {
      return this.request(endpoint, { ...options, method: 'GET' });
    }
    
    post(endpoint, data, options) {
      return this.request(endpoint, { 
        ...options, 
        method: 'POST',
        body: JSON.stringify(data)
      });
    }
    
    put(endpoint, data, options) {
      return this.request(endpoint, { 
        ...options, 
        method: 'PUT',
        body: JSON.stringify(data)
      });
    }
    
    delete(endpoint, options) {
      return this.request(endpoint, { ...options, method: 'DELETE' });
    }
    
    // Switch to real API
    enableRealAPI() {
      this.mockMode = false;
      console.log('API Client: Switched to real API mode');
    }
  }
  
  // Custom error class
  class APIError extends Error {
    constructor(message, status, data = {}) {
      super(message);
      this.name = 'APIError';
      this.status = status;
      this.data = data;
    }
  }
  
  // Export singleton instance
  export const apiClient = new APIClient();
  ```

- [ ] **Update StorageService voor API integration**
  - Bestand: `src/services/storage/StorageService.js` (update)
  ```javascript
  import { apiClient } from '../api/apiClient';
  
  class StorageServiceClass {
    constructor() {
      this.mode = 'localStorage'; // localStorage | api | hybrid
      this.cache = new Map(); // In-memory cache
    }
    
    async getTemplates(filters = {}) {
      // API mode
      if (this.mode === 'api' || this.mode === 'hybrid') {
        try {
          const queryParams = new URLSearchParams(filters).toString();
          const endpoint = `/templates${queryParams ? `?${queryParams}` : ''}`;
          const response = await apiClient.get(endpoint);
          
          // Update cache
          this.cache.set('templates', response.data);
          
          // In hybrid mode, also update localStorage
          if (this.mode === 'hybrid') {
            localStorage.setItem(
              'airprompts_templates', 
              JSON.stringify(response.data)
            );
          }
          
          return response.data;
        } catch (error) {
          // Fallback to cache or localStorage
          if (this.cache.has('templates')) {
            return this.cache.get('templates');
          }
          // Continue to localStorage fallback
        }
      }
      
      // localStorage mode (or fallback)
      const data = localStorage.getItem('airprompts_templates');
      const templates = data ? JSON.parse(data) : [];
      
      // Apply filters locally
      return this.applyLocalFilters(templates, filters);
    }
    
    // Helper to filter templates locally
    applyLocalFilters(templates, filters) {
      let filtered = [...templates];
      
      if (filters.category && filters.category !== 'all') {
        filtered = filtered.filter(t => t.category === filters.category);
      }
      
      if (filters.search) {
        const search = filters.search.toLowerCase();
        filtered = filtered.filter(t => 
          t.name.toLowerCase().includes(search) ||
          t.content.toLowerCase().includes(search)
        );
      }
      
      if (filters.favorite !== undefined) {
        filtered = filtered.filter(t => t.favorite === filters.favorite);
      }
      
      return filtered;
    }
    
    // Mode switching
    setMode(mode) {
      this.mode = mode;
      console.log(`Storage Service: Switched to ${mode} mode`);
      
      if (mode === 'api') {
        apiClient.enableRealAPI();
      }
    }
    
    // Migration helper
    async migrateToAPI() {
      console.log('Starting migration to API...');
      
      // Get all local data
      const localTemplates = await this.getTemplates();
      const localWorkflows = await this.getWorkflows();
      
      // Switch to API mode
      this.setMode('api');
      
      // Upload all data
      const results = {
        templates: { success: 0, failed: 0 },
        workflows: { success: 0, failed: 0 }
      };
      
      // Migrate templates
      for (const template of localTemplates) {
        try {
          await this.createTemplate(template);
          results.templates.success++;
        } catch (error) {
          console.error(`Failed to migrate template ${template.id}:`, error);
          results.templates.failed++;
        }
      }
      
      console.log('Migration completed:', results);
      return results;
    }
  }
  
  export const StorageService = new StorageServiceClass();
  ```

#### Dag 3-5: Testing & Migration Tools
- [ ] **Maak migration UI component**
  - Bestand: `src/components/settings/DatabaseMigration.jsx`
  ```javascript
  import React, { useState } from 'react';
  import { StorageService } from '../../services/storage/StorageService';
  import { useOnlineStatus } from '../../hooks/useOnlineStatus';
  import Button from '../common/ui/Button';
  import { AlertCircle, CheckCircle, Database, Loader2 } from 'lucide-react';
  
  export default function DatabaseMigration() {
    const { isAPIHealthy } = useOnlineStatus();
    const [migrationStatus, setMigrationStatus] = useState('idle');
    const [migrationResults, setMigrationResults] = useState(null);
    
    const handleMigration = async () => {
      if (!isAPIHealthy) {
        alert('API is niet beschikbaar. Start eerst de backend server.');
        return;
      }
      
      setMigrationStatus('migrating');
      
      try {
        const results = await StorageService.migrateToAPI();
        setMigrationResults(results);
        setMigrationStatus('completed');
      } catch (error) {
        setMigrationStatus('error');
        console.error('Migration failed:', error);
      }
    };
    
    return (
      <div className="p-6 bg-white rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Database size={24} />
          Database Migratie
        </h2>
        
        <div className="space-y-4">
          {/* Status indicators */}
          <div className="flex items-center gap-2">
            <span className="font-medium">API Status:</span>
            {isAPIHealthy ? (
              <span className="text-green-600 flex items-center gap-1">
                <CheckCircle size={16} /> Beschikbaar
              </span>
            ) : (
              <span className="text-red-600 flex items-center gap-1">
                <AlertCircle size={16} /> Niet beschikbaar
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <span className="font-medium">Storage Mode:</span>
            <span className="text-gray-600">
              {StorageService.mode}
            </span>
          </div>
          
          {/* Migration button */}
          {migrationStatus === 'idle' && (
            <Button
              onClick={handleMigration}
              disabled={!isAPIHealthy}
              variant="primary"
              icon={Database}
            >
              Start Migratie naar Database
            </Button>
          )}
          
          {/* Migration in progress */}
          {migrationStatus === 'migrating' && (
            <div className="flex items-center gap-2 text-blue-600">
              <Loader2 className="animate-spin" size={20} />
              <span>Migratie bezig...</span>
            </div>
          )}
          
          {/* Migration results */}
          {migrationStatus === 'completed' && migrationResults && (
            <div className="bg-green-50 p-4 rounded">
              <h3 className="font-medium text-green-800 mb-2">
                Migratie Voltooid!
              </h3>
              <ul className="text-sm text-green-700">
                <li>
                  Templates: {migrationResults.templates.success} succesvol,
                  {migrationResults.templates.failed} mislukt
                </li>
                <li>
                  Workflows: {migrationResults.workflows.success} succesvol,
                  {migrationResults.workflows.failed} mislukt
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
    );
  }
  ```

### Week 5: Testing & Documentation (Should Do)

#### Dag 1-2: Setup Vitest
- [ ] **Install en configureer Vitest**
  ```powershell
  cd D:\Users\mzeil\personalProjects\AirPrompts
  npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
  ```

- [ ] **Vitest configuratie**
  ```javascript
  // vite.config.js
  import { defineConfig } from 'vite'
  import react from '@vitejs/plugin-react'
  
  export default defineConfig({
    plugins: [react()],
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './src/tests/setup.js',
    },
  })
  ```

- [ ] **Test setup file**
  ```javascript
  // src/tests/setup.js
  import '@testing-library/jest-dom';
  ```

#### Dag 3-4: Component Tests
- [ ] **Button component test**
  ```javascript
  // src/components/common/ui/__tests__/Button.test.jsx
  import { render, screen, fireEvent } from '@testing-library/react';
  import Button from '../Button';
  
  describe('Button Component', () => {
    it('renders children correctly', () => {
      render(<Button>Click me</Button>);
      expect(screen.getByText('Click me')).toBeInTheDocument();
    });
    
    it('handles click events', () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Click me</Button>);
      
      fireEvent.click(screen.getByText('Click me'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
    
    it('is disabled when loading', () => {
      render(<Button loading>Click me</Button>);
      expect(screen.getByRole('button')).toBeDisabled();
    });
  });
  ```

- [ ] **Template hooks test**
  ```javascript
  // src/components/features/templates/hooks/__tests__/useTemplateForm.test.js
  import { renderHook, act } from '@testing-library/react';
  import { useTemplateForm } from '../useTemplateForm';
  
  describe('useTemplateForm Hook', () => {
    it('initializes with empty form data', () => {
      const { result } = renderHook(() => useTemplateForm());
      
      expect(result.current.formData).toEqual({
        name: '',
        description: '',
        content: '',
        category: 'general',
        tags: [],
        variables: []
      });
    });
    
    it('validates required fields', () => {
      const { result } = renderHook(() => useTemplateForm());
      
      act(() => {
        const isValid = result.current.validate();
        expect(isValid).toBe(false);
        expect(result.current.errors).toHaveProperty('name');
        expect(result.current.errors).toHaveProperty('content');
      });
    });
    
    it('extracts variables from content', () => {
      const { result } = renderHook(() => useTemplateForm());
      
      act(() => {
        result.current.updateField('content', 'Hello {name}, welcome to {place}!');
      });
      
      expect(result.current.formData.variables).toEqual(['name', 'place']);
    });
  });
  ```

#### Dag 5: Integration Tests
- [ ] **Dashboard integration test**
  ```javascript
  // src/tests/integration/Dashboard.test.jsx
  import { render, screen, waitFor } from '@testing-library/react';
  import { AppProvider } from '../../store/appStore';
  import Dashboard from '../../components/features/dashboard/Dashboard';
  
  const mockData = {
    templates: [
      { id: 1, name: 'Test Template', description: 'Test', content: 'Hello {name}' }
    ],
    workflows: [],
    snippets: []
  };
  
  describe('Dashboard Integration', () => {
    it('renders templates from store', async () => {
      render(
        <AppProvider initialData={mockData}>
          <Dashboard />
        </AppProvider>
      );
      
      await waitFor(() => {
        expect(screen.getByText('Test Template')).toBeInTheDocument();
      });
    });
  });
  ```

## 🔧 Component Refactoring Details

### Homepage Component Breakdown

#### Current Component Analysis
- **Bestand**: `src/components/dashboard/Homepage.jsx`
- **Regels**: 500+
- **Verantwoordelijkheden**: 
  - Search/filter UI
  - Item rendering (grid/list)
  - Drag & drop
  - Pagination
  - Folder navigation
  - Widget management

#### Nieuwe Component Structuur
```
dashboard/
├── Dashboard.jsx (main container)
├── components/
│   ├── DashboardHeader.jsx
│   ├── DashboardSidebar.jsx
│   ├── SearchBar.jsx
│   ├── FilterBar.jsx
│   ├── ItemGrid.jsx
│   ├── ItemList.jsx
│   ├── FolderNavigation.jsx
│   └── DashboardWidgets.jsx
├── hooks/
│   ├── useDashboardState.js
│   ├── useItemFiltering.js
│   └── useItemActions.js
└── utils/
    └── dashboardHelpers.js
```

### TemplateEditor Refactoring

#### Props Interface
```javascript
interface TemplateEditorProps {
  template?: Template | null;
  onSave: (template: Template) => void;
  onCancel: () => void;
  isLoading?: boolean;
}
```

#### Implementation met optimalisaties
```javascript
const TemplateEditor = memo(function TemplateEditor({ 
  template, 
  onSave, 
  onCancel, 
  isLoading = false 
}) {
  // Implementation
}, (prevProps, nextProps) => {
  // Custom comparison voor betere performance
  return prevProps.template?.id === nextProps.template?.id &&
         prevProps.isLoading === nextProps.isLoading;
});
```

## 🧪 Testing Implementation Strategy

### Test File Naming Convention
- Component tests: `ComponentName.test.jsx`
- Hook tests: `useHookName.test.js`
- Integration tests: `FeatureName.integration.test.jsx`

### Test Coverage Goals
- **Week 1**: Core componenten (Button, Card, Form inputs)
- **Week 2**: Feature componenten (TemplateEditor, WorkflowEditor)
- **Week 3**: Hooks en utilities
- **Week 4**: Integration tests

### NPM Scripts toevoegen
```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest run --coverage"
  }
}
```

## ✅ Definition of Done

### Voor elke component refactoring:
- [ ] Component is gesplitst volgens single responsibility
- [ ] Props zijn getypeerd met PropTypes of JSDoc
- [ ] Performance optimalisaties toegepast (memo, useCallback, useMemo)
- [ ] Unit tests geschreven met minimaal 80% coverage
- [ ] Component gedocumenteerd met JSDoc
- [ ] Geen ESLint warnings
- [ ] Code review uitgevoerd

### Voor elke week:
- [ ] Alle geplande taken afgerond
- [ ] Code gecommit naar feature branch
- [ ] Tests draaien succesvol
- [ ] Applicatie werkt zonder breaking changes
- [ ] Performance metrics gemeten en verbeterd

## 🎯 Database Integration Roadmap

### Fase 1: Refactoring (Weeks 1-3) ✅
- Component architecture database-ready maken
- Async state management patterns implementeren
- Loading/error states overal toevoegen
- Offline support voorbereiden

### Fase 2: Mock API Development (Week 4) 🔄
- API client met mock responses
- Test database patterns zonder backend
- Migration tools bouwen
- Performance metrics baseline

### Fase 3: Backend Implementation (Week 5-6) 📊
- Express + SQLite setup (zoals in DATABASE_INTEGRATION_PLAN.md)
- API endpoints implementeren
- Data migration uitvoeren
- Production deployment

## 📊 Success Metrics

### Performance Targets
- Homepage render tijd: < 100ms
- API response tijd: < 200ms (localStorage: < 50ms tijdens transitie)
- Re-renders bij typing: -50%
- Bundle size: < 600KB (inclusief Zustand + TanStack Query)

### Database Readiness Targets
- 100% componenten met loading states
- 100% API calls met error handling
- Offline support voor alle CRUD operations
- Zero data loss tijdens migration

### Code Quality Targets
- Component grootte: max 150 regels
- Hook complexiteit: max 3 dependencies
- Test coverage: > 80%
- Mock API coverage: 100%

## 🔄 Migration Strategy

### Stap 1: Parallel Running (Recommended)
```javascript
// Start met hybrid mode
StorageService.setMode('hybrid');
// Data wordt naar beide localStorage EN API geschreven
// Lezen gebeurt van API met localStorage fallback
```

### Stap 2: Verification Period (1 week)
- Monitor API reliability
- Check data consistency
- Gather performance metrics

### Stap 3: Full Migration
```javascript
// Switch volledig naar API
StorageService.setMode('api');
// localStorage wordt backup-only
```

## 🚀 Next Steps na Database Integration

1. **Real-time Sync**: WebSocket voor live updates
2. **Advanced Caching**: Redis layer toevoegen
3. **Search Engine**: Elasticsearch integratie
4. **Multi-user**: Authentication & authorization
5. **Analytics**: Usage tracking & insights

## 💡 Best Practices Summary

### Van Seven's Research:
1. **Zustand + TanStack Query** combo voor state management
2. **Progressive Enhancement** van localStorage naar API
3. **Offline-First** architectuur vanaf begin
4. **React 19 patterns** zoals Suspense en Error Boundaries
5. **Mock-First Development** voor snelle iteratie

### Database-Ready Patterns:
- Alle data operations via service layer
- Loading/error states standaard
- Optimistic updates waar mogelijk
- Sync queue voor offline changes
- Graceful degradation bij API problemen