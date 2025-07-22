# Frontend Agent Briefing

## 🎯 Mission Statement

You are the **Frontend Agent** responsible for integrating the React frontend with the new Express API backend. Your goal is to seamlessly replace localStorage with API calls while maintaining all existing functionality and user experience.

---

## 📋 Your Responsibilities

### **Primary Deliverables**
1. **API Integration Hooks** - Custom React hooks for API communication
2. **DataStorage.js Updates** - API integration with localStorage fallback
3. **Loading States** - User-friendly loading indicators throughout the app
4. **Error Handling** - Graceful error recovery and user feedback
5. **State Management** - Async state management patterns

### **Quality Standards**
- **Zero Breaking Changes** - All existing functionality must continue working
- **Performance** - No noticeable slowdown in UI responsiveness  
- **User Experience** - Smooth loading states and clear error messages
- **Reliability** - Graceful fallback to localStorage when API unavailable

---

## 🗂️ Project Context

### **Current Frontend Architecture**
- **Framework:** React 19 with Vite
- **Styling:** Tailwind CSS with custom color system
- **State:** Component state in PromptTemplateSystem.jsx
- **Data Layer:** localStorage via `src/utils/dataStorage.js`
- **Key Components:** Homepage, TemplateEditor, WorkflowEditor, ItemExecutor

### **Backend API (Available After Phase 1)**
- **Base URL:** http://localhost:3001/api
- **Authentication:** None (single-user app)
- **Response Format:** Standardized JSON with success/error structure
- **CORS:** Configured for localhost:5173

### **Integration Requirements**
- **Backward Compatibility:** Must work with existing component interfaces
- **Progressive Enhancement:** API calls with localStorage fallback
- **Loading States:** Visual feedback during async operations
- **Error Recovery:** Automatic retry and fallback mechanisms

---

## 🔌 API Integration Specifications

### **Available API Endpoints (From Backend Agent)**

#### **Templates**
```javascript
GET    /api/templates                    # Get all templates
GET    /api/templates/:id               # Get specific template
POST   /api/templates                   # Create new template
PUT    /api/templates/:id               # Update template
DELETE /api/templates/:id               # Delete template
GET    /api/templates/search?q=query    # Search templates
```

#### **Workflows**
```javascript
GET    /api/workflows                   # Get all workflows (with steps)
GET    /api/workflows/:id               # Get specific workflow with steps  
POST   /api/workflows                   # Create new workflow
PUT    /api/workflows/:id               # Update workflow
DELETE /api/workflows/:id               # Delete workflow
```

#### **Folders**
```javascript
GET    /api/folders                     # Get all folders
POST   /api/folders                     # Create new folder
PUT    /api/folders/:id                 # Update folder
DELETE /api/folders/:id                 # Delete folder
```

### **API Response Format**
```javascript
// Success Response
{
  "success": true,
  "data": {
    // Actual data here
  },
  "meta": {
    "timestamp": "2025-01-20T10:30:00Z",
    "version": "1.0"
  }
}

// Error Response  
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Template naam is verplicht",
    "details": {
      "field": "name",
      "value": ""
    }
  },
  "meta": {
    "timestamp": "2025-01-20T10:30:00Z",
    "version": "1.0"
  }
}
```

---

## 🛠️ Implementation Specifications

### **Required New Files**

#### **API Hooks**
```
src/hooks/
├── useAPI.js              # Base API communication hook
├── useTemplates.js        # Template-specific operations
├── useWorkflows.js        # Workflow-specific operations
└── useFolders.js          # Folder-specific operations
```

#### **Updated Files**
```
src/utils/dataStorage.js   # Add API integration with fallback
src/components/PromptTemplateSystem.jsx  # Add loading states
src/components/dashboard/Homepage.jsx     # Add loading states
src/components/templates/TemplateEditor.jsx  # Add loading states
src/components/workflows/WorkflowEditor.jsx  # Add loading states
```

---

## 📋 Implementation Checkpoints

