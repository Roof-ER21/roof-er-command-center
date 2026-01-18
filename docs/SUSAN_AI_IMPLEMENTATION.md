# Susan AI Implementation Guide

## Overview

Susan AI is the unified AI assistant for the Roof ER Command Center, powered by Google's Gemini 2.0 Flash model. It provides context-aware assistance across all platform modules with specialized personas and roofing industry expertise.

## Architecture

### Components

1. **Service Layer**: `/server/services/susan-ai.ts`
   - Core AI service implementation
   - Module-specific personas
   - Roofing industry knowledge base
   - Streaming support

2. **API Routes**: `/server/routes/ai/index.ts`
   - REST endpoints for AI interactions
   - Authentication middleware
   - Error handling and validation

### Module Personas

Susan adapts her expertise based on the context:

| Context | Persona | Specialization |
|---------|---------|----------------|
| `hr` | HR Expert | Employee management, compliance, performance reviews |
| `sales` | Sales Mentor | Sales strategies, performance analysis, CRM |
| `training` | Training Coach | Roleplay scenarios, skill development, feedback |
| `field` | Field Assistant | On-site support, technical specs, quick solutions |
| `general` | General Assistant | Platform navigation, reporting, cross-module insights |

## Configuration

### Environment Variables

Add your Google GenAI API key to `.env`:

```bash
# REQUIRED FOR SUSAN AI
# Get your API key from https://aistudio.google.com/app/apikey
GOOGLE_GENAI_API_KEY=your_api_key_here
```

### Getting an API Key

1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Create a new API key
4. Copy the key to your `.env` file

## API Endpoints

### 1. Check AI Status

```
GET /api/ai/status
```

**Response:**
```json
{
  "success": true,
  "data": {
    "available": true,
    "message": "Susan AI is ready and available."
  }
}
```

### 2. Chat Completion

```
POST /api/ai/chat
```

**Request Body:**
```json
{
  "message": "How do I handle a customer objection about price?",
  "context": "sales",
  "history": [
    {
      "role": "user",
      "content": "Previous message"
    },
    {
      "role": "assistant",
      "content": "Previous response"
    }
  ],
  "temperature": 0.7,
  "maxTokens": 2048,
  "includeKnowledgeBase": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "response": "When handling price objections...",
    "context": "sales",
    "model": "gemini-2.0-flash-exp",
    "tokensUsed": 245
  }
}
```

### 3. Streaming Chat

```
POST /api/ai/chat/stream
```

**Request Body:** Same as `/api/ai/chat`

**Response:** Server-Sent Events (SSE)
```
data: {"chunk": "When"}
data: {"chunk": " handling"}
data: {"chunk": " price"}
...
data: {"done": true}
```

### 4. Training Scenarios

```
POST /api/ai/training/scenario
```

**Request Body:**
```json
{
  "scenario": "Customer concerned about roof warranty",
  "userMessage": "Our warranty covers your roof for 25 years...",
  "history": []
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "response": "Good approach! Here's feedback...",
    "feedback": "Feedback will be provided in a future update.",
    "score": null
  }
}
```

### 5. Sales Mentor

```
POST /api/ai/mentor
```

**Request Body:**
```json
{
  "question": "How can I improve my conversion rate?",
  "salesData": {
    "monthlyRevenue": 45000,
    "conversionRate": 0.23,
    "avgDealSize": 8500
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "advice": "Based on your data, here are three strategies...",
    "context": "sales",
    "model": "gemini-2.0-flash-exp",
    "tokensUsed": 312
  }
}
```

## Error Handling

### Common Errors

| Error | Status Code | Cause | Solution |
|-------|-------------|-------|----------|
| Missing API Key | 503 | `GOOGLE_GENAI_API_KEY` not configured | Add API key to `.env` |
| Invalid API Key | 500 | API key is incorrect | Verify key in Google AI Studio |
| Quota Exceeded | 500 | API quota limit reached | Wait or upgrade quota |
| Safety Filter | 500 | Content blocked by filters | Rephrase the message |
| Missing Message | 400 | Request missing required fields | Include `message` in request body |
| Missing Sales Data | 400 | Mentor endpoint requires data | Include `salesData` in request body |

### Example Error Response

```json
{
  "success": false,
  "error": "GOOGLE_GENAI_API_KEY not configured. Please add your API key to the .env file.",
  "hint": "Please configure GOOGLE_GENAI_API_KEY in your .env file"
}
```

## Usage Examples

### Frontend Integration

