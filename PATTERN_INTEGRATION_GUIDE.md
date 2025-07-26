# Pattern Integration Guide

This guide explains how to integrate the newly implemented design patterns into the AirPrompts application.

## 🎯 Overview

We've implemented four major design patterns that form the foundation for a scalable, maintainable application:

1. **Error Boundaries** - Graceful error handling
2. **Storage Facade** - Unified storage interface
3. **Legacy Data Adapter** - Smooth migration from old formats
4. **Base Component Library** - Reusable UI components

## 🚀 Quick Start

### 1. Error Boundaries

Wrap your components with appropriate error boundaries:

```jsx
import { ErrorBoundary, EditorErrorBoundary, ExecutorErrorBoundary } from '@/components/errors';

// General error boundary
<ErrorBoundary>
  <YourComponent />
</ErrorBoundary>

// Editor-specific boundary
<EditorErrorBoundary>
  <TemplateEditor />
</EditorErrorBoundary>

// Executor-specific boundary
<ExecutorErrorBoundary>
  <ItemExecutor />
</ExecutorErrorBoundary>
```

### 2. Storage Facade

Replace direct localStorage calls with the storage facade:

```jsx
import { storageFacade } from '@/services/storage';

// Before (old way)
localStorage.setItem('templates', JSON.stringify(templates));
const templates = JSON.parse(localStorage.getItem('templates') || '[]');

// After (new way)
await storageFacade.set('templates', templates);
const templates = await storageFacade.get('templates', { defaultValue: [] });

// Subscribe to changes
const unsubscribe = storageFacade.subscribe('templates', (newTemplates) => {
  console.log('Templates updated:', newTemplates);
});
```

### 3. Legacy Data Migration

Run migration on app startup:

```jsx
import { legacyDataAdapter } from '@/services/storage';

// In your app initialization
const migrationStatus = await legacyDataAdapter.checkMigrationStatus();
if (migrationStatus.needed) {
  const results = await legacyDataAdapter.migrateAll();
  console.log('Migration completed:', results);
}
```

### 4. Base Components

Use base components for consistent UI:

```jsx
import { BaseEditor, BaseCard } from '@/components/base';

// Editor
<BaseEditor
  entity={template}
  entityType="template"
  schema={validationSchema}
  onSave={handleSave}
  onCancel={handleCancel}
/>

// Card
<BaseCard
  item={template}
  entityType="template"
  onExecute={handleExecute}
  onEdit={handleEdit}
  onDelete={handleDelete}
  onToggleFavorite={handleToggleFavorite}
/>
```

## 📋 Migration Checklist

### Phase 1: Error Boundaries (Low Risk)
- [ ] Wrap PromptTemplateSystem with main ErrorBoundary
- [ ] Add EditorErrorBoundary to all editor components
- [ ] Add ExecutorErrorBoundary to ItemExecutor
- [ ] Test error scenarios in development

### Phase 2: Storage Migration (Medium Risk)
- [ ] Replace localStorage calls in hooks with storageFacade
- [ ] Add migration check to app startup
- [ ] Test with existing user data
- [ ] Add fallback for storage failures

### Phase 3: Base Components (Medium Risk)
- [ ] Refactor TemplateEditor to use BaseEditor
- [ ] Refactor WorkflowEditor to use BaseEditor
- [ ] Replace item cards with BaseCard
- [ ] Update styling to match new components

### Phase 4: Performance Optimization
- [ ] Add virtualization to large lists
- [ ] Implement lazy loading for routes
- [ ] Add memoization to expensive renders
- [ ] Profile and optimize bundle size

## 🔧 Implementation Examples

### Refactoring an Editor

Before:
```jsx
const TemplateEditor = ({ template, onSave, onCancel }) => {
  const [formData, setFormData] = useState(template || {});
  const [errors, setErrors] = useState({});
  
  // Manual form handling...
  
  return (
    <div className="editor">
      {/* Custom form implementation */}
    </div>
  );
};
```

After:
```jsx
const TemplateEditor = ({ template, onSave, onCancel }) => {
  const schema = {
    fields: {
      name: { type: 'text', label: 'Name', required: true },
      content: { type: 'textarea', label: 'Content', required: true }
    }
  };
  
  return (
    <BaseEditor
      entity={template}
      entityType="template"
      schema={schema}
      onSave={onSave}
      onCancel={onCancel}
    />
  );
};
```

### Refactoring Storage Usage

Before:
```jsx
const useTemplates = () => {
  const [templates, setTemplates] = useState([]);
  
  useEffect(() => {
    const stored = localStorage.getItem('templates');
    if (stored) {
      setTemplates(JSON.parse(stored));
    }
  }, []);
  
  const saveTemplates = (newTemplates) => {
    localStorage.setItem('templates', JSON.stringify(newTemplates));
    setTemplates(newTemplates);
  };
  
  return { templates, saveTemplates };
};
```

After:
```jsx
const useTemplates = () => {
  const [templates, setTemplates] = useState([]);
  
  useEffect(() => {
    // Load templates
    storageFacade.get('templates', { defaultValue: [] })
      .then(setTemplates);
    
    // Subscribe to changes
    const unsubscribe = storageFacade.subscribe('templates', setTemplates);
    return unsubscribe;
  }, []);
  
  const saveTemplates = async (newTemplates) => {
    await storageFacade.set('templates', newTemplates);
    // State updated automatically via subscription
  };
  
  return { templates, saveTemplates };
};
```

## 🧪 Testing

### Error Boundary Testing
```jsx
// Force an error in development
if (process.env.NODE_ENV === 'development' && window.testError) {
  throw new Error('Test error boundary');
}
```

### Storage Testing
```jsx
// Test storage operations
const testStorage = async () => {
  // Test set/get
  await storageFacade.set('test', { value: 123 });
  const result = await storageFacade.get('test');
  console.log('Storage test:', result);
  
  // Test metrics
  console.log('Storage metrics:', storageFacade.getMetrics());
  
  // Test storage info
  console.log('Storage info:', await storageFacade.getStorageInfo());
};
```

## 🚨 Common Pitfalls

1. **Forgetting to await storage operations**
   ```jsx
   // Wrong
   storageFacade.set('key', value);
   
   // Correct
   await storageFacade.set('key', value);
   ```

2. **Not handling storage errors**
   ```jsx
   try {
     await storageFacade.set('key', largeData);
   } catch (error) {
     if (error.message.includes('quota exceeded')) {
       // Handle storage full
     }
   }
   ```

3. **Not unsubscribing from storage events**
   ```jsx
   useEffect(() => {
     const unsubscribe = storageFacade.subscribe('key', callback);
     return unsubscribe; // Don't forget this!
   }, []);
   ```

## 🎯 Next Steps

1. Start with error boundaries (lowest risk)
2. Test storage facade with non-critical data
3. Gradually migrate editors to BaseEditor
4. Replace cards with BaseCard
5. Run full migration in staging environment

## 📊 Success Metrics

- Zero white screens from errors
- 50% reduction in storage-related bugs
- 60% less code in editor components
- Consistent UI across all entity types
- Smooth migration for existing users

## 🆘 Support

If you encounter issues:
1. Check browser console for errors
2. Review storage metrics: `storageFacade.getMetrics()`
3. Check migration status: `legacyDataAdapter.checkMigrationStatus()`
4. Enable debug mode: `localStorage.setItem('debug', 'true')`

Remember: These patterns are designed to work together. Start small, test thoroughly, and gradually expand usage across the application.