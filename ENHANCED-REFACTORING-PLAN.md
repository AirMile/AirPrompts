# 🏗️ AirPrompts Enhanced Refactoring Plan v2.0

## Executive Summary

Dit verbeterde refactoring plan integreert React best practices, moderne design patterns en performance optimalisaties. Het plan adresseert alle geïdentificeerde verbeterpunten uit de analyse en biedt een complete transformatie roadmap voor de AirPrompts codebase.

### 🎯 Verbeteringen t.o.v. Originele Plan

1. **useCallback Integration** - Proper memoization van alle event handlers
2. **Complete Error Boundaries** - Feature-specifieke error handling
3. **Facade Pattern** - Unified storage interface met multiple backends
4. **Adapter Pattern** - Smooth legacy data migration
5. **Strategy Pattern** - Flexibele view modes en rendering strategies
6. **Enhanced Performance** - Geavanceerde virtualisatie en code splitting

### 📊 Impact Metrics Update

| Metric | Origineel Doel | Verbeterd Doel | Verbetering |
|--------|----------------|----------------|-------------|
| Lines of Code | -30% | -35% | +5% |
| Test Coverage | 80% | 90% | +10% |
| Bundle Size | -50% | -60% | +10% |
| Load Time | <1.5s | <1.0s | -33% |
| Lighthouse Score | 95+ | 98+ | +3 |

## 🏛️ Enhanced Architecture Patterns

### 1. Component Library Consolidatie (Unchanged)

Het originele BaseEditor en BaseCard systeem blijft behouden, dit was al excellent.

```javascript
// components/base/BaseEditor.jsx
export const BaseEditor = ({ 
  entity,
  entityType,
  schema,
  onSave,
  onCancel,
  customFields
}) => {
  const { formData, errors, handleChange, validate } = useEntityForm(entity, schema);
  const { getColorClasses } = useEntityTheme(entityType);
  
  return (
    <EditorLayout>
      <EditorHeader title={`${entity?.id ? 'Edit' : 'Create'} ${entityType}`} />
      <EditorForm onSubmit={() => validate() && onSave(formData)}>
        <FieldRenderer fields={schema.fields} data={formData} onChange={handleChange} />
        {customFields}
        <EditorActions 
          onCancel={onCancel} 
          colorClasses={getColorClasses('button')} 
        />
      </EditorForm>
    </EditorLayout>
  );
};
```

### 2. Enhanced State Management met useCallback

#### Probleem
- Geen proper memoization van callbacks
- Re-renders door unstable references
- Inefficiënte context updates

#### Oplossing: Complete useCallback Integration

