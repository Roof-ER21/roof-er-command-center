import { google } from 'googleapis';
import { db } from '../db.js';
import { ptoRequests, users } from '../../shared/schema.js';
import { eq, and, isNull } from 'drizzle-orm';

export interface CalendarEvent {
  id?: string;
  summary: string;
  description: string;
  startDate: string;
  endDate: string;
  employeeEmail: string;
}

export interface CalendarSyncResult {
  googleEventId?: string;
  hrCalendarEventId?: string;
}

/**
 * PTO Calendar Service
 * Syncs approved PTO requests to Google Calendar
 *
 * Features:
 * - Creates events in employee's calendar
 * - Creates events in HR shared calendar
 * - Includes reminders (email 24h before, popup 1h before)
 * - Supports both real Google Calendar API and simulation mode
 */
class PtoCalendarService {
  private calendar: any;
  private simulationMode: boolean;
  private employeeCalendarId: string;
  private hrCalendarId: string;

  constructor() {
    // Check if Google Calendar is configured
    const serviceAccountJson = process.env.GOOGLE_SERVICE_ACCOUNT;
    this.employeeCalendarId = process.env.GOOGLE_EMPLOYEE_CALENDAR_ID || 'primary';
    this.hrCalendarId = process.env.GOOGLE_HR_CALENDAR_ID || 'primary';

    if (!serviceAccountJson) {
      console.log('⚠️  Google Calendar: Running in SIMULATION mode (no GOOGLE_SERVICE_ACCOUNT)');
      this.simulationMode = true;
      return;
    }

    try {
      const credentials = JSON.parse(serviceAccountJson);
      const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: [
          'https://www.googleapis.com/auth/calendar',
          'https://www.googleapis.com/auth/calendar.events',
        ],
      });

