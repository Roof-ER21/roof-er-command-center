# Badge Seed Reference

## Overview

This document describes the badge definitions created by the `seed-badges.ts` script for the Roof ER Command Center leaderboard gamification system.

## Running the Script

```bash
# Run the badge seed script
npm run db:seed:badges

# Or run directly with tsx
tsx scripts/seed-badges.ts
```

## Features

- **Idempotent**: Safe to run multiple times without duplicating badges
- **Updates**: Automatically updates existing badges with latest definitions
- **Categories**: 4 badge categories (performance, milestone, streak, special)
- **Rarities**: 4 rarity levels (common, rare, epic, legendary)
- **Requirements**: JSON-encoded requirement criteria for automated badge awarding

## Badge Categories

### 1. Performance Badges (7 badges)
Awarded for monthly signup achievements.

| Badge Name | Signups Required | Rarity | Icon |
|------------|------------------|--------|------|
| Getting Started | 10 | Common | 🎯 |
| Rising Star | 15 | Common | ⭐ |
| Sales Pro | 20 | Rare | 🌟 |
| Heavy Hitter | 25 | Rare | 💪 |
| Elite Performer | 30 | Epic | 🏅 |
| Top Gun | 35 | Epic | 🚀 |
| Legend | 40 | Legendary | 👑 |

### 2. Milestone Badges - Revenue (5 badges)
Awarded for monthly revenue achievements.

| Badge Name | Revenue Required | Rarity | Icon |
|------------|------------------|--------|------|
| Revenue Rookie | $10,000 | Common | 💵 |
| Revenue Builder | $25,000 | Rare | 💰 |
| Revenue Champion | $50,000 | Epic | 💎 |
| Revenue Master | $75,000 | Epic | 🏆 |
| Revenue Legend | $100,000 | Legendary | 👑 |

### 3. Milestone Badges - Bonus Tiers (6 badges)
Awarded for unlocking bonus tiers.

| Badge Name | Tier Required | Rarity | Icon |
|------------|---------------|--------|------|
| Bronze Tier | 1 | Common | 🥉 |
| Silver Tier | 2 | Common | 🥈 |
| Gold Tier | 3 | Rare | 🥇 |
| Platinum Tier | 4 | Epic | 💍 |
| Diamond Tier | 5 | Epic | 💎 |
| Elite Tier | 6 | Legendary | ⚡ |

### 4. Streak Badges (5 badges)
Awarded for maintaining activity streaks.

| Badge Name | Streak Days | Rarity | Icon |
|------------|-------------|--------|------|
| Week Warrior | 7 | Common | 🔥 |
| Two Week Champion | 14 | Rare | 🔥🔥 |
| Monthly Grinder | 30 | Epic | 🔥🔥🔥 |
| Unstoppable Force | 60 | Epic | ⚡ |
| Eternal Flame | 90 | Legendary | 🌟 |

### 5. Special Badges (13 badges)
Awarded for unique achievements and milestones.

| Badge Name | Requirement | Rarity | Icon |
|------------|-------------|--------|------|
| First Sale | First sale completed | Common | 🎉 |
| Top Performer | Rank #1 on leaderboard | Legendary | 🏆 |
| Team MVP | Top performer in team | Epic | ⭐ |
| Rookie of the Month | Top in first 30 days | Rare | 🌟 |
| Comeback Kid | Improved rank by 10+ | Rare | 📈 |
| Perfect Month | 100% of all monthly goals | Epic | 💯 |
| Century Club | 100+ total signups | Epic | 💯 |
| Hall of Fame | 500+ total signups | Legendary | 🏛️ |
| Growth Expert | 50%+ monthly growth | Rare | 📊 |
| Consistency King | 3 consecutive goal months | Epic | 👑 |
| Year Dominator | Yearly goal achieved | Legendary | 🎯 |

## Badge Schema

Each badge has the following structure:

```typescript
{
  id: number;              // Auto-generated
  name: string;            // Unique badge name
  description: string;     // User-facing description
  iconUrl: string | null;  // Emoji or URL to badge icon
  category: 'performance' | 'milestone' | 'streak' | 'special';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  requirement: string;     // JSON encoded requirement criteria
  isActive: boolean;       // Whether badge can be earned
  createdAt: timestamp;    // Auto-generated
}
```

## Requirement JSON Format

Each badge's `requirement` field contains a JSON string describing how to earn it:

### Performance Badges
```json
{ "type": "monthly_signups", "value": 20 }
```

### Revenue Milestones
```json
{ "type": "monthly_revenue", "value": 50000 }
```

### Bonus Tiers
```json
{ "type": "bonus_tier", "value": 3 }
```

