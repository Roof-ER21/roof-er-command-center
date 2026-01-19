# 🤝 Gemini Handoff: Susan & Agnes Integration

**Project**: Roof ER Command Center
**Production URL**: https://trd21.up.railway.app
**Date**: January 18, 2026
**Purpose**: Verify Susan AI and Agnes roleplay training work properly and connect together

---

## 📋 Quick Context

The Roof ER Command Center is a roofing business management platform with 4 modules:
- **HR** - Employee management
- **Leaderboard** - Sales performance tracking
- **Training** - Roleplay training with Agnes
- **Field** - On-site assistant with Susan AI

**Susan** and **Agnes** are AI-powered features that need verification:
- **Susan AI** = The unified AI assistant powering chat, document analysis, image analysis, and email generation
- **Agnes** = The roleplay training system where Susan plays homeowner personas

---

## 🧠 SUSAN AI - Unified Assistant

### What It Does
Susan is the AI backbone using **Google Gemini 2.0 Flash**. She has 5 specialized personas:

| Context | Persona | Use Case |
|---------|---------|----------|
| `field` | Field Assistant | On-site technical support, damage assessment, email drafts |
| `training` | Roleplay Homeowner | Plays difficult homeowners in training scenarios |
| `hr` | HR Advisor | Employee management, compliance guidance |
| `sales` | Sales Mentor | Performance analysis, sales techniques |
| `general` | General Helper | Navigation, cross-module questions |

### Core Files

```
/server/services/susan-ai.ts          # Main AI service (Gemini integration)
/server/routes/ai/index.ts            # AI endpoints (/api/ai/*)
/server/routes/field/index.ts         # Field endpoints (uses Susan)
/docs/SUSAN_AI_IMPLEMENTATION.md      # Full documentation
```

### API Endpoints to Test

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/ai/status` | Check if Susan is available |
| POST | `/api/ai/chat` | Send message, get response |
| POST | `/api/ai/chat/stream` | Streaming response (SSE) |
| POST | `/api/field/chat/session` | Create new chat session |
| POST | `/api/field/chat/:sessionId/message` | Send message in session |
| GET | `/api/field/chat/history` | Get user's chat history |
| POST | `/api/field/documents/analyze` | Analyze PDF/Word/Excel |
| POST | `/api/field/images/analyze` | Analyze roof damage photos |
| POST | `/api/field/email/generate` | Generate email from template |

### Test Susan (Manual)

```bash
# 1. Check status
curl https://trd21.up.railway.app/api/ai/status

# 2. Simple chat (requires auth cookie)
curl -X POST https://trd21.up.railway.app/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What is a roof square?", "context": "field"}'
```

### Environment Variables Required

```env
GOOGLE_GENAI_API_KEY=your_gemini_api_key
```

---

## 🎭 AGNES - Roleplay Training System

### What It Does
Agnes is a roleplay training system for sales reps. Susan AI plays different homeowner personas with varying difficulty levels. Reps practice handling objections, and if they make too many mistakes, the homeowner "slams the door."

### Difficulty Levels

| Level | Door Slam Threshold | Example Scenario |
|-------|---------------------|------------------|
| BEGINNER | ∞ (never slams) | Eager Learner |
| ROOKIE | 5 mistakes | Friendly Neighbor |
| PRO | 3 mistakes | Busy Parent |
| VETERAN | 2 mistakes | Skeptical Homeowner |
| ELITE | 1 mistake | Storm Chaser Victim |

### 13 Training Scenarios

**Insurance Division (10 scenarios):**
1. 🌱 Eager Learner - Beginner, curious homeowner
2. 🏡 Friendly Neighbor - Rookie, casual and friendly
3. 👨‍👩‍👧 Busy Parent - Pro, time-pressured
4. 😠 Skeptical Homeowner - Veteran, hostile/suspicious
5. 💰 Price-Conscious - Pro, budget-focused
6. 📊 Comparison Shopper - Veteran, needs competitive data
7. 🌪️ Storm Chaser Victim - Elite, previously scammed
8. 👵 Elderly Homeowner - Rookie, confused/cautious
9. 🔧 DIY Expert - Elite, knows roofing
10. 🚨 Emergency Repair - Pro, urgent leak situation

**Retail Division (3 scenarios):**
1. 🏠 Eager Homeowner - Beginner
2. 💼 Busy Professional - Pro
3. 😠 Skeptic - Elite

### Core Files

```
/server/routes/training/roleplay.ts           # Roleplay backend
/client/src/modules/training/data/scenarios.ts # Scenario definitions
/client/src/modules/training/RoleplayPage.tsx  # Main UI
/client/src/modules/training/components/RoleplayChat.tsx # Chat component
/client/src/lib/gamification.ts               # XP/Level system
```

### API Endpoints to Test

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/training/roleplay/start` | Start a roleplay session |
| POST | `/api/training/roleplay/:sessionId/message` | Send message, get AI response |
| POST | `/api/training/roleplay/:sessionId/end` | End session with score |
| GET | `/api/training/roleplay/:sessionId/history` | Get session history |
| GET | `/api/training/roleplay/sessions/recent` | Get recent sessions |

