# 🚀 STEP 1A.4: Flexible Workspace Access - Parallel Agents Context

**Date**: October 19, 2025
**Status**: 3 of 7 tasks complete, 4 remaining
**Execution**: Parallel agents (Atlas, Iris, Sage)

---

## 📌 WHAT IS STEP 1A.4?

**Goal**: New Starters get **limited workspace access** while compliance is being reviewed, then full access once approved.

**Workflow**:
```
New Starter Submits Compliance
        ↓
Gets LIMITED ACCESS to CaseManagers Dashboard
        ↓
Liz Reviews & Approves Compliance
        ↓
New Starter Gets FULL ACCESS + Notification
```

---

## ✅ ALREADY COMPLETE (DO NOT TOUCH)

None yet - all tasks pending for STEP 1A.4

---

## 🎯 YOUR TASKS (7 Total)

### **ATLAS AGENT - Task 1A.4.1: Create Workspace Access Tables**
**Est: 20-30 min**
**Location**: `/database/` - Create new migration file

**Database**: `qolae_casemanagers` (NOT qolae_hrcompliance)

**What to create**:

```sql
-- Run on qolae_casemanagers database

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

-- Create indexes for fast lookups
CREATE INDEX idx_case_managers_pin ON case_managers(pin);
CREATE INDEX idx_workspace_rules_pin ON workspace_access_rules(case_manager_pin);
```

**Instructions**:
1. Create file: `/database/add_workspace_access_tables.sql`
2. SSH to server and run: `psql -U postgres -d qolae_casemanagers -f add_workspace_access_tables.sql`
3. Verify tables created: `psql -U postgres -d qolae_casemanagers -c '\dt'`
4. Report back when complete

---

### **ATLAS AGENT - Task 1A.4.2: Features API Route**
**Est: 30-45 min**

**What to build:**
```
GET /api/workspace/features
Query params: ?pin=NS-XX123456
Response: { features: {...}, accessLevel: 'limited'|'full' }
```

**Location**: CaseManagers Dashboard - `/controllers/` (create new CaseManagerAccessController.js OR add to existing)
**Database**: Query `qolae_casemanagers.workspace_access_rules` table

**Feature List** (based on access level):

**FULL ACCESS** (compliance_approved = true):
```javascript
{
  "canViewCases": true,
  "canCreateCases": true,
  "canEditCases": true,
  "canViewReports": true,
  "canGenerateReports": true,
  "canAssignReaders": true,
  "canViewFinances": true,
  "canAccessSettings": true
}
```

**LIMITED ACCESS** (compliance_approved = false):
```javascript
{
  "canViewCases": true,      // View only
  "canCreateCases": false,   // GREYED OUT
  "canEditCases": false,     // GREYED OUT
  "canViewReports": false,   // GREYED OUT
  "canGenerateReports": false, // GREYED OUT
  "canAssignReaders": false, // GREYED OUT
  "canViewFinances": false,  // GREYED OUT
  "canAccessSettings": false // GREYED OUT
}
```

**Implementation Pattern**:
1. Extract `pin` from query params
2. Query `qolae_casemanagers.case_managers` table: `SELECT compliance_approved FROM case_managers WHERE pin = $1`
3. Query `qolae_casemanagers.workspace_access_rules` table for all features
4. Build feature object based on compliance_approved boolean + access_rules
5. Return with 200 OK

```javascript
// Pseudocode
async getWorkspaceFeatures(request, reply) {
  const { pin } = request.query;

  // Get case manager compliance status
  const caseManager = await query('SELECT compliance_approved FROM case_managers WHERE pin = $1', [pin]);

  if (!caseManager) {
    return reply.code(404).send({ error: 'Case manager not found' });
  }

  // Get access rules for this PIN
  const rules = await query(
    'SELECT feature, access_level, enabled FROM workspace_access_rules WHERE case_manager_pin = $1',
    [pin]
  );

  // Build features object
  const features = buildFeatureObject(rules, caseManager.compliance_approved);

  return {
    success: true,
    features,
    accessLevel: caseManager.compliance_approved ? 'full' : 'limited'
  };
}
```

