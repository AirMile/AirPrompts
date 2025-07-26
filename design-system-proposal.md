# AirPrompts Design System Proposal

## Executive Summary

Dit document beschrijft een comprehensive design system voor AirPrompts dat zorgt voor consistentie, schaalbaarheid en onderhoudbaarheid van de UI. Het systeem bouwt voort op de bestaande architectuur en lost geïdentificeerde inconsistenties op.

## 1. Huidige UI Inconsistenties

### 1.1 Component Styling Fragmentatie
- **Probleem**: Styling is verspreid over inline classes, component-specifieke CSS files, en globale styles
- **Voorbeeld**: Button styling gebeurt zowel in `Button.jsx` als direct in componenten met Tailwind classes
- **Impact**: Moeilijk te onderhouden, inconsistente styling tussen vergelijkbare componenten

### 1.2 Kleur Token Gebruik
- **Probleem**: Inconsistent gebruik van kleur tokens (sommige componenten gebruiken `bg-blue-500`, anderen `bg-primary-500`)
- **Voorbeeld**: Card componenten hebben hardcoded kleuren voor verschillende varianten
- **Impact**: Theme switching werkt niet consistent voor alle componenten

### 1.3 Spacing en Sizing
- **Probleem**: Willekeurige padding/margin waarden zonder systematisch grid
- **Voorbeeld**: Sommige cards hebben `p-4`, andere `p-6`, zonder duidelijke logica
- **Impact**: Visuele inconsistentie tussen vergelijkbare componenten

### 1.4 Component API Patterns
- **Probleem**: Verschillende prop naming conventies tussen componenten
- **Voorbeeld**: `variant` vs `type` vs `kind` voor vergelijkbare functionaliteit
- **Impact**: Verwarrende developer experience

### 1.5 Responsive Design
- **Probleem**: Inconsistente breakpoint gebruik en mobile-first approach
- **Voorbeeld**: Sommige componenten hebben geen mobile optimalisatie
- **Impact**: Slechte mobile experience

## 2. Component Hierarchy Mogelijkheden

### 2.1 Proposed Component Architecture

```
├── Primitives (Atoms)
│   ├── Button
│   ├── Input
│   ├── Label
│   ├── Badge
│   ├── Icon
│   └── Typography
│
├── Components (Molecules)
│   ├── Card
│   ├── Modal
│   ├── Dropdown
│   ├── Form Controls
│   ├── Toast
│   └── Tooltip
│
├── Patterns (Organisms)
│   ├── Navigation
│   ├── ItemCard (Template/Workflow/Snippet)
│   ├── SearchBar
│   ├── FilterPanel
│   └── DataTable
│
└── Layouts (Templates)
    ├── DashboardLayout
    ├── EditorLayout
    ├── SettingsLayout
    └── ExecutorLayout
```

### 2.2 Component Composition Strategy

```jsx
// Base primitive
<Button variant="primary" size="md" />

// Composed component
<ItemCard>
  <ItemCard.Header>
    <ItemCard.Title />
    <ItemCard.Actions />
  </ItemCard.Header>
  <ItemCard.Body />
  <ItemCard.Footer />
</ItemCard>

// Layout composition
<DashboardLayout>
  <DashboardLayout.Sidebar />
  <DashboardLayout.Content>
    <DashboardLayout.Header />
    <DashboardLayout.Main />
  </DashboardLayout.Content>
</DashboardLayout>
```

## 3. Design Tokens

### 3.1 Color System Enhancement

```css
:root {
  /* Semantic Color Tokens */
  --color-background: var(--color-secondary-50);
  --color-surface: var(--color-secondary-100);
  --color-surface-hover: var(--color-secondary-200);
  --color-border: var(--color-secondary-300);
  --color-text-primary: var(--color-secondary-900);
  --color-text-secondary: var(--color-secondary-700);
  --color-text-muted: var(--color-secondary-500);
  
  /* Interactive States */
  --color-interactive: var(--color-primary-600);
  --color-interactive-hover: var(--color-primary-700);
  --color-interactive-active: var(--color-primary-800);
  --color-interactive-disabled: var(--color-secondary-400);
  
  /* Feedback Colors */
  --color-success: var(--color-success-600);
  --color-warning: var(--color-warning-600);
  --color-error: var(--color-danger-600);
  --color-info: var(--color-primary-600);
}
```