```javascript
// contexts/ActionsContext.jsx - ENHANCED met useCallback
const ActionsProvider = ({ children }) => {
  const queryClient = useQueryClient();
  const createTemplate = useCreateTemplate();
  const updateTemplate = useUpdateTemplate();
  const deleteTemplate = useDeleteTemplate();
  const createWorkflow = useCreateWorkflow();
  const updateWorkflow = useUpdateWorkflow();
  const deleteWorkflow = useDeleteWorkflow();
  const createSnippet = useCreateSnippet();
  const updateSnippet = useUpdateSnippet();
  const deleteSnippet = useDeleteSnippet();
  
  // Memoized action creators
  const create = useCallback(async (type, data) => {
    const mutations = {
      template: createTemplate,
      workflow: createWorkflow,
      snippet: createSnippet
    };
    
    try {
      const result = await mutations[type].mutateAsync(data);
      showSuccessNotification(`${type} created successfully`);
      return result;
    } catch (error) {
      showErrorNotification(`Failed to create ${type}`);
      throw error;
    }
  }, [createTemplate, createWorkflow, createSnippet]);
  
  const update = useCallback(async (type, id, data) => {
    const mutations = {
      template: updateTemplate,
      workflow: updateWorkflow,
      snippet: updateSnippet
    };
    
    try {
      const result = await mutations[type].mutateAsync({ id, ...data });
      showSuccessNotification(`${type} updated successfully`);
      return result;
    } catch (error) {
      showErrorNotification(`Failed to update ${type}`);
      throw error;
    }
  }, [updateTemplate, updateWorkflow, updateSnippet]);
  
  const deleteEntity = useCallback(async (type, id) => {
    const mutations = {
      template: deleteTemplate,
      workflow: deleteWorkflow,
      snippet: deleteSnippet
    };
    
    try {
      await mutations[type].mutateAsync(id);
      showSuccessNotification(`${type} deleted successfully`);
    } catch (error) {
      showErrorNotification(`Failed to delete ${type}`);
      throw error;
    }
  }, [deleteTemplate, deleteWorkflow, deleteSnippet]);
  
  const execute = useCallback((item, type) => {
    // Execution logic met proper memoization
    console.log('Executing:', type, item.id);
    // Navigate to executor or open modal
  }, []);
  
  const toggleFavorite = useCallback(async (item, type) => {
    const updatedItem = { ...item, favorite: !item.favorite };
    return update(type, item.id, updatedItem);
  }, [update]);
  
  // Batch operations
  const batchUpdate = useCallback(async (type, ids, updates) => {
    const results = await Promise.allSettled(
      ids.map(id => update(type, id, updates))
    );
    
    const failed = results.filter(r => r.status === 'rejected').length;
    if (failed > 0) {
      showWarningNotification(`${failed} items failed to update`);
    }
    
    return results;
  }, [update]);
  
  const actions = useMemo(() => ({
    create,
    update,
    delete: deleteEntity,
    execute,
    toggleFavorite,
    batchUpdate
  }), [create, update, deleteEntity, execute, toggleFavorite, batchUpdate]);
  
  return <ActionsContext.Provider value={actions}>{children}</ActionsContext.Provider>;
};

// Custom hook met stable references
export const useActions = () => {
  const context = useContext(ActionsContext);
  if (!context) {
    throw new Error('useActions must be used within ActionsProvider');
  }
  return context;
};
```

### 3. Complete Error Boundary Implementation

#### Probleem
- Geen graceful error handling
- White screen of death bij crashes
- Geen error reporting

#### Oplossing: Feature-Specific Error Boundaries

```javascript
// components/errors/ErrorBoundary.jsx
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null,
      errorCount: 0
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    
    // Report to error tracking service
    if (window.Sentry) {
      window.Sentry.captureException(error, {
        contexts: {
          react: {
            componentStack: errorInfo.componentStack
          }
        }
      });
    }
    
    this.setState(prevState => ({
      error,
      errorInfo,
      errorCount: prevState.errorCount + 1
    }));
  }

  componentDidUpdate(prevProps) {
    // Reset error boundary when route changes
    if (prevProps.resetKeys !== this.props.resetKeys) {
      this.setState({ hasError: false, error: null, errorInfo: null });
    }
  }

  render() {
    if (this.state.hasError) {
      // Too many errors, show minimal UI
      if (this.state.errorCount > 3) {
        return <CriticalErrorFallback />;
      }
      
      return (
        <ErrorFallback
          error={this.state.error}
          resetError={() => this.setState({ hasError: false })}
          errorInfo={this.state.errorInfo}
        />
      );
    }

    return this.props.children;
  }
}

// Feature-specific error boundaries
export const ExecutorErrorBoundary = ({ children }) => (
  <ErrorBoundary
    fallback={<ExecutorErrorFallback />}
    onError={(error) => console.error('Executor error:', error)}
  >
    {children}
  </ErrorBoundary>
);

export const EditorErrorBoundary = ({ children }) => (
  <ErrorBoundary
    fallback={<EditorErrorFallback />}
    onError={(error) => console.error('Editor error:', error)}
  >
    {children}
  </ErrorBoundary>
);

// Error fallback component
const ErrorFallback = ({ error, resetError, errorInfo }) => {
  const [showDetails, setShowDetails] = useState(false);
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary-50 dark:bg-secondary-900">
      <div className="max-w-md w-full bg-white dark:bg-secondary-800 rounded-lg shadow-lg p-6">
        <div className="text-center">
          <div className="text-6xl mb-4">😵</div>
          <h1 className="text-2xl font-bold text-secondary-900 dark:text-secondary-100 mb-2">
            Oops! Something went wrong
          </h1>
          <p className="text-secondary-600 dark:text-secondary-400 mb-4">
            {error?.message || 'An unexpected error occurred'}
          </p>
          
          <div className="flex gap-2 justify-center mb-4">
            <button
              onClick={resetError}
              className="px-4 py-2 bg-primary-500 text-white rounded hover:bg-primary-600"
            >
              Try Again
            </button>
            <button
              onClick={() => window.location.href = '/'}
              className="px-4 py-2 bg-secondary-200 dark:bg-secondary-700 rounded"
            >
              Go Home
            </button>
          </div>
          
          {process.env.NODE_ENV === 'development' && (
            <>
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="text-sm text-primary-500 hover:underline"
              >
                {showDetails ? 'Hide' : 'Show'} Details
              </button>
              
              {showDetails && errorInfo && (
                <pre className="mt-4 text-left text-xs bg-secondary-100 dark:bg-secondary-900 p-4 rounded overflow-auto">
                  {errorInfo.componentStack}
                </pre>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
```

