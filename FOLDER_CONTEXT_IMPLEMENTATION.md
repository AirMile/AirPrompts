# Folder Context/Description Feature - Implementatie Guide

## 🎯 Doel
Uitklapbare markdown beschrijving toevoegen aan folders die wordt getoond bovenaan het middenpaneel van de homepage wanneer je een folder bekijkt.

## 📋 Feature Requirements

### Must-Have Features
- ✅ Uitklapbare beschrijving sectie bovenaan homepage middenpaneel (onder header)
- ✅ Markdown ondersteuning (headers, bold, lists, links)
- ✅ Edit/Save/Cancel workflow
- ✅ Responsive design voor mobile
- ✅ Context per folder (gebruik bestaand database `description` field)

### Nice-to-Have (Later)
- 🔄 Auto-save functionaliteit
- 🔄 Drag & drop voor links
- 🔄 Search in descriptions
- 🔄 Syntax highlighting voor code blocks

## 🗂️ Database & Backend

### 1. Database Schema
Het `description` field bestaat al in de folders table. Alleen uitbreiden indien nodig:

```sql
-- Controleer huidige schema
PRAGMA table_info(folders);

-- Indien nodig, uitbreiden naar TEXT type voor langere content
ALTER TABLE folders ALTER COLUMN description TYPE TEXT;
```

### 2. API Routes Update
Bestaande PUT route in `/server/routes/folders.js` uitbreiden:

```javascript
// PUT /api/folders/:id - Update folder description
router.put('/:id', async (req, res) => {
  const { description, ...otherFields } = req.body;
  
  // Validatie voor description (max length, etc.)
  if (description && description.length > 50000) {
    return res.status(400).json({ error: 'Description too long' });
  }
  
  // Update query includeert description
  // Bestaande code aanpassen om description mee te nemen
});
```

## 📦 Dependencies

### Installatie
```bash
npm install react-markdown remark-gfm
```

### Package imports
```javascript
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
```

## 🧩 Nieuwe Components

### 1. `/src/components/common/MarkdownRenderer.jsx`
```jsx
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const MarkdownRenderer = ({ content, className = '' }) => {
  return (
    <div className={`prose prose-sm max-w-none ${className}`}>
      <ReactMarkdown 
        remarkPlugins={[remarkGfm]}
        components={{
          // Custom styling voor links
          a: ({ node, ...props }) => (
            <a 
              {...props} 
              className="text-primary-600 hover:text-primary-800 underline"
              target="_blank"
              rel="noopener noreferrer"
            />
          ),
          // Custom styling voor headers
          h1: ({ node, ...props }) => <h1 {...props} className="text-lg font-bold mb-2" />,
          h2: ({ node, ...props }) => <h2 {...props} className="text-base font-semibold mb-2" />,
          h3: ({ node, ...props }) => <h3 {...props} className="text-sm font-semibold mb-1" />,
          // Lists
          ul: ({ node, ...props }) => <ul {...props} className="list-disc ml-4 mb-2" />,
          ol: ({ node, ...props }) => <ol {...props} className="list-decimal ml-4 mb-2" />,
          li: ({ node, ...props }) => <li {...props} className="mb-1" />,
          // Paragraphs
          p: ({ node, ...props }) => <p {...props} className="mb-2" />,
        }}
      >
        {content || ''}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;
```

### 2. `/src/components/common/MarkdownEditor.jsx`
```jsx
import { useState } from 'react';
import MarkdownRenderer from './MarkdownRenderer';

const MarkdownEditor = ({ 
  value, 
  onChange, 
  onSave, 
  onCancel,
  placeholder = "Voeg context en notities toe...",
  isLoading = false 
}) => {
  const [activeTab, setActiveTab] = useState('write');

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      {/* Tab Header */}
      <div className="flex border-b border-gray-200 bg-gray-50">
        <button
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === 'write' 
              ? 'bg-white border-b-2 border-primary-500 text-primary-600' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('write')}
        >
          Bewerken
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === 'preview' 
              ? 'bg-white border-b-2 border-primary-500 text-primary-600' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('preview')}
        >
          Voorbeeld
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        {activeTab === 'write' ? (
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full h-40 p-3 border border-gray-200 rounded-md resize-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            rows={8}
          />
        ) : (
          <div className="min-h-40 p-3 bg-gray-50 rounded-md">
            {value ? (
              <MarkdownRenderer content={value} />
            ) : (
              <p className="text-gray-500 italic">Geen inhoud om te tonen</p>
            )}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-2 p-4 bg-gray-50 border-t border-gray-200">
        <button
          onClick={onCancel}
          disabled={isLoading}
          className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 disabled:opacity-50"
        >
          Annuleren
        </button>
        <button
          onClick={onSave}
          disabled={isLoading}
          className="px-4 py-2 text-sm font-medium bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50"
        >
          {isLoading ? 'Opslaan...' : 'Opslaan'}
        </button>
      </div>
    </div>
  );
};

export default MarkdownEditor;
```

