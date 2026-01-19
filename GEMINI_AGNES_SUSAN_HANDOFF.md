# Gemini Investigation Handoff: Agnes & Susan Standalone Apps

## Overview

This document provides context for investigating how **Agnes-21** and **Gemini Field Assistant (Susan)** standalone apps relate to the **Roof-ER Command Center** integration.

---

## Apps to Investigate

### 1. Susan - Gemini Field Assistant
| Field | Value |
|-------|-------|
| **GitHub** | https://github.com/Roof-ER21/gemini-field-assistant |
| **Production URL** | https://sa21.up.railway.app/ |
| **Local Path** | `/Users/a21/gemini-field-assistant/` |

### 2. Agnes - Agnes-21
| Field | Value |
|-------|-------|
| **GitHub** | https://github.com/Roof-ER21/agnes-21 |
| **Production URL** | https://livea21.up.railway.app/ |
| **Local Path** | `/Users/a21/agnes-21/` |

---

## How They're Integrated in Command Center

### Susan AI in Command Center

**Location**: `/Users/a21/roof-er-command-center/`

**Core Service**: `server/services/susan-ai.ts`
- Uses Google GenAI SDK (`@google/genai`)
- Model: `gemini-2.0-flash-exp`
- Singleton pattern: `susanAI` instance
- Environment variable: `GOOGLE_GENAI_API_KEY`

**Key Methods**:
```typescript
susanAI.chat(message, options)           // General chat with personas
susanAI.chatStream(message, options)     // Streaming responses
susanAI.analyzeDocument(text, type, name) // Document analysis
susanAI.analyzeRoofImage(base64, mime)   // Roof damage vision analysis
susanAI.analyzeSalesData(data, question) // Sales mentor
susanAI.generateTrainingResponse(...)    // Training roleplay responses
```

**Module Personas** (context-aware):
| Context | Persona | Specialization |
|---------|---------|----------------|
| `hr` | HR Expert | Employee management, compliance |
| `sales` | Sales Mentor | Performance analysis, strategies |
| `training` | Training Coach | Roleplay scenarios, feedback |
| `field` | Field Assistant | On-site support, quick solutions |
| `general` | General Assistant | Platform navigation |

**API Routes** (`server/routes/ai/index.ts`):
- `GET /api/ai/status` - Check AI availability
- `POST /api/ai/chat` - Chat completion
- `POST /api/ai/chat/stream` - Streaming chat
- `POST /api/ai/training/scenario` - Training roleplay
- `POST /api/ai/mentor` - Sales mentor

**Field Module Routes** (`server/routes/field/index.ts`):
- `POST /api/field/chat/:sessionId/message` - Chat with Susan
- `POST /api/field/documents/analyze` - Document analysis with AI
- `POST /api/field/images/analyze` - Roof image analysis with Gemini Vision
- `POST /api/field/email/generate` - AI-powered email generation
- `POST /api/field/reports/damage-assessment` - Generate damage assessment PDF
- `POST /api/field/reports/inspection` - Generate inspection report PDF

**Client UI**: `client/src/modules/field/ChatPage.tsx`
- Chat interface for talking to Susan
- Quick question suggestions
- Session history sidebar

---

### Agnes AI in Command Center

**Training Routes** (`server/routes/training/index.ts`):
- Uses `susanAI` service for AI responses
- Contains hardcoded scenario data (SCENARIOS object)
- Roleplay session management

**Key Endpoints**:
- `POST /api/training/roleplay/start` - Start roleplay session
- `POST /api/training/roleplay/:sessionId/message` - Send message in roleplay
- `GET /api/training/roleplay/sessions` - Get session history
- `GET /api/training/roleplay/sessions/:sessionId` - Get session details
- `POST /api/training/certificates/generate` - Generate training certificates

**Client Components**:
- `client/src/modules/training/RoleplayPage.tsx` - Main roleplay interface
- `client/src/modules/training/data/scenarios.ts` - Scenario definitions
- `client/src/modules/training/components/RoleplayChat.tsx` - Chat component

**13 Roleplay Scenarios** (adapted from Agnes-21):

**Insurance Division (10 scenarios)**:
| ID | Name | Difficulty | Door Slam |
|----|------|------------|-----------|
| `eager-learner` | The Eager Learner | BEGINNER | Infinity |
| `friendly-neighbor` | The Friendly Neighbor | ROOKIE | 5 |
| `busy-parent` | The Busy Parent | PRO | 3 |
| `skeptical-homeowner` | The Skeptic (Scam Victim) | VETERAN | 2 |
| `price-conscious` | Budget-Conscious Customer | PRO | 3 |
| `comparison-shopper` | The Comparison Shopper | VETERAN | 2 |
| `storm-chaser-victim` | Storm Chaser Victim | ELITE | 1 |
| `elderly-homeowner` | The Grateful Senior | ROOKIE | 5 |
| `diy-enthusiast` | The DIY Expert | ELITE | 2 |
| `emergency-repair` | Emergency Repair Needed | PRO | 3 |

