# Folder-Specifieke Favorites Systeem - Implementatieplan

## Overzicht

Dit plan beschrijft de stapsgewijze implementatie van een folder-specifiek favorites systeem ter vervanging van het huidige "Recently Used" systeem. Het nieuwe systeem heeft 4 hoofdsecties met eigen drag-and-drop functionaliteit:

1. **Favorites** - Gemixte favorite items uit huidige folder
2. **Workflows** - Alle workflows uit huidige folder  
3. **Templates** - Alle templates uit huidige folder
4. **Snippets** - Alle snippets uit huidige folder

## Key Features

- ✅ Folder-specifieke favorites (favoriet in folder A ≠ favoriet in folder B)
- ✅ 4 gelijkwaardige hoofdsecties met eigen theming
- ✅ Drag-and-drop reordering per sectie
- ✅ Auto-save van volgorde per folder per sectie
- ✅ Behoud van alle bestaande functionaliteit (Execute, Edit, Delete)

---

## FASE 1: DATA LAYER FOUNDATION

### Stap 1: Update Data Models in template.types.js

**Doel:** Uitbreiden van data structuur voor folder-specifieke favorites en ordering

**Bestanden:** `src/types/template.types.js`

**Te implementeren:**

```javascript
// Nieuwe properties toevoegen aan createTemplate, createWorkflow, createSnippet
const createTemplate = () => ({
  // ... bestaande properties
  folderFavorites: {}, // { [folderId]: { isFavorite: boolean, favoriteOrder: number } }
  folderOrder: {} // { [folderId]: number } - voor algemene item volgorde per folder
});
```

**Helper functions toevoegen:**

```javascript
// Folder-specifieke favorite helpers
export const getFolderFavorites = (items, folderId) => {
  return items.filter(item => 
    item.folderFavorites?.[folderId]?.isFavorite === true
  ).sort((a, b) => 
    (a.folderFavorites?.[folderId]?.favoriteOrder || 0) - 
    (b.folderFavorites?.[folderId]?.favoriteOrder || 0)
  );
};

export const getFolderItems = (items, folderId) => {
  return items.filter(item => item.folderId === folderId)
    .sort((a, b) => 
      (a.folderOrder?.[folderId] || 0) - (b.folderOrder?.[folderId] || 0)
    );
};

export const updateItemFolderOrder = (item, folderId, newOrder) => {
  return {
    ...item,
    folderOrder: {
      ...item.folderOrder,
      [folderId]: newOrder
    }
  };
};

export const toggleFolderFavorite = (item, folderId) => {
  const currentFavorite = item.folderFavorites?.[folderId];
  return {
    ...item,
    folderFavorites: {
      ...item.folderFavorites,
      [folderId]: {
        isFavorite: !currentFavorite?.isFavorite,
        favoriteOrder: currentFavorite?.favoriteOrder || 0
      }
    }
  };
};
```

### Stap 2: Update Default Data Files

**Bestanden:** 
- `src/data/defaultTemplates.json`
- `src/data/defaultWorkflows.json` 
- `src/data/defaultSnippets.json`

**Doel:** Voeg nieuwe properties toe aan alle default items

**Voor elk item toevoegen:**
```json
{
  "folderFavorites": {},
  "folderOrder": {}
}
```

### Stap 3: Migration Logic voor Bestaande Data

**Bestanden:** `src/types/template.types.js`

**Implementeren:**
```javascript
// Migration helper voor oude naar nieuwe data structure
export const migrateToFolderSystem = (items) => {
  return items.map(item => ({
    ...item,
    folderFavorites: item.folderFavorites || {},
    folderOrder: item.folderOrder || {},
    // Migreer oude global favorite naar folder-specific (voor 'root' folder)
    ...(item.favorite && {
      folderFavorites: {
        ...item.folderFavorites,
        [item.folderId || 'root']: {
          isFavorite: true,
          favoriteOrder: 0
        }
      }
    })
  }));
};
```

---

## FASE 2: WIDGET ARCHITECTURE

### Stap 4: Creëer FolderManagementWidget Component

**Bestanden:** 
- `src/components/widgets/FolderManagementWidget.jsx` (nieuwe file)
- Hernoem `RecentWidget.jsx` naar `RecentWidget.backup.jsx`

**Doel:** Nieuwe widget met 4 hoofdsecties

**Base structure:**
```jsx
import React, { useState, useMemo } from 'react';
import { Star, Workflow, FileText, Layers, GripVertical } from 'lucide-react';
import WidgetContainer from './WidgetContainer.jsx';
import CollapsibleSection from '../common/CollapsibleSection.jsx';
import { getFolderFavorites, getFolderItems } from '../../types/template.types.js';

const FolderManagementWidget = ({
  templates = [],
  workflows = [],
  snippets = [],
  selectedFolderId = 'root',
  onExecuteItem,
  onEditTemplate,
  onEditWorkflow, 
  onEditSnippet,
  // ... other props
}) => {
  // Widget logic hier
};
```

