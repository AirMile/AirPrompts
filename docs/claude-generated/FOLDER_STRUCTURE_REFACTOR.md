# Folder Structure Refactoring Plan

## Current Issues
- Duplicate virtualized components
- Unclear separation between common and feature-specific components
- Mixed naming conventions
- No clear domain boundaries

## Proposed Structure
```
src/
├── store/                    # State management
│   ├── appStore.jsx         # Central store
│   ├── queryClient.js       # TanStack Query config
│   └── useUIStore.js        # UI state
│
├── services/                 # Business logic & API
│   ├── storage/
│   │   ├── StorageService.js
│   │   └── SyncQueue.js
│   └── api/                 # Future API services
│
├── hooks/                    # Custom React hooks
│   ├── queries/             # TanStack Query hooks
│   │   ├── useTemplatesQuery.js
│   │   ├── useWorkflowsQuery.js
│   │   └── useSnippetsQuery.js
│   ├── ui/                  # UI-related hooks
│   │   ├── useKeyboardNavigation.js
│   │   ├── useDragAndDrop.js
│   │   └── useDebouncedSearch.js
│   └── domain/              # Business logic hooks
│       ├── useTemplates.js
│       ├── useWorkflows.js
│       └── useSnippets.js
│
├── components/
│   ├── app/                 # App-level components
│   │   ├── AppProviders.jsx
│   │   └── PromptTemplateSystem.jsx
│   │
│   ├── shared/              # Truly shared components
│   │   ├── ui/             # Generic UI components
│   │   │   ├── Button.jsx
│   │   │   ├── Card.jsx
│   │   │   ├── LoadingSpinner.jsx
│   │   │   └── ErrorMessage.jsx
│   │   ├── layout/         # Layout components
│   │   │   ├── ErrorBoundary.jsx
│   │   │   └── SuspenseWrapper.jsx
│   │   └── form/           # Form components
│   │       └── FolderSelector.jsx
│   │
│   ├── features/            # Feature-specific components
│   │   ├── templates/
│   │   │   ├── TemplateEditor.jsx
│   │   │   ├── TemplateList.jsx
│   │   │   └── TemplateCard.jsx
│   │   ├── workflows/
│   │   │   ├── WorkflowEditor.jsx
│   │   │   ├── WorkflowList.jsx
│   │   │   └── WorkflowCard.jsx
│   │   ├── snippets/
│   │   │   ├── SnippetEditor.jsx
│   │   │   ├── SnippetList.jsx
│   │   │   └── SnippetCard.jsx
│   │   ├── execution/
│   │   │   └── ItemExecutor.jsx
│   │   └── dashboard/
│   │       └── Homepage.jsx
│   │
│   └── widgets/             # Widget components
│       └── FavoritesWidget.jsx
│
├── utils/                   # Utility functions
│   ├── clipboard.js
│   ├── dataStorage.js
│   └── searchUtils.js
│
├── types/                   # Type definitions & constants
│   └── template.types.js
│
└── contexts/               # React contexts
    ├── PreferencesContext.jsx
    └── DragDropContext.jsx
```

## Benefits
1. Clear separation of concerns
2. Easy to find files
3. Scalable structure
4. No duplicate components
5. Clear naming conventions