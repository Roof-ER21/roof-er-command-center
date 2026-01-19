import { Router, Request, Response } from "express";
import { requireAuth, requireModuleAccess } from "../../middleware/auth.js";
import { susanAI } from "../../services/susan-ai.js";
import { db } from "../../db.js";
import {
  trainingModules,
  trainingProgress,
  users,
  achievements,
  userAchievements,
  trainingStreaks,
  roleplaySessions,
  trainingCertificates,
  insertTrainingCertificateSchema
} from "../../../shared/schema.js";
import { eq, desc, and, sql } from "drizzle-orm";
import { randomUUID } from "crypto";
import { broadcastTrainingMilestone } from "../../utils/achievement-broadcaster.js";
import { selectUserColumns } from "../../utils/user-select.js";

const router = Router();

// Scenario data for Agnes Roleplay
const SCENARIOS: Record<string, any> = {
  // --- Insurance Division ---
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
  'comparison-shopper': {
    name: 'The Comparison Shopper',
    difficulty: 'VETERAN',
    doorSlamThreshold: 2,
    systemPrompt: `You are getting multiple quotes and will challenge every claim.

CONTEXT: You've already gotten 2 other quotes. Looking for best value, not just lowest price.

BEHAVIORAL RULES:
- Constantly compare to "ABC Roofing" (a competitor)
- Ask "Why should I choose you?"
- Be skeptical of claims without proof
- Focus on value, warranty, and trust
- Soften only if they differentiate themselves effectively

INITIAL OBJECTION: "I've already gotten 2 other quotes. Why are you different?"

DOOR SLAM THRESHOLD: 2 major mistakes (badmouthing competition, vague answers)`,
  },
  'storm-chaser-victim': {
    name: 'Storm Chaser Victim',
    difficulty: 'ELITE',
    doorSlamThreshold: 1,
    systemPrompt: `You had a bad experience with storm chasers. You trust NO ONE.

CONTEXT: Previous contractor did shoddy work after a storm. You are extremely cautious and aggressive.

BEHAVIORAL RULES:
- Accuse them of being a "storm chaser"
- Demand to see license and insurance immediately
- Threaten to call the BBB or police if they are pushy
- Zero tolerance for sales tactics
- Only soften with extreme professionalism and local proof

INITIAL OBJECTION: "Are you one of those storm chasers? I'm not falling for that again."

DOOR SLAM THRESHOLD: 1 major mistake (any hesitation, sales pressure, or lack of proof)`,
  },
  'elderly-homeowner': {
    name: 'The Grateful Senior',
    difficulty: 'ROOKIE',
    doorSlamThreshold: 5,
    systemPrompt: `You are an elderly homeowner (70+) who needs things explained simply and clearly.

CONTEXT: You live alone, appreciate patience, but are worried about safety.

BEHAVIORAL RULES:
- Speak slowly and ask them to speak up
- Ask "Is this safe?" and "Do I have to pay today?"
- Get confused by technical jargon
- Appreciate kindness and respect
- Soften when they show genuine care

INITIAL OBJECTION: "I'm sorry, what did you say? Could you speak up a little?"

DOOR SLAM THRESHOLD: 5 major mistakes (speaking too fast, being rude, using complex jargon)`,
  },
  'diy-enthusiast': {
    name: 'The DIY Expert',
    difficulty: 'ELITE',
    doorSlamThreshold: 2,
    systemPrompt: `You think you know more than the sales rep because you did "research" online.

CONTEXT: You've watched YouTube videos and think you're an expert. You challenge their expertise.

BEHAVIORAL RULES:
- Correct them (even if you're wrong): "Actually, that's not how insurance works"
- Claim you can do it yourself for cheaper
- Ask technical "gotcha" questions
- Only soften if they demonstrate superior technical knowledge humbly

INITIAL OBJECTION: "I've already researched this. I know how insurance works and I can handle it."

DOOR SLAM THRESHOLD: 2 major mistakes (arguing aggressively, lack of product knowledge)`,
  },
  'emergency-repair': {
    name: 'Emergency Repair Needed',
    difficulty: 'PRO',
    doorSlamThreshold: 3,
    systemPrompt: `Your roof is leaking RIGHT NOW. You are stressed and need help immediately.

CONTEXT: Active leak in the living room. You have no patience for a sales pitch.

BEHAVIORAL RULES:
- Interrupt any "pitch" with "Can you fix the leak??"
- Demand immediate action/timeline
- Ask about cost immediately
- Get angry if they waste time
- Soften if they prioritize the emergency

INITIAL OBJECTION: "My roof is leaking RIGHT NOW. Can you help or not?"

DOOR SLAM THRESHOLD: 3 major mistakes (ignoring the emergency, long intro)`,
  },

  // --- Retail Division ---
  'eager-homeowner-retail': {
    name: 'The Eager Homeowner (Retail)',
    difficulty: 'BEGINNER',
    doorSlamThreshold: Infinity,
    systemPrompt: `You are a homeowner interested in home improvements.

CONTEXT: You've been thinking about updating your home (windows/roof) for a while.

BEHAVIORAL RULES:
- Be friendly and open
- "Oh, you do windows? I've been meaning to look into that!"
- Ask simple questions
- Agree to a quote easily
- Infinite patience for mistakes

DOOR SLAM THRESHOLD: Infinity (Never slam)`,
  },
  'busy-professional-retail': {
    name: 'The Busy Professional (Retail)',
    difficulty: 'PRO',
    doorSlamThreshold: 3,
    systemPrompt: `You just got home from work. You are protective of your evening time.

CONTEXT: It's 5:45 PM. You have emails to check and dinner to make.

BEHAVIORAL RULES:
- "I'm really busy right now."
- Be curt and direct
- "Can you get to the point?"
- "I don't have time for a presentation"
- Soften only for a quick, efficient value proposition

DOOR SLAM THRESHOLD: 3 major mistakes (wasting time, slow speech)`,
  },
  'not-interested-retail': {
    name: 'The Skeptic (Retail)',
    difficulty: 'ELITE',
    doorSlamThreshold: 2,
    systemPrompt: `You've been burned by contractors before. You do NOT do business at the door.

CONTEXT: A previous contractor took a deposit and did poor work. You are hostile.

BEHAVIORAL RULES:
- "I'm not interested."
- "I don't do business at the door."
- "How do I know you're legitimate?"
- Threaten to call the HOA if they persist
- Only soften for extreme professionalism and proof of local work

DOOR SLAM THRESHOLD: 2 major mistakes (pushing after "no", lack of credentials)`,
  },
};

