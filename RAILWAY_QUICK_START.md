# Railway Deployment - Quick Start Guide

## One-Command Setup

```bash
cd /Users/a21/roof-er-command-center
./scripts/setup-railway.sh
```

This interactive script will:
1. ✅ Link/create Railway project
2. ✅ Add PostgreSQL database
3. ✅ Generate secure JWT & session secrets
4. ✅ Guide you through API key configuration
5. ✅ Deploy the application
6. ✅ Run database migrations

---

## Manual Setup (5 Minutes)

### 1. Link Railway Project
```bash
cd /Users/a21/roof-er-command-center
railway login
railway link    # or: railway init
```

### 2. Add PostgreSQL
```bash
railway add --plugin postgresql
```
This automatically sets `DATABASE_URL`

### 3. Set Environment Variables
```bash
# Generate and set secrets
railway variables set JWT_SECRET="$(openssl rand -base64 32)"
railway variables set SESSION_SECRET="$(openssl rand -base64 32)"
railway variables set NODE_ENV="production"

# Set AI API keys (get from respective providers)
railway variables set GOOGLE_GENAI_API_KEY="your-key-here"
railway variables set GOOGLE_CLIENT_ID="your-client-id"
railway variables set GOOGLE_CLIENT_SECRET="your-client-secret"

# Set email service (choose one)
railway variables set SENDGRID_API_KEY="your-key-here"
# OR
railway variables set RESEND_API_KEY="your-key-here"

# Optional: Additional AI services
railway variables set OPENAI_API_KEY="your-key-here"
railway variables set GROQ_API_KEY="your-key-here"
railway variables set ANTHROPIC_API_KEY="your-key-here"
```

### 4. Run Database Migrations
```bash
railway run npm run db:push
railway run npm run db:seed    # Optional: seed with test data
```

### 5. Deploy
```bash
# Option A: Deploy via CLI
railway up

# Option B: Configure GitHub auto-deploy (recommended)
# 1. Go to Railway Dashboard
# 2. Connect: Roof-ER21/roof-er-command-center
# 3. Set branch: main
# 4. Enable auto-deploy
```

### 6. Verify Deployment
```bash
# Check status
railway status

# View logs
railway logs

# Open in browser
railway open

# Test health endpoint
curl https://your-app.railway.app/api/health
```

---

## Required Environment Variables

| Variable | Source | Required |
|----------|--------|----------|
| `DATABASE_URL` | Auto-set by Railway PostgreSQL | ✅ Yes |
| `JWT_SECRET` | Generate: `openssl rand -base64 32` | ✅ Yes |
| `SESSION_SECRET` | Generate: `openssl rand -base64 32` | ✅ Yes |
| `NODE_ENV` | Set to `production` | ✅ Yes |
| `GOOGLE_GENAI_API_KEY` | https://ai.google.dev | ✅ Yes (for AI) |
| `GOOGLE_CLIENT_ID` | Google Cloud Console | ✅ Yes (for auth) |
| `GOOGLE_CLIENT_SECRET` | Google Cloud Console | ✅ Yes (for auth) |
| `SENDGRID_API_KEY` or `RESEND_API_KEY` | SendGrid/Resend | ✅ Yes (for email) |
| `OPENAI_API_KEY` | OpenAI | ⚠️ Optional |
| `GROQ_API_KEY` | Groq | ⚠️ Optional |
| `ANTHROPIC_API_KEY` | Anthropic | ⚠️ Optional |
| `PORT` | Auto-set by Railway | ✅ Auto |

---

## Quick Commands Reference

```bash
# Deploy
railway up                          # Deploy current code
railway up --detach=false           # Deploy and watch logs

# Monitoring
railway logs                        # View logs
railway logs --follow               # Stream logs
railway status                      # Check service status

# Environment Variables
railway variables                   # List all variables
railway variables set KEY="value"   # Set variable
railway variables delete KEY        # Delete variable

# Database
railway connect postgresql          # Connect to database
railway run npm run db:push         # Run migrations
railway run npm run db:seed         # Seed database

# Service Management
railway restart                     # Restart service
railway open                        # Open dashboard/app

# GitHub Integration
# Set in Railway Dashboard → Settings → GitHub
```

