import express from 'express';
import Joi from 'joi';
import { randomUUID } from 'crypto';
import { getDatabase } from '../database.js';

const router = express.Router();

// Validation schemas - Accept all frontend fields
const folderSchema = Joi.object().pattern(Joi.string(), Joi.any()).required().keys({
  name: Joi.string().min(1).max(255).required()
});

const updateFolderSchema = folderSchema.fork(['name'], (schema) => schema.optional());

const batchUpdateSortOrderSchema = Joi.object({
  updates: Joi.array().items(
    Joi.object({
      id: Joi.string().required(),
      sort_order: Joi.number().integer().min(0).required()
    })
  ).min(1).required()
});

// GET /api/folders/debug - Debug endpoint to check folder state
router.get('/debug', async (req, res) => {
  try {
    const db = getDatabase();
    const folders = db.prepare('SELECT * FROM folders ORDER BY name').all();
    const folderCount = db.prepare('SELECT COUNT(*) as count FROM folders').get();
    
    res.json({
      success: true,
      data: {
        totalFolders: folderCount.count,
        folders: folders,
        message: folderCount.count === 0 ? 'No folders found - database may need seeding' : 'Folders found'
      }
    });
  } catch (error) {
    console.error('Error in debug endpoint:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/folders/reseed - Force reseed folders
router.post('/reseed', async (req, res) => {
  try {
    const db = getDatabase();
    
    // Delete all existing folders (cascades to related tables)
    db.prepare('DELETE FROM folders').run();
    console.log('🗑️ Cleared existing folders');
    
    // Re-seed from default data
    const { fileURLToPath } = await import('url');
    const { dirname, join } = await import('path');
    const { readFileSync } = await import('fs');
    
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    
    const defaultFoldersPath = join(__dirname, '..', '..', 'src', 'data', 'defaultFolders.json');
    const defaultFoldersContent = readFileSync(defaultFoldersPath, 'utf8');
    const defaultFolders = JSON.parse(defaultFoldersContent);
    
    const insertFolder = db.prepare(`
      INSERT INTO folders (id, name, description, parent_id, sort_order, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    const insertTransaction = db.transaction((folders) => {
      folders.forEach(folder => {
        insertFolder.run(
          folder.id,
          folder.name,
          folder.description || null,
          folder.parentId,
          folder.sortOrder || 0,
          folder.createdAt,
          folder.updatedAt
        );
      });
    });
    
    insertTransaction(defaultFolders);
    
    res.json({
      success: true,
      data: {
        message: `Successfully reseeded ${defaultFolders.length} folders`,
        folders: defaultFolders
      }
    });
    
  } catch (error) {
    console.error('Error reseeding folders:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/folders - Get all folders
router.get('/', (req, res) => {
  try {
    const db = getDatabase();
    const { parent_id, include_children } = req.query;
    
    let query = `
      SELECT f.*, pf.name as parent_name,
        (SELECT COUNT(*) FROM templates WHERE folder_id = f.id) as template_count,
        (SELECT COUNT(*) FROM workflows WHERE folder_id = f.id) as workflow_count,
        (SELECT COUNT(*) FROM folders WHERE parent_id = f.id) as subfolder_count
      FROM folders f 
      LEFT JOIN folders pf ON f.parent_id = pf.id
      WHERE 1=1
    `;
    const params = [];
    
    if (parent_id !== undefined) {
      if (parent_id === 'null' || parent_id === null) {
        query += ` AND f.parent_id IS NULL`;
      } else {
        query += ` AND f.parent_id = ?`;
        params.push(parent_id);
      }
    }
    
    query += ` ORDER BY COALESCE(f.sort_order, 0) ASC, f.name ASC`;
    
    const stmt = db.prepare(query);
    const folders = stmt.all(params);
    
    // If include_children is requested, get folder hierarchy
    let processedFolders = folders.map(folder => ({
      ...folder,
      template_count: parseInt(folder.template_count),
      workflow_count: parseInt(folder.workflow_count),
      subfolder_count: parseInt(folder.subfolder_count)
    }));
    
    if (include_children === 'true') {
      // Build folder hierarchy
      const folderMap = new Map();
      processedFolders.forEach(folder => {
        folderMap.set(folder.id, { ...folder, children: [] });
      });
      
      processedFolders.forEach(folder => {
        if (folder.parent_id && folderMap.has(folder.parent_id)) {
          folderMap.get(folder.parent_id).children.push(folderMap.get(folder.id));
        }
      });
      
      // Return only root folders with their hierarchies
      processedFolders = processedFolders
        .filter(folder => !folder.parent_id)
        .map(folder => folderMap.get(folder.id));
    }
    
    res.json({
      success: true,
      data: processedFolders,
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0'
      }
    });
    
  } catch (error) {
    console.error('Error fetching folders:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_ERROR',
        message: 'Failed to fetch folders'
      },
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0'
      }
    });
  }
});

// GET /api/folders/:id - Get single folder
router.get('/:id', (req, res) => {
  try {
    const db = getDatabase();
    const { id } = req.params;
    
    const stmt = db.prepare(`
      SELECT f.*, pf.name as parent_name,
        (SELECT COUNT(*) FROM templates WHERE folder_id = f.id) as template_count,
        (SELECT COUNT(*) FROM workflows WHERE folder_id = f.id) as workflow_count,
        (SELECT COUNT(*) FROM folders WHERE parent_id = f.id) as subfolder_count
      FROM folders f 
      LEFT JOIN folders pf ON f.parent_id = pf.id 
      WHERE f.id = ?
    `);
    const folder = stmt.get(id);
    
    if (!folder) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Folder not found'
        },
        meta: {
          timestamp: new Date().toISOString(),
          version: '1.0'
        }
      });
    }
    
    // Get children folders
    const childrenStmt = db.prepare(`
      SELECT id, name, description, created_at, updated_at,
        (SELECT COUNT(*) FROM templates WHERE folder_id = folders.id) as template_count,
        (SELECT COUNT(*) FROM workflows WHERE folder_id = folders.id) as workflow_count,
        (SELECT COUNT(*) FROM folders f WHERE f.parent_id = folders.id) as subfolder_count
      FROM folders 
      WHERE parent_id = ? 
      ORDER BY name ASC
    `);
    const children = childrenStmt.all(id);
    
    const processedFolder = {
      ...folder,
      template_count: parseInt(folder.template_count),
      workflow_count: parseInt(folder.workflow_count),
      subfolder_count: parseInt(folder.subfolder_count),
      children: children.map(child => ({
        ...child,
        template_count: parseInt(child.template_count),
        workflow_count: parseInt(child.workflow_count),
        subfolder_count: parseInt(child.subfolder_count)
      }))
    };
    
    res.json({
      success: true,
      data: processedFolder,
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0'
      }
    });
    
  } catch (error) {
    console.error('Error fetching folder:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_ERROR',
        message: 'Failed to fetch folder'
      },
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0'
      }
    });
  }
});

// POST /api/folders - Create new folder
router.post('/', (req, res) => {
  try {
    // Skip validation for now - accept any data
    const value = req.body;
    
    // Basic validation - just check if name exists
    if (!value.name || typeof value.name !== 'string' || value.name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Name is required'
        },
        meta: {
          timestamp: new Date().toISOString(),
          version: '1.0'
        }
      });
    }
    
    const db = getDatabase();
    const id = value.id || randomUUID(); // Use provided ID or generate new one
    const now = new Date().toISOString();
    
    // Handle both parent_id and parentId field names
    const parentId = value.parent_id || value.parentId;
    const actualParentId = (parentId === 'root' || !parentId) ? null : parentId;
    
    // Check if parent folder exists (if specified)
    if (actualParentId) {
      const parentStmt = db.prepare('SELECT id FROM folders WHERE id = ?');
      const parent = parentStmt.get(actualParentId);
      if (!parent) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'PARENT_NOT_FOUND',
            message: 'Parent folder not found'
          },
          meta: {
            timestamp: new Date().toISOString(),
            version: '1.0'
          }
        });
      }
    }
    
    const stmt = db.prepare(`
      INSERT INTO folders (id, name, description, parent_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      id,
      value.name,
      value.description || null,
      actualParentId,
      now,
      now
    );
    
    // Return the created folder
    const newFolder = {
      id,
      ...value,
      created_at: now,
      updated_at: now,
      template_count: 0,
      workflow_count: 0,
      subfolder_count: 0
    };
    
    res.status(201).json({
      success: true,
      data: newFolder,
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0'
      }
    });
    
  } catch (error) {
    console.error('Error creating folder:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'CREATE_ERROR',
        message: 'Failed to create folder'
      },
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0'
      }
    });
  }
});

// PUT /api/folders/:id - Update folder
router.put('/:id', (req, res) => {
  try {
    const { error, value } = updateFolderSchema.validate(req.body);
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
    
    // Validate description length if provided
    if (value.description && value.description.length > 50000) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Description too long (max 50000 characters)'
        },
        meta: {
          timestamp: new Date().toISOString(),
          version: '1.0'
        }
      });
    }
    
    const db = getDatabase();
    const { id } = req.params;
    
    // Check if folder exists
    const existingStmt = db.prepare('SELECT id FROM folders WHERE id = ?');
    const existing = existingStmt.get(id);
    
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Folder not found'
        },
        meta: {
          timestamp: new Date().toISOString(),
          version: '1.0'
        }
      });
    }
    
    // Check if parent folder exists (if specified and different from current)
    if (value.parent_id && value.parent_id !== id) {
      const parentStmt = db.prepare('SELECT id FROM folders WHERE id = ?');
      const parent = parentStmt.get(value.parent_id);
      if (!parent) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'PARENT_NOT_FOUND',
            message: 'Parent folder not found'
          },
          meta: {
            timestamp: new Date().toISOString(),
            version: '1.0'
          }
        });
      }
      
      // Check for circular reference
      let currentParentId = value.parent_id;
      while (currentParentId) {
        if (currentParentId === id) {
          return res.status(400).json({
            success: false,
            error: {
              code: 'CIRCULAR_REFERENCE',
              message: 'Cannot set folder as its own descendant'
            },
            meta: {
              timestamp: new Date().toISOString(),
              version: '1.0'
            }
          });
        }
        const parentCheckStmt = db.prepare('SELECT parent_id FROM folders WHERE id = ?');
        const parentCheck = parentCheckStmt.get(currentParentId);
        currentParentId = parentCheck?.parent_id;
      }
    }
    
    const updateFields = [];
    const updateParams = [];
    
    Object.keys(value).forEach(key => {
      if (value[key] !== undefined) {
        updateFields.push(`${key} = ?`);
        updateParams.push(value[key]);
      }
    });
    
    updateFields.push('updated_at = ?');
    updateParams.push(new Date().toISOString());
    updateParams.push(id);
    
    const updateStmt = db.prepare(`
      UPDATE folders 
      SET ${updateFields.join(', ')} 
      WHERE id = ?
    `);
    
    updateStmt.run(updateParams);
    
    // Return updated folder
    const getStmt = db.prepare(`
      SELECT f.*, 
        (SELECT COUNT(*) FROM templates WHERE folder_id = f.id) as template_count,
        (SELECT COUNT(*) FROM workflows WHERE folder_id = f.id) as workflow_count,
        (SELECT COUNT(*) FROM folders WHERE parent_id = f.id) as subfolder_count
      FROM folders f 
      WHERE f.id = ?
    `);
    const updatedFolder = getStmt.get(id);
    
    const processedFolder = {
      ...updatedFolder,
      template_count: parseInt(updatedFolder.template_count),
      workflow_count: parseInt(updatedFolder.workflow_count),
      subfolder_count: parseInt(updatedFolder.subfolder_count)
    };
    
    res.json({
      success: true,
      data: processedFolder,
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0'
      }
    });
    
  } catch (error) {
    console.error('Error updating folder:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'UPDATE_ERROR',
        message: 'Failed to update folder'
      },
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0'
      }
    });
  }
});

