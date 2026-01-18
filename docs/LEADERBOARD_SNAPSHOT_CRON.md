# Leaderboard Snapshot Cron Job Setup

This guide explains how to set up automated daily snapshots of the leaderboard for historical rank tracking.

## Overview

The `capture-leaderboard-snapshot.ts` script creates daily snapshots of the leaderboard, capturing:
- Each sales rep's current rank
- Monthly signups count
- Calculated points based on performance
- Current season/quarter ID
- Timestamp of snapshot

This data powers the rank history chart feature on the leaderboard.

## Script Features

### Idempotent Design
- **Safe to run multiple times**: If a snapshot already exists for today, the script exits gracefully
- **No duplicate data**: Database constraints prevent duplicate snapshots per day
- **Fast exit**: Checks for existing data before processing

### Points Calculation Formula
```typescript
Points = (Monthly Signups × 100) + Rank Bonus

Rank Bonuses:
  #1:     +500 points
  #2:     +300 points
  #3:     +200 points
  #4-5:   +100 points
  #6-10:  +50 points
  #11+:   +0 points
```

### Season Tracking
Snapshots are tagged with a season ID (e.g., "2026-Q1") for quarterly leaderboard resets.

---

## Manual Execution

### Run the Script Locally
```bash
cd /Users/a21/roof-er-command-center
npm run leaderboard:snapshot
```

### Expected Output
```
📸 Starting leaderboard snapshot capture...

📅 Snapshot date: 2026-01-18
🔍 Checking for existing snapshot...
✨ No existing snapshot found - proceeding...

👥 Fetching active sales reps...
✅ Found 12 active sales reps
🏆 Current season: 2026-Q1

📊 Calculating ranks and points...
💾 Inserting 12 snapshot records...
✅ Successfully inserted 12 snapshots

📈 Snapshot Summary:
============================================================
   Date:           2026-01-18
   Season:         2026-Q1
   Total Reps:     12
   Top 3 Ranks:
   #1: Sarah Miller (Alpha Team) - 42.0 signups, 4700 pts
============================================================

⏱️  Completed in 1.23s

✅ Snapshot captured successfully (12 records)
```

---

## Automated Scheduling Options

### Option 1: Railway Cron Jobs (Recommended for Production)

Railway provides built-in cron job support with no additional infrastructure needed.

#### Setup Steps

1. **Create a new Railway Service** (or use existing deployment)
   ```bash
   # Ensure your project is deployed to Railway
   railway up
   ```

2. **Add Cron Job Configuration**

   Create or edit `railway.json` in your project root:
   ```json
   {
     "build": {
       "builder": "NIXPACKS"
     },
     "deploy": {
       "numReplicas": 1,
       "startCommand": "npm start",
       "restartPolicyType": "ON_FAILURE",
       "restartPolicyMaxRetries": 10
     },
     "cron": [
       {
         "schedule": "0 0 * * *",
         "command": "npm run leaderboard:snapshot",
         "name": "Daily Leaderboard Snapshot"
       }
     ]
   }
   ```

3. **Alternative: Railway Dashboard**
   - Go to your Railway project
   - Navigate to **Settings** → **Cron Jobs**
   - Click **Add Cron Job**
   - Set schedule: `0 0 * * *` (daily at midnight UTC)
   - Set command: `npm run leaderboard:snapshot`
   - Click **Save**

4. **Verify Schedule**
   ```bash
   railway logs --service=cron-daily-snapshot
   ```

#### Railway Cron Schedule Examples
```
0 0 * * *       # Daily at midnight UTC
0 */6 * * *     # Every 6 hours
0 2 * * *       # Daily at 2:00 AM UTC
0 0 * * 0       # Weekly on Sunday at midnight
```

---

### Option 2: System Cron (Linux/macOS)

For self-hosted deployments or local testing.

#### Setup Steps

1. **Edit Crontab**
   ```bash
   crontab -e
   ```

2. **Add Cron Entry**
   ```cron
   # Daily leaderboard snapshot at midnight
   0 0 * * * cd /Users/a21/roof-er-command-center && npm run leaderboard:snapshot >> /tmp/leaderboard-snapshot.log 2>&1
   ```

3. **With Email Notifications**
   ```cron
   MAILTO=admin@roof-er.com
   0 0 * * * cd /Users/a21/roof-er-command-center && npm run leaderboard:snapshot
   ```

