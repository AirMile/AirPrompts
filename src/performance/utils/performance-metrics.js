/**
 * Performance measurement utilities
 */

export class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.observers = new Set();
  }

  /**
   * Start measuring a performance metric
   * @param {string} name - Metric name
   */
  startMeasure(name) {
    performance.mark(`${name}-start`);
  }

  /**
   * End measuring a performance metric
   * @param {string} name - Metric name
   * @returns {number} - Duration in milliseconds
   */
  endMeasure(name) {
    performance.mark(`${name}-end`);
    performance.measure(name, `${name}-start`, `${name}-end`);
    
    const measure = performance.getEntriesByName(name)[0];
    const duration = measure ? measure.duration : 0;
    
    this.recordMetric(name, duration);
    
    // Clean up
    performance.clearMarks(`${name}-start`);
    performance.clearMarks(`${name}-end`);
    performance.clearMeasures(name);
    
    return duration;
  }

  /**
   * Record a metric value
   * @param {string} name - Metric name
   * @param {number} value - Metric value
   */
  recordMetric(name, value) {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    
    const values = this.metrics.get(name);
    values.push({
      value,
      timestamp: Date.now()
    });
    
    // Keep only last 100 measurements
    if (values.length > 100) {
      values.shift();
    }
    
    this.notifyObservers(name, value);
  }

  /**
   * Get statistics for a metric
   * @param {string} name - Metric name
   * @returns {Object} - Statistics
   */
  getStats(name) {
    const values = this.metrics.get(name);
    if (!values || values.length === 0) {
      return null;
    }
    
    const numbers = values.map(v => v.value);
    const sorted = [...numbers].sort((a, b) => a - b);
    
    return {
      count: numbers.length,
      min: Math.min(...numbers),
      max: Math.max(...numbers),
      avg: numbers.reduce((a, b) => a + b, 0) / numbers.length,
      median: sorted[Math.floor(sorted.length / 2)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)]
    };
  }

  /**
   * Observe metric changes
   * @param {Function} callback - Callback function
   */
  observe(callback) {
    this.observers.add(callback);
    
    return () => {
      this.observers.delete(callback);
    };
  }

  /**
   * Notify observers of metric changes
   * @param {string} name - Metric name
   * @param {number} value - Metric value
   */
  notifyObservers(name, value) {
    this.observers.forEach(callback => {
      callback({ name, value, stats: this.getStats(name) });
    });
  }

  /**
   * Clear all metrics
   */
  clear() {
    this.metrics.clear();
  }
}

/**
 * Measure React component performance
 * @param {Function} renderFn - Function that renders the component
 * @returns {Object} - Performance metrics
 */
export async function measurePerformance(renderFn) {
  const startTime = performance.now();
  const startMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;
  
  // Count initial DOM nodes
  const initialNodes = document.querySelectorAll('*').length;
  
  // Render component
  const result = await renderFn();
  
  // Wait for paint
  await new Promise(resolve => requestAnimationFrame(resolve));
  
  const endTime = performance.now();
  const endMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;
  
  // Count final DOM nodes
  const finalNodes = document.querySelectorAll('*').length;
  
  // Get React fiber info
  const reactRoot = document.querySelector('#root')._reactRootContainer;
  const componentCount = countComponents(reactRoot);
  
  return {
    renderTime: endTime - startTime,
    memoryUsed: endMemory - startMemory,
    domNodes: finalNodes - initialNodes,
    componentCount,
    result
  };
}

/**
 * Count React components in the tree
 * @param {Object} node - React fiber node
 * @returns {number} - Component count
 */
function countComponents(node) {
  if (!node) return 0;
  
  let count = 0;
  const queue = [node];
  
  while (queue.length > 0) {
    const current = queue.shift();
    
    if (current._debugOwner || current.elementType) {
      count++;
    }
    
    if (current.child) queue.push(current.child);
    if (current.sibling) queue.push(current.sibling);
  }
  
  return count;
}

/**
 * Profile function execution
 * @param {Function} fn - Function to profile
 * @param {string} name - Profile name
 * @returns {Function} - Profiled function
 */
export function profile(fn, name) {
  return async function(...args) {
    const monitor = new PerformanceMonitor();
    monitor.startMeasure(name);
    
    try {
      const result = await fn.apply(this, args);
      const duration = monitor.endMeasure(name);
      
      console.log(`[Performance] ${name}: ${duration.toFixed(2)}ms`);
      
      return result;
    } catch (error) {
      monitor.endMeasure(name);
      throw error;
    }
  };
}

