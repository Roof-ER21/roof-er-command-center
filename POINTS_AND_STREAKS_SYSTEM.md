# Points and Streaks Update System

## Overview

A comprehensive gamification system for tracking player points (monthly, seasonal, career) and activity streaks. This system enables the Roof ER Command Center to automatically update and maintain gamification metrics tied to sales performance.

## Database Schema

The `playerProfiles` table contains the following tracked fields:

```typescript
playerProfiles {
  id: serial (primary key)
  salesRepId: integer (references salesReps.id)
  playerLevel: integer (default: 1)

  // Points tracking
  totalCareerPoints: integer (default: 0)    // Lifetime accumulation
  seasonPoints: integer (default: 0)         // Reset quarterly
  monthlyPoints: integer (default: 0)        // Reset monthly

  // Streak tracking
  currentStreak: integer (default: 0)        // Consecutive days of activity
  longestStreak: integer (default: 0)        // Best streak ever achieved
  lastActivityDate: text (nullable)          // YYYY-MM-DD format

  createdAt: timestamp
  updatedAt: timestamp
}
```

## Points Calculation Formula

The system uses a configurable points calculation based on sales activities:

- **Each signup**: 100 points
- **Each $1,000 in revenue**: 50 points
- **Bonus tier advancement**: 500 points
- **First place contest finish**: 1,000 points

### Example Calculations

```typescript
// Example 1: Sales rep with 5 signups and $10,000 revenue
activity = {
  signups: 5,
  revenue: 10000
}
points = (5 * 100) + (10 * 50) = 500 + 500 = 1,000 points

// Example 2: Rep achieves tier advancement
activity = {
  signups: 2,
  revenue: 5000,
  tierAdvancement: true
}
points = (2 * 100) + (5 * 50) + 500 = 200 + 250 + 500 = 950 points

// Example 3: First place finish
activity = {
  signups: 10,
  revenue: 25000,
  firstPlaceFinish: true
}
points = (10 * 100) + (25 * 50) + 1000 = 1000 + 1250 + 1000 = 3,250 points
```

## Streak Calculation Logic

### Streak Rules

1. **First Activity**: If no previous activity, streak starts at 1
2. **Consecutive Day** (1 day gap): Increment current streak by 1
3. **Same Day**: No change to streak (activity already recorded)
4. **Gap > 1 Day**: Reset streak to 1

### Longest Streak

The `longestStreak` field is automatically updated whenever `currentStreak` exceeds the previous record.

### Example Streak Scenarios

```typescript
// Scenario 1: First activity ever
lastActivityDate: null
newActivityDate: "2026-01-18"
Result: currentStreak = 1, longestStreak = 1

// Scenario 2: Consecutive day
lastActivityDate: "2026-01-17"
newActivityDate: "2026-01-18"
Result: currentStreak = 5 → 6, longestStreak = 6 (if new record)

// Scenario 3: Same day (no change)
lastActivityDate: "2026-01-18"
newActivityDate: "2026-01-18"
Result: No change to streak

// Scenario 4: Gap in activity (reset)
lastActivityDate: "2026-01-15"
newActivityDate: "2026-01-18"
Result: currentStreak = 1, longestStreak remains unchanged
```

## API Endpoints

### 1. Award Points

Award points to a player profile with automatic calculation from sales activity.

**Endpoint**: `POST /api/leaderboard/player-profiles/:id/award-points`

**Request Body**:
```json
{
  "points": 100,
  "reason": "Closed 2 deals",
  "activity": {
    "signups": 2,
    "revenue": 5000,
    "tierAdvancement": false,
    "firstPlaceFinish": false
  }
}
```

**Response**:
```json
{
  "success": true,
  "pointsAwarded": 400,
  "reason": "Closed 2 deals",
  "profile": {
    "monthlyPoints": 1250,
    "seasonPoints": 4800,
    "totalCareerPoints": 15600
  }
}
```

**Usage Notes**:
- If `activity` object is provided, points are calculated automatically
- Otherwise, the `points` value is used directly
- Updates all three point fields (monthly, seasonal, career)

### 2. Record Activity (Streak)

Record daily activity and update streak calculations.

**Endpoint**: `POST /api/leaderboard/player-profiles/:id/record-activity`

**Request Body**:
```json
{
  "activityDate": "2026-01-18"  // Optional, defaults to today
}
```

