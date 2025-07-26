import { storageFacade } from '../storage/StorageFacade';

/**
 * MigrationLogger - Comprehensive logging for migration activities
 * 
 * Features:
 * - Structured logging with levels
 * - Persistent log storage
 * - Query and filter capabilities
 * - Performance metrics tracking
 * - Error stack trace capture
 */
class MigrationLogger {
  constructor() {
    this.logBuffer = [];
    this.maxBufferSize = 1000;
    this.logLevels = {
      DEBUG: 0,
      INFO: 1,
      WARN: 2,
      ERROR: 3,
      CRITICAL: 4
    };
    this.currentLevel = this.logLevels.INFO;
    
    // Performance tracking
    this.metrics = {
      totalLogs: 0,
      errorCount: 0,
      warnCount: 0,
      startTime: Date.now()
    };
  }

  /**
   * Log a debug message
   */
  debug(message, data = {}) {
    this.log('DEBUG', message, data);
  }

  /**
   * Log an info message
   */
  info(message, data = {}) {
    this.log('INFO', message, data);
  }

  /**
   * Log a warning
   */
  warn(message, data = {}) {
    this.log('WARN', message, data);
    this.metrics.warnCount++;
  }

  /**
   * Log an error
   */
  error(message, error = null, data = {}) {
    const errorData = {
      ...data,
      error: error ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : null
    };
    
    this.log('ERROR', message, errorData);
    this.metrics.errorCount++;
  }

  /**
   * Log a critical error
   */
  critical(message, error = null, data = {}) {
    const errorData = {
      ...data,
      error: error ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : null
    };
    
    this.log('CRITICAL', message, errorData);
    this.metrics.errorCount++;
    
    // Critical errors trigger immediate persistence
    this.flush();
  }

  /**
   * Core logging method
   */
  log(level, message, data = {}) {
    if (this.logLevels[level] < this.currentLevel) {
      return;
    }
    
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
      context: this.getContext()
    };
    
    // Add to buffer
    this.logBuffer.push(logEntry);
    this.metrics.totalLogs++;
    
    // Console output in development
    if (process.env.NODE_ENV === 'development') {
      this.consoleOutput(logEntry);
    }
    
