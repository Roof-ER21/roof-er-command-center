# HIRE and DEAD Automation - Integration Guide

## Overview

This guide shows you how to integrate the complete HIRE and DEAD/NO_SHOW automation chains into Roof HR.

## ✅ Files Already Created

1. `/server/services/hire-automation.ts` - Complete HIRE automation (6 steps)
2. `/server/services/candidate-status-automation.ts` - DEAD/NO_SHOW automation
3. `/server/cron/interview-overdue-job.ts` - Interview overdue escalation
4. `/server/routes/hr/hire-endpoint.ts` - POST /candidates/:id/hire endpoint

## 🔧 Manual Integration Steps

### STEP 1: Add Imports to HR Routes

**File**: `/Users/a21/roof-er-command-center/server/routes/hr/index.ts`

**Location**: After the onboarding-requirements import (around line 66)

**Add these imports**:
```typescript
import { executeStatusAutomation } from "../../services/candidate-status-automation.js";
import hireRouter from "./hire-endpoint.js";
```

### STEP 2: Mount Hire Router

**File**: `/Users/a21/roof-er-command-center/server/routes/hr/index.ts`

**Location**: After the other router.use statements (around line 540)

**Add this line**:
```typescript
router.use(hireRouter);  // Adds POST /api/hr/candidates/:id/hire
```

### STEP 3: Update Candidate Status Change Logic

**File**: `/Users/a21/roof-er-command-center/server/routes/hr/index.ts`

**Location**: Lines 909-936 (the status change email logic)

**Replace the entire section from**:
```typescript
    // Send email if status changed
    if (status !== undefined && status !== currentCandidate.status) {
      sendCandidateStatusEmail(updated, status, currentCandidate.status).catch(err => {
        console.error('Failed to send candidate status email:', err);
      });

      // Send rejection email if status changed to "rejected" (DEAD_BY_US)
      if (status === 'rejected') {
        sendRejectionEmail({
          id: updated.id,
          firstName: updated.firstName,
          lastName: updated.lastName,
          email: updated.email,
          position: updated.position,
        }).catch(err => {
          console.error('Failed to send rejection email:', err);
        });
      }
    }

    // Send offer email if status changed to "offer"
    if (status === 'offer' && currentCandidate.status !== 'offer') {
      sendOfferEmail(updated, {
        position: updated.position,
      }).catch(err => {
        console.error('Failed to send offer email:', err);
      });
    }
```

**With this**:
```typescript
    // Send email if status changed
    if (status !== undefined && status !== currentCandidate.status) {
      sendCandidateStatusEmail(updated, status, currentCandidate.status).catch(err => {
        console.error('Failed to send candidate status email:', err);
      });

      // Execute DEAD/NO_SHOW automation
      const deadStatuses = ['DEAD_BY_CANDIDATE', 'DEAD_BY_COMPANY', 'DEAD_COMPENSATION', 'DEAD_LOCATION', 'DEAD_TIMING', 'DEAD_QUALIFICATIONS', 'DEAD_CULTURE_FIT', 'DEAD_OTHER', 'rejected', 'NO_SHOW', 'no_show'];

      if (deadStatuses.includes(status)) {
        console.log(`🔄 Executing ${status} automation for candidate ${updated.id}`);
        executeStatusAutomation({
          candidateId: updated.id,
          newStatus: status,
          oldStatus: currentCandidate.status,
          reason: req.body.deadReason,
          interviewId: req.body.interviewId,
          googleEventId: req.body.googleEventId,
        }).catch(err => {
          console.error('Failed to execute status automation:', err);
        });
      }
    }

    // Send offer email if status changed to "offer"
    if (status === 'offer' && currentCandidate.status !== 'offer') {
      sendOfferEmail(updated, {
        position: updated.position,
      }).catch(err => {
        console.error('Failed to send offer email:', err);
      });
    }
```

### STEP 4: Add Auto-Archive Endpoint

**File**: `/Users/a21/roof-er-command-center/server/routes/hr/index.ts`

**Location**: Before `export default router;` (end of file)

