import React, { Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { useTemplates } from '../../../../hooks/useTemplatesQuery';
import { SkeletonGrid, LoadingSpinner } from '../../../common/ui/LoadingStates';
import { ErrorMessage } from '../../../common/ui/ErrorStates';
import VirtualizedGrid from '../../../common/ui/VirtualizedGrid';

// Resource-based component (React 19 pattern ready)
function TemplateListContent({ filters, viewMode = 'grid' }) {
  const { data: templates, isLoading, error } = useTemplates(filters);
  
  if (isLoading) {
    return <SkeletonGrid count={6} />;
  }
  
  if (error) {
    throw error; // Let ErrorBoundary handle it
  }
  
  if (!templates?.length) {
    return <ErrorMessage type="empty" />;
  }
  
  // Use virtualization for large lists
  if (templates.length > 50 && viewMode === 'grid') {
    return (
      <VirtualizedGrid
        items={templates}
        columnCount={3}
        height={600}
        rowHeight={200}
        renderItem={(template) => (
          <TemplateCard key={template.id} template={template} />
        )}
      />
    );
  }
  
  // Regular grid for smaller lists
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {templates.map(template => (
        <TemplateCard key={template.id} template={template} />
      ))}
    </div>
  );
}

// Placeholder component
const TemplateCard = ({ template }) => (
  <div className="p-4 border rounded-lg hover:shadow-md transition-shadow">
    <h3 className="font-semibold">{template.name}</h3>
    <p className="text-sm text-gray-600">{template.description}</p>
  </div>
);

// Main component with Suspense boundary
export default function TemplateListSuspense({ filters, viewMode }) {
  return (
    <ErrorBoundary
      fallbackRender={({ error, resetErrorBoundary }) => (
        <ErrorMessage 
          error={error} 
          onRetry={resetErrorBoundary}
          type="error"
        />
      )}
    >
      <Suspense fallback={<LoadingSpinner />}>
        <TemplateListContent filters={filters} viewMode={viewMode} />
      </Suspense>
    </ErrorBoundary>
  );
}