### Streak Badges
```json
{ "type": "streak_days", "value": 30 }
```

### Special Badges
```json
{ "type": "first_sale", "value": true }
{ "type": "rank", "value": 1 }
{ "type": "team_mvp", "value": true }
{ "type": "rookie_month", "value": true }
{ "type": "rank_improvement", "value": 10 }
{ "type": "perfect_month", "value": true }
{ "type": "total_signups", "value": 100 }
{ "type": "monthly_growth", "value": 50 }
{ "type": "consecutive_goal_months", "value": 3 }
{ "type": "yearly_goal_achieved", "value": true }
```

## Implementation Guide

### 1. Check Badge Eligibility

```typescript
import { db, schema } from './server/db';
import { eq } from 'drizzle-orm';

async function checkBadgeEligibility(salesRepId: number, badgeId: number) {
  const badge = await db.select()
    .from(schema.badges)
    .where(eq(schema.badges.id, badgeId))
    .limit(1);

  if (!badge[0] || !badge[0].isActive) return false;

  const requirement = JSON.parse(badge[0].requirement || '{}');

  // Check based on requirement type
  switch (requirement.type) {
    case 'monthly_signups':
      // Compare salesRep.monthlySignups >= requirement.value
      break;
    case 'monthly_revenue':
      // Compare salesRep.monthlyRevenue >= requirement.value
      break;
    // ... other cases
  }
}
```

### 2. Award Badge to Player

```typescript
async function awardBadge(playerId: number, badgeId: number) {
  // Check if player already has this badge
  const existing = await db.select()
    .from(schema.playerBadges)
    .where(
      eq(schema.playerBadges.playerId, playerId),
      eq(schema.playerBadges.badgeId, badgeId)
    )
    .limit(1);

  if (existing.length > 0) {
    return { success: false, message: 'Badge already earned' };
  }

  // Award the badge
  await db.insert(schema.playerBadges).values({
    playerId,
    badgeId,
  });

  return { success: true, message: 'Badge awarded!' };
}
```

### 3. Check All Badges for a Player

```typescript
async function checkAllBadges(salesRepId: number) {
  const salesRep = await db.select()
    .from(schema.salesReps)
    .where(eq(schema.salesReps.id, salesRepId))
    .limit(1);

  if (!salesRep[0]) return;

  const playerProfile = await db.select()
    .from(schema.playerProfiles)
    .where(eq(schema.playerProfiles.salesRepId, salesRepId))
    .limit(1);

  if (!playerProfile[0]) return;

  const allBadges = await db.select()
    .from(schema.badges)
    .where(eq(schema.badges.isActive, true));

  const newlyEarned: number[] = [];

  for (const badge of allBadges) {
    const eligible = await checkBadgeEligibility(salesRepId, badge.id);
    if (eligible) {
      const result = await awardBadge(playerProfile[0].id, badge.id);
      if (result.success) {
        newlyEarned.push(badge.id);
      }
    }
  }

  return newlyEarned;
}
```

## Database Relationships

```
badges (badge definitions)
  ↓
playerBadges (earned badges)
  ↓
playerProfiles (player data)
  ↓
salesReps (sales performance)
```

## Rarity Distribution

- **Common**: 7 badges (19.4%)
- **Rare**: 7 badges (19.4%)
- **Epic**: 13 badges (36.1%)
- **Legendary**: 9 badges (25.0%)

Total: **36 badges**

## Category Distribution

- **Performance**: 7 badges (19.4%)
- **Milestone**: 11 badges (30.6%)
- **Streak**: 5 badges (13.9%)
- **Special**: 13 badges (36.1%)

## Next Steps

1. ✅ Run the seed script to populate badges
2. ⬜ Implement badge eligibility checking logic
3. ⬜ Create automated badge awarding system
4. ⬜ Build badge display UI components
5. ⬜ Add badge notifications when earned
6. ⬜ Create badge showcase/profile page
7. ⬜ Implement badge filtering and search

## Notes

- The script is idempotent - running it multiple times won't create duplicates
- Existing badges are updated with the latest definitions
- Icons are currently emoji - can be replaced with image URLs
- All badges are active by default (`isActive: true`)
- Badge requirements are stored as JSON for flexible querying

## Maintenance

To add new badges:
1. Edit `scripts/seed-badges.ts`
2. Add new badge definitions to the `badges` array
3. Run `npm run db:seed:badges`
4. Update this reference document

To deactivate a badge:
```sql
UPDATE badges SET is_active = false WHERE name = 'Badge Name';
```

To reactivate a badge:
```sql
UPDATE badges SET is_active = true WHERE name = 'Badge Name';
```
