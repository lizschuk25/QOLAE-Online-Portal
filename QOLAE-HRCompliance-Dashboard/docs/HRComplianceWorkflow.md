# QOLAE HR Compliance Dashboard Workflow
**Complete HR Compliance Management for All QOLAE Personnel**

---

## 🎯 SYSTEM OVERVIEW

The HR Compliance Dashboard (`hrcompliance.qolae.com`) is a **standalone, secure system** that manages the complete HR compliance process for all QOLAE personnel - Readers, Case Managers, Admin staff, and any new starters. It operates independently from operational dashboards but integrates seamlessly with the overall QOLAE ecosystem.

### **Key Principles:**
- 🔐 **Security First** - Separate database (`qolae_hrcompliance`) for sensitive HR data
- 🚫 **Minimal Email** - WebSocket notifications instead of email bombardment
- ⚡ **Real-time Updates** - Instant notifications across dashboards
- 📊 **Audit Trail** - Complete tracking of all compliance activities
- 🎯 **Management Only** - Liz has exclusive access to compliance data

---

## 🔄 WORKFLOW PHASES

### **PHASE 1A: NEW STARTERS COMPLIANCE SUBMISSION**
**Location**: HR Compliance Dashboard (`hrcompliance.qolae.com/new-starter`)
**Trigger**: Liz registers new starter (Case Manager, Admin, etc.)

#### **Step 1A.1: New Starter Registration**
- **Liz creates**: New starter record with basic details
- **System generates**: Unique ID PIN (following QOLAE signature process)
- **Email sent**: Invitation email with hyperlinked PIN ID
- **New starter clicks**: PIN → Access compliance login portal (PIN, 2FA, password creation)

#### **Step 1A.2: New Starter Compliance Documents** FILLED OUT BY THE APPLICANT!!!!!!!!!!!!!
- **Application Form**: In-house application form (CV can auto-populate)
- **Identity Documents**: Passport, driving license, etc.
- **Utility Bills**: Proof of address
- **Qualifications**: Professional certificates, degrees
- **Courses**: Training certificates, mandatory updates
- **Professional Registration**: PIN/GMC numbers (for Doctors/Nurses)
- **References**: 2 Professional + 1 Character reference
- **DBS/PVG**: Criminal background check (mandatory)

#### **Step 1A.3: Flexible Workspace Access**
- **Immediate Access**: New starter can access their Customised CaseManager's Workspace
- **Greyed Out Areas**: Some workspace sections disabled until compliance approved
- **Available Access**: 
  - Documents Library/My Compliance folder
  - Policies and procedures
  - Basic workspace functions
- **Reference Collection**: Liz collects references in background while new starter works

---

### **PHASE 1B: READER COMPLIANCE SUBMISSION**
**Location**: Readers Dashboard (`readers.qolae.com/compliance`)
**Trigger**: New reader completes initial login (PIN, 2FA, password creation)

#### **Step 1.1: Reader Submits Compliance Documents**
- **CV Upload**: PDF file upload (required)
- **Professional Reference**: Contact details only
  - Name, Title, Organisation, Email, Phone, Relationship
- **Character Reference**: Contact details only  
  - Name, Relationship, Email, Phone, Duration Known
- **Submission**: Reader clicks "Submit Compliance"

#### **Step 1.2: Data Storage & Notification**
- **Database**: Data saved to `qolae_hrcompliance.compliance` (simplified naming)
- **Status**: `compliance_status = 'submitted'`
- **WebSocket**: Real-time notification to HRCompliance Dashboard
- **Reader Status**: **Flexible Access** - Can access workspace while references collected

---

### **PHASE 2: COMPLIANCE REVIEW PROCESS**
**Location**: HR Compliance Dashboard (`hrcompliance.qolae.com`)
**Access**: Management Only (Liz)

#### **Step 2.1: Initial Review**
- **Notification**: "[Reader Name] - Compliance Submitted" badge appears
- **Action**: Liz clicks "Review" button
- **Modal Opens**: Shows reader's compliance submission
  - CV download/view option
  - Professional reference contact details
  - Character reference contact details
  - Submission timestamp

#### **Step 2.2: Reference Collection (Flexible Process)**

**Option A: Phone Reference (Preferred)**
1. **Liz calls referee** using provided phone number
2. **During call**: Liz fills out `reference-form.ejs` with referee's answers
3. **System action**: Automatically emails **pre-filled** form to referee
4. **Referee receives**: Email with pre-filled form (takes 30 seconds to review)
5. **Referee signs**: Digital signature on form
6. **System saves**: Signed reference to `qolae_hrcompliance.reference_forms`
7. **Notification**: "Reference received from [Referee Name]" to Liz

**Option B: Email Reference (If referee prefers)**
1. **Referee preference**: Prefers not to have phone call
2. **Liz action**: Sends blank `reference-form.ejs` via system email
3. **Referee fills**: Entire form themselves
4. **Referee signs**: Digital signature on completed form
5. **System saves**: Signed reference to `qolae_hrcompliance.reference_forms`
6. **Notification**: "Reference received from [Referee Name]" to Liz

