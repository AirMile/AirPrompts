import express from 'express';
import Joi from 'joi';
import { randomUUID } from 'crypto';
import { getDatabase } from '../database.js';

const router = express.Router();

// Validation schemas
const workflowSchema = Joi.object({
  name: Joi.string().min(1).max(255).required(),
  description: Joi.string().allow('').max(1000),
  category: Joi.string().min(1).max(100).required(),
  favorite: Joi.boolean().default(false),
  folder_id: Joi.string().allow(null),
  folderIds: Joi.array().items(Joi.string()).min(1),
  steps: Joi.array().items(Joi.string()).min(1).required()
});

const updateWorkflowSchema = workflowSchema.fork(['name', 'category', 'steps'], (schema) => schema.optional());

// GET /api/workflows - Get all workflows
router.get('/', (req, res) => {
  try {
    const db = getDatabase();
    const { category, favorite, folder_id, limit, offset } = req.query;
    
    let query = `
      SELECT DISTINCT w.* 
      FROM workflows w 
      LEFT JOIN item_folders if ON if.item_type = 'workflow' AND if.item_id = w.id
      WHERE 1=1
    `;
    const params = [];
    
    if (category) {
      query += ` AND w.category = ?`;
      params.push(category);
    }
    
    if (favorite !== undefined) {
      query += ` AND w.favorite = ?`;
      params.push(favorite === 'true');
    }
    
    if (folder_id) {
      query += ` AND (if.folder_id = ? OR w.folder_id = ?)`;
      params.push(folder_id, folder_id);
    }
    
    query += ` ORDER BY w.updated_at DESC`;
    
    if (limit) {
      query += ` LIMIT ?`;
      params.push(parseInt(limit));
      
      if (offset) {
        query += ` OFFSET ?`;
        params.push(parseInt(offset));
      }
    }
    
    const stmt = db.prepare(query);
    const workflows = stmt.all(params);
    
    // Get steps for each workflow
    const stepStmt = db.prepare(`
      SELECT ws.template_id, ws.step_order, t.name as template_name 
      FROM workflow_steps ws
      JOIN templates t ON ws.template_id = t.id
      WHERE ws.workflow_id = ?
      ORDER BY ws.step_order
    `);
    
    // Get folder favorites for all workflows
    const workflowIds = workflows.map(w => w.id);
    const folderFavoritesData = {};
    
    if (workflowIds.length > 0) {
      const favoritesQuery = `
        SELECT entity_id, folder_id, favorite_order 
        FROM folder_favorites 
        WHERE entity_type = 'workflow' 
        AND entity_id IN (${workflowIds.map(() => '?').join(',')})
      `;
      const favoritesStmt = db.prepare(favoritesQuery);
      const favorites = favoritesStmt.all(workflowIds);
      
      // Group favorites by entity_id
      favorites.forEach(fav => {
        if (!folderFavoritesData[fav.entity_id]) {
          folderFavoritesData[fav.entity_id] = {};
        }
        folderFavoritesData[fav.entity_id][fav.folder_id] = {
          isFavorite: true,
          favoriteOrder: fav.favorite_order
        };
      });
    }
    
    // Get folder associations for each workflow
    const folderStmt = db.prepare(`
      SELECT folder_id, f.name as folder_name 
      FROM item_folders if
      LEFT JOIN folders f ON if.folder_id = f.id
      WHERE if.item_type = 'workflow' AND if.item_id = ?
    `);
    
    const processedWorkflows = workflows.map(workflow => {
      const steps = stepStmt.all(workflow.id);
      const folders = folderStmt.all(workflow.id);
      
      return {
        ...workflow,
        steps: steps.map(step => step.template_id),
        step_details: steps,
        favorite: Boolean(workflow.favorite),
        folderFavorites: folderFavoritesData[workflow.id] || {},
        folderIds: folders.map(f => f.folder_id),
        folderNames: folders.map(f => f.folder_name),
        // Keep backward compatibility
        folder_id: folders.length > 0 ? folders[0].folder_id : workflow.folder_id,
        folder_name: folders.length > 0 ? folders[0].folder_name : null
      };
    });
    
    res.json({
      success: true,
      data: processedWorkflows,
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0'
      }
    });
    
  } catch (error) {
    console.error('Error fetching workflows:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_ERROR',
        message: 'Failed to fetch workflows'
      },
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0'
      }
    });
  }
});

