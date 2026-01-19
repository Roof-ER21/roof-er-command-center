# Safety Incident Tracking API

## Overview
Comprehensive safety incident tracking system with auto-escalation and email notifications.

## Database Migration
Run this migration to create the safety_incidents table:
```bash
psql $DATABASE_URL -f migrations/0003_add_safety_incidents.sql
```

## API Endpoints

### 1. List Incidents
```
GET /api/safety/incidents
```
Query Parameters:
- `severity`: Filter by severity (low, medium, high, critical)
- `status`: Filter by status (reported, investigating, resolved, closed)
- `category`: Filter by category (injury, near_miss, property_damage, environmental, other)
- `startDate`: Filter by created date (YYYY-MM-DD)
- `endDate`: Filter by created date (YYYY-MM-DD)

Response:
```json
[
  {
    "incident": {
      "id": 1,
      "title": "Fall from ladder",
      "description": "Employee fell from 10ft ladder",
      "severity": "high",
      "status": "investigating",
      "category": "injury",
      "incidentDate": "2026-01-19T10:00:00Z",
      "location": "Site A",
      "escalationCount": 0,
      ...
    },
    "reporter": {
      "id": 123,
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com"
    },
    "assignee": { ... }
  }
]
```

### 2. Create Incident
```
POST /api/safety/incidents
```
Body:
```json
{
  "title": "Incident title",
  "description": "Detailed description",
  "incidentDate": "2026-01-19T10:00:00Z",
  "severity": "high",
  "category": "injury",
  "location": "Site A",
  "witnesses": "Jane Doe, Bob Smith",
  "actionsTaken": "First aid administered",
  "preventiveMeasures": "Additional safety training scheduled",
  "assignedTo": 456
}
```

Response:
```json
{
  "success": true,
  "incident": { ... }
}
```

Email Behavior:
- **Critical**: Sends email to all HR_ADMIN users immediately
- **High**: Sends email to assigned user (if specified)
- If `assignedTo` is provided, sends assignment email

### 3. Get Incident Details
```
GET /api/safety/incidents/:id
```

Response:
```json
{
  "id": 1,
  "title": "...",
  "description": "...",
  "reporter": { ... },
  "assignee": { ... },
  "resolver": { ... },
  ...
}
```

### 4. Update Incident
```
PATCH /api/safety/incidents/:id
```
Body:
```json
{
  "status": "resolved",
  "actionsTaken": "Updated actions",
  "preventiveMeasures": "Additional measures",
  "assignedTo": 789
}
```

Email Behavior:
- If `assignedTo` changes: Sends assignment email
- If `status` changes to 'resolved' or 'closed': Sends resolution email to reporter

### 5. Escalate Incident
```
POST /api/safety/incidents/:id/escalate
```
Body:
```json
{
  "reason": "Incident requires management attention"
}
```

Response:
```json
{
  "success": true,
  "incident": {
    "escalationCount": 1,
    "lastEscalatedAt": "2026-01-19T12:00:00Z",
    ...
  }
}
```

Email Behavior:
- Sends escalation email to all HR_ADMIN users

### 6. Get Statistics
```
GET /api/safety/stats
```
Query Parameters:
- `startDate`: Filter by date range (YYYY-MM-DD)
- `endDate`: Filter by date range (YYYY-MM-DD)

Response:
```json
{
  "totalIncidents": 45,
  "openIncidents": 12,
  "avgResolutionTime": 24.5,
  "bySeverity": [
    { "severity": "critical", "count": 3 },
    { "severity": "high", "count": 8 },
    { "severity": "medium", "count": 20 },
    { "severity": "low", "count": 14 }
  ],
  "byCategory": [
    { "category": "injury", "count": 15 },
    { "category": "near_miss", "count": 20 },
    { "category": "property_damage", "count": 10 }
  ],
  "byMonth": [
    { "month": "2025-08", "count": 5 },
    { "month": "2025-09", "count": 7 },
    ...
  ]
}
```

## CRON Job

### Auto-Escalation
```
GET /api/cron/safety-escalation
```

This endpoint should be called hourly by your CRON service (e.g., GitHub Actions, Vercel Cron).

Escalation Thresholds:
- **Critical incidents**: Escalate if not addressed within 4 hours
- **High incidents**: Escalate if not addressed within 24 hours
- **Medium incidents**: Escalate if not addressed within 72 hours
- **Low incidents**: No automatic escalation