// Public routes (no auth required) - must come BEFORE auth middleware
// Verify certificate (public endpoint)
router.get("/certificates/:certificateId/verify", async (req: Request, res: Response) => {
  try {
    const { certificateId } = req.params;

    const [certificate] = await db
      .select()
      .from(trainingCertificates)
      .where(eq(trainingCertificates.certificateId, certificateId))
      .limit(1);

    if (!certificate) {
      return res.status(404).json({
        success: false,
        error: "Certificate not found",
        valid: false
      });
    }

    // Get user data
    const [user] = await db
      .select(selectUserColumns())
      .from(users)
      .where(eq(users.id, certificate.userId))
      .limit(1);

    // Check if expired
    const isExpired = certificate.expiresAt && new Date(certificate.expiresAt) < new Date();

    res.json({
      success: true,
      valid: !isExpired,
      data: {
        certificateId: certificate.certificateId,
        title: certificate.title,
        description: certificate.description,
        type: certificate.certificateType,
        recipientName: user ? `${user.firstName} ${user.lastName}` : 'Unknown',
        recipientEmail: user?.email,
        score: certificate.score,
        issuedAt: certificate.issuedAt,
        expiresAt: certificate.expiresAt,
        isExpired,
        metadata: certificate.metadata
      }
    });
  } catch (error) {
    console.error("Certificate verification error:", error);
    res.status(500).json({ success: false, error: "Failed to verify certificate" });
  }
});

// Apply auth and module access middleware to all routes below
router.use(requireAuth);
router.use(requireModuleAccess('training'));

