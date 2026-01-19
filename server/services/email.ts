import { Resend } from 'resend';
import { db } from '../db.js';
import { emailNotifications, candidates, interviews } from '../../shared/schema.js';
import type { Candidate, Interview, OnboardingTask } from '../../shared/schema.js';
import { eq } from 'drizzle-orm';
import {
  candidateStatusChangeTemplate,
  interviewScheduledTemplate,
  interviewReminderTemplate,
  offerLetterTemplate,
} from './email-templates.js';

/**
 * Email Service using Resend API
 *
 * Handles all email sending operations for the recruiting automation system.
 * Logs all emails to the database for tracking and auditing.
 */

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@roofer.com';

// Initialize Resend (with fallback for missing API key)
let resend: Resend | null = null;
if (RESEND_API_KEY) {
  resend = new Resend(RESEND_API_KEY);
} else {
  console.warn('⚠️  RESEND_API_KEY not set - email service will run in simulation mode');
}

interface EmailMetadata {
  candidateId?: number;
  interviewId?: number;
  onboardingTaskId?: number;
  [key: string]: any;
}

interface OfferDetails {
  position: string;
  startDate?: string;
  salary?: string;
  benefits?: string[];
}

/**
 * Base function to send email and log to database
 */
async function sendEmail(
  recipientEmail: string,
  recipientName: string | null,
  subject: string,
  html: string,
  text: string,
  emailType: 'candidate_status' | 'interview_scheduled' | 'interview_reminder' | 'offer_sent' | 'welcome' | 'onboarding_reminder',
  metadata: EmailMetadata
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    // Log email to database first (as pending)
    const [notification] = await db.insert(emailNotifications).values({
      recipientEmail,
      recipientName,
      subject,
      emailType,
      status: 'pending',
      metadata,
    }).returning();

    // If no Resend API key, simulate sending
    if (!resend) {
      console.log(`📧 [SIMULATED] Email to ${recipientEmail}: ${subject}`);
      console.log(`   Type: ${emailType}`);
      console.log(`   Metadata:`, metadata);

      // Update as "sent" in simulation mode
      await db.update(emailNotifications)
        .set({
          status: 'sent',
          sentAt: new Date(),
        })
        .where(eq(emailNotifications.id, notification.id));

      return { success: true, messageId: `simulated-${notification.id}` };
    }

    // Send email via Resend
    const response = await resend.emails.send({
      from: FROM_EMAIL,
      to: recipientEmail,
      subject,
      html,
      text,
    });

    // Handle Resend API response
    if (response.error) {
      throw new Error(response.error.message);
    }

    // Update database with success
    await db.update(emailNotifications)
      .set({
        status: 'sent',
        sentAt: new Date(),
      })
      .where(eq(emailNotifications.id, notification.id));

    console.log(`✅ Email sent to ${recipientEmail}: ${subject} (ID: ${response.data?.id})`);
    return { success: true, messageId: response.data?.id };

  } catch (error: any) {
    console.error(`❌ Failed to send email to ${recipientEmail}:`, error);

    // Log error to database
    try {
      await db.insert(emailNotifications).values({
        recipientEmail,
        recipientName,
        subject,
        emailType,
        status: 'failed',
        errorMessage: error.message || 'Unknown error',
        metadata,
      });
    } catch (dbError) {
      console.error('Failed to log email error to database:', dbError);
    }

    return { success: false, error: error.message };
  }
}

/**
 * Send candidate status change email
 */
export async function sendCandidateStatusEmail(
  candidate: Candidate,
  newStatus: string,
  oldStatus: string
): Promise<{ success: boolean; error?: string }> {
  const { subject, html, text } = candidateStatusChangeTemplate(candidate, newStatus, oldStatus);

  return sendEmail(
    candidate.email,
    `${candidate.firstName} ${candidate.lastName}`,
    subject,
    html,
    text,
    'candidate_status',
    {
      candidateId: candidate.id,
      newStatus,
      oldStatus,
    }
  );
}

/**
 * Send interview scheduled email
 */
export async function sendInterviewScheduledEmail(
  candidate: Candidate,
  interview: Interview
): Promise<{ success: boolean; error?: string }> {
  const { subject, html, text } = interviewScheduledTemplate(candidate, interview);

  return sendEmail(
    candidate.email,
    `${candidate.firstName} ${candidate.lastName}`,
    subject,
    html,
    text,
    'interview_scheduled',
    {
      candidateId: candidate.id,
      interviewId: interview.id,
      scheduledAt: interview.scheduledAt.toISOString(),
    }
  );
}

