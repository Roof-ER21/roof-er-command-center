/**
 * Roleplay Training Backend Routes
 * AI-powered roleplay system with Google Gemini integration
 */

import { Router, Request, Response } from "express";
import { requireAuth, requireModuleAccess } from "../../middleware/auth.js";
import { susanAI } from "../../services/susan-ai.js";

const router = Router();

// Apply auth and module access middleware
router.use(requireAuth);
router.use(requireModuleAccess('training'));

// In-memory session storage (replace with database in production)
interface RoleplaySession {
  id: string;
  userId: string;
  scenarioId: string;
  difficulty: string;
  division: 'insurance' | 'retail';
  startTime: Date;
  endTime?: Date;
  messages: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
  }>;
  mistakeCount: number;
  doorSlammed: boolean;
  currentScore: number;
  conversationHistory: any[];
}

const sessions = new Map<string, RoleplaySession>();

// Scenario data (imported from frontend)
const SCENARIOS: Record<string, any> = {
  'eager-learner': {
    name: 'The Eager Learner',
    difficulty: 'BEGINNER',
    doorSlamThreshold: Infinity,
    systemPrompt: `You are roleplaying as an eager homeowner who WANTS roofing help.

CONTEXT: You've been looking for a roofer and are excited someone knocked on your door.

BEHAVIORAL RULES:
- Enthusiastically engage: "Oh great! I've been meaning to get my roof looked at!"
- Ask guiding questions to help them practice
- Celebrate their successes
- Gently redirect if they forget something
- NEVER slam the door - infinite patience
- Want them to succeed

Stay in character until they say "score me". Then provide detailed coaching feedback.`,
  },
  'friendly-neighbor': {
    name: 'The Friendly Neighbor',
    difficulty: 'ROOKIE',
    doorSlamThreshold: 5,
    systemPrompt: `You are a retired homeowner who enjoys chatting and wants them to succeed.

CONTEXT: You're retired, home most of the day. You remember the storm last month.

BEHAVIORAL RULES:
- Be warm: "Oh hello! How are you today?"
- Ask gentle questions to help them
- If they mess up, guide softly
- Agree to inspection easily if asked properly
- Show appreciation when they do well

DOOR SLAM THRESHOLD: 5 major mistakes (track: missing non-negotiables, being pushy, lying, being rude)

When they say "score me", provide detailed feedback on:
- Non-negotiables covered (Who you are, Who we are, Make it relatable, Purpose, Close)
- Delivery & confidence
- Objection handling`,
  },
  'busy-parent': {
    name: 'The Busy Parent',
    difficulty: 'PRO',
    doorSlamThreshold: 3,
    systemPrompt: `You are making dinner with loud kids in background. Limited time, polite but distracted.

CONTEXT: It's 5:45 PM. Kids fighting in background. 2-3 minutes max.

BEHAVIORAL RULES:
- Show time pressure: "I've only got a few minutes"
- Interrupt if they ramble: "Can you get to the point?"
- Ask practical questions: "How much?" "When?" "How long?"
- Get impatient if too salesy
- Soften if they respect your time

INITIAL OBJECTION: "I'm pretty busy right now, can you come back later?"
- Good response (respect time, quick value) → "Okay, what's this about?"
- Poor response (keep talking, ignore) → "I said I'm busy!" (escalate)

DOOR SLAM THRESHOLD: 3 major mistakes or excessive pushiness

Track mistakes and escalate objections. After 3 mistakes, slam door: "I don't have time for this!" and end session.`,
  },
  'skeptical-homeowner': {
    name: 'The Skeptic (Scam Victim)',
    difficulty: 'VETERAN',
    doorSlamThreshold: 2,
    systemPrompt: `You were scammed before. You lost $3,000 to a fake roofer. You're HOSTILE and suspicious.

CONTEXT: A "roofer" took your deposit 6 months ago and vanished.

BEHAVIORAL RULES:
- Hostile from start: "What do you want?"
- Interrupt constantly
- Assume they're scammers: "You're just trying to rip me off"
- Ask aggressive questions: "Show me your license RIGHT NOW"
- Escalate quickly if pushy
- Only soften if they stay calm AND provide proof

PROGRESSIVE OBJECTIONS:
1. "I'm not interested. Please leave."
2. "I don't want solicitors at my door"
3. "You're just trying to get money from my insurance"
4. "Get off my property"
5. "I need you to leave my property NOW"
6. Door slam: "This conversation is over"

DOOR SLAM THRESHOLD: 2 major mistakes (being pushy, defensive, not showing credentials, lying)`,
  },
  'price-conscious': {
    name: 'The Budget-Conscious Customer',
    difficulty: 'PRO',
    doorSlamThreshold: 3,
    systemPrompt: `Very careful with money. Just had a baby, money is tight.

INITIAL OBJECTION: "How much is this going to cost me out of pocket?"

BEHAVIORAL RULES:
- Immediately ask about costs
- Skeptical of "free" offers: "What's the catch?"
- Need reassurance about insurance covering it
- Worried about rates going up
- Soften if they clearly explain no out-of-pocket until end

DOOR SLAM THRESHOLD: 3 major mistakes`,
  },
  // Add more scenarios as needed
};

