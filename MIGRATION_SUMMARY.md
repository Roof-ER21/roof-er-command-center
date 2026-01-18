# Database Migration Summary - Gamification Tables

## Status: ✅ READY TO RUN

Generated: **January 18, 2026**
Migration File: `migrations/0000_empty_starbolt.sql`
Tables Created: **65 total** (4 new gamification tables)

---

## What Was Done

### 1. Migration Generated

✅ **File Created**: `/Users/a21/roof-er-command-center/migrations/0000_empty_starbolt.sql`
- 65 tables with full schema
- Foreign key constraints
- Default values
- Timestamps

### 2. Scripts Created

✅ **Migration Runner**: `scripts/run-migrations.ts`
- Runs migrations from `migrations/` folder
- Error handling
- Success confirmation
- Usage: `npm run db:migrate`

✅ **Migration Test**: `scripts/test-migration.ts`
- Tests database connection
- Checks for conflicts
- Verifies permissions
- Usage: `npm run db:migrate:test`

### 3. Existing Scripts Verified

✅ **Badge Seeder**: `scripts/seed-badges.ts` (already exists)
- Creates 38 comprehensive badge definitions
- Idempotent (can run multiple times)
- Categories: performance (7), milestone (12), streak (5), special (14)
- Usage: `npm run db:seed:badges`

✅ **Snapshot Capture**: `scripts/capture-leaderboard-snapshot.ts` (already exists)
- Captures daily rank snapshots
- Usage: `npm run leaderboard:snapshot`

### 4. Documentation Created

✅ **Complete Migration Guide**: `MIGRATION_GUIDE.md`
- Step-by-step instructions
- Table schema details
- Post-migration steps
- Rollback procedures

✅ **Schema Diagrams**: `docs/GAMIFICATION_SCHEMA.md`
- Entity relationship diagram
- Query patterns
- Performance tips
- Index suggestions

✅ **Quick Reference**: `QUICK_MIGRATION_REFERENCE.md`
- 3-step migration process
- Common commands
- Verification queries

✅ **Migration Folder README**: `migrations/README.md`
- Current migration info
- Table details
- Quick commands

---

## New Tables

### Table 1: `leaderboard_snapshots`

**Purpose**: Historical rank tracking for trend analysis

| Column | Type | Description |
|--------|------|-------------|
| id | serial PK | Auto-increment |
| sales_rep_id | integer FK | References sales_reps.id |
| snapshot_date | text | YYYY-MM-DD format |
| rank | integer | Position on leaderboard |
| points | integer | Points at snapshot time |
| monthly_signups | numeric(6,1) | Signups at snapshot time |
| season_id | text | Season identifier |
| created_at | timestamp | Auto timestamp |

**Foreign Keys**: `sales_rep_id` → `sales_reps.id`
**Expected Rows**: ~365 per rep per year

---

### Table 2: `badges`

**Purpose**: Badge/achievement definitions

| Column | Type | Description |
|--------|------|-------------|
| id | serial PK | Auto-increment |
| name | text UNIQUE | Badge name |
| description | text | What it represents |
| icon_url | text | Badge icon path |
| category | text | performance/milestone/streak/special |
| rarity | text | common/rare/epic/legendary |
| requirement | text | JSON requirements |
| is_active | boolean | Enabled for earning |
| created_at | timestamp | Auto timestamp |

**Unique Constraint**: `name`
**Expected Rows**: ~20-50 total

---

### Table 3: `player_profiles`

**Purpose**: Gamification stats for sales reps

| Column | Type | Description |
|--------|------|-------------|
| id | serial PK | Auto-increment |
| sales_rep_id | integer FK UNIQUE | One profile per rep |
| player_level | integer | Gamification level (1-100) |
| total_career_points | integer | All-time points |
| season_points | integer | Points this season |
| monthly_points | integer | Points this month |
| current_streak | integer | Current consecutive days |
| longest_streak | integer | Best streak record |
| last_activity_date | text | Last signup date |
| created_at | timestamp | Auto timestamp |
| updated_at | timestamp | Auto timestamp |

**Foreign Keys**: `sales_rep_id` → `sales_reps.id`
**Unique Constraint**: `sales_rep_id`
**Expected Rows**: 1 per sales rep

---

### Table 4: `player_badges`

**Purpose**: Track earned badges (junction table)

| Column | Type | Description |
|--------|------|-------------|
| id | serial PK | Auto-increment |
| player_id | integer FK | References player_profiles.id |
| badge_id | integer FK | References badges.id |
| earned_at | timestamp | When badge was earned |

**Foreign Keys**:
- `player_id` → `player_profiles.id`
- `badge_id` → `badges.id`

**Expected Rows**: Variable

---

## How to Run the Migration

### Step 1: Test the Connection (Optional but Recommended)

```bash
npm run db:migrate:test
```

This will:
- ✅ Verify database connection
- ✅ Check for table conflicts
- ✅ Test CREATE permissions
- ✅ Show PostgreSQL version

### Step 2: Run the Migration

```bash
npm run db:migrate
```

This will:
- 📦 Read `migrations/0000_empty_starbolt.sql`
- 🔨 Create all 65 tables
- 🔗 Set up foreign keys
- ✅ Confirm success

### Step 3: Verify Success

```bash
npm run db:studio
```

Or check with SQL:
```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'badges',
    'player_profiles',
    'player_badges',
    'leaderboard_snapshots'
  )
ORDER BY table_name;
```

Expected: 4 rows

---

## Post-Migration Steps

### 1. Seed Badges

```bash
npm run db:seed:badges
```

This creates 38 badge definitions:
- 🏆 **7 Performance badges** (signup milestones)
- 🏅 **12 Milestone badges** (revenue, bonus tiers)
- 🔥 **5 Streak badges** (activity consistency)
- ⭐ **14 Special badges** (unique achievements)