#### **Step 2.3: Reference Tracking**
- **Status Updates**: Track each reference individually
  - Professional Reference: `prof_ref_status` (pending → in_progress → received → approved)
  - Character Reference: `char_ref_status` (pending → in_progress → received → approved)
- **Progress Indicators**: Visual progress bars for each reference
- **Timeline Tracking**: When each reference was requested/received

---

### **PHASE 3: FINAL APPROVAL**
**Location**: HR Compliance Dashboard
**Trigger**: Both references received and signed

#### **Step 3.1: Final Review**
- **Liz reviews**: All compliance documents (CV + 2 signed references)
- **Quality check**: Ensures all documents meet standards
- **Audit preparation**: All documents properly stored and accessible

#### **Step 3.2: Approval Process**
- **Action**: Liz clicks "Approve Compliance"
- **System actions triggered**:
  - Compliance record **locked** in `qolae_hrcompliance` database (audit-ready)
  - Reader's account **fully activated** in `qolae_readers` database
  - `compliance_submitted = true` and `compliance_submitted_at = NOW()`
  - Reader receives **one-time notification**: "Your compliance has been approved. You can now access your dashboard."
- **Status update**: "[Reader Name] - Compliance Approved ✓"

#### **Step 3.3: Reader Access**
- **Next login**: Reader automatically redirected to main Readers Dashboard
- **No compliance gate**: Reader can now access NDA workflow and tasks
- **Full functionality**: Reader can receive report assignments

---

## 🔐 SECURITY & ACCESS CONTROL

### **Database Security**
- **Separate Database**: `qolae_hrcompliance` isolated from operational data
- **Access Control**: Only Case Managers (Liz) have access to HR compliance records
- **Audit Logging**: Complete trail of who viewed/downloaded/approved what and when
- **Data Retention**: HR data retained for legal compliance requirements

### **Reader Access Restrictions**
- **No Self-Access**: Readers cannot view their own compliance records
- **Dashboard Block**: Readers blocked from main dashboard until compliance approved
- **One-Time Process**: Compliance submission is a one-time requirement per reader

### **Cross-Dashboard Integration**
- **CaseManagersDashboard**: Link/button to access HRCompliance Dashboard
- **ReadersDashboard**: Submits compliance data to HRCompliance database
- **WebSocket Communication**: Real-time notifications between dashboards

---

## 📊 TECHNICAL IMPLEMENTATION

### **Database Schema**
- **`compliance`**: Main compliance records (simplified from `reader_compliance`)
- **`reference_forms`**: Signed reference documents
- **`compliance_access_log`**: Audit trail of all access
- **`documents`**: Document storage and metadata

### **WebSocket Integration**
- **Real-time notifications**: Compliance submissions, reference receipts, approvals
- **Cross-dashboard updates**: Status changes reflected immediately
- **No email spam**: Only urgent/time-sensitive notifications via email

### **File Management & Documents Library**
- **Database Storage**: All documents stored in `qolae_hrcompliance` database (BLOB or file paths)
- **Documents Library**: HRCompliance Dashboard has dedicated Documents Library (like Lawyers Dashboard)
- **Document Types**:
  - CVs and Application Forms
  - Identity Documents (Passport, Driving License)
  - Utility Bills (Proof of Address)
  - Qualifications and Certificates
  - Professional Registration (PIN/GMC numbers)
  - Reference Forms (Signed)
  - DBS/PVG Documents
- **Secure Access**: Only Liz can view/download documents
- **Audit Trail**: Track who accessed what documents and when

---

## 🎯 SUCCESS METRICS

### **Efficiency Targets**
- **Review Time**: Liz can complete initial review within 5 minutes
- **Reference Collection**: Both references collected within 48 hours
- **Total Process**: Complete compliance approval within 72 hours
- **Reader Experience**: Seamless transition from compliance to active reader

### **Quality Assurance**
- **100% Compliance**: All readers must complete compliance before access
- **Audit Ready**: All documents properly stored and accessible
- **Legal Compliance**: Meets HR and data protection requirements
- **Professional Standards**: References meet QOLAE quality standards

---

## 🔄 INTEGRATION POINTS

### **With CaseManagersDashboard**
- **Access Link**: Button/link to HRCompliance Dashboard
- **Status Display**: Compliance status badges on reader management tab
- **Notification Integration**: WebSocket notifications for compliance updates

### **With ReadersDashboard**
- **Compliance Gate**: Redirects new readers to compliance submission
- **Data Submission**: Sends compliance data to HRCompliance database
- **Status Updates**: Receives approval notifications via WebSocket

### **With API Dashboard**
- **WebSocket Server**: Manages real-time communication between dashboards
- **Email Services**: Handles reference form emails and approval notifications
- **File Management**: Manages CV and reference document storage

---

**Legend:**
- 🔐 = Management Only (Liz) - HR compliance decisions
- 📊 = System Operations - Automated processes
- 🔄 = Cross-Dashboard - Integration points
- ⚡ = Real-time - WebSocket notifications
