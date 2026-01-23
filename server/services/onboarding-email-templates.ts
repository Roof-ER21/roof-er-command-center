/**
 * Onboarding Email Templates
 *
 * Templates for onboarding task notifications and assignments
 */

/**
 * Onboarding Task Overdue Email Template
 */
export function onboardingTaskOverdueTemplate(
  employee: { firstName: string; lastName: string; email: string },
  task: { taskName: string; dueDate: string | null; description?: string | null },
  daysOverdue: number
): { subject: string; html: string; text: string } {
  const subject = `⚠️ Overdue Onboarding Task: ${task.taskName}`;
  const dueDateFormatOptions: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };
  const dueDateLabel = task.dueDate
    ? new Date(task.dueDate).toLocaleDateString('en-US', dueDateFormatOptions)
    : 'TBD';

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">⚠️ Task Overdue</h1>
          <p style="color: #fef2f2; margin: 10px 0 0 0;">Action Required</p>
        </div>

        <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none;">
          <h2 style="color: #dc2626; margin-top: 0;">Onboarding Task Requires Attention</h2>

          <p>Hi ${employee.firstName},</p>

          <p>You have an overdue onboarding task that requires immediate attention.</p>

          <div style="background: #fee2e2; padding: 20px; border-left: 4px solid #dc2626; margin: 25px 0; border-radius: 4px;">
            <h3 style="margin: 0 0 10px 0; color: #dc2626;">Task Details</h3>
            <p style="margin: 5px 0;"><strong>Task:</strong> ${task.taskName}</p>
            ${task.description ? `<p style="margin: 5px 0;"><strong>Description:</strong> ${task.description}</p>` : ''}
            <p style="margin: 5px 0;"><strong>Due Date:</strong> ${dueDateLabel}</p>
            <p style="margin: 5px 0; font-weight: bold; color: #dc2626;">
              <strong>Days Overdue:</strong> ${daysOverdue} day${daysOverdue !== 1 ? 's' : ''}
            </p>
          </div>

          <div style="background: #fef3c7; padding: 15px; border-radius: 4px; border-left: 4px solid #f59e0b; margin: 20px 0;">
            <strong>⏰ Time Sensitive</strong><br>
            Please complete this task as soon as possible to stay on track with your onboarding process.
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.APP_URL || 'https://roofer.com'}/dashboard?tab=onboarding"
               style="background: #dc2626; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
              Complete Task Now →
            </a>
          </div>

          <p style="color: #666; font-size: 14px; margin-top: 25px;">
            If you need help completing this task or have questions, please reach out to your manager or HR representative.
          </p>

          <p style="margin-top: 30px;">Best regards,<br><strong>Roof ER HR Team</strong></p>
        </div>

        <div style="background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; color: #666; font-size: 12px;">
          <p style="margin: 0;">This is an automated reminder from Roof ER Command Center.</p>
          <p style="margin: 10px 0 0 0;">© ${new Date().getFullYear()} Roof ER. All rights reserved.</p>
        </div>
      </body>
    </html>
  `;

  const text = `
⚠️ OVERDUE ONBOARDING TASK

Hi ${employee.firstName},

You have an overdue onboarding task that requires immediate attention.

TASK DETAILS:
Task: ${task.taskName}
${task.description ? `Description: ${task.description}` : ''}
Due Date: ${dueDateLabel}
Days Overdue: ${daysOverdue} day${daysOverdue !== 1 ? 's' : ''}

⏰ TIME SENSITIVE
Please complete this task as soon as possible to stay on track with your onboarding process.

Complete your task at: ${process.env.APP_URL || 'https://roofer.com'}/dashboard?tab=onboarding

If you need help completing this task or have questions, please reach out to your manager or HR representative.

Best regards,
Roof ER HR Team

