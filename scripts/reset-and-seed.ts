import 'dotenv/config';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function resetAndSeed() {
  console.log('🔄 Starting database reset and seed process...\n');

  try {
    // Step 1: Push schema (this will recreate tables)
    console.log('📋 Step 1: Pushing schema to database...');
    console.log('⚠️  This will drop and recreate all tables!');
    console.log('⏳ Running: npm run db:push\n');

    const { stdout: pushStdout, stderr: pushStderr } = await execAsync('npm run db:push');

    if (pushStderr && !pushStderr.includes('drizzle-kit')) {
      console.error('Push stderr:', pushStderr);
    }

    console.log('✅ Schema pushed successfully\n');

    // Step 2: Run seed script
    console.log('📋 Step 2: Seeding database with sample data...');
    console.log('⏳ Running: npm run db:seed\n');

    const { stdout: seedStdout } = await execAsync('npm run db:seed');
    console.log(seedStdout);

    console.log('\n' + '='.repeat(60));
    console.log('✨ DATABASE RESET AND SEED COMPLETE! ✨');
    console.log('='.repeat(60));
    console.log('\n🎯 Next Steps:');
    console.log('   1. Start the development server: npm run dev');
    console.log('   2. Login with any seeded account');
    console.log('   3. Password for all accounts: test123\n');
    console.log('📖 See scripts/SEED_DATA_REFERENCE.md for full details\n');

  } catch (error) {
    console.error('\n❌ Error during reset and seed:', error);
    throw error;
  }
}

// Run the reset and seed
resetAndSeed()
  .then(() => {
    console.log('✅ Reset and seed completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Reset and seed failed:', error);
    process.exit(1);
  });
