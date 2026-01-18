# WebSocket Real-Time Implementation

Complete WebSocket implementation for real-time leaderboard updates, training notifications, and cross-module communication.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    WebSocket Namespaces                     │
├─────────────────────────────────────────────────────────────┤
│  /leaderboard  │  Leaderboard rankings, contests, achievements│
│  /training     │  XP, level-ups, streaks, roleplay           │
│  /field        │  Field chat with Susan AI                   │
│  / (main)      │  Global notifications                       │
└─────────────────────────────────────────────────────────────┘
```

## Features

### Leaderboard Namespace (`/leaderboard`)

**Events Emitted:**
- `rankings:update` - Broadcast ranking changes to all clients
- `rank:changed` - Notify specific user of rank change
- `contest:new-entry` - New contest entry recorded
- `contest:entry-update` - Contest entry rank updated
- `achievement:earned` - User earned achievement
- `achievement:celebration` - Public achievement celebration
- `leaderboard:refresh` - Full leaderboard data refresh
- `tv:update` - TV display-specific updates

**Rooms:**
- `tv-display` - For public leaderboard displays
- `user:{userId}` - User-specific updates
- `team:{teamId}` - Team-wide notifications
- `contest:{contestId}` - Contest-specific updates

**Client Events:**
- `join:tv-display` - Join TV display room
- `join:user` - Join user room
- `join:team` - Join team room
- `join:contest` - Join contest room
- Corresponding `leave:*` events

### Training Namespace (`/training`)

**Events Emitted:**
- `xp:gained` - XP earned notification
- `level:up` - Level up celebration
- `level:celebration` - Public level up broadcast
- `streak:update` - Streak updated
- `streak:milestone` - Streak milestone reached
- `achievement:unlocked` - Training achievement unlocked
- `achievement:showcase` - Rare+ achievement showcase
- `roleplay:response` - AI roleplay response
- `roleplay:typing` - Typing indicator
- `progress:update` - Training progress update
- `quiz:completed` - Quiz completion notification

**Rooms:**
- `user:{userId}` - User-specific updates
- `session:{sessionId}` - Training session room
- `module:{moduleId}` - Course module room

**Client Events:**
- `join:user` - Join user room
- `join:session` - Join training session
- `join:module` - Join course module
- `roleplay:message` - Send roleplay message
- `roleplay:stop-typing` - Stop typing indicator
- `progress:update` - Update progress

## Client Usage

### 1. Basic Socket Connection

```typescript
import { useSocket } from '@/hooks/useSocket';

function MyComponent() {
  const { connected, socket, emit, on } = useSocket({
    namespace: '/leaderboard',
    autoConnect: true,
    reconnection: true,
  });

  useEffect(() => {
    return on('rankings:update', (update) => {
      console.log('Ranking updated:', update);
    });
  }, [on]);

  return <div>Status: {connected ? 'Connected' : 'Disconnected'}</div>;
}
```

### 2. Leaderboard Socket Hook

```typescript
import { useLeaderboardSocket } from '@/hooks/useLeaderboardSocket';

function LeaderboardPage() {
  const { connected, lastUpdate, achievements } = useLeaderboardSocket({
    userId: currentUser.id,
    tvDisplay: false,
    showToasts: true,
    onRankingUpdate: (update) => {
      console.log('My rank changed:', update);
      // Refetch leaderboard data
      refetch();
    },
    onAchievement: (achievement) => {
      console.log('Achievement earned:', achievement);
      // Show celebration animation
    },
  });

  return (
    <div>
      {connected && <Badge>Live</Badge>}
      {/* Leaderboard UI */}
    </div>
  );
}
```

### 3. Training Socket Hook

```typescript
import { useTrainingSocket } from '@/hooks/useTrainingSocket';

function TrainingSession({ sessionId }) {
  const {
    connected,
    totalXP,
    currentLevel,
    isTyping,
    sendMessage,
  } = useTrainingSocket({
    userId: currentUser.id,
    sessionId,
    showToasts: true,
    onXPGain: (event) => {
      console.log('XP gained:', event.amount);
    },
    onLevelUp: (event) => {
      console.log('Level up!', event.newLevel);
      // Show confetti animation
    },
    onRoleplayResponse: (response) => {
      console.log('AI response:', response.message);
      // Display AI message
    },
  });

  const handleSendMessage = () => {
    sendMessage('Hello, I need help with objection handling');
  };

  return (
    <div>
      <div>Level: {currentLevel} | XP: {totalXP}</div>
      {isTyping && <span>AI is typing...</span>}
      <button onClick={handleSendMessage}>Send Message</button>
    </div>
  );
}
```

## Server Usage

### 1. Emit from API Endpoints

```typescript
// In your server/index.ts
import { setupWebSocket } from './websocket';

