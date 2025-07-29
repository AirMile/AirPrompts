# Todo System Implementation Plan

## Overzicht

Dit document beschrijft de implementatie van een todo systeem voor AirPrompts, met een collapsible sidebar aan de rechterkant van de interface.

## Fase 1: Basis Todo Sidebar

### Database Schema

#### Tabel: `todos`

```sql
CREATE TABLE todos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'to_do',
  priority TEXT NOT NULL DEFAULT 'could',
  time_estimate TEXT,
  deadline DATETIME,
  deadline_type TEXT, -- 'fixed' of 'relative'
  is_global BOOLEAN DEFAULT 0,
  folder_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  sort_order INTEGER DEFAULT 0,
  FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE CASCADE
);
```

#### Tabel: `todo_folders` (many-to-many)

```sql
CREATE TABLE todo_folders (
  todo_id INTEGER NOT NULL,
  folder_id INTEGER NOT NULL,
  PRIMARY KEY (todo_id, folder_id),
  FOREIGN KEY (todo_id) REFERENCES todos(id) ON DELETE CASCADE,
  FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE CASCADE
);
```

#### Tabel: `todo_ui_state`

```sql
CREATE TABLE todo_ui_state (
  todo_id INTEGER PRIMARY KEY,
  is_expanded BOOLEAN DEFAULT 0,
  FOREIGN KEY (todo_id) REFERENCES todos(id) ON DELETE CASCADE
);
```

### Status Opties

- **to_do** - Nog te doen
- **doing** - Mee bezig
- **done** - Afgerond

### Prioriteit Opties (met kleuren)

- **critical** - Kritiek (rood #ef4444)
- **important** - Belangrijk (oranje #f97316)
- **should** - Zou moeten (geel #eab308)
- **could** - Zou kunnen (groen #22c55e)
- **nice_to_have** - Leuk om te hebben (grijs #6b7280)

### Tijd Schattingen

- `1h` - 1 uur
- `few_hours` - Paar uur
- `day` - 1 dag
- `days` - Meerdere dagen
- `week` - 1 week
- `weeks` - Meerdere weken

### API Endpoints

#### GET /api/todos

- Query parameters:
  - `folder_id` - Filter op folder (null voor globale todos)
  - `status` - Filter op status
  - `priority` - Filter op prioriteit
- Response: Array van todos met folder info

#### POST /api/todos

- Body: todo object
- Response: Nieuwe todo

#### PUT /api/todos/:id

- Body: Updated todo fields
- Response: Geüpdatete todo

#### DELETE /api/todos/:id

- Response: Success message

#### PATCH /api/todos/:id/status

- Body: { status: 'new_status' }
- Response: Geüpdatete todo

#### PATCH /api/todos/batch-sort-order

- Body: { updates: [{ id, sort_order }] }
- Response: Success message

### Frontend Components

#### 1. CollapsibleTodoSidebar.jsx

```jsx
// Hoofdcomponent voor de todo sidebar
// Features:
// - Toggle open/dicht
// - Filter op huidige folder + globale todos
// - Groepering op status
// - Sorteer opties
```

#### 2. TodoItem.jsx

```jsx
// Individuele todo weergave
// Features:
// - Prioriteit kleur indicator
// - Status checkbox
// - Tijd/deadline badges
// - Hover acties (edit, delete)
// - Click voor details/edit
```

#### 3. TodoModal.jsx

```jsx
// Modal voor aanmaken/bewerken todos
// Features:
// - Alle todo velden
// - Folder selector (multi-select)
// - Prioriteit selector met kleuren
// - Deadline picker (vast of relatief)
```

#### 4. TodoFilters.jsx

```jsx
// Filter component
// Features:
// - Status filter
// - Prioriteit filter
// - Deadline range
// - Zoek in titel/beschrijving
```

### React Query Hooks

#### useTodosQuery

```js
// Haalt todos op voor huidige folder + globale todos
// Cached per folder_id
// Refetch on folder change
```

#### useTodoMutations

```js
// Mutations voor:
// - createTodo
// - updateTodo
// - deleteTodo
// - updateTodoStatus
// - batchUpdateSortOrder
```

### UI Integratie

1. **Layout aanpassing**:
   - Rechter sidebar toevoegen naast main content
   - Toggle knop in header
   - Responsive: verberg op kleine schermen

2. **Folder integratie**:
   - Badge met open todo count per folder
   - Automatisch filter op geselecteerde folder
   - Optie voor "toon alle todos"

3. **Homepage widget**:
   - Today's todos
   - This week overview
   - Overdue items

## Fase 2: Uitbreidingen (Toekomst)

### Kanban View

- Kolommen voor verschillende statussen
- Drag & drop tussen kolommen
- WIP limits per kolom

### Geavanceerde Features

- Subtasks
- Recurring todos
- Tags/labels
- Attachments
- Comments/notes
- Time tracking
- Notifications

### Integraties

- Calendar sync
- Export naar andere todo apps
- API voor externe tools
- Mobile app support

## Best Practices

### Performance

- Virtual scrolling voor lange lijsten
- Optimistic updates
- Debounce search/filters
- Lazy load todo details

### UX

- Keyboard shortcuts (space voor toggle, del voor delete)
- Undo functionaliteit
- Bulk acties
- Quick add met parsing (bijv. "Meeting morgen om 15:00 !important")

### Code Organisatie

- Hergebruik folder tree patterns
- Consistent met bestaande architectuur
- TypeScript types voor todos
- Uitgebreide error handling
