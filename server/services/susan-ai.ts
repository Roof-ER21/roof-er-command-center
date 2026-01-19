/**
 * Susan AI Service - Unified AI assistant for Roof ER Command Center
 *
 * Uses Google GenAI (Gemini) with module-specific personas and roofing industry expertise.
 * Supports chat completion, context awareness, and streaming responses.
 */

import { GoogleGenAI } from "@google/genai";

// Module-specific personas and system prompts
const MODULE_PERSONAS = {
  hr: {
    name: "Susan - HR Expert",
    systemPrompt: `You are Susan, an AI assistant specialized in HR management for roofing companies.
You have deep knowledge of:
- Employee onboarding and offboarding processes
- Time off management and scheduling
- Performance reviews and feedback
- Team management and organizational structure
- HR compliance and best practices in the roofing industry

Be professional, empathetic, and provide actionable advice. Always prioritize employee well-being and company compliance.`,
  },

  sales: {
    name: "Susan - Sales Mentor",
    systemPrompt: `You are Susan, an AI sales mentor for roofing sales representatives.
You have expertise in:
- Roofing sales techniques and objection handling
- Customer relationship management
- Sales performance analysis and improvement strategies
- Goal setting and achievement tracking
- Competitive analysis in the roofing industry

Be motivating, data-driven, and provide specific, actionable sales strategies. Focus on helping reps close more deals and build lasting customer relationships.`,
  },

  training: {
    name: "Susan - Training Coach",
    systemPrompt: `You are Susan, an AI training coach for roofing sales professionals.
You specialize in:
- Roofing industry knowledge and product expertise
- Sales roleplay scenarios and practice
- Customer objection handling
- Presentation skills and communication
- Technical roofing specifications and installation processes

Be encouraging, patient, and provide constructive feedback. Create realistic scenarios and help trainees build confidence and competence.`,
  },

  field: {
    name: "Susan - Field Assistant",
    systemPrompt: `You are Susan, an AI field assistant for roofing professionals in the field.
You provide support for:
- On-site customer questions and technical issues
- Quick roofing calculations and measurements
- Material recommendations and specifications
- Safety protocols and best practices
- Real-time problem solving for field situations

Be concise, practical, and solution-oriented. Provide quick, actionable answers that can be used immediately in the field.`,
  },

  general: {
    name: "Susan - General Assistant",
    systemPrompt: `You are Susan, an AI assistant for the Roof ER Command Center.
You help with:
- General roofing business operations
- Navigation and feature explanations
- Data analysis and reporting
- Cross-module insights and recommendations
- Administrative tasks and workflow optimization

Be helpful, professional, and adaptable to various needs across the entire platform.`,
  },
} as const;

// Roofing industry knowledge base (injected into context when relevant)
const ROOFING_KNOWLEDGE_BASE = `
**Roofing Industry Context:**
- Common roofing materials: asphalt shingles, metal roofing, tile, slate, flat/TPO roofing
- Key sales objections: price concerns, timing, multiple quotes, insurance claims
- Average project timeline: 1-3 days for residential, 1-2 weeks for commercial
- Common customer concerns: warranty, durability, energy efficiency, storm damage
- Industry certifications: GAF Master Elite, CertainTeed SELECT ShingleMaster, NRCA
- Seasonal factors: Spring and fall are peak seasons; winter and summer have different challenges
`;

export type ModuleContext = keyof typeof MODULE_PERSONAS;

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface ChatOptions {
  context?: ModuleContext;
  history?: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
  includeKnowledgeBase?: boolean;
  userContext?: string;
}

export interface ChatResponse {
  response: string;
  context: ModuleContext;
  model: string;
  tokensUsed?: number;
}

/**
 * Susan AI Service Class
 */
export class SusanAI {
  private genAI: GoogleGenAI | null = null;
  private apiKey: string | undefined;

  constructor() {
    this.apiKey = process.env.GOOGLE_GENAI_API_KEY;

    if (this.apiKey) {
      try {
        this.genAI = new GoogleGenAI({ apiKey: this.apiKey });
      } catch (error) {
        console.error("Failed to initialize Google GenAI:", error);
        this.genAI = null;
      }
    }
  }

  /**
   * Check if the AI service is available
   */
  isAvailable(): boolean {
    return this.genAI !== null;
  }

  /**
   * Get the current API key status
   */
  getStatus(): { available: boolean; message: string } {
    if (!this.apiKey) {
      return {
        available: false,
        message: "GOOGLE_GENAI_API_KEY not configured. Please add your API key to the .env file.",
      };
    }

    if (!this.genAI) {
      return {
        available: false,
        message: "Failed to initialize Google GenAI. Check your API key.",
      };
    }

    return {
      available: true,
      message: "Susan AI is ready and available.",
    };
  }

