# 🔀 Prompts Unification: Templates + Snippets

## 📋 Overview

De kern van deze herstructurering: **Templates en Snippets samenvoegen tot één "Prompts" systeem**. Dit elimineert onnodige complexiteit en duplicatie terwijl alle functionaliteit behouden blijft.

## 🎯 Current State Analysis

### Templates System

```javascript
// Template structure (src/types/template.types.js:57)
const template = {
  id: 'template-123',
  name: 'Code Review Template',
  description: 'Template for code reviews',
  content: 'Please review this {language} code: {code}',
  variables: ['language', 'code'], // Auto-extracted from {variable} syntax
  folderId: 'development',
  tags: ['review', 'code'],
  // ... metadata
};
```

### Snippets System

```javascript
// Snippet structure (src/types/template.types.js:231)
const snippet = {
  id: 'snippet-456',
  name: 'Git Commit Message',
  description: 'Standard commit message format',
  content: 'feat: add new functionality for user authentication',
  tags: ['git', 'commit'], // Used for {{tag}} replacement
  folderId: 'development',
  // ... metadata
};
```

### Key Observation

> **Beide zijn fundamenteel herbruikbare tekst content met metadata**

## 💡 Unified Prompts Model

### New Prompt Structure

```javascript
// Unified Prompt entity
const prompt = {
  id: 'prompt-789',
  name: 'Code Review Helper',
  description: 'Helps with code reviews',
  content: 'Please review this {language} code: {code}',

  // 🆕 Variable detection becomes optional/automatic
  variables: ['language', 'code'], // Auto-detected from content
  hasVariables: true, // Computed property

  // 🆕 Unified metadata
  tags: ['review', 'code', 'development'],
  folderId: 'development',

  // 🆕 Source tracking (for migration)
  migratedFrom: 'template', // "template" | "snippet" | null

  // Existing metadata
  favorite: false,
  folderFavorites: {},
  folderOrder: {},
  createdAt: '2025-01-29T00:00:00.000Z',
  updatedAt: '2025-01-29T00:00:00.000Z',
};
```

## 🔄 Migration Strategy

### Data Migration Logic

```javascript
const migrateToPrompts = async (templates, snippets) => {
  const prompts = [];

  // Migrate Templates → Prompts (with variables)
  templates.forEach((template) => {
    prompts.push({
      ...template,
      // Keep existing structure, add new fields
      variables: template.variables || extractVariables(template.content),
      hasVariables: (template.variables || extractVariables(template.content)).length > 0,
      migratedFrom: 'template',
      // Keep all existing metadata
    });
  });

  // Migrate Snippets → Prompts (without variables)
  snippets.forEach((snippet) => {
    prompts.push({
      ...snippet,
      // Convert snippet structure to prompt structure
      variables: [], // Snippets don't have variables
      hasVariables: false,
      migratedFrom: 'snippet',
      // Map snippet fields to prompt fields
      content: snippet.content,
      tags: snippet.tags || [],
    });
  });

  return prompts;
};
```

### Variable Detection Enhancement

```javascript
// Enhanced variable detection (src/types/template.types.js)
export const detectPromptFeatures = (content) => {
  return {
    // Existing {variable} detection
    variables: extractVariables(content),

    // Legacy {{snippet}} detection (for backward compatibility)
    snippetTags: extractSnippetVariables(content),

    // New computed properties
    hasVariables: extractVariables(content).length > 0,
    hasSnippetTags: extractSnippetVariables(content).length > 0,

    // Content classification
    contentType: classifyContent(content),
    complexity: calculateComplexity(content),
  };
};
```

## 🎨 UI/UX Changes

### Before: Separate Sections

```jsx
// Current Dashboard structure
<DashboardSection title="Templates">
  {templates.map(template => <TemplateCard />)}
</DashboardSection>

<DashboardSection title="Snippets">
  {snippets.map(snippet => <SnippetCard />)}
</DashboardSection>
```

### After: Unified Prompts Section

