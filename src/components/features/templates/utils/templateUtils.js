// Extract variable names from template content
export function extractVariables(content) {
  if (!content) return [];
  
  // Match {variable_name} pattern
  const regex = /\{([^}]+)\}/g;
  const matches = content.matchAll(regex);
  const variableSet = new Set();
  
  for (const match of matches) {
    const varName = match[1].trim();
    if (varName && varName !== 'previous_output') {
      variableSet.add(varName);
    }
  }
  
  return Array.from(variableSet);
}

// Replace variables in template content
export function replaceVariables(content, variables) {
  if (!content || !variables) return content;
  
  let result = content;
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`\\{${key}\\}`, 'g');
    result = result.replace(regex, value || '');
  });
  
  return result;
}

// Validate template data
export function validateTemplate(template) {
  const errors = {};
  
  if (!template.name?.trim()) {
    errors.name = 'Template name is required';
  }
  
  if (!template.content?.trim()) {
    errors.content = 'Template content is required';
  }
  
  if (!template.category) {
    errors.category = 'Category is required';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

// Get template preview with truncated content
export function getTemplatePreview(template, maxLength = 150) {
  if (!template.content) return '';
  
  const preview = template.content.substring(0, maxLength);
  return preview.length < template.content.length 
    ? preview + '...' 
    : preview;
}