// DELETE /api/folders/:id - Delete folder
router.delete('/:id', (req, res) => {
  try {
    const db = getDatabase();
    const { id } = req.params;
    const { force } = req.query;
    
    // Check if folder has content
    const contentCheckStmt = db.prepare(`
      SELECT 
        (SELECT COUNT(*) FROM templates WHERE folder_id = ?) as template_count,
        (SELECT COUNT(*) FROM workflows WHERE folder_id = ?) as workflow_count,
        (SELECT COUNT(*) FROM folders WHERE parent_id = ?) as subfolder_count
    `);
    const contentCheck = contentCheckStmt.get(id, id, id);
    
    const hasContent = contentCheck.template_count > 0 || 
                      contentCheck.workflow_count > 0 || 
                      contentCheck.subfolder_count > 0;
    
    if (hasContent && force !== 'true') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'FOLDER_NOT_EMPTY',
          message: 'Folder contains items. Use force=true to delete anyway.',
          details: {
            template_count: parseInt(contentCheck.template_count),
            workflow_count: parseInt(contentCheck.workflow_count),
            subfolder_count: parseInt(contentCheck.subfolder_count)
          }
        },
        meta: {
          timestamp: new Date().toISOString(),
          version: '1.0'
        }
      });
    }
    
    const stmt = db.prepare('DELETE FROM folders WHERE id = ?');
    const result = stmt.run(id);
    
    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Folder not found'
        },
        meta: {
          timestamp: new Date().toISOString(),
          version: '1.0'
        }
      });
    }
    
    res.status(204).send();
    
  } catch (error) {
    console.error('Error deleting folder:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'DELETE_ERROR',
        message: 'Failed to delete folder'
      },
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0'
      }
    });
  }
});

// PATCH /api/folders/batch-sort-order - Update sort order for multiple folders
router.patch('/batch-sort-order', (req, res) => {
  try {
    const { error, value } = batchUpdateSortOrderSchema.validate(req.body);
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
    const now = new Date().toISOString();
    
    // Start a transaction for batch updates
    const updateTransaction = db.transaction((updates) => {
      const updateStmt = db.prepare(`
        UPDATE folders 
        SET sort_order = ?, updated_at = ? 
        WHERE id = ?
      `);
      
      for (const update of updates) {
        // Verify folder exists
        const existsStmt = db.prepare('SELECT id FROM folders WHERE id = ?');
        const exists = existsStmt.get(update.id);
        
        if (!exists) {
          throw new Error(`Folder with id ${update.id} not found`);
        }
        
        updateStmt.run(update.sort_order, now, update.id);
      }
    });

    // Execute the transaction
    updateTransaction(value.updates);

    res.json({
      success: true,
      message: `Updated sort order for ${value.updates.length} folders`,
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0'
      }
    });

  } catch (error) {
    console.error('Error updating folder sort orders:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'BATCH_UPDATE_ERROR',
        message: error.message || 'Failed to update folder sort orders'
      },
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0'
      }
    });
  }
});

export default router;