# 🚀 STEP 1A: 3-AGENT PARALLEL EXECUTION PLAN

**Objective**: Complete Step 1A (New Starter Registration Workflow) using 3 agents working in parallel

**Timeline**: 8-10 hours total (run in parallel = ~4-5 hours wall time)

**API Contract**: See `STEP1A_API_CONTRACT.md` (MUST read before starting)
**RULES**: ## 🚨 CRITICAL RULES FOR ALL AGENTS:

1. **Copy files directly to Live Server** (`/var/www/hrcompliance.qolae.com/`)
2. **Save using ecosystem.config PM2 process** every time to prevent cache issues
3. **Test Server side** after each major change
4. **Follow Location Block Protocol** - organize code by workflow, not technical function
5. **Use existing QOLAE patterns** - don't reinvent the wheel

---

## 📊 AGENT ALLOCATION & STREAMS

```
┌─────────────────────────────────────────────────────────────┐
│              STEP 1A WORK STREAMS                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Stream A: Frontend                                        │
│  Agent: Stream-A-Frontend                                 │
│  Tasks: Dashboard forms, display lists, validation        │
│  Time: 3-4 hours                                          │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │ 1A.1.7       │  │ 1A.1.8       │  │ 1A.3.7/3.8   │    │
│  │ Reg Form     │  │ Display List │  │ Validation   │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Stream B: Authentication                                 │
│  Agent: Stream-B-Auth                                     │
│  Tasks: PIN, OTP, password routes & logic                 │
│  Time: 2-3 hours                                          │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │ 1A.2.2       │  │ 1A.2.3       │  │ 1A.2.4/2.5   │    │
│  │ Verify PIN   │  │ Send OTP     │  │ Password     │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Stream C: Data Layer & Storage                           │
│  Agent: Stream-C-Data                                     │
│  Tasks: Database tables, file storage, middleware         │
│  Time: 3-4 hours                                          │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │ 1A.3.3/3.4   │  │ 1A.3.6       │  │ 1A.4.1-4.4   │    │
│  │ Tables       │  │ File Store   │  │ Access Rules │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
│                                                             │
└─────────────────────────────────────────────────────────────┘

⏱️  PARALLEL EXECUTION: 4-5 hours (not sequential 8-10 hours)
```

---

## 🎯 AGENT 1: FRONTEND STREAM

### **Agent Name**: Frontend-Specialist

### **Role**: Build all UI forms, displays, and client-side validation

### **Duration**: 3-4 hours

### **Deliverables**:

1. **Task 1A.1.7: Registration Form Modal** (1.5 hours)
   - Location: `views/hrCompliance-dashboard.ejs` → New Starters tab
   - Components needed:
     - Modal popup with form fields
     - First Name, Last Name, Email, Phone inputs
     - Role & Department dropdowns
     - Start Date picker
     - Submit button → calls API POST `/api/new-starter/create`
   - API Reference: See STEP1A_API_CONTRACT.md Endpoint 1
   - Success: Form validates inputs, shows PIN in response, copy-to-clipboard button
   - Error handling: Display validation errors and API errors clearly

2. **Task 1A.1.8: New Starters Display Lists** (1.5 hours)
   - Location: `views/hrCompliance-dashboard.ejs` → New Starters tab → "Pending", "Approved", "All" tabs
   - Components needed:
     - Table or card layout showing new starters
     - Columns: Name, Email, Role, Status, Date Created, Actions
     - Status badges (pending_compliance, compliance_submitted, active)
     - Fetch data from `GET /api/new-starter/all`
     - Real-time updates via WebSocket (subscribe to `new_starter_compliance_submitted` events)
     - Action buttons: View Details, Resend Invitation, Mark Complete
   - API Reference: See STEP1A_API_CONTRACT.md Endpoint 2

3. **Task 1A.3.7 & 1A.3.8: Upload Progress & Validation** (1 hour)
   - Location: `views/newStarter-compliance.ejs` (already exists, enhance)
   - Enhancements needed:
     - File size validation (max 10MB per file, 50MB total)
     - File type validation (PDF, JPG, PNG, DOCX, XLSX only)
     - Progress bars for multi-file uploads
     - Show uploading... state with spinner
     - Success/error messages per file
     - Retry button for failed uploads
     - Show file size in display

### **Dependencies**:
- ✅ Backend API endpoints exist (POST /api/new-starter/create, GET /api/new-starter/all)
- ✅ newStarter-compliance.ejs already has basic form
- ⏳ WebSocket client needs to be ready (Stream C responsibility)

