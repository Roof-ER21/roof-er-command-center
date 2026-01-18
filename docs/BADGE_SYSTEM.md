# Badge Awarding System - Roof ER Command Center

## Overview

The badge awarding system provides automatic and manual badge awards for sales representatives based on their performance metrics, milestones, streaks, and special achievements.

## Architecture

### Files

- **`/server/routes/leaderboard/badge-system.ts`** - Core badge checking and awarding logic
- **`/server/routes/leaderboard/badge-routes.ts`** - API endpoints for badge operations
- **`/server/routes/leaderboard/index.ts`** - Main router that mounts badge routes

### Database Tables

- **`badges`** - Badge definitions (34 total badges)
- **`player_profiles`** - Player gamification data
- **`player_badges`** - Junction table tracking earned badges

## Badge Categories

### Performance Badges (7 badges)
Based on monthly signup counts:
- Getting Started (10 signups)
- Rising Star (15 signups)
- Sales Pro (20 signups)
- Heavy Hitter (25 signups)
- Elite Performer (30 signups)
- Top Gun (35 signups)
- Legend (40 signups)

### Milestone Badges (12 badges)

**Revenue Milestones (5 badges):**
- Revenue Rookie ($10k)
- Revenue Builder ($25k)
- Revenue Champion ($50k)
- Revenue Master ($75k)
- Revenue Legend ($100k)

**Bonus Tier Milestones (7 badges):**
- Bronze Tier (Tier 1)
- Silver Tier (Tier 2)
- Gold Tier (Tier 3)
- Platinum Tier (Tier 4)
- Diamond Tier (Tier 5)
- Elite Tier (Tier 6)

### Streak Badges (5 badges)
Based on activity streaks:
- Week Warrior (7 days)
- Two Week Champion (14 days)
- Monthly Grinder (30 days)
- Unstoppable Force (60 days)
- Eternal Flame (90 days)