const wsHandlers = setupWebSocket(io);

// In your API endpoint
app.post('/api/sales', async (req, res) => {
  // Create sale in database
  const sale = await createSale(req.body);

  // Calculate new ranking
  const ranking = await calculateRanking(req.body.userId);

  // Emit WebSocket event
  wsHandlers.leaderboard.broadcastRankingUpdate({
    userId: req.body.userId,
    userName: 'John Doe',
    previousRank: 7,
    newRank: 5,
    metric: 'yearlyRevenue',
    value: 150000,
    timestamp: new Date(),
  });

  res.json({ success: true, sale });
});
```

### 2. Notify User of XP Gain

```typescript
app.post('/api/training/complete-quiz', async (req, res) => {
  const { userId, quizId, score } = req.body;
  const xpEarned = calculateXP(score);

  // Award XP in database
  const user = await awardXP(userId, xpEarned);

  // Notify via WebSocket
  wsHandlers.training.notifyXPGain({
    userId,
    userName: user.name,
    amount: xpEarned,
    source: `Quiz: ${quizId}`,
    newTotal: user.totalXP,
    timestamp: new Date(),
  });

  res.json({ success: true, xpEarned });
});
```

### 3. Celebrate Achievements

```typescript
// When user reaches milestone
wsHandlers.leaderboard.celebrateAchievement({
  userId: 123,
  userName: 'John Doe',
  achievementType: 'rank',
  title: 'Top Performer!',
  description: 'Reached #1 on the leaderboard',
  icon: '🏆',
  timestamp: new Date(),
});
```

### 4. Send Roleplay AI Response

```typescript
app.post('/api/training/roleplay-message', async (req, res) => {
  const { sessionId, message } = req.body;

  // Process with AI
  const aiResponse = await processWithAI(message);

  // Send via WebSocket
  wsHandlers.training.sendRoleplayResponse(sessionId, {
    message: aiResponse.text,
    metadata: {
      score: aiResponse.score,
      feedback: aiResponse.feedback,
    },
  });

  res.json({ success: true });
});
```

## Room Management

### Join Rooms

Clients automatically join rooms based on their context:

```typescript
// Leaderboard
useLeaderboardSocket({
  userId: 123,        // Joins user:123
  teamId: 5,          // Joins team:5
  contestId: 10,      // Joins contest:10
  tvDisplay: true,    // Joins tv-display
});

// Training
useTrainingSocket({
  userId: 123,        // Joins user:123
  sessionId: 'abc',   // Joins session:abc
  moduleId: 'mod-1',  // Joins module:mod-1
});
```

### Server-Side Room Targeting

```typescript
// Notify specific user
wsHandlers.leaderboard.notifyUserRankChange(userId, update);

// Notify entire team
wsHandlers.leaderboard.notifyTeam(teamId, 'team:goal-reached', data);

// Update TV displays only
wsHandlers.leaderboard.updateTVDisplay(data);

// Broadcast to everyone
wsHandlers.leaderboard.broadcastLeaderboardRefresh(rankings);
```

## Event Types

### RankingUpdate
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
```

### XPGainEvent
```typescript
interface XPGainEvent {
  userId: number;
  userName: string;
  amount: number;
  source: string;
  newTotal: number;
  timestamp: Date;
}
```

### LevelUpEvent
```typescript
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

### AchievementEvent
```typescript
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

## Connection States

### Client States

- `connecting` - Initial connection in progress
- `connected` - Successfully connected
- `disconnected` - Connection lost
- `reconnecting` - Attempting to reconnect
- `error` - Connection error occurred

### Auto-Reconnection

The client automatically reconnects with exponential backoff:

```typescript
useSocket({
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,        // Start at 1 second
  reconnectionDelayMax: 5000,     // Max 5 seconds
  timeout: 20000,                 // 20 second timeout
});
```