**Response**:
```json
{
  "success": true,
  "activityRecorded": "2026-01-18",
  "streakInfo": {
    "wasConsecutive": true,
    "wasReset": false,
    "currentStreak": 7,
    "longestStreak": 12
  }
}
```

### 3. Combined Update (Points + Streak)

Award points AND record activity in a single atomic operation.

**Endpoint**: `POST /api/leaderboard/player-profiles/:id/update-performance`

**Request Body**:
```json
{
  "points": 0,
  "reason": "Daily sales performance",
  "activity": {
    "signups": 3,
    "revenue": 7500
  },
  "recordActivity": true  // Optional, defaults to true
}
```

**Response**:
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

**Usage Notes**:
- This is the **recommended endpoint** for most use cases
- Combines points and streak updates in one transaction
- Set `recordActivity: false` to only update points

### 4. Reset Points (Cron Job)

Reset monthly or seasonal points for all players. Used for scheduled resets at end of period.

**Endpoint**: `POST /api/leaderboard/reset-points?type=monthly|seasonal`

**Query Parameters**:
- `type`: Either "monthly" or "seasonal"

**Response**:
```json
{
  "success": true,
  "type": "monthly",
  "playersUpdated": 45,
  "resetAt": "2026-02-01T00:00:00.000Z"
}
```

**Cron Job Example**:
```bash
# Reset monthly points on 1st of each month at midnight
0 0 1 * * curl -X POST http://localhost:5000/api/leaderboard/reset-points?type=monthly

# Reset seasonal points on 1st of Jan, Apr, Jul, Oct
0 0 1 1,4,7,10 * curl -X POST http://localhost:5000/api/leaderboard/reset-points?type=seasonal
```

### 5. Get Player Profile by Sales Rep ID

**Endpoint**: `GET /api/leaderboard/player-profiles/by-rep/:salesRepId`

**Response**:
```json
{
  "id": 1,
  "salesRepId": 5,
  "playerLevel": 3,
  "totalCareerPoints": 16275,
  "seasonPoints": 5475,
  "monthlyPoints": 1925,
  "currentStreak": 8,
  "longestStreak": 12,
  "lastActivityDate": "2026-01-18",
  "createdAt": "2025-10-01T00:00:00.000Z",
  "updatedAt": "2026-01-18T14:30:00.000Z"
}
```

### 6. Create Player Profile

Create a new player profile for a sales rep.

**Endpoint**: `POST /api/leaderboard/player-profiles`

**Request Body**:
```json
{
  "salesRepId": 5
}
```

**Response**:
```json
{
  "id": 1,
  "salesRepId": 5,
  "playerLevel": 1,
  "totalCareerPoints": 0,
  "seasonPoints": 0,
  "monthlyPoints": 0,
  "currentStreak": 0,
  "longestStreak": 0,
  "lastActivityDate": null,
  "createdAt": "2026-01-18T14:45:00.000Z",
  "updatedAt": "2026-01-18T14:45:00.000Z"
}
```

## Integration Examples

### Example 1: Daily Sales Import

When importing daily sales data, automatically update points and streaks:

```typescript
// Process each sales rep's daily performance
for (const rep of dailySalesData) {
  const profile = await getPlayerProfileByRepId(rep.salesRepId);

  await fetch(`/api/leaderboard/player-profiles/${profile.id}/update-performance`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      points: 0, // Will be calculated from activity
      reason: 'Daily sales import',
      activity: {
        signups: rep.todaySignups,
        revenue: rep.todayRevenue,
        tierAdvancement: rep.achievedNewTier,
        firstPlaceFinish: false
      },
      recordActivity: true
    })
  });
}
```

### Example 2: Contest Winner Bonus

Award bonus points when a sales rep wins a contest:

```typescript
async function awardContestWinner(contestId: number, winnerId: number) {
  const profile = await getPlayerProfileByRepId(winnerId);

  await fetch(`/api/leaderboard/player-profiles/${profile.id}/award-points`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      points: 1000,
      reason: `Won contest: ${contestName}`,
      activity: {
        firstPlaceFinish: true
      }
    })
  });
}
```

### Example 3: Manual Points Award

Award points manually for special achievements:

```typescript
async function awardSpecialBonus(salesRepId: number, reason: string) {
  const profile = await getPlayerProfileByRepId(salesRepId);

  await fetch(`/api/leaderboard/player-profiles/${profile.id}/award-points`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      points: 250,
      reason: reason,
      // No activity object = use direct points value
    })
  });
}
```

