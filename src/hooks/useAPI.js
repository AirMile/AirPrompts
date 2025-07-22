/**
 * useAPI Hook - API Integration with localStorage fallback
 * Provides seamless integration between backend API and localStorage
 */

import { useState, useCallback } from 'react';

// API Configuration
const API_BASE_URL = 'http://localhost:3001/api';
const REQUEST_TIMEOUT = 10000; // 10 seconds

/**
 * API Response format validation
 * Backend returns: { success: boolean, data: any, meta: object }
 */
const validateAPIResponse = (response) => {
  return response && typeof response.success === 'boolean';
};

/**
 * Main useAPI hook
 * @param {Object} options - Configuration options
 * @returns {Object} API methods and state
 */
export const useAPI = (options = {}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastRequestTime, setLastRequestTime] = useState(null);

  // Clear error state
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Generic API request method
  const request = useCallback(async (endpoint, options = {}) => {
    const {
      method = 'GET',
      data = null,
      headers = {},
      timeout = REQUEST_TIMEOUT,
      fallbackData = null
    } = options;

    setLoading(true);
    setError(null);
    setLastRequestTime(Date.now());

    try {
      // Construct request options
      const requestOptions = {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers
        },
        signal: AbortSignal.timeout(timeout)
      };

      // Add body for non-GET requests
      if (data && method !== 'GET') {
        requestOptions.body = JSON.stringify(data);
      }

      // Make API request
      const url = `${API_BASE_URL}${endpoint}`;
      console.log(`🌐 API Request: ${method} ${url}`, data ? { data } : '');
      
      const response = await fetch(url, requestOptions);
      
      // Handle HTTP errors
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      // Validate response format
      if (!validateAPIResponse(result)) {
        throw new Error('Invalid API response format');
      }

      // Handle API-level errors
      if (!result.success) {
        throw new Error(result.error?.message || 'API request failed');
      }

      console.log(`✅ API Success: ${method} ${endpoint}`, result.data);
      return result.data;

    } catch (err) {
      console.warn(`⚠️ API Error: ${method} ${endpoint}`, err.message);
      
      // Categorize errors for better handling
      let errorType = 'UNKNOWN';
      let errorMessage = err.message;

      if (err.name === 'AbortError' || err.message.includes('timeout')) {
        errorType = 'TIMEOUT';
        errorMessage = 'Request timeout - check your connection';
      } else if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
        errorType = 'NETWORK';
        errorMessage = 'Network error - API server may be down';
      } else if (err.message.includes('HTTP 4')) {
        errorType = 'CLIENT_ERROR';
      } else if (err.message.includes('HTTP 5')) {
        errorType = 'SERVER_ERROR';
      }

      const apiError = {
        type: errorType,
        message: errorMessage,
        originalError: err,
        timestamp: Date.now(),
        endpoint,
        method
      };

      setError(apiError);

      // Return fallback data if provided
      if (fallbackData !== null) {
        console.log(`🔄 Using fallback data for ${endpoint}`);
        return fallbackData;
      }

      // Re-throw error if no fallback
      throw apiError;

    } finally {
      setLoading(false);
    }
  }, []);

  // Convenience methods for different HTTP verbs
  const get = useCallback((endpoint, options = {}) => {
    return request(endpoint, { ...options, method: 'GET' });
  }, [request]);

  const post = useCallback((endpoint, data, options = {}) => {
    return request(endpoint, { ...options, method: 'POST', data });
  }, [request]);

  const put = useCallback((endpoint, data, options = {}) => {
    return request(endpoint, { ...options, method: 'PUT', data });
  }, [request]);

  const del = useCallback((endpoint, options = {}) => {
    return request(endpoint, { ...options, method: 'DELETE' });
  }, [request]);

  // Health check method
  const checkHealth = useCallback(async () => {
    try {
      const result = await get('/health');
      return result?.status === 'ok';
    } catch (err) {
      return false;
    }
  }, [get]);

  return {
    // State
    loading,
    error,
    lastRequestTime,
    
    // Actions
    request,
    get,
    post,
    put,
    delete: del,
    checkHealth,
    clearError,
    
    // Utils
    isOnline: !error || error.type !== 'NETWORK'
  };
};

/**
 * Specific API hooks for different data types
 */

// Templates API hook
export const useTemplatesAPI = () => {
  const api = useAPI();
  
  return {
    ...api,
    getTemplates: () => api.get('/templates'),
    getTemplate: (id) => api.get(`/templates/${id}`),
    createTemplate: (template) => api.post('/templates', template),
    updateTemplate: (id, template) => api.put(`/templates/${id}`, template),
    deleteTemplate: (id) => api.delete(`/templates/${id}`)
  };
};

// Workflows API hook  
export const useWorkflowsAPI = () => {
  const api = useAPI();
  
  return {
    ...api,
    getWorkflows: () => api.get('/workflows'),
    getWorkflow: (id) => api.get(`/workflows/${id}`),
    createWorkflow: (workflow) => api.post('/workflows', workflow),
    updateWorkflow: (id, workflow) => api.put(`/workflows/${id}`, workflow),
    deleteWorkflow: (id) => api.delete(`/workflows/${id}`)
  };
};

// Folders API hook
export const useFoldersAPI = () => {
  const api = useAPI();
  
  return {
    ...api,
    getFolders: () => api.get('/folders'),
    getFolder: (id) => api.get(`/folders/${id}`),
    createFolder: (folder) => api.post('/folders', folder),
    updateFolder: (id, folder) => api.put(`/folders/${id}`, folder),
    deleteFolder: (id) => api.delete(`/folders/${id}`)
  };
};

export default useAPI;