### 3. `/src/components/folders/FolderDescription.jsx`
```jsx
import { useState } from 'react';
import { ChevronDownIcon, ChevronRightIcon, PencilIcon } from '@heroicons/react/24/outline';
import MarkdownRenderer from '../common/MarkdownRenderer';
import MarkdownEditor from '../common/MarkdownEditor';

const FolderDescription = ({ 
  folder, 
  onUpdateDescription,
  isUpdating = false 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(folder?.description || '');

  const hasDescription = folder?.description?.trim();

  const handleSave = async () => {
    try {
      await onUpdateDescription(folder.id, editValue);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update description:', error);
    }
  };

  const handleCancel = () => {
    setEditValue(folder?.description || '');
    setIsEditing(false);
  };

  const handleStartEdit = () => {
    setIsEditing(true);
    setIsExpanded(true);
  };

  // Toon alleen voor niet-root folders
  if (!folder || folder.id === 'root') {
    return null;
  }

  return (
    <div className="border-b border-gray-100 bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900"
        >
          {isExpanded ? (
            <ChevronDownIcon className="w-4 h-4" />
          ) : (
            <ChevronRightIcon className="w-4 h-4" />
          )}
          Folder Context & Notities
          {hasDescription && (
            <span className="px-2 py-1 text-xs bg-primary-100 text-primary-700 rounded-full">
              {hasDescription.length > 50 ? '50+' : hasDescription.length} tekens
            </span>
          )}
        </button>
        
        {!isEditing && (
          <button
            onClick={handleStartEdit}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100"
            title="Bewerken"
          >
            <PencilIcon className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="px-4 pb-4">
          {isEditing ? (
            <MarkdownEditor
              value={editValue}
              onChange={setEditValue}
              onSave={handleSave}
              onCancel={handleCancel}
              isLoading={isUpdating}
              placeholder={`Voeg context, notities en links toe voor "${folder.name}"...`}
            />
          ) : hasDescription ? (
            <div className="p-4 bg-gray-50 rounded-lg">
              <MarkdownRenderer content={folder.description} />
            </div>
          ) : (
            <div className="p-4 bg-gray-50 rounded-lg text-center">
              <p className="text-gray-500 mb-2">Geen beschrijving toegevoegd voor deze folder</p>
              <button
                onClick={handleStartEdit}
                className="text-primary-600 hover:text-primary-800 text-sm font-medium"
              >
                Voeg context toe
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FolderDescription;
```

## 🏠 Homepage Integration

### Update `/src/components/dashboard/Homepage.jsx`

```jsx
// Import toevoegen
import FolderDescription from '../folders/FolderDescription';
import { useFoldersQuery } from '../../hooks/queries/useFoldersQuery';

// In de component, folder update functie toevoegen
const { updateFolder } = useFoldersQuery();

const handleUpdateFolderDescription = async (folderId, description) => {
  try {
    await updateFolder.mutateAsync({
      id: folderId,
      description: description
    });
  } catch (error) {
    console.error('Failed to update folder description:', error);
    throw error;
  }
};

// In de render, na header/breadcrumb maar VOOR items lijst
// Zoek naar waar de items grid/lijst begint en voeg hierboven toe:
<div className="space-y-6">
  {/* Bestaande header/breadcrumb content */}
  
  {/* Folder Description - NIEUW */}
  {currentFolder && (
    <FolderDescription
      folder={currentFolder}
      onUpdateDescription={handleUpdateFolderDescription}
      isUpdating={updateFolder.isLoading}
    />
  )}
  
  {/* Bestaande items grid/lijst */}
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {/* Bestaande items rendering */}
  </div>
</div>
```

## 🔧 Hook Updates

### Update `/src/hooks/queries/useFoldersQuery.js`

```javascript
// Mutation voor folder update uitbreiden
const updateFolder = useMutation({
  mutationFn: async ({ id, ...updateData }) => {
    const response = await fetch(`/api/folders/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData)
    });
    
    if (!response.ok) {
      throw new Error('Failed to update folder');
    }
    
    return response.json();
  },
  onSuccess: () => {
    queryClient.invalidateQueries(['folders']);
  }
});

