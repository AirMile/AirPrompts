# 🧠 Architecture Analysis: Ultra Think

## 🎯 Problem Definition

### User's Original Question

> "Snippets moet worden veranderd. Snippets is momenteel te breed. Voor snippets heb ik nu meerdere use cases:
>
> 1. Context files kunnen uploaden
> 2. Prompts kunnen bewaren
> 3. Addons maken die je bij een workflow template of snippet kan toevoegen
>
> Denk je dat dit in 3 aparte systemen moet of kan dit in alleen snippet systeem?"

### Deep Analysis Process

#### 🔍 Step 1: Current System Understanding

**Bestaande Entiteiten:**

- **Templates** (`src/components/templates/`): Herbruikbare tekst met `{variable}` syntax
- **Snippets** (`src/components/snippets/`): Herbruikbare tekst met `{{tag}}` syntax
- **Workflows** (`src/components/workflows/`): Ketening van templates en snippets

**Code Evidence:**

```javascript
// Uit template.types.js:25
export const extractVariables = (content) => {
  const matches = cleanContent.match(/\{([^}]+)\}/g);
  return [...new Set(matches.map((match) => match.slice(1, -1)))];
};

// Uit template.types.js:8
export const extractSnippetVariables = (content) => {
  const snippetMatches = content.match(/\{\{([^}]+)\}\}/g);
  return snippetMatches
    ? snippetMatches.map((match) => {
        const tag = match.match(/\{\{([^}]+)\}\}/)[1];
        return { type: 'snippet', tag, placeholder: match };
      })
    : [];
};
```

**Gemeenschappelijke Patronen:**

- Beide hebben `folders`, `favorites`, `tags`
- Beide hebben `content`, `name`, `description`
- Beide hebben `createdAt`, `updatedAt`, `lastUsed`
- Overal in code: `templates, workflows, snippets` als trio

#### 🔍 Step 2: Use Case Analysis

**1. Context Files Uploaden**

- **Aard**: File management + metadata
- **Verschil met tekst**: Binary data, MIME types, storage, security
- **UI Requirements**: File browser, previews, drag & drop
- **Storage**: Filesystem i.p.v. database text

**2. Prompts Bewaren**

- **Aard**: Statische tekst content
- **Gelijkenis met**: Snippets (maar zonder `{{tags}}`)
- **Verschil met Templates**: Geen `{variables}`
- **Conclusie**: Dit is gewoon een Template zonder variabelen!

**3. Addons Maken**

- **Aard**: Plugin/extensie functionaliteit
- **Cross-cutting**: Kan aan alle entiteiten gekoppeld worden
- **Lifecycle**: Enable/disable, versioning
- **Architecture Pattern**: Plugin system

#### 🔍 Step 3: Core Insight Discovery

**Kritieke Realisatie:**

> Templates en Snippets zijn BEIDE gewoon **herbruikbare tekst content**. Het enige verschil is de syntax voor variabelen: `{var}` vs `{{tag}}` vs geen variabelen.

**Evidence uit Codebase:**

```javascript
// Overal in de code wordt dit patroon herhaald:
const allItems = [...templates, ...workflows, ...snippets];

// UI rendering:
['favorites', 'workflows', 'templates', 'snippets'].forEach((section) => {
  // Behandel elk type apart, maar met duplicated logic
});
```

#### 🔍 Step 4: Architecture Decision

**Aanbeveling: HYBRIDE ARCHITECTUUR**

1. **Context Files** → **APART SYSTEEM**
   - Reden: Fundamenteel andere data type (files vs text)
   - Andere security, storage, UI requirements

2. **Prompts Bewaren** → **INTEGREER MET TEMPLATES**
   - Reden: Template zonder variabelen = Prompt zonder variabelen
   - Elimineer onnodige duplicatie

3. **Templates + Snippets** → **UNIFIED PROMPTS SYSTEEM**
   - Reden: Beide zijn herbruikbare tekst content
   - Variable detection wordt optioneel

4. **Addons** → **APART PLUGIN SYSTEEM**
   - Reden: Cross-cutting concern, eigen lifecycle
   - Kan koppelen aan alle andere entiteiten

## 🏗️ Proposed New Architecture

### Unified Content Model

