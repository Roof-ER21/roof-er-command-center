import type { Candidate, Interview } from "../../shared/schema.js";

/**
 * Email Templates for Recruiting Automation
 */

interface OfferDetails {
  position: string;
  startDate?: string;
  salary?: string;
  benefits?: string[];
}

/**
 * Status change email template
 */
export function candidateStatusChangeTemplate(
  candidate: Candidate,
  newStatus: string,
  oldStatus: string
): { subject: string; html: string; text: string } {
  const statusMessages: Record<string, { title: string; message: string }> = {
    screening: {
      title: "Application Under Review",
      message: "Thank you for your interest in joining Roof ER. Your application is currently under review by our hiring team. We will contact you soon with next steps.",
    },
    interview: {
      title: "Interview Stage",
      message: "Congratulations! Your application has advanced to the interview stage. We will be reaching out shortly to schedule a time to speak with you.",
    },
    offer: {
      title: "Offer Extended",
      message: "We are excited to extend an offer for the position you applied for. Please check your email for detailed offer information.",
    },
    hired: {
      title: "Welcome to the Team!",
      message: "Congratulations and welcome to Roof ER! We are thrilled to have you join our team. You will receive onboarding information shortly.",
    },
    rejected: {
      title: "Application Status Update",
      message: "Thank you for your interest in Roof ER. While we were impressed with your qualifications, we have decided to move forward with other candidates at this time. We encourage you to apply for future opportunities that match your skills.",
    },
  };

  const statusInfo = statusMessages[newStatus] || {
    title: "Application Status Update",
    message: "Your application status has been updated.",
  };

  const subject = `Roof ER Application: ${statusInfo.title}`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Roof ER</h1>
          <p style="color: #f0f0f0; margin: 10px 0 0 0;">Application Status Update</p>
        </div>

        <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none;">
          <h2 style="color: #667eea; margin-top: 0;">${statusInfo.title}</h2>

          <p>Hi ${candidate.firstName},</p>

          <p>${statusInfo.message}</p>

          <div style="background: #f8f9fa; padding: 15px; border-left: 4px solid #667eea; margin: 20px 0;">
            <p style="margin: 0;"><strong>Position:</strong> ${candidate.position}</p>
            <p style="margin: 5px 0 0 0;"><strong>Status:</strong> ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}</p>
          </div>

          ${newStatus !== 'rejected' ? `
          <p>If you have any questions, please don't hesitate to reach out to our HR team.</p>
          ` : ''}

          <p style="margin-top: 30px;">Best regards,<br><strong>Roof ER Hiring Team</strong></p>
        </div>

        <div style="background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; color: #666; font-size: 12px;">
          <p style="margin: 0;">This is an automated message from Roof ER Command Center.</p>
          <p style="margin: 10px 0 0 0;">© ${new Date().getFullYear()} Roof ER. All rights reserved.</p>
        </div>
      </body>
    </html>
  `;

  const text = `
Roof ER - ${statusInfo.title}

Hi ${candidate.firstName},

${statusInfo.message}

Position: ${candidate.position}
Status: ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}

${newStatus !== 'rejected' ? "If you have any questions, please don't hesitate to reach out to our HR team." : ''}

Best regards,
Roof ER Hiring Team