### 3.2 Spacing System

```css
:root {
  /* Base unit: 4px */
  --space-unit: 0.25rem;
  
  /* T-shirt sizes */
  --space-xs: calc(var(--space-unit) * 1);   /* 4px */
  --space-sm: calc(var(--space-unit) * 2);   /* 8px */
  --space-md: calc(var(--space-unit) * 4);   /* 16px */
  --space-lg: calc(var(--space-unit) * 6);   /* 24px */
  --space-xl: calc(var(--space-unit) * 8);   /* 32px */
  --space-2xl: calc(var(--space-unit) * 12); /* 48px */
  --space-3xl: calc(var(--space-unit) * 16); /* 64px */
  
  /* Component-specific spacing */
  --space-card-padding: var(--space-lg);
  --space-modal-padding: var(--space-xl);
  --space-button-padding-x: var(--space-md);
  --space-button-padding-y: var(--space-sm);
}
```

### 3.3 Typography System

```css
:root {
  /* Font Families */
  --font-sans: system-ui, -apple-system, 'Segoe UI', sans-serif;
  --font-mono: 'SF Mono', Consolas, monospace;
  
  /* Font Sizes - Fluid Typography */
  --text-xs: clamp(0.75rem, 0.7rem + 0.25vw, 0.875rem);
  --text-sm: clamp(0.875rem, 0.825rem + 0.25vw, 1rem);
  --text-base: clamp(1rem, 0.95rem + 0.25vw, 1.125rem);
  --text-lg: clamp(1.125rem, 1.075rem + 0.25vw, 1.25rem);
  --text-xl: clamp(1.25rem, 1.2rem + 0.25vw, 1.5rem);
  --text-2xl: clamp(1.5rem, 1.45rem + 0.25vw, 1.875rem);
  --text-3xl: clamp(1.875rem, 1.825rem + 0.25vw, 2.25rem);
  
  /* Line Heights */
  --leading-tight: 1.25;
  --leading-normal: 1.5;
  --leading-relaxed: 1.75;
  
  /* Font Weights */
  --font-normal: 400;
  --font-medium: 500;
  --font-semibold: 600;
  --font-bold: 700;
}
```

### 3.4 Animation Tokens

```css
:root {
  /* Durations */
  --duration-instant: 100ms;
  --duration-fast: 200ms;
  --duration-normal: 300ms;
  --duration-slow: 500ms;
  
  /* Easings */
  --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-out: cubic-bezier(0, 0, 0.2, 1);
  --ease-in: cubic-bezier(0.4, 0, 1, 1);
  --ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
  
  /* Transitions */
  --transition-base: all var(--duration-fast) var(--ease-in-out);
  --transition-colors: color, background-color, border-color var(--duration-fast) var(--ease-in-out);
  --transition-transform: transform var(--duration-normal) var(--ease-out);
  --transition-opacity: opacity var(--duration-normal) var(--ease-in-out);
}
```

## 4. Accessibility Improvements

### 4.1 Focus Management

```css
/* Enhanced focus styles */
:focus-visible {
  outline: 2px solid var(--color-interactive);
  outline-offset: 2px;
  border-radius: var(--radius-sm);
}

/* Skip to content link */
.skip-to-content {
  position: absolute;
  left: -9999px;
  z-index: 999;
}

.skip-to-content:focus {
  left: 50%;
  transform: translateX(-50%);
  top: 1rem;
}
```

### 4.2 ARIA Patterns

```jsx
// Accessible Modal Pattern
<Modal
  role="dialog"
  aria-modal="true"
  aria-labelledby="modal-title"
  aria-describedby="modal-description"
>
  <h2 id="modal-title">Modal Title</h2>
  <p id="modal-description">Modal description</p>
</Modal>

// Accessible Card Pattern
<Card
  role="article"
  aria-label="Template card"
>
  <CardHeader>
    <h3 id="card-title">Title</h3>
  </CardHeader>
  <CardBody aria-describedby="card-title" />
</Card>
```

### 4.3 Keyboard Navigation

