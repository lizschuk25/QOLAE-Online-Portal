# 📋 STEP 1A: NEW STARTER REGISTRATION WORKFLOW TRACKER
**Last Updated**: [Auto-update]
**Status**: 🟡 In Progress
**Target Completion**: Today

---

## 🎯 OVERVIEW
This tracker monitors the complete Step 1A workflow: New Starter registration, PIN generation, email invitation, and portal access setup.

---

## 📊 QUICK STATS
- **Total Deliverables**: 16
- **Completed**: 0
- **In Progress**: 0
- **Blocked**: 0
- **Overall Progress**: 0%

---

## 🔄 STEP 1A.1: NEW STARTER REGISTRATION FORM
**What it does**: Liz registers a new Case Manager with basic details. System auto-generates a unique PIN.
**Access**: `hrcompliance.qolae.com/new-starter` (Dashboard Tab)
**Owner**: Atlas Agent

### Deliverables

#### Database Layer
- [ ] **1A.1.1** Database schema: `qolae_hrcompliance.new_starters` table created
  - Columns: `id`, `first_name`, `last_name`, `email`, `role`, `department`, `start_date`, `pin_code`, `registration_status`, `login_status`, `compliance_status`, `workspace_access`, `created_at`, `updated_at`
  - Constraints: `email` UNIQUE, `pin_code` UNIQUE
  - Status column tracking: `registration_status` (invited, portal_accessed, compliance_submitted, approved)
  - Verification: ✅ Schema matches Step 1A workflow

#### Backend Layer
- [ ] **1A.1.2** Controller: `NewStarterController.js` 
  - Method: `registerNewStarter(firstName, lastName, email, role, department, startDate)`
  - Logic: Validate inputs, generate PIN, save to DB
  - Return: `{success: true, pinCode: "NS-LC123456", newStarterId: 1}`

- [ ] **1A.1.3** Utility: `generateNewStarterPIN.js`
  - Logic: Generate NS-{First 2 letters}{Last 2 letters}-{6-digit random}
  - Example: `NS-LC-123456` (Liz Chukwu)
  - Uniqueness check: Verify PIN doesn't exist in DB before saving
  - Verification: Matches QOLAE signature process

- [ ] **1A.1.4** Email template: `sendNewStarterInvitation.js`
  - Email template with hyperlinked PIN
  - Link format: `https://hrcompliance.qolae.com/new-starter/login?pin=NS-LC-123456`
  - Subject: "Welcome to QOLAE - Complete Your Compliance"
  - Signature: Match IntroductoryEmail.js signature key

#### Routes Layer
- [ ] **1A.1.5** API Route: POST `/api/new-starters/register`
  - Request: `{firstName, lastName, email, role, department, startDate}`
  - Response: `{success, pinCode, message}`
  - Error handling: Duplicate email, invalid inputs, DB errors

- [ ] **1A.1.6** API Route: GET `/api/new-starters/list`
  - Return: All new starters with status (for dashboard display)
  - Fields: `id, firstName, lastName, email, role, registrationStatus, complianceStatus`

#### Frontend (Dashboard Tab)
- [ ] **1A.1.7** Modal/Form: Registration form in `hrCompliance-dashboard.ejs` New Starters tab
  - Fields: First Name, Last Name, Email, Role (dropdown), Department (dropdown), Start Date (date picker)
  - Submit button: "Register New Case Manager"
  - Validation: Email format, required fields
  - Success message: "PIN generated: NS-LC-123456"
  - Copy PIN button: Quick copy to clipboard

- [ ] **1A.1.8** Display: New Starters list with cards/table
  - Show: Name, Email, Role, PIN (masked/copy option), Status, Date Registered
  - Actions: View Details, Resend Invitation, Mark as Completed

- [ ] **1A.1.9** WebSocket notification: When new starter registered
  - Event: `new_starter_registered`
  - Message: "{Name} registered as {Role} - PIN sent to {Email}"

#### Testing & Verification
- [ ] **1A.1.10** Server-side test: Registration endpoint returns correct PIN format
  - Test data: firstName="Liz", lastName="Chukwu", email="liz@qolae.com"
  - Expected: PIN starts with "NS-LC-" + 6 digits

- [ ] **1A.1.11** Database verification: PIN saved uniquely
  - Check: No duplicate PINs exist
  - Check: Email is unique
  - Check: All required fields populated

- [ ] **1A.1.12** Email verification: Invitation email sent
  - Check: Email contains hyperlinked PIN
  - Check: Link format is correct
  - Check: Email signature matches IntroductoryEmail.js

