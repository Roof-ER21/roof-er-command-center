# Railway Deployment Guide - Roof ER Command Center

## Prerequisites

- Railway CLI installed: ✅ `/Users/a21/.npm-global/bin/railway`
- GitHub repository connected: ✅ `https://github.com/Roof-ER21/roof-er-command-center`
- Railway account at https://railway.app

## Project Configuration

### Build Configuration (nixpacks.toml)
```toml
[phases.setup]
nixPkgs = ["nodejs_20", "npm"]

[phases.build]
cmds = ["npm ci", "npm run build"]

[start]
cmd = "npm start"

[variables]
NODE_ENV = "production"
```

### Deployment Configuration (railway.json)
```json
{
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

## Deployment Steps

### 1. Initialize Railway Project

```bash
cd /Users/a21/roof-er-command-center

# Login to Railway (if not already logged in)
railway login

# Link to existing project or create new one
railway link

# OR create a new project
railway init
```

### 2. Add PostgreSQL Database

```bash
# Add PostgreSQL plugin to your Railway project
railway add --plugin postgresql

# Railway will automatically set DATABASE_URL environment variable
```

### 3. Set Environment Variables

Set these in Railway Dashboard (https://railway.app) or via CLI:

#### Required Variables (Critical)
```bash
railway variables set JWT_SECRET="$(openssl rand -base64 32)"
railway variables set SESSION_SECRET="$(openssl rand -base64 32)"
railway variables set NODE_ENV="production"
```

#### Google Cloud / GenAI (Required for AI features)
```bash
railway variables set GOOGLE_CLIENT_ID="your-google-client-id"
railway variables set GOOGLE_CLIENT_SECRET="your-google-client-secret"
railway variables set GOOGLE_GENAI_API_KEY="your-google-genai-api-key"
```

#### Email Services (Choose one or both)
```bash
railway variables set SENDGRID_API_KEY="your-sendgrid-api-key"
# OR/AND
railway variables set RESEND_API_KEY="your-resend-api-key"
```

#### Optional AI Services
```bash
railway variables set OPENAI_API_KEY="your-openai-api-key"
railway variables set GROQ_API_KEY="your-groq-api-key"
railway variables set ANTHROPIC_API_KEY="your-anthropic-api-key"
```

#### Feature Flags (Optional - defaults to true)
```bash
railway variables set ENABLE_HR_MODULE="true"
railway variables set ENABLE_LEADERBOARD_MODULE="true"
railway variables set ENABLE_TRAINING_MODULE="true"
railway variables set ENABLE_FIELD_MODULE="true"
```

#### Auto-configured by Railway
- `DATABASE_URL` - Set automatically when PostgreSQL plugin is added
- `PORT` - Set automatically by Railway
- `RAILWAY_ENVIRONMENT` - Set automatically

### 4. Run Database Migrations

After setting up the database:

```bash
# Push database schema to Railway PostgreSQL
railway run npm run db:push

# OR run migrations
railway run npm run db:migrate

# Optional: Seed database with initial data
railway run npm run db:seed
```

### 5. Deploy to Railway

#### Option A: Deploy via CLI
```bash
# Deploy current code
railway up

# Or deploy and follow logs
railway up --detach=false
```

#### Option B: Auto-deploy from GitHub (Recommended)
1. Go to Railway Dashboard
2. Connect GitHub repository: `Roof-ER21/roof-er-command-center`
3. Set branch to deploy: `main`
4. Enable auto-deploy on push

### 6. Monitor Deployment

```bash
# View deployment logs
railway logs

# Check service status
railway status

# Open in browser
railway open
```

## Environment Variable Template

Create a `.env.railway` file for reference (DO NOT commit):

```bash
# Database (Auto-configured by Railway PostgreSQL plugin)
DATABASE_URL=postgresql://user:password@host:5432/database

# Session & Auth (Generate using: openssl rand -base64 32)
JWT_SECRET=your-generated-jwt-secret
SESSION_SECRET=your-generated-session-secret

# Google Cloud / GenAI
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_GENAI_API_KEY=your-google-genai-api-key

# Email (Choose Sendgrid or Resend)
SENDGRID_API_KEY=your-sendgrid-api-key
RESEND_API_KEY=your-resend-api-key

