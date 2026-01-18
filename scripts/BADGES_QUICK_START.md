# Badges Quick Start Guide

## Overview

A complete badge seeding system has been created for the Roof ER Command Center leaderboard. This guide will help you get started quickly.

## What's Been Created

✅ **3 New Files:**
1. `scripts/seed-badges.ts` - Badge seed script (36 badge definitions)
2. `scripts/BADGE_SEED_REFERENCE.md` - Complete documentation
3. `scripts/BADGES_QUICK_START.md` - This file

✅ **Updated:**
- `package.json` - Added `db:seed:badges` command

## Quick Start

### Step 1: Ensure Database Schema Exists

```bash
# Push the schema to your database (creates the badges table)
npm run db:push
```

### Step 2: Run Badge Seed

```bash
# Seed all badge definitions
npm run db:seed:badges
```

### Step 3: Verify Badges

```bash
# Open Drizzle Studio to view badges
npm run db:studio
```

## Badge Summary

**Total Badges: 36**

### By Category:
- 🎯 **Performance** (7): Monthly signup milestones (10, 15, 20, 25, 30, 35, 40)
- 🏆 **Milestone** (11): Revenue goals and bonus tiers
- 🔥 **Streak** (5): Activity consistency (7, 14, 30, 60, 90 days)
- ⭐ **Special** (13): Unique achievements and recognition

### By Rarity:
- Common: 7 badges
- Rare: 7 badges
- Epic: 13 badges
- Legendary: 9 badges

## Sample Badges

### Performance
- 🎯 Getting Started (10 signups) - Common
- 💪 Heavy Hitter (25 signups) - Rare
- 👑 Legend (40 signups) - Legendary

### Revenue Milestones
- 💵 Revenue Rookie ($10k) - Common
- 💎 Revenue Champion ($50k) - Epic
- 👑 Revenue Legend ($100k) - Legendary

### Streaks
- 🔥 Week Warrior (7 days) - Common
- 🔥🔥🔥 Monthly Grinder (30 days) - Epic
- 🌟 Eternal Flame (90 days) - Legendary

### Special
- 🎉 First Sale - Common
- 🏆 Top Performer (Rank #1) - Legendary
- 💯 Perfect Month (100% goals) - Epic

## Script Features

✅ **Idempotent**: Safe to run multiple times
✅ **Updates**: Automatically updates existing badge definitions
✅ **Error Handling**: Continues on errors, reports all issues
✅ **Detailed Output**: Shows exactly what was created/updated
✅ **JSON Requirements**: Structured data for automated badge awarding

## Database Schema

The `badges` table includes:

```typescript
{
  id: serial               // Auto-increment primary key
  name: text (unique)      // Badge name
  description: text        // User-facing description
  iconUrl: text?           // Emoji or image URL
  category: enum           // performance | milestone | streak | special
  rarity: enum             // common | rare | epic | legendary
  requirement: text?       // JSON requirement criteria
  isActive: boolean        // Can be earned?
  createdAt: timestamp     // Auto-generated
}
```

## Badge Requirements Format

Each badge has a JSON requirement that defines how to earn it:

```json
// Performance: Monthly signups
{ "type": "monthly_signups", "value": 20 }

// Milestone: Monthly revenue
{ "type": "monthly_revenue", "value": 50000 }

// Milestone: Bonus tier
{ "type": "bonus_tier", "value": 3 }

// Streak: Consecutive days
{ "type": "streak_days", "value": 30 }

// Special: Unique achievements
{ "type": "rank", "value": 1 }
{ "type": "team_mvp", "value": true }
{ "type": "total_signups", "value": 100 }
```

## Next Steps

### 1. Implement Badge Logic (Application Code)

Create a badge service to check eligibility and award badges:

```typescript
// Example: Check if a sales rep earned any new badges
async function checkAndAwardBadges(salesRepId: number) {
  const salesRep = await db.select()
    .from(schema.salesReps)
    .where(eq(schema.salesReps.id, salesRepId))
    .limit(1);

  const badges = await db.select()
    .from(schema.badges)
    .where(eq(schema.badges.isActive, true));

  for (const badge of badges) {
    const requirement = JSON.parse(badge.requirement || '{}');
    const eligible = checkEligibility(salesRep[0], requirement);

    if (eligible) {
      await awardBadge(salesRepId, badge.id);
    }
  }
}
```

### 2. Create UI Components

- Badge display cards
- Badge showcase/profile
- Badge notification toasts
- Badge progress indicators

### 3. Add Automated Triggers

- Check badges after signup updates
- Check badges daily for streaks
- Check badges monthly for milestones
- Check badges after contests end

### 4. Analytics

- Most earned badges
- Rarest badges
- Badge completion rates
- Badge trends over time

## Maintenance

### Adding New Badges

1. Edit `scripts/seed-badges.ts`
2. Add badge definition to the `badges` array
3. Run `npm run db:seed:badges`
4. Update documentation

### Deactivating Badges

```sql
UPDATE badges SET is_active = false WHERE name = 'Badge Name';
```

### Updating Existing Badges

The script automatically updates existing badges when you run it again. Just modify the badge definition in `seed-badges.ts` and re-run.

## Troubleshooting

### "relation badges does not exist"
Run `npm run db:push` first to create the database schema.

### Duplicate key errors
The script uses `onConflictDoNothing()` for inserts. If you see errors, check that badge names are unique.

### Missing requirements
All badges have JSON-encoded requirements. Parse them with `JSON.parse(badge.requirement)`.

## Files Reference

| File | Purpose |
|------|---------|
| `scripts/seed-badges.ts` | Badge seeding script |
| `scripts/BADGE_SEED_REFERENCE.md` | Complete badge documentation |
| `scripts/BADGES_QUICK_START.md` | This quick start guide |
| `shared/schema.ts` | Badge table schema definition |
| `package.json` | NPM scripts (`db:seed:badges`) |

## Support

For detailed information about each badge, see:
- `scripts/BADGE_SEED_REFERENCE.md` - Complete reference
- `shared/schema.ts` (line 645-655) - Badge schema definition

## Example Workflow

```bash
# 1. Set up database
npm run db:push

# 2. Seed all data including badges
npm run db:seed          # Seeds users, territories, etc.
npm run db:seed:badges   # Seeds badge definitions

# 3. View in Drizzle Studio
npm run db:studio

# 4. Start development
npm run dev
```

## Summary

✨ You now have a complete badge system with:
- 36 carefully designed badges
- 4 categories and 4 rarity levels
- JSON-based requirement system
- Idempotent seeding script
- Full documentation

Start implementing badge logic in your application to make the leaderboard more engaging!