### **Testing Checklist**:
- [ ] Registration form validates email format
- [ ] Form rejects empty required fields
- [ ] Form displays PIN and allows copy-to-clipboard
- [ ] Display list shows all new starters from API
- [ ] Status badges display correctly
- [ ] File upload shows progress bar
- [ ] Files over 10MB rejected with error
- [ ] Invalid file types rejected
- [ ] Total size limit (50MB) enforced
- [ ] Responsive on mobile (375px width minimum)

### **Deployment**:
- Copy updated files to Live Server: `/var/www/hrcompliance.qolae.com/views/`
- Restart PM2: `pm2 restart qolae-hrcompliance`

---

## 🔐 AGENT 2: AUTHENTICATION STREAM

### **Agent Name**: Auth-Specialist

### **Role**: Build PIN verification, OTP, and password creation routes

### **Duration**: 2-3 hours

### **Deliverables**:

1. **Task 1A.2.2: Verify PIN Route** (45 minutes)
   - Location: `routes/newStarterRoute.js` → Add POST `/api/new-starter/verify-pin`
   - Logic:
     - Validate PIN format: `NS-XX-123456`
     - Check if PIN exists in `new_starters` table
     - Return `newStarterId`, `email`, `fullName` if valid
     - Rate limit: 5 attempts per 15 minutes per IP
     - Log all attempts (security audit trail)
   - API Reference: See STEP1A_API_CONTRACT.md Endpoint 3
   - Update NewStarterController.js if needed

2. **Task 1A.2.3: Send OTP Route** (45 minutes)
   - Location: `routes/newStarterRoute.js` → Add POST `/api/new-starter/send-otp`
   - Logic:
     - Generate 6-digit random OTP
     - Store in DB: `UPDATE new_starters SET otp = $1, otp_expires_at = NOW() + INTERVAL '15 minutes'`
     - Send email using existing email service (`sendNewStarterInvitation.js` pattern)
     - Return success message with expiry time
     - Never return OTP value in response (security)
   - Email template: Include OTP and 15-minute expiry warning
   - API Reference: See STEP1A_API_CONTRACT.md Endpoint 4

3. **Task 1A.2.4: Verify OTP Route** (45 minutes)
   - Location: `routes/newStarterRoute.js` → Add POST `/api/new-starter/verify-otp`
   - Logic:
     - Validate OTP matches stored value
     - Check OTP hasn't expired
     - Check attempt count (max 3 failed)
     - Clear OTP after 3 failed attempts
     - Return verification success
   - API Reference: See STEP1A_API_CONTRACT.md Endpoint 5

4. **Task 1A.2.5: Create Password Route** (45 minutes)
   - Location: `routes/newStarterRoute.js` → Add POST `/api/new-starter/create-password`
   - Logic:
     - Validate password strength:
       - Minimum 12 characters
       - Must include: uppercase, lowercase, number, symbol
       - Cannot include email or name
     - Hash password using bcrypt (12 rounds)
     - Update DB: `UPDATE new_starters SET password_hash = bcrypt($1), login_status = 'completed'`
     - Return redirect URL to `/new-starter/compliance`
   - API Reference: See STEP1A_API_CONTRACT.md Endpoint 6

### **Dependencies**:
- ✅ `new_starters` table exists with all columns
- ✅ Existing email service (nodemailer)
- ⏳ Bcrypt package (add to package.json if not present)

### **Security Checklist**:
- [ ] Rate limiting implemented (5 attempts per 15 mins)
- [ ] OTP never exposed in API responses
- [ ] Passwords hashed with bcrypt(12)
- [ ] All attempts logged with timestamp and IP
- [ ] OTP expires after 15 minutes
- [ ] Failed attempts cleared after 3 tries
- [ ] Password validation enforced
- [ ] Invalid PIN format rejected before DB check

### **Testing Checklist**:
- [ ] Valid PIN returns newStarterId
- [ ] Invalid PIN rejected with 404
- [ ] Rate limit blocks after 5 attempts
- [ ] OTP generated and emailed
- [ ] Valid OTP verifies successfully
- [ ] Expired OTP rejected
- [ ] Invalid password rejected
- [ ] Valid password hashed and saved
- [ ] Password creation redirects correctly

### **Deployment**:
- Update `routes/newStarterRoute.js` on Live Server
- Restart PM2: `pm2 restart qolae-hrcompliance`

---

## 💾 AGENT 3: DATA LAYER & STORAGE STREAM

### **Agent Name**: Data-Specialist

### **Role**: Build database tables, file storage utility, and access control

### **Duration**: 3-4 hours

### **Deliverables**:

