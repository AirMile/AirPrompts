import { useState, useCallback, useMemo } from 'react';
import { extractVariables } from '../utils/templateUtils';

export function useTemplateForm(initialTemplate = null) {
  const [formData, setFormData] = useState({
    name: initialTemplate?.name || '',
    description: initialTemplate?.description || '',
    content: initialTemplate?.content || '',
    category: initialTemplate?.category || 'general',
    tags: initialTemplate?.tags || [],
    variables: initialTemplate?.variables || []
  });
  
  const [errors, setErrors] = useState({});
  
  const updateField = useCallback((field, value) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      
      // Auto-extract variables when content changes
      if (field === 'content') {
        updated.variables = extractVariables(value);
      }
      
      return updated;
    });
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const { [field]: _, ...rest } = prev;
        return rest;
      });
    }
  }, [errors]);
  
  const validate = useCallback(() => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Naam is verplicht';
    }
    if (!formData.content.trim()) {
      newErrors.content = 'Content is verplicht';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);
  
  const reset = useCallback(() => {
    setFormData({
      name: '',
      description: '',
      content: '',
      category: 'general',
      tags: [],
      variables: []
    });
    setErrors({});
  }, []);
  
  return {
    formData,
    errors,
    updateField,
    validate,
    reset
  };
}