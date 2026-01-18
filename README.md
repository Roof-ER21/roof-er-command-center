# Roof ER Command Center

A unified platform merging 5 apps into one powerful system:
- **Roof HR** - HR management, PTO, recruiting, contracts
- **RoofTrack** - Sales leaderboard, contests, gamification
- **Agnes-21** - AI roleplay training, XP/levels
- **Lite Training** - 12-module sales curriculum
- **Gemini Field** - Susan AI assistant, email generation, document analysis

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18 + TypeScript + Vite |
| Backend | Express.js + TypeScript |
| Database | PostgreSQL (Neon) + Drizzle ORM |
| UI | Radix UI + Tailwind CSS |
| Real-time | Socket.IO |
| AI | Google GenAI (Gemini) |
| Mobile | Capacitor (iOS) + PWA |

## Project Structure

```
roof-er-command-center/
├── client/src/
│   ├── modules/           # Feature modules
│   │   ├── auth/          # Authentication pages
│   │   ├── dashboard/     # Main dashboard
│   │   ├── hr/            # HR module pages
│   │   ├── leaderboard/   # Sales leaderboard pages
│   │   ├── training/      # Training module pages
│   │   └── field/         # Field assistant pages
│   ├── components/        # Shared components
│   │   ├── ui/            # Radix UI components
│   │   ├── layout/        # Layout components
│   │   └── shared/        # Shared components
│   └── hooks/             # Custom React hooks
│
├── server/
│   ├── routes/            # API routes by module
│   ├── services/          # Business logic
│   ├── middleware/        # Express middleware
│   └── websocket/         # Socket.IO handlers
│
├── shared/
│   ├── schema.ts          # Unified Drizzle schema
│   └── constants.ts       # Shared constants
│
└── migrations/            # Database migrations
```

## Getting Started

### Prerequisites
- Node.js 20+
- PostgreSQL (or Neon serverless)

### Installation

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your values

# Push database schema
npm run db:push

# Start development server
npm run dev
```

### Environment Variables

```env
DATABASE_URL=postgresql://...
JWT_SECRET=...
SESSION_SECRET=...
GOOGLE_GENAI_API_KEY=...
```

## Modules

### HR Module (`/hr`)
- Employee management
- PTO requests & approval
- Recruiting pipeline
- Contract management
- Equipment tracking

### Leaderboard Module (`/leaderboard`)
- Sales rankings
- Active contests
- Bonus tracking
- TV display mode
- AGNU 21 gamification

### Training Module (`/training`)
- AI roleplay training
- 12-module curriculum
- XP & leveling system
- Achievements & streaks
- Team leaderboard

### Field Module (`/field`)
- Susan AI chat assistant
- Email generation
- Document analysis
- Image analysis (roof damage)

## Authentication

Supports multiple login methods:
- **Password** - Standard email/password login
- **PIN** - 4-digit PIN for training module
- **Magic Link** - Email-based passwordless login (optional)

### Roles (14 unified roles)
`SYSTEM_ADMIN`, `HR_ADMIN`, `GENERAL_MANAGER`, `TERRITORY_MANAGER`,
`MANAGER`, `TEAM_LEAD`, `EMPLOYEE`, `FIELD_TECH`, `SALES_REP`,
`CONTRACTOR`, `SOURCER`, `TRAINEE`, `INSURANCE_MANAGER`, `RETAIL_MANAGER`

## Deployment

### Railway (Recommended)

```bash
# Push to GitHub
git push origin main

# Railway will auto-deploy on push
```

### Manual Build

```bash
npm run build
npm start
```

## API Endpoints

- `GET /api/health` - Health check
- `POST /api/auth/login` - Password login
- `POST /api/auth/pin-login` - PIN login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Current user
- `/api/hr/*` - HR module endpoints
- `/api/leaderboard/*` - Leaderboard endpoints
- `/api/training/*` - Training endpoints
- `/api/field/*` - Field endpoints
- `/api/ai/*` - AI endpoints

## WebSocket Namespaces

- `/leaderboard` - Real-time rankings updates
- `/training` - Training session updates
- `/field` - Chat message streaming

## License

MIT

---

**Powered by Roof-ER21**
