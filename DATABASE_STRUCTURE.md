# Database Structure Documentation

Dit document beschrijft de complete database structuur voor het AirPrompts systeem.

## Overzicht

De database gebruikt SQLite met de volgende instellingen:
- Foreign keys: ON
- Journal mode: WAL (Write-Ahead Logging)
- Locatie: `server/database.db`

## Tabellen

### 1. templates
Bewaart prompt templates met variabelen.

```sql
CREATE TABLE templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  content TEXT NOT NULL,
  category TEXT NOT NULL,
  variables TEXT, -- JSON array van variabele namen
  favorite BOOLEAN DEFAULT FALSE,
  folder_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE SET NULL
)
```

### 2. workflows
Bewaart workflows die meerdere templates aan elkaar koppelen.

```sql
CREATE TABLE workflows (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  favorite BOOLEAN DEFAULT FALSE,
  folder_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE SET NULL
)
```

### 3. workflow_steps
Koppeltabel voor workflow stappen met volgorde.

```sql
CREATE TABLE workflow_steps (
  id TEXT PRIMARY KEY,
  workflow_id TEXT NOT NULL,
  template_id TEXT NOT NULL,
  step_order INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE CASCADE,
  FOREIGN KEY (template_id) REFERENCES templates(id) ON DELETE CASCADE,
  UNIQUE(workflow_id, step_order)
)
```

### 4. snippets
Bewaart code snippets en kleine herbruikbare teksten.

```sql
CREATE TABLE snippets (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT, -- Optioneel
  tags TEXT, -- JSON array van tags
  favorite BOOLEAN DEFAULT FALSE,
  folder_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE SET NULL
)
```

### 5. folders
Hiërarchische mappenstructuur voor organisatie.

```sql
CREATE TABLE folders (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  parent_id TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (parent_id) REFERENCES folders(id) ON DELETE CASCADE
)
```

### 6. item_folders
Many-to-many relatie tussen items en folders.

```sql
CREATE TABLE item_folders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  item_type TEXT NOT NULL, -- 'template', 'workflow', of 'snippet'
  item_id TEXT NOT NULL,
  folder_id TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE CASCADE,
  UNIQUE(item_type, item_id, folder_id)
)
```

### 7. folder_favorites
Map-specifieke favorieten met sorteervolgorde.

```sql
CREATE TABLE folder_favorites (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entity_type TEXT NOT NULL, -- 'template', 'workflow', of 'snippet'
  entity_id TEXT NOT NULL,
  folder_id TEXT NOT NULL,
  favorite_order INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE CASCADE,
  UNIQUE(entity_type, entity_id, folder_id)
)
```

### 8. usage_stats
Gebruiksstatistieken voor analytics.

```sql
CREATE TABLE usage_stats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entity_type TEXT NOT NULL, -- 'template' of 'workflow'
  entity_id TEXT NOT NULL,
  action TEXT NOT NULL, -- 'view', 'execute', 'edit', 'delete'
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
)
```

### 9. folder_ui_state
UI status van folders (ingeklapt/uitgeklapt).

```sql
CREATE TABLE folder_ui_state (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  folder_id TEXT NOT NULL,
  is_expanded BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE CASCADE,
  UNIQUE(folder_id)
)
```

### 10. header_ui_state
UI status van secties per folder.

```sql
CREATE TABLE header_ui_state (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  folder_id TEXT NOT NULL,
  header_type TEXT NOT NULL, -- 'templates', 'workflows', 'snippets', etc.
  is_expanded BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE CASCADE,
  UNIQUE(folder_id, header_type)
)
```

### 11. todos
Taken/todo items met prioriteit en status.

```sql
CREATE TABLE todos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'to_do' CHECK(status IN ('to_do', 'doing', 'done')),
  priority TEXT NOT NULL DEFAULT 'could' CHECK(priority IN ('critical', 'important', 'should', 'could', 'nice_to_have')),
  time_estimate TEXT CHECK(time_estimate IN ('1h', 'few_hours', 'day', 'days', 'week', 'weeks')),
  deadline DATETIME,
  deadline_type TEXT CHECK(deadline_type IN ('fixed', 'relative')),
  is_global BOOLEAN DEFAULT 0,
  folder_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  sort_order INTEGER DEFAULT 0,
  FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE CASCADE
)
```

### 12. todo_folders
Many-to-many relatie tussen todos en folders.

```sql
CREATE TABLE todo_folders (
  todo_id INTEGER NOT NULL,
  folder_id TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (todo_id, folder_id),
  FOREIGN KEY (todo_id) REFERENCES todos(id) ON DELETE CASCADE,
  FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE CASCADE
)
```

### 13. todo_ui_state
UI status van todos (ingeklapt/uitgeklapt).

```sql
CREATE TABLE todo_ui_state (
  todo_id INTEGER PRIMARY KEY,
  is_expanded BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (todo_id) REFERENCES todos(id) ON DELETE CASCADE
)
```

## Indexes

### Performance Indexes
- **Templates**: category, favorite, folder_id, updated_at
- **Workflows**: category, favorite, folder_id, updated_at
- **Workflow Steps**: workflow_id, (workflow_id + step_order)
- **Folders**: parent_id
- **Item Folders**: (item_type + item_id), folder_id
- **Folder Favorites**: (entity_type + entity_id), folder_id, (folder_id + entity_type)
- **Usage Stats**: (entity_type + entity_id), timestamp
- **Folder UI State**: folder_id
- **Header UI State**: folder_id, (folder_id + header_type)
- **Todos**: folder_id, status, priority, deadline, is_global, updated_at
- **Todo Folders**: todo_id, folder_id
- **Todo UI State**: todo_id

## Default Data

### Default Folders
Geladen uit `src/data/defaultFolders.json` bij eerste initialisatie.

## Relaties

1. **Templates/Workflows/Snippets → Folders**: Via folder_id (één-op-veel)
2. **Items → Multiple Folders**: Via item_folders tabel (veel-op-veel)
3. **Workflows → Templates**: Via workflow_steps met volgorde
4. **Folders → Parent Folders**: Self-referencing voor hiërarchie
5. **Items → Folder Favorites**: Voor map-specifieke favorieten
6. **Todos → Folders**: Zowel direct (folder_id) als many-to-many (todo_folders)

## Belangrijke Constraints

- Alle timestamps gebruiken SQLite's CURRENT_TIMESTAMP
- Foreign keys zijn geconfigureerd met CASCADE deletes waar nodig
- UNIQUE constraints voorkomen duplicaten in koppeltabellen
- CHECK constraints valideren enum waarden (status, priority, etc.)