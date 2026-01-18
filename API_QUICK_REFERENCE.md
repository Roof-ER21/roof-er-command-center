# Points & Streaks API Quick Reference

## Base URL
```
http://localhost:5000/api/leaderboard
```

## Endpoints Summary

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/player-profiles` | Create new player profile |
| GET | `/player-profiles/by-rep/:salesRepId` | Get profile by sales rep ID |
| POST | `/player-profiles/:id/award-points` | Award points only |
| POST | `/player-profiles/:id/record-activity` | Record activity/streak only |
| POST | `/player-profiles/:id/update-performance` | Award points + record activity (recommended) |
| POST | `/reset-points?type=monthly\|seasonal` | Reset points for all players |

---

## Quick Examples

### 1. Create Player Profile
```bash
curl -X POST http://localhost:5000/api/leaderboard/player-profiles \
  -H "Content-Type: application/json" \
  -d '{"salesRepId": 1}'
```

### 2. Get Player Profile
```bash
curl http://localhost:5000/api/leaderboard/player-profiles/by-rep/1
```

### 3. Award Points (Most Common Use Case)
```bash
curl -X POST http://localhost:5000/api/leaderboard/player-profiles/1/update-performance \
  -H "Content-Type: application/json" \
  -d '{
    "points": 0,
    "reason": "Daily sales",
    "activity": {
      "signups": 3,
      "revenue": 7500
    }
  }'
```

### 4. Reset Monthly Points
```bash
curl -X POST "http://localhost:5000/api/leaderboard/reset-points?type=monthly"
```

---

## Points Calculation Reference

| Activity | Points |
|----------|--------|
| 1 Signup | 100 |
| $1,000 Revenue | 50 |
| Tier Advancement | 500 |
| First Place Finish | 1,000 |

**Example**: 5 signups + $10,000 revenue = 500 + 500 = **1,000 points**

---

## Streak Logic

| Scenario | Result |
|----------|--------|
| First activity | Streak = 1 |
| Consecutive day (1 day gap) | Streak +1 |
| Same day | No change |
| Gap > 1 day | Reset to 1 |

---

## Integration Pattern

```typescript
// Daily import pattern
async function updateDailySales(salesRepId: number, dailyData: any) {
  // 1. Get player profile
  const profile = await fetch(
    `/api/leaderboard/player-profiles/by-rep/${salesRepId}`
  ).then(r => r.json());

  // 2. Update performance
  await fetch(`/api/leaderboard/player-profiles/${profile.id}/update-performance`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      points: 0,
      reason: 'Daily sales import',
      activity: {
        signups: dailyData.signups,
        revenue: dailyData.revenue,
        tierAdvancement: dailyData.newTier,
        firstPlaceFinish: false
      },
      recordActivity: true
    })
  });
}
```

---

## Response Examples

### Success Response (Award Points)
```json
{
  "success": true,
  "pointsAwarded": 675,
  "reason": "Daily sales performance",
  "profile": {
    "monthlyPoints": 1925,
    "seasonPoints": 5475,
    "totalCareerPoints": 16275,
    "currentStreak": 8,
    "longestStreak": 12
  },
  "streakInfo": {
    "wasConsecutive": true,
    "wasReset": false,
    "currentStreak": 8,
    "longestStreak": 12
  }
}
```

### Error Response
```json
{
  "error": "Player profile not found"
}
```

---

## Cron Job Setup

```bash
# Add to crontab (crontab -e)

# Reset monthly points on 1st of each month at midnight
0 0 1 * * curl -X POST http://localhost:5000/api/leaderboard/reset-points?type=monthly

# Reset seasonal points on 1st of Jan, Apr, Jul, Oct at midnight
0 0 1 1,4,7,10 * curl -X POST http://localhost:5000/api/leaderboard/reset-points?type=seasonal
```

---

## Testing Checklist

- [ ] Create player profile for new sales rep
- [ ] Award points for daily sales activity
- [ ] Verify streak updates on consecutive days
- [ ] Test streak reset after gap > 1 day
- [ ] Test same-day activity (no streak change)
- [ ] Award bonus points for tier advancement
- [ ] Award 1000 points for first place finish
- [ ] Reset monthly points successfully
- [ ] Reset seasonal points successfully
- [ ] Verify all point fields update correctly

---

**Quick Start**: Use `/update-performance` endpoint for 90% of use cases. It handles both points and streaks in one call.

**Documentation**: See `POINTS_AND_STREAKS_SYSTEM.md` for complete details.
