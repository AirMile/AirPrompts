import express from 'express';
import Joi from 'joi';
import { getDatabase } from '../database.js';

const router = express.Router();

// Simple rate limiting to prevent infinite loops
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 1000; // 1 second
const MAX_REQUESTS_PER_WINDOW = 20; // Increased for React StrictMode

const checkRateLimit = (key) => {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW;
  
  if (!rateLimitMap.has(key)) {
    rateLimitMap.set(key, []);
  }
  
  const requests = rateLimitMap.get(key);
  // Remove old requests outside the window
  const recentRequests = requests.filter(time => time > windowStart);
  
  if (recentRequests.length >= MAX_REQUESTS_PER_WINDOW) {
    return false; // Rate limit exceeded
  }
  
  // Add current request
  recentRequests.push(now);
  rateLimitMap.set(key, recentRequests);
  
  return true; // Request allowed
};

// Clean up old rate limit entries every minute
setInterval(() => {
  const now = Date.now();
  const cutoff = now - RATE_LIMIT_WINDOW * 2;
  
  for (const [key, requests] of rateLimitMap.entries()) {
    const recentRequests = requests.filter(time => time > cutoff);
    if (recentRequests.length === 0) {
      rateLimitMap.delete(key);
    } else {
      rateLimitMap.set(key, recentRequests);
    }
  }
}, 60000);

// Validation schemas
const folderUIStateSchema = Joi.object({
  folder_id: Joi.string().required(),
  is_expanded: Joi.boolean().required()
});

const headerUIStateSchema = Joi.object({
  folder_id: Joi.string().required(),
  header_type: Joi.string().required(),
  is_expanded: Joi.boolean().required()
});

const batchUIStateSchema = Joi.object({
  folder_states: Joi.array().items(folderUIStateSchema).optional(),
  header_states: Joi.array().items(headerUIStateSchema).optional()
});

// GET /api/ui-state/folders - Get all folder UI states
router.get('/folders', (req, res) => {
  try {
    const db = getDatabase();
    const stmt = db.prepare(`
      SELECT folder_id, is_expanded, updated_at
      FROM folder_ui_state
      ORDER BY updated_at DESC
    `);
    const states = stmt.all();
    
    res.json({
      success: true,
      data: states,
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0'
      }
    });
    
  } catch (error) {
    console.error('Error fetching folder UI states:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_ERROR',
        message: 'Failed to fetch folder UI states'
      },
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0'
      }
    });
  }
});

// GET /api/ui-state/headers/:folderId - Get header UI states for a specific folder
router.get('/headers/:folderId', (req, res) => {
  try {
    const db = getDatabase();
    const { folderId } = req.params;
    
    const stmt = db.prepare(`
      SELECT folder_id, header_type, is_expanded, updated_at
      FROM header_ui_state
      WHERE folder_id = ?
      ORDER BY header_type ASC
    `);
    const states = stmt.all(folderId);
    
    res.json({
      success: true,
      data: states,
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0'
      }
    });
    
  } catch (error) {
    console.error('Error fetching header UI states:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_ERROR',
        message: 'Failed to fetch header UI states'
      },
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0'
      }
    });
  }
});

// GET /api/ui-state/headers - Get all header UI states
router.get('/headers', (req, res) => {
  try {
    const db = getDatabase();
    const stmt = db.prepare(`
      SELECT folder_id, header_type, is_expanded, updated_at
      FROM header_ui_state
      ORDER BY folder_id ASC, header_type ASC
    `);
    const states = stmt.all();
    
    res.json({
      success: true,
      data: states,
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0'
      }
    });
    
  } catch (error) {
    console.error('Error fetching header UI states:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_ERROR',
        message: 'Failed to fetch header UI states'
      },
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0'
      }
    });
  }
});

// POST /api/ui-state/folder - Set folder UI state
router.post('/folder', (req, res) => {
  try {
    const { error, value } = folderUIStateSchema.validate(req.body);
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
    
    // Upsert folder UI state
    const stmt = db.prepare(`
      INSERT INTO folder_ui_state (folder_id, is_expanded, created_at, updated_at)
      VALUES (?, ?, ?, ?)
      ON CONFLICT (folder_id) DO UPDATE SET
        is_expanded = ?,
        updated_at = ?
    `);
    
    stmt.run(
      value.folder_id,
      value.is_expanded ? 1 : 0, // Convert boolean to integer
      now,
      now,
      value.is_expanded ? 1 : 0, // Convert boolean to integer
      now
    );
    
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
    console.error('Error setting folder UI state:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'UPDATE_ERROR',
        message: 'Failed to set folder UI state'
      },
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0'
      }
    });
  }
});

