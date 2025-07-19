# Drag & Drop Implementatie Plan voor AirPrompts

## Overzicht
Dit document beschrijft het plan om drag-and-drop functionaliteit toe te voegen aan de AirPrompts applicatie, waarmee gebruikers kaarten kunnen herordenen binnen en tussen secties.

## Huidige Architectuur

### Componenten Structuur
- **Homepage.jsx**: Hoofdcomponent met sectie rendering
- **FocusableCard.jsx**: Grid view kaart component
- **ListView.jsx**: List view item component
- **CollapsibleSection.jsx**: Sectie containers (Favorites, Workflows, Templates, Snippets)

### Data Model
- Items hebben `folderOrder` en `favoriteOrder` properties voor ordering
- Folder-specifieke favorites systeem met `folderFavorites` object
- State management via PromptTemplateSystem.jsx met useState hooks

### Bestaande Features
- Keyboard navigation met focus management
- View mode toggle (grid/list)
- Folder-based organization
- Favorite toggle functionaliteit

## Implementation Plan

### Fase 1: Dependencies & Setup
```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

**Waarom @dnd-kit:**
- Moderne, accessible drag & drop library
- Uitstekende React integration
- Keyboard navigation support
- Touch device compatibility
- Virtualization support voor grote lijsten

### Fase 2: Core Drag & Drop Infrastructure

#### 2.1 Custom Hook: `useDragAndDrop.js`
```javascript
// Locatie: src/hooks/useDragAndDrop.js
export const useDragAndDrop = ({
  items,
  onReorder,
  sectionType,
  selectedFolderId
}) => {
  // Drag event handlers
  // Order calculation logic
  // Optimistic updates
  // Cross-section move logic
}
```

#### 2.2 Drag Context Provider
```javascript
// Locatie: src/contexts/DragDropContext.jsx
export const DragDropProvider = ({ children }) => {
  // Global drag state
  // Section coordination
  // Visual feedback state
}
```

### Fase 3: Sortable Components

#### 3.1 SortableCard Component
```javascript
// Locatie: src/components/common/SortableCard.jsx
// Wrapper rond FocusableCard met drag functionaliteit
// Drag handle met GripVertical icoon
// Visual feedback tijdens dragging
```

#### 3.2 SortableListItem Component
```javascript
// Locatie: src/components/common/SortableListItem.jsx
// Wrapper rond ListView items
// Consistent drag experience tussen view modes
```

### Fase 4: Drop Zones & Section Integration

#### 4.1 Droppable Section Wrapper
```javascript
// Locatie: src/components/common/DroppableSection.jsx
// Wrapper rond CollapsibleSection
// Drop zone indicators
// Cross-section drop handling
```

#### 4.2 Homepage Integration
- Modificeer `renderItems()` functie om sortable components te gebruiken
- Integreer DragDropContext in hoofdcomponent
- Behoud bestaande keyboard navigation

### Fase 5: State Management Updates

#### 5.1 Order Calculation Logic
```javascript
// Update bestaande order properties:
// - folderOrder: positie binnen folder
// - favoriteOrder: positie binnen favorites
// - Nieuwe: sectionOrder voor cross-section moves
```

#### 5.2 Update Handlers
- Uitbreiden van `onUpdateTemplate`, `onUpdateWorkflow`, `onUpdateSnippet`
- Batch updates voor efficiënte re-rendering
- Optimistic updates voor smooth UX

### Fase 6: Visual Design & UX

#### 6.1 Drag States
```css
/* Dragging state */
.card-dragging {
  opacity: 0.7;
  transform: rotate(5deg);
  box-shadow: 0 8px 25px rgba(0,0,0,0.3);
}

