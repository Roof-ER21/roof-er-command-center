# Phase 3 Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Configure Environment Variables

```bash
# Add to .env or Railway:

# Google Sheets (Required for Sync)
GOOGLE_SERVICE_ACCOUNT='{"type":"service_account",...}'
GOOGLE_SPREADSHEET_ID="your-sheet-id"

# AI Scoring (Already configured)
ANTHROPIC_API_KEY="sk-ant-..."
```

### Step 2: Set Up Google Sheets

1. **Google Cloud Console** → Create Service Account → Download JSON
2. **Create Google Sheet** → Share with service account email
3. **Copy Sheet ID** from URL: `https://docs.google.com/spreadsheets/d/{ID}/edit`

### Step 3: Configure AI Criteria

1. Navigate: **HR → Recruiting → AI Criteria**
2. Click "Add Criterion"
3. Example:
   ```
   Name: Technical Skills
   Weight: 8/10
   Points:
   - 5+ years roofing experience
   - Knowledge of safety protocols
   - Ability to work at heights
   ```
4. Mark as "Active"

### Step 4: Test Google Sheets Sync

```bash
# Test sync
curl -X POST http://localhost:5000/api/sync/google-sheets \
  -H "Content-Type: application/json" \
  -d '{"syncType":"all"}' \
  -b cookies.txt

# Check your Google Sheet - should have 3 tabs:
# - Candidates
# - Employees
# - Interviews
```

### Step 5: Test AI Scoring

1. Go to: **HR → Recruiting → Pipeline**
2. Click the **sparkles icon (⭐)** next to any candidate
3. Wait 2-4 seconds
4. See toast notification with score
5. Check candidate notes for AI summary

---

## 📌 API Endpoints

### Google Sheets Sync

```bash
# Sync all data
POST /api/sync/google-sheets
Body: {"syncType": "all"}

# Sync specific type
POST /api/sync/google-sheets
Body: {"syncType": "candidates"}
# Options: "candidates", "employees", "interviews", "all"

# Check status
GET /api/sync/status
```

### AI Scoring

```bash
# Score single candidate
POST /api/hr/candidates/:id/score

# Bulk score
POST /api/hr/candidates/bulk-score
Body: {"candidateIds": [1, 2, 3]}
```

---

## 🎯 Quick Commands

```bash
# Development
npm run dev

# Build
npm run build

# Start production
npm start

# Type check
npm run check

# Test sync
curl http://localhost:5000/api/sync/status
```

---

## 🐛 Troubleshooting

### Google Sheets Not Working?

```bash
# Check status
curl http://localhost:5000/api/sync/status

# Should return:
{
  "configured": true,
  "hasServiceAccount": true,
  "hasSpreadsheetId": true
}
```

**If false:**
- Verify `GOOGLE_SERVICE_ACCOUNT` is set (entire JSON as string)
- Verify `GOOGLE_SPREADSHEET_ID` is set
- Verify sheet is shared with service account email
- Check Railway environment variables

### AI Scoring Not Working?

**Error: "No active scoring criteria found"**
- Go to HR → Recruiting → AI Criteria
- Create at least one criterion
- Mark it as "Active"

**Error: "Failed to score candidate"**
- Verify `ANTHROPIC_API_KEY` is set
- Check API key is valid
- Check candidate has notes/resume data

---

## 💡 Tips

1. **Google Sheets**: Service account email looks like: `service@project.iam.gserviceaccount.com`
2. **AI Scoring**: Works best with candidate notes, resume, or description
3. **Bulk Operations**: Use bulk score to evaluate multiple candidates at once
4. **Sync Frequency**: Run sync after bulk candidate updates
5. **Cost**: AI scoring costs ~$0.01-0.02 per candidate

---

## 📚 Documentation

- **Full Documentation**: See `PHASE_3_IMPLEMENTATION.md`
- **Summary**: See `PHASE_3_SUMMARY.md`
- **This Guide**: Quick start reference

---

## ✅ Testing Checklist

- [ ] Environment variables configured
- [ ] Google Sheet created and shared
- [ ] At least one AI criterion active
- [ ] Sync test successful
- [ ] AI scoring test successful
- [ ] Frontend button works
- [ ] Candidate rating updates
- [ ] Google Sheet has data

---

**Ready to Deploy? All checks pass? Deploy to Railway!**

```bash
git add .
git commit -m "Phase 3: Google Sheets Sync & AI Candidate Scoring"
git push origin main
# Railway auto-deploys
```

---

**Need Help?** Check the full documentation or server logs.
