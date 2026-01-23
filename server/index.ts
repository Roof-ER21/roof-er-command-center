// Load environment variables first - must be before all other imports
import "./config/env.js";

import express, { type Request, Response, NextFunction } from "express";
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import session from "express-session";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

// Import routes
import authRoutes from "./routes/auth/index.js";
import hrRoutes from "./routes/hr/index.js";
import hrPublicRoutes from "./routes/hr/public.js";
import hrSlugRoutes from "./routes/hr/slugs.js";
import leaderboardRoutes from "./routes/leaderboard/index.js";
import salesRoutes from "./routes/sales/index.js";
import trainingRoutes from "./routes/training/index.js";
import fieldRoutes from "./routes/field/index.js";
import aiRoutes from "./routes/ai/index.js";
import syncRoutes from "./routes/sync/index.js";
import cronRoutes from "./routes/cron/index.js";
import safetyRoutes from "./routes/safety/index.js";

// Import WebSocket handlers
import { setupWebSocket } from "./websocket/index.js";
import { initializeAchievementBroadcaster } from "./utils/achievement-broadcaster.js";

// Import database
import { db } from "./db.js";
import { salesReps, teams } from "../shared/schema.js";
import { eq, desc } from "drizzle-orm";

// Import storage service to initialize and log storage mode
import { getStorageService } from "./services/blob-storage.js";

// Import workflow scheduler
import { startWorkflowScheduler } from "./cron/workflow-scheduler.js";

// Import onboarding scheduler
import { scheduleOverdueTaskCheck } from "./cron/onboarding-overdue-job.js";

// Import PTO calendar sync scheduler
import { startPtoCalendarSync } from "./cron/pto-calendar-sync.js";

// Import PTO reminder scheduler
import { schedulePtoReminderJob } from "./cron/pto-reminder-job.js";
import { scheduleInterviewOverdueJob } from "./cron/interview-overdue-job.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const httpServer = createServer(app);

// Trust Railway's reverse proxy (required for secure cookies)
app.set('trust proxy', 1);

// Socket.IO setup
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Security middleware
app.use(helmet({
  contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
}));

// CORS
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Session configuration
const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET || 'development-secret-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'lax',
  },
});
app.use(sessionMiddleware);

// Share session with Socket.IO
io.use((socket, next) => {
  sessionMiddleware(socket.request as Request, {} as Response, next as NextFunction);
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/hr', hrRoutes);
app.use('/api/hr', hrSlugRoutes); // Slug management routes
app.use('/api/public', hrPublicRoutes); // Public routes (NO AUTH)
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/training', trainingRoutes);
app.use('/api/field', fieldRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/sync', syncRoutes);
app.use('/api/safety', safetyRoutes);
app.use('/api/cron', cronRoutes);

// Direct routes for leaderboard data (used by some components)
// /api/sales-reps -> sales reps list
app.get('/api/sales-reps', async (req, res) => {
  try {
    const reps = await db.select()
      .from(salesReps)
      .where(eq(salesReps.isActive, true))
      .orderBy(desc(salesReps.monthlyRevenue));

    const rankedReps = reps.map((rep, index) => ({
      ...rep,
      rank: index + 1,
      monthlyRevenue: Number(rep.monthlyRevenue),
      yearlyRevenue: Number(rep.yearlyRevenue),
      allTimeRevenue: Number(rep.allTimeRevenue),
      monthlySignups: Number(rep.monthlySignups),
      yearlySignups: Number(rep.yearlySignups),
      goalProgress: Number(rep.goalProgress),
      monthlyGrowth: Number(rep.monthlyGrowth),
    }));
    res.json(rankedReps);
  } catch (error) {
    console.error("Sales reps error:", error);
    res.json([]);
  }
});

// /api/teams -> teams list
app.get('/api/teams', async (req, res) => {
  try {
    const allTeams = await db.select().from(teams).where(eq(teams.isActive, true));
    res.json(allTeams);
  } catch (error) {
    console.error("Teams error:", error);
    res.json([]);
  }
});

// Setup WebSocket handlers and export for use in routes
const wsHandlers = setupWebSocket(io);
export { wsHandlers };

// Initialize achievement broadcaster with WebSocket handlers
initializeAchievementBroadcaster(wsHandlers);

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  const distPath = join(__dirname, 'public');
  app.use(express.static(distPath));

  // SPA fallback
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(join(distPath, 'index.html'));
    }
  });
}

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message,
  });
});

// Start server
const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  // Initialize storage service and get its type
  const storageService = getStorageService();
  const storageType = storageService.getStorageType();
  const storageIcon = storageType === 'blob' ? '☁️' : '💾';
  const storageLabel = storageType === 'blob' ? 'Vercel Blob' : 'Local Storage';

  // Start workflow scheduler
  startWorkflowScheduler();

  // Start onboarding overdue task scheduler
  scheduleOverdueTaskCheck();

  // Start PTO calendar sync scheduler
  startPtoCalendarSync();

  // Start PTO reminder scheduler
  schedulePtoReminderJob();

  // Start interview overdue scheduler
  scheduleInterviewOverdueJob();

  console.log(`
🚀 Roof ER Command Center Server
================================
Environment: ${process.env.NODE_ENV || 'development'}
Port: ${PORT}
Time: ${new Date().toISOString()}

Modules Enabled:
  ✅ HR Management
  ✅ Sales Leaderboard
  ✅ Training Center
  ✅ Field Assistant
  ✅ WebSocket (Real-time)
  ✅ Workflow Automation

Storage Configuration:
  ${storageIcon} ${storageLabel}
================================
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  httpServer.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

export { app, io };
