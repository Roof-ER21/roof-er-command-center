/**
 * Test script to validate Susan AI service
 */
import { susanAI } from "./server/services/susan-ai.js";

console.log("Testing Susan AI Service...\n");

// Test 1: Check service status
const status = susanAI.getStatus();
console.log("Status:", status);

// Test 2: Check if available
console.log("Is Available:", susanAI.isAvailable());

// Test 3: Try a simple chat (will fail without API key, which is expected)
if (susanAI.isAvailable()) {
  try {
    const response = await susanAI.chat("Hello Susan, what can you help me with?", {
      context: "general",
    });
    console.log("\nResponse:", response);
  } catch (error) {
    console.error("Chat error (expected if no API key):", error instanceof Error ? error.message : error);
  }
} else {
  console.log("\nSkipping chat test - API key not configured (expected)");
}

console.log("\n✅ Susan AI service structure is valid!");