// Get training dashboard
router.get("/dashboard", async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    // Get user stats
    const [user] = await db.select(selectUserColumns()).from(users).where(eq(users.id, userId));
    const [streak] = await db.select().from(trainingStreaks).where(eq(trainingStreaks.userId, userId));
    
    // Get completion stats
    const completedCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(trainingProgress)
      .where(and(
        eq(trainingProgress.userId, userId),
        eq(trainingProgress.status, 'completed')
      ));

    const totalModules = await db
      .select({ count: sql<number>`count(*)` })
      .from(trainingModules)
      .where(eq(trainingModules.isActive, true));

    const unlockedAchievements = await db
      .select({ count: sql<number>`count(*)` })
      .from(userAchievements)
      .where(eq(userAchievements.userId, userId));

    // Calculate average score from roleplay sessions
    const roleplayScores = await db
      .select({ score: roleplaySessions.score })
      .from(roleplaySessions)
      .where(and(
        eq(roleplaySessions.userId, userId),
        sql`${roleplaySessions.score} IS NOT NULL`
      ));

    const avgScore = roleplayScores.length > 0
      ? Math.round(roleplayScores.reduce((sum, s) => sum + (s.score || 0), 0) / roleplayScores.length)
      : 0;

    res.json({
      success: true,
      data: {
        totalXp: user?.totalXp || 0,
        level: user?.trainingLevel || "beginner",
        currentStreak: streak?.currentStreak || 0,
        completedModules: Number(completedCount[0]?.count || 0),
        totalModules: Number(totalModules[0]?.count || 0),
        achievements: Number(unlockedAchievements[0]?.count || 0),
        avgScore: avgScore,
        totalSessions: roleplayScores.length,
      }
    });
  } catch (error) {
    console.error("Training dashboard error:", error);
    res.status(500).json({ success: false, error: "Failed to fetch dashboard" });
  }
});

// Get curriculum progress
router.get("/curriculum", async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    // Get all modules and user progress
    const modules = await db
      .select()
      .from(trainingModules)
      .where(eq(trainingModules.isActive, true))
      .orderBy(trainingModules.order);

    const progress = await db
      .select()
      .from(trainingProgress)
      .where(eq(trainingProgress.userId, userId));

    // Map progress to modules
    const curriculum = modules.map(module => {
      const userProgress = progress.find(p => p.moduleId === module.id);
      return {
        id: module.id,
        title: module.title,
        description: module.description,
        type: module.type,
        completed: userProgress?.status === 'completed',
        score: userProgress?.score || null,
        xpReward: module.xpReward,
        estimatedMinutes: module.estimatedMinutes,
        difficulty: module.difficulty
      };
    });

    res.json({
      success: true,
      data: {
        modules: curriculum,
      }
    });
  } catch (error) {
    console.error("Curriculum error:", error);
    res.status(500).json({ success: false, error: "Failed to fetch curriculum" });
  }
});

// Get achievements
router.get("/achievements", async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    // Get all achievements
    const allAchievements = await db
      .select()
      .from(achievements)
      .where(eq(achievements.isActive, true));

    // Get user's unlocked achievements
    const unlocked = await db
      .select({
        achievementId: userAchievements.achievementId,
        unlockedAt: userAchievements.unlockedAt
      })
      .from(userAchievements)
      .where(eq(userAchievements.userId, userId));

    const unlockedIds = new Set(unlocked.map(u => u.achievementId));

    const unlockedData = allAchievements
      .filter(a => unlockedIds.has(a.id))
      .map(a => ({
        ...a,
        unlockedAt: unlocked.find(u => u.achievementId === a.id)?.unlockedAt
      }));

    const availableData = allAchievements
      .filter(a => !unlockedIds.has(a.id));

    res.json({
      success: true,
      data: {
        unlocked: unlockedData,
        available: availableData,
      }
    });
  } catch (error) {
    console.error("Achievements error:", error);
    res.status(500).json({ success: false, error: "Failed to fetch achievements" });
  }
});

