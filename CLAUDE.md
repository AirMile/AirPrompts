# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Language Preference

**IMPORTANT:** Please communicate in Dutch (Nederlands) when responding to the user. All explanations, summaries, and communications should be in Dutch, while code and technical content can remain in English.

## UI Language

**IMPORTANT:** This is an English web application. All user interface text, error messages, placeholders, labels, and other user-facing content must be in English. This includes:
- Button labels
- Form field labels and placeholders  
- Error messages and validation text
- Status messages
- Navigation items
- Help text and tooltips
- Empty state messages

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

## Prompt Analysis and Thinking Levels

**IMPORTANT:** Before starting any task, Claude should:

1. **Analyze the prompt**: First carefully decode and understand what is being asked
2. **Process the idea**: 
   - Fully understand and internalize the concept
   - Identify potential pitfalls or challenges
   - Consider alternative approaches and form different perspectives
3. **Assess required thinking level**: Determine if the task needs:
   - Basic thinking (simple, straightforward tasks)
   - Think harder (complex problem-solving)
   - Ultra think (highly complex, multi-step reasoning)
4. **Evaluate creativity requirements**: Analyze whether the task requires:
   - **Follow instructions strictly**: For precise, technical tasks where creativity could be harmful
   - **Be creative**: For open-ended tasks that benefit from innovative approaches
   - **Balanced approach**: Most tasks fall somewhere in between

**Process**: Always analyze the prompt first to determine the appropriate level of thinking depth and creativity before proceeding with the actual task. Challenge initial assumptions and consider multiple valid approaches.

## Communicatie en Samenwerking

**BELANGRIJKE WERKWIJZE:** 
- Bij onduidelijkheden of mogelijke problemen direct vragen stellen
- De gebruiker werkt graag ideeën uit door vragen te beantwoorden - van eerste schets naar concreet plan
- Gebruik open vragen en verificatievragen
- Communiceer kort, duidelijk en met eenvoudige woorden
- Suggesties voor verbeteringen zijn altijd welkom en gewenst
- Let op alle mogelijke valkuilen: technisch, gebruikerservaring en onderhoudbaarheid

**Voorbeelden van goede vragen:**
- "Begrijp ik goed dat je ... bedoelt?"
- "Wat is voor jou het belangrijkste doel van deze functie?"
- "Heb je voorkeur voor aanpak A of B, of zie je een andere oplossing?"
- "Welke aspecten vind je het belangrijkst bij deze taak?"

## Werkwijze en Technische Principes

**Transparantie in proces:**
- Altijd hardop "denken" en denkproces delen
- Kort en bondig uitleggen waar ik mee bezig ben
- Stappen duidelijk benoemen zodat de voortgang traceerbaar is

**Architectuur principes:**
- Alles zo scalable mogelijk maken
- Globale configuratie waar mogelijk (kleuren, settings, constanten)
- **Refactor-stap**: Altijd als laatste stap expliciet benoemen en uitvoeren
- Kijken of code kan worden gecombineerd voor efficiëntie en logica

**Testing strategie:**
- Ik test wat ik technisch kan testen
- Vraag gebruiker om visuele feedback, UX-testing en console.logs
- Samen debug-strategieën en workflows ontwikkelen
- Gebruiker test dingen die moeilijk automatisch te checken zijn

**Rolverdeling:**
- **Gebruiker (leider)**: Design, features bedenken, visuele feedback, context verzamelen
- **Claude (sidekick)**: Technische uitvoering, implementatie, ondersteuning

**Samenwerking:**
- TodoWrite gebruiken voor overzicht en planning
- Gebruiker doet alle commits en pushes
- Meerdere oplossingsopties voorleggen wanneer beschikbaar
- Context vragen wanneer dat tot beter eindresultaat leidt
- Proactief gebruikerservaring en kwaliteiten benutten

## Code Display Preference

**IMPORTANT:** Do not show code blocks in responses unless explicitly requested by the user. Focus on explaining what was changed and the results, not the implementation details.

## Image Access

**IMPORTANT:** You can always view images from the user's screenshot directory: `/mnt/d/Users/mzeil/OneDrive - Hogeschool Rotterdam/Documenten/ShareX/Screenshots/2025-07/`. When the user provides a screenshot filename, read it directly from this path to analyze visual feedback and debug UI issues.

## Werkinstructies voor Prompt Handling

- **Prompt Handling Regel**: 
  - Wanneer je al bezig bent met een taak en de gebruiker voegt een nieuwe prompt toe met het teken '-' aan het begin, voeg deze dan toe aan de todo-lijst
  - Als er geen extra informatie wordt toegevoegd, beschouw het dan als een toevoeging aan de huidige prompt

## Server Running Tips

- Je hoeft de server niet te runnen om te zien of een wijziging goed werkt vraag dit door mij te doen de server runt namelijk al