## Best Practices

### 1. Always Clean Up Listeners

```typescript
useEffect(() => {
  const unsubscribe = on('event:name', handler);
  return unsubscribe; // Cleanup on unmount
}, [on]);
```

### 2. Handle Connection States

```typescript
if (!connected) {
  return <div>Connecting to real-time updates...</div>;
}
```

### 3. Optimize Toast Notifications

```typescript
useLeaderboardSocket({
  showToasts: true, // Only show toasts for current user
  onRankingUpdate: (update) => {
    if (update.userId === currentUser.id) {
      // Show custom animation for your own updates
    }
  },
});
```

### 4. Use Rooms for Targeted Updates

```typescript
// Server: Target specific audiences
wsHandlers.leaderboard.notifyTeam(teamId, 'event', data);
wsHandlers.training.notifyQuizComplete({ userId, ... });

// Client: Join relevant rooms only
useLeaderboardSocket({
  userId: currentUser.id,
  teamId: currentUser.teamId,
  // Don't join contest room if not in contest
});
```

### 5. Debounce Rapid Updates

```typescript
const [updates, setUpdates] = useState([]);

useLeaderboardSocket({
  onRankingUpdate: (update) => {
    setUpdates(prev => [...prev, update]);
  },
});

// Debounce refetch
useEffect(() => {
  const timer = setTimeout(() => {
    if (updates.length > 0) {
      refetch();
      setUpdates([]);
    }
  }, 1000);
  return () => clearTimeout(timer);
}, [updates]);
```

## Error Handling

### Client Errors

```typescript
const { error } = useSocket({ namespace: '/leaderboard' });

if (error) {
  console.error('Socket error:', error);
  // Show error toast or retry button
}
```

### Server Errors

```typescript
socket.on('error', (error) => {
  socket.emit('error', { message: error.message });
});
```

## Testing

### Test Connection

```typescript
// Check if socket is connected
const { connected } = useSocket({ namespace: '/leaderboard' });
console.log('Connected:', connected);

// Check if user is in room
const isConnected = await wsHandlers.leaderboard.isUserConnected(userId);

// Get connected client count
const count = await wsHandlers.leaderboard.getConnectedClientsCount();
```

## Performance

### Optimize Large Broadcasts

```typescript
// Instead of broadcasting full data
wsHandlers.leaderboard.broadcastLeaderboardRefresh(allData); // ❌

// Send incremental updates
wsHandlers.leaderboard.broadcastRankingUpdate(update); // ✅
```

### Use Namespaces

Namespaces isolate traffic and improve performance:
- `/leaderboard` - Only leaderboard updates
- `/training` - Only training updates
- Prevents unnecessary event processing

## Monitoring

### Server Logs

All WebSocket events are logged with namespace prefix:
```
[Leaderboard] Client connected: abc123
[Training] XP gained for user 123: +50
[Leaderboard] Broadcasted ranking update for user 456
```

### Client Logs

Enable in development:
```typescript
useSocket({
  namespace: '/leaderboard',
  // Socket.io will log in browser console
});
```

## Security

### Authentication

Sessions are validated on connection:
```typescript
io.on('connection', (socket) => {
  const session = socket.request.session;
  if (!session?.userId) {
    socket.disconnect();
    return;
  }
});
```

### Room Authorization

Users can only join their own rooms:
```typescript
socket.on('join:user', (userId) => {
  if (session.userId !== userId) {
    socket.emit('error', { message: 'Unauthorized' });
    return;
  }
  socket.join(`user:${userId}`);
});
```

## Examples

See `examples.ts` for complete working examples of:
- Recording sales with rank updates
- Quiz completion with XP and level-up
- Daily login streaks
- Achievement unlocks
- Roleplay AI responses
- Team notifications

## Troubleshooting

### Connection Issues

1. Check Socket.IO server is running
2. Verify namespace is correct
3. Check browser console for errors
4. Ensure CORS is configured
5. Verify session authentication

### Events Not Received

1. Verify room join events were emitted
2. Check listener is registered before event
3. Verify server is emitting to correct room
4. Check for typos in event names

### Performance Issues

1. Use rooms to limit broadcast scope
2. Send incremental updates, not full data
3. Debounce rapid client updates
4. Monitor connection count
5. Use namespaces to isolate traffic