**Add Route to** `newStarterRoute.js`:
```javascript
fastify.get('/api/workspace/features', {
  schema: {
    querystring: {
      type: 'object',
      required: ['pin'],
      properties: {
        pin: { type: 'string' }
      }
    }
  }
}, NewStarterController.getWorkspaceFeatures);
```

---

### **IRIS AGENT - Task 1A.4.3: Frontend Greying**
**Est: 45-60 min**

**What to build:**
Grey out (disable) restricted features in CaseManagers Dashboard

**Location**: CaseManagers Dashboard - `/views/casemanagers-dashboard.ejs` or related components

**Implementation Pattern**:

1. **On page load**, call the features API:
```javascript
async function initializeAccessControl() {
  const pin = getCurrentUserPin(); // From session/cookie
  const response = await fetch(`/api/workspace/features?pin=${pin}`);
  const { features, accessLevel } = await response.json();

  applyAccessControl(features);
}
```

2. **Disable buttons/links** for restricted features:
```html
<!-- Example: Create Case Button -->
<button id="createCaseBtn" onclick="createCase()">
  + Create Case
</button>

<script>
function applyAccessControl(features) {
  // Disable create button if no access
  document.getElementById('createCaseBtn').disabled = !features.canCreateCases;
  document.getElementById('createCaseBtn').style.opacity = !features.canCreateCases ? '0.5' : '1';

  // Add tooltip on hover
  if (!features.canCreateCases) {
    document.getElementById('createCaseBtn').title =
      'Available once compliance is approved';
  }

  // Hide or grey other elements based on features object
  greyOutElement('generateReports', features.canGenerateReports);
  greyOutElement('assignReaders', features.canAssignReaders);
  greyOutElement('viewFinances', features.canViewFinances);
  greyOutElement('accessSettings', features.canAccessSettings);
}

function greyOutElement(elementId, canAccess) {
  const element = document.getElementById(elementId);
  if (!canAccess) {
    element.style.opacity = '0.5';
    element.style.pointerEvents = 'none';
    element.style.cursor = 'not-allowed';
    element.title = 'Available once compliance is approved';
  }
}
</script>
```

**Key Requirements**:
- ✅ Call features API on dashboard load
- ✅ Disable restricted buttons (set `disabled` attribute)
- ✅ Reduce opacity to 50% for disabled elements
- ✅ Add tooltip: "Available once compliance is approved"
- ✅ Prevent click events on disabled elements (`pointer-events: none`)
- ✅ Visual feedback (cursor: not-allowed, color change, etc.)

**CSS to Add**:
```css
.feature-restricted {
  opacity: 0.5;
  pointer-events: none;
  cursor: not-allowed;
  background-color: #f0f0f0;
}

.feature-restricted:hover {
  background-color: #f0f0f0; /* No hover effect for disabled */
}
```

---

### **SAGE AGENT - Task 1A.4.4: Approval Notification & Access Sync**
**Est: 30-45 min**

**What to build:**
When Liz approves compliance, new starter receives **WebSocket notification** and their workspace access is updated

**Location**:
- HR Compliance: `/controllers/NewStarterController.js` (approveCompliance method)
- Services: `/services/NotificationService.js`
- CaseManagers: Corresponding controller to handle sync

**What Sage Does**:
1. In `NewStarterController.js` `approveCompliance()` method:
   - After compliance approved in HR Compliance DB
   - INSERT new row in `qolae_casemanagers.case_managers` table (with PIN, name, email, password_hash)
   - INSERT rules in `qolae_casemanagers.workspace_access_rules` (enabled = true for 'full' access)
   - Emit WebSocket notification to new starter

```javascript
// After compliance approved in database:

// 1. Create case manager record in qolae_casemanagers
const caseManagerQuery = `
  INSERT INTO case_managers (pin, name, email, password_hash, status, compliance_approved, approved_at)
  VALUES ($1, $2, $3, $4, 'active', true, NOW())