---
This is an automated message from Roof ER Command Center.
© ${new Date().getFullYear()} Roof ER. All rights reserved.
  `.trim();

  return { subject, html, text };
}

/**
 * Interview scheduled email template
 */
export function interviewScheduledTemplate(
  candidate: Candidate,
  interview: Interview
): { subject: string; html: string; text: string } {
  const interviewDate = new Date(interview.scheduledAt);
  const dateFormatted = interviewDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const timeFormatted = interviewDate.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  });

  const subject = `Interview Scheduled: ${candidate.position} at Roof ER`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Roof ER</h1>
          <p style="color: #f0f0f0; margin: 10px 0 0 0;">Interview Scheduled</p>
        </div>

        <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none;">
          <h2 style="color: #667eea; margin-top: 0;">Your Interview is Scheduled!</h2>

          <p>Hi ${candidate.firstName},</p>

          <p>Great news! We've scheduled your interview for the <strong>${candidate.position}</strong> position at Roof ER.</p>

          <div style="background: #f8f9fa; padding: 20px; border-left: 4px solid #667eea; margin: 25px 0;">
            <h3 style="margin: 0 0 15px 0; color: #667eea;">Interview Details</h3>
            <p style="margin: 5px 0;"><strong>📅 Date:</strong> ${dateFormatted}</p>
            <p style="margin: 5px 0;"><strong>🕐 Time:</strong> ${timeFormatted}</p>
            <p style="margin: 5px 0;"><strong>⏱️ Duration:</strong> ${interview.duration} minutes</p>
            <p style="margin: 5px 0;"><strong>📍 Type:</strong> ${interview.type === 'video' ? 'Video Call' : interview.type === 'phone' ? 'Phone Call' : interview.type === 'in_person' ? 'In-Person' : 'Panel Interview'}</p>
            ${interview.location ? `<p style="margin: 5px 0;"><strong>📍 Location:</strong> ${interview.location}</p>` : ''}
            ${interview.meetingLink ? `
              <div style="margin-top: 15px;">
                <a href="${interview.meetingLink}" style="display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Join Interview</a>
              </div>
            ` : ''}
          </div>

          <h3 style="color: #667eea;">What to Expect</h3>
          <ul style="line-height: 1.8;">
            <li>Be prepared to discuss your experience and qualifications</li>
            <li>Have examples ready of your past work and achievements</li>
            <li>Prepare questions about the role and Roof ER</li>
            <li>${interview.type === 'video' ? 'Test your camera and microphone before the call' : 'Plan to arrive 10 minutes early'}</li>
          </ul>

          <p style="background: #fff3cd; padding: 15px; border-radius: 4px; border-left: 4px solid #ffc107;">
            <strong>Need to Reschedule?</strong><br>
            If you need to reschedule, please contact us as soon as possible.
          </p>

          <p style="margin-top: 30px;">We look forward to speaking with you!</p>

          <p>Best regards,<br><strong>Roof ER Hiring Team</strong></p>
        </div>

        <div style="background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; color: #666; font-size: 12px;">
          <p style="margin: 0;">This is an automated message from Roof ER Command Center.</p>
          <p style="margin: 10px 0 0 0;">© ${new Date().getFullYear()} Roof ER. All rights reserved.</p>
        </div>
      </body>
    </html>
  `;

  const text = `
Roof ER - Your Interview is Scheduled!

Hi ${candidate.firstName},

Great news! We've scheduled your interview for the ${candidate.position} position at Roof ER.

INTERVIEW DETAILS:
📅 Date: ${dateFormatted}
🕐 Time: ${timeFormatted}
⏱️ Duration: ${interview.duration} minutes
📍 Type: ${interview.type === 'video' ? 'Video Call' : interview.type === 'phone' ? 'Phone Call' : interview.type === 'in_person' ? 'In-Person' : 'Panel Interview'}
${interview.location ? `📍 Location: ${interview.location}` : ''}
${interview.meetingLink ? `🔗 Meeting Link: ${interview.meetingLink}` : ''}

WHAT TO EXPECT:
- Be prepared to discuss your experience and qualifications
- Have examples ready of your past work and achievements
- Prepare questions about the role and Roof ER
- ${interview.type === 'video' ? 'Test your camera and microphone before the call' : 'Plan to arrive 10 minutes early'}

NEED TO RESCHEDULE?
If you need to reschedule, please contact us as soon as possible.

We look forward to speaking with you!

Best regards,
Roof ER Hiring Team

---
This is an automated message from Roof ER Command Center.
© ${new Date().getFullYear()} Roof ER. All rights reserved.
  `.trim();

  return { subject, html, text };
}

