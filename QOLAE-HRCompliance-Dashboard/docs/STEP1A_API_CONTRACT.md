# 📋 STEP 1A: NEW STARTER REGISTRATION - API CONTRACT

**Document Purpose**: Clear, unambiguous API specifications for all 3 agents to work in parallel

**Last Updated**: October 2025
**Status**: Ready for Agent Development

---

## 🎯 API BASE URL

```
http://hrcompliance.qolae.com/api
```

---

## 📍 PHASE 1A.1: REGISTRATION & PIN GENERATION

### **Endpoint 1: Create New Starter**

```
POST /new-starter/create
```

**Purpose**: Liz registers a new Case Manager and triggers PIN generation + email

**Request Body** (JSON):
```json
{
  "firstName": "John",
  "lastName": "Smith",
  "email": "john.smith@company.com",
  "phone": "+44 7700 900000",
  "role": "Case Manager",
  "department": "Medical",
  "startDate": "2025-11-01",
  "createdBy": "liz"
}
```

**Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "New starter created and invitation sent",
  "data": {
    "id": 42,
    "pin": "NS-JS123456",
    "name": "John Smith",
    "email": "john.smith@company.com",
    "role": "Case Manager",
    "status": "pending_compliance",
    "emailSent": true,
    "portalUrl": "https://hrcompliance.qolae.com/new-starter-compliance?pin=NS-JS123456"
  },
  "timestamp": "2025-10-18T14:32:00Z"
}
```

**Error Responses**:
- `400 Bad Request`: Missing required fields
  ```json
  { "success": false, "error": "Missing required fields: firstName, lastName, email, role" }
  ```
- `409 Conflict`: Email already exists
  ```json
  { "success": false, "error": "Email already registered" }
  ```
- `500 Internal Server Error`: Database or email service failure
  ```json
  { "success": false, "error": "Failed to create new starter", "details": "..." }
  ```

**Database Changes**:
- `INSERT INTO new_starters (pin, first_name, last_name, full_name, email, phone, role, department, start_date, status, created_by, created_at, updated_at)`

---

### **Endpoint 2: Get All New Starters**

```
GET /new-starter/all
```

**Purpose**: Fetch list of all registered new starters (for Liz's dashboard)

**Query Parameters** (optional):
- `status`: `pending_compliance`, `compliance_submitted`, `active`, `inactive`
- `limit`: max records (default 50)
- `offset`: pagination offset (default 0)

**Success Response (200 OK)**:
```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "id": 42,
      "pin": "NS-JS123456",
      "fullName": "John Smith",
      "email": "john.smith@company.com",
      "role": "Case Manager",
      "department": "Medical",
      "startDate": "2025-11-01",
      "status": "pending_compliance",
      "complianceSubmitted": false,
      "complianceApproved": false,
      "createdAt": "2025-10-18T14:32:00Z"
    }
    // ... more records
  ]
}
```

---

## 🔐 PHASE 1A.2: AUTHENTICATION (PIN → OTP → PASSWORD)

### **Endpoint 3: Verify PIN**

```
POST /new-starter/verify-pin
```

**Purpose**: Validate PIN and start 2FA process (Step 1 of 3-step wizard)

**Request Body**:
```json
{
  "pin": "NS-JS123456"
}
```

**Success Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "newStarterId": 42,
    "email": "john.smith@company.com",
    "fullName": "John Smith",
    "pinValid": true
  },
  "timestamp": "2025-10-18T14:32:00Z"
}
```

**Error Responses**:
- `400 Bad Request`: Invalid PIN format
  ```json
  { "success": false, "error": "Invalid PIN format. Expected: NS-XX123456" }
  ```
- `404 Not Found`: PIN doesn't exist
  ```json
  { "success": false, "error": "PIN not found" }
  ```
- `429 Too Many Requests`: Rate limited (max 5 attempts per 15 mins)
  ```json
  { "success": false, "error": "Too many attempts. Try again in 15 minutes" }
  ```

**Security Notes**:
- Rate limit: 5 failed attempts per 15 minutes
- Log all PIN verification attempts
- Never expose why PIN is invalid (for security)

---

### **Endpoint 4: Send OTP**

```
POST /new-starter/send-otp
```

**Purpose**: Generate and email 6-digit OTP (Step 2 of wizard)

**Request Body**:
```json
{
  "newStarterId": 42
}
```

**Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "OTP sent to john.smith@company.com",
  "data": {
    "newStarterId": 42,
    "email": "john.smith@company.com",
    "otpExpiresIn": 900  // seconds (15 minutes)
  },
  "timestamp": "2025-10-18T14:32:00Z"
}
```

**Error Responses**:
- `404 Not Found`: New starter not found
- `500 Internal Server Error`: Email service failure

**Database Changes**:
- `UPDATE new_starters SET otp = $1, otp_expires_at = NOW() + INTERVAL '15 minutes' WHERE id = $2`

---

### **Endpoint 5: Verify OTP**

```
POST /new-starter/verify-otp
```

**Purpose**: Validate OTP code (Step 2.5 of wizard)

**Request Body**:
```json
{
  "newStarterId": 42,
  "otp": "123456"
}
```

**Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "OTP verified successfully",
  "data": {
    "newStarterId": 42,
    "verified": true
  }
}
```

**Error Responses**:
- `400 Bad Request`: Invalid OTP
- `410 Gone`: OTP expired

**Security Notes**:
- Clear OTP after 3 failed attempts
- OTP valid for 15 minutes only
- Log all OTP verification attempts

---

### **Endpoint 6: Create Password**

```
POST /new-starter/create-password
```

**Purpose**: Complete authentication setup (Step 3 of wizard)

**Request Body**:
```json
{
  "newStarterId": 42,
  "password": "SecurePassword123!"
}
```

**Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "Account created. Redirecting to compliance portal...",
  "data": {
    "newStarterId": 42,
    "redirectUrl": "/new-starter/compliance",
    "status": "credentials_created"
  }
}
```

**Error Responses**:
- `400 Bad Request`: Password too weak
  ```json
  { "success": false, "error": "Password must be at least 12 characters with uppercase, lowercase, numbers, and symbols" }
  ```

**Database Changes**:
- `UPDATE new_starters SET password_hash = bcrypt($1, 12), login_status = 'completed', updated_at = NOW() WHERE id = $2`

**Password Requirements**:
- Minimum 12 characters
- Must contain: uppercase, lowercase, number, symbol
- Cannot contain email or name

---

## 📝 PHASE 1A.3: COMPLIANCE SUBMISSION

### **Endpoint 7: Submit Compliance Documents**

```
POST /new-starter/submit-compliance
```

**Purpose**: New Starter uploads all compliance documents

**Request Body** (multipart/form-data):
```
Content-Type: multipart/form-data

Fields:
- pin: "NS-JS123456"
- addressLine1: "123 Main Street"
- addressLine2: "Apt 4B"
- city: "Edinburgh"
- postcode: "EH1 1AA"
- emergencyContactName: "Jane Doe"
- emergencyContactPhone: "+44 7700 900001"
- emergencyContactRelationship: "Spouse"
- identityDocuments: [file1.pdf, file2.pdf]
- utilityBills: [file3.pdf]
- qualifications: [file4.pdf]
- professionalReferenceName: "Dr. Sarah Johnson"
- professionalReferenceTitle: "Senior Manager"
- professionalReferenceOrganisation: "ABC Company Ltd"
- professionalReferenceEmail: "sarah@company.com"
- professionalReferencePhone: "+44 7700 900002"
- professionalReferenceRelationship: "Former supervisor"
- characterReferenceName: "Prof. John Smith"
- characterReferenceRelationship: "Academic supervisor"
- characterReferenceEmail: "john@university.ac.uk"
- characterReferencePhone: "+44 7700 900003"
- characterReferenceKnownDuration: "5 years"
- dbsNumber: "DBE123456"
- dbsIssueDate: "2025-01-15"
```

**Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "Compliance submitted successfully",
  "data": {
    "pin": "NS-JS123456",
    "name": "John Smith",
    "status": "compliance_submitted",
    "submittedAt": "2025-10-18T14:45:00Z",
    "documentsUploaded": 7,
    "storedInDatabase": true
  }
}
```

**Error Responses**:
- `400 Bad Request`: Missing required fields or invalid file type
- `413 Payload Too Large`: Total files exceed 50MB limit
- `500 Internal Server Error`: File storage failure

**File Upload Limits**:
- Max file size: 10MB per file
- Max total size: 50MB
- Allowed types: PDF, JPG, PNG, DOCX, XLSX
- Files stored as BYTEA (binary data) in `qolae_hrcompliance.new_starter_documents` table
- No separate file system storage needed

**Database Changes**:
- `UPDATE new_starters SET compliance_submitted = TRUE, compliance_submitted_at = NOW(), status = 'compliance_submitted' WHERE pin = $1`
- `INSERT INTO compliance (person_type, person_id, person_name, person_email, compliance_status, submitted_at, ...)`
- `INSERT INTO new_starter_documents (new_starter_id, document_type, file_path, uploaded_at, file_size) VALUES (...)`
- `INSERT INTO new_starter_references (new_starter_id, ref_type, name, email, phone, relationship) VALUES (...)`

