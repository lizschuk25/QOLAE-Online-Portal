# 🎨 STREAM A: FRONTEND-SPECIALIST BRIEFING

**Agent Role**: Build all UI forms, displays, and client-side validation for Step 1A

**Your Mission**: Complete 3 major tasks (3-4 hours total)

**Status**: READY TO START ✅

---

## 📋 YOUR TASKS (In Priority Order)

### **TASK 1A.1.7: Registration Form Modal** (1.5 hours) 🎯 START HERE
**File to edit**: `/views/hrCompliance-dashboard.ejs` → New Starters tab

**What to build**:
A modal popup where Liz can register a new Case Manager

**Form Fields** (all required):
- First Name (text input)
- Last Name (text input) 
- Email (email input with validation)
- Phone (tel input)
- Role (dropdown: "Case Manager", "Reader", "Admin", "Lawyer")
- Department (text input: "Medical", "Legal", "Operations")
- Start Date (date picker)
- Submit button → "Register New Starter"

**On Submit**:
1. Validate all fields are filled and email is valid
2. Call API: `POST /api/new-starter/create`
3. Show loading spinner while submitting
4. On success: Display the generated PIN with:
   - Copy-to-Clipboard button ✂️
   - "PIN copied!" confirmation message
   - "Close" button to dismiss
5. On error: Show red error message

**API Reference**: See `STEP1A_API_CONTRACT.md` Endpoint 1

**Pattern to Follow**: `views/partials/readersRegistrationModal.ejs` (same structure, different fields)

**Example Success Response**:
```json
{
  "success": true,
  "data": {
    "pin": "NS-JS123456",
    "name": "John Smith",
    "email": "john.smith@company.com"
  }
}
```

**Testing Checklist**:
- [ ] Form validates email format (shows error if invalid)
- [ ] Form rejects empty required fields
- [ ] Submit button is disabled during API call
- [ ] PIN displays correctly in modal
- [ ] Copy-to-Clipboard button works
- [ ] Error messages display clearly
- [ ] Modal closes on success

---

### **TASK 1A.1.8: New Starters Display Lists** (1.5 hours)
**File to edit**: `/views/hrCompliance-dashboard.ejs` → New Starters tab

**What to build**:
Display lists/tabs showing all registered new starters

**Tab Structure** (3 tabs):
1. **"Register"** tab → Registration form (from Task 1A.1.7)
2. **"Pending"** tab → Showing new starters with status = pending_compliance
3. **"Approved"** tab → Showing new starters with status = active
4. **"All"** tab → Showing all new starters (all statuses)

**Display Each New Starter** (table or card layout, your choice):
| Column | Content | Notes |
|--------|---------|-------|
| Name | Full Name | From new_starters.full_name |
| Email | Email Address | From new_starters.email |
| Role | Role | "Case Manager", etc. |
| Status | Badge | pending_compliance (🟡), compliance_submitted (🟠), active (🟢) |
| Date Created | Registration Date | From new_starters.created_at |
| Actions | Buttons | "View Details", "Resend Invite", "Mark Complete" |

**Data Source**:
- Fetch from API: `GET /api/new-starter/all?status=pending_compliance` (for Pending tab)
- Fetch from API: `GET /api/new-starter/all?status=active` (for Approved tab)
- Fetch from API: `GET /api/new-starter/all` (for All tab)

**Real-time Updates**:
Subscribe to WebSocket: `new_starter_compliance_submitted`
When new compliance is submitted, list auto-updates (every 5 seconds)

**API Reference**: See `STEP1A_API_CONTRACT.md` Endpoint 2

**Pattern to Follow**: Check existing tab structure in `hrCompliance-dashboard.ejs` for Readers tab

