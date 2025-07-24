// Validation functions for server-side data validation

export const validateTodo = (data) => {
  const errors = [];
  
  // Required fields
  if (!data.title || data.title.trim().length === 0) {
    errors.push('Title is required');
  } else if (data.title.length > 200) {
    errors.push('Title must be 200 characters or less');
  }
  
  // Optional fields validation
  if (data.description && data.description.length > 1000) {
    errors.push('Description must be 1000 characters or less');
  }
  
  if (data.status && !['to_do', 'doing', 'done'].includes(data.status)) {
    errors.push('Invalid status value');
  }
  
  if (data.priority && !['critical', 'important', 'should', 'could', 'nice_to_have'].includes(data.priority)) {
    errors.push('Invalid priority value');
  }
  
  if (data.time_estimate && !['1h', 'few_hours', 'day', 'days', 'week', 'weeks'].includes(data.time_estimate)) {
    errors.push('Invalid time estimate value');
  }
  
  if (data.deadline_type && !['fixed', 'relative'].includes(data.deadline_type)) {
    errors.push('Invalid deadline type');
  }
  
  if (data.deadline && data.deadline_type === 'fixed') {
    const date = new Date(data.deadline);
    if (isNaN(date.getTime())) {
      errors.push('Invalid deadline date');
    }
  }
  
  // Validate folder_ids array if provided
  if (data.folder_ids !== undefined) {
    if (!Array.isArray(data.folder_ids)) {
      errors.push('folder_ids must be an array');
    } else if (data.folder_ids.some(id => typeof id !== 'string' || id.trim().length === 0)) {
      errors.push('All folder_ids must be non-empty strings');
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};

export const validateTemplate = (data) => {
  const errors = [];
  
  if (!data.name || data.name.trim().length === 0) {
    errors.push('Name is required');
  }
  
  if (!data.content || data.content.trim().length === 0) {
    errors.push('Content is required');
  }
  
  if (!data.category || data.category.trim().length === 0) {
    errors.push('Category is required');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};

export const validateWorkflow = (data) => {
  const errors = [];
  
  if (!data.name || data.name.trim().length === 0) {
    errors.push('Name is required');
  }
  
  if (!data.category || data.category.trim().length === 0) {
    errors.push('Category is required');
  }
  
  if (!data.steps || !Array.isArray(data.steps) || data.steps.length === 0) {
    errors.push('At least one step is required');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};

export const validateSnippet = (data) => {
  const errors = [];
  
  if (!data.name || data.name.trim().length === 0) {
    errors.push('Name is required');
  }
  
  if (!data.content || data.content.trim().length === 0) {
    errors.push('Content is required');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};

export const validateFolder = (data) => {
  const errors = [];
  
  if (!data.name || data.name.trim().length === 0) {
    errors.push('Name is required');
  } else if (data.name.length > 100) {
    errors.push('Name must be 100 characters or less');
  }
  
  if (data.description && data.description.length > 500) {
    errors.push('Description must be 500 characters or less');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};