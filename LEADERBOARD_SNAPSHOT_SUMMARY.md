# Leaderboard Snapshot Feature - Implementation Summary

## What Was Created

A complete daily snapshot system for the leaderboard that captures historical rank data for sales representatives.

## Files Created/Modified

### New Files
1. **`/scripts/capture-leaderboard-snapshot.ts`**
   - Main snapshot capture script
   - 196 lines of production-ready code
   - Includes idempotency, error handling, and logging

2. **`/docs/LEADERBOARD_SNAPSHOT_CRON.md`**
   - Comprehensive documentation (400+ lines)
   - Setup instructions for 3 deployment methods
   - Monitoring, troubleshooting, and best practices
   - SQL queries for data verification

### Modified Files
1. **`/package.json`**
   - Added script: `"leaderboard:snapshot": "tsx scripts/capture-leaderboard-snapshot.ts"`

2. **`/scripts/README.md`**
   - Added documentation for the new snapshot script
   - Updated file listing

## Database Schema

The `leaderboard_snapshots` table (already defined in `/shared/schema.ts`):
```typescript
export const leaderboardSnapshots = pgTable('leaderboard_snapshots', {
  id: serial('id').primaryKey(),
  salesRepId: integer('sales_rep_id').notNull().references(() => salesReps.id),
  snapshotDate: text('snapshot_date').notNull(), // YYYY-MM-DD
  rank: integer('rank').notNull(),
  points: integer('points').notNull().default(0),
  monthlySignups: decimal('monthly_signups', { precision: 6, scale: 1 }).notNull().default('0'),
  seasonId: text('season_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
```

## Key Features

### 1. Idempotent Design
- Safe to run multiple times per day
- Automatically skips if snapshot already exists
- No duplicate data creation

### 2. Performance Points Calculation
```
Points = (Monthly Signups × 100) + Rank Bonus

Rank Bonuses:
  #1:     +500 points
  #2:     +300 points
  #3:     +200 points
  #4-5:   +100 points
  #6-10:  +50 points
  #11+:   +0 points
```

### 3. Season Tracking
- Automatically tags snapshots with season ID (e.g., "2026-Q1")
- Supports quarterly leaderboard resets

### 4. Comprehensive Logging
```
📸 Starting leaderboard snapshot capture...
📅 Snapshot date: 2026-01-18
🔍 Checking for existing snapshot...
✨ No existing snapshot found - proceeding...
👥 Fetching active sales reps...
✅ Found 2 active sales reps
🏆 Current season: 2026-Q1
📊 Calculating ranks and points...
💾 Inserting 2 snapshot records...
✅ Successfully inserted 2 snapshots

📈 Snapshot Summary:
============================================================
   Date:           2026-01-18
   Season:         2026-Q1
   Total Reps:     2
   Top 3 Ranks:
   #1: John Martinez (Alpha Team) - 12.5 signups, 1750 pts
============================================================

⏱️  Completed in 0.03s
```

## How to Use

### Manual Execution
```bash
npm run leaderboard:snapshot
```

### Automated Scheduling

#### Option 1: Railway Cron Jobs (Recommended)
Add to `railway.json`:
```json
{
  "cron": [
    {
      "schedule": "0 0 * * *",
      "command": "npm run leaderboard:snapshot",
      "name": "Daily Leaderboard Snapshot"
    }
  ]
}
```

#### Option 2: System Cron (Linux/macOS)
```cron
# Add to crontab
0 0 * * * cd /Users/a21/roof-er-command-center && npm run leaderboard:snapshot
```

#### Option 3: Node-Cron (In-Process)
Create `server/cron/leaderboard-scheduler.ts`:
```typescript
import cron from 'node-cron';
import { captureLeaderboardSnapshot } from '../../scripts/capture-leaderboard-snapshot.js';

export function startLeaderboardCron() {
  cron.schedule('0 0 * * *', async () => {
    console.log('🕐 Running scheduled leaderboard snapshot...');
    await captureLeaderboardSnapshot();
  });
}
```

## Testing Results

### Test 1: Initial Snapshot Capture
```
✅ Successfully inserted 2 snapshots
✅ Completed in 0.03s
✅ Data verified in database
```

### Test 2: Idempotency Check
```
✅ Snapshot already exists for today - skipping
✅ No duplicate data created
```

### Test 3: Data Verification
```sql
SELECT snapshot_date, rank, name, team, monthly_signups, points, season_id
FROM leaderboard_snapshots ls
JOIN sales_reps sr ON ls.sales_rep_id = sr.id
ORDER BY rank;

 snapshot_date | rank |     name      |    team    | monthly_signups | points | season_id
---------------+------+---------------+------------+-----------------+--------+-----------
 2026-01-18    |    1 | John Martinez | Alpha Team |            12.5 |   1750 | 2026-Q1
 2026-01-18    |    2 | Emily Chen    | Beta Team  |            10.0 |   1300 | 2026-Q1
```