### Request/Response Examples

**Start Roleplay:**
```json
// POST /api/training/roleplay/start
{
  "scenarioId": "eager-learner",
  "difficulty": "BEGINNER"
}

// Response
{
  "success": true,
  "sessionId": "uuid-here",
  "scenario": { ... },
  "initialMessage": "Oh hi! I wasn't expecting anyone..."
}
```

**Send Message:**
```json
// POST /api/training/roleplay/{sessionId}/message
{
  "message": "Hi, I'm with Roof ER. We're doing free inspections in the area."
}

// Response
{
  "success": true,
  "response": "Free inspections? That sounds interesting! What exactly do you look for?",
  "feedback": "Good opening approach",
  "score": 85,
  "mistakes": 0,
  "doorSlammed": false
}
```

### Gamification System

```typescript
// XP Calculation Formula
const baseXP = 50;
const difficultyMultiplier = { BEGINNER: 1, ROOKIE: 1.5, PRO: 2, VETERAN: 2.5, ELITE: 3 };
const xpEarned = Math.floor(baseXP * (score / 100) * difficultyMultiplier[difficulty] * streakMultiplier);

// Level Calculation
const xpForLevel = (level) => 50 * level * level;
const totalXPForLevel10 = 5000; // 50 * 100
```

---

## 🔗 How Susan & Agnes Connect

```
┌─────────────────────────────────────────────────────────────────┐
│                    AGNES ROLEPLAY FLOW                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. User selects scenario (e.g., "Skeptical Homeowner")        │
│                          ↓                                      │
│  2. Frontend calls POST /api/training/roleplay/start           │
│                          ↓                                      │
│  3. Backend creates session with scenario context              │
│                          ↓                                      │
│  4. User sends message via POST .../message                    │
│                          ↓                                      │
│  5. Backend calls Susan AI with:                               │
│     - context: "training"                                       │
│     - scenario persona (angry/friendly/etc)                    │
│     - conversation history                                      │
│     - difficulty-specific behavior rules                       │
│                          ↓                                      │
│  6. Susan (Gemini) generates in-character response             │
│                          ↓                                      │
│  7. Backend analyzes for mistakes/good techniques              │
│                          ↓                                      │
│  8. Response + feedback + score returned to frontend           │
│                          ↓                                      │
│  9. If mistakes > threshold → doorSlammed: true                │
│                          ↓                                      │
│  10. Session ends → XP calculated → saved to DB                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Connection Points in Code

**roleplay.ts uses susan-ai.ts:**
```typescript
// In /server/routes/training/roleplay.ts
import { susanAI } from "../../services/susan-ai.js";

