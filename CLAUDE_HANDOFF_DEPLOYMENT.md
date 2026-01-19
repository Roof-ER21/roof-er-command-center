# Claude Handoff & Deployment Guide

**Date:** January 19, 2026
**Project:** Roof-ER Command Center
**Status:** 🟢 Ready for Deployment

---

## 1. Project Overview & Recent Changes

We have successfully merged the capabilities of the standalone **Agnes-21** (Training) and **Gemini Field Assistant** (Susan) into the unified **Roof-ER Command Center**.

### Key Features Implemented:
1.  **State-Smart Susan (Field AI)**
    *   **Logic**: `server/services/susan-rag.ts`
    *   **Function**: Context-aware roofing advice. It detects if a user is in **MD** (Matching Laws apply) vs. **VA/PA** (Repairability focus) and enforces citation rules `[1]`.
2.  **Field Translator (The "Orb")**
    *   **Logic**: `client/src/modules/field/components/FieldTranslator.tsx`
    *   **Function**: Voice-first translation interface. Greetings in 5 random languages, voice commands ("Switch to Spanish"), and browser-based speech synthesis/recognition.
3.  **Agnes Training Content**
    *   **Logic**: `shared/training-content.ts`
    *   **Function**: Ported the massive script library (Insurance Pushback, Retail Pitches) and "Mini-Module" drills.
4.  **Unified User Context**
    *   **Logic**: `server/services/ai-context.ts`
    *   **Function**: Feeds Susan real-time HR, Sales, and Training stats for every query.

---

## 2. ⚠️ Critical: Environment Variables

For the application to work on **Railway**, you **MUST** configure these environment variables.

### A. The "Vite Key" (Frontend)
The Field Translator runs entirely in the browser (client-side). It needs direct access to the Gemini API to perform translations without round-tripping to your backend for every word.

*   **Variable Name**: `VITE_GOOGLE_GENAI_API_KEY`
*   **Value**: Your Google Gemini API Key (starts with `AIza...`)
*   **Why it's needed**: The file `client/src/modules/field/utils/translationUtils.ts` uses `import.meta.env.VITE_GOOGLE_GENAI_API_KEY`.
*   **Deployment Note**: Since this is a `VITE_` variable, it is **embedded into the code at build time**. You must ensure this variable is present in Railway **BEFORE** the build step runs.

### B. The Backend Key (Server)
Susan AI (Chat, RAG, Image Analysis) runs on the server.

*   **Variable Name**: `GOOGLE_GENAI_API_KEY`
*   **Value**: Same as above (or a different key if you want to separate quotas).
*   **Why it's needed**: `server/services/susan-ai.ts` uses `process.env.GOOGLE_GENAI_API_KEY`.

### C. Standard Variables
Ensure these are also set in Railway:
*   `DATABASE_URL`: Connection string for your PostgreSQL (Neon/Railway) database.
*   `SESSION_SECRET`: A long random string for encrypting user sessions.
*   `NODE_ENV`: Set to `production`.

---

## 3. Deployment Checklist

1.  **[ ] Set Environment Variables**: Go to Railway Dashboard > Variables and add `VITE_GOOGLE_GENAI_API_KEY` and `GOOGLE_GENAI_API_KEY`.
2.  **[ ] Database Migration**:
    *   The build process (`npm run build`) compiles the code.
    *   You may need to run migrations manually or add it to the start command.
    *   **Command**: `npm run db:migrate` (Runs `tsx scripts/run-migrations.ts`)
3.  **[ ] Start Command**:
    *   The `package.json` start script is: `npm start` (which runs `node dist/index.js`).
    *   Ensure Railway uses this start command.

---

## 4. Verification Steps (Post-Deployment)

1.  **Test Translator**:
    *   Go to **Field** > **Chat with Susan**.
    *   Click the **Translator** button (Globe icon).
    *   Click the **Orb**.
    *   **Success**: You should hear greetings in 5 languages.
    *   **Failure**: If it stays silent or logs errors, check if `VITE_GOOGLE_GENAI_API_KEY` was set during the **BUILD** phase.
2.  **Test State-Smart AI**:
    *   Go to Chat.
    *   Ask: *"Does insurance have to match my shingles?"*
    *   **Success**: If you are in MD context, it says **YES**. If VA, it says **NO**.
3.  **Test Training**:
    *   Go to **Training** > **Dashboard**.
    *   Toggle between **Insurance** and **Retail** divisions.

---

## 5. Known Quirks / Notes for Future Devs

*   **Browser Speech API**: The Translator relies on `window.SpeechRecognition` and `window.speechSynthesis`. These **require HTTPS** (Railway provides this automatically, but localhost requires setup). It works best in **Chrome** or **Safari**.
*   **RAG Implementation**: Currently, the RAG knowledge base (`server/services/susan-rag.ts`) is hardcoded/in-memory for speed. For a production app with thousands of documents, migrate this to a Vector Database (pgvector/Pinecone).

---

**Ready to deploy! 🚀**
