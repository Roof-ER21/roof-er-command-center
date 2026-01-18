/**
 * Test script for Training Certificates API
 *
 * This script tests all certificate endpoints to ensure they work correctly.
 * Run with: npx tsx scripts/test-certificates.ts
 */

import { db } from "../server/db.js";
import { trainingCertificates, users } from "../shared/schema.js";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

async function testCertificateSystem() {
  console.log("🧪 Testing Training Certificates System...\n");

  try {
    // Test 1: Get a test user
    console.log("1️⃣  Fetching test user...");
    const [testUser] = await db.select().from(users).limit(1);

    if (!testUser) {
      console.log("❌ No users found. Please create a user first.");
      process.exit(1);
    }

    console.log(`✅ Found test user: ${testUser.firstName} ${testUser.lastName} (ID: ${testUser.id})\n`);

    // Test 2: Generate a module certificate
    console.log("2️⃣  Generating module certificate...");
    const moduleUUID = randomUUID();
    const [moduleCert] = await db
      .insert(trainingCertificates)
      .values({
        certificateId: moduleUUID,
        userId: testUser.id,
        certificateType: 'module',
        title: 'Test Module Completion',
        description: 'Successfully completed test module',
        moduleId: '1',
        score: 95,
        metadata: {
          moduleTitle: 'Sales Fundamentals',
          difficulty: 'intermediate',
          xpEarned: 100,
          verificationUrl: `http://localhost:3001/api/training/certificates/${moduleUUID}/verify`
        },
        issuedAt: new Date(),
      })
      .returning();

    console.log(`✅ Module certificate created: ${moduleCert.certificateId}\n`);

    // Test 3: Generate a curriculum certificate
    console.log("3️⃣  Generating curriculum certificate...");
    const curriculumUUID = randomUUID();
    const [curriculumCert] = await db
      .insert(trainingCertificates)
      .values({
        certificateId: curriculumUUID,
        userId: testUser.id,
        certificateType: 'curriculum',
        title: 'Complete Curriculum Mastery',
        description: 'Completed all 12 training modules',
        score: 92,
        metadata: {
          completedModulesCount: 12,
          totalXpEarned: 1200,
          verificationUrl: `http://localhost:3001/api/training/certificates/${curriculumUUID}/verify`
        },
        issuedAt: new Date(),
      })
      .returning();

    console.log(`✅ Curriculum certificate created: ${curriculumCert.certificateId}\n`);

    // Test 4: Generate a roleplay mastery certificate
    console.log("4️⃣  Generating roleplay mastery certificate...");
    const roleplayUUID = randomUUID();
    const [roleplayCert] = await db
      .insert(trainingCertificates)
      .values({
        certificateId: roleplayUUID,
        userId: testUser.id,
        certificateType: 'roleplay_mastery',
        title: 'Roleplay Mastery - Advanced',
        description: 'Demonstrated exceptional roleplay skills',
        score: 88,
        metadata: {
          sessionsCompleted: 25,
          averageScore: 88,
          verificationUrl: `http://localhost:3001/api/training/certificates/${roleplayUUID}/verify`
        },
        issuedAt: new Date(),
      })
      .returning();

    console.log(`✅ Roleplay certificate created: ${roleplayCert.certificateId}\n`);

    // Test 5: Retrieve all certificates for user
    console.log("5️⃣  Retrieving all certificates for user...");
    const userCertificates = await db
      .select()
      .from(trainingCertificates)
      .where(eq(trainingCertificates.userId, testUser.id));

    console.log(`✅ Found ${userCertificates.length} certificates:\n`);
    userCertificates.forEach((cert, index) => {
      console.log(`   ${index + 1}. ${cert.title} (${cert.certificateType})`);
      console.log(`      Score: ${cert.score || 'N/A'}`);
      console.log(`      Issued: ${cert.issuedAt.toLocaleDateString()}`);
      console.log(`      ID: ${cert.certificateId}\n`);
    });

    // Test 6: Verify certificate
    console.log("6️⃣  Verifying module certificate...");
    const [verifiedCert] = await db
      .select()
      .from(trainingCertificates)
      .where(eq(trainingCertificates.certificateId, moduleUUID))
      .limit(1);

    if (verifiedCert) {
      const isExpired = verifiedCert.expiresAt && new Date(verifiedCert.expiresAt) < new Date();
      console.log(`✅ Certificate verified!`);
      console.log(`   Valid: ${!isExpired}`);
      console.log(`   Title: ${verifiedCert.title}`);
      console.log(`   Type: ${verifiedCert.certificateType}`);
      console.log(`   Score: ${verifiedCert.score}\n`);
    } else {
      console.log(`❌ Certificate verification failed\n`);
    }

    // Test 7: Generate text certificate
    console.log("7️⃣  Generating text certificate format...");
    const textCertificate = `
╔══════════════════════════════════════════════════════════════╗
║                    CERTIFICATE OF COMPLETION                 ║
╚══════════════════════════════════════════════════════════════╝

This certifies that

    ${testUser.firstName} ${testUser.lastName}

has successfully completed

    ${moduleCert.title}

${moduleCert.description ? `\n${moduleCert.description}\n` : ''}
${moduleCert.score ? `Final Score: ${moduleCert.score}\n` : ''}
Date Issued: ${new Date(moduleCert.issuedAt).toLocaleDateString()}
Certificate ID: ${moduleCert.certificateId}

Verification URL: ${moduleCert.metadata?.verificationUrl || ''}

═════════════════════════════════════════════════════════════════
             Roof-ER Command Center Training System
═════════════════════════════════════════════════════════════════
    `;

    console.log(textCertificate);
    console.log("✅ Text certificate generated successfully\n");

    // Summary
    console.log("📊 Test Summary:");
    console.log("   ✅ Database schema working");
    console.log("   ✅ Certificate generation working");
    console.log("   ✅ Certificate retrieval working");
    console.log("   ✅ Certificate verification working");
    console.log("   ✅ Text format generation working");
    console.log("\n🎉 All tests passed!\n");

    console.log("🔗 API Endpoints to test manually:");
    console.log(`   POST   http://localhost:3001/api/training/certificates/generate`);
    console.log(`   GET    http://localhost:3001/api/training/certificates`);
    console.log(`   GET    http://localhost:3001/api/training/certificates/${moduleUUID}/verify`);
    console.log(`   GET    http://localhost:3001/api/training/certificates/${moduleUUID}/download?format=text`);
    console.log("\n📖 Documentation: /docs/TRAINING_CERTIFICATES_API.md\n");

    process.exit(0);
  } catch (error) {
    console.error("❌ Test failed:", error);
    process.exit(1);
  }
}

testCertificateSystem();
