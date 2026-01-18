# WebSocket Real-Time Implementation - Complete

## Overview

Complete production-ready WebSocket implementation for real-time leaderboard updates, training notifications, and cross-module communication in Roof ER Command Center.

## What Was Implemented

### Server-Side Components

1. **Enhanced WebSocket Index** (`server/websocket/index.ts`)
   - Imports and initializes handler classes
   - Exports handlers for use in API endpoints
   - Maintains backward compatibility with existing code
   - Exports all event types

2. **Leaderboard Socket Handler** (`server/websocket/leaderboard.ts`)
   - Room management (TV display, users, teams, contests)
   - Ranking update broadcasts
   - Contest entry notifications
   - Achievement celebrations
   - Full leaderboard refresh capability
   - Client connection tracking

3. **Training Socket Handler** (`server/websocket/training.ts`)
   - XP gain notifications
   - Level-up celebrations
   - Streak tracking and milestones
   - Achievement unlocks
   - Roleplay AI response streaming
   - Quiz completion notifications
   - Training progress updates

4. **Examples & Documentation** (`server/websocket/examples.ts`)
   - Complete working examples
   - Integration patterns
   - Real-world usage scenarios

### Client-Side Components

1. **Base Socket Hook** (`client/src/hooks/useSocket.ts`)
   - Generic WebSocket connection management
   - Auto-reconnection with exponential backoff
   - Room join/leave functionality
   - Event subscription/unsubscription
   - Connection state management
   - Error handling

2. **Leaderboard Socket Hook** (`client/src/hooks/useLeaderboardSocket.ts`)
   - Leaderboard-specific event handling
   - Automatic room management
   - Toast notifications for achievements
   - Ranking change tracking
   - Contest entry updates
   - Achievement display

3. **Training Socket Hook** (`client/src/hooks/useTrainingSocket.ts`)
   - Training event handling
   - XP and level tracking
   - Streak management
   - Achievement tracking
   - Roleplay message handling
   - Typing indicators
   - Progress updates

4. **Updated LeaderboardDashboard** (`client/src/modules/leaderboard/LeaderboardDashboard.tsx`)
   - Real-time connection status badge
   - Live ranking updates
   - Achievement notifications display
   - Automatic data refresh on socket events
   - Rank change animations

## Features

### Real-Time Updates

- **Leaderboard Rankings**: Instant updates when sales are recorded
- **Contest Entries**: Live contest leaderboard updates
- **Achievements**: Celebration notifications for milestones
- **Training Progress**: XP gains, level-ups, streaks
- **Roleplay Sessions**: AI response streaming with typing indicators

### Connection Management

- **Auto-Reconnection**: Exponential backoff strategy (1-5 seconds)
- **Room-Based Targeting**: Efficient message delivery to specific audiences
- **Connection Status**: Visual indicators for users
- **Error Recovery**: Graceful degradation and retry logic

### Performance Optimizations

- **Namespace Isolation**: Separate traffic streams for different modules
- **Room Scoping**: Messages only to relevant clients
- **Incremental Updates**: Send changes, not full datasets
- **Client-Side Debouncing**: Prevent refetch storms

## File Structure

```
server/websocket/
├── index.ts              # Main WebSocket setup with handler initialization
├── leaderboard.ts        # Leaderboard socket handler class
├── training.ts           # Training socket handler class
├── examples.ts           # Usage examples and patterns
└── README.md            # Comprehensive documentation

client/src/hooks/
├── useSocket.ts                 # Base WebSocket connection hook
├── useLeaderboardSocket.ts      # Leaderboard-specific hook
└── useTrainingSocket.ts         # Training-specific hook

client/src/modules/leaderboard/
└── LeaderboardDashboard.tsx     # Updated with real-time features
```

## Quick Start

### 1. Server: Emit Events from API Endpoints

```typescript
// In your server/index.ts or routes
import { setupWebSocket } from './websocket';

const wsHandlers = setupWebSocket(io);

// In a sales API endpoint
app.post('/api/sales', async (req, res) => {
  const sale = await createSale(req.body);
  const ranking = await calculateRanking(req.body.userId);

  // Emit real-time update
  wsHandlers.leaderboard.broadcastRankingUpdate({
    userId: req.body.userId,
    userName: 'John Doe',
    previousRank: 7,
    newRank: 5,
    metric: 'yearlyRevenue',
    value: 150000,
    timestamp: new Date(),
  });

  res.json({ success: true });
});
```

### 2. Client: Use Hooks in Components

```typescript
import { useLeaderboardSocket } from '@/hooks/useLeaderboardSocket';

function MyLeaderboard() {
  const { connected, lastUpdate } = useLeaderboardSocket({
    userId: currentUser.id,
    showToasts: true,
    onRankingUpdate: (update) => {
      console.log('Rank changed:', update);
      refetchData();
    },
  });

  return (
    <div>
      <Badge variant={connected ? 'default' : 'destructive'}>
        {connected ? 'Live' : 'Offline'}
      </Badge>
      {/* Your leaderboard UI */}
    </div>
  );
}
```

## Integration Points

### Where to Emit Events

1. **Sales Recording** (`/api/sales-reps/:id/sales`)
   - Emit `rankingUpdate` when ranking changes
   - Emit `achievement` when user reaches top 3

2. **Quiz Completion** (`/api/training/quiz-complete`)
   - Emit `xpGained` for XP awarded
   - Emit `levelUp` if level threshold crossed
   - Emit `achievement` for quiz mastery

