/**
 * API Test Component - Voor het testen van useAPI hook
 * Tijdelijk component om de API integratie te valideren
 */

import React, { useState } from 'react';
import { useTemplatesAPI } from '../../hooks/useAPI.js';

const APITestComponent = () => {
  const templatesAPI = useTemplatesAPI();
  const [templates, setTemplates] = useState([]);
  const [testTemplate, setTestTemplate] = useState({
    name: 'API Test Template',
    content: 'Hello {name}! This is a test from React.',
    category: 'test',
    description: 'Testing API integration'
  });

  const handleGetTemplates = async () => {
    try {
      const result = await templatesAPI.getTemplates();
      setTemplates(result || []);
      console.log('Templates loaded:', result);
    } catch (error) {
      console.error('Failed to load templates:', error);
    }
  };

  const handleCreateTemplate = async () => {
    try {
      const result = await templatesAPI.createTemplate(testTemplate);
      console.log('Template created:', result);
      // Refresh templates list
      handleGetTemplates();
    } catch (error) {
      console.error('Failed to create template:', error);
    }
  };

  const handleHealthCheck = async () => {
    const isHealthy = await templatesAPI.checkHealth();
    console.log('API Health:', isHealthy ? 'OK' : 'Down');
  };

  return (
    <div className="p-5 border-2 border-primary-500 m-5 rounded-lg bg-secondary-50 dark:bg-secondary-900 dark:border-primary-400">
      <h3>🔧 API Integration Test</h3>
      
      {/* API Status */}
      <div style={{ marginBottom: '15px' }}>
        <strong>Status:</strong>
        {templatesAPI.loading && <span className="text-orange-600 dark:text-orange-400"> Loading...</span>}
        {templatesAPI.error && (
          <span className="text-danger-600 dark:text-danger-400"> Error: {templatesAPI.error.message}</span>
        )}
        {!templatesAPI.loading && !templatesAPI.error && (
          <span className="text-success-600 dark:text-success-400"> Ready</span>
        )}
      </div>

      {/* Action Buttons */}
      <div style={{ marginBottom: '15px' }}>
        <button 
          onClick={handleHealthCheck}
          className="mr-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded transition-colors disabled:opacity-50"
          disabled={templatesAPI.loading}
        >
          🏥 Health Check
        </button>
        
        <button 
          onClick={handleGetTemplates}
          className="mr-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded transition-colors disabled:opacity-50"
          disabled={templatesAPI.loading}
        >
          📥 Load Templates
        </button>
        
        <button 
          onClick={handleCreateTemplate}
          className="mr-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded transition-colors disabled:opacity-50"
          disabled={templatesAPI.loading}
        >
          ➕ Create Test Template
        </button>

        {templatesAPI.error && (
          <button 
            onClick={templatesAPI.clearError}
            className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded transition-colors"
          >
            🧹 Clear Error
          </button>
        )}
      </div>

      {/* Templates List */}
      {templates.length > 0 && (
        <div>
          <h4>📋 Templates ({templates.length}):</h4>
          <ul>
            {templates.map(template => (
              <li key={template.id} style={{ marginBottom: '5px' }}>
                <strong>{template.name}</strong> - {template.content.substring(0, 50)}...
                {template.variables && template.variables.length > 0 && (
                  <em> (Variables: {template.variables.join(', ')})</em>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-4 text-xs text-secondary-600 dark:text-secondary-400">
        💡 Check browser console voor gedetailleerde logs
      </div>
    </div>
  );
};

export default APITestComponent;