# Achievement Broadcasting System

## Overview

The Achievement Broadcasting System provides real-time WebSocket notifications for achievements, milestones, badges, and rank changes across the Roof ER Command Center platform.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  Achievement Flow                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Route Handler (Training/Leaderboard)                       │
│       │                                                      │
│       ├─> Award XP / Update Sales / Complete Contest        │
│       │                                                      │
│       └─> Call Broadcaster Function                         │
│              │                                               │
│              ├─> broadcastBadgeAchievement()                │
│              ├─> broadcastTrainingMilestone()               │
│              ├─> broadcastRankChange()                      │
│              ├─> broadcastContestAchievement()              │
│              └─> broadcastSalesMilestone()                  │
│                     │                                        │
│                     └─> LeaderboardSocketHandler             │
│                            │                                 │
│                            └─> celebrateAchievement()        │
│                                   │                          │
│                                   ├─> user:${userId} room    │
│                                   ├─> tv-display room        │
│                                   └─> leaderboard namespace  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## WebSocket Setup

### Server Initialization

```typescript
// server/index.ts
const wsHandlers = setupWebSocket(io);
initializeAchievementBroadcaster(wsHandlers);
```

### Client Connection

```typescript
import { io } from 'socket.io-client';

// Connect to leaderboard namespace
const socket = io('http://localhost:5000/leaderboard');

// Join TV display room for public achievements
socket.emit('join:tv-display');

// Join user room for personal achievements
socket.emit('join:user', userId);

// Listen for achievements
socket.on('achievement:celebration', (achievement) => {
  console.log('Achievement:', achievement);
  // Display achievement popup/toast
});

socket.on('achievement:earned', (achievement) => {
  console.log('You earned:', achievement);
  // Display personal achievement notification
});
```

## Achievement Types

### 1. Training Achievements

#### Level Up
```typescript
broadcastTrainingMilestone({
  userId: 123,
  userName: 'John Doe',
  milestoneType: 'level_up',
  value: 10,
  title: '🎖️ Level 10 Achieved!',
  description: 'Reached level 10 with 5,000 total XP',
});
```

#### XP Milestones
```typescript
broadcastTrainingMilestone({
  userId: 123,
  userName: 'John Doe',
  milestoneType: 'xp',
  value: 10000,
  title: '⭐ 10,000 XP Milestone!',
  description: 'Earned 10,000 total experience points',
});
```

#### Streak Milestones
```typescript
broadcastTrainingMilestone({
  userId: 123,
  userName: 'John Doe',
  milestoneType: 'streak',
  value: 30,
  title: '🔥 30-Day Streak!',
  description: 'Maintained a 30-day learning streak',
});
```

#### Badge Achievements
```typescript
broadcastBadgeAchievement({
  userId: 123,
  userName: 'John Doe',
  badgeName: 'Master Trainer',
  badgeDescription: 'Completed all training modules',
  badgeIcon: '🏆',
  badgeRarity: 'legendary',
});
```

### 2. Sales Achievements

#### Revenue Milestones
```typescript
broadcastSalesMilestone({
  userId: 123,
  userName: 'Jane Smith',
  milestoneType: 'revenue',
  value: 50000,
  threshold: 50000,
});
// Broadcasts: "💰 $50,000 Revenue Milestone!"
```

Thresholds: $10K, $25K, $50K, $100K, $250K, $500K, $1M

#### Signup Milestones
```typescript
broadcastSalesMilestone({
  userId: 123,
  userName: 'Jane Smith',
  milestoneType: 'signups',
  value: 100,
  threshold: 100,
});
// Broadcasts: "📝 100 Signups Milestone!"
```

Thresholds: 10, 25, 50, 100, 250, 500, 1000

#### Rank Changes
```typescript
broadcastRankChange({
  userId: 123,
  userName: 'Jane Smith',
  previousRank: 15,
  newRank: 8,
  metric: 'monthly revenue',
});
// Broadcasts when: Top 10 or 5+ rank jump
```

### 3. Contest Achievements

```typescript
broadcastContestAchievement({
  userId: 123,
  userName: 'Bob Johnson',
  contestName: 'Q4 Sales Challenge',
  placement: 1,
  prize: '$5000',
});
// Broadcasts: "🏆 Q4 Sales Challenge - 1st Place"
```

## Broadcaster API

### Location
`server/utils/achievement-broadcaster.ts`

### Functions

#### broadcastBadgeAchievement
Broadcasts when a training badge is earned.

