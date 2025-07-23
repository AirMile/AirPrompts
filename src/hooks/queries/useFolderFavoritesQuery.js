import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAPI } from '../useAPI';

/**
 * Hook to fetch folder favorites
 */
export const useFolderFavorites = (folderId, entityType = null) => {
  const api = useAPI();
  
  return useQuery({
    queryKey: ['folderFavorites', folderId, entityType],
    queryFn: async () => {
      const params = entityType ? `?entity_type=${entityType}` : '';
      const response = await api.get(`/folder-favorites/${folderId}${params}`);
      return response;
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
  const api = useAPI();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ entityType, entityId, folderId, isFavorite, favoriteOrder = 0 }) => {
      if (isFavorite) {
        // Add to favorites
        const response = await api.post('/folder-favorites', {
          entity_type: entityType,
          entity_id: entityId,
          folder_id: folderId,
          favorite_order: favoriteOrder
        });
        return response;
      } else {
        // Remove from favorites
        // Use the custom API method that handles DELETE with body
        const response = await api.request('/folder-favorites', {
          method: 'DELETE',
          data: {
            entity_type: entityType,
            entity_id: entityId,
            folder_id: folderId
          }
        });
        return response;
      }
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
  const api = useAPI();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ entityType, entityId, folderId, favoriteOrder }) => {
      const response = await api.post('/folder-favorites', {
        entity_type: entityType,
        entity_id: entityId,
        folder_id: folderId,
        favorite_order: favoriteOrder
      });
      return response.data;
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