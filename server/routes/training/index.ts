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

const router = Router();

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
      .select({
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email
      })
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
    const [user] = await db.select().from(users).where(eq(users.id, userId));
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
      .select()
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

    // Get existing messages
    const existingMessages = (session.messages as Array<{role: string; content: string; timestamp: Date}>) || [];

    // Call Susan AI with training context
    const aiResponse = await susanAI.chat(message, {
      context: "training",
      history: existingMessages.map(m => ({ role: m.role, content: m.content })),
      temperature: 0.8
    });

    // Add new messages
    const newMessages = [
      ...existingMessages,
      { role: "user", content: message, timestamp: new Date() },
      { role: "assistant", content: aiResponse.response, timestamp: new Date() }
    ];

    // Calculate score
    const newScore = (newMessages.length / 2) * 10;
    const sessionEnded = newMessages.length > 10; // End after 5 exchanges

    // Update session in database
    await db
      .update(roleplaySessions)
      .set({
        messages: newMessages,
        score: newScore,
        completedAt: sessionEnded ? new Date() : null,
        duration: sessionEnded ? Math.floor((new Date().getTime() - session.createdAt.getTime()) / 1000) : null
      })
      .where(eq(roleplaySessions.id, session.id));

    res.json({
      success: true,
      data: {
        response: aiResponse.response,
        feedback: "Great job maintaining a professional tone. Keep focusing on identifying the homeowner's pain points.",
        scoreAwarded: 10,
        totalScore: newScore,
        sessionEnded
      }
    });
  } catch (error) {
    console.error("Roleplay message error:", error);
    res.status(500).json({ success: false, error: "Failed to process message" });
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
    const [user] = await db.select().from(users).where(eq(users.id, userId));
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
      const roleplaySessions = await db
        .select()
        .from(roleplaySessions)
        .where(and(
          eq(roleplaySessions.userId, userId),
          sql`${roleplaySessions.completedAt} IS NOT NULL`
        ));

      const avgScore = roleplaySessions.length > 0
        ? roleplaySessions.reduce((sum, s) => sum + (s.score || 0), 0) / roleplaySessions.length
        : 0;

      metadata.sessionsCompleted = roleplaySessions.length;
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
    const [user] = await db.select().from(users).where(eq(users.id, userId));

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
      .select()
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
