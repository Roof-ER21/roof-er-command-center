# Database Seed Data Reference

## Overview

This document provides a quick reference for the sample data created by the seed script.

## How to Seed the Database

```bash
# Run the seed script
npm run db:seed

# Or directly with tsx
npx tsx scripts/seed-database.ts
```

## Default Password

**All users have the same password for testing: `test123`**

## User Accounts

### 1. System Administrator
- **Email**: admin@roof-er.com
- **Role**: SYSTEM_ADMIN
- **Access**: Full access to all modules (HR, Leaderboard, Training, Field)
- **Use case**: System administration and full platform testing

### 2. HR Administrator
- **Email**: hr.admin@roof-er.com
- **Name**: Sarah Johnson
- **Role**: HR_ADMIN
- **Access**: HR + Leaderboard + Training
- **Department**: Human Resources
- **Territory**: Mid-Atlantic
- **Use case**: Testing HR management features

### 3. Sales Representative 1
- **Email**: john.sales@roof-er.com
- **Name**: John Martinez
- **Role**: SALES_REP
- **Access**: Leaderboard + Training + Field
- **Team**: Alpha Team
- **Territory**: Mid-Atlantic
- **Stats**:
  - Monthly Revenue: $45,000
  - Yearly Revenue: $420,000
  - Bonus Tier: 3
  - XP: 1,500 (Level 5)
  - Streak: 7 days
- **Use case**: Testing leaderboard, sales tracking, and field operations

### 4. Sales Representative 2
- **Email**: emily.sales@roof-er.com
- **Name**: Emily Chen
- **Role**: SALES_REP
- **Access**: Leaderboard + Training + Field
- **Team**: Beta Team
- **Territory**: Northeast
- **Stats**:
  - Monthly Revenue: $38,000
  - Yearly Revenue: $350,000
  - Bonus Tier: 2
  - XP: 2,200 (Level 7)
  - Streak: 12 days
- **Use case**: Testing leaderboard competition and training features

### 5. Sales Trainee 1
- **Email**: mike.trainee@roof-er.com
- **Name**: Mike Thompson
- **Role**: TRAINEE
- **Access**: Training only
- **Team**: Alpha Team
- **Territory**: Mid-Atlantic
- **Stats**:
  - XP: 300 (Level 2)
  - Streak: 3 days
  - Training Level: Beginner
- **Use case**: Testing limited access and training progression

### 6. Sales Trainee 2
- **Email**: lisa.trainee@roof-er.com
- **Name**: Lisa Rodriguez
- **Role**: TRAINEE
- **Access**: Training only
- **Team**: Beta Team
- **Territory**: Northeast
- **Stats**:
  - XP: 450 (Level 3)
  - Streak: 5 days
  - Training Level: Intermediate
- **Use case**: Testing trainee progression and curriculum access

### 7. Field Technician
- **Email**: carlos.field@roof-er.com
- **Name**: Carlos Rivera
- **Role**: FIELD_TECH
- **Access**: Field + Training
- **Employment Type**: 1099 (Contractor)
- **Territory**: Southeast
- **Stats**:
  - XP: 800 (Level 4)
  - Preferred State: MD
  - AI Provider: Gemini
- **Use case**: Testing field operations and mobile features

### 8. Sales Manager
- **Email**: robert.manager@roof-er.com
- **Name**: Robert Williams
- **Role**: MANAGER
- **Access**: HR + Leaderboard + Training
- **Team**: Alpha Team
- **Territory**: Mid-Atlantic
- **Use case**: Testing manager-level access and team oversight

### 9. General Employee
- **Email**: jane.employee@roof-er.com
- **Name**: Jane Smith
- **Role**: EMPLOYEE
- **Access**: Training only
- **Department**: Operations
- **Territory**: Northeast
- **Stats**:
  - XP: 600 (Level 3)
- **Use case**: Testing basic employee access

## Territories

1. **Mid-Atlantic** (East Region)
   - Maryland, Virginia, DC metro area
   - 4 users assigned

2. **Northeast** (North Region)
   - Pennsylvania, New Jersey, Delaware
   - 3 users assigned

3. **Southeast** (South Region)
   - North Carolina, South Carolina, Georgia
   - 1 user assigned

## Teams

1. **Alpha Team**
   - Members: John Martinez, Mike Thompson, Robert Williams

2. **Beta Team**
   - Members: Emily Chen, Lisa Rodriguez

