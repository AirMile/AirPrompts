import { performanceMonitor, analyzeBundleSize } from './performance';

/**
 * Performance test suite for AirPrompts
 */
export class PerformanceTestSuite {
  constructor() {
    this.results = {
      webVitals: {},
      renderMetrics: {},
      bundleSize: {},
      memoryUsage: {},
      loadTime: {},
    };
  }

  /**
   * Run all performance tests
   */
  async runAllTests() {
    console.log('🚀 Starting Performance Test Suite...\n');

    // 1. Measure initial load time
    await this.measureLoadTime();

    // 2. Analyze bundle size
    this.analyzeBundleSize();

    // 3. Measure Web Vitals
    await this.measureWebVitals();

    // 4. Test render performance
    await this.testRenderPerformance();

    // 5. Test memory usage
    this.testMemoryUsage();

    // 6. Test virtualization performance
    await this.testVirtualizationPerformance();

    // Generate report
    return this.generateReport();
  }

  /**
   * Measure page load time
   */
  async measureLoadTime() {
    const navigationTiming = performance.getEntriesByType('navigation')[0];

    if (navigationTiming) {
      this.results.loadTime = {
        dns: navigationTiming.domainLookupEnd - navigationTiming.domainLookupStart,
        tcp: navigationTiming.connectEnd - navigationTiming.connectStart,
        request: navigationTiming.responseStart - navigationTiming.requestStart,
        response: navigationTiming.responseEnd - navigationTiming.responseStart,
        dom: navigationTiming.domComplete - navigationTiming.responseEnd,
        load: navigationTiming.loadEventEnd - navigationTiming.loadEventStart,
        total: navigationTiming.loadEventEnd - navigationTiming.fetchStart,
      };
    }
  }

  /**
   * Analyze bundle sizes
   */
  analyzeBundleSize() {
    this.results.bundleSize = analyzeBundleSize();
  }

  /**
   * Measure Core Web Vitals
   */
  async measureWebVitals() {
    // Wait for metrics to be collected
    await new Promise((resolve) => setTimeout(resolve, 3000));

    const report = performanceMonitor.getReport();
    this.results.webVitals = report.webVitals;
  }

  /**
   * Test render performance
   */
  async testRenderPerformance() {
    const testData = this.generateTestData(1000);

    // Measure initial render
    performanceMonitor.mark('initial-render-start');
    // Trigger render of test data
    await this.renderTestData(testData);
    performanceMonitor.mark('initial-render-end');
    performanceMonitor.measure('initial-render', 'initial-render-start', 'initial-render-end');

    // Measure re-render
    performanceMonitor.mark('re-render-start');
    await this.updateTestData(testData);
    performanceMonitor.mark('re-render-end');
    performanceMonitor.measure('re-render', 're-render-start', 're-render-end');

    const report = performanceMonitor.getReport();
    this.results.renderMetrics = report.customMetrics;
  }

  /**
   * Test memory usage
   */
  testMemoryUsage() {
    if (performance.memory) {
      this.results.memoryUsage = {
        usedJSHeapSize: (performance.memory.usedJSHeapSize / 1048576).toFixed(2) + ' MB',
        totalJSHeapSize: (performance.memory.totalJSHeapSize / 1048576).toFixed(2) + ' MB',
        jsHeapSizeLimit: (performance.memory.jsHeapSizeLimit / 1048576).toFixed(2) + ' MB',
      };
    }
  }

  /**
   * Test virtualization performance with large datasets
   */
  async testVirtualizationPerformance() {
    const testSizes = [100, 1000, 5000, 10000];
    const results = {};

    for (const size of testSizes) {
      const data = this.generateTestData(size);

      performanceMonitor.mark(`virtualization-${size}-start`);
      await this.renderVirtualizedList(data);
      performanceMonitor.mark(`virtualization-${size}-end`);
      performanceMonitor.measure(
        `virtualization-${size}`,
        `virtualization-${size}-start`,
        `virtualization-${size}-end`
      );

      // Simulate scrolling
      await this.simulateScrolling(size);
    }

    const report = performanceMonitor.getReport();
    this.results.virtualization = report.customMetrics;
  }

  /**
   * Generate test data
   */
  generateTestData(count) {
    return Array.from({ length: count }, (_, i) => ({
      id: `test-${i}`,
      name: `Test Item ${i}`,
      description: `Description for test item ${i}`,
      content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
      category: ['analysis', 'development', 'testing'][i % 3],
      favorite: i % 5 === 0,
      createdAt: new Date(Date.now() - i * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - i * 43200000).toISOString(),
    }));
  }

  /**
   * Simulate rendering test data
   */
  async renderTestData(data) {
    // This would be replaced with actual render logic
    return new Promise((resolve) => {
      requestAnimationFrame(() => {
        // Simulate DOM operations
        const container = document.createElement('div');
        data.forEach((item) => {
          const element = document.createElement('div');
          element.textContent = item.name;
          container.appendChild(element);
        });
        resolve();
      });
    });
  }

  /**
   * Simulate updating test data
   */
  async updateTestData(data) {
    return this.renderTestData(data.map((item) => ({ ...item, name: item.name + ' (updated)' })));
  }

