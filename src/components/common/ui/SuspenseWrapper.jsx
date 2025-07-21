import React, { Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { LoadingSpinner } from './LoadingStates';
import { ErrorMessage } from './ErrorStates';

export function SuspenseWrapper({ 
  children, 
  fallback = <LoadingSpinner />,
  errorFallback
}) {
  return (
    <ErrorBoundary
      fallbackRender={({ error, resetErrorBoundary }) => 
        errorFallback || (
          <ErrorMessage 
            error={error} 
            onRetry={resetErrorBoundary}
            type="error"
          />
        )
      }
    >
      <Suspense fallback={fallback}>
        {children}
      </Suspense>
    </ErrorBoundary>
  );
}

export default SuspenseWrapper;