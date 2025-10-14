# QOLAE HR Compliance Dashboard - Implementation Checklist
**Complete HR Compliance Management for All QOLAE Personnel**

---

## 📋 PHASE 1: INFRASTRUCTURE SETUP ✅ **COMPLETED**

### **✅ Database Setup**
- [x] **Create `qolae_hrcompliance` database** ✅
- [x] **Run database schema** (`setup_qolae_hrcompliance.sql`)✅
- [x] **Create database user** (`hrcompliance_user`)✅
- [x] **Grant permissions** to database user✅
- [ ] **Test database connection** from HRCompliance Dashboard
- [ ] **Verify audit logging** functionality

### **✅ Server Infrastructure**
- [x] **HRCompliance Dashboard running** on port 3012 ✅
- [x] **Nginx configuration** updated for `hrcompliance.qolae.com`✅
- [x] **PM2 process** (`qolae-hrcompliance`) added to ecosystem.config.js ✅
- [ ] **SSL certificate** configured (if needed)
- [x] **Environment variables** configured (.env file)✅
- [x] **Dependencies installed** (yarn install completed)✅

### **✅ File Structure Setup**
- [x] **Complete directory structure created** ✅
- [x] **All controllers, models, routes, services created** ✅
- [x] **Views and assets directories set up** ✅
- [x] **Documentation files created** ✅
- [x] **Package.json configured with correct dependencies** ✅

### **✅ Documents Library Setup** (Database-based approach)
- [ ] **Database document storage** in `qolae_hrcompliance.documents` table
- [ ] **Documents Library interface** (like Lawyers Dashboard)
- [ ] **Document categories**:
  - [ ] CVs and Application Forms
  - [ ] Identity Documents (Passport, Driving License)
  - [ ] Utility Bills (Proof of Address)
  - [ ] Qualifications and Certificates
  - [ ] Professional Registration (PIN/GMC)
  - [ ] Reference Forms (Signed)
  - [ ] DBS/PVG Documents
- [ ] **Secure access controls** (Liz only)
- [ ] **Audit trail** for document access

---

## 📋 PHASE 2: CORE FUNCTIONALITY DEVELOPMENT

### **✅ Database Connection & Models**
- [ ] **Configure database connection** (`config/database.js`)
- [ ] **Create Compliance model** (`models/Compliance.js`)
- [ ] **Create Reader model** (`models/Reader.js`)
- [ ] **Create CaseManager model** (`models/CaseManager.js`)
- [ ] **Create Client model** (`models/Client.js`)
- [ ] **Create Assignment model** (`models/Assignment.js`)
- [ ] **Test database connectivity**

### **✅ Core Controllers**
- [ ] **Dashboard Controller** (`controllers/DashboardController.js`)
  - [ ] `getDashboardData()` - Main dashboard overview
  - [ ] `getPendingCompliance()` - Fetch pending submissions
- [ ] **Compliance Controller** (`controllers/ComplianceController.js`)
  - [ ] `getComplianceDetails(personnelId)` - Get specific compliance record
  - [ ] `updateReferenceStatus()` - Update reference collection status
  - [ ] `approveCompliance()` - Final approval process
- [ ] **Readers Controller** (`controllers/ReadersController.js`)
  - [ ] `submitCompliance()` - Reader compliance submission
  - [ ] `getReaderCompliance()` - Get reader compliance data
- [ ] **New Starter Controller** (`controllers/NewStarterController.js`)
  - [ ] `createNewStarter()` - Create new starter record
  - [ ] `generateIDPIN()` - Generate unique ID PIN
  - [ ] `sendInvitationEmail()` - Send invitation with hyperlinked PIN
  - [ ] `verifyProfessionalRegistration()` - Check PIN/GMC numbers

### **✅ API Routes Setup**
- [ ] **Dashboard Routes** (`routes/dashboardRoutes.js`)
  - [ ] `GET /` - Main dashboard
  - [ ] `GET /api/dashboard/overview` - Dashboard data
- [ ] **Compliance Routes** (`routes/complianceRoutes.js`)
  - [ ] `GET /api/compliance/pending` - Get pending submissions
  - [ ] `GET /api/compliance/:personnelId` - Get specific compliance record
  - [ ] `POST /api/compliance/:personnelId/approve` - Approve compliance
- [ ] **Readers Routes** (`routes/readersRoutes.js`)
  - [ ] `POST /api/readers/compliance` - Submit compliance
  - [ ] `GET /api/readers/compliance/:readerId` - Get reader compliance
