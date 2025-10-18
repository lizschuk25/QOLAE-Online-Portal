# 💾 STREAM C: DATA-SPECIALIST BRIEFING

**Agent Role**: Build database tables, file storage utility, and access control middleware

**Your Mission**: Create 3 database tables + utilities (3-4 hours total)

**Status**: READY TO START ✅

---

## 📋 YOUR TASKS (In Priority Order)

### **TASK 1A.3.3 & 1A.3.4: Create Database Tables** (1 hour) 🎯 START HERE
**File to create**: `database/add-new-starter-tables.sql`

**What to build**:
SQL migration file with 2 new tables for document storage and reference tracking

**Table 1: new_starter_documents**
```sql
CREATE TABLE new_starter_documents (
  id SERIAL PRIMARY KEY,
  new_starter_id INTEGER NOT NULL REFERENCES new_starters(id) ON DELETE CASCADE,
  document_type VARCHAR(50) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_data BYTEA NOT NULL,
  file_size INTEGER,
  uploaded_at TIMESTAMP DEFAULT NOW(),
  status VARCHAR(50) DEFAULT 'pending_review'
);

CREATE INDEX idx_new_starter_docs ON new_starter_documents(new_starter_id);
```

**Columns Explained**:
- `id`: Primary key
- `new_starter_id`: Foreign key to new_starters.id (cascade on delete)
- `document_type`: Type of document (proof_of_id, proof_of_address, qualifications, dbs_certificate, professional_registration)
- `file_name`: Original file name (e.g., "passport.pdf")
- `file_data`: **Binary file data stored directly in database (BYTEA)**
- `file_size`: Size in bytes (for display and validation)
- `uploaded_at`: Timestamp when uploaded
- `status`: Review status (pending_review, approved, rejected)

**Table 2: new_starter_references**
```sql
CREATE TABLE new_starter_references (
  id SERIAL PRIMARY KEY,
  new_starter_id INTEGER NOT NULL REFERENCES new_starters(id) ON DELETE CASCADE,
  ref_type VARCHAR(50) NOT NULL,
  contact_name VARCHAR(255) NOT NULL,
  contact_title VARCHAR(255),
  contact_organisation VARCHAR(255),
  contact_email VARCHAR(255) NOT NULL,
  contact_phone VARCHAR(50) NOT NULL,
  relationship TEXT,
  duration_known VARCHAR(100),
  status VARCHAR(50) DEFAULT 'pending'
);

CREATE INDEX idx_new_starter_refs ON new_starter_references(new_starter_id);
```

**Columns Explained**:
- `id`: Primary key
- `new_starter_id`: Foreign key to new_starters.id
- `ref_type`: Type of reference (professional, character)
- `contact_name`: Name of reference person
- `contact_title`: Job title (e.g., "Senior Manager")
- `contact_organisation`: Company name
- `contact_email`: Reference email address
- `contact_phone`: Reference phone number
- `relationship`: How they know the person (e.g., "Former supervisor")
- `duration_known`: How long they've known them (e.g., "5 years")
- `status`: Status of reference (pending, in_progress, received, approved)

**Deployment Steps**:
1. Save file as: `database/add-new-starter-tables.sql`
2. Run on Live Server: `psql -U postgres qolae_hrcompliance < database/add-new-starter-tables.sql`
3. Verify tables created: `psql -U postgres -d qolae_hrcompliance -c "\dt new_starter_*"`

**Testing Checklist**:
- [ ] Both tables created successfully
- [ ] Indexes created for performance
- [ ] Foreign keys work (test cascade delete)
- [ ] Tables show in psql: `\dt`
- [ ] Column names match specification
- [ ] Data types correct

**API Reference**: See `STEP1A_API_CONTRACT.md` Endpoints 7-8

---

### **TASK 1A.3.6: File Storage Utility** (1.5 hours)
**File to create**: `utils/saveNewStarterDocuments.js`

**What to build**:
A utility function that converts uploaded files to binary data and stores them in the `qolae_hrcompliance` database

**Function Signature**:
```javascript
export async function saveNewStarterDocuments(files, newStarterId) {
  // files: Array of uploaded files (Fastify format)
  // newStarterId: Database ID
  // Returns: Array of metadata objects (file_name, file_size, document_type)
}
```

**Example Usage**:
```javascript
const filesToSave = request.files; // From Fastify multipart upload
const newStarterId = 42;

const savedFiles = await saveNewStarterDocuments(filesToSave, newStarterId);
// Returns:
// [
//   {
//     id: 1,
//     documentType: 'proof_of_id',
//     fileName: 'passport.pdf',
//     fileSize: 2048576,
//     uploadedAt: '2025-10-18T14:32:00Z'
//   }
// ]
```

**Logic**:
1. Validate each file:
   - Check file size < 10MB
   - Check total size < 50MB
   - Check file type is allowed
2. Read file into buffer:
   - Convert file to binary data (Buffer)
