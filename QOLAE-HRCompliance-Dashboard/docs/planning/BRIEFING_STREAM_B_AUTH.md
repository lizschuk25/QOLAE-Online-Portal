# 🔐 STREAM B: AUTH-SPECIALIST BRIEFING

**Agent Role**: Build PIN verification, OTP generation, and password creation routes

**Your Mission**: Implement 4 authentication endpoints (2-3 hours total)

**Status**: READY TO START ✅

---

## 📋 YOUR TASKS (In Priority Order)

### **TASK 1A.2.2: Verify PIN Route** (45 minutes) 🎯 START HERE
**File to edit**: `routes/newStarterRoute.js` → Add route handler

**What to build**:
API endpoint that validates a PIN and starts the 2FA process

```
POST /api/new-starter/verify-pin
```

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
- 400 Bad Request (invalid format): `{ "success": false, "error": "Invalid PIN format. Expected: NS-XX123456" }`
- 404 Not Found (PIN doesn't exist): `{ "success": false, "error": "PIN not found" }`
- 429 Too Many Requests (rate limited): `{ "success": false, "error": "Too many attempts. Try again in 15 minutes" }`

**Security Requirements**:
1. Validate PIN format: `NS-[A-Z]{2}-\d{6}` (e.g., NS-JS-123456)
2. Rate limit: 5 failed attempts per 15 minutes (per IP)
3. Log all attempts (timestamp, IP, PIN, result) for audit trail
4. Never reveal why PIN is invalid (for security) - just say "Invalid PIN"

**Database Check**:
- Query: `SELECT id, email, full_name FROM new_starters WHERE pin = $1`
- Return: newStarterId, email, fullName

**Implementation Hints**:
- Use IP tracking for rate limiting
- Store failed attempts in memory or database
- Use RegExp to validate PIN format before DB query

**API Reference**: See `STEP1A_API_CONTRACT.md` Endpoint 3

**Testing Checklist**:
- [ ] Valid PIN returns newStarterId
- [ ] Invalid PIN format rejected (400)
- [ ] Non-existent PIN rejected (404)
- [ ] Rate limit works (429 after 5 failures)
- [ ] Log entries created
- [ ] Error messages don't reveal sensitive info

---

### **TASK 1A.2.3: Send OTP Route** (45 minutes)
**File to edit**: `routes/newStarterRoute.js` → Add route handler

**What to build**:
API endpoint that generates and emails a 6-digit OTP

```
POST /api/new-starter/send-otp
```

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
    "otpExpiresIn": 900
  },
  "timestamp": "2025-10-18T14:32:00Z"
}
```

**Error Responses**:
- 404 Not Found: `{ "success": false, "error": "New starter not found" }`
- 500 Internal Server Error: `{ "success": false, "error": "Failed to send OTP email" }`

**Logic**:
1. Generate 6-digit random OTP: `Math.floor(100000 + Math.random() * 900000)`
2. Store in database: `UPDATE new_starters SET otp = $1, otp_expires_at = NOW() + INTERVAL '15 minutes' WHERE id = $2`
3. Send email using nodemailer (similar pattern to `sendNewStarterInvitation.js`)
4. Return success (never return OTP in response!)

**Email Template**:
```
Subject: Your QOLAE Access OTP

Dear [FirstName],

Your One-Time Password (OTP) is: 123456

This code expires in 15 minutes. Do not share with anyone.

If you didn't request this, please ignore.

