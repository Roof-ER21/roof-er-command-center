import { useEffect, useCallback, useState } from "react";
import { useSocket } from "./useSocket";
import { useToast } from "./useToast";

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

interface StreakUpdate {
  userId: number;
  userName: string;
  currentStreak: number;
  longestStreak: number;
  streakType: "daily" | "weekly" | "monthly";
  milestone?: {
    reached: number;
    reward?: string;
  };
  timestamp: Date;
}

interface TrainingAchievement {
  userId: number;
  userName: string;
  achievementId: string;
  title: string;
  description: string;
  category: "quiz" | "roleplay" | "completion" | "speed" | "accuracy";
  rarity: "common" | "rare" | "epic" | "legendary";
  xpBonus?: number;
  timestamp: Date;
}

interface RoleplayProgress {
  sessionId: string;
  userId: number;
  scenarioId: string;
  progress: number;
  currentStep: number;
  totalSteps: number;
  metrics?: {
    accuracy?: number;
    responseTime?: number;
    score?: number;
  };
}

interface UseTrainingSocketOptions {
  userId?: number;
  sessionId?: string;
  moduleId?: string;
  onXPGain?: (event: XPGainEvent) => void;
  onLevelUp?: (event: LevelUpEvent) => void;
  onStreakUpdate?: (update: StreakUpdate) => void;
  onAchievement?: (achievement: TrainingAchievement) => void;
  onProgress?: (progress: RoleplayProgress) => void;
  onRoleplayResponse?: (response: { message: string; metadata?: unknown }) => void;
  showToasts?: boolean;
}

