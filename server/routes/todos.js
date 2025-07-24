import express from 'express';
import { getDatabase } from '../database.js';
import { validateTodo } from '../validation.js';

const router = express.Router();

// Get all todos with optional filters
router.get('/', (req, res) => {
  try {
    const db = getDatabase();
    const { folder_id, status, priority, show_global = 'true' } = req.query;
    
    let query = `
      SELECT 
        t.*,
        GROUP_CONCAT(tf.folder_id) as folder_ids,
        GROUP_CONCAT(f.name) as folder_names
      FROM todos t
      LEFT JOIN todo_folders tf ON t.id = tf.todo_id
      LEFT JOIN folders f ON tf.folder_id = f.id
      WHERE 1=1
    `;
    
    const params = [];
    
    // Filter by folder or global todos
    if (folder_id) {
      // Special case: if folder_id is 'root', also include todos with NULL folder_id
      if (folder_id === 'root') {
        query += ` AND (t.folder_id = ? OR t.folder_id IS NULL OR t.id IN (SELECT todo_id FROM todo_folders WHERE folder_id = ?)`;
        params.push(folder_id, folder_id);
        
        if (show_global === 'true') {
          query += ` OR t.is_global = 1`;
        }
        query += ')';
      } else {
        query += ` AND (t.folder_id = ? OR t.id IN (SELECT todo_id FROM todo_folders WHERE folder_id = ?)`;
        params.push(folder_id, folder_id);
        
        if (show_global === 'true') {
          query += ` OR t.is_global = 1`;
        }
        query += ')';
      }
    } else if (show_global === 'true') {
      // Show only global todos when no folder is selected
      query += ` AND t.is_global = 1`;
    }
    
    // Filter by status
    if (status) {
      query += ` AND t.status = ?`;
      params.push(status);
    }
    
    // Filter by priority
    if (priority) {
      query += ` AND t.priority = ?`;
      params.push(priority);
    }
    
    query += `
      GROUP BY t.id
      ORDER BY 
        CASE t.priority
          WHEN 'critical' THEN 1
          WHEN 'important' THEN 2
          WHEN 'should' THEN 3
          WHEN 'could' THEN 4
          WHEN 'nice_to_have' THEN 5
        END,
        t.sort_order,
        t.created_at DESC
    `;
    
    const todos = db.prepare(query).all(...params);
    
    // Parse folder_ids and folder_names from comma-separated strings to arrays
    const todosWithFolders = todos.map(todo => ({
      ...todo,
      folder_ids: todo.folder_ids ? todo.folder_ids.split(',') : [],
      folder_names: todo.folder_names ? todo.folder_names.split(',') : []
    }));
    
    res.json(todosWithFolders);
  } catch (error) {
    console.error('Error fetching todos:', error);
    res.status(500).json({ error: 'Failed to fetch todos' });
  }
});

// Get single todo
router.get('/:id', (req, res) => {
  try {
    const db = getDatabase();
    const { id } = req.params;
    
    const todo = db.prepare(`
      SELECT 
        t.*,
        GROUP_CONCAT(tf.folder_id) as folder_ids,
        GROUP_CONCAT(f.name) as folder_names
      FROM todos t
      LEFT JOIN todo_folders tf ON t.id = tf.todo_id
      LEFT JOIN folders f ON tf.folder_id = f.id
      WHERE t.id = ?
      GROUP BY t.id
    `).get(id);
    
    if (!todo) {
      return res.status(404).json({ error: 'Todo not found' });
    }
    
    // Parse folder_ids and folder_names
    todo.folder_ids = todo.folder_ids ? todo.folder_ids.split(',') : [];
    todo.folder_names = todo.folder_names ? todo.folder_names.split(',') : [];
    
    res.json(todo);
  } catch (error) {
    console.error('Error fetching todo:', error);
    res.status(500).json({ error: 'Failed to fetch todo' });
  }
});