// Mark module as complete and award XP
router.post("/modules/:moduleId/complete", async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const moduleId = parseInt(req.params.moduleId);
    const { score, xpReward = 100 } = req.body;

    if (isNaN(moduleId)) {
      return res.status(400).json({ success: false, error: "Invalid module ID" });
    }

    // Check if already completed
    const existing = await db
      .select()
      .from(trainingProgress)
      .where(and(
        eq(trainingProgress.userId, userId),
        eq(trainingProgress.moduleId, moduleId)
      ))
      .limit(1);

    if (existing.length > 0 && existing[0].status === 'completed') {
      return res.json({
        success: true,
        data: {
          message: "Module already completed",
          alreadyCompleted: true,
          xpAwarded: 0,
        }
      });
    }

    // Create or update progress record
    if (existing.length > 0) {
      await db
        .update(trainingProgress)
        .set({
          status: 'completed',
          score: score || null,
          completedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(and(
          eq(trainingProgress.userId, userId),
          eq(trainingProgress.moduleId, moduleId)
        ));
    } else {
      await db
        .insert(trainingProgress)
        .values({
          userId,
          moduleId,
          status: 'completed',
          score: score || null,
          completedAt: new Date(),
        });
    }

    // Award XP to user
    const [user] = await db
      .select(selectUserColumns())
      .from(users)
      .where(eq(users.id, userId));

    const currentXP = user?.totalXp || 0;
    const newTotalXP = currentXP + xpReward;

    // Calculate new level (using simple formula: level = floor(sqrt(XP/100)) + 1)
    const newLevel = Math.floor(Math.sqrt(newTotalXP / 100)) + 1;
    const leveledUp = newLevel > (user?.currentLevel || 1);

    await db
      .update(users)
      .set({
        totalXp: newTotalXP,
        currentLevel: newLevel,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    // Update streak
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [streak] = await db
      .select()
      .from(trainingStreaks)
      .where(eq(trainingStreaks.userId, userId))
      .limit(1);

    if (streak) {
      const lastActivity = new Date(streak.lastActivityDate);
      lastActivity.setHours(0, 0, 0, 0);

      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      let newStreak = streak.currentStreak;
      if (lastActivity.getTime() === yesterday.getTime()) {
        newStreak += 1;
      } else if (lastActivity.getTime() < yesterday.getTime()) {
        newStreak = 1; // Streak broken
      }

      await db
        .update(trainingStreaks)
        .set({
          currentStreak: newStreak,
          longestStreak: Math.max(streak.longestStreak, newStreak),
          lastActivityDate: today,
          updatedAt: new Date(),
        })
        .where(eq(trainingStreaks.userId, userId));
    } else {
      await db
        .insert(trainingStreaks)
        .values({
          userId,
          currentStreak: 1,
          longestStreak: 1,
          lastActivityDate: today,
          freezesAvailable: 0,
        });
    }

    res.json({
      success: true,
      data: {
        moduleId,
        xpAwarded: xpReward,
        totalXP: newTotalXP,
        currentLevel: newLevel,
        leveledUp,
        message: `Module completed! You earned ${xpReward} XP`,
      }
    });
  } catch (error) {
    console.error("Module completion error:", error);
    res.status(500).json({ success: false, error: "Failed to complete module" });
  }
});

// Start roleplay session
router.post("/roleplay/start", async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { scenarioId, scenarioTitle, difficulty } = req.body;

    if (!scenarioId || !scenarioTitle || !difficulty) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: scenarioId, scenarioTitle, difficulty"
      });
    }

    // Validate scenario
    const scenario = SCENARIOS[scenarioId];
    // If not in our list, we might still allow it if it's a dynamic one, but for now lets warn or default
    // We'll proceed but rely on the provided info if SCENARIOS[scenarioId] is missing,
    // though preferably we should enforce it if we want the specific personas.
    
    // Create session ID
    const sessionId = `session_${Date.now()}_${userId}`;

    // Insert into database
    await db.insert(roleplaySessions).values({
      userId,
      scenarioId,
      scenarioTitle,
      difficulty: difficulty as 'BEGINNER' | 'ROOKIE' | 'PRO' | 'ELITE' | 'NIGHTMARE',
      messages: [],
      score: 0,
      xpEarned: 0,
      // Initialize state in feedback field since we don't have dedicated columns yet
      feedback: { 
        mistakeCount: 0, 
        doorSlammed: false,
        doorSlamThreshold: scenario?.doorSlamThreshold || Infinity 
      }, 
    });

    res.json({
      success: true,
      data: {
        sessionId,
        message: "Session initialized"
      }
    });
  } catch (error) {
    console.error("Roleplay start error:", error);
    res.status(500).json({ success: false, error: "Failed to start roleplay" });
  }
});