# Optional AI Services
OPENAI_API_KEY=your-openai-api-key
GROQ_API_KEY=your-groq-api-key
ANTHROPIC_API_KEY=your-anthropic-api-key

# Auto-configured by Railway
NODE_ENV=production
PORT=auto-assigned
CLIENT_URL=https://your-app.railway.app

# Feature Flags (defaults to true)
ENABLE_HR_MODULE=true
ENABLE_LEADERBOARD_MODULE=true
ENABLE_TRAINING_MODULE=true
ENABLE_FIELD_MODULE=true
```

## Post-Deployment Checklist

- [ ] PostgreSQL database provisioned
- [ ] All required environment variables set
- [ ] Database migrations run successfully
- [ ] Health endpoint responding: `https://your-app.railway.app/api/health`
- [ ] GitHub auto-deploy configured (optional)
- [ ] Domain configured (optional)
- [ ] Monitor logs for errors: `railway logs`

## Useful Railway Commands

```bash
# View all environment variables
railway variables

# Open Railway dashboard
railway open

# View logs in real-time
railway logs --follow

# Run commands in Railway environment
railway run <command>

# Connect to PostgreSQL database
railway connect postgresql

# Get service information
railway status

# Restart service
railway restart
```

## Troubleshooting

### Build Failures
1. Check build logs: `railway logs --build`
2. Verify Node.js version matches package.json engines
3. Ensure all dependencies are in package.json (not just devDependencies)

### Runtime Errors
1. Check runtime logs: `railway logs`
2. Verify DATABASE_URL is set correctly
3. Ensure all required environment variables are set
4. Check health endpoint: `/api/health`

### Database Connection Issues
1. Verify DATABASE_URL format: `postgresql://user:password@host:5432/database`
2. Run migrations: `railway run npm run db:migrate`
3. Check PostgreSQL plugin status in Railway dashboard

### Environment Variables Not Loading
1. Restart service after setting variables: `railway restart`
2. Verify variables are set: `railway variables`
3. Check for typos in variable names

## Database Management

### Use Neon Database (Alternative to Railway PostgreSQL)

If you prefer Neon Database (serverless PostgreSQL):

1. Create database at https://neon.tech
2. Get connection string
3. Set in Railway:
```bash
railway variables set DATABASE_URL="postgresql://user:password@host.neon.tech/database"
```

### Connect to Database

```bash
# Via Railway CLI
railway connect postgresql

# Via psql directly
railway run psql $DATABASE_URL
```

## Custom Domain Setup

1. Go to Railway Dashboard → Settings → Domains
2. Add custom domain
3. Update DNS records as instructed
4. Update CLIENT_URL environment variable:
```bash
railway variables set CLIENT_URL="https://your-custom-domain.com"
```

## Rollback Procedure

```bash
# View deployment history in Railway dashboard
railway open

# Rollback to previous deployment via dashboard
# Or redeploy a specific commit
git checkout <commit-hash>
railway up
git checkout main
```

## Monitoring & Alerts

1. Set up monitoring in Railway dashboard
2. Configure alerts for:
   - Service crashes
   - High memory usage
   - Database connection issues
   - Response time degradation

## Cost Optimization

- Monitor resource usage in Railway dashboard
- Right-size PostgreSQL database based on usage
- Consider Neon Database for serverless scaling
- Use Railway's free tier efficiently ($5/month credit)

## Security Best Practices

- ✅ All secrets in environment variables (not in code)
- ✅ Health check endpoint configured
- ✅ Restart policy on failure
- ✅ HTTPS enforced by Railway
- ✅ Database credentials auto-rotated
- ⚠️ Enable rate limiting (already configured in app)
- ⚠️ Regular dependency updates
- ⚠️ Monitor security advisories

## CI/CD Workflow (GitHub Auto-Deploy)

1. Push to `main` branch
2. Railway detects changes
3. Runs build: `npm run build`
4. Runs health check
5. Deploys if healthy
6. Monitors with auto-restart on failure

## Support Resources

- Railway Documentation: https://docs.railway.app
- Railway Discord: https://discord.gg/railway
- Railway Status: https://status.railway.app
- GitHub Repository: https://github.com/Roof-ER21/roof-er-command-center

---

**Last Updated**: January 17, 2026
**Railway CLI Version**: Latest
**Node.js Version**: 20.x
**PostgreSQL Version**: 15.x (Railway default)