**Parameters:**
- `userId: number` - User who earned the badge
- `userName: string` - Display name
- `badgeName: string` - Badge title
- `badgeDescription: string` - What the badge is for
- `badgeIcon?: string` - Optional emoji/icon
- `badgeRarity?: string` - Optional rarity (common, rare, legendary)

**Triggered by:**
- `checkAchievements()` in training/gamification.ts
- `checkStreakAchievements()` in training/gamification.ts

#### broadcastTrainingMilestone
Broadcasts XP, level up, or streak milestones.

**Parameters:**
- `userId: number`
- `userName: string`
- `milestoneType: 'xp' | 'level_up' | 'streak'`
- `value: number` - Current value (level number, XP amount, streak days)
- `title: string`
- `description: string`

**Triggered by:**
- Level up: When `newLevel > currentLevel` in award-xp endpoint
- XP: Every 1000 XP in award-xp endpoint
- Streak: Every 7 days in check-streak endpoint

#### broadcastRankChange
Broadcasts significant leaderboard rank improvements.

**Parameters:**
- `userId: number`
- `userName: string`
- `previousRank: number`
- `newRank: number`
- `metric: string` - What metric (e.g., "monthly revenue")

**Triggered by:**
- Sales rep updates (when implemented)
- Only broadcasts if: Top 10 OR 5+ rank jump

#### broadcastContestAchievement
Broadcasts contest placements.

**Parameters:**
- `userId: number`
- `userName: string`
- `contestName: string`
- `placement: number` - 1st, 2nd, 3rd, etc.
- `prize?: string` - Optional prize amount

**Triggered by:**
- Contest payout endpoint: `/api/leaderboard/contests/:id/payout`
- Broadcasts for top 3 finishers

#### broadcastSalesMilestone
Broadcasts sales revenue or signup milestones.

**Parameters:**
- `userId: number`
- `userName: string`
- `milestoneType: 'revenue' | 'signups'`
- `value: number` - Current value
- `threshold: number` - Milestone crossed

**Triggered by:**
- Sales rep updates via `analyzeSalesRepUpdate()`

## Integration Points

### Training Routes
`server/routes/training/gamification.ts`

```typescript
import {
  broadcastBadgeAchievement,
  broadcastTrainingMilestone,
} from "../../utils/achievement-broadcaster.js";

// In award-xp endpoint
if (leveledUp) {
  broadcastTrainingMilestone({ ... });
}

// In checkAchievements()
if (shouldUnlock) {
  broadcastBadgeAchievement({ ... });
}

// In check-streak endpoint
if (newStreak % 7 === 0) {
  broadcastTrainingMilestone({ ... });
}
```

### Leaderboard Routes
`server/routes/leaderboard/index.ts`

```typescript
import {
  broadcastContestAchievement,
} from "../../utils/achievement-broadcaster.js";

// In contest payout endpoint
if (winner) {
  broadcastContestAchievement({ ... });
}
```

### Sales Milestone Tracker
`server/utils/sales-milestone-tracker.ts`

```typescript
// For future sales rep update endpoint
import { analyzeSalesRepUpdate } from "../../utils/sales-milestone-tracker.js";

// When updating sales rep data
analyzeSalesRepUpdate({
  userId,
  userName,
  oldData: { monthlyRevenue: 45000, rank: 12 },
  newData: { monthlyRevenue: 52000, rank: 9 },
});
// Automatically detects and broadcasts:
// - $50K milestone crossed
// - Rank improved from 12 to 9
```

## WebSocket Rooms

### leaderboard namespace
All achievement events are emitted here.

### tv-display room
Public celebrations visible on TV displays.

```typescript
socket.emit('join:tv-display');
socket.on('achievement:celebration', handler);
```

### user:{userId} room
Personal achievements for specific users.

```typescript
socket.emit('join:user', userId);
socket.on('achievement:earned', handler);
```

## Event Payloads

### achievement:celebration (TV Display)
```typescript
{
  userId: number;
  userName: string;
  achievementType: "rank" | "milestone" | "streak" | "contest";
  title: string;
  description: string;
  icon?: string;
  timestamp: Date;
}
```

### achievement:earned (User Personal)
Same payload as above, sent only to the user who earned it.

## Client Implementation Example

### React Component
```typescript
import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

function AchievementToast() {
  const [achievement, setAchievement] = useState(null);

  useEffect(() => {
    const socket = io('http://localhost:5000/leaderboard');

    socket.emit('join:tv-display');

    socket.on('achievement:celebration', (data) => {
      setAchievement(data);
      setTimeout(() => setAchievement(null), 5000);
    });

    return () => socket.disconnect();
  }, []);

  if (!achievement) return null;

  return (
    <div className="achievement-toast">
      <span>{achievement.icon}</span>
      <div>
        <h4>{achievement.title}</h4>
        <p>{achievement.userName}</p>
        <p>{achievement.description}</p>
      </div>
    </div>
  );
}
```

