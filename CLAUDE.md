# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

**Critical:** All npm commands must be run from the correct working directory. The project files are in the main directory, not a subdirectory.

```bash
npm run dev      # Start development server (Vite)
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # ESLint code checking
```

## Architecture Overview

This is a React-based prompt template management system built with Vite and Tailwind CSS.

### Core Components Architecture

- **PromptTemplateSystem.jsx** (`src/components/PromptTemplateSystem.jsx:12`) - Main application component that handles routing between views and manages global state for templates/workflows
- **Homepage.jsx** (`src/components/dashboard/Homepage.jsx`) - Dashboard view with search, filtering, and item management
- **ItemExecutor.jsx** (`src/components/common/ItemExecutor.jsx`) - Universal execution engine for both templates and workflows with variable handling
- **TemplateEditor.jsx** (`src/components/templates/TemplateEditor.jsx`) - Template creation and editing interface
- **WorkflowEditor.jsx** (`src/components/workflows/WorkflowEditor.jsx`) - Workflow creation and editing interface

### State Management

The app uses React state in PromptTemplateSystem component:
- Templates and workflows are stored in component state
- View routing is handled through `currentView` state
- Default data is loaded from JSON files in `src/data/`

### Key Features

- **Template System**: Create reusable prompt templates with `{variable}` syntax
- **Workflow System**: Chain templates together with `{previous_output}` passing
- **Variable Detection**: Automatic extraction of `{variable}` placeholders from template content
- **Category Management**: Predefined categories defined in `src/types/template.types.js`
- **Clipboard Integration**: Copy functionality with fallbacks in `src/utils/clipboard.js`

### Data Structure

Templates and workflows use consistent structure defined in `src/types/template.types.js`:
- Both have id, name, description, category, favorite status
- Templates have `content` field with variables
- Workflows have `steps` array referencing template IDs

### Custom Styling System

- **Tailwind CSS** with custom color variables in `src/styles/colors.css`
- Color system: primary (blue), secondary (gray), success (green), danger (red)
- CSS variables enable dynamic theming
- Global styles in `src/styles/globals.css`

### Default Data

- Default templates: `src/data/defaultTemplates.json`
- Default workflows: `src/data/defaultWorkflows.json`
- Categories: Defined in `src/types/template.types.js` as `DEFAULT_CATEGORIES`