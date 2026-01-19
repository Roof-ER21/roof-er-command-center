# Phase 3: Google Sheets Sync & AI Candidate Scoring

## Implementation Complete

This document describes the Phase 3 features implemented for the roof-er-command-center HR module.

---

## 🎯 Features Implemented

### 1. Google Sheets Sync Service

**Location**: `server/services/google-sheets.ts`

#### Features:
- Sync candidates to Google Sheets
- Sync employees to Google Sheets
- Sync interviews to Google Sheets
- Automatic sheet creation if not exists
- Clear and replace data strategy
- Read data from Google Sheets
- Append data to sheets

#### Configuration Required:

Add these environment variables:

```bash
# Google Service Account JSON (entire JSON as string)
GOOGLE_SERVICE_ACCOUNT='{"type":"service_account","project_id":"...","private_key":"...","client_email":"..."}'

# Google Spreadsheet ID (from sheet URL)
GOOGLE_SPREADSHEET_ID="your-spreadsheet-id-here"
```

**How to get these:**

1. **Service Account**:
   - Go to Google Cloud Console
   - Create a Service Account
   - Download JSON key
   - Stringify the entire JSON and set as env variable

2. **Spreadsheet ID**:
   - Create a Google Sheet
   - Share it with the service account email
   - Copy the ID from the URL: `https://docs.google.com/spreadsheets/d/{SPREADSHEET_ID}/edit`

#### API Endpoints:

**POST /api/sync/google-sheets**

Sync data to Google Sheets.

Request body:
```json
{
  "syncType": "candidates" | "employees" | "interviews" | "all"
}
```

Response:
```json
{
  "success": true,
  "message": "Successfully synced candidates (10 rows), employees (25 rows)",
  "synced": ["candidates (10 rows)", "employees (25 rows)"],
  "errors": []
}
```

**GET /api/sync/status**

Check Google Sheets integration status.

Response:
```json
{
  "configured": true,
  "hasServiceAccount": true,
  "hasSpreadsheetId": true,
  "spreadsheetId": "your-spreadsheet-id"
}
```

---

### 2. AI Candidate Scoring Service

**Location**: `server/services/ai-scoring.ts`

#### Features:
- Score individual candidates against criteria
- Batch score multiple candidates
- Uses Claude Sonnet 4.5 for intelligent scoring
- Scores from 0-100 with weighted criteria
- Automatic validation of AI responses
- Updates candidate ratings (1-5 stars)
- Appends AI summary to candidate notes

#### Configuration Required:

Add this environment variable:

```bash
ANTHROPIC_API_KEY="your-anthropic-api-key"
```

#### API Endpoints:

**POST /api/hr/candidates/:id/score**

Score a single candidate using AI.

Response:
```json
{
  "success": true,
  "candidateId": 123,
  "rating": 4,
  "overallScore": 78.5,
  "breakdown": [
    {
      "criteriaId": 1,
      "score": 85,
      "reasoning": "Strong technical skills demonstrated in resume"
    },
    {
      "criteriaId": 2,
      "score": 72,
      "reasoning": "Good communication skills, needs more experience"
    }
  ],
  "summary": "Candidate shows strong potential with solid technical foundation. Recommend second interview to assess cultural fit and communication skills."
}
```

**POST /api/hr/candidates/bulk-score**

Score multiple candidates at once.

Request body:
```json
{
  "candidateIds": [1, 2, 3, 4, 5]
}
```

Response:
```json
{
  "success": true,
  "scored": 5,
  "results": [
    {
      "candidateId": 1,
      "rating": 4,
      "overallScore": 78.5,
      "summary": "Strong candidate..."
    }
  ]
}
```

---

### 3. Frontend Integration

**Location**: `client/src/modules/hr/RecruitingPage.tsx`

#### Features:
- AI Score button (sparkles icon) in candidate actions
- Real-time scoring with loading state
- Toast notifications with score results
- Automatic refresh of candidate list after scoring

#### Usage:
1. Navigate to HR > Recruiting > Pipeline
2. Click the sparkles icon (⭐) next to any candidate
3. AI will score the candidate and update their rating
4. View the AI summary in the candidate's notes

---

## 🚀 How to Use

