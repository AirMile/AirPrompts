import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Import routes
import templatesRouter from './routes/templates.js';
import workflowsRouter from './routes/workflows.js';
import snippetsRouter from './routes/snippets.js';
import foldersRouter from './routes/folders.js';
import folderFavoritesRouter from './routes/folderFavorites.js';
import uiStateRouter from './routes/uiState.js';
import migrationRouter from './routes/migration.js';
// import migrationAdvancedRouter from './routes/migration-advanced.js';
import { runFoldersMigration } from './routes/migration-folders.js';

// Database initialization
import { initializeDatabase, getDatabase } from './database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize database
await initializeDatabase();

// Run multi-folder migration
try {
  console.log('🔄 Running multi-folder migration...');
  runFoldersMigration();
} catch (error) {
  console.error('❌ Migration failed:', error);
}

// Middleware to provide database to routes
app.use((req, res, next) => {
  req.db = getDatabase();
  next();
});

// Security middleware
app.use(helmet());
app.use(cors({
  origin: /^http:\/\/localhost:\d+$/, // Alle localhost poorten toegestaan
  credentials: true
}));

// TEMPORARY: Disable rate limiting due to multiple server instances running
// TODO: Fix multiple server instances issue first
if (process.env.NODE_ENV === 'production') {
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // 1000 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
  });
  app.use(limiter);
}

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('Request body:', JSON.stringify(req.body, null, 2));
  }
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true,
    data: {
      status: 'ok',
      uptime: process.uptime()
    },
    meta: {
      timestamp: new Date().toISOString(),
      version: '1.0'
    }
  });
});

// API routes
app.use('/api/templates', templatesRouter);
app.use('/api/workflows', workflowsRouter);
app.use('/api/snippets', snippetsRouter);
app.use('/api/folders', foldersRouter);
app.use('/api/folder-favorites', folderFavoritesRouter);
app.use('/api/ui-state', uiStateRouter);
app.use('/api/migrate', migrationRouter);
// app.use('/api/migrate-advanced', migrationAdvancedRouter);

// Export endpoint for data backup
app.get('/api/export', (req, res) => {
  res.json({
    success: true,
    data: { message: 'Export functionality coming soon' },
    meta: {
      timestamp: new Date().toISOString(),
      version: '1.0'
    }
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Server Error:', error);
  res.status(error.status || 500).json({
    success: false,
    error: {
      code: error.code || 'INTERNAL_ERROR',
      message: error.message || 'Internal Server Error',
      ...(process.env.NODE_ENV !== 'production' && { details: error.stack })
    },
    meta: {
      timestamp: new Date().toISOString(),
      version: '1.0'
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.originalUrl} not found`
    },
    meta: {
      timestamp: new Date().toISOString(),
      version: '1.0'
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 AirPrompts Backend Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`📚 API base: http://localhost:${PORT}/api`);
});

export default app;
// Force server restart to apply new rate limits
