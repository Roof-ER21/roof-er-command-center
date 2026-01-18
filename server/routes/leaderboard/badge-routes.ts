/**
 * Badge API Routes for Roof ER Command Center
 *
 * Endpoints for checking, awarding, and fetching badges.
 */

import { Router, Request, Response } from "express";
import { db } from "../../db.js";
import { badges, playerBadges, playerProfiles } from "../../../shared/schema.js";
import { eq, desc, asc, and } from "drizzle-orm";
import { checkAndAwardBadges, awardBadge } from "./badge-system.js";

const router = Router();

/**
 * POST /api/leaderboard/check-badges/:salesRepId
 *
 * Check and award all eligible badges for a sales rep based on their current stats.
 * This should be called whenever sales data is updated.
 *
 * Returns newly awarded badges for UI celebration/notification.
 */
router.post("/check-badges/:salesRepId", async (req: Request, res: Response) => {
  try {
    const salesRepId = parseInt(req.params.salesRepId);

    if (isNaN(salesRepId)) {
      return res.status(400).json({ error: "Invalid sales rep ID" });
    }

    const newBadges = await checkAndAwardBadges(salesRepId);

    res.json({
      success: true,
      newBadges,
      count: newBadges.length,
      message: newBadges.length > 0
        ? `Awarded ${newBadges.length} new badge(s)!`
        : 'No new badges earned',
    });
  } catch (error) {
    console.error('Error checking badges:', error);
    res.status(500).json({
      success: false,
      error: "Failed to check badges"
    });
  }
});

/**
 * POST /api/leaderboard/player-profiles/:playerId/badges
 *
 * Manually award a specific badge to a player.
 * Requires badgeId in request body.
 *
 * Body: { badgeId: number }
 */
router.post("/player-profiles/:playerId/badges", async (req: Request, res: Response) => {
  try {
    const playerId = parseInt(req.params.playerId);
    const { badgeId } = req.body;

    if (isNaN(playerId) || !badgeId) {
      return res.status(400).json({ error: "Invalid player ID or badge ID" });
    }

    const result = await awardBadge(playerId, badgeId);

    if (result.alreadyAwarded) {
      return res.status(409).json({
        error: "Badge already awarded to this player",
        badge: result.badge,
      });
    }

    res.status(201).json({
      success: true,
      badge: result.badge,
      message: `Badge "${result.badge.name}" awarded successfully!`,
    });
  } catch (error: any) {
    console.error('Error awarding badge:', error);

    if (error.message === "Player profile not found") {
      return res.status(404).json({ error: error.message });
    }
    if (error.message === "Badge not found") {
      return res.status(404).json({ error: error.message });
    }

    res.status(500).json({
      success: false,
      error: "Failed to award badge"
    });
  }
});

/**
 * GET /api/leaderboard/badges
 *
 * Get all available badges in the system.
 * Returns active badges ordered by category and name.
 */
router.get("/badges", async (req: Request, res: Response) => {
  try {
    const allBadges = await db.select()
      .from(badges)
      .where(eq(badges.isActive, true))
      .orderBy(asc(badges.category), asc(badges.name));

    res.json(allBadges);
  } catch (error) {
    console.error('Error fetching badges:', error);
    res.status(500).json({ error: "Failed to fetch badges" });
  }
});

/**
 * GET /api/leaderboard/badges/:id
 *
 * Get a specific badge by ID.
 */
router.get("/badges/:id", async (req: Request, res: Response) => {
  try {
    const badgeId = parseInt(req.params.id);

    if (isNaN(badgeId)) {
      return res.status(400).json({ error: "Invalid badge ID" });
    }

    const [badge] = await db.select()
      .from(badges)
      .where(eq(badges.id, badgeId))
      .limit(1);

    if (!badge) {
      return res.status(404).json({ error: "Badge not found" });
    }

    res.json(badge);
  } catch (error) {
    console.error('Error fetching badge:', error);
    res.status(500).json({ error: "Failed to fetch badge" });
  }
});

/**
 * GET /api/leaderboard/player-profiles/:playerId/badges
 *
 * Get all badges earned by a specific player.
 * Returns badges with earnedAt timestamp, ordered by most recent first.
 */
router.get("/player-profiles/:playerId/badges", async (req: Request, res: Response) => {
  try {
    const playerId = parseInt(req.params.playerId);

    if (isNaN(playerId)) {
      return res.status(400).json({ error: "Invalid player ID" });
    }

    const earnedBadges = await db
      .select({
        id: badges.id,
        name: badges.name,
        description: badges.description,
        iconUrl: badges.iconUrl,
        category: badges.category,
        rarity: badges.rarity,
        earnedAt: playerBadges.earnedAt,
      })
      .from(playerBadges)
      .innerJoin(badges, eq(playerBadges.badgeId, badges.id))
      .where(eq(playerBadges.playerId, playerId))
      .orderBy(desc(playerBadges.earnedAt));

    res.json(earnedBadges);
  } catch (error) {
    console.error('Error fetching player badges:', error);
    res.status(500).json({ error: "Failed to fetch player badges" });
  }
});

/**
 * GET /api/leaderboard/player-profiles/:playerId/badge-progress
 *
 * Get badge progress for a player - shows earned and available badges.
 */
router.get("/player-profiles/:playerId/badge-progress", async (req: Request, res: Response) => {
  try {
    const playerId = parseInt(req.params.playerId);

    if (isNaN(playerId)) {
      return res.status(400).json({ error: "Invalid player ID" });
    }

    // Check if player exists
    const [player] = await db.select()
      .from(playerProfiles)
      .where(eq(playerProfiles.id, playerId))
      .limit(1);

    if (!player) {
      return res.status(404).json({ error: "Player profile not found" });
    }

    // Get all active badges
    const allBadges = await db.select()
      .from(badges)
      .where(eq(badges.isActive, true));

    // Get earned badges
    const earnedBadgeIds = await db.select({ badgeId: playerBadges.badgeId })
      .from(playerBadges)
      .where(eq(playerBadges.playerId, playerId));

    const earnedBadgeIdSet = new Set(earnedBadgeIds.map(b => b.badgeId));

    // Categorize badges
    const earned = allBadges.filter(b => earnedBadgeIdSet.has(b.id));
    const available = allBadges.filter(b => !earnedBadgeIdSet.has(b.id));

    // Group by category
    const byCategory = {
      performance: {
        earned: earned.filter(b => b.category === 'performance'),
        available: available.filter(b => b.category === 'performance'),
      },
      milestone: {
        earned: earned.filter(b => b.category === 'milestone'),
        available: available.filter(b => b.category === 'milestone'),
      },
      streak: {
        earned: earned.filter(b => b.category === 'streak'),
        available: available.filter(b => b.category === 'streak'),
      },
      special: {
        earned: earned.filter(b => b.category === 'special'),
        available: available.filter(b => b.category === 'special'),
      },
    };

    res.json({
      totalBadges: allBadges.length,
      earnedCount: earned.length,
      availableCount: available.length,
      progress: Math.round((earned.length / allBadges.length) * 100),
      byCategory,
    });
  } catch (error) {
    console.error('Error fetching badge progress:', error);
    res.status(500).json({ error: "Failed to fetch badge progress" });
  }
});

export default router;