### Setting Up Google Sheets Sync

1. **Create Google Service Account**:
   ```bash
   # Visit Google Cloud Console
   # Enable Google Sheets API
   # Create Service Account
   # Download JSON key
   ```

2. **Configure Environment**:
   ```bash
   # Add to .env or Railway environment variables
   GOOGLE_SERVICE_ACCOUNT='{"type":"service_account",...}'
   GOOGLE_SPREADSHEET_ID="1abc123..."
   ```

3. **Test the Integration**:
   ```bash
   curl -X POST http://localhost:5000/api/sync/google-sheets \
     -H "Content-Type: application/json" \
     -d '{"syncType":"all"}' \
     -b cookie.txt
   ```

### Setting Up AI Scoring

1. **Get Anthropic API Key**:
   - Visit https://console.anthropic.com/
   - Create an API key

2. **Configure Environment**:
   ```bash
   # Add to .env or Railway environment variables
   ANTHROPIC_API_KEY="sk-ant-..."
   ```

3. **Configure Criteria** (if not already done):
   - Navigate to HR > Recruiting > AI Criteria
   - Create scoring criteria (e.g., "Technical Skills", "Communication")
   - Set weights and evaluation points
   - Mark as active

4. **Score Candidates**:
   - Go to HR > Recruiting > Pipeline
   - Click sparkles icon next to any candidate
   - AI will score based on active criteria

---

## 📦 Dependencies

All dependencies are already installed:
- `googleapis` (v153.0.0) - Google Sheets API
- `@anthropic-ai/sdk` (v0.37.0) - Claude AI API

No additional npm installs required.

---

## 🔍 Testing

### Test Google Sheets Sync

```bash
# Check status
curl http://localhost:5000/api/sync/status

# Sync all data
curl -X POST http://localhost:5000/api/sync/google-sheets \
  -H "Content-Type: application/json" \
  -d '{"syncType":"all"}'
```

### Test AI Scoring

```bash
# Score candidate ID 1
curl -X POST http://localhost:5000/api/hr/candidates/1/score \
  -H "Content-Type: application/json" \
  -b cookie.txt

# Bulk score candidates
curl -X POST http://localhost:5000/api/hr/candidates/bulk-score \
  -H "Content-Type: application/json" \
  -d '{"candidateIds":[1,2,3]}' \
  -b cookie.txt
```

---

## 🛠️ Architecture

### Google Sheets Service

```
┌─────────────────────────────────────────┐
│        GoogleSheetsService              │
├─────────────────────────────────────────┤
│  - syncCandidates()                     │
│  - syncEmployees()                      │
│  - syncInterviews()                     │
│  - clearAndWriteSheet() (private)       │
│  - ensureSheetExists() (private)        │
│  - readFromSheet()                      │
│  - appendToSheet()                      │
└─────────────────────────────────────────┘
```

### AI Scoring Service

```
┌─────────────────────────────────────────┐
│         AIScoringService                │
├─────────────────────────────────────────┤
│  - scoreCandidate()                     │
│  - scoreCandidates() (batch)            │
│  - buildScoringPrompt() (private)       │
│  - parseAIResponse() (private)          │
│  - validateScoringResult() (private)    │
│  - calculateWeightedAverage() (private) │
└─────────────────────────────────────────┘
```

### Flow Diagram

```
User clicks AI Score button
         ↓
Frontend: scoreCandidateMutation
         ↓
Backend: POST /api/hr/candidates/:id/score
         ↓
1. Fetch candidate from DB
2. Fetch active criteria from DB
3. Call AIScoringService
         ↓
4. Build prompt with candidate info
5. Call Claude Sonnet 4.5 API
6. Parse and validate response
         ↓
7. Calculate weighted average
8. Convert to 1-5 rating
9. Update candidate in DB
         ↓
Return result with breakdown
         ↓
Frontend: Show toast notification
Frontend: Refresh candidate list
```

---

## 🎨 UI Components

### AI Score Button

- **Icon**: Sparkles (⭐)
- **Location**: Candidate actions column in pipeline table
- **States**:
  - Normal: Clickable, purple/blue sparkles
  - Loading: Disabled with spinner
  - Success: Shows toast with score
  - Error: Shows error toast

