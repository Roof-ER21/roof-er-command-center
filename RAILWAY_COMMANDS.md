# Railway CLI - Quick Command Reference

## 🚀 Deployment Commands

```bash
# Deploy current code
railway up

# Deploy and watch logs
railway up --detach=false

# Link to existing project
railway link

# Create new project
railway init

# Initialize with specific name
railway init --name "roof-er-command-center"
```

---

## 🔐 Authentication

```bash
# Login to Railway
railway login

# Check who is logged in
railway whoami

# Logout
railway logout
```

---

## 📊 Monitoring & Logs

```bash
# View logs (last 100 lines)
railway logs

# Stream logs in real-time
railway logs --follow

# View build logs
railway logs --build

# Filter logs by service
railway logs --service <service-name>
```

---

## 🗄️ Database Commands

```bash
# Add PostgreSQL plugin
railway add --plugin postgresql

# Connect to PostgreSQL
railway connect postgresql

# Run command with database URL
railway run -- psql $DATABASE_URL

# Execute query
railway run -- psql $DATABASE_URL -c "SELECT version();"

# Run migrations
railway run npm run db:push

# Seed database
railway run npm run db:seed
```

---

## 🔧 Environment Variables

```bash
# List all environment variables
railway variables

# Set a variable
railway variables set KEY="value"

# Set multiple variables
railway variables set KEY1="value1" KEY2="value2"

# Delete a variable
railway variables delete KEY

# Set from file (one per line: KEY=value)
railway variables set --from-file .env
```

### Generate Secure Secrets
```bash
# Generate JWT secret
railway variables set JWT_SECRET="$(openssl rand -base64 32)"

# Generate session secret
railway variables set SESSION_SECRET="$(openssl rand -base64 32)"

# Set Node environment
railway variables set NODE_ENV="production"
```

---

## 🔄 Service Management

```bash
# Check service status
railway status

# Restart service
railway restart

# Get service info
railway service

# Open in browser
railway open

# Open Railway dashboard
railway open --dashboard
```

---

## 📦 Project Management

```bash
# List all projects
railway list

# Switch project
railway link

# Create new environment
railway environment create <name>

# Switch environment
railway environment select <name>
```

---

## 🔍 Debugging Commands

```bash
# Run command in Railway environment
railway run <command>

# Run with environment variables loaded
railway run -- <command>

# Open shell with environment loaded
railway shell

# Check environment variables
railway run -- env

# Test database connection
railway run -- env | grep DATABASE_URL
```

---

## 📋 Information Commands

```bash
# Show Railway CLI version
railway version

# Get help
railway help

# Help for specific command
railway help <command>

# Show current project/service
railway status
```

---

## 🌐 Domain Management

```bash
# List domains
railway domain

# Add custom domain (via dashboard)
# Go to: railway open → Settings → Domains
```

---

## 🔌 Plugin Management

```bash
# Add PostgreSQL
railway add --plugin postgresql

# Add Redis
railway add --plugin redis

# Add MongoDB
railway add --plugin mongodb

# List all plugins
railway plugins list
```

---

## 🔄 Deployment Management

```bash
# View deployment history
railway deployments

# Rollback to previous deployment
# (via dashboard: railway open → Deployments → Select → Redeploy)

# Cancel current deployment
railway cancel
```

---

## 🎯 Common Workflows

### Initial Setup
```bash
# 1. Login
railway login

# 2. Create/link project
railway init

# 3. Add database
railway add --plugin postgresql

# 4. Set environment variables
railway variables set JWT_SECRET="$(openssl rand -base64 32)"
railway variables set SESSION_SECRET="$(openssl rand -base64 32)"
railway variables set NODE_ENV="production"

# 5. Deploy
railway up
```

### Update Deployment
```bash
# 1. Make changes to code
# 2. Commit changes (if using GitHub auto-deploy)
git add .
git commit -m "Update feature"
git push origin main

# OR deploy via CLI
railway up
```

