/**
 * Example: How to update sales rep stats and trigger milestone detection
 *
 * This example shows how to call the new /update-stats endpoint from your
 * frontend application to update sales rep statistics and automatically
 * detect and broadcast milestones to all connected clients.
 */

// Example 1: Basic update with milestone detection
async function updateSalesRepWithMilestones(repId: number) {
  try {
    const response = await fetch(
      `/api/leaderboard/sales-reps/${repId}/update-stats`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Important: Include session cookie
        body: JSON.stringify({
          monthlySignups: '25',
          monthlyRevenue: '50000',
          yearlyRevenue: '180000',
          goalProgress: '125'
        })
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    console.log('Updated rep:', data.rep);
    console.log('Milestones achieved:', data.milestones);
    console.log('Rank change:', data.rankChange);

    // Handle each milestone
    data.milestones.forEach((milestone: any) => {
      console.log(`🎉 Milestone achieved: ${milestone.title}`);
      console.log(`   Description: ${milestone.description}`);
      console.log(`   Value: ${milestone.value}`);
      console.log(`   Type: ${milestone.type}`);
    });

    return data;
  } catch (error) {
    console.error('Error updating sales rep stats:', error);
    throw error;
  }
}

// Example 2: Update stats after a new sale
async function recordNewSale(repId: number, saleAmount: number) {
  // First, get current stats
  const currentRep = await fetch(`/api/leaderboard/sales-reps`)
    .then(res => res.json())
    .then(reps => reps.find((r: any) => r.id === repId));

  if (!currentRep) {
    throw new Error('Sales rep not found');
  }

  // Calculate new stats
  const newMonthlyRevenue = parseFloat(currentRep.monthlyRevenue) + saleAmount;
  const newMonthlySignups = parseFloat(currentRep.monthlySignups) + 1;
  const newGoalProgress = (newMonthlyRevenue / parseFloat(currentRep.monthlyRevenueGoal)) * 100;

  // Update with milestone detection
  return await fetch(`/api/leaderboard/sales-reps/${repId}/update-stats`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      monthlyRevenue: newMonthlyRevenue.toString(),
      monthlySignups: newMonthlySignups.toString(),
      yearlyRevenue: (parseFloat(currentRep.yearlyRevenue) + saleAmount).toString(),
      goalProgress: newGoalProgress.toString()
    })
  }).then(res => res.json());
}

// Example 3: WebSocket listener for real-time milestone notifications
import { io } from 'socket.io-client';

function setupMilestoneNotifications() {
  const socket = io('http://localhost:5000/leaderboard');

  // Join user-specific room
  socket.on('connect', () => {
    console.log('Connected to leaderboard WebSocket');
    const userId = getCurrentUserId(); // Your function to get current user ID
    socket.emit('join:user', userId);
  });

  // Listen for personal achievements
  socket.on('achievement:earned', (achievement) => {
    console.log('You earned an achievement!', achievement);
    showMilestoneModal(achievement.milestone);
  });

  // Listen for all achievements (for team celebrations)
  socket.on('achievement:celebration', (achievement) => {
    console.log('Team member achievement!', achievement);
    showTeamCelebration(achievement);
  });

  // Listen for leaderboard updates
  socket.on('leaderboard:refresh', (rankings) => {
    console.log('Leaderboard updated', rankings);
    updateLeaderboardUI(rankings);
  });

  return socket;
}

// Example 4: React component integration
import { useState, useEffect } from 'react';

function SalesRepDashboard({ repId }: { repId: number }) {
  const [stats, setStats] = useState<any>(null);
  const [milestones, setMilestones] = useState<any[]>([]);

  // Update stats when a sale is made
  const handleNewSale = async (saleAmount: number) => {
    const result = await recordNewSale(repId, saleAmount);
    setStats(result.rep);

    // Show milestone celebrations
    if (result.milestones.length > 0) {
      setMilestones(prev => [...prev, ...result.milestones]);
    }
  };

  // Setup WebSocket listeners
  useEffect(() => {
    const socket = setupMilestoneNotifications();

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <div>
      {/* Your UI here */}
      {milestones.map(milestone => (
        <MilestoneCelebration key={milestone.id} milestone={milestone} />
      ))}
    </div>
  );
}

// Example 5: Batch update multiple fields
async function updateAllStats(repId: number, updates: {
  monthlySignups?: string;
  monthlyRevenue?: string;
  yearlyRevenue?: string;
  yearlySignups?: string;
  goalProgress?: string;
  monthlyGrowth?: string;
}) {
  return await fetch(`/api/leaderboard/sales-reps/${repId}/update-stats`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(updates)
  }).then(res => res.json());
}

// Example 6: Error handling
async function safeUpdateStats(repId: number, updates: any) {
  try {
    const response = await fetch(
      `/api/leaderboard/sales-reps/${repId}/update-stats`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(updates)
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update stats');
    }

    const data = await response.json();

    // Success!
    return {
      success: true,
      data,
      milestones: data.milestones || []
    };
  } catch (error) {
    console.error('Error updating stats:', error);

    // Return error state
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      milestones: []
    };
  }
}

// Helper functions (implement these based on your app)
function getCurrentUserId(): number {
  // Return current logged-in user ID
  return 1;
}

function showMilestoneModal(milestone: any) {
  // Show celebration modal with confetti
  console.log('Showing milestone modal:', milestone);
}

function showTeamCelebration(achievement: any) {
  // Show team member achievement notification
  console.log('Team celebration:', achievement);
}

function updateLeaderboardUI(rankings: any[]) {
  // Update leaderboard display
  console.log('Updating leaderboard:', rankings);
}

// Export for use in other files
export {
  updateSalesRepWithMilestones,
  recordNewSale,
  setupMilestoneNotifications,
  updateAllStats,
  safeUpdateStats
};