```jsx
// Standardized keyboard patterns
const keyboardPatterns = {
  modal: {
    'Escape': 'close',
    'Tab': 'focusTrap'
  },
  dropdown: {
    'ArrowDown': 'nextItem',
    'ArrowUp': 'previousItem',
    'Enter': 'selectItem',
    'Escape': 'close'
  },
  list: {
    'ArrowDown': 'nextItem',
    'ArrowUp': 'previousItem',
    'Home': 'firstItem',
    'End': 'lastItem'
  }
};
```

## 5. Component API Patterns

### 5.1 Standardized Props

```typescript
// Base component props
interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
  id?: string;
  testId?: string;
  ariaLabel?: string;
  ariaDescribedBy?: string;
}

// Variant props
interface VariantProps {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'warning';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

// State props
interface StateProps {
  disabled?: boolean;
  loading?: boolean;
  error?: boolean;
  readOnly?: boolean;
}

// Interactive props
interface InteractiveProps {
  onClick?: (event: React.MouseEvent) => void;
  onFocus?: (event: React.FocusEvent) => void;
  onBlur?: (event: React.FocusEvent) => void;
  onKeyDown?: (event: React.KeyboardEvent) => void;
}
```

### 5.2 Component Composition Pattern

```jsx
// Compound component pattern
const Card = ({ children, ...props }) => {
  return (
    <CardContext.Provider value={cardState}>
      <div className="card" {...props}>
        {children}
      </div>
    </CardContext.Provider>
  );
};

Card.Header = CardHeader;
Card.Body = CardBody;
Card.Footer = CardFooter;

// Usage
<Card variant="template">
  <Card.Header>
    <Card.Title>Template Name</Card.Title>
    <Card.Actions>
      <Button size="sm">Edit</Button>
    </Card.Actions>
  </Card.Header>
  <Card.Body>
    Content here
  </Card.Body>
</Card>
```

### 5.3 Render Props Pattern

```jsx
// Flexible rendering pattern
<DataList
  items={items}
  renderItem={({ item, index }) => (
    <ItemCard key={item.id} item={item} />
  )}
  renderEmpty={() => (
    <EmptyState message="No items found" />
  )}
  renderLoading={() => (
    <LoadingSpinner />
  )}
/>
```

## 6. Implementation Roadmap

### Phase 1: Foundation (Week 1-2)
1. Create design token system
2. Implement base primitives (Button, Input, Typography)
3. Set up component documentation (Storybook)
4. Create accessibility utilities

### Phase 2: Core Components (Week 3-4)
1. Refactor Card component with new patterns
2. Implement Modal, Dropdown, Tooltip
3. Create form components with validation
4. Add animation utilities

### Phase 3: Complex Patterns (Week 5-6)
1. Refactor ItemCard (Template/Workflow/Snippet)
2. Implement DataTable with sorting/filtering
3. Create Navigation components
4. Add layout components

### Phase 4: Migration (Week 7-8)
1. Gradually migrate existing components
2. Update all color references to semantic tokens
3. Implement responsive patterns
4. Add comprehensive tests

## 7. Benefits

### Developer Experience
- Consistent API across all components
- Clear documentation and examples
- Type-safe component props
- Reduced decision fatigue

### User Experience
- Consistent visual language
- Better accessibility
- Improved performance
- Smooth animations

### Maintenance
- Centralized design decisions
- Easy theme switching
- Simplified updates
- Better testability

## 8. Example Component Refactor

### Before:
```jsx
<div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
  <h3 className="text-lg font-semibold mb-2">{title}</h3>
  <p className="text-gray-600 dark:text-gray-400">{description}</p>
</div>
```

### After:
```jsx
<Card variant="default" spacing="md">
  <Card.Header>
    <Typography variant="h3">{title}</Typography>
  </Card.Header>
  <Card.Body>
    <Typography variant="body" color="muted">{description}</Typography>
  </Card.Body>
</Card>
```

## Conclusie

Dit design system proposal biedt een solide foundation voor de toekomst van AirPrompts. Door consistente patterns, semantic tokens, en accessibility-first design kunnen we een betere user experience leveren terwijl we de developer experience verbeteren. De gefaseerde implementatie zorgt voor een smooth transitie zonder de huidige functionaliteit te verstoren.