# Database Migration - Gamification System

> **Status**: ✅ Ready to Execute
> **Date**: January 18, 2026
> **Migration**: `0000_empty_starbolt`
> **Size**: 44 KB (960 lines)

---

## Executive Summary

A complete database migration system has been created for the **Roof ER Command Center** project to add gamification features to the sales leaderboard. The migration adds **4 new tables** with proper relationships, constraints, and indexes.

### New Tables

1. **`leaderboard_snapshots`** - Daily rank history for trend charts
2. **`badges`** - Achievement definitions (38 pre-defined badges)
3. **player_profiles** - Gamification stats (levels, points, streaks)
4. **`player_badges`** - Junction table for earned badges

---

## Quick Start (3 Commands)

```bash
# 1. Test connection (optional but recommended)
npm run db:migrate:test

# 2. Run migration
npm run db:migrate

# 3. Verify success
npm run db:studio
```

---

## What You Get

### Immediate
- ✅ 4 new database tables created
- ✅ Foreign key relationships established
- ✅ Proper constraints and defaults applied
- ✅ Migration history tracked by Drizzle

### After Seeding
- ✅ 38 badge definitions inserted
- ✅ Badge categories: performance, milestone, streak, special
- ✅ Rarity levels: common, rare, epic, legendary
- ✅ Ready for badge earning system

### Long Term
- ✅ Historical rank tracking (snapshots)
- ✅ Player progression system
- ✅ Achievement/badge system
- ✅ Streak tracking
- ✅ Points and levels

---

## Files Created

### Migration Files (Auto-Generated)
```
migrations/
├── 0000_empty_starbolt.sql      (44 KB - The migration)
├── meta/                         (Drizzle metadata)
│   ├── 0000_snapshot.json
│   └── _journal.json
└── README.md                     (Migration folder docs)
```

### Automation Scripts (New)
```
scripts/
├── run-migrations.ts            (Migration runner)
└── test-migration.ts            (Connection tester)
```

### Documentation (New)
```
docs/
└── GAMIFICATION_SCHEMA.md       (ERD, queries, tips)

Root/
├── MIGRATION_GUIDE.md           (Complete instructions)
├── MIGRATION_SUMMARY.md         (Detailed summary)
├── QUICK_MIGRATION_REFERENCE.md (1-page reference)
├── MIGRATION_FILES.txt          (File manifest)
└── README_MIGRATION.md          (This file)
```

### Existing Scripts (Verified)
```
scripts/
├── seed-badges.ts               (38 badge definitions)
└── capture-leaderboard-snapshot.ts (Daily snapshots)
```

---

## NPM Commands

| Command | Purpose | When to Use |
|---------|---------|-------------|
| `npm run db:migrate:test` | Test DB connection | Before migration |
| `npm run db:migrate` | Run migration | Main command |
| `npm run db:push` | Push schema directly | Skip migration file |
| `npm run db:studio` | Open Drizzle Studio | View tables |
| `npm run db:seed:badges` | Seed 38 badges | After migration |
| `npm run leaderboard:snapshot` | Capture snapshot | Daily (cron) |
| `npm run db:generate` | Generate new migration | After schema changes |

---

## Table Schemas

### 1. `leaderboard_snapshots`

```sql
CREATE TABLE "leaderboard_snapshots" (
  "id" serial PRIMARY KEY,
  "sales_rep_id" integer NOT NULL,         -- FK to sales_reps
  "snapshot_date" text NOT NULL,           -- YYYY-MM-DD
  "rank" integer NOT NULL,
  "points" integer DEFAULT 0,
  "monthly_signups" numeric(6, 1) DEFAULT '0',
  "season_id" text,
  "created_at" timestamp DEFAULT now()
);
```

**Purpose**: Track daily rank positions for trend analysis (↑↓ indicators)

---

### 2. `badges`

```sql
CREATE TABLE "badges" (
  "id" serial PRIMARY KEY,
  "name" text NOT NULL UNIQUE,
  "description" text NOT NULL,
  "icon_url" text,
  "category" text DEFAULT 'performance',   -- performance/milestone/streak/special
  "rarity" text DEFAULT 'common',          -- common/rare/epic/legendary
  "requirement" text,                      -- JSON requirements
  "is_active" boolean DEFAULT true,
  "created_at" timestamp DEFAULT now()
);
```

**Purpose**: Define available achievements (seeded with 38 starter badges)

---

### 3. `player_profiles`

```sql
CREATE TABLE "player_profiles" (
  "id" serial PRIMARY KEY,
  "sales_rep_id" integer NOT NULL UNIQUE,  -- FK to sales_reps
  "player_level" integer DEFAULT 1,
  "total_career_points" integer DEFAULT 0,
  "season_points" integer DEFAULT 0,
  "monthly_points" integer DEFAULT 0,
  "current_streak" integer DEFAULT 0,
  "longest_streak" integer DEFAULT 0,
  "last_activity_date" text,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);
```

**Purpose**: Gamification stats (1 profile per sales rep)

---

### 4. `player_badges`

```sql
CREATE TABLE "player_badges" (
  "id" serial PRIMARY KEY,
  "player_id" integer NOT NULL,            -- FK to player_profiles
  "badge_id" integer NOT NULL,             -- FK to badges
  "earned_at" timestamp DEFAULT now()
);
```

**Purpose**: Track which badges each player has earned (junction table)

---

## Migration Process

### Before Migration

1. **Check DATABASE_URL** in `.env`:
   ```bash
   cat .env | grep DATABASE_URL
   ```