/**
 * Send interview reminder email (24 hours before)
 */
export async function sendInterviewReminderEmail(
  candidate: Candidate,
  interview: Interview
): Promise<{ success: boolean; error?: string }> {
  const { subject, html, text } = interviewReminderTemplate(candidate, interview);

  return sendEmail(
    candidate.email,
    `${candidate.firstName} ${candidate.lastName}`,
    subject,
    html,
    text,
    'interview_reminder',
    {
      candidateId: candidate.id,
      interviewId: interview.id,
      scheduledAt: interview.scheduledAt.toISOString(),
    }
  );
}

/**
 * Send offer email
 */
export async function sendOfferEmail(
  candidate: Candidate,
  offerDetails: OfferDetails
): Promise<{ success: boolean; error?: string }> {
  const { subject, html, text } = offerLetterTemplate(candidate, offerDetails);

  return sendEmail(
    candidate.email,
    `${candidate.firstName} ${candidate.lastName}`,
    subject,
    html,
    text,
    'offer_sent',
    {
      candidateId: candidate.id,
      position: offerDetails.position,
      startDate: offerDetails.startDate,
    }
  );
}

/**
 * Send welcome email to new employee
 */
export async function sendWelcomeEmail(
  employee: { email: string; firstName: string; lastName: string; position?: string | null }
): Promise<{ success: boolean; error?: string }> {
  const subject = 'Welcome to Roof ER!';

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">🎉 Welcome to Roof ER!</h1>
          <p style="color: #f0f0f0; margin: 10px 0 0 0;">We're excited to have you on the team</p>
        </div>

        <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none;">
          <h2 style="color: #10b981; margin-top: 0;">Welcome Aboard, ${employee.firstName}!</h2>

          <p>Congratulations on joining the Roof ER team! We're thrilled to have you ${employee.position ? `as our ${employee.position}` : 'with us'}.</p>

          <div style="background: #f0fdf4; padding: 20px; border-left: 4px solid #10b981; margin: 25px 0;">
            <h3 style="margin: 0 0 15px 0; color: #10b981;">First Steps</h3>
            <ul style="margin: 0; padding-left: 20px; line-height: 1.8;">
              <li>Check your onboarding tasks in the HR portal</li>
              <li>Complete required paperwork</li>
              <li>Set up your workspace and equipment</li>
              <li>Meet your team members</li>
              <li>Review company policies and procedures</li>
            </ul>
          </div>

          <h3 style="color: #10b981;">What to Expect</h3>
          <p>Over the next few weeks, you'll:</p>
          <ul style="line-height: 1.8;">
            <li>Complete your onboarding training</li>
            <li>Get familiar with our systems and processes</li>
            <li>Meet with your manager for goal setting</li>
            <li>Start contributing to exciting projects</li>
          </ul>

          <p style="background: #dbeafe; padding: 15px; border-radius: 4px; border-left: 4px solid #3b82f6;">
            <strong>Need Help?</strong><br>
            Your HR team and manager are here to support you. Don't hesitate to reach out with any questions!
          </p>

          <p style="margin-top: 30px;">Once again, welcome to Roof ER. We're looking forward to working with you!</p>

          <p>Best regards,<br><strong>The Roof ER Team</strong></p>
        </div>

        <div style="background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; color: #666; font-size: 12px;">
          <p style="margin: 0;">This is an automated message from Roof ER Command Center.</p>
          <p style="margin: 10px 0 0 0;">© ${new Date().getFullYear()} Roof ER. All rights reserved.</p>
        </div>
      </body>
    </html>
  `;

  const text = `
🎉 Welcome to Roof ER!

Welcome Aboard, ${employee.firstName}!

Congratulations on joining the Roof ER team! We're thrilled to have you ${employee.position ? `as our ${employee.position}` : 'with us'}.

FIRST STEPS:
- Check your onboarding tasks in the HR portal
- Complete required paperwork
- Set up your workspace and equipment
- Meet your team members
- Review company policies and procedures

WHAT TO EXPECT:
Over the next few weeks, you'll:
- Complete your onboarding training
- Get familiar with our systems and processes
- Meet with your manager for goal setting
- Start contributing to exciting projects

Need Help? Your HR team and manager are here to support you. Don't hesitate to reach out with any questions!

Once again, welcome to Roof ER. We're looking forward to working with you!

Best regards,
The Roof ER Team

---
This is an automated message from Roof ER Command Center.
© ${new Date().getFullYear()} Roof ER. All rights reserved.
  `.trim();

  return sendEmail(
    employee.email,
    `${employee.firstName} ${employee.lastName}`,
    subject,
    html,
    text,
    'welcome',
    {
      position: employee.position || undefined,
    }
  );
}

/**
 * Send onboarding task reminder
 */
export async function sendOnboardingReminderEmail(
  employee: { email: string; firstName: string; lastName: string },
  tasks: OnboardingTask[]
): Promise<{ success: boolean; error?: string }> {
  const overdueCount = tasks.filter(t => {
    if (!t.dueDate) return false;
    return new Date(t.dueDate) < new Date();
  }).length;

  const subject = overdueCount > 0
    ? `Reminder: ${overdueCount} Overdue Onboarding Task${overdueCount > 1 ? 's' : ''}`
    : `Reminder: ${tasks.length} Pending Onboarding Task${tasks.length > 1 ? 's' : ''}`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">⏰ Onboarding Reminder</h1>
          <p style="color: #f0f0f0; margin: 10px 0 0 0;">You have pending tasks</p>
        </div>

        <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none;">
          <h2 style="color: #f59e0b; margin-top: 0;">Onboarding Tasks Need Your Attention</h2>

          <p>Hi ${employee.firstName},</p>

          <p>You have <strong>${tasks.length}</strong> pending onboarding task${tasks.length > 1 ? 's' : ''} ${overdueCount > 0 ? `(${overdueCount} overdue)` : ''}.</p>

          <div style="background: #fef3c7; padding: 20px; border-left: 4px solid #f59e0b; margin: 25px 0;">
            <h3 style="margin: 0 0 15px 0; color: #d97706;">Your Tasks</h3>
            ${tasks.map(task => {
              const isOverdue = task.dueDate && new Date(task.dueDate) < new Date();
              return `
                <div style="margin-bottom: 15px; padding: 10px; background: white; border-radius: 4px;">
                  <p style="margin: 0; font-weight: bold; color: ${isOverdue ? '#dc2626' : '#1f2937'};">
                    ${isOverdue ? '🚨 ' : ''}${task.taskName}
                  </p>
                  ${task.description ? `<p style="margin: 5px 0 0 0; font-size: 14px; color: #666;">${task.description}</p>` : ''}
                  ${task.dueDate ? `<p style="margin: 5px 0 0 0; font-size: 12px; color: ${isOverdue ? '#dc2626' : '#666'};">Due: ${new Date(task.dueDate).toLocaleDateString()}</p>` : ''}
                </div>
              `;
            }).join('')}
          </div>

          <p>Please log into the HR portal to complete these tasks as soon as possible.</p>

          <p>Best regards,<br><strong>Roof ER HR Team</strong></p>
        </div>

        <div style="background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; color: #666; font-size: 12px;">
          <p style="margin: 0;">This is an automated message from Roof ER Command Center.</p>
          <p style="margin: 10px 0 0 0;">© ${new Date().getFullYear()} Roof ER. All rights reserved.</p>
        </div>
      </body>
    </html>
  `;

  const text = `
⏰ Onboarding Reminder - You have pending tasks

Hi ${employee.firstName},

You have ${tasks.length} pending onboarding task${tasks.length > 1 ? 's' : ''} ${overdueCount > 0 ? `(${overdueCount} overdue)` : ''}.

YOUR TASKS:
${tasks.map(task => {
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date();
  return `
${isOverdue ? '🚨 ' : ''}${task.taskName}
${task.description ? `   ${task.description}` : ''}
${task.dueDate ? `   Due: ${new Date(task.dueDate).toLocaleDateString()}` : ''}
  `.trim();
}).join('\n\n')}

Please log into the HR portal to complete these tasks as soon as possible.

Best regards,
Roof ER HR Team

---
This is an automated message from Roof ER Command Center.
© ${new Date().getFullYear()} Roof ER. All rights reserved.
  `.trim();

  return sendEmail(
    employee.email,
    `${employee.firstName} ${employee.lastName}`,
    subject,
    html,
    text,
    'onboarding_reminder',
    {
      taskCount: tasks.length,
      overdueCount,
      taskIds: tasks.map(t => t.id),
    }
  );
}

export default {
  sendCandidateStatusEmail,
  sendInterviewScheduledEmail,
  sendInterviewReminderEmail,
  sendOfferEmail,
  sendWelcomeEmail,
  sendOnboardingReminderEmail,
};
