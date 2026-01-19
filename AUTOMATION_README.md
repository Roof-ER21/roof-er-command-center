# Roof HR Automation - Quick Start

## 🎯 What Is This?

Complete automation for hiring candidates and handling rejections in Roof HR.

## ⚡ Quick Integration (15 minutes)

### Step 1: Read the Guide
```bash
cat INTEGRATION_GUIDE.md
```

### Step 2: Apply 4 Changes
Open `/server/routes/hr/index.ts` and make these changes:

1. **Add imports** (after line 66)
2. **Mount router** (after line 540)
3. **Update status logic** (lines 909-936)
4. **Add auto-archive** (before export)

All code is ready to copy-paste from INTEGRATION_GUIDE.md

### Step 3: Test It
```bash
./test-automation.sh
```

## 📚 Documentation

| File | What It Contains |
|------|------------------|
| **INTEGRATION_GUIDE.md** | Step-by-step integration instructions with code snippets |
| **AUTOMATION_SUMMARY.md** | Complete technical documentation (68+ pages) |
| **test-automation.sh** | Automated test script (executable) |
| **automation-additions.md** | Quick reference for manual changes |

## ✅ What Gets Automated

### HIRE (POST /candidates/:id/hire)
When you hire a candidate, the system automatically:
1. ✅ Creates user account (email, temp password TRD2026!)
2. ✅ Creates PTO policy (17 days for W2 non-Sales, 0 for 1099/Sales)
3. ✅ Assigns welcome package (optional)
4. ✅ Creates equipment receipt with signing token
5. ✅ Creates 6 onboarding tasks
6. ✅ Sends welcome email

### DEAD/NO_SHOW (PATCH /candidates/:id with status)
When candidate status changes to DEAD or NO_SHOW:
- ✅ Sends rejection email (8 different templates based on reason)
- ✅ For NO_SHOW: Adds tag, creates note, sends reschedule email
- ✅ All logged for audit trail

### Interview Overdue (Daily 10:00 AM)
Automatic escalation for overdue interviews:
- ✅ 1+ day: Reminder to interviewer
- ✅ 3+ days: Escalation to HR admins
- ✅ 7+ days: Auto NO_SHOW + move to DEAD

### Auto-Archive (On-demand or scheduled)
- ✅ Archives candidates in terminal states older than 30 days
- ✅ Keeps your candidate list clean

## 🧪 Quick Test

```bash
# 1. Make script executable
chmod +x test-automation.sh

# 2. Update AUTH_TOKEN in script
vim test-automation.sh

# 3. Run tests
./test-automation.sh

# 4. Check logs and database
```

## 📁 New Files Created

```
/server/services/
  ├── hire-automation.ts              # HIRE automation service
  └── candidate-status-automation.ts  # DEAD/NO_SHOW automation

/server/cron/
  └── interview-overdue-job.ts        # Overdue interview checker

/server/routes/hr/
  └── hire-endpoint.ts                # POST /candidates/:id/hire

/
  ├── INTEGRATION_GUIDE.md            # ⭐ START HERE
  ├── AUTOMATION_SUMMARY.md           # Full documentation
  ├── AUTOMATION_README.md            # This file
  ├── test-automation.sh              # Test script
  └── automation-additions.md         # Quick reference
```

## 🎓 Usage Examples

### Hire a Candidate
```bash
curl -X POST http://localhost:5000/api/hr/candidates/123/hire \
  -H "Content-Type: application/json" \
  -d '{
    "role": "SALES_REP",
    "startDate": "2026-02-01",
    "employmentType": "W2"
  }'
```

### Mark as NO_SHOW
```bash
curl -X PATCH http://localhost:5000/api/hr/candidates/456 \
  -H "Content-Type: application/json" \
  -d '{"status": "NO_SHOW", "interviewId": 789}'
```

### Auto-Archive Old Candidates
```bash
curl -X POST http://localhost:5000/api/hr/candidates/auto-archive
```

## 🚨 Important Notes

- **Email Simulation**: If RESEND_API_KEY not set, emails are simulated (logged to console)
- **Bundle/Tools**: Welcome package assignment is placeholder until schema added
- **Google Calendar**: Event deletion is placeholder until API integrated
- **Cron Job**: Interview overdue check requires cron setup (see INTEGRATION_GUIDE.md)

## 📊 Expected Results

After hire automation:
- ✅ 1 new user in `users` table
- ✅ 1 new policy in `ptoPolicies` table
- ✅ 6 new tasks in `onboardingTasks` table
- ✅ 1 new token in `equipmentSignatureTokens` table
- ✅ 1+ emails in `emailNotifications` table

After DEAD/NO_SHOW:
- ✅ Candidate status updated
- ✅ Email notification logged
- ✅ For NO_SHOW: Tag added, note created

## 💡 Pro Tips

1. **Read INTEGRATION_GUIDE.md first** - It has everything you need
2. **Test in development** - Use test-automation.sh
3. **Check console logs** - All automation is logged
4. **Monitor database** - Verify records are created correctly
5. **Email simulation is OK** - Test without email service

## 🎉 That's It!

You now have:
- ✅ Automated hiring workflow (6 steps)
- ✅ Automated rejection handling (8 templates)
- ✅ Automated interview follow-up (3-tier escalation)
- ✅ Automated candidate archiving
- ✅ Complete audit trail

**Total manual integration time**: ~15 minutes
**Lines of code to add manually**: ~100
**Automation value**: Priceless 😎

---

**Questions?** Check INTEGRATION_GUIDE.md or AUTOMATION_SUMMARY.md

**Ready to integrate?** Open INTEGRATION_GUIDE.md and follow the steps!

**Want to test first?** Run ./test-automation.sh

**Need details?** Read AUTOMATION_SUMMARY.md (complete technical docs)
