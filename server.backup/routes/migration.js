import express from 'express';

const router = express.Router();

// POST /api/migrate/from-localstorage - Migrate data from localStorage
router.post('/from-localstorage', (req, res) => {
  try {
    const { templates, workflows, folders, snippets } = req.body;
    const db = req.db;
    
    if (!templates && !workflows && !folders && !snippets) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'NO_DATA',
          message: 'No data provided for migration'
        },
        meta: {
          timestamp: new Date().toISOString(),
          version: '1.0'
        }
      });
    }
    
    const migrationResults = {
      templates: { imported: 0, errors: [] },
      workflows: { imported: 0, errors: [] },
      folders: { imported: 0, errors: [] },
      snippets: { imported: 0, errors: [] }
    };
    
    // Start transaction for atomic migration
    const transaction = db.transaction(() => {
      // Migrate folders first (they may be referenced by templates/workflows)
      if (folders && Array.isArray(folders)) {
        const folderStmt = db.prepare(`
          INSERT OR IGNORE INTO folders (id, name, description, parent_id, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?)
        `);
        
        folders.forEach(folder => {
          try {
            const now = new Date().toISOString();
            folderStmt.run(
              folder.id,
              folder.name,
              folder.description || null,
              folder.parent_id || null,
              folder.created_at || now,
              folder.updated_at || now
            );
            migrationResults.folders.imported++;
          } catch (error) {
            migrationResults.folders.errors.push({
              id: folder.id,
              error: error.message
            });
          }
        });
      }
      
      // Migrate templates
      if (templates && Array.isArray(templates)) {
        const templateStmt = db.prepare(`
          INSERT OR IGNORE INTO templates (id, name, description, content, category, variables, favorite, folder_id, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        
        templates.forEach(template => {
          try {
            const now = new Date().toISOString();
            const variables = template.variables || [];
            
            templateStmt.run(
              template.id,
              template.name,
              template.description || null,
              template.content,
              template.category,
              JSON.stringify(variables),
              template.favorite || false,
              template.folder_id || null,
              template.created_at || now,
              template.updated_at || now
            );
            migrationResults.templates.imported++;
          } catch (error) {
            migrationResults.templates.errors.push({
              id: template.id,
              error: error.message
            });
          }
        });
      }
      
      // Migrate workflows
      if (workflows && Array.isArray(workflows)) {
        const workflowStmt = db.prepare(`
          INSERT OR IGNORE INTO workflows (id, name, description, category, favorite, folder_id, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);
        
        const stepStmt = db.prepare(`
          INSERT OR IGNORE INTO workflow_steps (id, workflow_id, template_id, step_order, created_at)
          VALUES (?, ?, ?, ?, ?)
        `);
        
        workflows.forEach(workflow => {
          try {
            const now = new Date().toISOString();
            
            // Insert workflow
            workflowStmt.run(
              workflow.id,
              workflow.name,
              workflow.description || null,
              workflow.category,
              workflow.favorite || false,
              workflow.folder_id || null,
              workflow.created_at || now,
              workflow.updated_at || now
            );
            
            // Insert workflow steps
            if (workflow.steps && Array.isArray(workflow.steps)) {
              workflow.steps.forEach((templateId, index) => {
                const stepId = `${workflow.id}-step-${index + 1}`;
                stepStmt.run(stepId, workflow.id, templateId, index + 1, now);
              });
            }
            
            migrationResults.workflows.imported++;
          } catch (error) {
            migrationResults.workflows.errors.push({
              id: workflow.id,
              error: error.message
            });
          }
        });
      }
      
      // Migrate snippets
      if (snippets && Array.isArray(snippets)) {
        const snippetStmt = db.prepare(`
          INSERT OR IGNORE INTO snippets (id, name, content, category, tags, favorite, folder_id, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        
        snippets.forEach(snippet => {
          try {
            const now = new Date().toISOString();
            const tags = snippet.tags || [];
            
            snippetStmt.run(
              snippet.id,
              snippet.name,
              snippet.content,
              snippet.category,
              JSON.stringify(tags),
              snippet.favorite || false,
              snippet.folder_id || null,
              snippet.created_at || now,
              snippet.updated_at || now
            );
            migrationResults.snippets.imported++;
          } catch (error) {
            migrationResults.snippets.errors.push({
              id: snippet.id,
              error: error.message
            });
          }
        });
      }
    });
    
    transaction();
    
    const totalImported = migrationResults.templates.imported + 
                         migrationResults.workflows.imported + 
                         migrationResults.folders.imported +
                         migrationResults.snippets.imported;
    const totalErrors = migrationResults.templates.errors.length + 
                       migrationResults.workflows.errors.length + 
                       migrationResults.folders.errors.length +
                       migrationResults.snippets.errors.length;
    
    res.json({
      success: true,
      data: {
        message: `Migration completed. ${totalImported} items imported, ${totalErrors} errors.`,
        results: migrationResults,
        summary: {
          total_imported: totalImported,
          total_errors: totalErrors
        }
      },
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0'
      }
    });
    
  } catch (error) {
    console.error('Migration error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'MIGRATION_ERROR',
        message: 'Failed to migrate data from localStorage'
      },
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0'
      }
    });
  }
});

// GET /api/migrate/status - Get migration status and database stats
router.get('/status', (req, res) => {
  try {
    const db = req.db;
    
    const stats = {
      templates: db.prepare('SELECT COUNT(*) as count FROM templates').get().count,
      workflows: db.prepare('SELECT COUNT(*) as count FROM workflows').get().count,
      folders: db.prepare('SELECT COUNT(*) as count FROM folders').get().count,
      snippets: db.prepare('SELECT COUNT(*) as count FROM snippets').get().count,
      workflow_steps: db.prepare('SELECT COUNT(*) as count FROM workflow_steps').get().count
    };
    
    // Get recent items to show activity
    const recentTemplates = db.prepare(`
      SELECT id, name, created_at 
      FROM templates 
      ORDER BY created_at DESC 
      LIMIT 5
    `).all();
    
    const recentWorkflows = db.prepare(`
      SELECT id, name, created_at 
      FROM workflows 
      ORDER BY created_at DESC 
      LIMIT 5
    `).all();
    
    res.json({
      success: true,
      data: {
        database_stats: stats,
        recent_activity: {
          templates: recentTemplates,
          workflows: recentWorkflows
        },
        database_health: 'operational'
      },
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0'
      }
    });
    
  } catch (error) {
    console.error('Status check error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'STATUS_ERROR',
        message: 'Failed to get migration status'
      },
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0'
      }
    });
  }
});

// POST /api/migrate/backup - Create backup of current data
router.post('/backup', (req, res) => {
  try {
    const db = req.db;
    
    // Export all data
    const templates = db.prepare('SELECT * FROM templates').all();
    const workflows = db.prepare('SELECT * FROM workflows').all();
    const folders = db.prepare('SELECT * FROM folders').all();
    const snippets = db.prepare('SELECT * FROM snippets').all();
    const workflowSteps = db.prepare('SELECT * FROM workflow_steps').all();
    
    // Parse template variables back to arrays
    const processedTemplates = templates.map(template => ({
      ...template,
      variables: template.variables ? JSON.parse(template.variables) : [],
      favorite: Boolean(template.favorite)
    }));
    
    // Parse snippet tags back to arrays  
    const processedSnippets = snippets.map(snippet => ({
      ...snippet,
      tags: snippet.tags ? JSON.parse(snippet.tags) : [],
      favorite: Boolean(snippet.favorite)
    }));
    
    // Add steps to workflows
    const processedWorkflows = workflows.map(workflow => {
      const steps = workflowSteps
        .filter(step => step.workflow_id === workflow.id)
        .sort((a, b) => a.step_order - b.step_order)
        .map(step => step.template_id);
      
      return {
        ...workflow,
        steps,
        favorite: Boolean(workflow.favorite)
      };
    });
    
    const backup = {
      timestamp: new Date().toISOString(),
      version: '1.0',
      data: {
        templates: processedTemplates,
        workflows: processedWorkflows,
        folders: folders,
        snippets: processedSnippets,
        workflow_steps: workflowSteps
      },
      stats: {
        templates_count: templates.length,
        workflows_count: workflows.length,
        folders_count: folders.length,
        snippets_count: snippets.length,
        workflow_steps_count: workflowSteps.length
      }
    };
    
    res.json({
      success: true,
      data: backup,
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0'
      }
    });
    
  } catch (error) {
    console.error('Backup error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'BACKUP_ERROR',
        message: 'Failed to create backup'
      },
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0'
      }
    });
  }
});

export default router;