# Email Automation System - Phase 1

Complete email automation system for recruiting and onboarding workflows.

## Overview

The email automation system automatically sends emails to candidates and employees at key stages in the recruiting and onboarding process. All emails are logged to the database for tracking and auditing.

## Features

### Automatic Email Triggers

1. **Candidate Status Changes**
   - Sends emails when candidate status changes (screening → interview → offer → hired)
   - Includes personalized status-specific messages
   - Tracks email delivery status

2. **Interview Scheduling**
   - Automatically sends interview details when interview is created
   - Includes meeting link, location, and calendar information
   - Sends 24-hour reminder emails

3. **Offer Letters**
   - Sends personalized offer emails when candidate moves to "offer" status
   - Includes position, salary, and benefits information

4. **Welcome Emails**
   - Sends welcome email to new employees
   - Includes onboarding checklist and next steps

5. **Onboarding Reminders**
   - Sends reminders for overdue onboarding tasks
   - Groups tasks by employee for batch notification

## Architecture

### Database Schema

**email_notifications table:**
```sql
CREATE TABLE "email_notifications" (
  "id" serial PRIMARY KEY,
  "recipient_email" text NOT NULL,
  "recipient_name" text,
  "subject" text NOT NULL,
  "email_type" text NOT NULL,  -- 'candidate_status' | 'interview_scheduled' | etc.
  "status" text DEFAULT 'pending' NOT NULL,  -- 'pending' | 'sent' | 'failed' | 'bounced'
  "sent_at" timestamp,
  "error_message" text,
  "retry_count" integer DEFAULT 0,
  "metadata" jsonb,  -- candidateId, interviewId, etc.
  "created_at" timestamp DEFAULT now() NOT NULL
);
```

### Email Service (`server/services/email.ts`)

Core service using Resend API:
- `sendCandidateStatusEmail()` - Status change notifications
- `sendInterviewScheduledEmail()` - Interview confirmations
- `sendInterviewReminderEmail()` - 24-hour reminders
- `sendOfferEmail()` - Job offers
- `sendWelcomeEmail()` - New employee welcome
- `sendOnboardingReminderEmail()` - Task reminders

All functions:
- Log to database before sending
- Handle errors gracefully
- Work in simulation mode if no API key is set
- Return success/error status

### Email Templates (`server/services/email-templates.ts`)

Beautiful HTML/text email templates:
- Professional gradient headers
- Mobile-responsive design
- Clear call-to-action buttons
- Consistent branding
- Plain text fallbacks

### CRON Endpoints (`server/routes/cron/index.ts`)

Scheduled endpoints for automated reminders:

**GET /api/cron/interview-reminders**
- Sends reminders for interviews scheduled in next 24 hours
- Should be run daily (e.g., 9 AM)
- Returns summary of sent/failed emails

**GET /api/cron/onboarding-reminders**
- Sends reminders for overdue onboarding tasks
- Should be run daily (e.g., 10 AM)
- Groups tasks by employee

**GET /api/cron/health**
- Health check for monitoring

## Integration Points

### HR Routes

**Candidate Status Update** (`PATCH /api/hr/candidates/:id`):
```typescript
// Automatically sends email when status changes
if (status !== currentCandidate.status) {
  sendCandidateStatusEmail(updated, status, currentCandidate.status);
}

// Sends offer email when moved to "offer" status
if (status === 'offer' && currentCandidate.status !== 'offer') {
  sendOfferEmail(updated, { position: updated.position });
}
```

**Interview Creation** (`POST /api/hr/interviews`):
```typescript
// Automatically sends interview scheduled email
sendInterviewScheduledEmail(candidate, newInterview);
```

## Setup

### 1. Environment Variables

Add to `.env`:
```bash
RESEND_API_KEY=re_xxxxxxxxxxxxx
FROM_EMAIL=noreply@yourcompany.com
```

If `RESEND_API_KEY` is not set, the system runs in **simulation mode** (emails are logged but not actually sent).

### 2. Database Migration

The `email_notifications` table is already created. If you need to recreate:

```bash
npm run db:push
```

Or run manually:
```bash
npx tsx scripts/apply-email-migration.ts
```

### 3. Testing

**Test with simulation mode:**
1. Don't set `RESEND_API_KEY` in `.env`
2. Trigger actions (create interview, change candidate status)
3. Check console logs for simulated emails