```mermaid
graph TB
    subgraph "🆕 Prompts System"
        A[Prompt Entity]
        A --> B[content: string]
        A --> C[variables: string[] - optional]
        A --> D[tags: string[]]
        A --> E[metadata: object]
    end

    subgraph "🆕 Context Files System"
        F[ContextFile Entity]
        F --> G[file_path: string]
        F --> H[mime_type: string]
        F --> I[metadata: object]
        F --> J[associations: PromptId[]]
    end

    subgraph "🆕 Addons System"
        K[Addon Entity]
        K --> L[plugin_code: string]
        K --> M[enabled: boolean]
        K --> N[attachments: EntityRef[]]
    end
```

### Data Migration Strategy

```javascript
// Migration logic:
const migrateToUnifiedPrompts = (templates, snippets) => {
  const prompts = [
    // Templates → Prompts (met variabelen)
    ...templates.map((template) => ({
      ...template,
      type: 'prompt',
      variables: extractVariables(template.content),
      hasVariables: extractVariables(template.content).length > 0,
    })),

    // Snippets → Prompts (zonder variabelen)
    ...snippets.map((snippet) => ({
      ...snippet,
      type: 'prompt',
      variables: [],
      hasVariables: false,
      content: snippet.content, // Remove {{tag}} processing
    })),
  ];

  return prompts;
};
```

## 🎨 UI/UX Implications

### Before (Verwarrend)

```
📁 Templates (met {variables})
📁 Snippets (met {{tags}})
📁 Workflows
```

### After (Duidelijk)

```
📁 Prompts (met of zonder variabelen)
   📄 Filter: "With Variables" / "Static Text" / "All"
📁 Workflows
📁 Context Files
📁 Addons
```

### Component Unification

```javascript
// Voor: Aparte editors
<TemplateEditor />
<SnippetEditor />

// Na: Unified editor
<PromptEditor
  detectVariables={true}
  showVariableControls={prompt.hasVariables}
/>
```

## ⚡ Technical Benefits

### Code Simplification

- **Elimineer duplicatie**: Geen aparte template/snippet handling
- **Unified patterns**: Één component set i.p.v. twee
- **Simplified state**: Één prompts array i.p.v. templates + snippets

### Performance Gains

- **Reduced bundle size**: Minder duplicate components
- **Simplified queries**: `usePrompts()` i.p.v. `useTemplates() + useSnippets()`
- **Better caching**: Unified data model

### Developer Experience

- **Intuitive mental model**: "Prompts" is universeel begrip
- **Consistent patterns**: Alle content volgt zelfde structuur
- **Easier testing**: Minder edge cases door unificatie

## 🚨 Risks & Mitigation

### Migration Risks

- **Data loss tijdens migratie**
  - _Mitigation_: Extensive backup + rollback strategy
- **Breaking changes voor gebruikers**
  - _Mitigation_: Gefaseerde uitrol met backward compatibility

### UI/UX Risks

- **Gebruikers verwachten aparte systemen**
  - _Mitigation_: Filters en views om oude workflow te ondersteunen
- **Variable detection kan falen**
  - _Mitigation_: Manual override + validation

### Technical Risks

- **Complex migration scripts**
  - _Mitigation_: Thorough testing + staged deployment

## 🎯 Success Criteria

### Quantitative Goals

- [ ] **30% code reduction** in template/snippet handling
- [ ] **50% faster onboarding** (user tests)
- [ ] **Zero data loss** during migration
- [ ] **100% backward compatibility** tijdens transitie

### Qualitative Goals

- [ ] **Intuitive user experience** - "Prompts" concept is duidelijk
- [ ] **Flexible content creation** - Variable gebruik is optioneel
- [ ] **Extensible architecture** - Plugin system voor future features
- [ ] **Maintainable codebase** - Minder duplicatie, consistent patterns

## 🔄 Next Steps

1. **Validate Architecture** - Review met team en stakeholders
2. **Prototype Migration** - Proof of concept voor data migration
3. **Design UI Mockups** - Unified prompts interface design
4. **Create Implementation Plan** - Detailed phase-by-phase approach
5. **Risk Assessment** - Deeper dive into migration risks

---

**Analysis Date**: 2025-01-29  
**Analysis Type**: Ultra Think (Deep Architectural Analysis)  
**Recommendation**: Proceed with Hybrid Architecture - Unified Prompts + Separate Context Files + Plugin System
