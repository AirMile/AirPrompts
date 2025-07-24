import express from 'express';
import Joi from 'joi';
import { randomUUID } from 'crypto';
import { getDatabase } from '../database.js';

const router = express.Router();

// Validation schemas
const templateSchema = Joi.object({
  name: Joi.string().min(1).max(255).required(),
  description: Joi.string().allow('').max(1000),
  content: Joi.string().min(1).required(),
  category: Joi.string().min(1).max(100).required(),
  variables: Joi.array().items(Joi.string()),
  favorite: Joi.boolean().default(false),
  folder_id: Joi.string().allow(null),
  folderIds: Joi.array().items(Joi.string()).min(1)
});

const updateTemplateSchema = templateSchema.fork(['name', 'content', 'category'], (schema) => schema.optional());

// Helper function to extract variables from content
const extractVariables = (content) => {
  const variableRegex = /\{([^}]+)\}/g;
  const variables = [];
  let match;
  
  while ((match = variableRegex.exec(content)) !== null) {
    const variable = match[1].trim();
    if (!variables.includes(variable)) {
      variables.push(variable);
    }
  }
  
  return variables;
};

// GET /api/templates - Get all templates
router.get('/', (req, res) => {
  try {
    const db = getDatabase();
    const { category, favorite, folder_id, limit, offset } = req.query;
    
    let query = `
      SELECT DISTINCT t.* 
      FROM templates t 
      LEFT JOIN item_folders if ON if.item_type = 'template' AND if.item_id = t.id
      WHERE 1=1
    `;
    const params = [];
    
    if (category) {
      query += ` AND t.category = ?`;
      params.push(category);
    }
    
    if (favorite !== undefined) {
      query += ` AND t.favorite = ?`;
      params.push(favorite === 'true');
    }
    
    if (folder_id) {
      query += ` AND (if.folder_id = ? OR t.folder_id = ?)`;
      params.push(folder_id, folder_id);
    }
    
    query += ` ORDER BY t.updated_at DESC`;
    
    if (limit) {
      query += ` LIMIT ?`;
      params.push(parseInt(limit));
      
      if (offset) {
        query += ` OFFSET ?`;
        params.push(parseInt(offset));
      }
    }
    
    const stmt = db.prepare(query);
    const templates = stmt.all(params);
    
    // Get folder associations for each template
    const folderStmt = db.prepare(`
      SELECT folder_id, f.name as folder_name 
      FROM item_folders if
      LEFT JOIN folders f ON if.folder_id = f.id
      WHERE if.item_type = 'template' AND if.item_id = ?
    `);
    
    templates.forEach(template => {
      const folders = folderStmt.all(template.id);
      template.folderIds = folders.map(f => f.folder_id);
      template.folderNames = folders.map(f => f.folder_name);
      // Keep backward compatibility
      if (folders.length > 0) {
        template.folder_id = folders[0].folder_id;
        template.folder_name = folders[0].folder_name;
      }
    });
    
    // Get folder favorites for all templates
    const templateIds = templates.map(t => t.id);
    const folderFavoritesData = {};
    
    if (templateIds.length > 0) {
      const favoritesQuery = `
        SELECT entity_id, folder_id, favorite_order 
        FROM folder_favorites 
        WHERE entity_type = 'template' 
        AND entity_id IN (${templateIds.map(() => '?').join(',')})
      `;
      const favoritesStmt = db.prepare(favoritesQuery);
      const favorites = favoritesStmt.all(templateIds);
      
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
    
    // Parse variables JSON and add folderFavorites
    const processedTemplates = templates.map(template => ({
      ...template,
      variables: template.variables ? JSON.parse(template.variables) : [],
      favorite: Boolean(template.favorite),
      folderFavorites: folderFavoritesData[template.id] || {}
    }));
    
    res.json({
      success: true,
      data: processedTemplates,
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0'
      }
    });
    
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_ERROR',
        message: 'Failed to fetch templates'
      },
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0'
      }
    });
  }
});

// GET /api/templates/:id - Get single template
router.get('/:id', (req, res) => {
  try {
    const db = getDatabase();
    const { id } = req.params;
    
    const stmt = db.prepare(`
      SELECT t.* 
      FROM templates t 
      WHERE t.id = ?
    `);
    const template = stmt.get(id);
    
    if (!template) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Template not found'
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
      WHERE if.item_type = 'template' AND if.item_id = ?
    `);
    const folders = folderStmt.all(id);
    template.folderIds = folders.map(f => f.folder_id);
    template.folderNames = folders.map(f => f.folder_name);
    // Keep backward compatibility
    if (folders.length > 0) {
      template.folder_id = folders[0].folder_id;
      template.folder_name = folders[0].folder_name;
    }
    
    // Get folder favorites for this template
    const favoritesStmt = db.prepare(`
      SELECT folder_id, favorite_order 
      FROM folder_favorites 
      WHERE entity_type = 'template' AND entity_id = ?
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
    
    // Parse variables JSON and convert favorite to boolean
    template.variables = template.variables ? JSON.parse(template.variables) : [];
    template.favorite = Boolean(template.favorite);
    template.folderFavorites = folderFavorites;
    
    res.json({
      success: true,
      data: template,
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0'
      }
    });
    
  } catch (error) {
    console.error('Error fetching template:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_ERROR',
        message: 'Failed to fetch template'
      },
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0'
      }
    });
  }
});