### Stap 5: Implementeer 4 CollapsibleSection Headers

**In FolderManagementWidget.jsx:**

```jsx
// Bereken items per sectie
const folderFavorites = useMemo(() => {
  const allItems = [
    ...getFolderFavorites(templates, selectedFolderId).map(t => ({...t, type: 'template'})),
    ...getFolderFavorites(workflows, selectedFolderId).map(w => ({...w, type: 'workflow'})),
    ...getFolderFavorites(snippets, selectedFolderId).map(s => ({...s, type: 'snippet'}))
  ];
  return allItems.sort((a, b) => 
    (a.folderFavorites?.[selectedFolderId]?.favoriteOrder || 0) - 
    (b.folderFavorites?.[selectedFolderId]?.favoriteOrder || 0)
  );
}, [templates, workflows, snippets, selectedFolderId]);

const folderWorkflows = useMemo(() => 
  getFolderItems(workflows, selectedFolderId), 
  [workflows, selectedFolderId]
);

const folderTemplates = useMemo(() => 
  getFolderItems(templates, selectedFolderId), 
  [templates, selectedFolderId]
);

const folderSnippets = useMemo(() => 
  getFolderItems(snippets, selectedFolderId), 
  [snippets, selectedFolderId]
);

// Render 4 secties
return (
  <WidgetContainer title="Folder Management" ...>
    <CollapsibleSection 
      title="Favorites"
      icon={<Star className="w-4 h-4 text-yellow-400" />}
      defaultOpen={true}
    >
      {/* Favorites content */}
    </CollapsibleSection>
    
    <CollapsibleSection 
      title="Workflows"
      icon={<Workflow className="w-4 h-4 text-green-400" />}
      defaultOpen={true}  
    >
      {/* Workflows content */}
    </CollapsibleSection>
    
    <CollapsibleSection 
      title="Templates"
      icon={<FileText className="w-4 h-4 text-blue-400" />}
      defaultOpen={true}
    >
      {/* Templates content */}
    </CollapsibleSection>
    
    <CollapsibleSection 
      title="Snippets" 
      icon={<Layers className="w-4 h-4 text-purple-400" />}
      defaultOpen={true}
    >
      {/* Snippets content */}
    </CollapsibleSection>
  </WidgetContainer>
);
```

### Stap 6: Implementeer Item Cards per Sectie

**Componenten per sectie:**

```jsx
const ItemCard = ({ item, type, onExecute, onEdit, onDelete, onFavoriteToggle }) => {
  const getTypeColor = (type) => {
    switch (type) {
      case 'workflow': return 'bg-green-600 text-green-100';
      case 'template': return 'bg-blue-600 text-blue-100';
      case 'snippet': return 'bg-purple-600 text-purple-100';
      default: return 'bg-gray-600 text-gray-100';
    }
  };

  return (
    <div className="flex items-center gap-2 p-2 bg-gray-800 rounded border border-gray-700 hover:border-gray-600">
      <GripVertical className="w-4 h-4 text-gray-500 cursor-grab" />
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className={`px-2 py-1 text-xs rounded ${getTypeColor(type)}`}>
            {type}
          </span>
          <span className="text-sm font-medium text-gray-100 truncate">
            {item.name}
          </span>
        </div>
        {item.description && (
          <p className="text-xs text-gray-400 truncate">{item.description}</p>
        )}
      </div>
      
      <div className="flex gap-1">
        <button onClick={() => onExecute(item)} className="p-1 text-gray-400 hover:text-green-400">
          <Play className="w-4 h-4" />
        </button>
        <button onClick={() => onEdit(item)} className="p-1 text-gray-400 hover:text-blue-400">
          <Edit className="w-4 h-4" />
        </button>
        <button onClick={() => onFavoriteToggle(item)} className="p-1 text-gray-400 hover:text-yellow-400">
          <Star className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
```

### Stap 7: Update Homepage Integration

**Bestanden:** `src/components/dashboard/Homepage.jsx`

**Wijzigingen:**
```jsx
// Vervang RecentWidget import
import FolderManagementWidget from '../widgets/FolderManagementWidget.jsx';

// In JSX waar RecentWidget stond:
<FolderManagementWidget
  templates={filteredTemplates}
  workflows={filteredWorkflows}
  snippets={filteredSnippets}
  selectedFolderId={selectedFolderId}
  onExecuteItem={onExecuteItem}
  onEditTemplate={onEditTemplate}
  onEditWorkflow={onEditWorkflow}
  onEditSnippet={onEditSnippet}
  // ... andere props
/>
```

---

## FASE 3: DRAG-AND-DROP IMPLEMENTATION

### Stap 8: HTML5 Drag-and-Drop Setup

**In FolderManagementWidget.jsx:**