- [ ] **New Starter Routes** (`routes/newStarterRoutes.js`)
  - [ ] `POST /api/new-starters/create` - Create new starter
  - [ ] `POST /api/new-starters/:id/invite` - Send invitation email

---

## 📋 PHASE 3: FRONTEND DEVELOPMENT

### **✅ Main Dashboard Interface**
- [ ] **Main Dashboard Layout** (`views/hrCompliance-dashboard.ejs`)
  - [ ] Clean, professional design
  - [ ] Status-based color coding
  - [ ] Responsive design for mobile/tablet
  - [ ] Loading states and error handling
- [ ] **Dashboard Tabs**
  - [ ] Overview tab (`views/overview-tab.ejs`)
  - [ ] Case Managers tab (`views/casemanagers-tab.ejs`)
  - [ ] Readers tab (`views/readers-tab.ejs`)
  - [ ] Clients tab (`views/clients-tab.ejs`)
- [ ] **Layout Components**
  - [ ] Header partial (`views/partials/header.ejs`)
  - [ ] Sidebar partial (`views/partials/sidebar.ejs`)
  - [ ] Modal partials (`views/partials/modals.ejs`)

### **✅ Compliance Review Interface**
- [ ] **Compliance Review Modal**
  - [ ] CV secure view functionality (no download)
  - [ ] Professional reference details display
  - [ ] Character reference details display
  - [ ] Reference collection buttons
- [ ] **Reference Collection Forms**
  - [ ] Professional reference form (`professionalReference.ejs`)
  - [ ] Character reference form (`characterReference.ejs`)
  - [ ] Pre-filled form email functionality
  - [ ] Digital signature integration

### **✅ New Starters Compliance System**
- [ ] **New Starter Registration Interface**
  - [ ] Liz creates new starter record
  - [ ] System generates unique ID PIN (QOLAE signature process)
  - [ ] Invitation email with hyperlinked PIN ID
- [ ] **New Starter Compliance Portal** (`/new-starter`)
  - [ ] In-house application form (CV auto-population)
  - [ ] Identity documents upload (Passport, Driving License)
  - [ ] Utility bills upload (Proof of Address)
  - [ ] Qualifications and certificates upload
  - [ ] Professional registration (PIN/GMC numbers)
  - [ ] DBS/PVG upload (mandatory)
  - [ ] Reference details submission (2 Professional + 1 Character)
- [ ] **Flexible Workspace Access**
  - [ ] Immediate access to Customised CaseManager's Workspace
  - [ ] Greyed out areas until compliance approved
  - [ ] Available features: Documents Library, policies, basic functions
  - [ ] Background reference collection while new starter works

### **✅ Readers Compliance System**
- [ ] **Reader Compliance Portal** (`/readers/compliance`)
  - [ ] CV upload functionality
  - [ ] Professional reference details form
  - [ ] Character reference details form
  - [ ] Flexible workspace access (while references collected)

### **✅ Compliance Review Interface**
- [ ] **Main Dashboard View** (`hrCompliance-dashboard.ejs`)
  - [ ] List of pending compliance submissions
  - [ ] Status badges (Submitted, In Progress, Approved)
  - [ ] Reader information display
  - [ ] Quick action buttons (Review, Approve)
- [ ] **Compliance Review Modal**
  - [ ] CV download/view functionality
  - [ ] Professional reference details display
  - [ ] Character reference details display
  - [ ] Reference collection buttons
- [ ] **Reference Collection Forms**
  - [ ] Professional reference form (`professionalReference.ejs`)
  - [ ] Character reference form (`characterReference.ejs`)
  - [ ] Pre-filled form email functionality
  - [ ] Digital signature integration

### **✅ Database Operations**
- [ ] **Compliance Controller** (simplified naming)
  - [ ] `getPendingCompliance()` - Fetch pending submissions (all personnel types)
  - [ ] `getComplianceDetails(personnelId)` - Get specific compliance record
  - [ ] `updateReferenceStatus()` - Update reference collection status
  - [ ] `approveCompliance()` - Final approval process
- [ ] **New Starter Controller**
  - [ ] `createNewStarter()` - Create new starter record
  - [ ] `generateIDPIN()` - Generate unique ID PIN
  - [ ] `sendInvitationEmail()` - Send invitation with hyperlinked PIN
  - [ ] `verifyProfessionalRegistration()` - Check PIN/GMC numbers