1. **Task 1A.3.3 & 1A.3.4: Database Tables** (1 hour)
   - Location: Create SQL migration file: `database/add-new-starter-tables.sql`
   - Tables to create:

   **Table A: `new_starter_documents`**
   ```sql
   CREATE TABLE new_starter_documents (
     id SERIAL PRIMARY KEY,
     new_starter_id INTEGER NOT NULL REFERENCES new_starters(id) ON DELETE CASCADE,
     document_type VARCHAR(50) NOT NULL,  -- proof_of_id, proof_of_address, qualifications, dbs_certificate
     file_name VARCHAR(255) NOT NULL,
     file_path VARCHAR(500) NOT NULL,
     file_size INTEGER,  -- in bytes
     uploaded_at TIMESTAMP DEFAULT NOW(),
     status VARCHAR(50) DEFAULT 'pending_review'  -- pending_review, approved, rejected
   );
   CREATE INDEX idx_new_starter_docs ON new_starter_documents(new_starter_id);
   ```

   **Table B: `new_starter_references`**
   ```sql
   CREATE TABLE new_starter_references (
     id SERIAL PRIMARY KEY,
     new_starter_id INTEGER NOT NULL REFERENCES new_starters(id) ON DELETE CASCADE,
     ref_type VARCHAR(50) NOT NULL,  -- professional, character
     contact_name VARCHAR(255) NOT NULL,
     contact_title VARCHAR(255),
     contact_organisation VARCHAR(255),
     contact_email VARCHAR(255) NOT NULL,
     contact_phone VARCHAR(50) NOT NULL,
     relationship TEXT,
     duration_known VARCHAR(100),
     status VARCHAR(50) DEFAULT 'pending'  -- pending, in_progress, received, approved
   );
   CREATE INDEX idx_new_starter_refs ON new_starter_references(new_starter_id);
   ```

   - Run migration on Live Server: `psql -U postgres qolae_hrcompliance < database/add-new-starter-tables.sql`

2. **Task 1A.3.6: File Storage Utility** (1.5 hours)
   - Location: `utils/saveNewStarterDocuments.js`
   - Functionality:
     - Accept array of uploaded files
     - Validate file types and sizes (see API_CONTRACT.md constants)
     - Scan files for viruses (use ClamAV or similar if available)
     - Save to: `/var/www/api.qolae.com/central-repository/new-starters/{PIN}/{document_type}/`
     - Naming: `{PIN}_{document_type}_{timestamp}.{ext}`
     - Return file metadata (path, size, type) for DB storage
     - Error handling: Return clear error messages
   - Example usage:
     ```javascript
     const files = await saveNewStarterDocuments(uploadedFiles, pin, documentType);
     // Returns: { filePath: '/central-repo/...', fileName: '...', fileSize: 1024 }
     ```

3. **Task 1A.4.1 - 1A.4.4: Workspace Access Rules** (1.5 hours)

   **Table C: `workspace_access_rules`** (in qolae_casemanagers database)
   ```sql
   CREATE TABLE workspace_access_rules (
     id SERIAL PRIMARY KEY,
     case_manager_id INTEGER NOT NULL,
     feature_name VARCHAR(100) NOT NULL,  -- documents_library, compliance_folder, policies, basic_functions, full_dashboard
     is_enabled BOOLEAN DEFAULT FALSE,
     unlocked_at TIMESTAMP,
     created_at TIMESTAMP DEFAULT NOW(),
     updated_at TIMESTAMP DEFAULT NOW()
   );
   ```

   **Middleware: `middleware/checkWorkspaceAccess.js`**
   - Function: Check if user has access to feature
   - Logic:
     - Get `workspace_access` from `new_starters` table
     - Check feature against `workspace_access_rules` table
     - Return true/false
   - Usage: Apply to routes that need access checking

   **API Route: GET `/api/workspace/features`**
   - Return array of allowed features for current user
   - Based on their `workspace_access` level
   - Response: `{ success: true, features: ['documents_library', 'policies'] }`

   **Update Logic in Task 1A.1.7 & 1A.3.5**:
   - On new starter creation: `workspace_access = 'pending'` (none until compliance submitted)
   - On compliance submission: `workspace_access = 'limited'` 
   - On approval: `workspace_access = 'full'`

### **Dependencies**:
- ✅ `new_starters` table exists
- ✅ `qolae_casemanagers` database exists
- ✅ Central repository directory exists: `/var/www/api.qolae.com/central-repository/`
- ⏳ ClamAV or virus scanner (optional, but recommended)

