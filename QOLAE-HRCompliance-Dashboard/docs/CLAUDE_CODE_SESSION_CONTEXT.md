# 🚀 CLAUDE CODE SESSION CONTEXT
**Last Updated**: October 19, 2025  
**Session Status**: Restarting after code termination  
**Priority**: Get back on track ASAP ⚡

---

## 📌 WHAT ARE WE DOING?

We're completing **STEP 1A: New Starter Registration Workflow** for the HR Compliance Dashboard.

**The Goal**: Enable Liz to register new Case Managers, and they complete compliance submission via a portal.

---

## 🎯 CURRENT PROGRESS

### ✅ COMPLETED (Don't Touch These)
- **Database Schema**: `new_starters`, `compliance`, `reference_forms` tables already exist
- **Backend**: Controllers, routes, PIN generation, email sending all functional
- **Login Portal**: `newStarter-login.ejs` - 2FA/OTP/Password creation DONE
- **Compliance Portal**: `newStarter-compliance.ejs` - 6-step form with validation & upload progress UI DONE
- **Frontend Validation**: Required fields, file type/size checking, duplicate prevention DONE
- **Upload Progress**: Visual progress bar with error recovery DONE

### 🔄 IN PROGRESS (What We Need Now)
**Task 1A.3.10**: Backend file upload handler
- Frontend is sending File objects via FormData
- Backend `/api/new-starter/submit-compliance` endpoint needs multipart/form-data support
- Files must be stored as **BYTEA (binary data) in the qolae_hrcompliance database**
- NOT in file system, NOT in central-repository

---

## 📂 KEY FILES & THEIR PURPOSE

### **New Starter Workflow Files**
```
/QOLAE-HRCompliance-Dashboard/
├── views/
│   ├── newStarter-login.ejs           → 2FA authentication portal
│   ├── newStarter-compliance.ejs       → 6-step compliance form ✅ DEPLOYED
│   └── partials/
│       └── readersRegistrationModal.ejs → Reader registration (different workflow)
│
├── controllers/
│   ├── NewStarterController.js         → Backend logic
│   └── ReadersController.js            → Reader workflow
│
├── routes/
│   ├── newStarterRoute.js              → API endpoints
│   └── readersRoutes.js                → Reader endpoints
│
├── database/
│   ├── setup_qolae_hrcompliance.sql    → Schema with BYTEA columns
│   └── add_readers_table.sql           → Readers table
│
├── utils/
│   ├── generateNewStarterPIN.js        → PIN generation
│   ├── sendNewStarterInvitation.js     → Email with PIN link
│   ├── generateCustomizedReadersNDA.js → NDA for readers
│   └── sendReaderInvitation.js         → Reader invitation email
│
└── docs/
    ├── STEP1A_API_CONTRACT.md          → All API specs ⭐
    ├── STEP1A_AGENT_COORDINATION.md    → Agent Q&A hub
    ├── step1a-interactive-tracker.html → Visual tracker
    └── HRComplianceChecklist.md        → Checklist
```

---

## 🔗 API ENDPOINTS REFERENCE

### **New Starter Registration** (Must support multipart/form-data)
```
POST /api/new-starter/register
  → Create new starter record, generate PIN

POST /api/new-starter/verify-pin
  → Verify PIN for 2FA flow

POST /api/new-starter/send-otp
  → Send OTP to email

POST /api/new-starter/verify-otp
  → Verify OTP code

POST /api/new-starter/create-password
  → Set password after OTP verification

POST /api/new-starter/submit-compliance  ⭐ THIS ONE NEEDS FIXING
  → Accept FormData with:
     - pin (string)
     - addressLine1, addressLine2, city, postcode
     - emergencyContactName, emergencyContactPhone, emergencyContactRelationship
     - identityDocuments (File array) → Store as BYTEA
     - utilityBills (File array) → Store as BYTEA
     - professionalReferenceName, Title, Email, Phone, Organisation, Relationship
     - characterReferenceName, Email, Phone, Relationship, KnownDuration
```

