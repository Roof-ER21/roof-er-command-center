# PTO Calendar Integration - Quick Reference

## Quick Start

### Enable Google Calendar Integration

1. **Set Environment Variable:**
   ```bash
   GOOGLE_SERVICE_ACCOUNT='{"type":"service_account","project_id":"your-project",...}'
   GOOGLE_HR_CALENDAR_ID=hr-calendar@example.com
   ```

2. **Restart Server:**
   ```bash
   npm run dev
   ```

3. **Verify in Logs:**
   ```
   ✅ Google Calendar: Initialized with service account
   ✅ PTO Calendar Sync Scheduler Started
   ```

### Test in Simulation Mode

Without Google Calendar credentials, the system runs in simulation mode:
```
⚠️  Google Calendar: Running in SIMULATION mode
🗓️  [SIMULATION] Would create employee calendar event: sim-emp-1234
🗓️  [SIMULATION] Would create HR calendar event: sim-hr-5678
```

## How It Works

### On PTO Approval
```
1. Admin approves PTO → PATCH /api/hr/pto/:id
2. System sends approval email
3. System creates 2 calendar events:
   - Employee calendar: "PTO: VACATION"
   - HR calendar: "PTO: John Doe - VACATION"
4. Event IDs saved to database
```

### On PTO Denial
```
1. Admin denies PTO → PATCH /api/hr/pto/:id
2. System sends denial email
3. System deletes any existing calendar events
4. Event IDs cleared from database
```

### Automatic Sync (Background)
```
Every 5 minutes:
1. Find approved PTO without calendar events
2. Create calendar events
3. Update database with event IDs
4. Log results
```

## API Usage

### Manual Calendar Sync
```bash
curl -X POST http://localhost:5000/api/hr/pto/sync-calendar \
  -H "Cookie: your-auth-cookie" \
  -H "Content-Type: application/json"
```

**Response:**
```json
{
  "success": true,
  "synced": 5,
  "errors": 0,
  "message": "Successfully synced 5 PTO requests to calendar"
}
```

### Approve PTO (Creates Calendar Events)
```bash
curl -X PATCH http://localhost:5000/api/hr/pto/123 \
  -H "Cookie: your-auth-cookie" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "APPROVED",
    "reviewNotes": "Approved - enjoy your vacation!"
  }'
```

### Deny PTO (Deletes Calendar Events)
```bash
curl -X PATCH http://localhost:5000/api/hr/pto/123 \
  -H "Cookie: your-auth-cookie" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "DENIED",
    "reviewNotes": "Denied - insufficient PTO balance"
  }'
```

## Console Logs Reference

### Successful Calendar Event Creation
```
✅ Sent PTO approval email to john.doe@example.com
✅ Created calendar events for PTO request #123
```

### Successful Calendar Event Deletion
```
✅ Sent PTO denial email to john.doe@example.com
✅ Deleted calendar events for PTO request #123
```

### Cron Job Execution
```
┌─────────────────────────────────────────┐
│  🗓️  PTO Calendar Sync Job Started       │
│  2026-01-19T10:00:00.000Z               │
└─────────────────────────────────────────┘

📊 Found 3 PTO requests to sync
✅ Synced PTO request #101 for Jane Smith
✅ Synced PTO request #102 for Bob Johnson
✅ Synced PTO request #103 for Alice Brown

┌─────────────────────────────────────────┐
│  ✅ PTO Calendar Sync Job Complete      │
│  Duration: 1.23s                         │
│  Synced: 3                               │
│  Errors: 0                               │
│  2026-01-19T10:00:01.230Z               │
└─────────────────────────────────────────┘
```

### Simulation Mode Output
```
🗓️  [SIMULATION] Would create employee calendar event:
   Event ID: sim-emp-1705661234567-abc123
   Summary: PTO: VACATION
   Start: 2026-01-20
   End: 2026-01-25
   Employee: john.doe@example.com

🗓️  [SIMULATION] Would create HR calendar event:
   Event ID: sim-hr-1705661234567-def456
   Summary: PTO: John Doe - VACATION
   Start: 2026-01-20
   End: 2026-01-25
   HR Calendar: primary
```

### Error Handling
```
❌ Failed to create calendar events: Error: Invalid credentials
Failed to send PTO status email notification: Error: Network timeout
```

## Database Fields

