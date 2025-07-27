# Version Control Implementation Plan

## Overview
Implementation of a version control system for templates, workflows, and snippets that allows users to:
- Track version history
- Rollback to previous versions  
- Experiment safely without losing original content

## Core Requirements

### Version Limit
- **10 versions** per item (template/workflow/snippet)
- **FIFO strategy**: Oldest version is removed when adding 11th version
- **Smart save logic**: Not every small change creates a new version

### Version Creation Triggers

```javascript
// Create new version when:
- Manual save (always)
- Auto-save AFTER significant change:
  - Content changed > 10%
  - Variables added/removed
  - Name/description modified
  - 5+ minutes since last version

// NO new version when:
- Whitespace/formatting only
- Minor typo fixes (< 5 characters)
- Within 30 seconds of previous save
```

## Data Structure

### Extended Item Structure
```javascript
{
  // Existing fields
  id: '123',
  name: 'Template Name',
  content: 'Current content',
  description: 'Current description',
  variables: ['var1', 'var2'],
  // ... other existing fields
  
  // New version tracking
  versions: [
    {
      versionId: 'v_1234567890_abc',
      versionNumber: 1,
      timestamp: '2025-01-27T10:00:00Z',
      trigger: 'manual', // 'manual' | 'auto' | 'import'
      changes: ['content', 'variables'], // changed fields
      changeSize: 245, // bytes changed
      snapshot: {
        name: 'Template Name',
        content: 'Version content...',
        description: 'Version description',
        variables: ['var1', 'var2'],
        snippetTags: [] // if applicable
      },
      note: 'Optional version note' // user-provided
    }
    // ... up to 10 versions
  ],
  
  // Version metadata
  currentVersion: 10,
  lastVersionDate: '2025-01-27T10:00:00Z'
}
```

## Implementation Architecture

### File Structure
```
src/
├── services/
│   └── version/
│       ├── VersionService.js         # Main version control API
│       ├── VersionStorage.js         # Storage management
│       ├── DiffCalculator.js         # Change detection
│       └── VersionMigration.js       # Migrate existing data
│
├── hooks/
│   └── queries/
│       ├── useVersionHistory.js      # Get version history
│       ├── useCreateVersion.js       # Create new version
│       └── useRollbackVersion.js     # Rollback functionality
│
├── components/
│   └── version/
│       ├── VersionBadge.jsx          # Show version number
│       ├── VersionHistoryModal.jsx   # History list & rollback
│       ├── VersionCompare.jsx        # Compare two versions
│       └── VersionListItem.jsx       # Individual version display
│
└── utils/
    └── versionHelpers.js             # Helper functions
```

## Core Services

### VersionService.js
```javascript
class VersionService {
  // Create new version
  async createVersion(itemType, itemId, trigger = 'manual', note = null)
  
  // Get version history
  async getVersionHistory(itemType, itemId)
  
  // Rollback to specific version
  async rollbackToVersion(itemType, itemId, versionId)
  
  // Compare two versions
  async compareVersions(itemType, itemId, versionId1, versionId2)
  
  // Delete old versions (cleanup)
  async pruneVersions(itemType, itemId, keepCount = 10)
  
  // Check if version should be created
  shouldCreateVersion(currentItem, previousVersion, trigger)
}
```

### Storage Strategy

#### LocalStorage Structure
```javascript
// Main items stay in existing keys
'airprompts_templates'
'airprompts_workflows'
'airprompts_snippets'

// Versions stored separately for performance
'airprompts_versions_metadata' // Light metadata for all items
'airprompts_versions_[itemType]_[itemId]' // Full version history per item
```

#### Storage Optimization
- Store full snapshots (no complex diffing needed)
- Compress version data if > 1KB
- Lazy load version history (only when modal opens)
- Clean up orphaned versions on startup

## UI Components

### Version Badge
```jsx
// Shows in editor header
<VersionBadge 
  currentVersion={10}
  hasUnsavedChanges={true}
  onClick={openVersionHistory}
/>
// Display: "v10 • modified"
```

### Version History Modal
```jsx
<VersionHistoryModal
  itemType="template"
  itemId="123"
  currentItem={template}
  onRollback={handleRollback}
  onCompare={handleCompare}
/>
```

### UI Flow
1. **Version Badge** in editor shows "v10"
2. Click badge → Opens **Version History Modal**
3. List shows 10 versions with:
   - Timestamp & trigger type
   - Changed fields indicator
   - Optional note
   - Rollback button
4. Rollback → Confirmation → Apply version
5. Compare → Select 2 versions → Side-by-side diff

## Implementation Phases

### Phase 1: Core Infrastructure (Week 1)
- [ ] Create VersionService
- [ ] Extend data models
- [ ] Update localStorage manager
- [ ] Create version on save
- [ ] Basic version storage

### Phase 2: UI Components (Week 2)
- [ ] Version Badge component
- [ ] Version History Modal
- [ ] Version List Item
- [ ] Rollback confirmation
- [ ] Integration in editors

### Phase 3: Advanced Features (Week 3)
- [ ] Version comparison view
- [ ] Smart save detection
- [ ] Auto-cleanup old versions
- [ ] Performance optimization
- [ ] Migration for existing data

### Phase 4: Polish & Testing (Week 4)
- [ ] User testing
- [ ] Performance monitoring
- [ ] Documentation
- [ ] Error handling
- [ ] Final optimizations

## Configuration

```javascript
// Default configuration
const VERSION_CONFIG = {
  maxVersionsPerItem: 10,
  autoSaveEnabled: true,
  autoSaveDelay: 300000, // 5 minutes
  significantChangeThreshold: 0.1, // 10% content change
  minTimeBetweenVersions: 30000, // 30 seconds
  compressVersions: true,
  cleanupOnStartup: true
}
```

## Migration Strategy

### For Existing Data
1. On first load after update:
   - Create initial version for all existing items
   - Mark as "imported" trigger type
   - Set version number to 1

### Rollout Plan
1. Feature flag: `enableVersionControl`
2. Gradual rollout to test with subset
3. Monitor storage usage
4. Full rollout after validation

## Performance Considerations

### Optimizations
- Debounced version creation
- Lazy load version history
- Compress old versions
- Background cleanup
- Virtual scrolling for long history

### Storage Limits
- Monitor localStorage usage
- Warn at 80% capacity
- Auto-cleanup oldest versions if needed
- Option to export version history

## Success Metrics
- Version creation < 100ms
- History modal load < 200ms  
- Rollback operation < 500ms
- Storage per item < 50KB
- Zero data loss incidents

## Future Enhancements
- Named checkpoints
- Version branching
- Collaborative versioning
- Cloud backup integration
- Diff visualization
- Batch operations