2. **Test connection** (optional):
   ```bash
   npm run db:migrate:test
   ```

### During Migration

3. **Run migration**:
   ```bash
   npm run db:migrate
   ```

   Output:
   ```
   🚀 Starting database migration...
   📦 Running migrations from ./migrations folder...
   ✅ Migration completed successfully!
   📊 New tables created:
      - leaderboard_snapshots (daily rank history)
      - badges (badge definitions)
      - player_profiles (gamification stats)
      - player_badges (earned badges junction table)
   🎉 Database schema is now up to date!
   ```

### After Migration

4. **Verify tables** exist:
   ```bash
   npm run db:studio
   ```

5. **Seed badges**:
   ```bash
   npm run db:seed:badges
   ```

   Output:
   ```
   🏅 Seeding badges...
   ✅ Created: Getting Started (common performance)
   ✅ Created: Rising Star (common performance)
   ...
   📊 Total: 38 badges
   ```

6. **Create player profiles** (add to your seed script):
   ```typescript
   const reps = await db.select().from(salesReps);
   for (const rep of reps) {
     await db.insert(playerProfiles).values({
       salesRepId: rep.id,
       playerLevel: 1,
       totalCareerPoints: 0,
     });
   }
   ```

7. **Set up daily snapshots** (cron job):
   ```bash
   # Add to crontab
   59 23 * * * cd /Users/a21/roof-er-command-center && npm run leaderboard:snapshot
   ```

---

## Badge System

### Pre-Seeded Badges (38 Total)

The `seed-badges.ts` script creates a comprehensive badge system:

#### Performance Badges (7)
- Getting Started (10 signups) - Common
- Rising Star (15 signups) - Common
- Sales Pro (20 signups) - Rare
- Heavy Hitter (25 signups) - Rare
- Elite Performer (30 signups) - Epic
- Top Gun (35 signups) - Epic
- Legend (40 signups) - Legendary

#### Milestone Badges (12)
- Revenue Rookie ($10K) - Common
- Revenue Builder ($25K) - Rare
- Revenue Champion ($50K) - Epic
- Revenue Master ($75K) - Epic
- Revenue Legend ($100K) - Legendary
- Bronze/Silver/Gold/Platinum/Diamond/Elite Tiers

#### Streak Badges (5)
- Week Warrior (7 days) - Common
- Two Week Champion (14 days) - Rare
- Monthly Grinder (30 days) - Epic
- Unstoppable Force (60 days) - Epic
- Eternal Flame (90 days) - Legendary

#### Special Badges (14)
- First Sale, Top Performer, Team MVP, Rookie of the Month
- Comeback Kid, Perfect Month, Century Club, Hall of Fame
- Growth Expert, Consistency King, Year Dominator, etc.

---

## Documentation

### Primary Docs
- **[MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)** - Complete step-by-step guide (~200 lines)
- **[MIGRATION_SUMMARY.md](./MIGRATION_SUMMARY.md)** - Executive summary (~350 lines)
- **[QUICK_MIGRATION_REFERENCE.md](./QUICK_MIGRATION_REFERENCE.md)** - 1-page quick ref (~80 lines)

### Technical Docs
- **[docs/GAMIFICATION_SCHEMA.md](./docs/GAMIFICATION_SCHEMA.md)** - ERD, queries, indexes (~400 lines)
- **[migrations/README.md](./migrations/README.md)** - Migration folder overview (~60 lines)
- **[MIGRATION_FILES.txt](./MIGRATION_FILES.txt)** - File manifest

---

## Rollback

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

## Troubleshooting

### Error: DATABASE_URL not set
```bash
# Check .env file
cat .env | grep DATABASE_URL

# Should output: postgresql://user:password@host:port/database
```

### Error: Tables already exist
```bash
# Check which tables exist
npm run db:studio

# Or use SQL
psql $DATABASE_URL -c "\dt"
```

### Error: Permission denied
```sql
-- Grant CREATE permission
GRANT CREATE ON SCHEMA public TO your_user;
```

---

## Next Steps

### Immediate
1. ✅ Run `npm run db:migrate`
2. ✅ Run `npm run db:seed:badges`
3. ✅ Verify in Drizzle Studio

### Development
1. Create player profiles for existing reps
2. Implement badge earning logic
3. Build UI components (badges, trends, profiles)
4. Set up daily snapshot cron job

### Features to Build
- 🏆 Badge showcase page
- 📊 Rank trend charts (↑↓ indicators)
- 👤 Player profile cards
- 🎉 Achievement notifications
- 📈 Leaderboard with trends

---

## Support

**Schema Location**: `/Users/a21/roof-er-command-center/shared/schema.ts` (lines 633-678)

**Drizzle Config**: `/Users/a21/roof-er-command-center/drizzle.config.ts`

**Database**: PostgreSQL (via `$DATABASE_URL`)

**Project**: Roof ER Command Center v1.0.0

---

## Summary

✅ **Migration Generated**: `0000_empty_starbolt.sql` (44 KB)
✅ **Tables Created**: 4 new gamification tables
✅ **Scripts Created**: Migration runner, connection tester
✅ **Documentation**: 6 comprehensive markdown files
✅ **Badge System**: 38 pre-defined badges ready to seed
✅ **Ready to Execute**: `npm run db:migrate`

---

**Questions?** Read the [Complete Migration Guide](./MIGRATION_GUIDE.md) or [Quick Reference](./QUICK_MIGRATION_REFERENCE.md).

**Ready to run?** Execute: `npm run db:migrate`
