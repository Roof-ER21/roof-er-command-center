import { db } from '../db.js';
import {
  interviews,
  candidates,
  users,
  candidateNotes,
} from '../../shared/schema.js';
import { eq, and, lt } from 'drizzle-orm';
import { executeStatusAutomation } from '../services/candidate-status-automation.js';
import { sendEmail } from '../services/email.js';

/**
 * Interview Overdue Job
 *
 * Runs daily at 10:00 AM to check for overdue interviews
 * and take automated actions based on how long they're overdue:
 *
 * - 1+ days: Send reminder to interviewer
 * - 3+ days: Escalation email to HR
 * - 7+ days: Auto mark as NO_SHOW and move candidate to DEAD
 */

interface OverdueInterview {
  interview: any;
  candidate: any;
  interviewer: any;
  daysSince: number;
}

/**
 * Main function - runs daily
 */
export async function checkOverdueInterviews(): Promise<void> {
  console.log('🔍 Checking for overdue interviews...');
  const now = new Date();

  try {
    // Find interviews that are SCHEDULED but in the past
    const overdueInterviews = await db.select({
      interview: interviews,
      candidate: candidates,
      interviewer: users,
    })
      .from(interviews)
      .leftJoin(candidates, eq(interviews.candidateId, candidates.id))
      .leftJoin(users, eq(interviews.interviewerId, users.id))
      .where(and(
        eq(interviews.status, 'scheduled'),
        lt(interviews.scheduledAt, now)
      ));

    console.log(`📊 Found ${overdueInterviews.length} overdue interviews`);

    if (overdueInterviews.length === 0) {
      console.log('✅ No overdue interviews found');
      return;
    }

    // Process each overdue interview
    for (const row of overdueInterviews) {
      const interview = row.interview;
      const candidate = row.candidate;
      const interviewer = row.interviewer;

      if (!interview || !candidate) continue;

      const daysSince = Math.floor(
        (now.getTime() - new Date(interview.scheduledAt).getTime()) / (1000 * 60 * 60 * 24)
      );

      await processOverdueInterview({
        interview,
        candidate,
        interviewer,
        daysSince,
      });
    }

    console.log('✅ Overdue interview check complete');

  } catch (error) {
    console.error('❌ Interview overdue job failed:', error);
    throw error;
  }
}

/**
 * Process a single overdue interview
 */
async function processOverdueInterview(data: OverdueInterview): Promise<void> {
  const { interview, candidate, interviewer, daysSince } = data;

  console.log(`⏰ Processing overdue interview #${interview.id} (${daysSince} days overdue)`);
  console.log(`   Candidate: ${candidate.firstName} ${candidate.lastName}`);
  console.log(`   Scheduled: ${new Date(interview.scheduledAt).toLocaleString()}`);

  if (daysSince >= 7) {
    // 7+ days: Auto NO_SHOW
    await handleAutoNoShow(interview, candidate);
  } else if (daysSince >= 3) {
    // 3+ days: Escalation to HR
    await sendEscalationEmail(interview, candidate, interviewer);
  } else if (daysSince >= 1) {
    // 1+ days: Reminder to interviewer
    await sendFeedbackReminder(interview, candidate, interviewer);
  }
}

/**
 * Auto mark as NO_SHOW and move to DEAD (7+ days overdue)
 */
async function handleAutoNoShow(interview: any, candidate: any): Promise<void> {
  console.log(`🚨 Auto NO_SHOW: Interview #${interview.id} (7+ days overdue)`);

  try {
    // Update interview status
    await db.update(interviews)
      .set({
        status: 'no_show',
        notes: `Auto marked as NO_SHOW after 7 days overdue (${new Date().toLocaleDateString()})`,
        updatedAt: new Date(),
      })
      .where(eq(interviews.id, interview.id));

    // Update candidate status to DEAD
    await db.update(candidates)
      .set({
        status: 'DEAD_BY_CANDIDATE',
        updatedAt: new Date(),
      })
      .where(eq(candidates.id, candidate.id));

    // Execute NO_SHOW automation (tags, notes, emails)
    await executeStatusAutomation({
      candidateId: candidate.id,
      newStatus: 'NO_SHOW',
      oldStatus: candidate.status,
      interviewId: interview.id,
      reason: 'DEAD_BY_CANDIDATE',
    });

    // Create system note
    await db.insert(candidateNotes).values({
      candidateId: candidate.id,
      authorId: 1, // System user
      content: `Automatically moved to DEAD due to interview no-show (7+ days overdue). Interview #${interview.id} scheduled for ${new Date(interview.scheduledAt).toLocaleDateString()}.`,
      type: 'SYSTEM',
    });

    console.log(`✅ Interview #${interview.id} marked as NO_SHOW, candidate moved to DEAD`);

  } catch (error) {
    console.error(`❌ Failed to process auto NO_SHOW for interview #${interview.id}:`, error);
    throw error;
  }
}

/**
 * Send escalation email to HR (3+ days overdue)
 */
