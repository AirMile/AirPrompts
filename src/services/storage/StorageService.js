import defaultTemplates from '../../data/defaultTemplates.json';
import defaultWorkflows from '../../data/defaultWorkflows.json';
import defaultSnippets from '../../data/defaultSnippets.json';

// Storage abstraction layer - makkelijk te vervangen met API later
class StorageServiceClass {
  constructor() {
    this.isAPIEnabled = false; // Toggle voor database migratie
    this.apiClient = null; // Future API client
    this.initializeDefaultData();
  }
  
  // Initialize default data if localStorage is empty
  initializeDefaultData() {
    // Check if data already exists
    const hasTemplates = localStorage.getItem('airprompts_templates');
    const hasWorkflows = localStorage.getItem('airprompts_workflows');
    const hasSnippets = localStorage.getItem('airprompts_snippets');
    
    // Only initialize if all are missing (first time user)
    if (!hasTemplates && !hasWorkflows && !hasSnippets) {
      console.log('Initializing default data...');
      
      // Set default data synchronously
      localStorage.setItem('airprompts_templates', JSON.stringify(defaultTemplates));
      localStorage.setItem('airprompts_workflows', JSON.stringify(defaultWorkflows));
      localStorage.setItem('airprompts_snippets', JSON.stringify(defaultSnippets));
      
      console.log('Default data initialized successfully');
    }
  }
  
  // Generic error handler
  async handleStorageOperation(operation, fallback = null) {
    try {
      return await operation();
    } catch (error) {
      console.error('Storage operation failed:', error);
      if (fallback) return fallback();
      throw error;
    }
  }
  
  // Templates CRUD - localStorage now, API-ready interface
  async getTemplates(filters = {}) {
    if (this.isAPIEnabled && this.apiClient) {
      return this.apiClient.get('/templates', { params: filters });
    }
    
    const templates = await this.handleStorageOperation(() => {
      const data = localStorage.getItem('airprompts_templates');
      return data ? JSON.parse(data) : [];
    }, () => []);
    
    return this.applyFilters(templates, filters);
  }
  
  async createTemplate(template) {
    if (this.isAPIEnabled && this.apiClient) {
      return this.apiClient.post('/templates', template);
    }
    
    const templates = await this.getTemplates();
    templates.push(template);
    localStorage.setItem('airprompts_templates', JSON.stringify(templates));
    return template;
  }
  
  async updateTemplate(template) {
    if (this.isAPIEnabled && this.apiClient) {
      return this.apiClient.put(`/templates/${template.id}`, template);
    }
    
    const templates = await this.getTemplates();
    const index = templates.findIndex(t => t.id === template.id);
    if (index !== -1) {
      templates[index] = { ...template, updatedAt: new Date().toISOString() };
      localStorage.setItem('airprompts_templates', JSON.stringify(templates));
    }
    return template;
  }
  
  async deleteTemplate(id) {
    if (this.isAPIEnabled && this.apiClient) {
      return this.apiClient.delete(`/templates/${id}`);
    }
    
    const templates = await this.getTemplates();
    const filtered = templates.filter(t => t.id !== id);
    localStorage.setItem('airprompts_templates', JSON.stringify(filtered));
    return id;
  }

  // Workflows CRUD
  async getWorkflows(filters = {}) {
    if (this.isAPIEnabled && this.apiClient) {
      return this.apiClient.get('/workflows', { params: filters });
    }
    
    const workflows = await this.handleStorageOperation(() => {
      const data = localStorage.getItem('airprompts_workflows');
      return data ? JSON.parse(data) : [];
    }, () => []);
    
    
    return this.applyFilters(workflows, filters);
  }
  
  async createWorkflow(workflow) {
    if (this.isAPIEnabled && this.apiClient) {
      return this.apiClient.post('/workflows', workflow);
    }
    
    const workflows = await this.getWorkflows();
    workflows.push(workflow);
    localStorage.setItem('airprompts_workflows', JSON.stringify(workflows));
    return workflow;
  }
  
