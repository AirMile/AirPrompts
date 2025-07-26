/**
 * PerformanceMonitor - Tracks migration performance metrics
 * 
 * Features:
 * - Operation timing
 * - Memory usage tracking
 * - Throughput calculation
 * - Performance alerts
 * - Historical metrics storage
 */
class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.thresholds = {
      operationTime: 5000, // 5 seconds
      memoryIncrease: 50 * 1024 * 1024, // 50MB
      throughputMin: 100, // items per second
    };
    
    this.currentOperations = new Map();
    this.historicalData = [];
    this.maxHistorySize = 1000;
  }

  /**
   * Start monitoring an operation
   */
  startOperation(operationId, metadata = {}) {
    const startMetrics = {
      id: operationId,
      startTime: performance.now(),
      startMemory: this.getMemoryUsage(),
      metadata,
      marks: new Map()
    };
    
    this.currentOperations.set(operationId, startMetrics);
    
    return {
      mark: (label) => this.markOperation(operationId, label),
      end: (result) => this.endOperation(operationId, result)
    };
  }

  /**
   * Mark a checkpoint in an operation
   */
  markOperation(operationId, label) {
    const operation = this.currentOperations.get(operationId);
    if (!operation) {
      console.warn(`Operation ${operationId} not found`);
      return;
    }
    
    operation.marks.set(label, {
      time: performance.now(),
      memory: this.getMemoryUsage()
    });
  }

  /**
   * End monitoring an operation
   */
  endOperation(operationId, result = {}) {
    const operation = this.currentOperations.get(operationId);
    if (!operation) {
      console.warn(`Operation ${operationId} not found`);
      return null;
    }
    
    const endTime = performance.now();
    const endMemory = this.getMemoryUsage();
    
    const metrics = {
      id: operationId,
      duration: endTime - operation.startTime,
      memoryDelta: endMemory.used - operation.startMemory.used,
      startTime: operation.startTime,
      endTime,
      marks: Array.from(operation.marks.entries()).map(([label, data]) => ({
        label,
        elapsed: data.time - operation.startTime,
        memoryDelta: data.memory.used - operation.startMemory.used
      })),
      result,
      metadata: operation.metadata
    };
    
    // Check thresholds
    this.checkThresholds(metrics);
    
    // Store metrics
    this.storeMetrics(operationId, metrics);
    
    // Clean up
    this.currentOperations.delete(operationId);
    
    return metrics;
  }

  /**
   * Calculate throughput
   */
  calculateThroughput(itemCount, duration) {
    if (duration === 0) return Infinity;
    return (itemCount / duration) * 1000; // items per second
  }

  /**
   * Get memory usage
   */
  getMemoryUsage() {
    if (performance.memory) {
      return {
        used: performance.memory.usedJSHeapSize,
        total: performance.memory.totalJSHeapSize,
        limit: performance.memory.jsHeapSizeLimit
      };
    }
    
    // Fallback for environments without performance.memory
    return {
      used: 0,
      total: 0,
      limit: 0
    };
  }

  /**
   * Check performance thresholds
   */
  checkThresholds(metrics) {
    const alerts = [];
    
    // Check operation time
    if (metrics.duration > this.thresholds.operationTime) {
      alerts.push({
        type: 'slow_operation',
        message: `Operation ${metrics.id} took ${metrics.duration.toFixed(2)}ms (threshold: ${this.thresholds.operationTime}ms)`,
        severity: 'warning'
      });
    }
    
    // Check memory increase
    if (metrics.memoryDelta > this.thresholds.memoryIncrease) {
      alerts.push({
        type: 'high_memory',
        message: `Operation ${metrics.id} increased memory by ${(metrics.memoryDelta / 1024 / 1024).toFixed(2)}MB`,
        severity: 'warning'
      });
    }
    
    // Check throughput if applicable
    if (metrics.result.itemCount) {
      const throughput = this.calculateThroughput(metrics.result.itemCount, metrics.duration);
      if (throughput < this.thresholds.throughputMin) {
        alerts.push({
          type: 'low_throughput',
          message: `Operation ${metrics.id} processed ${throughput.toFixed(2)} items/sec (minimum: ${this.thresholds.throughputMin})`,
          severity: 'warning'
        });
      }
    }
    
    // Log alerts
    alerts.forEach(alert => {
      console.warn(`[Performance Alert] ${alert.message}`);
    });
    
    return alerts;
  }

  /**
   * Store metrics for historical analysis
   */
  storeMetrics(operationId, metrics) {
    this.metrics.set(operationId, metrics);
    
    // Add to historical data
    this.historicalData.push({
      ...metrics,
      timestamp: Date.now()
    });
    
    // Limit history size
    if (this.historicalData.length > this.maxHistorySize) {
      this.historicalData.shift();
    }
  }

  /**
   * Get metrics for an operation
   */
  getMetrics(operationId) {
    return this.metrics.get(operationId);
  }

  /**
   * Get aggregated statistics
   */
  getStatistics(operationType = null) {
    let data = this.historicalData;
    
    if (operationType) {
      data = data.filter(m => m.metadata.type === operationType);
    }
    
    if (data.length === 0) {
      return null;
    }
    
    const durations = data.map(m => m.duration);
    const memoryDeltas = data.map(m => m.memoryDelta);
    
    return {
      count: data.length,
      duration: {
        min: Math.min(...durations),
        max: Math.max(...durations),
        avg: durations.reduce((a, b) => a + b, 0) / durations.length,
        median: this.calculateMedian(durations)
      },
      memory: {
        min: Math.min(...memoryDeltas),
        max: Math.max(...memoryDeltas),
        avg: memoryDeltas.reduce((a, b) => a + b, 0) / memoryDeltas.length
      },
      throughput: this.calculateAverageThroughput(data)
    };
  }

  /**
   * Calculate median value
   */
  calculateMedian(values) {
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    
    if (sorted.length % 2 === 0) {
      return (sorted[mid - 1] + sorted[mid]) / 2;
    }
    
    return sorted[mid];
  }

  /**
   * Calculate average throughput
   */
  calculateAverageThroughput(data) {
    const throughputs = data
      .filter(m => m.result.itemCount)
      .map(m => this.calculateThroughput(m.result.itemCount, m.duration));
    
    if (throughputs.length === 0) {
      return null;
    }
    
    return throughputs.reduce((a, b) => a + b, 0) / throughputs.length;
  }

  /**
   * Get performance report
   */
  generateReport() {
    const operationTypes = new Set(
      this.historicalData.map(m => m.metadata.type).filter(Boolean)
    );
    
    const report = {
      summary: {
        totalOperations: this.historicalData.length,
        totalDuration: this.historicalData.reduce((sum, m) => sum + m.duration, 0),
        totalMemoryDelta: this.historicalData.reduce((sum, m) => sum + m.memoryDelta, 0),
        operationTypes: Array.from(operationTypes)
      },
      byType: {}
    };
    
    // Statistics by operation type
    for (const type of operationTypes) {
      report.byType[type] = this.getStatistics(type);
    }
    
    // Overall statistics
    report.overall = this.getStatistics();
    
    // Recent operations
    report.recent = this.historicalData.slice(-10).map(m => ({
      id: m.id,
      type: m.metadata.type,
      duration: m.duration,
      memoryDelta: m.memoryDelta,
      timestamp: m.timestamp
    }));
    
    return report;
  }

  /**
   * Monitor async operation with automatic timing
   */
  async monitorAsync(operationId, asyncFn, metadata = {}) {
    const monitor = this.startOperation(operationId, metadata);
    
    try {
      const result = await asyncFn(monitor);
      monitor.end({ success: true, ...result });
      return result;
    } catch (error) {
      monitor.end({ success: false, error: error.message });
      throw error;
    }
  }

  /**
   * Create performance marks for browser DevTools
   */
  createPerformanceMark(name) {
    if (typeof performance !== 'undefined' && performance.mark) {
      performance.mark(name);
    }
  }

  /**
   * Measure between performance marks
   */
  measurePerformance(name, startMark, endMark) {
    if (typeof performance !== 'undefined' && performance.measure) {
      try {
        performance.measure(name, startMark, endMark);
        const entries = performance.getEntriesByName(name);
        return entries[entries.length - 1];
      } catch (error) {
        console.warn('Performance measurement failed:', error);
      }
    }
    return null;
  }

  /**
   * Clear performance data
   */
  clear() {
    this.metrics.clear();
    this.historicalData = [];
    this.currentOperations.clear();
    
    // Clear browser performance entries
    if (typeof performance !== 'undefined' && performance.clearMeasures) {
      performance.clearMeasures();
      performance.clearMarks();
    }
  }

  /**
   * Export metrics for analysis
   */
  exportMetrics() {
    return {
      historical: this.historicalData,
      current: Array.from(this.currentOperations.entries()).map(([id, op]) => ({
        id,
        startTime: op.startTime,
        elapsed: performance.now() - op.startTime,
        metadata: op.metadata
      })),
      report: this.generateReport()
    };
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Also export class for testing
export default PerformanceMonitor;