# Roof ER Command Center

A unified enterprise platform for roofing business operations, merging 5 specialized applications into one powerful system:

- **Roof HR** - Complete HR management, PTO tracking, recruiting pipeline, contracts
- **RoofTrack** - Sales leaderboard, contests, gamification, TV display mode
- **Agnes-21** - AI-powered roleplay training with XP/levels progression
- **Lite Training** - 12-module structured sales curriculum
- **Gemini Field** - Susan AI assistant, email generation, document analysis

---

## Features

### HR Module (`/hr`)
- Employee directory with department/territory organization
- PTO request submission and manager approval workflow
- Recruiting pipeline with candidate tracking (new -> screening -> interview -> offer -> hired)
- Interview scheduling with video/phone/in-person options
- Contract management with digital signatures
- Equipment tracking and assignment
- Onboarding task management
- W2/1099/Contractor employment type tracking

### Leaderboard Module (`/leaderboard`)
- Real-time sales rankings with WebSocket updates
- Monthly/yearly revenue and signup tracking
- Active contests with individual or team participation
- Bonus tier progression
- Goal progress visualization
- **TV Display Mode** - Full-screen auto-refreshing display for office monitors
- AGNU 21 gamification system

### Training Module (`/training`)
- **AI Roleplay Training** - Practice sales scenarios with AI homeowners
- **12-Module Curriculum**:
  1. Welcome & Company Intro
  2. Your Commitment
  3. The Initial Pitch
  4. The Inspection Process
  5. Post-Inspection Pitch
  6. Handling Objections
  7. Shingle Types
  8. Roofing & Damage ID
  9. The Sales Cycle
  10. Filing a Claim & Closing
  11. AI Role-Play Simulator
  12. Final Quiz
- XP & leveling system (beginner -> intermediate -> advanced -> expert -> master)
- Achievement system with badges
- Daily streak tracking
- Team leaderboard for training progress
- Coach mode for guided learning

### Field Module (`/field`)
- **Susan AI Chat** - AI assistant for field questions (state-specific: VA, MD, PA)
- Email generation with templates
- Document library with category organization
- Image analysis for roof damage assessment
- Multiple AI provider support (Gemini, OpenAI, Groq, Anthropic)

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18 + TypeScript + Vite |
| **Backend** | Express.js + TypeScript |
| **Database** | PostgreSQL (Neon Serverless) + Drizzle ORM |
| **UI Components** | Radix UI + Tailwind CSS + Framer Motion |
| **Real-time** | Socket.IO (WebSocket) |
| **AI** | Google GenAI (Gemini), OpenAI, Groq, Anthropic |
| **Mobile** | Capacitor (iOS native) + PWA |
| **Email** | SendGrid + Resend |
| **Charts** | Recharts |
| **Forms** | React Hook Form + Zod validation |
| **State** | Zustand + TanStack Query |
| **Auth** | bcrypt (password), CryptoJS (PIN), express-session |

---

## Quick Start

### Prerequisites