### 4. Storage Facade Pattern Implementation

#### Probleem
- Directe localStorage calls overal
- Geen abstractie voor verschillende storage types
- Moeilijk te testen en mockken

#### Oplossing: Complete Storage Facade

```javascript
// services/storage/StorageFacade.js
class StorageFacade {
  constructor() {
    // Initialize different storage backends
    this.localStorage = new LocalStorageAdapter();
    this.indexedDB = new IndexedDBAdapter();
    this.memoryCache = new MemoryCache();
    this.sessionStorage = new SessionStorageAdapter();
    
    // Migration service for legacy data
    this.migrationService = new DataMigrationService();
    
    // Listeners for storage events
    this.listeners = new Map();
  }

  async initialize() {
    // Run migrations on startup
    await this.migrationService.runPendingMigrations();
    
    // Warm up cache with frequently accessed data
    await this.warmUpCache();
    
    // Setup cross-tab synchronization
    this.setupStorageSync();
  }

  async get(key, options = {}) {
    try {
      // 1. Check memory cache (fastest)
      if (!options.skipCache) {
        const cached = await this.memoryCache.get(key);
        if (cached) {
          this.recordMetrics('cache_hit', key);
          return cached;
        }
      }

      // 2. Check session storage (temporary data)
      if (options.useSession) {
        const sessionData = await this.sessionStorage.get(key);
        if (sessionData) {
          await this.memoryCache.set(key, sessionData, { ttl: 300 }); // 5 min TTL
          return sessionData;
        }
      }

      // 3. Check localStorage (persistent, small data)
      const localData = await this.localStorage.get(key);
      if (localData) {
        await this.memoryCache.set(key, localData);
        this.recordMetrics('localStorage_hit', key);
        return localData;
      }

      // 4. Check IndexedDB (persistent, large data)
      if (options.allowIndexedDB !== false) {
        const indexedData = await this.indexedDB.get(key);
        if (indexedData) {
          // Promote to localStorage if small enough
          if (this.shouldPromoteToLocalStorage(indexedData)) {
            await this.localStorage.set(key, indexedData);
          }
          await this.memoryCache.set(key, indexedData);
          this.recordMetrics('indexedDB_hit', key);
          return indexedData;
        }
      }

      this.recordMetrics('miss', key);
      return options.defaultValue ?? null;

    } catch (error) {
      console.error(`Storage facade error for ${key}:`, error);
      this.recordMetrics('error', key);
      
      // Try fallback storage
      if (options.fallback) {
        try {
          return await this.localStorage.get(key) || options.defaultValue;
        } catch (fallbackError) {
          console.error('Fallback storage also failed:', fallbackError);
        }
      }
      
      return options.defaultValue ?? null;
    }
  }

  async set(key, value, options = {}) {
    try {
      // Validate data size
      const size = this.calculateSize(value);
      if (size > this.maxSize && !options.force) {
        throw new Error(`Data too large: ${size} bytes`);
      }

      // Update memory cache immediately
      await this.memoryCache.set(key, value, { ttl: options.ttl });

      // Determine storage strategy based on data size and type
      const strategy = this.determineStorageStrategy(value, options);

      switch (strategy) {
        case 'session':
          await this.sessionStorage.set(key, value);
          break;
        
        case 'local':
          await this.localStorage.set(key, value);
          break;
        
        case 'indexed':
          await this.indexedDB.set(key, value);
          // Also store metadata in localStorage
          await this.localStorage.set(`${key}_meta`, {
            size,
            updatedAt: new Date().toISOString(),
            location: 'indexedDB'
          });
          break;
        
        case 'distributed':
          // Large data split across multiple storage
          await this.distributeData(key, value);
          break;
      }

      // Notify listeners
      this.notifyListeners(key, value);
      
      // Sync across tabs
      this.broadcastChange(key, value);

      this.recordMetrics('set', key);

    } catch (error) {
      console.error(`Storage write error for ${key}:`, error);
      this.recordMetrics('set_error', key);
      throw error;
    }
  }

  async delete(key) {
    // Remove from all storage layers
    await Promise.allSettled([
      this.memoryCache.delete(key),
      this.sessionStorage.delete(key),
      this.localStorage.delete(key),
      this.indexedDB.delete(key),
      this.localStorage.delete(`${key}_meta`)
    ]);
    
    this.notifyListeners(key, null);
    this.broadcastChange(key, null);
  }

  // Subscribe to storage changes
  subscribe(key, callback) {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    this.listeners.get(key).add(callback);
    
    // Return unsubscribe function
    return () => {
      const callbacks = this.listeners.get(key);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.listeners.delete(key);
        }
      }
    };
  }

  // Legacy data adapter for backwards compatibility
  async getLegacy(oldKey) {
    const adapter = new LegacyDataAdapter(this);
    return adapter.get(oldKey);
  }

  private determineStorageStrategy(value, options) {
    const size = JSON.stringify(value).length;
    
    if (options.temporary || options.ttl) return 'session';
    if (options.forceLocal) return 'local';
    if (size > 1024 * 1024) return 'indexed'; // > 1MB
    if (size > 100 * 1024) return 'distributed'; // > 100KB
    return 'local';
  }

  private shouldPromoteToLocalStorage(data) {
    const size = JSON.stringify(data).length;
    return size < 50 * 1024; // < 50KB
  }

  private calculateSize(data) {
    return new Blob([JSON.stringify(data)]).size;
  }

  private notifyListeners(key, value) {
    const callbacks = this.listeners.get(key);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(value);
        } catch (error) {
          console.error('Listener error:', error);
        }
      });
    }
  }

  private broadcastChange(key, value) {
    if (window.BroadcastChannel) {
      const channel = new BroadcastChannel('storage_sync');
      channel.postMessage({ key, value });
    }
  }

  private setupStorageSync() {
    if (window.BroadcastChannel) {
      const channel = new BroadcastChannel('storage_sync');
      channel.onmessage = (event) => {
        const { key, value } = event.data;
        // Update local cache
        this.memoryCache.set(key, value);
        // Notify local listeners
        this.notifyListeners(key, value);
      };
    }
  }

  private async warmUpCache() {
    const keysToWarm = ['airprompts_templates', 'airprompts_ui_preferences'];
    await Promise.all(
      keysToWarm.map(key => this.get(key, { skipCache: true }))
    );
  }

  private recordMetrics(action, key) {
    // Send to analytics if configured
    if (window.analytics) {
      window.analytics.track('storage_operation', { action, key });
    }
  }
}

// Singleton instance
export const storageFacade = new StorageFacade();
```

