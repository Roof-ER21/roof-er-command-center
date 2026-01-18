# Badge System Quick Reference

## API Endpoints

### Check & Award Badges
```bash
POST /api/leaderboard/check-badges/:salesRepId
```
**Use when:** Sales data updates, daily cron job
**Returns:** List of newly awarded badges

### Manual Award
```bash
POST /api/leaderboard/player-profiles/:playerId/badges
Body: { "badgeId": 5 }
```
**Use when:** Admin override, special events

### Get All Badges
```bash
GET /api/leaderboard/badges
```
**Returns:** All 34 available badges

### Get Player Badges
```bash
GET /api/leaderboard/player-profiles/:playerId/badges
```
**Returns:** Earned badges with timestamps

### Get Badge Progress
```bash
GET /api/leaderboard/player-profiles/:playerId/badge-progress
```
**Returns:** Earned/available counts by category

## Integration Code

### When updating sales data:
```typescript
import { checkAndAwardBadges } from './server/routes/leaderboard/badge-system.js';

const newBadges = await checkAndAwardBadges(salesRepId);
if (newBadges.length > 0) {
  // Notify user, show celebration, etc.
}
```

### API call from frontend:
```typescript
const response = await fetch(`/api/leaderboard/check-badges/${salesRepId}`, {
  method: 'POST',
});
const { newBadges, count, message } = await response.json();
```

## Badge Categories

- **Performance** (7 badges) - Monthly signups: 10, 15, 20, 25, 30, 35, 40
- **Milestone** (12 badges) - Revenue: $10k-$100k, Bonus Tiers: 1-6
- **Streak** (5 badges) - Activity streaks: 7, 14, 30, 60, 90 days
- **Special** (10 badges) - First sale, Top performer, Team MVP, etc.

## Requirement Types

| Type | Check | Example |
|------|-------|---------|
| `monthly_signups` | Monthly signup count | ≥20 signups |
| `monthly_revenue` | Monthly revenue | ≥$50,000 |
| `bonus_tier` | Current bonus tier | Tier 3+ |
| `streak_days` | Current streak | 30+ days |
| `rank` | Leaderboard position | Rank #1 |
| `team_mvp` | Is team leader | Boolean |
| `first_sale` | Has any sales | Boolean |
| `total_signups` | All-time signups | ≥100 |
| `monthly_growth` | Growth percentage | ≥50% |

## Common Tasks

### Award badges when sales rep updated:
```typescript
router.patch("/sales-reps/:id", async (req, res) => {
  // ... update sales rep ...
  const newBadges = await checkAndAwardBadges(id);
  res.json({ salesRep, newBadges });
});
```

### Show badge celebration UI:
```typescript
if (newBadges.length > 0) {
  newBadges.forEach(badge => {
    toast.success(`Badge Unlocked: ${badge.name}`);
  });
}
```

### Daily badge audit:
```typescript
// Run via cron
const allReps = await db.select().from(salesReps);
for (const rep of allReps) {
  await checkAndAwardBadges(rep.id);
}
```

## Files

- `/server/routes/leaderboard/badge-system.ts` - Core logic
- `/server/routes/leaderboard/badge-routes.ts` - API endpoints
- `/docs/BADGE_SYSTEM.md` - Full documentation
- `/examples/badge-integration-example.ts` - Integration examples

## Notes

- Duplicate badges prevented automatically
- Player profiles auto-created if missing
- Only checks active badges
- Returns empty array if no new badges earned
