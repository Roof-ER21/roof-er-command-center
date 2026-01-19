import { db } from "../db.js";
import { 
  users, 
  salesReps, 
  ptoPolicies, 
  trainingUserProgress, 
  onboardingTasks 
} from "../../shared/schema.js";
import { eq, and, ne } from "drizzle-orm";

/**
 * Builds a rich context string about the current user
 * allowing Susan AI to be aware of their HR, Sales, and Training status.
 */
export async function getUnifiedUserContext(userId: number): Promise<string> {
  try {
    // 1. Fetch User Identity
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user) return "";

    // 2. Fetch Module-Specific Data in Parallel
    const [
      [salesRep],
      [pto],
      [training],
      pendingTasks
    ] = await Promise.all([
      db.select().from(salesReps).where(eq(salesReps.userId, userId)),
      db.select().from(ptoPolicies).where(eq(ptoPolicies.employeeId, userId)),
      db.select().from(trainingUserProgress).where(eq(trainingUserProgress.userId, userId)),
      db.select().from(onboardingTasks).where(and(eq(onboardingTasks.employeeId, userId), ne(onboardingTasks.status, 'completed')))
    ]);

    // 3. Construct Context String
    let context = `\n**CURRENT USER CONTEXT (${user.firstName} ${user.lastName}):**\n`;
    context += `- Role: ${user.role}\n`;
    context += `- Department: ${user.department || 'General'}\n`;
    context += `- Location: ${user.address || 'Remote'}\n`;

    // HR Context
    if (pto) {
      context += `- HR Status: Active\n`;
      context += `- PTO Balance: ${pto.remainingDays} days available\n`;
    }
    if (pendingTasks && pendingTasks.length > 0) {
      context += `- Pending Tasks: ${pendingTasks.length} items (e.g., "${pendingTasks[0].taskName}")\n`;
    }

    // Leaderboard/Sales Context
    if (salesRep) {
      context += `- Sales Team: ${salesRep.team}\n`;
      context += `- Monthly Revenue: $${Number(salesRep.monthlyRevenue).toLocaleString()}\n`;
      context += `- Monthly Signups: ${salesRep.monthlySignups}\n`;
      context += `- Current Bonus Tier: ${salesRep.currentBonusTier}\n`;
    }

    // Training Context
    if (training) {
      context += `- Training Level: ${training.currentLevel}\n`;
      context += `- Total XP: ${training.totalXP}\n`;
    }

    context += `\n(Use this context to personalize your response. If the user asks about their stats/status, use these real numbers.)\n`;

    return context;
  } catch (error) {
    console.error("Error building user context:", error);
    return ""; // Fail gracefully without context
  }
}