/**
 * Interview reminder email template (sent 24 hours before)
 */
export function interviewReminderTemplate(
  candidate: Candidate,
  interview: Interview
): { subject: string; html: string; text: string } {
  const interviewDate = new Date(interview.scheduledAt);
  const dateFormatted = interviewDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const timeFormatted = interviewDate.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  });

  const subject = `Reminder: Interview Tomorrow at ${timeFormatted}`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Roof ER</h1>
          <p style="color: #f0f0f0; margin: 10px 0 0 0;">Interview Reminder</p>
        </div>

        <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none;">
          <h2 style="color: #667eea; margin-top: 0;">Interview Tomorrow!</h2>

          <p>Hi ${candidate.firstName},</p>

          <p>This is a friendly reminder that your interview for the <strong>${candidate.position}</strong> position is scheduled for tomorrow.</p>

          <div style="background: #e3f2fd; padding: 20px; border-left: 4px solid #2196f3; margin: 25px 0;">
            <h3 style="margin: 0 0 15px 0; color: #1976d2;">Quick Details</h3>
            <p style="margin: 5px 0;"><strong>📅 Date:</strong> ${dateFormatted}</p>
            <p style="margin: 5px 0;"><strong>🕐 Time:</strong> ${timeFormatted}</p>
            <p style="margin: 5px 0;"><strong>⏱️ Duration:</strong> ${interview.duration} minutes</p>
            ${interview.location ? `<p style="margin: 5px 0;"><strong>📍 Location:</strong> ${interview.location}</p>` : ''}
            ${interview.meetingLink ? `
              <div style="margin-top: 15px;">
                <a href="${interview.meetingLink}" style="display: inline-block; background: #2196f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Join Interview</a>
              </div>
            ` : ''}
          </div>

          <h3 style="color: #667eea;">Quick Checklist</h3>
          <ul style="line-height: 1.8;">
            <li>✓ Review the job description</li>
            <li>✓ Prepare your questions</li>
            <li>✓ ${interview.type === 'video' ? 'Test your video and audio setup' : 'Plan your route and timing'}</li>
            <li>✓ Have your resume and portfolio ready</li>
          </ul>

          <p style="margin-top: 30px;">See you tomorrow!</p>

          <p>Best regards,<br><strong>Roof ER Hiring Team</strong></p>
        </div>

        <div style="background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; color: #666; font-size: 12px;">
          <p style="margin: 0;">This is an automated message from Roof ER Command Center.</p>
          <p style="margin: 10px 0 0 0;">© ${new Date().getFullYear()} Roof ER. All rights reserved.</p>
        </div>
      </body>
    </html>
  `;

  const text = `
Roof ER - Interview Tomorrow!

Hi ${candidate.firstName},

This is a friendly reminder that your interview for the ${candidate.position} position is scheduled for tomorrow.

QUICK DETAILS:
📅 Date: ${dateFormatted}
🕐 Time: ${timeFormatted}
⏱️ Duration: ${interview.duration} minutes
${interview.location ? `📍 Location: ${interview.location}` : ''}
${interview.meetingLink ? `🔗 Meeting Link: ${interview.meetingLink}` : ''}

QUICK CHECKLIST:
✓ Review the job description
✓ Prepare your questions
✓ ${interview.type === 'video' ? 'Test your video and audio setup' : 'Plan your route and timing'}
✓ Have your resume and portfolio ready

See you tomorrow!

Best regards,
Roof ER Hiring Team