- Node.js 20+ (or 22+)
- PostgreSQL database (recommended: [Neon](https://neon.tech) for serverless)
- Google GenAI API key (for AI features)

### Installation

```bash
# Clone the repository
git clone https://github.com/Roof-ER21/roof-er-command-center.git
cd roof-er-command-center

# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your values (see Environment Variables section)

# Push database schema
npm run db:push

# (Optional) Seed with sample data
npm run db:seed

# Start development server
npm run dev
```

The application will be available at `http://localhost:5000`

---

## Environment Variables

Create a `.env` file with the following variables:

```env
# Database (Required)
DATABASE_URL=postgresql://user:password@host:5432/roof_er_command_center

# Session & Auth (Required)
JWT_SECRET=your-secure-jwt-secret-min-32-chars
SESSION_SECRET=your-secure-session-secret-min-32-chars

# Google Cloud / GenAI (Required for AI features)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_GENAI_API_KEY=your-google-genai-api-key

# Email Services (Optional)
SENDGRID_API_KEY=your-sendgrid-api-key
RESEND_API_KEY=your-resend-api-key

# Alternative AI Providers (Optional)
OPENAI_API_KEY=your-openai-api-key
GROQ_API_KEY=your-groq-api-key
ANTHROPIC_API_KEY=your-anthropic-api-key

# App Config
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:5173

# Feature Flags
ENABLE_HR_MODULE=true
ENABLE_LEADERBOARD_MODULE=true
ENABLE_TRAINING_MODULE=true
ENABLE_FIELD_MODULE=true
```

---

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server (client + server) |
| `npm run dev:client` | Start Vite dev server only |
| `npm run build` | Production build (Vite + esbuild) |
| `npm start` | Start production server |
| `npm run check` | TypeScript type checking |
| `npm run db:push` | Push Drizzle schema to database |
| `npm run db:generate` | Generate migration files |
| `npm run db:studio` | Open Drizzle Studio GUI |
| `npm run db:migrate` | Run database migrations |
| `npm run db:seed` | Seed database with sample data |
| `npm run db:reset` | Reset database and reseed |
| `npm run ios:build` | Build and open iOS project |
| `npm run cap:sync` | Sync Capacitor with web build |
| `npm run cap:open:ios` | Open Xcode project |

---

## Project Structure

```
roof-er-command-center/
├── client/                    # Frontend React application
│   └── src/
│       ├── components/        # Shared components
│       │   ├── ui/           # Radix UI base components
│       │   ├── layout/       # AppShell, AuthLayout, etc.
│       │   └── shared/       # Reusable business components
│       ├── hooks/            # Custom React hooks (useAuth, useToast, etc.)
│       ├── lib/              # Utility functions
│       ├── modules/          # Feature modules
│       │   ├── auth/         # Login, PIN login pages
│       │   ├── dashboard/    # Main dashboard
│       │   ├── hr/           # HR module pages
│       │   │   ├── HRDashboard.tsx
│       │   │   ├── EmployeesPage.tsx
│       │   │   ├── PTOPage.tsx
│       │   │   └── RecruitingPage.tsx
│       │   ├── leaderboard/  # Leaderboard module pages
│       │   │   ├── LeaderboardDashboard.tsx
│       │   │   ├── SalesLeaderboard.tsx
│       │   │   ├── ContestsPage.tsx
│       │   │   └── TVDisplayPage.tsx
│       │   ├── training/     # Training module pages
│       │   │   ├── TrainingDashboard.tsx
│       │   │   ├── CoachModePage.tsx
│       │   │   ├── RoleplayPage.tsx
│       │   │   ├── CurriculumPage.tsx
│       │   │   └── AchievementsPage.tsx
│       │   └── field/        # Field module pages
│       │       ├── FieldDashboard.tsx
│       │       ├── ChatPage.tsx
│       │       ├── EmailGeneratorPage.tsx
│       │       └── DocumentsPage.tsx
│       ├── types/            # TypeScript type definitions
│       ├── App.tsx           # Main app with routing
│       └── main.tsx          # Entry point
│
├── server/                    # Backend Express application
│   ├── config/               # Environment configuration
│   ├── db.ts                 # Database connection
│   ├── index.ts              # Server entry point
│   ├── middleware/           # Express middleware
│   │   └── auth.ts           # Authentication middleware
│   ├── routes/               # API routes by module
│   │   ├── auth/            # Authentication endpoints
│   │   ├── hr/              # HR module endpoints
│   │   ├── leaderboard/     # Leaderboard endpoints
│   │   ├── training/        # Training endpoints
│   │   ├── field/           # Field module endpoints
│   │   └── ai/              # AI integration endpoints
│   ├── services/             # Business logic services
│   └── websocket/            # Socket.IO handlers
│       ├── index.ts         # WebSocket setup
│       ├── leaderboard.ts   # Leaderboard real-time
│       └── training.ts      # Training real-time
│
├── shared/                    # Shared code
│   ├── schema.ts             # Unified Drizzle database schema
│   └── constants.ts          # Shared constants
│
├── migrations/                # Database migrations
├── public/                    # Static assets
├── ios/                       # iOS native project (Capacitor)
│
├── capacitor.config.ts        # Capacitor configuration
├── drizzle.config.ts          # Drizzle ORM configuration
├── railway.json               # Railway deployment config
├── nixpacks.toml              # Nixpacks build config
├── tailwind.config.ts         # Tailwind CSS configuration
├── tsconfig.json              # TypeScript configuration
├── vite.config.ts             # Vite build configuration
└── package.json               # Dependencies and scripts
```

---

## Authentication

### Login Methods

1. **Email/Password** - Standard authentication for full access
2. **PIN Login** - 4-digit PIN for quick training module access
3. **Magic Link** - Email-based passwordless login (optional)

### Roles (14 Unified Roles)

| Role | Description |
|------|-------------|
| `SYSTEM_ADMIN` | Full system access |
| `HR_ADMIN` | HR module administration |
| `GENERAL_MANAGER` | Company-wide management |
| `TERRITORY_MANAGER` | Territory-level management |
| `MANAGER` | Team management |
| `TEAM_LEAD` | Team leadership |
| `EMPLOYEE` | Standard employee |
| `FIELD_TECH` | Field technician |
| `SALES_REP` | Sales representative |
| `CONTRACTOR` | External contractor |
| `SOURCER` | Lead sourcing |
| `TRAINEE` | Training-only access |
| `INSURANCE_MANAGER` | Insurance division |
| `RETAIL_MANAGER` | Retail division |

### Module Access Flags

Each user has boolean flags controlling access:
- `hasHRAccess` - Access to HR module
- `hasLeaderboardAccess` - Access to Leaderboard module
- `hasTrainingAccess` - Access to Training module (default: true)
- `hasFieldAccess` - Access to Field module

---

## API Endpoints

See [docs/API.md](docs/API.md) for complete API documentation.

### Quick Reference

```
GET  /api/health              # Health check
POST /api/auth/login          # Email/password login
POST /api/auth/pin-login      # PIN login
POST /api/auth/logout         # Logout
GET  /api/auth/me             # Current user
POST /api/auth/register       # Register user (admin only)

/api/hr/*                     # HR module endpoints
/api/leaderboard/*            # Leaderboard endpoints
/api/training/*               # Training endpoints
/api/field/*                  # Field endpoints
/api/ai/*                     # AI integration endpoints
```

---

## WebSocket Events

### Namespaces

| Namespace | Purpose |
|-----------|---------|
| `/leaderboard` | Real-time ranking updates, TV display sync |
| `/training` | XP gains, level ups, streak updates |
| `/field` | Chat message streaming, typing indicators |

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for detailed WebSocket documentation.

---

## Deployment

### Railway (Recommended)

```bash
# Connect to Railway
railway link

# Deploy
railway up

# Or push to GitHub for auto-deploy
git push origin main
```

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for complete deployment guide.

### Manual Deployment

```bash
npm run build
NODE_ENV=production npm start
```

---

## Mobile Development

### iOS (Capacitor)

```bash
# Build and sync
npm run ios:build

# Open in Xcode
npm run cap:open:ios
```

### PWA

The application is PWA-ready. Users can install it on mobile devices through the browser's "Add to Home Screen" feature.

See [docs/MOBILE.md](docs/MOBILE.md) for complete mobile development guide.

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes following the existing code style
4. Write tests for new functionality
5. Run type checking: `npm run check`
6. Commit with descriptive messages
7. Push to your fork: `git push origin feature/my-feature`
8. Open a Pull Request

### Code Style

- TypeScript strict mode enabled
- ESLint + Prettier for formatting
- Use React functional components with hooks
- Follow existing module/component patterns
- Document complex business logic

---

## Documentation

- [API Reference](docs/API.md) - Complete API endpoint documentation
- [Architecture](docs/ARCHITECTURE.md) - System architecture and design
- [Deployment](docs/DEPLOYMENT.md) - Deployment instructions
- [Mobile](docs/MOBILE.md) - iOS and PWA development

---

## License

MIT

---

**Powered by Roof-ER21**

Built with React, Express, PostgreSQL, Socket.IO, and AI
