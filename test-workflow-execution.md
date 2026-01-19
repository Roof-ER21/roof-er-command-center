# Workflow Execution Engine - Testing Guide

## Quick Start Testing

### 1. Apply Database Migration

```bash
cd /Users/a21/roof-er-command-center

# Apply the migration
npm run db:migrate

# Or manually apply the SQL
psql $DATABASE_URL -f migrations/0004_add_workflow_execution.sql
```

### 2. Start the Server

```bash
npm run dev
```

The server will automatically start the workflow scheduler. You should see:
```
✅ Workflow Automation
[WorkflowScheduler] Starting workflow scheduler (runs every minute)
```

### 3. Test Workflow Creation

Create a simple test workflow:

```bash
curl -X POST http://localhost:5000/api/hr/workflows \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Welcome Workflow",
    "description": "Simple test workflow for new candidates",
    "trigger": "CANDIDATE_CREATED",
    "isActive": true
  }'
```

### 4. Create a Workflow with Steps

Create a complete workflow with automation steps:

```bash
curl -X POST http://localhost:5000/api/hr/workflows \
  -H "Content-Type: application/json" \
  -d '{
    "name": "New Candidate Onboarding",
    "description": "Automated workflow for new candidates",
    "trigger": "CANDIDATE_CREATED",
    "isActive": true,
    "steps": [
      {
        "stepOrder": 1,
        "stepType": "ACTION",
        "actionType": "ADD_NOTE",
        "title": "Add welcome note",
        "description": "Add a welcome note to the candidate",
        "config": {
          "content": "Welcome! Your application has been received.",
          "type": "GENERAL"
        }
      },
      {
        "stepOrder": 2,
        "stepType": "ACTION",
        "actionType": "CREATE_TASK",
        "title": "Create screening task",
        "description": "Create a task for HR to screen the candidate",
        "config": {
          "title": "Screen new candidate application",
          "description": "Review resume and qualifications",
          "assignedTo": 1
        }
      }
    ]
  }'
```

### 5. Test Workflow Trigger - Create Candidate

Create a new candidate to trigger the workflow:

```bash
curl -X POST http://localhost:5000/api/hr/candidates \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "phone": "555-0123",
    "position": "Roofing Technician",
    "source": "Website"
  }'
```

**Expected Result:**
- Candidate is created
- Workflow with `CANDIDATE_CREATED` trigger executes automatically
- Check server logs for execution details

### 6. Test Stage Change Workflow

Create a workflow for stage changes:

```bash
curl -X POST http://localhost:5000/api/hr/workflows \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Interview Stage Workflow",
    "description": "Triggered when candidate moves to interview",
    "trigger": "CANDIDATE_STAGE_CHANGE",
    "triggerConditions": {
      "toStage": "interview"
    },
    "isActive": true,
    "steps": [
      {
        "stepOrder": 1,
        "stepType": "ACTION",
        "actionType": "ADD_NOTE",
        "title": "Add interview note",
        "config": {
          "content": "Candidate moved to interview stage. Schedule ASAP.",
          "type": "INTERVIEW"
        }
      },
      {
        "stepOrder": 2,
        "stepType": "ACTION",
        "actionType": "SEND_EMAIL",
        "title": "Send interview confirmation",
        "config": {
          "emailType": "status_change"
        }
      }
    ]
  }'
```

Update candidate status to trigger workflow:

```bash
curl -X PATCH http://localhost:5000/api/hr/candidates/1 \
  -H "Content-Type: application/json" \
  -d '{
    "status": "interview"
  }'
```

### 7. Test Delayed Steps

Create a workflow with a delay:

```bash
curl -X POST http://localhost:5000/api/hr/workflows \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Follow-up Workflow",
    "description": "Follow up with candidate after 2 minutes",
    "trigger": "CANDIDATE_CREATED",
    "isActive": true,
    "steps": [
      {
        "stepOrder": 1,
        "stepType": "ACTION",
        "actionType": "ADD_NOTE",
        "title": "Initial note",
        "config": {
          "content": "Candidate application received",
          "type": "GENERAL"
        }
      },
      {
        "stepOrder": 2,
        "stepType": "DELAY",
        "title": "Wait 2 minutes",
        "config": {
          "duration": 2,
          "unit": "minutes"
        }
      },
      {
        "stepOrder": 3,
        "stepType": "ACTION",
        "actionType": "ADD_NOTE",
        "title": "Follow-up note",
        "config": {
          "content": "Follow-up: Review candidate application",
          "type": "GENERAL"
        }
      }
    ]
  }'
```

**Testing:**
1. Create a candidate to trigger the workflow
2. First step executes immediately
3. Second step schedules third step for 2 minutes later
4. Wait 2 minutes - scheduler will pick up and execute third step
5. Check candidate notes after 2 minutes

### 8. Test Manual Execution

Manually trigger a workflow:

```bash
curl -X POST http://localhost:5000/api/hr/workflows/1/execute \
  -H "Content-Type: application/json" \
  -d '{
    "candidateId": 1,
    "context": {
      "note": "Manual test execution"
    }
  }'
```

## Verification

### 1. Check Workflow Executions

```bash
# Get all executions
curl http://localhost:5000/api/hr/workflow-executions

# Get specific execution with steps
curl http://localhost:5000/api/hr/workflow-executions/1

# Get executions for a workflow
curl http://localhost:5000/api/hr/workflows/1/executions

# Get executions for a candidate
curl http://localhost:5000/api/hr/candidates/1/workflow-executions
```