3. **Gamma Team**
   - No members yet (available for testing)

## Achievements (10 Total)

### Milestone Achievements
1. **First Steps** (👣) - Complete your first training session - 100 XP
2. **Sales Rookie** (🌟) - Complete 10 training sessions - 250 XP
3. **Training Champion** (🏅) - Complete 50 training sessions - 500 XP
4. **Perfect Score** (💯) - Achieve 100% on any training session - 200 XP
5. **Elite Performance** (👑) - Reach level 10 - 1,500 XP

### Streak Achievements
6. **Streak Starter** (🔥) - Maintain a 3-day practice streak - 150 XP
7. **Week Warrior** (⚡) - Maintain a 7-day practice streak - 300 XP
8. **Month Master** (💎) - Maintain a 30-day practice streak - 1,000 XP

### Category Achievements
9. **Roleplay Pro** (🎭) - Complete 25 roleplay sessions - 400 XP
10. **Curriculum Complete** (📚) - Complete all curriculum modules - 750 XP

### Awarded Achievements
- **First Steps**: Awarded to 6 users with XP > 0
- **Streak Starter**: Awarded to 4 users with streak >= 3

## Contests (2 Total)

### 1. January Revenue Challenge
- **Status**: Active
- **Type**: Revenue (Individual)
- **Duration**: Current month
- **Prizes**:
  - $1,000 bonus
  - Employee of the Month
  - Premium parking spot
- **Rules**: Highest total revenue wins (must maintain 90%+ satisfaction)
- **Participants**: 2 (John Martinez, Emily Chen)
- **Current Leader**: John Martinez ($45,000)

### 2. Team Signup Sprint
- **Status**: Upcoming
- **Type**: Signups (Team)
- **Duration**: Next month
- **Prizes**:
  - Team lunch outing
  - Team trophy
  - $500 team bonus
- **Rules**: Teams compete for most signups
- **Participants**: Not yet started

## Sales Rep Statistics

### John Martinez (Alpha Team)
- Monthly Revenue: $45,000 (112.5% of goal)
- Yearly Revenue: $420,000
- All-Time Revenue: $650,000
- Monthly Signups: 12.5
- Yearly Signups: 145.0
- Monthly Growth: 15.5%
- Bonus Tier: 3

### Emily Chen (Beta Team)
- Monthly Revenue: $38,000 (95% of goal)
- Yearly Revenue: $350,000
- All-Time Revenue: $480,000
- Monthly Signups: 10.0
- Yearly Signups: 120.0
- Monthly Growth: 12.0%
- Bonus Tier: 2

## Testing Scenarios

### Scenario 1: Admin Testing
- Login as: admin@roof-er.com
- Test: Full system access, user management, system settings

### Scenario 2: HR Management
- Login as: hr.admin@roof-er.com
- Test: PTO requests, recruiting, contracts, equipment tracking

### Scenario 3: Sales Competition
- Login as: john.sales@roof-er.com or emily.sales@roof-er.com
- Test: Leaderboard, contests, revenue tracking, team performance

### Scenario 4: Training Progression
- Login as: mike.trainee@roof-er.com or lisa.trainee@roof-er.com
- Test: Training sessions, achievements, XP progression, streaks

### Scenario 5: Field Operations
- Login as: carlos.field@roof-er.com
- Test: Field chat, email generation, document viewing, image analysis

### Scenario 6: Manager Oversight
- Login as: robert.manager@roof-er.com
- Test: Team management, HR functions, leaderboard monitoring

## Database Tables Populated

- ✅ users (9 users)
- ✅ territories (3 territories)
- ✅ teams (3 teams)
- ✅ sales_reps (2 sales reps)
- ✅ achievements (10 achievements)
- ✅ user_achievements (6+ achievement awards)
- ✅ contests (2 contests)
- ✅ contest_participants (2 participants in active contest)

## Re-seeding the Database

To reset the database and re-seed:

```bash
# Push the schema (drops and recreates tables)
npm run db:push

# Run the seed script
npm run db:seed
```

**Warning**: This will delete all existing data!

## Next Steps

1. Start the development server: `npm run dev`
2. Login with any account (password: `test123`)
3. Explore module-specific features based on user role
4. Test cross-module functionality
5. Create additional test data as needed

---

**Last Updated**: January 2026
**Database**: PostgreSQL (local)
**Default Password**: test123