  /**
   * Build the full prompt with system context and conversation history
   */
  private buildPrompt(
    userMessage: string,
    options: ChatOptions
  ): string {
    const context = options.context || "general";
    const persona = MODULE_PERSONAS[context];

    let prompt = `${persona.systemPrompt}\n\n`;

    // Add user-specific context if provided
    if (options.userContext) {
      prompt += `${options.userContext}\n\n`;
    }

    // Add roofing knowledge base if requested
    if (options.includeKnowledgeBase) {
      prompt += `${ROOFING_KNOWLEDGE_BASE}\n\n`;
    }

    // Add conversation history
    if (options.history && options.history.length > 0) {
      prompt += "**Conversation History:**\n";
      options.history.forEach((msg) => {
        const role = msg.role === "user" ? "User" : "Susan";
        prompt += `${role}: ${msg.content}\n`;
      });
      prompt += "\n";
    }

    // Add current user message
    prompt += `**Current Message:**\nUser: ${userMessage}\n\nSusan:`;

    return prompt;
  }

  /**
   * Send a chat message and get a response
   */
  async chat(
    message: string,
    options: ChatOptions = {}
  ): Promise<ChatResponse> {
    // Check if service is available
    if (!this.isAvailable()) {
      const status = this.getStatus();
      throw new Error(status.message);
    }

    const context = options.context || "general";
    const temperature = options.temperature ?? 0.7;
    const maxTokens = options.maxTokens ?? 2048;

    try {
      const prompt = this.buildPrompt(message, options);

      const result = await this.genAI!.models.generateContent({
        model: "gemini-2.0-flash-exp",
        contents: prompt,
        config: {
          temperature,
          maxOutputTokens: maxTokens,
          topP: 0.95,
          topK: 40,
        },
      });

      const text = result.text || "";

      return {
        response: text.trim(),
        context,
        model: "gemini-2.0-flash-exp",
        tokensUsed: result.usageMetadata?.totalTokenCount,
      };
    } catch (error) {
      console.error("Susan AI chat error:", error);

      // Handle specific API errors
      if (error instanceof Error) {
        if (error.message.includes("API_KEY") || error.message.includes("API key")) {
          throw new Error("Invalid Google GenAI API key. Please check your configuration.");
        }
        if (error.message.includes("quota") || error.message.includes("QUOTA")) {
          throw new Error("API quota exceeded. Please try again later.");
        }
        if (error.message.includes("safety") || error.message.includes("SAFETY")) {
          throw new Error("Content blocked by safety filters. Please rephrase your message.");
        }
      }

      throw new Error("Failed to generate AI response. Please try again.");
    }
  }

  /**
   * Generate a streaming response (for real-time chat UX)
   */
  async *chatStream(
    message: string,
    options: ChatOptions = {}
  ): AsyncGenerator<string, void, unknown> {
    if (!this.isAvailable()) {
      throw new Error(this.getStatus().message);
    }

    const prompt = this.buildPrompt(message, options);
    const temperature = options.temperature ?? 0.7;
    const maxTokens = options.maxTokens ?? 2048;

    try {
      const result = await this.genAI!.models.generateContentStream({
        model: "gemini-2.0-flash-exp",
        contents: prompt,
        config: {
          temperature,
          maxOutputTokens: maxTokens,
          topP: 0.95,
          topK: 40,
        },
      });

      for await (const chunk of result) {
        const text = chunk.text;
        if (text) {
          yield text;
        }
      }
    } catch (error) {
      console.error("Susan AI stream error:", error);
      throw new Error("Failed to generate streaming response.");
    }
  }

  /**
   * Analyze sales data and provide insights (for mentor AI)
   */
  async analyzeSalesData(
    salesData: any,
    question?: string
  ): Promise<ChatResponse> {
    const dataContext = `
**Sales Performance Data:**
${JSON.stringify(salesData, null, 2)}
`;

    const userMessage = question || "Analyze this sales data and provide actionable insights.";

    return this.chat(userMessage, {
      context: "sales",
      history: [
        {
          role: "system",
          content: dataContext,
        },
      ],
      includeKnowledgeBase: true,
    });
  }

  /**
   * Generate training scenario response with feedback
   */
  async generateTrainingResponse(
    scenario: string,
    userMessage: string,
    history: ChatMessage[] = []
  ): Promise<{
    response: string;
    feedback: string | null;
    score: number | null;
  }> {
    const scenarioContext = `
**Training Scenario:**
${scenario}

Evaluate the trainee's response and provide constructive feedback on their approach, tone, and effectiveness.
`;

    const chatResponse = await this.chat(userMessage, {
      context: "training",
      history: [
        {
          role: "system",
          content: scenarioContext,
        },
        ...history,
      ],
      includeKnowledgeBase: true,
      temperature: 0.8, // More creative for roleplay
    });

    // Parse response to extract feedback and scoring
    // For now, return the full response (can be enhanced with structured output)
    return {
      response: chatResponse.response,
      feedback: "Feedback will be provided in a future update.",
      score: null,
    };
  }

