import { getDatabase } from '../database.js';

export const runFoldersMigration = () => {
  const db = getDatabase();
  
  console.log('🔄 Starting multi-folder migration...');
  
  try {
    // Create item_folders junction table for many-to-many relationships
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
    
    // Create indexes for performance
    db.exec(`CREATE INDEX IF NOT EXISTS idx_item_folders_item ON item_folders(item_type, item_id)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_item_folders_folder ON item_folders(folder_id)`);
    
    console.log('✅ Created item_folders table');
    
    // Migrate existing folder_id values to item_folders table
    const migrateExisting = db.transaction(() => {
      // Migrate templates
      const templates = db.prepare('SELECT id, folder_id FROM templates WHERE folder_id IS NOT NULL').all();
      const insertStmt = db.prepare(`
        INSERT OR IGNORE INTO item_folders (item_type, item_id, folder_id) 
        VALUES (?, ?, ?)
      `);
      
      templates.forEach(template => {
        insertStmt.run('template', template.id, template.folder_id);
      });
      console.log(`✅ Migrated ${templates.length} templates`);
      
      // Migrate workflows
      const workflows = db.prepare('SELECT id, folder_id FROM workflows WHERE folder_id IS NOT NULL').all();
      workflows.forEach(workflow => {
        insertStmt.run('workflow', workflow.id, workflow.folder_id);
      });
      console.log(`✅ Migrated ${workflows.length} workflows`);
      
      // Migrate snippets
      const snippets = db.prepare('SELECT id, folder_id FROM snippets WHERE folder_id IS NOT NULL').all();
      snippets.forEach(snippet => {
        insertStmt.run('snippet', snippet.id, snippet.folder_id);
      });
      console.log(`✅ Migrated ${snippets.length} snippets`);
    });
    
    migrateExisting();
    
    console.log('🎉 Multi-folder migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
};

// Run migration if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runFoldersMigration();
}