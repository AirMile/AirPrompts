import { useState, useCallback, useEffect } from 'react';

export const useEntityForm = (initialEntity, schema) => {
  const [formData, setFormData] = useState(() => {
    if (!initialEntity) {
      // Initialize with default values from schema
      const defaults = {};
      schema.fields.forEach(field => {
        if (field.type === 'multiselect' || field.type === 'tags') {
          defaults[field.name] = [];
        } else if (field.type === 'checkbox') {
          defaults[field.name] = false;
        } else {
          defaults[field.name] = '';
        }
      });
      return defaults;
    }
    return { ...initialEntity };
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isDirty, setIsDirty] = useState(false);

  // Reset form when entity changes
  useEffect(() => {
    if (initialEntity) {
      setFormData({ ...initialEntity });
      setErrors({});
      setTouched({});
      setIsDirty(false);
    }
  }, [initialEntity]);

  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    
    setFormData(prev => {
      const newData = { ...prev };
      
      if (type === 'checkbox') {
        newData[name] = checked;
      } else if (type === 'multiselect' || type === 'tags' || type === 'select') {
        // These types pass value directly, not through event
        newData[name] = value;
      } else {
        newData[name] = value;
      }
      
      return newData;
    });

    setIsDirty(true);

    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  }, [errors]);

  const handleBlur = useCallback((e) => {
    const { name } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));

    // Validate single field on blur
    const field = schema.fields.find(f => f.name === name);
    if (field && field.validation) {
      const error = field.validation(formData[name]);
      if (error) {
        setErrors(prev => ({ ...prev, [name]: error }));
      }
    }
  }, [formData, schema]);

  const validate = useCallback(() => {
    const newErrors = {};
    
    schema.fields.forEach(field => {
      // Check required fields
      if (field.required) {
        const value = formData[field.name];
        if (!value || (Array.isArray(value) && value.length === 0) || 
            (typeof value === 'string' && value.trim() === '')) {
          newErrors[field.name] = `${field.label} is required`;
        }
      }
      
      // Run custom validation if provided
      if (field.validation && formData[field.name]) {
        const error = field.validation(formData[field.name]);
        if (error) {
          newErrors[field.name] = error;
        }
      }
    });

    setErrors(newErrors);
    
    // Mark all fields as touched during validation
    const allTouched = {};
    schema.fields.forEach(field => {
      allTouched[field.name] = true;
    });
    setTouched(allTouched);

    return Object.keys(newErrors).length === 0;
  }, [formData, schema]);

  const reset = useCallback(() => {
    if (initialEntity) {
      setFormData({ ...initialEntity });
    } else {
      // Reset to defaults
      const defaults = {};
      schema.fields.forEach(field => {
        if (field.type === 'multiselect' || field.type === 'tags') {
          defaults[field.name] = [];
        } else if (field.type === 'checkbox') {
          defaults[field.name] = false;
        } else {
          defaults[field.name] = '';
        }
      });
      setFormData(defaults);
    }
    
    setErrors({});
    setTouched({});
    setIsDirty(false);
  }, [initialEntity, schema]);

  return {
    formData,
    errors,
    touched,
    isDirty,
    handleChange,
    handleBlur,
    validate,
    reset,
    setFormData
  };
};