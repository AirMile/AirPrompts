# ADR 005: Performance Strategy

## Status
Accepted

## Context
AirPrompts needs to maintain excellent performance as it scales:
- Handle 1000+ templates and workflows
- Support complex folder hierarchies
- Provide instant search and filtering
- Maintain smooth UI interactions
- Work well on modest hardware

Current performance considerations:
- All data loads into memory at startup
- No pagination or virtualization
- Full re-renders on state changes
- Large DOM trees with nested folders

## Decision
Implement a multi-layered performance strategy:

### 1. Data Layer Optimization
- **Virtual scrolling** for long lists (react-window)
- **Lazy loading** for folder contents
- **Memoization** of expensive computations
- **Debounced search** (300ms delay)

### 2. React Optimization
```javascript
// Strategic use of optimization hooks
- useMemo for filtered/sorted lists
- useCallback for event handlers
- React.memo for pure components
- useTransition for non-urgent updates
```

### 3. State Management
- **Normalized data structure** for folders/items
- **Selective updates** using immutable patterns
- **Local state** for UI-only concerns
- **Batch updates** where possible

### 4. Asset Optimization
- **Code splitting** by route
- **Lazy imports** for heavy components
- **Image optimization** (if added)
- **Tree shaking** via Vite

## Implementation Priorities

### Phase 1: Quick Wins (Immediate)
1. Add React.memo to list items
2. Implement search debouncing
3. Memoize filtered results
4. Add loading states

### Phase 2: Virtualization (When >100 items)
1. Implement react-window for item lists
2. Virtual scrolling for folder tree
3. Intersection Observer for lazy loading

### Phase 3: Data Structure (When >500 items)
1. Normalize state shape
2. Index items by ID
3. Implement shallow equality checks
4. Add request caching

## Performance Metrics
### Target Metrics
- First Contentful Paint: <1.5s
- Time to Interactive: <3s
- Search response: <100ms
- Scroll performance: 60fps

### Monitoring
```javascript
// Performance observer
const observer = new PerformanceObserver((list) => {
  list.getEntries().forEach((entry) => {
    console.log(`${entry.name}: ${entry.duration}ms`);
  });
});
```

## Code Examples

### Memoized Filtering
```javascript
const filteredItems = useMemo(() => {
  if (!searchTerm) return items;
  
  return items.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.description.toLowerCase().includes(searchTerm.toLowerCase())
  );
}, [items, searchTerm]);
```

### Virtual List Implementation
```javascript
import { FixedSizeList } from 'react-window';

<FixedSizeList
  height={600}
  itemCount={items.length}
  itemSize={80}
  width="100%"
>
  {({ index, style }) => (
    <div style={style}>
      <ItemCard item={items[index]} />
    </div>
  )}
</FixedSizeList>
```

## Alternatives Considered
1. **Pagination**: Breaks user flow, harder to search across pages
2. **Server-side rendering**: Overkill for desktop app
3. **Web Workers**: Complex for current needs
4. **IndexedDB**: Unnecessary given data size

## Consequences
### Positive
- Smooth performance at scale
- Better user experience
- Lower memory footprint
- Predictable performance

### Negative
- Added complexity
- More code to maintain
- Potential bugs with virtualization
- Learning curve for optimization APIs

## Best Practices
### Do's
- Profile before optimizing
- Measure impact of changes
- Optimize critical paths first
- Use React DevTools Profiler

### Don'ts
- Premature optimization
- Over-memoization
- Ignoring React warnings
- Optimizing without metrics

## Debugging Performance
```javascript
// React Profiler wrapper
<Profiler id="ItemList" onRender={onRenderCallback}>
  <ItemList items={items} />
</Profiler>

// Performance mark
performance.mark('search-start');
// ... search logic
performance.mark('search-end');
performance.measure('search', 'search-start', 'search-end');
```

## Future Considerations
1. **Service Worker**: Offline support and caching
2. **WebAssembly**: For heavy computations
3. **Concurrent Features**: React 18+ features
4. **Progressive Enhancement**: Start simple, enhance as needed