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
  folder_id: Joi.string().allow(null),
  folderIds: Joi.array().items(Joi.string()).min(1),
  folderFavorites: Joi.object().pattern(Joi.string(), Joi.object({
    isFavorite: Joi.boolean(),
    favoriteOrder: Joi.number().integer().min(0)
  }))
});

const updateSnippetSchema = snippetSchema.fork(['name', 'content'], (schema) => schema.optional());

// GET /api/snippets - Get all snippets
router.get('/', (req, res) => {
  try {
    const db = getDatabase();
    const { category, favorite, folder_id, tags, limit, offset } = req.query;
    
    let query = `
      SELECT DISTINCT s.* 
      FROM snippets s 
      LEFT JOIN item_folders if ON if.item_type = 'snippet' AND if.item_id = s.id
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
      query += ` AND (if.folder_id = ? OR s.folder_id = ?)`;
      params.push(folder_id, folder_id);
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
    
    // Get folder favorites for all snippets
    const snippetIds = snippets.map(s => s.id);
    const folderFavoritesData = {};
    
    if (snippetIds.length > 0) {
      const favoritesQuery = `
        SELECT entity_id, folder_id, favorite_order 
        FROM folder_favorites 
        WHERE entity_type = 'snippet' 
        AND entity_id IN (${snippetIds.map(() => '?').join(',')})
      `;
      const favoritesStmt = db.prepare(favoritesQuery);
      const favorites = favoritesStmt.all(snippetIds);
      
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
    
    // Get folder associations for each snippet
    const folderStmt = db.prepare(`
      SELECT folder_id, f.name as folder_name 
      FROM item_folders if
      LEFT JOIN folders f ON if.folder_id = f.id
      WHERE if.item_type = 'snippet' AND if.item_id = ?
    `);
    
    // Parse JSON fields and add folder data
    const parsedSnippets = snippets.map(snippet => {
      const folders = folderStmt.all(snippet.id);
      
      return {
        ...snippet,
        tags: snippet.tags ? JSON.parse(snippet.tags) : [],
        favorite: Boolean(snippet.favorite),
        folderFavorites: folderFavoritesData[snippet.id] || {},
        folderIds: folders.map(f => f.folder_id),
        folderNames: folders.map(f => f.folder_name),
        // Keep backward compatibility
        folder_id: folders.length > 0 ? folders[0].folder_id : snippet.folder_id,
        folder_name: folders.length > 0 ? folders[0].folder_name : null
      };
    });
    
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
      SELECT s.* 
      FROM snippets s 
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
    
    // Get folder associations
    const folderStmt = db.prepare(`
      SELECT folder_id, f.name as folder_name 
      FROM item_folders if
      LEFT JOIN folders f ON if.folder_id = f.id
      WHERE if.item_type = 'snippet' AND if.item_id = ?
    `);
    const folders = folderStmt.all(id);
    
    // Get folder favorites for this snippet
    const favoritesStmt = db.prepare(`
      SELECT folder_id, favorite_order 
      FROM folder_favorites 
      WHERE entity_type = 'snippet' AND entity_id = ?
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
    
    // Parse JSON fields and add folder data
    const parsedSnippet = {
      ...snippet,
      tags: snippet.tags ? JSON.parse(snippet.tags) : [],
      favorite: Boolean(snippet.favorite),
      folderFavorites: folderFavorites,
      folderIds: folders.map(f => f.folder_id),
      folderNames: folders.map(f => f.folder_name),
      // Keep backward compatibility
      folder_id: folders.length > 0 ? folders[0].folder_id : snippet.folder_id,
      folder_name: folders.length > 0 ? folders[0].folder_name : null
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
    
    // Start transaction
    const transaction = db.transaction(() => {
      const folderIds = value.folderIds || (value.folder_id ? [value.folder_id] : ['snippets']);
      const folderFavorites = value.folderFavorites;
      const primaryFolderId = folderIds[0] || null;
      
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
        primaryFolderId,
        now,
        now
      );
      
      // Insert folder associations
      const folderStmt = db.prepare(`
        INSERT INTO item_folders (item_type, item_id, folder_id)
        VALUES ('snippet', ?, ?)
      `);
      
      folderIds.forEach(folderId => {
        if (folderId) {
          folderStmt.run(id, folderId);
        }
      });
      
      // Insert folder favorites if provided
      if (folderFavorites && typeof folderFavorites === 'object') {
        const insertFavStmt = db.prepare(`
          INSERT INTO folder_favorites (entity_type, entity_id, folder_id, favorite_order, created_at, updated_at)
          VALUES ('snippet', ?, ?, ?, ?, ?)
        `);
        
        Object.entries(folderFavorites).forEach(([folderId, favData]) => {
          if (favData && favData.isFavorite) {
            insertFavStmt.run(
              id,
              folderId,
              favData.favoriteOrder || 0,
              now,
              now
            );
          }
        });
      }
    });
    
    transaction();
    
    // Fetch the created snippet with folders and favorites
    const snippet = db.prepare('SELECT * FROM snippets WHERE id = ?').get(id);
    const folderStmt = db.prepare(`
      SELECT folder_id FROM item_folders 
      WHERE item_type = 'snippet' AND item_id = ?
    `);
    const folders = folderStmt.all(id);
    
    // Get folder favorites for this snippet
    const favoritesStmt = db.prepare(`
      SELECT folder_id, favorite_order 
      FROM folder_favorites 
      WHERE entity_type = 'snippet' AND entity_id = ?
    `);
    const favorites = favoritesStmt.all(id);
    
    // Build folderFavorites object
    const folderFavoritesData = {};
    favorites.forEach(fav => {
      folderFavoritesData[fav.folder_id] = {
        isFavorite: true,
        favoriteOrder: fav.favorite_order
      };
    });
    
    const parsedSnippet = {
      ...snippet,
      tags: snippet.tags ? JSON.parse(snippet.tags) : [],
      favorite: Boolean(snippet.favorite),
      folderIds: folders.map(f => f.folder_id),
      folderFavorites: folderFavoritesData
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
    
    // Start transaction
    const transaction = db.transaction(() => {
      // Handle folderIds and folderFavorites separately
      const folderIds = value.folderIds;
      const folderFavorites = value.folderFavorites;
      delete value.folderIds;
      delete value.folderFavorites;
      
      // Update primary folder if folderIds provided
      const primaryFolderId = folderIds && folderIds.length > 0 ? folderIds[0] : undefined;
      
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
        primaryFolderId !== undefined ? primaryFolderId : (value.folder_id !== undefined ? value.folder_id : null),
        now,
        id
      );
      
      // Update folder associations if provided
      if (folderIds && folderIds.length > 0) {
        // Delete existing associations
        const deleteStmt = db.prepare(`
          DELETE FROM item_folders 
          WHERE item_type = 'snippet' AND item_id = ?
        `);
        deleteStmt.run(id);
        
        // Insert new associations
        const insertStmt = db.prepare(`
          INSERT INTO item_folders (item_type, item_id, folder_id)
          VALUES ('snippet', ?, ?)
        `);
        
        folderIds.forEach(folderId => {
          if (folderId) {
            insertStmt.run(id, folderId);
          }
        });
      }
      
      // Update folder favorites if provided
      if (folderFavorites && typeof folderFavorites === 'object') {
        // Delete existing folder favorites for this snippet
        const deleteFavStmt = db.prepare(`
          DELETE FROM folder_favorites 
          WHERE entity_type = 'snippet' AND entity_id = ?
        `);
        deleteFavStmt.run(id);
        
        // Insert new folder favorites
        const insertFavStmt = db.prepare(`
          INSERT INTO folder_favorites (entity_type, entity_id, folder_id, favorite_order, created_at, updated_at)
          VALUES ('snippet', ?, ?, ?, ?, ?)
        `);
        
        Object.entries(folderFavorites).forEach(([folderId, favData]) => {
          if (favData && favData.isFavorite) {
            insertFavStmt.run(
              id,
              folderId,
              favData.favoriteOrder || 0,
              now,
              now
            );
          }
        });
      }
    });
    
    transaction();
    
    // Fetch the updated snippet with folders and favorites
    const snippet = db.prepare('SELECT * FROM snippets WHERE id = ?').get(id);
    const folderStmt = db.prepare(`
      SELECT folder_id FROM item_folders 
      WHERE item_type = 'snippet' AND item_id = ?
    `);
    const folders = folderStmt.all(id);
    
    // Get folder favorites for this snippet
    const favoritesStmt = db.prepare(`
      SELECT folder_id, favorite_order 
      FROM folder_favorites 
      WHERE entity_type = 'snippet' AND entity_id = ?
    `);
    const favorites = favoritesStmt.all(id);
    
    // Build folderFavorites object
    const folderFavoritesData = {};
    favorites.forEach(fav => {
      folderFavoritesData[fav.folder_id] = {
        isFavorite: true,
        favoriteOrder: fav.favorite_order
      };
    });
    
    const parsedSnippet = {
      ...snippet,
      tags: snippet.tags ? JSON.parse(snippet.tags) : [],
      favorite: Boolean(snippet.favorite),
      folderIds: folders.map(f => f.folder_id),
      folderFavorites: folderFavoritesData
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
    
    // Start transaction to delete snippet and associations
    const transaction = db.transaction(() => {
      // Delete folder associations
      const folderStmt = db.prepare('DELETE FROM item_folders WHERE item_type = ? AND item_id = ?');
      folderStmt.run('snippet', id);
      
      // Delete folder favorites
      const favoritesStmt = db.prepare('DELETE FROM folder_favorites WHERE entity_type = ? AND entity_id = ?');
      favoritesStmt.run('snippet', id);
      
      // Delete snippet
      const deleteStmt = db.prepare('DELETE FROM snippets WHERE id = ?');
      deleteStmt.run(id);
    });
    
    transaction();
    
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