// GET /api/workflows/:id - Get single workflow
router.get('/:id', (req, res) => {
  try {
    const db = getDatabase();
    const { id } = req.params;
    
    const stmt = db.prepare(`
      SELECT w.* 
      FROM workflows w 
      WHERE w.id = ?
    `);
    const workflow = stmt.get(id);
    
    if (!workflow) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Workflow not found'
        },
        meta: {
          timestamp: new Date().toISOString(),
          version: '1.0'
        }
      });
    }
    
    // Get workflow steps
    const stepStmt = db.prepare(`
      SELECT ws.template_id, ws.step_order, t.name as template_name, t.description as template_description
      FROM workflow_steps ws
      JOIN templates t ON ws.template_id = t.id
      WHERE ws.workflow_id = ?
      ORDER BY ws.step_order
    `);
    const steps = stepStmt.all(id);
    
    // Get folder favorites for this workflow
    const favoritesStmt = db.prepare(`
      SELECT folder_id, favorite_order 
      FROM folder_favorites 
      WHERE entity_type = 'workflow' AND entity_id = ?
    `);
    const favorites = favoritesStmt.all(id);
    
    // Build folderFavorites object
    const folderFavorites = {};
    favorites.forEach(fav => {
      folderFavorites[fav.folder_id] = {
        isFavorite: true,
        favoriteOrder: fav.favorite_order
      };
    });
    
    // Get folder associations
    const folderStmt = db.prepare(`
      SELECT folder_id, f.name as folder_name 
      FROM item_folders if
      LEFT JOIN folders f ON if.folder_id = f.id
      WHERE if.item_type = 'workflow' AND if.item_id = ?
    `);
    const folders = folderStmt.all(id);
    
    workflow.steps = steps.map(step => step.template_id);
    workflow.step_details = steps;
    workflow.favorite = Boolean(workflow.favorite);
    workflow.folderFavorites = folderFavorites;
    workflow.folderIds = folders.map(f => f.folder_id);
    workflow.folderNames = folders.map(f => f.folder_name);
    // Keep backward compatibility
    if (folders.length > 0) {
      workflow.folder_id = folders[0].folder_id;
      workflow.folder_name = folders[0].folder_name;
    }
    
    res.json({
      success: true,
      data: workflow,
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0'
      }
    });
    
  } catch (error) {
    console.error('Error fetching workflow:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_ERROR',
        message: 'Failed to fetch workflow'
      },
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0'
      }
    });
  }
});