```jsx
const [draggedItem, setDraggedItem] = useState(null);
const [draggedFromSection, setDraggedFromSection] = useState(null);

const handleDragStart = (e, item, sectionType) => {
  setDraggedItem(item);
  setDraggedFromSection(sectionType);
  e.dataTransfer.effectAllowed = 'move';
};

const handleDragOver = (e) => {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
};

const handleDrop = (e, targetIndex, sectionType) => {
  e.preventDefault();
  
  if (!draggedItem || draggedFromSection !== sectionType) return;
  
  // Reorder logic hier
  reorderItems(draggedItem, targetIndex, sectionType);
  
  setDraggedItem(null);
  setDraggedFromSection(null);
};
```

### Stap 9: Reorder Logic per Sectie

**Implementeer reorderItems functie:**

```jsx
const reorderItems = (draggedItem, targetIndex, sectionType) => {
  let items, updateFunction;
  
  switch (sectionType) {
    case 'favorites':
      // Update favorite order
      break;
    case 'workflows':
      items = folderWorkflows;
      updateFunction = onUpdateWorkflow;
      break;
    case 'templates':
      items = folderTemplates; 
      updateFunction = onUpdateTemplate;
      break;
    case 'snippets':
      items = folderSnippets;
      updateFunction = onUpdateSnippet;
      break;
  }
  
  // Bereken nieuwe orders en update items
  const reorderedItems = [...items];
  const draggedIndex = items.findIndex(item => item.id === draggedItem.id);
  
  // Remove dragged item en insert op nieuwe positie
  reorderedItems.splice(draggedIndex, 1);
  reorderedItems.splice(targetIndex, 0, draggedItem);
  
  // Update order numbers
  reorderedItems.forEach((item, index) => {
    const updatedItem = updateItemFolderOrder(item, selectedFolderId, index);
    updateFunction(updatedItem);
  });
};
```

### Stap 10: Visual Feedback Implementation

**Drop zones en visual indicators:**

```jsx
const DropZone = ({ onDrop, index, sectionType, isActive }) => (
  <div 
    className={`h-2 border-2 border-dashed transition-colors ${
      isActive ? 'border-blue-400 bg-blue-400/10' : 'border-transparent'
    }`}
    onDragOver={handleDragOver}
    onDrop={(e) => handleDrop(e, index, sectionType)}
  />
);

// In ItemCard component styling tijdens drag:
const isDragging = draggedItem?.id === item.id;
const cardClasses = `... ${isDragging ? 'opacity-50 transform rotate-2' : ''}`;
```

---

## FASE 4: INTEGRATION & POLISH

### Stap 11: Widget Manager Integration

**Bestanden:** `src/components/widgets/WidgetManager.jsx`

**Update voor nieuwe widget:**
```jsx
// Import nieuwe widget
import FolderManagementWidget from './FolderManagementWidget.jsx';

// In widget registry:
const widgetComponents = {
  // ... andere widgets
  'folder-management': FolderManagementWidget,
};

// Default widgets configuration update
```

### Stap 12: Final Testing & Polish

**Testing checklist:**
- [ ] Drag-and-drop werkt per sectie
- [ ] Folder-specifieke favorites worden correct getoond
- [ ] Volgorde wordt opgeslagen en hersteld
- [ ] Execute/Edit/Delete buttons werken
- [ ] Responsive design
- [ ] Geen console errors
- [ ] Data migration werkt voor bestaande items

**Performance optimizations:**
- [ ] useMemo voor gefilterde lijsten
- [ ] useCallback voor event handlers  
- [ ] Debounce voor auto-save
- [ ] Virtual scrolling voor lange lijsten (optioneel)

---

## COMMIT STRATEGY

### Per stap committen:
1. **Stap 1-3:** "feat: Add folder-specific favorites data layer"
2. **Stap 4-5:** "feat: Create FolderManagementWidget with 4 sections" 
3. **Stap 6-7:** "feat: Implement item cards and homepage integration"
4. **Stap 8-10:** "feat: Add drag-and-drop reordering per section"
5. **Stap 11-12:** "feat: Complete folder favorites system with testing"

---

## ROLLBACK PLAN

Als er problemen zijn:
1. **Git reset** naar laatste werkende commit
2. **Backup files** zijn beschikbaar (`RecentWidget.backup.jsx`)
3. **Feature flags** kunnen worden toegevoegd voor gradual rollout
4. **Migration kan worden teruggedraaid** door oude data structure te behouden

---

## SUCCESS CRITERIA

✅ **Functionaliteit:**
- Folders hebben eigen favorites lijst
- 4 secties met eigen drag-and-drop
- Alle bestaande functionaliteit werkt

✅ **Performance:**  
- Geen merkbare vertraging
- Smooth drag-and-drop animaties
- Efficient re-renders

✅ **UX:**
- Intuitive interface
- Clear visual feedback  
- Responsive design

✅ **Code Quality:**
- Clean, maintainable code
- Proper error handling
- Comprehensive testing