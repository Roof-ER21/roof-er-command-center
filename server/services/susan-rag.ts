import { db } from "../db.js";
// In a full implementation, this would query a vector DB or 'documents' table.
// For now, we will use a structured hardcoded knowledge base for critical state rules,
// mirroring the standalone app's capabilities.

interface SearchResult {
  document: {
    name: string;
    category: string;
    path: string;
  };
  content: string;
  score: number;
}

interface RAGContext {
  query: string;
  sources: SearchResult[];
  enhancedPrompt: string;
}

const STATE_RULES = {
  MD: {
    name: "Maryland Roofing Rules",
    category: "Regulations",
    content: `**MARYLAND-SPECIFIC RULES (CRITICAL):**
- Maryland REQUIRES insurance companies to account for matching (IRC R908.3).
- If shingles cannot be reasonably matched (discontinued, faded), the insurer must pay for full replacement of the affected slope/area to ensure a reasonably uniform appearance.
- Use matching arguments AGGRESSIVELY in MD claims.
- This is your strongest argument in Maryland for turning repairs into replacements.`
  },
  VA: {
    name: "Virginia Roofing Rules",
    category: "Regulations",
    content: `**VIRGINIA-SPECIFIC RULES (CRITICAL):**
- Virginia does NOT require matching UNLESS the policy has a specific matching endorsement.
- DO NOT use matching arguments in VA without confirming the endorsement exists.
- Arguments to use instead: Repairability (brittleness test), differing dimensions of new vs old shingles, missed storm damage.
- Focus on: "Repair attempt would damage surrounding shingles."`
  },
  PA: {
    name: "Pennsylvania Roofing Rules",
    category: "Regulations",
    content: `**PENNSYLVANIA-SPECIFIC RULES (CRITICAL):**
- Pennsylvania does NOT require matching UNLESS the policy has a matching endorsement.
- DO NOT use matching arguments in PA without confirming the endorsement exists.
- Arguments to use instead: Permit denials (very effective in PA townships), repairability, manufacturer specs.
- Focus on building code compliance and township requirements.`
  }
};

const GENERAL_KNOWLEDGE = [
  {
    name: "GAF Storm Damage Guide",
    category: "Technical",
    content: "Hail damage causes granule loss, mat fractures, and compromised sealant bonds. It is NOT just cosmetic. Latent damage may not be visible immediately but voids manufacturer warranties. Wind damage includes creased shingles and lifted tabs (sealant failure)."
  },
  {
    name: "IRC R908.3 (Roof Recover)",
    category: "Code",
    content: "IRC R908.3 states that new roof coverings shall not be installed without first removing all existing layers where the existing roof has two or more applications of any type of roof covering."
  }
];

export const susanRagService = {
  /**
   * Search for documents relevant to the query and state
   */
  async searchDocuments(query: string, state?: string): Promise<SearchResult[]> {
    const results: SearchResult[] = [];
    const queryLower = query.toLowerCase();

    // 1. Add State-Specific Rules if applicable
    if (state && (state === 'MD' || state === 'VA' || state === 'PA')) {
      results.push({
        document: {
          name: STATE_RULES[state as keyof typeof STATE_RULES].name,
          category: STATE_RULES[state as keyof typeof STATE_RULES].category,
          path: "regulations/state_rules.md"
        },
        content: STATE_RULES[state as keyof typeof STATE_RULES].content,
        score: 1.0 // High priority
      });
    }

    // 2. Simple keyword search on General Knowledge (Basic RAG)
    // In a real system, this would be a vector search
    for (const doc of GENERAL_KNOWLEDGE) {
      if (
        queryLower.includes("hail") || 
        queryLower.includes("wind") || 
        queryLower.includes("damage") ||
        queryLower.includes("code") ||
        queryLower.includes("match")
      ) {
        results.push({
          document: { name: doc.name, category: doc.category, path: "general/knowledge.md" },
          content: doc.content,
          score: 0.8
        });
      }
    }

    return results;
  },

  /**
   * Build the Enhanced Prompt with Citations and State Rules
   */
  async buildRAGContext(query: string, state?: string): Promise<RAGContext> {
    const sources = await this.searchDocuments(query, state);

    // If no specific documents found, return simple context
    if (sources.length === 0) {
      return {
        query,
        sources: [],
        enhancedPrompt: ""
      };
    }

    // Citation Instructions (Ported from Standalone)
    const citationInstructions = `🔴 CRITICAL INSTRUCTION - READ THIS FIRST 🔴

MANDATORY CITATION FORMAT:
You MUST cite sources using [1], [2] for EVERY fact from the documents below.

Examples:
✅ "IRC R908.3 requires matching [1]"
✅ "Maryland mandates full replacement [2]"

RULES:
- [1] refers to Document 1, [2] refers to Document 2
- Place citation IMMEDIATELY after each fact
`;

    // Build Document Section
    let contextSection = 'RELEVANT KNOWLEDGE BASE DOCUMENTS:\n\n';
    sources.forEach((source, index) => {
      contextSection += `[Document ${index + 1}]: ${source.document.name}\n`;
      contextSection += `Content:\n${source.content}\n`;
      contextSection += `${'='.repeat(40)}\n\n`;
    });

    // State Guidance
    let stateGuidance = '';
    if (state) {
        stateGuidance = `\nCURRENT STATE: ${state}. Apply the state-specific rules found in the documents above.`;
    } else {
        stateGuidance = `\nNO STATE SELECTED. Do NOT assume Maryland rules (matching) apply unless explicitly asked. Provide generic advice valid for VA/PA/MD.`;
    }

    const enhancedPrompt = `${citationInstructions}\n${contextSection}\n${stateGuidance}\n`;

    return {
      query,
      sources,
      enhancedPrompt
    };
  }
};