### 5. Adapter Pattern for Legacy Migration

```javascript
// services/storage/LegacyDataAdapter.js
class LegacyDataAdapter {
  constructor(storageFacade) {
    this.storage = storageFacade;
    this.migrationLog = new Map();
  }

  async get(oldKey) {
    // Check if already migrated
    const migrationStatus = this.migrationLog.get(oldKey);
    if (migrationStatus?.completed) {
      return this.storage.get(migrationStatus.newKey);
    }

    // Map old keys to new keys
    const keyMapping = {
      'templates': 'airprompts_templates',
      'workflows': 'airprompts_workflows',
      'snippets': 'airprompts_snippets',
      'ui-prefs': 'airprompts_ui_preferences',
      'user_settings': 'airprompts_user_settings',
      'recent_items': 'airprompts_recent_items'
    };

    const newKey = keyMapping[oldKey] || oldKey;
    
    // Try to get data with new key first
    let data = await this.storage.get(newKey);
    
    // If not found, try old key
    if (!data) {
      data = await this.getFromLegacyStorage(oldKey);
      
      if (data) {
        // Migrate to new format
        const migrated = await this.migrateData(data, oldKey);
        
        // Save with new key
        await this.storage.set(newKey, migrated);
        
        // Log migration
        this.migrationLog.set(oldKey, {
          completed: true,
          newKey,
          migratedAt: new Date().toISOString()
        });
        
        // Clean up old data
        await this.cleanupLegacyData(oldKey);
        
        return migrated;
      }
    }

    return data;
  }

  private async getFromLegacyStorage(key) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      
      return JSON.parse(raw);
    } catch (error) {
      console.error(`Failed to parse legacy data for ${key}:`, error);
      return null;
    }
  }

  private async migrateData(data, type) {
    // Handle different data types
    switch (type) {
      case 'templates':
      case 'workflows':
      case 'snippets':
        return this.migrateEntityData(data);
      
      case 'ui-prefs':
        return this.migrateUIPreferences(data);
      
      case 'user_settings':
        return this.migrateUserSettings(data);
      
      default:
        return data;
    }
  }

  private migrateEntityData(data) {
    if (!Array.isArray(data)) return data;
    
    return data.map(item => ({
      ...item,
      // Transform snake_case to camelCase
      id: item.id || generateId(),
      folderId: item.folder_id || item.folderId,
      folderIds: item.folder_ids || (item.folder_id ? [item.folder_id] : []),
      lastUsed: item.last_used || item.lastUsed || new Date().toISOString(),
      createdAt: item.created_at || item.createdAt || new Date().toISOString(),
      updatedAt: item.updated_at || item.updatedAt || new Date().toISOString(),
      favorite: item.is_favorite || item.favorite || false,
      variables: item.variables || [],
      
      // Clean up old fields
      folder_id: undefined,
      folder_ids: undefined,
      last_used: undefined,
      created_at: undefined,
      updated_at: undefined,
      is_favorite: undefined
    })).filter(item => item.id); // Remove invalid items
  }

  private migrateUIPreferences(data) {
    return {
      viewMode: data.view_mode || data.viewMode || 'grid',
      theme: data.theme || 'system',
      sidebarCollapsed: data.sidebar_collapsed || data.sidebarCollapsed || false,
      recentFolders: data.recent_folders || data.recentFolders || [],
      favoriteFilters: data.favorite_filters || data.favoriteFilters || [],
      ...data
    };
  }

  private migrateUserSettings(data) {
    return {
      displayName: data.display_name || data.displayName || 'User',
      email: data.email || '',
      preferences: {
        notifications: data.notifications_enabled ?? true,
        autoSave: data.auto_save ?? true,
        confirmDelete: data.confirm_delete ?? true,
        ...data.preferences
      },
      ...data
    };
  }

  private async cleanupLegacyData(key) {
    try {
      localStorage.removeItem(key);
      
      // Also remove any related keys
      const relatedKeys = [
        `${key}_backup`,
        `${key}_temp`,
        `${key}_old`
      ];
      
      relatedKeys.forEach(k => localStorage.removeItem(k));
    } catch (error) {
      console.error(`Failed to cleanup legacy data for ${key}:`, error);
    }
  }
}
```