  async updateWorkflow(workflow) {
    if (this.isAPIEnabled && this.apiClient) {
      return this.apiClient.put(`/workflows/${workflow.id}`, workflow);
    }
    
    const workflows = await this.getWorkflows();
    const index = workflows.findIndex(w => w.id === workflow.id);
    if (index !== -1) {
      workflows[index] = { ...workflow, updatedAt: new Date().toISOString() };
      localStorage.setItem('airprompts_workflows', JSON.stringify(workflows));
    }
    return workflow;
  }
  
  async deleteWorkflow(id) {
    if (this.isAPIEnabled && this.apiClient) {
      return this.apiClient.delete(`/workflows/${id}`);
    }
    
    const workflows = await this.getWorkflows();
    const filtered = workflows.filter(w => w.id !== id);
    localStorage.setItem('airprompts_workflows', JSON.stringify(filtered));
    return id;
  }

  // Snippets CRUD
  async getSnippets(filters = {}) {
    if (this.isAPIEnabled && this.apiClient) {
      return this.apiClient.get('/snippets', { params: filters });
    }
    
    const snippets = await this.handleStorageOperation(() => {
      const data = localStorage.getItem('airprompts_snippets');
      return data ? JSON.parse(data) : [];
    }, () => []);
    
    return this.applyFilters(snippets, filters);
  }
  
  async createSnippet(snippet) {
    if (this.isAPIEnabled && this.apiClient) {
      return this.apiClient.post('/snippets', snippet);
    }
    
    const snippets = await this.getSnippets();
    snippets.push(snippet);
    localStorage.setItem('airprompts_snippets', JSON.stringify(snippets));
    return snippet;
  }
  
  async updateSnippet(snippet) {
    if (this.isAPIEnabled && this.apiClient) {
      return this.apiClient.put(`/snippets/${snippet.id}`, snippet);
    }
    
    const snippets = await this.getSnippets();
    const index = snippets.findIndex(s => s.id === snippet.id);
    if (index !== -1) {
      snippets[index] = { ...snippet, updatedAt: new Date().toISOString() };
      localStorage.setItem('airprompts_snippets', JSON.stringify(snippets));
    }
    return snippet;
  }
  
  async deleteSnippet(id) {
    if (this.isAPIEnabled && this.apiClient) {
      return this.apiClient.delete(`/snippets/${id}`);
    }
    
    const snippets = await this.getSnippets();
    const filtered = snippets.filter(s => s.id !== id);
    localStorage.setItem('airprompts_snippets', JSON.stringify(filtered));
    return id;
  }
  
  // Utility functions voor migration
  async exportAllData() {
    return {
      templates: await this.getTemplates(),
      workflows: await this.getWorkflows(),
      snippets: await this.getSnippets(),
      exportDate: new Date().toISOString(),
      version: '1.0'
    };
  }
  
  async importData(data) {
    // Validate data structure
    if (!data.templates || !Array.isArray(data.templates)) {
      throw new Error('Invalid import data structure');
    }
    
    // Import with conflict resolution
    for (const template of data.templates) {
      const existing = await this.getTemplateById(template.id);
      if (existing) {
        // Handle conflict (for now, skip)
        console.warn(`Template ${template.id} already exists, skipping`);
        continue;
      }
      await this.createTemplate(template);
    }
  }

  async getTemplateById(id) {
    const templates = await this.getTemplates();
    return templates.find(t => t.id === id);
  }

  async getWorkflowById(id) {
    const workflows = await this.getWorkflows();
    return workflows.find(w => w.id === id);
  }

  async getSnippetById(id) {
    const snippets = await this.getSnippets();
    return snippets.find(s => s.id === id);
  }
  
  // Filter helper
  applyFilters(items, filters) {
    if (!filters || Object.keys(filters).length === 0) {
      return items;
    }
    
    return items.filter(item => {
      // Filter by folder
      if (filters.folderId && item.folderId !== filters.folderId) {
        return false;
      }
      
      // Filter by favorite
      if (filters.favorite !== undefined && item.favorite !== filters.favorite) {
        return false;
      }
      
      // Filter by category
      if (filters.category && item.category !== filters.category) {
        return false;
      }
      
      return true;
    });
  }
  
  // Future: Enable API mode
  enableAPI(apiClient) {
    this.isAPIEnabled = true;
    this.apiClient = apiClient;
    console.log('Storage Service: API mode enabled');
  }
}

export const StorageService = new StorageServiceClass();