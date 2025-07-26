# ADR 001: State Management Architecture

## Status
Accepted

## Context
The AirPrompts application needs a robust state management solution to handle:
- Template and workflow data
- UI state (current view, modals, selections)
- Folder hierarchy and organization
- User preferences and favorites
- Search and filter states

Currently, the application uses React's built-in state management with prop drilling from the main PromptTemplateSystem component.

## Decision
We will continue using React's built-in state management (useState, useContext) with the following structure:
- **Global state** in PromptTemplateSystem for templates, workflows, and folders
- **Local state** in components for UI-specific concerns
- **Context API** for cross-cutting concerns like favorites and UI preferences
- **Custom hooks** for state logic encapsulation (e.g., useFavorites, useUIState)

## Rationale
1. **Simplicity**: The current data model is straightforward and doesn't require complex state transformations
2. **Performance**: React's state management is sufficient for our data volume (~100s of items)
3. **Learning curve**: No additional state management library to learn
4. **Bundle size**: No extra dependencies
5. **Future flexibility**: Easy to migrate to Redux/Zustand if needed

## Alternatives Considered
1. **Redux**: Overkill for current complexity, adds boilerplate
2. **Zustand**: Good option but not necessary for current scale
3. **MobX**: Too much magic, harder to debug
4. **Valtio**: Similar to MobX concerns

## Consequences
### Positive
- Minimal learning curve for new developers
- Smaller bundle size
- Direct integration with React DevTools
- Easy to test with React Testing Library

### Negative
- Prop drilling for deeply nested components
- Manual optimization needed (useMemo, useCallback)
- No time-travel debugging
- Potential performance issues if state grows significantly

## Migration Path
If state management becomes complex:
1. Start with Context API for specific domains
2. Extract state logic to custom hooks
3. Consider Zustand for gradual migration
4. Redux Toolkit as last resort for enterprise features