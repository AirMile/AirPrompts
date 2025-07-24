# Obsidian-achtige Markdown Editor Implementatie

## 🎯 Doel
Vervang de huidige textarea-based folder description editor met een Gravity UI Markdown Editor die zich gedraagt zoals Obsidian's visual mode - waar je direct in gerenderde markdown kunt typen en bewerken.

## 🔍 Onderzoek Resultaten

### Waarom Gravity UI Markdown Editor?

Na uitgebreid onderzoek van beide opties:

**🏆 Gravity UI Markdown Editor (Trust Score: 9.3)**
- ✅ **Echte WYSIWYG mode** - Type direct in gerenderde markdown
- ✅ **Live rendering** - Bullet points, headers, links verschijnen instant
- ✅ **In-place editing** - Klik en bewerk direct zoals Obsidian
- ✅ **ProseMirror-based** - Professionele foundation
- ✅ **Enterprise-grade** - Gebruikt door Yandex/Gravity UI
- ✅ **Extensible** - Volledig aanpasbaar

**🥈 React MD Editor (Trust Score: 9.9)**
- ❌ **Split-screen focused** - Meer traditioneel edit + preview
- ❌ **Minder Obsidian-achtig** - Niet echt in-place editing
- ✅ **Eenvoudiger te implementeren** - Maar minder geavanceerd

**Conclusie: Gravity UI komt het dichtst bij Obsidian's visuele modus.**

## 📦 Fase 1: Dependencies & Setup

### 1.1 Installeer Dependencies
```bash
npm install @gravity-ui/markdown-editor
npm install @gravity-ui/uikit  # Required peer dependency
```

### 1.2 Vite Configuration Updates
Mogelijk nodig voor ProseMirror/CodeMirror compatibiliteit:

```javascript
// vite.config.js
export default defineConfig({
  // ... existing config
  define: {
    global: 'globalThis',
  },
  resolve: {
    alias: {
      // Mogelijk nodig voor Node.js modules
      stream: 'stream-browserify',
      util: 'util',
    }
  }
})
```

## 🔧 Fase 2: Component Implementatie

### 2.1 Vervang FolderDescription.jsx

**Huidige structuur behouden:**
- Toggle functionaliteit (potlood ↔ oog icoon)
- Auto-save met debouncing
- Styling consistency
- Error handling

**Nieuwe implementatie outline:**