// POST /api/ui-state/header - Set header UI state
router.post('/header', (req, res) => {
  try {
    // Rate limiting check
    const rateLimitKey = `header_${req.body.folder_id}_${req.body.header_type}`;
    if (!checkRateLimit(rateLimitKey)) {
      return res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests for this resource'
        },
        meta: {
          timestamp: new Date().toISOString(),
          version: '1.0'
        }
      });
    }
    
    const { error, value } = headerUIStateSchema.validate(req.body);
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
    
    // Upsert header UI state
    const stmt = db.prepare(`
      INSERT INTO header_ui_state (folder_id, header_type, is_expanded, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT (folder_id, header_type) DO UPDATE SET
        is_expanded = ?,
        updated_at = ?
    `);
    
    stmt.run(
      value.folder_id,
      value.header_type,
      value.is_expanded ? 1 : 0, // Convert boolean to integer
      now,
      now,
      value.is_expanded ? 1 : 0, // Convert boolean to integer  
      now
    );
    
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
    console.error('Error setting header UI state:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'UPDATE_ERROR',
        message: 'Failed to set header UI state'
      },
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0'
      }
    });
  }
});

// POST /api/ui-state/batch - Set multiple UI states at once
router.post('/batch', (req, res) => {
  try {
    const { error, value } = batchUIStateSchema.validate(req.body);
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
    
    // Use transaction for batch updates
    const transaction = db.transaction(() => {
      // Update folder states
      if (value.folder_states && value.folder_states.length > 0) {
        const folderStmt = db.prepare(`
          INSERT INTO folder_ui_state (folder_id, is_expanded, created_at, updated_at)
          VALUES (?, ?, ?, ?)
          ON CONFLICT (folder_id) DO UPDATE SET
            is_expanded = ?,
            updated_at = ?
        `);
        
        value.folder_states.forEach(state => {
          folderStmt.run(
            state.folder_id,
            state.is_expanded ? 1 : 0, // Convert boolean to integer
            now,
            now,
            state.is_expanded ? 1 : 0, // Convert boolean to integer
            now
          );
        });
      }
      
      // Update header states
      if (value.header_states && value.header_states.length > 0) {
        const headerStmt = db.prepare(`
          INSERT INTO header_ui_state (folder_id, header_type, is_expanded, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?)
          ON CONFLICT (folder_id, header_type) DO UPDATE SET
            is_expanded = ?,
            updated_at = ?
        `);
        
        value.header_states.forEach(state => {
          headerStmt.run(
            state.folder_id,
            state.header_type,
            state.is_expanded ? 1 : 0, // Convert boolean to integer
            now,
            now,
            state.is_expanded ? 1 : 0, // Convert boolean to integer
            now
          );
        });
      }
    });
    
    transaction();
    
    res.json({
      success: true,
      data: {
        folder_states_updated: value.folder_states ? value.folder_states.length : 0,
        header_states_updated: value.header_states ? value.header_states.length : 0,
        updated_at: now
      },
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0'
      }
    });
    
  } catch (error) {
    console.error('Error setting batch UI states:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'UPDATE_ERROR',
        message: 'Failed to set batch UI states'
      },
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0'
      }
    });
  }
});

// DELETE /api/ui-state/folder/:folderId - Remove folder UI state
router.delete('/folder/:folderId', (req, res) => {
  try {
    const { folderId } = req.params;
    
    const db = getDatabase();
    const stmt = db.prepare(`DELETE FROM folder_ui_state WHERE folder_id = ?`);
    const result = stmt.run(folderId);
    
    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Folder UI state not found'
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
        deleted: true,
        folder_id: folderId
      },
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0'
      }
    });
    
  } catch (error) {
    console.error('Error deleting folder UI state:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'DELETE_ERROR',
        message: 'Failed to delete folder UI state'
      },
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0'
      }
    });
  }
});

// DELETE /api/ui-state/header/:folderId/:headerType - Remove specific header UI state
router.delete('/header/:folderId/:headerType', (req, res) => {
  try {
    const { folderId, headerType } = req.params;
    
    const db = getDatabase();
    const stmt = db.prepare(`DELETE FROM header_ui_state WHERE folder_id = ? AND header_type = ?`);
    const result = stmt.run(folderId, headerType);
    
    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Header UI state not found'
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
        deleted: true,
        folder_id: folderId,
        header_type: headerType
      },
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0'
      }
    });
    
  } catch (error) {
    console.error('Error deleting header UI state:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'DELETE_ERROR',
        message: 'Failed to delete header UI state'
      },
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0'
      }
    });
  }
});

// POST /api/ui-state/headers/reset - Reset all header states to expanded
router.post('/headers/reset', (req, res) => {
  try {
    const db = getDatabase();
    const now = new Date().toISOString();
    
    // Update all header UI states to expanded (1)
    const stmt = db.prepare(`
      UPDATE header_ui_state 
      SET is_expanded = 1, updated_at = ?
    `);
    const result = stmt.run(now);
    
    res.json({
      success: true,
      data: {
        updated: result.changes,
        message: 'All headers reset to expanded state'
      },
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0'
      }
    });
  } catch (error) {
    console.error('Error resetting header UI states:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'DATABASE_ERROR',
        message: 'Failed to reset header UI states'
      },
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0'
      }
    });
  }
});

export default router;
// Force server restart - added POST reset endpoint