### Special Badges (10 badges)
- First Sale
- Top Performer (Rank #1)
- Team MVP
- Rookie of the Month
- Comeback Kid
- Perfect Month
- Century Club (100 total signups)
- Hall of Fame (500 total signups)
- Growth Expert (50%+ monthly growth)
- Consistency King
- Year Dominator

## API Endpoints

### Check and Award Badges
```
POST /api/leaderboard/check-badges/:salesRepId
```

Checks all badge requirements for a sales rep and awards newly qualified badges.

**Response:**
```json
{
  "success": true,
  "newBadges": [
    {
      "id": 3,
      "name": "Sales Pro",
      "description": "Achieved 20 signups in a month",
      "iconUrl": "🌟",
      "category": "performance",
      "rarity": "rare",
      "earnedAt": "2026-01-18T10:30:00Z"
    }
  ],
  "count": 1,
  "message": "Awarded 1 new badge(s)!"
}
```

### Manually Award Badge
```
POST /api/leaderboard/player-profiles/:playerId/badges
Content-Type: application/json

{
  "badgeId": 5
}
```

**Response:**
```json
{
  "success": true,
  "badge": {
    "id": 5,
    "name": "Elite Performer",
    "description": "Achieved 30 signups in a month",
    "iconUrl": "🏅",
    "category": "performance",
    "rarity": "epic",
    "earnedAt": "2026-01-18T10:35:00Z"
  },
  "message": "Badge 'Elite Performer' awarded successfully!"
}
```

### Get All Available Badges
```
GET /api/leaderboard/badges
```

**Response:**
```json
[
  {
    "id": 1,
    "name": "Getting Started",
    "description": "Achieved 10 signups in a month",
    "iconUrl": "🎯",
    "category": "performance",
    "rarity": "common",
    "requirement": "{\"type\":\"monthly_signups\",\"value\":10}",
    "isActive": true,
    "createdAt": "2026-01-15T00:00:00Z"
  }
]
```

### Get Player's Earned Badges
```
GET /api/leaderboard/player-profiles/:playerId/badges
```

**Response:**
```json
[
  {
    "id": 1,
    "name": "Getting Started",
    "description": "Achieved 10 signups in a month",
    "iconUrl": "🎯",
    "category": "performance",
    "rarity": "common",
    "earnedAt": "2026-01-10T14:20:00Z"
  },
  {
    "id": 13,
    "name": "First Sale",
    "description": "Completed your first sale - Welcome to the team!",
    "iconUrl": "🎉",
    "category": "special",
    "rarity": "common",
    "earnedAt": "2026-01-05T09:15:00Z"
  }
]
```

### Get Badge Progress
```
GET /api/leaderboard/player-profiles/:playerId/badge-progress
```

**Response:**
```json
{
  "totalBadges": 34,
  "earnedCount": 8,
  "availableCount": 26,
  "progress": 24,
  "byCategory": {
    "performance": {
      "earned": [...],
      "available": [...]
    },
    "milestone": {
      "earned": [...],
      "available": [...]
    },
    "streak": {
      "earned": [...],
      "available": [...]
    },
    "special": {
      "earned": [...],
      "available": [...]
    }
  }
}
```

## Badge Requirement Types

Badge requirements are stored as JSON in the `requirement` field:

```json
{
  "type": "requirement_type",
  "value": number | boolean
}
```

### Supported Requirement Types

| Type | Description | Value Type | Example |
|------|-------------|------------|---------|
| `monthly_signups` | Monthly signup count | number | `{"type":"monthly_signups","value":20}` |
| `monthly_revenue` | Monthly revenue amount | number | `{"type":"monthly_revenue","value":50000}` |
| `bonus_tier` | Bonus tier level | number | `{"type":"bonus_tier","value":3}` |
| `streak_days` | Activity streak days | number | `{"type":"streak_days","value":30}` |
| `rank` | Leaderboard rank | number | `{"type":"rank","value":1}` |
| `team_mvp` | Is team MVP | boolean | `{"type":"team_mvp","value":true}` |
| `first_sale` | Has made first sale | boolean | `{"type":"first_sale","value":true}` |
| `total_signups` | All-time signup count | number | `{"type":"total_signups","value":100}` |
| `monthly_growth` | Monthly growth percentage | number | `{"type":"monthly_growth","value":50}` |
| `yearly_goal_achieved` | Met yearly revenue goal | boolean | `{"type":"yearly_goal_achieved","value":true}` |
| `perfect_month` | Hit all monthly goals | boolean | `{"type":"perfect_month","value":true}` |

### Planned Requirements (Require Historical Data)

- `rank_improvement` - Rank improved by X positions
- `rookie_month` - Top performer in first 30 days
- `consecutive_goal_months` - Hit goal for X consecutive months

## Integration Example

### When Sales Data Updates

```typescript
import { checkAndAwardBadges } from './server/routes/leaderboard/badge-system.js';

// After updating sales rep data
const salesRepId = 123;
const newBadges = await checkAndAwardBadges(salesRepId);

if (newBadges.length > 0) {
  // Notify user of new badges
  console.log(`🎉 ${newBadges.length} new badge(s) awarded!`);

  // Send WebSocket notification
  wsHandlers.broadcast({
    type: 'badge_awarded',
    salesRepId,
    badges: newBadges,
  });
}
```

### Frontend Badge Celebration

```typescript
// When receiving new badges from API
if (response.newBadges.length > 0) {
  response.newBadges.forEach(badge => {
    showBadgeNotification({
      title: `Badge Unlocked: ${badge.name}`,
      description: badge.description,
      icon: badge.iconUrl,
      rarity: badge.rarity,
    });
  });
}
```

## Duplicate Prevention

The system automatically prevents duplicate badge awards:

1. When checking badges, already earned badges are filtered out
2. Manual badge awards return 409 Conflict if badge already awarded
3. Database unique constraint on `(player_id, badge_id)` pair

## Performance Considerations

- Badge checking requires one database query per sales rep
- Efficiently uses Set for O(1) earned badge lookups
- Batches badge awards in single transaction
- Returns only newly awarded badges to minimize data transfer

## Future Enhancements

1. **Historical Tracking**
   - Implement rank improvement tracking
   - Add consecutive goal month tracking
   - Track rookie performance

2. **Badge Points System**
   - Assign XP/points to badges based on rarity
   - Award player level progression

3. **Badge Expiration**
   - Time-limited badges (e.g., "January Champion")
   - Seasonal badges

4. **Badge Tiers**
   - Progressive badges (Bronze → Silver → Gold)
   - Upgrade existing badges

5. **Team Badges**
   - Badges for team achievements
   - Collaborative milestones

## Testing

### Manual Testing

```bash
# Check badges for sales rep #1
curl -X POST http://localhost:5000/api/leaderboard/check-badges/1

# Award specific badge to player #5
curl -X POST http://localhost:5000/api/leaderboard/player-profiles/5/badges \
  -H "Content-Type: application/json" \
  -d '{"badgeId": 3}'

# Get all badges
curl http://localhost:5000/api/leaderboard/badges

# Get player's earned badges
curl http://localhost:5000/api/leaderboard/player-profiles/5/badges

# Get badge progress
curl http://localhost:5000/api/leaderboard/player-profiles/5/badge-progress
```

### Unit Tests (Future)

```typescript
describe('Badge System', () => {
  it('should award performance badge at 20 signups', async () => {
    const badges = await checkAndAwardBadges(salesRepId);
    expect(badges).toContainEqual(expect.objectContaining({ name: 'Sales Pro' }));
  });

  it('should not award duplicate badges', async () => {
    await checkAndAwardBadges(salesRepId);
    const badges = await checkAndAwardBadges(salesRepId);
    expect(badges).toHaveLength(0);
  });

  it('should award team MVP badge', async () => {
    // Setup: Make sales rep #1 top in team
    const badges = await checkAndAwardBadges(1);
    expect(badges).toContainEqual(expect.objectContaining({ name: 'Team MVP' }));
  });
});
```

## Troubleshooting

### No badges being awarded

1. Check if player profile exists for sales rep
2. Verify badge requirements in database match current stats
3. Check console logs for award confirmations
4. Ensure badges are marked as `isActive: true`

### Duplicate badge errors

- Normal behavior - badge already earned
- Check `player_badges` table for existing awards

### Performance issues

- Consider caching badge definitions
- Batch badge checks for multiple reps
- Add database indexes on frequently queried fields

## Support

For questions or issues with the badge system:
- Review this documentation
- Check console logs for detailed error messages
- Verify database schema matches expected structure
