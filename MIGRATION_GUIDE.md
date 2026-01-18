# Database Migration Guide - Gamification Tables

## Overview

This migration adds four new tables to support leaderboard gamification features:

1. **leaderboard_snapshots** - Daily rank history for trend analysis
2. **badges** - Badge definitions (achievements)
3. **player_profiles** - Gamification stats for sales reps
4. **player_badges** - Junction table for earned badges

## Migration File

**Location**: `/Users/a21/roof-er-command-center/migrations/0000_empty_starbolt.sql`

**Generated**: January 18, 2026

**Tables Created**: 65 total (4 new gamification tables)

---

## Table Schemas

### 1. leaderboard_snapshots

Stores daily snapshots of sales rep rankings for historical trend analysis.

```sql
CREATE TABLE "leaderboard_snapshots" (
  "id" serial PRIMARY KEY NOT NULL,
  "sales_rep_id" integer NOT NULL,
  "snapshot_date" text NOT NULL,          -- YYYY-MM-DD format
  "rank" integer NOT NULL,
  "points" integer DEFAULT 0 NOT NULL,
  "monthly_signups" numeric(6, 1) DEFAULT '0' NOT NULL,
  "season_id" text,
  "created_at" timestamp DEFAULT now() NOT NULL
);

ALTER TABLE "leaderboard_snapshots"
  ADD CONSTRAINT "leaderboard_snapshots_sales_rep_id_sales_reps_id_fk"
  FOREIGN KEY ("sales_rep_id") REFERENCES "sales_reps"("id");
```

**Purpose**: Track daily rank positions to show trend charts (rising/falling indicators).

**Usage Example**:
```typescript
// Daily cron job to capture snapshots
await db.insert(leaderboardSnapshots).values({
  salesRepId: rep.id,
  snapshotDate: new Date().toISOString().split('T')[0],
  rank: currentRank,
  points: rep.monthlySignups * 100,
  monthlySignups: rep.monthlySignups,
  seasonId: 'Q1-2026',
});
```

---

### 2. badges

Defines available badges/achievements that sales reps can earn.

```sql
CREATE TABLE "badges" (
  "id" serial PRIMARY KEY NOT NULL,
  "name" text NOT NULL UNIQUE,
  "description" text NOT NULL,
  "icon_url" text,
  "category" text DEFAULT 'performance' NOT NULL,  -- performance | milestone | streak | special
  "rarity" text DEFAULT 'common' NOT NULL,          -- common | rare | epic | legendary
  "requirement" text,                                -- JSON string describing requirements
  "is_active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);
```

**Purpose**: Define achievements like "First Sale", "10-Day Streak", "Top 3 Finish", etc.

**Usage Example**:
```typescript
await db.insert(badges).values({
  name: 'Rookie of the Month',
  description: 'Finish in the top 3 during your first month',
  iconUrl: '/badges/rookie-trophy.svg',
  category: 'milestone',
  rarity: 'rare',
  requirement: JSON.stringify({
    condition: 'first_month_top_3',
    minRank: 3
  }),
});
```

---

### 3. player_profiles

Gamification statistics for each sales rep.

```sql
CREATE TABLE "player_profiles" (
  "id" serial PRIMARY KEY NOT NULL,
  "sales_rep_id" integer NOT NULL UNIQUE,
  "player_level" integer DEFAULT 1 NOT NULL,
  "total_career_points" integer DEFAULT 0 NOT NULL,
  "season_points" integer DEFAULT 0 NOT NULL,
  "monthly_points" integer DEFAULT 0 NOT NULL,
  "current_streak" integer DEFAULT 0 NOT NULL,
  "longest_streak" integer DEFAULT 0 NOT NULL,
  "last_activity_date" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

ALTER TABLE "player_profiles"
  ADD CONSTRAINT "player_profiles_sales_rep_id_sales_reps_id_fk"
  FOREIGN KEY ("sales_rep_id") REFERENCES "sales_reps"("id");
```

**Purpose**: Track XP, levels, streaks, and points for gamification.

**Usage Example**:
```typescript
// Award points for a sale
await db.update(playerProfiles)
  .set({
    monthlyPoints: sql`monthly_points + 100`,
    seasonPoints: sql`season_points + 100`,
    totalCareerPoints: sql`total_career_points + 100`,
    lastActivityDate: new Date().toISOString().split('T')[0],
  })
  .where(eq(playerProfiles.salesRepId, repId));
```

---

### 4. player_badges

Junction table linking players to their earned badges.

```sql
CREATE TABLE "player_badges" (
  "id" serial PRIMARY KEY NOT NULL,
  "player_id" integer NOT NULL,
  "badge_id" integer NOT NULL,
  "earned_at" timestamp DEFAULT now() NOT NULL
);

ALTER TABLE "player_badges"
  ADD CONSTRAINT "player_badges_player_id_player_profiles_id_fk"
  FOREIGN KEY ("player_id") REFERENCES "player_profiles"("id");

ALTER TABLE "player_badges"
  ADD CONSTRAINT "player_badges_badge_id_badges_id_fk"
  FOREIGN KEY ("badge_id") REFERENCES "badges"("id");
```

**Purpose**: Track which badges each player has earned.

**Usage Example**:
```typescript
// Award badge to player
const [profile] = await db.select()
  .from(playerProfiles)
  .where(eq(playerProfiles.salesRepId, repId));

await db.insert(playerBadges).values({
  playerId: profile.id,
  badgeId: badgeId,
});
```

