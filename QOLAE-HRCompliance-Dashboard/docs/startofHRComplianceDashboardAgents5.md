# QOLAE HR Compliance Dashboard - Agent Instructions

## 🎯 OVERVIEW
You are working on the QOLAE HR Compliance Dashboard (`hrcompliance.qolae.com`) as part of a 5-agent parallelization team. Each agent has specific responsibilities and dependencies.

## 🔥 PHOENIX (Foundation Agent) - IN PROGRESS 🚧
**Status**: IN PROGRESS - Rebuilding corrupted hrc_server.js and completing models
**Current Progress**:
- ✅ Database schema complete (setup_qolae_hrcompliance.sql)
- ✅ Database config complete (config/database.js)
- ✅ 2 models complete (Compliance.js, Reader.js)
- ✅ NotificationService complete (services/NotificationService.js)
- ✅ Utilities complete (sendReaderInvitation.js, generateCustomizedReadersNDA.js, agentSoundHooks.js)
- ❌ hrc_server.js CORRUPTED - needs rebuild
- ❌ 3 models incomplete (Assignment.js, CaseManager.js, Client.js)
- ❌ Route registration system not yet implemented

**Phoenix Tasks Remaining**:
1. Rebuild hrc_server.js following Location Block Protocol
2. Complete missing models (Assignment, CaseManager, Client)
3. Create route registration system for parallel agent work
4. Test server starts on port 3012

**Next**: Once Phoenix completes minimal foundation, Atlas/Iris/Sage can work in parallel

## 🏗️ ATLAS (New Starters Agent) - READY TO START
**Dependencies**: Phoenix's database models ✅
**Your Tasks**:
1. Create New Starter routes and controller (`routes/newStarterRoute.js`, `controllers/NewStarterController.js`)
2. Build PIN generation system (reuse from existing QOLAE signature process)
3. Create invitation email system (reuse from existing email utilities)
4. Build new starter portal view (`views/newStarter-portal.ejs`)
5. Implement document upload and flexible workspace access

**Files to Create/Modify**:
- `routes/newStarterRoute.js`
- `controllers/NewStarterController.js` 
- `views/newStarter-portal.ejs`
- `utils/generateNewStarterPIN.js`
- `utils/sendNewStarterInvitation.js`

**Key Requirements**:
- Follow Location Block Protocol (see `LocationBlockProtocol.md`)
- Use existing database models from Phoenix
- Integrate with existing QOLAE email system
- Implement flexible workspace access (some areas greyed out until approved)

## 👁️ IRIS (Readers Agent) - READY TO START  
**Dependencies**: Phoenix's database models ✅
**Your Tasks**:
1. Create Readers compliance routes and controller (`routes/readersComplianceRoute.js`, `controllers/ReadersComplianceController.js`)
2. Build CV upload and reference submission system
3. Create readers compliance tracking view (`views/readers-compliance.ejs`)
4. Integrate existing reader registration card (`views/readersRegistration.ejs`)

**Files to Create/Modify**:
- `routes/readersComplianceRoute.js`
- `controllers/ReadersComplianceController.js`
- `views/readers-compliance.ejs` 
- Update `views/readersRegistration.ejs` (already exists)

**Key Requirements**:
- Follow Location Block Protocol
- Use existing database models from Phoenix
- Integrate with Readers Dashboard (`readers.qolae.com`)
- Implement secure document viewing (no downloads)

## 🧠 SAGE (Compliance Review Agent) - READY TO START
**Dependencies**: Phoenix's database models ✅
**Your Tasks**:
1. Create compliance review routes and controller (`routes/complianceReviewRoute.js`, `controllers/ComplianceReviewController.js`)
2. Build reference collection system (phone + email)
3. Create compliance review modal (`views/compliance-review-modal.ejs`)
4. Implement final approval and activation workflow

**Files to Create/Modify**:
- `routes/complianceReviewRoute.js`
- `controllers/ComplianceReviewController.js`
- `views/compliance-review-modal.ejs`
- `utils/referenceCollection.js`

