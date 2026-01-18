# Database Scripts

This directory contains database utility scripts for the Roof ER Command Center.

## Available Scripts

### 1. Seed Database (`seed-database.ts`)

Populates the database with comprehensive sample data for testing and development.

**Usage:**
```bash
npm run db:seed
```

**What it creates:**
- 3 Territories (Mid-Atlantic, Northeast, Southeast)
- 3 Teams (Alpha Team, Beta Team, Gamma Team)
- 9 Users with different roles and access levels
- 2 Sales Rep records with performance data
- 10 Achievements across different categories
- 2 Contests (1 active, 1 upcoming)
- Achievement awards for eligible users
- Contest participants for the active contest

**Default credentials:**
- All users have password: `test123`
- See `SEED_DATA_REFERENCE.md` for complete user list

**Features:**
- Safe to run multiple times (uses `onConflictDoNothing()`)
- Skips existing admin account
- Automatically links sales reps to users
- Awards achievements based on user stats

### 2. Reset and Seed (`reset-and-seed.ts`)

Completely resets the database schema and re-seeds with fresh data.

**Usage:**
```bash
npm run db:reset
```

**Warning:** This will DELETE ALL existing data!

**What it does:**
1. Runs `npm run db:push` to recreate all tables
2. Runs `npm run db:seed` to populate with sample data

**Use cases:**
- Starting fresh after schema changes
- Resetting to known state for testing
- Cleaning up corrupted or test data

### 3. Run Migrations (`run-migrations.ts`)

Runs database migrations (if you're using migration files).

**Usage:**
```bash
npm run db:migrate
```

### 4. Capture Leaderboard Snapshot (`capture-leaderboard-snapshot.ts`)

Creates daily snapshots of the leaderboard for historical rank tracking and chart data.

**Usage:**
```bash
npm run leaderboard:snapshot
```

**What it does:**
- Fetches all active sales reps
- Calculates current rank based on monthly signups
- Calculates performance points (signups × 100 + rank bonus)
- Inserts snapshot records with date, rank, points, and season ID
- Skips if snapshot already exists for today (idempotent)

**Points Formula:**
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

**Scheduling:**
- **Recommended:** Run daily at midnight (00:00 UTC)
- **Railway:** Use Railway Cron Jobs
- **System Cron:** `0 0 * * * cd /path/to/project && npm run leaderboard:snapshot`
- **In-app:** Use `node-cron` package (see docs)

**See:** `/docs/LEADERBOARD_SNAPSHOT_CRON.md` for detailed setup instructions

## Quick Start

### First Time Setup

```bash
# 1. Make sure PostgreSQL is running
# 2. Create the database (if not already created)
createdb roof_er_command_center

# 3. Push the schema to create tables
npm run db:push

# 4. Seed the database
npm run db:seed

# 5. Start the development server
npm run dev
```

### Reset Everything

```bash
# One command to reset and seed
npm run db:reset
```

### View Database

```bash
# Open Drizzle Studio to browse data
npm run db:studio
```

## Database Schema Management

### Schema Changes

When you modify `/shared/schema.ts`:

```bash
# Option 1: Push changes directly (development)
npm run db:push

# Option 2: Generate migration files (production)
npm run db:generate
npm run db:migrate
```

### Schema Introspection

```bash
# Open Drizzle Studio to visualize schema
npm run db:studio
```

## Seeded User Roles

### System Administrator
- **Email:** admin@roof-er.com
- **Access:** Everything (HR, Leaderboard, Training, Field)

### HR Administrator
- **Email:** hr.admin@roof-er.com
- **Access:** HR + Leaderboard + Training

### Sales Representatives
- **Emails:** john.sales@roof-er.com, emily.sales@roof-er.com
- **Access:** Leaderboard + Training + Field

### Trainees
- **Emails:** mike.trainee@roof-er.com, lisa.trainee@roof-er.com
- **Access:** Training only

### Field Technician
- **Email:** carlos.field@roof-er.com
- **Access:** Field + Training

### Manager
- **Email:** robert.manager@roof-er.com
- **Access:** HR + Leaderboard + Training

### General Employee
- **Email:** jane.employee@roof-er.com
- **Access:** Training only

## Testing Workflows

### Test Role-Based Access

```bash
# 1. Seed the database
npm run db:seed

# 2. Start the server
npm run dev

# 3. Login as different users to test access controls
# - SYSTEM_ADMIN should see all modules
# - TRAINEE should only see training
# - SALES_REP should see leaderboard, training, and field
# - etc.
```

### Test Leaderboard Features

```bash
# Login as sales reps to test:
# - john.sales@roof-er.com (higher performance)
# - emily.sales@roof-er.com (good performance)

# Test features:
# - Revenue tracking
# - Contest participation
# - Team rankings
# - Bonus tiers
```

### Test Training Features

```bash
# Login as trainees to test:
# - mike.trainee@roof-er.com (beginner)
# - lisa.trainee@roof-er.com (intermediate)

# Test features:
# - XP progression
# - Achievement unlocks
# - Streak tracking
# - Level advancement
```

### Test Field Features

```bash
# Login as field tech:
# - carlos.field@roof-er.com

# Test features:
# - Field chat
# - Email generation
# - Document viewing
# - State-specific content
```

## Troubleshooting

### Connection Error

```
Error: DATABASE_URL environment variable is required
```

**Solution:** Make sure `.env` file exists with:
```env
DATABASE_URL=postgresql://localhost:5432/roof_er_command_center
```

### Database Doesn't Exist

```
Error: database "roof_er_command_center" does not exist
```

**Solution:**
```bash
createdb roof_er_command_center
```

### Tables Don't Exist

```
Error: relation "users" does not exist
```

**Solution:**
```bash
npm run db:push
npm run db:seed
```

### Duplicate Key Error

```
Error: duplicate key value violates unique constraint
```

**Solution:** The seed script is trying to insert data that already exists. Either:
1. Run `npm run db:reset` to start fresh
2. Or the script will skip duplicates automatically

### Schema Out of Sync

**Solution:**
```bash
# Push latest schema
npm run db:push

# Re-seed if needed
npm run db:seed
```

## Files in This Directory

- `seed-database.ts` - Main seeding script
- `reset-and-seed.ts` - Reset and seed utility
- `run-migrations.ts` - Migration runner
- `capture-leaderboard-snapshot.ts` - Daily leaderboard snapshot cron job
- `health-check.ts` - System health check utility
- `validate-build.ts` - Build validation script
- `verify-tables.ts` - Database table verification
- `SEED_DATA_REFERENCE.md` - Complete reference of seeded data
- `README.md` - This file

## Environment Variables

Required in `.env`:

```env
DATABASE_URL=postgresql://localhost:5432/roof_er_command_center
```

## Database Details

- **Type:** PostgreSQL
- **Database Name:** roof_er_command_center
- **ORM:** Drizzle ORM
- **Connection:** Local PostgreSQL or Neon (serverless)
- **Schema Location:** `/shared/schema.ts`

## Additional Resources

- **Drizzle Docs:** https://orm.drizzle.team/docs/overview
- **PostgreSQL Docs:** https://www.postgresql.org/docs/
- **Seed Data Reference:** `SEED_DATA_REFERENCE.md`

---

**Last Updated:** January 2026
**Project:** Roof ER Command Center
**Database:** PostgreSQL 14+