**WebSocket Notification**:
```json
{
  "type": "new_starter_compliance_submitted",
  "message": "John Smith submitted compliance documents",
  "data": {
    "pin": "NS-JS123456",
    "name": "John Smith",
    "timestamp": "2025-10-18T14:45:00Z"
  }
}
```

---

## ✅ PHASE 1A.4: APPROVAL & WORKSPACE ACCESS

### **Endpoint 8: Approve Compliance**

```
POST /new-starter/approve
```

**Purpose**: Liz approves new starter compliance and grants workspace access

**Request Body**:
```json
{
  "pin": "NS-JS123456",
  "approvedBy": "liz",
  "notes": "All documents verified. Background checks clear.",
  "workspaceAccess": ["documents_library", "compliance_folder", "policies", "basic_functions", "full_dashboard"]
}
```

**Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "Compliance approved successfully",
  "data": {
    "pin": "NS-JS123456",
    "name": "John Smith",
    "status": "active",
    "approvedBy": "liz",
    "approvedAt": "2025-10-18T15:00:00Z",
    "workspaceAccess": ["documents_library", "compliance_folder", "policies", "basic_functions", "full_dashboard"]
  }
}
```

**Database Changes**:
- `UPDATE new_starters SET compliance_approved = TRUE, compliance_approved_at = NOW(), status = 'active', workspace_access = $1 WHERE pin = $2`
- `UPDATE compliance SET compliance_status = 'approved', approved_at = NOW(), reviewed_by = $1, notes = $2 WHERE person_id = $3`

**WebSocket Notification**:
```json
{
  "type": "new_starter_approved",
  "message": "John Smith compliance approved. Workspace access granted.",
  "data": {
    "pin": "NS-JS123456",
    "name": "John Smith",
    "workspaceAccess": [...]
  }
}
```

---

## 🔧 SHARED UTILITIES

### **PIN Format**

```
Format: NS-{FirstInitial}{LastInitial}{6-digit-random}
Example: NS-JS-123456 (John Smith)

Generation:
- Extract first 2 letters of first name: "Jo"
- Extract first 2 letters of last name: "Sm"
- Generate random 6-digit number: 123456
- Result: NS-JOSM-123456
```

### **Status Codes**

```
- 200 OK: Successful operation
- 201 Created: Resource created
- 400 Bad Request: Invalid request data
- 404 Not Found: Resource not found
- 409 Conflict: Resource already exists
- 413 Payload Too Large: File too big
- 429 Too Many Requests: Rate limited
- 500 Internal Server Error: Server error
```

### **Error Response Format**

```json
{
  "success": false,
  "error": "Short error message",
  "details": "Long detailed error message (only in dev mode)",
  "timestamp": "2025-10-18T14:32:00Z"
}
```

---

## 🔐 SECURITY REQUIREMENTS

1. **Authentication**: All endpoints require valid PIN or session token
2. **Rate Limiting**: 5 failed attempts per 15 minutes per IP
3. **File Scanning**: All uploaded files scanned for viruses
4. **Encryption**: Sensitive data encrypted at rest and in transit
5. **Logging**: All API calls logged with timestamp and user
6. **HTTPS Only**: All endpoints require HTTPS
7. **CORS**: Only hrcompliance.qolae.com domain allowed
8. **Input Validation**: All inputs validated before processing

---

## ✨ CONSTANTS & ENUMS

```javascript
// PIN Format
const PIN_FORMAT = /^NS-[A-Z]{2}-\d{6}$/

// Status Values
const STATUS = {
  PENDING_COMPLIANCE: 'pending_compliance',
  COMPLIANCE_SUBMITTED: 'compliance_submitted',
  ACTIVE: 'active',
  INACTIVE: 'inactive'
}

// Document Types
const DOCUMENT_TYPES = [
  'proof_of_id',
  'proof_of_address',
  'qualifications',
  'dbs_certificate',
  'professional_registration'
]

// Workspace Access Levels
const WORKSPACE_ACCESS = {
  LIMITED: 'limited',
  FULL: 'full'
}

// Allowed File Types
const ALLOWED_FILE_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']

// File Limits
const FILE_LIMITS = {
  MAX_FILE_SIZE: 10 * 1024 * 1024,        // 10MB per file
  MAX_TOTAL_SIZE: 50 * 1024 * 1024        // 50MB total
}

// OTP Settings
const OTP_SETTINGS = {
  LENGTH: 6,
  EXPIRY_MINUTES: 15,
  MAX_ATTEMPTS: 3
}

// Rate Limiting
const RATE_LIMITS = {
  PIN_ATTEMPTS: 5,
  PIN_WINDOW: 15 * 60 * 1000              // 15 minutes
}
```

---

**End of API Contract Document**
