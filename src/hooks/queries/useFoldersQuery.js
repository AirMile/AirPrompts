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

      // Ensure all folders have a valid sortOrder
      const foldersByParent = {};
      transformedFolders.forEach(folder => {
        const parentId = folder.parentId || 'root';
        if (!foldersByParent[parentId]) {
          foldersByParent[parentId] = [];
        }
        foldersByParent[parentId].push(folder);
      });

      // Debug logging to see what sortOrder values we're getting from localStorage
      console.log('🔍 DEBUG: Raw folders from localStorage:', transformedFolders.map(f => ({ 
        id: f.id, 
        name: f.name, 
        sortOrder: f.sortOrder, 
        sort_order: f.sort_order,
        parentId: f.parentId 
      })));
      
      // Debug what's actually in localStorage
      const rawFoldersFromStorage = JSON.parse(localStorage.getItem('airprompts_folders') || '[]');
      console.log('🔍 DEBUG: Direct from localStorage:', rawFoldersFromStorage.map(f => ({ 
        id: f.id, 
        name: f.name, 
        sortOrder: f.sortOrder, 
        sort_order: f.sort_order,
        parentId: f.parentId 
      })));

      // Assign sortOrder to folders that don't have one (only for folders that truly don't have a sortOrder)
      Object.keys(foldersByParent).forEach(parentId => {
        const siblings = foldersByParent[parentId];
        
        console.log(`🔍 DEBUG: Processing parent ${parentId}, siblings:`, siblings.map(f => ({ 
          name: f.name, 
          sortOrder: f.sortOrder, 
          sort_order: f.sort_order 
        })));
        
        // Check if any folder has sort_order (NOT sortOrder!) since that's what comes from localStorage
        const hasAnySortOrder = siblings.some(folder => 
          folder.sort_order !== undefined && folder.sort_order !== null
        );
        
        console.log(`🔍 DEBUG: Parent ${parentId} hasAnySortOrder: ${hasAnySortOrder}`);
        
        if (!hasAnySortOrder) {
          // Sort siblings by name first for consistent initial ordering
          siblings.sort((a, b) => a.name.localeCompare(b.name));
          
          siblings.forEach((folder, index) => {
            folder.sortOrder = index;
            folder.sort_order = index; // Keep both in sync
            console.log(`🔧 Assigned initial sortOrder ${index} to folder: ${folder.name}`);
          });
        } else {
          // Some folders already have sortOrder, only assign to those that don't
          siblings.forEach((folder, index) => {
            if (folder.sort_order === undefined || folder.sort_order === null) {
              // Find the highest existing sortOrder and add 1
              const maxSortOrder = Math.max(
                -1, 
                ...siblings
                  .filter(f => f.sort_order !== undefined && f.sort_order !== null)
                  .map(f => f.sort_order)
              );
              folder.sortOrder = maxSortOrder + 1;
              folder.sort_order = maxSortOrder + 1;
              console.log(`🔧 Assigned sortOrder ${folder.sortOrder} to new folder: ${folder.name}`);
            } else {
              console.log(`✅ Keeping existing sortOrder ${folder.sortOrder} for folder: ${folder.name}`);
            }
          });
        }
      });
      
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