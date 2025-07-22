# 🚀 AirPrompts - AI Prompt Template Management System

Een moderne, offline-first prompt template management systeem gebouwd met React, Vite, en SQLite.

## ✨ Belangrijkste Features

- **📝 Template Management**: Maak en beheer herbruikbare prompt templates met variables
- **🔄 Workflow System**: Ketting templates samen met `{previous_output}` passing
- **✂️ Snippet System**: Beheer korte herbruikbare tekstblokken
- **📁 Folder Organization**: Organiseer templates, workflows en snippets in folders
- **🔄 Offline-First**: Werkt offline met localStorage, synchroniseert automatisch online
- **📊 Smart Sync**: Intelligente sync queue met retry logica en conflict resolution
- **🔄 Migration Tools**: One-click migratie van localStorage naar database
- **⚡ Snelle Uitvoering**: One-click kopiëren naar clipboard
- **🔍 Zoeken & Filteren**: Vind snel de juiste templates per categorie
- **⭐ Favorieten**: Markeer veelgebruikte items

## 🛠️ Tech Stack

- **React 18** - Modern React met hooks
- **Vite** - Snelle development server en build tool
- **Tailwind CSS** - Utility-first styling framework
- **Lucide React** - Moderne icon library
- **Modulaire Architectuur** - Gescheiden componenten voor onderhoudbaarheid

## 🚀 Snel Starten

### Optie 1: Alles tegelijk starten
```bash
./start-all.sh
```

### Optie 2: Handmatig starten
```bash
# Terminal 1: Backend
./start-backend.sh
# of: node server/server.js

# Terminal 2: Frontend  
./start-frontend.sh
# of: npm run dev
```

### Installatie (eerste keer)
```bash
# Clone repository
git clone https://github.com/AirMile/AirPrompts.git

# Navigate to project
cd AirPrompts

# Install dependencies
npm install
```

## 📱 URLs

- **🎨 Frontend App**: http://localhost:5173
- **📊 Backend API**: http://localhost:3001/api
- **🔍 API Status**: http://localhost:3001/api/templates

## 📁 Project Structuur

```
src/
├── components/
│   ├── common/
│   │   └── ItemExecutor.jsx     # Template/workflow execution engine
│   ├── dashboard/
│   │   └── Homepage.jsx         # Main dashboard met search & filters
│   ├── templates/
│   │   └── TemplateEditor.jsx   # Template creation/editing interface
│   ├── workflows/
│   │   └── WorkflowEditor.jsx   # Workflow creation/editing interface
│   └── PromptTemplateSystem.jsx # Main app component & state management
├── types/
│   └── template.types.js        # Type definitions & utility functions
├── utils/
│   └── clipboard.js            # Clipboard utilities met fallbacks
└── App.jsx                     # Root component
```

## 🎯 Usage

### Templates
1. Klik **"New Template"** op de homepage
2. Vul naam, beschrijving en content in
3. Gebruik `{variabele_naam}` voor dynamische input fields
4. Selecteer een categorie
5. Save en gebruik direct via **"Use"** button

**Voorbeeld Template:**
```
Write a {tone} blog post about {topic} for {audience}. 
The post should be {length} words and focus on {key_points}. 
Include {call_to_action} at the end.
```

### Workflows  
1. Klik **"New Workflow"** 
2. Voeg bestaande templates toe als steps
3. Gebruik `{previous_output}` om data van vorige step door te geven
4. Execute step-by-step voor complexe processen

### Variables
- Gebruik `{variable_name}` syntax in templates
- De app detecteert automatisch alle variabelen
- Input fields worden automatisch gegenereerd
- Speciale variable `{previous_output}` voor workflows

## 🎨 Features in Detail

### 🏠 Dashboard
- **Search**: Zoek in template/workflow namen en beschrijvingen
- **Category Filter**: Filter op Content Creation, Development, Marketing, etc.
- **Favorites Section**: Snelle toegang tot gemarkeerde items
- **Recent Items**: Laatst gebruikte templates en workflows

### ⚡ Execution Engine
- **Smart Keyboard Navigation**: Tab/Enter om tussen velden te bewegen
- **Auto-copy**: Automatisch kopiëren bij simpele templates
- **Progress Tracking**: Visuele voortgang bij workflows
- **Copy Again**: Re-copy vorige stappen met feedback

### 🔧 Editor Features
- **Live Preview**: Real-time preview van template output
- **Variable Detection**: Automatische `{variable}` highlighting
- **Category Management**: Gecentraliseerde categorieën
- **Drag & Drop**: Workflow steps herordenen

## 🔧 Development

```bash
# Development server met hot reload
npm run dev

# Build voor productie
npm run build

# Preview productie build
npm run preview

# Code linting
npm run lint
```

## 📂 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build voor productie
- `npm run preview` - Preview productie build
- `npm run lint` - ESLint code checking

## 🎨 Customization

### Kleuren & Styling
Het project gebruikt Tailwind CSS. Pas `tailwind.config.js` aan voor custom kleuren en styling.

### Categories
Voeg nieuwe categorieën toe in `src/types/template.types.js`:
```javascript
export const DEFAULT_CATEGORIES = [
  'General',
  'Content Creation',
  'Development',
  // Voeg hier nieuwe categorieën toe
];
```

## 🤝 Contributing

1. Fork het project
2. Maak een feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit je changes (`git commit -m 'Add some AmazingFeature'`)
4. Push naar de branch (`git push origin feature/AmazingFeature`)
5. Open een Pull Request

## 📄 License

MIT License - zie [LICENSE](LICENSE) file voor details.

## 🚀 Deployment

### Vercel (Recommended)
1. Push naar GitHub
2. Connect repository in Vercel dashboard  
3. Deploy automatisch bij elke push

### Netlify
1. Run `npm run build`
2. Upload `dist/` folder naar Netlify
3. Set build command: `npm run build`
4. Set publish directory: `dist`

---

**Gemaakt met ❤️ voor efficiënt prompt management**