```jsx
// New unified structure
<DashboardSection title="Prompts">
  <PromptFilters
    showWithVariables={filters.withVariables}
    showStaticText={filters.staticText}
    showAll={filters.all}
  />

  {filteredPrompts.map((prompt) => (
    <PromptCard
      prompt={prompt}
      showVariableIndicator={prompt.hasVariables}
      showMigrationBadge={prompt.migratedFrom}
    />
  ))}
</DashboardSection>
```

### Unified Editor Component

```jsx
// Replace TemplateEditor + SnippetEditor
const PromptEditor = ({ prompt, onSave, onCancel }) => {
  const [content, setContent] = useState(prompt?.content || '');
  const detectedFeatures = useMemo(() => detectPromptFeatures(content), [content]);

  return (
    <EditorLayout>
      <PromptMetadata prompt={prompt} />

      <ContentEditor
        value={content}
        onChange={setContent}
        placeholder="Enter your prompt content..."
      />

      {/* Show variable controls only when variables detected */}
      {detectedFeatures.hasVariables && <VariableControls variables={detectedFeatures.variables} />}

      {/* Show migration info for legacy items */}
      {prompt?.migratedFrom && <MigrationInfo source={prompt.migratedFrom} />}

      <EditorActions onSave={onSave} onCancel={onCancel} />
    </EditorLayout>
  );
};
```

## 🗄️ Database Schema Changes

### New Prompts Table

```sql
-- Replace both templates and snippets tables
CREATE TABLE prompts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  content TEXT NOT NULL,

  -- Variable handling
  variables JSON DEFAULT '[]', -- Array of variable names
  has_variables BOOLEAN GENERATED ALWAYS AS (json_array_length(variables) > 0),

  -- Metadata
  tags JSON DEFAULT '[]',
  folder_id TEXT,

  -- Migration tracking
  migrated_from TEXT CHECK (migrated_from IN ('template', 'snippet')),
  legacy_id TEXT, -- Original template/snippet ID for rollback

  -- Existing metadata
  favorite BOOLEAN DEFAULT FALSE,
  folder_favorites JSON DEFAULT '{}',
  folder_order JSON DEFAULT '{}',

  -- Timestamps
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_used DATETIME
);

-- Indexes for performance
CREATE INDEX idx_prompts_folder ON prompts(folder_id);
CREATE INDEX idx_prompts_variables ON prompts(has_variables);
CREATE INDEX idx_prompts_migration ON prompts(migrated_from);
```

### Migration Script

```sql
-- Migration script
INSERT INTO prompts (
  id, name, description, content, variables, tags, folder_id,
  migrated_from, legacy_id, favorite, folder_favorites, folder_order,
  created_at, updated_at, last_used
)
-- Migrate templates
SELECT
  'prompt_' || id as id,
  name, description, content,
  COALESCE(variables, '[]') as variables,
  COALESCE(snippet_tags, '[]') as tags,
  folder_id,
  'template' as migrated_from,
  id as legacy_id,
  favorite, folder_favorites, folder_order,
  created_at, updated_at, last_used
FROM templates

UNION ALL

-- Migrate snippets
SELECT
  'prompt_' || id as id,
  name, description, content,
  '[]' as variables, -- Snippets don't have variables
  COALESCE(tags, '[]') as tags,
  folder_id,
  'snippet' as migrated_from,
  id as legacy_id,
  favorite, folder_favorites, folder_order,
  created_at, updated_at, last_used
FROM snippets;
```

## 🔌 API Changes

### New Unified Endpoints

```javascript
// Replace /api/templates and /api/snippets
// GET /api/prompts
app.get('/api/prompts', async (req, res) => {
  const { withVariables, staticOnly, migratedFrom } = req.query;

  let query = 'SELECT * FROM prompts WHERE 1=1';
  const params = [];

  if (withVariables === 'true') {
    query += ' AND has_variables = true';
  } else if (staticOnly === 'true') {
    query += ' AND has_variables = false';
  }

  if (migratedFrom) {
    query += ' AND migrated_from = ?';
    params.push(migratedFrom);
  }

  const prompts = await db.all(query, params);
  res.json(prompts);
});

// POST /api/prompts - Create new prompt
app.post('/api/prompts', async (req, res) => {
  const promptData = req.body;

  // Auto-detect variables from content
  const detectedFeatures = detectPromptFeatures(promptData.content);

  const prompt = {
    ...promptData,
    id: generateId(),
    variables: detectedFeatures.variables,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  await db.run('INSERT INTO prompts (...) VALUES (...)', Object.values(prompt));

  res.json(prompt);
});
```