The job:
1. Finds incidents past their threshold
2. Increments `escalationCount`
3. Updates `lastEscalatedAt`
4. Sends escalation emails to all HR_ADMIN users

Response:
```json
{
  "success": true,
  "message": "Safety escalation processed",
  "total": 3,
  "escalated": 3,
  "failed": 0,
  "errors": []
}
```

## Email Templates

All email templates include:
- Branded header with Roof ER logo
- Incident details
- Action items
- Direct links (future enhancement)

### 1. Incident Reported
- **Trigger**: New incident created
- **Recipients**:
  - Critical: All HR_ADMIN users
  - High: Assigned user (if specified)
- **Subject**: `🚨 Safety Incident Reported - [SEVERITY] Severity`

### 2. Incident Assigned
- **Trigger**: Incident assigned to user
- **Recipients**: Assigned user
- **Subject**: `Safety Incident #[ID] Assigned to You`

### 3. Incident Escalated
- **Trigger**: Manual escalation or auto-escalation
- **Recipients**: All HR_ADMIN users
- **Subject**: `⚠️ ESCALATION: Safety Incident #[ID] Requires Immediate Attention`

### 4. Incident Resolved
- **Trigger**: Status changed to 'resolved' or 'closed'
- **Recipients**: Original reporter
- **Subject**: `✅ Safety Incident #[ID] Resolved`

## Safety Dashboard UI

The Safety Dashboard (`/hr/safety`) provides:

### Features
- **Report Incident**: Dialog form with all required fields
- **Incident List**:
  - Filterable by severity and status
  - Status dropdown for quick updates
  - Escalation badges
- **Statistics Cards**:
  - Total incidents
  - Open incidents
  - Average resolution time
  - Critical/High count
- **Analytics Tab**:
  - Incidents by severity
  - Incidents by category
  - 6-month trend

### Permissions
- All authenticated users can view incidents
- All authenticated users can report incidents
- Only assigned users and admins can update incidents

## Environment Variables

Required in your `.env` file:
```env
RESEND_API_KEY=your_resend_api_key
FROM_EMAIL=noreply@roofer.com
DATABASE_URL=your_postgres_url
```

If `RESEND_API_KEY` is not set, the system runs in simulation mode (emails logged to console).

## Testing

### 1. Create Test Incident
```bash
curl -X POST http://localhost:5000/api/safety/incidents \
  -H "Content-Type: application/json" \
  -H "Cookie: your_session_cookie" \
  -d '{
    "title": "Test incident",
    "description": "Test description",
    "incidentDate": "2026-01-19T10:00:00Z",
    "severity": "critical",
    "category": "injury"
  }'
```

### 2. Trigger Manual Escalation
```bash
curl http://localhost:5000/api/cron/safety-escalation
```

### 3. Check Statistics
```bash
curl http://localhost:5000/api/safety/stats
```

## Future Enhancements

- [ ] File attachments for incident evidence
- [ ] Incident investigation workflow with checklists
- [ ] Custom escalation rules per department
- [ ] Mobile app push notifications
- [ ] Integration with OSHA reporting
- [ ] Predictive analytics for safety trends
- [ ] Incident detail modal in UI
- [ ] PDF report generation
- [ ] Calendar view of incidents
- [ ] Safety training recommendations based on incidents

## Schema Reference

```sql
CREATE TABLE "safety_incidents" (
  "id" SERIAL PRIMARY KEY,
  "reported_by" INTEGER NOT NULL REFERENCES "users"("id"),
  "assigned_to" INTEGER REFERENCES "users"("id"),
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "location" TEXT,
  "incident_date" TIMESTAMP NOT NULL,
  "severity" TEXT NOT NULL CHECK ("severity" IN ('low', 'medium', 'high', 'critical')),
  "status" TEXT NOT NULL DEFAULT 'reported' CHECK ("status" IN ('reported', 'investigating', 'resolved', 'closed')),
  "category" TEXT CHECK ("category" IN ('injury', 'near_miss', 'property_damage', 'environmental', 'other')),
  "injury_type" TEXT,
  "witnesses" TEXT,
  "actions_taken" TEXT,
  "preventive_measures" TEXT,
  "resolved_at" TIMESTAMP,
  "resolved_by" INTEGER REFERENCES "users"("id"),
  "last_escalated_at" TIMESTAMP,
  "escalation_count" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updated_at" TIMESTAMP DEFAULT NOW() NOT NULL
);
```

---

**Created**: January 19, 2026
**Last Updated**: January 19, 2026
**Version**: 1.0.0