### TV Display
```typescript
function TVDisplay() {
  const [achievements, setAchievements] = useState([]);

  useEffect(() => {
    const socket = io('http://localhost:5000/leaderboard');
    socket.emit('join:tv-display');

    socket.on('achievement:celebration', (achievement) => {
      setAchievements(prev => [achievement, ...prev].slice(0, 5));
    });

    return () => socket.disconnect();
  }, []);

  return (
    <div className="tv-display">
      <h2>Recent Achievements</h2>
      {achievements.map((ach, i) => (
        <div key={i} className="achievement-card">
          <span className="icon">{ach.icon}</span>
          <div>
            <h3>{ach.title}</h3>
            <p>{ach.userName}</p>
            <small>{new Date(ach.timestamp).toLocaleTimeString()}</small>
          </div>
        </div>
      ))}
    </div>
  );
}
```

## Testing

### Manual Testing

```bash
# Terminal 1: Start server
npm run server:dev

# Terminal 2: Connect with wscat
npm install -g wscat
wscat -c "ws://localhost:5000/leaderboard"

# Join TV display
> {"type": "join:tv-display"}

# Trigger achievement by calling API endpoints
curl -X POST http://localhost:5000/api/training/gamification/award-xp \
  -H "Content-Type: application/json" \
  -d '{"xpAmount": 1000, "action": "module_complete"}'
```

### Unit Testing

```typescript
import { broadcastBadgeAchievement } from '../utils/achievement-broadcaster';

describe('Achievement Broadcasting', () => {
  it('should broadcast badge achievement', () => {
    const spy = jest.spyOn(wsHandlers.leaderboard, 'celebrateAchievement');

    broadcastBadgeAchievement({
      userId: 1,
      userName: 'Test User',
      badgeName: 'Test Badge',
      badgeDescription: 'Test description',
    });

    expect(spy).toHaveBeenCalledWith({
      userId: 1,
      userName: 'Test User',
      achievementType: 'milestone',
      title: '🏆 Test Badge Badge Earned!',
      description: 'Test description',
      timestamp: expect.any(Date),
    });
  });
});
```

## Debugging

### Enable Logging

All broadcasts are logged to console:

```
[Achievement Broadcaster] Initialized
[Achievement Broadcaster] Badge broadcast: Master Trainer for user 123
[Milestone Tracker] John Doe reached $50000 monthly revenue milestone
[Leaderboard] Celebrated achievement for user 123: 🎖️ Level 10 Achieved!
```

### Check WebSocket Connection

```typescript
socket.on('connect', () => {
  console.log('Connected to leaderboard namespace');
});

socket.on('joined', (data) => {
  console.log('Joined room:', data.room);
});

socket.on('error', (error) => {
  console.error('Socket error:', error);
});
```

## Future Enhancements

1. **Persistent Achievement History**: Store broadcasts in database
2. **Achievement Animations**: Add animation metadata to payloads
3. **Sound Effects**: Trigger sound effects on client
4. **Team Achievements**: Broadcast team-wide accomplishments
5. **Combo Achievements**: Multi-achievement combos (e.g., badge + level up)
6. **Leaderboard Live Updates**: Real-time rank position changes
7. **Achievement Replays**: Replay recent achievements on dashboard

## Troubleshooting

### Achievements Not Broadcasting

1. Check WebSocket handler initialization:
   ```typescript
   // server/index.ts should have:
   initializeAchievementBroadcaster(wsHandlers);
   ```

2. Verify client is connected to correct namespace:
   ```typescript
   const socket = io('/leaderboard'); // Note: /leaderboard namespace
   ```

3. Ensure client joined correct room:
   ```typescript
   socket.emit('join:tv-display');
   // or
   socket.emit('join:user', userId);
   ```

### Broadcasting But Not Receiving

1. Check room membership:
   ```typescript
   socket.on('joined', (data) => {
     console.log('Successfully joined:', data.room);
   });
   ```

2. Verify event listener:
   ```typescript
   socket.on('achievement:celebration', (data) => {
     console.log('Received:', data);
   });
   ```

3. Check CORS settings in server configuration

---

**Last Updated**: 2026-01-18
**Version**: 1.0
**Maintainer**: Roof ER Command Center Team