// Return updateFolder in hook
return {
  // ...existing returns
  updateFolder
};
```

## 🎨 Styling

### Tailwind Prose Plugin
Installeer indien niet beschikbaar:
```bash
npm install @tailwindcss/typography
```

### `/tailwind.config.js` update
```javascript
module.exports = {
  // ...existing config
  plugins: [
    require('@tailwindcss/typography'),
    // ...other plugins
  ]
}
```

### Custom CSS voor markdown in `/src/styles/globals.css`
```css
.prose {
  /* Override prose defaults voor onze app styling */
  --tw-prose-links: theme('colors.primary.600');
  --tw-prose-headings: theme('colors.gray.900');
}

.prose a {
  font-weight: 500;
  text-decoration: underline;
  text-decoration-thickness: 1px;
  text-underline-offset: 2px;
}

.prose h1, .prose h2, .prose h3 {
  margin-top: 1em;
  margin-bottom: 0.5em;
}

.prose ul, .prose ol {
  margin-top: 0.5em;
  margin-bottom: 0.5em;
}
```

## 🧪 Testing

### Handmatige Tests
1. **Root folder**: Geen context component getoond
2. **Folder zonder beschrijving**: Lege state testen
3. **Folder met korte beschrijving**: Basic rendering
4. **Folder met lange markdown**: Headers, lists, links
5. **Edit workflow**: Save, cancel, error handling
6. **Mobile responsive**: Collapse/expand op mobiel

### Test Cases
```javascript
// Voorbeelden van test content
const testMarkdown = `
# Project ABC - Client Website

## Context
Dit project bevat alle templates voor de nieuwe website van client ABC.

### Belangrijke Links
- [Design Files](https://figma.com/abc-design)
- [Client Documentation](https://notion.so/abc-project)
- [GitHub Repo](https://github.com/company/abc-website)

### Deadline
**Oplevering: 15 maart 2024**

### Team
- Designer: Jan de Vries
- Developer: Marie Peters
- PM: Alex Johnson

### Brain Farts & Random Notes
- Client prefers minimalist design
- Must be fully responsive
- SEO optimization required
- Remember to test on IE11 (client requirement)
`;
```

## 🚀 Implementatie Volgorde

### Dag 1: Backend & Dependencies
1. ✅ Dependencies installeren (react-markdown, remark-gfm)
2. ✅ Database schema controleren/updaten (description field)
3. ✅ API routes uitbreiden voor description updates
4. ✅ Basic MarkdownRenderer component maken

### Dag 2: Components & Integration  
1. ✅ MarkdownEditor component maken
2. ✅ FolderDescription component maken  
3. ✅ Homepage integration (bovenaan middenpaneel)
4. ✅ useFoldersQuery hook uitbreiden

### Dag 3: Polish & Testing
1. ✅ Styling verfijnen met Tailwind
2. ✅ Mobile responsive maken
3. ✅ Error handling toevoegen
4. ✅ Handmatig testen verschillende scenarios

## 🔮 Toekomstige Uitbreidingen

### Fase 2 Features
- 📝 Auto-save tijdens typen (debounced)
- 🔍 Search in folder descriptions
- 📎 Drag & drop voor externe links
- 🏷️ Tags/labels systeem
- 📊 Description statistics (word count, links, etc.)

### Fase 3 Features  
- 🔄 Version history voor descriptions
- 👥 Collaborative editing
- 🎨 Custom markdown components
- 📱 Mobile-optimized editor
- 🔐 Permissions voor description editing

## 💡 Tips & Gotchas

### Performance
- Markdown rendering kan traag zijn bij grote content - overweeg lazy loading
- Debounce API calls voor auto-save functionaliteit
- Gebruik React.memo voor MarkdownRenderer bij grote content

### UX
- Gebruik progressive enhancement - editing is opt-in
- Behoud folder navigation state tijdens editing
- Geef duidelijke feedback bij save/error states
- Component is alleen zichtbaar voor echte folders (niet voor root)

### Security
- Sanitize markdown content server-side
- Validate external links
- Limit description length (bijv. 50KB max)

### Accessibility
- Zorg voor keyboard navigation in editor
- Screen reader support voor markdown content
- Focus management bij edit mode toggle

---

**Succesvol implementeren! 🎉**

Deze implementatie geeft je folder-specifieke context management die wordt getoond bovenaan het middenpaneel van de homepage met:
- ✨ Markdown ondersteuning voor rijke content
- 📁 Per-folder context met bestaande database
- 📱 Responsive design
- 🚀 Performance optimalisaties
- 🔮 Uitbreidingsmogelijkheden voor de toekomst