- [ ] **Reference Management Controller**
  - [ ] `saveReferenceForm()` - Store signed reference
  - [ ] `sendReferenceEmail()` - Email reference forms
  - [ ] `trackReferenceStatus()` - Monitor collection progress
- [ ] **Documents Controller**
  - [ ] `uploadDocument()` - Store documents in database
  - [ ] `viewDocument()` - Secure document viewing (no download)
  - [ ] `getDocumentList()` - List all documents for personnel
- [ ] **Audit Logging Controller**
  - [ ] `logAccess()` - Track who accessed what
  - [ ] `logApproval()` - Record approval actions
  - [ ] `logView()` - Track document views

### **✅ API Routes**
- [ ] **GET Routes**
  - [ ] `/api/compliance/pending` - Get pending submissions (all personnel)
  - [ ] `/api/compliance/:personnelId` - Get specific compliance record
  - [ ] `/api/compliance/:personnelId/documents` - Get document list
  - [ ] `/api/compliance/:personnelId/document/:docId` - Secure view document
  - [ ] `/api/new-starters` - Get new starter records
  - [ ] `/api/readers` - Get reader compliance records
- [ ] **POST Routes**
  - [ ] `/api/new-starters/create` - Create new starter
  - [ ] `/api/new-starters/:id/invite` - Send invitation email
  - [ ] `/api/compliance/:personnelId/approve` - Approve compliance
  - [ ] `/api/reference/send-email` - Send reference form
  - [ ] `/api/reference/save` - Save signed reference
  - [ ] `/api/documents/upload` - Upload document
- [ ] **PUT Routes**
  - [ ] `/api/compliance/:personnelId/status` - Update status
  - [ ] `/api/professional-registration/verify` - Verify PIN/GMC

---

## 📋 PHASE 3: INTEGRATION & COMMUNICATION

### **✅ WebSocket Integration**
- [ ] **WebSocket Server Setup**
  - [ ] Add HRCompliance to WebSocket server (`hrc-socketServer.js`)
  - [ ] Create compliance-specific WebSocket events
  - [ ] Test real-time notifications
- [ ] **WebSocket Events**
  - [ ] `compliance_submitted` - New compliance submission
  - [ ] `reference_received` - Reference form received
  - [ ] `compliance_approved` - Compliance approved
  - [ ] `status_updated` - General status updates
- [ ] **Cross-Dashboard Communication**
  - [ ] CaseManagersDashboard receives compliance notifications
  - [ ] ReadersDashboard receives approval notifications
  - [ ] Real-time status updates across all dashboards

### **✅ Email Integration**
- [ ] **Reference Form Emails**
  - [ ] Pre-filled form email template
  - [ ] Blank form email template
  - [ ] Email delivery confirmation
- [ ] **Approval Notifications**
  - [ ] Reader approval email (one-time only)
  - [ ] Liz notification emails (minimal, urgent only)
- [ ] **SMTP Configuration**
  - [ ] Test email delivery
  - [ ] Error handling for failed emails

### **✅ Cross-Dashboard Integration**
- [ ] **CaseManagersDashboard Integration**
  - [ ] Add HRCompliance Dashboard link/button
  - [ ] Display compliance status badges
  - [ ] WebSocket notification handling
- [ ] **ReadersDashboard Integration**
  - [ ] Compliance submission form
  - [ ] Data submission to HRCompliance database
  - [ ] Approval notification handling
- [ ] **API Dashboard Integration**
  - [ ] WebSocket server updates
  - [ ] Email service integration
  - [ ] File management services

---

## 📋 PHASE 4: USER INTERFACE & EXPERIENCE

### **✅ Dashboard Design**
- [ ] **Main Dashboard Layout**
  - [ ] Clean, professional design
  - [ ] Status-based color coding
  - [ ] Responsive design for mobile/tablet
  - [ ] Loading states and error handling
- [ ] **Compliance Review Interface**
  - [ ] Intuitive review workflow
  - [ ] Clear progress indicators
  - [ ] Easy reference collection process
  - [ ] One-click approval process
- [ ] **Reference Collection Forms**
  - [ ] User-friendly form design
  - [ ] Clear instructions for referees
  - [ ] Digital signature integration
  - [ ] Mobile-friendly forms

### **✅ User Experience**
- [ ] **Navigation**
  - [ ] Clear navigation between sections
  - [ ] Breadcrumb navigation
  - [ ] Quick access to pending items
- [ ] **Notifications**
  - [ ] Real-time status updates
  - [ ] Clear notification messages
  - [ ] Non-intrusive notification design
