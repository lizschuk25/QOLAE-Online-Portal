# 📁 HR Compliance Dashboard - Complete File Structure Guide

## 🎯 QUICK REFERENCE

This document explains **every file and folder** in the HR Compliance Dashboard and what it does.

---

## 📂 PROJECT STRUCTURE

```
QOLAE-HRCompliance-Dashboard/
├── 🔌 SERVER & CONFIG
│   ├── hrc_server.js                    ← Main Fastify server (port 3012)
│   ├── package.json                     ← Dependencies
│   ├── yarn.lock                        ← Locked versions
│   └── config/
│       ├── database.js                  ← PostgreSQL connection pool
│       ├── websocket.js                 ← WebSocket configuration
│       └── hrCompliance-nginx.conf      ← Nginx config
│
├── 🗄️ DATABASE
│   └── database/
│       ├── setup_qolae_hrcompliance.sql ← Schema creation (tables, indexes)
│       └── add_readers_table.sql        ← Reader table migration
│
├── 🎮 BACKEND LOGIC
│   ├── controllers/                     ← Business logic for each workflow
│   │   ├── NewStarterController.js      ← New CM registration & compliance
│   │   ├── ReadersController.js         ← Reader registration & compliance
│   │   ├── ReadersComplianceController.js ← Reader compliance review
│   │   ├── ComplianceReviewController.js  ← Compliance review process
│   │   ├── ComplianceController.js      ← General compliance ops
│   │   ├── OperationsController.js      ← Workload/assignments
│   │   ├── ClientsController.js         ← Client management
│   │   ├── DashboardController.js       ← Dashboard data
│   │   └── AssignmentController.js      ← Case assignments
│   │
│   ├── routes/                          ← API endpoints
│   │   ├── newStarterRoute.js           ← /api/new-starter/* endpoints
│   │   ├── readersRoutes.js             ← /api/readers/* endpoints
│   │   ├── readersComplianceRoute.js    ← /api/readers-compliance/* endpoints
│   │   ├── complianceReviewRoutes.js    ← /api/compliance-review/* endpoints
│   │   ├── complianceRoutes.js          ← /api/compliance/* endpoints
│   │   ├── operationsRoutes.js          ← /api/operations/* endpoints
│   │   ├── clientsRoutes.js             ← /api/clients/* endpoints
│   │   ├── assignmentRoutes.js          ← /api/assignments/* endpoints
│   │   └── dashboardRoutes.js           ← /api/dashboard/* endpoints
│   │
│   ├── models/                          ← Data models for database queries
│   │   ├── Compliance.js                ← Compliance record operations
│   │   ├── Reader.js                    ← Reader operations
│   │   ├── CaseManager.js               ← Case Manager operations
│   │   ├── Client.js                    ← Client operations
│   │   └── Assignment.js                ← Assignment operations
│   │
│   ├── services/                        ← Business logic & utilities
│   │   ├── NotificationService.js       ← WebSocket/Email/SMS notifications
│   │   ├── ComplianceChecker.js         ← Compliance validation logic
│   │   ├── WorkloadCalculator.js        ← Workload algorithms
│   │   └── ConsentMonitor.js            ← Consent tracking
│   │
│   └── utils/                           ← Helper functions
│       ├── generateNewStarterPIN.js     ← Generate NS-LC-123456 format PIN
│       ├── sendNewStarterInvitation.js  ← Email invitation to new CMs
│       ├── generateCustomizedReadersNDA.js ← PDF NDA generation
│       ├── sendReaderInvitation.js      ← Email invitation to readers
│       ├── referenceCollection.js       ← Reference collection logic
│       └── agentSoundHooks.js           ← Sound notifications for agents
│
├── 🎨 FRONTEND (USER INTERFACE)
│   ├── views/
│   │   ├── hrCompliance-dashboard.ejs   ← 🎯 MAIN DASHBOARD (Liz sees this)
│   │   │                                   Sidebar + 4 main tabs:
│   │   │                                   - Dashboard Home
│   │   │                                   - New Starters
│   │   │                                   - Readers
│   │   │                                   - Compliance Review
│   │   │
│   │   ├── overview-tab.ejs             ← Dashboard home content
│   │   ├── readers-tab.ejs              ← Readers management tab
│   │   ├── casemanagers-tab.ejs         ← Case Managers tab
│   │   ├── clients-tab.ejs              ← Clients tab (empty)
│   │   ├── layout.ejs                   ← Base layout template
│   │   │
│   │   ├── newStarter-compliance.ejs    ← 🎯 NEW STARTER PORTAL (they see this)
│   │   │                                   6-step wizard for compliance submission
│   │   │
│   │   ├── readers-compliance.ejs       ← Reader compliance portal
│   │   ├── readersRegistration.ejs      ← Reader registration (standalone/legacy)
│   │   │
│   │   └── partials/                    ← Reusable components
│   │       ├── header.ejs               ← Page header
│   │       ├── sidebar.ejs              ← Sidebar navigation
│   │       ├── modals.ejs               ← Modal windows
│   │       └── readersRegistrationModal.ejs ← Reader registration modal
│   │
│   ├── assets/
│   │   ├── css/
│   │   │   ├── main.css                 ← QOLAE branding & base styles
│   │   │   └── dashboard.css            ← Dashboard-specific styles
│   │   │
│   │   ├── js/
│   │   │   ├── dashboard.js             ← Dashboard interactions & API calls
│   │   │   ├── operations.js            ← Operations/workload JS
│   │   │   ├── websocket-client.js      ← Client-side WebSocket handler
│   │   │   └── [other JS files]
│   │   │
│   │   ├── images/                      ← Images (if any)
│   │   │
│   │   └── sounds/
│   │       ├── setup-sounds.sh          ← Script to create sound files
│   │       └── [sound files]
│   │
│
├── 📊 DOCUMENTATION
│   └── docs/
│       ├── HRComplianceWorkflow.md      ← 📖 Complete workflow explanation
│       ├── Step1A_NewStarters_Tracker.md ← Detailed Step 1A deliverables
│       ├── AGENT_INSTRUCTIONS.md        ← Instructions for all 5 agents
│       ├── AGENT_COMMUNICATION_TEMPLATE.md ← Template for agent comms
│       ├── HRComplianceChecklist.md     ← Implementation checklist
│       ├── HRComplianceREADME.md        ← Project overview
│       └── PlanBuildImplement.md        ← Build plan
│
├── 🛠️ SETUP SCRIPTS
│   ├── setup_hrCompliance_infrastructure.sh ← Initialize project
│   └── setup-sounds.sh                   ← Set up sound notifications
│
└── 📊 TRACKING
    ├── agent-tracker.html               ← Visual agent progress tracker
    └── step1a-interactive-tracker.html  ← Step 1A deliverables tracker
```