---
This is an automated message from Roof ER Command Center.
© ${new Date().getFullYear()} Roof ER. All rights reserved.
  `.trim();

  return { subject, html, text };
}

/**
 * PTO request submitted email template (to manager)
 */
export function ptoRequestSubmittedTemplate(
  employee: { firstName: string; lastName: string; email: string; position?: string | null },
  request: { id: number; startDate: string; endDate: string; days: number; type: string; reason: string },
  manager: { firstName: string; email: string }
): { subject: string; html: string; text: string } {
  const subject = `PTO Request from ${employee.firstName} ${employee.lastName}`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">🗓️ New PTO Request</h1>
          <p style="color: #f0f0f0; margin: 10px 0 0 0;">Needs Your Approval</p>
        </div>

        <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none;">
          <h2 style="color: #f59e0b; margin-top: 0;">PTO Request Submitted</h2>

          <p>Hi ${manager.firstName},</p>

          <p><strong>${employee.firstName} ${employee.lastName}</strong>${employee.position ? ` (${employee.position})` : ''} has submitted a PTO request that requires your approval.</p>

          <div style="background: #fef3c7; padding: 20px; border-left: 4px solid #f59e0b; margin: 25px 0;">
            <h3 style="margin: 0 0 15px 0; color: #d97706;">Request Details</h3>
            <p style="margin: 5px 0;"><strong>Employee:</strong> ${employee.firstName} ${employee.lastName}</p>
            <p style="margin: 5px 0;"><strong>Email:</strong> ${employee.email}</p>
            <p style="margin: 5px 0;"><strong>Type:</strong> ${request.type}</p>
            <p style="margin: 5px 0;"><strong>Start Date:</strong> ${new Date(request.startDate).toLocaleDateString()}</p>
            <p style="margin: 5px 0;"><strong>End Date:</strong> ${new Date(request.endDate).toLocaleDateString()}</p>
            <p style="margin: 5px 0;"><strong>Duration:</strong> ${request.days} day${request.days > 1 ? 's' : ''}</p>
            <p style="margin: 5px 0;"><strong>Reason:</strong> ${request.reason}</p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <p style="margin-bottom: 15px;">Please review this request in the HR portal.</p>
          </div>

          <p style="margin-top: 30px;">Best regards,<br><strong>Roof ER HR Team</strong></p>
        </div>

        <div style="background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; color: #666; font-size: 12px;">
          <p style="margin: 0;">This is an automated message from Roof ER Command Center.</p>
          <p style="margin: 10px 0 0 0;">© ${new Date().getFullYear()} Roof ER. All rights reserved.</p>
        </div>
      </body>
    </html>
  `;

  const text = `
🗓️ New PTO Request - Needs Your Approval

Hi ${manager.firstName},

${employee.firstName} ${employee.lastName}${employee.position ? ` (${employee.position})` : ''} has submitted a PTO request that requires your approval.

REQUEST DETAILS:
Employee: ${employee.firstName} ${employee.lastName}
Email: ${employee.email}
Type: ${request.type}
Start Date: ${new Date(request.startDate).toLocaleDateString()}
End Date: ${new Date(request.endDate).toLocaleDateString()}
Duration: ${request.days} day${request.days > 1 ? 's' : ''}
Reason: ${request.reason}

Please review this request in the HR portal.

Best regards,
Roof ER HR Team

---
This is an automated message from Roof ER Command Center.
© ${new Date().getFullYear()} Roof ER. All rights reserved.
  `.trim();

  return { subject, html, text };
}

/**
 * PTO approved email template (to employee)
 */
