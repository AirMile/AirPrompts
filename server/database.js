import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let db = null;

export const initializeDatabase = async () => {
  try {
    // Create database connection
    const dbPath = join(__dirname, 'database.db');
    db = new Database(dbPath);
    
    // Enable foreign key support
    db.pragma('foreign_keys = ON');
    db.pragma('journal_mode = WAL');
    
    console.log('📁 Database connected:', dbPath);
    
    // Create tables
    createTables();
    
    // Create indexes for performance
    createIndexes();
    
    // Seed default folders
    await seedDefaultFolders();
    
    console.log('✅ Database schema initialized successfully');
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
};

const createTables = () => {
  // Templates table
  db.exec(`
    CREATE TABLE IF NOT EXISTS templates (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      content TEXT NOT NULL,
      category TEXT NOT NULL,
      variables TEXT, -- JSON array of variable names
      favorite BOOLEAN DEFAULT FALSE,
      folder_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE SET NULL
    )
  `);
  
  // Workflows table
  db.exec(`
    CREATE TABLE IF NOT EXISTS workflows (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      category TEXT NOT NULL,
      favorite BOOLEAN DEFAULT FALSE,
      folder_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE SET NULL
    )
  `);
  
  // Workflow steps table
  db.exec(`
    CREATE TABLE IF NOT EXISTS workflow_steps (
      id TEXT PRIMARY KEY,
      workflow_id TEXT NOT NULL,
      template_id TEXT NOT NULL,
      step_order INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE CASCADE,
      FOREIGN KEY (template_id) REFERENCES templates(id) ON DELETE CASCADE,
      UNIQUE(workflow_id, step_order)
    )
  `);
  
  // Snippets table
  db.exec(`
    CREATE TABLE IF NOT EXISTS snippets (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      content TEXT NOT NULL,
      category TEXT, -- Made optional, no longer required
      tags TEXT, -- JSON array of tags
      favorite BOOLEAN DEFAULT FALSE,
      folder_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE SET NULL
    )
  `);
  
  // Folders table
  db.exec(`
    CREATE TABLE IF NOT EXISTS folders (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      parent_id TEXT,
      sort_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (parent_id) REFERENCES folders(id) ON DELETE CASCADE
    )
  `);
  
  // Add sort_order column to existing folders table if it doesn't exist
  try {
    db.exec(`ALTER TABLE folders ADD COLUMN sort_order INTEGER DEFAULT 0`);
    console.log('📁 Added sort_order column to folders table');
  } catch (error) {
    // Column already exists, which is fine
    if (!error.message.includes('duplicate column name')) {
      console.warn('Warning adding sort_order column:', error.message);
    }
  }
  
  // Item folders table for many-to-many relationships
  db.exec(`
    CREATE TABLE IF NOT EXISTS item_folders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      item_type TEXT NOT NULL, -- 'template', 'workflow', or 'snippet'
      item_id TEXT NOT NULL,
      folder_id TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE CASCADE,
      UNIQUE(item_type, item_id, folder_id)
    )
  `);
  
  // Folder favorites table for folder-specific favorites
  db.exec(`
    CREATE TABLE IF NOT EXISTS folder_favorites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      entity_type TEXT NOT NULL, -- 'template', 'workflow', or 'snippet'
      entity_id TEXT NOT NULL,
      folder_id TEXT NOT NULL,
      favorite_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE CASCADE,
      UNIQUE(entity_type, entity_id, folder_id)
    )
  `);
  
  // Usage stats table for future analytics
  db.exec(`
    CREATE TABLE IF NOT EXISTS usage_stats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      entity_type TEXT NOT NULL, -- 'template' or 'workflow'
      entity_id TEXT NOT NULL,
      action TEXT NOT NULL, -- 'view', 'execute', 'edit', 'delete'
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  // Folder UI state table for persisting collapsed/expanded status
  db.exec(`
    CREATE TABLE IF NOT EXISTS folder_ui_state (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      folder_id TEXT NOT NULL,
      is_expanded BOOLEAN DEFAULT TRUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE CASCADE,
      UNIQUE(folder_id)
    )
  `);
  
  // Header UI state table for persisting collapsed/expanded status per folder
  db.exec(`
    CREATE TABLE IF NOT EXISTS header_ui_state (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      folder_id TEXT NOT NULL,
      header_type TEXT NOT NULL, -- 'templates', 'workflows', 'snippets', etc.
      is_expanded BOOLEAN DEFAULT TRUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE CASCADE,
      UNIQUE(folder_id, header_type)
    )
  `);
  
  console.log('📋 Database tables created successfully');
};

const createIndexes = () => {
  // Performance indexes
  db.exec(`CREATE INDEX IF NOT EXISTS idx_templates_category ON templates(category)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_templates_favorite ON templates(favorite)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_templates_folder ON templates(folder_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_templates_updated ON templates(updated_at)`);
  
  db.exec(`CREATE INDEX IF NOT EXISTS idx_workflows_category ON workflows(category)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_workflows_favorite ON workflows(favorite)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_workflows_folder ON workflows(folder_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_workflows_updated ON workflows(updated_at)`);
  
  db.exec(`CREATE INDEX IF NOT EXISTS idx_workflow_steps_workflow ON workflow_steps(workflow_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_workflow_steps_order ON workflow_steps(workflow_id, step_order)`);
  
  db.exec(`CREATE INDEX IF NOT EXISTS idx_folders_parent ON folders(parent_id)`);
  
  db.exec(`CREATE INDEX IF NOT EXISTS idx_item_folders_item ON item_folders(item_type, item_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_item_folders_folder ON item_folders(folder_id)`);
  
  db.exec(`CREATE INDEX IF NOT EXISTS idx_folder_favorites_entity ON folder_favorites(entity_type, entity_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_folder_favorites_folder ON folder_favorites(folder_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_folder_favorites_composite ON folder_favorites(folder_id, entity_type)`);
  
  db.exec(`CREATE INDEX IF NOT EXISTS idx_usage_stats_entity ON usage_stats(entity_type, entity_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_usage_stats_timestamp ON usage_stats(timestamp)`);
  
  db.exec(`CREATE INDEX IF NOT EXISTS idx_folder_ui_state_folder ON folder_ui_state(folder_id)`);
  
  db.exec(`CREATE INDEX IF NOT EXISTS idx_header_ui_state_folder ON header_ui_state(folder_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_header_ui_state_composite ON header_ui_state(folder_id, header_type)`);
  
  console.log('🔍 Database indexes created successfully');
};

const seedDefaultFolders = async () => {
  try {
    // Check if folders already exist
    const existingFolders = db.prepare('SELECT COUNT(*) as count FROM folders').get();
    
    if (existingFolders.count > 0) {
      console.log('📁 Folders already exist, skipping seeding');
      return;
    }
    
    // Load default folders from JSON file
    const defaultFoldersPath = join(__dirname, '..', 'src', 'data', 'defaultFolders.json');
    const defaultFoldersContent = readFileSync(defaultFoldersPath, 'utf8');
    const defaultFolders = JSON.parse(defaultFoldersContent);
    
    // Insert folders in order (parents first)
    const insertFolder = db.prepare(`
      INSERT OR IGNORE INTO folders (id, name, description, parent_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    const insertTransaction = db.transaction((folders) => {
      folders.forEach(folder => {
        insertFolder.run(
          folder.id,
          folder.name,
          folder.description || null,
          folder.parentId,
          folder.createdAt,
          folder.updatedAt
        );
      });
    });
    
    insertTransaction(defaultFolders);
    
    console.log(`✅ Seeded ${defaultFolders.length} default folders`);
    
  } catch (error) {
    console.error('❌ Error seeding default folders:', error);
    // Don't throw the error, as this is not critical for app functionality
  }
};

// Get database instance
export const getDatabase = () => {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return db;
};

// Close database connection
export const closeDatabase = () => {
  if (db) {
    db.close();
    db = null;
    console.log('🔐 Database connection closed');
  }
};

// Handle process termination
process.on('SIGINT', () => {
  closeDatabase();
  process.exit(0);
});

process.on('SIGTERM', () => {
  closeDatabase();
  process.exit(0);
});