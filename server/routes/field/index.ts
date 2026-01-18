import { Router, Request, Response } from "express";
import { requireAuth, requireModuleAccess } from "../../middleware/auth.js";
import { db, schema } from "../../db.js";
import { eq, desc, and, sql } from "drizzle-orm";

const router = Router();

// Apply auth and module access middleware
router.use(requireAuth);
router.use(requireModuleAccess('field'));

// Get field dashboard stats
router.get("/dashboard", async (req: Request, res: Response) => {
  try {
    const userId = (req as any).session?.userId;

    // Get actual stats from database
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [chatStats] = await db
      .select({
        chatsToday: sql<number>`COUNT(DISTINCT CASE WHEN ${schema.chatSessions.startedAt} >= ${today.toISOString()} THEN ${schema.chatSessions.id} END)`,
        totalChats: sql<number>`COUNT(DISTINCT ${schema.chatSessions.id})`,
      })
      .from(schema.chatSessions)
      .where(eq(schema.chatSessions.userId, userId));

    res.json({
      success: true,
      data: {
        chatsToday: chatStats?.chatsToday || 0,
        emailsGenerated: 0, // TODO: Implement
        documentsAnalyzed: 0, // TODO: Implement
        imagesProcessed: 0, // TODO: Implement
        totalChats: chatStats?.totalChats || 0,
      }
    });
  } catch (error) {
    console.error("Field dashboard error:", error);
    res.status(500).json({ success: false, error: "Failed to fetch dashboard" });
  }
});

// Get chat history
router.get("/chat/history", async (req: Request, res: Response) => {
  try {
    const userId = (req as any).session?.userId;
    const limit = parseInt(req.query.limit as string) || 20;

    const sessions = await db.query.chatSessions.findMany({
      where: eq(schema.chatSessions.userId, userId),
      orderBy: [desc(schema.chatSessions.startedAt)],
      limit,
      with: {
        messages: {
          orderBy: [desc(schema.chatMessages.createdAt)],
          limit: 1,
        },
      },
    });

    // Format sessions with preview
    const formattedSessions = sessions.map(session => {
      const lastMessage = session.messages[0];
      const preview = lastMessage?.content?.substring(0, 100) || "New conversation";

      return {
        id: session.id,
        title: session.title || `Chat from ${new Date(session.startedAt).toLocaleDateString()}`,
        preview,
        messageCount: session.messageCount,
        lastMessageAt: lastMessage?.createdAt || session.startedAt,
        state: session.state,
        provider: session.provider,
      };
    });

    res.json({
      success: true,
      data: {
        sessions: formattedSessions,
      }
    });
  } catch (error) {
    console.error("Chat history error:", error);
    res.status(500).json({ success: false, error: "Failed to fetch chat history" });
  }
});

// Start new chat session
router.post("/chat/session", async (req: Request, res: Response) => {
  try {
    const userId = (req as any).session?.userId;
    const { state, provider } = req.body;

    const [newSession] = await db
      .insert(schema.chatSessions)
      .values({
        userId,
        state: state || null,
        provider: provider || 'gemini',
        title: `Chat from ${new Date().toLocaleDateString()}`,
      })
      .returning();

    res.json({
      success: true,
      data: {
        sessionId: newSession.id,
        startedAt: newSession.startedAt.toISOString(),
      }
    });
  } catch (error) {
    console.error("Chat session error:", error);
    res.status(500).json({ success: false, error: "Failed to create session" });
  }
});

// Get session messages
router.get("/chat/:sessionId/messages", async (req: Request, res: Response) => {
  try {
    const userId = (req as any).session?.userId;
    const { sessionId } = req.params;

    // Verify session belongs to user
    const session = await db.query.chatSessions.findFirst({
      where: and(
        eq(schema.chatSessions.id, sessionId),
        eq(schema.chatSessions.userId, userId)
      ),
    });

    if (!session) {
      return res.status(404).json({ success: false, error: "Session not found" });
    }

    const messages = await db.query.chatMessages.findMany({
      where: eq(schema.chatMessages.sessionId, sessionId),
      orderBy: [schema.chatMessages.createdAt],
    });

    res.json({
      success: true,
      data: { messages },
    });
  } catch (error) {
    console.error("Get messages error:", error);
    res.status(500).json({ success: false, error: "Failed to fetch messages" });
  }
});

// Send chat message (Susan AI)
router.post("/chat/:sessionId/message", async (req: Request, res: Response) => {
  try {
    const userId = (req as any).session?.userId;
    const { sessionId } = req.params;
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, error: "Message is required" });
    }

    // Verify session exists and belongs to user
    const session = await db.query.chatSessions.findFirst({
      where: and(
        eq(schema.chatSessions.id, sessionId),
        eq(schema.chatSessions.userId, userId)
      ),
    });

    if (!session) {
      return res.status(404).json({ success: false, error: "Session not found" });
    }

    // Save user message
    await db.insert(schema.chatMessages).values({
      sessionId,
      role: 'user',
      content: message,
    });

    // TODO: Integrate with actual AI service (Google GenAI, OpenAI, etc.)
    // For now, provide an intelligent placeholder response
    const aiResponse = generatePlaceholderResponse(message);

    // Save AI response
    const [assistantMessage] = await db
      .insert(schema.chatMessages)
      .values({
        sessionId,
        role: 'assistant',
        content: aiResponse,
      })
      .returning();

    // Update session message count
    await db
      .update(schema.chatSessions)
      .set({
        messageCount: sql`${schema.chatSessions.messageCount} + 2`,
      })
      .where(eq(schema.chatSessions.id, sessionId));

    res.json({
      success: true,
      data: {
        sessionId,
        response: aiResponse,
        timestamp: assistantMessage.createdAt.toISOString(),
      }
    });
  } catch (error) {
    console.error("Chat message error:", error);
    res.status(500).json({ success: false, error: "Failed to process message" });
  }
});

