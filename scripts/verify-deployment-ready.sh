#!/bin/bash

# Roof ER Command Center - Pre-Deployment Verification Script
# Verifies that everything is ready for Railway deployment

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "🔍 Roof ER Command Center - Pre-Deployment Verification"
echo "=========================================================="
echo ""

ISSUES=0

# Function to check something
check() {
    local description=$1
    local command=$2

    if eval "$command" &> /dev/null; then
        echo -e "${GREEN}✅${NC} $description"
        return 0
    else
        echo -e "${RED}❌${NC} $description"
        ISSUES=$((ISSUES + 1))
        return 1
    fi
}

# Function to check file exists
check_file() {
    local description=$1
    local file=$2

    if [ -f "$file" ]; then
        echo -e "${GREEN}✅${NC} $description"
        return 0
    else
        echo -e "${RED}❌${NC} $description (missing: $file)"
        ISSUES=$((ISSUES + 1))
        return 1
    fi
}

# Check Node.js and npm
echo -e "${BLUE}📦 Checking Dependencies${NC}"
check "Node.js installed" "command -v node"
check "npm installed" "command -v npm"
check "Railway CLI installed" "command -v railway"
echo ""

# Check Node.js version
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    echo -e "${GREEN}✅${NC} Node.js version: $NODE_VERSION"

    # Extract major version (e.g., v20.10.0 -> 20)
    MAJOR_VERSION=$(echo $NODE_VERSION | sed 's/v\([0-9]*\).*/\1/')
    if [ "$MAJOR_VERSION" -ge 20 ]; then
        echo -e "${GREEN}✅${NC} Node.js version meets requirement (>=20)"
    else
        echo -e "${RED}❌${NC} Node.js version too old (need >=20, have $NODE_VERSION)"
        ISSUES=$((ISSUES + 1))
    fi
fi
echo ""

# Check required files
echo -e "${BLUE}📄 Checking Configuration Files${NC}"
check_file "package.json exists" "package.json"
check_file "package-lock.json exists" "package-lock.json"
check_file "nixpacks.toml exists" "nixpacks.toml"
check_file "railway.json exists" "railway.json"
check_file ".env.example exists" ".env.example"
check_file "tsconfig.json exists" "tsconfig.json"
echo ""

# Check deployment documentation
echo -e "${BLUE}📚 Checking Documentation${NC}"
check_file "RAILWAY_DEPLOYMENT.md exists" "RAILWAY_DEPLOYMENT.md"
check_file "RAILWAY_QUICK_START.md exists" "RAILWAY_QUICK_START.md"
check_file "DEPLOYMENT_CHECKLIST.md exists" "DEPLOYMENT_CHECKLIST.md"
check_file ".env.railway.template exists" ".env.railway.template"
echo ""

# Check scripts
echo -e "${BLUE}🔧 Checking Scripts${NC}"
check_file "Setup script exists" "scripts/setup-railway.sh"
check "Setup script is executable" "test -x scripts/setup-railway.sh"
echo ""

# Check package.json scripts
echo -e "${BLUE}📜 Checking package.json Scripts${NC}"
if [ -f "package.json" ]; then
    check "Build script defined" "grep -q '\"build\"' package.json"
    check "Start script defined" "grep -q '\"start\"' package.json"
    check "DB push script defined" "grep -q '\"db:push\"' package.json"
    check "DB migrate script defined" "grep -q '\"db:migrate\"' package.json"
else
    echo -e "${RED}❌${NC} package.json not found"
    ISSUES=$((ISSUES + 1))
fi
echo ""

# Check source files
echo -e "${BLUE}📂 Checking Source Files${NC}"
check_file "Server entry point exists" "server/index.ts"
check "Client directory exists" "test -d client"
check "Server directory exists" "test -d server"
echo ""

# Verify health endpoint in server code
echo -e "${BLUE}🏥 Checking Health Endpoint${NC}"
if grep -q "/api/health" server/index.ts 2>/dev/null; then
    echo -e "${GREEN}✅${NC} Health endpoint found in server/index.ts"
else
    echo -e "${RED}❌${NC} Health endpoint not found in server/index.ts"
    ISSUES=$((ISSUES + 1))
fi
echo ""

