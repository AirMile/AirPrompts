# iOS/Android-style Folder Drag & Drop Implementatie

## Overzicht

Dit document beschrijft de implementatie van een mobiel-geïnspireerd folder drag & drop systeem voor AirPrompts, gebaseerd op onderzoek naar iOS en Android UX patronen en gebruik makend van @dnd-kit.

## 1. Core Technologie Stack

### Dependencies
```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

### Waarom @dnd-kit?
- **Lightweight**: 10kb core bundle
- **Accessibility-first**: Ingebouwde keyboard/screen reader support
- **Customizable**: Volledige controle over animations en gedrag
- **Physics-based**: Ondersteunt spring animaties
- **Mobile-optimized**: Touch-friendly sensors

## 2. Mobiele UX Principes

### iOS/Android Inspiratie
- **Long Press Activatie**: 500ms hold zoals iOS
- **Spring Physics**: Natuurlijke bewegingen met momentum
- **Visual Feedback**: Lift, scale, shadow effecten
- **Hover Detection**: 1 seconde hover voor subfolder creatie
- **Push Gedrag**: Andere folders wijken uit tijdens drag

### Timing Specificaties
```javascript
const ACTIVATION_DELAY = 500;      // Long press threshold
const HOVER_THRESHOLD = 1000;      // Subfolder creation delay
const ANIMATION_DURATION = 350;    // iOS-achtige transition time
const SPRING_STIFFNESS = 300;      // Natural spring feel
const SPRING_DAMPING = 25;         // Prevents oscillation
```

## 3. Implementatie Architectuur

### Component Hiërarchie
```
CollapsibleFolderTree
├── DndContext
│   ├── SortableContext
│   │   └── SortableFolder (per folder)
│   │       └── FolderContent
│   └── DragOverlay
│       └── FolderPreview
```

### Core Setup
```jsx
// CollapsibleFolderTree.jsx
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
  DragOverlay
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove
} from '@dnd-kit/sortable';

const CollapsibleFolderTree = ({ folders, onReorderFolders }) => {
  const [activeFolder, setActiveFolder] = useState(null);
  const [hoverTarget, setHoverTarget] = useState(null);
  const [showSubfolderPreview, setShowSubfolderPreview] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        delay: 500,           // Long press activatie
        tolerance: 5,         // 5px bewegingstolerantie
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={folders.map(f => f.id)}
        strategy={verticalListSortingStrategy}
      >
        {folders.map(folder => (
          <SortableFolder 
            key={folder.id} 
            folder={folder}
            isHoverTarget={hoverTarget === folder.id}
          />
        ))}
      </SortableContext>
      
      <DragOverlay
        dropAnimation={{
          duration: 200,
          easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
        }}
      >
        {activeFolder && (
          <FolderPreview folder={activeFolder} />
        )}
      </DragOverlay>
    </DndContext>
  );
};
```

## 4. SortableFolder Component

### Basis Implementatie
```jsx
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const SortableFolder = ({ folder, isHoverTarget, depth = 0 }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: folder.id,
    data: {
      type: 'folder',
      folder,
    },
    transition: {
      duration: 350,
      easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    ...getDragStyles(isDragging, isHoverTarget),
    paddingLeft: `${8 + depth * 16}px`,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={getClassName(isDragging, isHoverTarget)}
    >
      <FolderContent folder={folder} isDragging={isDragging} />
    </div>
  );
};
```

### Styling Helpers
```jsx
const getDragStyles = (isDragging, isHoverTarget) => {
  if (isDragging) {
    return {
      opacity: 0.3,
      transform: 'scale(0.95)',
      filter: 'grayscale(50%)',
    };
  }
  
  if (isHoverTarget) {
    return {
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      boxShadow: '0 0 0 2px rgba(59, 130, 246, 0.3)',
      transform: 'scale(1.02)',
      borderRadius: '8px',
    };
  }
  
  return {};
};

const getClassName = (isDragging, isHoverTarget) => {
  let classes = 'folder-item transition-all duration-200';
  
  if (isDragging) classes += ' dragging';
  if (isHoverTarget) classes += ' hover-target animate-pulse';
  
  return classes;
};
```

## 5. Event Handlers

### Drag Start
```jsx
const handleDragStart = (event) => {
  const { active } = event;
  const folder = folders.find(f => f.id === active.id);
  
  setActiveFolder(folder);
  
  // Haptic feedback simulatie
  if (navigator.vibrate) {
    navigator.vibrate(50);
  }
  
  // Visual feedback voor hele app
  document.body.classList.add('dragging-folder');
};
```

### Drag Over (Hover Detection)
```jsx
const [hoverTimer, setHoverTimer] = useState(null);

const handleDragOver = (event) => {
  const { active, over } = event;
  
  if (!over || over.id === active.id) {
    clearHoverTimer();
    return;
  }
  
  // Start hover timer voor subfolder creatie
  if (!hoverTimer) {
    const timer = setTimeout(() => {
      setHoverTarget(over.id);
      setShowSubfolderPreview(true);
      
      // Subtle haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate(25);
      }
    }, 1000);
    
    setHoverTimer(timer);
  }
};