Best regards,
QOLAE Team
```

**Security**:
- OTP stored hashed (use bcrypt) or plain-text in database (temp storage)
- Never send OTP in response body
- 15-minute expiry (automatic via database timestamp)
- Clear OTP after 3 failed verification attempts

**Implementation Hints**:
- Follow `utils/sendNewStarterInvitation.js` pattern for email sending
- Create `utils/sendNewStarterOTP.js` utility
- Use nodemailer that's already configured

**API Reference**: See `STEP1A_API_CONTRACT.md` Endpoint 4

**Testing Checklist**:
- [ ] OTP generated (6 digits)
- [ ] Email sent successfully
- [ ] Database updated with OTP and expiry
- [ ] Response doesn't expose OTP value
- [ ] Error handling for missing newStarterId
- [ ] Error handling for email failure

---

### **TASK 1A.2.4: Verify OTP Route** (45 minutes)
**File to edit**: `routes/newStarterRoute.js` → Add route handler

**What to build**:
API endpoint that validates the OTP code

```
POST /api/new-starter/verify-otp
```

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
- 400 Bad Request (invalid OTP): `{ "success": false, "error": "Invalid OTP" }`
- 410 Gone (OTP expired): `{ "success": false, "error": "OTP has expired. Request a new one." }`

**Logic**:
1. Query: `SELECT otp, otp_expires_at, otp_attempts FROM new_starters WHERE id = $1`
2. Check OTP matches: `otp === $2`
3. Check not expired: `NOW() < otp_expires_at`
4. Check attempts < 3: `otp_attempts < 3`
5. If invalid:
   - Increment attempts: `UPDATE new_starters SET otp_attempts = otp_attempts + 1 WHERE id = $1`
   - If attempts = 3, clear OTP: `UPDATE new_starters SET otp = NULL WHERE id = $1`
6. If valid: Mark verified, clear OTP

**Security**:
- Compare OTP using constant-time comparison (prevent timing attacks)
- Clear OTP after 3 failed attempts
- Log all attempts
- Return generic error messages

**Implementation Hints**:
- Use `crypto.timingSafeEqual()` for OTP comparison if needed (extra security)
- Track failed attempts in DB column
- Clear OTP on successful verification

**API Reference**: See `STEP1A_API_CONTRACT.md` Endpoint 5

**Testing Checklist**:
- [ ] Valid OTP returns success
- [ ] Invalid OTP returns error
- [ ] Expired OTP returns error
- [ ] Failed attempts tracked
- [ ] OTP cleared after 3 failures
- [ ] No timing attack vulnerabilities

---

### **TASK 1A.2.5: Create Password Route** (45 minutes)
**File to edit**: `routes/newStarterRoute.js` → Add route handler

**What to build**:
API endpoint that creates a password and completes authentication

```
POST /api/new-starter/create-password
```

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
- 400 Bad Request (weak password): 
  ```json
  {
    "success": false,
    "error": "Password must be at least 12 characters with uppercase, lowercase, numbers, and symbols"
  }
  ```

**Password Validation**:
- Minimum 12 characters
- Must contain: uppercase (A-Z), lowercase (a-z), number (0-9), symbol (!@#$%^&*)
- Cannot contain email or name (extra security)

**Logic**:
1. Validate password strength
2. Hash password: `bcrypt.hash(password, 12)` (12 rounds)
3. Store in database: `UPDATE new_starters SET password_hash = $1, status = 'credentials_created', updated_at = NOW() WHERE id = $2`
4. Clear OTP and attempts: `UPDATE new_starters SET otp = NULL, otp_attempts = 0 WHERE id = $1`
5. Return redirect URL to compliance portal

**Password Strength Validator**:
```javascript
function validatePassword(password, email, firstName, lastName) {
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSymbol = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
  const isLongEnough = password.length >= 12;
  const noEmail = !password.includes(email.split('@')[0]);
  const noName = !password.includes(firstName) && !password.includes(lastName);
  
  return {
    isValid: hasUppercase && hasLowercase && hasNumber && hasSymbol && isLongEnough && noEmail && noName,
    errors: {
      uppercase: !hasUppercase ? "Must contain uppercase letters" : null,
      lowercase: !hasLowercase ? "Must contain lowercase letters" : null,
      number: !hasNumber ? "Must contain numbers" : null,
      symbol: !hasSymbol ? "Must contain symbols" : null,
      length: !isLongEnough ? "Must be at least 12 characters" : null,
      emailInPassword: !noEmail ? "Cannot contain email" : null,
      nameInPassword: !noName ? "Cannot contain name" : null
    }
  };
}
```

**Bcrypt Usage**:
```javascript
import bcrypt from 'bcrypt';

