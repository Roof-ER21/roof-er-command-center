import { Router, Request, Response } from "express";
import bcrypt from "bcrypt";
import CryptoJS from "crypto-js";
import { db } from "../../db.js";
import { users, sessions } from "../../../shared/schema.js";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../../middleware/auth.js";

const router = Router();

// Get current user
router.get("/me", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req.session as any).userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: "Not authenticated" });
    }

    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user) {
      return res.status(401).json({ success: false, error: "User not found" });
    }

    // Remove sensitive data
    const { passwordHash, pinHash, ...safeUser } = user;
    res.json({ success: true, user: safeUser });
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ success: false, error: "Failed to fetch user" });
  }
});

// Password login
router.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase()));
    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    if (!user.passwordHash) {
      return res.status(401).json({ success: false, message: "Password login not enabled for this user" });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    // Update last login
    await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, user.id));

    // Set session
    (req.session as any).userId = user.id;
    (req.session as any).authMethod = "password";

    const { passwordHash, pinHash, ...safeUser } = user;
    res.json({ success: true, user: safeUser });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ success: false, message: "Login failed" });
  }
});

// PIN login (for training module)
router.post("/pin-login", async (req: Request, res: Response) => {
  try {
    const { pin, userId } = req.body;

    if (!pin) {
      return res.status(400).json({ success: false, message: "PIN is required" });
    }

    // Hash the PIN to compare
    const pinHash = CryptoJS.SHA256(pin).toString();

    // If userId is provided, look up specific user
    let user;
    if (userId) {
      const [foundUser] = await db.select().from(users).where(
        and(eq(users.id, userId), eq(users.pinHash, pinHash))
      );
      user = foundUser;
    } else {
      // Find user by PIN hash
      const [foundUser] = await db.select().from(users).where(eq(users.pinHash, pinHash));
      user = foundUser;
    }

    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid PIN" });
    }

    // Check if user has training access
    if (!user.hasTrainingAccess) {
      return res.status(403).json({ success: false, message: "No training access" });
    }

    // Update last login
    await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, user.id));

    // Set session
    (req.session as any).userId = user.id;
    (req.session as any).authMethod = "pin";

    const { passwordHash, pinHash: _, ...safeUser } = user;
    res.json({ success: true, user: safeUser });
  } catch (error) {
    console.error("PIN login error:", error);
    res.status(500).json({ success: false, message: "PIN login failed" });
  }
});

// Logout
router.post("/logout", (req: Request, res: Response) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Logout error:", err);
      return res.status(500).json({ success: false, message: "Logout failed" });
    }
    res.clearCookie("connect.sid");
    res.json({ success: true });
  });
});

// Register new user (admin only)
router.post("/register", requireAuth, async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).user;
    if (currentUser.role !== "SYSTEM_ADMIN" && currentUser.role !== "HR_ADMIN") {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    const { email, password, firstName, lastName, role, ...rest } = req.body;

    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    // Check if email exists
    const existing = await db.select().from(users).where(eq(users.email, email.toLowerCase()));
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: "Email already exists" });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const [newUser] = await db.insert(users).values({
      email: email.toLowerCase(),
      passwordHash,
      firstName,
      lastName,
      role: role || "EMPLOYEE",
      ...rest,
    }).returning();

    const { passwordHash: _, pinHash, ...safeUser } = newUser;
    res.status(201).json({ success: true, user: safeUser });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ success: false, message: "Registration failed" });
  }
});

export default router;
