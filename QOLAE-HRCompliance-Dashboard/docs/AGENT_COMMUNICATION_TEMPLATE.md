# 🎯 AGENT COMMUNICATION TEMPLATE

## For Claude Code Agents:

### 1. **Copy this template to each agent's terminal:**

```bash
# Agent: [ATLAS/IRIS/SAGE/MERCURY]
# Task: [Current task description]
# Status: [Working/Waiting/Testing/Complete/Error]
# Sound: [thinking/working/testing/error/success/waiting]

# Add sound hooks to your code:
import { agentSounds } from './utils/agentSoundHooks.js';

# Usage examples:
agentSounds.thinking('Starting new starter workflow...');
agentSounds.working('Building PIN generation system...');
agentSounds.testing('Testing database connection...');
agentSounds.success('New starter route created successfully!');
agentSounds.error('Database connection failed');
```

### 2. **Daily Standup Format:**
```
Agent: [Name]
Status: [Current Status]
Completed: [List completed tasks]
Next: [What you're working on next]
Blockers: [Any dependencies or issues]
ETA: [Estimated completion time]
Sound: [Current sound status]
```

### 3. **File Structure to Follow:**
```
QOLAE-HRCompliance-Dashboard/
├── routes/
│   ├── newStarterRoute.js (Atlas)
│   ├── readersComplianceRoute.js (Iris)
│   └── complianceReviewRoute.js (Sage)
├── controllers/
│   ├── NewStarterController.js (Atlas)
│   ├── ReadersComplianceController.js (Iris)
│   └── ComplianceReviewController.js (Sage)
├── views/
│   ├── newStarter-portal.ejs (Atlas)
│   ├── readers-compliance.ejs (Iris)
│   └── compliance-review-modal.ejs (Sage)
└── utils/
    ├── agentSoundHooks.js (All agents)
    ├── generateNewStarterPIN.js (Atlas)
    └── referenceCollection.js (Sage)
```

### 4. **Critical Rules:**
- ✅ Copy files directly to Live Server (`/var/www/hrcompliance.qolae.com/`)
- ✅ Save using ecosystem.config PM2 process every time
- ✅ Test Server side after each major change
- ✅ Follow Location Block Protocol
- ✅ Use existing QOLAE patterns
- ✅ Play sound hooks for status updates
- ✅ Update agent tracker HTML

### 5. **Emergency Protocol:**
If you encounter critical errors:
1. Play `error.mp3` sound
2. Stop work immediately
3. Report to Liz via agent tracker
4. Wait for resolution

---

**Ready to start? Each agent should begin with their first task and play the `working.mp3` sound!**
