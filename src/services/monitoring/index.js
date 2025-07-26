/**
 * Monitoring Services Index
 * 
 * Central export point for all monitoring and analytics services
 */

export * from './sentry';
export * from './performance';

// Initialize all monitoring services
export async function initializeMonitoring(config = {}) {
  const { initializeSentry } = await import('./sentry');
  const { initializePerformanceMonitoring } = await import('./performance');
  
  // Initialize Sentry error tracking
  initializeSentry();
  
  // Initialize performance monitoring
  initializePerformanceMonitoring(config);
  
  console.log('All monitoring services initialized');
}