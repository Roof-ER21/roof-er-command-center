import { Resend } from 'resend';
import {
  safetyIncidentReportedTemplate,
  safetyIncidentAssignedTemplate,
  safetyIncidentEscalatedTemplate,
  safetyIncidentResolvedTemplate,
} from './safety-email-templates.js';
import type { SafetyIncident } from '../../shared/schema.js';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@roofer.com';

// Initialize Resend (with fallback for missing API key)
let resend: Resend | null = null;
if (RESEND_API_KEY) {
  resend = new Resend(RESEND_API_KEY);
} else {
  console.warn('⚠️  RESEND_API_KEY not set - safety email service will run in simulation mode');
}

/**
 * Base function to send safety emails
 */
async function sendEmail(
  recipientEmail: string,
  recipientName: string,
  subject: string,
  html: string,
  text: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    // If no Resend API key, simulate sending
    if (!resend) {
      console.log(`📧 [SIMULATED] Safety Email to ${recipientEmail}: ${subject}`);
      return { success: true, messageId: `simulated-${Date.now()}` };
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

    console.log(`✅ Safety Email sent to ${recipientEmail}: ${subject} (ID: ${response.data?.id})`);
    return { success: true, messageId: response.data?.id };

  } catch (error: any) {
    console.error(`❌ Failed to send safety email to ${recipientEmail}:`, error);
    return { success: false, error: error.message };
  }
}

/**
 * Send safety incident reported email
 */
export async function sendSafetyIncidentReportedEmail(
  incident: SafetyIncident,
  reporter: { firstName: string; lastName: string; email: string },
  recipient: { firstName: string; lastName: string; email: string }
): Promise<{ success: boolean; error?: string }> {
  const { subject, html, text } = safetyIncidentReportedTemplate(
    {
      id: incident.id,
      title: incident.title,
      description: incident.description,
      severity: incident.severity,
      category: incident.category,
      location: incident.location,
      incidentDate: incident.incidentDate,
    },
    reporter
  );

  return sendEmail(
    recipient.email,
    `${recipient.firstName} ${recipient.lastName}`,
    subject,
    html,
    text
  );
}

/**
 * Send safety incident assigned email
 */
export async function sendSafetyIncidentAssignedEmail(
  incident: SafetyIncident,
  assignee: { firstName: string; lastName: string; email: string }
): Promise<{ success: boolean; error?: string }> {
  const { subject, html, text } = safetyIncidentAssignedTemplate(
    {
      id: incident.id,
      title: incident.title,
      description: incident.description,
      severity: incident.severity,
      category: incident.category,
      incidentDate: incident.incidentDate,
    },
    assignee
  );

  return sendEmail(
    assignee.email,
    `${assignee.firstName} ${assignee.lastName}`,
    subject,
    html,
    text
  );
}

/**
 * Send safety incident escalated email
 */
export async function sendSafetyIncidentEscalatedEmail(
  incident: SafetyIncident,
  escalationReason: string,
  recipient: { firstName: string; lastName: string; email: string }
): Promise<{ success: boolean; error?: string }> {
  const { subject, html, text } = safetyIncidentEscalatedTemplate(
    {
      id: incident.id,
      title: incident.title,
      severity: incident.severity,
      status: incident.status,
      createdAt: incident.createdAt,
    },
    escalationReason
  );

  return sendEmail(
    recipient.email,
    `${recipient.firstName} ${recipient.lastName}`,
    subject,
    html,
    text
  );
}

/**
 * Send safety incident resolved email
 */
export async function sendSafetyIncidentResolvedEmail(
  incident: SafetyIncident,
  resolver: { firstName: string; lastName: string; email: string },
  recipient: { firstName: string; lastName: string; email: string }
): Promise<{ success: boolean; error?: string }> {
  const { subject, html, text } = safetyIncidentResolvedTemplate(
    {
      id: incident.id,
      title: incident.title,
      description: incident.description,
      severity: incident.severity,
      resolvedAt: incident.resolvedAt,
    },
    resolver
  );

  return sendEmail(
    recipient.email,
    `${recipient.firstName} ${recipient.lastName}`,
    subject,
    html,
    text
  );
}

export default {
  sendSafetyIncidentReportedEmail,
  sendSafetyIncidentAssignedEmail,
  sendSafetyIncidentEscalatedEmail,
  sendSafetyIncidentResolvedEmail,
};
