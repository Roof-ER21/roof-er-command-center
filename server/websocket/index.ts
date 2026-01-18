import { Server as SocketIOServer, Socket } from "socket.io";

// Track connected clients by user ID and module
const connectedClients = new Map<number, Set<string>>();

export function setupWebSocket(io: SocketIOServer) {
  // Namespace for leaderboard real-time updates
  const leaderboardNs = io.of("/leaderboard");
  leaderboardNs.on("connection", (socket: Socket) => {
    console.log("Client connected to leaderboard namespace:", socket.id);

    // Join room for TV display updates
    socket.on("join:tv-display", () => {
      socket.join("tv-display");
      console.log(`${socket.id} joined tv-display room`);
    });

    // Join room for personal updates
    socket.on("join:user", (userId: number) => {
      socket.join(`user:${userId}`);
      console.log(`${socket.id} joined user:${userId} room`);
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected from leaderboard:", socket.id);
    });
  });

  // Namespace for training real-time features
  const trainingNs = io.of("/training");
  trainingNs.on("connection", (socket: Socket) => {
    console.log("Client connected to training namespace:", socket.id);

    socket.on("join:session", (sessionId: string) => {
      socket.join(`session:${sessionId}`);
      console.log(`${socket.id} joined training session:${sessionId}`);
    });

    socket.on("roleplay:message", async (data: { sessionId: string; message: string }) => {
      // Emit typing indicator
      socket.to(`session:${data.sessionId}`).emit("roleplay:typing", true);

      // TODO: Process AI response and emit back
      setTimeout(() => {
        socket.emit("roleplay:response", {
          sessionId: data.sessionId,
          message: "AI response placeholder",
        });
      }, 1000);
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected from training:", socket.id);
    });
  });

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

  // Export broadcast functions
  return {
    // Broadcast to all connected clients
    broadcast: (event: string, data: unknown) => {
      io.emit(event, data);
    },

    // Broadcast to specific user
    toUser: (userId: number, event: string, data: unknown) => {
      io.to(`user:${userId}`).emit(event, data);
    },

    // Broadcast to TV display
    toTVDisplay: (data: unknown) => {
      leaderboardNs.to("tv-display").emit("leaderboard:update", data);
    },

    // Broadcast leaderboard update
    updateLeaderboard: (rankings: unknown) => {
      leaderboardNs.emit("rankings:update", rankings);
    },
  };
}