// Submit roleplay message
router.post("/roleplay/:sessionId/message", async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { sessionId } = req.params;
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ success: false, error: "Message is required" });
    }

    // Extract numeric ID from sessionId (format: session_timestamp_userId)
    const sessionTimestamp = sessionId.split('_')[1];

    // Find the session in database
    const [session] = await db
      .select()
      .from(roleplaySessions)
      .where(
        and(
          eq(roleplaySessions.userId, userId),
          sql`${roleplaySessions.createdAt}::text LIKE ${`%${sessionTimestamp}%`}`
        )
      )
      .orderBy(desc(roleplaySessions.createdAt))
      .limit(1);

    if (!session) {
      return res.status(404).json({ success: false, error: "Session not found" });
    }

    // Retrieve state from feedback (or initialize if missing)
    let sessionState = (session.feedback as any) || { mistakeCount: 0, doorSlammed: false };
    
    if (sessionState.doorSlammed) {
      return res.json({
        success: true,
        data: {
          response: 'The door has been slammed. Session ended.',
          sessionEnded: true,
          doorSlammed: true,
          mistakeCount: sessionState.mistakeCount
        }
      });
    }

    // Get scenario details
    const scenario = SCENARIOS[session.scenarioId] || {
      systemPrompt: `You are a homeowner in a training scenario. Current difficulty: ${session.difficulty}.`,
      doorSlamThreshold: Infinity
    };

    // Get existing messages
    const existingMessages = (session.messages as Array<{role: "user" | "assistant" | "system"; content: string; timestamp: Date}>) || [];

    // Check if user is requesting score
    const isScoreRequest = /\b(score\s*me|how\s*did\s*i\s*do|end\s*session|final\s*score)\b/i.test(message);

    // Call Susan AI with training context and SPECIFIC scenario prompt
    const aiResponse = await susanAI.chat(message, {
      context: "training",
      history: [
        { role: 'system', content: scenario.systemPrompt },
        ...existingMessages.map(m => ({ role: m.role as "user" | "assistant" | "system", content: m.content }))
      ],
      temperature: 0.9 // Higher temperature for more natural/varied roleplay responses
    });

    // Add new messages
    const newMessages = [
      ...existingMessages,
      { role: "user", content: message, timestamp: new Date() },
      { role: "assistant", content: aiResponse.response, timestamp: new Date() }
    ];

    // --- Mistake Detection Logic ---
    let mistakeDetected = false;
    let feedbackMsg: string | null = null;

    if (!isScoreRequest) {
      const lowerMessage = message.toLowerCase();

      // Simple heuristic checks (can be enhanced with AI analysis later)
      
      // 1. Missing introduction (only check on first message)
      if (existingMessages.filter(m => m.role === 'user').length === 0) {
        if (!lowerMessage.includes('roof er') && !lowerMessage.includes('name') && !lowerMessage.includes('my name is')) {
          mistakeDetected = true;
          feedbackMsg = "Missing introduction - always start with your name and company";
        }
      }

      // 2. Being too pushy
      if (lowerMessage.includes('you have to') || lowerMessage.includes('you must') || lowerMessage.includes('sign here')) {
        mistakeDetected = true;
        feedbackMsg = "Avoid being pushy - use softer language like 'recommend' or 'suggest'";
      }

      if (mistakeDetected) {
        sessionState.mistakeCount = (sessionState.mistakeCount || 0) + 1;
      }
    }

    // --- Door Slam Logic ---
    let sessionEnded = false;
    let doorSlammed = false;
    const threshold = scenario.doorSlamThreshold || Infinity;

    if (sessionState.mistakeCount >= threshold) {
      doorSlammed = true;
      sessionEnded = true;
      sessionState.doorSlammed = true;
    }

    if (isScoreRequest) {
      sessionEnded = true;
    }

    // --- Scoring Logic ---
    let finalScore = session.score || 0;
    let xpAwarded = 0;
    let summary: string | undefined;

    if (sessionEnded) {
        const baseScore = 50;
        const messageCount = newMessages.filter(m => m.role === 'user').length;
        // Cap message score contribution
        const scorePerMessage = Math.min(messageCount * 5, 30); 
        const mistakePenalty = sessionState.mistakeCount * 10;

        finalScore = Math.max(0, Math.min(100, baseScore + scorePerMessage - mistakePenalty));
        
        if (doorSlammed) {
            finalScore = 0; // Automatic fail on door slam
            summary = `Door slammed! You made ${sessionState.mistakeCount} critical mistakes.`;
        } else {
            // Difficulty multiplier for XP
            const difficultyMultiplier: Record<string, number> = {
                'BEGINNER': 1.0,
                'ROOKIE': 1.2,
                'PRO': 1.5,
                'VETERAN': 2.0,
                'ELITE': 2.5,
            };
            const multiplier = difficultyMultiplier[session.difficulty] || 1.0;
            xpAwarded = Math.floor(finalScore * multiplier);
            summary = `Session complete. Final Score: ${finalScore}.`;
        }
    } else {
        // Intermediate score
        finalScore = Math.max(0, 50 + (newMessages.length / 2 * 2) - ((sessionState.mistakeCount || 0) * 5));
    }

    // Update session in database
    await db
      .update(roleplaySessions)
      .set({
        messages: newMessages,
        score: finalScore,
        feedback: sessionState, // Persist state
        completedAt: sessionEnded ? new Date() : null,
        duration: sessionEnded ? Math.floor((new Date().getTime() - session.createdAt.getTime()) / 1000) : null,
        xpEarned: sessionEnded ? xpAwarded : (session.xpEarned || 0)
      })
      .where(eq(roleplaySessions.id, session.id));

    // Broadcast XP achievement if session ended successfully
    if (sessionEnded && xpAwarded > 0 && !doorSlammed) {
      const user = (req as any).user;
      if (user) {
        broadcastTrainingMilestone({
          userId: user.id,
          userName: `${user.firstName} ${user.lastName}`,
          milestoneType: 'xp',
          value: xpAwarded,
          title: `🎭 Roleplay Complete!`,
          description: `Earned ${xpAwarded} XP in "${scenario.name}"`
        });
      }
    }

    res.json({
      success: true,
      data: {
        response: aiResponse.response,
        feedback: feedbackMsg || (mistakeDetected ? "Mistake detected" : "Good response"),
        scoreAwarded: mistakeDetected ? -10 : 5,
        totalScore: finalScore,
        mistakeCount: sessionState.mistakeCount,
        sessionEnded,
        doorSlammed,
        finalScore: sessionEnded ? finalScore : undefined,
        xpAwarded: sessionEnded ? xpAwarded : undefined,
        summary
      }
    });
  } catch (error) {
    console.error("Roleplay message error:", error);
    res.status(500).json({ success: false, error: "Failed to process message" });
  }
});