### Example 4: Backend Webhook

Integrate with external sales system via webhook:

```typescript
app.post('/webhook/sales-update', async (req, res) => {
  const { salesRepId, signups, revenue } = req.body;

  // Find player profile
  const profileResponse = await fetch(
    `/api/leaderboard/player-profiles/by-rep/${salesRepId}`
  );
  const profile = await profileResponse.json();

  // Update performance
  await fetch(`/api/leaderboard/player-profiles/${profile.id}/update-performance`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      points: 0,
      reason: 'External system update',
      activity: { signups, revenue },
      recordActivity: true
    })
  });

  res.json({ success: true });
});
```

## Error Handling

### Common Error Responses

**400 Bad Request**:
```json
{
  "error": "Invalid points value"
}
```

**404 Not Found**:
```json
{
  "error": "Player profile not found"
}
```

**500 Internal Server Error**:
```json
{
  "error": "Failed to award points"
}
```

### Validation Rules

1. **Points**: Must be a positive number (>= 0)
2. **Reason**: Required string field for audit trail
3. **Activity Date**: Must be valid YYYY-MM-DD format
4. **Reset Type**: Must be "monthly" or "seasonal"
5. **Sales Rep ID**: Must exist in salesReps table

## Security Considerations

1. **Authentication**: All endpoints require authentication via `requireAuth` middleware
2. **Module Access**: Protected by `requireModuleAccess('leaderboard')` middleware
3. **Input Validation**: Points values validated to prevent negative points
4. **Audit Trail**: All point awards include a `reason` field for tracking

## Performance Optimization

1. **Transactions**: All updates use single database transactions
2. **Indexed Queries**: salesRepId is indexed for fast lookups
3. **Batch Updates**: Reset endpoint updates all profiles in one query
4. **Minimal Reads**: Helper functions minimize database round trips

## Future Enhancements

Potential additions to the system:

1. **Point Decay**: Automatically reduce inactive players' points over time
2. **Bonus Multipliers**: Time-based or tier-based point multipliers
3. **Streak Freezes**: Allow players to "freeze" streaks for PTO/vacation
4. **Leaderboard Webhooks**: Real-time notifications for rank changes
5. **Achievements System**: Trigger badge awards based on point thresholds
6. **Historical Analytics**: Track point earning patterns over time

## Testing

### Manual Testing

```bash
# Test creating a profile
curl -X POST http://localhost:5000/api/leaderboard/player-profiles \
  -H "Content-Type: application/json" \
  -d '{"salesRepId": 1}'

# Test awarding points
curl -X POST http://localhost:5000/api/leaderboard/player-profiles/1/award-points \
  -H "Content-Type: application/json" \
  -d '{
    "points": 0,
    "reason": "Test award",
    "activity": {
      "signups": 5,
      "revenue": 10000
    }
  }'

# Test recording activity
curl -X POST http://localhost:5000/api/leaderboard/player-profiles/1/record-activity \
  -H "Content-Type: application/json" \
  -d '{}'

# Test combined update
curl -X POST http://localhost:5000/api/leaderboard/player-profiles/1/update-performance \
  -H "Content-Type: application/json" \
  -d '{
    "points": 0,
    "reason": "Daily update",
    "activity": {
      "signups": 3,
      "revenue": 7500
    }
  }'

# Test reset
curl -X POST "http://localhost:5000/api/leaderboard/reset-points?type=monthly"
```

## Files Modified

- `/Users/a21/roof-er-command-center/server/routes/leaderboard/index.ts`
  - Added helper functions: `calculatePointsFromActivity()`, `calculateStreak()`
  - Added 6 new endpoints for points and streak management
  - Integrated with existing playerProfiles schema

## Maintenance

### Monthly Tasks
- Run reset-points endpoint on 1st of each month
- Review point calculation formulas for fairness
- Check for streak anomalies (unusually long streaks)

### Quarterly Tasks
- Run seasonal reset
- Analyze point distribution across players
- Adjust point values if needed for game balance

### Annual Tasks
- Archive old player profile data
- Review and optimize database indexes
- Update point calculation formulas based on business goals

---

**Last Updated**: January 18, 2026
**Version**: 1.0.0
**Author**: Claude Code (Senior Backend Developer)
