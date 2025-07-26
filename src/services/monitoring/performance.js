import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';
import { isFeatureEnabled } from '../featureFlags';
import { captureMessage } from './sentry';

/**
 * Performance Monitoring Service
 * 
 * Tracks web vitals, custom metrics, and performance data
 * Provides insights into application performance
 */

// Performance thresholds (based on Google's recommendations)
const PERFORMANCE_THRESHOLDS = {
  CLS: { good: 0.1, needs_improvement: 0.25 }, // Cumulative Layout Shift
  FID: { good: 100, needs_improvement: 300 },   // First Input Delay (ms)
  FCP: { good: 1800, needs_improvement: 3000 }, // First Contentful Paint (ms)
  LCP: { good: 2500, needs_improvement: 4000 }, // Largest Contentful Paint (ms)
  TTFB: { good: 800, needs_improvement: 1800 }  // Time to First Byte (ms)
};

// Store for performance metrics
const performanceMetrics = new Map();
const customMetrics = new Map();

// Performance observers
let performanceObserver = null;
let resourceObserver = null;

/**
 * Initialize performance monitoring
 */
export function initializePerformanceMonitoring(config = {}) {
  if (!isFeatureEnabled('USE_PERFORMANCE_MONITORING')) {
    console.log('Performance monitoring disabled');
    return;
  }

  // Monitor Web Vitals
  monitorWebVitals(config.onMetric);

  // Setup Performance Observer for custom metrics
  setupPerformanceObserver();

  // Monitor resource loading
  setupResourceObserver();

  // Monitor long tasks
  monitorLongTasks();

  // Setup memory monitoring
  monitorMemoryUsage();

  console.log('Performance monitoring initialized');
}

/**
 * Monitor Core Web Vitals
 */
