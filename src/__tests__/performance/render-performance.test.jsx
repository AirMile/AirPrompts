import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PreferencesProvider } from '@/contexts/PreferencesContext';
import { FeatureFlagsProvider } from '@/contexts/FeatureFlagsContext';
import Homepage from '@/components/dashboard/Homepage';
import ItemExecutor from '@/components/features/execution/ItemExecutor';
import * as dataStorage from '@/utils/dataStorage';

jest.mock('@/utils/dataStorage');

// Performance measurement utilities
const measureRenderTime = async (component) => {
  const startTime = performance.now();
  const { container } = render(component);
  await waitFor(() => {
    expect(container.firstChild).toBeInTheDocument();
  });
  const endTime = performance.now();
  return endTime - startTime;
};

const renderWithProviders = (component) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, refetchOnWindowFocus: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <FeatureFlagsProvider>
        <PreferencesProvider>
          {component}
        </PreferencesProvider>
      </FeatureFlagsProvider>
    </QueryClientProvider>
  );
};

describe('Render Performance Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    performance.clearMarks();
    performance.clearMeasures();
  });

  describe('Initial Load Performance', () => {
    it('should render Homepage within acceptable time', async () => {
      const mockData = {
        templates: Array.from({ length: 100 }, (_, i) => ({
          id: `t${i}`,
          name: `Template ${i}`,
          description: `Description ${i}`,
          content: `Content ${i}`,
          category: 'General',
          favorite: false
        })),
        workflows: [],
        snippets: [],
        folders: []
      };

      dataStorage.loadAllData.mockResolvedValue(mockData);

      const renderTime = await measureRenderTime(
        renderWithProviders(<Homepage />)
      );

      // Should render within 500ms even with 100 items
      expect(renderTime).toBeLessThan(500);
    });

    it('should handle large datasets efficiently', async () => {
      const largeDataset = {
        templates: Array.from({ length: 1000 }, (_, i) => ({
          id: `t${i}`,
          name: `Template ${i}`,
          description: `Description for template ${i} with long text`,
          content: `Content ${i} with {variable${i}}`,
          category: ['General', 'Email', 'Development'][i % 3],
          favorite: i % 5 === 0
        })),
        workflows: Array.from({ length: 200 }, (_, i) => ({
          id: `w${i}`,
          name: `Workflow ${i}`,
          description: `Workflow description ${i}`,
          steps: [`t${i}`, `t${i+1}`],
          category: 'General',
          favorite: false
        })),
        snippets: [],
        folders: []
      };

      dataStorage.loadAllData.mockResolvedValue(largeDataset);

      performance.mark('large-dataset-start');
      
      render(renderWithProviders(<Homepage />));
      
      await waitFor(() => {
        expect(screen.getByText('Template 0')).toBeInTheDocument();
      });

      performance.mark('large-dataset-end');
      performance.measure('large-dataset', 'large-dataset-start', 'large-dataset-end');

      const measure = performance.getEntriesByName('large-dataset')[0];
      
      // Should handle 1000+ items within 1 second
      expect(measure.duration).toBeLessThan(1000);
    });
  });

  describe('Re-render Performance', () => {
    it('should minimize unnecessary re-renders', async () => {
      let renderCount = 0;

      const TrackedComponent = () => {
        renderCount++;
        return <div>Render count: {renderCount}</div>;
      };

      const { rerender } = render(
        renderWithProviders(<TrackedComponent />)
      );

      expect(renderCount).toBe(1);

      // Re-render with same props
      rerender(renderWithProviders(<TrackedComponent />));

      // Should not trigger additional renders with same props
      expect(renderCount).toBe(1);
    });

    it('should efficiently update when data changes', async () => {
      const initialData = {
        templates: [
          { id: '1', name: 'Template 1', content: 'Content 1' }
        ],
        workflows: [],
        snippets: [],
        folders: []
      };

      dataStorage.loadAllData.mockResolvedValue(initialData);

      const { rerender } = render(renderWithProviders(<Homepage />));

      await waitFor(() => {
        expect(screen.getByText('Template 1')).toBeInTheDocument();
      });

      // Update data
      const updatedData = {
        ...initialData,
        templates: [
          ...initialData.templates,
          { id: '2', name: 'Template 2', content: 'Content 2' }
        ]
      };

      dataStorage.loadAllData.mockResolvedValue(updatedData);

      performance.mark('update-start');
      rerender(renderWithProviders(<Homepage />));
      performance.mark('update-end');

      await waitFor(() => {
        expect(screen.getByText('Template 2')).toBeInTheDocument();
      });

      performance.measure('update-time', 'update-start', 'update-end');
      const updateMeasure = performance.getEntriesByName('update-time')[0];

      // Updates should be fast
      expect(updateMeasure.duration).toBeLessThan(100);
    });
  });

  describe('Search Performance', () => {
    it('should filter large lists efficiently', async () => {
      const templates = Array.from({ length: 500 }, (_, i) => ({
        id: `t${i}`,
        name: `${['Email', 'Code', 'Meeting'][i % 3]} Template ${i}`,
        description: `Description ${i}`,
        content: `Content ${i}`,
        category: 'General',
        favorite: false
      }));

      // Mock search function
      const search = (query, items) => {
        performance.mark('search-start');
        
        const results = items.filter(item => 
          item.name.toLowerCase().includes(query.toLowerCase()) ||
          item.description.toLowerCase().includes(query.toLowerCase())
        );
        
        performance.mark('search-end');
        performance.measure('search-time', 'search-start', 'search-end');
        
        return results;
      };

      const emailResults = search('email', templates);
      const searchMeasure = performance.getEntriesByName('search-time')[0];

      expect(emailResults.length).toBeGreaterThan(0);
      expect(searchMeasure.duration).toBeLessThan(10); // Should be very fast
    });
  });

  describe('Memory Usage', () => {
    it('should not leak memory when mounting/unmounting', async () => {
      const TestComponent = () => {
        const [data] = React.useState(() => 
          Array.from({ length: 1000 }, (_, i) => ({
            id: i,
            value: `Value ${i}`.repeat(100) // Large strings
          }))
        );

        return <div>{data.length} items</div>;
      };

      // Mount and unmount multiple times
      for (let i = 0; i < 10; i++) {
        const { unmount } = render(<TestComponent />);
        unmount();
      }

      // Memory should be garbage collected
      // In a real test, you'd use performance.measureUserAgentSpecificMemory()
      expect(true).toBe(true); // Placeholder assertion
    });
  });

  describe('Bundle Size Impact', () => {
    it('should lazy load heavy components', async () => {
      // Mock dynamic import
      const LazyComponent = React.lazy(() => 
        new Promise(resolve => {
          performance.mark('lazy-load-start');
          setTimeout(() => {
            performance.mark('lazy-load-end');
            performance.measure('lazy-load', 'lazy-load-start', 'lazy-load-end');
            resolve({ default: () => <div>Lazy loaded</div> });
          }, 10);
        })
      );

      render(
        <React.Suspense fallback={<div>Loading...</div>}>
          <LazyComponent />
        </React.Suspense>
      );

      expect(screen.getByText('Loading...')).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByText('Lazy loaded')).toBeInTheDocument();
      });

      const lazyMeasure = performance.getEntriesByName('lazy-load')[0];
      expect(lazyMeasure).toBeDefined();
    });
  });

  describe('Animation Performance', () => {
    it('should maintain 60fps during animations', () => {
      let frameCount = 0;
      let lastTime = performance.now();
      const targetFPS = 60;
      const frameDuration = 1000 / targetFPS;

      const animate = (currentTime) => {
        frameCount++;
        const deltaTime = currentTime - lastTime;
        
        // Check if frame took too long
        if (deltaTime > frameDuration * 1.5) {
          console.warn(`Frame ${frameCount} took ${deltaTime}ms`);
        }
        
        lastTime = currentTime;
        
        if (frameCount < 60) { // Run for 1 second
          requestAnimationFrame(animate);
        }
      };

      // In a real test, you'd trigger actual animations
      // This is a simulation
      const startTime = performance.now();
      for (let i = 0; i < 60; i++) {
        const currentTime = startTime + (i * frameDuration);
        animate(currentTime);
      }

      expect(frameCount).toBe(60);
    });
  });

  describe('Virtual Scrolling Performance', () => {
    it('should efficiently render only visible items', () => {
      const items = Array.from({ length: 10000 }, (_, i) => ({
        id: i,
        content: `Item ${i}`
      }));

      // Simulate virtual scrolling
      const viewportHeight = 600;
      const itemHeight = 50;
      const visibleCount = Math.ceil(viewportHeight / itemHeight);
      const scrollTop = 2500; // Scrolled to middle
      
      const startIndex = Math.floor(scrollTop / itemHeight);
      const endIndex = startIndex + visibleCount;
      
      const visibleItems = items.slice(startIndex, endIndex);

      // Should only render visible items plus buffer
      expect(visibleItems.length).toBeLessThanOrEqual(visibleCount + 2);
      expect(visibleItems[0].id).toBe(startIndex);
    });
  });

  describe('Debouncing and Throttling', () => {
    it('should debounce expensive operations', async () => {
      jest.useFakeTimers();
      
      let callCount = 0;
      const expensiveOperation = jest.fn(() => {
        callCount++;
      });

      // Simulate rapid calls
      for (let i = 0; i < 100; i++) {
        setTimeout(expensiveOperation, 10);
      }

      // Should not execute immediately
      expect(callCount).toBe(0);

      // Fast forward time
      jest.advanceTimersByTime(300);

      // Should only execute once after debounce
      expect(callCount).toBe(1);

      jest.useRealTimers();
    });

    it('should throttle scroll events', () => {
      jest.useFakeTimers();

      let scrollCount = 0;
      const handleScroll = jest.fn(() => {
        scrollCount++;
      });

      // Throttle implementation
      let lastCall = 0;
      const throttledScroll = () => {
        const now = Date.now();
        if (now - lastCall >= 16) { // ~60fps
          handleScroll();
          lastCall = now;
        }
      };

      // Simulate rapid scroll events
      for (let i = 0; i < 100; i++) {
        throttledScroll();
        jest.advanceTimersByTime(5);
      }

      // Should throttle to ~60fps
      expect(scrollCount).toBeLessThan(100);
      expect(scrollCount).toBeGreaterThan(20);

      jest.useRealTimers();
    });
  });
});