// Get recent roleplay sessions
router.get("/roleplay/sessions/recent", async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const limit = 5; // Default for recent

    const sessions = await db
      .select()
      .from(roleplaySessions)
      .where(eq(roleplaySessions.userId, userId))
      .orderBy(desc(roleplaySessions.createdAt))
      .limit(limit);

    res.json({
      success: true,
      data: {
        sessions: sessions.map(s => ({
          id: s.id,
          sessionId: `session_${new Date(s.createdAt).getTime()}_${userId}`,
          scenarioId: s.scenarioId,
          scenarioTitle: s.scenarioTitle,
          difficulty: s.difficulty,
          score: s.score,
          messageCount: Array.isArray(s.messages) ? s.messages.length : 0,
          xpEarned: s.xpEarned,
          duration: s.duration,
          createdAt: s.createdAt,
          completedAt: s.completedAt,
          isActive: !s.completedAt
        })),
        total: sessions.length
      }
    });
  } catch (error) {
    console.error("Get recent roleplay sessions error:", error);
    res.status(500).json({ success: false, error: "Failed to fetch recent sessions" });
  }
});

// Get roleplay session history
router.get("/roleplay/sessions", async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { limit = 10, offset = 0 } = req.query;

    const sessions = await db
      .select()
      .from(roleplaySessions)
      .where(eq(roleplaySessions.userId, userId))
      .orderBy(desc(roleplaySessions.createdAt))
      .limit(Number(limit))
      .offset(Number(offset));

    res.json({
      success: true,
      data: {
        sessions: sessions.map(s => ({
          id: s.id,
          sessionId: `session_${new Date(s.createdAt).getTime()}_${userId}`,
          scenarioId: s.scenarioId,
          scenarioTitle: s.scenarioTitle,
          difficulty: s.difficulty,
          score: s.score,
          messageCount: Array.isArray(s.messages) ? s.messages.length : 0,
          xpEarned: s.xpEarned,
          duration: s.duration,
          createdAt: s.createdAt,
          completedAt: s.completedAt,
          isActive: !s.completedAt
        })),
        total: sessions.length
      }
    });
  } catch (error) {
    console.error("Get roleplay sessions error:", error);
    res.status(500).json({ success: false, error: "Failed to fetch sessions" });
  }
});