`;
await queryOnCaseManagersDb(caseManagerQuery, [
  newStarter.pin,
  newStarter.full_name,
  newStarter.email,
  newStarter.password_hash  // Already hashed from 2FA
]);

// 2. Create full access rules
const featuresForFullAccess = [
  'create_case', 'edit_case', 'view_cases', 'view_reports',
  'generate_reports', 'assign_readers', 'view_finances', 'access_settings'
];

for (const feature of featuresForFullAccess) {
  await queryOnCaseManagersDb(
    'INSERT INTO workspace_access_rules (case_manager_pin, feature, access_level, enabled) VALUES ($1, $2, $3, true)',
    [newStarter.pin, feature, 'full']
  );
}

// 3. Emit notification
notificationService.sendNotification({
  type: 'compliance_approved',
  message: `Your compliance has been approved! You now have full workspace access.`,
  data: {
    pin: newStarter.pin,
    name: newStarter.full_name,
    accessLevel: 'full'
  },
  timestamp: new Date().toISOString()
});
```

**Frontend Listener** (in `casemanagers-dashboard.ejs`):
```javascript
// WebSocket listener
socket.on('compliance_approved', (data) => {
  if (data.pin === getCurrentUserPin()) {
    // Show toast notification
    showNotification({
      type: 'success',
      title: 'Compliance Approved! 🎉',
      message: 'You now have full workspace access.',
      duration: 5000
    });

    // Refresh access control
    initializeAccessControl();
  }
});
```

**Implementation Steps**:
1. ✅ Add notification emit in `approveCompliance()` after DB update
2. ✅ Make sure `notificationService.sendNotification()` sends to **specific pin** (not broadcast)
3. ✅ Frontend listens for `compliance_approved` event
4. ✅ On notification received, refresh access control features
5. ✅ Show visual feedback (toast/alert) to user

**Key Pattern**: Reuse existing WebSocket structure from other notifications in codebase

---

### **PHOENIX AGENT - Task 1A.4.5: End-to-End Access Control Test**
**Est: 60-90 min** (Start after other agents complete)

**What to test** (End-to-End):

1. **New Starter Portal**:
   - ✅ Login as new starter (PIN-based)
   - ✅ Submit compliance form + files
   - ✅ Verify status changes to `compliance_submitted`

2. **Limited Access Dashboard**:
   - ✅ New starter sees CaseManagers Dashboard
   - ✅ Can view cases (read-only)
   - ✅ Cannot create cases (button disabled + greyed)
   - ✅ Cannot generate reports (greyed)
   - ✅ Cannot assign readers (greyed)
   - ✅ Cannot view finances (greyed)
   - ✅ Tooltip shows "Available once compliance is approved"

3. **Liz Approval**:
   - ✅ Liz logs in to HR Compliance Dashboard
   - ✅ Views new starter compliance submission
   - ✅ Clicks "Approve Compliance" button
   - ✅ System updates `compliance_approved = true`

4. **Full Access**:
   - ✅ New starter receives WebSocket notification
   - ✅ Toast shows "Compliance Approved! 🎉"
   - ✅ Dashboard refreshes features
   - ✅ All previously greyed buttons are now **enabled**
   - ✅ Can click "Create Case", "Generate Report", etc.

5. **Database Verification**:
   - ✅ Check `new_starters.compliance_approved = true` for new starter PIN
   - ✅ Check notification was recorded in logs
   - ✅ Verify no errors on live server

**Test on**: Live Server (91.99.184.77:3012)

---

## 🗄️ DATABASE SCHEMA REFERENCE

