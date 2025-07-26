import * as Sentry from '@sentry/react';
import { isFeatureEnabled } from '../featureFlags';

/**
 * Sentry Error Monitoring Configuration
 * 
 * Provides comprehensive error tracking and performance monitoring
 * Integrates with React Error Boundaries and feature flags
 */

// Configuration options
const SENTRY_CONFIG = {
  dsn: process.env.REACT_APP_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  
  // Performance monitoring
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Session tracking
  autoSessionTracking: true,
  
  // Release tracking
  release: process.env.REACT_APP_VERSION || 'unknown',
  
  // Integration settings
  integrations: [
    new Sentry.BrowserTracing({
      // Set sampling rate for performance monitoring
      tracingOrigins: ['localhost', /^\//],
      
      // Track specific user interactions
      routingInstrumentation: Sentry.reactRouterV6Instrumentation(
        React.useEffect,
        window.history
      ),
    }),
    
    // Capture console errors
    new Sentry.CaptureConsole({
      levels: ['error', 'warn']
    }),
  ],
  
  // Filter out certain errors
  beforeSend(event, hint) {
    // Don't send events if monitoring is disabled
    if (!isFeatureEnabled('USE_PERFORMANCE_MONITORING')) {
      return null;
    }
    
    // Filter out known non-errors
    const error = hint.originalException;
    
    // Ignore network errors in development
    if (process.env.NODE_ENV === 'development' && error?.name === 'NetworkError') {
      return null;
    }
    
    // Ignore canceled requests
    if (error?.name === 'AbortError') {
      return null;
    }
    
    // Ignore specific error messages
    const ignoredMessages = [
      'ResizeObserver loop limit exceeded',
      'ResizeObserver loop completed with undelivered notifications',
      'Non-Error promise rejection captured'
    ];
    
    if (ignoredMessages.some(msg => event.message?.includes(msg))) {
      return null;
    }
    
    // Add user context
    if (window.userContext) {
      event.user = {
        id: window.userContext.userId,
        email: window.userContext.email,
        username: window.userContext.displayName
      };
    }
    
    // Add custom tags
    event.tags = {
      ...event.tags,
      component: hint.component || 'unknown',
      feature_flags: JSON.stringify(getActiveFeatureFlags())
    };
    
    return event;
  },
  
  // Configure breadcrumbs
  beforeBreadcrumb(breadcrumb) {
    // Filter out noisy breadcrumbs
    if (breadcrumb.category === 'console' && breadcrumb.level === 'debug') {
      return null;
    }
    
    // Enhance navigation breadcrumbs
    if (breadcrumb.category === 'navigation') {
      breadcrumb.data = {
        ...breadcrumb.data,
        timestamp: new Date().toISOString()
      };
    }
    
    return breadcrumb;
  }
};

/**
 * Initialize Sentry monitoring
 */
export function initializeSentry() {
  // Only initialize if DSN is provided and monitoring is enabled
  if (!SENTRY_CONFIG.dsn || !isFeatureEnabled('USE_PERFORMANCE_MONITORING')) {
    console.log('Sentry monitoring disabled');
    return;
  }
  
  try {
    Sentry.init(SENTRY_CONFIG);
    console.log('Sentry monitoring initialized');
    
    // Set initial user context if available
    if (window.userContext) {
      Sentry.setUser({
        id: window.userContext.userId,
        email: window.userContext.email,
        username: window.userContext.displayName
      });
    }
    
    // Add global error handler
    window.addEventListener('unhandledrejection', (event) => {
      Sentry.captureException(event.reason, {
        tags: {
          type: 'unhandledRejection'
        }
      });
    });
    
  } catch (error) {
    console.error('Failed to initialize Sentry:', error);
  }
}

/**
 * Get active feature flags for error context
 */
function getActiveFeatureFlags() {
  try {
    const flags = {};
    [
      'USE_NEW_STORAGE_FACADE',
      'USE_ERROR_BOUNDARIES',
      'USE_VIRTUALIZED_LISTS',
      'USE_BASE_COMPONENTS',
      'ENABLE_CODE_SPLITTING'
    ].forEach(flag => {
      flags[flag] = isFeatureEnabled(flag);
    });
    return flags;
  } catch {
    return {};
  }
}

/**
 * Capture custom error with context
 */
export function captureError(error, context = {}) {
  if (!isFeatureEnabled('USE_PERFORMANCE_MONITORING')) {
    console.error('Error captured (Sentry disabled):', error, context);
    return;
  }
  
  Sentry.captureException(error, {
    tags: {
      ...context.tags,
      component: context.component || 'unknown'
    },
    extra: {
      ...context.extra,
      feature_flags: getActiveFeatureFlags()
    },
    level: context.level || 'error'
  });
}

/**
 * Capture message with context
 */
export function captureMessage(message, level = 'info', context = {}) {
  if (!isFeatureEnabled('USE_PERFORMANCE_MONITORING')) {
    console.log(`Message captured (Sentry disabled) [${level}]:`, message, context);
    return;
  }
  
  Sentry.captureMessage(message, {
    level,
    tags: context.tags,
    extra: context.extra
  });
}

/**
 * Add breadcrumb for user actions
 */
export function addBreadcrumb(breadcrumb) {
  if (!isFeatureEnabled('USE_PERFORMANCE_MONITORING')) {
    return;
  }
  
  Sentry.addBreadcrumb({
    timestamp: Date.now() / 1000,
    ...breadcrumb
  });
}

/**
 * Set user context for error tracking
 */
export function setUserContext(user) {
  if (!user) {
    Sentry.setUser(null);
    window.userContext = null;
    return;
  }
  
  const userContext = {
    id: user.id || user.userId,
    email: user.email,
    username: user.displayName || user.name,
    plan: user.plan,
    isBetaUser: user.isBetaUser
  };
  
  Sentry.setUser(userContext);
  window.userContext = userContext;
}

/**
 * Set custom tags for all future events
 */
export function setTags(tags) {
  Sentry.setTags(tags);
}

/**
 * Create a new transaction for performance monitoring
 */
export function startTransaction(name, op = 'navigation') {
  if (!isFeatureEnabled('USE_PERFORMANCE_MONITORING')) {
    return null;
  }
  
  return Sentry.startTransaction({ name, op });
}

/**
 * Profiler component for performance monitoring
 */
export const Profiler = Sentry.Profiler;

/**
 * Error Boundary component with Sentry integration
 */
export const ErrorBoundary = Sentry.ErrorBoundary;

/**
 * withProfiler HOC for component performance monitoring
 */
export const withProfiler = Sentry.withProfiler;

/**
 * Custom error boundary with enhanced error handling
 */
export class EnhancedErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null,
      eventId: null
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    const eventId = Sentry.captureException(error, {
      contexts: {
        react: {
          componentStack: errorInfo.componentStack
        }
      },
      tags: {
        component: this.props.name || 'Unknown',
        ...this.props.tags
      }
    });

    this.setState({
      error,
      errorInfo,
      eventId
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo, eventId);
    }
  }

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.state.errorInfo, this.state.eventId);
      }

      // Default error UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-secondary-50 dark:bg-secondary-900">
          <div className="max-w-md w-full bg-white dark:bg-secondary-800 rounded-lg shadow-lg p-6">
            <div className="text-center">
              <div className="text-6xl mb-4">😵</div>
              <h1 className="text-2xl font-bold text-secondary-900 dark:text-secondary-100 mb-2">
                Something went wrong
              </h1>
              <p className="text-secondary-600 dark:text-secondary-400 mb-4">
                {this.state.error?.message || 'An unexpected error occurred'}
              </p>
              
              <div className="flex gap-2 justify-center mb-4">
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-primary-500 text-white rounded hover:bg-primary-600"
                >
                  Reload Page
                </button>
                <button
                  onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
                  className="px-4 py-2 bg-secondary-200 dark:bg-secondary-700 rounded"
                >
                  Try Again
                </button>
              </div>
              
              {this.state.eventId && (
                <p className="text-xs text-secondary-500 dark:text-secondary-400">
                  Error ID: {this.state.eventId}
                </p>
              )}
              
              {process.env.NODE_ENV === 'development' && (
                <details className="mt-4 text-left">
                  <summary className="cursor-pointer text-sm text-primary-500">
                    Show Error Details
                  </summary>
                  <pre className="mt-2 text-xs bg-secondary-100 dark:bg-secondary-900 p-4 rounded overflow-auto">
                    {this.state.error?.stack}
                    {'\n\n'}
                    {this.state.errorInfo?.componentStack}
                  </pre>
                </details>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Export all Sentry methods for convenience
export {
  Sentry
};