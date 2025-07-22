import { useEffect, useRef } from 'react';

export function usePerformanceMonitor(componentName) {
  const renderCount = useRef(0);
  const renderTime = useRef(0);
  
  useEffect(() => {
    renderCount.current += 1;
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      renderTime.current += duration;
      
      // Log performance metrics in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Performance] ${componentName}:`, {
          renderCount: renderCount.current,
          lastRenderTime: `${duration.toFixed(2)}ms`,
          avgRenderTime: `${(renderTime.current / renderCount.current).toFixed(2)}ms`
        });
      }
    };
  });
  
  return {
    renderCount: renderCount.current,
    avgRenderTime: renderTime.current / renderCount.current
  };
}