### 6. Strategy Pattern for View Modes

```javascript
// strategies/ViewModeStrategies.js
export const ViewModeStrategies = {
  grid: {
    Component: VirtualizedGrid,
    getItemSize: (viewportWidth) => {
      // Responsive sizing
      if (viewportWidth < 640) return { width: '100%', height: 180 };
      if (viewportWidth < 1024) return { width: '50%', height: 200 };
      return { width: 300, height: 220 };
    },
    getColumns: (viewportWidth) => {
      if (viewportWidth < 640) return 1;
      if (viewportWidth < 1024) return 2;
      if (viewportWidth < 1536) return 3;
      return 4;
    },
    gap: 16,
    virtualization: {
      overscan: 2,
      scrollThreshold: 0.8,
      estimatedItemSize: 220
    },
    itemComponent: ItemCard
  },
  
  list: {
    Component: VirtualizedList,
    getItemSize: () => ({ width: '100%', height: 80 }),
    getColumns: () => 1,
    gap: 8,
    virtualization: {
      overscan: 5,
      scrollThreshold: 0.9,
      estimatedItemSize: 80
    },
    itemComponent: ItemListRow
  },
  
  compact: {
    Component: CompactList,
    getItemSize: () => ({ width: '100%', height: 48 }),
    getColumns: () => 1,
    gap: 4,
    virtualization: {
      overscan: 10,
      scrollThreshold: 0.95,
      estimatedItemSize: 48
    },
    itemComponent: ItemCompactRow
  },
  
  kanban: {
    Component: KanbanBoard,
    getItemSize: () => ({ width: 320, height: 'auto' }),
    getColumns: () => 'auto',
    gap: 16,
    virtualization: null, // Kanban uses different optimization
    itemComponent: KanbanCard,
    groupBy: 'category' // Group by category for kanban
  },
  
  timeline: {
    Component: TimelineView,
    getItemSize: () => ({ width: '100%', height: 'auto' }),
    getColumns: () => 1,
    gap: 24,
    virtualization: {
      overscan: 3,
      scrollThreshold: 0.85,
      estimatedItemSize: 120
    },
    itemComponent: TimelineItem,
    sortBy: 'updatedAt' // Sort by date for timeline
  }
};

// Intelligent View Mode Manager
export const ViewModeManager = memo(({ items, viewMode = 'grid' }) => {
  const [viewportWidth, setViewportWidth] = useState(window.innerWidth);
  const strategy = ViewModeStrategies[viewMode];
  
  // Handle responsive updates
  useEffect(() => {
    const handleResize = debounce(() => {
      setViewportWidth(window.innerWidth);
    }, 300);
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  if (!strategy) {
    console.warn(`Unknown view mode: ${viewMode}, falling back to grid`);
    return <ViewModeManager items={items} viewMode="grid" />;
  }
  
  const { Component, itemComponent: ItemComponent, ...strategyProps } = strategy;
  
  // Apply strategy-specific transformations
  const processedItems = useMemo(() => {
    let result = [...items];
    
    // Apply grouping if specified
    if (strategyProps.groupBy) {
      result = groupBy(result, strategyProps.groupBy);
    }
    
    // Apply sorting if specified
    if (strategyProps.sortBy) {
      result = sortBy(result, strategyProps.sortBy);
    }
    
    return result;
  }, [items, strategyProps.groupBy, strategyProps.sortBy]);
  
  // Calculate responsive properties
  const responsiveProps = {
    ...strategyProps,
    columns: strategyProps.getColumns(viewportWidth),
    itemSize: strategyProps.getItemSize(viewportWidth)
  };
  
  return (
    <Component 
      items={processedItems}
      {...responsiveProps}
      renderItem={({ item, ...props }) => (
        <ItemComponent item={item} viewMode={viewMode} {...props} />
      )}
    />
  );
});
```

