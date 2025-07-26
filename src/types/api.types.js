/**
 * API Type Definitions
 * 
 * Complete TypeScript-like JSDoc definitions for all API contracts
 * These types define the shape of data used throughout the application
 */

/**
 * @typedef {Object} BaseEntity
 * @property {string} id - Unique identifier (UUID v4)
 * @property {string} name - Display name (max 100 chars)
 * @property {string} [description] - Optional description (max 500 chars)
 * @property {boolean} favorite - Whether the item is marked as favorite
 * @property {string} createdAt - ISO 8601 timestamp
 * @property {string} updatedAt - ISO 8601 timestamp
 * @property {Object} [metadata] - Optional metadata object
 */

/**
 * @typedef {Object} Template
 * @extends BaseEntity
 * @property {'template'} type - Entity type identifier
 * @property {string} content - Template content with {variable} placeholders (max 10000 chars)
 * @property {string[]} variables - Array of variable names extracted from content
 * @property {TemplateCategory} category - Template category
 * @property {string[]} [tags] - Optional array of tags for searching
 * @property {number} usageCount - Number of times template has been used
 * @property {string} [lastUsedAt] - ISO 8601 timestamp of last usage
 * @property {string[]} [folderIds] - Array of folder IDs this template belongs to
 * @property {TemplateSettings} [settings] - Template-specific settings
 */

/**
 * @typedef {Object} TemplateSettings
 * @property {boolean} [autoCapitalize] - Whether to auto-capitalize variable values
 * @property {boolean} [trimWhitespace] - Whether to trim whitespace from variables
 * @property {Object.<string, string>} [defaultValues] - Default values for variables
 * @property {Object.<string, VariableValidation>} [validations] - Validation rules for variables
 */

/**
 * @typedef {Object} VariableValidation
 * @property {string} [pattern] - Regex pattern for validation
 * @property {number} [minLength] - Minimum length
 * @property {number} [maxLength] - Maximum length
 * @property {boolean} [required] - Whether the variable is required
 * @property {string} [message] - Custom validation error message
 */

/**
 * @typedef {'general'|'business'|'technical'|'creative'|'personal'|'education'|'marketing'|'other'} TemplateCategory
 */

/**
 * @typedef {Object} Workflow
 * @extends BaseEntity
 * @property {'workflow'} type - Entity type identifier
 * @property {WorkflowStep[]} steps - Ordered array of workflow steps
 * @property {WorkflowCategory} category - Workflow category
 * @property {string[]} [tags] - Optional array of tags
 * @property {number} totalSteps - Total number of steps
 * @property {number} estimatedDuration - Estimated duration in minutes
 * @property {WorkflowSettings} [settings] - Workflow-specific settings
 * @property {string[]} [folderIds] - Array of folder IDs this workflow belongs to
 */

/**
 * @typedef {Object} WorkflowStep
 * @property {string} id - Step unique identifier
 * @property {string} templateId - Reference to template ID
 * @property {number} order - Step order (0-based)
 * @property {string} [name] - Optional custom step name
 * @property {string} [description] - Optional step description
 * @property {Object.<string, string>} [variableMappings] - Maps template variables to workflow variables or previous outputs
 * @property {StepCondition} [condition] - Optional condition for step execution
 * @property {boolean} [optional] - Whether this step is optional
 */

/**
 * @typedef {Object} StepCondition
 * @property {'contains'|'equals'|'exists'|'custom'} type - Condition type
 * @property {string} variable - Variable to check
 * @property {string} [value] - Value to compare against
 * @property {string} [expression] - Custom JavaScript expression (for 'custom' type)
 */

/**
 * @typedef {Object} WorkflowSettings
 * @property {boolean} [stopOnError] - Whether to stop workflow on error
 * @property {boolean} [saveIntermediateResults] - Whether to save results after each step
 * @property {number} [maxRetries] - Maximum retries for failed steps
 * @property {number} [retryDelay] - Delay between retries in seconds
 */

/**
 * @typedef {'automation'|'process'|'analysis'|'generation'|'transformation'|'other'} WorkflowCategory
 */

/**
 * @typedef {Object} Snippet
 * @extends BaseEntity
 * @property {'snippet'} type - Entity type identifier
 * @property {string} content - Code snippet content (max 50000 chars)
 * @property {string} language - Programming language identifier
 * @property {SnippetCategory} category - Snippet category
 * @property {string[]} [tags] - Optional array of tags
 * @property {string[]} [folderIds] - Array of folder IDs this snippet belongs to
 * @property {SnippetMetadata} [metadata] - Additional snippet metadata
 */

/**
 * @typedef {Object} SnippetMetadata
 * @property {string} [syntax] - Syntax highlighting mode
 * @property {string[]} [dependencies] - Required dependencies/imports
 * @property {string} [version] - Language/framework version
 * @property {string} [documentation] - Link to documentation
 * @property {Object.<string, string>} [examples] - Usage examples
 */

