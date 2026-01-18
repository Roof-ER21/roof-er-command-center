# Database Migrations

## Current Migration

**File**: `0000_empty_starbolt.sql`
**Created**: January 18, 2026
**Status**: Ready to apply
**Tables**: 65 total

## New Gamification Tables

This migration adds 4 new tables for leaderboard gamification:

| Table | Purpose | Rows Expected |
|-------|---------|---------------|
| `leaderboard_snapshots` | Daily rank history | ~365 per rep per year |
| `badges` | Badge definitions | ~20-50 total |
| `player_profiles` | Gamification stats | 1 per sales rep |
| `player_badges` | Earned badges | Variable |

## Quick Start

```bash
# 1. Check your database connection
echo $DATABASE_URL

# 2. Run the migration
npm run db:migrate

# 3. Verify in Drizzle Studio
npm run db:studio
```

## Table Details

### leaderboard_snapshots
- **Foreign Key**: `sales_rep_id` → `sales_reps.id`
- **Index Strategy**: Consider adding index on `(sales_rep_id, snapshot_date)`
- **Retention**: Archive snapshots older than 1 year

### badges
- **Unique Constraint**: `name` field
- **Categories**: performance | milestone | streak | special
- **Rarity Levels**: common | rare | epic | legendary

### player_profiles
- **Unique Constraint**: `sales_rep_id` (one profile per rep)
- **Auto-create**: Should be created when sales rep is created
- **Points Calculation**: Typically 100 points = 1 signup

### player_badges
- **Composite Unique**: Consider adding `UNIQUE(player_id, badge_id)`
- **Cascade**: Should cascade delete when player is deleted

## Migration Commands

```bash
# Generate new migration from schema changes
npm run db:generate

# Push schema directly (no migration file)
npm run db:push

# Run pending migrations
npm run db:migrate

# Open Drizzle Studio
npm run db:studio
```

## Full Documentation

See `/Users/a21/roof-er-command-center/MIGRATION_GUIDE.md` for complete details.
