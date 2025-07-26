# API Services Documentation

## Overview

The API services layer provides a clean interface between the React application and backend services or local storage. All data operations go through this layer to ensure consistency, validation, and proper error handling.

## Architecture

```
src/services/api/
├── index.js          # Main API client and configuration
├── templates.js      # Template-specific API methods
├── workflows.js      # Workflow-specific API methods
├── snippets.js       # Snippet-specific API methods
├── folders.js        # Folder management API
├── search.js         # Search and filtering API
├── execution.js      # Execution engine API
├── import-export.js  # Import/export functionality
└── storage/          # Storage adapters
    ├── localStorage.js
    ├── indexedDB.js
    └── cloudSync.js
```

## API Client

The main API client handles:
- Request/response interceptors
- Authentication headers
- Error handling
- Retry logic
- Request cancellation

### Configuration

```javascript
import { createAPIClient } from '@/services/api';

const api = createAPIClient({
  baseURL: process.env.REACT_APP_API_URL || '/api',
  timeout: 30000,
  retries: 3,
  retryDelay: 1000
});
```

## Core Services

### Template Service

```javascript
import { templateAPI } from '@/services/api';

// Get all templates
const templates = await templateAPI.getAll({
  category: 'business',
  favorites: true,
  sort: { field: 'updated', direction: 'desc' }
});

// Get single template
const template = await templateAPI.getById('template-id');

// Create template
const newTemplate = await templateAPI.create({
  name: 'Email Template',
  content: 'Hello {name}...',
  category: 'business'
});

// Update template
const updated = await templateAPI.update('template-id', {
  name: 'Updated Name'
});

// Delete template
await templateAPI.delete('template-id');

// Execute template
const result = await templateAPI.execute('template-id', {
  variables: { name: 'John' }
});
```

### Workflow Service

```javascript
import { workflowAPI } from '@/services/api';

// Execute workflow
const execution = await workflowAPI.execute('workflow-id', {
  variables: { input: 'data' },
  mode: 'interactive'
});

// Get execution status
const status = await workflowAPI.getExecutionStatus('execution-id');

// Validate workflow
const validation = await workflowAPI.validate(workflowData);
```

### Search Service

```javascript
import { searchAPI } from '@/services/api';

// Search across all entities
const results = await searchAPI.search({
  q: 'email template',
  types: ['template', 'workflow'],
  categories: ['business', 'marketing'],
  limit: 20
});

// Get search suggestions
const suggestions = await searchAPI.getSuggestions('query');

// Get faceted search results
const facets = await searchAPI.getFacets({
  types: ['template']
});
```

## Storage Adapters

### Local Storage Adapter

For small data and user preferences:

```javascript
import { localStorageAdapter } from '@/services/api/storage';

// Save data
await localStorageAdapter.set('key', data);

// Get data
const data = await localStorageAdapter.get('key');

// Remove data
await localStorageAdapter.remove('key');
```

### IndexedDB Adapter

For large datasets and offline support:

```javascript
import { indexedDBAdapter } from '@/services/api/storage';

// Store large dataset
await indexedDBAdapter.bulkInsert('templates', templates);

// Query with index
const results = await indexedDBAdapter.query('templates', {
  index: 'category',
  value: 'business'
});
```

## Error Handling

All API methods return standardized error responses:

```javascript
try {
  const result = await api.templates.create(data);
} catch (error) {
  if (error.code === 'VALIDATION_ERROR') {
    // Handle validation errors
    console.error('Validation failed:', error.details);
  } else if (error.code === 'NETWORK_ERROR') {
    // Handle network errors
    console.error('Network error:', error.message);
  } else {
    // Handle other errors
    console.error('Unexpected error:', error);
  }
}
```

### Error Codes

- `VALIDATION_ERROR` - Input validation failed
- `NOT_FOUND` - Resource not found
- `UNAUTHORIZED` - Authentication required
- `FORBIDDEN` - Insufficient permissions
- `NETWORK_ERROR` - Network request failed
- `TIMEOUT` - Request timed out
- `STORAGE_ERROR` - Storage operation failed
- `QUOTA_EXCEEDED` - Storage quota exceeded

## Request Cancellation

Cancel in-flight requests:

```javascript
import { CancelToken } from '@/services/api';

const source = CancelToken.source();

// Make request with cancel token
api.templates.getAll({ cancelToken: source.token })
  .then(response => {
    // Handle response
  })
  .catch(error => {
    if (CancelToken.isCancel(error)) {
      console.log('Request canceled');
    }
  });

// Cancel the request
source.cancel('Operation canceled by user');
```

## Pagination

Handle paginated responses:

```javascript
const page1 = await api.templates.getAll({ 
  limit: 20, 
  offset: 0 
});

// Access pagination metadata
console.log(page1.pagination.total);
console.log(page1.pagination.hasNext);

// Get next page
if (page1.pagination.hasNext) {
  const page2 = await api.templates.getAll({ 
    limit: 20, 
    offset: 20 
  });
}
```

## Caching

Built-in request caching:

```javascript
// Configure cache
api.configure({
  cache: {
    enabled: true,
    ttl: 5 * 60 * 1000, // 5 minutes
    storage: 'memory' // or 'localStorage'
  }
});

// Force cache refresh
const fresh = await api.templates.getAll({ 
  cache: false 
});

// Use cached data if available
const cached = await api.templates.getAll({ 
  cache: true,
  maxAge: 60000 // Accept data up to 1 minute old
});
```

## Batch Operations

Perform operations on multiple items:

```javascript
// Batch delete
const results = await api.templates.batchDelete([
  'id1', 'id2', 'id3'
]);

// Batch update
const updates = await api.templates.batchUpdate([
  { id: 'id1', favorite: true },
  { id: 'id2', category: 'business' }
]);
```

## WebSocket Support

Real-time updates (when available):

```javascript
// Subscribe to updates
const unsubscribe = api.realtime.subscribe('templates', (event) => {
  switch (event.type) {
    case 'created':
      // Handle new template
      break;
    case 'updated':
      // Handle template update
      break;
    case 'deleted':
      // Handle template deletion
      break;
  }
});

// Unsubscribe when done
unsubscribe();
```

## Testing

Mock API for testing:

```javascript
import { createMockAPI } from '@/services/api/mock';

const mockAPI = createMockAPI({
  templates: [/* mock data */],
  delay: 100 // Simulate network delay
});

// Use in tests
jest.mock('@/services/api', () => mockAPI);
```

## Best Practices

1. **Always handle errors** - Use try/catch or .catch()
2. **Cancel requests** - Cancel when component unmounts
3. **Use proper types** - Import types from api.types.js
4. **Validate input** - Use validation utilities before API calls
5. **Cache wisely** - Cache read-only data, invalidate on mutations
6. **Batch when possible** - Reduce API calls with batch operations
7. **Monitor performance** - Track API response times
8. **Handle offline** - Gracefully degrade when offline