---

## 🔐 STEP 1A.2: NEW STARTER PORTAL LOGIN
**What it does**: New Starter clicks PIN link and creates login credentials (PIN verification, 2FA, password)
**Access**: `hrcompliance.qolae.com/new-starter/login`
**Owner**: Atlas Agent

### Deliverables

#### Portal Page
- [ ] **1A.2.1** View: `new-starter-login.ejs`
  - Screen 1: PIN verification (input field + "Verify PIN" button)
  - Screen 2: 2FA setup (Email OTP or SMS selection + input field)
  - Screen 3: Password creation (password + confirm password fields)
  - Progress indicator: Show which step (1 of 3, 2 of 3, 3 of 3)

#### Backend Logic
- [ ] **1A.2.2** API Route: POST `/api/new-starters/verify-pin`
  - Request: `{pinCode}`
  - Logic: Check if PIN exists and is in "invited" status
  - Response: `{valid: true, newStarterId: 1, email: "email@qolae.com"}`

- [ ] **1A.2.3** API Route: POST `/api/new-starters/send-otp`
  - Logic: Generate 6-digit OTP, send to email
  - Save OTP to DB with 10-minute expiry
  - Response: `{success: true, message: "OTP sent to email"}`

- [ ] **1A.2.4** API Route: POST `/api/new-starters/verify-otp`
  - Request: `{newStarterId, otp}`
  - Logic: Check OTP validity and expiry
  - Response: `{verified: true}`

- [ ] **1A.2.5** API Route: POST `/api/new-starters/create-password`
  - Request: `{newStarterId, password}`
  - Logic: Hash password, update DB, set `login_status = 'completed'`
  - Response: `{success: true, message: "Account created. Redirecting to compliance portal..."}`

#### Testing & Verification
- [ ] **1A.2.6** E2E test: Complete login flow (PIN → OTP → Password)
  - Test with real PIN and email
  - Verify redirect to compliance submission

---

## 📝 STEP 1A.3: NEW STARTER COMPLIANCE SUBMISSION
**What it does**: New Starter uploads all required compliance documents
**Access**: `hrcompliance.qolae.com/new-starter/compliance`
**Owner**: Atlas Agent

### Deliverables

#### Compliance Submission Form
- [ ] **1A.3.1** View: `new-starter-compliance.ejs`
  - Form sections with file uploads:
    1. Application Form (file upload)
    2. Identity Documents (Passport + Driving License - 2 file uploads)
    3. Utility Bills (1-3 file uploads)
    4. Qualifications (file uploads, multi-select)
    5. Training Certificates (file uploads, multi-select)
    6. Professional Registration (text input: PIN/GMC numbers)
    7. Professional References (2 references with contact details: Name, Title, Organisation, Email, Phone)
    8. Character Reference (1 reference with contact details: Name, Relationship, Email, Phone, Duration Known)
    9. DBS/PVG Document (file upload)
  - Submit button: "Submit Compliance Documents"
  - Progress indicator: Show document count

#### Database Layer
- [ ] **1A.3.2** Update schema: `qolae_hrcompliance.new_starters` 
  - Add columns for document storage references
  - Add `compliance_status` column tracking: pending → submitted → under_review → approved

- [ ] **1A.3.3** Create table: `qolae_hrcompliance.new_starter_documents`
  - Columns: `id, new_starter_id, document_type, file_path, uploaded_at, file_size`
  - Store file paths to central-repository

- [ ] **1A.3.4** Create table: `qolae_hrcompliance.new_starter_references`
  - Columns: `id, new_starter_id, ref_type (professional/character), name, title, organisation, email, phone, relationship, duration_known, status`

#### Backend Logic
- [ ] **1A.3.5** API Route: POST `/api/new-starters/:id/submit-compliance`
  - Request: Form data with file uploads + reference details
  - Logic: Validate all required fields, save documents to central-repository, save references to DB
  - Update `compliance_status = 'submitted'`
  - Response: `{success: true, message: "Compliance submitted successfully"}`

- [ ] **1A.3.6** File storage utility: Save to central-repository
  - Directory: `/var/www/api.qolae.com/central-repository/new-starters/{newStarterId}/`
  - File naming: `{documentType}_{timestamp}.{ext}`
  - Verification: Files readable by HRCompliance Dashboard

#### Frontend Logic
- [ ] **1A.3.7** Client-side validation
  - Required fields check
  - File size limits (max 10MB per file, 50MB total)
  - File type validation (PDF, JPG, PNG for documents)
  - Reference email format validation

