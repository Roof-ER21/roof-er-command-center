/**
 * Badge System Integration Examples
 *
 * This file demonstrates how to integrate the badge awarding system
 * into your sales data update workflows.
 */

import { checkAndAwardBadges } from '../server/routes/leaderboard/badge-system.js';

// ============================================================================
// EXAMPLE 1: Award badges when sales data is updated
// ============================================================================

async function updateSalesRepStats(salesRepId: number, newStats: any) {
  // Update sales rep data in database
  // ... your update logic here ...

  // Check and award badges based on new stats
  const newBadges = await checkAndAwardBadges(salesRepId);

  if (newBadges.length > 0) {
    console.log(`🎉 ${newBadges.length} new badge(s) awarded to sales rep #${salesRepId}`);

    // Notify via WebSocket
    // wsHandlers.broadcast({
    //   type: 'badge_awarded',
    //   salesRepId,
    //   badges: newBadges,
    // });

    // Send email notification
    // await sendBadgeNotificationEmail(salesRepId, newBadges);

    return { success: true, badges: newBadges };
  }

  return { success: true, badges: [] };
}

// ============================================================================
// EXAMPLE 2: Batch badge checking for all sales reps
// ============================================================================

async function checkAllSalesRepBadges() {
  // Get all active sales reps
  const salesReps = []; // await db.select()...

  const results = [];

  for (const rep of salesReps) {
    try {
      const newBadges = await checkAndAwardBadges(rep.id);
      if (newBadges.length > 0) {
        results.push({
          salesRepId: rep.id,
          name: rep.name,
          newBadges,
        });
      }
    } catch (error) {
      console.error(`Failed to check badges for ${rep.name}:`, error);
    }
  }

  console.log(`Badge check complete: ${results.length} reps earned new badges`);
  return results;
}

// ============================================================================
// EXAMPLE 3: Trigger badge check on specific events
// ============================================================================

async function onSignupAdded(salesRepId: number, signupData: any) {
  // Add signup to database
  // ... your signup logic here ...

  // Update monthly/yearly signup counts
  // ... your update logic here ...

  // Check for performance badges
  const newBadges = await checkAndAwardBadges(salesRepId);

  if (newBadges.length > 0) {
    // Show celebration UI
    return {
      success: true,
      signup: signupData,
      celebrateBadges: newBadges,
    };
  }

  return { success: true, signup: signupData };
}

async function onBonusTierChanged(salesRepId: number, newTier: number) {
  // Update bonus tier in database
  // ... your tier update logic here ...

  // Check for tier milestone badges
  const newBadges = await checkAndAwardBadges(salesRepId);

  if (newBadges.length > 0) {
    console.log(`Bonus tier ${newTier} milestone badge awarded!`);
  }

  return { success: true, tier: newTier, badges: newBadges };
}

// ============================================================================
// EXAMPLE 4: Daily streak update with badge check
// ============================================================================

async function updateDailyStreak(salesRepId: number) {
  // Update player profile streak
  // ... your streak logic here ...

  // Check for streak badges
  const newBadges = await checkAndAwardBadges(salesRepId);

  if (newBadges.length > 0) {
    // Notify about streak milestone
    console.log(`Streak milestone achieved!`);
  }

  return { success: true, badges: newBadges };
}

// ============================================================================
// EXAMPLE 5: API endpoint integration
// ============================================================================

// In your Express route:
/*
router.patch("/sales-reps/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const updates = req.body;

    // Update sales rep
    const [updated] = await db.update(salesReps)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(salesReps.id, id))
      .returning();

    // Check and award badges
    const newBadges = await checkAndAwardBadges(id);

    res.json({
      success: true,
      salesRep: updated,
      newBadges,
      badgeMessage: newBadges.length > 0
        ? `Earned ${newBadges.length} new badge(s)!`
        : null,
    });
  } catch (error) {
    console.error("Update error:", error);
    res.status(500).json({ error: "Failed to update sales rep" });
  }
});
*/

