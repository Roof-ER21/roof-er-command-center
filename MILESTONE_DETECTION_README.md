# Server-Side Milestone Detection & Broadcasting

## Overview

This feature provides **server-side milestone detection** and **real-time broadcasting** for the Roof ER Command Center leaderboard system. When sales rep statistics are updated, the server automatically detects milestone achievements and broadcasts them to all connected clients via WebSocket.

## Key Features

- Server-authoritative milestone detection (prevents client-side manipulation)
- Real-time WebSocket broadcasting to all connected users
- Automatic badge awarding when milestones are reached
- Comprehensive milestone types (revenue, signups, bonus tiers, goals, rank changes)
- Full TypeScript implementation with type safety
- RESTful API design
- Production-ready error handling and logging

## Quick Start

### 1. Update Sales Rep Stats

```typescript
const response = await fetch('/api/leaderboard/sales-reps/1/update-stats', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    monthlySignups: '25',
    monthlyRevenue: '50000',
    goalProgress: '125'
  })
});

const { rep, milestones, rankChange } = await response.json();
console.log('Milestones achieved:', milestones);
```

### 2. Listen for Real-Time Achievements

```typescript
import { io } from 'socket.io-client';

const socket = io('http://localhost:5000/leaderboard');

socket.on('achievement:celebration', (achievement) => {
  // Show milestone celebration!
  showMilestoneCelebration(achievement.milestone);
});
```

## Milestone Types

### 1. Revenue Milestones 💰
Triggered when monthly revenue crosses these thresholds:
- $10,000
- $25,000
- $50,000
- $75,000
- $100,000

**Example:**
```json
{
  "id": "revenue_50000_1",
  "type": "revenue",
  "title": "$50,000 Revenue Milestone",
  "description": "Reached $50,000 in monthly revenue!",
  "value": 50000,
  "emoji": "💰",
  "color": "bg-green-500"
}
```

### 2. Signup Milestones 🎯
Triggered when monthly signups cross these thresholds:
- 10, 15, 20, 25, 30, 35, 40 signups

**Example:**
```json
{
  "id": "signups_25_1",
  "type": "signups",
  "title": "25 Signups Milestone",
  "description": "Achieved 25 signups this month!",
  "value": 25,
  "emoji": "🎯",
  "color": "bg-blue-500"
}
```

### 3. Bonus Tier Milestones 💎
Triggered when advancing to a new bonus tier:

| Tier | Signups | Emoji |
|------|---------|-------|
| 1 | 15+ | 🪙 |
| 2 | 20+ | 💰 |
| 3 | 25+ | 💎 |
| 4 | 30+ | 🏆 |
| 5 | 35+ | 👑 |
| 6 | 40+ | 💯 |

**Example:**
```json
{
  "id": "bonus_tier_3_1",
  "type": "bonus_tier",
  "title": "Bonus Tier 3 Unlocked!",
  "description": "Advanced to Tier 3 bonus level!",
  "value": "💎",
  "emoji": "💎",
  "color": "bg-purple-500"
}
```

### 4. Goal Achievement 🏆
Triggered when goal progress reaches 100% or higher

**Example:**
```json
{
  "id": "goal_achieved_1",
  "type": "goal_achieved",
  "title": "Monthly Goal Achieved!",
  "description": "Congratulations on reaching your monthly target!",
  "value": "125%",
  "emoji": "🏆",
  "color": "bg-primary"
}
```

### 5. Rank Change 🥇
Triggered when moving into the top 3 positions

**Example:**
```json
{
  "id": "rank_top3_1",
  "type": "rank_change",
  "title": "Top 3 Achieved!",
  "description": "Moved up to rank #2!",
  "value": "#2",
  "emoji": "🥇",
  "color": "bg-yellow-500"
}
```

## API Reference

### POST /api/leaderboard/sales-reps/:id/update-stats

Updates sales rep statistics and automatically detects/broadcasts milestones.

**Authentication:** Required (session-based)
**Authorization:** Requires 'leaderboard' module access

#### Request

**URL Parameters:**
- `id` (number) - Sales rep ID

**Body Parameters:**
All fields are optional - only include the fields you want to update:

```typescript
interface UpdateStatsRequest {
  monthlySignups?: string;
  monthlyRevenue?: string;
  yearlyRevenue?: string;
  yearlySignups?: string;
  goalProgress?: string;
  monthlyGrowth?: string;
  yearlyGrowth?: string;
  allTimeRevenue?: string;
}
```

