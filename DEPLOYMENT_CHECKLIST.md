# Railway Deployment Checklist

## Pre-Deployment

### Local Development
- [ ] Application runs successfully locally (`npm run dev`)
- [ ] All tests pass (if applicable)
- [ ] Build completes without errors (`npm run build`)
- [ ] Production start works (`npm start` with dist/)
- [ ] Database migrations tested (`npm run db:push`)
- [ ] Environment variables documented in `.env.example`

### Code Quality
- [ ] No secrets in code (all in .env)
- [ ] `.gitignore` includes .env files
- [ ] TypeScript compiles without errors (`npm run check`)
- [ ] Dependencies up to date (`npm audit`)
- [ ] package.json has correct Node.js version in engines

### Configuration Files
- [ ] `nixpacks.toml` configured
- [ ] `railway.json` configured
- [ ] Health endpoint exists (`/api/health`)
- [ ] Database connection string uses env variable
- [ ] Port uses process.env.PORT or Railway default

---

## Railway Setup

### Account & Project
- [ ] Railway account created (https://railway.app)
- [ ] Railway CLI installed (`which railway`)
- [ ] Logged in to Railway CLI (`railway login`)
- [ ] Project created/linked (`railway link` or `railway init`)

### Database Setup
- [ ] PostgreSQL plugin added (`railway add --plugin postgresql`)
- [ ] DATABASE_URL auto-configured (check: `railway variables | grep DATABASE`)
- [ ] OR: External database URL set manually (Neon, etc.)

### Environment Variables - Required
- [ ] JWT_SECRET set (`openssl rand -base64 32`)
- [ ] SESSION_SECRET set (`openssl rand -base64 32`)
- [ ] NODE_ENV=production
- [ ] GOOGLE_CLIENT_ID set
- [ ] GOOGLE_CLIENT_SECRET set
- [ ] GOOGLE_GENAI_API_KEY set
- [ ] Email service API key set (SENDGRID_API_KEY or RESEND_API_KEY)

### Environment Variables - Optional
- [ ] OPENAI_API_KEY (if using OpenAI features)
- [ ] GROQ_API_KEY (if using Groq features)
- [ ] ANTHROPIC_API_KEY (if using Claude features)
- [ ] Feature flags set (if customizing modules)

### Verification
```bash
# Verify all required variables are set
railway variables | grep -E "JWT_SECRET|SESSION_SECRET|DATABASE_URL|GOOGLE_|SENDGRID|RESEND"
```

---

## Database Migration

- [ ] Schema pushed to production database
  ```bash
  railway run npm run db:push
  ```
- [ ] Initial data seeded (if needed)
  ```bash
  railway run npm run db:seed
  ```
- [ ] Database connection tested
  ```bash
  railway run -- psql $DATABASE_URL -c "SELECT version();"
  ```

---

## Deployment

### Choose Deployment Method

#### Option A: CLI Deployment
- [ ] Deploy via Railway CLI
  ```bash
  railway up
  ```
- [ ] Monitor deployment logs
  ```bash
  railway logs --follow
  ```

#### Option B: GitHub Auto-Deploy (Recommended)
- [ ] Repository connected in Railway Dashboard
- [ ] Branch set to `main`
- [ ] Auto-deploy on push enabled
- [ ] Webhook verified in GitHub settings
- [ ] Test deployment with commit
  ```bash
  git commit --allow-empty -m "test: trigger railway deploy"
  git push origin main
  ```

---

## Post-Deployment Verification

### Application Health
- [ ] Deployment succeeded (check Railway dashboard)
- [ ] Health endpoint responds
  ```bash
  curl https://your-app.railway.app/api/health
  ```
- [ ] Application loads in browser
  ```bash
  railway open
  ```

### Functionality Testing
- [ ] User authentication works
- [ ] Database queries execute successfully
- [ ] File uploads work (if applicable)
- [ ] Email sending works (test email notifications)
- [ ] AI features respond (Google GenAI)
- [ ] All modules accessible:
  - [ ] HR Module
  - [ ] Training Module
  - [ ] Field Assistant
  - [ ] Leaderboard

### Performance & Monitoring
- [ ] No errors in runtime logs (`railway logs`)
- [ ] Response times acceptable
- [ ] Memory usage normal (check Railway dashboard)
- [ ] Database connections stable
- [ ] WebSocket connections work (if applicable)

---

## Security & Compliance

### Security Checklist
- [ ] HTTPS enforced (automatic with Railway)
- [ ] All secrets in environment variables
- [ ] No sensitive data in logs
- [ ] Rate limiting configured
- [ ] CORS configured properly
- [ ] Session security configured
- [ ] SQL injection prevention (using parameterized queries)
- [ ] XSS prevention (React escapes by default)

### Access Control
- [ ] Admin users configured
- [ ] User roles working
- [ ] Authentication required for protected routes
- [ ] API endpoints secured

---

## Optional Enhancements

### Custom Domain
- [ ] Custom domain added in Railway dashboard
- [ ] DNS records configured
- [ ] SSL certificate active
- [ ] CLIENT_URL environment variable updated

### Monitoring & Alerts
- [ ] Railway monitoring enabled
- [ ] Alerts configured for:
  - [ ] Service crashes
  - [ ] High memory usage
  - [ ] Database issues
- [ ] External monitoring (optional):
  - [ ] Uptime monitoring (UptimeRobot, Pingdom)
  - [ ] Error tracking (Sentry)
  - [ ] Performance monitoring (New Relic, Datadog)

### Backups
- [ ] Database backup strategy documented
- [ ] Backup restoration tested
- [ ] File uploads backed up (if applicable)

---

## Documentation

### Update Documentation
- [ ] README.md updated with production URL
- [ ] API documentation updated (if applicable)
- [ ] Environment variables documented
- [ ] Deployment process documented
- [ ] User guides updated

### Team Communication
- [ ] Team notified of deployment
- [ ] Production URL shared
- [ ] Known issues documented
- [ ] Support process documented

---

## Rollback Plan

### Before Deployment
- [ ] Current production version noted
- [ ] Rollback procedure documented
- [ ] Database backup created
- [ ] Migration rollback tested (if schema changes)

### If Issues Occur
```bash
# Rollback via Railway dashboard
1. Go to Railway Dashboard → Deployments
2. Select previous working deployment
3. Click "Redeploy"

# OR rollback via CLI
git revert <commit-hash>
git push origin main
```

---

## Cost Management

### Initial Setup
- [ ] Understand Railway pricing ($5 free credit)
- [ ] Resource limits configured (if needed)
- [ ] Cost alerts set up

### Ongoing
- [ ] Monthly costs monitored
- [ ] Resource usage optimized
- [ ] Unused services removed

**Estimated Monthly Cost:**
- Web Service: ~$3-5
- PostgreSQL: ~$5
- **Total: ~$8-10/month**

---

## Maintenance Schedule

### Daily
- [ ] Monitor error logs
- [ ] Check service health

### Weekly
- [ ] Review performance metrics
- [ ] Check for dependency updates
- [ ] Verify backups

### Monthly
- [ ] Security audit
- [ ] Cost review
- [ ] Performance optimization

---

## Support Resources

- **Railway Docs**: https://docs.railway.app
- **Railway Discord**: https://discord.gg/railway
- **Railway Status**: https://status.railway.app
- **Project Repo**: https://github.com/Roof-ER21/roof-er-command-center
- **Deployment Guides**:
  - Full guide: `RAILWAY_DEPLOYMENT.md`
  - Quick start: `RAILWAY_QUICK_START.md`

---

## Quick Command Reference

```bash
# Deploy
railway up

# Logs
railway logs
railway logs --follow
railway logs --build

# Status
railway status
railway variables

# Database
railway connect postgresql
railway run npm run db:push
railway run npm run db:migrate

# Service Management
railway restart
railway open

# Troubleshooting
railway logs | grep ERROR
railway run -- env | grep DATABASE_URL
```

---

## Deployment Sign-Off

**Deployed by:** _______________
**Date:** _______________
**Version:** _______________
**Railway Project:** _______________
**Production URL:** _______________

**Issues Encountered:** _______________
**Resolution:** _______________

**Sign-off:** _______________

---

**Last Updated**: January 17, 2026
**Checklist Version**: 1.0