### PTO Requests Table
```sql
-- Calendar event IDs (nullable)
googleEventId      TEXT      -- Employee calendar event ID
hrCalendarEventId  TEXT      -- HR calendar event ID
```

### Query Examples
```sql
-- Find PTO with calendar events
SELECT * FROM pto_requests
WHERE googleEventId IS NOT NULL;

-- Find approved PTO without calendar events (needs sync)
SELECT * FROM pto_requests
WHERE status = 'APPROVED' AND googleEventId IS NULL;

-- Clear calendar event IDs (for testing)
UPDATE pto_requests
SET googleEventId = NULL, hrCalendarEventId = NULL
WHERE id = 123;
```

## Troubleshooting

### Calendar Events Not Creating

**Check:**
1. Is `GOOGLE_SERVICE_ACCOUNT` set correctly?
2. Does service account have Calendar API enabled?
3. Does service account have access to calendars?
4. Check console logs for error messages

**Test in simulation mode:**
```bash
# Remove GOOGLE_SERVICE_ACCOUNT temporarily
# Restart server
# Check for [SIMULATION] logs
```

### Cron Job Not Running

**Check server logs on startup:**
```
✅ PTO Calendar Sync Scheduler Started
   Schedule: */5 * * * * (every 5 minutes)
   Next run: 2026-01-19T10:05:00.000Z
```

**Manually trigger sync:**
```bash
curl -X POST http://localhost:5000/api/hr/pto/sync-calendar
```

### Events Created but Not in Calendar

**Possible causes:**
- Wrong calendar ID in `GOOGLE_HR_CALENDAR_ID`
- Service account doesn't have write access to calendar
- Employee email doesn't match Google Workspace account

**Verify event IDs:**
```sql
SELECT id, googleEventId, hrCalendarEventId
FROM pto_requests
WHERE id = 123;
```

## Configuration Options

### Environment Variables
```bash
# Required for real mode (optional - uses simulation mode if not set)
GOOGLE_SERVICE_ACCOUNT='{"type":"service_account",...}'

# Optional calendar IDs (defaults to 'primary')
GOOGLE_EMPLOYEE_CALENDAR_ID=primary
GOOGLE_HR_CALENDAR_ID=hr-calendar@example.com
```

### Cron Schedule
Default: Every 5 minutes (`*/5 * * * *`)

To change, edit `/server/cron/pto-calendar-sync.ts`:
```typescript
const schedule = '*/10 * * * *'; // Every 10 minutes
```

### Calendar Event Reminders
To change reminder times, edit `/server/services/pto-calendar.ts`:
```typescript
reminders: {
  useDefault: false,
  overrides: [
    { method: 'email', minutes: 48 * 60 }, // 48 hours before
    { method: 'popup', minutes: 120 },     // 2 hours before
  ],
}
```

## Testing Checklist

### Manual Testing
- [ ] Approve PTO → Check calendar events created
- [ ] Deny PTO → Check calendar events deleted
- [ ] Admin create PTO (auto-approve) → Check calendar events
- [ ] Wait 5 minutes → Check cron job sync logs
- [ ] Trigger manual sync → Check response
- [ ] Check database for event IDs
- [ ] Check Google Calendar for actual events (if real mode)

### Simulation Mode Testing
- [ ] Remove `GOOGLE_SERVICE_ACCOUNT`
- [ ] Restart server
- [ ] Approve PTO → Check [SIMULATION] logs
- [ ] Verify sim-* event IDs stored in database

### Error Testing
- [ ] Invalid credentials → Check error logging
- [ ] Network timeout → Check graceful degradation
- [ ] Calendar API quota exceeded → Check retry logic

## Performance

### Metrics
- **Calendar Event Creation:** ~200-500ms per event
- **Cron Job Execution:** ~1-2s for 10 PTO requests
- **Database Updates:** ~50ms per update

### Optimization
- Calendar operations run asynchronously
- Errors don't block PTO approval/denial
- Cron job prevents overlapping executions

## Security

### Permissions Required
- Google Calendar API read/write access
- Service account with domain-wide delegation (for employee calendars)
- HR calendar shared with service account (for HR calendar)

### Access Control
- Only SYSTEM_ADMIN, HR_ADMIN, GENERAL_MANAGER can manually sync
- Only managers can approve/deny PTO (triggers calendar events)
- Calendar event IDs stored securely in database

---

**Last Updated:** January 19, 2026
**Quick Reference Version:** 1.0