### 7. Enhanced Performance Optimizations

```javascript
// hooks/useOptimizedCallbacks.js
export const useOptimizedCallbacks = (item, actions) => {
  const handleExecute = useCallback(() => {
    actions.execute(item, item.type);
  }, [item, actions.execute]);
  
  const handleEdit = useCallback(() => {
    actions.edit(item);
  }, [item, actions.edit]);
  
  const handleDelete = useCallback(() => {
    actions.delete(item.type, item.id);
  }, [item.type, item.id, actions.delete]);
  
  const handleToggleFavorite = useCallback(() => {
    actions.toggleFavorite(item, item.type);
  }, [item, actions.toggleFavorite]);
  
  return {
    handleExecute,
    handleEdit,
    handleDelete,
    handleToggleFavorite
  };
};

// components/items/OptimizedItemRenderer.jsx
export const OptimizedItemRenderer = memo(({ 
  item, 
  viewMode,
  onExecute,
  onEdit,
  onDelete,
  onToggleFavorite 
}) => {
  // Use optimized callbacks
  const callbacks = useOptimizedCallbacks(item, {
    execute: onExecute,
    edit: onEdit,
    delete: onDelete,
    toggleFavorite: onToggleFavorite
  });
  
  // Get appropriate component for view mode
  const ItemComponent = ViewModeStrategies[viewMode]?.itemComponent || ItemCard;
  
  return (
    <ItemComponent
      item={item}
      {...callbacks}
    />
  );
}, (prevProps, nextProps) => {
  // Deep comparison for item changes
  return (
    prevProps.item === nextProps.item &&
    prevProps.viewMode === nextProps.viewMode &&
    prevProps.onExecute === nextProps.onExecute &&
    prevProps.onEdit === nextProps.onEdit &&
    prevProps.onDelete === nextProps.onDelete &&
    prevProps.onToggleFavorite === nextProps.onToggleFavorite
  );
});

// Enhanced virtualization with intersection observer
export const useVirtualization = (items, options = {}) => {
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 50 });
  const containerRef = useRef(null);
  const itemRefs = useRef(new Map());
  
  useEffect(() => {
    if (!containerRef.current) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          const index = parseInt(entry.target.dataset.index);
          
          if (entry.isIntersecting) {
            // Expand visible range
            setVisibleRange(prev => ({
              start: Math.min(prev.start, index - options.overscan),
              end: Math.max(prev.end, index + options.overscan)
            }));
          }
        });
      },
      {
        root: containerRef.current,
        rootMargin: '100px',
        threshold: 0
      }
    );
    
    // Observe sentinel elements
    const sentinels = containerRef.current.querySelectorAll('[data-sentinel]');
    sentinels.forEach(el => observer.observe(el));
    
    return () => observer.disconnect();
  }, [items.length, options.overscan]);
  
  const visibleItems = useMemo(() => 
    items.slice(
      Math.max(0, visibleRange.start),
      Math.min(items.length, visibleRange.end)
    ),
    [items, visibleRange]
  );
  
  return {
    containerRef,
    visibleItems,
    totalHeight: items.length * (options.estimatedItemSize || 100)
  };
};
```

