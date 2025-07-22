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
  steps: Joi.array().items(Joi.string()).min(1).required()
});

const updateWorkflowSchema = workflowSchema.fork(['name', 'category', 'steps'], (schema) => schema.optional());

// GET /api/workflows - Get all workflows
router.get('/', (req, res) => {
  try {
    const db = getDatabase();
    const { category, favorite, folder_id, limit, offset } = req.query;
    
    let query = `
      SELECT w.*, f.name as folder_name 
      FROM workflows w 
      LEFT JOIN folders f ON w.folder_id = f.id 
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
      query += ` AND w.folder_id = ?`;
      params.push(folder_id);
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
    
    const processedWorkflows = workflows.map(workflow => {
      const steps = stepStmt.all(workflow.id);
      return {
        ...workflow,
        steps: steps.map(step => step.template_id),
        step_details: steps,
        favorite: Boolean(workflow.favorite)
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
      SELECT w.*, f.name as folder_name 
      FROM workflows w 
      LEFT JOIN folders f ON w.folder_id = f.id 
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
    
    workflow.steps = steps.map(step => step.template_id);
    workflow.step_details = steps;
    workflow.favorite = Boolean(workflow.favorite);
    
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
        value.folder_id || null,
        now,
        now
      );
      
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
    
    const db = req.db;
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
    
    updatedWorkflow.steps = steps.map(step => step.template_id);
    updatedWorkflow.favorite = Boolean(updatedWorkflow.favorite);
    
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
    
    const stmt = db.prepare('DELETE FROM workflows WHERE id = ?');
    const result = stmt.run(id);
    
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