// Inside message handler
const aiResponse = await susanAI.chat({
  message: playerMessage,
  context: "training",
  systemPrompt: buildScenarioPrompt(scenario, session),
  history: session.conversationHistory
});
```

---

## ✅ Verification Checklist

### Pre-Checks
- [ ] `GOOGLE_GENAI_API_KEY` is set in Railway environment
- [ ] Database is seeded with users (`npm run db:seed`)
- [ ] User has `fieldAccess: true` and `trainingAccess: true`

### Susan AI Checks
- [ ] `/api/ai/status` returns `{ available: true }`
- [ ] Field > Chat page loads and shows "Hi! I'm Susan..."
- [ ] Sending a message gets a relevant AI response
- [ ] Image upload analyzes roof damage
- [ ] Document upload parses and summarizes content
- [ ] Email generation works with templates

### Agnes Training Checks
- [ ] Training > Roleplay page shows all 13 scenarios
- [ ] Starting a session returns initial AI message
- [ ] Sending messages gets in-character responses
- [ ] Mistake detection works (feedback appears)
- [ ] Door slam triggers when threshold exceeded
- [ ] Score is calculated correctly
- [ ] XP is awarded after session ends
- [ ] Session history is saved to database
- [ ] Recent sessions appear on dashboard

### Integration Checks
- [ ] Training uses Susan AI (not a separate AI)
- [ ] WebSocket updates work for XP changes
- [ ] User stats update after completing roleplay
- [ ] Streak counter works for daily training

---

## 🐛 Common Issues & Solutions

### Issue: "Susan is unavailable"
**Cause**: Missing or invalid `GOOGLE_GENAI_API_KEY`
**Fix**: Add valid Gemini API key to Railway environment variables

### Issue: 401 Unauthorized on AI endpoints
**Cause**: Not logged in or session expired
**Fix**:
1. Clear cookies for the domain
2. Login at `/login` with valid credentials
3. Ensure user has module access flags

### Issue: Roleplay responses are generic
**Cause**: Scenario context not being passed properly
**Fix**: Check `buildScenarioPrompt()` in roleplay.ts includes persona details

### Issue: Door slam not triggering
**Cause**: Mistake detection may not be matching
**Fix**: Check the AI prompt includes mistake detection instructions

### Issue: XP not saving
**Cause**: Database connection or schema mismatch
**Fix**: Run `npx drizzle-kit push` to sync schema

---

## 📊 Database Tables

### Chat Sessions (Susan Field)
```sql
chatSessions: id, userId, title, createdAt, updatedAt

chatMessages: id, sessionId, role, content, metadata, createdAt
```

### Roleplay Sessions (Agnes)
```sql
roleplaySessions:
  id, sessionId, userId, scenarioId,
  difficulty, score, xpEarned,
  duration, doorSlammed,
  conversationHistory (JSON),
  createdAt, completedAt
```

### User Stats
```sql
users:
  currentStreak, longestStreak,
  totalXP, currentLevel,
  trainingAccess, fieldAccess
```

---

## 🔑 Test Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@roof-er.com | test123 |
| Manager | manager@roof-er.com | test123 |
| Sales Rep | rep1@roof-er.com | test123 |

---

## 🚀 Quick Test Script

```bash
#!/bin/bash
BASE_URL="https://trd21.up.railway.app"

# 1. Health check
echo "=== Health Check ==="
curl -s "$BASE_URL/api/health"

# 2. AI Status
echo "\n=== Susan AI Status ==="
curl -s "$BASE_URL/api/ai/status"

# 3. Test endpoints (requires auth - use browser DevTools to get cookie)
echo "\n=== Test complete. Check browser for authenticated tests. ==="
```

---

## 📁 Key Files Summary

| File | Purpose |
|------|---------|
| `/server/services/susan-ai.ts` | Core Gemini AI service |
| `/server/routes/ai/index.ts` | AI API endpoints |
| `/server/routes/field/index.ts` | Field module endpoints |
| `/server/routes/training/roleplay.ts` | Agnes roleplay backend |
| `/client/src/modules/field/ChatPage.tsx` | Susan chat UI |
| `/client/src/modules/training/RoleplayPage.tsx` | Agnes roleplay UI |
| `/client/src/modules/training/data/scenarios.ts` | 13 scenario definitions |
| `/client/src/lib/gamification.ts` | XP/level calculations |

---

## 🎯 Success Criteria

Susan and Agnes are working properly when:

1. **Susan responds contextually** - Field questions get field answers, training gets roleplay
2. **Agnes plays character** - The AI stays in persona (angry, friendly, skeptical)
3. **Mistakes are detected** - Bad sales techniques trigger feedback
4. **Door slams work** - Too many mistakes ends session early
5. **XP is awarded** - Completing sessions grants experience points
6. **Data persists** - Sessions are saved and appear in history
7. **Stats update** - User level/streak reflect training activity

---

**Created for Gemini handoff by Claude Code**
**Last Updated**: January 18, 2026
