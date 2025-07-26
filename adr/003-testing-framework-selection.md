# ADR 003: Testing Framework Selection

## Status
Proposed

## Context
The AirPrompts application currently has no automated tests. We need a testing strategy that:
- Provides confidence in core functionality
- Catches regressions early
- Is maintainable and fast
- Integrates well with our React/Vite stack
- Supports our collaborative development approach

## Decision
Implement a pragmatic testing pyramid:

### Testing Stack
1. **Vitest** for unit and integration tests
2. **React Testing Library** for component tests
3. **Playwright** for critical E2E scenarios
4. **MSW** for API mocking (future)

### Testing Strategy
```
         E2E (5%)
        /    \
    Integration (25%)
    /         \
   Unit Tests (70%)
```

### What to Test
1. **Unit Tests**: Utilities, hooks, data transformers
2. **Integration Tests**: Component interactions, state management
3. **E2E Tests**: Critical user journeys only

## Rationale
1. **Vitest**: Native Vite support, fast, Jest-compatible
2. **RTL**: Encourages testing user behavior over implementation
3. **Playwright**: Modern, reliable, good debugging tools
4. **Pragmatic approach**: Focus on high-value tests

## Testing Priorities
### Phase 1: Foundation
- Utility functions (clipboard, localStorage, import/export)
- Custom hooks (useFavorites, useUIState)
- Data validation and transformations

### Phase 2: Components
- ItemExecutor (core functionality)
- Search and filter logic
- Folder drag-and-drop operations

### Phase 3: User Journeys
- Create and execute template
- Build and run workflow
- Import/export data

## Alternatives Considered
1. **Jest**: Slower with Vite, requires more configuration
2. **Cypress**: Heavier than Playwright, slower
3. **Testing Library only**: Need E2E for critical paths
4. **100% coverage goal**: Unrealistic, focusing on value

## Consequences
### Positive
- Fast feedback loop with Vitest
- Confidence in refactoring
- Documentation through tests
- Catches edge cases early

### Negative
- Initial setup time investment
- Maintenance overhead
- Learning curve for team
- Potential for brittle tests

## Implementation Guidelines
1. **Test naming**: `describe` what, `it` does
2. **AAA pattern**: Arrange, Act, Assert
3. **One assertion per test** when possible
4. **Mock external dependencies**
5. **Test behavior, not implementation**

## Example Test Structure
```javascript
// Simple unit test
test('formatTemplate replaces variables correctly', () => {
  const result = formatTemplate('{name} is {age}', { name: 'John', age: 30 });
  expect(result).toBe('John is 30');
});

// Component test
test('user can favorite a template', async () => {
  render(<TemplateCard template={mockTemplate} />);
  await userEvent.click(screen.getByRole('button', { name: /favorite/i }));
  expect(screen.getByRole('button', { name: /unfavorite/i })).toBeInTheDocument();
});
```

## Success Metrics
- 70% coverage for utilities and hooks
- All critical paths have E2E tests
- Tests run in under 30 seconds
- Zero flaky tests