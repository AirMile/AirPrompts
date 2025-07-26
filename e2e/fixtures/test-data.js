export const testTemplates = [
  {
    name: 'Test Email Template',
    description: 'A template for testing email generation',
    category: 'communication',
    content: 'Dear {recipient_name},\n\nThis is a test email regarding {subject}.\n\nBest regards,\n{sender_name}'
  },
  {
    name: 'Code Review Template',
    description: 'Template for code review feedback',
    category: 'development',
    content: 'Code Review for PR: {pr_number}\n\nReviewer: {reviewer}\nAuthor: {author}\n\nFeedback:\n{feedback}\n\nStatus: {status}'
  },
  {
    name: 'Bug Report Template',
    description: 'Template for reporting bugs',
    category: 'development',
    content: 'Bug Report\n\nTitle: {bug_title}\nSeverity: {severity}\nSteps to Reproduce:\n{steps}\n\nExpected: {expected}\nActual: {actual}'
  }
];

export const testWorkflows = [
  {
    name: 'Email Campaign Workflow',
    description: 'Workflow for creating email campaigns',
    category: 'marketing',
    steps: [
      { templateId: 'email-header', order: 1 },
      { templateId: 'email-body', order: 2 },
      { templateId: 'email-footer', order: 3 }
    ]
  },
  {
    name: 'Development Review Workflow',
    description: 'Complete development review process',
    category: 'development',
    steps: [
      { templateId: 'code-review', order: 1 },
      { templateId: 'test-review', order: 2 },
      { templateId: 'merge-approval', order: 3 }
    ]
  }
];

export const testVariables = {
  email: {
    recipient_name: 'John Doe',
    subject: 'Project Update',
    sender_name: 'Jane Smith'
  },
  codeReview: {
    pr_number: '#123',
    reviewer: 'Senior Developer',
    author: 'Junior Developer',
    feedback: 'Good implementation, minor suggestions added',
    status: 'Approved with comments'
  },
  bugReport: {
    bug_title: 'Button not responding on mobile',
    severity: 'High',
    steps: '1. Open app on mobile\n2. Click submit button\n3. Nothing happens',
    expected: 'Form should submit',
    actual: 'No response on button click'
  }
};

export const maliciousInputs = [
  '<script>alert("XSS")</script>',
  '"><script>alert("XSS")</script>',
  "'; DROP TABLE templates; --",
  'javascript:alert("XSS")',
  '<img src=x onerror=alert("XSS")>',
  '${alert("XSS")}',
  '{{alert("XSS")}}',
  '%3Cscript%3Ealert("XSS")%3C/script%3E'
];

export const largeDataset = {
  generateTemplates: (count) => {
    return Array.from({ length: count }, (_, i) => ({
      name: `Template ${i + 1}`,
      description: `Description for template ${i + 1}`,
      category: ['communication', 'development', 'marketing'][i % 3],
      content: `This is template content ${i + 1} with {variable_${i + 1}}`
    }));
  },
  
  generateWorkflows: (count) => {
    return Array.from({ length: count }, (_, i) => ({
      name: `Workflow ${i + 1}`,
      description: `Description for workflow ${i + 1}`,
      category: ['communication', 'development', 'marketing'][i % 3],
      steps: [
        { templateId: `template-${i * 3 + 1}`, order: 1 },
        { templateId: `template-${i * 3 + 2}`, order: 2 },
        { templateId: `template-${i * 3 + 3}`, order: 3 }
      ]
    }));
  }
};

export const importExportData = {
  validImport: {
    templates: testTemplates.slice(0, 2),
    workflows: testWorkflows.slice(0, 1)
  },
  
  invalidImport: {
    templates: [
      { 
        // Missing required fields
        name: 'Invalid Template',
        content: 'Some content'
      }
    ]
  },
  
  corruptedImport: 'This is not valid JSON data'
};