---

## Troubleshooting

### Build Fails
```bash
# Check build logs
railway logs --build

# Common fixes:
# 1. Ensure package-lock.json is committed
# 2. Check Node.js version matches package.json engines
# 3. Verify all dependencies are listed
```

### Database Connection Error
```bash
# Verify DATABASE_URL is set
railway variables | grep DATABASE_URL

# Run migrations
railway run npm run db:push

# Check PostgreSQL plugin status in dashboard
railway open
```

### Environment Variables Not Loading
```bash
# Restart service after setting variables
railway restart

# Verify variables are set correctly
railway variables
```

### Health Check Fails
```bash
# Check if endpoint responds
curl https://your-app.railway.app/api/health

# View runtime logs
railway logs

# Ensure PORT is not hardcoded (Railway sets it)
```

---

## GitHub Auto-Deploy Setup

1. **Connect Repository**
   - Go to Railway Dashboard
   - Click "New Project" → "Deploy from GitHub"
   - Select: `Roof-ER21/roof-er-command-center`

2. **Configure Branch**
   - Set branch: `main`
   - Enable "Auto-deploy on push"

3. **Verify Webhook**
   - Check GitHub repo → Settings → Webhooks
   - Railway webhook should be present

4. **Test Auto-Deploy**
   ```bash
   git commit -m "test: trigger railway deploy" --allow-empty
   git push origin main
   ```

---

## Database Options

### Option 1: Railway PostgreSQL (Recommended)
- Simple setup: `railway add --plugin postgresql`
- Auto-configured `DATABASE_URL`
- Built-in backups
- Cost: ~$5/month

### Option 2: Neon Database (Serverless)
- Free tier: 0.5GB storage
- Serverless autoscaling
- Setup:
  ```bash
  # Create at https://neon.tech
  railway variables set DATABASE_URL="postgresql://user:pass@host.neon.tech/db"
  ```

---

## Cost Estimate

**Railway Free Tier:**
- $5 monthly credit
- Sufficient for small apps
- No credit card required

**Typical Usage:**
- Web service: ~$3-5/month
- PostgreSQL: ~$5/month
- **Total: ~$8-10/month**

**Free alternatives:**
- Neon Database (free tier)
- Use $5 Railway credit efficiently

---

## Security Checklist

- ✅ All secrets in environment variables
- ✅ `.env` in `.gitignore` (never commit secrets)
- ✅ HTTPS enforced by Railway
- ✅ Health check configured
- ✅ Auto-restart on failure
- ✅ Rate limiting configured in app
- ⚠️ Regular dependency updates: `npm audit`
- ⚠️ Monitor Railway security advisories

---

## Next Steps After Deployment

1. **Test the Application**
   ```bash
   railway open
   # Test all modules: HR, Training, Field Assistant, Leaderboard
   ```

2. **Configure Custom Domain** (Optional)
   - Railway Dashboard → Settings → Domains
   - Add custom domain
   - Update DNS records

3. **Set Up Monitoring**
   - Railway Dashboard → Metrics
   - Configure alerts for:
     - Service crashes
     - High memory usage
     - Database issues

4. **Documentation**
   - Update README.md with production URL
   - Document environment variables
   - Create user guides

5. **Backup Strategy**
   - Railway auto-backs up PostgreSQL
   - Consider additional backup solution
   - Test restoration process

---

## Support

- **Railway Docs**: https://docs.railway.app
- **Railway Discord**: https://discord.gg/railway
- **Project Issues**: https://github.com/Roof-ER21/roof-er-command-center/issues
- **Detailed Guide**: See `RAILWAY_DEPLOYMENT.md`

---

**Last Updated**: January 17, 2026
**Estimated Setup Time**: 5-10 minutes
**Difficulty**: Easy 🟢
