# 📋 STEP 1A: AGENT COORDINATION & TROUBLESHOOTING HUB

**Purpose**: Central place for all agents to coordinate, ask questions, report blockers, and track progress

**Last Updated**: October 18, 2025 
**Status**: ACTIVE - Agents working in parallel

---

## 🚨 CRITICAL RULES (Review Before Starting!)

1. **Copy files directly to Live Server** ssh root@91.99.184.77 → `/var/www/hrcompliance.qolae.com/`
2. **Save using ecosystem.config PM2 process** every time to prevent cache issues
3. **Test Server side** after each major change
4. **Follow Location Block Protocol** - organize code by workflow, not technical function
5. **Use existing QOLAE patterns** - don't reinvent the wheel
6. **Reference STEP1A_API_CONTRACT.md** for all endpoint specs (SINGLE SOURCE OF TRUTH)

---

## 📊 QUICK STATUS DASHBOARD

| Stream | Agent | Task | Status | ETA | Blocker? |
|--------|-------|------|--------|-----|----------|
| A | Frontend-Specialist | 1A.1.7 (Reg Form) | ⏳ In Progress | - | - |
| A | Frontend-Specialist | 1A.1.8 (Display List) | ⏳ In Progress | - | - |
| A | Frontend-Specialist | 1A.3.7/3.8 (Upload) | ⏳ In Progress | - | - |
| B | Auth-Specialist | 1A.2.2 (Verify PIN) | ⏳ In Progress | - | - |
| B | Auth-Specialist | 1A.2.3 (Send OTP) | ⏳ In Progress | - | - |
| B | Auth-Specialist | 1A.2.4 (Verify OTP) | ⏳ In Progress | - | - |
| B | Auth-Specialist | 1A.2.5 (Password) | ⏳ In Progress | - | - |
| C | Data-Specialist | 1A.3.3/3.4 (Tables) | ⏳ In Progress | - | - |
| C | Data-Specialist | 1A.3.6 (File Store) | ⏳ In Progress | - | - |
| C | Data-Specialist | 1A.4.1-4.4 (Access) | ⏳ In Progress | - | - |

**Legend**: ⏳ In Progress | ✅ Complete | 🚫 Blocked | ⚠️ Needs Review

---

## ❓ Q&A SECTION

### **For Frontend-Specialist (Stream A)**

**Q1**: Should the registration form modal open in a separate window or inline on the dashboard?
**A**: Inline modal on the "New Starters" tab. See `readersRegistrationModal.ejs` for the pattern you should follow.

**Q2**: When the PIN is generated and displayed, should I auto-copy it to clipboard?
**A**: Yes! Include a "Copy to Clipboard" button next to the PIN. Use pattern from existing code.

**Q3**: For the display list, what columns exactly do I need?
**A**: Name, Email, Role, Status (badge), Date Created, Actions (View, Resend Email, Mark Complete)

**Q4**: How often should the display list auto-refresh?
**A**: Every 5 seconds via WebSocket subscription to `new_starter_compliance_submitted` event. See `websocket-client.js` for pattern.

---

### **For Auth-Specialist (Stream B)**

**Q1**: Do I need to create a new controller file or add to existing NewStarterController.js?
**A**: Add the 4 route handlers to `routes/newStarterRoute.js`. Update `NewStarterController.js` if needed for logic.

**Q2**: What's the rate limiting library you recommend?
**A**: Use `express-rate-limit` pattern or implement manually with Redis if available. If not, use in-memory store with timestamp tracking.

**Q3**: For OTP email, should I use sendNewStarterInvitation.js pattern?
**A**: Yes! Create similar utility file `utils/sendNewStarterOTP.js` following the same email service pattern.

**Q4**: Where should I store the OTP and otp_expires_at temporarily?
**A**: In the `new_starters` table columns. These fields already exist in the schema.

---

### **For Data-Specialist (Stream C)**

**Q1**: Should new_starter_documents and new_starter_references be in qolae_hrcompliance or qolae_casemanagers database?
**A**: Both new tables in `qolae_hrcompliance`. Only `workspace_access_rules` goes in `qolae_casemanagers`.

**Q2**: Where exactly should files be stored?
**A**: `/var/www/api.qolae.com/central-repository/new-starters/{PIN}/{document_type}/` - this mirrors Readers pattern.