function monitorWebVitals(customHandler) {
  const reportMetric = (metric) => {
    // Store metric
    performanceMetrics.set(metric.name, metric);

    // Determine rating
    const threshold = PERFORMANCE_THRESHOLDS[metric.name];
    let rating = 'good';
    if (threshold) {
      if (metric.value > threshold.needs_improvement) {
        rating = 'poor';
      } else if (metric.value > threshold.good) {
        rating = 'needs-improvement';
      }
    }

    // Create metric data
    const metricData = {
      name: metric.name,
      value: metric.value,
      rating,
      delta: metric.delta,
      id: metric.id,
      navigationType: metric.navigationType,
      timestamp: new Date().toISOString()
    };

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Performance] ${metric.name}:`, metricData);
    }

    // Send to analytics
    sendToAnalytics(metricData);

    // Call custom handler if provided
    if (customHandler) {
      customHandler(metricData);
    }

    // Alert on poor performance
    if (rating === 'poor') {
      captureMessage(`Poor ${metric.name} performance: ${metric.value}`, 'warning', {
        tags: { metric: metric.name, rating },
        extra: metricData
      });
    }
  };

  // Monitor each vital
  getCLS(reportMetric);
  getFID(reportMetric);
  getFCP(reportMetric);
  getLCP(reportMetric);
  getTTFB(reportMetric);
}

/**
 * Setup Performance Observer for custom metrics
 */
function setupPerformanceObserver() {
  if (!window.PerformanceObserver) return;

  try {
    // Observe navigation timing
    performanceObserver = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.entryType === 'navigation') {
          const navigationMetrics = {
            domContentLoaded: entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart,
            domComplete: entry.domComplete - entry.domInteractive,
            loadComplete: entry.loadEventEnd - entry.loadEventStart,
            domInteractive: entry.domInteractive - entry.fetchStart,
            dns: entry.domainLookupEnd - entry.domainLookupStart,
            tcp: entry.connectEnd - entry.connectStart,
            request: entry.responseStart - entry.requestStart,
            response: entry.responseEnd - entry.responseStart,
            processing: entry.domComplete - entry.responseEnd,
            total: entry.loadEventEnd - entry.fetchStart
          };

          Object.entries(navigationMetrics).forEach(([name, value]) => {
            recordCustomMetric(`navigation.${name}`, value);
          });
        }

        // Measure specific marks
        if (entry.entryType === 'measure') {
          recordCustomMetric(`measure.${entry.name}`, entry.duration);
        }
      });
    });

    performanceObserver.observe({ 
      entryTypes: ['navigation', 'measure'] 
    });
  } catch (error) {
    console.error('Failed to setup performance observer:', error);
  }
}

/**
 * Monitor resource loading performance
 */
function setupResourceObserver() {
  if (!window.PerformanceObserver) return;

  try {
    resourceObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      
      entries.forEach((entry) => {
        // Track slow resources
        if (entry.duration > 1000) {
          console.warn(`Slow resource: ${entry.name} took ${entry.duration}ms`);
        }

        // Categorize resources
        const url = new URL(entry.name, window.location.origin);
        let category = 'other';
        
        if (url.pathname.endsWith('.js')) category = 'script';
        else if (url.pathname.endsWith('.css')) category = 'style';
        else if (/\.(jpg|jpeg|png|gif|webp|svg)$/i.test(url.pathname)) category = 'image';
        else if (/\.(woff|woff2|ttf|otf)$/i.test(url.pathname)) category = 'font';
        else if (url.hostname !== window.location.hostname) category = 'external';

        // Update resource metrics
        const key = `resource.${category}`;
        const current = customMetrics.get(key) || { count: 0, totalDuration: 0, totalSize: 0 };
        
        customMetrics.set(key, {
          count: current.count + 1,
          totalDuration: current.totalDuration + entry.duration,
          totalSize: current.totalSize + (entry.transferSize || 0),
          avgDuration: (current.totalDuration + entry.duration) / (current.count + 1)
        });
      });
    });

    resourceObserver.observe({ 
      entryTypes: ['resource'] 
    });
  } catch (error) {
    console.error('Failed to setup resource observer:', error);
  }
}

/**
 * Monitor long tasks that block the main thread
 */
function monitorLongTasks() {
  if (!window.PerformanceObserver || !PerformanceObserver.supportedEntryTypes?.includes('longtask')) {
    return;
  }

  try {
    const longTaskObserver = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        console.warn(`Long task detected: ${entry.duration}ms`, {
          startTime: entry.startTime,
          attribution: entry.attribution
        });

        recordCustomMetric('longTask', entry.duration);

        // Alert if task is extremely long
        if (entry.duration > 100) {
          captureMessage(`Long task detected: ${entry.duration}ms`, 'warning', {
            tags: { type: 'performance', metric: 'longTask' },
            extra: {
              duration: entry.duration,
              startTime: entry.startTime,
              attribution: entry.attribution
            }
          });
        }
      });
    });

    longTaskObserver.observe({ entryTypes: ['longtask'] });
  } catch (error) {
    console.error('Failed to setup long task observer:', error);
  }
}

/**
 * Monitor memory usage
 */
function monitorMemoryUsage() {
  if (!performance.memory) return;

  // Check memory every 30 seconds
  setInterval(() => {
    const memoryInfo = {
      usedJSHeapSize: Math.round(performance.memory.usedJSHeapSize / 1048576), // MB
      totalJSHeapSize: Math.round(performance.memory.totalJSHeapSize / 1048576), // MB
      jsHeapSizeLimit: Math.round(performance.memory.jsHeapSizeLimit / 1048576), // MB
      usage: (performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit) * 100
    };

    recordCustomMetric('memory.used', memoryInfo.usedJSHeapSize);
    recordCustomMetric('memory.total', memoryInfo.totalJSHeapSize);
    recordCustomMetric('memory.usage', memoryInfo.usage);

    // Alert on high memory usage
    if (memoryInfo.usage > 90) {
      console.warn('High memory usage detected:', memoryInfo);
      captureMessage(`High memory usage: ${memoryInfo.usage.toFixed(1)}%`, 'warning', {
        tags: { type: 'performance', metric: 'memory' },
        extra: memoryInfo
      });
    }
  }, 30000);
}

/**
 * Record a custom performance metric
 */
export function recordCustomMetric(name, value, tags = {}) {
  if (!isFeatureEnabled('USE_PERFORMANCE_MONITORING')) return;

  const metric = {
    name,
    value,
    timestamp: Date.now(),
    tags
  };

  customMetrics.set(name, metric);

  // Log in development
  if (process.env.NODE_ENV === 'development' && isFeatureEnabled('ENABLE_PERFORMANCE_MARKS')) {
    console.log(`[Custom Metric] ${name}: ${value}`, tags);
  }
}

/**
 * Mark the start of a performance measurement
 */
export function startMark(name) {
  if (!isFeatureEnabled('USE_PERFORMANCE_MONITORING')) return;

  try {
    performance.mark(`${name}-start`);
  } catch (error) {
    console.error(`Failed to create performance mark: ${name}`, error);
  }
}

/**
 * Mark the end of a performance measurement and record the duration
 */
export function endMark(name, tags = {}) {
  if (!isFeatureEnabled('USE_PERFORMANCE_MONITORING')) return;

  try {
    performance.mark(`${name}-end`);
    performance.measure(name, `${name}-start`, `${name}-end`);
    
    const measure = performance.getEntriesByName(name, 'measure')[0];
    if (measure) {
      recordCustomMetric(name, measure.duration, tags);
    }
  } catch (error) {
    console.error(`Failed to measure performance: ${name}`, error);
  }
}

/**
 * Get all performance metrics
 */
export function getAllMetrics() {
  const metrics = {
    webVitals: {},
    custom: {},
    resources: {}
  };

  // Web Vitals
  performanceMetrics.forEach((metric, name) => {
    metrics.webVitals[name] = {
      value: metric.value,
      rating: metric.rating || 'unknown',
      delta: metric.delta
    };
  });

  // Custom metrics
  customMetrics.forEach((metric, name) => {
    if (name.startsWith('resource.')) {
      metrics.resources[name.replace('resource.', '')] = metric;
    } else {
      metrics.custom[name] = metric;
    }
  });

  return metrics;
}

/**
 * Send metrics to analytics service
 */
function sendToAnalytics(metric) {
  // Send to Google Analytics if available
  if (window.gtag) {
    window.gtag('event', metric.name, {
      value: Math.round(metric.value),
      metric_rating: metric.rating,
      metric_delta: metric.delta,
      event_category: 'Web Vitals'
    });
  }

  // Send to custom analytics endpoint
  if (process.env.REACT_APP_ANALYTICS_ENDPOINT) {
    fetch(process.env.REACT_APP_ANALYTICS_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'performance',
        metric,
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString()
      })
    }).catch(error => {
      console.error('Failed to send analytics:', error);
    });
  }
}

/**
 * Performance monitoring React Hook
 */
export function usePerformanceMonitor(componentName) {
  useEffect(() => {
    startMark(`component-${componentName}`);
    
    return () => {
      endMark(`component-${componentName}`, { component: componentName });
    };
  }, [componentName]);
}

/**
 * Cleanup performance monitoring
 */
export function cleanupPerformanceMonitoring() {
  if (performanceObserver) {
    performanceObserver.disconnect();
    performanceObserver = null;
  }
  
  if (resourceObserver) {
    resourceObserver.disconnect();
    resourceObserver = null;
  }
  
  performanceMetrics.clear();
  customMetrics.clear();
}