// POST /api/workflows - Create new workflow
router.post('/', (req, res) => {
  try {
    const { error, value } = workflowSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: error.details[0].message
        },
        meta: {
          timestamp: new Date().toISOString(),
          version: '1.0'
        }
      });
    }
    
    const db = req.db;
    const id = randomUUID();
    const now = new Date().toISOString();
    
    // Verify all templates exist
    const templateCheckStmt = db.prepare('SELECT id FROM templates WHERE id = ?');
    for (const templateId of value.steps) {
      const template = templateCheckStmt.get(templateId);
      if (!template) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: `Template with id ${templateId} not found`
          },
          meta: {
            timestamp: new Date().toISOString(),
            version: '1.0'
          }
        });
      }
    }
    
    // Start transaction
    const transaction = db.transaction(() => {
      // Create workflow
      const folderIds = value.folderIds || (value.folder_id ? [value.folder_id] : ['workflows']);
      const primaryFolderId = folderIds[0] || null;
      
      const workflowStmt = db.prepare(`
        INSERT INTO workflows (id, name, description, category, favorite, folder_id, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      workflowStmt.run(
        id,
        value.name,
        value.description || null,
        value.category,
        value.favorite ? 1 : 0,
        primaryFolderId,
        now,
        now
      );
      
      // Create folder associations
      const folderStmt = db.prepare(`
        INSERT INTO item_folders (item_type, item_id, folder_id)
        VALUES ('workflow', ?, ?)
      `);
      
      folderIds.forEach(folderId => {
        if (folderId) {
          folderStmt.run(id, folderId);
        }
      });
      
      // Create workflow steps
      const stepStmt = db.prepare(`
        INSERT INTO workflow_steps (id, workflow_id, template_id, step_order, created_at)
        VALUES (?, ?, ?, ?, ?)
      `);
      
      value.steps.forEach((templateId, index) => {
        stepStmt.run(randomUUID(), id, templateId, index + 1, now);
      });
    });
    
    transaction();
    
    // Return the created workflow
    const newWorkflow = {
      id,
      ...value,
      folderIds: value.folderIds || (value.folder_id ? [value.folder_id] : ['workflows']),
      created_at: now,
      updated_at: now
    };
    
    res.status(201).json({
      success: true,
      data: newWorkflow,
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0'
      }
    });
    
  } catch (error) {
    console.error('Error creating workflow:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'CREATE_ERROR',
        message: 'Failed to create workflow'
      },
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0'
      }
    });
  }
});

// PUT /api/workflows/:id - Update workflow
router.put('/:id', (req, res) => {
  try {
    const { error, value } = updateWorkflowSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: error.details[0].message
        },
        meta: {
          timestamp: new Date().toISOString(),
          version: '1.0'
        }
      });
    }
    
    const db = getDatabase();
    const { id } = req.params;
    
    // Check if workflow exists
    const existingStmt = db.prepare('SELECT id FROM workflows WHERE id = ?');
    const existing = existingStmt.get(id);
    
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Workflow not found'
        },
        meta: {
          timestamp: new Date().toISOString(),
          version: '1.0'
        }
      });
    }
    
    // Verify all templates exist if steps are being updated
    if (value.steps) {
      const templateCheckStmt = db.prepare('SELECT id FROM templates WHERE id = ?');
      for (const templateId of value.steps) {
        const template = templateCheckStmt.get(templateId);
        if (!template) {
          return res.status(400).json({ 
            error: `Template with id ${templateId} not found` 
          });
        }
      }
    }
    
    // Start transaction
    const transaction = db.transaction(() => {
      // Update workflow metadata
      const updateFields = [];
      const updateParams = [];
      
      // Handle folderIds separately
      const folderIds = value.folderIds;
      delete value.folderIds;
      
      Object.keys(value).forEach(key => {
        if (key !== 'steps' && value[key] !== undefined) {
          updateFields.push(`${key} = ?`);
          // Convert boolean to integer for SQLite
          if (key === 'favorite') {
            updateParams.push(value[key] ? 1 : 0);
          } else {
            updateParams.push(value[key]);
          }
        }
      });
      
      // Update folder_id to primary folder
      if (folderIds && folderIds.length > 0) {
        updateFields.push('folder_id = ?');
        updateParams.push(folderIds[0]);
      }
      
      if (updateFields.length > 0) {
        updateFields.push('updated_at = ?');
        updateParams.push(new Date().toISOString());
        updateParams.push(id);
        
        const updateStmt = db.prepare(`
          UPDATE workflows 
          SET ${updateFields.join(', ')} 
          WHERE id = ?
        `);
        
        updateStmt.run(updateParams);
      }
      
      // Update folder associations if provided
      if (folderIds && folderIds.length > 0) {
        // Delete existing associations
        const deleteStmt = db.prepare(`
          DELETE FROM item_folders 
          WHERE item_type = 'workflow' AND item_id = ?
        `);
        deleteStmt.run(id);
        
        // Insert new associations
        const insertStmt = db.prepare(`
          INSERT INTO item_folders (item_type, item_id, folder_id)
          VALUES ('workflow', ?, ?)
        `);
        
        folderIds.forEach(folderId => {
          if (folderId) {
            insertStmt.run(id, folderId);
          }
        });
      }
      
      // Update steps if provided
      if (value.steps) {
        // Delete existing steps
        const deleteStepsStmt = db.prepare('DELETE FROM workflow_steps WHERE workflow_id = ?');
        deleteStepsStmt.run(id);
        
        // Insert new steps
        const stepStmt = db.prepare(`
          INSERT INTO workflow_steps (id, workflow_id, template_id, step_order, created_at)
          VALUES (?, ?, ?, ?, ?)
        `);
        
        value.steps.forEach((templateId, index) => {
          stepStmt.run(randomUUID(), id, templateId, index + 1, new Date().toISOString());
        });
      }
    });
    
    transaction();
    
    // Return updated workflow
    const getStmt = db.prepare('SELECT * FROM workflows WHERE id = ?');
    const updatedWorkflow = getStmt.get(id);
    
    // Get steps
    const stepStmt = db.prepare(`
      SELECT template_id, step_order 
      FROM workflow_steps 
      WHERE workflow_id = ? 
      ORDER BY step_order
    `);
    const steps = stepStmt.all(id);
    
    // Get folder associations
    const folderStmt = db.prepare(`
      SELECT folder_id FROM item_folders 
      WHERE item_type = 'workflow' AND item_id = ?
    `);
    const folders = folderStmt.all(id);
    
    updatedWorkflow.steps = steps.map(step => step.template_id);
    updatedWorkflow.favorite = Boolean(updatedWorkflow.favorite);
    updatedWorkflow.folderIds = folders.map(f => f.folder_id);
    
    res.json({
      success: true,
      data: updatedWorkflow,
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0'
      }
    });
    
  } catch (error) {
    console.error('Error updating workflow:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'UPDATE_ERROR',
        message: 'Failed to update workflow'
      },
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0'
      }
    });
  }
});

// DELETE /api/workflows/:id - Delete workflow
router.delete('/:id', (req, res) => {
  try {
    const db = getDatabase();
    const { id } = req.params;
    
    // Start transaction to delete workflow and associations
    const transaction = db.transaction(() => {
      // Delete folder associations
      const folderStmt = db.prepare('DELETE FROM item_folders WHERE item_type = ? AND item_id = ?');
      folderStmt.run('workflow', id);
      
      // Delete workflow (cascade will handle workflow_steps)
      const stmt = db.prepare('DELETE FROM workflows WHERE id = ?');
      return stmt.run(id);
    });
    
    const result = transaction();
    
    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Workflow not found'
        },
        meta: {
          timestamp: new Date().toISOString(),
          version: '1.0'
        }
      });
    }
    
    res.json({
      success: true,
      data: { message: 'Workflow deleted successfully' },
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0'
      }
    });
    
  } catch (error) {
    console.error('Error deleting workflow:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'DELETE_ERROR',
        message: 'Failed to delete workflow'
      },
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0'
      }
    });
  }
});

export default router;