**Q3**: Do I need virus scanning for uploaded files?
**A**: Optional for now. Focus on core functionality. If needed, add ClamAV integration later.

**Q4**: How does the workspace_access field in new_starters table relate to workspace_access_rules?
**A**: `workspace_access` in new_starters = current level (limited/full). `workspace_access_rules` = configurable per-feature permissions. For now, keep it simple.

---

## 🚫 BLOCKER REPORTS

### **Format for Reporting Blockers**:
```
**BLOCKER REPORT**
Agent: [Stream A/B/C]
Task: [Task number and name]
Severity: 🔴 Critical | 🟠 High | 🟡 Medium | 🟢 Low
Issue: [Clear description of what's stuck]
Error Message: [If applicable, include full error]
What I've tried: [What you've already attempted]
Needed to proceed: [What info/help you need]
```

### **Active Blockers**:

*(None reported yet)*

---

## 🔄 CROSS-AGENT DEPENDENCIES

### **Stream A (Frontend) Depends On:**
- ✅ Backend API endpoints exist (Atlas/Atlas agents built these)
- ✅ WebSocket client ready (Mercury needs to finish this - using existing code for now)
- ⏳ Stream B: PIN/OTP endpoints (needed for testing registration flow)
- ⏳ Stream C: Database tables (needed for data to display in lists)

### **Stream B (Auth) Depends On:**
- ✅ Database schema exists (Atlas built this)
- ✅ Email service (nodemailer configured)
- ⏳ Stream C: Database tables complete (for storage)

### **Stream C (Data) Depends On:**
- ✅ Database exists (qolae_hrcompliance, qolae_casemanagers)
- ✅ Central repository directory exists
- No dependencies on Streams A or B

### **Integration Points (After All Streams)**:
- Frontend must call Backend endpoints (A → B)
- Backend must store/retrieve from Database (B → C)
- Frontend must display Database data (A ← C)

---

## 📝 PROGRESS UPDATES

### **Update Format**:
```
**PROGRESS UPDATE**
Agent: [Stream A/B/C]
Timestamp: [HH:MM]
Completed: [What you just finished]
Current: [What you're working on now]
Next: [What you'll do next]
Confidence: [High/Medium/Low - will you hit your deadline?]
```

### **Hourly Updates** (Recommend):
- Hour 1: Initial setup and first task started
- Hour 2: First task status
- Hour 3: Integration check-in
- Hour 4: Final testing and code review
- Hour 5: Deployment readiness

### **Update Log**:

*(Updates will be recorded here as agents report in)*

---

## ✅ CODE REVIEW CHECKLIST

**Before deployment, each agent must verify**:

### **Stream A (Frontend):**
- [ ] All form inputs validate correctly
- [ ] Error messages are clear and user-friendly
- [ ] API calls match STEP1A_API_CONTRACT.md exactly
- [ ] WebSocket subscriptions are correct
- [ ] Mobile responsive (375px minimum)
- [ ] No console errors
- [ ] Follows existing QOLAE styling patterns

### **Stream B (Auth):**
- [ ] All 4 endpoints respond with correct status codes
- [ ] Error responses match API contract
- [ ] Rate limiting enforced (5 attempts/15 mins)
- [ ] Passwords hashed with bcrypt(12)
- [ ] OTP never exposed in responses
- [ ] All security checks pass
- [ ] Logging implemented for audit trail

### **Stream C (Data):**
- [ ] Database tables created with correct schema
- [ ] Foreign keys have CASCADE delete
- [ ] Indexes created for performance
- [ ] File storage utility works correctly
- [ ] File naming follows pattern: PIN_type_timestamp.ext
- [ ] Middleware blocks unauthorized access
- [ ] Test queries work (SELECT, INSERT, UPDATE)

---

## 🚀 DEPLOYMENT CHECKLIST

**Before going to Live Server, verify**:

### **All Streams:**
- [ ] Code compiles/runs without errors
- [ ] No console warnings or errors
- [ ] All API endpoints tested locally
- [ ] Database changes tested
- [ ] Files ready to copy to Live Server

### **Stream A Deployment:**
- [ ] Copy `/views/` to `/var/www/hrcompliance.qolae.com/views/`
- [ ] Copy `/assets/js/` updates to Live Server
- [ ] Restart PM2: `pm2 restart qolae-hrcompliance`
- [ ] Test in browser: `hrcompliance.qolae.com`

