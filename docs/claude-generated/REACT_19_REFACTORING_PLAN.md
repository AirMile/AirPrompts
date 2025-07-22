# React 19 Refactoring Plan voor AirPrompts

## Executive Summary

Dit document beschrijft een gefaseerd plan om de AirPrompts React codebase te moderniseren naar React 19. De focus ligt op het verbeteren van performance, foutafhandeling, en het adopteren van moderne React patterns terwijl de functionaliteit behouden blijft.

## Huidige Situatie Analyse

### Sterke Punten ✅
- Gebruikt al React 18 hooks (useState, useEffect, useCallback, useMemo)
- Custom hooks voor domein logica
- Lazy loading geïmplementeerd
- Moderne state management (Zustand + TanStack Query)
- Error boundaries aanwezig

### Te Moderniseren Punten 🔧
1. **Class Component ErrorBoundary** - Nog steeds class-based
2. **Prop Drilling** - Homepage (20+ props), ItemExecutor (complex prop passing)
3. **Performance Issues** - Geen React.memo, veel re-renders
4. **Component Complexiteit** - Homepage (1463 regels), ItemExecutor (1861 regels)
5. **Ontbrekende Error Handling** - Alleen top-level error boundary

## Gefaseerd Implementatie Plan

### Fase 1: Voorbereiding & Tooling (Week 1)
**Doel:** Upgrade dependencies en setup tooling

#### Taken:
1. **Upgrade React naar versie 19**
   ```bash
   npm install --save-exact react@^19.0.0 react-dom@^19.0.0
   ```

2. **Run Migration Codemods**
   ```bash
   npx codemod@latest react/19/migration-recipe
   npx types-react-codemod@latest preset-19 ./src
   ```

3. **Update Error Boundary naar Modern Pattern**
   - Gebruik `react-error-boundary` package
   - Implementeer nieuwe error callback options

4. **Setup Performance Monitoring**
   - Installeer React DevTools Profiler
   - Identificeer slow renders

### Fase 2: Error Handling Modernisering (Week 1-2)
**Doel:** Robuuste foutafhandeling met React 19 patterns

#### Implementatie:

**1. Modern Error Boundary Component**
```jsx
// src/components/shared/ErrorBoundary.jsx
import { ErrorBoundary } from 'react-error-boundary';

function ErrorFallback({ error, resetErrorBoundary }) {
  return (
    <div className="error-fallback">
      <h2>Er ging iets mis</h2>
      <pre>{error.message}</pre>
      <button onClick={resetErrorBoundary}>Probeer opnieuw</button>
    </div>
  );
}

export function AppErrorBoundary({ children }) {
  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onReset={() => window.location.href = '/'}
    >
      {children}
    </ErrorBoundary>
  );
}
```

**2. Component-Level Error Boundaries**
```jsx
// Wrap complexe componenten
<ErrorBoundary fallback={<TemplateErrorFallback />}>
  <TemplateEditor />
</ErrorBoundary>
```

**3. React 19 Root Error Callbacks**
```jsx
// src/main.jsx
const root = createRoot(document.getElementById('root'), {
  onCaughtError: (error, errorInfo) => {
    console.error('Caught by Error Boundary:', error, errorInfo);
    // Stuur naar error tracking service
  },
  onUncaughtError: (error, errorInfo) => {
    console.error('Uncaught Error:', error, errorInfo);
    // Critical error handling
  }
});
```

### Fase 3: Component Refactoring (Week 2-3)
**Doel:** Splits complexe componenten en reduceer prop drilling

#### 1. Homepage Refactoring

**Van:** Monolithische component (1463 regels)
**Naar:** Gecomposeerde structuur

```jsx
// src/components/dashboard/Homepage.jsx
export function Homepage() {
  return (
    <DashboardProvider>
      <DashboardLayout>
        <SearchSection />
        <FilterSection />
        <ContentArea />
      </DashboardLayout>
    </DashboardProvider>
  );
}

// src/components/dashboard/DashboardProvider.jsx
const DashboardContext = createContext();

export function DashboardProvider({ children }) {
  const [filters, setFilters] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  
  // Centraliseer state management
  const value = {
    filters,
    setFilters,
    searchQuery,
    setSearchQuery
  };
  
  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
}

// Custom hook voor context access
export function useDashboard() {
  return use(DashboardContext); // React 19 use() hook
}
```

#### 2. ItemExecutor Refactoring

**Splits in kleinere componenten:**

```jsx
// src/components/features/execution/ItemExecutor.jsx
export function ItemExecutor({ item, onComplete }) {
  return (
    <ExecutionProvider item={item}>
      <ExecutionHeader />
      <ExecutionSteps />
      <VariableManager />
      <ExecutionControls onComplete={onComplete} />
    </ExecutionProvider>
  );
}

// src/components/features/execution/ExecutionSteps.jsx
function ExecutionSteps() {
  const { steps, currentStep } = useExecution();
  const [isPending, startTransition] = useTransition();
  
  const handleStepChange = (newStep) => {
    startTransition(() => {
      // Non-blocking update voor smooth UI
      setCurrentStep(newStep);
    });
  };
  
  return (
    <div className="execution-steps">
      {steps.map((step, index) => (
        <StepRenderer 
          key={step.id}
          step={step}
          isActive={index === currentStep}
          isPending={isPending}
        />
      ))}
    </div>
  );
}
```

### Fase 4: Performance Optimalisaties (Week 3)
**Doel:** Implementeer React 19 performance features

