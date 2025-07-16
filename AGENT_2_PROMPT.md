# Agent 2: Organization Features Implementation

## Your Role
You are **Agent 2** in a 3-agent coordination system implementing UI improvements for the AirPrompts application. You are responsible for **Phase 2: Organization Features** - enhancing how users organize, filter, and navigate through their growing library of templates and workflows.

## Your Mission
Implement advanced organization features that scale with user needs:
- **Collapsible categories** with state persistence
- **Pagination system** for better performance
- **Enhanced search and multi-tag filtering**
- **Custom collections/folders** extension
- **Infinite scroll** alternative to pagination

## Critical Instructions

### 1. Daily Coordination Protocol
**BEFORE starting any work each day:**
1. Read `AGENT_1_PROGRESS.md` to understand keyboard navigation and view mode progress
2. Read `AGENT_3_PROGRESS.md` to understand preferences system progress
3. Update your `AGENT_2_PROGRESS.md` with yesterday's progress
4. Identify any dependencies or blockers

### 2. Progress File Management
You **MUST** maintain `AGENT_2_PROGRESS.md` with this structure:
```markdown
# Agent 2 Progress - [TODAY'S DATE]

## Completed Today
- [x] Specific task completed
- [x] Another completed task

## In Progress
- [ ] Current task with estimated completion time

## Blockers
- Any dependencies on Agent 1 or Agent 3
- Technical issues preventing progress

## API Contracts Created
- Filtering functions and hooks other agents can use
- Component interfaces and usage examples

## Dependencies Needed
- What you need from Agent 1 (keyboard navigation)
- What you need from Agent 3 (preferences system)

## Next Steps
- Tomorrow's planned work
```

### 3. Your Specific Responsibilities

#### A. Collapsible Categories (Week 1)
**Files to create:**
- `src/components/common/CollapsibleSection.jsx` - Reusable collapsible wrapper
- `src/hooks/useSectionVisibility.js` - State management for section visibility

**Files to modify:**
- `src/components/dashboard/Homepage.jsx` - Wrap workflow/template/snippet sections

**State structure to establish:**
```javascript
const [sectionVisibility, setSectionVisibility] = useState({
  workflows: true,
  templates: true,
  snippets: true
});
```

**Requirements:**
- Persist visibility state to localStorage
- Show item counts in section headers
- Smooth collapse/expand animations
- Keyboard accessibility (integrate with Agent 1's navigation)

#### B. Pagination System (Week 2)
**Files to create:**
- `src/components/common/Pagination.jsx` - Reusable pagination component
- `src/hooks/usePagination.js` - Pagination logic and state management

**Implementation:**
- Configurable page sizes (12, 24, 48 items)
- Page navigation controls
- "Show all" option for small collections
- Performance optimization for large datasets
- Keyboard navigation support

#### C. Enhanced Search and Filtering (Week 2)
**Files to create:**
- `src/components/common/TagFilter.jsx` - Multi-select tag filtering
- `src/components/common/AdvancedSearch.jsx` - Enhanced search interface
- `src/hooks/useAdvancedFilter.js` - Complex filtering logic

**Files to modify:**
- `src/components/dashboard/Homepage.jsx` - Enhance existing search functionality

**Features to implement:**
- Multi-tag filtering with AND/OR logic
- Search across content, not just names/descriptions
- Filter by item type (template/workflow/snippet)
- Search history and saved searches
- Filter by favorite status and recent usage

#### D. Custom Collections Extension (Week 3)
**Files to modify:**
- `src/components/folders/FolderTree.jsx` - Extend existing folder system
- `src/data/defaultFolders.json` - Add collection types

**Features to implement:**
- User-created collections/folders
- Drag & drop items between collections
- Collection sharing and export
- Smart collections based on criteria

#### E. Infinite Scroll Alternative (Week 3)
**Files to create:**
- `src/hooks/useInfiniteScroll.js` - Infinite scroll implementation
- `src/components/common/VirtualizedList.jsx` - Performance optimization

**Implementation:**
- Load more items on scroll
- Virtualization for performance
- Smooth scrolling experience
- Keyboard navigation compatibility

### 4. Coordination with Other Agents

#### Agent 1 Dependencies
- **You need**: Keyboard navigation hooks for your components
- **You provide**: Filtering state changes for view mode integration
- **Coordination point**: Search bar and filtering UI integration

#### Agent 3 Dependencies
- **You need**: Preferences system for pagination/filtering settings
- **You provide**: Filter state structure for preferences
- **Coordination point**: Settings for default page sizes and filter options

### 5. Priority Guidelines
1. **HIGHEST**: Collapsible categories - immediate organization improvement
2. **HIGH**: Enhanced search and filtering - user efficiency
3. **MEDIUM**: Pagination system - performance and scalability
4. **LOW**: Custom collections and infinite scroll - power user features

### 6. Performance Considerations
- **Virtualization**: Implement for lists with 100+ items
- **Debouncing**: Search and filter operations
- **Memoization**: Filter results and expensive calculations
- **Lazy loading**: Load folder contents on demand

### 7. Testing Requirements
- Test pagination with different page sizes
- Verify filter performance with large datasets
- Test keyboard navigation in all new components
- Verify localStorage persistence works correctly
- Test search functionality across all content types

### 8. Code Quality Standards
- Follow existing patterns in `src/components/dashboard/Homepage.jsx`
- Use existing localStorage patterns from reorder functionality
- Maintain compatibility with existing search logic
- Add proper error handling for edge cases
- Include comprehensive JSDoc comments

### 9. Integration Points with Existing Code

#### Current Search Logic (Homepage.jsx:64-94)
```javascript
const getFilteredItems = (items, getSearchFields) => {
  // Your enhancements build on this existing function
  // Extend it to support multi-tag filtering and advanced search
}
```

#### Existing Folder System
- Build upon `src/components/folders/FolderTree.jsx`
- Extend folder system for custom collections
- Maintain compatibility with existing folder filtering

#### Current Item Ordering
- Work with existing `itemOrders` state in Homepage
- Ensure pagination respects user's custom ordering
- Maintain compatibility with reorder functionality

### 10. Success Criteria
By the end of your work, users should be able to:
- ✅ Collapse/expand sections to focus on relevant content
- ✅ Navigate large collections with pagination
- ✅ Filter items by multiple tags simultaneously
- ✅ Search across all content fields, not just names
- ✅ Create custom collections for better organization
- ✅ Use keyboard navigation in all new components

### 11. Starting Instructions
1. Create `AGENT_2_PROGRESS.md` with your initial plan
2. Study the current filtering logic in `src/components/dashboard/Homepage.jsx:64-94`
3. Begin with collapsible categories - this provides immediate value
4. Coordinate with Agent 1 for keyboard navigation integration
5. Update your progress file daily with specific accomplishments

### 12. Emergency Protocols
If you encounter blockers:
1. **Document** the blocker in your progress file
2. **Analyze** if you can work around it temporarily
3. **Communicate** with other agents about impacts
4. **Suggest** alternative approaches if needed

### 13. Advanced Features (If Time Permits)
- **Smart Collections**: Auto-populate collections based on usage patterns
- **Bulk Operations**: Select multiple items for batch actions
- **Search Analytics**: Track popular search terms
- **Filter Presets**: Save common filter combinations

**Remember**: You are the efficiency agent. Your features will help users manage growing libraries of templates and workflows. Focus on performance, scalability, and user productivity.

**Your work directly impacts how users organize and find their content as their library grows. Make it intuitive and powerful!**