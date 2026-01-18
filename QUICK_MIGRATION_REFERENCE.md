# Quick Migration Reference

## Run Migration (3 Steps)

```bash
# 1. Navigate to project
cd /Users/a21/roof-er-command-center

# 2. Run migration
npm run db:migrate

# 3. Verify success
npm run db:studio
```

---

## What Gets Created

4 new tables for gamification:

| Table | Records | Purpose |
|-------|---------|---------|
| `badges` | ~20-50 | Badge definitions |
| `player_profiles` | 1 per rep | XP, levels, streaks |
| `player_badges` | Variable | Earned badges |
| `leaderboard_snapshots` | Daily | Rank history |

---

## Files Created

| File | Purpose |
|------|---------|
| `migrations/0000_empty_starbolt.sql` | Generated SQL migration |
| `scripts/run-migrations.ts` | Migration runner script |
| `MIGRATION_GUIDE.md` | Complete migration docs |
| `migrations/README.md` | Migration folder docs |
| `docs/GAMIFICATION_SCHEMA.md` | Schema relationships |

---

## Verification Query

After migration, run this in Drizzle Studio or psql:

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

## Common Commands

```bash
# Generate migration from schema changes
npm run db:generate

# Push schema directly (skip migration file)
npm run db:push

# Run pending migrations
npm run db:migrate

# Open Drizzle Studio
npm run db:studio

# Check database connection
echo $DATABASE_URL
```

---

## Rollback (if needed)

```sql
DROP TABLE IF EXISTS player_badges CASCADE;
DROP TABLE IF EXISTS player_profiles CASCADE;
DROP TABLE IF EXISTS badges CASCADE;
DROP TABLE IF EXISTS leaderboard_snapshots CASCADE;
```

---

## Next Steps After Migration

1. **Seed badges** - Add starter badge definitions
2. **Create player profiles** - For existing sales reps
3. **Set up cron job** - Daily snapshot capture
4. **Build UI components** - Badge display, rank trends

---

## Documentation

- **Full Guide**: [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)
- **Schema Docs**: [docs/GAMIFICATION_SCHEMA.md](./docs/GAMIFICATION_SCHEMA.md)
- **Migration SQL**: [migrations/0000_empty_starbolt.sql](./migrations/0000_empty_starbolt.sql)

---

## Support

**Schema Location**: `/Users/a21/roof-er-command-center/shared/schema.ts` (lines 633-678)

**Migration Config**: `/Users/a21/roof-er-command-center/drizzle.config.ts`

**Database**: PostgreSQL (via `$DATABASE_URL`)

---

✅ **Ready to run!** Execute `npm run db:migrate` when ready.