// Get specific roleplay session details
router.get("/roleplay/sessions/:sessionId", async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { sessionId } = req.params;

    // Extract timestamp from sessionId
    const sessionTimestamp = sessionId.split('_')[1];

    const [session] = await db
      .select()
      .from(roleplaySessions)
      .where(
        and(
          eq(roleplaySessions.userId, userId),
          sql`${roleplaySessions.createdAt}::text LIKE ${`%${sessionTimestamp}%`}`
        )
      )
      .orderBy(desc(roleplaySessions.createdAt))
      .limit(1);

    if (!session) {
      return res.status(404).json({ success: false, error: "Session not found" });
    }

    res.json({
      success: true,
      data: {
        id: session.id,
        sessionId: `session_${new Date(session.createdAt).getTime()}_${userId}`,
        scenarioId: session.scenarioId,
        scenarioTitle: session.scenarioTitle,
        difficulty: session.difficulty,
        messages: session.messages,
        score: session.score,
        feedback: session.feedback,
        duration: session.duration,
        xpEarned: session.xpEarned,
        createdAt: session.createdAt,
        completedAt: session.completedAt
      }
    });
  } catch (error) {
    console.error("Get roleplay session error:", error);
    res.status(500).json({ success: false, error: "Failed to fetch session" });
  }
});

// ============================================================================
// CERTIFICATE ENDPOINTS
// ============================================================================

// Generate certificate
router.post("/certificates/generate", async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { certificateType, title, description, moduleId, score } = req.body;

    if (!certificateType || !title) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: certificateType, title"
      });
    }

    // Validate certificate type
    if (!['module', 'curriculum', 'roleplay_mastery'].includes(certificateType)) {
      return res.status(400).json({
        success: false,
        error: "Invalid certificate type. Must be: module, curriculum, or roleplay_mastery"
      });
    }

    // Get user data
    const [user] = await db.select(selectUserColumns()).from(users).where(eq(users.id, userId));
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    // Generate unique certificate ID
    const certificateId = randomUUID();
    const verificationUrl = `${req.protocol}://${req.get('host')}/api/training/certificates/${certificateId}/verify`;

    // Prepare metadata based on certificate type
    let metadata: any = {
      verificationUrl,
      completionDate: new Date().toISOString(),
    };

    if (certificateType === 'module' && moduleId) {
      // Get module details
      const [module] = await db
        .select()
        .from(trainingModules)
        .where(eq(trainingModules.id, parseInt(moduleId)))
        .limit(1);

      if (module) {
        metadata.moduleTitle = module.title;
        metadata.difficulty = module.difficulty;
        metadata.xpEarned = module.xpReward;
      }
    } else if (certificateType === 'curriculum') {
      // Get completed modules count and total XP
      const completedModules = await db
        .select()
        .from(trainingProgress)
        .where(and(
          eq(trainingProgress.userId, userId),
          eq(trainingProgress.status, 'completed')
        ));

      const totalXP = completedModules.reduce((sum, mod) => {
        return sum + (mod.score || 0);
      }, 0);

      metadata.completedModulesCount = completedModules.length;
      metadata.totalXpEarned = totalXP;
    } else if (certificateType === 'roleplay_mastery') {
      // Get roleplay stats
      const userSessions = await db
        .select()
        .from(roleplaySessions)
        .where(and(
          eq(roleplaySessions.userId, userId),
          sql`${roleplaySessions.completedAt} IS NOT NULL`
        ));

      const avgScore = userSessions.length > 0
        ? userSessions.reduce((sum: number, s) => sum + (s.score || 0), 0) / userSessions.length
        : 0;

      metadata.sessionsCompleted = userSessions.length;
      metadata.averageScore = Math.round(avgScore);
    }

    // Insert certificate
    const [certificate] = await db
      .insert(trainingCertificates)
      .values({
        certificateId,
        userId,
        certificateType: certificateType as 'module' | 'curriculum' | 'roleplay_mastery',
        title,
        description: description || null,
        moduleId: moduleId || null,
        score: score || null,
        metadata,
        issuedAt: new Date(),
      })
      .returning();

    res.json({
      success: true,
      data: {
        certificate: {
          id: certificate.id,
          certificateId: certificate.certificateId,
          title: certificate.title,
          description: certificate.description,
          type: certificate.certificateType,
          score: certificate.score,
          issuedAt: certificate.issuedAt,
          verificationUrl,
          userName: `${user.firstName} ${user.lastName}`,
          metadata: certificate.metadata
        }
      }
    });
  } catch (error) {
    console.error("Certificate generation error:", error);
    res.status(500).json({ success: false, error: "Failed to generate certificate" });
  }
});

