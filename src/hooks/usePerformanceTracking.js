import { useEffect, useRef, useCallback } from 'react';
import { useFeature } from '../contexts/FeatureFlagsContext';
import { startMark, endMark, recordCustomMetric } from '../services/monitoring/performance';

/**
 * Hook for tracking component performance
 *
 * Measures render time, re-render count, and custom metrics
 */
export function usePerformanceTracking(componentName, options = {}) {
  const isEnabled = useFeature('USE_PERFORMANCE_MONITORING');
  const renderCount = useRef(0);
  const mountTime = useRef(null);
  const lastRenderTime = useRef(null);

  // Track component mount/unmount
  useEffect(() => {
    if (!isEnabled) return;

    mountTime.current = performance.now();
    startMark(`${componentName}-mount`);

    return () => {
      endMark(`${componentName}-mount`, {
        component: componentName,
        renderCount: renderCount.current,
      });

      // Record total component lifetime
      const lifetime = performance.now() - mountTime.current;
      recordCustomMetric(`component.${componentName}.lifetime`, lifetime, {
        renderCount: renderCount.current,
      });
    };
  }, [componentName, isEnabled]);

  // Track renders
  useEffect(() => {
    if (!isEnabled) return;

    renderCount.current += 1;
    const now = performance.now();

    // Calculate time since last render
    if (lastRenderTime.current) {
      const timeSinceLastRender = now - lastRenderTime.current;
      recordCustomMetric(`component.${componentName}.renderInterval`, timeSinceLastRender);
    }

    lastRenderTime.current = now;

    // Warn on excessive re-renders
    if (renderCount.current > (options.warnThreshold || 50)) {
      console.warn(`Component ${componentName} has rendered ${renderCount.current} times`);
    }
  });

  // Track custom metrics
  const trackMetric = useCallback(
    (metricName, value, tags = {}) => {
      if (!isEnabled) return;

      recordCustomMetric(`component.${componentName}.${metricName}`, value, {
        component: componentName,
        ...tags,
      });
    },
    [componentName, isEnabled]
  );

  // Track user interactions
  const trackInteraction = useCallback(
    (action, data = {}) => {
      if (!isEnabled) return;

      const interactionData = {
        component: componentName,
        action,
        timestamp: Date.now(),
        ...data,
      };

      recordCustomMetric(`interaction.${action}`, 1, interactionData);

      // Log to console in development
      // eslint-disable-next-line no-undef
      if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development') {
        console.log(`[Interaction] ${componentName}.${action}`, data);
      }
    },
    [componentName, isEnabled]
  );

  // Performance measurement wrapper
  const measure = useCallback(
    async (operationName, fn) => {
      if (!isEnabled) return fn();

      const markName = `${componentName}.${operationName}`;
      startMark(markName);

      try {
        const result = await fn();
        endMark(markName, { component: componentName });
        return result;
      } catch (error) {
        endMark(markName, { component: componentName, error: true });
        throw error;
      }
    },
    [componentName, isEnabled]
  );

  return {
    trackMetric,
    trackInteraction,
    measure,
    renderCount: renderCount.current,
  };
}

/**
 * Hook for tracking list performance
 *
 * Specifically designed for virtualized lists and large datasets
 */
export function useListPerformanceTracking(listName, items = []) {
  const isEnabled = useFeature('USE_PERFORMANCE_MONITORING');
  const lastItemCount = useRef(0);
  const scrollMetrics = useRef({
    scrollCount: 0,
    lastScrollTime: null,
    totalScrollDistance: 0,
  });

  // Track item count changes
  useEffect(() => {
    if (!isEnabled) return;

    const itemCountDelta = items.length - lastItemCount.current;

    if (itemCountDelta !== 0) {
      recordCustomMetric(`list.${listName}.itemCount`, items.length, {
        delta: itemCountDelta,
      });
    }

    lastItemCount.current = items.length;
  }, [items.length, listName, isEnabled]);

  // Track scroll performance
  const trackScroll = useCallback(
    (scrollTop, scrollHeight, clientHeight) => {
      if (!isEnabled) return;

      const now = performance.now();
      const metrics = scrollMetrics.current;

      // Calculate scroll velocity
      if (metrics.lastScrollTime) {
        const timeDelta = now - metrics.lastScrollTime;
        const scrollDelta = Math.abs(scrollTop - metrics.lastScrollTop);
        const velocity = scrollDelta / timeDelta;

        recordCustomMetric(`list.${listName}.scrollVelocity`, velocity);
      }

      // Update metrics
      metrics.scrollCount++;
      metrics.lastScrollTime = now;
      metrics.lastScrollTop = scrollTop;
      metrics.totalScrollDistance += Math.abs(scrollTop - (metrics.lastScrollTop || 0));

      // Track viewport coverage
      const viewportCoverage = (clientHeight / scrollHeight) * 100;
      recordCustomMetric(`list.${listName}.viewportCoverage`, viewportCoverage);
    },
    [listName, isEnabled]
  );

  // Track render performance for visible items
  const trackVisibleItems = useCallback(
    (visibleStart, visibleEnd) => {
      if (!isEnabled) return;

      const visibleCount = visibleEnd - visibleStart;
      recordCustomMetric(`list.${listName}.visibleItems`, visibleCount, {
        start: visibleStart,
        end: visibleEnd,
        total: items.length,
      });
    },
    [listName, items.length, isEnabled]
  );

  return {
    trackScroll,
    trackVisibleItems,
    itemCount: items.length,
  };
}

/**
 * Hook for tracking API call performance
 */
export function useAPIPerformanceTracking() {
  const isEnabled = useFeature('USE_PERFORMANCE_MONITORING');

  const trackAPICall = useCallback(
    async (endpoint, method, fn) => {
      if (!isEnabled) return fn();

      const startTime = performance.now();
      const markName = `api.${method}.${endpoint.replace(/[/:]/g, '_')}`;

      startMark(markName);

      try {
        const result = await fn();
        const duration = performance.now() - startTime;

        endMark(markName, {
          endpoint,
          method,
          status: 'success',
        });

        recordCustomMetric('api.responseTime', duration, {
          endpoint,
          method,
          status: 'success',
        });

        return result;
      } catch (error) {
        const duration = performance.now() - startTime;

        endMark(markName, {
          endpoint,
          method,
          status: 'error',
          error: error.message,
        });

        recordCustomMetric('api.responseTime', duration, {
          endpoint,
          method,
          status: 'error',
        });

        throw error;
      }
    },
    [isEnabled]
  );

  return { trackAPICall };
}
