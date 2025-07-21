// src/store/hooks/useWorkflows.js
import { useCallback, useState, useEffect } from 'react';
import { useAppState, useAppDispatch } from '../appStore';
import { StorageService } from '../../services/storage/StorageService';

export function useWorkflows() {
  const { workflows, meta } = useAppState();
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const fetchWorkflows = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await StorageService.getWorkflows();
      dispatch({ type: 'SET_WORKFLOWS', payload: data });
    } catch (err) {
      setError(err.message);
      console.error('Failed to fetch workflows:', err);
    } finally {
      setLoading(false);
    }
  }, [dispatch]);
  
  useEffect(() => {
    if (workflows.length === 0) {
      fetchWorkflows();
    }
  }, [fetchWorkflows, workflows.length]);
  
  const updateWorkflow = useCallback(async (workflow) => {
    setLoading(true);
    try {
      dispatch({ type: 'UPDATE_WORKFLOW', payload: workflow });
      await StorageService.updateWorkflow(workflow);
      
      if (!meta.isOnline) {
        dispatch({ 
          type: 'ADD_PENDING_CHANGE', 
          payload: { type: 'update', entity: 'workflow', data: workflow }
        });
      }
    } catch (err) {
      await fetchWorkflows();
      throw err;
    } finally {
      setLoading(false);
    }
  }, [dispatch, meta.isOnline, fetchWorkflows]);
  
  const deleteWorkflow = useCallback(async (id) => {
    const backup = workflows.find(w => w.id === id);
    
    try {
      dispatch({ type: 'DELETE_WORKFLOW', payload: id });
      await StorageService.deleteWorkflow(id);
    } catch (err) {
      if (backup) {
        dispatch({ type: 'ADD_WORKFLOW', payload: backup });
      }
      throw err;
    }
  }, [dispatch, workflows]);
  
  const addWorkflow = useCallback(async (workflowData) => {
    const workflow = {
      ...workflowData,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    try {
      dispatch({ type: 'ADD_WORKFLOW', payload: workflow });
      await StorageService.createWorkflow(workflow);
      return workflow;
    } catch (err) {
      await fetchWorkflows();
      throw err;
    }
  }, [dispatch, fetchWorkflows]);
  
  return {
    workflows,
    loading,
    error,
    fetchWorkflows,
    updateWorkflow,
    deleteWorkflow,
    addWorkflow,
    getWorkflowById: useCallback((id) => workflows.find(w => w.id === id), [workflows])
  };
}