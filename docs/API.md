# API Reference

Complete documentation of all REST API endpoints in Roof ER Command Center.

**Base URL:** `/api`

---

## Table of Contents

- [Authentication](#authentication)
- [HR Module](#hr-module)
- [Leaderboard Module](#leaderboard-module)
- [Training Module](#training-module)
- [Field Module](#field-module)
- [AI Module](#ai-module)
- [Error Codes](#error-codes)

---

## Authentication

All protected endpoints require a valid session. Sessions are managed via HTTP-only cookies (`connect.sid`).

### Headers

Most endpoints that modify data require:
```
Content-Type: application/json
```

Session cookies are automatically sent by the browser.

---

### Health Check

```
GET /api/health
```

Check server health status.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-01-17T12:00:00.000Z"
}
```

---

### Login (Email/Password)

```
POST /api/auth/login
```

Authenticate user with email and password.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "SALES_REP",
    "hasHRAccess": false,
    "hasLeaderboardAccess": true,
    "hasTrainingAccess": true,
    "hasFieldAccess": true,
    "trainingLevel": "intermediate",
    "totalXp": 1250,
    "currentLevel": 5,
    "currentStreak": 7
  }
}
```

**Error (401 Unauthorized):**
```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

---

### Login (PIN)

```
POST /api/auth/pin-login
```

Authenticate user with 4-digit PIN (primarily for training module).

**Request Body:**
```json
{
  "pin": "1234",
  "userId": 1  // optional - if provided, validates PIN for specific user
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "TRAINEE",
    "hasTrainingAccess": true,
    "trainingLevel": "beginner",
    "totalXp": 500
  }
}
```

**Error (403 Forbidden):**
```json
{
  "success": false,
  "message": "No training access"
}
```

---

### Get Current User

```
GET /api/auth/me
```

Get the currently authenticated user's information.

**Authentication:** Required

**Response (200 OK):**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "SALES_REP",
    "hasHRAccess": false,
    "hasLeaderboardAccess": true,
    "hasTrainingAccess": true,
    "hasFieldAccess": true,
    "department": "Sales",
    "position": "Senior Sales Rep",
    "team": "Alpha",
    "trainingLevel": "intermediate",
    "totalXp": 1250,
    "currentLevel": 5,
    "currentStreak": 7,
    "avatar": "rocket",
    "isActive": true,
    "lastLoginAt": "2025-01-17T10:30:00.000Z"
  }
}
```

---

### Logout

```
POST /api/auth/logout
```

End the current session.

**Response (200 OK):**
```json
{
  "success": true
}
```

---

### Register User (Admin Only)

```
POST /api/auth/register
```

Create a new user account.

**Authentication:** Required (SYSTEM_ADMIN or HR_ADMIN role)

**Request Body:**
```json
{
  "email": "newuser@example.com",
  "password": "securepassword",
  "firstName": "Jane",
  "lastName": "Smith",
  "role": "SALES_REP",
  "hasHRAccess": false,
  "hasLeaderboardAccess": true,
  "hasTrainingAccess": true,
  "hasFieldAccess": true,
  "department": "Sales",
  "position": "Sales Representative"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "user": {
    "id": 2,
    "email": "newuser@example.com",
    "firstName": "Jane",
    "lastName": "Smith",
    "role": "SALES_REP"
  }
}
```

---

## HR Module

All HR endpoints require authentication and `hasHRAccess: true`.

### Employees

#### List Employees

```
GET /api/hr/employees
```

Get all employees with optional filtering.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `department` | string | Filter by department |
| `territory` | number | Filter by territory ID |
| `isActive` | boolean | Filter by active status |
| `role` | string | Filter by role |

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "email": "john@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "SALES_REP",
      "department": "Sales",
      "position": "Senior Sales Rep",
      "hireDate": "2024-01-15",
      "phone": "555-123-4567",
      "isActive": true
    }
  ]
}
```

#### Get Employee

```
GET /api/hr/employees/:id
```

Get a single employee by ID.

#### Create Employee

```
POST /api/hr/employees
```

Create a new employee record.

#### Update Employee

```
PUT /api/hr/employees/:id
```

Update employee information.

#### Delete Employee

```
DELETE /api/hr/employees/:id
```

Soft delete (deactivate) an employee.

---

### PTO Requests

#### List PTO Requests

```
GET /api/hr/pto
```

Get all PTO requests.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `employeeId` | number | Filter by employee |
| `status` | string | Filter by status (PENDING, APPROVED, DENIED) |
| `startDate` | string | Filter by start date (YYYY-MM-DD) |

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "employeeId": 5,
      "startDate": "2025-02-01",
      "endDate": "2025-02-05",
      "days": 5,
      "type": "VACATION",
      "reason": "Family vacation",
      "status": "PENDING",
      "createdAt": "2025-01-15T10:00:00.000Z"
    }
  ]
}
```

#### Create PTO Request

```
POST /api/hr/pto
```

Submit a new PTO request.

**Request Body:**
```json
{
  "startDate": "2025-02-01",
  "endDate": "2025-02-05",
  "days": 5,
  "type": "VACATION",
  "reason": "Family vacation"
}
```

#### Approve/Deny PTO

```
PUT /api/hr/pto/:id/review
```

Review a PTO request.

**Request Body:**
```json
{
  "status": "APPROVED",
  "reviewNotes": "Approved. Enjoy your vacation!"
}
```

---

### Recruiting

#### List Candidates

```
GET /api/hr/candidates
```

Get all candidates in the recruiting pipeline.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `status` | string | Filter by status |
| `position` | string | Filter by position |
| `assignedTo` | number | Filter by assigned recruiter |

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "firstName": "Alice",
      "lastName": "Johnson",
      "email": "alice@example.com",
      "phone": "555-987-6543",
      "position": "Sales Representative",
      "status": "interview",
      "source": "LinkedIn",
      "rating": 4,
      "createdAt": "2025-01-10T09:00:00.000Z"
    }
  ]
}
```

#### Create Candidate

```
POST /api/hr/candidates
```

Add a new candidate.

#### Update Candidate Status

```
PUT /api/hr/candidates/:id/status
```

Move candidate through pipeline stages.

**Request Body:**
```json
{
  "status": "offer",
  "notes": "Great interview performance"
}
```

---

### Interviews

#### Schedule Interview

```
POST /api/hr/interviews
```

Schedule an interview with a candidate.

**Request Body:**
```json
{
  "candidateId": 1,
  "interviewerId": 5,
  "scheduledAt": "2025-01-20T14:00:00.000Z",
  "duration": 60,
  "type": "video",
  "meetingLink": "https://zoom.us/j/123456"
}
```

#### Complete Interview

```
PUT /api/hr/interviews/:id/complete
```

Record interview results.

**Request Body:**
```json
{
  "rating": 4,
  "notes": "Strong communication skills",
  "feedback": "Technical skills need improvement",
  "recommendation": "second_interview"
}
```

---

### Equipment

#### List Equipment

```
GET /api/hr/equipment
```

Get all company equipment.

#### Assign Equipment

```
PUT /api/hr/equipment/:id/assign
```

Assign equipment to an employee.

**Request Body:**
```json
{
  "assignedTo": 5,
  "notes": "Assigned for field work"
}
```

---

## Leaderboard Module

All leaderboard endpoints require authentication and `hasLeaderboardAccess: true`.

### Sales Reps

#### List Sales Reps

```
GET /api/leaderboard/reps
```

Get all sales reps with rankings.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "rank": 1,
      "name": "John Doe",
      "team": "Alpha",
      "title": "Senior Sales Rep",
      "monthlyRevenue": 45000,
      "yearlyRevenue": 520000,
      "monthlySignups": 15,
      "goalProgress": 112.5,
      "monthlyGrowth": 8.5,
      "currentBonusTier": 3
    }
  ]
}
```

