import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

// Database initialization
import { initializeDatabase, getDatabase } from './database.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize database
console.log('Initializing database...');
await initializeDatabase();
console.log('Database initialized, starting server...');

// Security middleware
app.use(helmet());
app.use(cors({
  origin: 'http://localhost:5173', // Vite dev server
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware to provide database to routes
app.use((req, res, next) => {
  req.db = getDatabase();
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

// Simple templates endpoint for testing
app.get('/api/templates', (req, res) => {
  try {
    const db = getDatabase();
    const templates = db.prepare('SELECT * FROM templates ORDER BY updated_at DESC').all();
    
    const processedTemplates = templates.map(template => ({
      ...template,
      variables: template.variables ? JSON.parse(template.variables) : [],
      favorite: Boolean(template.favorite)
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
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📚 API base: http://localhost:${PORT}/api`);
});

export default app;