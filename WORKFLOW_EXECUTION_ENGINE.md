# Workflow Execution Engine

## Overview

The Workflow Execution Engine is a production-ready automation system that executes workflows triggered by HR events such as candidate creation, status changes, and interview completion.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   WORKFLOW ARCHITECTURE                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Event Triggers (HR Routes)                                 │
│     ↓                                                        │
│  WorkflowExecutor.onCandidateCreated()                      │
│  WorkflowExecutor.onCandidateStageChange()                  │
│  WorkflowExecutor.onInterviewCompleted()                    │
│     ↓                                                        │
│  Execute Workflow                                            │
│     ↓                                                        │
│  Execute Steps Sequentially                                 │
│     - ACTION: Send email, update status, create task        │
│     - CONDITION: Evaluate and branch                        │
│     - DELAY: Schedule for future execution                  │
│     - NOTIFICATION: Send in-app notification                │
│     ↓                                                        │
│  WorkflowScheduler (runs every minute)                      │
│     - Process delayed steps that are now due                │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Database Schema

### workflows
Enhanced with trigger support:
- `trigger`: MANUAL | CANDIDATE_CREATED | CANDIDATE_STAGE_CHANGE | INTERVIEW_COMPLETED | SCHEDULED
- `trigger_conditions`: JSON conditions (e.g., `{ "fromStage": "screening", "toStage": "interview" }`)

### workflow_steps
Enhanced with step types and configuration:
- `step_type`: ACTION | CONDITION | DELAY | NOTIFICATION
- `action_type`: SEND_EMAIL | UPDATE_STATUS | ASSIGN_TO | CREATE_TASK | ADD_NOTE
- `config`: JSON configuration for step execution

### workflow_executions (NEW)
Tracks workflow execution instances:
- `workflow_id`: Which workflow is executing
- `candidate_id`: Which candidate triggered it
- `status`: RUNNING | COMPLETED | FAILED | PAUSED
- `current_step_id`: Current step being executed
- `context`: Execution context data (JSON)
- `error`: Error message if failed
- `started_at`, `completed_at`: Timestamps

### workflow_step_executions (NEW)
Tracks individual step execution:
- `execution_id`: Parent workflow execution
- `step_id`: Which step is executing
- `status`: PENDING | RUNNING | COMPLETED | FAILED | SKIPPED
- `result`: Step execution result (JSON)
- `error`: Error message if failed
- `scheduled_for`: For DELAY steps - when to execute
- `started_at`, `completed_at`: Timestamps

## Core Components

### 1. WorkflowExecutor (`/server/services/workflow-executor.ts`)

Main execution engine with these methods:

#### `executeWorkflow(workflowId, context)`
Executes a complete workflow with all its steps.

**Parameters:**
- `workflowId`: ID of workflow to execute
- `context`: Workflow context object containing:
  - `candidateId`: Candidate ID
  - `candidate`: Candidate data object
  - `userId`: User who triggered
  - `oldStage`, `newStage`: For stage changes
  - `interviewId`: For interview events
  - `triggeredBy`: User ID who triggered

**Returns:** `WorkflowExecution` object

#### `onCandidateCreated(candidateId, triggeredBy?)`
Triggers all workflows with `CANDIDATE_CREATED` trigger.

#### `onCandidateStageChange(candidateId, oldStage, newStage, triggeredBy?)`
Triggers workflows with `CANDIDATE_STAGE_CHANGE` trigger that match conditions.

#### `onInterviewCompleted(interviewId, candidateId, triggeredBy?)`
Triggers workflows with `INTERVIEW_COMPLETED` trigger.

#### `processDelayedSteps()`
Processes all delayed steps that are now due. Called by scheduler every minute.

### 2. WorkflowScheduler (`/server/cron/workflow-scheduler.ts`)

Runs every minute to process delayed steps.

**Functions:**
- `startWorkflowScheduler()`: Starts the scheduler on server startup
- `processWorkflowScheduler()`: Processes delayed steps
- `stopWorkflowScheduler(interval)`: Stops the scheduler

### 3. Step Type Handlers

#### ACTION Steps
Performs an action on the candidate or system.

**Action Types:**

1. **SEND_EMAIL**
   ```json
   {
     "emailType": "status_change" | "offer",
     "template": "template_name",
     "to": "email@example.com",
     "subject": "Email subject",
     "body": "Email body"
   }
   ```