async function sendEscalationEmail(
  interview: any,
  candidate: any,
  interviewer: any
): Promise<void> {
  console.log(`⚠️  Escalation: Interview #${interview.id} (3+ days overdue)`);

  // Get HR admins
  const hrAdmins = await db.select().from(users)
    .where(eq(users.hasHRAccess, true));

  if (hrAdmins.length === 0) {
    console.warn('⚠️  No HR admins found for escalation email');
    return;
  }

  const daysSince = Math.floor(
    (new Date().getTime() - new Date(interview.scheduledAt).getTime()) / (1000 * 60 * 60 * 24)
  );

  const subject = `🚨 Overdue Interview: ${candidate.firstName} ${candidate.lastName} (${daysSince} days)`;
  const html = `
    <!DOCTYPE html>
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2 style="color: #dc2626;">Overdue Interview Alert</h2>
        <p>An interview has been overdue for <strong>${daysSince} days</strong> and requires immediate attention.</p>

        <div style="background: #fef2f2; padding: 15px; border-left: 4px solid #dc2626; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0;">Interview Details</h3>
          <p style="margin: 5px 0;"><strong>Candidate:</strong> ${candidate.firstName} ${candidate.lastName}</p>
          <p style="margin: 5px 0;"><strong>Position:</strong> ${candidate.position || 'Not specified'}</p>
          <p style="margin: 5px 0;"><strong>Scheduled:</strong> ${new Date(interview.scheduledAt).toLocaleString()}</p>
          <p style="margin: 5px 0;"><strong>Interviewer:</strong> ${interviewer ? `${interviewer.firstName} ${interviewer.lastName}` : 'Not assigned'}</p>
          <p style="margin: 5px 0;"><strong>Type:</strong> ${interview.type || 'Not specified'}</p>
        </div>

        <p><strong>Action Required:</strong></p>
        <ul>
          <li>Follow up with interviewer for feedback</li>
          <li>Update interview status in the system</li>
          <li>In ${7 - daysSince} day${7 - daysSince !== 1 ? 's' : ''}, this will be auto-marked as NO_SHOW</li>
        </ul>

        <p>Please log into the HR Command Center to take action.</p>

        <p style="color: #666; font-size: 12px; margin-top: 30px;">
          This is an automated escalation from the HR Automation System.
        </p>
      </body>
    </html>
  `;

  // Send to all HR admins
  for (const admin of hrAdmins) {
    try {
      // Note: Using console.log since we need to implement the actual email sending
      console.log(`📧 Escalation email would be sent to: ${admin.email}`);
      console.log(`   Subject: ${subject}`);
    } catch (error) {
      console.error(`Failed to send escalation email to ${admin.email}:`, error);
    }
  }
}

/**
 * Send feedback reminder to interviewer (1+ day overdue)
 */
async function sendFeedbackReminder(
  interview: any,
  candidate: any,
  interviewer: any
): Promise<void> {
  if (!interviewer) {
    console.log(`⚠️  No interviewer assigned for interview #${interview.id} - skipping reminder`);
    return;
  }

  console.log(`📧 Sending feedback reminder to ${interviewer.email}`);

  const subject = `Reminder: Interview Feedback Needed - ${candidate.firstName} ${candidate.lastName}`;
  const html = `
    <!DOCTYPE html>
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2 style="color: #f59e0b;">Interview Feedback Reminder</h2>
        <p>Hi ${interviewer.firstName},</p>

        <p>This is a friendly reminder to submit feedback for the following interview:</p>

        <div style="background: #fef3c7; padding: 15px; border-left: 4px solid #f59e0b; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>Candidate:</strong> ${candidate.firstName} ${candidate.lastName}</p>
          <p style="margin: 5px 0;"><strong>Position:</strong> ${candidate.position || 'Not specified'}</p>
          <p style="margin: 5px 0;"><strong>Interview Date:</strong> ${new Date(interview.scheduledAt).toLocaleString()}</p>
          <p style="margin: 5px 0;"><strong>Type:</strong> ${interview.type || 'Video'}</p>
        </div>

        <p>Please log into the HR Command Center to submit your feedback and recommendation.</p>

        <p style="background: #dbeafe; padding: 10px; border-radius: 4px;">
          <strong>Note:</strong> If the interview did not take place, please update the status accordingly.
        </p>

        <p>Thank you!</p>

        <p style="color: #666; font-size: 12px; margin-top: 30px;">
          This is an automated reminder from the HR Automation System.
        </p>
      </body>
    </html>
  `;

  try {
    console.log(`📧 Feedback reminder would be sent to: ${interviewer.email}`);
    console.log(`   Subject: ${subject}`);
    // TODO: Implement actual email sending
  } catch (error) {
    console.error(`Failed to send feedback reminder to ${interviewer.email}:`, error);
  }
}

/**
 * Schedule this job to run daily at 10:00 AM
 * Add to your cron scheduler (e.g., node-cron, Bull, etc.)
 */
export function scheduleInterviewOverdueJob() {
  // Example with node-cron (install with: npm install node-cron @types/node-cron)
  // const cron = require('node-cron');
  //
  // cron.schedule('0 10 * * *', () => {
  //   console.log('🕐 Running interview overdue job...');
  //   checkOverdueInterviews().catch(console.error);
  // });

  console.log('📅 Interview overdue job scheduler not yet implemented');
  console.log('   Add to your cron system to run daily at 10:00 AM');
  console.log('   Cron expression: 0 10 * * *');
}

export default {
  checkOverdueInterviews,
  scheduleInterviewOverdueJob,
};
