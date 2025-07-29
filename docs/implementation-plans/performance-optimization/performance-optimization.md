# Performance Optimalisatie Plan - AirPrompts

## Samenvatting

Dit document bevat een gedetailleerde analyse van performance bottlenecks in AirPrompts en een concreet actieplan voor optimalisatie. De analyse richt zich op bundle size, React render performance, data fetching, code splitting en caching strategieën.

## 1. Bundle Size Analyse

### Huidige Situatie

#### Belangrijkste Dependencies (Production)

- **React 19.1.0** - Core framework
- **@dnd-kit suite** (~150KB) - Drag & drop functionaliteit
- **@tanstack/react-query** (~40KB) - Data fetching en caching
- **@uiw/react-md-editor** (~200KB) - Markdown editor
- **lucide-react** (~100KB) - Icon library
- **react-window** (~30KB) - Virtualization
- **zustand** (~15KB) - State management
- **Multiple markdown processors** (~100KB) - remark-gfm, react-markdown, etc.

#### Geschatte Bundle Size

- Totale dependencies: ~2MB uncompressed
- Met tree-shaking en minification: ~600-800KB

### Aanbevelingen

1. **Icon Library Optimalisatie**

   ```javascript
   // Slecht: importeert hele library
   import { Plus, Edit, Trash } from 'lucide-react';

   // Goed: importeer specifieke icons
   import Plus from 'lucide-react/dist/esm/icons/plus';
   import Edit from 'lucide-react/dist/esm/icons/edit';
   ```

2. **Markdown Editor Lazy Loading**

   ```javascript
   const MarkdownEditor = lazy(() =>
     import('@uiw/react-md-editor').then((module) => ({
       default: module.default,
     }))
   );
   ```

3. **Verwijder Onnodige Dependencies**
   - axios (gebruik native fetch)
   - date-fns (gebruik native Intl.DateTimeFormat)
   - @heroicons/react (gebruik alleen lucide-react)

## 2. React Render Optimalisaties

### Geïdentificeerde Problemen

1. **Homepage Component Re-renders**
   - 665 useState/useEffect/useMemo calls in de codebase
   - Homepage heeft 33+ hooks
   - Veel afhankelijkheden tussen componenten

2. **Ontbrekende Memoization**
   - Geen React.memo op veel componenten
   - useCallback/useMemo onderbenut
   - Props drilling causing cascade re-renders

### Oplossingen

1. **Component Memoization**

   ```javascript
   // Wrap heavy components
   export default memo(CollapsibleFolderTree, (prevProps, nextProps) => {
     return (
       prevProps.folders === nextProps.folders &&
       prevProps.selectedFolderId === nextProps.selectedFolderId
     );
   });
   ```

2. **Optimaliseer Homepage**

   ```javascript
   // Split Homepage into smaller components
   const TemplateSection = memo(({ templates, ...props }) => {
     // Template rendering logic
   });

   const WorkflowSection = memo(({ workflows, ...props }) => {
     // Workflow rendering logic
   });
   ```

3. **useCallback voor Event Handlers**
   ```javascript
   const handleUpdateFolder = useCallback(
     async (folderId, data) => {
       // Implementation
     },
     [updateFolder]
   );
   ```

## 3. Data Fetching Strategieën

### Huidige Implementatie

- React Query met global prefetching
- Alles wordt bij startup geladen
- Geen pagination of lazy loading van data

### Verbeteringen

1. **Implementeer Pagination**

   ```javascript
   const { data, fetchNextPage, hasNextPage } = useInfiniteQuery({
     queryKey: ['templates', filters],
     queryFn: ({ pageParam = 0 }) => fetchTemplates({ offset: pageParam, limit: 50, ...filters }),
     getNextPageParam: (lastPage) => lastPage.nextOffset,
   });
   ```

2. **Query Invalidation Strategie**

   ```javascript
   // Invalideer alleen relevante queries
   queryClient.invalidateQueries({
     queryKey: ['templates'],
     exact: false,
     predicate: (query) =>
       query.queryKey[0] === 'templates' && query.queryKey[1]?.folderId === updatedFolderId,
   });
   ```

3. **Optimistic Updates**
   ```javascript
   const updateTemplate = useMutation({
     mutationFn: updateTemplateAPI,
     onMutate: async (newTemplate) => {
       await queryClient.cancelQueries(['templates']);
       const previousTemplates = queryClient.getQueryData(['templates']);
       queryClient.setQueryData(['templates'], (old) =>
         old.map((t) => (t.id === newTemplate.id ? newTemplate : t))
       );
       return { previousTemplates };
     },
     onError: (err, newTemplate, context) => {
       queryClient.setQueryData(['templates'], context.previousTemplates);
     },
   });
   ```

## 4. Code Splitting Plan

### Fase 1: Route-based Splitting

```javascript
// Main app routes
const TemplateEditor = lazy(() => import('./templates/TemplateEditor'));
const WorkflowEditor = lazy(() => import('./workflows/WorkflowEditor'));
const ItemExecutor = lazy(() => import('./features/execution/ItemExecutor'));
const SnippetEditor = lazy(() => import('./snippets/SnippetEditor'));
```