2. **UPDATE_STATUS**
   ```json
   {
     "status": "new" | "screening" | "interview" | "offer" | "hired" | "rejected"
   }
   ```

3. **ASSIGN_TO**
   ```json
   {
     "userId": 123
   }
   ```

4. **CREATE_TASK**
   ```json
   {
     "title": "Task title",
     "description": "Task description",
     "assignedTo": 123,
     "dueDate": "2026-01-25"
   }
   ```

5. **ADD_NOTE**
   ```json
   {
     "content": "Note content",
     "type": "GENERAL" | "INTERVIEW" | "REFERENCE" | "INTERNAL"
   }
   ```

#### CONDITION Steps
Evaluates an expression and determines if workflow should continue.

**Configuration:**
```json
{
  "expression": "candidate.score > 70",
  "onTrue": "continue",
  "onFalse": "skip"
}
```

**Supported expressions:**
- `candidate.score > 70`
- `candidate.status === 'interview'`
- `context.oldStage === 'screening'`

#### DELAY Steps
Schedules the next step for future execution.

**Configuration:**
```json
{
  "duration": 2,
  "unit": "days" | "hours" | "minutes"
}
```

#### NOTIFICATION Steps
Sends an in-app notification.

**Configuration:**
```json
{
  "title": "Notification title",
  "message": "Notification message",
  "userId": 123
}
```

## API Endpoints

### Workflow Management

#### GET `/api/hr/workflows`
List all workflows.

#### GET `/api/hr/workflows/:id`
Get workflow by ID with steps.

#### POST `/api/hr/workflows`
Create a new workflow.

**Body:**
```json
{
  "name": "New Candidate Onboarding",
  "description": "Automated onboarding for new candidates",
  "trigger": "CANDIDATE_CREATED",
  "triggerConditions": {},
  "isActive": true,
  "steps": [
    {
      "stepOrder": 1,
      "stepType": "ACTION",
      "actionType": "SEND_EMAIL",
      "title": "Send welcome email",
      "config": {
        "emailType": "status_change"
      }
    }
  ]
}
```

### Workflow Execution

#### GET `/api/hr/workflow-executions`
List recent workflow executions (limit 100).

#### GET `/api/hr/workflow-executions/:id`
Get execution by ID with step executions.

#### GET `/api/hr/workflows/:id/executions`
Get executions for a specific workflow (limit 50).

#### GET `/api/hr/candidates/:id/workflow-executions`
Get all workflow executions for a candidate.

#### POST `/api/hr/workflows/:id/execute`
Manually trigger a workflow execution.

**Body:**
```json
{
  "candidateId": 123,
  "context": {
    "customField": "value"
  }
}
```

## Event Integration

Workflows are automatically triggered by these HR events:

### 1. Candidate Created
**Route:** `POST /api/hr/candidates`

Triggers workflows with:
- `trigger: 'CANDIDATE_CREATED'`

### 2. Candidate Stage Changed
**Route:** `PATCH /api/hr/candidates/:id`

Triggers workflows with:
- `trigger: 'CANDIDATE_STAGE_CHANGE'`
- Optional conditions: `{ "fromStage": "screening", "toStage": "interview" }`

### 3. Interview Completed
**Route:** `PATCH /api/hr/interviews/:id`

Triggers workflows with:
- `trigger: 'INTERVIEW_COMPLETED'`
- Only when status changes to `'completed'`

## Example Workflows

### Example 1: New Candidate Welcome
```json
{
  "name": "New Candidate Welcome",
  "trigger": "CANDIDATE_CREATED",
  "steps": [
    {
      "stepType": "ACTION",
      "actionType": "SEND_EMAIL",
      "title": "Send welcome email",
      "config": {
        "emailType": "status_change"
      }
    },
    {
      "stepType": "ACTION",
      "actionType": "CREATE_TASK",
      "title": "Create screening task",
      "config": {
        "title": "Screen candidate resume",
        "assignedTo": 1
      }
    }
  ]
}
```