**Add this endpoint**:
```typescript
/**
 * Auto-archive candidates in terminal states older than 30 days
 * POST /api/hr/candidates/auto-archive
 */
router.post("/candidates/auto-archive", async (req: Request, res: Response) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Find candidates in terminal states older than 30 days
    const terminalStates = [
      'rejected',
      'hired',
      'withdrawn',
      'DEAD_BY_CANDIDATE',
      'DEAD_BY_COMPANY',
      'DEAD_COMPENSATION',
      'DEAD_LOCATION',
      'DEAD_TIMING',
      'DEAD_QUALIFICATIONS',
      'DEAD_CULTURE_FIT',
      'DEAD_OTHER'
    ];

    const candidatesToArchive = await db.select().from(candidates)
      .where(and(
        eq(candidates.isArchived, false),
        inArray(candidates.status, terminalStates),
        lte(candidates.updatedAt, thirtyDaysAgo)
      ));

    console.log(`📦 Found ${candidatesToArchive.length} candidates to auto-archive`);

    if (candidatesToArchive.length === 0) {
      return res.json({
        success: true,
        message: 'No candidates to archive',
        archived: 0,
      });
    }

    // Archive them
    const candidateIds = candidatesToArchive.map(c => c.id);
    await db.update(candidates)
      .set({
        isArchived: true,
        archivedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(inArray(candidates.id, candidateIds));

    console.log(`✅ Archived ${candidatesToArchive.length} candidates`);

    res.json({
      success: true,
      message: `Archived ${candidatesToArchive.length} candidates`,
      archived: candidatesToArchive.length,
      candidates: candidatesToArchive.map(c => ({
        id: c.id,
        name: `${c.firstName} ${c.lastName}`,
        status: c.status,
        updatedAt: c.updatedAt,
      })),
    });

  } catch (error) {
    console.error("Auto-archive error:", error);
    res.status(500).json({ error: "Failed to auto-archive candidates" });
  }
});
```

### STEP 5: Enable Interview Overdue Cron Job (Optional)

If you want the daily 10:00 AM overdue interview check:

**Option A: Using node-cron** (recommended)

1. Install node-cron:
```bash
npm install node-cron @types/node-cron
```

2. Create `/server/cron/scheduler.ts`:
```typescript
import cron from 'node-cron';
import { checkOverdueInterviews } from './interview-overdue-job.js';

export function startCronJobs() {
  // Run interview overdue check daily at 10:00 AM
  cron.schedule('0 10 * * *', () => {
    console.log('🕐 Running interview overdue job...');
    checkOverdueInterviews().catch(console.error);
  });

  console.log('✅ Cron jobs scheduled');
  console.log('   - Interview overdue check: Daily at 10:00 AM');
}
```

3. Call in your server startup (e.g., `server/index.ts`):
```typescript
import { startCronJobs } from './cron/scheduler.js';

// After Express app is configured
startCronJobs();
```

**Option B: Manual trigger via API** (for testing)

Add this endpoint to `/server/routes/hr/index.ts`:
```typescript
router.post("/debug/check-overdue-interviews", async (req: Request, res: Response) => {
  try {
    const { checkOverdueInterviews } = await import("../../cron/interview-overdue-job.js");
    await checkOverdueInterviews();
    res.json({ success: true, message: "Interview overdue check completed" });
  } catch (error: any) {
    console.error("Interview overdue check failed:", error);
    res.status(500).json({ error: error.message });
  }
});
```

## 🎯 New API Endpoints

After integration, you'll have these new endpoints:

### 1. Hire a Candidate
```http
POST /api/hr/candidates/:id/hire
Content-Type: application/json

{
  "role": "SALES_REP",
  "startDate": "2026-02-01",
  "employmentType": "W2",
  "department": "Sales",
  "salary": "$50000",
  "welcomePackageId": 1  // Optional
}

Response:
{
  "success": true,
  "userId": 42,
  "steps": {
    "userCreated": true,
    "ptoCreated": true,
    "packageAssigned": true,
    "receiptCreated": true,
    "tasksCreated": true,
    "emailSent": true
  },
  "warnings": [],
  "errors": []
}
```

### 2. Auto-Archive Old Candidates
```http
POST /api/hr/candidates/auto-archive

Response:
{
  "success": true,
  "archived": 15,
  "candidates": [...]
}
```

### 3. Check Overdue Interviews (if manual trigger enabled)
```http
POST /api/hr/debug/check-overdue-interviews

Response:
{
  "success": true,
  "message": "Interview overdue check completed"
}
```

## 🔄 Automation Behaviors

### HIRE Automation (when candidate status → HIRED)

Use the POST /candidates/:id/hire endpoint which:

1. ✅ **Creates user account** with email, temp password TRD2026!, mustChangePassword=true
2. ✅ **Creates PTO policy**:
   - W2 non-Sales: 17 days (10 vacation, 5 sick, 2 personal)
   - 1099 or Sales: 0 days