export function ptoApprovedTemplate(
  employee: { firstName: string; lastName: string; email: string },
  request: { startDate: string; endDate: string; days: number; type: string },
  approver: { firstName: string; lastName: string }
): { subject: string; html: string; text: string } {
  const subject = `PTO Request Approved - ${new Date(request.startDate).toLocaleDateString()}`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">✅ PTO Request Approved</h1>
          <p style="color: #f0f0f0; margin: 10px 0 0 0;">Your time off has been approved</p>
        </div>

        <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none;">
          <h2 style="color: #10b981; margin-top: 0;">Great News!</h2>

          <p>Hi ${employee.firstName},</p>

          <p>Your PTO request has been <strong>approved</strong> by ${approver.firstName} ${approver.lastName}.</p>

          <div style="background: #f0fdf4; padding: 20px; border-left: 4px solid #10b981; margin: 25px 0;">
            <h3 style="margin: 0 0 15px 0; color: #10b981;">Approved Time Off</h3>
            <p style="margin: 5px 0;"><strong>Type:</strong> ${request.type}</p>
            <p style="margin: 5px 0;"><strong>Start Date:</strong> ${new Date(request.startDate).toLocaleDateString()}</p>
            <p style="margin: 5px 0;"><strong>End Date:</strong> ${new Date(request.endDate).toLocaleDateString()}</p>
            <p style="margin: 5px 0;"><strong>Duration:</strong> ${request.days} day${request.days > 1 ? 's' : ''}</p>
          </div>

          <p style="background: #dbeafe; padding: 15px; border-radius: 4px; border-left: 4px solid #3b82f6;">
            <strong>📅 Reminder:</strong><br>
            You'll receive a reminder email 1 day before your time off begins.
          </p>

          <p style="margin-top: 30px;">Enjoy your time off!</p>

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
✅ PTO Request Approved - Your time off has been approved

Hi ${employee.firstName},

Your PTO request has been approved by ${approver.firstName} ${approver.lastName}.

APPROVED TIME OFF:
Type: ${request.type}
Start Date: ${new Date(request.startDate).toLocaleDateString()}
End Date: ${new Date(request.endDate).toLocaleDateString()}
Duration: ${request.days} day${request.days > 1 ? 's' : ''}

📅 Reminder: You'll receive a reminder email 1 day before your time off begins.

Enjoy your time off!

Best regards,
Roof ER HR Team

---
This is an automated message from Roof ER Command Center.
© ${new Date().getFullYear()} Roof ER. All rights reserved.
  `.trim();

  return { subject, html, text };
}

/**
 * PTO denied email template (to employee)
 */
export function ptoDeniedTemplate(
  employee: { firstName: string; lastName: string },
  request: { startDate: string; endDate: string; days: number; type: string },
  approver: { firstName: string; lastName: string },
  reason?: string
): { subject: string; html: string; text: string } {
  const subject = `PTO Request Update - ${new Date(request.startDate).toLocaleDateString()}`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">📋 PTO Request Update</h1>
          <p style="color: #f0f0f0; margin: 10px 0 0 0;">Status Update on Your Request</p>
        </div>

        <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none;">
          <h2 style="color: #ef4444; margin-top: 0;">Request Not Approved</h2>

          <p>Hi ${employee.firstName},</p>

          <p>We regret to inform you that your PTO request has not been approved at this time.</p>

          <div style="background: #fef2f2; padding: 20px; border-left: 4px solid #ef4444; margin: 25px 0;">
            <h3 style="margin: 0 0 15px 0; color: #dc2626;">Request Details</h3>
            <p style="margin: 5px 0;"><strong>Type:</strong> ${request.type}</p>
            <p style="margin: 5px 0;"><strong>Start Date:</strong> ${new Date(request.startDate).toLocaleDateString()}</p>
            <p style="margin: 5px 0;"><strong>End Date:</strong> ${new Date(request.endDate).toLocaleDateString()}</p>
            <p style="margin: 5px 0;"><strong>Duration:</strong> ${request.days} day${request.days > 1 ? 's' : ''}</p>
            <p style="margin: 5px 0;"><strong>Reviewed by:</strong> ${approver.firstName} ${approver.lastName}</p>
            ${reason ? `<p style="margin: 15px 0 5px 0;"><strong>Reason:</strong></p><p style="margin: 5px 0;">${reason}</p>` : ''}
          </div>

          <p style="background: #dbeafe; padding: 15px; border-radius: 4px; border-left: 4px solid #3b82f6;">
            <strong>Next Steps:</strong><br>
            Please reach out to ${approver.firstName} ${approver.lastName} or your HR representative to discuss alternative dates or options.
          </p>

          <p style="margin-top: 30px;">Best regards,<br><strong>Roof ER HR Team</strong></p>
        </div>

        <div style="background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; color: #666; font-size: 12px;">
          <p style="margin: 0;">This is an automated message from Roof ER Command Center.</p>
          <p style="margin: 10px 0 0 0;">© ${new Date().getFullYear()} Roof ER. All rights reserved.</p>
        </div>
      </body>
    </html>
  `;

  const text = `
📋 PTO Request Update - Status Update on Your Request

Hi ${employee.firstName},

We regret to inform you that your PTO request has not been approved at this time.

REQUEST DETAILS:
Type: ${request.type}
Start Date: ${new Date(request.startDate).toLocaleDateString()}
End Date: ${new Date(request.endDate).toLocaleDateString()}
Duration: ${request.days} day${request.days > 1 ? 's' : ''}
Reviewed by: ${approver.firstName} ${approver.lastName}
${reason ? `\nReason: ${reason}` : ''}

Next Steps: Please reach out to ${approver.firstName} ${approver.lastName} or your HR representative to discuss alternative dates or options.

Best regards,
Roof ER HR Team

---
This is an automated message from Roof ER Command Center.
© ${new Date().getFullYear()} Roof ER. All rights reserved.
  `.trim();

  return { subject, html, text };
}

