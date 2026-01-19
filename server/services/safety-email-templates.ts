/**
 * Safety Incident Email Templates
 */

/**
 * Safety Incident Reported Email Template
 */
export function safetyIncidentReportedTemplate(
  incident: { id: number; title: string; description: string; severity: string; category: string | null; location: string | null; incidentDate: Date },
  reporter: { firstName: string; lastName: string }
): { subject: string; html: string; text: string } {
  const severityColors = {
    low: '#10b981',
    medium: '#f59e0b',
    high: '#ef4444',
    critical: '#dc2626',
  };

  const severityColor = severityColors[incident.severity as keyof typeof severityColors] || '#6b7280';
  const incidentDateFormatted = new Date(incident.incidentDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const subject = `🚨 Safety Incident Reported - ${incident.severity.toUpperCase()} Severity`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: ${severityColor}; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">🚨 Safety Incident Reported</h1>
          <p style="color: #f0f0f0; margin: 10px 0 0 0;">${incident.severity.toUpperCase()} Severity</p>
        </div>

        <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none;">
          <h2 style="color: ${severityColor}; margin-top: 0;">New Safety Incident #${incident.id}</h2>

          <p>A safety incident has been reported and requires immediate attention.</p>

          <div style="background: #fef2f2; padding: 20px; border-left: 4px solid ${severityColor}; margin: 25px 0;">
            <h3 style="margin: 0 0 15px 0; color: #dc2626;">Incident Details</h3>
            <p style="margin: 5px 0;"><strong>Title:</strong> ${incident.title}</p>
            <p style="margin: 5px 0;"><strong>Description:</strong> ${incident.description}</p>
            <p style="margin: 5px 0;"><strong>Severity:</strong> <span style="color: ${severityColor}; font-weight: bold;">${incident.severity.toUpperCase()}</span></p>
            ${incident.category ? `<p style="margin: 5px 0;"><strong>Category:</strong> ${incident.category}</p>` : ''}
            <p style="margin: 5px 0;"><strong>Incident Date:</strong> ${incidentDateFormatted}</p>
            ${incident.location ? `<p style="margin: 5px 0;"><strong>Location:</strong> ${incident.location}</p>` : ''}
            <p style="margin: 5px 0;"><strong>Reported By:</strong> ${reporter.firstName} ${reporter.lastName}</p>
          </div>

          <h3 style="color: ${severityColor};">Required Action</h3>
          <ul style="line-height: 1.8;">
            <li>Review incident details immediately</li>
            <li>Assign to appropriate personnel</li>
            <li>Begin investigation</li>
            <li>Document all findings</li>
            ${incident.severity === 'critical' ? '<li><strong>CRITICAL: Immediate response required</strong></li>' : ''}
          </ul>

          <p style="margin-top: 30px;">Please log into the Safety Dashboard to review and take action.</p>

          <p>Best regards,<br><strong>Roof ER Safety Team</strong></p>
        </div>

        <div style="background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; color: #666; font-size: 12px;">
          <p style="margin: 0;">This is an automated message from Roof ER Command Center.</p>
          <p style="margin: 10px 0 0 0;">© ${new Date().getFullYear()} Roof ER. All rights reserved.</p>
        </div>
      </body>
    </html>
  `;

  const text = `
🚨 Safety Incident Reported - ${incident.severity.toUpperCase()} Severity

New Safety Incident #${incident.id}

A safety incident has been reported and requires immediate attention.

INCIDENT DETAILS:
Title: ${incident.title}
Description: ${incident.description}
Severity: ${incident.severity.toUpperCase()}
${incident.category ? `Category: ${incident.category}` : ''}
Incident Date: ${incidentDateFormatted}
${incident.location ? `Location: ${incident.location}` : ''}
Reported By: ${reporter.firstName} ${reporter.lastName}

REQUIRED ACTION:
- Review incident details immediately
- Assign to appropriate personnel
- Begin investigation
- Document all findings
${incident.severity === 'critical' ? '- CRITICAL: Immediate response required' : ''}

Please log into the Safety Dashboard to review and take action.

Best regards,
Roof ER Safety Team

---
This is an automated message from Roof ER Command Center.
© ${new Date().getFullYear()} Roof ER. All rights reserved.
  `.trim();

  return { subject, html, text };
}

/**
 * Safety Incident Assigned Email Template
 */
export function safetyIncidentAssignedTemplate(
  incident: { id: number; title: string; description: string; severity: string; category: string | null; incidentDate: Date },
  assignee: { firstName: string; lastName: string }
): { subject: string; html: string; text: string } {
  const subject = `Safety Incident #${incident.id} Assigned to You`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Safety Incident Assigned</h1>
          <p style="color: #f0f0f0; margin: 10px 0 0 0;">Action Required</p>
        </div>

        <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none;">
          <h2 style="color: #667eea; margin-top: 0;">Incident #${incident.id} Assigned to You</h2>

          <p>Hi ${assignee.firstName},</p>

          <p>You have been assigned to investigate and resolve the following safety incident:</p>

          <div style="background: #f8f9fa; padding: 20px; border-left: 4px solid #667eea; margin: 25px 0;">
            <h3 style="margin: 0 0 15px 0; color: #667eea;">Incident Details</h3>
            <p style="margin: 5px 0;"><strong>Title:</strong> ${incident.title}</p>
            <p style="margin: 5px 0;"><strong>Description:</strong> ${incident.description}</p>
            <p style="margin: 5px 0;"><strong>Severity:</strong> ${incident.severity.toUpperCase()}</p>
            ${incident.category ? `<p style="margin: 5px 0;"><strong>Category:</strong> ${incident.category}</p>` : ''}
          </div>

          <h3 style="color: #667eea;">Next Steps</h3>
          <ol style="line-height: 1.8;">
            <li>Review all incident details in the Safety Dashboard</li>
            <li>Conduct thorough investigation</li>
            <li>Document findings and actions taken</li>
            <li>Update incident status as you progress</li>
            <li>Submit final resolution report</li>
          </ol>

          <p style="margin-top: 30px;">Please log into the Safety Dashboard to begin your investigation.</p>

          <p>Best regards,<br><strong>Roof ER Safety Team</strong></p>
        </div>

        <div style="background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; color: #666; font-size: 12px;">
          <p style="margin: 0;">This is an automated message from Roof ER Command Center.</p>
          <p style="margin: 10px 0 0 0;">© ${new Date().getFullYear()} Roof ER. All rights reserved.</p>
        </div>
      </body>
    </html>
  `;

  const text = `
Safety Incident #${incident.id} Assigned to You

Hi ${assignee.firstName},

You have been assigned to investigate and resolve the following safety incident:

INCIDENT DETAILS:
Title: ${incident.title}
Description: ${incident.description}
Severity: ${incident.severity.toUpperCase()}
${incident.category ? `Category: ${incident.category}` : ''}

NEXT STEPS:
1. Review all incident details in the Safety Dashboard
2. Conduct thorough investigation
3. Document findings and actions taken
4. Update incident status as you progress
5. Submit final resolution report

Please log into the Safety Dashboard to begin your investigation.

Best regards,
Roof ER Safety Team

---
This is an automated message from Roof ER Command Center.
© ${new Date().getFullYear()} Roof ER. All rights reserved.
  `.trim();

  return { subject, html, text };
}

/**
 * Safety Incident Escalated Email Template
 */
export function safetyIncidentEscalatedTemplate(
  incident: { id: number; title: string; severity: string; status: string; createdAt: Date },
  escalationReason: string
): { subject: string; html: string; text: string } {
  const subject = `⚠️ ESCALATION: Safety Incident #${incident.id} Requires Immediate Attention`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">⚠️ INCIDENT ESCALATION</h1>
          <p style="color: #f0f0f0; margin: 10px 0 0 0;">Immediate Action Required</p>
        </div>

        <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none;">
          <h2 style="color: #dc2626; margin-top: 0;">Safety Incident #${incident.id} Escalated</h2>

          <p style="background: #fef2f2; padding: 15px; border-radius: 4px; border-left: 4px solid #dc2626;">
            <strong>⚠️ ESCALATION NOTICE:</strong><br>
            ${escalationReason}
          </p>

          <div style="background: #f8f9fa; padding: 20px; border-left: 4px solid #dc2626; margin: 25px 0;">
            <h3 style="margin: 0 0 15px 0; color: #dc2626;">Incident Summary</h3>
            <p style="margin: 5px 0;"><strong>Incident #:</strong> ${incident.id}</p>
            <p style="margin: 5px 0;"><strong>Title:</strong> ${incident.title}</p>
            <p style="margin: 5px 0;"><strong>Severity:</strong> ${incident.severity.toUpperCase()}</p>
            <p style="margin: 5px 0;"><strong>Status:</strong> ${incident.status}</p>
            <p style="margin: 5px 0;"><strong>Reported:</strong> ${new Date(incident.createdAt).toLocaleDateString()}</p>
          </div>

          <h3 style="color: #dc2626;">Required Immediate Action</h3>
          <ul style="line-height: 1.8;">
            <li><strong>Review incident details immediately</strong></li>
            <li>Assess if additional resources are needed</li>
            <li>Ensure proper personnel are assigned</li>
            <li>Monitor progress closely</li>
            <li>Escalate further if needed</li>
          </ul>

          <p style="margin-top: 30px;">Please log into the Safety Dashboard immediately to address this escalated incident.</p>

          <p>Best regards,<br><strong>Roof ER Safety Team</strong></p>
        </div>

        <div style="background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; color: #666; font-size: 12px;">
          <p style="margin: 0;">This is an automated message from Roof ER Command Center.</p>
          <p style="margin: 10px 0 0 0;">© ${new Date().getFullYear()} Roof ER. All rights reserved.</p>
        </div>
      </body>
    </html>
  `;

  const text = `
⚠️ ESCALATION: Safety Incident #${incident.id} Requires Immediate Attention

ESCALATION NOTICE:
${escalationReason}

INCIDENT SUMMARY:
Incident #: ${incident.id}
Title: ${incident.title}
Severity: ${incident.severity.toUpperCase()}
Status: ${incident.status}
Reported: ${new Date(incident.createdAt).toLocaleDateString()}

REQUIRED IMMEDIATE ACTION:
- Review incident details immediately
- Assess if additional resources are needed
- Ensure proper personnel are assigned
- Monitor progress closely
- Escalate further if needed

Please log into the Safety Dashboard immediately to address this escalated incident.

Best regards,
Roof ER Safety Team

---
This is an automated message from Roof ER Command Center.
© ${new Date().getFullYear()} Roof ER. All rights reserved.
  `.trim();

  return { subject, html, text };
}

/**
 * Safety Incident Resolved Email Template
 */
export function safetyIncidentResolvedTemplate(
  incident: { id: number; title: string; description: string; severity: string; resolvedAt: Date | null },
  resolver: { firstName: string; lastName: string }
): { subject: string; html: string; text: string } {
  const subject = `✅ Safety Incident #${incident.id} Resolved`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">✅ Incident Resolved</h1>
          <p style="color: #f0f0f0; margin: 10px 0 0 0;">Safety Incident Closed</p>
        </div>

        <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none;">
          <h2 style="color: #10b981; margin-top: 0;">Incident #${incident.id} Has Been Resolved</h2>

          <p>The following safety incident has been successfully resolved:</p>

          <div style="background: #f0fdf4; padding: 20px; border-left: 4px solid #10b981; margin: 25px 0;">
            <h3 style="margin: 0 0 15px 0; color: #10b981;">Incident Details</h3>
            <p style="margin: 5px 0;"><strong>Title:</strong> ${incident.title}</p>
            <p style="margin: 5px 0;"><strong>Description:</strong> ${incident.description}</p>
            <p style="margin: 5px 0;"><strong>Severity:</strong> ${incident.severity.toUpperCase()}</p>
            <p style="margin: 5px 0;"><strong>Resolved By:</strong> ${resolver.firstName} ${resolver.lastName}</p>
            ${incident.resolvedAt ? `<p style="margin: 5px 0;"><strong>Resolved On:</strong> ${new Date(incident.resolvedAt).toLocaleDateString()}</p>` : ''}
          </div>

          <p>All corrective actions have been completed and documented. Please review the final report in the Safety Dashboard.</p>

          <p style="margin-top: 30px;">Thank you for your attention to this matter.</p>

          <p>Best regards,<br><strong>Roof ER Safety Team</strong></p>
        </div>

        <div style="background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; color: #666; font-size: 12px;">
          <p style="margin: 0;">This is an automated message from Roof ER Command Center.</p>
          <p style="margin: 10px 0 0 0;">© ${new Date().getFullYear()} Roof ER. All rights reserved.</p>
        </div>
      </body>
    </html>
  `;

  const text = `
✅ Safety Incident #${incident.id} Resolved

The following safety incident has been successfully resolved:

INCIDENT DETAILS:
Title: ${incident.title}
Description: ${incident.description}
Severity: ${incident.severity.toUpperCase()}
Resolved By: ${resolver.firstName} ${resolver.lastName}
${incident.resolvedAt ? `Resolved On: ${new Date(incident.resolvedAt).toLocaleDateString()}` : ''}

All corrective actions have been completed and documented. Please review the final report in the Safety Dashboard.

Thank you for your attention to this matter.

Best regards,
Roof ER Safety Team

---
This is an automated message from Roof ER Command Center.
© ${new Date().getFullYear()} Roof ER. All rights reserved.
  `.trim();

  return { subject, html, text };
}