  /**
   * Analyze a document and extract key information
   */
  async analyzeDocument(
    documentText: string,
    documentType: string,
    fileName: string
  ): Promise<{
    documentType: string;
    summary: string;
    extractedData: Record<string, string>;
    keyFindings: string[];
    confidence: number;
  }> {
    if (!this.isAvailable()) {
      throw new Error(this.getStatus().message);
    }

    const prompt = `You are an expert document analyst specializing in roofing insurance claims and contracts.

Analyze this ${documentType} document named "${fileName}" and extract key information.

**Document Content:**
${documentText.substring(0, 15000)} ${documentText.length > 15000 ? '... [truncated]' : ''}

Provide a structured analysis in JSON format with these fields:
- documentType: A descriptive type (e.g., "Insurance Policy Declaration", "Claim Document", "Repair Estimate")
- summary: A 2-3 sentence summary of the document
- extractedData: Key-value pairs of important data found (e.g., policyNumber, coverage, deductible, claimNumber, dates, amounts)
- keyFindings: Array of 3-5 important observations or concerns relevant for roofing insurance claims
- confidence: Your confidence score from 0.0 to 1.0

Return ONLY valid JSON, no markdown formatting.`;

    try {
      const result = await this.genAI!.models.generateContent({
        model: "gemini-2.0-flash-exp",
        contents: prompt,
        config: {
          temperature: 0.3,
          maxOutputTokens: 2048,
          topP: 0.95,
          topK: 40,
        },
      });

      const text = result.text || "";
      const cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(cleaned);

      return {
        documentType: parsed.documentType || "Unknown Document",
        summary: parsed.summary || "Unable to summarize document.",
        extractedData: parsed.extractedData || {},
        keyFindings: parsed.keyFindings || [],
        confidence: parsed.confidence || 0.5,
      };
    } catch (error) {
      console.error("Document analysis error:", error);
      throw new Error("Failed to analyze document content.");
    }
  }

  /**
   * Analyze an image for roof damage using Gemini Vision
   */
  async analyzeRoofImage(
    imageBase64: string,
    mimeType: string
  ): Promise<{
    damageType: string;
    severity: 'minor' | 'moderate' | 'severe' | 'critical';
    confidence: number;
    affectedArea: string;
    description: string;
    recommendations: string[];
    estimatedRepairCost?: { min: number; max: number };
    urgency: 'low' | 'medium' | 'high' | 'critical';
    insuranceArguments: string[];
  }> {
    if (!this.isAvailable()) {
      throw new Error(this.getStatus().message);
    }

    const prompt = `You are an expert roofing inspector and insurance claims specialist with 20+ years of experience.

Analyze this roof image for damage assessment and insurance claim purposes.

Provide a detailed analysis in JSON format with these exact fields:
- damageType: Specific type of damage (e.g., "Hail Damage - Impact Damage to Shingles", "Wind Damage - Lifted Shingles", "Storm Debris Impact")
- severity: One of "minor", "moderate", "severe", or "critical"
- confidence: Your confidence score from 0.0 to 1.0
- affectedArea: Estimated affected area description (e.g., "North-facing slope, approximately 500 sq ft affected")
- description: Detailed description of visible damage (100-150 words)
- recommendations: Array of 5-6 specific action items for the homeowner
- estimatedRepairCost: Object with "min" and "max" values in USD (estimate based on visible damage)
- urgency: One of "low", "medium", "high", or "critical"
- insuranceArguments: Array of 3-4 strong arguments to present to the insurance adjuster

Important: Be thorough and professional. This analysis will be used for insurance claim documentation.

Return ONLY valid JSON, no markdown formatting.`;

    try {
      const result = await this.genAI!.models.generateContent({
        model: "gemini-2.0-flash-exp",
        contents: [
          {
            role: "user",
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType: mimeType,
                  data: imageBase64,
                },
              },
            ],
          },
        ],
        config: {
          temperature: 0.3,
          maxOutputTokens: 2048,
          topP: 0.95,
          topK: 40,
        },
      });

      const text = result.text || "";
      const cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(cleaned);

      return {
        damageType: parsed.damageType || "Unable to determine damage type",
        severity: parsed.severity || "moderate",
        confidence: parsed.confidence || 0.5,
        affectedArea: parsed.affectedArea || "Unable to estimate affected area",
        description: parsed.description || "Unable to generate description.",
        recommendations: parsed.recommendations || [],
        estimatedRepairCost: parsed.estimatedRepairCost,
        urgency: parsed.urgency || "medium",
        insuranceArguments: parsed.insuranceArguments || [],
      };
    } catch (error) {
      console.error("Image analysis error:", error);
      throw new Error("Failed to analyze roof image. Please ensure the image is clear and try again.");
    }
  }
}

// Singleton instance
export const susanAI = new SusanAI();

// Note: Interfaces are already exported at definition
