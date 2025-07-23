import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAPI } from '../useAPI';
import { useOfflineMutation } from './useOfflineMutation';

/**
 * Hook to fetch all folders
 */
export const useFolders = () => {
  const api = useAPI();
  
  return useQuery({
    queryKey: ['folders'],
    queryFn: async () => {
      const response = await api.get('/folders');
      return response;
    },
    staleTime: 30000, // 30 seconds
    gcTime: 5 * 60 * 1000 // 5 minutes
  });
};

/**
 * Hook to create a new folder
 */
export const useCreateFolder = () => {
  const api = useAPI();
  const queryClient = useQueryClient();
  
  return useOfflineMutation({
    mutationFn: async (folderData) => {
      const response = await api.post('/folders', folderData);
      return response;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['folders'] });
    },
    onError: (error) => {
      console.error('Failed to create folder:', error);
    }
  });
};

/**
 * Hook to update a folder
 */
export const useUpdateFolder = () => {
  const api = useAPI();
  const queryClient = useQueryClient();
  
  return useOfflineMutation({
    mutationFn: async ({ id, ...folderData }) => {
      const response = await api.put(`/folders/${id}`, folderData);
      return response;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['folders'] });
    },
    onError: (error) => {
      console.error('Failed to update folder:', error);
    }
  });
};

/**
 * Hook to delete a folder
 */
export const useDeleteFolder = () => {
  const api = useAPI();
  const queryClient = useQueryClient();
  
  return useOfflineMutation({
    mutationFn: async (folderId) => {
      const response = await api.delete(`/folders/${folderId}`);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders'] });
      // Also invalidate templates, workflows, and snippets since folder deletion might affect them
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      queryClient.invalidateQueries({ queryKey: ['snippets'] });
    },
    onError: (error) => {
      console.error('Failed to delete folder:', error);
    }
  });
};