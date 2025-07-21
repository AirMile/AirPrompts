# Backend Agent Briefing

## 🎯 Mission Statement

You are the **Backend Agent** responsible for building the SQLite database and Express API server that will replace the current localStorage system. Your work forms the foundation that enables the Frontend and Migration agents to complete their phases.

---

## 📋 Your Responsibilities

### **Primary Deliverables**
1. **Express Server Setup** - Production-ready server with middleware
2. **SQLite Database** - Complete schema with proper relationships
3. **API Endpoints** - Full CRUD operations for all data types
4. **Error Handling** - Comprehensive validation and error responses
5. **Testing Ready** - Server ready for frontend integration

### **Quality Standards**
- **Performance:** API responses < 100ms for CRUD operations
- **Reliability:** Proper error handling and validation
- **Security:** Input sanitization and rate limiting
- **Scalability:** Clean code structure for future expansion

---

## 🗂️ Project Context

### **Current System Overview**
- **Data Storage:** localStorage in `src/utils/dataStorage.js`
- **Data Types:** Templates, workflows, folders, snippets
- **Frontend:** React 19 with Vite, expects JSON responses
- **User Base:** Single-user application (for now)

### **Current Data Structure (localStorage)**
```javascript
// Templates
{
  id: "string",
  name: "string", 
  description: "string",
  content: "string", // with {variable} placeholders
  category: "string",
  favorite: boolean,
  folderId: "string",
  variables: ["array", "of", "strings"],
  lastUsed: "ISO date string"
}

// Workflows  
{
  id: "string",
  name: "string",
  description: "string", 
  steps: [{ templateId: "string", order: number }],
  category: "string",
  favorite: boolean,
  folderId: "string"
}
```

### **Target Architecture**
- **Server:** Express on localhost:3001
- **Database:** SQLite with better-sqlite3 driver
- **API:** RESTful endpoints with JSON responses
- **Development:** Concurrent with frontend (npm run dev)

---

## 🛠️ Technical Specifications

### **Required Dependencies**
```json
{
  "express": "^4.18.2",
  "better-sqlite3": "^8.7.0",
  "cors": "^2.8.5", 
  "helmet": "^7.1.0",
  "express-rate-limit": "^7.1.5",
  "joi": "^17.11.0",
  "concurrently": "^8.2.2",
  "nodemon": "^3.0.2"
}
```

### **Server Directory Structure**
```
server/
├── server.js              # Main Express application
├── database.js             # SQLite connection and setup
├── routes/
│   ├── templates.js        # Template CRUD routes
│   ├── workflows.js        # Workflow CRUD routes
│   ├── folders.js          # Folder CRUD routes
│   └── migration.js        # Data migration endpoints
├── middleware/
│   ├── validation.js       # Joi validation middleware
│   └── errorHandler.js     # Global error handling
├── migrations/
│   └── init.sql            # Database schema creation
└── utils/
    └── idGenerator.js      # UUID generation utility
```

### **Database Schema (SQLite)**

#### **Templates Table**
```sql
CREATE TABLE templates (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    content TEXT NOT NULL,
    category TEXT NOT NULL,
    favorite BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    variables TEXT, -- JSON array
    usage_count INTEGER DEFAULT 0,
    folder_id TEXT,
    last_used DATETIME,
    FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE SET NULL
);
```

#### **Workflows Table**
```sql
CREATE TABLE workflows (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    favorite BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    usage_count INTEGER DEFAULT 0,
    folder_id TEXT,
    FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE SET NULL
);
```

#### **Workflow Steps Table**
```sql
CREATE TABLE workflow_steps (
    id TEXT PRIMARY KEY,
    workflow_id TEXT NOT NULL,
    template_id TEXT NOT NULL,
    step_order INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE CASCADE,
    FOREIGN KEY (template_id) REFERENCES templates(id) ON DELETE CASCADE
);
```

#### **Folders Table**
```sql
CREATE TABLE folders (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    color TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### **Performance Indexes**
```sql
CREATE INDEX idx_templates_category ON templates(category);
CREATE INDEX idx_templates_favorite ON templates(favorite);
CREATE INDEX idx_templates_folder ON templates(folder_id);
CREATE INDEX idx_workflows_category ON workflows(category);
CREATE INDEX idx_workflow_steps_workflow ON workflow_steps(workflow_id);
CREATE INDEX idx_workflow_steps_order ON workflow_steps(workflow_id, step_order);
```

---

## 🔌 API Specifications

### **Response Format Standards**

#### **Success Response**
```json
{
  "success": true,
  "data": {
    // Actual response data here
  },
  "meta": {
    "timestamp": "2025-01-20T10:30:00Z",
    "version": "1.0"
  }
}
```

#### **Error Response**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Template naam is verplicht",
    "details": {
      "field": "name",
      "value": ""
    }
  },
  "meta": {
    "timestamp": "2025-01-20T10:30:00Z",
    "version": "1.0"
  }
}
```