## 📅 Enhanced Implementation Roadmap

### Sprint 0: Foundation & Setup (Week 1)
- [x] Create feature flags system
- [x] Setup error monitoring (Sentry)
- [x] Configure performance monitoring
- [x] Document API contracts
- [ ] Setup testing infrastructure

#### Deliverables:
- Feature flag system operational
- Monitoring dashboards configured
- Test suite foundation ready

### Sprint 1: Core Patterns (Week 2-3)
- [ ] Implement Error Boundaries for all features
- [ ] Create Storage Facade with adapters
- [ ] Setup Legacy Data Adapter
- [ ] Implement useCallback in all contexts
- [ ] Create base component library

#### Deliverables:
- Error handling system complete
- Storage abstraction layer ready
- All contexts optimized with useCallback

### Sprint 2: State & Performance (Week 4-5)
- [ ] Refactor all editors to BaseEditor
- [ ] Implement View Mode Strategies
- [ ] Setup advanced virtualization
- [ ] Optimize bundle with code splitting
- [ ] Achieve 50% test coverage

#### Deliverables:
- Unified editor system
- Flexible view modes implemented
- Performance targets met

### Sprint 3: Migration & Testing (Week 6-7)
- [ ] Complete legacy data migration
- [ ] Implement E2E tests for critical paths
- [ ] Achieve 90% test coverage
- [ ] Performance profiling & optimization
- [ ] Security audit