4. **Verify Cron Entry**
   ```bash
   crontab -l
   ```

5. **Check Cron Logs**
   ```bash
   tail -f /tmp/leaderboard-snapshot.log
   ```

#### System Cron Schedule Examples
```cron
0 0 * * *       # Daily at midnight (server time)
30 1 * * *      # Daily at 1:30 AM
0 */4 * * *     # Every 4 hours
0 0 1 * *       # Monthly on the 1st at midnight
0 0 * * 1       # Weekly on Monday at midnight
```

---

### Option 3: Node-Cron (In-Process Scheduler)

For running the scheduler as part of your Node.js application.

#### Implementation

Create `server/cron/leaderboard-scheduler.ts`:
```typescript
import cron from 'node-cron';
import { captureLeaderboardSnapshot } from '../../scripts/capture-leaderboard-snapshot.js';

export function startLeaderboardCron() {
  // Run daily at midnight (00:00)
  cron.schedule('0 0 * * *', async () => {
    console.log('🕐 Running scheduled leaderboard snapshot...');
    try {
      await captureLeaderboardSnapshot();
      console.log('✅ Scheduled snapshot completed');
    } catch (error) {
      console.error('❌ Scheduled snapshot failed:', error);
    }
  });

  console.log('✅ Leaderboard snapshot cron job scheduled (daily at midnight)');
}
```

#### Add to Server Startup

In `server/index.ts`:
```typescript
import { startLeaderboardCron } from './cron/leaderboard-scheduler.js';

// ... existing server setup ...

// Start cron jobs in production
if (process.env.NODE_ENV === 'production') {
  startLeaderboardCron();
}
```

#### Pros & Cons

**Pros:**
- No external scheduler needed
- Runs within your application
- Easy to deploy with your app

**Cons:**
- Requires app to be always running
- Restarts reset the schedule
- No separate monitoring

---

## Monitoring & Maintenance

### Check Recent Snapshots
```sql
SELECT
  snapshot_date,
  COUNT(*) as total_reps,
  MAX(rank) as max_rank,
  SUM(points) as total_points
FROM leaderboard_snapshots
GROUP BY snapshot_date
ORDER BY snapshot_date DESC
LIMIT 7;
```

### View Top Performer History
```sql
SELECT
  ls.snapshot_date,
  sr.name,
  sr.team,
  ls.rank,
  ls.monthly_signups,
  ls.points
FROM leaderboard_snapshots ls
JOIN sales_reps sr ON ls.sales_rep_id = sr.id
WHERE ls.rank = 1
ORDER BY ls.snapshot_date DESC
LIMIT 10;
```

### Check for Missing Snapshots
```sql
-- Find dates with no snapshots (PostgreSQL)
SELECT generate_series(
  CURRENT_DATE - INTERVAL '30 days',
  CURRENT_DATE,
  INTERVAL '1 day'
)::date AS missing_date
WHERE NOT EXISTS (
  SELECT 1 FROM leaderboard_snapshots
  WHERE snapshot_date = missing_date::text
);
```

### Cleanup Old Snapshots (Optional)
```sql
-- Keep only last 90 days
DELETE FROM leaderboard_snapshots
WHERE snapshot_date < (CURRENT_DATE - INTERVAL '90 days')::text;
```

---

## Troubleshooting

### No Snapshots Created
**Check 1: Active Sales Reps**
```sql
SELECT COUNT(*) FROM sales_reps WHERE is_active = true;
```
If zero, no snapshots will be created.

**Check 2: Database Connection**
```bash
npm run health
```

**Check 3: Environment Variables**
```bash
echo $DATABASE_URL
```

### Duplicate Snapshots
The script is idempotent and should skip if data exists. If duplicates appear:
```sql
-- Find duplicates
SELECT sales_rep_id, snapshot_date, COUNT(*)
FROM leaderboard_snapshots
GROUP BY sales_rep_id, snapshot_date
HAVING COUNT(*) > 1;

-- Remove duplicates (keep latest by created_at)
DELETE FROM leaderboard_snapshots
WHERE id NOT IN (
  SELECT MAX(id)
  FROM leaderboard_snapshots
  GROUP BY sales_rep_id, snapshot_date
);
```

### Performance Issues
For large datasets (1000+ sales reps):
- Consider batching inserts (chunks of 100)
- Add database indexes on `snapshot_date` and `sales_rep_id`
- Run during off-peak hours

