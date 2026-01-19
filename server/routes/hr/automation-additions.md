# HR Automation Additions

This document describes the changes needed to integrate HIRE and DEAD/NO_SHOW automation into the HR routes.

## 1. Add Imports (after line 66)

```typescript
import { executeStatusAutomation } from "../../services/candidate-status-automation.js";
import hireRouter from "./hire-endpoint.js";
```

## 2. Mount Hire Router (after line 540, with other sub-routers)

```typescript
router.use(hireRouter);  // Adds POST /candidates/:id/hire endpoint
```

## 3. Update Candidate PATCH Endpoint (replace lines 908-936)

Find this section around line 908:
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

Replace with:
```typescript
    // Send email if status changed
    if (status !== undefined && status !== currentCandidate.status) {
      sendCandidateStatusEmail(updated, status, currentCandidate.status).catch(err => {
        console.error('Failed to send candidate status email:', err);
      });

      // Execute DEAD/NO_SHOW automation
      if (status.startsWith('DEAD') || status === 'rejected' || status === 'NO_SHOW' || status === 'no_show') {
        executeStatusAutomation({
          candidateId: updated.id,
          newStatus: status,
          oldStatus: currentCandidate.status,
          // Add reason if available from req.body
          reason: req.body.deadReason,
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

## 4. Add Auto-Archive Endpoint (before export default router)

```typescript
/**
 * Auto-archive candidates in terminal states older than 30 days
 * POST /api/hr/candidates/auto-archive
 */
router.post("/candidates/auto-archive", async (req: Request, res: Response) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Find candidates in terminal states (rejected, hired, withdrawn, dead) older than 30 days
    const terminalStates = ['rejected', 'hired', 'withdrawn', 'DEAD_BY_CANDIDATE', 'DEAD_BY_COMPANY', 'DEAD_COMPENSATION', 'DEAD_LOCATION', 'DEAD_TIMING', 'DEAD_QUALIFICATIONS', 'DEAD_CULTURE_FIT', 'DEAD_OTHER'];

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

## 5. Add Cron Job Registration (in server/index.ts or appropriate startup file)

```typescript
import { scheduleInterviewOverdueJob } from './cron/interview-overdue-job.js';

// In your app startup
scheduleInterviewOverdueJob();
```

## Manual Application Steps

Since the file is large, apply these changes manually:

1. Open `/Users/a21/roof-er-command-center/server/routes/hr/index.ts`
2. Add the imports at the top (after line 66)
3. Mount the hire router (after line 540)
4. Update the candidate PATCH endpoint (around line 908)
5. Add the auto-archive endpoint (before the export at the end)
6. Save the file

The hire endpoint is already created in `/Users/a21/roof-er-command-center/server/routes/hr/hire-endpoint.ts` and will be automatically included when you mount the router.
