import { Namespace, Socket } from "socket.io";

export interface RankingUpdate {
  userId: number;
  userName: string;
  previousRank: number;
  newRank: number;
  metric: string;
  value: number;
  timestamp: Date;
}

export interface ContestEntry {
  contestId: number;
  userId: number;
  userName: string;
  metric: string;
  value: number;
  rank: number;
  timestamp: Date;
}

export interface AchievementEvent {
  userId: number;
  userName: string;
  achievementType: "rank" | "milestone" | "streak" | "contest";
  title: string;
  description: string;
  icon?: string;
  timestamp: Date;
}

export class LeaderboardSocketHandler {
  private namespace: Namespace;

  constructor(namespace: Namespace) {
    this.namespace = namespace;
    this.setupHandlers();
  }

  private setupHandlers() {
    this.namespace.on("connection", (socket: Socket) => {
      console.log(`[Leaderboard] Client connected: ${socket.id}`);

      // Join TV display room for public leaderboard displays
      socket.on("join:tv-display", () => {
        socket.join("tv-display");
        console.log(`[Leaderboard] ${socket.id} joined TV display room`);
        socket.emit("joined", { room: "tv-display" });
      });

      // Join user-specific room for personal updates
      socket.on("join:user", (userId: number) => {
        if (!userId || typeof userId !== "number") {
          socket.emit("error", { message: "Invalid userId" });
          return;
        }
        socket.join(`user:${userId}`);
        console.log(`[Leaderboard] ${socket.id} joined user:${userId} room`);
        socket.emit("joined", { room: `user:${userId}` });
      });

      // Join team room for team-specific updates
      socket.on("join:team", (teamId: number) => {
        if (!teamId || typeof teamId !== "number") {
          socket.emit("error", { message: "Invalid teamId" });
          return;
        }
        socket.join(`team:${teamId}`);
        console.log(`[Leaderboard] ${socket.id} joined team:${teamId} room`);
        socket.emit("joined", { room: `team:${teamId}` });
      });

      // Join contest room for contest-specific updates
      socket.on("join:contest", (contestId: number) => {
        if (!contestId || typeof contestId !== "number") {
          socket.emit("error", { message: "Invalid contestId" });
          return;
        }
        socket.join(`contest:${contestId}`);
        console.log(`[Leaderboard] ${socket.id} joined contest:${contestId} room`);
        socket.emit("joined", { room: `contest:${contestId}` });
      });

      // Leave rooms
      socket.on("leave:tv-display", () => {
        socket.leave("tv-display");
        console.log(`[Leaderboard] ${socket.id} left TV display room`);
      });

      socket.on("leave:user", (userId: number) => {
        socket.leave(`user:${userId}`);
        console.log(`[Leaderboard] ${socket.id} left user:${userId} room`);
      });

      socket.on("leave:team", (teamId: number) => {
        socket.leave(`team:${teamId}`);
        console.log(`[Leaderboard] ${socket.id} left team:${teamId} room`);
      });

      socket.on("leave:contest", (contestId: number) => {
        socket.leave(`contest:${contestId}`);
        console.log(`[Leaderboard] ${socket.id} left contest:${contestId} room`);
      });

      socket.on("disconnect", () => {
        console.log(`[Leaderboard] Client disconnected: ${socket.id}`);
      });
    });
  }

  // Broadcast ranking change to all listeners
  broadcastRankingUpdate(update: RankingUpdate) {
    this.namespace.emit("rankings:update", update);
    console.log(`[Leaderboard] Broadcasted ranking update for user ${update.userId}`);
  }

  // Send ranking change to specific user
  notifyUserRankChange(userId: number, update: RankingUpdate) {
    this.namespace.to(`user:${userId}`).emit("rank:changed", update);
    console.log(`[Leaderboard] Notified user ${userId} of rank change`);
  }

  // Broadcast to team
  notifyTeam(teamId: number, event: string, data: unknown) {
    this.namespace.to(`team:${teamId}`).emit(event, data);
    console.log(`[Leaderboard] Notified team ${teamId} with event ${event}`);
  }

  // Broadcast new contest entry
  broadcastContestEntry(entry: ContestEntry) {
    this.namespace.emit("contest:new-entry", entry);
    this.namespace.to(`contest:${entry.contestId}`).emit("contest:entry-update", entry);
    console.log(`[Leaderboard] Broadcasted contest entry for contest ${entry.contestId}`);
  }

  // Send achievement celebration
  celebrateAchievement(achievement: AchievementEvent) {
    // Notify the user who earned the achievement
    this.namespace.to(`user:${achievement.userId}`).emit("achievement:earned", achievement);

    // Also broadcast to TV displays for public celebration
    this.namespace.to("tv-display").emit("achievement:celebration", achievement);

    console.log(`[Leaderboard] Celebrated achievement for user ${achievement.userId}: ${achievement.title}`);
  }

  // Broadcast full leaderboard refresh
  broadcastLeaderboardRefresh(rankings: unknown) {
    this.namespace.emit("leaderboard:refresh", rankings);
    console.log("[Leaderboard] Broadcasted full leaderboard refresh");
  }

  // Send to TV displays only
  updateTVDisplay(data: unknown) {
    this.namespace.to("tv-display").emit("tv:update", data);
    console.log("[Leaderboard] Updated TV displays");
  }

  // Get connected clients count
  getConnectedClientsCount(): Promise<number> {
    return this.namespace.allSockets().then(sockets => sockets.size);
  }

  // Check if user is connected
  async isUserConnected(userId: number): Promise<boolean> {
    const sockets = await this.namespace.in(`user:${userId}`).allSockets();
    return sockets.size > 0;
  }
}
