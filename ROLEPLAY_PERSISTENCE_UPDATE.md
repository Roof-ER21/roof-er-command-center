# Roleplay Session Persistence - Update Summary

## Problem
Roleplay training sessions were stored in-memory only and lost on server restart.

## Solution
Migrated from in-memory Map storage to PostgreSQL database using the existing `roleplaySessions` table.

## Changes Made

### File: `server/routes/training/index.ts`

#### 1. Import Changes
- Added `roleplaySessions` to imports from schema
- Removed in-memory `sessions` Map

```typescript
// Before:
const sessions = new Map<string, any>();

// After:
import { roleplaySessions } from "../../../shared/schema.js";
```

#### 2. POST `/api/training/roleplay/start` - Start Session
**Changes:**
- Now requires `scenarioTitle` in request body (in addition to `scenarioId`, `difficulty`)
- Validates required fields before processing
- Inserts session into database with user authentication
- Returns same response format (no breaking changes)

**Request Body:**
```json
{
  "scenarioId": "homeowner_objection",
  "scenarioTitle": "Handling Price Objections",
  "difficulty": "BEGINNER"
}
```

**Database Record Created:**
```typescript
{
  userId: number,
  scenarioId: string,
  scenarioTitle: string,
  difficulty: 'BEGINNER' | 'ROOKIE' | 'PRO' | 'ELITE' | 'NIGHTMARE',
  messages: [],
  score: 0,
  xpEarned: 0,
  createdAt: timestamp
}
```

#### 3. POST `/api/training/roleplay/:sessionId/message` - Submit Message
**Changes:**
- Fetches session from database instead of in-memory Map
- Queries by userId and createdAt timestamp (from sessionId)
- Stores complete message history in JSONB column
- Updates score, completedAt, and duration on each message
- Automatically marks session complete after 5 exchanges (10 messages)
- Returns same response format (no breaking changes)

**Request Body:**
```json
{
  "message": "I understand the price seems high..."
}
```

**Response Format (unchanged):**
```json
{
  "success": true,
  "data": {
    "response": "AI response here",
    "feedback": "Performance feedback",
    "scoreAwarded": 10,
    "totalScore": 50,
    "sessionEnded": false
  }
}
```

#### 4. GET `/api/training/roleplay/sessions` - List Sessions (NEW)
**Purpose:** Fetch user's roleplay session history

**Query Parameters:**
- `limit` (default: 10)
- `offset` (default: 0)

**Response:**
```json
{
  "success": true,
  "data": {
    "sessions": [
      {
        "id": 1,
        "sessionId": "session_1705123456_123",
        "scenarioId": "homeowner_objection",
        "scenarioTitle": "Handling Price Objections",
        "difficulty": "BEGINNER",
        "score": 50,
        "messageCount": 10,
        "xpEarned": 0,
        "duration": 450,
        "createdAt": "2025-01-18T...",
        "completedAt": "2025-01-18T...",
        "isActive": false
      }
    ],
    "total": 1
  }
}
```

#### 5. GET `/api/training/roleplay/sessions/:sessionId` - Get Session Details (NEW)
**Purpose:** Fetch complete session including all messages

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "sessionId": "session_1705123456_123",
    "scenarioId": "homeowner_objection",
    "scenarioTitle": "Handling Price Objections",
    "difficulty": "BEGINNER",
    "messages": [
      {
        "role": "user",
        "content": "Hello, how are you?",
        "timestamp": "2025-01-18T..."
      },
      {
        "role": "assistant",
        "content": "I'm doing well...",
        "timestamp": "2025-01-18T..."
      }
    ],
    "score": 50,
    "feedback": null,
    "duration": 450,
    "xpEarned": 0,
    "createdAt": "2025-01-18T...",
    "completedAt": "2025-01-18T..."
  }
}
```

## Database Schema Used

Table: `roleplay_sessions`

| Column | Type | Notes |
|--------|------|-------|
| `id` | serial | Primary key |
| `userId` | integer | Foreign key to users |
| `scenarioId` | text | Scenario identifier |
| `scenarioTitle` | text | Human-readable title |
| `difficulty` | text | BEGINNER/ROOKIE/PRO/ELITE/NIGHTMARE |
| `messages` | jsonb | Array of {role, content, timestamp} |
| `score` | integer | Current score |
| `feedback` | jsonb | {strengths, improvements, tips} |
| `duration` | integer | Session duration in seconds |
| `xpEarned` | integer | XP earned (default: 0) |
| `createdAt` | timestamp | Auto-generated |
| `completedAt` | timestamp | Set when session ends |

## Benefits

1. **Persistence**: Sessions survive server restarts
2. **History**: Users can review past roleplay sessions
3. **Analytics**: Can track user progress over time
4. **Scalability**: Database handles concurrent sessions properly
5. **Audit Trail**: Complete message history stored
6. **Backwards Compatible**: No changes to existing API response formats

## Frontend Impact

### Required Changes
The frontend must now include `scenarioTitle` when starting a session:

```typescript
// Before:
await fetch('/api/training/roleplay/start', {
  body: JSON.stringify({ scenarioId, difficulty })
})

// After:
await fetch('/api/training/roleplay/start', {
  body: JSON.stringify({
    scenarioId,
    scenarioTitle, // NEW REQUIRED FIELD
    difficulty
  })
})
```

### Optional Features
Frontend can now:
- List all past sessions: `GET /api/training/roleplay/sessions`
- View session details: `GET /api/training/roleplay/sessions/:sessionId`
- Resume sessions (if completedAt is null)
- Display session history and statistics

## Testing

### Manual Test Steps

1. **Start a session:**
```bash
curl -X POST http://localhost:5000/api/training/roleplay/start \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "scenarioId": "test",
    "scenarioTitle": "Test Scenario",
    "difficulty": "BEGINNER"
  }'
```

2. **Send a message:**
```bash
curl -X POST http://localhost:5000/api/training/roleplay/:sessionId/message \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"message": "Hello"}'
```

3. **List sessions:**
```bash
curl http://localhost:5000/api/training/roleplay/sessions \
  -H "Authorization: Bearer <token>"
```

4. **Get session details:**
```bash
curl http://localhost:5000/api/training/roleplay/sessions/:sessionId \
  -H "Authorization: Bearer <token>"
```

## Error Handling

All endpoints include proper error handling:
- 400: Bad request (missing fields)
- 404: Session not found
- 500: Server error

## Migration Notes

No database migration needed - the `roleplaySessions` table already exists in the schema.

## Next Steps

1. Update frontend to pass `scenarioTitle` when starting sessions
2. (Optional) Add UI to view session history
3. (Optional) Implement session resume functionality
4. (Optional) Add XP rewards when sessions are completed
5. (Optional) Implement feedback generation system

## Rollback Plan

If issues occur:
1. Revert `server/routes/training/index.ts` to previous version
2. Restart server
3. In-memory sessions will work again (but won't persist)

---

**Implementation Date:** 2025-01-18
**Files Modified:** 1
**Database Changes:** None (used existing schema)
**Breaking Changes:** Frontend must pass `scenarioTitle` parameter
