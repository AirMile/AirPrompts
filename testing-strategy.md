# Testing Strategy voor AirPrompts

## Executive Summary

De AirPrompts codebase heeft momenteel **geen gestructureerde test coverage**. Er zijn geen unit tests, integration tests of E2E tests aanwezig. Dit document biedt een uitgebreide strategie om een robuuste testing infrastructuur op te bouwen.

## Huidige Situatie

### Wat ontbreekt
- ❌ Geen test framework geconfigureerd (Vitest, Jest, etc.)
- ❌ Geen unit tests voor componenten of utilities
- ❌ Geen integration tests voor API/data flows
- ❌ Geen E2E test setup
- ❌ Geen test coverage rapportage
- ❌ Geen CI/CD pipeline voor automatische tests

### Wat wel aanwezig is
- ✅ Enkele test componenten voor development (`APITestComponent.jsx`)
- ✅ Offline test scenarios documentatie
- ✅ TypeScript types voor betere type safety
- ✅ Error boundaries voor runtime error handling
- ✅ React Query voor data management (testbaar)

## Aanbevolen Testing Stack

### 1. **Vitest** - Unit & Integration Testing
```json
{
  "devDependencies": {
    "vitest": "^2.1.8",
    "@testing-library/react": "^16.1.0",
    "@testing-library/jest-dom": "^6.6.4",
    "@testing-library/user-event": "^14.5.2",
    "@vitest/coverage-v8": "^2.1.8",
    "jsdom": "^26.0.0",
    "msw": "^2.8.0"
  }
}
```

### 2. **Playwright** - E2E Testing
```json
{
  "devDependencies": {
    "@playwright/test": "^1.50.0"
  }
}
```

## Testing Prioriteiten

### Phase 1: Foundation (Week 1-2)

#### 1.1 Test Infrastructure Setup
```javascript
// vitest.config.js
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.js'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
      ]
    }
  },
})
```

#### 1.2 Testing Utilities
```javascript
// src/test/test-utils.jsx
import { render } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AppProviders } from '../components/app/AppProviders'

export function renderWithProviders(ui, options = {}) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <AppProviders>
        {ui}
      </AppProviders>
    </QueryClientProvider>,
    options
  )
}
```

### Phase 2: Core Component Testing (Week 3-4)

#### 2.1 Critical Path Components
Prioriteit volgorde voor component testing:

1. **ItemExecutor** - Kern functionaliteit
   ```javascript
   // src/components/features/execution/__tests__/ItemExecutor.test.jsx
   describe('ItemExecutor', () => {
     it('should execute template with variables')
     it('should handle workflow execution')
     it('should process {previous_output} correctly')
     it('should handle execution errors gracefully')
   })
   ```

2. **TemplateEditor** - Content creatie
   ```javascript
   describe('TemplateEditor', () => {
     it('should detect variables in template content')
     it('should validate required fields')
     it('should handle save/update operations')
     it('should manage folder selection')
   })
   ```

3. **WorkflowEditor** - Workflow management
   ```javascript
   describe('WorkflowEditor', () => {
     it('should add/remove workflow steps')
     it('should validate step references')
     it('should handle drag-drop reordering')
     it('should save workflow configuration')
   })
   ```

#### 2.2 Hook Testing
```javascript
// src/hooks/queries/__tests__/useTemplatesQuery.test.js
describe('useTemplates', () => {
  it('should fetch templates from localStorage')
  it('should handle loading states')
  it('should update cache on mutation')
  it('should handle offline scenarios')
})
```

### Phase 3: Integration Testing (Week 5-6)

#### 3.1 Data Flow Testing
```javascript
// src/test/integration/data-flow.test.js
describe('Data Flow Integration', () => {
  it('should persist templates across page reloads')
  it('should sync data when coming online')
  it('should handle concurrent updates')
  it('should manage folder hierarchies correctly')
})
```

#### 3.2 API Mocking with MSW
```javascript
// src/test/mocks/handlers.js
import { http, HttpResponse } from 'msw'

export const handlers = [
  http.get('/api/templates', () => {
    return HttpResponse.json([
      { id: '1', name: 'Test Template', content: 'Hello {name}' }
    ])
  }),
]
```

### Phase 4: E2E Testing (Week 7-8)

#### 4.1 Critical User Flows
```javascript
// e2e/template-creation.spec.js
test('create and execute template', async ({ page }) => {
  await page.goto('/')
  await page.click('text=Create Template')
  await page.fill('[name="name"]', 'Welcome Template')
  await page.fill('[name="content"]', 'Hello {username}!')
  await page.click('text=Save')
  
  await page.click('text=Execute')
  await page.fill('[name="username"]', 'John')
  await expect(page.locator('.output')).toContainText('Hello John!')
})
```

