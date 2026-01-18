import { useEffect, useCallback, useState } from "react";
import { useSocket } from "./useSocket";
import { useToast } from "./useToast";

interface RankingUpdate {
  userId: number;
  userName: string;
  previousRank: number;
  newRank: number;
  metric: string;
  value: number;
  timestamp: Date;
}

interface ContestEntry {
  contestId: number;
  userId: number;
  userName: string;
  metric: string;
  value: number;
  rank: number;
  timestamp: Date;
}

interface AchievementEvent {
  userId: number;
  userName: string;
  achievementType: "rank" | "milestone" | "streak" | "contest";
  title: string;
  description: string;
  icon?: string;
  timestamp: Date;
}

interface UseLeaderboardSocketOptions {
  userId?: number;
  teamId?: number;
  contestId?: number;
  tvDisplay?: boolean;
  onRankingUpdate?: (update: RankingUpdate) => void;
  onContestEntry?: (entry: ContestEntry) => void;
  onAchievement?: (achievement: AchievementEvent) => void;
  onLeaderboardRefresh?: (rankings: unknown) => void;
  showToasts?: boolean;
}

export function useLeaderboardSocket(options: UseLeaderboardSocketOptions = {}) {
  const {
    userId,
    teamId,
    contestId,
    tvDisplay = false,
    onRankingUpdate,
    onContestEntry,
    onAchievement,
    onLeaderboardRefresh,
    showToasts = true,
  } = options;

  const { toast } = useToast();
  const [lastUpdate, setLastUpdate] = useState<RankingUpdate | null>(null);
  const [achievements, setAchievements] = useState<AchievementEvent[]>([]);

  const { connected, connecting, error, joinRoom, leaveRoom, on, off } = useSocket({
    namespace: "/leaderboard",
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 5,
  });

  // Join rooms on connection
  useEffect(() => {
    if (!connected) return;

    // Join TV display room if specified
    if (tvDisplay) {
      joinRoom("join:tv-display");
    }

    // Join user room if userId provided
    if (userId) {
      joinRoom("join:user", userId);
    }

    // Join team room if teamId provided
    if (teamId) {
      joinRoom("join:team", teamId);
    }

    // Join contest room if contestId provided
    if (contestId) {
      joinRoom("join:contest", contestId);
    }

    // Cleanup: leave rooms on disconnect
    return () => {
      if (tvDisplay) {
        leaveRoom("join:tv-display");
      }
      if (userId) {
        leaveRoom("join:user", userId);
      }
      if (teamId) {
        leaveRoom("join:team", teamId);
      }
      if (contestId) {
        leaveRoom("join:contest", contestId);
      }
    };
  }, [connected, userId, teamId, contestId, tvDisplay, joinRoom, leaveRoom]);

  // Handle ranking updates
  useEffect(() => {
    const handleRankingUpdate = (update: RankingUpdate) => {
      console.log("[Leaderboard] Ranking update received:", update);
      setLastUpdate(update);

      if (onRankingUpdate) {
        onRankingUpdate(update);
      }

      if (showToasts && update.userId === userId) {
        const rankChange = update.newRank - update.previousRank;
        const direction = rankChange < 0 ? "up" : "down";
        const emoji = rankChange < 0 ? "🎉" : "⚠️";

        toast({
          title: `${emoji} Rank Changed!`,
          description: `You moved ${Math.abs(rankChange)} position${Math.abs(rankChange) > 1 ? 's' : ''} ${direction} to #${update.newRank}`,
          variant: rankChange < 0 ? "default" : "destructive",
        });
      }
    };

    return on("rankings:update", handleRankingUpdate);
  }, [on, userId, onRankingUpdate, showToasts, toast]);

  // Handle rank change notifications (user-specific)
  useEffect(() => {
    const handleRankChange = (update: RankingUpdate) => {
      console.log("[Leaderboard] Rank change notification:", update);
      setLastUpdate(update);

      if (onRankingUpdate) {
        onRankingUpdate(update);
      }
    };

    return on("rank:changed", handleRankChange);
  }, [on, onRankingUpdate]);

  // Handle contest entries
  useEffect(() => {
    const handleContestEntry = (entry: ContestEntry) => {
      console.log("[Leaderboard] Contest entry:", entry);

      if (onContestEntry) {
        onContestEntry(entry);
      }

      if (showToasts && entry.userId === userId) {
        toast({
          title: "🏆 Contest Entry Recorded!",
          description: `Rank #${entry.rank} in ${entry.metric}`,
        });
      }
    };

    const handleContestUpdate = (entry: ContestEntry) => {
      console.log("[Leaderboard] Contest entry update:", entry);

      if (onContestEntry) {
        onContestEntry(entry);
      }
    };

    const unsubscribe1 = on("contest:new-entry", handleContestEntry);
    const unsubscribe2 = on("contest:entry-update", handleContestUpdate);

    return () => {
      unsubscribe1();
      unsubscribe2();
    };
  }, [on, userId, onContestEntry, showToasts, toast]);

  // Handle achievement celebrations
  useEffect(() => {
    const handleAchievement = (achievement: AchievementEvent) => {
      console.log("[Leaderboard] Achievement earned:", achievement);
      setAchievements((prev) => [...prev, achievement]);

      if (onAchievement) {
        onAchievement(achievement);
      }

      if (showToasts && achievement.userId === userId) {
        toast({
          title: "🎊 Achievement Unlocked!",
          description: `${achievement.title} - ${achievement.description}`,
        });
      }
    };

    const handleCelebration = (achievement: AchievementEvent) => {
      console.log("[Leaderboard] Achievement celebration:", achievement);

      // Show public celebrations for all achievements (not just yours)
      if (showToasts && tvDisplay) {
        toast({
          title: `🎉 ${achievement.userName} earned an achievement!`,
          description: achievement.title,
        });
      }
    };

    const unsubscribe1 = on("achievement:earned", handleAchievement);
    const unsubscribe2 = on("achievement:celebration", handleCelebration);

    return () => {
      unsubscribe1();
      unsubscribe2();
    };
  }, [on, userId, tvDisplay, onAchievement, showToasts, toast]);

  // Handle full leaderboard refresh
  useEffect(() => {
    const handleLeaderboardRefresh = (rankings: unknown) => {
      console.log("[Leaderboard] Full refresh received");

      if (onLeaderboardRefresh) {
        onLeaderboardRefresh(rankings);
      }
    };

    return on("leaderboard:refresh", handleLeaderboardRefresh);
  }, [on, onLeaderboardRefresh]);

  // Handle TV display updates
  useEffect(() => {
    if (!tvDisplay) return;

    const handleTVUpdate = (data: unknown) => {
      console.log("[Leaderboard] TV display update:", data);

      if (onLeaderboardRefresh) {
        onLeaderboardRefresh(data);
      }
    };

    return on("tv:update", handleTVUpdate);
  }, [on, tvDisplay, onLeaderboardRefresh]);

  // Clear achievements
  const clearAchievements = useCallback(() => {
    setAchievements([]);
  }, []);

  return {
    connected,
    connecting,
    error,
    lastUpdate,
    achievements,
    clearAchievements,
  };
}
