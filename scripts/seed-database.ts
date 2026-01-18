import 'dotenv/config';
import bcrypt from 'bcrypt';
import { db, schema } from '../server/db.js';
import { eq } from 'drizzle-orm';

const SALT_ROUNDS = 10;
const DEFAULT_PASSWORD = 'test123';

async function seedDatabase() {
  console.log('🌱 Starting database seed...\n');

  try {
    // ============================================================================
    // 1. CREATE TERRITORIES
    // ============================================================================
    console.log('📍 Creating territories...');

    const territoriesData = [
      {
        name: 'Mid-Atlantic',
        region: 'East',
        description: 'Maryland, Virginia, and DC metro area',
        isActive: true,
      },
      {
        name: 'Northeast',
        region: 'North',
        description: 'Pennsylvania, New Jersey, Delaware',
        isActive: true,
      },
      {
        name: 'Southeast',
        region: 'South',
        description: 'North Carolina, South Carolina, Georgia',
        isActive: true,
      },
    ];

    const territories = await db
      .insert(schema.territories)
      .values(territoriesData)
      .onConflictDoNothing()
      .returning();

    console.log(`✅ Created ${territories.length} territories`);

    // ============================================================================
    // 2. CREATE TEAMS
    // ============================================================================
    console.log('\n👥 Creating teams...');

    const teamsData = [
      { name: 'Alpha Team', isActive: true },
      { name: 'Beta Team', isActive: true },
      { name: 'Gamma Team', isActive: true },
    ];

    const teams = await db
      .insert(schema.teams)
      .values(teamsData)
      .onConflictDoNothing()
      .returning();

    console.log(`✅ Created ${teams.length} teams`);

    // ============================================================================
    // 3. CREATE USERS
    // ============================================================================
    console.log('\n👤 Creating users...');

    const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, SALT_ROUNDS);

    // Check if admin already exists
    const existingAdmin = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, 'admin@roof-er.com'))
      .limit(1);

    if (existingAdmin.length === 0) {
      await db.insert(schema.users).values({
        email: 'admin@roof-er.com',
        username: 'admin',
        firstName: 'System',
        lastName: 'Admin',
        passwordHash,
        role: 'SYSTEM_ADMIN',
        hasHRAccess: true,
        hasLeaderboardAccess: true,
        hasTrainingAccess: true,
        hasFieldAccess: true,
        department: 'IT',
        position: 'System Administrator',
        employmentType: 'W2',
        hireDate: '2024-01-01',
        territoryId: territories[0]?.id,
        phone: '555-0100',
        timezone: 'America/New_York',
        isActive: true,
      });
      console.log('✅ Created SYSTEM_ADMIN: admin@roof-er.com');
    } else {
      console.log('⏭️  SYSTEM_ADMIN already exists: admin@roof-er.com');
    }

    // HR Admin
    const hrAdminData = {
      email: 'hr.admin@roof-er.com',
      username: 'hradmin',
      firstName: 'Sarah',
      lastName: 'Johnson',
      passwordHash,
      role: 'HR_ADMIN' as const,
      hasHRAccess: true,
      hasLeaderboardAccess: true,
      hasTrainingAccess: true,
      hasFieldAccess: false,
      department: 'Human Resources',
      position: 'HR Director',
      employmentType: 'W2' as const,
      hireDate: '2024-01-15',
      territoryId: territories[0]?.id,
      phone: '555-0101',
      timezone: 'America/New_York',
      isActive: true,
    };

    const [hrAdmin] = await db
      .insert(schema.users)
      .values(hrAdminData)
      .onConflictDoNothing()
      .returning();

    if (hrAdmin) {
      console.log('✅ Created HR_ADMIN: hr.admin@roof-er.com');
    }

    // Sales Reps
    const salesRepsData = [
      {
        email: 'john.sales@roof-er.com',
        username: 'johnsales',
        firstName: 'John',
        lastName: 'Martinez',
        passwordHash,
        role: 'SALES_REP' as const,
        hasHRAccess: false,
        hasLeaderboardAccess: true,
        hasTrainingAccess: true,
        hasFieldAccess: true,
        department: 'Sales',
        position: 'Senior Sales Representative',
        employmentType: 'W2' as const,
        hireDate: '2024-02-01',
        territoryId: territories[0]?.id,
        team: teams[0]?.name,
        phone: '555-0102',
        timezone: 'America/New_York',
        totalXp: 1500,
        currentLevel: 5,
        currentStreak: 7,
        longestStreak: 14,
        avatar: '🎯',
        division: 'insurance' as const,
        preferredState: 'VA' as const,
        isActive: true,
      },
      {
        email: 'emily.sales@roof-er.com',
        username: 'emilysales',
        firstName: 'Emily',
        lastName: 'Chen',
        passwordHash,
        role: 'SALES_REP' as const,
        hasHRAccess: false,
        hasLeaderboardAccess: true,
        hasTrainingAccess: true,
        hasFieldAccess: true,
        department: 'Sales',
        position: 'Sales Representative',
        employmentType: 'W2' as const,
        hireDate: '2024-03-01',
        territoryId: territories[1]?.id,
        team: teams[1]?.name,
        phone: '555-0103',
        timezone: 'America/New_York',
        totalXp: 2200,
        currentLevel: 7,
        currentStreak: 12,
        longestStreak: 20,
        avatar: '⭐',
        division: 'retail' as const,
        preferredState: 'PA' as const,
        isActive: true,
      },
    ];

    const insertedSalesReps = await db
      .insert(schema.users)
      .values(salesRepsData)
      .onConflictDoNothing()
      .returning();

    console.log(`✅ Created ${insertedSalesReps.length} SALES_REPs`);

    // Trainees
    const traineesData = [
      {
        email: 'mike.trainee@roof-er.com',
        username: 'miketrainee',
        firstName: 'Mike',
        lastName: 'Thompson',
        passwordHash,
        role: 'TRAINEE' as const,
        hasHRAccess: false,
        hasLeaderboardAccess: false,
        hasTrainingAccess: true,
        hasFieldAccess: false,
        department: 'Sales Training',
        position: 'Sales Trainee',
        employmentType: 'W2' as const,
        hireDate: '2024-11-01',
        territoryId: territories[0]?.id,
        team: teams[0]?.name,
        phone: '555-0104',
        timezone: 'America/New_York',
        totalXp: 300,
        currentLevel: 2,
        currentStreak: 3,
        longestStreak: 5,
        avatar: '🌱',
        division: 'insurance' as const,
        trainingLevel: 'beginner' as const,
        isActive: true,
      },
      {
        email: 'lisa.trainee@roof-er.com',
        username: 'lisatrainee',
        firstName: 'Lisa',
        lastName: 'Rodriguez',
        passwordHash,
        role: 'TRAINEE' as const,
        hasHRAccess: false,
        hasLeaderboardAccess: false,
        hasTrainingAccess: true,
        hasFieldAccess: false,
        department: 'Sales Training',
        position: 'Sales Trainee',
        employmentType: 'W2' as const,
        hireDate: '2024-11-15',
        territoryId: territories[1]?.id,
        team: teams[1]?.name,
        phone: '555-0105',
        timezone: 'America/New_York',
        totalXp: 450,
        currentLevel: 3,
        currentStreak: 5,
        longestStreak: 7,
        avatar: '🚀',
        division: 'retail' as const,
        trainingLevel: 'intermediate' as const,
        isActive: true,
      },
    ];

    const insertedTrainees = await db
      .insert(schema.users)
      .values(traineesData)
      .onConflictDoNothing()
      .returning();

    console.log(`✅ Created ${insertedTrainees.length} TRAINEEs`);

    // Field Tech
    const fieldTechData = {
      email: 'carlos.field@roof-er.com',
      username: 'carlosfield',
      firstName: 'Carlos',
      lastName: 'Rivera',
      passwordHash,
      role: 'FIELD_TECH' as const,
      hasHRAccess: false,
      hasLeaderboardAccess: false,
      hasTrainingAccess: true,
      hasFieldAccess: true,
      department: 'Field Operations',
      position: 'Field Technician',
      employmentType: '1099' as const,
      hireDate: '2024-04-01',
      territoryId: territories[2]?.id,
      phone: '555-0106',
      timezone: 'America/New_York',
      preferredState: 'MD' as const,
      preferredAiProvider: 'gemini' as const,
      totalXp: 800,
      currentLevel: 4,
      avatar: '🔧',
      isActive: true,
    };

    const [fieldTech] = await db
      .insert(schema.users)
      .values(fieldTechData)
      .onConflictDoNothing()
      .returning();

    if (fieldTech) {
      console.log('✅ Created FIELD_TECH: carlos.field@roof-er.com');
    }

    // Manager
    const managerData = {
      email: 'robert.manager@roof-er.com',
      username: 'robertmgr',
      firstName: 'Robert',
      lastName: 'Williams',
      passwordHash,
      role: 'MANAGER' as const,
      hasHRAccess: true,
      hasLeaderboardAccess: true,
      hasTrainingAccess: true,
      hasFieldAccess: false,
      department: 'Sales',
      position: 'Sales Manager',
      employmentType: 'W2' as const,
      hireDate: '2024-01-20',
      territoryId: territories[0]?.id,
      team: teams[0]?.name,
      phone: '555-0107',
      timezone: 'America/New_York',
      isActive: true,
    };

    const [manager] = await db
      .insert(schema.users)
      .values(managerData)
      .onConflictDoNothing()
      .returning();

    if (manager) {
      console.log('✅ Created MANAGER: robert.manager@roof-er.com');
    }

    // General Employee
    const employeeData = {
      email: 'jane.employee@roof-er.com',
      username: 'janeemp',
      firstName: 'Jane',
      lastName: 'Smith',
      passwordHash,
      role: 'EMPLOYEE' as const,
      hasHRAccess: false,
      hasLeaderboardAccess: false,
      hasTrainingAccess: true,
      hasFieldAccess: false,
      department: 'Operations',
      position: 'Operations Specialist',
      employmentType: 'W2' as const,
      hireDate: '2024-05-01',
      territoryId: territories[1]?.id,
      phone: '555-0108',
      timezone: 'America/New_York',
      totalXp: 600,
      currentLevel: 3,
      avatar: '💼',
      isActive: true,
    };

    const [employee] = await db
      .insert(schema.users)
      .values(employeeData)
      .onConflictDoNothing()
      .returning();

    if (employee) {
      console.log('✅ Created EMPLOYEE: jane.employee@roof-er.com');
    }

    // ============================================================================
    // 4. CREATE SALES_REPS (linked to sales rep users)
    // ============================================================================
    console.log('\n💼 Creating sales_reps records...');

    // Get the inserted sales rep users
    const salesRepUsers = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.role, 'SALES_REP'));

    const salesRepsRecords = salesRepUsers.map((user, index) => ({
      userId: user.id,
      name: `${user.firstName} ${user.lastName}`,
      email: user.email,
      team: user.team || teams[index % teams.length]?.name || 'Alpha Team',
      territoryId: user.territoryId,
      title: user.position || 'Sales Representative',
      avatar: user.avatar,
      monthlyRevenue: index === 0 ? '45000' : '38000',
      yearlyRevenue: index === 0 ? '420000' : '350000',
      allTimeRevenue: index === 0 ? '650000' : '480000',
      monthlySignups: index === 0 ? '12.5' : '10.0',
      yearlySignups: index === 0 ? '145.0' : '120.0',
      monthlyGrowth: index === 0 ? '15.5' : '12.0',
      goalProgress: index === 0 ? '112.5' : '95.0',
      monthlyRevenueGoal: '40000',
      yearlyRevenueGoal: '480000',
      currentBonusTier: index === 0 ? 3 : 2,
      isActive: true,
    }));

    const insertedSalesRepsRecords = await db
      .insert(schema.salesReps)
      .values(salesRepsRecords)
      .onConflictDoNothing()
      .returning();

    console.log(`✅ Created ${insertedSalesRepsRecords.length} sales_reps records`);

    // Update users with linkedSalesRepId
    for (let i = 0; i < salesRepUsers.length; i++) {
      const user = salesRepUsers[i];
      const salesRep = insertedSalesRepsRecords[i];
      if (user && salesRep) {
        await db
          .update(schema.users)
          .set({ linkedSalesRepId: salesRep.id })
          .where(eq(schema.users.id, user.id));
      }
    }

    console.log('✅ Linked sales_reps to users');

    // ============================================================================
    // 5. CREATE ACHIEVEMENTS
    // ============================================================================
    console.log('\n🏆 Creating achievements...');

    const achievementsData = [
      {
        name: 'First Steps',
        description: 'Complete your first training session',
        icon: '👣',
        xpReward: 100,
        requirement: 'Complete 1 training session',
        category: 'milestone' as const,
        isActive: true,
      },
      {
        name: 'Sales Rookie',
        description: 'Complete 10 training sessions',
        icon: '🌟',
        xpReward: 250,
        requirement: 'Complete 10 training sessions',
        category: 'milestone' as const,
        isActive: true,
      },
      {
        name: 'Training Champion',
        description: 'Complete 50 training sessions',
        icon: '🏅',
        xpReward: 500,
        requirement: 'Complete 50 training sessions',
        category: 'milestone' as const,
        isActive: true,
      },
      {
        name: 'Streak Starter',
        description: 'Maintain a 3-day practice streak',
        icon: '🔥',
        xpReward: 150,
        requirement: 'Practice for 3 consecutive days',
        category: 'streak' as const,
        isActive: true,
      },
      {
        name: 'Week Warrior',
        description: 'Maintain a 7-day practice streak',
        icon: '⚡',
        xpReward: 300,
        requirement: 'Practice for 7 consecutive days',
        category: 'streak' as const,
        isActive: true,
      },
      {
        name: 'Month Master',
        description: 'Maintain a 30-day practice streak',
        icon: '💎',
        xpReward: 1000,
        requirement: 'Practice for 30 consecutive days',
        category: 'streak' as const,
        isActive: true,
      },
      {
        name: 'Roleplay Pro',
        description: 'Complete 25 roleplay sessions',
        icon: '🎭',
        xpReward: 400,
        requirement: 'Complete 25 roleplay sessions',
        category: 'roleplay' as const,
        isActive: true,
      },
      {
        name: 'Curriculum Complete',
        description: 'Complete all curriculum modules',
        icon: '📚',
        xpReward: 750,
        requirement: 'Complete all available modules',
        category: 'curriculum' as const,
        isActive: true,
      },
      {
        name: 'Perfect Score',
        description: 'Achieve 100% on any training session',
        icon: '💯',
        xpReward: 200,
        requirement: 'Score 100% on a training session',
        category: 'milestone' as const,
        isActive: true,
      },
      {
        name: 'Elite Performance',
        description: 'Reach level 10',
        icon: '👑',
        xpReward: 1500,
        requirement: 'Reach experience level 10',
        category: 'milestone' as const,
        isActive: true,
      },
    ];

    const insertedAchievements = await db
      .insert(schema.achievements)
      .values(achievementsData)
      .onConflictDoNothing()
      .returning();

    console.log(`✅ Created ${insertedAchievements.length} achievements`);

    // Award some achievements to users
    const allUsers = await db.select().from(schema.users);
    const firstStepsAchievement = insertedAchievements.find(a => a.name === 'First Steps');
    const streakStarterAchievement = insertedAchievements.find(a => a.name === 'Streak Starter');

    if (firstStepsAchievement && allUsers.length > 0) {
      // Give "First Steps" to all users with XP > 0
      const userAchievementsData = allUsers
        .filter(u => u.totalXp > 0)
        .map(u => ({
          userId: u.id,
          achievementId: firstStepsAchievement.id,
        }));

      if (userAchievementsData.length > 0) {
        await db
          .insert(schema.userAchievements)
          .values(userAchievementsData)
          .onConflictDoNothing();
        console.log(`✅ Awarded "First Steps" to ${userAchievementsData.length} users`);
      }
    }

    if (streakStarterAchievement && allUsers.length > 0) {
      // Give "Streak Starter" to users with streak >= 3
      const userAchievementsData = allUsers
        .filter(u => u.currentStreak >= 3)
        .map(u => ({
          userId: u.id,
          achievementId: streakStarterAchievement.id,
        }));

      if (userAchievementsData.length > 0) {
        await db
          .insert(schema.userAchievements)
          .values(userAchievementsData)
          .onConflictDoNothing();
        console.log(`✅ Awarded "Streak Starter" to ${userAchievementsData.length} users`);
      }
    }

    // ============================================================================
    // 6. CREATE CONTESTS
    // ============================================================================
    console.log('\n🏁 Creating contests...');

    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const nextMonthEnd = new Date(now.getFullYear(), now.getMonth() + 2, 0);

    const contestsData = [
      {
        title: 'January Revenue Challenge',
        description: 'Top revenue generator wins a bonus and recognition',
        startDate: thisMonthStart,
        endDate: thisMonthEnd,
        contestType: 'revenue' as const,
        participantType: 'individual' as const,
        status: 'active' as const,
        prizes: ['$1000 bonus', 'Employee of the Month', 'Premium parking spot'],
        rules: 'Highest total revenue in January wins. Must maintain 90%+ customer satisfaction rating.',
      },
      {
        title: 'Team Signup Sprint',
        description: 'Team competition for most new customer signups',
        startDate: nextMonthStart,
        endDate: nextMonthEnd,
        contestType: 'signups' as const,
        participantType: 'team' as const,
        status: 'upcoming' as const,
        prizes: ['Team lunch outing', 'Team trophy', '$500 team bonus'],
        rules: 'Teams compete for most signups. Each verified signup counts as 1 point.',
      },
    ];

    const insertedContests = await db
      .insert(schema.contests)
      .values(contestsData)
      .onConflictDoNothing()
      .returning();

    console.log(`✅ Created ${insertedContests.length} contests`);

    // Add participants to active contest
    const activeContest = insertedContests.find(c => c.status === 'active');
    if (activeContest && insertedSalesRepsRecords.length > 0) {
      const participantsData = insertedSalesRepsRecords.map((salesRep, index) => ({
        contestId: activeContest.id,
        salesRepId: salesRep.id,
        score: index === 0 ? '45000' : '38000',
        rank: index + 1,
      }));

      const insertedParticipants = await db
        .insert(schema.contestParticipants)
        .values(participantsData)
        .onConflictDoNothing()
        .returning();

      console.log(`✅ Added ${insertedParticipants.length} participants to active contest`);
    }

    // ============================================================================
    // SUMMARY
    // ============================================================================
    console.log('\n' + '='.repeat(60));
    console.log('✨ DATABASE SEED COMPLETE! ✨');
    console.log('='.repeat(60));
    console.log('\n📊 Summary:');
    console.log(`   - Territories: ${territories.length}`);
    console.log(`   - Teams: ${teams.length}`);
    console.log(`   - Users: 8+ (including existing admin)`);
    console.log(`   - Sales Reps: ${insertedSalesRepsRecords.length}`);
    console.log(`   - Achievements: ${insertedAchievements.length}`);
    console.log(`   - Contests: ${insertedContests.length}`);

    console.log('\n🔐 Login Credentials (all users):');
    console.log('   Password: test123\n');

    console.log('👥 User Accounts Created:');
    console.log('   1. admin@roof-er.com (SYSTEM_ADMIN) - Full access');
    console.log('   2. hr.admin@roof-er.com (HR_ADMIN) - HR + Leaderboard');
    console.log('   3. john.sales@roof-er.com (SALES_REP) - Leaderboard + Training + Field');
    console.log('   4. emily.sales@roof-er.com (SALES_REP) - Leaderboard + Training + Field');
    console.log('   5. mike.trainee@roof-er.com (TRAINEE) - Training only');
    console.log('   6. lisa.trainee@roof-er.com (TRAINEE) - Training only');
    console.log('   7. carlos.field@roof-er.com (FIELD_TECH) - Field + Training');
    console.log('   8. robert.manager@roof-er.com (MANAGER) - HR + Leaderboard + Training');
    console.log('   9. jane.employee@roof-er.com (EMPLOYEE) - Training only');

    console.log('\n🎯 Next Steps:');
    console.log('   1. Start the development server: npm run dev');
    console.log('   2. Login with any of the accounts above');
    console.log('   3. Explore different modules based on user roles');
    console.log('   4. Check the leaderboard, training, and HR features\n');

  } catch (error) {
    console.error('\n❌ Error seeding database:', error);
    throw error;
  }
}

// Run the seed function
seedDatabase()
  .then(() => {
    console.log('✅ Seed completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  });
