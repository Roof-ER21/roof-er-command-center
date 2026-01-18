#!/bin/bash

# Roof ER Command Center - Railway Deployment Setup Script
# This script helps you set up Railway deployment with all required environment variables

set -e

echo "🚀 Roof ER Command Center - Railway Deployment Setup"
echo "=================================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo -e "${RED}❌ Railway CLI not found${NC}"
    echo ""
    echo "Install Railway CLI:"
    echo "  npm install -g @railway/cli"
    echo "  or visit: https://docs.railway.app/develop/cli"
    exit 1
fi

echo -e "${GREEN}✅ Railway CLI found${NC}"
echo ""

# Check if logged in to Railway
if ! railway whoami &> /dev/null; then
    echo -e "${YELLOW}⚠️  Not logged in to Railway${NC}"
    echo ""
    echo "Logging in to Railway..."
    railway login
    echo ""
fi

echo -e "${GREEN}✅ Logged in to Railway${NC}"
echo ""

# Step 1: Link or create project
echo -e "${BLUE}Step 1: Link Railway Project${NC}"
echo "Choose an option:"
echo "  1) Link to existing Railway project"
echo "  2) Create new Railway project"
read -p "Enter choice (1 or 2): " project_choice

if [ "$project_choice" = "1" ]; then
    railway link
elif [ "$project_choice" = "2" ]; then
    read -p "Enter project name (default: roof-er-command-center): " project_name
    project_name=${project_name:-roof-er-command-center}
    railway init --name "$project_name"
else
    echo -e "${RED}Invalid choice${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}✅ Railway project linked${NC}"
echo ""

# Step 2: Add PostgreSQL
echo -e "${BLUE}Step 2: Add PostgreSQL Database${NC}"
read -p "Add PostgreSQL to Railway project? (y/n): " add_postgres

if [ "$add_postgres" = "y" ] || [ "$add_postgres" = "Y" ]; then
    echo "Adding PostgreSQL plugin..."
    railway add --plugin postgresql
    echo -e "${GREEN}✅ PostgreSQL added (DATABASE_URL will be auto-configured)${NC}"
else
    echo -e "${YELLOW}⚠️  Skipped PostgreSQL. You'll need to set DATABASE_URL manually.${NC}"
fi

echo ""

# Step 3: Generate and set secrets
echo -e "${BLUE}Step 3: Generate Secure Secrets${NC}"
echo ""

# Generate JWT secret
JWT_SECRET=$(openssl rand -base64 32)
echo "Generated JWT_SECRET: ${JWT_SECRET:0:10}..."

# Generate session secret
SESSION_SECRET=$(openssl rand -base64 32)
echo "Generated SESSION_SECRET: ${SESSION_SECRET:0:10}..."

echo ""
read -p "Set these secrets in Railway? (y/n): " set_secrets

if [ "$set_secrets" = "y" ] || [ "$set_secrets" = "Y" ]; then
    railway variables set JWT_SECRET="$JWT_SECRET"
    railway variables set SESSION_SECRET="$SESSION_SECRET"
    railway variables set NODE_ENV="production"
    echo -e "${GREEN}✅ Secrets configured${NC}"
else
    echo -e "${YELLOW}⚠️  Save these secrets for manual configuration:${NC}"
    echo "JWT_SECRET=$JWT_SECRET"
    echo "SESSION_SECRET=$SESSION_SECRET"
fi

echo ""

# Step 4: Configure API keys
echo -e "${BLUE}Step 4: Configure API Keys${NC}"
echo ""
echo "You'll need to manually set these in Railway Dashboard or via CLI:"
echo ""
echo "Required for AI features:"
echo "  - GOOGLE_CLIENT_ID"
echo "  - GOOGLE_CLIENT_SECRET"
echo "  - GOOGLE_GENAI_API_KEY"
echo ""
echo "Email services (choose one):"
echo "  - SENDGRID_API_KEY"
echo "  - RESEND_API_KEY"
echo ""
echo "Optional AI services:"
echo "  - OPENAI_API_KEY"
echo "  - GROQ_API_KEY"
echo "  - ANTHROPIC_API_KEY"
echo ""
read -p "Open Railway Dashboard to configure these now? (y/n): " open_dashboard

if [ "$open_dashboard" = "y" ] || [ "$open_dashboard" = "Y" ]; then
    railway open
fi

echo ""

# Step 5: Deploy
echo -e "${BLUE}Step 5: Deploy to Railway${NC}"
echo ""
echo "Choose deployment method:"
echo "  1) Deploy now via CLI (railway up)"
echo "  2) Configure GitHub auto-deploy (recommended)"
echo "  3) Skip (configure manually later)"
read -p "Enter choice (1, 2, or 3): " deploy_choice

if [ "$deploy_choice" = "1" ]; then
    echo ""
    echo "Building and deploying..."
    railway up
    echo ""
    echo -e "${GREEN}✅ Deployment initiated${NC}"
    echo ""
    echo "View logs with: railway logs"
    echo "Open app with: railway open"
elif [ "$deploy_choice" = "2" ]; then
    echo ""
    echo "To configure GitHub auto-deploy:"
    echo "  1. Go to Railway Dashboard"
    echo "  2. Connect GitHub repository: Roof-ER21/roof-er-command-center"
    echo "  3. Set branch: main"
    echo "  4. Enable auto-deploy on push"
    echo ""
    read -p "Open Railway Dashboard now? (y/n): " open_gh
    if [ "$open_gh" = "y" ] || [ "$open_gh" = "Y" ]; then
        railway open
    fi
else
    echo -e "${YELLOW}⚠️  Skipped deployment${NC}"
fi

echo ""

# Step 6: Database migrations
echo -e "${BLUE}Step 6: Run Database Migrations${NC}"
echo ""
read -p "Run database migrations now? (y/n): " run_migrations

if [ "$run_migrations" = "y" ] || [ "$run_migrations" = "Y" ]; then
    echo "Pushing database schema..."
    railway run npm run db:push
    echo ""
    read -p "Seed database with initial data? (y/n): " seed_db
    if [ "$seed_db" = "y" ] || [ "$seed_db" = "Y" ]; then
        railway run npm run db:seed
    fi
    echo -e "${GREEN}✅ Database configured${NC}"
else
    echo -e "${YELLOW}⚠️  Remember to run migrations manually:${NC}"
    echo "  railway run npm run db:push"
    echo "  railway run npm run db:seed"
fi

echo ""
echo "=================================================="
echo -e "${GREEN}🎉 Railway Setup Complete!${NC}"
echo "=================================================="
echo ""
echo "Next steps:"
echo "  1. Check deployment status: railway status"
echo "  2. View logs: railway logs"
echo "  3. Open app: railway open"
echo "  4. Test health endpoint: curl https://your-app.railway.app/api/health"
echo ""
echo "For detailed documentation, see: RAILWAY_DEPLOYMENT.md"
echo ""
