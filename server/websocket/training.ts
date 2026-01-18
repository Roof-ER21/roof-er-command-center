import { Namespace, Socket } from "socket.io";

export interface XPGainEvent {
  userId: number;
  userName: string;
  amount: number;
  source: string; // e.g., "quiz_completion", "roleplay_session", "daily_login"
  newTotal: number;
  timestamp: Date;
}

export interface LevelUpEvent {
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

export interface StreakUpdate {
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

export interface TrainingAchievement {
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

export interface RoleplayProgress {
  sessionId: string;
  userId: number;
  scenarioId: string;
  progress: number; // 0-100
  currentStep: number;
  totalSteps: number;
  metrics?: {
    accuracy?: number;
    responseTime?: number;
    score?: number;
  };
}

export class TrainingSocketHandler {
  private namespace: Namespace;

  constructor(namespace: Namespace) {
    this.namespace = namespace;
    this.setupHandlers();
  }

  private setupHandlers() {
    this.namespace.on("connection", (socket: Socket) => {
      console.log(`[Training] Client connected: ${socket.id}`);

      // Join user-specific room
      socket.on("join:user", (userId: number) => {
        if (!userId || typeof userId !== "number") {
          socket.emit("error", { message: "Invalid userId" });
          return;
        }
        socket.join(`user:${userId}`);
        console.log(`[Training] ${socket.id} joined user:${userId} room`);
        socket.emit("joined", { room: `user:${userId}` });
      });

      // Join training session room
      socket.on("join:session", (sessionId: string) => {
        if (!sessionId || typeof sessionId !== "string") {
          socket.emit("error", { message: "Invalid sessionId" });
          return;
        }
        socket.join(`session:${sessionId}`);
        console.log(`[Training] ${socket.id} joined session:${sessionId} room`);
        socket.emit("joined", { room: `session:${sessionId}` });
      });

      // Join course/module room
      socket.on("join:module", (moduleId: string) => {
        if (!moduleId || typeof moduleId !== "string") {
          socket.emit("error", { message: "Invalid moduleId" });
          return;
        }
        socket.join(`module:${moduleId}`);
        console.log(`[Training] ${socket.id} joined module:${moduleId} room`);
        socket.emit("joined", { room: `module:${moduleId}` });
      });

      // Roleplay message handling
      socket.on("roleplay:message", async (data: { sessionId: string; message: string; userId: number }) => {
        console.log(`[Training] Roleplay message in session ${data.sessionId}`);

        // Emit typing indicator to session participants
        socket.to(`session:${data.sessionId}`).emit("roleplay:typing", {
          userId: data.userId,
          isTyping: true
        });

        // Acknowledge receipt
        socket.emit("roleplay:message-received", { sessionId: data.sessionId });
      });

      // Stop typing indicator
      socket.on("roleplay:stop-typing", (data: { sessionId: string; userId: number }) => {
        socket.to(`session:${data.sessionId}`).emit("roleplay:typing", {
          userId: data.userId,
          isTyping: false
        });
      });

      // Progress update
      socket.on("progress:update", (progress: RoleplayProgress) => {
        socket.to(`session:${progress.sessionId}`).emit("progress:changed", progress);
      });

      // Leave rooms
      socket.on("leave:user", (userId: number) => {
        socket.leave(`user:${userId}`);
        console.log(`[Training] ${socket.id} left user:${userId} room`);
      });

      socket.on("leave:session", (sessionId: string) => {
        socket.leave(`session:${sessionId}`);
        console.log(`[Training] ${socket.id} left session:${sessionId} room`);
      });

      socket.on("leave:module", (moduleId: string) => {
        socket.leave(`module:${moduleId}`);
        console.log(`[Training] ${socket.id} left module:${moduleId} room`);
      });

      socket.on("disconnect", () => {
        console.log(`[Training] Client disconnected: ${socket.id}`);
      });
    });
  }

  // Notify XP gain
  notifyXPGain(event: XPGainEvent) {
    this.namespace.to(`user:${event.userId}`).emit("xp:gained", event);
    console.log(`[Training] Notified user ${event.userId} of XP gain: +${event.amount}`);
  }

  // Celebrate level up
  celebrateLevelUp(event: LevelUpEvent) {
    this.namespace.to(`user:${event.userId}`).emit("level:up", event);

    // Also broadcast to all connected training clients for celebration
    this.namespace.emit("level:celebration", {
      userName: event.userName,
      newLevel: event.newLevel,
      timestamp: event.timestamp
    });

    console.log(`[Training] Celebrated level up for user ${event.userId}: Level ${event.newLevel}`);
  }

  // Update streak
  updateStreak(update: StreakUpdate) {
    this.namespace.to(`user:${update.userId}`).emit("streak:update", update);

    // If milestone reached, celebrate publicly
    if (update.milestone) {
      this.namespace.emit("streak:milestone", {
        userName: update.userName,
        milestone: update.milestone.reached,
        streakType: update.streakType,
        timestamp: update.timestamp
      });
    }

    console.log(`[Training] Updated streak for user ${update.userId}: ${update.currentStreak} days`);
  }

  // Notify achievement unlock
  notifyAchievement(achievement: TrainingAchievement) {
    this.namespace.to(`user:${achievement.userId}`).emit("achievement:unlocked", achievement);

    // Broadcast rare and above achievements
    if (achievement.rarity !== "common") {
      this.namespace.emit("achievement:showcase", {
        userName: achievement.userName,
        title: achievement.title,
        rarity: achievement.rarity,
        timestamp: achievement.timestamp
      });
    }

    console.log(`[Training] Unlocked ${achievement.rarity} achievement for user ${achievement.userId}: ${achievement.title}`);
  }

  // Send roleplay AI response
  sendRoleplayResponse(sessionId: string, response: { message: string; metadata?: unknown }) {
    this.namespace.to(`session:${sessionId}`).emit("roleplay:response", response);
    console.log(`[Training] Sent roleplay response to session ${sessionId}`);
  }

  // Update session progress
  updateProgress(progress: RoleplayProgress) {
    this.namespace.to(`session:${progress.sessionId}`).emit("progress:update", progress);
    console.log(`[Training] Updated progress for session ${progress.sessionId}: ${progress.progress}%`);
  }

  // Notify quiz completion
  notifyQuizComplete(data: {
    userId: number;
    quizId: string;
    score: number;
    passed: boolean;
    xpEarned: number;
  }) {
    this.namespace.to(`user:${data.userId}`).emit("quiz:completed", data);
    console.log(`[Training] Quiz completed by user ${data.userId}: Score ${data.score}`);
  }

  // Broadcast module update to all participants
  broadcastModuleUpdate(moduleId: string, update: unknown) {
    this.namespace.to(`module:${moduleId}`).emit("module:update", update);
    console.log(`[Training] Broadcasted update to module ${moduleId}`);
  }

  // Get connected clients count
  async getConnectedClientsCount(): Promise<number> {
    const sockets = await this.namespace.allSockets();
    return sockets.size;
  }

  // Check if user is in active training session
  async isUserInSession(userId: number): Promise<boolean> {
    const sockets = await this.namespace.in(`user:${userId}`).allSockets();
    return sockets.size > 0;
  }
}