### Legacy API Compatibility

```javascript
// Maintain backward compatibility during transition
// GET /api/templates (deprecated, but functional)
app.get('/api/templates', async (req, res) => {
  const prompts = await db.all(
    'SELECT * FROM prompts WHERE migrated_from = "template" OR has_variables = true'
  );

  // Transform to legacy template format
  const templates = prompts.map((prompt) => ({
    ...prompt,
    // Legacy field mapping
  }));

  res.json(templates);
});

// GET /api/snippets (deprecated, but functional)
app.get('/api/snippets', async (req, res) => {
  const prompts = await db.all(
    'SELECT * FROM prompts WHERE migrated_from = "snippet" OR has_variables = false'
  );

  // Transform to legacy snippet format
  const snippets = prompts.map((prompt) => ({
    ...prompt,
    // Legacy field mapping
  }));

  res.json(snippets);
});
```

## 🧪 Testing Strategy

### Migration Tests

```javascript
describe('Prompts Migration', () => {
  test('templates migrate to prompts with variables', async () => {
    const template = {
      id: 'template-1',
      name: 'Test Template',
      content: 'Hello {name}, welcome to {place}!',
      variables: ['name', 'place'],
    };

    const prompt = await migrateTemplate(template);

    expect(prompt.hasVariables).toBe(true);
    expect(prompt.variables).toEqual(['name', 'place']);
    expect(prompt.migratedFrom).toBe('template');
  });

  test('snippets migrate to prompts without variables', async () => {
    const snippet = {
      id: 'snippet-1',
      name: 'Test Snippet',
      content: 'Static text content',
      tags: ['test'],
    };

    const prompt = await migrateSnippet(snippet);

    expect(prompt.hasVariables).toBe(false);
    expect(prompt.variables).toEqual([]);
    expect(prompt.migratedFrom).toBe('snippet');
  });
});
```

### UI Integration Tests

```javascript
describe('Unified Prompts UI', () => {
  test('filters work correctly', () => {
    render(<PromptsSection prompts={testPrompts} />);

    // Test variable filter
    fireEvent.click(screen.getByText('With Variables'));
    expect(screen.queryByText('Static Prompt')).not.toBeInTheDocument();
    expect(screen.getByText('Variable Prompt')).toBeInTheDocument();

    // Test static filter
    fireEvent.click(screen.getByText('Static Text'));
    expect(screen.getByText('Static Prompt')).toBeInTheDocument();
    expect(screen.queryByText('Variable Prompt')).not.toBeInTheDocument();
  });
});
```

## 📊 Success Metrics

### Code Reduction

- [ ] **Remove duplicate components**: TemplateEditor + SnippetEditor → PromptEditor
- [ ] **Unified data handling**: Single prompts array instead of templates + snippets
- [ ] **Simplified state management**: One set of CRUD operations

### User Experience

- [ ] **Intuitive categorization**: "Prompts" is universally understood concept
- [ ] **Flexible usage**: Variables optional, not required
- [ ] **Smooth migration**: No learning curve for existing users

### Performance

- [ ] **Faster queries**: Single table instead of joins
- [ ] **Better caching**: Unified data model
- [ ] **Reduced bundle**: Less duplicate code

## 🚀 Rollback Plan

### Data Rollback

```sql
-- Restore original tables from migrated data
INSERT INTO templates SELECT
  legacy_id as id, name, description, content, variables,
  folder_id, favorite, created_at, updated_at
FROM prompts WHERE migrated_from = 'template';

INSERT INTO snippets SELECT
  legacy_id as id, name, description, content, tags,
  folder_id, favorite, created_at, updated_at
FROM prompts WHERE migrated_from = 'snippet';
```

### Code Rollback

- Feature flags to switch between old/new UI
- Keep legacy components during transition period
- API versioning for backward compatibility

---

**Next Steps**:

1. Review and approve unified model
2. Create detailed migration scripts
3. Implement unified components
4. Test with subset of data
5. Plan rollout strategy