### **Database Verification Checklist**:
- [ ] `new_starter_documents` table created
- [ ] `new_starter_references` table created
- [ ] `workspace_access_rules` table created
- [ ] All foreign keys set up with CASCADE delete
- [ ] Indexes created for performance
- [ ] Tables populated with test data (optional)

### **File Storage Checklist**:
- [ ] Directory `/var/www/api.qolae.com/central-repository/new-starters/` exists and writable
- [ ] Files saved with correct naming: `PIN_type_timestamp.ext`
- [ ] File metadata stored in database
- [ ] File retrieval works (read from database, find file)
- [ ] Error handling for invalid files
- [ ] File size validation enforced

### **Access Control Checklist**:
- [ ] Middleware blocks unauthorized access
- [ ] Limited access users cannot see restricted features
- [ ] Full access users can see all features
- [ ] Access level updates correctly on approval
- [ ] Test with sample user accounts

### **Deployment**:
- Run SQL migration on Live Server
- Deploy middleware to: `/var/www/hrcompliance.qolae.com/middleware/`
- Deploy utility to: `/var/www/hrcompliance.qolae.com/utils/`
- Update routes on Live Server
- Restart PM2: `pm2 restart qolae-hrcompliance`

---

## 🔄 EXECUTION TIMELINE

```
START (Hour 0)
├─ Agent 1: Read API contract + code setup (15 mins)
├─ Agent 2: Read API contract + code setup (15 mins)
└─ Agent 3: Read API contract + code setup (15 mins)

PARALLEL WORK (Hours 0.25 - 4)
├─ Agent 1: Frontend tasks (3-4 hours)
│  ├─ 1A.1.7: Registration Form (1.5h)
│  ├─ 1A.1.8: Display Lists (1.5h)
│  └─ 1A.3.7/3.8: Validation (1h)
│
├─ Agent 2: Auth tasks (2-3 hours)
│  ├─ 1A.2.2: Verify PIN (45m)
│  ├─ 1A.2.3: Send OTP (45m)
│  ├─ 1A.2.4: Verify OTP (45m)
│  └─ 1A.2.5: Create Password (45m)
│
└─ Agent 3: Data layer tasks (3-4 hours)
   ├─ 1A.3.3/3.4: Database tables (1h)
   ├─ 1A.3.6: File storage utility (1.5h)
   └─ 1A.4.1-4.4: Workspace access (1.5h)

SYNC POINT (Hour 4)
├─ All agents complete initial work
├─ Code review: Check API contract compliance
└─ Prepare for integration testing

INTEGRATION & TESTING (Hour 4-5)
├─ Agent 1: Frontend-to-API integration tests
├─ Agent 2: Auth flow E2E testing
├─ Agent 3: Database + file storage verification
└─ All: Cross-stream compatibility check

DEPLOYMENT (Hour 5)
├─ Copy files to Live Server
├─ Run database migrations
├─ Restart PM2 services
└─ Smoke test all endpoints

COMPLETE ✅
```

---

## 📋 COMMUNICATION PROTOCOL

**Shared Document**: `STEP1A_API_CONTRACT.md` (SINGLE SOURCE OF TRUTH)

**Daily Sync Points**:
- Hour 0: Kickoff (confirm understanding of API contract)
- Hour 2: Midpoint check-in (blockers? Any clarifications?)
- Hour 4: Integration planning (coordinate file deployment)

**Blockers & Questions**:
- Ask in: `AGENT_COMMUNICATION_TEMPLATE.md` Q&A section
- Response time: Max 30 minutes

**Code Review Before Deployment**:
- All agents review each other's code against API contract
- Check error handling, logging, security
- Verify database constraints and file permissions

---

## ✅ SUCCESS CRITERIA

**Agent 1 (Frontend)**: 
- [ ] All forms validate inputs correctly
- [ ] Display lists show real-time data from API
- [ ] File upload shows progress and respects size limits
- [ ] Responsive on mobile

**Agent 2 (Auth)**:
- [ ] PIN verification works with rate limiting
- [ ] OTP generated, emailed, verified correctly
- [ ] Password validation enforced
- [ ] All endpoints respond with correct status codes

**Agent 3 (Data)**:
- [ ] All database tables created and indexed
- [ ] Files saved to correct location with correct naming
- [ ] File metadata stored in database
- [ ] Access control middleware working

**Overall Step 1A**:
- [ ] Full end-to-end workflow: Register → PIN → OTP → Password → Compliance submission
- [ ] All API endpoints responding correctly
- [ ] Database transactions working
- [ ] Error handling graceful
- [ ] Security requirements met (rate limiting, validation, logging)
- [ ] Live Server deployed and tested

---

**Ready to deploy the agents, Liz? 💪🏽**