// Create new todo
router.post('/', (req, res) => {
  console.log('[DEBUG SERVER] POST /api/todos - Request body:', JSON.stringify(req.body, null, 2));
  
  try {
    const db = getDatabase();
    console.log('[DEBUG SERVER] Database connection obtained');
    
    const validation = validateTodo(req.body);
    console.log('[DEBUG SERVER] Validation result:', validation);
    
    if (!validation.valid) {
      console.log('[DEBUG SERVER] Validation failed:', validation.errors);
      return res.status(400).json({ errors: validation.errors });
    }
    
    const {
      title,
      description,
      status = 'to_do',
      priority = 'could',
      time_estimate,
      deadline,
      deadline_type,
      is_global = false,
      folder_id,
      folder_ids = []
    } = req.body;
    
    console.log('[DEBUG SERVER] Extracted data:', {
      title, description, status, priority, time_estimate,
      deadline, deadline_type, is_global, folder_id, folder_ids
    });
    
    // Calculate automatic deadline from time_estimate if no deadline provided
    let calculatedDeadline = deadline;
    let calculatedDeadlineType = deadline_type;
    
    if (!deadline && time_estimate) {
      const now = new Date();
      
      switch (time_estimate) {
        case '1h':
          calculatedDeadline = new Date(now.getTime() + (1 * 60 * 60 * 1000)).toISOString().split('T')[0];
          calculatedDeadlineType = 'relative';
          break;
        case 'few_hours':
          calculatedDeadline = new Date(now.getTime() + (4 * 60 * 60 * 1000)).toISOString().split('T')[0];
          calculatedDeadlineType = 'relative';
          break;
        case 'day':
          calculatedDeadline = new Date(now.getTime() + (1 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0];
          calculatedDeadlineType = 'relative';
          break;
        case 'days':
          calculatedDeadline = new Date(now.getTime() + (3 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0];
          calculatedDeadlineType = 'relative';
          break;
        case 'week':
          calculatedDeadline = new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0];
          calculatedDeadlineType = 'relative';
          break;
        case 'weeks':
          calculatedDeadline = new Date(now.getTime() + (4 * 7 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0];
          calculatedDeadlineType = 'relative';
          break;
      }
      
      console.log('[DEBUG SERVER] Auto-calculated deadline:', {
        time_estimate, 
        original_deadline: deadline,
        calculated_deadline: calculatedDeadline,
        deadline_type: calculatedDeadlineType
      });
    }
    
    // Debug: Check if folder exists and handle invalid folder_id
    let validFolderId = folder_id;
    if (folder_id) {
      const folderExists = db.prepare('SELECT id, name FROM folders WHERE id = ?').get(folder_id);
      console.log('[DEBUG SERVER] Folder check for ID:', folder_id, 'Result:', folderExists);
      
      if (!folderExists) {
        console.log('[DEBUG SERVER] Folder not found, setting to NULL. Available folders:');
        const allFolders = db.prepare('SELECT id, name FROM folders').all();
        allFolders.forEach(f => console.log(`  - ${f.id}: ${f.name}`));
        validFolderId = null; // Set to NULL if folder doesn't exist
      }
    }
    
    // Start transaction
    const insertTodo = db.transaction(() => {
      console.log('[DEBUG SERVER] Starting transaction');
      
      // Insert todo
      const result = db.prepare(`
        INSERT INTO todos (
          title, description, status, priority, time_estimate,
          deadline, deadline_type, is_global, folder_id, sort_order
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 
          (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM todos WHERE folder_id = ?)
        )
      `).run(
        title, description, status, priority, time_estimate || null,
        calculatedDeadline, calculatedDeadlineType, is_global ? 1 : 0, validFolderId,
        validFolderId
      );
      
      console.log('[DEBUG SERVER] Insert result:', result);
      const todoId = result.lastInsertRowid;
      console.log('[DEBUG SERVER] Created todo with ID:', todoId);
      
      // Add to multiple folders if specified
      if (folder_ids.length > 0) {
        const insertFolderRelation = db.prepare(`
          INSERT INTO todo_folders (todo_id, folder_id) VALUES (?, ?)
        `);
        
        folder_ids.forEach(folderId => {
          insertFolderRelation.run(todoId, folderId);
        });
      }
      
      // Add primary folder to todo_folders if not already included
      if (validFolderId && !folder_ids.includes(validFolderId)) {
        db.prepare(`
          INSERT INTO todo_folders (todo_id, folder_id) VALUES (?, ?)
        `).run(todoId, validFolderId);
      }
      
      return todoId;
    });
    
    const todoId = insertTodo();
    
    // Fetch the created todo with folder info
    const newTodo = db.prepare(`
      SELECT 
        t.*,
        GROUP_CONCAT(tf.folder_id) as folder_ids,
        GROUP_CONCAT(f.name) as folder_names
      FROM todos t
      LEFT JOIN todo_folders tf ON t.id = tf.todo_id
      LEFT JOIN folders f ON tf.folder_id = f.id
      WHERE t.id = ?
      GROUP BY t.id
    `).get(todoId);
    
    newTodo.folder_ids = newTodo.folder_ids ? newTodo.folder_ids.split(',') : [];
    newTodo.folder_names = newTodo.folder_names ? newTodo.folder_names.split(',') : [];
    
    res.status(201).json(newTodo);
  } catch (error) {
    console.error('[DEBUG SERVER] Error creating todo:', error);
    console.error('[DEBUG SERVER] Error stack:', error.stack);
    res.status(500).json({ error: 'Failed to create todo', details: error.message });
  }
});

// Update todo
router.put('/:id', (req, res) => {
  try {
    const db = getDatabase();
    const { id } = req.params;
    const validation = validateTodo(req.body);
    
    if (!validation.valid) {
      return res.status(400).json({ errors: validation.errors });
    }
    
    const {
      title,
      description,
      status,
      priority,
      time_estimate,
      deadline,
      deadline_type,
      is_global,
      folder_id,
      folder_ids
    } = req.body;
    
    // Check if todo exists
    const existingTodo = db.prepare('SELECT * FROM todos WHERE id = ?').get(id);
    if (!existingTodo) {
      return res.status(404).json({ error: 'Todo not found' });
    }
    
    // Update transaction
    const updateTodo = db.transaction(() => {
      // Update todo
      db.prepare(`
        UPDATE todos SET
          title = ?,
          description = ?,
          status = ?,
          priority = ?,
          time_estimate = ?,
          deadline = ?,
          deadline_type = ?,
          is_global = ?,
          folder_id = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(
        title, description, status, priority, time_estimate,
        deadline, deadline_type, is_global ? 1 : 0, folder_id,
        id
      );
      
      // Update folder associations if provided
      if (folder_ids !== undefined) {
        // Remove existing associations
        db.prepare('DELETE FROM todo_folders WHERE todo_id = ?').run(id);
        
        // Add new associations
        if (folder_ids.length > 0) {
          const insertFolderRelation = db.prepare(`
            INSERT INTO todo_folders (todo_id, folder_id) VALUES (?, ?)
          `);
          
          folder_ids.forEach(folderId => {
            insertFolderRelation.run(id, folderId);
          });
        }
      }
    });
    
    updateTodo();
    
    // Fetch updated todo
    const updatedTodo = db.prepare(`
      SELECT 
        t.*,
        GROUP_CONCAT(tf.folder_id) as folder_ids,
        GROUP_CONCAT(f.name) as folder_names
      FROM todos t
      LEFT JOIN todo_folders tf ON t.id = tf.todo_id
      LEFT JOIN folders f ON tf.folder_id = f.id
      WHERE t.id = ?
      GROUP BY t.id
    `).get(id);
    
    updatedTodo.folder_ids = updatedTodo.folder_ids ? updatedTodo.folder_ids.split(',') : [];
    updatedTodo.folder_names = updatedTodo.folder_names ? updatedTodo.folder_names.split(',') : [];
    
    res.json(updatedTodo);
  } catch (error) {
    console.error('Error updating todo:', error);
    res.status(500).json({ error: 'Failed to update todo' });
  }
});

// Update todo status
router.patch('/:id/status', (req, res) => {
  try {
    const db = getDatabase();
    const { id } = req.params;
    const { status } = req.body;
    
    if (!['to_do', 'doing', 'done'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    const result = db.prepare(`
      UPDATE todos SET 
        status = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(status, id);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Todo not found' });
    }
    
    const updatedTodo = db.prepare('SELECT * FROM todos WHERE id = ?').get(id);
    res.json(updatedTodo);
  } catch (error) {
    console.error('Error updating todo status:', error);
    res.status(500).json({ error: 'Failed to update todo status' });
  }
});

// Delete todo
router.delete('/:id', (req, res) => {
  try {
    const db = getDatabase();
    const { id } = req.params;
    
    const result = db.prepare('DELETE FROM todos WHERE id = ?').run(id);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Todo not found' });
    }
    
    res.json({ message: 'Todo deleted successfully' });
  } catch (error) {
    console.error('Error deleting todo:', error);
    res.status(500).json({ error: 'Failed to delete todo' });
  }
});

// Batch update sort order
router.patch('/batch-sort-order', (req, res) => {
  try {
    const db = getDatabase();
    const { updates } = req.body;
    
    if (!Array.isArray(updates)) {
      return res.status(400).json({ error: 'Updates must be an array' });
    }
    
    const updateSortOrder = db.prepare(`
      UPDATE todos SET sort_order = ? WHERE id = ?
    `);
    
    const transaction = db.transaction(() => {
      updates.forEach(({ id, sort_order }) => {
        updateSortOrder.run(sort_order, id);
      });
    });
    
    transaction();
    
    res.json({ message: 'Sort order updated successfully' });
  } catch (error) {
    console.error('Error updating sort order:', error);
    res.status(500).json({ error: 'Failed to update sort order' });
  }
});

// Get todo stats for a folder
router.get('/stats/:folderId', (req, res) => {
  try {
    const db = getDatabase();
    const { folderId } = req.params;
    
    const stats = db.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'to_do' THEN 1 ELSE 0 END) as to_do,
        SUM(CASE WHEN status = 'doing' THEN 1 ELSE 0 END) as doing,
        SUM(CASE WHEN status = 'done' THEN 1 ELSE 0 END) as done,
        SUM(CASE WHEN priority = 'critical' THEN 1 ELSE 0 END) as critical,
        SUM(CASE WHEN priority = 'important' THEN 1 ELSE 0 END) as important
      FROM todos t
      WHERE t.folder_id = ? 
         OR t.id IN (SELECT todo_id FROM todo_folders WHERE folder_id = ?)
         OR t.is_global = 1
    `).get(folderId, folderId);
    
    res.json(stats);
  } catch (error) {
    console.error('Error fetching todo stats:', error);
    res.status(500).json({ error: 'Failed to fetch todo stats' });
  }
});

export default router;