### **Checkpoint 2.1: useAPI Hook Created** ✅
**Your Tasks:**
1. Create `src/hooks/useAPI.js` with base API functionality
2. Implement loading state management
3. Implement error state management  
4. Add automatic retry logic
5. Add localStorage fallback capability

**useAPI.js Template:**
```javascript
import { useState, useCallback } from 'react';

const API_BASE = 'http://localhost:3001/api';

export const useAPI = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const apiCall = useCallback(async (endpoint, options = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      });
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error?.message || 'API call failed');
      }
      
      return data.data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return { apiCall, loading, error, clearError };
};
```

**Validation:** Hook compiles, provides loading/error states, handles API calls

---

### **Checkpoint 2.2: DataStorage.js Updated** ✅
**Your Tasks:**
1. Update existing dataStorage.js functions to use API
2. Maintain localStorage fallback for all functions
3. Preserve all existing function signatures
4. Add new async handling where needed
5. Ensure backward compatibility

**DataStorage.js Updates:**
```javascript
// Add API integration while preserving existing interface
import { API_BASE } from '../config/api.js';

// Updated loadTemplates function
export const loadTemplates = async () => {
  try {
    // Try API first
    const response = await fetch(`${API_BASE}/templates`);
    if (response.ok) {
      const data = await response.json();
      return data.success ? data.data : [];
    }
  } catch (error) {
    console.warn('API unavailable, using localStorage fallback');
  }
  
  // Fallback to localStorage
  return loadFromStorage(STORAGE_KEYS.TEMPLATES, []);
};

// Updated saveTemplate function
export const saveTemplate = async (template) => {
  try {
    // Try API first
    const response = await fetch(`${API_BASE}/templates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(template)
    });
    
    if (response.ok) {
      const data = await response.json();
      return data.success ? data.data : template;
    }
  } catch (error) {
    console.warn('API unavailable, saving to localStorage');
  }
  
  // Fallback to localStorage
  const templates = loadFromStorage(STORAGE_KEYS.TEMPLATES, []);
  templates.push(template);
  saveToStorage(STORAGE_KEYS.TEMPLATES, templates);
  return template;
};
```

**Validation:** All existing functions work, API integration added, fallback works

---

### **Checkpoint 2.3: Loading States Added** ⚠️ USER VALIDATION
**Your Tasks:**
1. Add loading indicators to all major components
2. Implement skeleton loading for lists
3. Add button loading states during saves
4. Ensure loading doesn't block user interaction unnecessarily
5. Make loading states visually appealing

**Components to Update:**

#### **PromptTemplateSystem.jsx**
```javascript
// Add global loading state for initial data load
const [isLoading, setIsLoading] = useState(true);

// Show loading during initial data fetch
if (isLoading) {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  );
}
```

#### **Homepage.jsx**
```javascript
// Add loading state for template/workflow lists
const [templatesLoading, setTemplatesLoading] = useState(false);

// Skeleton loading for template cards
{templatesLoading ? (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {[...Array(6)].map((_, i) => (
      <div key={i} className="animate-pulse">
        <div className="bg-gray-200 h-32 rounded-lg"></div>
      </div>
    ))}
  </div>
) : (
  // Normal template rendering
)}
```

#### **TemplateEditor.jsx / WorkflowEditor.jsx**
```javascript
// Add save button loading state
const [saving, setSaving] = useState(false);

<button 
  disabled={saving}
  onClick={handleSave}
  className="btn-primary"
>
  {saving ? 'Saving...' : 'Save Template'}
</button>
```

**What User Will Validate:**
- Loading spinners appear during data operations
- Loading states don't block UI unnecessarily
- Loading experience feels smooth and responsive
- Loading states disappear appropriately

---

### **Checkpoint 2.4: Error Handling Implemented** ⚠️ USER VALIDATION
**Your Tasks:**
1. Implement comprehensive error handling for all API calls
2. Add user-friendly error messages and notifications
3. Implement automatic retry mechanisms
4. Add graceful fallback to localStorage when API fails
5. Show clear error recovery options to users

**Error Handling Components:**

#### **Error Toast/Notification System**
```javascript
// src/components/common/ErrorToast.jsx
import { useState, useEffect } from 'react';

