import { useRef, useEffect, useCallback, useState } from 'react';

/**
 * Hook for offloading expensive computations to Web Workers
 */
export const useWebWorker = (workerFunction) => {
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const workerRef = useRef(null);
  const promiseRef = useRef({});

  // Create worker from function
  useEffect(() => {
    if (!window.Worker) {
      console.warn('Web Workers not supported');
      return;
    }

    // Convert function to blob URL
    const workerCode = `
      self.addEventListener('message', async function(e) {
        const { id, data } = e.data;
        try {
          const fn = ${workerFunction.toString()};
          const result = await fn(data);
          self.postMessage({ id, result, error: null });
        } catch (error) {
          self.postMessage({ id, result: null, error: error.message });
        }
      });
    `;

    const blob = new Blob([workerCode], { type: 'application/javascript' });
    const workerUrl = URL.createObjectURL(blob);
    workerRef.current = new Worker(workerUrl);

    // Handle messages from worker
    workerRef.current.addEventListener('message', (e) => {
      const { id, result, error } = e.data;
      const promise = promiseRef.current[id];
      
      if (promise) {
        if (error) {
          promise.reject(new Error(error));
        } else {
          promise.resolve(result);
        }
        delete promiseRef.current[id];
      }
    });

    // Handle worker errors
    workerRef.current.addEventListener('error', (error) => {
      console.error('Worker error:', error);
      setError(error);
      setLoading(false);
    });

    // Cleanup
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
      }
      URL.revokeObjectURL(workerUrl);
    };
  }, [workerFunction]);

  // Run computation in worker
  const run = useCallback(async (data) => {
    if (!workerRef.current) {
      // Fallback to main thread
      try {
        setLoading(true);
        const result = await workerFunction(data);
        setResult(result);
        setError(null);
        return result;
      } catch (err) {
        setError(err);
        throw err;
      } finally {
        setLoading(false);
      }
    }

    // Generate unique ID for this computation
    const id = Math.random().toString(36).substr(2, 9);
    
    setLoading(true);
    setError(null);

    return new Promise((resolve, reject) => {
      promiseRef.current[id] = { resolve, reject };
      workerRef.current.postMessage({ id, data });
    }).then((result) => {
      setResult(result);
      setLoading(false);
      return result;
    }).catch((error) => {
      setError(error);
      setLoading(false);
      throw error;
    });
  }, [workerFunction]);

  // Terminate worker
  const terminate = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }
  }, []);

  return { run, result, error, loading, terminate };
};

/**
 * Hook for parallel processing with multiple workers
 */
export const useParallelWorkers = (workerFunction, workerCount = navigator.hardwareConcurrency || 4) => {
  const workers = useRef([]);
  const [results, setResults] = useState([]);
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  // Initialize workers
  useEffect(() => {
    if (!window.Worker) return;

    // Create worker pool
    for (let i = 0; i < workerCount; i++) {
      const workerCode = `
        self.addEventListener('message', async function(e) {
          const { id, data, index } = e.data;
          try {
            const fn = ${workerFunction.toString()};
            const result = await fn(data);
            self.postMessage({ id, index, result, error: null });
          } catch (error) {
            self.postMessage({ id, index, result: null, error: error.message });
          }
        });
      `;

      const blob = new Blob([workerCode], { type: 'application/javascript' });
      const workerUrl = URL.createObjectURL(blob);
      const worker = new Worker(workerUrl);
      
      workers.current.push({
        worker,
        url: workerUrl,
        busy: false
      });
    }

    // Cleanup
    return () => {
      workers.current.forEach(({ worker, url }) => {
        worker.terminate();
        URL.revokeObjectURL(url);
      });
      workers.current = [];
    };
  }, [workerFunction, workerCount]);

  // Process data in parallel
  const process = useCallback(async (dataArray) => {
    if (!workers.current.length) {
      // Fallback to sequential processing
      setLoading(true);
      try {
        const results = [];
        for (let i = 0; i < dataArray.length; i++) {
          results.push(await workerFunction(dataArray[i]));
          setProgress((i + 1) / dataArray.length);
        }
        setResults(results);
        return results;
      } catch (error) {
        setErrors([error]);
        throw error;
      } finally {
        setLoading(false);
      }
    }

    setLoading(true);
    setProgress(0);
    setResults([]);
    setErrors([]);

    const results = new Array(dataArray.length);
    const errors = new Array(dataArray.length);
    let completed = 0;

    return new Promise((resolve, reject) => {
      const processNext = (workerIndex) => {
        const nextIndex = dataArray.findIndex((_, idx) => 
          results[idx] === undefined && errors[idx] === undefined
        );

        if (nextIndex === -1) {
          // No more work
          workers.current[workerIndex].busy = false;
          
          // Check if all done
          if (completed === dataArray.length) {
            setLoading(false);
            if (errors.some(e => e)) {
              setErrors(errors);
              reject(errors);
            } else {
              setResults(results);
              resolve(results);
            }
          }
          return;
        }

        const workerInfo = workers.current[workerIndex];
        workerInfo.busy = true;

        const handler = (e) => {
          const { index, result, error } = e.data;
          
          if (error) {
            errors[index] = new Error(error);
          } else {
            results[index] = result;
          }
          
          completed++;
          setProgress(completed / dataArray.length);
          
          workerInfo.worker.removeEventListener('message', handler);
          processNext(workerIndex);
        };

        workerInfo.worker.addEventListener('message', handler);
        workerInfo.worker.postMessage({
          id: Math.random().toString(36),
          index: nextIndex,
          data: dataArray[nextIndex]
        });
      };

      // Start processing with all workers
      workers.current.forEach((_, index) => processNext(index));
    });
  }, [workerFunction]);

  return { process, results, errors, loading, progress };
};

// Example worker functions
export const workerFunctions = {
  // Heavy text processing
  processTemplates: (templates) => {
    return templates.map(template => {
      // Extract variables
      const variables = [...new Set(
        (template.content || '').match(/\{([^}]+)\}/g) || []
      )].map(v => v.slice(1, -1));

      // Calculate complexity score
      const lines = template.content.split('\n').length;
      const words = template.content.split(/\s+/).length;
      const complexity = lines * 0.3 + words * 0.1 + variables.length * 2;

      return {
        ...template,
        variables,
        complexity,
        metadata: {
          lines,
          words,
          variableCount: variables.length
        }
      };
    });
  },

  // Search indexing
  buildSearchIndex: (items) => {
    const index = {};
    
    items.forEach((item, idx) => {
      const text = `${item.name} ${item.description} ${item.content || ''}`.toLowerCase();
      const words = text.split(/\s+/);
      
      words.forEach(word => {
        if (word.length > 2) {
          if (!index[word]) {
            index[word] = [];
          }
          index[word].push(idx);
        }
      });
    });

    return index;
  },

  // Data aggregation
  aggregateStats: (data) => {
    const stats = {
      total: data.length,
      byCategory: {},
      byFolder: {},
      favorites: 0,
      recent: 0
    };

    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;

    data.forEach(item => {
      // Category stats
      stats.byCategory[item.category] = (stats.byCategory[item.category] || 0) + 1;
      
      // Folder stats
      if (item.folderId) {
        stats.byFolder[item.folderId] = (stats.byFolder[item.folderId] || 0) + 1;
      }
      
      // Favorites
      if (item.favorite) stats.favorites++;
      
      // Recent (last 7 days)
      if (item.updatedAt && (now - new Date(item.updatedAt).getTime()) < 7 * dayMs) {
        stats.recent++;
      }
    });

    return stats;
  }
};