/**
 * Measure Web Vitals
 * @returns {Object} - Web vitals metrics
 */
export function measureWebVitals() {
  const vitals = {};
  
  // First Contentful Paint (FCP)
  const fcp = performance.getEntriesByName('first-contentful-paint')[0];
  if (fcp) {
    vitals.fcp = fcp.startTime;
  }
  
  // Largest Contentful Paint (LCP)
  const lcp = new PerformanceObserver((list) => {
    const entries = list.getEntries();
    const lastEntry = entries[entries.length - 1];
    vitals.lcp = lastEntry.startTime;
  });
  lcp.observe({ entryTypes: ['largest-contentful-paint'] });
  
  // First Input Delay (FID)
  const fid = new PerformanceObserver((list) => {
    const entries = list.getEntries();
    entries.forEach(entry => {
      vitals.fid = entry.processingStart - entry.startTime;
    });
  });
  fid.observe({ entryTypes: ['first-input'] });
  
  // Cumulative Layout Shift (CLS)
  let clsValue = 0;
  const cls = new PerformanceObserver((list) => {
    const entries = list.getEntries();
    entries.forEach(entry => {
      if (!entry.hadRecentInput) {
        clsValue += entry.value;
        vitals.cls = clsValue;
      }
    });
  });
  cls.observe({ entryTypes: ['layout-shift'] });
  
  // Time to Interactive (TTI)
  vitals.tti = performance.timing.domInteractive - performance.timing.navigationStart;
  
  return vitals;
}

/**
 * Memory leak detector
 */
export class MemoryLeakDetector {
  constructor(threshold = 10 * 1024 * 1024) { // 10MB default threshold
    this.measurements = [];
    this.threshold = threshold;
  }

  /**
   * Take a memory snapshot
   */
  snapshot() {
    if (!performance.memory) {
      console.warn('Memory API not available');
      return;
    }
    
    const measurement = {
      timestamp: Date.now(),
      usedJSHeapSize: performance.memory.usedJSHeapSize,
      totalJSHeapSize: performance.memory.totalJSHeapSize,
      jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
    };
    
    this.measurements.push(measurement);
    
    // Keep only last 10 measurements
    if (this.measurements.length > 10) {
      this.measurements.shift();
    }
  }

  /**
   * Check for potential memory leaks
   * @returns {Object} - Leak detection result
   */
  checkForLeaks() {
    if (this.measurements.length < 2) {
      return { hasLeak: false, message: 'Not enough measurements' };
    }
    
    const first = this.measurements[0];
    const last = this.measurements[this.measurements.length - 1];
    const increase = last.usedJSHeapSize - first.usedJSHeapSize;
    
    if (increase > this.threshold) {
      return {
        hasLeak: true,
        increase,
        message: `Memory increased by ${(increase / 1024 / 1024).toFixed(2)}MB`
      };
    }
    
    return { hasLeak: false, increase };
  }

  /**
   * Reset measurements
   */
  reset() {
    this.measurements = [];
  }
}

/**
 * FPS Monitor
 */
export class FPSMonitor {
  constructor() {
    this.fps = 0;
    this.frames = 0;
    this.lastTime = performance.now();
    this.running = false;
  }

  /**
   * Start monitoring FPS
   */
  start() {
    if (this.running) return;
    
    this.running = true;
    this.lastTime = performance.now();
    this.loop();
  }

  /**
   * Stop monitoring FPS
   */
  stop() {
    this.running = false;
  }

  /**
   * Main loop
   */
  loop() {
    if (!this.running) return;
    
    const currentTime = performance.now();
    this.frames++;
    
    if (currentTime >= this.lastTime + 1000) {
      this.fps = Math.round((this.frames * 1000) / (currentTime - this.lastTime));
      this.frames = 0;
      this.lastTime = currentTime;
    }
    
    requestAnimationFrame(() => this.loop());
  }

  /**
   * Get current FPS
   * @returns {number} - Current FPS
   */
  getFPS() {
    return this.fps;
  }
}

// Export singleton instances
export const performanceMonitor = new PerformanceMonitor();
export const memoryLeakDetector = new MemoryLeakDetector();
export const fpsMonitor = new FPSMonitor();