---

## 🔒 Security

### Google Sheets
- Service account credentials stored in environment variables
- Never exposed to client
- Scoped to Sheets API only
- Authenticated via OAuth 2.0

### AI Scoring
- Anthropic API key stored in environment variables
- Rate limiting via mutation delays (500ms between requests)
- Validation of AI responses before saving
- No sensitive data sent to AI (only public candidate info)

---

## 📊 Example Output

### Google Sheets Structure

**Candidates Sheet**:
```
| ID | First Name | Last Name | Email | Phone | Position | Status | Rating | Source | ...
|----|-----------|-----------|-------|-------|----------|--------|--------|--------|
| 1  | John      | Doe       | j@... | 555.. | Roofer   | new    | 4      | LinkedIn |
```

**Employees Sheet**:
```
| ID | First Name | Last Name | Email | Role | Department | Position | Status |
|----|-----------|-----------|-------|------|-----------|----------|--------|
| 1  | Jane      | Smith     | j@... | HR_ADMIN | HR   | Manager  | Active |
```

**Interviews Sheet**:
```
| ID | Candidate ID | Interviewer ID | Scheduled At | Type | Status | Rating |
|----|-------------|---------------|--------------|------|--------|--------|
| 1  | 1           | 2             | 2025-01-20   | video| scheduled | - |
```

### AI Scoring Output

```json
{
  "overallScore": 78.5,
  "breakdown": [
    {
      "criteriaId": 1,
      "score": 85,
      "reasoning": "Candidate demonstrates strong technical skills with 5+ years of roofing experience. Resume shows progression from helper to lead installer."
    },
    {
      "criteriaId": 2,
      "score": 72,
      "reasoning": "Good communication indicated by customer-facing roles. Could benefit from more formal communication training."
    }
  ],
  "summary": "Strong candidate with solid technical foundation and hands-on experience. Recommend advancing to technical interview stage. Minor gaps in formal communication training can be addressed through onboarding."
}
```

---

## 🚨 Error Handling

### Google Sheets Errors
- Missing credentials: Returns 503 with configuration instructions
- Invalid spreadsheet ID: Returns error with details
- API rate limits: Automatic retry with exponential backoff
- Sheet creation failures: Logged and returned in response

### AI Scoring Errors
- Missing API key: Returns 503 with setup instructions
- No active criteria: Returns 400 with helpful message
- AI response parsing errors: Logged and returns user-friendly error
- Rate limiting: 500ms delay between batch requests
- Validation failures: Corrects or rejects malformed responses

---

## 📈 Performance

### Google Sheets
- Batch operations (clear + write in single request)
- Automatic sheet creation reduces failures
- Parallel sync operations when syncType="all"

### AI Scoring
- Single candidate: ~2-4 seconds
- Batch scoring: Sequential with 500ms delay
- Response caching: No (each candidate unique)
- Token usage: ~500-1000 tokens per candidate

---

## 🔄 Future Enhancements

### Google Sheets
- [ ] Scheduled automatic syncs (cron jobs)
- [ ] Bidirectional sync (import from Sheets)
- [ ] Custom column mappings
- [ ] Multiple spreadsheet support
- [ ] Sync history and audit logs

### AI Scoring
- [ ] Custom scoring models per position
- [ ] Historical score tracking and trends
- [ ] Comparison scoring (vs other candidates)
- [ ] Resume parsing integration
- [ ] Interview transcript analysis
- [ ] Bias detection and mitigation

---

## 📝 Notes

- AI scoring requires active criteria to be configured first
- Google Sheets sync is one-directional (DB → Sheets)
- Service account must have "Editor" access to spreadsheet
- AI scoring updates candidate notes with summary
- Bulk operations are rate-limited to avoid API throttling

---

## ✅ Checklist

- [x] Google Sheets service created
- [x] AI scoring service created
- [x] Sync API endpoints created
- [x] HR routes updated with scoring endpoints
- [x] Frontend AI Score button added
- [x] Toast notifications implemented
- [x] Error handling implemented
- [x] TypeScript types defined
- [x] Documentation written

---

**Implementation Date**: January 19, 2025
**Version**: 1.0.0
**Status**: ✅ Complete