- [ ] **Error Handling**
  - [ ] Clear error messages
  - [ ] Graceful error recovery
  - [ ] User-friendly error states

---

## 📋 PHASE 5: TESTING & VALIDATION

### **✅ Functionality Testing**
- [ ] **New Starter Compliance Flow**
  - [ ] Test new starter registration by Liz
  - [ ] Test ID PIN generation
  - [ ] Test invitation email delivery
  - [ ] Test new starter compliance portal access
  - [ ] Test document uploads (all types)
  - [ ] Test professional registration verification
  - [ ] Test flexible workspace access
- [ ] **Reader Compliance Flow**
  - [ ] Test reader compliance submission
  - [ ] Verify data storage in database
  - [ ] Test WebSocket notifications
- [ ] **Reference Collection Flow**
  - [ ] Test phone reference process (Option A)
  - [ ] Test email reference process (Option B)
  - [ ] Test digital signature functionality
  - [ ] Test reference form storage
- [ ] **Approval Process**
  - [ ] Test final approval workflow
  - [ ] Verify personnel account activation
  - [ ] Test approval notifications
- [ ] **Documents Library Testing**
  - [ ] Test document upload and storage
  - [ ] Test secure document viewing (no download capability)
  - [ ] Test document categorization
  - [ ] Test audit trail functionality

### **✅ Integration Testing**
- [ ] **Cross-Dashboard Communication**
  - [ ] Test WebSocket notifications between dashboards
  - [ ] Verify status updates across systems
  - [ ] Test email notifications
- [ ] **Database Integration**
  - [ ] Test data consistency between databases
  - [ ] Verify audit logging functionality
  - [ ] Test data security and access control

### **✅ Security Testing**
- [ ] **Access Control**
  - [ ] Verify only Liz can access HR compliance data
  - [ ] Test unauthorized access prevention
  - [ ] Verify audit trail functionality
- [ ] **Data Security**
  - [ ] Test file upload security
  - [ ] Verify secure file storage
  - [ ] Test data encryption (if applicable)

---

## 📋 PHASE 6: DEPLOYMENT & MONITORING

### **✅ Production Deployment**
- [ ] **Server Deployment**
  - [ ] Deploy to production server
  - [ ] Configure production environment variables
  - [ ] Test production functionality
- [ ] **Database Migration**
  - [ ] Run production database setup
  - [ ] Verify production database connectivity
  - [ ] Test production data operations
- [ ] **Monitoring Setup**
  - [ ] Configure PM2 monitoring
  - [ ] Set up error logging
  - [ ] Configure performance monitoring

### **✅ Documentation & Training**
- [ ] **User Documentation**
  - [ ] Create user guide for Liz
  - [ ] Document workflow processes
  - [ ] Create troubleshooting guide
- [ ] **Technical Documentation**
  - [ ] Document API endpoints
  - [ ] Document database schema
  - [ ] Document integration points

---

## 🎯 SUCCESS CRITERIA

### **✅ Functional Requirements**
- [ ] **Complete New Starters Workflow**: Registration → Compliance → Approval → Workspace Access
- [ ] **Complete Readers Workflow**: Compliance Submission → Review → Approval
- [ ] **Flexible Access Model**: Personnel can work while references collected
- [ ] **Documents Library**: Secure document storage and access
- [ ] **Professional Registration**: PIN/GMC verification for medical personnel
- [ ] **Real-time Updates**: WebSocket notifications functioning
- [ ] **Cross-Dashboard Integration**: Seamless communication between dashboards
- [ ] **Audit Trail**: Complete tracking of all compliance activities
- [ ] **Security**: Only authorized access to HR compliance data

### **✅ Performance Requirements**
- [ ] **Response Time**: Dashboard loads within 2 seconds
- [ ] **File Upload**: CV uploads complete within 30 seconds
- [ ] **Email Delivery**: Reference form emails delivered within 1 minute
- [ ] **Real-time Updates**: WebSocket notifications within 1 second

### **✅ User Experience Requirements**
- [ ] **Intuitive Interface**: Liz can complete compliance review without training
- [ ] **Mobile Friendly**: Dashboard works on mobile devices
- [ ] **Error Recovery**: Clear error messages and recovery options
- [ ] **Minimal Email**: Only urgent notifications sent via email

---

**Legend:**
- ✅ = Completed
- [ ] = Pending
- 🔐 = Security Critical
- ⚡ = Real-time Feature
- 🔄 = Integration Point