#### Response

```typescript
interface UpdateStatsResponse {
  success: boolean;
  rep: {
    id: number;
    name: string;
    monthlyRevenue: number;
    yearlyRevenue: number;
    allTimeRevenue: number;
    monthlySignups: number;
    yearlySignups: number;
    goalProgress: number;
    monthlyGrowth: number;
    rank: number;
    // ... other sales rep fields
  };
  milestones: Milestone[];
  rankChange: number; // Positive = rank improved
}

interface Milestone {
  id: string;
  type: 'revenue' | 'signups' | 'bonus_tier' | 'goal_achieved' | 'rank_change';
  title: string;
  description: string;
  value: string | number;
  emoji: string;
  color: string;
  achievedAt: Date;
  salesRep: {
    id: number;
    name: string;
    avatar: string | null;
    team: string;
    monthlyRevenue: number;
    monthlySignups: number;
    goalProgress: number;
    currentBonusTier: number;
  };
}
```

#### Error Responses

**400 Bad Request**
```json
{
  "error": "Invalid update data"
}
```

**404 Not Found**
```json
{
  "error": "Sales rep not found"
}
```

**500 Internal Server Error**
```json
{
  "error": "Failed to update sales rep stats"
}
```

## WebSocket Events

### Namespace: `/leaderboard`

#### 1. achievement:earned
Sent to the specific user who earned the achievement.

**Room:** `user:{userId}`

**Payload:**
```typescript
{
  userId: number;
  userName: string;
  achievementType: 'milestone';
  title: string;
  description: string;
  icon: string; // emoji
  timestamp: Date;
  milestone: Milestone; // Full milestone object
}
```

#### 2. achievement:celebration
Broadcasted to all TV displays for public celebration.

**Room:** `tv-display`

**Payload:** Same as `achievement:earned`

#### 3. leaderboard:refresh
Full leaderboard refresh after stats update.

**Room:** Broadcast to all

**Payload:** Array of all sales reps with updated ranks

## Badge System

Badges are automatically awarded when milestones are reached. The system checks if the user already has the badge before awarding it (no duplicates).

| Badge Name | Milestone Type | Criteria |
|------------|---------------|----------|
| Revenue King | Revenue | $100k+ monthly revenue |
| Top Earner | Revenue | $50k+ monthly revenue |
| Rising Star | Revenue | $25k+ monthly revenue |
| Signup Master | Signups | 40+ monthly signups |
| Consistent Closer | Signups | 30+ monthly signups |
| Sales Rookie | Signups | 20+ monthly signups |
| Bonus Achiever | Bonus Tier | Any tier milestone |
| Goal Crusher | Goal Achievement | 100%+ goal completion |
| Top Performer | Rank Change | Moved into top 3 |

**Note:** Badges must exist in the database for automatic awarding to work.

## Usage Examples

### Example 1: Record a New Sale

```typescript
async function recordSale(repId: number, saleAmount: number) {
  // Get current stats
  const currentRep = await getCurrentRep(repId);

  // Calculate new stats
  const newRevenue = currentRep.monthlyRevenue + saleAmount;
  const newSignups = currentRep.monthlySignups + 1;
  const goalProgress = (newRevenue / currentRep.monthlyRevenueGoal) * 100;

  // Update with milestone detection
  const result = await fetch(
    `/api/leaderboard/sales-reps/${repId}/update-stats`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        monthlyRevenue: newRevenue.toString(),
        monthlySignups: newSignups.toString(),
        yearlyRevenue: (currentRep.yearlyRevenue + saleAmount).toString(),
        goalProgress: goalProgress.toString()
      })
    }
  );

  const data = await result.json();

  // Show milestones to user
  if (data.milestones.length > 0) {
    data.milestones.forEach(m => showCelebration(m));
  }

  return data;
}
```

### Example 2: React Component with WebSocket

```typescript
import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

function LeaderboardDashboard() {
  const [milestones, setMilestones] = useState<any[]>([]);

  useEffect(() => {
    const socket = io('http://localhost:5000/leaderboard');

    socket.on('connect', () => {
      socket.emit('join:tv-display'); // Join TV display room
    });

    socket.on('achievement:celebration', (achievement) => {
      // Add new milestone to display
      setMilestones(prev => [achievement.milestone, ...prev]);

      // Remove after 10 seconds
      setTimeout(() => {
        setMilestones(prev => prev.filter(m => m.id !== achievement.milestone.id));
      }, 10000);
    });

    return () => socket.disconnect();
  }, []);

  return (
    <div>
      {milestones.map(milestone => (
        <MilestoneCelebration key={milestone.id} milestone={milestone} />
      ))}
    </div>
  );
}
```