**Success Response**:
```json
{
  "success": true,
  "message": "Compliance submitted successfully",
  "pin": "NS-XX123456",
  "complianceId": 123
}
```

---

## 💾 DATABASE STORAGE

### **Files Must Go To**: `qolae_hrcompliance.new_starter_documents` table

**Schema** (already created):
```sql
CREATE TABLE new_starter_documents (
    id SERIAL PRIMARY KEY,
    new_starter_id INTEGER REFERENCES new_starters(id),
    document_type VARCHAR(50),        -- 'identity', 'proof_of_address'
    file_name VARCHAR(255),
    file_data BYTEA,                  -- ⭐ Binary data STORED HERE
    mime_type VARCHAR(50),
    file_size INTEGER,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### **How To Handle Files**:
1. Read file as Buffer: `const fileBuffer = await file.buffer;`
2. Store in database: `INSERT INTO new_starter_documents (file_data) VALUES ($1, [fileBuffer])`
3. Retrieve: `SELECT file_data FROM new_starter_documents WHERE id = $1`
4. Return to user: Set proper Content-Type header, send Buffer as response

---

## 🚨 CRITICAL RULES (From Liz)

1. **Use Fastify ONLY** - No Express
2. **Use ES6 modules** - `import/export`, NOT `require/module.exports`
3. **Use YARN for packages** - NOT npm
4. **Store files in database as BYTEA** - NOT file system, NOT central-repository
5. **Copy to Live Server directly** - `ssh root@91.99.184.77:/var/www/hrcompliance.qolae.com/`
6. **Restart with ecosystem.config** - `pm2 restart qolae-hrcompliance` (prevents cache issues)
7. **Test server-side** - Always verify on live server, not just local

---

## 📝 WHAT NEEDS TO BE DONE NOW

### **Task 1A.3.10: Backend File Upload Handler**

**Frontend Sends**: FormData with File objects
```javascript
const submitData = new FormData();
submitData.append('pin', newStarterPin);
submitData.append('identityDocuments', file1);  // File object
submitData.append('identityDocuments', file2);  // File object
submitData.append('utilityBills', file3);       // File object
// ... plus all form data
```

**Backend Must**:
1. Parse multipart/form-data using Fastify's `@fastify/multipart` plugin
2. Extract files from request
3. For each file:
   - Read as Buffer
   - Store in `new_starter_documents` table with file_data as BYTEA
4. Store form data in `compliance` table
5. Return success response with complianceId

**Reference Code Pattern** (from readers workflow):
```javascript
import multipart from '@fastify/multipart';

// Register plugin
server.register(multipart, { limits: { fileSize: 10 * 1024 * 1024 } });