/**
 * @typedef {'code'|'query'|'config'|'script'|'command'|'other'} SnippetCategory
 */

/**
 * @typedef {Object} Folder
 * @extends BaseEntity
 * @property {'folder'} type - Entity type identifier
 * @property {string} [parentId] - Parent folder ID (null for root folders)
 * @property {string[]} childIds - Array of child folder IDs
 * @property {string} color - Hex color code for folder
 * @property {string} [icon] - Icon identifier
 * @property {number} itemCount - Number of items in folder
 * @property {FolderSettings} [settings] - Folder-specific settings
 * @property {FolderPermissions} permissions - Folder permissions
 */

/**
 * @typedef {Object} FolderSettings
 * @property {boolean} [isExpanded] - Whether folder is expanded in UI
 * @property {SortOrder} [sortOrder] - Default sort order for items
 * @property {ViewMode} [viewMode] - Default view mode
 * @property {boolean} [showSubfolders] - Whether to show subfolders
 */

/**
 * @typedef {Object} FolderPermissions
 * @property {boolean} canEdit - Whether user can edit folder
 * @property {boolean} canDelete - Whether user can delete folder
 * @property {boolean} canShare - Whether user can share folder
 * @property {boolean} canAddItems - Whether user can add items to folder
 */

/**
 * @typedef {Object} SortOrder
 * @property {'name'|'created'|'updated'|'usage'} field - Sort field
 * @property {'asc'|'desc'} direction - Sort direction
 */

/**
 * @typedef {'grid'|'list'|'compact'|'kanban'|'timeline'} ViewMode
 */

/**
 * @typedef {Object} ExecutionContext
 * @property {string} itemId - ID of item being executed
 * @property {'template'|'workflow'|'snippet'} itemType - Type of item
 * @property {Object.<string, any>} variables - Variable values
 * @property {string} [userId] - User ID executing the item
 * @property {string} [sessionId] - Session ID for tracking
 * @property {ExecutionMode} mode - Execution mode
 * @property {Object} [options] - Additional execution options
 */

/**
 * @typedef {'interactive'|'batch'|'api'|'test'} ExecutionMode
 */

/**
 * @typedef {Object} ExecutionResult
 * @property {string} id - Execution ID
 * @property {string} itemId - ID of executed item
 * @property {'success'|'error'|'partial'} status - Execution status
 * @property {string} output - Final output/result
 * @property {StepResult[]} [steps] - Results for each workflow step
 * @property {Object.<string, any>} variables - Final variable values
 * @property {number} duration - Execution duration in milliseconds
 * @property {string} startedAt - ISO 8601 timestamp
 * @property {string} completedAt - ISO 8601 timestamp
 * @property {ExecutionError} [error] - Error details if failed
 */

/**
 * @typedef {Object} StepResult
 * @property {string} stepId - Step ID
 * @property {string} templateId - Template ID used
 * @property {'success'|'error'|'skipped'} status - Step status
 * @property {string} output - Step output
 * @property {Object.<string, any>} variables - Variables used
 * @property {number} duration - Step duration in milliseconds
 * @property {ExecutionError} [error] - Error if step failed
 */

/**
 * @typedef {Object} ExecutionError
 * @property {string} code - Error code
 * @property {string} message - Error message
 * @property {string} [details] - Additional error details
 * @property {string} [stack] - Stack trace (development only)
 */

/**
 * @typedef {Object} SearchQuery
 * @property {string} [q] - Search query string
 * @property {('template'|'workflow'|'snippet')[]} [types] - Filter by entity types
 * @property {string[]} [categories] - Filter by categories
 * @property {string[]} [tags] - Filter by tags
 * @property {string[]} [folderIds] - Filter by folder IDs
 * @property {boolean} [favorites] - Filter favorites only
 * @property {SortOrder} [sort] - Sort order
 * @property {number} [limit] - Result limit (max 100)
 * @property {number} [offset] - Result offset for pagination
 * @property {DateRange} [dateRange] - Filter by date range
 */

/**
 * @typedef {Object} DateRange
 * @property {string} [from] - Start date (ISO 8601)
 * @property {string} [to] - End date (ISO 8601)
 * @property {'created'|'updated'|'used'} [field] - Date field to filter on
 */

/**
 * @typedef {Object} SearchResult
 * @property {(Template|Workflow|Snippet)[]} items - Array of matching items
 * @property {number} total - Total number of matches
 * @property {number} limit - Result limit used
 * @property {number} offset - Result offset used
 * @property {SearchFacets} [facets] - Search facets for filtering
 */

/**
 * @typedef {Object} SearchFacets
 * @property {Object.<string, number>} types - Count by type
 * @property {Object.<string, number>} categories - Count by category
 * @property {Object.<string, number>} tags - Count by tag
 * @property {Object.<string, number>} folders - Count by folder
 */