// Helper function to generate intelligent placeholder responses
function generatePlaceholderResponse(message: string): string {
  const lowerMessage = message.toLowerCase();

  // Insurance-related
  if (lowerMessage.includes('insurance') || lowerMessage.includes('claim')) {
    return `I can help you with insurance claims! Here's what I recommend:\n\n1. **Document Everything**: Take detailed photos of the damage\n2. **Review the Policy**: Check coverage limits and exclusions\n3. **Contact Adjuster**: Schedule an inspection as soon as possible\n4. **Keep Records**: Save all communication and documentation\n\nWould you like me to help draft an email to the insurance company or explain a specific part of the claims process?`;
  }

  // Email-related
  if (lowerMessage.includes('email') || lowerMessage.includes('write') || lowerMessage.includes('draft')) {
    return `I'd be happy to help you draft a professional email! For the best results, please provide:\n\n- **Purpose**: What's the email about? (follow-up, claim update, initial contact)\n- **Recipient**: Who are you writing to? (homeowner, adjuster, contractor)\n- **Key Points**: What information needs to be included?\n- **Tone**: Professional, friendly, formal?\n\nOnce you provide these details, I can create a polished email template for you!`;
  }

  // Damage assessment
  if (lowerMessage.includes('damage') || lowerMessage.includes('assessment') || lowerMessage.includes('inspection')) {
    return `For a thorough damage assessment, here's what to look for:\n\n**Roof Damage Indicators:**\n- Missing, cracked, or curling shingles\n- Granule loss in gutters\n- Exposed underlayment\n- Damaged flashing around chimneys/vents\n- Interior water stains\n\n**Documentation Tips:**\n- Take photos from multiple angles\n- Include close-ups and wide shots\n- Note date, time, and weather conditions\n- Measure affected areas\n\nWould you like specific guidance on assessing storm damage or hail damage?`;
  }

  // General roofing questions
  if (lowerMessage.includes('roof') || lowerMessage.includes('shingle') || lowerMessage.includes('material')) {
    return `I can help answer your roofing questions! Common topics I can assist with:\n\n- **Materials**: Asphalt shingles, metal roofing, TPO, EPDM\n- **Installation**: Best practices, code requirements, warranties\n- **Maintenance**: Inspection schedules, preventive care\n- **Repairs**: Common issues and solutions\n\nWhat specific aspect would you like to know more about?`;
  }

  // Default response
  return `Thank you for your question! I'm Susan, your AI field assistant for roofing operations.\n\nI can help you with:\n- Insurance claims and adjuster communications\n- Professional email drafting\n- Damage assessment guidance\n- Roofing technical questions\n- Field documentation best practices\n\nPlease provide more details about what you need, and I'll give you specific, actionable advice!\n\n*Note: Full AI integration with Google GenAI is coming soon for even more intelligent responses.*`;
}

// Get email templates
router.get("/email/templates", async (req: Request, res: Response) => {
  try {
    res.json({
      success: true,
      data: {
        templates: [
          { id: 1, name: "Initial Contact", category: "outreach" },
          { id: 2, name: "Follow Up", category: "outreach" },
          { id: 3, name: "Insurance Update", category: "claims" },
          { id: 4, name: "Scheduling", category: "scheduling" },
          { id: 5, name: "Thank You", category: "follow-up" },
        ],
      }
    });
  } catch (error) {
    console.error("Email templates error:", error);
    res.status(500).json({ success: false, error: "Failed to fetch templates" });
  }
});

// Generate email
router.post("/email/generate", async (req: Request, res: Response) => {
  try {
    const { templateId, context } = req.body;
    // TODO: Implement actual email generation using AI
    res.json({
      success: true,
      data: {
        subject: "Sample Subject Line",
        body: "Dear Customer,\n\nThis is a placeholder email generated by the system.\n\nBest regards,\nRoof ER Team",
      }
    });
  } catch (error) {
    console.error("Email generation error:", error);
    res.status(500).json({ success: false, error: "Failed to generate email" });
  }
});

// Analyze document
router.post("/documents/analyze", async (req: Request, res: Response) => {
  try {
    // TODO: Implement actual document analysis
    res.json({
      success: true,
      data: {
        analysis: "Document analysis placeholder",
        extractedData: {},
      }
    });
  } catch (error) {
    console.error("Document analysis error:", error);
    res.status(500).json({ success: false, error: "Failed to analyze document" });
  }
});

export default router;
