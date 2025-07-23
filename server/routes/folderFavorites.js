import express from 'express';
import Joi from 'joi';
import { getDatabase } from '../database.js';

const router = express.Router();

// Validation schemas
const folderFavoriteSchema = Joi.object({
  entity_type: Joi.string().valid('template', 'workflow', 'snippet').required(),
  entity_id: Joi.string().required(),
  folder_id: Joi.string().required(),
  favorite_order: Joi.number().integer().min(0).default(0)
});

// GET /api/folder-favorites/:folderId - Get all favorites for a specific folder
router.get('/:folderId', (req, res) => {
  try {
    const db = getDatabase();
    const { folderId } = req.params;
    const { entity_type } = req.query;
    
    let query = `
      SELECT ff.*, 
        CASE 
          WHEN ff.entity_type = 'template' THEN t.name
          WHEN ff.entity_type = 'workflow' THEN w.name
          WHEN ff.entity_type = 'snippet' THEN s.name
        END as entity_name
      FROM folder_favorites ff
      LEFT JOIN templates t ON ff.entity_type = 'template' AND ff.entity_id = t.id
      LEFT JOIN workflows w ON ff.entity_type = 'workflow' AND ff.entity_id = w.id
      LEFT JOIN snippets s ON ff.entity_type = 'snippet' AND ff.entity_id = s.id
      WHERE ff.folder_id = ?
    `;
    const params = [folderId];
    
    if (entity_type) {
      query += ` AND ff.entity_type = ?`;
      params.push(entity_type);
    }
    
    query += ` ORDER BY ff.favorite_order ASC, ff.created_at DESC`;
    
    const stmt = db.prepare(query);
    const favorites = stmt.all(params);
    
    res.json({
      success: true,
      data: favorites,
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0'
      }
    });
    
  } catch (error) {
    console.error('Error fetching folder favorites:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_ERROR',
        message: 'Failed to fetch folder favorites'
      },
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0'
      }
    });
  }
});

// POST /api/folder-favorites - Add item to folder favorites
router.post('/', (req, res) => {
  try {
    const { error, value } = folderFavoriteSchema.validate(req.body);
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
    
    // Check if already exists
    const existingStmt = db.prepare(`
      SELECT id FROM folder_favorites 
      WHERE entity_type = ? AND entity_id = ? AND folder_id = ?
    `);
    const existing = existingStmt.get(value.entity_type, value.entity_id, value.folder_id);
    
    if (existing) {
      // Update existing
      const updateStmt = db.prepare(`
        UPDATE folder_favorites 
        SET favorite_order = ?, updated_at = ?
        WHERE entity_type = ? AND entity_id = ? AND folder_id = ?
      `);
      updateStmt.run(
        value.favorite_order,
        now,
        value.entity_type,
        value.entity_id,
        value.folder_id
      );
    } else {
      // Insert new
      const insertStmt = db.prepare(`
        INSERT INTO folder_favorites (entity_type, entity_id, folder_id, favorite_order, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      insertStmt.run(
        value.entity_type,
        value.entity_id,
        value.folder_id,
        value.favorite_order,
        now,
        now
      );
    }
    
    res.json({
      success: true,
      data: {
        ...value,
        updated_at: now
      },
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0'
      }
    });
    
  } catch (error) {
    console.error('Error adding folder favorite:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'CREATE_ERROR',
        message: 'Failed to add folder favorite'
      },
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0'
      }
    });
  }
});

// DELETE /api/folder-favorites - Remove item from folder favorites
router.delete('/', (req, res) => {
  try {
    const { entity_type, entity_id, folder_id } = req.body;
    
    if (!entity_type || !entity_id || !folder_id) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'entity_type, entity_id, and folder_id are required'
        },
        meta: {
          timestamp: new Date().toISOString(),
          version: '1.0'
        }
      });
    }
    
    const db = getDatabase();
    const stmt = db.prepare(`
      DELETE FROM folder_favorites 
      WHERE entity_type = ? AND entity_id = ? AND folder_id = ?
    `);
    const result = stmt.run(entity_type, entity_id, folder_id);
    
    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Folder favorite not found'
        },
        meta: {
          timestamp: new Date().toISOString(),
          version: '1.0'
        }
      });
    }
    
    res.json({
      success: true,
      data: {
        deleted: true
      },
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0'
      }
    });
    
  } catch (error) {
    console.error('Error removing folder favorite:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'DELETE_ERROR',
        message: 'Failed to remove folder favorite'
      },
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0'
      }
    });
  }
});

export default router;