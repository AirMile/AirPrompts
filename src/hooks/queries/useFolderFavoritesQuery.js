import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useFolderFavoritesAPI } from '../useAPI';
import * as localStorage from '../../utils/localStorageManager';

/**
 * Hook to fetch folder favorites
 */
export const useFolderFavorites = (folderId, entityType = null) => {
  return useQuery({
    queryKey: ['folderFavorites', folderId, entityType],
    queryFn: async () => {
      // Get all items and filter for favorites in this folder
      const templates = localStorage.getTemplates();
      const workflows = localStorage.getWorkflows();
      const snippets = localStorage.getSnippets();
      
      const favorites = [];
      
      // Filter items with folder favorites
      [...templates, ...workflows, ...snippets].forEach(item => {
        if (item.folderFavorites && item.folderFavorites[folderId]) {
          if (!entityType || item.type === entityType) {
            favorites.push({
              ...item,
              favoriteOrder: item.folderFavorites[folderId].favoriteOrder
            });
          }
        }
      });
      
      return favorites.sort((a, b) => a.favoriteOrder - b.favoriteOrder);
    },
    enabled: !!folderId,
    staleTime: 30000, // 30 seconds
    gcTime: 5 * 60 * 1000 // 5 minutes
  });
};

/**
 * Hook to add/update folder favorite
 */
export const useToggleFolderFavorite = () => {
  const favoritesAPI = useFolderFavoritesAPI();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ entityType, entityId, folderId, isFavorite, favoriteOrder = 0 }) => {
      const result = await favoritesAPI.toggleFavorite({
        entityType,
        entityId,
        folderId,
        isFavorite
      });
      
      if (result.success) {
        return result.data;
      }
      throw new Error(result.error || 'Failed to toggle favorite');
    },
    onSuccess: (data, variables) => {
      // Invalidate folder favorites queries
      queryClient.invalidateQueries({
        queryKey: ['folderFavorites', variables.folderId]
      });
      
      // Also invalidate the specific entity queries to update their state
      queryClient.invalidateQueries({
        queryKey: [variables.entityType + 's']
      });
    },
    onError: (error) => {
      console.error('Failed to toggle folder favorite:', error);
    }
  });
};

/**
 * Hook to update folder favorite order
 */
export const useUpdateFolderFavoriteOrder = () => {
  const favoritesAPI = useFolderFavoritesAPI();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ entityType, entityId, folderId, favoriteOrder }) => {
      const result = await favoritesAPI.toggleFavorite({
        entityType,
        entityId,
        folderId,
        isFavorite: true,
        favoriteOrder
      });
      
      if (result.success) {
        return result.data;
      }
      throw new Error(result.error || 'Failed to update favorite order');
    },
    onSuccess: (data, variables) => {
      // Invalidate folder favorites queries
      queryClient.invalidateQueries({
        queryKey: ['folderFavorites', variables.folderId]
      });
    },
    onError: (error) => {
      console.error('Failed to update folder favorite order:', error);
    }
  });
};