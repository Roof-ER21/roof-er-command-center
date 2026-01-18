# Milestone Detection - Quick Reference Card

## API Endpoint

```typescript
POST /api/leaderboard/sales-reps/:id/update-stats
```

## Request Example

```typescript
await fetch('/api/leaderboard/sales-reps/1/update-stats', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    monthlySignups: '25',
    monthlyRevenue: '50000',
    goalProgress: '125'
  })
});
```

## Response Structure

```typescript
{
  success: true,
  rep: { /* updated rep data */ },
  milestones: [
    {
      id: string,
      type: 'revenue' | 'signups' | 'bonus_tier' | 'goal_achieved' | 'rank_change',
      title: string,
      description: string,
      value: string | number,
      emoji: string,
      color: string,
      achievedAt: Date,
      salesRep: { /* rep info */ }
    }
  ],
  rankChange: number
}
```

## WebSocket Events

```typescript
import { io } from 'socket.io-client';

const socket = io('http://localhost:5000/leaderboard');

// Personal achievement
socket.on('achievement:earned', (achievement) => {
  // Show celebration for this user
});

// Public celebration
socket.on('achievement:celebration', (achievement) => {
  // Show on TV displays
});

// Leaderboard refresh
socket.on('leaderboard:refresh', (rankings) => {
  // Update leaderboard UI
});
```

## Milestone Thresholds

### Revenue 💰
$10k | $25k | $50k | $75k | $100k

### Signups 🎯
10 | 15 | 20 | 25 | 30 | 35 | 40

### Bonus Tiers 💎
- Tier 1: 15+ signups (🪙)
- Tier 2: 20+ signups (💰)
- Tier 3: 25+ signups (💎)
- Tier 4: 30+ signups (🏆)
- Tier 5: 35+ signups (👑)
- Tier 6: 40+ signups (💯)

### Goal Achievement 🏆
100% or higher

### Rank Change 🥇
Moving into top 3

## Auto-Awarded Badges

| Milestone | Badge |
|-----------|-------|
| $100k+ revenue | Revenue King |
| $50k+ revenue | Top Earner |
| $25k+ revenue | Rising Star |
| 40+ signups | Signup Master |
| 30+ signups | Consistent Closer |
| 20+ signups | Sales Rookie |
| Bonus tier | Bonus Achiever |
| 100% goal | Goal Crusher |
| Top 3 rank | Top Performer |

## Common Patterns

### Record a Sale

```typescript
const result = await fetch(`/api/leaderboard/sales-reps/${repId}/update-stats`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    monthlyRevenue: (currentRevenue + saleAmount).toString(),
    monthlySignups: (currentSignups + 1).toString(),
    yearlyRevenue: (yearlyRevenue + saleAmount).toString()
  })
});

const { milestones } = await result.json();
// milestones array contains any triggered milestones
```

### Listen for Achievements

```typescript
useEffect(() => {
  const socket = io('http://localhost:5000/leaderboard');

  socket.on('achievement:celebration', (achievement) => {
    showMilestone(achievement.milestone);
  });

  return () => socket.disconnect();
}, []);
```

## Error Handling

```typescript
try {
  const response = await fetch(url, options);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Update failed');
  }

  return await response.json();
} catch (error) {
  console.error('Update error:', error);
  // Handle error
}
```

## Authentication

All requests require:
1. Valid session cookie (include `credentials: 'include'`)
2. Leaderboard module access

## Files

- **Logic:** `/server/routes/leaderboard/milestones.ts`
- **Endpoint:** `/server/routes/leaderboard/index.ts`
- **WebSocket:** `/server/websocket/leaderboard.ts`

## Testing

```bash
curl -X POST http://localhost:5000/api/leaderboard/sales-reps/1/update-stats \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=YOUR_SESSION" \
  -d '{"monthlySignups":"25","monthlyRevenue":"50000"}'
```

## Build & Deploy

```bash
npm run build  # TypeScript compilation
npm run dev    # Development mode
```

Build status: ✅ Passing

---

**Quick Links:**
- Full docs: `MILESTONE_DETECTION_README.md`
- Examples: `examples/update-sales-stats-example.ts`
- Implementation: `IMPLEMENTATION_SUMMARY.md`