/* Drop zone active */
.drop-zone-active {
  border: 2px dashed #3b82f6;
  background: rgba(59, 130, 246, 0.1);
}
```

#### 6.2 Animation & Feedback
- Smooth transitions tijdens reordering
- Drop zone highlights
- Drag preview met type-based styling
- Loading states tijdens updates

### Fase 7: Advanced Features

#### 7.1 Cross-Section Moves
- Workflow → Templates: Convert workflow to template
- Template → Snippets: Create snippet from template
- Any → Favorites: Add to folder favorites

#### 7.2 Keyboard Accessibility
- Drag & drop via keyboard (Space to grab, arrows to move)
- Screen reader announcements
- Focus management tijdens drag operations

#### 7.3 Mobile Optimization
- Touch gesture support
- Long press to initiate drag
- Responsive drag handles

## File Structure Changes

```
src/
├── hooks/
│   ├── useDragAndDrop.js          # Nieuwe hook
│   └── useSortableItems.js        # Nieuwe hook
├── contexts/
│   └── DragDropContext.jsx        # Nieuwe context
├── components/
│   ├── common/
│   │   ├── SortableCard.jsx       # Nieuwe wrapper
│   │   ├── SortableListItem.jsx   # Nieuwe wrapper
│   │   ├── DroppableSection.jsx   # Nieuwe wrapper
│   │   ├── DragOverlay.jsx        # Nieuwe component
│   │   ├── FocusableCard.jsx      # Modificatie
│   │   └── ListView.jsx           # Modificatie
│   └── dashboard/
│       └── Homepage.jsx           # Grote modificaties
├── utils/
│   ├── dragUtils.js               # Nieuwe utilities
│   └── orderUtils.js              # Nieuwe utilities
└── styles/
    └── dragDrop.css               # Nieuwe stijlen
```

## Implementation Volgorde

### Sprint 1: Foundation (Week 1)
1. Dependencies installeren
2. useDragAndDrop hook ontwikkelen
3. SortableCard component maken
4. Basis drag functionaliteit binnen één sectie

### Sprint 2: Multi-Section (Week 2)
1. DroppableSection component
2. Cross-section drop logic
3. State management updates
4. Visual feedback improvements

### Sprint 3: Polish & Testing (Week 3)
1. Keyboard accessibility
2. Mobile optimization
3. Animation tuning
4. Edge case handling
5. Performance optimization

## Technische Overwegingen

### Performance
- Use `useMemo` voor sortable items lists
- Debounce order updates
- Virtual scrolling compatibility
- Lazy loading integration

### Accessibility
- ARIA announcements voor screen readers
- Keyboard-only operation
- High contrast mode support
- Focus management

### Browser Compatibility
- Modern browsers (ES2020+)
- Touch device support
- Fallback voor older browsers zonder native drag support

### Data Persistence
- Optimistic updates voor immediate feedback
- Error handling en rollback logic
- Batch API calls voor meerdere updates
- Local storage backup tijdens drag operations

## Testing Strategy

### Unit Tests
- Order calculation logic
- Drag event handlers
- State update functions

### Integration Tests
- Cross-component drag operations
- Keyboard navigation compatibility
- View mode switching tijdens drag

### E2E Tests
- Complete drag & drop workflows
- Cross-section moves
- Error scenarios
- Mobile gesture testing

## Potentiële Uitdagingen

1. **Keyboard Navigation Conflict**: Bestaande keyboard nav vs drag & drop
   - *Oplossing*: Mode switching met escape key

2. **Performance met Grote Datasets**: Many items slow down drag
   - *Oplossing*: Virtual scrolling, debouncing

3. **Touch Device Differences**: iOS vs Android gesture handling
   - *Oplossing*: Extensive cross-device testing

4. **State Consistency**: Race conditions tijdens rapid drag operations
   - *Oplossing*: Optimistic updates met conflict resolution

## Toekomstige Uitbreidingen

- Bulk select & drag multiple items
- Drag & drop tussen folders
- Undo/redo voor drag operations
- Drag & drop import van externe bestanden
- Visual grouping via drag & drop

## Conclusie

Deze implementatie bouwt voort op de bestaande solide architectuur van AirPrompts en voegt een intuïtieve drag & drop ervaring toe die de productiviteit van gebruikers significant kan verbeteren. De gefaseerde aanpak zorgt voor een stabiele implementatie met minimale breaking changes.