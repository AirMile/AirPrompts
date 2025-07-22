/**
 * Generic save handler factory for entities
 */
export const createSaveHandler = ({
  items,
  createMutation,
  updateMutation,
  onSuccess,
  entityName = 'item'
}) => {
  return async (entity) => {
    try {
      const isUpdate = entity.id && items.find(item => item.id === entity.id);
      
      if (isUpdate) {
        await updateMutation.mutateAsync(entity);
      } else {
        await createMutation.mutateAsync(entity);
      }
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      console.error(`Failed to save ${entityName}:`, err);
      throw err;
    }
  };
};

/**
 * Generic delete handler factory
 */
export const createDeleteHandler = ({
  deleteMutation,
  entityName = 'item'
}) => {
  return async (id) => {
    try {
      await deleteMutation.mutateAsync(id);
    } catch (err) {
      console.error(`Failed to delete ${entityName}:`, err);
      throw err;
    }
  };
};