# Check Git repository
echo -e "${BLUE}🔗 Checking Git Repository${NC}"
check "Git repository initialized" "test -d .git"
if [ -d .git ]; then
    REMOTE=$(git remote get-url origin 2>/dev/null || echo "")
    if [ -n "$REMOTE" ]; then
        echo -e "${GREEN}✅${NC} Git remote configured: $REMOTE"
    else
        echo -e "${YELLOW}⚠️${NC}  Git remote not configured"
        echo "   Add with: git remote add origin https://github.com/Roof-ER21/roof-er-command-center.git"
    fi
fi
echo ""

# Check .gitignore
echo -e "${BLUE}🙈 Checking .gitignore${NC}"
if [ -f ".gitignore" ]; then
    check ".gitignore includes .env" "grep -q '\.env' .gitignore"
    check ".gitignore includes node_modules" "grep -q 'node_modules' .gitignore"
    check ".gitignore includes dist" "grep -q 'dist' .gitignore"
else
    echo -e "${RED}❌${NC} .gitignore not found"
    ISSUES=$((ISSUES + 1))
fi
echo ""

# Check dependencies
echo -e "${BLUE}📦 Checking Dependencies${NC}"
if [ -d "node_modules" ]; then
    echo -e "${GREEN}✅${NC} node_modules exists"
else
    echo -e "${YELLOW}⚠️${NC}  node_modules not found"
    echo "   Run: npm install"
fi
echo ""

# Try to build
echo -e "${BLUE}🏗️  Testing Build Process${NC}"
echo "   Running: npm run build"
if npm run build &> /tmp/build-test.log; then
    echo -e "${GREEN}✅${NC} Build completed successfully"
    if [ -d "dist" ]; then
        echo -e "${GREEN}✅${NC} dist/ directory created"
    else
        echo -e "${RED}❌${NC} dist/ directory not created"
        ISSUES=$((ISSUES + 1))
    fi
else
    echo -e "${RED}❌${NC} Build failed"
    echo "   Check logs at: /tmp/build-test.log"
    ISSUES=$((ISSUES + 1))
fi
echo ""

# Check TypeScript
echo -e "${BLUE}📘 Checking TypeScript${NC}"
if npm run check &> /tmp/typecheck.log; then
    echo -e "${GREEN}✅${NC} TypeScript type check passed"
else
    echo -e "${YELLOW}⚠️${NC}  TypeScript type check failed"
    echo "   Check logs at: /tmp/typecheck.log"
    echo "   This may not prevent deployment, but should be fixed"
fi
echo ""

# Railway CLI check
echo -e "${BLUE}🚂 Checking Railway CLI${NC}"
if command -v railway &> /dev/null; then
    RAILWAY_VERSION=$(railway version 2>/dev/null || echo "unknown")
    echo -e "${GREEN}✅${NC} Railway CLI version: $RAILWAY_VERSION"

    if railway whoami &> /dev/null; then
        RAILWAY_USER=$(railway whoami)
        echo -e "${GREEN}✅${NC} Logged in as: $RAILWAY_USER"
    else
        echo -e "${YELLOW}⚠️${NC}  Not logged in to Railway"
        echo "   Run: railway login"
    fi
else
    echo -e "${RED}❌${NC} Railway CLI not installed"
    echo "   Install: npm install -g @railway/cli"
    ISSUES=$((ISSUES + 1))
fi
echo ""

# Summary
echo "=========================================================="
if [ $ISSUES -eq 0 ]; then
    echo -e "${GREEN}🎉 All checks passed! Ready for deployment!${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Run: ./scripts/setup-railway.sh"
    echo "  2. Or follow: RAILWAY_QUICK_START.md"
    echo ""
    echo "Or configure GitHub auto-deploy:"
    echo "  - See: RAILWAY_DEPLOYMENT.md"
    exit 0
else
    echo -e "${RED}❌ Found $ISSUES issue(s) that need attention${NC}"
    echo ""
    echo "Please fix the issues above before deploying."
    echo ""
    echo "For help, see:"
    echo "  - RAILWAY_DEPLOYMENT.md (detailed guide)"
    echo "  - RAILWAY_QUICK_START.md (quick reference)"
    echo "  - DEPLOYMENT_CHECKLIST.md (step-by-step checklist)"
    exit 1
fi
