# Roof ER Command Center - Deployment Guide

## Quick Overview

This is a comprehensive guide for deploying the Roof ER Command Center to Railway with PostgreSQL database.

**GitHub Repository**: https://github.com/Roof-ER21/roof-er-command-center
**Tech Stack**: React + TypeScript + Express + PostgreSQL + Drizzle ORM
**Platform**: Railway (https://railway.app)
**Node Version**: 20.x

---

## Prerequisites

- Railway CLI installed: `/Users/a21/.npm-global/bin/railway`
- Railway account at https://railway.app
- GitHub repository connected: https://github.com/Roof-ER21/roof-er-command-center
- Access to required API keys (Google, email service, etc.)

---

## Quick Start Deployment

### 1. Login to Railway
```bash
railway login
```

### 2. Link to Project
```bash
cd /Users/a21/roof-er-command-center
railway link
```

### 3. Add PostgreSQL Database
```bash
railway add --plugin postgresql
```

### 4. Set Required Environment Variables
```bash
# Generate secrets
railway variables set JWT_SECRET="$(openssl rand -base64 32)"
railway variables set SESSION_SECRET="$(openssl rand -base64 32)"

# Set environment
railway variables set NODE_ENV="production"

# Google Cloud / GenAI (REQUIRED)
railway variables set GOOGLE_CLIENT_ID="your-google-client-id"
railway variables set GOOGLE_CLIENT_SECRET="your-google-client-secret"
railway variables set GOOGLE_GENAI_API_KEY="your-google-genai-api-key"

# Email service (Choose one)
railway variables set SENDGRID_API_KEY="your-sendgrid-api-key"
# OR
railway variables set RESEND_API_KEY="your-resend-api-key"
```

### 5. Run Database Migrations
```bash
railway run npm run db:push
```

### 6. Deploy
```bash
railway up
```

### 7. Verify Deployment
```bash
# Check logs
railway logs

# Open in browser
railway open

# Test health endpoint
curl https://your-app.railway.app/api/health
```

---

## Required Environment Variables

### Critical Variables (Must Set)
| Variable | Description | How to Get |
|----------|-------------|------------|
| `DATABASE_URL` | PostgreSQL connection string | Auto-set by Railway PostgreSQL plugin |
| `JWT_SECRET` | JWT token signing secret | Generate: `openssl rand -base64 32` |
| `SESSION_SECRET` | Session encryption secret | Generate: `openssl rand -base64 32` |
| `NODE_ENV` | Environment mode | Set to: `production` |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | Google OAuth secret | Google Cloud Console |
| `GOOGLE_GENAI_API_KEY` | Google GenAI API key | Google AI Studio |
| `SENDGRID_API_KEY` or `RESEND_API_KEY` | Email service API key | SendGrid or Resend dashboard |

### Optional Variables (AI Features)
| Variable | Description |
|----------|-------------|
| `OPENAI_API_KEY` | OpenAI API key for Lite Training module |
| `GROQ_API_KEY` | Groq API key for advanced features |
| `ANTHROPIC_API_KEY` | Anthropic Claude API key |

### Auto-Configured by Railway
- `PORT` - Automatically assigned by Railway
- `RAILWAY_ENVIRONMENT` - Set by Railway platform

### Feature Flags (Optional - defaults to true)
```bash
ENABLE_HR_MODULE=true
ENABLE_LEADERBOARD_MODULE=true
ENABLE_TRAINING_MODULE=true
ENABLE_FIELD_MODULE=true
```

---

## Database Setup Options

### Option 1: Railway PostgreSQL (Recommended)
```bash
# Add PostgreSQL plugin
railway add --plugin postgresql

# DATABASE_URL is automatically configured
# Run migrations
railway run npm run db:push
```

### Option 2: Neon Database (Serverless PostgreSQL)
1. Create database at https://neon.tech
2. Get connection string
3. Set in Railway:
```bash
railway variables set DATABASE_URL="postgresql://user:password@host.neon.tech/database"
```

---

## Deployment Configuration Files

### railway.json
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm run build"
  },
  "deploy": {
    "startCommand": "npm start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10,
    "healthcheckPath": "/api/health",
    "healthcheckTimeout": 30
  }
}
```

### package.json Scripts
```json
{
  "scripts": {
    "build": "vite build && esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist",
    "start": "NODE_ENV=production node dist/index.js",
    "db:push": "drizzle-kit push",
    "db:migrate": "tsx scripts/run-migrations.ts",
    "db:seed": "tsx scripts/seed-database.ts"
  }
}
```

---

## GitHub Auto-Deploy Setup (Recommended)

1. Go to Railway Dashboard → Your Project
2. Click "Connect to GitHub Repository"
3. Select: `Roof-ER21/roof-er-command-center`
4. Set branch: `main`
5. Enable "Auto-deploy on push"

**Now every push to `main` will automatically deploy!**

```bash
# Push changes to trigger deployment
git add .
git commit -m "Update application"
git push origin main
```

---

## Database Management

### Push Schema Changes
```bash
# Push Drizzle schema to database
railway run npm run db:push
```

### Run Migrations
```bash
# Run migration scripts
railway run npm run db:migrate
```

### Seed Database
```bash
# Seed initial data
railway run npm run db:seed
```

### Connect to Database
```bash
# Via Railway CLI
railway connect postgresql

