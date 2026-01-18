import { Router, Request, Response } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { susanAI, ModuleContext } from "../../services/susan-ai.js";

const router = Router();

// All AI routes require auth
router.use(requireAuth);

// Check AI service status
router.get("/status", async (req: Request, res: Response) => {
  try {
    const status = susanAI.getStatus();
    res.json({
      success: true,
      data: status,
    });
  } catch (error) {
    console.error("AI status check error:", error);
    res.status(500).json({ success: false, error: "Failed to check AI status" });
  }
});

// Unified AI endpoint (Susan)
router.post("/chat", async (req: Request, res: Response) => {
  try {
    const { message, context, history, temperature, maxTokens, includeKnowledgeBase } = req.body;

    // Validate required fields
    if (!message || typeof message !== "string") {
      return res.status(400).json({
        success: false,
        error: "Message is required and must be a string",
      });
    }

    // Check if Susan AI is available
    if (!susanAI.isAvailable()) {
      const status = susanAI.getStatus();
      return res.status(503).json({
        success: false,
        error: status.message,
        hint: "Please configure GOOGLE_GENAI_API_KEY in your .env file",
      });
    }

    // Call Susan AI
    const response = await susanAI.chat(message, {
      context: (context as ModuleContext) || "general",
      history: history || [],
      temperature,
      maxTokens,
      includeKnowledgeBase: includeKnowledgeBase ?? true,
    });

    res.json({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error("AI chat error:", error);

    const errorMessage = error instanceof Error ? error.message : "AI processing failed";

    res.status(500).json({
      success: false,
      error: errorMessage,
    });
  }
});

// Streaming chat endpoint
router.post("/chat/stream", async (req: Request, res: Response) => {
  try {
    const { message, context, history, temperature, maxTokens } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({
        success: false,
        error: "Message is required and must be a string",
      });
    }

    if (!susanAI.isAvailable()) {
      const status = susanAI.getStatus();
      return res.status(503).json({
        success: false,
        error: status.message,
      });
    }

    // Set up SSE headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    // Stream the response
    const stream = susanAI.chatStream(message, {
      context: (context as ModuleContext) || "general",
      history: history || [],
      temperature,
      maxTokens,
      includeKnowledgeBase: true,
    });

    for await (const chunk of stream) {
      res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (error) {
    console.error("AI stream error:", error);

    const errorMessage = error instanceof Error ? error.message : "AI streaming failed";

    res.write(`data: ${JSON.stringify({ error: errorMessage })}\n\n`);
    res.end();
  }
});

// Training AI (roleplay scenarios)
router.post("/training/scenario", async (req: Request, res: Response) => {
  try {
    const { scenario, userMessage, history } = req.body;

    if (!scenario || !userMessage) {
      return res.status(400).json({
        success: false,
        error: "Scenario and userMessage are required",
      });
    }

    if (!susanAI.isAvailable()) {
      const status = susanAI.getStatus();
      return res.status(503).json({
        success: false,
        error: status.message,
      });
    }

    const response = await susanAI.generateTrainingResponse(
      scenario,
      userMessage,
      history || []
    );

    res.json({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error("Training AI error:", error);

    const errorMessage = error instanceof Error ? error.message : "Training AI failed";

    res.status(500).json({
      success: false,
      error: errorMessage,
    });
  }
});

// Mentor AI (from RoofTrack)
router.post("/mentor", async (req: Request, res: Response) => {
  try {
    const { question, salesData } = req.body;

    if (!salesData) {
      return res.status(400).json({
        success: false,
        error: "Sales data is required",
      });
    }

    if (!susanAI.isAvailable()) {
      const status = susanAI.getStatus();
      return res.status(503).json({
        success: false,
        error: status.message,
      });
    }

    const response = await susanAI.analyzeSalesData(salesData, question);

    res.json({
      success: true,
      data: {
        advice: response.response,
        context: response.context,
        model: response.model,
        tokensUsed: response.tokensUsed,
      },
    });
  } catch (error) {
    console.error("Mentor AI error:", error);

    const errorMessage = error instanceof Error ? error.message : "Mentor AI failed";

    res.status(500).json({
      success: false,
      error: errorMessage,
    });
  }
});

export default router;
