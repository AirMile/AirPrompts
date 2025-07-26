# ADR 004: Design System Approach

## Status
Accepted

## Context
AirPrompts needs a consistent, maintainable design system that:
- Provides visual consistency across all components
- Supports theming and customization
- Scales with the application
- Minimizes CSS complexity
- Works well with our Tailwind CSS setup

## Decision
Implement a hybrid design system approach:

### 1. Design Tokens
CSS variables for core values in `src/styles/colors.css`:
```css
:root {
  --color-primary-*: blue scale
  --color-secondary-*: gray scale
  --color-success-*: green scale
  --color-danger-*: red scale
  --spacing-*: spacing scale
  --radius-*: border radius scale
}
```

### 2. Tailwind Configuration
Extend Tailwind with our design tokens:
```javascript
theme: {
  extend: {
    colors: {
      primary: 'var(--color-primary-500)',
      // etc.
    }
  }
}
```

### 3. Component Patterns
- **Utility-first**: Use Tailwind classes directly
- **Component classes**: Only for complex, repeated patterns
- **CSS Modules**: For component-specific styles when needed

### 4. Style Organization
```
styles/
├── globals.css      # Global resets and base styles
├── colors.css       # Design tokens
├── components/      # Component-specific styles
└── utilities.css    # Custom utility classes
```

## Rationale
1. **Flexibility**: CSS variables enable runtime theming
2. **Performance**: Tailwind's JIT compiler keeps CSS small
3. **Developer Experience**: Utility classes are fast to write
4. **Maintainability**: Design tokens create single source of truth
5. **Gradual adoption**: Can evolve the system as needed

## Design Principles
### Visual Hierarchy
1. **Typography**: System fonts, clear size scale
2. **Spacing**: Consistent 4px base unit
3. **Colors**: Semantic naming (primary, danger, etc.)
4. **Shadows**: Subtle depth for cards and modals

### Component Patterns
1. **Cards**: Rounded corners, subtle shadows
2. **Buttons**: Clear states (hover, active, disabled)
3. **Forms**: Consistent input styling
4. **Feedback**: Toast notifications, loading states

### Responsive Design
- Mobile-first approach
- Breakpoints: sm (640px), md (768px), lg (1024px)
- Fluid typography and spacing
- Collapsible navigation

## Alternatives Considered
1. **CSS-in-JS**: Runtime overhead, complex setup
2. **Sass/Less**: Additional build step, less needed with Tailwind
3. **Pure CSS**: Harder to maintain consistency
4. **Component library**: Opinionated, harder to customize

## Consequences
### Positive
- Fast development with utility classes
- Easy theme customization
- Small CSS bundle size
- Good IDE support with Tailwind IntelliSense

### Negative
- HTML can become verbose with many classes
- Learning curve for Tailwind syntax
- Potential for inconsistent custom styles
- Need discipline to use design tokens

## Implementation Guidelines
### Do's
- Use design tokens for all colors
- Stick to the spacing scale
- Create semantic color names
- Document component patterns
- Use Tailwind's built-in states

### Don'ts
- Avoid arbitrary values in Tailwind
- Don't create one-off utility classes
- Avoid inline styles
- Don't override design tokens locally

## Example Patterns
```jsx
// Button component using design system
<button className="
  px-4 py-2 
  bg-primary text-white 
  rounded-lg 
  hover:bg-primary-600 
  transition-colors
  disabled:opacity-50
">
  Click me
</button>

// Card pattern
<div className="
  bg-white 
  rounded-xl 
  shadow-sm 
  p-6 
  border border-gray-200
">
  Content
</div>
```

## Future Considerations
1. **Dark mode**: CSS variables make this easy
2. **Component library**: Extract patterns to Storybook
3. **Design tokens API**: Generate from JSON
4. **Accessibility**: WCAG compliance built-in