3. Store in database:
   - `INSERT INTO new_starter_documents (new_starter_id, document_type, file_name, file_data, file_size, uploaded_at, status) VALUES ($1, $2, $3, $4, $5, NOW(), 'pending_review')`
4. Return saved file metadata

**File Validation Constants** (from API contract):
```javascript
const MAX_FILE_SIZE = 10 * 1024 * 1024;        // 10MB
const MAX_TOTAL_SIZE = 50 * 1024 * 1024;       // 50MB
const ALLOWED_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
];
```

**Error Handling**:
```javascript
// Throw errors with clear messages:
throw new Error('File too large (15MB > 10MB limit)');
throw new Error('Invalid file type (EXE not allowed)');
throw new Error('Total size exceeded (65MB > 50MB)');
throw new Error('Failed to read file');
throw new Error('Failed to store file in database');
```

**Security**:
- Validate file types by MIME type, not extension
- Check file sizes before database storage
- Store files as BYTEA in database (secure, encrypted at rest)
- Database handles access control automatically

**Implementation Hints** (Fastify/ES6):
```javascript
// Use Node.js buffer and database
import pool from '../config/database.js';

// Read file into buffer
const fileBuffer = await file.toBuffer();

// Determine document type from file name or request
const documentType = determineDocumentType(file.filename);

// Store in database
const query = `
  INSERT INTO new_starter_documents 
  (new_starter_id, document_type, file_name, file_data, file_size, uploaded_at, status) 
  VALUES ($1, $2, $3, $4, $5, NOW(), 'pending_review')
  RETURNING id, file_name, file_size, uploaded_at
`;

const result = await pool.query(query, [
  newStarterId,
  documentType,
  file.filename,
  fileBuffer,
  fileBuffer.length
]);

return result.rows[0];
```

**API Reference**: See `STEP1A_API_CONTRACT.md` Endpoint 7

**Testing Checklist**:
- [ ] Files validated (size, type)
- [ ] Files stored in database as BYTEA
- [ ] File metadata stored correctly
- [ ] File retrieval works from database
- [ ] Error handling for invalid files
- [ ] File size validation enforced
- [ ] Database transaction integrity

---

### **TASK 1A.4.1 - 1A.4.4: Workspace Access Rules** (1.5 hours)
**Files to create**:
- `database/workspace-access-tables.sql` (migration)
- `middleware/checkWorkspaceAccess.js` (middleware)
- Add route: `GET /api/workspace/features` (in newStarterRoute.js)

**Part 1: Database Table**

Create table in `qolae_casemanagers` database:
```sql
CREATE TABLE workspace_access_rules (
  id SERIAL PRIMARY KEY,
  case_manager_id INTEGER NOT NULL,
  feature_name VARCHAR(100) NOT NULL,
  is_enabled BOOLEAN DEFAULT FALSE,
  unlocked_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_access_rules_cm ON workspace_access_rules(case_manager_id);
```

**Features to define**:
- `documents_library` - Access to documents folder
- `compliance_folder` - Access to compliance records
- `policies` - Access to company policies
- `basic_functions` - Basic dashboard functions
- `full_dashboard` - Full admin features

**Part 2: Middleware Function**

Create `middleware/checkWorkspaceAccess.js`:
```javascript
export async function checkWorkspaceAccess(request, reply, requiredFeature) {
  // Get user ID from session/JWT
  const userId = request.user?.id;
  
  if (!userId) {
    return reply.status(401).send({ error: 'Unauthorized' });
  }
  
  // Get user's workspace access level
  const user = await getNewStarterById(userId);
  if (!user) {
    return reply.status(404).send({ error: 'User not found' });
  }
  
  // Check if feature is enabled for this access level
  const hasAccess = user.workspace_access === 'full' || 
                    (user.workspace_access === 'limited' && 
                     requiredFeature !== 'full_dashboard');
  
  if (!hasAccess) {
    return reply.status(403).send({ error: 'Feature not available yet' });
  }
  
  return true;
}
```

**Usage in routes**:
```javascript
fastify.get('/api/compliance-details', async (request, reply) => {
  await checkWorkspaceAccess(request, reply, 'compliance_folder');
  // ... rest of route
});
```

**Part 3: Features API Route**

Add to `routes/newStarterRoute.js`:
```javascript
fastify.get('/api/workspace/features', async (request, reply) => {
  const userId = request.user?.id;
  const user = await getNewStarterById(userId);
  
  let allowedFeatures = [];
  
  if (user.workspace_access === 'pending') {
    allowedFeatures = []; // Nothing yet
  } else if (user.workspace_access === 'limited') {
    allowedFeatures = [
      'documents_library',
      'compliance_folder',
      'policies',
      'basic_functions'
    ];
  } else if (user.workspace_access === 'full') {
    allowedFeatures = [
      'documents_library',
      'compliance_folder',
      'policies',
      'basic_functions',
      'full_dashboard'
    ];
  }
  
  return {
    success: true,
    features: allowedFeatures,
    accessLevel: user.workspace_access
  };
});
```