**Example API Response**:
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
      "status": "pending_compliance",
      "createdAt": "2025-10-18T14:32:00Z"
    }
  ]
}
```

**Testing Checklist**:
- [ ] Pending tab shows only pending_compliance statuses
- [ ] Approved tab shows only active statuses
- [ ] All tab shows everything
- [ ] Data loads without errors
- [ ] Status badges display with correct colors
- [ ] Real-time updates work via WebSocket
- [ ] Responsive on mobile (375px+)
- [ ] No console errors

---

### **TASK 1A.3.7 & 1A.3.8: Upload Progress & Validation** (1 hour)
**File to edit**: `/views/newStarter-compliance.ejs` (already exists, enhance it)

**What to enhance**:
Add file validation and progress tracking to the compliance form

**Validation Requirements**:
- Max file size: 10MB per file
- Max total: 50MB for all files combined
- Allowed types: PDF, JPG, PNG, DOCX, XLSX
- Show error immediately if file doesn't meet requirements

**Progress Indicators**:
- Progress bar while uploading (0-100%)
- "Uploading... 45%" text during upload
- Spinner animation during upload
- Success checkmark ✅ when complete

**Error Handling**:
- "File too large (15MB > 10MB limit)" - in red
- "Invalid file type (EXE not allowed)" - in red
- "Total size exceeded (65MB > 50MB)" - in red
- "Retry" button for failed uploads

**File Display**:
- Show file name and size: "document.pdf (2.5MB)"
- Show upload status: "✅ Uploaded", "⏳ Uploading...", "❌ Failed"
- Remove button for each file

**API Reference**: See `STEP1A_API_CONTRACT.md` Endpoint 7

**Constants to Use** (from API contract):
```javascript
MAX_FILE_SIZE = 10 * 1024 * 1024        // 10MB
MAX_TOTAL_SIZE = 50 * 1024 * 1024       // 50MB
ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
```

**Testing Checklist**:
- [ ] Files under 10MB upload successfully
- [ ] Files over 10MB rejected with error
- [ ] Total size limit (50MB) enforced
- [ ] Invalid file types rejected
- [ ] Progress bar shows during upload
- [ ] Success message after upload
- [ ] Retry button works for failed uploads
- [ ] No console errors

---

## 🔧 IMPLEMENTATION STEPS

### **Step 1: Set Up (15 mins)**
```bash
# Read the API contract first (REQUIRED!)
cat /Users/lizchukwu_1/QOLAE-Online-Portal/QOLAE-HRCompliance-Dashboard/docs/STEP1A_API_CONTRACT.md

# Read the coordination document
cat /Users/lizchukwu_1/QOLAE-Online-Portal/QOLAE-HRCompliance-Dashboard/docs/STEP1A_AGENT_COORDINATION.md

# Review existing patterns
cat /Users/lizchukwu_1/QOLAE-Online-Portal/QOLAE-HRCompliance-Dashboard/views/partials/readersRegistrationModal.ejs
```

### **Step 2: Build Task 1A.1.7** (1.5 hours)
1. Open `/views/hrCompliance-dashboard.ejs`
2. Find the "New Starters" tab section
3. Add registration form modal (follow readersRegistrationModal pattern)
4. Test form validation
5. Test API call to `/api/new-starter/create`
6. Test PIN display and copy-to-clipboard

### **Step 3: Build Task 1A.1.8** (1.5 hours)
1. Add 4 tabs to "New Starters" section
2. Add table/card display for each tab
3. Fetch data from `/api/new-starter/all` with status filters
4. Add WebSocket subscription for real-time updates
5. Test data displays correctly
6. Test status badges and colors

### **Step 4: Enhance Task 1A.3.7/3.8** (1 hour)
1. Open `/views/newStarter-compliance.ejs`
2. Add file validation logic (JavaScript)
3. Add progress bar (HTML + CSS)
4. Test file upload with valid/invalid files
5. Test size limits
6. Test progress display

---

## 📞 NEED HELP?

**Questions?** Add to Q&A section in `STEP1A_AGENT_COORDINATION.md`

**Blocked?** Fill out BLOCKER REPORT in coordination document

**Key References**:
- API Contract: `STEP1A_API_CONTRACT.md` ⭐ READ THIS FIRST
- Coordination Hub: `STEP1A_AGENT_COORDINATION.md`
- Existing Pattern: `readersRegistrationModal.ejs`
- WebSocket Pattern: `websocket-client.js`

---

## 🚀 WHEN YOU'RE DONE

1. ✅ Test all 3 tasks locally
2. ✅ Check code review checklist in coordination document
3. ✅ Copy files to Live Server: `ssh root@91.99.184.77 → /var/www/hrcompliance.qolae.com/views/`
4. ✅ Restart PM2: `pm2 restart qolae-hrcompliance`
5. ✅ Test in browser: `hrcompliance.qolae.com`
6. ✅ Update status in coordination document

---

## ⏱️ TIMELINE

- Hour 0-0.25: Setup + read API contract
- Hour 0.25-1.75: Task 1A.1.7 (Registration Form)
- Hour 1.75-3.25: Task 1A.1.8 (Display Lists)
- Hour 3.25-4.25: Task 1A.3.7/3.8 (Upload Validation)
- Hour 4-5: Testing, code review, deployment

**Confidence Check**: 
- Can you hit this timeline? Let us know in coordination document!

---

**Ready to build amazing UI, Stream A? Let's go! 🎨💪🏽**