/**
 * @typedef {Object} ImportData
 * @property {Template[]} [templates] - Templates to import
 * @property {Workflow[]} [workflows] - Workflows to import
 * @property {Snippet[]} [snippets] - Snippets to import
 * @property {Folder[]} [folders] - Folders to import
 * @property {ImportOptions} [options] - Import options
 */

/**
 * @typedef {Object} ImportOptions
 * @property {'skip'|'replace'|'rename'} duplicateStrategy - How to handle duplicates
 * @property {boolean} [preserveIds] - Whether to preserve original IDs
 * @property {boolean} [preserveDates] - Whether to preserve original dates
 * @property {boolean} [dryRun] - Whether to perform a dry run
 */

/**
 * @typedef {Object} ImportResult
 * @property {'success'|'partial'|'error'} status - Import status
 * @property {ImportStats} stats - Import statistics
 * @property {ImportError[]} [errors] - Array of import errors
 * @property {Object.<string, string>} [idMapping] - Maps old IDs to new IDs
 */

/**
 * @typedef {Object} ImportStats
 * @property {number} templatesImported - Number of templates imported
 * @property {number} workflowsImported - Number of workflows imported
 * @property {number} snippetsImported - Number of snippets imported
 * @property {number} foldersImported - Number of folders imported
 * @property {number} skipped - Number of items skipped
 * @property {number} replaced - Number of items replaced
 * @property {number} errors - Number of errors
 */

/**
 * @typedef {Object} ImportError
 * @property {string} itemId - ID of item that failed
 * @property {'template'|'workflow'|'snippet'|'folder'} itemType - Type of item
 * @property {string} message - Error message
 * @property {string} [code] - Error code
 */

/**
 * @typedef {Object} ExportOptions
 * @property {('template'|'workflow'|'snippet'|'folder')[]} [types] - Types to export
 * @property {string[]} [ids] - Specific IDs to export
 * @property {string[]} [folderIds] - Export items from specific folders
 * @property {boolean} [includeFolders] - Whether to include folder structure
 * @property {'json'|'yaml'|'csv'} [format] - Export format
 */

/**
 * @typedef {Object} UserPreferences
 * @property {ViewMode} defaultView - Default view mode
 * @property {Theme} theme - UI theme
 * @property {boolean} sidebarCollapsed - Whether sidebar is collapsed
 * @property {string[]} recentFolders - Recently accessed folder IDs
 * @property {string[]} pinnedItems - Pinned item IDs
 * @property {NotificationSettings} notifications - Notification preferences
 * @property {KeyboardShortcuts} shortcuts - Custom keyboard shortcuts
 * @property {Object.<string, any>} [custom] - Custom preferences
 */

/**
 * @typedef {'light'|'dark'|'system'} Theme
 */

/**
 * @typedef {Object} NotificationSettings
 * @property {boolean} enabled - Whether notifications are enabled
 * @property {boolean} sound - Whether to play sound
 * @property {boolean} desktop - Whether to show desktop notifications
 * @property {NotificationTypes} types - Enabled notification types
 */

/**
 * @typedef {Object} NotificationTypes
 * @property {boolean} success - Success notifications
 * @property {boolean} error - Error notifications
 * @property {boolean} info - Info notifications
 * @property {boolean} updates - Update notifications
 */

/**
 * @typedef {Object.<string, string>} KeyboardShortcuts - Maps action to key combination
 */

/**
 * @typedef {Object} APIResponse
 * @template T
 * @property {boolean} success - Whether request was successful
 * @property {T} [data] - Response data
 * @property {APIError} [error] - Error details if failed
 * @property {Object} [meta] - Additional metadata
 */

/**
 * @typedef {Object} APIError
 * @property {string} code - Error code
 * @property {string} message - Human-readable error message
 * @property {string} [field] - Field that caused the error
 * @property {Object} [details] - Additional error details
 */

/**
 * @typedef {Object} PaginatedResponse
 * @template T
 * @property {T[]} items - Array of items
 * @property {PaginationMeta} pagination - Pagination metadata
 */

/**
 * @typedef {Object} PaginationMeta
 * @property {number} total - Total number of items
 * @property {number} page - Current page (1-based)
 * @property {number} pageSize - Items per page
 * @property {number} totalPages - Total number of pages
 * @property {boolean} hasNext - Whether there is a next page
 * @property {boolean} hasPrevious - Whether there is a previous page
 */

// Export all types for use in other modules
export const APITypes = {
  BaseEntity: 'BaseEntity',
  Template: 'Template',
  Workflow: 'Workflow',
  Snippet: 'Snippet',
  Folder: 'Folder',
  ExecutionContext: 'ExecutionContext',
  ExecutionResult: 'ExecutionResult',
  SearchQuery: 'SearchQuery',
  SearchResult: 'SearchResult',
  ImportData: 'ImportData',
  ImportResult: 'ImportResult',
  ExportOptions: 'ExportOptions',
  UserPreferences: 'UserPreferences',
  APIResponse: 'APIResponse',
  PaginatedResponse: 'PaginatedResponse'
};