export const ErrorToast = ({ error, onDismiss }) => {
  useEffect(() => {
    if (error) {
      const timer = setTimeout(onDismiss, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, onDismiss]);

  if (!error) return null;

  return (
    <div className="fixed top-4 right-4 bg-red-500 text-white p-4 rounded-lg shadow-lg z-50">
      <div className="flex items-center justify-between">
        <span>{error}</span>
        <button onClick={onDismiss} className="ml-4 text-white hover:text-gray-200">
          ×
        </button>
      </div>
    </div>
  );
};
```

#### **Error Boundary for API Errors**
```javascript
// src/utils/errorHandler.js
export const handleAPIError = (error, fallbackAction) => {
  console.error('API Error:', error);
  
  if (error.message.includes('fetch')) {
    // Network error - use localStorage fallback
    console.warn('Network error, falling back to localStorage');
    return fallbackAction();
  }
  
  if (error.message.includes('4')) {
    // Client error - show user-friendly message
    throw new Error('Please check your input and try again');
  }
  
  if (error.message.includes('5')) {
    // Server error - suggest retry
    throw new Error('Server temporarily unavailable. Please try again.');
  }
  
  throw error;
};
```

#### **Integration in Components**
```javascript
// Example usage in TemplateEditor
const handleSave = async () => {
  try {
    setSaving(true);
    await saveTemplate(template);
    setSuccessMessage('Template saved successfully');
  } catch (error) {
    try {
      // Try fallback action
      await handleAPIError(error, () => saveTemplateToLocalStorage(template));
      setWarningMessage('Saved locally - will sync when connection restored');
    } catch (fallbackError) {
      setError(fallbackError.message);
    }
  } finally {
    setSaving(false);
  }
};
```

**What User Will Validate:**
- Network errors (stop backend server) are handled gracefully
- Error messages are clear and helpful
- App continues working with localStorage fallback
- Error recovery flow is smooth and intuitive

---

### **Checkpoint 2.5: Frontend Testing Complete** ⚠️ USER VALIDATION
**Your Tasks:**
1. Ensure all existing functionality still works perfectly
2. Test complete workflows (create, edit, delete templates/workflows)
3. Verify performance is acceptable (no noticeable delays)
4. Test error scenarios and recovery
5. Prepare comprehensive testing guide for user

**Testing Scenarios to Implement:**

#### **Happy Path Testing**
```javascript
// Automated tests you should run
const testScenarios = [
  'Create new template with variables',
  'Edit existing template',
  'Delete template',
  'Create workflow with multiple steps',
  'Execute workflow end-to-end',
  'Search templates',
  'Filter by category',
  'Toggle favorites'
];
```

#### **Error Scenario Testing**
```javascript
// Error scenarios to test
const errorScenarios = [
  'Backend server down (test localStorage fallback)',
  'Network timeout (test retry logic)',
  'Invalid data submission (test validation)',
  'Concurrent edit conflicts (test data consistency)'
];
```

#### **Performance Testing**
```javascript
// Performance benchmarks
const performanceTargets = {
  'Initial page load': '< 2 seconds',
  'Template list rendering': '< 500ms',
  'Template save operation': '< 1 second',
  'Search results': '< 300ms'
};
```

**User Testing Guide:**
1. **Complete Workflow Test:** Create template → Save → Reload page → Edit → Save
2. **Error Recovery Test:** Stop backend → Try to save → Verify localStorage fallback
3. **Performance Test:** Large template list → Verify smooth scrolling/interaction
4. **Edge Case Test:** Special characters in templates → Verify proper handling

**What User Will Validate:**
- All existing functionality works correctly
- Performance feels good (no slower than before)
- Error handling works smoothly
- Ready for data migration phase

---

## 🎨 UX Guidelines

### **Loading State Best Practices**
- **Immediate Feedback:** Show loading within 100ms of user action
- **Non-Blocking:** Don't prevent user from navigating or viewing other content
- **Contextual:** Show loading near the relevant content/action
- **Reasonable Timeouts:** Don't show infinite loading states

### **Error Message Guidelines**
- **User-Friendly Language:** No technical jargon or error codes
- **Actionable:** Tell user what they can do about the error
- **Contextual:** Show errors near the relevant input/action
- **Dismissible:** Let users dismiss error messages

### **Fallback Strategy**
- **Transparent Fallback:** User shouldn't notice localStorage fallback
- **Sync Indication:** When possible, indicate when data will sync
- **Offline Capability:** App should work completely offline
- **Recovery:** Automatic sync when connection restored

---

## 🚨 Critical Implementation Notes

### **State Management Patterns**
- **Optimistic Updates:** Update UI immediately for fast actions (favorites)
- **Safe Updates:** Wait for server confirmation for critical actions (save/delete)
- **Cache Management:** Keep local cache of data with reasonable expiry
- **Conflict Resolution:** Handle concurrent edit scenarios gracefully

### **Performance Considerations**
- **Debounce API Calls:** Prevent excessive API calls during rapid user input
- **Request Deduplication:** Don't make identical requests simultaneously
- **Data Pagination:** For large datasets, implement pagination
- **Image/Asset Optimization:** Maintain fast loading times

### **Error Recovery Strategies**
- **Automatic Retry:** Retry failed requests with exponential backoff
- **Queue Offline Actions:** Store actions to replay when connection restored
- **Data Validation:** Validate data locally before sending to API
- **Rollback Capability:** Ability to undo optimistic updates if they fail

---

## 📊 Quality Assurance

### **Code Quality Standards**
- **Follow React Best Practices:** Hooks, component patterns, state management
- **Maintain Existing Patterns:** Use same styling, naming, structure conventions
- **TypeScript-Ready:** Write code that's easy to add TypeScript to later
- **Accessibility:** Maintain existing accessibility features

### **Testing Requirements**
- **Component Testing:** Verify all components render correctly with API data
- **Error Handling Testing:** Test all error scenarios thoroughly
- **Performance Testing:** Verify no performance regression
- **Integration Testing:** Test complete user workflows

### **User Experience Standards**
- **No Breaking Changes:** All existing user workflows must continue working
- **Improved Performance:** API should feel as fast or faster than localStorage
- **Clear Feedback:** Users understand what's happening at all times
- **Reliable Experience:** App works consistently regardless of network state

---

## 🎯 Success Criteria

### **Technical Success**
- All API integration complete with fallback mechanisms
- Loading states implemented throughout application
- Comprehensive error handling with recovery
- Performance equal or better than localStorage version

### **User Experience Success**
- Smooth, responsive interface with clear feedback
- Graceful error handling that doesn't disrupt workflow
- Transparent API integration (user doesn't notice the change)
- Reliable operation in both online and offline scenarios

### **Integration Readiness**  
- Frontend ready for data migration phase
- All existing functionality preserved and tested
- Error scenarios handled and tested
- Performance validated and acceptable

---

## 📚 Reference Materials

### **Required Reading**
- Current `src/utils/dataStorage.js` - Understand existing patterns
- `CHECKPOINT_DEFINITIONS.md` - Your specific validation criteria
- Backend Agent's API documentation - Understand available endpoints

### **Current Architecture Files**
- `src/components/PromptTemplateSystem.jsx` - Main app component
- `src/components/dashboard/Homepage.jsx` - Main dashboard component
- `src/components/templates/TemplateEditor.jsx` - Template editing
- `src/components/workflows/WorkflowEditor.jsx` - Workflow editing

---

## 🎮 Next Steps After Completion

1. **Update Dashboard** with Phase 2 completion status
2. **Notify User** for comprehensive testing and validation
3. **Prepare Handoff** documentation for Migration Agent
4. **Document API Integration** patterns for future development
5. **Support Migration Agent** with any frontend-related questions

---

**🎯 Remember:** Your integration should be invisible to the user - they should get all the benefits of the database backend without noticing any change in how the app works. Focus on seamless experience and reliable fallback mechanisms.