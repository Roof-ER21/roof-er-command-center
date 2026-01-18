# Gamification Database Schema

## Entity Relationship Diagram

```
┌─────────────────┐
│   sales_reps    │
│─────────────────│
│ id (PK)         │◄─────────┐
│ name            │          │
│ email           │          │
│ monthly_signups │          │
│ yearly_revenue  │          │
│ ...             │          │
└─────────────────┘          │
        │                    │
        │ 1:1                │ 1:N
        │                    │
        ▼                    │
┌─────────────────┐          │
│ player_profiles │          │
│─────────────────│          │
│ id (PK)         │◄─────┐   │
│ sales_rep_id(FK)│ ───┐ │   │
│ player_level    │     │ │   │
│ career_points   │     │ │   │
│ season_points   │     │ │   │
│ current_streak  │     │ │   │
│ longest_streak  │     │ │   │
└─────────────────┘     │ │   │
        │               │ │   │
        │ 1:N           │ │   │
        │               │ │   │
        ▼               │ │   │
┌─────────────────┐     │ │   │
│ player_badges   │     │ │   │
│─────────────────│     │ │   │
│ id (PK)         │     │ │   │
│ player_id (FK)  │─────┘ │   │
│ badge_id (FK)   │───┐   │   │
│ earned_at       │   │   │   │
└─────────────────┘   │   │   │
        ▲             │   │   │
        │ N:1         │   │   │
        │             │   │   │
┌─────────────────┐   │   │   │
│     badges      │   │   │   │
│─────────────────│   │   │   │
│ id (PK)         │◄──┘   │   │
│ name (UNIQUE)   │       │   │
│ description     │       │   │
│ category        │       │   │
│ rarity          │       │   │
│ requirement     │       │   │
└─────────────────┘       │   │
                          │   │
┌─────────────────────┐   │   │
│leaderboard_snapshots│   │   │
│─────────────────────│   │   │
│ id (PK)             │   │   │
│ sales_rep_id (FK)   │───┘   │
│ snapshot_date       │       │
│ rank                │       │
│ points              │       │
│ monthly_signups     │       │
│ season_id           │       │
└─────────────────────┘       │
                              │
                              └───────────────┐
                                              │
                                              ▼
                                    ┌─────────────────┐
                                    │   (Historic)    │
                                    │  Rank Trends    │
                                    │  & Analytics    │
                                    └─────────────────┘
```

## Table Relationships

### Core Relationship Chain

```
sales_reps (1) ──→ (1) player_profiles (1) ──→ (N) player_badges (N) ──→ (1) badges
     │
     └──→ (N) leaderboard_snapshots
```

### Relationship Details

| From Table | To Table | Type | Foreign Key | On Delete |
|------------|----------|------|-------------|-----------|
| player_profiles | sales_reps | 1:1 | sales_rep_id | CASCADE |
| player_badges | player_profiles | N:1 | player_id | CASCADE |
| player_badges | badges | N:1 | badge_id | RESTRICT |
| leaderboard_snapshots | sales_reps | N:1 | sales_rep_id | CASCADE |

## Field Reference

### player_profiles

| Field | Type | Default | Purpose |
|-------|------|---------|---------|
| id | serial | auto | Primary key |
| sales_rep_id | integer | - | Link to sales rep (UNIQUE) |
| player_level | integer | 1 | Gamification level (1-100) |
| total_career_points | integer | 0 | All-time points earned |
| season_points | integer | 0 | Points this season |
| monthly_points | integer | 0 | Points this month |
| current_streak | integer | 0 | Current consecutive days |
| longest_streak | integer | 0 | Best streak record |
| last_activity_date | text | null | Last signup date (YYYY-MM-DD) |

**Indexes**:
- Primary: `id`
- Unique: `sales_rep_id`

**Suggested Indexes**:
```sql
CREATE INDEX idx_player_profiles_level ON player_profiles(player_level DESC);
CREATE INDEX idx_player_profiles_season_points ON player_profiles(season_points DESC);
```

---

### badges

| Field | Type | Default | Purpose |
|-------|------|---------|---------|
| id | serial | auto | Primary key |
| name | text | - | Badge name (UNIQUE) |
| description | text | - | What it represents |
| icon_url | text | null | Badge image path |
| category | text | 'performance' | Badge type |
| rarity | text | 'common' | Rarity tier |
| requirement | text | null | JSON requirements |
| is_active | boolean | true | Enabled for earning |

**Categories**: `performance` | `milestone` | `streak` | `special`

**Rarity Levels**: `common` | `rare` | `epic` | `legendary`

**Indexes**:
- Primary: `id`
- Unique: `name`

**Suggested Indexes**:
```sql
CREATE INDEX idx_badges_category ON badges(category) WHERE is_active = true;
CREATE INDEX idx_badges_rarity ON badges(rarity) WHERE is_active = true;
```

---

### player_badges

| Field | Type | Default | Purpose |
|-------|------|---------|---------|
| id | serial | auto | Primary key |
| player_id | integer | - | Link to player profile |
| badge_id | integer | - | Link to badge |
| earned_at | timestamp | now() | When badge was earned |

**Indexes**:
- Primary: `id`
- Foreign Keys: `player_id`, `badge_id`

**Suggested Indexes**:
```sql
CREATE UNIQUE INDEX idx_player_badges_unique ON player_badges(player_id, badge_id);
CREATE INDEX idx_player_badges_earned_at ON player_badges(earned_at DESC);
```

---