      this.calendar = google.calendar({ version: 'v3', auth });
      this.simulationMode = false;
      console.log('✅ Google Calendar: Initialized with service account');
    } catch (error) {
      console.error('⚠️  Google Calendar: Failed to initialize, using SIMULATION mode', error);
      this.simulationMode = true;
    }
  }

  /**
   * Create PTO calendar event for approved request
   */
  async createPtoCalendarEvent(
    ptoRequest: any,
    employee: any
  ): Promise<CalendarSyncResult> {
    const result: CalendarSyncResult = {};

    if (!employee.email) {
      console.error('❌ Cannot create calendar event: employee email missing');
      return result;
    }

    try {
      // Format dates for Google Calendar (YYYY-MM-DD for all-day events)
      const startDate = this.formatDateForCalendar(ptoRequest.startDate);
      const endDate = this.calculateEndDate(ptoRequest.endDate);

      // Create employee calendar event
      const employeeEvent = {
        summary: `PTO: ${ptoRequest.type || 'VACATION'}`,
        description: `PTO approved.\n\nType: ${ptoRequest.type}\nDays: ${ptoRequest.days}\nReason: ${ptoRequest.reason || 'Not specified'}`,
        start: {
          date: startDate,
        },
        end: {
          date: endDate,
        },
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 }, // 24 hours before
            { method: 'popup', minutes: 60 }, // 1 hour before
          ],
        },
      };

      // Create HR calendar event
      const hrEvent = {
        summary: `PTO: ${employee.firstName} ${employee.lastName} - ${ptoRequest.type}`,
        description: `Employee: ${employee.firstName} ${employee.lastName}\nEmail: ${employee.email}\nDepartment: ${employee.department || 'N/A'}\nType: ${ptoRequest.type}\nDays: ${ptoRequest.days}\nReason: ${ptoRequest.reason || 'Not specified'}`,
        start: {
          date: startDate,
        },
        end: {
          date: endDate,
        },
        attendees: [
          { email: employee.email },
        ],
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 },
          ],
        },
      };

      if (this.simulationMode) {
        // Simulation mode - just log what would happen
        const simEmployeeId = `sim-emp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const simHrId = `sim-hr-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        console.log(`
🗓️  [SIMULATION] Would create employee calendar event:
   Event ID: ${simEmployeeId}
   Summary: ${employeeEvent.summary}
   Start: ${startDate}
   End: ${endDate}
   Employee: ${employee.email}
        `);

        console.log(`
🗓️  [SIMULATION] Would create HR calendar event:
   Event ID: ${simHrId}
   Summary: ${hrEvent.summary}
   Start: ${startDate}
   End: ${endDate}
   HR Calendar: ${this.hrCalendarId}
        `);

        result.googleEventId = simEmployeeId;
        result.hrCalendarEventId = simHrId;
      } else {
        // Real mode - create actual Google Calendar events
        try {
          // Create event in employee calendar
          const employeeResponse = await this.calendar.events.insert({
            calendarId: employee.email, // Use employee's email as calendar ID
            requestBody: employeeEvent,
            sendUpdates: 'all', // Send email notification
          });

          result.googleEventId = employeeResponse.data.id;
          console.log(`✅ Created employee calendar event: ${result.googleEventId}`);
        } catch (error: any) {
          console.error(`❌ Failed to create employee calendar event:`, error.message);
          // Continue to try HR calendar even if employee calendar fails
        }

        try {
          // Create event in HR shared calendar
          const hrResponse = await this.calendar.events.insert({
            calendarId: this.hrCalendarId,
            requestBody: hrEvent,
            sendUpdates: 'all',
          });

          result.hrCalendarEventId = hrResponse.data.id;
          console.log(`✅ Created HR calendar event: ${result.hrCalendarEventId}`);
        } catch (error: any) {
          console.error(`❌ Failed to create HR calendar event:`, error.message);
        }
      }

      return result;
    } catch (error) {
      console.error('❌ Error creating PTO calendar events:', error);
      return result;
    }
  }

  /**
   * Delete PTO calendar events (when PTO is denied or revoked)
   */
  async deletePtoCalendarEvent(
    googleEventId?: string | null,
    hrCalendarEventId?: string | null,
    employeeEmail?: string
  ): Promise<void> {
    if (!googleEventId && !hrCalendarEventId) {
      console.log('⚠️  No calendar event IDs to delete');
      return;
    }

    try {
      if (this.simulationMode) {
        // Simulation mode
        if (googleEventId) {
          console.log(`🗓️  [SIMULATION] Would delete employee calendar event: ${googleEventId}`);
        }
        if (hrCalendarEventId) {
          console.log(`🗓️  [SIMULATION] Would delete HR calendar event: ${hrCalendarEventId}`);
        }
      } else {
        // Real mode - delete actual Google Calendar events
        if (googleEventId && employeeEmail) {
          try {
            await this.calendar.events.delete({
              calendarId: employeeEmail,
              eventId: googleEventId,
              sendUpdates: 'all', // Notify attendees
            });
            console.log(`✅ Deleted employee calendar event: ${googleEventId}`);
          } catch (error: any) {
            console.error(`❌ Failed to delete employee calendar event:`, error.message);
          }
        }

        if (hrCalendarEventId) {
          try {
            await this.calendar.events.delete({
              calendarId: this.hrCalendarId,
              eventId: hrCalendarEventId,
              sendUpdates: 'all',
            });
            console.log(`✅ Deleted HR calendar event: ${hrCalendarEventId}`);
          } catch (error: any) {
            console.error(`❌ Failed to delete HR calendar event:`, error.message);
          }
        }
      }
    } catch (error) {
      console.error('❌ Error deleting PTO calendar events:', error);
    }
  }

  /**
   * Sync all approved PTO requests without calendar event IDs
   * This is used for backfilling and scheduled sync jobs
   */
  async syncPtoToCalendar(): Promise<{ synced: number; errors: number }> {
    let synced = 0;
    let errors = 0;

    try {
      console.log('🔄 Starting PTO calendar sync...');

      // Find all approved PTO requests without calendar event IDs
      const pendingSyncRequests = await db
        .select({
          pto: ptoRequests,
          employee: users,
        })
        .from(ptoRequests)
        .innerJoin(users, eq(ptoRequests.employeeId, users.id))
        .where(
          and(
            eq(ptoRequests.status, 'APPROVED'),
            isNull(ptoRequests.googleEventId)
          )
        );

      console.log(`📊 Found ${pendingSyncRequests.length} PTO requests to sync`);

      for (const { pto, employee } of pendingSyncRequests) {
        try {
          // Create calendar events
          const result = await this.createPtoCalendarEvent(pto, employee);

          // Update database with event IDs
          if (result.googleEventId || result.hrCalendarEventId) {
            const updateData: any = {
              googleEventId: result.googleEventId || null,
              hrCalendarEventId: result.hrCalendarEventId || null,
              updatedAt: new Date(),
            };

            await db
              .update(ptoRequests)
              .set(updateData)
              .where(eq(ptoRequests.id, pto.id));

            synced++;
            console.log(`✅ Synced PTO request #${pto.id} for ${employee.firstName} ${employee.lastName}`);
          } else {
            errors++;
            console.error(`❌ Failed to sync PTO request #${pto.id} - no event IDs returned`);
          }
        } catch (error) {
          errors++;
          console.error(`❌ Error syncing PTO request #${pto.id}:`, error);
        }
      }

      console.log(`
✅ PTO Calendar Sync Complete
   Synced: ${synced}
   Errors: ${errors}
      `);

      return { synced, errors };
    } catch (error) {
      console.error('❌ Fatal error in PTO calendar sync:', error);
      return { synced, errors };
    }
  }

  /**
   * Format date for Google Calendar (YYYY-MM-DD)
   */
  private formatDateForCalendar(dateString: string): string {
    // Ensure date is in YYYY-MM-DD format
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Calculate end date for calendar event
   * Google Calendar end dates are exclusive, so we add 1 day
   */
  private calculateEndDate(dateString: string): string {
    const date = new Date(dateString);
    date.setDate(date.getDate() + 1); // Add 1 day for exclusive end date
    return this.formatDateForCalendar(date.toISOString());
  }

  /**
   * Check if service is in simulation mode
   */
  isSimulationMode(): boolean {
    return this.simulationMode;
  }
}

// Export singleton instance
export const ptoCalendarService = new PtoCalendarService();

// Export functions for convenience
export async function createPtoCalendarEvent(
  ptoRequest: any,
  employee: any
): Promise<CalendarSyncResult> {
  return ptoCalendarService.createPtoCalendarEvent(ptoRequest, employee);
}

export async function deletePtoCalendarEvent(
  googleEventId?: string | null,
  hrCalendarEventId?: string | null,
  employeeEmail?: string
): Promise<void> {
  return ptoCalendarService.deletePtoCalendarEvent(googleEventId, hrCalendarEventId, employeeEmail);
}

export async function syncPtoToCalendar(): Promise<{ synced: number; errors: number }> {
  return ptoCalendarService.syncPtoToCalendar();
}