const passwordHash = await bcrypt.hash(password, 12);
// Store passwordHash in database
```

**Security**:
- Hash with bcrypt (12 rounds)
- Never store plain-text password
- Clear OTP after password creation
- Log password creation event

**Implementation Hints**:
- Add `bcrypt` to package.json if not already there
- Use async/await for bcrypt operations
- Store timestamp of password creation

**API Reference**: See `STEP1A_API_CONTRACT.md` Endpoint 6

**Testing Checklist**:
- [ ] Valid password hashed and stored
- [ ] Invalid password rejected with error
- [ ] Password doesn't contain email
- [ ] Password doesn't contain name
- [ ] Weak password rejected
- [ ] Strong password accepted
- [ ] Redirect URL returned
- [ ] OTP cleared after successful password

---

## 🔧 IMPLEMENTATION STEPS

### **Step 1: Set Up (15 mins)**
```bash
# Read the API contract (REQUIRED!)
cat STEP1A_API_CONTRACT.md

# Read coordination document
cat STEP1A_AGENT_COORDINATION.md

# Check existing email pattern (Fastify/ES6)
cat utils/sendNewStarterInvitation.js

# Verify bcrypt is installed
yarn list bcrypt
# If not installed: yarn add bcrypt
```

### **Step 2: Add Route Handlers** (1.5 hours)
1. Open `routes/newStarterRoute.js`
2. Add 4 new route handlers (Fastify format):
   - POST /api/new-starter/verify-pin
   - POST /api/new-starter/send-otp
   - POST /api/new-starter/verify-otp
   - POST /api/new-starter/create-password
3. Use existing controllers or add to NewStarterController.js

### **Step 3: Create Email Utility** (30 mins)
1. Create `utils/sendNewStarterOTP.js`
2. Follow pattern from `sendNewStarterInvitation.js`
3. Send 6-digit OTP via email

### **Step 4: Test All Routes** (1 hour)
1. Test with curl/Postman
2. Test valid and invalid inputs
3. Test rate limiting
4. Test database updates
5. Test error messages

---

## 📝 DATABASE SCHEMA REFERENCE

**Columns needed in new_starters table**:
```sql
otp VARCHAR(6)
otp_expires_at TIMESTAMP
otp_attempts INTEGER DEFAULT 0
password_hash VARCHAR(255)
status VARCHAR(50)
```

All these columns should already exist!

---

## 📞 NEED HELP?

**Questions?** Add to Q&A section in `STEP1A_AGENT_COORDINATION.md`

**Blocked?** Fill out BLOCKER REPORT in coordination document

**Key References**:
- API Contract: `STEP1A_API_CONTRACT.md` ⭐ READ THIS FIRST
- Coordination Hub: `STEP1A_AGENT_COORDINATION.md`
- Email Pattern: `sendNewStarterInvitation.js`
- Controller Pattern: `NewStarterController.js`

---

## 🚀 WHEN YOU'RE DONE

1. ✅ Test all 4 routes with curl/Postman
2. ✅ Test rate limiting and security
3. ✅ Check code review checklist in coordination document
4. ✅ Copy files to Live Server: `ssh root@91.99.184.77 → /var/www/hrcompliance.qolae.com/`
5. ✅ Restart PM2: `pm2 restart qolae-hrcompliance`
6. ✅ Test endpoints on Live Server
7. ✅ Update status in coordination document

---

## ⏱️ TIMELINE

- Hour 0-0.25: Setup + read API contract
- Hour 0.25-1.25: Task 1A.2.2 (Verify PIN)
- Hour 1.25-2.25: Task 1A.2.3 (Send OTP)
- Hour 2.25-3.25: Task 1A.2.4 (Verify OTP)
- Hour 3.25-4.25: Task 1A.2.5 (Create Password)
- Hour 4-5: Testing, code review, deployment

**Confidence Check**: 
- Can you hit this timeline? Let us know in coordination document!

---

**Ready to build secure authentication, Stream B? Let's go! 🔐💪🏽**