- [ ] **1A.3.8** File upload progress
  - Show upload progress for each file
  - Display "Uploading..." state
  - Error handling: Show error messages for failed uploads

#### WebSocket Notification
- [ ] **1A.3.9** Notify Liz when compliance submitted
  - Event: `new_starter_compliance_submitted`
  - Message: "{Name} submitted compliance documents"
  - Trigger: Add notification badge to "New Starters" tab on HRCompliance Dashboard

#### Testing & Verification
- [ ] **1A.3.10** Upload test: Submit complete compliance package
  - Verify all files saved to central-repository
  - Verify database records created
  - Verify WebSocket notification sent

---

## 🔓 STEP 1A.4: FLEXIBLE WORKSPACE ACCESS
**What it does**: New Starter gets limited workspace access while compliance is reviewed
**Access**: `casemanagers.qolae.com` (Limited features)
**Owner**: Atlas Agent

### Deliverables

#### Database Layer
- [ ] **1A.4.1** Create table: `qolae_casemanagers.workspace_access_rules`
  - Columns: `id, case_manager_id, feature_name, is_enabled, unlocked_at`
  - Features: documents_library, compliance_folder, policies, basic_functions, full_dashboard

- [ ] **1A.4.2** Update New Starter record
  - Set `workspace_access = 'limited'` upon compliance submission
  - This gates certain features

#### Backend Logic
- [ ] **1A.4.3** Middleware: Check workspace access
  - Route: `/api/workspace/*`
  - Logic: If `workspace_access = 'limited'`, only allow: documents, policies, basic functions
  - Block: Advanced features, reporting, advanced assignments

- [ ] **1A.4.4** API Route: GET `/api/workspace/features`
  - Return: List of available features for current user
  - Based on `workspace_access_rules`

#### Frontend Integration
- [ ] **1A.4.5** CaseManagers Dashboard: Grey out restricted features
  - CSS class: `.feature-restricted` with opacity: 0.5, cursor: not-allowed
  - Tooltip on hover: "Available after compliance approval"

#### WebSocket Notification
- [ ] **1A.4.6** Notify New Starter on approval
  - Event: `compliance_approved`
  - Message: "Your compliance has been approved. Full workspace access now available."
  - Trigger: Auto-unlock all features

#### Testing & Verification
- [ ] **1A.4.7** Access control test
  - Login as limited-access new starter
  - Verify restricted features are greyed out
  - Verify allowed features are accessible
  - Verify unrestricted access after approval

---

## 🧪 INTEGRATION POINTS

### With Readers Dashboard
- [ ] **1A.5.1** Readers also follow same PIN → Login → Compliance flow (already implemented ✅)

### With CaseManagers Dashboard
- [ ] **1A.5.2** New CaseManager immediately appears in CaseManagers Dashboard
- [ ] **1A.5.3** Limited workspace access enforced until compliance approved

### With HR Compliance Dashboard
- [ ] **1A.5.4** "New Starters" tab shows all registered CMs with status badges
- [ ] **1A.5.5** Liz can see compliance submission status in real-time

### With Notification System
- [ ] **1A.5.6** WebSocket events: registration, compliance_submitted, approved, access_granted

---

## 📈 SUCCESS CHECKLIST

**Phase 1A Complete When:**
- ✅ Database schema created with all tables
- ✅ Registration form functional (Liz can register new CM)
- ✅ PIN generated and email sent
- ✅ New Starter can login with PIN → 2FA → Password
- ✅ Compliance submission form works
- ✅ Files saved to central-repository
- ✅ Liz receives notifications
- ✅ Limited workspace access enforced
- ✅ All E2E tests pass
- ✅ Live Server deployment successful
- ✅ PM2 process restarted

---

## 🚨 BLOCKERS/DEPENDENCIES
- ⚠️ Depends on: Database connection configured (✅ Phoenix completed)
- ⚠️ Depends on: Email service configured (✅ Phoenix completed)
- ⚠️ Depends on: WebSocket server ready (⏳ Mercury - Phase 3)
- ⚠️ Depends on: File storage directory exists on Live Server (Need to create)

---

## 📝 NOTES
- New Starters ARE Case Managers (not separate role)
- PIN format: NS-{First 2 letters of first name}{First 2 letters of last name}-{6-digit random}
- All files upload to: `/var/www/api.qolae.com/central-repository/new-starters/{id}/`
- Reference collection handled by Liz in Phase 2 (after compliance submitted)