const clearHoverTimer = () => {
  if (hoverTimer) {
    clearTimeout(hoverTimer);
    setHoverTimer(null);
  }
  setHoverTarget(null);
  setShowSubfolderPreview(false);
};
```

### Drag End
```jsx
const handleDragEnd = (event) => {
  const { active, over } = event;
  
  setActiveFolder(null);
  clearHoverTimer();
  document.body.classList.remove('dragging-folder');
  
  if (!over) return;
  
  const activeFolder = folders.find(f => f.id === active.id);
  const overFolder = folders.find(f => f.id === over.id);
  
  if (showSubfolderPreview && hoverTarget === over.id) {
    // Maak subfolder
    handleCreateSubfolder(activeFolder, overFolder);
  } else if (active.id !== over.id) {
    // Herorden folders
    handleReorderFolders(activeFolder, overFolder);
  }
};
```

## 6. Subfolder Creatie Logic

### Validation
```jsx
const canCreateSubfolder = (sourceFolder, targetFolder) => {
  // Voorkom circular references
  if (isDescendantOf(sourceFolder.id, targetFolder.id)) {
    return false;
  }
  
  // Voorkom zelf-nesting
  if (sourceFolder.id === targetFolder.id) {
    return false;
  }
  
  return true;
};

const isDescendantOf = (sourceId, targetId) => {
  const findDescendants = (parentId) => {
    return folders
      .filter(f => f.parentId === parentId)
      .reduce((descendants, child) => {
        return [...descendants, child.id, ...findDescendants(child.id)];
      }, []);
  };
  
  return findDescendants(targetId).includes(sourceId);
};
```

### Subfolder Creatie
```jsx
const handleCreateSubfolder = async (sourceFolder, targetFolder) => {
  if (!canCreateSubfolder(sourceFolder, targetFolder)) {
    // Shake animatie voor error
    animateError(sourceFolder.id);
    return;
  }
  
  // Optimistic update
  const updatedFolder = {
    ...sourceFolder,
    parentId: targetFolder.id,
    sortOrder: getNewSortOrder(targetFolder.id),
  };
  
  try {
    await onUpdateFolder(updatedFolder);
    
    // Succesvolle creatie animatie
    animateSuccess(targetFolder.id);
  } catch (error) {
    // Revert en toon error
    animateError(sourceFolder.id);
    console.error('Failed to create subfolder:', error);
  }
};
```

## 7. Animatie Systeem

### Spring Physics CSS
```css
/* Spring-based transitions */
.folder-item {
  transition: 
    transform 350ms cubic-bezier(0.25, 0.46, 0.45, 0.94),
    opacity 200ms ease,
    box-shadow 200ms ease,
    background-color 200ms ease;
}

/* Dragging state */
.folder-item.dragging {
  transition: none;
  will-change: transform;
  z-index: 1000;
}

/* Hover target pulse */
.folder-item.hover-target {
  animation: hover-pulse 1s ease-in-out infinite;
}

@keyframes hover-pulse {
  0%, 100% { 
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3);
    background-color: rgba(59, 130, 246, 0.05);
  }
  50% { 
    box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.5);
    background-color: rgba(59, 130, 246, 0.1);
  }
}

/* Error shake */
@keyframes error-shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-4px); }
  75% { transform: translateX(4px); }
}

.folder-item.error {
  animation: error-shake 0.3s ease-in-out;
  border: 2px solid rgba(239, 68, 68, 0.5);
}

/* Success pulse */
@keyframes success-pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}

.folder-item.success {
  animation: success-pulse 0.4s ease-out;
  border: 2px solid rgba(34, 197, 94, 0.5);
}
```

### Animation Helpers
```jsx
const animateError = (folderId) => {
  const element = document.querySelector(`[data-folder-id="${folderId}"]`);
  if (element) {
    element.classList.add('error');
    setTimeout(() => element.classList.remove('error'), 300);
  }
};

const animateSuccess = (folderId) => {
  const element = document.querySelector(`[data-folder-id="${folderId}"]`);
  if (element) {
    element.classList.add('success');
    setTimeout(() => element.classList.remove('success'), 400);
  }
};
```

## 8. Accessibility

### Keyboard Support
```jsx
const keyboardCoordinates = (event, { currentCoordinates }) => {
  const delta = 10;
  
  switch (event.code) {
    case 'ArrowDown':
      return { ...currentCoordinates, y: currentCoordinates.y + delta };
    case 'ArrowUp':
      return { ...currentCoordinates, y: currentCoordinates.y - delta };
    case 'ArrowRight':
      return { ...currentCoordinates, x: currentCoordinates.x + delta };
    case 'ArrowLeft':
      return { ...currentCoordinates, x: currentCoordinates.x - delta };
  }
  
  return undefined;
};
```

### Screen Reader Announcements
```jsx
const announcements = {
  onDragStart({ active }) {
    const folder = folders.find(f => f.id === active.id);
    return `Picked up folder ${folder.name}. Use arrow keys to move, space to drop.`;
  },
  
  onDragOver({ active, over }) {
    if (over) {
      const activeFolder = folders.find(f => f.id === active.id);
      const overFolder = folders.find(f => f.id === over.id);
      return `Folder ${activeFolder.name} is over ${overFolder.name}. Hold to create subfolder.`;
    }
    
    return `Folder ${active.id} is no longer over a droppable area.`;
  },
  
  onDragEnd({ active, over }) {
    if (over) {
      const activeFolder = folders.find(f => f.id === active.id);
      const overFolder = folders.find(f => f.id === over.id);
      
      if (showSubfolderPreview) {
        return `Created subfolder: ${activeFolder.name} is now inside ${overFolder.name}.`;
      } else {
        return `Moved folder ${activeFolder.name} next to ${overFolder.name}.`;
      }
    }
    
    return `Dropped folder ${active.id}.`;
  },
};