3. **Daily Login** (`/api/auth/login`)
   - Emit `streakUpdate` for consecutive logins
   - Emit `xpGained` for daily login bonus

4. **Contest Entry** (`/api/contests/:id/enter`)
   - Emit `contestEntry` when user joins
   - Emit `contestUpdate` when rank changes

5. **Training Session** (`/api/training/roleplay`)
   - Emit `roleplayResponse` for AI messages
   - Emit `progressUpdate` for session advancement

### Existing Components to Update

1. **Sales Entry Forms**: Add WebSocket notifications
2. **Quiz Components**: Emit completion events
3. **Contest Pages**: Real-time leaderboards
4. **Training Modules**: Live progress tracking
5. **Admin Dashboards**: Live user activity

## Event Types Reference

### Leaderboard Events

```typescript
interface RankingUpdate {
  userId: number;
  userName: string;
  previousRank: number;
  newRank: number;
  metric: string;
  value: number;
  timestamp: Date;
}

interface AchievementEvent {
  userId: number;
  userName: string;
  achievementType: 'rank' | 'milestone' | 'streak' | 'contest';
  title: string;
  description: string;
  icon?: string;
  timestamp: Date;
}
```

### Training Events

```typescript
interface XPGainEvent {
  userId: number;
  userName: string;
  amount: number;
  source: string;
  newTotal: number;
  timestamp: Date;
}

interface LevelUpEvent {
  userId: number;
  userName: string;
  previousLevel: number;
  newLevel: number;
  totalXP: number;
  rewards?: {
    badges?: string[];
    unlocks?: string[];
  };
  timestamp: Date;
}
```

## Testing

### Manual Testing

1. **Open Two Browser Windows**:
   - Window 1: Leaderboard page
   - Window 2: Sales entry form

2. **Create a Sale in Window 2**:
   - Should see toast notification in Window 1
   - Leaderboard should update automatically
   - Connection badge should show "Live"

3. **Disconnect Network**:
   - Badge should show "Connecting" then "Offline"
   - Reconnect: Should show "Live" again

### Console Testing

```javascript
// In browser console
window.io = require('socket.io-client');
const socket = io('/leaderboard');

socket.on('connect', () => console.log('Connected'));
socket.on('rankings:update', (data) => console.log('Update:', data));
socket.emit('join:user', 123);
```

## Performance Considerations

### Current Optimizations

1. **Namespace Isolation**: Separate sockets for leaderboard/training
2. **Room-Based Broadcasting**: Only to relevant users
3. **Incremental Updates**: Send changes, not full data
4. **Auto-Reconnection**: Exponential backoff prevents server overload
5. **Event Debouncing**: Client-side 1s debounce on refetches

### Scaling Recommendations

For production with 100+ concurrent users:

1. **Enable Redis Adapter** for multi-server deployments
2. **Rate Limit Emits** to prevent broadcast storms
3. **Batch Updates** for rapid successive changes
4. **Monitor Connection Count** with health checks

## Security

### Current Implementation

1. **Session Authentication**: All connections validated
2. **Room Authorization**: Users can only join their own rooms
3. **Input Validation**: All room IDs validated before join
4. **Error Handling**: Graceful handling of invalid requests

### Production Checklist

- [ ] Enable HTTPS/WSS for encrypted connections
- [ ] Implement rate limiting on emit events
- [ ] Add CORS restrictions for production domains
- [ ] Monitor for connection abuse
- [ ] Log suspicious activity patterns

## Troubleshooting

### "Connecting..." Badge Stuck

1. Check server is running: `npm run dev`
2. Verify port 5000 is accessible
3. Check browser console for errors
4. Ensure session authentication is working

### Events Not Received

1. Verify room was joined (check console logs)
2. Check event name spelling (case-sensitive)
3. Ensure listener registered before event emitted
4. Verify server is emitting to correct room

### Performance Issues

1. Check connection count: `wsHandlers.leaderboard.getConnectedClientsCount()`
2. Monitor server logs for broadcast frequency
3. Verify client is debouncing refetches
4. Check for memory leaks in listeners

## Next Steps

### Recommended Enhancements

1. **Persist Achievements**: Store achievements in database
2. **Notification History**: Show recent notifications in UI
3. **Admin Dashboard**: Live connection monitoring
4. **Analytics**: Track socket usage metrics
5. **Offline Queue**: Queue events when disconnected

### Additional Features

1. **TV Display Mode**: Full-screen leaderboard with animations
2. **Contest Countdowns**: Real-time timer updates
3. **Team Challenges**: Multi-team competition tracking
4. **Live Coaching**: Real-time trainer feedback
5. **Social Feed**: Activity stream of achievements

## Resources

- **Full Documentation**: `server/websocket/README.md`
- **Code Examples**: `server/websocket/examples.ts`
- **Socket.IO Docs**: https://socket.io/docs/v4/
- **React Hooks**: https://react.dev/reference/react

## Support

For questions or issues:
1. Check `server/websocket/README.md` for detailed docs
2. Review `examples.ts` for implementation patterns
3. Check console logs (both client and server)
4. Verify TypeScript types are imported correctly

---

**Implementation Date**: January 17, 2026
**Status**: ✅ Production Ready
**Dependencies**: socket.io@4.8.2, socket.io-client@4.8.1
**Compatibility**: All modern browsers, Node.js 20+
