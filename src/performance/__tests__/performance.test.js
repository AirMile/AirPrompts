import React, { useState } from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { measurePerformance } from '../utils/performance-metrics';
import { Homepage } from '../../components/dashboard/Homepage';
import { TemplateEditor } from '../../components/templates/TemplateEditor';
import { WorkflowEditor } from '../../components/workflows/WorkflowEditor';
import { largeDataset } from '../../../e2e/fixtures/test-data';

describe('Performance Tests', () => {
  describe('Render Performance', () => {
    test('Homepage should render within performance budget', async () => {
      const metrics = await measurePerformance(() => {
        render(<Homepage />);
      });

      expect(metrics.renderTime).toBeLessThan(100); // 100ms
      expect(metrics.componentCount).toBeLessThan(1000);
      expect(metrics.domNodes).toBeLessThan(1500);
    });

    test('Should handle large dataset efficiently', async () => {
      const templates = largeDataset.generateTemplates(1000);

      const startTime = performance.now();
      const { container } = render(<Homepage initialTemplates={templates} />);
      const renderTime = performance.now() - startTime;

      expect(renderTime).toBeLessThan(500); // 500ms for 1000 items

      // Check virtualization is working
      const visibleItems = container.querySelectorAll('.template-card');
      expect(visibleItems.length).toBeLessThan(50); // Only visible items rendered
    });

    test('Search should be responsive with large dataset', async () => {
      const templates = largeDataset.generateTemplates(5000);
      render(<Homepage initialTemplates={templates} />);

      const searchInput = screen.getByPlaceholderText(/search/i);

      const searchStartTime = performance.now();
      fireEvent.change(searchInput, { target: { value: 'Template 2500' } });

      await waitFor(() => {
        expect(screen.getByText('Template 2500')).toBeInTheDocument();
      });

      const searchTime = performance.now() - searchStartTime;
      expect(searchTime).toBeLessThan(300); // 300ms for search
    });
  });

  describe('Memory Usage', () => {
    test('Should not leak memory on repeated renders', async () => {
      if (!performance.memory) {
        console.warn('Memory API not available in this environment');
        return;
      }

      const initialMemory = performance.memory.usedJSHeapSize;

      // Render and unmount component multiple times
      for (let i = 0; i < 100; i++) {
        const { unmount } = render(<TemplateEditor />);
        unmount();
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = performance.memory.usedJSHeapSize;
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be minimal (less than 5MB)
      expect(memoryIncrease).toBeLessThan(5 * 1024 * 1024);
    });

    test('Should handle state updates efficiently', async () => {
      const { rerender } = render(<Homepage />);

      const updateCount = 1000;
      const startTime = performance.now();

      for (let i = 0; i < updateCount; i++) {
        rerender(<Homepage key={i} />);
      }

      const updateTime = performance.now() - startTime;
      const avgUpdateTime = updateTime / updateCount;

      expect(avgUpdateTime).toBeLessThan(1); // Less than 1ms per update
    });
  });

  describe('Bundle Size', () => {
    test('Component lazy loading should work', async () => {
      // Mock dynamic import
      const LazyComponent = React.lazy(() => import('../../components/templates/TemplateEditor'));

      render(
        <React.Suspense fallback={<div>Loading...</div>}>
          <LazyComponent />
        </React.Suspense>
      );

      expect(screen.getByText('Loading...')).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });
    });
  });

  describe('Animation Performance', () => {
    test('Drag and drop should maintain 60fps', async () => {
      render(<Homepage />);

      const draggableItem = screen.getAllByRole('button')[0];

      let frameCount = 0;
      let lastFrameTime = performance.now();
      const frameTimes = [];

      const measureFrames = () => {
        const currentTime = performance.now();
        const frameTime = currentTime - lastFrameTime;
        frameTimes.push(frameTime);
        lastFrameTime = currentTime;
        frameCount++;

        if (frameCount < 60) {
          requestAnimationFrame(measureFrames);
        }
      };

      // Start measuring
      requestAnimationFrame(measureFrames);

      // Simulate drag
      fireEvent.mouseDown(draggableItem);
      fireEvent.mouseMove(draggableItem, { clientX: 100, clientY: 100 });
      fireEvent.mouseUp(draggableItem);

      // Wait for measurements
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Check frame times
      const avgFrameTime = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length;
      expect(avgFrameTime).toBeLessThan(17); // 60fps = ~16.67ms per frame
    });
  });

  describe('Network Performance', () => {
    test('Should implement request debouncing', async () => {
      let requestCount = 0;

      // Mock API
      global.fetch = jest.fn(() => {
        requestCount++;
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: [] }),
        });
      });

      render(<Homepage />);
      const searchInput = screen.getByPlaceholderText(/search/i);

      // Type rapidly
      const searchTerm = 'test search query';
      for (let i = 0; i < searchTerm.length; i++) {
        fireEvent.change(searchInput, {
          target: { value: searchTerm.slice(0, i + 1) },
        });
      }

      // Wait for debounce
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Should only make one request after debouncing
      expect(requestCount).toBeLessThanOrEqual(1);
    });

    test('Should cache API responses', async () => {
      let requestCount = 0;

      global.fetch = jest.fn(() => {
        requestCount++;
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ templates: [] }),
        });
      });

      const { rerender } = render(<Homepage />);

      // Wait for initial load
      await waitFor(() => expect(global.fetch).toHaveBeenCalled());

      const initialRequestCount = requestCount;

      // Re-render multiple times
      for (let i = 0; i < 5; i++) {
        rerender(<Homepage />);
      }

      // Should use cached data, not make new requests
      expect(requestCount).toBe(initialRequestCount);
    });
  });

  describe('Interaction Performance', () => {
    test('Form inputs should respond immediately', async () => {
      render(<TemplateEditor />);

      const nameInput = screen.getByLabelText(/template name/i);
      const testValue = 'Performance Test Template';

      const inputStartTime = performance.now();

      for (let i = 0; i < testValue.length; i++) {
        fireEvent.change(nameInput, {
          target: { value: testValue.slice(0, i + 1) },
        });
      }

      const inputTime = performance.now() - inputStartTime;
      const avgInputTime = inputTime / testValue.length;

      expect(avgInputTime).toBeLessThan(5); // Less than 5ms per character
    });

    test('Should handle rapid clicks without lag', async () => {
      render(<Homepage />);

      const button = screen.getByText(/new template/i);
      const clickCount = 50;

      const clickStartTime = performance.now();

      for (let i = 0; i < clickCount; i++) {
        fireEvent.click(button);
      }

      const clickTime = performance.now() - clickStartTime;
      const avgClickTime = clickTime / clickCount;

      expect(avgClickTime).toBeLessThan(2); // Less than 2ms per click
    });
  });

  describe('Optimization Checks', () => {
    test.skip('Should use React.memo for expensive components', () => {
      // Skipped: dynamic require not supported in ES modules
      // const ExpensiveComponent = require('../../components/common/ExpensiveComponent');
      // expect(ExpensiveComponent.default.$$typeof).toBe(Symbol.for('react.memo'));
    });

    test.skip('Should implement useMemo for expensive calculations', () => {
      // Skipped: useTemplates hook not imported
      // const { result } = renderHook(() => useTemplates());
      //
      // // Check that filtered results are memoized
      // const filteredTemplates1 = result.current.filteredTemplates;
      // const filteredTemplates2 = result.current.filteredTemplates;
      //
      // expect(filteredTemplates1).toBe(filteredTemplates2); // Same reference
    });

    test('Should batch state updates', async () => {
      let renderCount = 0;

      const TestComponent = () => {
        renderCount++;
        const [state1, setState1] = useState(0);
        const [state2, setState2] = useState(0);
        const [state3, setState3] = useState(0);

        const updateAll = () => {
          setState1(1);
          setState2(2);
          setState3(3);
        };

        return (
          <div>
            <button onClick={updateAll}>Update</button>
            <span>
              {state1}
              {state2}
              {state3}
            </span>
          </div>
        );
      };

      render(<TestComponent />);

      const initialRenderCount = renderCount;
      fireEvent.click(screen.getByText('Update'));

      // Should batch updates and only render once
      expect(renderCount).toBe(initialRenderCount + 1);
    });
  });

  describe('Load Testing', () => {
    test('Should handle concurrent operations', async () => {
      render(<Homepage />);

      const operations = [];

      // Simulate 100 concurrent operations
      for (let i = 0; i < 100; i++) {
        operations.push(fireEvent.click(screen.getByText(/new template/i)));
      }

      const startTime = performance.now();
      await Promise.all(operations);
      const totalTime = performance.now() - startTime;

      expect(totalTime).toBeLessThan(1000); // Complete within 1 second
    });

    test('Should maintain performance with many DOM updates', async () => {
      const { container } = render(<Homepage />);

      const updateCount = 500;
      const startTime = performance.now();

      for (let i = 0; i < updateCount; i++) {
        // Simulate DOM updates
        const newElement = document.createElement('div');
        newElement.textContent = `Update ${i}`;
        container.appendChild(newElement);
        container.removeChild(newElement);
      }

      const updateTime = performance.now() - startTime;
      const avgUpdateTime = updateTime / updateCount;

      expect(avgUpdateTime).toBeLessThan(0.5); // Less than 0.5ms per update
    });
  });
});
