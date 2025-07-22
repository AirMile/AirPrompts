import { getDatabase } from '../database.js';
import { generateId } from '../utils/idGenerator.js';
import fs from 'fs';
import path from 'path';

class LocalStorageMigrator {
  constructor() {
    this.db = getDatabase();
    this.idMappings = new Map(); // old_id -> new_uuid
    this.errors = [];
    this.stats = {
      templates: { found: 0, migrated: 0, errors: 0 },
      workflows: { found: 0, migrated: 0, errors: 0 },
      folders: { found: 0, migrated: 0, errors: 0 }
    };
  }

  /**
   * Main migration function
   * @param {Object|string} localStorageData - Data from localStorage
   * @returns {Object} Migration report
   */
  async migrate(localStorageData) {
    console.log('🚀 Starting localStorage to SQLite migration...');
    
    try {
      // 1. Parse and validate input data
      const data = this.parseLocalStorageData(localStorageData);
      
      // 2. Create ID mappings for all entities
      this.createIdMappings(data);
      
      // 3. Start transaction for data consistency
      const transaction = this.db.transaction(() => {
        // Migrate folders first (dependencies)
        this.migrateFolders(data.folders);
        
        // Migrate templates
        this.migrateTemplates(data.templates);
        
        // Migrate workflows and workflow steps
        this.migrateWorkflows(data.workflows);
      });
      
      transaction();
      
      // 4. Validate migration success
      await this.validateMigration(data);
      
      console.log('✅ Migration completed successfully!');
      return this.generateReport();
      
    } catch (error) {
      console.error('❌ Migration failed:', error);
      this.errors.push(`Migration failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Preview migration without executing
   * @param {Object|string} localStorageData - Data from localStorage
   * @returns {Object} Preview information
   */
  previewMigration(localStorageData) {
    const data = this.parseLocalStorageData(localStorageData);
    
    return {
      templates: data.templates.length,
      workflows: data.workflows.length,
      folders: data.folders.length,
      totalItems: data.templates.length + data.workflows.length + data.folders.length,
      preview: {
        templates: data.templates.slice(0, 3).map(t => ({ id: t.id, name: t.name })),
        workflows: data.workflows.slice(0, 3).map(w => ({ id: w.id, name: w.name })),
        folders: data.folders.slice(0, 3).map(f => ({ id: f.id, name: f.name }))
      }
    };
  }

  /**
   * Parse localStorage data from various input formats
   * @param {Object|string} inputData - Raw localStorage data
   * @returns {Object} Parsed data structure
   */
  parseLocalStorageData(inputData) {
    let data = inputData;
    
    // Handle string input (JSON)
    if (typeof inputData === 'string') {
      try {
        data = JSON.parse(inputData);
      } catch (e) {
        throw new Error('Invalid JSON in localStorage data');
      }
    }
    
    // Handle different localStorage key structures
    const templates = data.templates || 
                     data.airprompts_templates || 
                     data['airprompts-templates'] ||
                     [];
                     
    const workflows = data.workflows || 
                     data.airprompts_workflows || 
                     data['airprompts-workflows'] ||
                     [];
                     
    const folders = data.folders || 
                   data.airprompts_folders || 
                   data['airprompts-folders'] ||
                   [];
    
    // Parse JSON strings if needed
    const parseIfString = (item) => typeof item === 'string' ? JSON.parse(item) : item;
    
    return {
      templates: Array.isArray(templates) ? templates.map(parseIfString) : [],
      workflows: Array.isArray(workflows) ? workflows.map(parseIfString) : [],
      folders: Array.isArray(folders) ? folders.map(parseIfString) : []
    };
  }

  /**
   * Create ID mappings from old IDs to new UUIDs
   * @param {Object} data - Parsed localStorage data
   */
  createIdMappings(data) {
    const allEntities = [...data.templates, ...data.workflows, ...data.folders];
    
    allEntities.forEach(entity => {
      if (entity && entity.id) {
        this.idMappings.set(entity.id, generateId());
      }
    });
    
    console.log(`📝 Created ${this.idMappings.size} ID mappings`);
  }

  /**
   * Migrate folders to database
   * @param {Array} folders - Array of folder objects
   */
  migrateFolders(folders) {
    if (!folders || !folders.length) {
      console.log('📁 No folders to migrate');
      return;
    }

    this.stats.folders.found = folders.length;

    const stmt = this.db.prepare(`
      INSERT INTO folders (
        id, name, description, parent_id, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?)
    `);

    for (const folder of folders) {
      try {
        if (!folder || !folder.id) {
          this.stats.folders.errors++;
          continue;
        }

        const newId = this.idMappings.get(folder.id);
        const parentId = folder.parentId ? this.idMappings.get(folder.parentId) : null;
        
        stmt.run([
          newId,
          folder.name || 'Unnamed Folder',
          folder.description || '',
          parentId,
          folder.createdAt || new Date().toISOString(),
          folder.updatedAt || new Date().toISOString()
        ]);
        
        this.stats.folders.migrated++;
      } catch (error) {
        this.errors.push(`Folder ${folder.id}: ${error.message}`);
        this.stats.folders.errors++;
      }
    }

    console.log(`📁 Migrated ${this.stats.folders.migrated}/${this.stats.folders.found} folders`);
  }

  /**
   * Migrate templates to database
   * @param {Array} templates - Array of template objects
   */
  migrateTemplates(templates) {
    if (!templates || !templates.length) {
      console.log('📄 No templates to migrate');
      return;
    }

    this.stats.templates.found = templates.length;

    const stmt = this.db.prepare(`
      INSERT INTO templates (
        id, name, description, content, category, favorite, 
        folder_id, variables, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const template of templates) {
      try {
        if (!template || !template.id || !template.content) {
          this.stats.templates.errors++;
          continue;
        }

        const newId = this.idMappings.get(template.id);
        const folderId = template.folderId ? this.idMappings.get(template.folderId) : null;
        
        stmt.run([
          newId,
          template.name || 'Unnamed Template',
          template.description || '',
          template.content,
          template.category || 'general',
          template.favorite || false,
          folderId,
          JSON.stringify(template.variables || []),
          template.createdAt || new Date().toISOString(),
          template.updatedAt || new Date().toISOString()
        ]);
        
        this.stats.templates.migrated++;
      } catch (error) {
        this.errors.push(`Template ${template.id}: ${error.message}`);
        this.stats.templates.errors++;
      }
    }

    console.log(`📄 Migrated ${this.stats.templates.migrated}/${this.stats.templates.found} templates`);
  }

  /**
   * Migrate workflows and their steps to database
   * @param {Array} workflows - Array of workflow objects
   */
  migrateWorkflows(workflows) {
    if (!workflows || !workflows.length) {
      console.log('⚡ No workflows to migrate');
      return;
    }

    this.stats.workflows.found = workflows.length;

    // Migrate workflows
    const workflowStmt = this.db.prepare(`
      INSERT INTO workflows (
        id, name, description, category, favorite, folder_id, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // Migrate workflow steps
    const stepStmt = this.db.prepare(`
      INSERT INTO workflow_steps (
        id, workflow_id, template_id, step_order, created_at
      ) VALUES (?, ?, ?, ?, ?)
    `);

    for (const workflow of workflows) {
      try {
        if (!workflow || !workflow.id) {
          this.stats.workflows.errors++;
          continue;
        }

        const newWorkflowId = this.idMappings.get(workflow.id);
        const folderId = workflow.folderId ? this.idMappings.get(workflow.folderId) : null;

        // Insert workflow
        workflowStmt.run([
          newWorkflowId,
          workflow.name || 'Unnamed Workflow',
          workflow.description || '',
          workflow.category || 'general',
          workflow.favorite || false,
          folderId,
          workflow.createdAt || new Date().toISOString(),
          workflow.updatedAt || new Date().toISOString()
        ]);

        // Insert workflow steps
        if (workflow.steps && workflow.steps.length > 0) {
          for (let i = 0; i < workflow.steps.length; i++) {
            const step = workflow.steps[i];
            const templateId = this.idMappings.get(step.templateId);
            
            if (templateId) {
              stepStmt.run([
                generateId(),
                newWorkflowId,
                templateId,
                step.order || i + 1,
                new Date().toISOString()
              ]);
            }
          }
        }
        
        this.stats.workflows.migrated++;
      } catch (error) {
        this.errors.push(`Workflow ${workflow.id}: ${error.message}`);
        this.stats.workflows.errors++;
      }
    }

    console.log(`⚡ Migrated ${this.stats.workflows.migrated}/${this.stats.workflows.found} workflows`);
  }

  /**
   * Validate migration results
   * @param {Object} originalData - Original localStorage data
   */
  async validateMigration(originalData) {
    console.log('🔍 Validating migration...');

    // Compare counts
    const dbCounts = {
      templates: this.db.prepare('SELECT COUNT(*) as count FROM templates').get().count,
      workflows: this.db.prepare('SELECT COUNT(*) as count FROM workflows').get().count,
      folders: this.db.prepare('SELECT COUNT(*) as count FROM folders').get().count
    };

    const originalCounts = {
      templates: originalData.templates.length,
      workflows: originalData.workflows.length,
      folders: originalData.folders.length
    };

    // Verify counts match (allowing for error tolerance)
    Object.keys(dbCounts).forEach(type => {
      const expected = this.stats[type].migrated;
      const actual = dbCounts[type];
      
      if (actual !== expected) {
        throw new Error(`${type} count mismatch: expected ${expected}, got ${actual}`);
      }
    });

    // Verify relationships exist
    const orphanedTemplates = this.db.prepare(`
      SELECT COUNT(*) as count 
      FROM templates t 
      WHERE t.folder_id IS NOT NULL 
      AND NOT EXISTS (SELECT 1 FROM folders f WHERE f.id = t.folder_id)
    `).get().count;

    if (orphanedTemplates > 0) {
      console.warn(`⚠️  ${orphanedTemplates} templates reference non-existent folders`);
    }

    console.log('✅ Migration validation completed');
  }

  /**
   * Generate comprehensive migration report
   * @returns {Object} Migration report
   */
  generateReport() {
    const totalFound = this.stats.templates.found + this.stats.workflows.found + this.stats.folders.found;
    const totalMigrated = this.stats.templates.migrated + this.stats.workflows.migrated + this.stats.folders.migrated;
    const totalErrors = this.stats.templates.errors + this.stats.workflows.errors + this.stats.folders.errors;

    return {
      success: totalErrors === 0,
      summary: {
        totalFound,
        totalMigrated,
        totalErrors,
        successRate: totalFound > 0 ? ((totalMigrated / totalFound) * 100).toFixed(1) : 100
      },
      stats: this.stats,
      errors: this.errors,
      idMappings: Object.fromEntries(this.idMappings),
      timestamp: new Date().toISOString()
    };
  }
}

export default LocalStorageMigrator;