### leaderboard_snapshots

| Field | Type | Default | Purpose |
|-------|------|---------|---------|
| id | serial | auto | Primary key |
| sales_rep_id | integer | - | Link to sales rep |
| snapshot_date | text | - | Date of snapshot (YYYY-MM-DD) |
| rank | integer | - | Position on leaderboard |
| points | integer | 0 | Points at snapshot time |
| monthly_signups | numeric(6,1) | 0 | Signups at snapshot time |
| season_id | text | null | Season identifier |

**Indexes**:
- Primary: `id`
- Foreign Key: `sales_rep_id`

**Suggested Indexes**:
```sql
CREATE INDEX idx_snapshots_rep_date ON leaderboard_snapshots(sales_rep_id, snapshot_date DESC);
CREATE INDEX idx_snapshots_season ON leaderboard_snapshots(season_id, snapshot_date DESC);
CREATE INDEX idx_snapshots_date ON leaderboard_snapshots(snapshot_date DESC);
```

---

## Query Patterns

### Get Player Profile with Badges

```typescript
const profile = await db.query.playerProfiles.findFirst({
  where: eq(playerProfiles.salesRepId, repId),
  with: {
    badges: {
      with: {
        badge: true
      }
    }
  }
});
```

### Get Rank Trend (Last 30 Days)

```typescript
const thirtyDaysAgo = new Date();
thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

const snapshots = await db.select()
  .from(leaderboardSnapshots)
  .where(
    and(
      eq(leaderboardSnapshots.salesRepId, repId),
      gte(leaderboardSnapshots.snapshotDate, thirtyDaysAgo.toISOString().split('T')[0])
    )
  )
  .orderBy(leaderboardSnapshots.snapshotDate);
```

### Award Badge to Player

```typescript
// 1. Get player profile
const [profile] = await db.select()
  .from(playerProfiles)
  .where(eq(playerProfiles.salesRepId, repId));

// 2. Get badge definition
const [badge] = await db.select()
  .from(badges)
  .where(eq(badges.name, 'First Blood'));

// 3. Check if already earned
const existing = await db.select()
  .from(playerBadges)
  .where(
    and(
      eq(playerBadges.playerId, profile.id),
      eq(playerBadges.badgeId, badge.id)
    )
  );

// 4. Award if not earned
if (existing.length === 0) {
  await db.insert(playerBadges).values({
    playerId: profile.id,
    badgeId: badge.id,
  });
}
```

### Update Points and Level

```typescript
const pointsToAward = 100; // 1 signup = 100 points

await db.update(playerProfiles)
  .set({
    monthlyPoints: sql`monthly_points + ${pointsToAward}`,
    seasonPoints: sql`season_points + ${pointsToAward}`,
    totalCareerPoints: sql`total_career_points + ${pointsToAward}`,
    playerLevel: sql`FLOOR((total_career_points + ${pointsToAward}) / 1000) + 1`,
    lastActivityDate: new Date().toISOString().split('T')[0],
  })
  .where(eq(playerProfiles.salesRepId, repId));
```

### Get Top Players by Season Points

```typescript
const topPlayers = await db.query.playerProfiles.findMany({
  with: {
    salesRep: true,
  },
  orderBy: desc(playerProfiles.seasonPoints),
  limit: 10,
});
```

---

## Gamification Rules

### Point System

| Action | Points |
|--------|--------|
| 1 Signup | 100 points |
| Daily Login Streak | 10 points/day |
| Bonus Tier Reached | 500 points |
| Contest Win | 1000 points |

### Level Progression

```typescript
// Level = (Total Career Points / 1000) + 1
// Example: 5,500 points = Level 6
const level = Math.floor(totalCareerPoints / 1000) + 1;
```

| Level | Points Required | Title |
|-------|----------------|-------|
| 1 | 0 - 999 | Rookie |
| 2 | 1,000 - 1,999 | Rising Star |
| 3 | 2,000 - 2,999 | Specialist |
| 5 | 4,000 - 4,999 | Expert |
| 10 | 9,000 - 9,999 | Master |
| 20+ | 19,000+ | Legend |

### Streak System

- **Current Streak**: Consecutive days with at least 1 activity
- **Longest Streak**: Best streak ever achieved
- **Streak Freeze**: Can use once per month to protect streak
- **Reset**: Streak resets if no activity for 24 hours

---

## Performance Considerations

### Snapshot Storage

- **Daily snapshots** = ~365 rows per rep per year
- **100 reps** = ~36,500 rows/year
- **Retention**: Archive snapshots older than 1 year

```sql
-- Archive old snapshots (keep last 365 days)
DELETE FROM leaderboard_snapshots
WHERE snapshot_date < CURRENT_DATE - INTERVAL '365 days';
```

### Badge Checks

Cache badge requirements in application memory to avoid frequent DB reads:

```typescript
const badgeRequirements = new Map<string, any>();

// Load on server start
const badges = await db.select().from(badges).where(eq(badges.isActive, true));
for (const badge of badges) {
  badgeRequirements.set(badge.name, JSON.parse(badge.requirement));
}
```

---

## Migration Applied

✅ **Status**: Schema generated, ready to migrate

**File**: `/Users/a21/roof-er-command-center/migrations/0000_empty_starbolt.sql`

**Run**:
```bash
npm run db:migrate
```

---

**See Also**:
- [Migration Guide](../MIGRATION_GUIDE.md) - Full migration instructions
- [Schema Definition](../shared/schema.ts) - TypeScript schema source