// POST /api/templates - Create new template
router.post('/', (req, res) => {
  try {
    const { error, value } = templateSchema.validate(req.body);
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
    
    // Extract variables from content
    const variables = extractVariables(value.content);
    
    // Start transaction
    const transaction = db.transaction(() => {
      // Insert template
      const stmt = db.prepare(`
        INSERT INTO templates (id, name, description, content, category, variables, favorite, folder_id, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      const folderIds = value.folderIds || (value.folder_id ? [value.folder_id] : ['general']);
      const primaryFolderId = folderIds[0] || null;
      
      stmt.run(
        id,
        value.name,
        value.description || null,
        value.content,
        value.category,
        JSON.stringify(variables),
        value.favorite ? 1 : 0,
        primaryFolderId,
        now,
        now
      );
      
      // Insert folder associations
      const folderStmt = db.prepare(`
        INSERT INTO item_folders (item_type, item_id, folder_id)
        VALUES ('template', ?, ?)
      `);
      
      folderIds.forEach(folderId => {
        if (folderId) {
          folderStmt.run(id, folderId);
        }
      });
    });
    
    transaction();
    
    // Return the created template
    const newTemplate = {
      id,
      ...value,
      variables,
      folderIds: value.folderIds || (value.folder_id ? [value.folder_id] : ['general']),
      created_at: now,
      updated_at: now
    };
    
    res.status(201).json({
      success: true,
      data: newTemplate,
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0'
      }
    });
    
  } catch (error) {
    console.error('Error creating template:', error);
    console.error('Error details:', error.message);
    console.error('Request data:', value);
    res.status(500).json({
      success: false,
      error: {
        code: 'CREATE_ERROR',
        message: `Failed to create template: ${error.message}`
      },
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0'
      }
    });
  }
});

// PUT /api/templates/:id - Update template
router.put('/:id', (req, res) => {
  try {
    const { error, value } = updateTemplateSchema.validate(req.body);
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
    
    // Check if template exists
    const existingStmt = db.prepare('SELECT id FROM templates WHERE id = ?');
    const existing = existingStmt.get(id);
    
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Template not found'
        },
        meta: {
          timestamp: new Date().toISOString(),
          version: '1.0'
        }
      });
    }
    
    // Extract variables if content is being updated
    let variables;
    if (value.content) {
      variables = extractVariables(value.content);
    }
    
    // Start transaction
    const transaction = db.transaction(() => {
      const updateFields = [];
      const updateParams = [];
      
      // Handle folderIds separately
      const folderIds = value.folderIds;
      delete value.folderIds;
      
      Object.keys(value).forEach(key => {
        if (value[key] !== undefined) {
          updateFields.push(`${key} = ?`);
          // Convert boolean to integer for SQLite
          if (key === 'favorite') {
            updateParams.push(value[key] ? 1 : 0);
          } else {
            updateParams.push(value[key]);
          }
        }
      });
      
      if (variables) {
        updateFields.push('variables = ?');
        updateParams.push(JSON.stringify(variables));
      }
      
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
          UPDATE templates 
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
          WHERE item_type = 'template' AND item_id = ?
        `);
        deleteStmt.run(id);
        
        // Insert new associations
        const insertStmt = db.prepare(`
          INSERT INTO item_folders (item_type, item_id, folder_id)
          VALUES ('template', ?, ?)
        `);
        
        folderIds.forEach(folderId => {
          if (folderId) {
            insertStmt.run(id, folderId);
          }
        });
      }
    });
    
    transaction();
    
    // Return updated template with folders
    const getStmt = db.prepare('SELECT * FROM templates WHERE id = ?');
    const updatedTemplate = getStmt.get(id);
    
    // Get folder associations
    const folderStmt = db.prepare(`
      SELECT folder_id FROM item_folders 
      WHERE item_type = 'template' AND item_id = ?
    `);
    const folders = folderStmt.all(id);
    
    updatedTemplate.variables = JSON.parse(updatedTemplate.variables || '[]');
    updatedTemplate.favorite = Boolean(updatedTemplate.favorite);
    updatedTemplate.folderIds = folders.map(f => f.folder_id);
    
    res.json({
      success: true,
      data: updatedTemplate,
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0'
      }
    });
    
  } catch (error) {
    console.error('Error updating template:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'UPDATE_ERROR',
        message: 'Failed to update template'
      },
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0'
      }
    });
  }
});

// DELETE /api/templates/:id - Delete template
router.delete('/:id', (req, res) => {
  try {
    const db = getDatabase();
    const { id } = req.params;
    
    // Start transaction to delete template and associations
    const transaction = db.transaction(() => {
      // Delete folder associations
      const folderStmt = db.prepare('DELETE FROM item_folders WHERE item_type = ? AND item_id = ?');
      folderStmt.run('template', id);
      
      // Delete template
      const stmt = db.prepare('DELETE FROM templates WHERE id = ?');
      return stmt.run(id);
    });
    
    const result = transaction();
    
    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Template not found'
        },
        meta: {
          timestamp: new Date().toISOString(),
          version: '1.0'
        }
      });
    }
    
    res.json({
      success: true,
      data: { message: 'Template deleted successfully' },
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0'
      }
    });
    
  } catch (error) {
    console.error('Error deleting template:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'DELETE_ERROR',
        message: 'Failed to delete template'
      },
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0'
      }
    });
  }
});

export default router;