### **Stream B Deployment:**
- [ ] Copy `/routes/newStarterRoute.js` to Live Server
- [ ] Copy `/controllers/NewStarterController.js` updates to Live Server
- [ ] Restart PM2: `pm2 restart qolae-hrcompliance`
- [ ] Test endpoints with curl/Postman

### **Stream C Deployment:**
- [ ] Run SQL migration: `psql -U postgres qolae_hrcompliance < database/add-new-starter-tables.sql`
- [ ] Copy `/middleware/checkWorkspaceAccess.js` to Live Server
- [ ] Copy `/utils/saveNewStarterDocuments.js` to Live Server
- [ ] Verify directory permissions: `ls -la /var/www/api.qolae.com/central-repository/new-starters/`
- [ ] Restart PM2: `pm2 restart qolae-hrcompliance`

---

## 📚 QUICK REFERENCE

### **Key Files to Reference**:
- `STEP1A_API_CONTRACT.md` - **REQUIRED READING** (endpoint specs)
- `STEP1A_3AGENT_PARALLEL_PLAN.md` - Your specific task section
- `readersRegistrationModal.ejs` - Frontend pattern to follow
- `sendNewStarterInvitation.js` - Email pattern to follow
- `generateNewStarterPIN.js` - PIN generation pattern
- `websocket-client.js` - WebSocket subscription pattern
- `NewStarterController.js` - Backend pattern to follow

### **Key Endpoints** (from API contract):
```
POST   /api/new-starter/create              → Stream A uses, Stream B/C supports
GET    /api/new-starter/all                 → Stream A uses
POST   /api/new-starter/verify-pin          → Stream B builds, Stream A uses
POST   /api/new-starter/send-otp            → Stream B builds, Stream A uses
POST   /api/new-starter/verify-otp          → Stream B builds, Stream A uses
POST   /api/new-starter/create-password     → Stream B builds, Stream A uses
POST   /api/new-starter/submit-compliance   → Stream B/C builds, Stream A uses
POST   /api/new-starter/approve             → Liz's admin feature
```

### **Database Tables** (Stream C creates):
- `new_starter_documents` - Stores uploaded files metadata
- `new_starter_references` - Stores reference contact info
- `workspace_access_rules` - Defines feature access per level

---

## 💬 COMMUNICATION PROTOCOL

**How to use this document**:

1. **Questions?** Add to the Q&A section relevant to your stream
2. **Blocked?** Fill out BLOCKER REPORT template
3. **Progress?** Add PROGRESS UPDATE every hour
4. **Done?** Mark task complete in STATUS DASHBOARD

**Response SLA**: Max 30 minutes for blockers, 1 hour for questions

**Who to ask**:
- Technical questions about API: Ask in Q&A, reference API contract
- Database questions: Stream C is expert, ask here
- Frontend questions: Stream A is expert, ask here
- Auth/security questions: Stream B is expert, ask here
- General QOLAE patterns: Liz or check existing code

---

## 🎯 SUCCESS CRITERIA (FINAL VERIFICATION)

**Before saying "STEP 1A COMPLETE":**

✅ All 8 API endpoints working correctly
✅ Registration → PIN generation → Email working
✅ PIN verification → OTP → Password flow working
✅ Compliance document submission working
✅ All data storing correctly in database
✅ File storage working with correct paths
✅ Frontend displaying data in real-time
✅ Error handling graceful everywhere
✅ Security requirements met (rate limiting, validation, hashing)
✅ Live Server tested and working
✅ No console errors or warnings
✅ Code follows QOLAE patterns

---

## 📞 NEED LIZ?

**Only escalate to Liz if**:
- 🔴 Critical blocker preventing progress (after 30 mins trying to solve)
- ❓ Ambiguity in API contract that affects implementation
- 🚨 Security concern
- 🎯 Architectural decision needed
- 💾 Database schema clarification needed

**Liz will check in at**:
- Hour 0: Kickoff confirmation
- Hour 2: Midpoint check-in
- Hour 4: Integration sync
- Hour 5: Pre-deployment review

---

**Document Owner**: Liz Chukwu
**Last Updated**: October 18, 2025
**Next Review**: After agents start work

---

**Ready to work, agents? Let's build! 🚀💪🏽**