Also available at:
```
GET /api/sales-reps
```

#### Get Sales Rep Details

```
GET /api/leaderboard/reps/:id
```

Get detailed stats for a specific sales rep.

#### Update Sales Stats

```
PUT /api/leaderboard/reps/:id/stats
```

Update a sales rep's statistics.

**Request Body:**
```json
{
  "monthlyRevenue": 48000,
  "monthlySignups": 16
}
```

---

### Teams

#### List Teams

```
GET /api/leaderboard/teams
```

Get all sales teams with aggregate stats.

Also available at:
```
GET /api/teams
```

#### Get Team Details

```
GET /api/leaderboard/teams/:id
```

Get team members and stats.

---

### Contests

#### List Contests

```
GET /api/leaderboard/contests
```

Get all contests.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `status` | string | Filter by status (upcoming, active, completed) |

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "January Revenue Challenge",
      "description": "Top revenue earner wins!",
      "startDate": "2025-01-01T00:00:00.000Z",
      "endDate": "2025-01-31T23:59:59.000Z",
      "contestType": "revenue",
      "participantType": "individual",
      "status": "active",
      "prizes": ["$500 bonus", "$250 bonus", "$100 bonus"]
    }
  ]
}
```

#### Create Contest

```
POST /api/leaderboard/contests
```

Create a new contest.

#### Get Contest Standings

```
GET /api/leaderboard/contests/:id/standings
```

Get current contest rankings.

---

## Training Module

All training endpoints require authentication and `hasTrainingAccess: true`.

### Dashboard

#### Get Training Dashboard

```
GET /api/training/dashboard
```

Get user's training overview.

**Response:**
```json
{
  "success": true,
  "data": {
    "totalXp": 1250,
    "level": "intermediate",
    "currentStreak": 7,
    "completedModules": 8,
    "totalModules": 12,
    "achievements": 15
  }
}
```

---

### Curriculum

#### Get Curriculum Progress

```
GET /api/training/curriculum
```

Get user's curriculum progress.

**Response:**
```json
{
  "success": true,
  "data": {
    "modules": [
      {
        "id": 1,
        "title": "Welcome & Company Intro",
        "completed": true,
        "score": 100
      },
      {
        "id": 2,
        "title": "Your Commitment",
        "completed": true,
        "score": 95
      },
      {
        "id": 3,
        "title": "The Initial Pitch",
        "completed": true,
        "score": 88
      }
    ]
  }
}
```

#### Get Module Content

```
GET /api/training/curriculum/:moduleId
```

Get specific module content and materials.

#### Complete Module

```
POST /api/training/curriculum/:moduleId/complete
```

Mark module as completed and record score.

**Request Body:**
```json
{
  "score": 92,
  "timeSpent": 1200
}
```

---

### Achievements

#### Get Achievements

```
GET /api/training/achievements
```

Get user's achievements.

**Response:**
```json
{
  "success": true,
  "data": {
    "unlocked": [
      {
        "id": 1,
        "name": "First Steps",
        "unlockedAt": "2024-12-15"
      },
      {
        "id": 2,
        "name": "7-Day Streak",
        "unlockedAt": "2024-12-22"
      }
    ],
    "available": [
      {
        "id": 4,
        "name": "Speed Demon",
        "description": "Complete 5 modules in a day"
      }
    ]
  }
}
```

---

### Roleplay

#### Start Roleplay Session

```
POST /api/training/roleplay/start
```

Start a new AI roleplay session.

**Request Body:**
```json
{
  "scenario": "homeowner_initial",
  "mode": "text"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "sessionId": "session_1705500000000",
    "scenario": "homeowner_initial",
    "mode": "text",
    "startedAt": "2025-01-17T12:00:00.000Z"
  }
}
```

#### Send Roleplay Message

```
POST /api/training/roleplay/:sessionId/message
```

Send a message in the roleplay conversation.

**Request Body:**
```json
{
  "message": "Hi, I'm John from Roof ER. I noticed your roof may have storm damage..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "sessionId": "session_1705500000000",
    "response": "Oh really? I didn't notice any problems. What kind of damage are you talking about?",
    "feedback": null
  }
}
```

#### End Roleplay Session

```
POST /api/training/roleplay/:sessionId/end
```

End session and get feedback.

**Response:**
```json
{
  "success": true,
  "data": {
    "sessionId": "session_1705500000000",
    "score": 85,
    "xpEarned": 150,
    "feedback": {
      "strengths": ["Good opening", "Professional tone"],
      "improvements": ["Ask more qualifying questions"],
      "tips": ["Try the SPIN selling technique"]
    }
  }
}
```

---

## Field Module

All field endpoints require authentication and `hasFieldAccess: true`.

### Chat (Susan AI)

#### Create Chat Session

```
POST /api/field/chat/sessions
```

Start a new chat session with Susan AI.

**Request Body:**
```json
{
  "state": "VA",
  "provider": "gemini"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "sessionId": "uuid-here",
    "state": "VA",
    "provider": "gemini",
    "startedAt": "2025-01-17T12:00:00.000Z"
  }
}
```

#### Send Chat Message

```
POST /api/field/chat/sessions/:sessionId/messages
```

Send a message to Susan AI.

**Request Body:**
```json
{
  "content": "What are the insurance claim filing requirements in Virginia?"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "role": "assistant",
    "content": "In Virginia, insurance claim filing requirements include...",
    "sources": [
      {
        "title": "VA Insurance Code",
        "url": "https://..."
      }
    ]
  }
}
```

#### Get Chat History

```
GET /api/field/chat/sessions/:sessionId/messages
```

Get all messages from a chat session.

---

### Email Generation

#### Generate Email

```
POST /api/field/email/generate
```

Generate a professional email using AI.

**Request Body:**
```json
{
  "recipientType": "homeowner",
  "purpose": "follow_up",
  "context": "Met with homeowner last week, discussed roof damage claim",
  "state": "MD"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "subject": "Following Up on Your Roof Assessment",
    "body": "Dear Mr. Smith,\n\nThank you for meeting with me last week..."
  }
}
```

#### Get Email Templates

```
GET /api/field/email/templates
```

Get available email templates.

---

### Documents

#### List Documents

```
GET /api/field/documents
```

Get available documents by category.

**Response:**
```json
{
  "success": true,
  "data": {
    "categories": [
      {
        "name": "Contracts",
        "documents": [
          {
            "id": 1,
            "name": "Standard Service Agreement",
            "path": "/documents/contracts/service-agreement.pdf"
          }
        ]
      }
    ]
  }
}
```

#### Track Document View

```
POST /api/field/documents/view
```

Record a document view for analytics.

**Request Body:**
```json
{
  "documentPath": "/documents/contracts/service-agreement.pdf",
  "documentName": "Standard Service Agreement",
  "timeSpent": 120
}
```

---

### Image Analysis

#### Analyze Roof Image

```
POST /api/field/analyze-image
```

Analyze a roof image for damage assessment.

**Request Body (multipart/form-data):**
| Field | Type | Description |
|-------|------|-------------|
| `image` | file | Image file (JPG, PNG, HEIC) |
| `analysisType` | string | Type: "roof_damage" or "general" |

**Response:**
```json
{
  "success": true,
  "data": {
    "analysis": "The image shows clear signs of hail damage including...",
    "damageTypes": ["hail_damage", "missing_shingles"],
    "severity": "moderate",
    "recommendations": [
      "Document additional angles",
      "Recommend insurance claim filing"
    ]
  }
}
```

---

## AI Module

General AI endpoints for cross-module functionality.

### Mentor

#### Get Mentor Context

```
GET /api/ai/mentor/context
```

Get user's personalized AI mentor settings.

#### Update Mentor Preferences

```
PUT /api/ai/mentor/preferences
```

Update coaching style and communication preferences.

**Request Body:**
```json
{
  "coachingStyle": "motivational",
  "communicationTone": "friendly"
}
```

---

## Error Codes

### HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Not authenticated |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found |
| 429 | Too Many Requests - Rate limited |
| 500 | Internal Server Error |

### Error Response Format

All errors follow this format:

```json
{
  "success": false,
  "error": "Error description",
  "message": "Human-readable message"
}
```

### Common Errors

#### Authentication Errors

```json
{
  "success": false,
  "error": "Not authenticated"
}
```

```json
{
  "success": false,
  "error": "User not found"
}
```

#### Authorization Errors

```json
{
  "success": false,
  "error": "Insufficient permissions"
}
```

```json
{
  "success": false,
  "error": "No access to hr module"
}
```

#### Validation Errors

```json
{
  "success": false,
  "error": "Validation failed",
  "details": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

---

## Rate Limiting

API requests are rate limited to protect the server:

- **Default:** 100 requests per 15 minutes per IP
- **AI endpoints:** 30 requests per minute per user

When rate limited, you'll receive:

```json
{
  "success": false,
  "error": "Too many requests",
  "retryAfter": 60
}
```

---

## Pagination

Endpoints that return lists support pagination:

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 20 | Items per page (max 100) |

**Response includes:**
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```
