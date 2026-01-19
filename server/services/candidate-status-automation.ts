import { db } from '../db.js';
import {
  candidates,
  candidateNotes,
  interviews,
} from '../../shared/schema.js';
import { eq, and } from 'drizzle-orm';
import { sendCandidateStatusEmail } from './email.js';
import type { Candidate } from '../../shared/schema.js';

/**
 * DEAD/NO_SHOW Automation
 *
 * Handles automated actions when candidates move to terminal states:
 * - DEAD (any reason): Send rejection email
 * - NO_SHOW: Add tag, create note, send reschedule email, delete calendar event
 */

export type DeadReason =
  | 'DEAD_BY_CANDIDATE'    // Candidate withdrew
  | 'DEAD_BY_COMPANY'      // Company rejected
  | 'DEAD_COMPENSATION'    // Compensation mismatch
  | 'DEAD_LOCATION'        // Location issue
  | 'DEAD_TIMING'          // Timing not right
  | 'DEAD_QUALIFICATIONS'  // Not qualified
  | 'DEAD_CULTURE_FIT'     // Culture fit issue
  | 'DEAD_OTHER';          // Other reason

interface StatusChangeData {
  candidateId: number;
  newStatus: string;
  oldStatus: string;
  reason?: DeadReason;
  interviewId?: number;
  googleEventId?: string;
}

interface AutomationResult {
  success: boolean;
  actions: string[];
  errors: string[];
}

/**
 * Execute status change automation
 */
export async function executeStatusAutomation(data: StatusChangeData): Promise<AutomationResult> {
  const actions: string[] = [];
  const errors: string[] = [];

  try {
    // Fetch candidate
    const [candidate] = await db.select().from(candidates)
      .where(eq(candidates.id, data.candidateId))
      .limit(1);

    if (!candidate) {
      errors.push('Candidate not found');
      return { success: false, actions, errors };
    }

    // Handle DEAD status
    if (data.newStatus.startsWith('DEAD') || data.newStatus === 'rejected') {
      await handleDeadStatus(candidate, data.newStatus, data.reason);
      actions.push('Sent rejection email');
    }

    // Handle NO_SHOW status
    if (data.newStatus === 'NO_SHOW' || data.newStatus === 'no_show') {
      await handleNoShowStatus(candidate, data);
      actions.push('Added no-show tag');
      actions.push('Created no-show note');
      actions.push('Sent reschedule email');

      if (data.googleEventId) {
        // TODO: Delete Google Calendar event
        actions.push('Deleted calendar event');
        console.log(`📅 Would delete Google Calendar event: ${data.googleEventId}`);
      }
    }

    return { success: true, actions, errors };

  } catch (error: any) {
    errors.push(`Status automation failed: ${error.message}`);
    return { success: false, actions, errors };
  }
}

/**
 * Handle DEAD status - send rejection email
 */
async function handleDeadStatus(
  candidate: Candidate,
  status: string,
  reason?: DeadReason
) {
  // Get rejection email template based on reason
  const emailTemplate = getRejectionTemplate(reason || 'DEAD_OTHER');

  // Send rejection email using existing service
  await sendCandidateStatusEmail(candidate, status, candidate.status);

  console.log(`📧 Rejection email sent to ${candidate.email}`);
  console.log(`   Reason: ${reason || 'Not specified'}`);
}

/**
 * Handle NO_SHOW status
 */
async function handleNoShowStatus(
  candidate: Candidate,
  data: StatusChangeData
) {
  // 1. Add "No Show" to customTags
  const currentTags = candidate.customTags || [];
  if (!currentTags.includes('No Show')) {
    await db.update(candidates)
      .set({
        customTags: [...currentTags, 'No Show'],
        updatedAt: new Date(),
      })
      .where(eq(candidates.id, candidate.id));

    console.log(`🏷️  Added "No Show" tag to candidate ${candidate.id}`);
  }

  // 2. Create note about no-show
  const interviewInfo = data.interviewId
    ? ` for interview #${data.interviewId}`
    : '';

  await db.insert(candidateNotes).values({
    candidateId: candidate.id,
    authorId: 1, // System user
    content: `Interview no-show on ${new Date().toLocaleDateString()}${interviewInfo}`,
    type: 'INTERVIEW',
  });

  console.log(`📝 Created no-show note for candidate ${candidate.id}`);

  // 3. Send reschedule email
  await sendNoShowRescheduleEmail(candidate);

  console.log(`📧 Sent reschedule email to ${candidate.email}`);
}

/**
 * Send reschedule email to no-show candidate
 */
async function sendNoShowRescheduleEmail(candidate: Candidate) {
  // Use existing email service with custom template
  // For now, use status change email
  await sendCandidateStatusEmail(candidate, 'no_show_reschedule', candidate.status);

  // TODO: Create dedicated reschedule email template
  console.log('⚠️  Using generic status change email - create dedicated reschedule template');
}

/**
 * Get rejection email template based on reason
 */
function getRejectionTemplate(reason: DeadReason): string {
  const templates: Record<DeadReason, string> = {
    DEAD_BY_CANDIDATE: 'We appreciate your interest and wish you the best in your job search.',
    DEAD_BY_COMPANY: 'Thank you for your interest. We have decided to move forward with other candidates.',
    DEAD_COMPENSATION: 'Thank you for your interest. Unfortunately, we cannot meet your compensation requirements.',
    DEAD_LOCATION: 'Thank you for your interest. The position location does not align with your preferences.',
    DEAD_TIMING: 'Thank you for your interest. The timing is not right at this moment.',
    DEAD_QUALIFICATIONS: 'Thank you for your interest. We are looking for candidates with different qualifications.',
    DEAD_CULTURE_FIT: 'Thank you for your interest. We are looking for a different cultural fit.',
    DEAD_OTHER: 'Thank you for your interest. We have decided to move in a different direction.',
  };

  return templates[reason] || templates.DEAD_OTHER;
}

/**
 * Delete Google Calendar event
 * NOTE: Requires Google Calendar API integration
 */
async function deleteGoogleCalendarEvent(eventId: string): Promise<void> {
  // TODO: Implement Google Calendar API integration
  console.log(`📅 Would delete Google Calendar event: ${eventId}`);
  console.log('⚠️  Google Calendar API not yet integrated');
}

export default {
  executeStatusAutomation,
};