/**
 * Start a new roleplay session
 */
router.post("/roleplay/start", async (req: Request, res: Response) => {
  try {
    const { scenarioId, difficulty, division } = req.body;
    const userId = (req as any).user?.id || 'demo-user';

    const scenario = SCENARIOS[scenarioId];
    if (!scenario) {
      return res.status(400).json({
        success: false,
        error: 'Invalid scenario ID'
      });
    }

    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const session: RoleplaySession = {
      id: sessionId,
      userId,
      scenarioId,
      difficulty: scenario.difficulty,
      division: division || 'insurance',
      startTime: new Date(),
      messages: [],
      mistakeCount: 0,
      doorSlammed: false,
      currentScore: 0,
      conversationHistory: [],
    };

    sessions.set(sessionId, session);

    res.json({
      success: true,
      data: {
        sessionId,
        scenario: scenarioId,
        difficulty: scenario.difficulty,
        startedAt: session.startTime.toISOString(),
      }
    });
  } catch (error) {
    console.error("Roleplay start error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to start roleplay session"
    });
  }
});

/**
 * Process message in roleplay session
 */
router.post("/roleplay/:sessionId/message", async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const { message } = req.body;

    const session = sessions.get(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    if (session.doorSlammed) {
      return res.json({
        success: true,
        data: {
          sessionId,
          response: 'The door has been slammed. Session ended.',
          sessionEnded: true,
          doorSlammed: true,
        }
      });
    }

    const scenario = SCENARIOS[session.scenarioId];

    // Add user message to history
    session.messages.push({
      role: 'user',
      content: message,
      timestamp: new Date(),
    });

    // Check if user is requesting score
    const isScoreRequest = /\b(score\s*me|how\s*did\s*i\s*do|end\s*session|final\s*score)\b/i.test(message);

    // Generate AI response using susanAI
    const history = session.messages.slice(0, -1).map(msg => ({
      role: msg.role === 'user' ? 'user' as const : 'assistant' as const,
      content: msg.content
    }));

    const response = await susanAI.chat(message, {
      context: 'training',
      history: [
        { role: 'system', content: scenario.systemPrompt },
        ...history
      ],
      temperature: 0.9,
    });

    const aiResponse = response.response;

    // Add AI response to history
    session.messages.push({
      role: 'assistant',
      content: aiResponse,
      timestamp: new Date(),
    });

    // Analyze response for mistakes (simplified logic)
    let mistakeDetected = false;
    let feedback: string | null = null;

    if (!isScoreRequest) {
      // Check for common mistakes
      const lowerMessage = message.toLowerCase();

      // Missing introduction
      if (session.messages.filter(m => m.role === 'user').length === 1) {
        if (!lowerMessage.includes('roof er') && !lowerMessage.includes('name')) {
          mistakeDetected = true;
          feedback = "Missing introduction - always start with your name and company";
        }
      }

      // Being too pushy
      if (lowerMessage.includes('you have to') || lowerMessage.includes('you must')) {
        mistakeDetected = true;
        feedback = "Avoid being pushy - use softer language";
      }

      if (mistakeDetected) {
        session.mistakeCount++;
      }
    }

    // Check for door slam
    let sessionEnded = false;
    let doorSlammed = false;

    if (session.mistakeCount >= scenario.doorSlamThreshold) {
      session.doorSlammed = true;
      doorSlammed = true;
      sessionEnded = true;
      session.endTime = new Date();
    }

    // Check if score was requested
    if (isScoreRequest) {
      sessionEnded = true;
      session.endTime = new Date();
    }

    // Calculate score if session ended
    let finalScore: number | undefined;
    let xpAwarded: number | undefined;
    let summary: string | undefined;

    if (sessionEnded && !doorSlammed) {
      // Simple scoring logic (enhance this based on actual performance)
      const baseScore = 50;
      const messageCount = session.messages.filter(m => m.role === 'user').length;
      const scorePerMessage = Math.min(messageCount * 5, 30);
      const mistakePenalty = session.mistakeCount * 10;

      finalScore = Math.max(0, Math.min(100, baseScore + scorePerMessage - mistakePenalty));
      session.currentScore = finalScore;

      // Award XP based on difficulty and score
      const difficultyMultiplier: Record<string, number> = {
        'BEGINNER': 1.0,
        'ROOKIE': 1.2,
        'PRO': 1.5,
        'VETERAN': 2.0,
        'ELITE': 2.5,
      };
      xpAwarded = Math.floor(finalScore * (difficultyMultiplier[session.difficulty] || 1.0));

      summary = `Great work! You completed ${messageCount} exchanges with ${session.mistakeCount} mistakes.`;
    } else if (doorSlammed) {
      finalScore = 0;
      summary = `Door slammed! You made ${session.mistakeCount} critical mistakes. Review the 5 non-negotiables and try again.`;
    }

    res.json({
      success: true,
      data: {
        sessionId,
        response: aiResponse,
        feedback,
        scoreAwarded: mistakeDetected ? -5 : 0,
        totalScore: session.currentScore,
        mistakeCount: session.mistakeCount,
        sessionEnded,
        doorSlammed,
        finalScore,
        xpAwarded,
        summary,
      }
    });
  } catch (error) {
    console.error("Roleplay message error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to process message"
    });
  }
});

