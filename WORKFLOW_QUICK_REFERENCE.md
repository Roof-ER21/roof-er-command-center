# Workflow Execution Engine - Quick Reference

## 🚀 Quick Start

### 1. Apply Migration
```bash
npm run db:migrate
```

### 2. Start Server
```bash
npm run dev
```

The scheduler starts automatically - look for:
```
✅ Workflow Automation
[WorkflowScheduler] Starting workflow scheduler
```

### 3. Create Your First Workflow

**API Call:**
```bash
curl -X POST http://localhost:5000/api/hr/workflows \
  -H "Content-Type: application/json" \
  -d '{
    "name": "New Candidate Welcome",
    "trigger": "CANDIDATE_CREATED",
    "isActive": true,
    "steps": [
      {
        "stepType": "ACTION",
        "actionType": "ADD_NOTE",
        "title": "Add welcome note",
        "config": {
          "content": "Welcome! Your application has been received.",
          "type": "GENERAL"
        }
      }
    ]
  }'
```

### 4. Test It
```bash
curl -X POST http://localhost:5000/api/hr/candidates \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Test",
    "lastName": "User",
    "email": "test@example.com",
    "position": "Technician"
  }'
```

Check logs for:
```
[WorkflowExecutor] Starting workflow 1
[WorkflowExecutor] Workflow 1 completed successfully
```

## 📋 Workflow Structure

```json
{
  "name": "Workflow Name",
  "description": "What it does",
  "trigger": "CANDIDATE_CREATED | CANDIDATE_STAGE_CHANGE | INTERVIEW_COMPLETED | MANUAL",
  "triggerConditions": { "toStage": "interview" },
  "isActive": true,
  "steps": [...]
}
```

## 🔧 Step Types

### ACTION - Do Something
```json
{
  "stepType": "ACTION",
  "actionType": "SEND_EMAIL | UPDATE_STATUS | ASSIGN_TO | CREATE_TASK | ADD_NOTE",
  "title": "Step name",
  "config": { /* action-specific config */ }
}
```

### CONDITION - Branch Logic
```json
{
  "stepType": "CONDITION",
  "title": "Check condition",
  "config": {
    "expression": "candidate.rating > 8"
  }
}
```

### DELAY - Wait
```json
{
  "stepType": "DELAY",
  "title": "Wait 2 days",
  "config": {
    "duration": 2,
    "unit": "days | hours | minutes"
  }
}
```

### NOTIFICATION - Notify User
```json
{
  "stepType": "NOTIFICATION",
  "title": "Send notification",
  "config": {
    "title": "Alert",
    "message": "Action required"
  }
}
```

## 🎯 Action Configs

### SEND_EMAIL
```json
{
  "emailType": "status_change",
  "template": "optional_template_name"
}
```

### UPDATE_STATUS
```json
{
  "status": "new | screening | interview | offer | hired | rejected"
}
```

### ASSIGN_TO
```json
{
  "userId": 123
}
```

### CREATE_TASK
```json
{
  "title": "Task title",
  "description": "Task description",
  "assignedTo": 123,
  "dueDate": "2026-01-25"
}
```

### ADD_NOTE
```json
{
  "content": "Note text",
  "type": "GENERAL | INTERVIEW | REFERENCE | INTERNAL"
}
```

## 📡 API Endpoints

### Workflows
```bash
GET    /api/hr/workflows              # List all
GET    /api/hr/workflows/:id          # Get one with steps
POST   /api/hr/workflows              # Create
```

### Executions
```bash
GET    /api/hr/workflow-executions            # List recent (100)
GET    /api/hr/workflow-executions/:id        # Get details
GET    /api/hr/workflows/:id/executions       # By workflow (50)
GET    /api/hr/candidates/:id/workflow-executions  # By candidate
POST   /api/hr/workflows/:id/execute          # Manual trigger
```

### Manual Execution
```bash
curl -X POST http://localhost:5000/api/hr/workflows/1/execute \
  -H "Content-Type: application/json" \
  -d '{
    "candidateId": 123,
    "context": {}
  }'
```

## 🔍 Monitoring

### View Executions
```bash
# Recent executions
curl http://localhost:5000/api/hr/workflow-executions

# Specific execution with steps
curl http://localhost:5000/api/hr/workflow-executions/1
```

### Database Queries
```sql
-- Recent executions
SELECT * FROM workflow_executions
ORDER BY started_at DESC LIMIT 10;

-- Failed executions
SELECT * FROM workflow_executions
WHERE status = 'FAILED';

-- Step details
SELECT * FROM workflow_step_executions
WHERE execution_id = 1
ORDER BY created_at;

-- Pending delayed steps
SELECT * FROM workflow_step_executions
WHERE status = 'PENDING'
AND scheduled_for IS NOT NULL;
```

