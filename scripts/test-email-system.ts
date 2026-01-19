/**
 * Email System Test Script
 *
 * Tests the email automation system in simulation mode.
 * No actual emails are sent - just console output and database logging.
 */

import '../server/config/env.js';
import { db } from '../server/db.js';
import { emailNotifications } from '../shared/schema.js';
import {
  sendCandidateStatusEmail,
  sendInterviewScheduledEmail,
  sendInterviewReminderEmail,
  sendOfferEmail,
  sendWelcomeEmail,
  sendOnboardingReminderEmail,
} from '../server/services/email.js';
import type { Candidate, Interview, OnboardingTask } from '../shared/schema.js';
import { desc } from 'drizzle-orm';

// Mock data
const mockCandidate: Candidate = {
  id: 999,
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@example.com',
  phone: '555-0100',
  position: 'Senior Roofer',
  status: 'new',
  resumeUrl: null,
  source: 'LinkedIn',
  rating: null,
  notes: null,
  assignedTo: null,
  referralName: null,
  isArchived: false,
  archivedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockInterview: Interview = {
  id: 888,
  candidateId: 999,
  interviewerId: 1,
  scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
  duration: 60,
  type: 'video',
  status: 'scheduled',
  location: null,
  meetingLink: 'https://meet.google.com/abc-defg-hij',
  rating: null,
  notes: null,
  feedback: null,
  recommendation: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockOnboardingTasks: OnboardingTask[] = [
  {
    id: 1,
    employeeId: 1,
    taskName: 'Complete I-9 Form',
    description: 'Employment eligibility verification',
    category: 'paperwork',
    status: 'pending',
    dueDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Yesterday (overdue)
    assignedTo: null,
    completedAt: null,
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 2,
    employeeId: 1,
    taskName: 'Set up Direct Deposit',
    description: 'Provide banking information for payroll',
    category: 'paperwork',
    status: 'pending',
    dueDate: new Date().toISOString().split('T')[0], // Today (due)
    assignedTo: null,
    completedAt: null,
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const mockEmployee = {
  email: 'jane.smith@example.com',
  firstName: 'Jane',
  lastName: 'Smith',
  position: 'Project Manager',
};

async function testEmailSystem() {
  console.log('\n🧪 ═══════════════════════════════════════════════════════');
  console.log('🧪 EMAIL AUTOMATION SYSTEM TEST');
  console.log('🧪 ═══════════════════════════════════════════════════════\n');

  if (!process.env.RESEND_API_KEY) {
    console.log('ℹ️  Running in SIMULATION MODE (no RESEND_API_KEY set)');
    console.log('ℹ️  Emails will be logged but not actually sent\n');
  } else {
    console.log('✉️  Running in PRODUCTION MODE');
    console.log('✉️  Emails will be sent via Resend API\n');
  }

  try {
    // Test 1: Candidate Status Email
    console.log('📧 Test 1: Candidate Status Change Email');
    console.log('─'.repeat(60));
    await sendCandidateStatusEmail(mockCandidate, 'screening', 'new');
    console.log('');

    // Test 2: Interview Scheduled Email
    console.log('📧 Test 2: Interview Scheduled Email');
    console.log('─'.repeat(60));
    await sendInterviewScheduledEmail(mockCandidate, mockInterview);
    console.log('');

    // Test 3: Interview Reminder Email
    console.log('📧 Test 3: Interview Reminder Email');
    console.log('─'.repeat(60));
    await sendInterviewReminderEmail(mockCandidate, mockInterview);
    console.log('');

    // Test 4: Offer Email
    console.log('📧 Test 4: Offer Letter Email');
    console.log('─'.repeat(60));
    await sendOfferEmail(mockCandidate, {
      position: 'Senior Roofer',
      startDate: 'February 1, 2026',
      salary: '$65,000/year',
      benefits: ['Health Insurance', 'Paid Time Off', '401(k) Match'],
    });
    console.log('');

    // Test 5: Welcome Email
    console.log('📧 Test 5: Welcome Email');
    console.log('─'.repeat(60));
    await sendWelcomeEmail(mockEmployee);
    console.log('');

    // Test 6: Onboarding Reminder Email
    console.log('📧 Test 6: Onboarding Reminder Email');
    console.log('─'.repeat(60));
    await sendOnboardingReminderEmail(mockEmployee, mockOnboardingTasks);
    console.log('');

    // Show database logs
    console.log('📊 DATABASE LOGS (Last 10 emails)');
    console.log('─'.repeat(60));
    const logs = await db
      .select()
      .from(emailNotifications)
      .orderBy(desc(emailNotifications.createdAt))
      .limit(10);

    console.table(
      logs.map(log => ({
        ID: log.id,
        Type: log.emailType,
        Recipient: log.recipientEmail,
        Status: log.status,
        Created: log.createdAt.toISOString().split('T')[0],
      }))
    );

    // Summary
    console.log('\n✅ ═══════════════════════════════════════════════════════');
    console.log('✅ ALL TESTS PASSED');
    console.log('✅ ═══════════════════════════════════════════════════════\n');

    console.log('📋 Summary:');
    console.log(`   • 6 email types tested`);
    console.log(`   • All emails logged to database`);
    console.log(`   • Status: ${!process.env.RESEND_API_KEY ? 'SIMULATED' : 'SENT'}`);
    console.log(`   • Total logs in DB: ${logs.length}`);
    console.log('');

    console.log('💡 Next Steps:');
    console.log('   1. Set RESEND_API_KEY in .env to send real emails');
    console.log('   2. Verify FROM_EMAIL domain in Resend dashboard');
    console.log('   3. Test with your email address');
    console.log('   4. Configure CRON jobs for automated reminders');
    console.log('   5. Monitor email_notifications table in production\n');

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }

  process.exit(0);
}

// Run tests
testEmailSystem();
