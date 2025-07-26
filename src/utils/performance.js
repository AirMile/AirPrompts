/**
 * Performance monitoring utilities
 */

// Performance metrics collector
class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.observers = new Map();
    this.isEnabled = process.env.NODE_ENV === 'development' || window.location.search.includes('debug=true');
  }

  // Measure component render time
  measureRender(componentName, phase, actualDuration) {
    if (!this.isEnabled) return;

    const key = `${componentName}_${phase}`;
    const current = this.metrics.get(key) || [];
    current.push({
      duration: actualDuration,
      timestamp: Date.now(),
      phase
    });

    // Keep only last 100 measurements
    if (current.length > 100) {
      current.shift();
    }

    this.metrics.set(key, current);

    // Log slow renders
    if (actualDuration > 16) { // More than 1 frame (60fps)
      console.warn(`[Performance] Slow render in ${componentName}: ${actualDuration.toFixed(2)}ms`);
    }
  }

  // Track Core Web Vitals
  initWebVitals() {
    if (!this.isEnabled || typeof window === 'undefined') return;

    // Largest Contentful Paint (LCP)
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      this.metrics.set('lcp', lastEntry.startTime);
      console.log('[Performance] LCP:', lastEntry.startTime.toFixed(2), 'ms');
    });
    lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
    this.observers.set('lcp', lcpObserver);

    // First Input Delay (FID)
    const fidObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach(entry => {
        this.metrics.set('fid', entry.processingStart - entry.startTime);
        console.log('[Performance] FID:', (entry.processingStart - entry.startTime).toFixed(2), 'ms');
      });
    });
    fidObserver.observe({ entryTypes: ['first-input'] });
    this.observers.set('fid', fidObserver);

    // Cumulative Layout Shift (CLS)
    let clsValue = 0;
    const clsObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
          this.metrics.set('cls', clsValue);
        }
      }
    });
    clsObserver.observe({ entryTypes: ['layout-shift'] });
    this.observers.set('cls', clsObserver);

    // Time to First Byte (TTFB)
    if (window.performance && window.performance.timing) {
      const navigationTiming = window.performance.timing;
      const ttfb = navigationTiming.responseStart - navigationTiming.navigationStart;
      this.metrics.set('ttfb', ttfb);
      console.log('[Performance] TTFB:', ttfb, 'ms');
    }
  }

  // Track custom metrics
  mark(name) {
    if (!this.isEnabled) return;
    performance.mark(name);
  }

  measure(name, startMark, endMark) {
    if (!this.isEnabled) return;
    
    try {
      performance.measure(name, startMark, endMark);
      const measure = performance.getEntriesByName(name, 'measure')[0];
      if (measure) {
        this.metrics.set(name, measure.duration);
        console.log(`[Performance] ${name}:`, measure.duration.toFixed(2), 'ms');
      }
    } catch (error) {
      console.error('[Performance] Measurement error:', error);
    }
  }

  // Get performance report
  getReport() {
    const report = {
      webVitals: {
        lcp: this.metrics.get('lcp'),
        fid: this.metrics.get('fid'),
        cls: this.metrics.get('cls'),
        ttfb: this.metrics.get('ttfb')
      },
      customMetrics: {},
      componentRenders: {}
    };

    this.metrics.forEach((value, key) => {
      if (key.includes('_')) {
        // Component render metrics
        const [component, phase] = key.split('_');
        if (!report.componentRenders[component]) {
          report.componentRenders[component] = {};
        }
        const durations = value.map(v => v.duration);
        report.componentRenders[component][phase] = {
          count: durations.length,
          average: durations.reduce((a, b) => a + b, 0) / durations.length,
          max: Math.max(...durations),
          min: Math.min(...durations)
        };
      } else if (!['lcp', 'fid', 'cls', 'ttfb'].includes(key)) {
        // Custom metrics
        report.customMetrics[key] = value;
      }
    });

    return report;
  }

  // Cleanup
  destroy() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
    this.metrics.clear();
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

// React Profiler callback
export const onRenderCallback = (id, phase, actualDuration, baseDuration, startTime, commitTime) => {
  performanceMonitor.measureRender(id, phase, actualDuration);
};

// Performance HOC for components
export const withPerformanceTracking = (Component, componentName) => {
  return React.forwardRef((props, ref) => {
    React.useEffect(() => {
      performanceMonitor.mark(`${componentName}-mount-start`);
      return () => {
        performanceMonitor.mark(`${componentName}-mount-end`);
        performanceMonitor.measure(
          `${componentName}-mount-duration`,
          `${componentName}-mount-start`,
          `${componentName}-mount-end`
        );
      };
    }, []);

    return (
      <React.Profiler id={componentName} onRender={onRenderCallback}>
        <Component ref={ref} {...props} />
      </React.Profiler>
    );
  });
};

// Initialize on load
if (typeof window !== 'undefined') {
  // Wait for page load to measure web vitals
  if (document.readyState === 'complete') {
    performanceMonitor.initWebVitals();
  } else {
    window.addEventListener('load', () => {
      performanceMonitor.initWebVitals();
    });
  }
}

// Export utilities
export const measurePerformance = (fn, name) => {
  return async (...args) => {
    performanceMonitor.mark(`${name}-start`);
    try {
      const result = await fn(...args);
      performanceMonitor.mark(`${name}-end`);
      performanceMonitor.measure(name, `${name}-start`, `${name}-end`);
      return result;
    } catch (error) {
      performanceMonitor.mark(`${name}-error`);
      performanceMonitor.measure(`${name}-error`, `${name}-start`, `${name}-error`);
      throw error;
    }
  };
};

// Bundle size analyzer helper
export const analyzeBundleSize = () => {
  if (!window.performance || !window.performance.getEntriesByType) {
    console.warn('[Performance] Resource timing API not available');
    return;
  }

  const resources = window.performance.getEntriesByType('resource');
  const scripts = resources.filter(r => r.name.endsWith('.js'));
  const styles = resources.filter(r => r.name.endsWith('.css'));

  const totalScriptSize = scripts.reduce((acc, script) => {
    return acc + (script.transferSize || 0);
  }, 0);

  const totalStyleSize = styles.reduce((acc, style) => {
    return acc + (style.transferSize || 0);
  }, 0);

  console.log('[Performance] Bundle Analysis:');
  console.log(`- Total JS: ${(totalScriptSize / 1024).toFixed(2)}KB`);
  console.log(`- Total CSS: ${(totalStyleSize / 1024).toFixed(2)}KB`);
  console.log(`- Total: ${((totalScriptSize + totalStyleSize) / 1024).toFixed(2)}KB`);

  // Log individual chunks
  scripts.forEach(script => {
    const size = script.transferSize || 0;
    if (size > 0) {
      console.log(`  - ${script.name.split('/').pop()}: ${(size / 1024).toFixed(2)}KB`);
    }
  });

  return {
    scripts: totalScriptSize,
    styles: totalStyleSize,
    total: totalScriptSize + totalStyleSize
  };
};