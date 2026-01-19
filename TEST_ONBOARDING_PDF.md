# Testing Guide: Onboarding Notifications & PDF Generation

## Prerequisites

1. Server running: `npm run dev`
2. Database connection active
3. Environment variables set:
   ```env
   RESEND_API_KEY=your_key  # Optional for email simulation
   FROM_EMAIL=noreply@yourdomain.com
   APP_URL=http://localhost:5173
   ```

---

## Test 1: Onboarding Overdue Notification

### Step 1: Create Test Data

```sql
-- Create test employee (if not exists)
INSERT INTO users (email, first_name, last_name, role, is_active, password_hash)
VALUES (
  'test-employee@roofer.com',
  'Test',
  'Employee',
  'EMPLOYEE',
  true,
  '$2b$10$dummyhash'  -- placeholder password hash
)
ON CONFLICT (email) DO NOTHING;

-- Create overdue onboarding task
INSERT INTO onboarding_tasks (
  employee_id,
  task_name,
  description,
  status,
  due_date,
  category
)
VALUES (
  (SELECT id FROM users WHERE email = 'test-employee@roofer.com'),
  'Complete I-9 Form',
  'Required federal employment verification form',
  'pending',
  NOW() - INTERVAL '3 days',  -- 3 days overdue
  'paperwork'
);
```

### Step 2: Manually Trigger Cron Job

Create a test file: `scripts/test-onboarding-cron.ts`

```typescript
import { runOverdueTaskCheckNow } from '../server/cron/onboarding-overdue-job.js';

console.log('🧪 Testing onboarding overdue task notifications...\n');

try {
  await runOverdueTaskCheckNow();
  console.log('\n✅ Test completed successfully');
  process.exit(0);
} catch (error) {
  console.error('❌ Test failed:', error);
  process.exit(1);
}
```

Run:
```bash
tsx scripts/test-onboarding-cron.ts
```

### Step 3: Verify Results

**Expected Console Output:**
```
🔔 [CRON] Starting overdue onboarding task check...
📊 Found 1 overdue tasks
✅ In-app notification sent to test-employee@roofer.com
📧 Email sent to test-employee@roofer.com
✅ [CRON] Overdue task check complete: 1 notifications, 1 emails sent
```

**Check Database:**
```sql
-- Check in-app notification was created
SELECT * FROM notifications
WHERE type = 'task_overdue'
ORDER BY created_at DESC
LIMIT 1;

-- Check email was logged
SELECT * FROM email_notifications
WHERE email_type = 'onboarding_reminder'
ORDER BY created_at DESC
LIMIT 1;
```

**Check Email:**
- If `RESEND_API_KEY` is set: Check recipient's inbox
- If not set: Check console for simulated email output

### Step 4: Test Duplicate Prevention

Run the cron job again immediately:
```bash
tsx scripts/test-onboarding-cron.ts
```

**Expected Output:**
```
⏭️  Skipping task 123 - notification sent within 24 hours
✅ [CRON] Overdue task check complete: 0 notifications, 0 emails sent
```

---

## Test 2: Offer Letter PDF Generation

### Step 1: Create Test Candidate

```sql
INSERT INTO candidates (
  first_name,
  last_name,
  email,
  phone,
  position,
  status,
  source
)
VALUES (
  'Jane',
  'Smith',
  'jane.smith@example.com',
  '555-0123',
  'Software Engineer',
  'offer',
  'indeed'
)
RETURNING id;  -- Note this ID for testing
```

### Step 2: Test Preview Endpoint

**Using cURL:**
```bash
curl -X GET "http://localhost:5000/api/hr/candidates/1/offer-letter/preview" \
  -H "Cookie: session=YOUR_SESSION" \
  -H "Content-Type: application/json"
```

**Expected Response:**
```json
{
  "candidate": {
    "id": 1,
    "name": "Jane Smith",
    "position": "Software Engineer",
    "email": "jane.smith@example.com",
    "phone": "555-0123"
  },
  "template": {
    "department": "Operations",
    "startDate": "2026-02-02T00:00:00.000Z",
    "salaryType": "annual",
    "employmentType": "W2",
    "offerExpirationDays": 7
  },
  "parameters": { ... },
  "example": {
    "url": "/api/hr/candidates/1/offer-letter?salary=75000&department=Sales..."
  }
}
```

### Step 3: Generate Basic PDF