// In DndContext
<DndContext
  announcements={announcements}
  // ... andere props
>
```

## 9. Performance Optimalisaties

### React Optimalisaties
```jsx
// Memoize folder components
const SortableFolder = React.memo(({ folder, isHoverTarget, depth }) => {
  // ... component logic
});

// Debounce hover detection
const debouncedSetHoverTarget = useCallback(
  debounce((targetId) => setHoverTarget(targetId), 100),
  []
);

// Optimize folder ID extraction
const folderIds = useMemo(
  () => folders.map(f => f.id),
  [folders]
);
```

### CSS Performance
```css
/* Enable hardware acceleration */
.folder-item {
  transform: translateZ(0);
  backface-visibility: hidden;
  will-change: transform, opacity;
}

/* Use transform3d for better performance */
.folder-item.dragging {
  transform: translate3d(var(--x), var(--y), 0) scale(0.95);
}
```

## 10. Implementatie Stappen

### Fase 1: Basis Setup (Dag 1)
1. ✅ Installeer @dnd-kit dependencies
2. ✅ Wrap CollapsibleFolderTree in DndContext
3. ✅ Implementeer basis SortableFolder component
4. ✅ Test basic drag & drop functionaliteit

### Fase 2: Long Press & Visuele Feedback (Dag 2)
1. ✅ Configureer PointerSensor met delay
2. ✅ Add visual feedback tijdens long press
3. ✅ Implementeer lift animatie met scale/shadow
4. ✅ Add DragOverlay voor smooth preview

### Fase 3: Spring Physics & Animations (Dag 3)
1. ✅ Implementeer custom spring transitions
2. ✅ Add hover detection met timing
3. ✅ Visual feedback voor hover targets
4. ✅ Error/success animaties

### Fase 4: Subfolder Logic (Dag 4)
1. ✅ Hover timing detectie (1 seconde)
2. ✅ Preview UI voor subfolder creatie
3. ✅ Validation voor circular references
4. ✅ Database updates voor folder hierarchie

### Fase 5: Polish & Accessibility (Dag 5)
1. ✅ Keyboard navigation support
2. ✅ Screen reader announcements
3. ✅ Touch-friendly hit areas (44px minimum)
4. ✅ Performance optimalisaties
5. ✅ Cross-browser testing

## 11. Testing Checklist

### Functionaliteit
- [ ] Long press activatie werkt (500ms)
- [ ] Drag & drop tussen folders werkt
- [ ] Subfolder creatie na 1 seconde hover
- [ ] Circular reference preventie
- [ ] Error handling bij API failures

### UX & Animaties
- [ ] Smooth lift animatie bij drag start
- [ ] Spring-based bewegingen voelen natuurlijk
- [ ] Hover feedback is duidelijk zichtbaar
- [ ] Drop animaties zijn satisfying
- [ ] Error shake is duidelijk maar niet irritant

### Performance
- [ ] Geen lag tijdens drag operaties
- [ ] Smooth op touch devices
- [ ] Efficient re-rendering
- [ ] Memory leaks getest

### Accessibility
- [ ] Keyboard navigation werkt volledig
- [ ] Screen reader support is compleet
- [ ] Focus management is correct
- [ ] ARIA attributes zijn correct

## 12. Toekomstige Uitbreidingen

### Mogelijke Features
- **Multi-select drag**: Meerdere folders tegelijk verplaatsen
- **Drag preview customization**: Verschillende preview styles
- **Auto-scroll**: Scroll tijdens drag near edges
- **Undo/Redo**: Voor drag operaties
- **Drag constraints**: Limiteer drag to specifieke areas
- **Advanced haptics**: Voor devices die het ondersteunen

### Performance Verbeteringen
- **Virtual scrolling**: Voor grote folder trees
- **Intersection Observer**: Voor efficient hover detection
- **Web Workers**: Voor complexe calculations
- **CSS containment**: Voor better paint performance

## Conclusie

Deze implementatie combineert de beste aspecten van mobiele UX met moderne web technologieën. Door @dnd-kit te gebruiken als basis en iOS/Android principes toe te passen, creëren we een intuïtief en performant folder management systeem dat aanvoelt als een native app.

De gefaseerde aanpak zorgt ervoor dat we stap voor stap kunnen bouwen en testen, terwijl de focus op accessibility en performance ervoor zorgt dat de oplossing voor iedereen werkt.