// ============================================================================
// EXAMPLE 6: Frontend notification handler
// ============================================================================

/*
// React component example
function SalesRepDashboard() {
  const [badges, setBadges] = useState([]);
  const [showCelebration, setShowCelebration] = useState(false);

  const handleDataUpdate = async (salesRepId, newData) => {
    const response = await fetch(`/api/leaderboard/check-badges/${salesRepId}`, {
      method: 'POST',
    });

    const result = await response.json();

    if (result.newBadges?.length > 0) {
      setBadges(result.newBadges);
      setShowCelebration(true);

      // Show toast notifications
      result.newBadges.forEach(badge => {
        toast.success(
          <div>
            <strong>Badge Unlocked!</strong>
            <p>{badge.iconUrl} {badge.name}</p>
            <p className="text-sm">{badge.description}</p>
          </div>,
          { duration: 5000 }
        );
      });

      // Play sound effect
      playBadgeSound();

      // Show confetti animation
      triggerConfetti();
    }
  };

  return (
    <div>
      {showCelebration && (
        <BadgeCelebrationModal
          badges={badges}
          onClose={() => setShowCelebration(false)}
        />
      )}
    </div>
  );
}
*/

// ============================================================================
// EXAMPLE 7: Scheduled badge audit
// ============================================================================

async function scheduledBadgeAudit() {
  console.log('Starting daily badge audit...');

  // This could be run via cron job or scheduled task
  const results = await checkAllSalesRepBadges();

  // Send summary report
  const summary = {
    timestamp: new Date(),
    totalRepsChecked: results.length,
    totalBadgesAwarded: results.reduce((sum, r) => sum + r.newBadges.length, 0),
    details: results,
  };

  console.log('Badge audit complete:', summary);
  return summary;
}

// ============================================================================
// EXAMPLE 8: WebSocket integration
// ============================================================================

/*
import { wsHandlers } from '../server/index.js';

async function notifyBadgeAward(salesRepId: number, badges: any[]) {
  // Broadcast to all connected clients
  wsHandlers.broadcast({
    type: 'badge_awarded',
    salesRepId,
    badges,
    timestamp: new Date().toISOString(),
  });

  // Or send to specific user
  const userId = await getSalesRepUserId(salesRepId);
  wsHandlers.sendToUser(userId, {
    type: 'badge_awarded',
    badges,
  });
}
*/

// ============================================================================
// EXAMPLE 9: Badge progress tracking
// ============================================================================

async function getBadgeProgressReport(playerId: number) {
  const response = await fetch(`/api/leaderboard/player-profiles/${playerId}/badge-progress`);
  const progress = await response.json();

  console.log(`Badge Progress for Player #${playerId}:`);
  console.log(`- Total: ${progress.earnedCount}/${progress.totalBadges} (${progress.progress}%)`);
  console.log(`- Performance: ${progress.byCategory.performance.earned.length}/${progress.byCategory.performance.earned.length + progress.byCategory.performance.available.length}`);
  console.log(`- Milestone: ${progress.byCategory.milestone.earned.length}/${progress.byCategory.milestone.earned.length + progress.byCategory.milestone.available.length}`);
  console.log(`- Streak: ${progress.byCategory.streak.earned.length}/${progress.byCategory.streak.earned.length + progress.byCategory.streak.available.length}`);
  console.log(`- Special: ${progress.byCategory.special.earned.length}/${progress.byCategory.special.earned.length + progress.byCategory.special.available.length}`);

  return progress;
}

// ============================================================================
// Export examples for use in other modules
// ============================================================================

export {
  updateSalesRepStats,
  checkAllSalesRepBadges,
  onSignupAdded,
  onBonusTierChanged,
  updateDailyStreak,
  scheduledBadgeAudit,
  getBadgeProgressReport,
};
