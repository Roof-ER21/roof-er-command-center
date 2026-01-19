# Onboarding & PDF Quick Reference

## Onboarding Notifications

### Daily Automated Check
- **Schedule:** Daily at 9:00 AM
- **Function:** Checks all pending onboarding tasks past their due date
- **Actions:**
  - Creates in-app notification
  - Sends email to employee
  - Prevents duplicate notifications (24-hour window)

### Manual Trigger (Testing)
```typescript
import { runOverdueTaskCheckNow } from './server/cron/onboarding-overdue-job.js';
await runOverdueTaskCheckNow();
```

### Send Onboarding Assignment Email
```typescript
import { sendOnboardingAssignedEmail } from './server/services/email.js';

await sendOnboardingAssignedEmail(
  { firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
  { name: 'New Employee Onboarding', description: 'Complete within 30 days' },
  { firstName: 'Jane', lastName: 'Smith' }, // manager
  15 // task count
);
```

---

## Offer Letter PDF Generation

### API Endpoint
```
GET /api/hr/candidates/:id/offer-letter
```

### Required Parameters
- `salary` - Compensation amount (number)

### Optional Parameters
- `salaryType` - 'hourly' | 'annual' | 'per_project' (default: 'annual')
- `employmentType` - 'W2' | '1099' | 'CONTRACTOR' | 'SUB_CONTRACTOR' (default: 'W2')
- `department` - Department name (default: 'Operations')
- `startDate` - ISO date string (default: 2 weeks from now)
- `benefits` - Comma-separated list
- `reportingTo` - Supervisor name
- `workLocation` - Work address
- `offerExpirationDays` - Days until offer expires (default: 7)

### Examples

**Basic:**
```
GET /api/hr/candidates/42/offer-letter?salary=85000
```

**Contractor:**
```
GET /api/hr/candidates/42/offer-letter?salary=125&salaryType=hourly&employmentType=1099
```

**Full Custom:**
```
GET /api/hr/candidates/42/offer-letter?salary=95000&employmentType=W2&department=Sales&startDate=2026-02-15&benefits=Health Insurance,401k,PTO&reportingTo=Jane Smith&workLocation=123 Main St&offerExpirationDays=10
```

**Preview (no PDF):**
```
GET /api/hr/candidates/42/offer-letter/preview
```

### cURL Example
```bash
curl -X GET "http://localhost:5000/api/hr/candidates/1/offer-letter?salary=75000" \
  --cookie "session=YOUR_SESSION_COOKIE" \
  --output offer-letter.pdf
```

---

## File Locations

### New Files
- `/server/cron/onboarding-overdue-job.ts` - Cron job
- `/server/services/onboarding-email-templates.ts` - Email templates
- `/server/services/pdf-generator.ts` - PDF generator
- `/server/routes/hr/offer-letters.ts` - Offer letter routes

### Modified Files
- `/server/services/email.ts` - Added email functions
- `/server/routes/hr/index.ts` - Added routes
- `/server/index.ts` - Initialize scheduler
- `/shared/notifications-schema.ts` - Added notification types

---

## Environment Variables

```env
RESEND_API_KEY=your_resend_api_key
FROM_EMAIL=noreply@yourdomain.com
APP_URL=https://yourdomain.com
```

---

## Testing Queries

**Check overdue tasks:**
```sql
SELECT u.first_name, u.last_name, ot.task_name, ot.due_date,
       EXTRACT(DAY FROM NOW() - ot.due_date::timestamp) as days_overdue
FROM onboarding_tasks ot
JOIN users u ON ot.employee_id = u.id
WHERE ot.status = 'pending' AND ot.due_date < NOW()
ORDER BY days_overdue DESC;
```

**Check email history:**
```sql
SELECT COUNT(*) as total_sent, DATE(sent_at) as date
FROM email_notifications
WHERE email_type = 'onboarding_reminder'
GROUP BY DATE(sent_at)
ORDER BY date DESC;
```

---

## Key Features

✅ Automated daily overdue task notifications
✅ Email + in-app notifications
✅ Duplicate prevention (24-hour window)
✅ Professional offer letter PDF generation
✅ Flexible API with query parameters
✅ Preview endpoint for UI integration
✅ Comprehensive error handling
✅ Production-ready and secure

---

For full documentation, see: `ONBOARDING_AND_PDF_IMPLEMENTATION.md`