#### 1. React.memo voor List Items

```jsx
// src/components/common/TemplateCard.jsx
export const TemplateCard = React.memo(({ template, onClick }) => {
  return (
    <div className="template-card" onClick={() => onClick(template.id)}>
      <h3>{template.name}</h3>
      <p>{template.description}</p>
    </div>
  );
}, (prevProps, nextProps) => {
  // Alleen re-render als template data verandert
  return prevProps.template.id === nextProps.template.id &&
         prevProps.template.name === nextProps.template.name;
});
```

#### 2. useTransition voor Zware Updates

```jsx
// src/components/dashboard/SearchSection.jsx
function SearchSection() {
  const [query, setQuery] = useState('');
  const [isPending, startTransition] = useTransition();
  const { setSearchQuery } = useDashboard();
  
  const handleSearch = (e) => {
    const value = e.target.value;
    setQuery(value); // Direct update voor input
    
    // Non-blocking update voor filtering
    startTransition(() => {
      setSearchQuery(value);
    });
  };
  
  return (
    <div className="search-section">
      <input 
        value={query}
        onChange={handleSearch}
        placeholder="Zoeken..."
      />
      {isPending && <span className="loader">Zoeken...</span>}
    </div>
  );
}
```

#### 3. useDeferredValue voor Expensive Renders

```jsx
// src/components/dashboard/ContentArea.jsx
function ContentArea() {
  const { searchQuery, filters } = useDashboard();
  const deferredQuery = useDeferredValue(searchQuery);
  
  const filteredItems = useMemo(() => {
    // Expensive filtering operation
    return filterItems(items, deferredQuery, filters);
  }, [items, deferredQuery, filters]);
  
  return (
    <div className="content-area">
      {filteredItems.map(item => (
        <TemplateCard key={item.id} template={item} />
      ))}
    </div>
  );
}
```

### Fase 5: React 19 Nieuwe Features (Week 4)
**Doel:** Adopteer nieuwe React 19 APIs

#### 1. use() Hook voor Async Data

```jsx
// src/hooks/useTemplateData.js
export function useTemplateData(templateId) {
  const queryClient = useQueryClient();
  
  // React 19 use() met promise
  const template = use(
    queryClient.ensureQueryData({
      queryKey: ['template', templateId],
      queryFn: () => fetchTemplate(templateId)
    })
  );
  
  return template;
}
```

#### 2. Form Actions met useActionState

```jsx
// src/components/templates/TemplateForm.jsx
function TemplateForm({ onSave }) {
  const [error, submitAction, isPending] = useActionState(
    async (previousState, formData) => {
      try {
        const template = {
          name: formData.get('name'),
          content: formData.get('content'),
          category: formData.get('category')
        };
        
        await saveTemplate(template);
        onSave(template);
        return null;
      } catch (err) {
        return err.message;
      }
    },
    null
  );
  
  return (
    <form action={submitAction}>
      <input name="name" required />
      <textarea name="content" required />
      <select name="category">
        {/* opties */}
      </select>
      <button type="submit" disabled={isPending}>
        {isPending ? 'Opslaan...' : 'Opslaan'}
      </button>
      {error && <p className="error">{error}</p>}
    </form>
  );
}
```

### Fase 6: Testing & Rollout (Week 4-5)
**Doel:** Zorg voor stabiele release

#### Testing Checklist:
- [ ] Unit tests voor nieuwe hooks
- [ ] Integration tests voor refactored components
- [ ] Performance benchmarks
- [ ] Error boundary testing
- [ ] Browser compatibility checks

#### Rollout Strategie:
1. Feature flags voor geleidelijke uitrol
2. A/B testing voor performance vergelijking
3. Monitoring setup voor errors en performance

## Belangrijke Aandachtspunten

### Breaking Changes
- String refs zijn verwijderd (niet gebruikt in codebase ✅)
- PropTypes zijn deprecated (al TypeScript ✅)
- Legacy context is verwijderd (niet gebruikt ✅)

### Performance Wins
- Betere re-render optimalisatie met useTransition
- Smooth UI updates tijdens zware operaties
- Minder prop drilling = minder onnodige renders

### Developer Experience
- Eenvoudiger te begrijpen component structuur
- Betere error messages met nieuwe error boundaries
- Moderne patterns voor nieuwe developers

## Implementatie Volgorde

1. **Week 1:** Dependencies upgrade + Error Boundaries
2. **Week 2:** Homepage refactoring
3. **Week 3:** ItemExecutor refactoring + Performance
4. **Week 4:** React 19 features + Testing
5. **Week 5:** Final testing + Rollout

## Success Metrics

- **Performance:** 30% snellere render times voor lijsten
- **Code Quality:** Component files < 300 regels
- **Error Handling:** 100% component coverage met error boundaries
- **Developer Velocity:** 50% minder tijd voor nieuwe features

## Risico's en Mitigaties

| Risico | Impact | Mitigatie |
|--------|--------|-----------|
| Breaking changes | Hoog | Uitgebreide testing + feature flags |
| Performance regressies | Medium | Benchmarking voor/na |
| Team onbekendheid | Laag | Training sessies + documentatie |

## Conclusie

Deze modernisering zal resulteren in een meer maintainable, performante en developer-friendly codebase die klaar is voor de toekomst met React 19. De gefaseerde aanpak minimaliseert risico's terwijl we direct waarde leveren met elke fase.