**case_managers table** (in qolae_casemanagers):
```sql
-- Created in Task 1A.4.1
id SERIAL PRIMARY KEY
pin VARCHAR(20) UNIQUE NOT NULL        -- NS-LC123456
name VARCHAR(255) NOT NULL
email VARCHAR(255) NOT NULL
password_hash VARCHAR(255) NOT NULL    -- From 2FA
status VARCHAR(50) DEFAULT 'pending'   -- pending → approved → active
compliance_approved BOOLEAN DEFAULT FALSE
approved_at TIMESTAMP
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

**workspace_access_rules table** (in qolae_casemanagers):
```sql
-- Created in Task 1A.4.1
id SERIAL PRIMARY KEY
case_manager_pin VARCHAR(20) REFERENCES case_managers(pin)
feature VARCHAR(100)                   -- 'create_case', 'edit_case', etc.
access_level VARCHAR(50)               -- 'full', 'limited', 'read_only', 'none'
enabled BOOLEAN DEFAULT FALSE
created_at TIMESTAMP
```

---

## 🔌 CRITICAL TECHNICAL NOTES

**For All Agents**:
1. **Use Fastify ONLY** - No Express, no other frameworks
2. **Use ES6 modules** - `import/export` NOT `require`
3. **Use YARN only** - NO npm (creates clutter)
4. **Server**: SSH root@91.99.184.77 → `/var/www/hrcompliance.qolae.com/`
5. **PM2 Service**: `qolae-hrcompliance` (port 3012)
6. **Restart after deploy**: `pm2 restart ecosystem.config.js --only qolae-hrcompliance`
7. **Test on live server** - Not just local
8. **Git style**: Location Block Protocol (check LocationBlockProtocol.md)

---

## 📁 KEY FILES

**Backend**:
- `/controllers/NewStarterController.js` - Add `getWorkspaceFeatures()` method
- `/routes/newStarterRoute.js` - Add GET route
- `/services/NotificationService.js` - Emit on approval
- `hrc_server.js` - WebSocket already configured

**Frontend**:
- `/views/casemanagers-dashboard.ejs` - Grey out UI + listen for notifications
- Other component files (identify which buttons need greying)

---

## ✅ SUCCESS CRITERIA

**When ALL tasks complete**:
- ✅ New starters get limited access on compliance submission
- ✅ Restricted features are greyed out with clear messaging
- ✅ Liz can approve compliance from HR Dashboard
- ✅ New starters receive real-time notification
- ✅ Access automatically upgrades to full after approval
- ✅ All buttons/features become enabled
- ✅ No errors on live server logs

---

## 🚨 IF YOU GET STUCK

**Common Issues**:

1. **"WebSocket not connected"**
   - Check Socket.IO is initialized in dashboard
   - Verify WebSocket server running on correct port
   - Check browser console for connection errors

2. **"Features API returns 500"**
   - Verify `new_starters` table exists
   - Check PIN parameter is being passed
   - Look at `pm2 logs qolae-hrcompliance`

3. **"Buttons not greying"**
   - Verify CSS is applied (check DevTools Elements)
   - Make sure `applyAccessControl()` is called on load
   - Check feature flags are correct boolean values

4. **"Approval notification not showing"**
   - Verify `notificationService.sendNotification()` is called
   - Check WebSocket listener is attached to correct event name
   - Make sure PIN matches current user PIN

---

## 📞 AGENT COORDINATION

**If you need to ask questions or get clarification:**
1. Check this document first
2. Read `STEP1A_API_CONTRACT.md` for API specs
3. Ask in coordination channel (we're all online)
4. Reference the Location Block Protocol in code

---

## ⏱️ EXECUTION TIMELINE

```
Task 1A.4.1 (ATLAS - Sequential): 20-30 min
    ↓ (must complete first)
Tasks 1A.4.2, 1A.4.3, 1A.4.4 (ATLAS, IRIS, SAGE - Parallel): ~50-60 min
    ↓ (all must complete before testing)
Task 1A.4.5 (PHOENIX - Testing): 60-90 min

TOTAL: 2-2.5 hours
```

**Parallel Execution Start**: When approved ✅
**Expected Completion**: 2-2.5 hours total
**Owner**: Liz Chukwu
**Last Updated**: October 19, 2025

---

**Ready to dispatch agents? ✅**

---

Good luck, agents! 🚀