---

## How to Run the Migration

### Option 1: Using the Migration Script (Recommended)

```bash
# Navigate to project directory
cd /Users/a21/roof-er-command-center

# Ensure DATABASE_URL is set in .env
cat .env | grep DATABASE_URL

# Run the migration
npm run db:migrate
```

This will execute `/Users/a21/roof-er-command-center/scripts/run-migrations.ts`, which:
- Reads migrations from the `migrations/` folder
- Applies them in order (0000_empty_starbolt.sql)
- Creates all 65 tables including the 4 new gamification tables
- Prints a success message

### Option 2: Using Drizzle Push (Alternative)

If you prefer to push schema directly:

```bash
npm run db:push
```

**Warning**: This will synchronize the database schema with `shared/schema.ts` without creating migration history.

### Option 3: Manual SQL Execution

If you need to run the migration manually:

```bash
# Connect to your PostgreSQL database
psql $DATABASE_URL

# Run the migration file
\i /Users/a21/roof-er-command-center/migrations/0000_empty_starbolt.sql
```

---

## Verification

After running the migration, verify the tables were created:

```bash
npm run db:studio
```

Or verify using SQL:

```sql
-- Check if gamification tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'leaderboard_snapshots',
    'badges',
    'player_profiles',
    'player_badges'
  )
ORDER BY table_name;
```

Expected output:
```
      table_name
-----------------------
 badges
 leaderboard_snapshots
 player_badges
 player_profiles
(4 rows)
```

---

## Post-Migration Steps

### 1. Seed Initial Badges

Create starter badges for the system:

```typescript
// Add to scripts/seed-database.ts or run separately
const starterBadges = [
  {
    name: 'First Blood',
    description: 'Complete your first sale',
    category: 'milestone',
    rarity: 'common',
    requirement: JSON.stringify({ signups: 1 }),
  },
  {
    name: 'Rising Star',
    description: 'Reach Top 10 for the first time',
    category: 'performance',
    rarity: 'rare',
    requirement: JSON.stringify({ maxRank: 10 }),
  },
  {
    name: 'Streak Master',
    description: 'Maintain a 7-day activity streak',
    category: 'streak',
    rarity: 'epic',
    requirement: JSON.stringify({ streakDays: 7 }),
  },
  {
    name: 'Champion',
    description: 'Finish #1 for the month',
    category: 'performance',
    rarity: 'legendary',
    requirement: JSON.stringify({ rank: 1 }),
  },
];

await db.insert(badges).values(starterBadges);
```

### 2. Create Player Profiles for Existing Sales Reps

```typescript
// Auto-create player profiles for all existing sales reps
const existingReps = await db.select().from(salesReps);

for (const rep of existingReps) {
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

Add to your server's cron jobs (or use node-cron):

```typescript
// server/cron/leaderboard-snapshot.ts
import cron from 'node-cron';

// Run daily at 11:59 PM
cron.schedule('59 23 * * *', async () => {
  const reps = await db.select().from(salesReps)
    .orderBy(desc(salesReps.monthlySignups));

  for (let i = 0; i < reps.length; i++) {
    await db.insert(leaderboardSnapshots).values({
      salesRepId: reps[i].id,
      snapshotDate: new Date().toISOString().split('T')[0],
      rank: i + 1,
      points: reps[i].monthlySignups * 100,
      monthlySignups: reps[i].monthlySignups,
      seasonId: getCurrentSeason(),
    });
  }

  console.log('✅ Daily leaderboard snapshot captured');
});
```

---

## Rollback (if needed)

If you need to rollback the migration:

```sql
-- Drop the new tables in reverse order
DROP TABLE IF EXISTS player_badges CASCADE;
DROP TABLE IF EXISTS player_profiles CASCADE;
DROP TABLE IF EXISTS badges CASCADE;
DROP TABLE IF EXISTS leaderboard_snapshots CASCADE;
```

---

## Database Connection Info

**Environment Variable**: `DATABASE_URL`

**Format**: `postgresql://user:password@host:port/database?sslmode=require`

**Location**: `.env` file in project root

---

## Troubleshooting

### Error: "DATABASE_URL environment variable is required"

**Solution**: Ensure `.env` file exists with valid `DATABASE_URL`:

```bash
echo $DATABASE_URL  # Should output connection string
```

### Error: "relation already exists"

**Solution**: Tables may already exist. Check with:

```sql
\dt  -- List all tables
```

If tables exist, skip migration or drop them first.

### Error: "permission denied"

**Solution**: Ensure database user has CREATE privileges:

```sql
GRANT CREATE ON SCHEMA public TO your_user;
```

---

## Next Steps

1. ✅ Run migration: `npm run db:migrate`
2. ✅ Verify tables: `npm run db:studio`
3. ✅ Seed badges: Add to `scripts/seed-database.ts`
4. ✅ Create player profiles for existing reps
5. ✅ Set up daily snapshot cron job
6. ✅ Build UI components for badges and rank trends

---

## Schema Version

**Migration**: `0000_empty_starbolt`
**Date**: January 18, 2026
**Tables**: 65 (4 new gamification tables)
**Generated by**: Drizzle Kit v0.30.4

---

**Questions?** Check the schema at `/Users/a21/roof-er-command-center/shared/schema.ts` (lines 633-678)