export function useTrainingSocket(options: UseTrainingSocketOptions = {}) {
  const {
    userId,
    sessionId,
    moduleId,
    onXPGain,
    onLevelUp,
    onStreakUpdate,
    onAchievement,
    onProgress,
    onRoleplayResponse,
    showToasts = true,
  } = options;

  const { toast } = useToast();
  const [totalXP, setTotalXP] = useState<number>(0);
  const [currentLevel, setCurrentLevel] = useState<number>(1);
  const [currentStreak, setCurrentStreak] = useState<number>(0);
  const [achievements, setAchievements] = useState<TrainingAchievement[]>([]);
  const [isTyping, setIsTyping] = useState<boolean>(false);

  const { connected, connecting, error, joinRoom, leaveRoom, emit, on } = useSocket({
    namespace: "/training",
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 5,
  });

  // Join rooms on connection
  useEffect(() => {
    if (!connected) return;

    if (userId) {
      joinRoom("join:user", userId);
    }

    if (sessionId) {
      joinRoom("join:session", sessionId);
    }

    if (moduleId) {
      joinRoom("join:module", moduleId);
    }

    return () => {
      if (userId) {
        leaveRoom("join:user", userId);
      }
      if (sessionId) {
        leaveRoom("join:session", sessionId);
      }
      if (moduleId) {
        leaveRoom("join:module", moduleId);
      }
    };
  }, [connected, userId, sessionId, moduleId, joinRoom, leaveRoom]);

  // Handle XP gain
  useEffect(() => {
    const handleXPGain = (event: XPGainEvent) => {
      console.log("[Training] XP gained:", event);
      setTotalXP(event.newTotal);

      if (onXPGain) {
        onXPGain(event);
      }

      if (showToasts && event.userId === userId) {
        toast({
          title: "✨ XP Gained!",
          description: `+${event.amount} XP from ${event.source}`,
        });
      }
    };

    return on("xp:gained", handleXPGain);
  }, [on, userId, onXPGain, showToasts, toast]);

  // Handle level up
  useEffect(() => {
    const handleLevelUp = (event: LevelUpEvent) => {
      console.log("[Training] Level up:", event);
      setCurrentLevel(event.newLevel);
      setTotalXP(event.totalXP);

      if (onLevelUp) {
        onLevelUp(event);
      }

      if (showToasts && event.userId === userId) {
        toast({
          title: "🎉 Level Up!",
          description: `You reached level ${event.newLevel}!`,
        });
      }
    };

    const handleLevelCelebration = (event: {
      userName: string;
      newLevel: number;
      timestamp: Date;
    }) => {
      console.log("[Training] Level celebration:", event);
    };

    const unsubscribe1 = on("level:up", handleLevelUp);
    const unsubscribe2 = on("level:celebration", handleLevelCelebration);

    return () => {
      unsubscribe1();
      unsubscribe2();
    };
  }, [on, userId, onLevelUp, showToasts, toast]);

  // Handle streak updates
  useEffect(() => {
    const handleStreakUpdate = (update: StreakUpdate) => {
      console.log("[Training] Streak update:", update);
      setCurrentStreak(update.currentStreak);

      if (onStreakUpdate) {
        onStreakUpdate(update);
      }

      if (showToasts && update.userId === userId) {
        if (update.milestone) {
          toast({
            title: "🔥 Streak Milestone!",
            description: `${update.milestone.reached} ${update.streakType} streak!`,
          });
        } else {
          toast({
            title: "🔥 Streak Updated",
            description: `${update.currentStreak} ${update.streakType} streak`,
          });
        }
      }
    };

    const handleStreakMilestone = (event: {
      userName: string;
      milestone: number;
      streakType: string;
      timestamp: Date;
    }) => {
      console.log("[Training] Streak milestone:", event);
    };

    const unsubscribe1 = on("streak:update", handleStreakUpdate);
    const unsubscribe2 = on("streak:milestone", handleStreakMilestone);

    return () => {
      unsubscribe1();
      unsubscribe2();
    };
  }, [on, userId, onStreakUpdate, showToasts, toast]);

  // Handle achievements
  useEffect(() => {
    const handleAchievement = (achievement: TrainingAchievement) => {
      console.log("[Training] Achievement unlocked:", achievement);
      setAchievements((prev) => [...prev, achievement]);

      if (onAchievement) {
        onAchievement(achievement);
      }

      if (showToasts && achievement.userId === userId) {
        const rarityEmoji = {
          common: "🏅",
          rare: "🥈",
          epic: "🥇",
          legendary: "👑",
        }[achievement.rarity];

        toast({
          title: `${rarityEmoji} ${achievement.rarity.toUpperCase()} Achievement!`,
          description: `${achievement.title} - ${achievement.description}`,
        });
      }
    };

    const handleAchievementShowcase = (event: {
      userName: string;
      title: string;
      rarity: string;
      timestamp: Date;
    }) => {
      console.log("[Training] Achievement showcase:", event);
    };

    const unsubscribe1 = on("achievement:unlocked", handleAchievement);
    const unsubscribe2 = on("achievement:showcase", handleAchievementShowcase);

    return () => {
      unsubscribe1();
      unsubscribe2();
    };
  }, [on, userId, onAchievement, showToasts, toast]);

  // Handle roleplay responses
  useEffect(() => {
    const handleResponse = (response: { message: string; metadata?: unknown }) => {
      console.log("[Training] Roleplay response:", response);
      setIsTyping(false);

      if (onRoleplayResponse) {
        onRoleplayResponse(response);
      }
    };

    const handleTyping = (data: { userId: number; isTyping: boolean }) => {
      console.log("[Training] Typing indicator:", data);
      setIsTyping(data.isTyping);
    };

    const handleMessageReceived = (data: { sessionId: string }) => {
      console.log("[Training] Message received confirmation:", data);
    };

    const unsubscribe1 = on("roleplay:response", handleResponse);
    const unsubscribe2 = on("roleplay:typing", handleTyping);
    const unsubscribe3 = on("roleplay:message-received", handleMessageReceived);

    return () => {
      unsubscribe1();
      unsubscribe2();
      unsubscribe3();
    };
  }, [on, onRoleplayResponse]);

  // Handle progress updates
  useEffect(() => {
    const handleProgress = (progress: RoleplayProgress) => {
      console.log("[Training] Progress update:", progress);

      if (onProgress) {
        onProgress(progress);
      }
    };

    const handleProgressChanged = (progress: RoleplayProgress) => {
      console.log("[Training] Progress changed:", progress);

      if (onProgress) {
        onProgress(progress);
      }
    };

    const unsubscribe1 = on("progress:update", handleProgress);
    const unsubscribe2 = on("progress:changed", handleProgressChanged);

    return () => {
      unsubscribe1();
      unsubscribe2();
    };
  }, [on, onProgress]);

  // Handle quiz completion
  useEffect(() => {
    const handleQuizComplete = (data: {
      userId: number;
      quizId: string;
      score: number;
      passed: boolean;
      xpEarned: number;
    }) => {
      console.log("[Training] Quiz completed:", data);

      if (showToasts && data.userId === userId) {
        toast({
          title: data.passed ? "✅ Quiz Passed!" : "❌ Quiz Failed",
          description: `Score: ${data.score}% | +${data.xpEarned} XP`,
          variant: data.passed ? "default" : "destructive",
        });
      }
    };

    return on("quiz:completed", handleQuizComplete);
  }, [on, userId, showToasts, toast]);

  // Send roleplay message
  const sendMessage = useCallback(
    (message: string) => {
      if (!sessionId || !userId) {
        console.warn("[Training] Cannot send message: missing sessionId or userId");
        return;
      }

      emit("roleplay:message", {
        sessionId,
        message,
        userId,
      });

      setIsTyping(true);
    },
    [emit, sessionId, userId]
  );

  // Stop typing indicator
  const stopTyping = useCallback(() => {
    if (!sessionId || !userId) return;

    emit("roleplay:stop-typing", {
      sessionId,
      userId,
    });
  }, [emit, sessionId, userId]);

  // Update progress
  const updateProgress = useCallback(
    (progress: RoleplayProgress) => {
      emit("progress:update", progress);
    },
    [emit]
  );

  // Clear achievements
  const clearAchievements = useCallback(() => {
    setAchievements([]);
  }, []);

  return {
    connected,
    connecting,
    error,
    totalXP,
    currentLevel,
    currentStreak,
    achievements,
    isTyping,
    sendMessage,
    stopTyping,
    updateProgress,
    clearAchievements,
  };
}
