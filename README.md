# 🚀 AirPrompts - AI Prompt Template Management System

A modern, intelligent prompt template management system built with React, Vite, and advanced state management. Designed for power users who need to manage, organize, and execute AI prompts efficiently.

## ✨ Key Features

### Core Functionality
- **📝 Template Management**: Create reusable prompt templates with dynamic `{variables}`
- **🔄 Workflow System**: Chain templates together with `{previous_output}` passing
- **✂️ Snippet System**: Manage reusable text blocks and components
- **➕ Insert System**: Quick-insert predefined text snippets
- **🔌 Addon System**: Extend functionality with custom integrations

### Organization & Navigation
- **📁 Advanced Folder Structure**: Nested folders with drag-and-drop support
- **🏷️ Smart Tagging**: Custom tags with color coding
- **⭐ Favorites System**: Quick access to frequently used items
- **🔍 Advanced Search**: Full-text search with filters and categories
- **📊 Multiple View Modes**: Grid, list, compact, kanban, and timeline views

### Performance & UX
- **⚡ Optimized Performance**: Virtual scrolling, lazy loading, and code splitting
- **🎨 Modern UI/UX**: Smooth animations, skeleton loaders, and responsive design
- **🌓 Dark Mode**: Full dark mode support with theme persistence
- **♿ Accessibility**: WCAG 2.1 AA compliant with screen reader support
- **📱 Mobile Responsive**: Fully functional on all device sizes

### Data Management
- **💾 Local Storage**: Works offline with automatic data persistence
- **🔄 Import/Export**: Backup and restore your data easily
- **📋 Smart Clipboard**: Advanced copy functionality with fallbacks
- **🔒 Secure**: All data stored locally, no external dependencies

## 🚀 Getting Started

### Prerequisites
- Node.js 16.x or higher
- npm 7.x or higher
- Modern web browser (Chrome, Firefox, Safari, Edge)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/AirPrompts.git

# Navigate to project directory
cd AirPrompts

# Install dependencies
npm install

# Start development server
npm run dev
```

### First Time Setup

1. **Open the Application**
   - Navigate to http://localhost:5173
   - The onboarding flow will guide you through the basics

2. **Create Your First Template**
   - Click "New Template" button
   - Give it a name and description
   - Add content with `{variables}` for dynamic parts
   - Save and test it immediately

3. **Organize with Folders**
   - Create folders to organize your templates
   - Drag and drop items between folders
   - Use nested folders for complex organization

4. **Build a Workflow**
   - Create multiple templates
   - Click "New Workflow"
   - Chain templates together
   - Use `{previous_output}` to pass data between steps

## 📱 Usage Guide

### Templates
Templates are reusable prompts with dynamic variables.

**Example Template:**
```
Act as a {role} and write a {type} about {topic}.
The content should be {tone} and approximately {length} words.
Target audience: {audience}
Key points to cover: {key_points}
```

**Using Templates:**
1. Navigate to Templates section
2. Click on a template or use the "Use" button
3. Fill in the variable fields
4. Click "Copy" to get the final prompt
5. Paste into your AI tool of choice

### Workflows
Workflows chain multiple templates together for complex tasks.

**Example Workflow:**
1. **Research Phase**: Generate research questions
2. **Outline Phase**: Create content outline using `{previous_output}`
3. **Writing Phase**: Write full content based on outline
4. **Review Phase**: Generate review checklist

### Keyboard Shortcuts
- `Ctrl/Cmd + K`: Quick search
- `Ctrl/Cmd + N`: New item (context-aware)
- `Tab`: Navigate between fields
- `Enter`: Execute/Copy in forms
- `Escape`: Close modals/dialogs

### Advanced Features

#### Custom Fields
Add custom metadata to templates:
- Tags for categorization
- Priority levels
- Version tracking
- Custom attributes

#### Context Panel
- Add persistent context that applies to all prompts
- Perfect for role definitions or style guides
- Toggle on/off as needed
- Supports markdown formatting

#### Smart Search
- Search by name, description, or content
- Filter by type, category, or tags
- Sort by date, name, or usage
- Save search presets

## 🛠️ Configuration

### Environment Variables
Create a `.env.local` file for custom configuration:

```env
# API Configuration (if using backend)
VITE_API_URL=http://localhost:3001

# Feature Flags
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_EXPORT=true

# Storage Configuration
VITE_STORAGE_PREFIX=airprompts_
VITE_MAX_STORAGE_SIZE=10485760
```

### Theme Customization
Modify `src/styles/colors.css` to customize the color scheme:

```css
:root {
  --color-primary-500: 59 130 246;
  --color-secondary-500: 107 114 128;
  /* Add your custom colors */
}
```

## 📊 Architecture

```
src/
├── components/         # React components
│   ├── base/          # Base components (buttons, inputs)
│   ├── common/        # Shared components
│   ├── dashboard/     # Dashboard views
│   ├── templates/     # Template management
│   ├── workflows/     # Workflow management
│   └── features/      # Feature-specific components
├── hooks/             # Custom React hooks
│   ├── domain/        # Business logic hooks
│   └── ui/            # UI-related hooks
├── services/          # Service layer
│   ├── storage/       # Storage adapters
│   └── sync/          # Sync functionality
├── utils/             # Utility functions
├── styles/            # Global styles
└── types/             # TypeScript types (if applicable)
```

## 🚀 Deployment

### Build for Production
```bash
# Create optimized production build
npm run build

# Preview production build locally
npm run preview
```

### Deployment Options

#### Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

#### Netlify
1. Connect your GitHub repository
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Deploy automatically on push

#### Docker
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "preview"]
```

## 🔧 Development

### Available Scripts
- `npm run dev` - Start development server with HMR
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run test` - Run tests (when available)

### Code Style
- ESLint for code quality
- Prettier for formatting
- Husky for pre-commit hooks
- Conventional commits

### Contributing
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [React](https://reactjs.org/)
- Powered by [Vite](https://vitejs.dev/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
- Icons by [Lucide](https://lucide.dev/)

---

**Made with ❤️ for efficient AI prompt management**