**Test with real emails:**
1. Set `RESEND_API_KEY` in `.env`
2. Set your email as candidate email
3. Trigger actions and check your inbox

## CRON Job Setup

### Option 1: Vercel Cron (Recommended for Production)

Create `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/interview-reminders",
      "schedule": "0 9 * * *"
    },
    {
      "path": "/api/cron/onboarding-reminders",
      "schedule": "0 10 * * *"
    }
  ]
}
```

### Option 2: Node-Cron (Local/Development)

Add to `server/index.ts`:
```typescript
import cron from 'node-cron';

// Interview reminders at 9 AM daily
cron.schedule('0 9 * * *', async () => {
  await fetch('http://localhost:5000/api/cron/interview-reminders');
});

// Onboarding reminders at 10 AM daily
cron.schedule('0 10 * * *', async () => {
  await fetch('http://localhost:5000/api/cron/onboarding-reminders');
});
```

### Option 3: External Service (Easycron, cron-job.org)

Create scheduled jobs to hit:
- `https://your-domain.com/api/cron/interview-reminders` daily at 9 AM
- `https://your-domain.com/api/cron/onboarding-reminders` daily at 10 AM

## Monitoring

### Database Queries

**Check sent emails:**
```sql
SELECT * FROM email_notifications
WHERE status = 'sent'
ORDER BY sent_at DESC LIMIT 100;
```

**Check failed emails:**
```sql
SELECT * FROM email_notifications
WHERE status = 'failed'
ORDER BY created_at DESC;
```

**Email stats by type:**
```sql
SELECT
  email_type,
  status,
  COUNT(*) as count
FROM email_notifications
GROUP BY email_type, status
ORDER BY email_type, status;
```

### Logs

All email operations are logged to console:
- ✅ Success: `Email sent to {email}: {subject}`
- ❌ Error: `Failed to send email to {email}: {error}`
- 📧 Simulation: `[SIMULATED] Email to {email}: {subject}`

## Email Templates

### Customization

Edit templates in `server/services/email-templates.ts`:

1. **Styling**: Update gradient colors, fonts, spacing
2. **Content**: Modify message text, add company info
3. **Branding**: Add logo, update footer
4. **Links**: Add CTA buttons, portal links

### Template Structure

Each template returns:
```typescript
{
  subject: string,  // Email subject line
  html: string,     // HTML email body
  text: string      // Plain text fallback
}
```

## API Reference

### Email Service Functions

All functions are async and return:
```typescript
Promise<{ success: boolean; messageId?: string; error?: string }>
```

**sendCandidateStatusEmail(candidate, newStatus, oldStatus)**
- Sends status change notification
- Updates candidate with new status

**sendInterviewScheduledEmail(candidate, interview)**
- Sends interview details
- Includes meeting link and calendar info

**sendInterviewReminderEmail(candidate, interview)**
- Sends 24-hour reminder
- Includes quick prep checklist

**sendOfferEmail(candidate, offerDetails)**
- Sends job offer
- Includes position, salary, benefits

**sendWelcomeEmail(employee)**
- Sends welcome message
- Includes onboarding tasks

**sendOnboardingReminderEmail(employee, tasks)**
- Sends task reminder
- Lists all pending/overdue tasks

## Future Enhancements

- [ ] Email templates in database (editable via UI)
- [ ] Email scheduling (send at specific time)
- [ ] Email retry logic (automatic retry on failure)
- [ ] Unsubscribe links
- [ ] Email open tracking
- [ ] Click tracking
- [ ] A/B testing support
- [ ] Calendar invite attachments (ICS files)
- [ ] SMS notifications as backup
- [ ] Slack notifications for HR team

## Troubleshooting

### Emails not sending

1. Check `RESEND_API_KEY` is set correctly
2. Verify FROM_EMAIL domain is verified in Resend
3. Check console logs for errors
4. Check database `email_notifications` table for status

### Emails marked as spam

1. Add SPF/DKIM records to your domain
2. Verify domain in Resend dashboard
3. Warm up your sending domain gradually
4. Avoid spam trigger words

### CRON jobs not running

1. Check CRON service is properly configured
2. Verify endpoints return 200 status
3. Check server logs for errors
4. Test endpoints manually first

## Support

For issues or questions:
1. Check console logs
2. Review database `email_notifications` table
3. Test in simulation mode first
4. Verify Resend API key and domain setup

---

**Status**: ✅ Phase 1 Complete
**Last Updated**: January 2025