**Key Requirements**:
- Follow Location Block Protocol
- Use existing database models from Phoenix
- Implement Liz-only access for compliance review
- Create approval workflow that activates accounts

## ⚡ MERCURY (Integration Agent) - WAITING
**Dependencies**: Atlas, Iris, and Sage must complete their workflows first
**Your Tasks**:
1. Set up WebSocket server (`config/websocket.js`)
2. Build cross-dashboard notification system
3. Integrate with CaseManagers and Readers dashboards
4. Perform end-to-end testing across all workflows

**Files to Create/Modify**:
- `config/websocket.js`
- `routes/integrationRoute.js`
- `controllers/IntegrationController.js`
- Update main server file (`hrc_server.js`)

## 🎵 SOUND HOOKS SETUP

Add these to your Claude Code environment:

### 1. Create Sound Files Directory
```bash
mkdir -p /Users/lizchukwu_1/QOLAE-Online-Portal/QOLAE-HRCompliance-Dashboard/public/sounds
```

### 2. Add Sound Files (you can use free sounds from freesound.org):
- `thinking.mp3` - Agent is analyzing/thinking
- `working.mp3` - Agent is actively coding
- `testing.mp3` - Agent is testing code
- `error.mp3` - Agent encountered an error
- `success.mp3` - Agent completed a task
- `waiting.mp3` - Agent is waiting for dependencies

### 3. Add Sound Hook Code to Each Agent's Files
Add this to the top of each agent's main files:

```javascript
// ==============================================
// SOUND HOOKS FOR AGENT COMMUNICATION
// ==============================================
const playSound = (soundType) => {
  const sounds = {
    thinking: '/sounds/thinking.mp3',
    working: '/sounds/working.mp3', 
    testing: '/sounds/testing.mp3',
    error: '/sounds/error.mp3',
    success: '/sounds/success.mp3',
    waiting: '/sounds/waiting.mp3'
  };
  
  if (typeof window !== 'undefined') {
    const audio = new Audio(sounds[soundType]);
    audio.volume = 0.3;
    audio.play().catch(e => console.log('Sound play failed:', e));
  }
};

// Usage examples:
// playSound('thinking');   // When analyzing requirements
// playSound('working');    // When actively coding
// playSound('testing');    // When running tests
// playSound('error');      // When encountering errors
// playSound('success');    // When completing tasks
// playSound('waiting');    // When waiting for dependencies
```

## 📋 AGENT COMMUNICATION PROTOCOL

### Daily Standup Format:
1. **Agent Name**: [Phoenix/Atlas/Iris/Sage/Mercury]
2. **Status**: [Working/Waiting/Testing/Complete/Error]
3. **Completed**: List completed tasks
4. **Next**: What you're working on next
5. **Blockers**: Any dependencies or issues
6. **ETA**: Estimated completion time

### File Naming Convention:
- Routes: `[agentName]-[workflow]Route.js`
- Controllers: `[AgentName]Controller.js`
- Views: `[workflow]-[view].ejs`
- Utils: `[functionName].js`

### Code Comments:
Start each file with:
```javascript
// ==============================================
// [FILE PURPOSE]
// ==============================================
// Agent: [Agent Name]
// Date: [Current Date]
// Dependencies: [List dependencies]
// ==============================================
```

## 🚨 CRITICAL RULES FOR ALL AGENTS:

1. **Copy files directly to Live Server** (`/var/www/hrcompliance.qolae.com/`)
2. **Save using ecosystem.config PM2 process** every time to prevent cache issues
3. **Test Server side** after each major change
4. **Follow Location Block Protocol** - organize code by workflow, not technical function
5. **Use existing QOLAE patterns** - don't reinvent the wheel
6. **Communicate via sound hooks** - play appropriate sounds for status updates
7. **Update agent tracker** - mark tasks complete in the HTML tracker

## 📞 EMERGENCY PROTOCOL:
If any agent encounters critical errors or blockers:
1. Play `error.mp3` sound
2. Stop work immediately  
3. Report to Liz via the agent tracker
4. Wait for resolution before continuing

---

**Ready to start? Each agent should begin with their first task and play the `working.mp3` sound when they start coding!**