### 2. Check Server Logs

Look for these log entries:

```
[WorkflowExecutor] Starting workflow 1 with context: {...}
[WorkflowExecutor] Found 2 steps to execute
[WorkflowExecutor] Executing step 1: Add welcome note (ACTION)
[WorkflowExecutor] Step 1 completed: { success: true }
[WorkflowExecutor] Executing step 2: Create screening task (ACTION)
[WorkflowExecutor] Step 2 completed: { success: true }
[WorkflowExecutor] Workflow 1 completed successfully
```

### 3. Check Database

```sql
-- Check workflows
SELECT * FROM workflows;

-- Check workflow steps
SELECT * FROM workflow_steps WHERE workflow_id = 1;

-- Check executions
SELECT * FROM workflow_executions ORDER BY started_at DESC;

-- Check step executions
SELECT * FROM workflow_step_executions
WHERE execution_id = 1
ORDER BY created_at;

-- Check delayed steps waiting to execute
SELECT * FROM workflow_step_executions
WHERE status = 'PENDING'
AND scheduled_for IS NOT NULL;
```

## Expected Behavior

### Successful Execution
1. Workflow execution record created with status `RUNNING`
2. Each step executes sequentially
3. Step execution records created for each step
4. Workflow execution marked as `COMPLETED`
5. All step executions marked as `COMPLETED`

### Failed Execution
1. Workflow execution record created with status `RUNNING`
2. Steps execute until one fails
3. Failed step execution has error message
4. Workflow execution marked as `FAILED` with error
5. Remaining steps are not executed

### Delayed Execution
1. DELAY step completes immediately
2. Next step execution created with `scheduled_for` timestamp
3. Status remains `PENDING` until scheduled time
4. Scheduler picks up step when time arrives
5. Step executes and workflow continues

## Troubleshooting

### Workflow Not Triggering

**Check:**
1. Is workflow `isActive: true`?
2. Does trigger match the event?
3. Do trigger conditions match?
4. Are there any errors in server logs?

**Debug:**
```bash
# Check workflow configuration
curl http://localhost:5000/api/hr/workflows/1

# Check if workflow exists and is active
SELECT * FROM workflows WHERE id = 1;
```

### Steps Not Executing

**Check:**
1. Are steps properly configured?
2. Is step configuration JSON valid?
3. Are there any missing required fields?
4. Check step execution error messages

**Debug:**
```sql
-- Check step configuration
SELECT * FROM workflow_steps WHERE workflow_id = 1;

-- Check execution errors
SELECT * FROM workflow_executions WHERE status = 'FAILED';
SELECT * FROM workflow_step_executions WHERE status = 'FAILED';
```

### Delayed Steps Not Running

**Check:**
1. Is the scheduler running? (check server logs)
2. Is `scheduled_for` timestamp in the past?
3. Is step status `PENDING`?

**Debug:**
```sql
-- Check pending delayed steps
SELECT * FROM workflow_step_executions
WHERE status = 'PENDING'
AND scheduled_for <= NOW();
```

### Email Not Sending

**Check:**
1. Are email environment variables configured?
2. Is email service initialized?
3. Check email service logs

## Performance Testing

### Load Test - Multiple Candidates

```bash
# Create 10 candidates to trigger workflows
for i in {1..10}; do
  curl -X POST http://localhost:5000/api/hr/candidates \
    -H "Content-Type: application/json" \
    -d "{
      \"firstName\": \"Test$i\",
      \"lastName\": \"User\",
      \"email\": \"test$i@example.com\",
      \"position\": \"Test Position\",
      \"source\": \"API Test\"
    }"
  sleep 0.5
done
```

**Expected:**
- All workflows trigger successfully
- No performance degradation
- All executions complete without errors

### Scheduler Performance

Check scheduler execution time:
```
[WorkflowScheduler] Starting scheduled workflow processing...
[WorkflowExecutor] Found 5 delayed steps to process
[WorkflowScheduler] Scheduled workflow processing completed
```

Should complete in < 1 second for typical loads.

## Integration Testing

### Test Complete Flow

1. **Setup:** Create workflow with all step types
2. **Trigger:** Create candidate
3. **Verify:** Check each step executed
4. **Delay:** Wait for delayed steps
5. **Complete:** Verify workflow completed

### Test Error Recovery

1. **Setup:** Create workflow with invalid configuration
2. **Trigger:** Manually execute
3. **Verify:** Execution marked as FAILED
4. **Fix:** Update workflow configuration
5. **Retry:** Execute again successfully

## Production Checklist

Before deploying to production:

- [ ] Database migration applied successfully
- [ ] Workflow scheduler starts on server startup
- [ ] Email service configured and tested
- [ ] Error logging works correctly
- [ ] All workflows tested manually
- [ ] Performance acceptable under load
- [ ] Delayed steps execute as expected
- [ ] Failed executions handled gracefully
- [ ] API endpoints secured and authorized
- [ ] Documentation reviewed and accurate

## Success Criteria

✅ Workflows trigger on correct events
✅ Steps execute in correct order
✅ Delayed steps execute at scheduled time
✅ Errors handled gracefully
✅ Execution history tracked
✅ API endpoints work correctly
✅ Performance is acceptable
✅ Logs provide useful debugging information

---

**Test Date:** January 19, 2026
**Version:** 1.0.0
**Status:** Ready for Testing