  /**
   * Simulate rendering virtualized list
   */
  async renderVirtualizedList(data) {
    // Simulate virtualized rendering
    return new Promise((resolve) => {
      requestAnimationFrame(() => {
        // Only render visible items (simulate 50 visible)
        const visibleCount = Math.min(50, data.length);
        const container = document.createElement('div');

        for (let i = 0; i < visibleCount; i++) {
          const element = document.createElement('div');
          element.textContent = data[i].name;
          container.appendChild(element);
        }

        resolve();
      });
    });
  }

  /**
   * Simulate scrolling behavior
   */
  async simulateScrolling(itemCount) {
    const scrollSteps = Math.min(10, Math.floor(itemCount / 100));

    for (let i = 0; i < scrollSteps; i++) {
      await new Promise((resolve) => {
        requestAnimationFrame(() => {
          // Simulate scroll event
          window.dispatchEvent(new Event('scroll'));
          resolve();
        });
      });
    }
  }

  /**
   * Generate performance report
   */
  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      results: this.results,
      summary: this.generateSummary(),
    };

    // Log report to console
    console.log('\n📊 Performance Test Results:');
    console.log('================================\n');

    console.log('🌐 Web Vitals:');
    console.log(`  - LCP: ${this.results.webVitals.lcp?.toFixed(2) || 'N/A'} ms`);
    console.log(`  - FID: ${this.results.webVitals.fid?.toFixed(2) || 'N/A'} ms`);
    console.log(`  - CLS: ${this.results.webVitals.cls?.toFixed(4) || 'N/A'}`);
    console.log(`  - TTFB: ${this.results.webVitals.ttfb?.toFixed(2) || 'N/A'} ms\n`);

    console.log('⚡ Load Time:');
    console.log(`  - Total: ${this.results.loadTime.total?.toFixed(2) || 'N/A'} ms`);
    console.log(`  - DOM: ${this.results.loadTime.dom?.toFixed(2) || 'N/A'} ms\n`);

    console.log('📦 Bundle Size:');
    console.log(`  - JS: ${(this.results.bundleSize.scripts / 1024).toFixed(2)} KB`);
    console.log(`  - CSS: ${(this.results.bundleSize.styles / 1024).toFixed(2)} KB`);
    console.log(`  - Total: ${(this.results.bundleSize.total / 1024).toFixed(2)} KB\n`);

    console.log('💾 Memory Usage:');
    console.log(`  - Used: ${this.results.memoryUsage.usedJSHeapSize || 'N/A'}`);
    console.log(`  - Total: ${this.results.memoryUsage.totalJSHeapSize || 'N/A'}\n`);

    console.log('✅ Performance Score:', this.calculatePerformanceScore());
    console.log('================================\n');

    return report;
  }

  /**
   * Generate summary of results
   */
  generateSummary() {
    const score = this.calculatePerformanceScore();
    const grade =
      score >= 95 ? 'A+' : score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 70 ? 'C' : 'D';

    return {
      score,
      grade,
      recommendations: this.generateRecommendations(),
    };
  }

  /**
   * Calculate overall performance score
   */
  calculatePerformanceScore() {
    let score = 100;

    // Deduct points for poor metrics
    const { lcp, fid, cls } = this.results.webVitals;

    // LCP scoring (target < 2.5s)
    if (lcp > 4000) score -= 20;
    else if (lcp > 2500) score -= 10;

    // FID scoring (target < 100ms)
    if (fid > 300) score -= 15;
    else if (fid > 100) score -= 5;

    // CLS scoring (target < 0.1)
    if (cls > 0.25) score -= 15;
    else if (cls > 0.1) score -= 5;

    // Bundle size scoring (target < 500KB)
    const bundleSizeKB = this.results.bundleSize.total / 1024;
    if (bundleSizeKB > 1000) score -= 20;
    else if (bundleSizeKB > 500) score -= 10;

    // Load time scoring (target < 3s)
    const loadTime = this.results.loadTime.total;
    if (loadTime > 5000) score -= 15;
    else if (loadTime > 3000) score -= 5;

    return Math.max(0, score);
  }

  /**
   * Generate performance recommendations
   */
  generateRecommendations() {
    const recommendations = [];

    if (this.results.webVitals.lcp > 2500) {
      recommendations.push(
        'Optimize Largest Contentful Paint by lazy loading images and optimizing critical rendering path'
      );
    }

    if (this.results.webVitals.fid > 100) {
      recommendations.push('Reduce First Input Delay by minimizing JavaScript execution time');
    }

    if (this.results.webVitals.cls > 0.1) {
      recommendations.push(
        'Improve Cumulative Layout Shift by setting dimensions for images and dynamic content'
      );
    }

    if (this.results.bundleSize.total > 512000) {
      recommendations.push('Reduce bundle size by implementing code splitting and tree shaking');
    }

    return recommendations;
  }
}

// Export singleton instance
export const performanceTestSuite = new PerformanceTestSuite();

// Auto-run tests in development
if (import.meta.env.DEV && window.location.search.includes('perf=true')) {
  window.addEventListener('load', () => {
    setTimeout(() => {
      performanceTestSuite.runAllTests();
    }, 2000);
  });
}