---

## Best Practices

### Timing Recommendations
- **Production**: Run at **00:00 UTC** (midnight) to capture end-of-day stats
- **Timezone Consideration**: Adjust schedule based on your business day cutoff
- **Before/After Updates**: Run snapshot before nightly data processing

### Backup Strategy
```bash
# Backup snapshots table before cleanup
pg_dump -h localhost -U postgres -t leaderboard_snapshots roof_er_db > snapshots_backup.sql
```

### Monitoring Alerts
Set up alerts for:
- Snapshot failures (cron exit code != 0)
- No new snapshots for 2+ days
- Unexpected snapshot count changes

### Data Retention
- **Recommended**: Keep 1 year of daily snapshots
- **Long-term**: Archive older data to cold storage
- **Legal**: Check data retention policies

---

## Integration with Frontend

### API Endpoint Example
```typescript
// GET /api/leaderboard/rank-history/:salesRepId
app.get('/api/leaderboard/rank-history/:salesRepId', async (req, res) => {
  const { salesRepId } = req.params;
  const days = parseInt(req.query.days as string) || 30;

  const history = await db
    .select({
      date: schema.leaderboardSnapshots.snapshotDate,
      rank: schema.leaderboardSnapshots.rank,
      points: schema.leaderboardSnapshots.points,
      signups: schema.leaderboardSnapshots.monthlySignups,
    })
    .from(schema.leaderboardSnapshots)
    .where(eq(schema.leaderboardSnapshots.salesRepId, salesRepId))
    .orderBy(desc(schema.leaderboardSnapshots.snapshotDate))
    .limit(days);

  res.json(history);
});
```

### Chart Component Usage
```tsx
import { LineChart } from 'recharts';

function RankHistoryChart({ salesRepId }) {
  const { data } = useQuery(['rank-history', salesRepId],
    () => fetch(`/api/leaderboard/rank-history/${salesRepId}?days=30`)
      .then(r => r.json())
  );

  return (
    <LineChart data={data}>
      <Line dataKey="rank" stroke="#8884d8" />
      <XAxis dataKey="date" />
      <YAxis reversed />
    </LineChart>
  );
}
```

---

## Testing

### Test Script Locally
```bash
# Run once
npm run leaderboard:snapshot

# Verify output
npm run db:studio
# Navigate to leaderboard_snapshots table
```

### Test Idempotency
```bash
# Run twice - second should skip
npm run leaderboard:snapshot
npm run leaderboard:snapshot
# Should see "Snapshot already exists for today - skipping"
```

### Test with Mock Data
```sql
-- Create test sales reps
INSERT INTO sales_reps (name, email, team, title, monthly_signups, is_active)
VALUES
  ('Test Rep 1', 'test1@example.com', 'Test Team', 'Sales Rep', 25.0, true),
  ('Test Rep 2', 'test2@example.com', 'Test Team', 'Sales Rep', 30.0, true);

-- Run snapshot
-- npm run leaderboard:snapshot

-- Verify data
SELECT * FROM leaderboard_snapshots
WHERE snapshot_date = CURRENT_DATE::text
ORDER BY rank;
```

---

## Summary

### Quick Setup Checklist
- [ ] Script created: `scripts/capture-leaderboard-snapshot.ts`
- [ ] Package.json updated with `leaderboard:snapshot` command
- [ ] Test script manually: `npm run leaderboard:snapshot`
- [ ] Choose scheduling method (Railway/System/Node-Cron)
- [ ] Configure cron schedule (recommended: `0 0 * * *`)
- [ ] Set up monitoring/alerting
- [ ] Document in team wiki
- [ ] Test idempotency
- [ ] Verify data in database

### Recommended Production Setup
1. **Use Railway Cron Jobs** for simplicity and reliability
2. **Run daily at midnight UTC** (`0 0 * * *`)
3. **Monitor via Railway dashboard** or logs
4. **Set up database backups** before cleanup operations
5. **Review snapshots weekly** to ensure data quality

---

## Support

For issues or questions:
1. Check Railway logs: `railway logs --service=cron-daily-snapshot`
2. Verify database connection: `npm run health`
3. Review this documentation
4. Contact DevOps team

---

**Last Updated**: 2026-01-18
**Script Version**: 1.0.0
**Maintainer**: Roof-ER Command Center Team