**Access Level Transitions**:
- **Step 1A.1**: New starter created → `workspace_access = 'pending'`
- **Step 1A.2**: Compliance submitted → `workspace_access = 'limited'`
- **Step 1A.4**: Approval → `workspace_access = 'full'`

**Testing Checklist**:
- [ ] Middleware blocks unauthorized access
- [ ] Limited access users see correct features
- [ ] Full access users see all features
- [ ] Access level updates correctly
- [ ] Features API returns correct list
- [ ] No console errors

**API Reference**: See `STEP1A_API_CONTRACT.md` Endpoint 8

---

## 🔧 IMPLEMENTATION STEPS

### **Step 1: Set Up (15 mins)**
```bash
# Read the API contract (REQUIRED!)
cat STEP1A_API_CONTRACT.md

# Read coordination document
cat STEP1A_AGENT_COORDINATION.md

# Check local file storage on hrcompliance server
ls -la /var/www/hrcompliance.qolae.com/storage/
```

### **Step 2: Create Database Migration** (30 mins)
1. Create `database/add-new-starter-tables.sql`
2. Write SQL for both tables
3. Test migration on local database first
4. Run on Live Server

### **Step 3: Build File Storage Utility** (1 hour)
1. Create `utils/saveNewStarterDocuments.js`
2. Implement validation logic
3. Implement directory creation
4. Implement file saving
5. Test with sample files

### **Step 4: Create Access Control** (1 hour)
1. Create migration for `workspace_access_rules` table
2. Create middleware: `checkWorkspaceAccess.js`
3. Add route: `GET /api/workspace/features`
4. Test middleware with different access levels

### **Step 5: Test Everything** (1 hour)
1. Test database tables
2. Test file storage (valid/invalid files)
3. Test access control (blocked/allowed)
4. Verify Live Server integration

---

## 📝 DIRECTORY STRUCTURE

**All files stored in `qolae_hrcompliance` database** (no file system storage):

```
qolae_hrcompliance DATABASE
├── new_starter_documents table
│   ├── id: 1
│   ├── new_starter_id: 42
│   ├── document_type: 'proof_of_id'
│   ├── file_name: 'passport.pdf'
│   ├── file_data: [BYTEA - binary file data]
│   ├── file_size: 2048576
│   ├── uploaded_at: 2025-10-18 14:32:00
│   └── status: 'pending_review'
```

**No separate file system directories needed** - everything in database!

---

## 📊 DATABASE VERIFICATION

**After migration, verify tables exist**:
```bash
# Connect to database
psql -U postgres -d qolae_hrcompliance

# List tables
\dt new_starter_*

# Describe table schema
\d new_starter_documents
\d new_starter_references

# Create indexes
\di

# Exit
\q
```

---

## 📞 NEED HELP?

**Questions?** Add to Q&A section in `STEP1A_AGENT_COORDINATION.md`

**Blocked?** Fill out BLOCKER REPORT in coordination document

**Key References**:
- API Contract: `STEP1A_API_CONTRACT.md` ⭐ READ THIS FIRST
- Coordination Hub: `STEP1A_AGENT_COORDINATION.md`
- Existing File Storage: Check `/var/www/api.qolae.com/central-repository/readers/` structure
- Database Pattern: Check existing qolae_hrcompliance schema

---

## 🚀 WHEN YOU'RE DONE

1. ✅ Test database tables are created
2. ✅ Test file storage utility saves files correctly
3. ✅ Test access control middleware works
4. ✅ Check code review checklist in coordination document
5. ✅ Copy migration files to Live Server
6. ✅ Copy utils to Live Server: `ssh root@91.99.184.77 → /var/www/hrcompliance.qolae.com/utils/`
7. ✅ Copy middleware to Live Server: `ssh root@91.99.184.77 → /var/www/hrcompliance.qolae.com/middleware/`
8. ✅ Run migrations on Live Server
9. ✅ Restart PM2: `pm2 restart qolae-hrcompliance`
10. ✅ Test endpoints on Live Server
11. ✅ Update status in coordination document

---

## ⏱️ TIMELINE

- Hour 0-0.25: Setup + read API contract
- Hour 0.25-1.25: Task 1A.3.3/3.4 (Database tables)
- Hour 1.25-2.75: Task 1A.3.6 (File storage utility)
- Hour 2.75-4.25: Task 1A.4.1-4.4 (Access control)
- Hour 4-5: Testing, code review, deployment

**Confidence Check**: 
- Can you hit this timeline? Let us know in coordination document!

---

**Ready to build rock-solid data layer, Stream C? Let's go! 💾💪🏽**

### **Stream C Deployment:**
- [ ] Run SQL migration: `psql -U postgres qolae_hrcompliance < database/add-new-starter-tables.sql`
- [ ] Copy `/utils/saveNewStarterDocuments.js` to Live Server
- [ ] Copy `/middleware/checkWorkspaceAccess.js` to Live Server
- [ ] Verify database tables created: `\dt new_starter_*` in psql
- [ ] Test file storage utility locally
- [ ] Restart PM2: `pm2 restart qolae-hrcompliance`