3. ✅ **Assigns welcome package** (if provided) - creates bundle/tool assignments
4. ✅ **Creates equipment receipt** with signing token (locked until startDate, expires 30 days)
5. ✅ **Creates 6 onboarding tasks**:
   - Complete I-9 Form (due: start date)
   - Sign Employment Contract (due: start date)
   - Complete Safety Training (due: start + 3 days)
   - Tools & Equipment Assignment (due: start date)
   - Benefits Enrollment (due: start + 7 days)
   - Complete Online Training (due: start - 1 day, pre-boarding)
6. ✅ **Sends welcome email** with temp password, training URL, equipment link

### DEAD/NO_SHOW Automation (when status changes)

Automatically triggers when candidate status changes to any DEAD state or NO_SHOW:

**Any DEAD status** (DEAD_BY_CANDIDATE, DEAD_BY_COMPANY, rejected, etc.):
- ✅ Sends rejection email with appropriate template based on reason

**NO_SHOW status**:
- ✅ Adds "No Show" tag to candidate
- ✅ Creates system note: "Interview no-show on {date}"
- ✅ Sends reschedule email
- ✅ Deletes Google Calendar event (if googleEventId provided)

### Interview Overdue Escalation (runs daily at 10:00 AM)

**1+ day overdue**:
- ✅ Sends feedback reminder to interviewer

**3+ days overdue**:
- ✅ Sends escalation email to all HR admins

**7+ days overdue**:
- ✅ Auto-marks interview as NO_SHOW
- ✅ Moves candidate to DEAD_BY_CANDIDATE
- ✅ Executes NO_SHOW automation (tags, notes, emails)
- ✅ Creates system note explaining auto-action

## ✅ Testing Checklist

### Test HIRE Automation
```bash
# Use the hire endpoint
curl -X POST http://localhost:5000/api/hr/candidates/1/hire \
  -H "Content-Type: application/json" \
  -d '{
    "role": "SALES_REP",
    "startDate": "2026-02-01",
    "employmentType": "W2"
  }'

# Check:
# - User created in users table
# - PTO policy created (ptoPolicies table)
# - Onboarding tasks created (onboardingTasks table)
# - Equipment token created (equipmentSignatureTokens table)
# - Welcome email sent (check logs or email notifications table)
```

### Test DEAD/NO_SHOW Automation
```bash
# Update candidate to NO_SHOW
curl -X PATCH http://localhost:5000/api/hr/candidates/2 \
  -H "Content-Type: application/json" \
  -d '{"status": "NO_SHOW", "interviewId": 5}'

# Check:
# - "No Show" tag added
# - System note created (candidateNotes table)
# - Reschedule email sent (check logs)

# Update candidate to DEAD
curl -X PATCH http://localhost:5000/api/hr/candidates/3 \
  -H "Content-Type: application/json" \
  -d '{"status": "DEAD_BY_COMPANY", "deadReason": "DEAD_QUALIFICATIONS"}'

# Check:
# - Rejection email sent (check logs)
```

### Test Auto-Archive
```bash
# Trigger auto-archive
curl -X POST http://localhost:5000/api/hr/candidates/auto-archive

# Check:
# - Candidates in terminal states 30+ days old are archived
# - isArchived = true, archivedAt set
```

### Test Interview Overdue Job
```bash
# If manual trigger enabled
curl -X POST http://localhost:5000/api/hr/debug/check-overdue-interviews

# Check logs for:
# - Overdue interviews found
# - Reminder emails (1+ day)
# - Escalation emails (3+ day)
# - Auto NO_SHOW (7+ day)
```

## 📝 Notes

- **Email Simulation**: If RESEND_API_KEY is not set, emails run in simulation mode (logged to console)
- **Bundle/Tool Tables**: Welcome package assignment is a placeholder until bundle/tool schema is added
- **Google Calendar**: Calendar event deletion is a placeholder until Google Calendar API is integrated
- **Cron Scheduling**: Interview overdue job needs to be scheduled (see Step 5)

## 🚨 Important

- Always test in development first
- Ensure database has all required tables (users, ptoPolicies, onboardingTasks, equipmentSignatureTokens, candidateNotes)
- Check that email service is properly configured
- Monitor logs for any errors during automation

## 🎉 You're Done!

Once integrated, the system will:
1. ✅ Automatically hire candidates with full onboarding setup
2. ✅ Handle DEAD/NO_SHOW candidates with appropriate emails and tags
3. ✅ Escalate overdue interviews automatically
4. ✅ Archive old candidates on demand

All automation is logged and can be monitored through the console and database tables.