**Retail Division (3 scenarios)**:
| ID | Name | Difficulty | Door Slam |
|----|------|------------|-----------|
| `eager-homeowner-retail` | The Eager Homeowner | BEGINNER | Infinity |
| `busy-professional-retail` | The Busy Professional | PRO | 3 |
| `not-interested-retail` | The Skeptic | ELITE | 2 |

**Scoring System**:
- Base score: 50 points
- +5 points per message (capped at +30)
- -10 points per mistake
- Difficulty multipliers for XP: BEGINNER=1.0, ROOKIE=1.2, PRO=1.5, VETERAN=2.0, ELITE=2.5

---

## Investigation Questions for Gemini

### For Susan (Gemini Field Assistant)

1. **Feature Comparison**: What features exist in the standalone Susan app that are NOT in the Command Center integration?
   - Check for: Chat history persistence, document upload/analysis, email templates
   - Look at: API routes, database schema, frontend features

2. **AI Configuration**: Does the standalone use different model settings (temperature, max tokens, system prompts)?

3. **Knowledge Base**: Does standalone Susan have additional roofing knowledge or training data?

4. **Mobile Features**: The standalone has Capacitor iOS support - what mobile-specific features exist?

5. **Admin Tools**: What admin functionality exists in standalone that Command Center is missing?

6. **Database Schema**: Compare the database schemas for chat sessions, user data, documents

### For Agnes (Agnes-21)

1. **Scenario Content**: Are there MORE scenarios in standalone Agnes than the 13 in Command Center?
   - Insurance Division: Check for additional scenarios
   - Retail Division: Check for more scenarios
   - Any other divisions?

2. **System Prompts**: Compare the roleplay system prompts - are they identical or has Agnes evolved?

3. **Scoring Algorithm**: Is the scoring system in standalone more sophisticated?
   - Mistake detection logic
   - Non-negotiables tracking
   - Performance feedback

4. **Gamification**: What gamification features exist in Agnes?
   - XP system
   - Achievements/badges
   - Leaderboards
   - Streaks

5. **PWA Features**: Agnes-21 is a PWA - what offline capabilities exist?

6. **UI/UX**: Compare the roleplay chat interface between standalone and Command Center

---

## Key Files in Command Center to Reference

```
# Susan AI Service
server/services/susan-ai.ts                    # Core AI service (520 lines)
server/routes/ai/index.ts                      # AI API routes
server/routes/field/index.ts                   # Field module routes (1907 lines)
client/src/modules/field/ChatPage.tsx          # Chat UI (428 lines)
docs/SUSAN_AI_IMPLEMENTATION.md                # Documentation

# Agnes Roleplay
server/routes/training/index.ts                # Training routes (1227 lines)
client/src/modules/training/RoleplayPage.tsx   # Roleplay UI (448 lines)
client/src/modules/training/data/scenarios.ts  # Scenario definitions (333 lines)

# Shared Constants
shared/constants.ts                            # Roles, modules, levels
shared/constants/achievements.ts               # Achievement definitions
```

---

## Environment Variables Used

### Susan (Command Center)
```bash
GOOGLE_GENAI_API_KEY    # Required for Gemini AI
```

### For Comparison
Check what env vars standalone apps use:
- API keys (Gemini, OpenAI, Groq?)
- Database connections
- Storage services (Vercel Blob, S3?)
- Email services

---

## Integration Opportunities to Identify

1. **Scenario Sync**: Can we auto-sync Agnes scenarios to Command Center?
2. **Feature Parity**: What standalone features should be ported?
3. **Shared Backend**: Could standalone apps use Command Center's API?
4. **Mobile App**: Should Command Center have Capacitor mobile support like Susan?
5. **SSO**: Single sign-on between apps?

---

## Deliverables Expected

After investigation, provide:

1. **Feature Matrix**: Side-by-side comparison of features
2. **Gap Analysis**: What Command Center is missing
3. **Architecture Comparison**: How the apps are structured differently
4. **Recommendations**: Priority features to port or sync
5. **Code Samples**: Key code differences to note

---

## Contact

This handoff prepared for Gemini CLI investigation.
Related to: roof-er-command-center HR module consolidation project.

---

*Generated: January 19, 2026*