/**
 * PTO reminder email template (1 day before)
 */
export function ptoReminderTemplate(
  employee: { firstName: string; lastName: string },
  request: { startDate: string; endDate: string; days: number; type: string }
): { subject: string; html: string; text: string } {
  const subject = `Reminder: Your PTO Starts Tomorrow`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">🏖️ PTO Reminder</h1>
          <p style="color: #f0f0f0; margin: 10px 0 0 0;">Your time off starts tomorrow</p>
        </div>

        <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none;">
          <h2 style="color: #667eea; margin-top: 0;">Time Off Reminder</h2>

          <p>Hi ${employee.firstName},</p>

          <p>This is a friendly reminder that your approved time off begins <strong>tomorrow</strong>.</p>

          <div style="background: #e3f2fd; padding: 20px; border-left: 4px solid #2196f3; margin: 25px 0;">
            <h3 style="margin: 0 0 15px 0; color: #1976d2;">Your Time Off</h3>
            <p style="margin: 5px 0;"><strong>Type:</strong> ${request.type}</p>
            <p style="margin: 5px 0;"><strong>Start Date:</strong> ${new Date(request.startDate).toLocaleDateString()}</p>
            <p style="margin: 5px 0;"><strong>End Date:</strong> ${new Date(request.endDate).toLocaleDateString()}</p>
            <p style="margin: 5px 0;"><strong>Duration:</strong> ${request.days} day${request.days > 1 ? 's' : ''}</p>
          </div>

          <h3 style="color: #667eea;">Before You Go</h3>
          <ul style="line-height: 1.8;">
            <li>Complete any urgent tasks</li>
            <li>Set up your out-of-office message</li>
            <li>Notify your team and clients</li>
            <li>Hand off any critical responsibilities</li>
          </ul>

          <p style="margin-top: 30px;">Enjoy your time off!</p>

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
🏖️ PTO Reminder - Your time off starts tomorrow

Hi ${employee.firstName},

This is a friendly reminder that your approved time off begins tomorrow.

YOUR TIME OFF:
Type: ${request.type}
Start Date: ${new Date(request.startDate).toLocaleDateString()}
End Date: ${new Date(request.endDate).toLocaleDateString()}
Duration: ${request.days} day${request.days > 1 ? 's' : ''}

BEFORE YOU GO:
- Complete any urgent tasks
- Set up your out-of-office message
- Notify your team and clients
- Hand off any critical responsibilities

Enjoy your time off!

Best regards,
Roof ER HR Team

---
This is an automated message from Roof ER Command Center.
© ${new Date().getFullYear()} Roof ER. All rights reserved.
  `.trim();

  return { subject, html, text };
}

/**
 * Offer letter email template
 */
export function offerLetterTemplate(
  candidate: Candidate,
  offerDetails: OfferDetails
): { subject: string; html: string; text: string } {
  const subject = `Job Offer: ${offerDetails.position} at Roof ER`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">🎉 Congratulations!</h1>
          <p style="color: #f0f0f0; margin: 10px 0 0 0;">You've Received a Job Offer</p>
        </div>

        <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none;">
          <h2 style="color: #10b981; margin-top: 0;">Welcome to Roof ER!</h2>

          <p>Hi ${candidate.firstName},</p>

          <p>We are excited to extend an offer for you to join Roof ER as a <strong>${offerDetails.position}</strong>!</p>

          <div style="background: #f0fdf4; padding: 20px; border-left: 4px solid #10b981; margin: 25px 0;">
            <h3 style="margin: 0 0 15px 0; color: #10b981;">Offer Details</h3>
            <p style="margin: 5px 0;"><strong>Position:</strong> ${offerDetails.position}</p>
            ${offerDetails.startDate ? `<p style="margin: 5px 0;"><strong>Start Date:</strong> ${offerDetails.startDate}</p>` : ''}
            ${offerDetails.salary ? `<p style="margin: 5px 0;"><strong>Compensation:</strong> ${offerDetails.salary}</p>` : ''}
            ${offerDetails.benefits && offerDetails.benefits.length > 0 ? `
              <div style="margin-top: 15px;">
                <p style="margin: 5px 0;"><strong>Benefits Include:</strong></p>
                <ul style="margin: 5px 0; padding-left: 20px;">
                  ${offerDetails.benefits.map(b => `<li>${b}</li>`).join('')}
                </ul>
              </div>
            ` : ''}
          </div>

          <h3 style="color: #10b981;">Next Steps</h3>
          <ol style="line-height: 1.8;">
            <li>Review the attached offer letter carefully</li>
            <li>Feel free to reach out with any questions</li>
            <li>Sign and return the offer letter by the specified deadline</li>
            <li>Complete any required pre-employment paperwork</li>
          </ol>

          <p style="background: #dbeafe; padding: 15px; border-radius: 4px; border-left: 4px solid #3b82f6;">
            <strong>Questions?</strong><br>
            Our HR team is here to help! Don't hesitate to reach out if you need any clarification.
          </p>

          <p style="margin-top: 30px;">We can't wait to have you on the team!</p>

          <p>Best regards,<br><strong>Roof ER Hiring Team</strong></p>
        </div>

        <div style="background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; color: #666; font-size: 12px;">
          <p style="margin: 0;">This is an automated message from Roof ER Command Center.</p>
          <p style="margin: 10px 0 0 0;">© ${new Date().getFullYear()} Roof ER. All rights reserved.</p>
        </div>
      </body>
    </html>
  `;

  const text = `
🎉 Congratulations! You've Received a Job Offer

Hi ${candidate.firstName},

We are excited to extend an offer for you to join Roof ER as a ${offerDetails.position}!

OFFER DETAILS:
Position: ${offerDetails.position}
${offerDetails.startDate ? `Start Date: ${offerDetails.startDate}` : ''}
${offerDetails.salary ? `Compensation: ${offerDetails.salary}` : ''}
${offerDetails.benefits && offerDetails.benefits.length > 0 ? `
Benefits Include:
${offerDetails.benefits.map(b => `- ${b}`).join('\n')}
` : ''}

NEXT STEPS:
1. Review the attached offer letter carefully
2. Feel free to reach out with any questions
3. Sign and return the offer letter by the specified deadline
4. Complete any required pre-employment paperwork

Questions? Our HR team is here to help! Don't hesitate to reach out if you need any clarification.

We can't wait to have you on the team!

Best regards,
Roof ER Hiring Team

---
This is an automated message from Roof ER Command Center.
© ${new Date().getFullYear()} Roof ER. All rights reserved.
  `.trim();

  return { subject, html, text };
}
