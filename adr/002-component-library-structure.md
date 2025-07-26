# ADR 002: Component Library Structure

## Status
Accepted

## Context
The application needs a clear, scalable component organization that:
- Promotes reusability
- Maintains clear boundaries
- Supports future growth
- Enables easy navigation and discovery

## Decision
Adopt a feature-based folder structure with shared components:

```
src/
├── components/
│   ├── common/          # Shared, reusable components
│   ├── templates/       # Template-specific components
│   ├── workflows/       # Workflow-specific components
│   ├── folders/         # Folder management components
│   ├── context/         # Context-specific components
│   └── dashboard/       # Dashboard and homepage components
├── hooks/               # Custom React hooks
│   ├── queries/         # Data fetching hooks
│   └── context/         # Context-specific hooks
├── utils/               # Utility functions
├── styles/              # Global styles and themes
├── types/               # TypeScript types (future)
└── data/                # Default data and import utilities
```

## Rationale
1. **Feature cohesion**: Related components stay together
2. **Clear dependencies**: Easy to see what depends on what
3. **Scalability**: New features get their own folders
4. **Discoverability**: Developers can quickly find components
5. **Reusability**: Common folder for shared components

## Component Categories
### Common Components
- Buttons, inputs, modals, cards
- Layout components (ResizableSection)
- Utility components (ItemExecutor)

### Feature Components
- Self-contained with their own styles
- May have sub-components in same folder
- Clear naming: Feature + Component type

### Naming Conventions
- PascalCase for components: `FolderTree.jsx`
- camelCase for utilities: `localStorageManager.js`
- kebab-case for styles: `folder-description.css`
- Descriptive names over brevity

## Alternatives Considered
1. **Atomic Design**: Too rigid for this project size
2. **Flat structure**: Becomes unwieldy as project grows
3. **Type-based**: Separates related components
4. **Module-based**: Overkill for current complexity

## Consequences
### Positive
- Easy onboarding for new developers
- Natural code splitting boundaries
- Promotes feature independence
- Simple refactoring and moving files

### Negative
- Some components might fit multiple categories
- Potential for duplicate components
- Need discipline to maintain structure
- May need reorganization as patterns emerge

## Guidelines
1. Start in feature folder, move to common when reused
2. Keep component files under 300 lines
3. Co-locate styles with components
4. Extract hooks when logic is reused
5. Document component props and usage