---

## 🔄 KEY WORKFLOWS (Which files are involved)

### **NEW STARTER (CASE MANAGER) ONBOARDING**

1. **Liz registers new CM** → `hrCompliance-dashboard.ejs` (New Starters tab)
2. **API call** → `newStarterRoute.js` POST `/api/new-starter/create`
3. **Backend processing** → `NewStarterController.js` createNewStarter()
4. **PIN generation** → `generateNewStarterPIN.js`
5. **Email sent** → `sendNewStarterInvitation.js`
6. **Database** → `new_starters` table in `setup_qolae_hrcompliance.sql`
7. **New CM receives email** → Clicks PIN link
8. **Portal loads** → `newStarter-compliance.ejs`
9. **They submit docs** → API call to `newStarterRoute.js` POST `/api/new-starter/submit-compliance`
10. **Stored** → `compliance` table
11. **Notification** → `NotificationService.js` sends WebSocket to Liz
12. **Liz reviews** → Uses `ComplianceReviewController.js`
13. **Liz approves** → `NewStarterController.js` approveCompliance()
14. **CM gets access** → Updated in `new_starters` table

---

### **READER REGISTRATION** (Similar pattern)

1. Liz uses modal in `hrCompliance-dashboard.ejs` Readers tab
2. API → `readersRoutes.js` POST `/api/readers/register`
3. Backend → `ReadersController.js` 
4. PIN generated → `generateNewStarterPIN.js` (reused for readers)
5. Email → `sendReaderInvitation.js`
6. Reader portal → `readers-compliance.ejs`
7. Submission → `ReadersComplianceController.js`
8. Review → `ComplianceReviewController.js`
9. Approval → `ReadersController.js`

---

### **COMPLIANCE REVIEW & REFERENCE COLLECTION**

1. **Submission notification** → WebSocket via `NotificationService.js`
2. **Liz sees in dashboard** → `ComplianceReviewController.js` provides data
3. **Liz reviews docs** → Downloaded from database
4. **Collects references** → Phone or email via `referenceCollection.js`
5. **Reference forms** → `reference_forms` table
6. **Approval process** → `ComplianceController.js` approveCompliance()
7. **Notification to person** → `NotificationService.js` sends to new CM/reader

---

## 📝 WHAT EACH FILE DOES (DETAILED)

### **🖥️ VIEWS (What Liz and others SEE)**

| File | Purpose | User | Status |
|------|---------|------|--------|
| `hrCompliance-dashboard.ejs` | Main dashboard with all tabs | Liz | ✅ Structure exists, content partial |
| `newStarter-compliance.ejs` | 6-step compliance wizard | New Case Managers | ✅ Complete |
| `readers-compliance.ejs` | Reader compliance portal | Readers | ✅ Complete |
| `readersRegistrationModal.ejs` | Modal to register readers | Liz (in dashboard) | ✅ Complete |
| `overview-tab.ejs` | Dashboard home stats | Liz | ⏳ Partially implemented |
| `readers-tab.ejs` | Reader management | Liz | ⏳ Partially implemented |
| `casemanagers-tab.ejs` | Case Manager management | Liz | ❌ Empty stub |
| `clients-tab.ejs` | Client management | Liz | ❌ Empty stub |

### **🎮 CONTROLLERS (What happens BEHIND THE SCENES)**

