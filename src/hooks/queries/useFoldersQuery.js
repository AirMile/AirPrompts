import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useFoldersAPI } from '../useAPI';
import { useOfflineMutation } from './useOfflineMutation';

/**
 * Hook to fetch all folders
 */
export const useFolders = () => {
  const foldersAPI = useFoldersAPI();
  
  return useQuery({
    queryKey: ['folders'],
    queryFn: async () => {
      const response = await foldersAPI.getAll();
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch folders');
      }
      // console.log('🔍 Raw API response for folders:', response.data);
      
      // Filter out placeholder folders based on known placeholder IDs
      const placeholderIds = ['root', 'projects', 'writing', 'school', 'development', 'workshop', 'moods', 'blocks', 'ai-character-story', 'prompt-website', 'rogue-lite-game'];
      const filteredFolders = response.data.filter(folder => !placeholderIds.includes(folder.id));
      
      // console.log('🧹 Filtered out placeholder folders, remaining:', filteredFolders.length);
      
      // Transform API data to match UI expectations
      const transformedFolders = filteredFolders.map(folder => ({
        ...folder,
        // Convert snake_case to camelCase and null to 'root'
        parentId: folder.parent_id === null ? 'root' : folder.parent_id,
        // Convert sort_order to sortOrder for UI
        sortOrder: folder.sort_order,
        // Ensure we maintain the original fields for API calls
        parent_id: folder.parent_id,
        sort_order: folder.sort_order
      }));
      
      // console.log('🔍 Transformed folders:', transformedFolders);
      return transformedFolders;
    },
    staleTime: 0, // Always fresh to ensure we get latest data
    gcTime: 5 * 60 * 1000 // 5 minutes
  });
};

/**
 * Hook to create a new folder
 */
export const useCreateFolder = () => {
  const foldersAPI = useFoldersAPI();
  const queryClient = useQueryClient();
  
  return useOfflineMutation({
    mutationFn: async (folderData) => {
      // Transform UI data to API format
      const apiData = { ...folderData };
      
      // Convert parentId back to parent_id for API
      if ('parentId' in apiData) {
        // Convert 'root' back to null for API
        apiData.parent_id = apiData.parentId === 'root' ? null : apiData.parentId;
        // Remove the camelCase version
        delete apiData.parentId;
      }
      
      console.log('🔍 Creating folder with API data:', apiData);
      const response = await foldersAPI.create(apiData);
      if (!response.success) {
        throw new Error(response.error || 'Failed to create folder');
      }
      return response.data;
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
  const foldersAPI = useFoldersAPI();
  const queryClient = useQueryClient();
  
  return useOfflineMutation({
    mutationFn: async ({ id, ...folderData }) => {
      // Transform UI data to API format and filter out read-only fields
      const apiData = { ...folderData };
      
      // Remove read-only fields that are computed by the server
      delete apiData.parent_name;
      delete apiData.template_count;
      delete apiData.workflow_count;
      delete apiData.subfolder_count;
      delete apiData.sortOrder; // This should be sort_order
      
      // Convert parentId back to parent_id for API
      if ('parentId' in apiData) {
        // Convert 'root' back to null for API
        apiData.parent_id = apiData.parentId === 'root' ? null : apiData.parentId;
        // Remove the camelCase version
        delete apiData.parentId;
      }
      
      // console.log('🔍 Updating folder with API data:', apiData);
      const response = await foldersAPI.update(id, apiData);
      if (!response.success) {
        throw new Error(response.error || 'Failed to update folder');
      }
      return response.data;
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
  const foldersAPI = useFoldersAPI();
  const queryClient = useQueryClient();
  
  return useOfflineMutation({
    mutationFn: async (folderId) => {
      // Always send force=true to allow deletion of folders with content
      // since we removed the confirmation dialog from the UI
      const response = await foldersAPI.remove(folderId);
      if (!response.success) {
        throw new Error(response.error || 'Failed to delete folder');
      }
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

/**
 * Combined hook for all folder operations
 * Useful when you need multiple operations in one component
 */
export const useFoldersQuery = () => {
  const foldersQuery = useFolders();
  const createFolder = useCreateFolder();
  const updateFolder = useUpdateFolder();
  const deleteFolder = useDeleteFolder();
  
  return {
    // Query data
    folders: foldersQuery.data || [],
    isLoading: foldersQuery.isLoading,
    error: foldersQuery.error,
    
    // Mutations
    createFolder,
    updateFolder,
    deleteFolder,
    
    // Refetch function
    refetch: foldersQuery.refetch
  };
};