### Example 3: Admin Bulk Update

```typescript
async function bulkUpdateStats(updates: Array<{ repId: number; stats: any }>) {
  const results = await Promise.all(
    updates.map(({ repId, stats }) =>
      fetch(`/api/leaderboard/sales-reps/${repId}/update-stats`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(stats)
      }).then(res => res.json())
    )
  );

  // Collect all milestones
  const allMilestones = results.flatMap(r => r.milestones || []);

  console.log(`Bulk update complete. ${allMilestones.length} milestones achieved!`);

  return { results, allMilestones };
}
```

## Implementation Details

### Architecture

```
Client Request
    ↓
POST /api/leaderboard/sales-reps/:id/update-stats
    ↓
1. Fetch current stats (before update)
2. Calculate current rank
3. Update database
4. Calculate new rank
5. Detect milestones (compare old vs new)
    ↓
For each milestone:
    ├─→ Award badge (if applicable)
    ├─→ Create achievement event
    └─→ Broadcast via WebSocket
    ↓
Broadcast leaderboard refresh
    ↓
Return response with milestones
```

### Files

- `/server/routes/leaderboard/milestones.ts` - Milestone detection logic
- `/server/routes/leaderboard/index.ts` - API endpoint
- `/server/websocket/leaderboard.ts` - WebSocket handlers

### Security

- Session-based authentication required
- Module access control (leaderboard)
- Input validation
- Server-side validation prevents client manipulation
- No arbitrary database field updates

### Performance

- Milestone detection: O(n) where n = number of milestone thresholds
- Rank calculation: O(n log n) where n = number of active sales reps
- Badge awarding: Asynchronous (doesn't block response)
- WebSocket broadcasting: Efficient and scalable

## Testing

### Manual Testing with curl

```bash
# Set your session cookie
SESSION_COOKIE="connect.sid=your-session-cookie-here"

# Test milestone detection
curl -X POST http://localhost:5000/api/leaderboard/sales-reps/1/update-stats \
  -H "Content-Type: application/json" \
  -H "Cookie: $SESSION_COOKIE" \
  -d '{
    "monthlySignups": "25",
    "monthlyRevenue": "50000",
    "goalProgress": "125"
  }'
```

### Integration Testing

See `/examples/update-sales-stats-example.ts` for comprehensive examples.

## Troubleshooting

### Milestones not being detected

1. Verify the update actually crosses a milestone threshold
2. Check server logs for milestone detection messages
3. Ensure previous stats exist in database

### WebSocket events not received

1. Verify WebSocket connection is established
2. Check that you've joined the correct room
3. Verify the leaderboard namespace is being used (`/leaderboard`)

### Badges not being awarded

1. Verify badges exist in the database with correct names
2. Check server logs for badge awarding errors
3. Verify player profile exists for the sales rep

### Permission errors

1. Ensure user is authenticated (session cookie present)
2. Verify user has 'leaderboard' module access
3. Check middleware configuration

## Future Enhancements

Potential improvements for future iterations:

1. **Milestone History Table** - Store all milestone achievements in database
2. **Milestone Analytics** - Dashboard showing milestone trends over time
3. **Custom Milestones** - Allow admins to configure custom milestone thresholds
4. **Milestone Notifications** - Email/SMS notifications for milestone achievements
5. **Team Milestones** - Detect team-level achievements
6. **Streak Detection** - Track consecutive days/weeks of goal achievement
7. **Leaderboard Caching** - Cache rank calculations for better performance
8. **Rate Limiting** - Prevent abuse of update endpoint

## Support

For issues or questions:
1. Check server logs: `npm run dev` or check production logs
2. Review implementation: `/server/routes/leaderboard/milestones.ts`
3. Test endpoint: Use curl or Postman to verify API responses
4. Check WebSocket: Use browser DevTools to monitor WebSocket events

## License

Part of the Roof ER Command Center project.

---

**Version:** 1.0.0
**Last Updated:** January 18, 2026
**Status:** Production Ready ✅
