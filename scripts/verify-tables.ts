import 'dotenv/config';
import { db, schema } from '../server/db.js';

async function verifyTables() {
  console.log('🔍 Verifying database tables...\n');

  try {
    // Check Training Module tables
    const modules = await db.select().from(schema.trainingModules);
    console.log(`✅ Training Modules: ${modules.length}`);

    const progress = await db.select().from(schema.trainingProgress);
    console.log(`✅ Training Progress: ${progress.length}`);

    const roleplay = await db.select().from(schema.roleplaySessions);
    console.log(`✅ Roleplay Sessions: ${roleplay.length}`);

    // Check HR tables
    const onboarding = await db.select().from(schema.onboardingTasks);
    console.log(`✅ Onboarding Tasks: ${onboarding.length}`);

    const interviews = await db.select().from(schema.interviews);
    console.log(`✅ Interviews: ${interviews.length}`);

    const candidates = await db.select().from(schema.candidates);
    console.log(`✅ Candidates: ${candidates.length}`);

    console.log('\n✨ All new tables verified successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error verifying tables:', error);
    process.exit(1);
  }
}

verifyTables();
