import { useItemColors } from '../useItemColors';

export const useEntityTheme = (entityType) => {
  const { getColorClasses } = useItemColors();
  
  // Map entity types to color themes
  const typeMapping = {
    template: 'template',
    workflow: 'workflow',
    snippet: 'snippet',
    addon: 'addon',
    insert: 'snippet', // Use snippet colors for inserts
    folder: 'folder',
    context: 'context'
  };
  
  const mappedType = typeMapping[entityType] || 'template';
  
  return {
    getColorClasses: (variant) => getColorClasses(mappedType, variant),
    entityColor: mappedType
  };
};