```jsx
import React, { useState, useEffect, useRef } from 'react';
import { useMarkdownEditor, MarkdownEditorView } from '@gravity-ui/markdown-editor';
import { configure } from '@gravity-ui/markdown-editor';

// Configure Dutch language (optioneel)
configure({
  lang: 'nl', // Als beschikbaar
});

const FolderDescription = ({ folder, onUpdateDescription, isUpdating = false }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState(null);
  const saveTimeoutRef = useRef(null);

  // Gravity UI Editor Setup
  const editor = useMarkdownEditor({
    initialEditorMode: 'wysiwyg', // 🔥 Dit is de key voor Obsidian-achtige ervaring
    initialToolbarVisible: false, // We gebruiken onze eigen toggle
    allowHTML: false,
    md: {
      html: false,
      breaks: true,
      linkify: true,
    },
  });

  // Auto-save functionaliteit
  const handleAutoSave = async (value) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = setTimeout(async () => {
      if (value !== folder?.description) {
        try {
          await onUpdateDescription(folder.id, value);
          setError(null);
        } catch (error) {
          setError('Auto-opslaan mislukt');
        }
      }
    }, 500);
  };

  // Editor value change handler
  React.useEffect(() => {
    const unsubscribe = editor.on('change', ({ getValue }) => {
      const currentValue = getValue();
      handleAutoSave(currentValue);
    });

    return () => {
      unsubscribe();
    };
  }, [editor, folder?.id]);

  // Set initial value
  React.useEffect(() => {
    if (folder?.description && editor) {
      editor.setValue(folder.description);
    }
  }, [folder?.description, editor]);

  const toggleEditMode = () => {
    if (isEditing) {
      // Save before switching to view mode
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      const currentValue = editor.getValue();
      if (currentValue !== folder?.description) {
        onUpdateDescription(folder.id, currentValue);
      }
      setIsEditing(false);
    } else {
      setIsEditing(true);
      setIsExpanded(true);
      setError(null);
    }
  };

  const hasDescription = folder?.description?.trim();

  if (!folder || folder.id === 'root') {
    return null;
  }

  return (
    <div className="border border-gray-200/30 dark:border-gray-700/30 bg-white dark:bg-gray-900 rounded-lg mb-4 sm:mb-6 transition-all duration-200 ease-in-out">
      {/* Header - blijft hetzelfde */}
      <div className="flex items-center justify-between p-3 sm:p-4">
        <button
          onClick={hasDescription ? () => setIsExpanded(!isExpanded) : () => setIsEditing(true)}
          className="flex items-center gap-2 text-lg font-medium text-secondary-900 dark:text-secondary-100 hover:text-gray-900 dark:hover:text-gray-100 transition-colors w-full sm:w-auto text-left"
        >
          {hasDescription && (
            isExpanded ? (
              <ChevronDownIcon className="w-4 h-4 transition-transform duration-200" />
            ) : (
              <ChevronRightIcon className="w-4 h-4 transition-transform duration-200" />
            )
          )}
          Context
        </button>
        
        <button
          onClick={hasDescription ? toggleEditMode : () => setIsEditing(true)}
          className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          title={isEditing ? "Terug naar weergave" : hasDescription ? "Bewerken" : "Context toevoegen"}
        >
          {isEditing ? (
            <EyeIcon className="w-4 h-4" />
          ) : hasDescription ? (
            <PencilIcon className="w-4 h-4" />
          ) : (
            <PlusIcon className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Content */}
      <div className={`overflow-hidden transition-all duration-200 ease-in-out ${isExpanded ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="px-3 sm:px-4 pb-3 sm:pb-4">
          {error && (
            <div className="mb-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}
          
          {isEditing ? (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg">
              {/* 🔥 Hier komt de Gravity UI Editor */}
              <MarkdownEditorView 
                editor={editor}
                className="markdown-editor-custom"
              />
            </div>
          ) : hasDescription ? (
            <div className="p-3 sm:p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <MarkdownRenderer content={folder.description} />
            </div>
          ) : (
            <div className="p-3 sm:p-4 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
              <p className="text-gray-500 dark:text-gray-400 mb-2">Geen beschrijving toegevoegd voor deze folder</p>
              <button
                onClick={() => setIsEditing(true)}
                className="text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 text-sm font-medium transition-colors"
              >
                Voeg context toe
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FolderDescription;
```

## 🎨 Fase 3: Styling Integratie

### 3.1 Custom CSS voor Editor

Maak een nieuwe CSS file: `src/styles/markdown-editor.css`

```css
/* Gravity UI Markdown Editor Custom Styling */
.markdown-editor-custom {
  /* Override Gravity UI styling om te matchen met jouw design */
  --md-editor-background: rgb(249 250 251); /* gray-50 */
  --md-editor-background-dark: rgb(17 24 39); /* gray-800 */
  
  border: none !important;
  background: transparent !important;
}

.markdown-editor-custom .ProseMirror {
  /* Editor content styling */
  padding: 0.75rem 1rem !important;
  border: none !important;
  outline: none !important;
  background: transparent !important;
  
  /* Match jouw tekst styling */
  font-size: 0.875rem !important;
  line-height: 1.25rem !important;
  color: rgb(55 65 81) !important; /* gray-700 */
}

.dark .markdown-editor-custom .ProseMirror {
  color: rgb(209 213 219) !important; /* gray-300 */
}

/* Hide toolbar since we use our own toggle */
.markdown-editor-custom .g-md-editor-toolbar {
  display: none !important;
}

/* Bullet points styling */
.markdown-editor-custom .ProseMirror ul {
  margin-left: 1rem !important;
  list-style-type: disc !important;
}

.markdown-editor-custom .ProseMirror ol {
  margin-left: 1rem !important;
  list-style-type: decimal !important;
}

/* Headers styling */
.markdown-editor-custom .ProseMirror h1,
.markdown-editor-custom .ProseMirror h2,
.markdown-editor-custom .ProseMirror h3 {
  font-weight: 600 !important;
  margin: 0.5rem 0 !important;
}

.markdown-editor-custom .ProseMirror h1 { font-size: 1.5rem !important; }
.markdown-editor-custom .ProseMirror h2 { font-size: 1.25rem !important; }
.markdown-editor-custom .ProseMirror h3 { font-size: 1.125rem !important; }

/* Links styling */
.markdown-editor-custom .ProseMirror a {
  color: rgb(59 130 246) !important; /* blue-500 */
  text-decoration: underline !important;
}

.dark .markdown-editor-custom .ProseMirror a {
  color: rgb(96 165 250) !important; /* blue-400 */
}
```

### 3.2 Import CSS in main file

```javascript
// In je main.jsx of App.jsx
import './styles/markdown-editor.css'
```

## ⚡ Fase 4: Advanced Features (Optioneel)

### 4.1 Custom Extensions
Als je specifieke functionaliteit wilt toevoegen:

```javascript
// Custom extension voorbeeld
const customExtension = (builder) => {
  builder.use(/* custom plugin */, {
    // configuratie
  });
};

const editor = useMarkdownEditor({
  initialEditorMode: 'wysiwyg',
  extraExtensions: customExtension,
  // ... andere config
});
```

### 4.2 Keyboard Shortcuts
```javascript
const editor = useMarkdownEditor({
  // ... andere config
  extensionOptions: {
    // Custom keyboard shortcuts
  }
});
```

## 🎯 Verwacht Eindresultaat

Na implementatie krijg je:

### ✅ **Obsidian-achtige Features**
- **Live typing**: Type `# Header` → zie direct een echte header
- **Bullet points**: Type `- item` → zie direct bullet points  
- **Links**: Type `[text](url)` → zie direct klikbare links
- **In-place editing**: Klik op tekst en bewerk direct

### ✅ **Behouden Functionaliteit**
- Toggle tussen edit/view modes (potlood/oog icoon)
- Auto-save na 500ms geen typing
- Error handling en feedback
- Dark mode support
- Mobile responsive
- Consistent styling met rest van app

### ✅ **Verbeterde User Experience**
- **Geen context switching** - je blijft in dezelfde visuele modus
- **WYSIWYG feedback** - zie direct wat je krijgt
- **Professional feel** - zoals Obsidian, Notion, etc.

## 🐛 Mogelijke Issues & Oplossingen

### Issue 1: Bundle Size
**Probleem**: Gravity UI is groter dan huidige textarea
**Oplossing**: Lazy loading van editor component

```javascript
const MarkdownEditor = lazy(() => import('./MarkdownEditor'));
```

### Issue 2: SSR Issues
**Probleem**: ProseMirror werkt niet met SSR
**Oplossing**: Client-side only rendering

```javascript
const [mounted, setMounted] = useState(false);
useEffect(() => setMounted(true), []);

if (!mounted) return <div>Loading...</div>;
```

### Issue 3: Styling Conflicts
**Probleem**: Gravity UI CSS conflicteert met Tailwind
**Oplossing**: CSS specificity en !important waar nodig

## 📝 Implementatie Checklist

- [ ] **Fase 1**: Dependencies installeren
- [ ] **Fase 1**: Vite config updaten (indien nodig)
- [ ] **Fase 2**: FolderDescription.jsx vervangen
- [ ] **Fase 2**: Auto-save logica implementeren
- [ ] **Fase 3**: Custom CSS maken en importeren
- [ ] **Fase 3**: Dark mode styling testen
- [ ] **Fase 4**: Edge cases testen (lege content, lange content)
- [ ] **Fase 4**: Mobile responsiveness verifiëren
- [ ] **Final**: User testing en feedback

## 🚀 Geschatte Implementatietijd
- **Basis implementatie**: 2-3 uur
- **Styling refinement**: 1-2 uur  
- **Testing & polish**: 1 uur
- **Totaal**: 4-6 uur

---

**Happy coding! 🎉**

*Deze implementatie zal je folder description editor transformeren van een simpele textarea naar een professionele, Obsidian-achtige markdown editor die je gebruikers gaan waarderen.*