## Integration with Frontend

### API Endpoint Example
```typescript
// GET /api/leaderboard/rank-history/:salesRepId
app.get('/api/leaderboard/rank-history/:salesRepId', async (req, res) => {
  const history = await db
    .select({
      date: schema.leaderboardSnapshots.snapshotDate,
      rank: schema.leaderboardSnapshots.rank,
      points: schema.leaderboardSnapshots.points,
    })
    .from(schema.leaderboardSnapshots)
    .where(eq(schema.leaderboardSnapshots.salesRepId, salesRepId))
    .orderBy(desc(schema.leaderboardSnapshots.snapshotDate))
    .limit(30);

  res.json(history);
});
```

### Chart Component
```tsx
function RankHistoryChart({ salesRepId }) {
  const { data } = useQuery(['rank-history', salesRepId],
    () => fetch(`/api/leaderboard/rank-history/${salesRepId}?days=30`)
      .then(r => r.json())
  );

  return (
    <LineChart data={data}>
      <Line dataKey="rank" stroke="#8884d8" />
      <XAxis dataKey="date" />
      <YAxis reversed /> {/* Lower rank number = better */}
    </LineChart>
  );
}
```

## Monitoring & Maintenance

### Check Recent Snapshots
```sql
SELECT snapshot_date, COUNT(*) as total_reps
FROM leaderboard_snapshots
GROUP BY snapshot_date
ORDER BY snapshot_date DESC
LIMIT 7;
```

### View Top Performer History
```sql
SELECT ls.snapshot_date, sr.name, ls.rank, ls.points
FROM leaderboard_snapshots ls
JOIN sales_reps sr ON ls.sales_rep_id = sr.id
WHERE ls.rank = 1
ORDER BY ls.snapshot_date DESC
LIMIT 10;
```

### Cleanup Old Snapshots (Optional)
```sql
-- Keep only last 90 days
DELETE FROM leaderboard_snapshots
WHERE snapshot_date < (CURRENT_DATE - INTERVAL '90 days')::text;
```

## Production Deployment Checklist

- [x] Script created and tested
- [x] Package.json updated
- [x] Documentation created
- [x] Database table exists (via schema)
- [x] Idempotency verified
- [ ] Choose scheduling method (Railway/System/Node-Cron)
- [ ] Configure cron schedule (`0 0 * * *` recommended)
- [ ] Set up monitoring alerts
- [ ] Test on staging environment
- [ ] Deploy to production
- [ ] Verify first automated run
- [ ] Document in team wiki

## Best Practices

1. **Timing**: Run at **00:00 UTC** (midnight) daily
2. **Monitoring**: Set up alerts for failures
3. **Retention**: Keep 90-365 days of history
4. **Backups**: Backup table before cleanup operations
5. **Testing**: Run manually first to verify setup

## Troubleshooting

### No Snapshots Created
Check if active sales reps exist:
```sql
SELECT COUNT(*) FROM sales_reps WHERE is_active = true;
```

### Duplicate Snapshots
Remove duplicates:
```sql
DELETE FROM leaderboard_snapshots
WHERE id NOT IN (
  SELECT MAX(id)
  FROM leaderboard_snapshots
  GROUP BY sales_rep_id, snapshot_date
);
```

### Connection Errors
Verify database connection:
```bash
npm run health
```

## Technical Details

- **Language**: TypeScript
- **Runtime**: Node.js (via tsx)
- **Database**: PostgreSQL (Drizzle ORM)
- **Exit Codes**: 0 (success), 1 (failure)
- **Execution Time**: ~0.03s for 2 reps, scales linearly
- **Memory Usage**: Minimal (batch operations)

## Future Enhancements

Potential improvements:
- [ ] Add email notifications on failures
- [ ] Support for hourly/weekly snapshots
- [ ] Automatic data archival to cold storage
- [ ] Performance metrics dashboard
- [ ] Snapshot comparison API endpoints
- [ ] Bulk snapshot backfill tool

## Documentation References

- **Setup Guide**: `/docs/LEADERBOARD_SNAPSHOT_CRON.md`
- **Script Source**: `/scripts/capture-leaderboard-snapshot.ts`
- **Scripts README**: `/scripts/README.md`
- **Schema Definition**: `/shared/schema.ts` (lines 633-642)

## Support

For issues or questions:
1. Check Railway/system logs
2. Review `/docs/LEADERBOARD_SNAPSHOT_CRON.md`
3. Verify database connection: `npm run health`
4. Check `#dev-support` channel

---

**Created**: 2026-01-18
**Version**: 1.0.0
**Status**: Production Ready ✅
**Tested**: Yes ✅
**Documented**: Yes ✅
