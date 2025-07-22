import express from 'express';
import Joi from 'joi';
import { randomUUID } from 'crypto';
import { getDatabase } from '../database.js';

const router = express.Router();

// Validation schemas
const snippetSchema = Joi.object({
  name: Joi.string().min(1).max(255).required(),
  content: Joi.string().required(),
  tags: Joi.array().items(Joi.string()).default([]),
  favorite: Joi.boolean().default(false),
  folder_id: Joi.string().allow(null)
});

const updateSnippetSchema = snippetSchema.fork(['name', 'content'], (schema) => schema.optional());

// GET /api/snippets - Get all snippets
router.get('/', (req, res) => {
  try {
    const db = getDatabase();
    const { category, favorite, folder_id, tags, limit, offset } = req.query;
    
    let query = `
      SELECT s.*, f.name as folder_name 
      FROM snippets s 
      LEFT JOIN folders f ON s.folder_id = f.id 
      WHERE 1=1
    `;
    const params = [];
    
    if (category) {
      query += ` AND s.category = ?`;
      params.push(category);
    }
    
    if (favorite !== undefined) {
      query += ` AND s.favorite = ?`;
      params.push(favorite === 'true' ? 1 : 0);
    }
    
    if (folder_id) {
      query += ` AND s.folder_id = ?`;
      params.push(folder_id);
    }
    
    if (tags) {
      // Simple tag filtering - check if any of the requested tags exist
      const tagList = Array.isArray(tags) ? tags : [tags];
      const tagConditions = tagList.map(() => `s.tags LIKE ?`).join(' OR ');
      if (tagConditions) {
        query += ` AND (${tagConditions})`;
        tagList.forEach(tag => params.push(`%"${tag}"%`));
      }
    }
    
    query += ` ORDER BY s.updated_at DESC`;
    
    if (limit) {
      query += ` LIMIT ?`;
      params.push(parseInt(limit));
      
      if (offset) {
        query += ` OFFSET ?`;
        params.push(parseInt(offset));
      }
    }
    
    const snippets = db.prepare(query).all(...params);
    
    // Parse JSON fields
    const parsedSnippets = snippets.map(snippet => ({
      ...snippet,
      tags: snippet.tags ? JSON.parse(snippet.tags) : [],
      favorite: Boolean(snippet.favorite)
    }));
    
    res.json({
      success: true,
      data: parsedSnippets,
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0'
      }
    });
  } catch (error) {
    console.error('Error fetching snippets:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'DATABASE_ERROR',
        message: 'Failed to fetch snippets'
      },
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0'
      }
    });
  }
});

// GET /api/snippets/:id - Get specific snippet
router.get('/:id', (req, res) => {
  try {
    const db = getDatabase();
    const { id } = req.params;
    
    const snippet = db.prepare(`
      SELECT s.*, f.name as folder_name 
      FROM snippets s 
      LEFT JOIN folders f ON s.folder_id = f.id 
      WHERE s.id = ?
    `).get(id);
    
    if (!snippet) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Snippet not found'
        },
        meta: {
          timestamp: new Date().toISOString(),
          version: '1.0'
        }
      });
    }
    
    // Parse JSON fields
    const parsedSnippet = {
      ...snippet,
      tags: snippet.tags ? JSON.parse(snippet.tags) : [],
      favorite: Boolean(snippet.favorite)
    };
    
    res.json({
      success: true,
      data: parsedSnippet,
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0'
      }
    });
  } catch (error) {
    console.error('Error fetching snippet:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'DATABASE_ERROR',
        message: 'Failed to fetch snippet'
      },
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0'
      }
    });
  }
});

// POST /api/snippets - Create new snippet
router.post('/', (req, res) => {
  try {
    const { error, value } = snippetSchema.validate(req.body);
    
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
    const id = randomUUID();
    const now = new Date().toISOString();
    
    const insertStmt = db.prepare(`
      INSERT INTO snippets (id, name, content, category, tags, favorite, folder_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    insertStmt.run(
      id,
      value.name,
      value.content,
      value.category || null, // Allow null category
      JSON.stringify(value.tags || []),
      value.favorite ? 1 : 0,
      value.folder_id,
      now,
      now
    );
    
    // Fetch the created snippet
    const snippet = db.prepare('SELECT * FROM snippets WHERE id = ?').get(id);
    
    const parsedSnippet = {
      ...snippet,
      tags: snippet.tags ? JSON.parse(snippet.tags) : [],
      favorite: Boolean(snippet.favorite)
    };
    
    res.status(201).json({
      success: true,
      data: parsedSnippet,
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0'
      }
    });
  } catch (error) {
    console.error('Error creating snippet:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'DATABASE_ERROR',
        message: 'Failed to create snippet'
      },
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0'
      }
    });
  }
});

// PUT /api/snippets/:id - Update snippet
router.put('/:id', (req, res) => {
  try {
    const { error, value } = updateSnippetSchema.validate(req.body);
    
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
    
    // Check if snippet exists
    const existingSnippet = db.prepare('SELECT * FROM snippets WHERE id = ?').get(id);
    if (!existingSnippet) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Snippet not found'
        },
        meta: {
          timestamp: new Date().toISOString(),
          version: '1.0'
        }
      });
    }
    
    const now = new Date().toISOString();
    const updateStmt = db.prepare(`
      UPDATE snippets 
      SET name = COALESCE(?, name),
          content = COALESCE(?, content),
          category = COALESCE(?, category),
          tags = COALESCE(?, tags),
          favorite = COALESCE(?, favorite),
          folder_id = COALESCE(?, folder_id),
          updated_at = ?
      WHERE id = ?
    `);
    
    updateStmt.run(
      value.name,
      value.content,
      value.category || null, // Allow null category
      value.tags ? JSON.stringify(value.tags) : null,
      value.favorite !== undefined ? (value.favorite ? 1 : 0) : null,
      value.folder_id !== undefined ? value.folder_id : null,
      now,
      id
    );
    
    // Fetch the updated snippet
    const snippet = db.prepare('SELECT * FROM snippets WHERE id = ?').get(id);
    
    const parsedSnippet = {
      ...snippet,
      tags: snippet.tags ? JSON.parse(snippet.tags) : [],
      favorite: Boolean(snippet.favorite)
    };
    
    res.json({
      success: true,
      data: parsedSnippet,
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0'
      }
    });
  } catch (error) {
    console.error('Error updating snippet:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'DATABASE_ERROR',
        message: 'Failed to update snippet'
      },
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0'
      }
    });
  }
});

// DELETE /api/snippets/:id - Delete snippet
router.delete('/:id', (req, res) => {
  try {
    const db = getDatabase();
    const { id } = req.params;
    
    // Check if snippet exists
    const existingSnippet = db.prepare('SELECT * FROM snippets WHERE id = ?').get(id);
    if (!existingSnippet) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Snippet not found'
        },
        meta: {
          timestamp: new Date().toISOString(),
          version: '1.0'
        }
      });
    }
    
    const deleteStmt = db.prepare('DELETE FROM snippets WHERE id = ?');
    deleteStmt.run(id);
    
    res.json({
      success: true,
      data: { id, deleted: true },
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0'
      }
    });
  } catch (error) {
    console.error('Error deleting snippet:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'DATABASE_ERROR',
        message: 'Failed to delete snippet'
      },
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0'
      }
    });
  }
});

export default router;