### Example 2: Interview to Offer
```json
{
  "name": "Interview to Offer",
  "trigger": "CANDIDATE_STAGE_CHANGE",
  "triggerConditions": {
    "fromStage": "interview",
    "toStage": "offer"
  },
  "steps": [
    {
      "stepType": "ACTION",
      "actionType": "SEND_EMAIL",
      "title": "Send offer letter",
      "config": {
        "emailType": "offer"
      }
    },
    {
      "stepType": "DELAY",
      "title": "Wait 3 days",
      "config": {
        "duration": 3,
        "unit": "days"
      }
    },
    {
      "stepType": "CONDITION",
      "title": "Check if accepted",
      "config": {
        "expression": "candidate.status === 'hired'"
      }
    },
    {
      "stepType": "ACTION",
      "actionType": "CREATE_TASK",
      "title": "Start onboarding",
      "config": {
        "title": "Begin onboarding process",
        "assignedTo": 1
      }
    }
  ]
}
```

### Example 3: Interview Completed Follow-up
```json
{
  "name": "Interview Follow-up",
  "trigger": "INTERVIEW_COMPLETED",
  "steps": [
    {
      "stepType": "ACTION",
      "actionType": "ADD_NOTE",
      "title": "Add follow-up note",
      "config": {
        "content": "Interview completed - awaiting feedback",
        "type": "INTERVIEW"
      }
    },
    {
      "stepType": "DELAY",
      "title": "Wait 1 day",
      "config": {
        "duration": 1,
        "unit": "days"
      }
    },
    {
      "stepType": "ACTION",
      "actionType": "CREATE_TASK",
      "title": "Request decision",
      "config": {
        "title": "Make hiring decision on candidate",
        "dueDate": "2026-01-25"
      }
    }
  ]
}
```

## Error Handling

The workflow engine includes comprehensive error handling:

1. **Step Failure:** If a step fails, the execution is marked as FAILED and stops
2. **Graceful Degradation:** Workflow triggers are non-blocking (fire-and-forget)
3. **Error Logging:** All errors are logged with context for debugging
4. **Retry Logic:** Delayed steps are automatically retried by the scheduler
5. **Transaction Safety:** Database operations use proper transactions

## Monitoring & Debugging

### View Execution Logs
```bash
# Server logs show workflow execution
[WorkflowExecutor] Starting workflow 1 with context: {...}
[WorkflowExecutor] Found 3 steps to execute
[WorkflowExecutor] Executing step 1: Send welcome email (ACTION)
[WorkflowExecutor] Step 1 completed: { success: true }
[WorkflowExecutor] Workflow 1 completed successfully
```

### Query Execution Status
```sql
-- Recent executions
SELECT * FROM workflow_executions
ORDER BY started_at DESC
LIMIT 10;

-- Failed executions
SELECT * FROM workflow_executions
WHERE status = 'FAILED'
ORDER BY started_at DESC;

-- Step execution details
SELECT * FROM workflow_step_executions
WHERE execution_id = 123
ORDER BY created_at;
```

## Performance Considerations

1. **Async Execution:** Workflow triggers are async to not block API responses
2. **Batch Processing:** Scheduler processes multiple delayed steps in one run
3. **Indexed Queries:** All foreign keys and status fields are indexed
4. **Limited Results:** Execution queries are limited to prevent memory issues
5. **Efficient Scheduling:** Scheduler only runs every minute, not constantly

## Security

1. **Authorization:** Workflow execution requires authenticated user
2. **Validation:** All inputs are validated before execution
3. **Expression Safety:** Condition expressions use safe evaluation
4. **Audit Trail:** All executions are logged with user context
5. **Error Messages:** Production errors don't expose sensitive data

## Future Enhancements

Potential future features:

- [ ] Parallel step execution
- [ ] Workflow versioning
- [ ] Visual workflow builder UI
- [ ] Webhook triggers
- [ ] External API integrations
- [ ] Advanced branching logic
- [ ] Workflow templates marketplace
- [ ] Performance analytics dashboard
- [ ] A/B testing workflows
- [ ] Machine learning-based recommendations

## Testing

### Manual Testing
1. Create a test workflow via API
2. Create a test candidate (triggers CANDIDATE_CREATED)
3. Update candidate status (triggers CANDIDATE_STAGE_CHANGE)
4. Complete an interview (triggers INTERVIEW_COMPLETED)
5. Check execution logs and database

### Automated Testing
Create unit tests for:
- Step type handlers
- Trigger matching logic
- Delayed step scheduling
- Error handling scenarios

## Support

For issues or questions:
1. Check server logs for execution details
2. Query workflow_executions table for status
3. Review step_executions for detailed step results
4. Check scheduler logs for delayed step processing

---

**Created:** January 19, 2026
**Version:** 1.0.0
**Status:** Production Ready