    // Check if buffer needs flushing
    if (this.logBuffer.length >= this.maxBufferSize) {
      this.flush();
    }
  }

  /**
   * Get current context information
   */
  getContext() {
    return {
      sessionId: this.sessionId || this.generateSessionId(),
      userAgent: navigator.userAgent,
      timestamp: Date.now(),
      memory: this.getMemoryUsage()
    };
  }

  /**
   * Get memory usage if available
   */
  getMemoryUsage() {
    if (performance.memory) {
      return {
        used: Math.round(performance.memory.usedJSHeapSize / 1048576), // MB
        total: Math.round(performance.memory.totalJSHeapSize / 1048576), // MB
        limit: Math.round(performance.memory.jsHeapSizeLimit / 1048576) // MB
      };
    }
    return null;
  }

  /**
   * Console output formatting
   */
  consoleOutput(logEntry) {
    const styles = {
      DEBUG: 'color: gray',
      INFO: 'color: blue',
      WARN: 'color: orange',
      ERROR: 'color: red',
      CRITICAL: 'color: red; font-weight: bold'
    };
    
    console.log(
      `%c[${logEntry.level}] ${logEntry.timestamp} - ${logEntry.message}`,
      styles[logEntry.level]
    );
    
    if (Object.keys(logEntry.data).length > 0) {
      console.log('Data:', logEntry.data);
    }
  }

  /**
   * Flush logs to persistent storage
   */
  async flush() {
    if (this.logBuffer.length === 0) return;
    
    try {
      // Get existing logs
      const existingLogs = await storageFacade.get('migration_logs') || [];
      
      // Append new logs
      const updatedLogs = [...existingLogs, ...this.logBuffer];
      
      // Keep only recent logs (last 10000 entries)
      const recentLogs = updatedLogs.slice(-10000);
      
      // Save to storage
      await storageFacade.set('migration_logs', recentLogs);
      
      // Clear buffer
      this.logBuffer = [];
      
    } catch (error) {
      console.error('Failed to flush logs:', error);
    }
  }

  /**
   * Query logs
   */
  async queryLogs(options = {}) {
    const logs = await storageFacade.get('migration_logs') || [];
    
    let filtered = logs;
    
    // Filter by level
    if (options.level) {
      filtered = filtered.filter(log => log.level === options.level);
    }
    
    // Filter by date range
    if (options.startDate) {
      filtered = filtered.filter(log => 
        new Date(log.timestamp) >= new Date(options.startDate)
      );
    }
    
    if (options.endDate) {
      filtered = filtered.filter(log => 
        new Date(log.timestamp) <= new Date(options.endDate)
      );
    }
    
    // Filter by message content
    if (options.search) {
      const searchLower = options.search.toLowerCase();
      filtered = filtered.filter(log => 
        log.message.toLowerCase().includes(searchLower)
      );
    }
    
    // Sort by timestamp (newest first by default)
    filtered.sort((a, b) => 
      new Date(b.timestamp) - new Date(a.timestamp)
    );
    
    // Limit results
    if (options.limit) {
      filtered = filtered.slice(0, options.limit);
    }
    
    return filtered;
  }

  /**
   * Get error summary
   */
  async getErrorSummary() {
    const logs = await this.queryLogs({ level: 'ERROR' });
    const criticalLogs = await this.queryLogs({ level: 'CRITICAL' });
    
    const errorTypes = {};
    
    [...logs, ...criticalLogs].forEach(log => {
      const errorName = log.data.error?.name || 'Unknown';
      errorTypes[errorName] = (errorTypes[errorName] || 0) + 1;
    });
    
    return {
      totalErrors: logs.length + criticalLogs.length,
      criticalErrors: criticalLogs.length,
      errorTypes,
      recentErrors: logs.slice(0, 5)
    };
  }

  /**
   * Generate migration report
   */
  async generateReport() {
    const logs = await storageFacade.get('migration_logs') || [];
    const errors = logs.filter(log => 
      log.level === 'ERROR' || log.level === 'CRITICAL'
    );
    const warnings = logs.filter(log => log.level === 'WARN');
    
    const duration = Date.now() - this.metrics.startTime;
    
    return {
      summary: {
        totalLogs: logs.length,
        errors: errors.length,
        warnings: warnings.length,
        duration: duration,
        startTime: new Date(this.metrics.startTime).toISOString(),
        endTime: new Date().toISOString()
      },
      metrics: this.metrics,
      errorDetails: errors.slice(0, 10), // Last 10 errors
      warningDetails: warnings.slice(0, 10) // Last 10 warnings
    };
  }

  /**
   * Clear all logs
   */
  async clearLogs() {
    this.logBuffer = [];
    await storageFacade.delete('migration_logs');
    this.resetMetrics();
  }

  /**
   * Reset metrics
   */
  resetMetrics() {
    this.metrics = {
      totalLogs: 0,
      errorCount: 0,
      warnCount: 0,
      startTime: Date.now()
    };
  }

  /**
   * Set log level
   */
  setLogLevel(level) {
    if (this.logLevels[level] !== undefined) {
      this.currentLevel = this.logLevels[level];
    }
  }

  /**
   * Generate session ID
   */
  generateSessionId() {
    this.sessionId = `migration_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    return this.sessionId;
  }

  /**
   * Export logs
   */
  async exportLogs(format = 'json') {
    const logs = await storageFacade.get('migration_logs') || [];
    
    switch (format) {
      case 'json':
        return JSON.stringify(logs, null, 2);
      
      case 'csv':
        return this.logsToCSV(logs);
      
      case 'text':
        return this.logsToText(logs);
      
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  /**
   * Convert logs to CSV format
   */
  logsToCSV(logs) {
    const headers = ['Timestamp', 'Level', 'Message', 'Data'];
    const rows = logs.map(log => [
      log.timestamp,
      log.level,
      log.message,
      JSON.stringify(log.data)
    ]);
    
    return [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
  }

  /**
   * Convert logs to text format
   */
  logsToText(logs) {
    return logs.map(log => 
      `[${log.level}] ${log.timestamp} - ${log.message}\n` +
      (Object.keys(log.data).length > 0 ? `  Data: ${JSON.stringify(log.data)}\n` : '')
    ).join('\n');
  }
}

// Export singleton instance
export const migrationLogger = new MigrationLogger();

// Also export class for testing
export default MigrationLogger;