### 2. Create Player Profiles

Add to your seed script or run manually:

```typescript
import { db } from './server/db';
import { salesReps, playerProfiles } from './shared/schema';

const reps = await db.select().from(salesReps);

for (const rep of reps) {
  await db.insert(playerProfiles).values({
    salesRepId: rep.id,
    playerLevel: 1,
    totalCareerPoints: Math.floor(parseFloat(rep.allTimeRevenue) / 100),
    seasonPoints: 0,
    monthlyPoints: Math.floor(parseFloat(rep.monthlyRevenue) / 100),
    currentStreak: 0,
    longestStreak: 0,
  });
}
```

### 3. Set Up Daily Snapshot Cron Job

The script already exists at `scripts/capture-leaderboard-snapshot.ts`.

**Option A: Manual Execution**
```bash
npm run leaderboard:snapshot
```

**Option B: Cron Job (Recommended)**
```bash
# Add to crontab
59 23 * * * cd /Users/a21/roof-er-command-center && npm run leaderboard:snapshot
```

**Option C: Node-Cron (In Application)**
```typescript
import cron from 'node-cron';

// Run daily at 11:59 PM
cron.schedule('59 23 * * *', async () => {
  console.log('📸 Capturing leaderboard snapshot...');
  // Run snapshot logic
});
```

---

## Available Commands

| Command | Purpose |
|---------|---------|
| `npm run db:generate` | Generate migration from schema changes |
| `npm run db:migrate:test` | Test database connection and readiness |
| `npm run db:migrate` | Run pending migrations |
| `npm run db:push` | Push schema directly (no migration file) |
| `npm run db:studio` | Open Drizzle Studio |
| `npm run db:seed:badges` | Seed badge definitions |
| `npm run leaderboard:snapshot` | Capture daily rank snapshot |

---

## Files Created

### Migration Files
- ✅ `/Users/a21/roof-er-command-center/migrations/0000_empty_starbolt.sql`
- ✅ `/Users/a21/roof-er-command-center/migrations/meta/` (Drizzle metadata)

### Scripts
- ✅ `/Users/a21/roof-er-command-center/scripts/run-migrations.ts`
- ✅ `/Users/a21/roof-er-command-center/scripts/test-migration.ts`
- ✅ `/Users/a21/roof-er-command-center/scripts/seed-badges.ts` (already existed)
- ✅ `/Users/a21/roof-er-command-center/scripts/capture-leaderboard-snapshot.ts` (already existed)

### Documentation
- ✅ `/Users/a21/roof-er-command-center/MIGRATION_GUIDE.md`
- ✅ `/Users/a21/roof-er-command-center/MIGRATION_SUMMARY.md` (this file)
- ✅ `/Users/a21/roof-er-command-center/QUICK_MIGRATION_REFERENCE.md`
- ✅ `/Users/a21/roof-er-command-center/docs/GAMIFICATION_SCHEMA.md`
- ✅ `/Users/a21/roof-er-command-center/migrations/README.md`

### Updated Files
- ✅ `/Users/a21/roof-er-command-center/package.json` (added `db:migrate:test` script)

---

## Rollback (if needed)

If you need to undo the migration:

```sql
-- Connect to database
psql $DATABASE_URL

-- Drop tables in reverse dependency order
DROP TABLE IF EXISTS player_badges CASCADE;
DROP TABLE IF EXISTS player_profiles CASCADE;
DROP TABLE IF EXISTS badges CASCADE;
DROP TABLE IF EXISTS leaderboard_snapshots CASCADE;
```

---

## Expected Results

After running migration and seeding:

### Database Tables
- ✅ 4 new gamification tables created
- ✅ Foreign keys established
- ✅ Constraints applied

### Seeded Data
- ✅ 38 badge definitions inserted
- ✅ Categories: performance, milestone, streak, special
- ✅ Rarity levels: common, rare, epic, legendary

### Ready for Use
- ✅ Badge system operational
- ✅ Player profiles can be created
- ✅ Snapshots can be captured
- ✅ Rank trends can be tracked

---

## Next Development Steps

1. **UI Components**
   - Badge display component
   - Rank trend chart
   - Player profile card
   - Achievement notifications

2. **Backend Logic**
   - Badge earning triggers
   - Points calculation
   - Streak tracking
   - Snapshot automation

3. **Features**
   - Badge showcase page
   - Leaderboard with trends
   - Player progression view
   - Achievement history

---

## Support & Documentation

- **Schema Source**: `/Users/a21/roof-er-command-center/shared/schema.ts` (lines 633-678)
- **Drizzle Config**: `/Users/a21/roof-er-command-center/drizzle.config.ts`
- **Full Guide**: [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)
- **Schema Details**: [docs/GAMIFICATION_SCHEMA.md](./docs/GAMIFICATION_SCHEMA.md)
- **Quick Reference**: [QUICK_MIGRATION_REFERENCE.md](./QUICK_MIGRATION_REFERENCE.md)

---

## Checklist

- [ ] Run `npm run db:migrate:test` to verify readiness
- [ ] Run `npm run db:migrate` to apply migration
- [ ] Run `npm run db:studio` to verify tables
- [ ] Run `npm run db:seed:badges` to create badges
- [ ] Create player profiles for existing sales reps
- [ ] Set up daily snapshot cron job
- [ ] Test badge earning logic
- [ ] Build UI components

---

**Status**: ✅ Migration is ready to run!

**Execute**: `npm run db:migrate`

---

**Generated by**: Drizzle Kit v0.30.4
**Database**: PostgreSQL (via `$DATABASE_URL`)
**Project**: Roof ER Command Center v1.0.0
