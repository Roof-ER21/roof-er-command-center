import Anthropic from '@anthropic-ai/sdk';

export interface ScoringCriteria {
  id: number;
  name: string;
  description: string;
  criteria: string[];
  weight: number;
}

export interface CandidateScoreResult {
  overallScore: number;
  breakdown: {
    criteriaId: number;
    score: number;
    reasoning: string;
  }[];
  summary: string;
}

export class AIScoringService {
  private client: Anthropic;

  constructor() {
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY environment variable is not set');
    }

    this.client = new Anthropic({
      apiKey,
    });
  }

  /**
   * Score a candidate against criteria using AI
   */
  async scoreCandidate(
    candidate: any,
    criteria: ScoringCriteria[]
  ): Promise<CandidateScoreResult> {
    if (criteria.length === 0) {
      throw new Error('No active criteria found for scoring');
    }

    const prompt = this.buildScoringPrompt(candidate, criteria);

    try {
      const response = await this.client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2048,
        temperature: 0.3, // Lower temperature for more consistent scoring
        messages: [{ role: 'user', content: prompt }],
      });

      // Extract text from response
      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response format from AI');
      }

      // Parse JSON from response
      const result = this.parseAIResponse(content.text);

      // Validate result
      this.validateScoringResult(result, criteria);

      return result;
    } catch (error) {
      console.error('❌ Error scoring candidate with AI:', error);
      throw new Error(`AI scoring failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Build the scoring prompt for the AI
   */
  private buildScoringPrompt(candidate: any, criteria: ScoringCriteria[]): string {
    const criteriaText = criteria
      .map(
        c => `
### Criterion ${c.id}: ${c.name} (Weight: ${c.weight}/10)
**Description:** ${c.description}
**Evaluation Points:**
${c.criteria.map(item => `  - ${item}`).join('\n')}
`
      )
      .join('\n');

    return `You are an expert HR assistant tasked with scoring a candidate against specific criteria.

## CANDIDATE INFORMATION

**Name:** ${candidate.firstName} ${candidate.lastName}
**Position Applied:** ${candidate.position}
**Email:** ${candidate.email}
**Phone:** ${candidate.phone || 'N/A'}
**Source:** ${candidate.source || 'N/A'}
**Referral:** ${candidate.referralName || 'N/A'}
**Resume/Notes:** ${candidate.notes || 'No additional information provided'}

## SCORING CRITERIA

${criteriaText}

## INSTRUCTIONS

1. Score each criterion from 0-100:
   - 0-20: Poor fit, major concerns
   - 21-40: Below average, significant gaps
   - 41-60: Average, meets some requirements
   - 61-80: Good fit, meets most requirements
   - 81-100: Excellent fit, exceeds expectations

2. For each criterion, provide:
   - A score (0-100)
   - Brief reasoning (1-2 sentences) explaining the score

3. Calculate the overall weighted average score

4. Provide a 2-3 sentence summary of the candidate's overall fit

## OUTPUT FORMAT

Return ONLY valid JSON in this exact format (no markdown, no code blocks):

{
  "overallScore": <weighted average score 0-100>,
  "breakdown": [
    {
      "criteriaId": <criterion id>,
      "score": <0-100>,
      "reasoning": "<brief explanation>"
    }
  ],
  "summary": "<2-3 sentence overall assessment>"
}

IMPORTANT: Return ONLY the JSON object, nothing else.`;
  }

  /**
   * Parse AI response and extract JSON
   */
  private parseAIResponse(text: string): CandidateScoreResult {
    // Try to extract JSON from response
    let jsonText = text.trim();

    // Remove markdown code blocks if present
    if (jsonText.startsWith('```')) {
      const lines = jsonText.split('\n');
      jsonText = lines.slice(1, -1).join('\n');
      if (jsonText.startsWith('json')) {
        jsonText = jsonText.slice(4);
      }
    }

    try {
      const parsed = JSON.parse(jsonText);
      return parsed as CandidateScoreResult;
    } catch (error) {
      console.error('Failed to parse AI response:', text);
      throw new Error('Failed to parse AI scoring response. Invalid JSON format.');
    }
  }

  /**
   * Validate the scoring result
   */
  private validateScoringResult(result: CandidateScoreResult, criteria: ScoringCriteria[]): void {
    // Check overall score
    if (typeof result.overallScore !== 'number' || result.overallScore < 0 || result.overallScore > 100) {
      throw new Error('Invalid overall score. Must be between 0 and 100.');
    }

    // Check breakdown
    if (!Array.isArray(result.breakdown)) {
      throw new Error('Invalid breakdown. Must be an array.');
    }

    if (result.breakdown.length !== criteria.length) {
      throw new Error(`Invalid breakdown length. Expected ${criteria.length}, got ${result.breakdown.length}.`);
    }

    // Check each breakdown item
    result.breakdown.forEach((item, index) => {
      if (typeof item.criteriaId !== 'number') {
        throw new Error(`Invalid criteriaId at index ${index}`);
      }
      if (typeof item.score !== 'number' || item.score < 0 || item.score > 100) {
        throw new Error(`Invalid score at index ${index}. Must be between 0 and 100.`);
      }
      if (typeof item.reasoning !== 'string' || item.reasoning.length === 0) {
        throw new Error(`Invalid reasoning at index ${index}`);
      }
    });

    // Check summary
    if (typeof result.summary !== 'string' || result.summary.length === 0) {
      throw new Error('Invalid summary. Must be a non-empty string.');
    }

    // Verify weighted average matches
    const calculatedScore = this.calculateWeightedAverage(result.breakdown, criteria);
    const scoreDiff = Math.abs(calculatedScore - result.overallScore);

    // Allow small rounding differences
    if (scoreDiff > 2) {
      console.warn(
        `⚠️ Score mismatch: AI reported ${result.overallScore}, calculated ${calculatedScore.toFixed(2)}`
      );
      // Use calculated score for accuracy
      result.overallScore = Math.round(calculatedScore);
    }
  }

  /**
   * Calculate weighted average score
   */
  private calculateWeightedAverage(
    breakdown: { criteriaId: number; score: number }[],
    criteria: ScoringCriteria[]
  ): number {
    let totalWeightedScore = 0;
    let totalWeight = 0;

    breakdown.forEach(item => {
      const criterion = criteria.find(c => c.id === item.criteriaId);
      if (criterion) {
        totalWeightedScore += item.score * criterion.weight;
        totalWeight += criterion.weight;
      }
    });

    return totalWeight > 0 ? totalWeightedScore / totalWeight : 0;
  }

  /**
   * Batch score multiple candidates
   */
  async scoreCandidates(
    candidates: any[],
    criteria: ScoringCriteria[]
  ): Promise<Map<number, CandidateScoreResult>> {
    const results = new Map<number, CandidateScoreResult>();

    // Score candidates sequentially to avoid rate limits
    for (const candidate of candidates) {
      try {
        const result = await this.scoreCandidate(candidate, criteria);
        results.set(candidate.id, result);

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`Failed to score candidate ${candidate.id}:`, error);
        // Continue with other candidates
      }
    }

    return results;
  }
}
