import { Request, Response, NextFunction } from "express";
import { db } from "../db.js";
import { users } from "../../shared/schema.js";
import { eq } from "drizzle-orm";
import { selectUserColumns } from "../utils/user-select.js";

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: typeof users.$inferSelect;
    }
  }
}

// Require authentication middleware
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req.session as any)?.userId;

    if (!userId) {
      return res.status(401).json({ success: false, error: "Not authenticated" });
    }

    const [user] = await db.select(selectUserColumns()).from(users).where(eq(users.id, userId));

    if (!user) {
      return res.status(401).json({ success: false, error: "User not found" });
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(500).json({ success: false, error: "Authentication error" });
  }
}

// Require specific role(s)
export function requireRole(...roles: string[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, error: "Not authenticated" });
      }

      if (!roles.includes(req.user.role)) {
        return res.status(403).json({ success: false, error: "Insufficient permissions" });
      }

      next();
    } catch (error) {
      console.error("Role check error:", error);
      res.status(500).json({ success: false, error: "Authorization error" });
    }
  };
}

// Require module access
export function requireModuleAccess(module: 'hr' | 'leaderboard' | 'training' | 'field') {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, error: "Not authenticated" });
      }

      let hasAccess = false;
      switch (module) {
        case 'hr':
          hasAccess = req.user.hasHRAccess;
          break;
        case 'leaderboard':
          hasAccess = req.user.hasLeaderboardAccess;
          break;
        case 'training':
          hasAccess = req.user.hasTrainingAccess;
          break;
        case 'field':
          hasAccess = req.user.hasFieldAccess;
          break;
      }

      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          error: `No access to ${module} module`
        });
      }

      next();
    } catch (error) {
      console.error("Module access check error:", error);
      res.status(500).json({ success: false, error: "Authorization error" });
    }
  };
}