**Browser:**
Navigate to:
```
http://localhost:5000/api/hr/candidates/1/offer-letter?salary=85000
```

Should trigger automatic PDF download.

**cURL:**
```bash
curl -X GET "http://localhost:5000/api/hr/candidates/1/offer-letter?salary=85000" \
  -H "Cookie: session=YOUR_SESSION" \
  --output test-offer-letter.pdf
```

**Verify:**
- File downloaded: `test-offer-letter.pdf`
- File size: ~50-100 KB
- Opens correctly in PDF reader
- Contains candidate name and position
- Shows $85,000 annual salary
- Shows W2 employment type

### Step 4: Generate Contractor PDF

```bash
curl -X GET "http://localhost:5000/api/hr/candidates/1/offer-letter?salary=125&salaryType=hourly&employmentType=1099&department=Contracting&benefits=Flexible Schedule,Remote Work" \
  -H "Cookie: session=YOUR_SESSION" \
  --output test-contractor-offer.pdf
```

**Verify:**
- Shows $125.00 per hour
- Shows 1099 employment type
- Lists benefits
- Shows Contracting department

### Step 5: Generate Full Custom PDF

```bash
curl -X GET "http://localhost:5000/api/hr/candidates/1/offer-letter?salary=95000&employmentType=W2&department=Sales&startDate=2026-02-15&benefits=Health Insurance,Dental,Vision,401k Match,PTO&reportingTo=John Doe&workLocation=123 Main St, Boston, MA 02101&offerExpirationDays=10" \
  -H "Cookie: session=YOUR_SESSION" \
  --output test-full-offer.pdf
```

**Verify:**
- All custom fields appear correctly
- Start date is February 15, 2026
- All 5 benefits listed
- Reporting to John Doe
- Work location included
- Offer expires in 10 days

---

## Test 3: Error Handling

### Test Missing Required Parameter

```bash
curl -X GET "http://localhost:5000/api/hr/candidates/1/offer-letter" \
  -H "Cookie: session=YOUR_SESSION"
```

**Expected Response (400):**
```json
{
  "error": "Salary is required",
  "message": "Please provide salary as a query parameter (e.g., ?salary=75000)"
}
```

### Test Invalid Candidate ID

```bash
curl -X GET "http://localhost:5000/api/hr/candidates/99999/offer-letter?salary=75000" \
  -H "Cookie: session=YOUR_SESSION"
```

**Expected Response (404):**
```json
{
  "error": "Candidate not found"
}
```

### Test Invalid Salary Type

```bash
curl -X GET "http://localhost:5000/api/hr/candidates/1/offer-letter?salary=75000&salaryType=invalid" \
  -H "Cookie: session=YOUR_SESSION"
```

**Expected Response (400):**
```json
{
  "error": "Invalid salary type",
  "message": "Salary type must be one of: hourly, annual, per_project"
}
```

---

## Test 4: Onboarding Assignment Email

### Create Test Script

`scripts/test-onboarding-assignment.ts`:

```typescript
import { sendOnboardingAssignedEmail } from '../server/services/email.js';

console.log('🧪 Testing onboarding assignment email...\n');

try {
  const result = await sendOnboardingAssignedEmail(
    {
      firstName: 'Test',
      lastName: 'Employee',
      email: 'test-employee@roofer.com'
    },
    {
      name: 'New Employee Onboarding',
      description: 'Complete within 30 days of your start date'
    },
    {
      firstName: 'Jane',
      lastName: 'Manager'
    },
    15  // task count
  );

  if (result.success) {
    console.log('✅ Email sent successfully!');
    console.log('   Message ID:', result.messageId);
  } else {
    console.log('❌ Email failed:', result.error);
  }

  process.exit(0);
} catch (error) {
  console.error('❌ Test failed:', error);
  process.exit(1);
}
```

Run:
```bash
tsx scripts/test-onboarding-assignment.ts
```

---

## Automated Test Suite

### Create Comprehensive Test

`scripts/test-all-features.ts`:

```typescript
import { runOverdueTaskCheckNow } from '../server/cron/onboarding-overdue-job.js';
import { sendOnboardingAssignedEmail } from '../server/services/email.js';
import { generateOfferLetterPDF } from '../server/services/pdf-generator.js';
import fs from 'fs';

console.log('🧪 Running comprehensive feature tests...\n');

// Test 1: Overdue task notification
console.log('Test 1: Overdue task notification');
try {
  await runOverdueTaskCheckNow();
  console.log('✅ Passed\n');
} catch (error) {
  console.error('❌ Failed:', error, '\n');
}

// Test 2: Onboarding assignment email
console.log('Test 2: Onboarding assignment email');
try {
  const result = await sendOnboardingAssignedEmail(
    { firstName: 'Test', lastName: 'User', email: 'test@example.com' },
    { name: 'Test Onboarding', description: 'Test description' },
    { firstName: 'Manager', lastName: 'User' },
    5
  );
  console.log(result.success ? '✅ Passed' : '❌ Failed:', result.error);
  console.log();
} catch (error) {
  console.error('❌ Failed:', error, '\n');
}

// Test 3: PDF generation
console.log('Test 3: PDF generation');
try {
  const pdfBuffer = await generateOfferLetterPDF({
    candidateName: 'Test Candidate',
    position: 'Software Engineer',
    department: 'Engineering',
    startDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    salary: 85000,
    salaryType: 'annual',
    employmentType: 'W2',
    benefits: ['Health Insurance', '401k', 'PTO']
  });

  fs.writeFileSync('/tmp/test-offer-letter.pdf', pdfBuffer);
  console.log('✅ Passed - PDF saved to /tmp/test-offer-letter.pdf\n');
} catch (error) {
  console.error('❌ Failed:', error, '\n');
}

console.log('🎉 All tests completed!');
process.exit(0);
```

Run:
```bash
tsx scripts/test-all-features.ts
```

---

## Monitoring & Debugging

### Check Logs

**Server console:**
```bash
# Look for:
🔔 [CRON] Starting overdue onboarding task check...
✅ In-app notification sent to...
📧 Email sent to...
✅ Generated offer letter PDF for candidate...
```

### Database Queries

**Recent notifications:**
```sql
SELECT
  n.type,
  u.first_name,
  u.last_name,
  n.title,
  n.created_at,
  n.is_read
FROM notifications n
JOIN users u ON n.user_id = u.id
WHERE n.type IN ('task_overdue', 'onboarding_assigned')
ORDER BY n.created_at DESC
LIMIT 10;
```

**Recent emails:**
```sql
SELECT
  email_type,
  recipient_email,
  subject,
  status,
  sent_at,
  created_at
FROM email_notifications
WHERE email_type = 'onboarding_reminder'
ORDER BY created_at DESC
LIMIT 10;
```

**Overdue tasks summary:**
```sql
SELECT
  COUNT(*) as overdue_count,
  AVG(EXTRACT(DAY FROM NOW() - due_date::timestamp)) as avg_days_overdue
FROM onboarding_tasks
WHERE status = 'pending'
  AND due_date < NOW();
```

---

## Troubleshooting

### Cron Job Not Running

1. Check server started successfully
2. Look for initialization message: `⏰ Scheduled overdue onboarding task check`
3. Verify cron expression: `'0 9 * * *'` (9 AM daily)
4. Check timezone (cron uses server timezone)

### Emails Not Sending

1. Check `RESEND_API_KEY` is set
2. Look for simulation mode warning
3. Check email service logs
4. Verify recipient email addresses

### PDF Generation Fails

1. Check pdfkit is installed: `npm list pdfkit`
2. Verify all required parameters provided
3. Check PDF buffer size (should be >0)
4. Ensure candidate exists in database

### Duplicate Notifications

1. Check notification metadata for task ID
2. Verify 24-hour deduplication logic
3. Look for timestamps in notifications table

---

## Performance Benchmarks

Expected performance:

- **Cron job execution:** <2 seconds for 100 overdue tasks
- **PDF generation:** <1 second per document
- **Email sending:** <2 seconds per email (with Resend)
- **Database queries:** <100ms for overdue task check

---

## Production Checklist

Before deploying to production:

- [ ] Set `RESEND_API_KEY` environment variable
- [ ] Set `FROM_EMAIL` to verified domain
- [ ] Set `APP_URL` to production URL
- [ ] Test cron schedule matches business hours
- [ ] Verify email templates display correctly
- [ ] Test PDF generation with real candidate data
- [ ] Check database indexes on `onboarding_tasks.due_date`
- [ ] Monitor email delivery rates
- [ ] Set up alerting for failed notifications
- [ ] Document cron schedule for operations team

---

**All tests should pass before deploying to production.**
