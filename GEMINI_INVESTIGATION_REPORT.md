# Gemini Investigation Report: Standalone vs. Command Center

**Date:** January 19, 2026
**Investigator:** Gemini CLI
**Subject:** Gap Analysis between Standalone Apps (Susan/Agnes) and Roof-ER Command Center

---

## 1. Executive Summary

The investigation reveals significant feature and content gaps between the standalone applications and the current Roof-ER Command Center integration. 

*   **Susan (Field Assistant)**: The standalone app features a sophisticated **RAG (Retrieval Augmented Generation)** engine with state-specific logic (MD vs VA/PA) and strict citation enforcement that is **missing** from the Command Center.
*   **Agnes-21 (Training)**: The standalone app contains a vast library of **Phone Scripts** (Estimate calls, Pushback) and **Retail Scripts** that are not present in the Command Center. It also employs a Python-based **Voice Cloning** service (`chatterbox`) which is completely absent from the main platform.

---

## 2. Feature Matrix & Gap Analysis

### A. Susan (Gemini Field Assistant)

| Feature | Standalone App | Command Center Integration | Gap Severity |
|---------|----------------|----------------------------|--------------|
| **RAG Engine** | **Advanced**: State-aware (MD/VA/PA), strict `[1]` citations, document retrieval. | **Basic**: Persona-based, lacks deep document context injection. | 🔴 **High** |
| **State Logic** | **Yes**: Injects MD (Matching) vs VA (Repair) rules dynamically. | **No**: Generic roofing advice. | 🔴 **High** |
| **Document Analysis** | **Yes**: Dedicated `knowledgeService` & `ragService`. | **Partial**: `susanAI.analyzeDocument` exists but lacks the RAG retrieval loop. | 🟡 Medium |
| **Chat History** | **Yes**: Persisted in local DB. | **Yes**: Persisted in Command Center DB. | 🟢 None |

**Key Code to Port**:
- `services/ragService.ts`: The logic for `buildEnhancedPrompt` with citation instructions and state guidance.
- `services/knowledgeService.ts`: The document search and scoring logic.

### B. Agnes-21 (AI Trainer)

| Feature | Standalone App | Command Center Integration | Gap Severity |
|---------|----------------|----------------------------|--------------|
| **Scenarios** | **Dynamic**: "Mini Modules" (Opening, Closing, Rapport, Gauntlet). | **Static**: 13 hardcoded "Persona" scenarios. | 🔴 **High** |
| **Script Library** | **Extensive**: Phone scripts (Estimate, Pushback), Retail pitches. | **Limited**: Mostly Door-to-Door. | 🔴 **High** |
| **Voice/TTS** | **Python (Chatterbox)**: Cloned voices (Reeses, Agnes). | **Browser/Cloud**: Standard voices. | 🟡 Medium (Hard to port) |
| **Gamification** | **Advanced**: "Perfect Week", Daily Streaks, XP Bonuses. | **Basic**: Leaderboard & basic XP. | 🟡 Medium |
| **Modes** | **Granular**: Coach, Roleplay, Just Listen, Practice. | **Unified**: Single "Roleplay" mode. | 🟡 Medium |

**Key Content to Port**:
- `utils/phoneScripts.ts`: The complete library of scripts (Insurance Pushback Q1-Q100, Retail Pitches).
- `utils/miniModulePrompts.ts`: The system prompts for "Objection Gauntlet", "Rapport Building", etc.

---

## 3. Detailed Findings

### 3.1 Susan's RAG Architecture
The standalone `ragService.ts` is the "brain" that makes Susan smart. It doesn't just answer questions; it:
1.  **Checks State**: `buildEnhancedPrompt` takes a `selectedState` param.
2.  **Injects Rules**:
    *   *Maryland*: "Matching required (IRC R908.3)."
    *   *Virginia/PA*: "Matching NOT required unless endorsement exists."
3.  **Forces Citations**: The system prompt explicitly demands `[1]`, `[2]` format and fails if missing.

### 3.2 Agnes's Content Library
Agnes-21 is not just a roleplay bot; it's a content repository.
*   **Retail Division**: Full support for retail pitches (Windows, Siding, Solar) with specific "Visual Cue Pivots".
*   **Phone Scripts**: Scripts for "Full Approval", "Partial Denial", "Contingency Authorization".
*   **Mini Modules**: 30-60 second rapid-fire drills that are highly effective for training but missing from Command Center.

### 3.3 The "Voice" Gap
Agnes standalone uses a Python backend (`server/tts_service.py`) running a local TTS model (`chatterbox`). This allows for custom "character" voices. Command Center runs on Node.js and likely cannot support this python-based local inference easily without a dedicated microservice or external API.

---

## 4. Recommendations

### Phase 1: Critical Intelligence Upgrade (Susan)
**Objective**: Make Susan "State-Smart" and Document-Aware.
1.  **Port `ragService.ts`**: Copy the logic into `server/services/susan-rag.ts`.
2.  **Enhance `susan-ai.ts`**: Update the `chat` method to use `ragService.buildRAGContext` before sending the prompt to Gemini.
3.  **Add State Context**: Pass the user's location/market from the User Context (implemented earlier) into the RAG service.

### Phase 2: Content Injection (Agnes)
**Objective**: Expand Training capabilities.
1.  **Import Scripts**: Copy `PHONE_SCRIPTS` and `RETAIL_SCRIPTS` into Command Center's database or a `shared/data/scripts.ts` file.
2.  **Implement Mini-Modules**: Add a new "Quick Drill" mode to the Training module that uses the `miniModulePrompts` logic.
3.  **Retail Support**: Add the "Retail" division toggle to the Command Center training UI.

### Phase 3: Infrastructure (Long Term)
1.  **Voice Service**: Decide whether to deploy the Python `chatterbox` service as a separate container or switch to an external high-quality TTS API (ElevenLabs/OpenAI) to match the quality.

---

## 5. Conclusion

The "Unified User Context" implemented today is a great foundation, but without the **RAG logic** from Susan and the **Script Content** from Agnes, the Command Center remains a "lite" version of the standalone tools. Prioritize **Phase 1 (RAG)** to give immediate value to the Field team.
