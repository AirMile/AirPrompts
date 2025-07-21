import { lazy } from 'react';

// Lazy load heavy components
export const Dashboard = lazy(() => import('../features/dashboard/Dashboard'));
export const TemplateEditor = lazy(() => import('../features/templates/components/TemplateEditor'));
export const WorkflowEditor = lazy(() => import('../features/workflows/components/WorkflowEditor'));
export const SnippetEditor = lazy(() => import('../features/snippets/components/SnippetEditor'));
export const ItemExecutor = lazy(() => import('../common/ItemExecutor'));
export const AdvancedSearch = lazy(() => import('../search/AdvancedSearch'));

// Lazy load entire feature modules
export const TemplatesModule = lazy(() => 
  import('../features/templates').then(module => ({ 
    default: module.TemplatesModule 
  }))
);

export const WorkflowsModule = lazy(() => 
  import('../features/workflows').then(module => ({ 
    default: module.WorkflowsModule 
  }))
);

export const SnippetsModule = lazy(() => 
  import('../features/snippets').then(module => ({ 
    default: module.SnippetsModule 
  }))
);