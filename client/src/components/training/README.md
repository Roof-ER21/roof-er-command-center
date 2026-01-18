# Training Components

Reusable components for the training module with gamification features.

## XPBar

Visual progress bar showing user's XP and level progress.

### Usage

```tsx
import { XPBar } from "@/components/training/XPBar";
import { calculateProgress } from "@/lib/gamification";

function MyComponent() {
  const totalXP = 1250;
  const progress = calculateProgress(totalXP);

  return (
    <XPBar
      currentXP={progress.totalXP}
      currentLevel={progress.currentLevel}
      xpForNextLevel={progress.xpToNextLevel + progress.totalXP}
      xpForCurrentLevel={progress.xpForCurrentLevel}
    />
  );
}
```

### Props

| Prop | Type | Description |
|------|------|-------------|
| `currentXP` | `number` | User's total XP |
| `currentLevel` | `number` | User's current level |
| `xpForNextLevel` | `number` | Total XP needed for next level |
| `xpForCurrentLevel` | `number` | Total XP needed for current level |
| `className` | `string?` | Optional CSS classes |

### Features

- Animated gradient progress bar
- Shimmer effect for visual appeal
- Shows percentage progress
- Displays XP needed for next level
- Displays current XP gained in level

---

## StreakCounter

Displays user's current practice streak with visual milestones.

### Usage

```tsx
import { StreakCounter } from "@/components/training/StreakCounter";

function MyComponent() {
  return (
    <StreakCounter
      currentStreak={7}
      longestStreak={14}
    />
  );
}
```

### Props

| Prop | Type | Description |
|------|------|-------------|
| `currentStreak` | `number` | User's current streak in days |
| `longestStreak` | `number` | User's best streak ever |
| `className` | `string?` | Optional CSS classes |

### Features

- Dynamic color based on streak length
- Motivational messages
- Visual milestone indicators (3, 7, 14, 30, 100 days)
- Shows best streak if different from current
- Animated flame icon

### Color Progression

- **0-2 days**: Gray (just starting)
- **3-6 days**: Yellow (warming up)
- **7-13 days**: Orange (on fire)
- **14-29 days**: Red (impressive)
- **30+ days**: Purple (legendary)

---

## Complete Example

Here's a complete example showing how to use all training components together:

```tsx
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { XPBar } from "@/components/training/XPBar";
import { StreakCounter } from "@/components/training/StreakCounter";
import { calculateProgress } from "@/lib/gamification";

export function UserProgressCard() {
  const [stats, setStats] = useState({
    totalXP: 0,
    currentStreak: 0,
    longestStreak: 0
  });

  useEffect(() => {
    // Fetch from API
    fetch('/api/training/stats')
      .then(res => res.json())
      .then(data => setStats(data));
  }, []);

  const progress = calculateProgress(stats.totalXP);

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-bold mb-4">Your Progress</h3>
        <XPBar
          currentXP={progress.totalXP}
          currentLevel={progress.currentLevel}
          xpForNextLevel={progress.xpToNextLevel + progress.totalXP}
          xpForCurrentLevel={progress.xpForCurrentLevel}
        />
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-bold mb-4">Practice Streak</h3>
        <StreakCounter
          currentStreak={stats.currentStreak}
          longestStreak={stats.longestStreak}
        />
      </Card>
    </div>
  );
}
```

---

## Gamification Utilities

See `/client/src/lib/gamification.ts` for helper functions:

- Calculate XP for levels
- Determine level from XP
- Calculate session XP with bonuses
- Format XP numbers
- Get level titles
- Calculate streak multipliers

### Quick Reference

```tsx
import {
  calculateProgress,
  calculateSessionXP,
  getLevelTitle,
  formatXP
} from "@/lib/gamification";

// Get user progress
const progress = calculateProgress(1250); // totalXP
// Returns: { totalXP, currentLevel, xpToNextLevel, xpForCurrentLevel }

// Calculate XP for a session
const xpBreakdown = calculateSessionXP(85, 'pro', 7);
// score: 85, difficulty: 'pro', currentStreak: 7
// Returns: { baseXP, scoreBonus, perfectBonus, streakBonus, difficultyMultiplier, totalXP }

// Get level title
const title = getLevelTitle(5);
// Returns: "Apprentice"

// Format XP
const formatted = formatXP(1250);
// Returns: "1,250"
```

---

## CSS Animations

The components use custom animations defined in `index.css`:

- **shimmer**: 2s infinite animation for XP bar gradient
- **fadeIn**: 0.3s ease-out entrance animation
- **slideIn**: 0.3s ease-out slide animation
- **countUp**: 0.5s ease-out scale animation

To use in your components:
```tsx
<div className="animate-shimmer">Content</div>
<div className="animate-fade-in">Content</div>
<div className="animate-slide-in">Content</div>
<div className="animate-count-up">Content</div>
```