### **Required API Endpoints**

#### **Templates**
```javascript
GET    /api/templates                    # Get all templates
GET    /api/templates/:id               # Get specific template
POST   /api/templates                   # Create new template
PUT    /api/templates/:id               # Update template
DELETE /api/templates/:id               # Delete template
GET    /api/templates/search?q=query    # Search templates
```

#### **Workflows**
```javascript
GET    /api/workflows                   # Get all workflows (with steps)
GET    /api/workflows/:id               # Get specific workflow with steps
POST   /api/workflows                   # Create new workflow
PUT    /api/workflows/:id               # Update workflow
DELETE /api/workflows/:id               # Delete workflow
```

#### **Folders**
```javascript
GET    /api/folders                     # Get all folders
POST   /api/folders                     # Create new folder
PUT    /api/folders/:id                 # Update folder
DELETE /api/folders/:id                 # Delete folder
```

#### **Migration Support**
```javascript
POST   /api/migrate/from-localstorage   # Import localStorage data
GET    /api/export                      # Export all data as JSON
GET    /api/backup                      # Download database file
```

### **CORS Configuration**
```javascript
// Development CORS settings
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

---

## 📋 Implementation Checkpoints

### **Checkpoint 1.1: Dependencies Installed** ✅
**Your Tasks:**
1. Update `package.json` with all required dependencies
2. Run `npm install` to install packages
3. Verify no dependency conflicts exist
4. Update package.json scripts for backend development

**Package.json Script Updates:**
```json
{
  "scripts": {
    "dev": "concurrently \"npm run dev:server\" \"npm run dev:client\"",
    "dev:client": "vite", 
    "dev:server": "nodemon server/server.js",
    "build": "vite build",
    "start:server": "node server/server.js"
  }
}
```

**Validation:** Dependencies install successfully, no errors

---

### **Checkpoint 1.2: Express Server Setup** ✅
**Your Tasks:**
1. Create `server/server.js` with Express setup
2. Configure CORS for localhost:5173
3. Add security middleware (helmet, rate limiting)
4. Implement basic health check endpoint
5. Server starts successfully on port 3001

**Server.js Template:**
```javascript
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000 // limit each IP to 1000 requests per windowMs
}));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
```

**Validation:** Server responds to http://localhost:3001/health

---

### **Checkpoint 1.3: SQLite Database Schema** ✅
**Your Tasks:**
1. Create `server/database.js` with SQLite connection
2. Create `server/migrations/init.sql` with all tables
3. Implement database initialization function
4. Create `server/utils/idGenerator.js` with UUID generation
5. Verify database creation and table structure

**Database.js Template:**
```javascript
import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const db = new Database(join(__dirname, 'database.db'));

// Initialize database with schema
const initSQL = readFileSync(join(__dirname, 'migrations', 'init.sql'), 'utf-8');
db.exec(initSQL);

export default db;
```

**ID Generator Template:**
```javascript
import { randomUUID } from 'crypto';

export const generateId = () => {
  return randomUUID();
};
```

**Validation:** Database file created, tables exist, can connect via sqlite3 CLI

---

### **Checkpoint 1.4: Basic API Endpoints** ✅
**Your Tasks:**
1. Create all route files in `server/routes/`
2. Implement CRUD operations for templates, workflows, folders
3. Add input validation with Joi
4. Implement error handling middleware
5. Test all endpoints with basic data

**Route Structure Example (templates.js):**
```javascript
import express from 'express';
import db from '../database.js';
import { generateId } from '../utils/idGenerator.js';
import Joi from 'joi';

const router = express.Router();

// Validation schema
const templateSchema = Joi.object({
  name: Joi.string().required(),
  description: Joi.string().allow(''),
  content: Joi.string().required(),
  category: Joi.string().required(),
  favorite: Joi.boolean().default(false),
  folderId: Joi.string().allow(null)
});

// GET /api/templates
router.get('/', (req, res) => {
  try {
    const templates = db.prepare('SELECT * FROM templates ORDER BY updated_at DESC').all();
    res.json({
      success: true,
      data: templates,
      meta: { timestamp: new Date().toISOString(), version: '1.0' }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'DATABASE_ERROR', message: error.message }
    });
  }
});