#### Deliverables:
- All data migrated successfully
- Comprehensive test suite
- Security vulnerabilities addressed

### Sprint 4: Polish & Rollout (Week 8-9)
- [ ] UI/UX polish with new patterns
- [ ] Accessibility audit & fixes
- [ ] Documentation update
- [ ] Gradual feature flag rollout
- [ ] Production deployment

#### Deliverables:
- Production-ready application
- Complete documentation
- Successful deployment

## 🎯 Success Metrics Enhanced

### Technical Metrics
- **Test Coverage**: 0% → 90% (+10% from original)
- **Bundle Size**: 800KB → 320KB (-60%)
- **Initial Load**: >3s → <1s (-67%)
- **Lighthouse Score**: 65 → 98+ (+33)
- **Error Rate**: Unknown → <0.1%

### Performance Metrics
- **Time to Interactive**: <1.5s
- **First Contentful Paint**: <0.8s
- **Cumulative Layout Shift**: <0.05
- **Memory Usage**: -40%
- **CPU Usage**: -30%

### Developer Experience
- **Feature Development Time**: -60%
- **Bug Resolution Time**: -50%
- **Code Review Time**: -40%
- **Onboarding Time**: -70%

## ⚠️ Enhanced Risk Management

### 1. Migration Complexity
**Risk**: Legacy data migration fails
**Mitigation**: 
- Comprehensive backup system
- Gradual migration with rollback
- Dual-read period (read both old and new)
- Automated migration testing

### 2. Performance Regression
**Risk**: New patterns introduce slowdowns
**Mitigation**:
- Continuous performance monitoring
- A/B testing with metrics
- Rollback capability per feature
- Performance budgets enforced

### 3. Browser Compatibility
**Risk**: Modern features break older browsers
**Mitigation**:
- Progressive enhancement
- Polyfills for critical features
- Graceful degradation
- Clear browser support matrix

## 💰 Updated Budget

### Development Resources
- **Lead Developer**: 1 FTE (9 weeks) - €45,000
- **Senior Developers**: 2 FTE (8 weeks) - €64,000
- **QA Engineer**: 1 FTE (6 weeks) - €24,000
- **DevOps Engineer**: 0.5 FTE (4 weeks) - €10,000

### Infrastructure & Tools
- **Monitoring (Sentry, Datadog)**: €2,000
- **Testing Infrastructure**: €1,500
- **CI/CD Enhancement**: €1,000

### Total Investment
- **Subtotal**: €147,500
- **Contingency (15%)**: €22,125
- **Grand Total**: €169,625

### ROI Projection
- **Development Speed**: 3x improvement = €200k+ annual savings
- **Reduced Bugs**: 60% reduction = €50k+ support savings
- **Performance**: Better user retention = €100k+ revenue impact
- **Payback Period**: <6 months

## 🚀 Immediate Quick Wins v2.0

1. **Implement useCallback in ActionsContext** (2 uur)
2. **Add Error Boundary to ItemExecutor** (3 uur)
3. **Create Storage Facade skeleton** (4 uur)
4. **Setup Legacy Adapter for templates** (3 uur)
5. **Implement basic View Mode Strategy** (4 uur)

Total: 16 uur = 2 dagen werk voor immediate improvements

## 📝 Conclusie

Dit enhanced refactoring plan integreert alle best practices en moderne patterns voor een state-of-the-art React applicatie. De toevoegingen zorgen voor:

- **Betere Performance**: useCallback optimalisaties en geavanceerde virtualisatie
- **Robuuste Error Handling**: Complete error boundary implementatie
- **Flexibele Architecture**: Design patterns correct toegepast
- **Smooth Migration**: Legacy adapter pattern voor zero-downtime migration
- **Future-Proof**: Klaar voor React 19 en Server Components

Met deze verbeteringen wordt AirPrompts een showcase van moderne React development practices.

---

*Dit document vervangt het originele refactoring plan en integreert alle geïdentificeerde verbeterpunten uit de best practices analyse.*