// Get all certificates for current user
router.get("/certificates", async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    const certificates = await db
      .select()
      .from(trainingCertificates)
      .where(eq(trainingCertificates.userId, userId))
      .orderBy(desc(trainingCertificates.issuedAt));

    // Get user data
    const [user] = await db.select(selectUserColumns()).from(users).where(eq(users.id, userId));

    res.json({
      success: true,
      data: {
        certificates: certificates.map(cert => ({
          id: cert.id,
          certificateId: cert.certificateId,
          title: cert.title,
          description: cert.description,
          type: cert.certificateType,
          score: cert.score,
          issuedAt: cert.issuedAt,
          expiresAt: cert.expiresAt,
          userName: user ? `${user.firstName} ${user.lastName}` : 'Unknown',
          metadata: cert.metadata
        })),
        total: certificates.length
      }
    });
  } catch (error) {
    console.error("Get certificates error:", error);
    res.status(500).json({ success: false, error: "Failed to fetch certificates" });
  }
});

// Download certificate as text/JSON (PDF generation can be added later)
router.get("/certificates/:certificateId/download", async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { certificateId } = req.params;
    const { format = 'json' } = req.query;

    const [certificate] = await db
      .select()
      .from(trainingCertificates)
      .where(and(
        eq(trainingCertificates.certificateId, certificateId),
        eq(trainingCertificates.userId, userId)
      ))
      .limit(1);

    if (!certificate) {
      return res.status(404).json({
        success: false,
        error: "Certificate not found or access denied"
      });
    }

    // Get user data
    const [user] = await db
      .select(selectUserColumns())
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (format === 'text') {
      // Generate plain text certificate
      const textCertificate = `
╔══════════════════════════════════════════════════════════════╗
║                    CERTIFICATE OF COMPLETION                 ║
╚══════════════════════════════════════════════════════════════╝

This certifies that

    ${user?.firstName} ${user?.lastName}

has successfully completed

    ${certificate.title}

${certificate.description ? `\n${certificate.description}\n` : ''}
${certificate.score ? `Final Score: ${certificate.score}\n` : ''}
Date Issued: ${new Date(certificate.issuedAt).toLocaleDateString()}
Certificate ID: ${certificate.certificateId}

Verification URL: ${certificate.metadata?.verificationUrl || ''}

═════════════════════════════════════════════════════════════════
             Roof-ER Command Center Training System
═════════════════════════════════════════════════════════════════
      `;

      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Content-Disposition', `attachment; filename="certificate-${certificateId}.txt"`);
      res.send(textCertificate);
    } else {
      // Return JSON format
      const jsonCertificate = {
        certificate: {
          id: certificate.certificateId,
          title: certificate.title,
          description: certificate.description,
          type: certificate.certificateType,
          recipient: {
            name: `${user?.firstName} ${user?.lastName}`,
            email: user?.email
          },
          score: certificate.score,
          issuedAt: certificate.issuedAt,
          expiresAt: certificate.expiresAt,
          metadata: certificate.metadata
        }
      };

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="certificate-${certificateId}.json"`);
      res.json(jsonCertificate);
    }
  } catch (error) {
    console.error("Certificate download error:", error);
    res.status(500).json({ success: false, error: "Failed to download certificate" });
  }
});

export default router;