```typescript
// Status check
const checkStatus = async () => {
  const response = await fetch('/api/ai/status');
  const data = await response.json();
  return data.data.available;
};

// Simple chat
const chatWithSusan = async (message: string, context: string) => {
  const response = await fetch('/api/ai/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, context }),
  });
  return response.json();
};

// Streaming chat
const streamChat = async (message: string, context: string) => {
  const response = await fetch('/api/ai/chat/stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, context }),
  });

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader!.read();
    if (done) break;

    const chunk = decoder.decode(value);
    const lines = chunk.split('\n');

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = JSON.parse(line.slice(6));
        if (data.chunk) {
          console.log(data.chunk); // Handle chunk
        }
        if (data.done) {
          return; // Stream complete
        }
      }
    }
  }
};
```

### Service Layer Usage

```typescript
import { susanAI } from './server/services/susan-ai';

// Check availability
if (!susanAI.isAvailable()) {
  console.error('Susan AI not available');
  return;
}

// Simple chat
const response = await susanAI.chat("Hello Susan!", {
  context: "general",
});

// Chat with history
const response = await susanAI.chat("What about metal roofing?", {
  context: "sales",
  history: [
    { role: "user", content: "Tell me about roofing materials" },
    { role: "assistant", content: "There are several types..." },
  ],
  includeKnowledgeBase: true,
});

// Streaming
for await (const chunk of susanAI.chatStream("Explain warranties", {
  context: "training",
})) {
  process.stdout.write(chunk);
}

// Sales analysis
const insights = await susanAI.analyzeSalesData({
  monthlyRevenue: 50000,
  deals: 12,
  conversionRate: 0.25,
}, "How can I improve?");
```

## Roofing Industry Knowledge Base

Susan has built-in knowledge about:

- **Materials**: Asphalt shingles, metal, tile, slate, TPO
- **Common Objections**: Price, timing, multiple quotes, insurance claims
- **Project Timelines**: 1-3 days residential, 1-2 weeks commercial
- **Customer Concerns**: Warranty, durability, energy efficiency, storm damage
- **Certifications**: GAF Master Elite, CertainTeed SELECT, NRCA
- **Seasonal Factors**: Peak seasons, weather challenges

This knowledge is automatically included when `includeKnowledgeBase: true`.

## Performance Considerations

### Token Management

- **Default Max Tokens**: 2048
- **Recommended for Quick Answers**: 512-1024
- **Recommended for Detailed Analysis**: 2048-4096

### Temperature Settings

- **Factual Responses** (HR, Field): 0.5-0.7
- **Creative Scenarios** (Training): 0.7-0.9
- **Balanced** (Sales, General): 0.7

### Conversation History

- Keep history to last 5-10 messages for optimal performance
- Each message in history consumes tokens
- Clear history for new topics/contexts

## Security

### Best Practices

1. **Never expose API key in client-side code**
2. **Always use server-side endpoints**
3. **Implement rate limiting** (already configured at 100 req/15min)
4. **Require authentication** (already enforced via `requireAuth`)
5. **Validate all input** (message, context, data)
6. **Sanitize user messages** before sending to AI

### Authentication

All AI endpoints require authentication. Requests must include valid session credentials.

## Testing

### Unit Tests

```bash
# Test service structure
npx tsx test-susan-ai.ts
```

### Manual Testing

```bash
# 1. Check status
curl -X GET http://localhost:3001/api/ai/status

# 2. Test chat (requires auth)
curl -X POST http://localhost:3001/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello Susan", "context": "general"}'
```

## Troubleshooting

### Issue: "GOOGLE_GENAI_API_KEY not configured"

**Solution**: Add API key to `.env` file and restart server.

### Issue: "Invalid Google GenAI API key"

**Solution**: Verify API key is correct and active in Google AI Studio.

### Issue: "API quota exceeded"

**Solution**:
- Wait for quota reset (usually next day)
- Upgrade quota in Google Cloud Console
- Implement caching for repeated queries

### Issue: "Content blocked by safety filters"

**Solution**:
- Review message content for policy violations
- Rephrase the message
- Adjust safety settings in Google AI Studio (if needed)

## Future Enhancements

- [ ] Structured feedback and scoring for training scenarios
- [ ] Multi-turn conversation memory
- [ ] Integration with document search (RAG)
- [ ] Custom fine-tuned models for roofing industry
- [ ] Voice input/output support
- [ ] Proactive insights and recommendations
- [ ] A/B testing for different prompts
- [ ] Analytics and usage tracking

## Related Files

- Service: `/server/services/susan-ai.ts`
- Routes: `/server/routes/ai/index.ts`
- Environment: `/.env`
- Test: `/test-susan-ai.ts`
- Documentation: `/docs/SUSAN_AI_IMPLEMENTATION.md`

## Support

For issues or questions:
1. Check error messages in server logs
2. Verify API key configuration
3. Review this documentation
4. Check Google AI Studio status page
5. Consult Google GenAI SDK documentation: https://googleapis.github.io/js-genai/

---

**Last Updated**: January 17, 2026
**Version**: 1.0.0
**Model**: Gemini 2.0 Flash Experimental