### Check Application Health
```bash
# 1. View logs
railway logs --follow

# 2. Check status
railway status

# 3. Open in browser
railway open

# 4. Test health endpoint
curl $(railway open --url)/api/health
```

### Database Operations
```bash
# 1. Run migrations
railway run npm run db:push

# 2. Seed database
railway run npm run db:seed

# 3. Connect to database
railway connect postgresql

# 4. Backup database (via psql)
railway run -- pg_dump $DATABASE_URL > backup.sql
```

### Troubleshooting
```bash
# 1. Check logs for errors
railway logs | grep ERROR

# 2. Verify environment variables
railway variables | grep -E "DATABASE|JWT|SESSION"

# 3. Test build locally
npm run build

# 4. Restart service
railway restart

# 5. Check build logs
railway logs --build
```

---

## 🚨 Emergency Commands

### Service Down
```bash
# 1. Check logs
railway logs --follow

# 2. Restart service
railway restart

# 3. Rollback (via dashboard)
railway open → Deployments → Previous → Redeploy
```

### Database Issues
```bash
# 1. Verify DATABASE_URL
railway variables | grep DATABASE_URL

# 2. Test connection
railway run -- psql $DATABASE_URL -c "SELECT 1;"

# 3. Check PostgreSQL plugin status
railway plugins list
```

### Environment Variable Issues
```bash
# 1. List all variables
railway variables

# 2. Delete and re-add variable
railway variables delete KEY
railway variables set KEY="new-value"

# 3. Restart service
railway restart
```

---

## 📝 Environment Variable Templates

### Required Variables
```bash
railway variables set JWT_SECRET="$(openssl rand -base64 32)"
railway variables set SESSION_SECRET="$(openssl rand -base64 32)"
railway variables set NODE_ENV="production"
railway variables set GOOGLE_CLIENT_ID="your-client-id"
railway variables set GOOGLE_CLIENT_SECRET="your-client-secret"
railway variables set GOOGLE_GENAI_API_KEY="your-api-key"
railway variables set SENDGRID_API_KEY="your-api-key"
```

### Optional Variables
```bash
railway variables set OPENAI_API_KEY="your-api-key"
railway variables set GROQ_API_KEY="your-api-key"
railway variables set ANTHROPIC_API_KEY="your-api-key"
railway variables set ENABLE_HR_MODULE="true"
railway variables set ENABLE_TRAINING_MODULE="true"
railway variables set ENABLE_FIELD_MODULE="true"
railway variables set ENABLE_LEADERBOARD_MODULE="true"
```

---

## 💡 Pro Tips

1. **Use `railway run` for migrations**
   ```bash
   railway run npm run db:migrate
   ```

2. **Stream logs during deployment**
   ```bash
   railway up --detach=false
   ```

3. **Quick health check**
   ```bash
   curl $(railway open --url)/api/health
   ```

4. **Test environment variables locally**
   ```bash
   railway run -- env | grep KEY_NAME
   ```

5. **Backup database before migrations**
   ```bash
   railway run -- pg_dump $DATABASE_URL > backup.sql
   ```

6. **Set multiple variables at once**
   ```bash
   railway variables set \
     JWT_SECRET="$(openssl rand -base64 32)" \
     SESSION_SECRET="$(openssl rand -base64 32)" \
     NODE_ENV="production"
   ```

---

## 🔗 Useful URLs

- **Railway Dashboard**: https://railway.app
- **Railway Docs**: https://docs.railway.app
- **Railway Discord**: https://discord.gg/railway
- **Railway Status**: https://status.railway.app
- **Railway CLI Docs**: https://docs.railway.app/develop/cli

---

## 🆘 Need Help?

1. Check logs: `railway logs`
2. Check status: `railway status`
3. View documentation: See `RAILWAY_DEPLOYMENT.md`
4. Run verification: `./scripts/verify-deployment-ready.sh`
5. Get help: `railway help <command>`

---

**Quick Setup**: `./scripts/setup-railway.sh`
**Verify Ready**: `./scripts/verify-deployment-ready.sh`
**Full Guide**: `RAILWAY_DEPLOYMENT.md`