### Fase 2: Feature-based Splitting

```javascript
// Heavy features
const MarkdownEditor = lazy(() => import('./common/MarkdownEditor'));
const DragDropContext = lazy(() => import('./contexts/DragDropContext'));
const AdvancedSearch = lazy(() => import('./search/AdvancedSearch'));
const MigrationWizard = lazy(() => import('./migration/MigrationWizard'));
```

### Fase 3: Vendor Splitting (Vite Config)

```javascript
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'ui-vendor': ['@dnd-kit/core', '@dnd-kit/sortable', 'lucide-react'],
          'markdown-vendor': ['@uiw/react-md-editor', 'react-markdown', 'remark-gfm'],
          'query-vendor': ['@tanstack/react-query', 'zustand'],
        },
      },
    },
  },
});
```

## 5. Caching Strategieën

### Browser Caching

```javascript
// Service Worker voor offline support
self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      caches.match(event.request).then(
        (response) =>
          response ||
          fetch(event.request).then((response) => {
            const responseClone = response.clone();
            caches.open('api-cache-v1').then((cache) => {
              cache.put(event.request, responseClone);
            });
            return response;
          })
      )
    );
  }
});
```

### React Query Caching

```javascript
// Enhanced query client config
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10 * 60 * 1000, // 10 minuten
      cacheTime: 30 * 60 * 1000, // 30 minuten
      refetchOnWindowFocus: false,
      refetchOnReconnect: 'always',
    },
  },
});
```

### LocalStorage Optimization

```javascript
// Implement compression for localStorage
const compressedStorage = {
  setItem: (key, value) => {
    const compressed = LZString.compress(JSON.stringify(value));
    localStorage.setItem(key, compressed);
  },
  getItem: (key) => {
    const compressed = localStorage.getItem(key);
    return compressed ? JSON.parse(LZString.decompress(compressed)) : null;
  },
};
```

## 6. Performance Monitoring

### Implementeer Performance Observer

```javascript
const perfObserver = new PerformanceObserver((entryList) => {
  for (const entry of entryList.getEntries()) {
    if (entry.entryType === 'largest-contentful-paint') {
      console.log('LCP:', entry.startTime);
      // Send to analytics
    }
  }
});
perfObserver.observe({ entryTypes: ['largest-contentful-paint'] });
```

### React DevTools Profiler Integration

```javascript
import { Profiler } from 'react';

function onRenderCallback(id, phase, actualDuration) {
  if (actualDuration > 16) {
    // Meer dan 1 frame
    console.warn(`Slow render in ${id}: ${actualDuration}ms`);
  }
}

<Profiler id="Homepage" onRender={onRenderCallback}>
  <Homepage {...props} />
</Profiler>;
```

## 7. Implementatie Roadmap

### Week 1-2: Quick Wins

- [ ] Implementeer React.memo op top 10 zwaarste componenten
- [ ] Voeg lazy loading toe voor editors
- [ ] Optimaliseer icon imports
- [ ] Verwijder onnodige dependencies

### Week 3-4: Data Layer

- [ ] Implementeer pagination voor templates/workflows
- [ ] Optimaliseer React Query configuratie
- [ ] Voeg optimistic updates toe
- [ ] Implementeer query invalidation strategie

### Week 5-6: Code Splitting

- [ ] Route-based splitting implementeren
- [ ] Vendor chunk splitting configureren
- [ ] Feature-based splitting voor zware componenten
- [ ] Bundle analyzer integreren

### Week 7-8: Monitoring & Tuning

- [ ] Performance monitoring opzetten
- [ ] Service Worker implementeren
- [ ] A/B testing voor performance verbeteringen
- [ ] Documentation en best practices

## 8. Meetbare Doelen

### Core Web Vitals Targets

- **LCP (Largest Contentful Paint)**: < 2.5s
- **FID (First Input Delay)**: < 100ms
- **CLS (Cumulative Layout Shift)**: < 0.1
- **Bundle Size**: < 500KB initial load

### Application Metrics

- **Time to Interactive**: < 3s
- **Re-render frequentie**: -50% op Homepage
- **Memory usage**: -30% reduction
- **API calls**: -40% door betere caching

## 9. Testing Strategie

### Performance Testing Tools

1. **Lighthouse CI** - Automated performance testing
2. **Bundle Analyzer** - Bundle size monitoring
3. **React DevTools Profiler** - Component performance
4. **Chrome DevTools** - Runtime performance

### Benchmarks

```javascript
// Performance benchmark suite
describe('Performance Tests', () => {
  it('should render Homepage in < 100ms', async () => {
    const start = performance.now();
    render(<Homepage {...mockProps} />);
    const end = performance.now();
    expect(end - start).toBeLessThan(100);
  });
});
```

## 10. Conclusie

Deze optimalisaties zullen resulteren in:

- **50-70% kleinere initial bundle size**
- **2-3x snellere initial load time**
- **Betere perceived performance** door lazy loading
- **Lagere memory footprint** door virtualization
- **Betere offline support** door caching

De implementatie moet gefaseerd gebeuren met continue monitoring om regressies te voorkomen.
