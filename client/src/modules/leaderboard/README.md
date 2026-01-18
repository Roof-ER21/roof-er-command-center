# Leaderboard Module

A comprehensive sales leaderboard system with real-time tracking, animated rank transitions, and performance visualization.

## Components

### Main Pages

1. **LeaderboardDashboard.tsx** - Main leaderboard view with top performers and full rankings
   - Auto-refreshes every 30 seconds
   - Filters by team, territory, and individual rep
   - Sorts by multiple metrics (revenue, signups, etc.)
   - Displays top 3 performers with special highlighting
   - Full animated leaderboard table
   - Performance statistics for admins/managers

2. **SalesLeaderboard.tsx** - Detailed sales rankings page
   - Top performer spotlight card
   - Complete rankings table
   - Team filtering
   - Sort by different metrics
   - Growth indicators (trending up/down)
   - Progress bars for goal tracking

### Supporting Components

3. **TopPerformers.tsx** - Podium-style top 3 display
   - Rank badges (gold, silver, bronze)
   - Avatar with rank indicators
   - Dynamic metric display based on sort type
   - Goal progress bars
   - Rank change animations

4. **AnimatedLeaderboardTable.tsx** - Table with rank change detection
   - Automatically detects rank changes
   - Triggers animations for movements
   - Maintains previous rank state
   - Clean fade-in/out transitions

5. **AnimatedRankRow.tsx** - Individual row with full details
   - Monthly and yearly signups with progress bars
   - Yearly revenue with goal tracking
   - All-time revenue display
   - Bonus tier badges
   - Trend indicators (up/down arrows)
   - Dual-color progress bars (current vs. pace)
   - Status icons (✓ met goal, → on pace, ↓ behind)

6. **PerformanceStats.tsx** - Overall team statistics
   - Total revenue
   - Total signups
   - Average performance
   - Goals met percentage
   - Icon-based visual design

### Utility Components

7. **DualColorProgressBar.tsx** - Visual progress indicator
   - Shows current progress (colored)
   - Shows expected pace (lighter background)
   - Color-coded status:
     - Green: Goal met (100%)
     - Yellow: Ahead of pace
     - Red: Behind pace

## Features

### Real-time Updates
- Auto-refresh every 30 seconds
- Manual refresh button
- Rank change detection and animation
- Smooth transitions between states

### Visual Indicators
- Top 3 performers highlighted
- Rank badges (trophy icons for 1-3)
- Avatar rings for top performers
- Bonus tier badges (Bronze, Silver, Gold, Platinum, Diamond, Elite)
- Trend arrows (up/down) for growth metrics
- Status icons for pacing (✓ → ↓)

### Filtering & Sorting
- Filter by team
- Filter by territory (in main dashboard)
- Filter by individual rep
- Sort by:
  - Monthly signups
  - Yearly signups
  - Yearly revenue
  - All-time revenue

### Progress Tracking
- Monthly signup progress vs. goal
- Yearly signup progress vs. goal
- Yearly revenue progress vs. goal
- Pace indicators (based on day/month of year)
- Dual-color progress bars showing current vs. expected pace

## Socket.IO Integration Points

### Events to Listen For

```typescript
// Rank change event
socket.on('leaderboard:rank_change', (data: {
  salesRepId: number;
  oldRank: number;
  newRank: number;
  metric: string;
}) => {
  // Trigger rank change animation
  // Update leaderboard data
});

// Stats update event
socket.on('leaderboard:stats_update', (data: {
  totalRevenue: string;
  totalSignups: string;
  avgPerformance: string;
  goalsMet: string;
}) => {
  // Update performance stats
});

// Sales rep update event
socket.on('sales_rep:update', (data: {
  id: number;
  field: string;
  oldValue: any;
  newValue: any;
}) => {
  // Update specific rep's data
  // Trigger animations if needed
});

// Milestone achievement
socket.on('milestone:achieved', (data: {
  salesRepId: number;
  type: 'goal_achieved' | 'bonus_tier' | 'revenue' | 'signups';
  value: number;
  message: string;
}) => {
  // Show celebration modal/toast
  // Update rep's data
});
```

### Events to Emit

```typescript
// Request real-time updates for specific metric
socket.emit('leaderboard:subscribe', {
  metric: 'yearlyRevenue',
  teamId?: number,
  territoryId?: number
});

// Unsubscribe from updates
socket.emit('leaderboard:unsubscribe');

// Admin triggers manual recalculation
socket.emit('leaderboard:recalculate');
```

## Data Flow

1. Initial load via React Query (`/api/sales-reps`)
2. Auto-refresh every 30 seconds
3. Socket.IO for instant updates (when implemented)
4. Rank change detection in `AnimatedLeaderboardTable`
5. Animation triggers in `AnimatedRankRow`

## API Endpoints Required

```
GET /api/sales-reps
  Query params:
    - team: string (optional)
    - territoryId: string (optional)
    - sortBy: string (monthlySignups | yearlySignups | yearlyRevenue | allTimeRevenue)
    - sortOrder: 'asc' | 'desc'

GET /api/teams
  Returns: Array<{ id: number; name: string }>

GET /api/leaderboard/stats
  Returns: {
    totalRevenue: string;
    totalSignups: string;
    avgPerformance: string;
    goalsMet: string;
  }
```

## Styling Notes

- Uses shadcn/ui components (Card, Table, Avatar, Badge, etc.)
- Tailwind CSS for styling
- Color scheme:
  - Primary (brand color) for accents
  - Yellow (#F59E0B) for 1st place
  - Gray (#9CA3AF) for 2nd place
  - Amber (#D97706) for 3rd place
  - Green for positive trends
  - Red for negative trends
  - Yellow for neutral/on-pace status

## Performance Considerations

- Uses React Query for caching
- Memoizes rank change calculations
- Debounces animations
- Only re-renders changed rows
- Limits animation frequency to prevent overwhelming UI

## Future Enhancements

1. WebSocket integration for instant updates
2. Confetti effects for milestone achievements
3. Sound effects for rank changes (optional)
4. Historical trend charts
5. Detailed rep profile modals
6. Export to PDF/Excel
7. Custom date range filtering
8. Comparison mode (side-by-side reps)
9. Mobile-optimized view
10. Dark mode support (inherits from theme)