// POST /api/templates
router.post('/', (req, res) => {
  try {
    const { error, value } = templateSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: error.details[0].message }
      });
    }

    const template = {
      id: generateId(),
      ...value,
      variables: JSON.stringify(extractVariables(value.content)),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const stmt = db.prepare(`
      INSERT INTO templates (id, name, description, content, category, favorite, folder_id, variables, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run([template.id, template.name, template.description, template.content, 
              template.category, template.favorite, template.folderId, template.variables,
              template.created_at, template.updated_at]);

    res.status(201).json({
      success: true,
      data: template,
      meta: { timestamp: new Date().toISOString(), version: '1.0' }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'DATABASE_ERROR', message: error.message }
    });
  }
});

// Helper function to extract variables from template content
function extractVariables(content) {
  const matches = content.match(/\{([^}]+)\}/g);
  return matches ? matches.map(match => match.slice(1, -1)) : [];
}

export default router;
```

**Validation:** All CRUD operations work, proper error handling, input validation

---

### **Checkpoint 1.5: API Testing Complete** ⚠️ USER VALIDATION
**Your Tasks:**
1. Ensure server starts with `npm run dev:server`
2. Provide test commands for user to validate API
3. Create sample data for testing
4. Document API response formats
5. Verify error handling works correctly

**Test Commands for User:**
```bash
# Start server
npm run dev:server

# Test health check
curl http://localhost:3001/health

# Test templates endpoint
curl http://localhost:3001/api/templates

# Test creating a template
curl -X POST http://localhost:3001/api/templates \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Template","content":"Hello {name}","category":"test","description":"Test description"}'

# Test getting specific template (use ID from creation response)
curl http://localhost:3001/api/templates/{TEMPLATE_ID}
```

**What User Will Validate:**
- Server starts without errors
- API endpoints respond correctly
- Error handling works (try invalid data)
- Response format matches expectations
- Basic CRUD operations function

---

## 🚨 Critical Implementation Notes

### **UUID Generation**
- **Always use server-side UUID generation** for new records
- **Never trust client-provided IDs** for security
- **Use crypto.randomUUID()** for consistent format

### **Error Handling Standards**
- **Always catch database errors** and return proper HTTP status
- **Validate all inputs** with Joi before database operations
- **Use consistent error response format** across all endpoints
- **Log errors server-side** for debugging

### **Performance Considerations**
- **Use prepared statements** for all database queries
- **Implement proper indexes** for common query patterns
- **Keep database queries simple** and efficient
- **Consider connection pooling** for future scaling

### **Security Requirements**
- **Sanitize all inputs** to prevent SQL injection
- **Use parameterized queries** exclusively
- **Implement rate limiting** to prevent abuse
- **Validate request size limits** to prevent DoS

---

## 📊 Quality Assurance

### **Code Quality Standards**
- **Follow existing project patterns** and conventions
- **Use meaningful variable names** and comments
- **Implement proper error handling** throughout
- **Write clean, readable code** for future maintenance

### **Testing Requirements**
- **Manual testing** of all CRUD operations
- **Error scenario testing** with invalid inputs
- **Performance testing** with response time validation
- **Integration readiness** for frontend connection

### **Documentation Requirements**
- **Clear API documentation** with examples
- **Database schema documentation** with relationships
- **Setup instructions** for other developers
- **Error code documentation** for frontend integration

---

## 🎯 Success Criteria

### **Technical Success**
- All API endpoints operational and tested
- Database schema complete with proper relationships
- Error handling comprehensive and user-friendly
- Performance meets specifications (< 100ms responses)

### **Integration Readiness**
- CORS properly configured for frontend development
- API response format consistent and documented
- Server ready for concurrent frontend development
- Clear handoff documentation for Frontend Agent

### **User Validation Success**
- User can start server without issues
- User can test basic API functionality
- User approves API behavior and response format
- User gives go-ahead for frontend integration

---

## 📚 Reference Materials

### **Required Reading**
- `DATABASE_INTEGRATION_PLAN.md` - Complete technical specifications
- `CHECKPOINT_DEFINITIONS.md` - Your specific validation criteria
- Current `src/utils/dataStorage.js` - Understand current data patterns

### **Handoff Materials**
- API endpoint documentation with examples
- Database schema with relationship explanations
- Error handling and response format guide
- Server startup and testing instructions

---

## 🎮 Next Steps After Completion

1. **Update Dashboard** with Phase 1 completion status
2. **Notify User** for validation and testing
3. **Prepare Handoff** documentation for Frontend Agent
4. **Stand By** for user feedback and any required fixes
5. **Support Frontend Agent** with any API questions during their phase

---

**🎯 Remember:** Your backend is the foundation that enables everything else. Focus on reliability, performance, and clear interfaces that will make the Frontend Agent's job straightforward and successful.