### Server Logs
```
[WorkflowExecutor] Starting workflow 1
[WorkflowExecutor] Found 3 steps to execute
[WorkflowExecutor] Executing step 1: Send email (ACTION)
[WorkflowExecutor] Step 1 completed: { success: true }
[WorkflowExecutor] Workflow 1 completed successfully
```

## 🎬 Common Workflows

### 1. Welcome New Candidates
```json
{
  "name": "Welcome Workflow",
  "trigger": "CANDIDATE_CREATED",
  "steps": [
    {
      "stepType": "ACTION",
      "actionType": "ADD_NOTE",
      "config": { "content": "Welcome!", "type": "GENERAL" }
    },
    {
      "stepType": "ACTION",
      "actionType": "CREATE_TASK",
      "config": { "title": "Review application", "assignedTo": 1 }
    }
  ]
}
```

### 2. Interview Stage Automation
```json
{
  "name": "Interview Workflow",
  "trigger": "CANDIDATE_STAGE_CHANGE",
  "triggerConditions": { "toStage": "interview" },
  "steps": [
    {
      "stepType": "ACTION",
      "actionType": "SEND_EMAIL",
      "config": { "emailType": "status_change" }
    },
    {
      "stepType": "ACTION",
      "actionType": "CREATE_TASK",
      "config": { "title": "Schedule interview" }
    }
  ]
}
```

### 3. Follow-up After Delay
```json
{
  "name": "Follow-up Workflow",
  "trigger": "INTERVIEW_COMPLETED",
  "steps": [
    {
      "stepType": "ACTION",
      "actionType": "ADD_NOTE",
      "config": { "content": "Interview completed", "type": "INTERVIEW" }
    },
    {
      "stepType": "DELAY",
      "config": { "duration": 2, "unit": "days" }
    },
    {
      "stepType": "ACTION",
      "actionType": "CREATE_TASK",
      "config": { "title": "Make hiring decision" }
    }
  ]
}
```

### 4. Conditional Fast-Track
```json
{
  "name": "High Score Fast Track",
  "trigger": "CANDIDATE_CREATED",
  "steps": [
    {
      "stepType": "CONDITION",
      "config": { "expression": "candidate.rating > 8" }
    },
    {
      "stepType": "ACTION",
      "actionType": "UPDATE_STATUS",
      "config": { "status": "interview" }
    },
    {
      "stepType": "ACTION",
      "actionType": "CREATE_TASK",
      "config": { "title": "Priority: Schedule interview ASAP" }
    }
  ]
}
```

## 🐛 Troubleshooting

### Workflow Not Triggering
1. Check `isActive: true`
2. Verify trigger type matches event
3. Check trigger conditions
4. Review server logs

### Steps Not Executing
1. Validate step config JSON
2. Check required fields
3. Review execution errors
4. Check server logs

### Delayed Steps Not Running
1. Verify scheduler running (logs)
2. Check `scheduled_for` timestamp
3. Ensure status is `PENDING`
4. Query database for delayed steps

## 📁 Key Files

### Implementation
- `/server/services/workflow-executor.ts` - Core engine
- `/server/cron/workflow-scheduler.ts` - Scheduler
- `/server/routes/hr/index.ts` - API routes
- `/shared/schema.ts` - Database schema

### Documentation
- `WORKFLOW_EXECUTION_ENGINE.md` - Complete docs
- `test-workflow-execution.md` - Testing guide
- `WORKFLOW_IMPLEMENTATION_SUMMARY.md` - Implementation details
- `WORKFLOW_QUICK_REFERENCE.md` - This file

### Database
- `/migrations/0004_add_workflow_execution.sql` - Migration

## ✅ Production Checklist

- [ ] Migration applied
- [ ] Server restarted
- [ ] Scheduler confirmed running
- [ ] Test workflow created
- [ ] Test trigger verified
- [ ] Delayed step tested
- [ ] API endpoints tested
- [ ] Error handling verified
- [ ] Logs reviewed
- [ ] Documentation read

## 🆘 Quick Commands

```bash
# Apply migration
npm run db:migrate

# Start server
npm run dev

# Create test workflow
curl -X POST http://localhost:5000/api/hr/workflows \
  -H "Content-Type: application/json" \
  -d @workflow.json

# List executions
curl http://localhost:5000/api/hr/workflow-executions

# Manual trigger
curl -X POST http://localhost:5000/api/hr/workflows/1/execute \
  -H "Content-Type: application/json" \
  -d '{"candidateId": 1}'
```

---

**Status:** ✅ Production Ready
**Version:** 1.0.0
**Date:** January 19, 2026