| File | Methods | Purpose | Status |
|------|---------|---------|--------|
| `NewStarterController.js` | createNewStarter, getNewStarterByPIN, submitCompliance, approveCompliance, getAllNewStarters | New CM registration & compliance | ✅ Complete |
| `ReadersController.js` | registerReader, submitCompliance, approveCompliance | Reader registration | ✅ Complete |
| `ReadersComplianceController.js` | submitCompliance, getComplianceStatus, updateReferenceStatus | Reader compliance handling | ✅ Complete |
| `ComplianceReviewController.js` | getComplianceDetails, approveCompliance, rejectCompliance | Review process | ✅ Complete |
| `ComplianceController.js` | getComplianceRecords, updateCompliance | General compliance ops | ✅ Complete |
| `OperationsController.js` | calculateWorkload, assignCase, getAssignments | Workload management | ✅ Complete |
| `ClientsController.js` | manageConsent, trackConsent | Client management | ✅ Complete |
| `DashboardController.js` | getDashboardData, getPendingCompliance | Dashboard statistics | ✅ Complete |
| `AssignmentController.js` | createAssignment, updateAssignment | Case assignments | ✅ Complete |

### **🛣️ ROUTES (API ENDPOINTS)**

| File | Endpoints | Purpose | Status |
|------|-----------|---------|--------|
| `newStarterRoute.js` | POST /api/new-starter/create, /submit-compliance, /approve, /send-reminder | New CM registration | ✅ Complete |
| `readersRoutes.js` | POST /api/readers/register, /submit-compliance, /approve | Reader registration | ✅ Complete |
| `readersComplianceRoute.js` | POST /api/readers-compliance/submit, /review | Compliance handling | ✅ Complete |
| `complianceReviewRoutes.js` | GET /api/compliance-review/pending, POST /approve | Review process | ✅ Complete |
| `complianceRoutes.js` | Various /api/compliance/* | General compliance | ✅ Complete |
| `operationsRoutes.js` | /api/operations/workload, /assignments | Operations | ✅ Complete |
| `clientsRoutes.js` | /api/clients/consent | Client management | ✅ Complete |
| `assignmentRoutes.js` | /api/assignments/* | Case assignments | ✅ Complete |
| `dashboardRoutes.js` | GET /api/dashboard/overview, /stats | Dashboard data | ✅ Complete |

### **🔌 SERVICES (SHARED LOGIC)**

| File | Purpose | Status |
|------|---------|--------|
| `NotificationService.js` | WebSocket, email, SMS notifications | ✅ Complete |
| `ComplianceChecker.js` | Validates compliance submissions | ✅ Complete |
| `WorkloadCalculator.js` | Calculates workload for assignments | ✅ Complete |
| `ConsentMonitor.js` | Tracks client consent status | ✅ Complete |

### **⚙️ UTILITIES (HELPER FUNCTIONS)**

| File | Purpose | Status |
|------|---------|--------|
| `generateNewStarterPIN.js` | Generates NS-LC-123456 format PINs | ✅ Complete |
| `sendNewStarterInvitation.js` | Sends email invitation to new CMs | ✅ Complete |
| `sendReaderInvitation.js` | Sends email invitation to readers | ✅ Complete |
| `generateCustomizedReadersNDA.js` | Generates PDF NDAs | ✅ Complete |
| `referenceCollection.js` | Handles reference collection logic | ✅ Complete |
| `agentSoundHooks.js` | Sound notifications for agents | ✅ Complete |

### **📊 DATABASE**

| File | Purpose | Status |
|------|---------|--------|
| `database.js` | PostgreSQL connection pool & queries | ✅ Complete |
| `setup_qolae_hrcompliance.sql` | Database schema (tables, indexes, triggers) | ✅ Complete |
| `add_readers_table.sql` | Reader table migration | ✅ Complete |

### **📄 MODELS**

| File | Purpose | Status |
|------|---------|--------|
| `Compliance.js` | Compliance record queries | ✅ Complete |
| `Reader.js` | Reader queries | ✅ Complete |
| `CaseManager.js` | Case Manager queries | ✅ Complete |
| `Client.js` | Client queries | ✅ Complete |
| `Assignment.js` | Assignment queries | ✅ Complete |

---

## 🎯 WHICH FILES DO YOU ACTUALLY INTERACT WITH?

**As Liz (using the dashboard):**
- You see: `hrCompliance-dashboard.ejs` (main UI)
- You interact with: New Starters tab, Readers tab, Compliance Review tab

**As a New Starter (using the portal):**
- You see: `newStarter-compliance.ejs` (after clicking PIN link from email)
- You submit docs in the 6-step wizard

**As a Reader:**
- You see: `readers-compliance.ejs` (after clicking PIN link from email)
- You submit compliance docs

---

## 📌 SUMMARY

- **Controllers** = Business logic (what happens when you click a button)
- **Routes** = API endpoints (how frontend talks to backend)
- **Views** = What users see (HTML templates)
- **Services** = Shared business logic (notifications, compliance checking)
- **Utils** = Helper functions (PIN generation, email sending)
- **Models** = Database operations (queries)
- **Database** = Where data is stored (PostgreSQL)

---

Does this help clarify what all the files do, Liz? 💚