# Via psql
railway run psql $DATABASE_URL
```

### Database Reset (Development Only)
```bash
railway run npm run db:reset
```

---

## Monitoring & Troubleshooting

### View Logs
```bash
# Real-time logs
railway logs --follow

# Build logs only
railway logs --build

# Filter errors
railway logs | grep ERROR
```

### Check Status
```bash
# Service status
railway status

# Environment variables
railway variables

# Service information
railway open
```

### Common Issues

#### Build Failures
1. Check build logs: `railway logs --build`
2. Verify Node.js version in package.json engines
3. Ensure all dependencies are listed in package.json

#### Database Connection Issues
1. Verify DATABASE_URL: `railway variables | grep DATABASE`
2. Run migrations: `railway run npm run db:push`
3. Check PostgreSQL plugin status in dashboard

#### Runtime Errors
1. Check logs: `railway logs`
2. Verify all required environment variables are set
3. Test health endpoint: `curl https://your-app.railway.app/api/health`

#### Environment Variables Not Loading
1. Restart service: `railway restart`
2. Verify variables: `railway variables`
3. Check for typos in variable names

---

## Security Best Practices

- All secrets stored in environment variables (never in code)
- HTTPS enforced automatically by Railway
- Database credentials auto-rotated by Railway
- Health check endpoint configured: `/api/health`
- Auto-restart on failure enabled
- Rate limiting configured in application
- Session security with signed cookies
- CORS configured for security

**Security Checklist:**
- JWT_SECRET is strong (32+ characters)
- SESSION_SECRET is unique
- All API keys are kept secret
- .env files are in .gitignore
- No sensitive data in logs
- Regular dependency updates

---

## Custom Domain Setup

1. Go to Railway Dashboard → Settings → Domains
2. Click "Add Domain"
3. Enter your custom domain
4. Update DNS records as instructed by Railway:
   - Type: CNAME
   - Name: your-subdomain (or @)
   - Value: provided by Railway
5. Update CLIENT_URL environment variable:
```bash
railway variables set CLIENT_URL="https://your-custom-domain.com"
```

---

## Rollback Procedure

### Via Railway Dashboard
1. Go to Railway Dashboard → Deployments
2. Select a previous working deployment
3. Click "Redeploy"

### Via Git
```bash
# Revert to previous commit
git log --oneline -5
git revert <commit-hash>
git push origin main
```

---

## Cost Estimation

**Railway Pricing:**
- Free tier: $5 credit/month
- Estimated monthly cost:
  - Web Service: $3-5/month
  - PostgreSQL: $5-10/month
  - **Total: ~$8-15/month**

**Cost Optimization:**
- Use Railway free tier efficiently
- Monitor resource usage in dashboard
- Consider Neon Database for serverless scaling
- Right-size PostgreSQL based on actual usage

---

## Post-Deployment Checklist

- [ ] PostgreSQL database provisioned
- [ ] All required environment variables set
- [ ] Database migrations completed
- [ ] Health endpoint responding: `/api/health`
- [ ] Application loads in browser
- [ ] User authentication works
- [ ] All modules accessible (HR, Training, Field, Leaderboard)
- [ ] Email notifications working
- [ ] AI features responding (Google GenAI)
- [ ] GitHub auto-deploy configured
- [ ] Monitoring enabled
- [ ] Team notified of deployment

---

## Useful Railway Commands

```bash
# Deployment
railway up                  # Deploy current code
railway up --detach=false   # Deploy and follow logs

# Environment Variables
railway variables           # List all variables
railway variables set KEY=value  # Set variable

# Logs & Monitoring
railway logs                # View logs
railway logs --follow       # Real-time logs
railway logs --build        # Build logs only

# Database
railway connect postgresql  # Connect to database
railway run npm run db:push # Push schema

# Service Management
railway status              # Service status
railway restart             # Restart service
railway open                # Open in browser

# Project Management
railway link                # Link to project
railway unlink              # Unlink project
railway whoami              # Current user
```

---

## Support Resources

- **Railway Documentation**: https://docs.railway.app
- **Railway Discord**: https://discord.gg/railway
- **Railway Status**: https://status.railway.app
- **GitHub Repository**: https://github.com/Roof-ER21/roof-er-command-center
- **Project README**: See README.md for application details

---

## Additional Documentation

- **Full Deployment Guide**: See `RAILWAY_DEPLOYMENT.md`
- **Deployment Checklist**: See `DEPLOYMENT_CHECKLIST.md`
- **Environment Template**: See `.env.example`
- **Railway Environment Template**: See `.env.railway.template`

---

## Deployment Sign-Off Template

**Deployed by:** _______________
**Date:** _______________
**Version:** _______________
**Railway Project:** _______________
**Production URL:** _______________

**Environment Variables Set:**
- [ ] DATABASE_URL
- [ ] JWT_SECRET
- [ ] SESSION_SECRET
- [ ] GOOGLE_CLIENT_ID
- [ ] GOOGLE_CLIENT_SECRET
- [ ] GOOGLE_GENAI_API_KEY
- [ ] Email API Key (SENDGRID or RESEND)

**Verification:**
- [ ] Build succeeded
- [ ] Migrations completed
- [ ] Health endpoint responds
- [ ] Application accessible
- [ ] All modules working

**Issues Encountered:** _______________
**Resolution:** _______________
**Sign-off:** _______________

---

**Last Updated**: January 17, 2026
**Node.js Version**: 20.x
**PostgreSQL Version**: 15.x (Railway default)
**Railway CLI**: Latest
