import { Server as SocketIOServer, Socket } from "socket.io";
import { LeaderboardSocketHandler } from "./leaderboard";
import { TrainingSocketHandler } from "./training";

// Track connected clients by user ID and module
const connectedClients = new Map<number, Set<string>>();

// Handlers will be initialized in setupWebSocket
let leaderboardHandler: LeaderboardSocketHandler;
let trainingHandler: TrainingSocketHandler;

export function setupWebSocket(io: SocketIOServer) {
  // Namespace for leaderboard real-time updates
  const leaderboardNs = io.of("/leaderboard");
  leaderboardHandler = new LeaderboardSocketHandler(leaderboardNs);

  // Namespace for training real-time features
  const trainingNs = io.of("/training");
  trainingHandler = new TrainingSocketHandler(trainingNs);

  // Namespace for field module (chat)
  const fieldNs = io.of("/field");
  fieldNs.on("connection", (socket: Socket) => {
    console.log("Client connected to field namespace:", socket.id);

    socket.on("join:chat", (sessionId: string) => {
      socket.join(`chat:${sessionId}`);
      console.log(`${socket.id} joined chat:${sessionId}`);
    });

    socket.on("chat:message", async (data: { sessionId: string; message: string }) => {
      // Emit typing indicator
      socket.to(`chat:${data.sessionId}`).emit("chat:typing", true);

      // TODO: Process Susan AI response
      setTimeout(() => {
        socket.emit("chat:response", {
          sessionId: data.sessionId,
          message: "Susan AI response placeholder",
        });
        socket.emit("chat:typing", false);
      }, 1000);
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected from field:", socket.id);
    });
  });

  // Main namespace for notifications
  io.on("connection", (socket: Socket) => {
    const session = (socket.request as any).session;
    const userId = session?.userId;

    if (userId) {
      if (!connectedClients.has(userId)) {
        connectedClients.set(userId, new Set());
      }
      connectedClients.get(userId)!.add(socket.id);
      socket.join(`user:${userId}`);
      console.log(`User ${userId} connected with socket ${socket.id}`);
    }

    socket.on("disconnect", () => {
      if (userId) {
        connectedClients.get(userId)?.delete(socket.id);
        if (connectedClients.get(userId)?.size === 0) {
          connectedClients.delete(userId);
        }
      }
      console.log("Client disconnected:", socket.id);
    });
  });

  // Export broadcast functions and handlers
  return {
    // Main namespace functions
    broadcast: (event: string, data: unknown) => {
      io.emit(event, data);
    },

    toUser: (userId: number, event: string, data: unknown) => {
      io.to(`user:${userId}`).emit(event, data);
    },

    // Leaderboard handler
    leaderboard: leaderboardHandler,

    // Training handler
    training: trainingHandler,

    // Legacy compatibility
    toTVDisplay: (data: unknown) => {
      leaderboardHandler.updateTVDisplay(data);
    },

    updateLeaderboard: (rankings: unknown) => {
      leaderboardHandler.broadcastLeaderboardRefresh(rankings);
    },
  };
}

// Export types for use in other modules
export type {
  RankingUpdate,
  ContestEntry,
  AchievementEvent,
} from "./leaderboard";

export type {
  XPGainEvent,
  LevelUpEvent,
  StreakUpdate,
  TrainingAchievement,
  RoleplayProgress,
} from "./training";