#### 4.2 Offline Scenarios
```javascript
test('offline data persistence', async ({ page, context }) => {
  await context.setOffline(true)
  // Test offline operations
  await context.setOffline(false)
  // Verify sync
})
```

## Testing Patterns & Best Practices

### 1. Component Testing Pattern
```javascript
describe('Component: FolderTree', () => {
  // Setup
  beforeEach(() => {
    // Reset state
  })

  // Rendering
  describe('rendering', () => {
    it('should render folder hierarchy')
    it('should show empty state')
  })

  // Interactions
  describe('interactions', () => {
    it('should expand/collapse folders')
    it('should handle drag and drop')
  })

  // Edge cases
  describe('edge cases', () => {
    it('should handle circular references')
    it('should manage deep nesting')
  })
})
```

### 2. Async Testing Pattern
```javascript
it('should handle async operations', async () => {
  const { result } = renderHook(() => useTemplates())
  
  // Wait for loading
  await waitFor(() => {
    expect(result.current.isLoading).toBe(false)
  })
  
  expect(result.current.data).toHaveLength(5)
})
```

### 3. Error Boundary Testing
```javascript
it('should catch and display errors', () => {
  const ThrowError = () => {
    throw new Error('Test error')
  }

  const { getByText } = render(
    <ErrorBoundary>
      <ThrowError />
    </ErrorBoundary>
  )

  expect(getByText('Something went wrong')).toBeInTheDocument()
})
```

## Coverage Goals

### Minimum Coverage Targets
- **Overall**: 80%
- **Critical Components**: 90%
- **Utilities**: 95%
- **Hooks**: 85%

### Coverage by Category
1. **High Priority (90%+)**
   - ItemExecutor
   - Data persistence utilities
   - Variable detection/replacement
   - Error handling

2. **Medium Priority (80%+)**
   - Editors (Template, Workflow, Snippet)
   - Query hooks
   - State management

3. **Lower Priority (70%+)**
   - UI components
   - Styling utilities
   - Animation helpers

## Implementation Roadmap

### Month 1: Foundation
- [ ] Week 1-2: Setup Vitest, create test utilities
- [ ] Week 3-4: Test critical components

### Month 2: Expansion
- [ ] Week 5-6: Integration tests, API mocking
- [ ] Week 7-8: E2E setup with Playwright

### Month 3: Refinement
- [ ] Week 9-10: Increase coverage to targets
- [ ] Week 11-12: Performance testing, CI/CD integration

## CI/CD Integration

### GitHub Actions Workflow
```yaml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run test:unit
      - run: npm run test:e2e
      - uses: codecov/codecov-action@v4
```

## Testing Checklist

### Voor elke nieuwe feature:
- [ ] Unit tests voor nieuwe componenten
- [ ] Integration tests voor data flows
- [ ] Update E2E tests indien nodig
- [ ] Documenteer test scenarios
- [ ] Verify offline functionality

### Voor elke bug fix:
- [ ] Reproduceer bug in failing test
- [ ] Fix implementatie
- [ ] Verify test passes
- [ ] Add regression test

## Performance Testing

### Aanbevolen Tools
1. **React DevTools Profiler** - Component performance
2. **Lighthouse CI** - Overall performance metrics
3. **Bundle analyzer** - Bundle size monitoring

### Key Metrics
- First Contentful Paint < 1s
- Time to Interactive < 3s
- Bundle size < 500KB
- Memory leaks: 0

## Specifieke Test Scenarios

### 1. Offline Functionality
```javascript
describe('Offline Operations', () => {
  it('should queue operations when offline')
  it('should sync when coming online')
  it('should handle sync conflicts')
  it('should persist queue across sessions')
})
```

### 2. Folder Drag & Drop
```javascript
describe('Folder DnD', () => {
  it('should reorder folders')
  it('should move items between folders')
  it('should prevent circular references')
  it('should update UI optimistically')
})
```

### 3. Variable Processing
```javascript
describe('Variable Processing', () => {
  it('should extract variables from template')
  it('should handle nested variables')
  it('should validate variable names')
  it('should replace variables correctly')
})
```

## Conclusie

De huidige staat van testing in AirPrompts vereist significante investering. Deze strategie biedt een gestructureerde aanpak om van 0% naar 80%+ test coverage te gaan. Begin met de foundation en critical path components, bouw dan uit naar comprehensive coverage.

### Next Steps
1. Installeer Vitest en testing libraries
2. Creëer basis test setup
3. Begin met ItemExecutor tests
4. Bouw incrementeel uit volgens roadmap

Met deze strategie zal AirPrompts een robuuste, betrouwbare applicatie worden met vertrouwen in code changes en refactoring.