---
This is an automated reminder from Roof ER Command Center.
© ${new Date().getFullYear()} Roof ER. All rights reserved.
  `.trim();

  return { subject, html, text };
}

/**
 * Onboarding Assigned Email Template
 */
export function onboardingAssignedTemplate(
  employee: { firstName: string; lastName: string; email: string },
  template: { name: string; description?: string | null },
  manager: { firstName: string; lastName: string },
  tasksCount: number
): { subject: string; html: string; text: string } {
  const subject = `Welcome! Your Onboarding Process Has Started`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">🎉 Welcome to Roof ER!</h1>
          <p style="color: #f0f0f0; margin: 10px 0 0 0;">Your Onboarding Journey Begins</p>
        </div>

        <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none;">
          <h2 style="color: #667eea; margin-top: 0;">Let's Get You Started</h2>

          <p>Hi ${employee.firstName},</p>

          <p>Welcome to the team! ${manager.firstName} ${manager.lastName} has assigned you the <strong>"${template.name}"</strong> onboarding process to help you get up to speed.</p>

          ${template.description ? `
          <div style="background: #f8f9fa; padding: 15px; border-radius: 4px; margin: 20px 0;">
            <p style="margin: 0;"><strong>About this onboarding:</strong></p>
            <p style="margin: 5px 0 0 0;">${template.description}</p>
          </div>
          ` : ''}

          <div style="background: #ede9fe; padding: 20px; border-left: 4px solid #667eea; margin: 25px 0; border-radius: 4px;">
            <h3 style="margin: 0 0 10px 0; color: #667eea;">📋 Your Onboarding Checklist</h3>
            <p style="margin: 5px 0;">You have <strong>${tasksCount} task${tasksCount !== 1 ? 's' : ''}</strong> to complete as part of your onboarding.</p>
          </div>

          <h3 style="color: #667eea;">What You Need to Do:</h3>
          <ol style="line-height: 1.8;">
            <li>Log in to the HR Portal using your credentials</li>
            <li>Navigate to your Dashboard → Onboarding tab</li>
            <li>Review each task and its due date</li>
            <li>Complete tasks before their deadlines</li>
            <li>Mark tasks as complete when finished</li>
          </ol>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.APP_URL || 'https://roofer.com'}/dashboard?tab=onboarding"
               style="background: #667eea; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
              View Your Onboarding Tasks →
            </a>
          </div>

          <div style="background: #dbeafe; padding: 15px; border-radius: 4px; border-left: 4px solid #3b82f6; margin: 20px 0;">
            <strong>💡 Pro Tip:</strong><br>
            Complete your tasks ahead of schedule to make a great first impression!
          </div>

          <p style="color: #666; font-size: 14px; margin-top: 25px;">
            If you have any questions or need assistance, please don't hesitate to reach out to ${manager.firstName} or the HR team.
          </p>

          <p style="margin-top: 30px;">We're excited to have you on board!</p>

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
🎉 WELCOME TO ROOF ER!
Your Onboarding Journey Begins

Hi ${employee.firstName},

Welcome to the team! ${manager.firstName} ${manager.lastName} has assigned you the "${template.name}" onboarding process to help you get up to speed.

${template.description ? `ABOUT THIS ONBOARDING:\n${template.description}\n` : ''}

📋 YOUR ONBOARDING CHECKLIST
You have ${tasksCount} task${tasksCount !== 1 ? 's' : ''} to complete as part of your onboarding.

WHAT YOU NEED TO DO:
1. Log in to the HR Portal using your credentials
2. Navigate to your Dashboard → Onboarding tab
3. Review each task and its due date
4. Complete tasks before their deadlines
5. Mark tasks as complete when finished

View your onboarding tasks at: ${process.env.APP_URL || 'https://roofer.com'}/dashboard?tab=onboarding

💡 PRO TIP: Complete your tasks ahead of schedule to make a great first impression!

If you have any questions or need assistance, please don't hesitate to reach out to ${manager.firstName} or the HR team.

We're excited to have you on board!

Best regards,
Roof ER HR Team

---
This is an automated message from Roof ER Command Center.
© ${new Date().getFullYear()} Roof ER. All rights reserved.
  `.trim();

  return { subject, html, text };
}