// Handle multipart POST
server.post('/api/new-starter/submit-compliance', async (request, reply) => {
  try {
    const data = await request.file();
    const fileBuffer = await data.file.buffer();
    
    // Store fileBuffer as BYTEA in database
    // ...
  } catch (error) {
    // error handling
  }
});
```

---

## 🧪 TESTING CHECKLIST

After deployment, Liz will test:
- [ ] Fill all 17 required fields
- [ ] Upload identity document (PDF/JPG < 10MB)
- [ ] Upload proof of address document
- [ ] Click Submit
- [ ] Progress bar animates 0% → 100%
- [ ] Success message appears
- [ ] Files stored in database (not file system)
- [ ] Can retrieve and download files later

---

## 📞 IF YOU GET STUCK

**Common Issues**:
1. **"multipart is not defined"** → Need to install: `yarn add @fastify/multipart`
2. **"Files not storing"** → Check BYTEA column exists in table
3. **"Cache issues"** → Always use `pm2 restart qolae-hrcompliance`
4. **"Files in wrong place"** → Make sure storing in DB, not `/var/www/...`

**Key References**:
- API Contract: `STEP1A_API_CONTRACT.md` (all endpoint specs)
- Agent Hub: `STEP1A_AGENT_COORDINATION.md` (Q&A section)
- Similar Code: `ReadersController.js` (how readers handle files)

---

## 🎯 YOUR IMMEDIATE NEXT STEPS

1. Read `STEP1A_API_CONTRACT.md` section for `/api/new-starter/submit-compliance`
2. Check current `NewStarterController.js` for submit-compliance handler
3. Add multipart plugin to `hrc_server.js`
4. Update submit-compliance route to handle File objects
5. Store files as BYTEA in `new_starter_documents` table
6. Test on live server
7. Report back to Liz with results

---

## ✅ SUCCESS CRITERIA

**You'll know you're done when**:
- ✅ Frontend validation works (tested locally)
- ✅ File upload progress shows (tested locally)
- ✅ Backend accepts FormData with files
- ✅ Files stored in DB as BYTEA (checked with `psql`)
- ✅ No errors on live server (checked logs)
- ✅ Liz can test end-to-end workflow

---

## 📋 DOCUMENT CHECKLIST

Before you start, have these open:
- [ ] `STEP1A_API_CONTRACT.md` - Your spec
- [ ] `NewStarterController.js` - Current code
- [ ] `newStarter-compliance.ejs` - What frontend sends
- [ ] `setup_qolae_hrcompliance.sql` - Database schema

---

**Owner**: Liz Chukwu  
**Status**: Ready to Continue 🚀  
**Last Worked On**: October 19, 2025

---

If you have questions, check:
1. This file first (quick answers above)
2. `STEP1A_AGENT_COORDINATION.md` (Q&A section)
3. Ask in coordination doc for others to help

---

## 📝 Task 1A.4: Workspace Access Rules (After Approval)

**The Missing Link - How New Starters Access Case Managers Dashboard**:

### **After Liz Approves Compliance**:
1. New Starter record created in `qolae_casemanagers.case_managers` table (using their PIN)
2. Workspace access rules created in `qolae_casemanagers.workspace_access_rules` (limited features)
3. New Starter email sent: "Your workspace is ready!"

### **New Starter Login to Case Managers Dashboard**:
```
PIN: NS-LC123456
Email: liz.chukwu@qolae.com
Password: (created during 2FA in newStarter-login.ejs)
```

### **System Check on Login**:
1. Verify PIN + Email + Password in `qolae_casemanagers.case_managers`
2. Check `workspace_access_rules` for this PIN
3. Load dashboard with **greyed-out features** based on access_level

### **Database Schema Needed** (Task 1A.4.1):

```sql
-- In qolae_casemanagers database

CREATE TABLE case_managers (
    id SERIAL PRIMARY KEY,
    pin VARCHAR(20) UNIQUE NOT NULL,        -- NS-LC123456 from new_starters
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,    -- Hashed password from 2FA
    status VARCHAR(50) DEFAULT 'pending',   -- pending → approved → active
    compliance_approved BOOLEAN DEFAULT FALSE,
    approved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE workspace_access_rules (
    id SERIAL PRIMARY KEY,
    case_manager_pin VARCHAR(20) REFERENCES case_managers(pin),
    feature VARCHAR(100),                   -- 'create_case', 'edit_case', 'view_reports', etc.
    access_level VARCHAR(50),               -- 'full', 'limited', 'read_only', 'none'
    enabled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP
);
```

### **What Gets Greyed Out for New Starters** (Limited Access):
- ✅ Can view cases (read_only)
- ❌ Cannot create new cases (disabled/greyed)
- ❌ Cannot edit cases (disabled/greyed)
- ❌ Cannot assign readers (disabled/greyed)
- ✅ Can view reports (read_only)

### **When Does Access Change**:
- **Compliance Submitted**: Limited access enabled
- **Compliance Approved by Liz**: Full access granted
- **New Starter Leaves**: Access disabled/revoked

---