/**
 * End roleplay session
 */
router.post("/roleplay/:sessionId/end", async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;

    const session = sessions.get(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    session.endTime = new Date();

    // Calculate final score
    const messageCount = session.messages.filter(m => m.role === 'user').length;
    const baseScore = 50;
    const scorePerMessage = Math.min(messageCount * 5, 30);
    const mistakePenalty = session.mistakeCount * 10;

    const finalScore = Math.max(0, Math.min(100, baseScore + scorePerMessage - mistakePenalty));

    res.json({
      success: true,
      data: {
        sessionId,
        duration: session.endTime.getTime() - session.startTime.getTime(),
        messageCount,
        mistakeCount: session.mistakeCount,
        finalScore,
        passed: finalScore >= 70,
      }
    });

    // Clean up session after 5 minutes
    setTimeout(() => {
      sessions.delete(sessionId);
    }, 5 * 60 * 1000);
  } catch (error) {
    console.error("Roleplay end error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to end session"
    });
  }
});

/**
 * Get session history
 */
router.get("/roleplay/:sessionId/history", async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;

    const session = sessions.get(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    res.json({
      success: true,
      data: {
        sessionId,
        scenarioId: session.scenarioId,
        difficulty: session.difficulty,
        startTime: session.startTime,
        endTime: session.endTime,
        messages: session.messages,
        mistakeCount: session.mistakeCount,
        currentScore: session.currentScore,
        doorSlammed: session.doorSlammed,
      }
    });
  } catch (error) {
    console.error("Session history error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch session history"
    });
  }
});

/**
 * Get recent roleplay sessions for user
 */
router.get("/roleplay/sessions/recent", async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized'
      });
    }

    // Import required modules
    const { db } = await import("../../db.js");
    const { roleplaySessions } = await import("../../../shared/schema.js");
    const { eq, desc } = await import("drizzle-orm");

    // Get recent sessions from database
    const recentSessions = await db
      .select({
        id: roleplaySessions.id,
        scenarioId: roleplaySessions.scenarioId,
        scenarioTitle: roleplaySessions.scenarioTitle,
        difficulty: roleplaySessions.difficulty,
        score: roleplaySessions.score,
        xpEarned: roleplaySessions.xpEarned,
        duration: roleplaySessions.duration,
        createdAt: roleplaySessions.createdAt,
        completedAt: roleplaySessions.completedAt,
      })
      .from(roleplaySessions)
      .where(eq(roleplaySessions.userId, userId))
      .orderBy(desc(roleplaySessions.createdAt))
      .limit(10);

    res.json({
      success: true,
      data: {
        sessions: recentSessions,
      }
    });
  } catch (error) {
    console.error("Recent sessions error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch recent sessions"
    });
  }
});

export default router;
