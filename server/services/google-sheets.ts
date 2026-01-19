import { google } from 'googleapis';

export interface SheetData {
  candidates?: any[];
  employees?: any[];
  interviews?: any[];
}

export class GoogleSheetsService {
  private sheets;
  private spreadsheetId: string;

  constructor() {
    // Use service account credentials from env
    const serviceAccountJson = process.env.GOOGLE_SERVICE_ACCOUNT;

    if (!serviceAccountJson) {
      throw new Error('GOOGLE_SERVICE_ACCOUNT environment variable is not set');
    }

    let credentials;
    try {
      credentials = JSON.parse(serviceAccountJson);
    } catch (error) {
      throw new Error('Invalid GOOGLE_SERVICE_ACCOUNT JSON format');
    }

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    this.sheets = google.sheets({ version: 'v4', auth });
    this.spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID || '';

    if (!this.spreadsheetId) {
      throw new Error('GOOGLE_SPREADSHEET_ID environment variable is not set');
    }
  }

  /**
   * Sync candidates to Google Sheets
   */
  async syncCandidates(candidates: any[]): Promise<void> {
    const sheetName = 'Candidates';

    // Prepare header row
    const headers = [
      'ID',
      'First Name',
      'Last Name',
      'Email',
      'Phone',
      'Position',
      'Status',
      'Rating',
      'Source',
      'Assigned To',
      'Referral Name',
      'Created At',
      'Updated At',
    ];

    // Prepare data rows
    const rows = candidates.map(c => [
      c.id,
      c.firstName,
      c.lastName,
      c.email,
      c.phone || '',
      c.position,
      c.status,
      c.rating || '',
      c.source || '',
      c.assignedTo || '',
      c.referralName || '',
      c.createdAt ? new Date(c.createdAt).toLocaleString() : '',
      c.updatedAt ? new Date(c.updatedAt).toLocaleString() : '',
    ]);

    // Combine headers and data
    const values = [headers, ...rows];

    await this.clearAndWriteSheet(sheetName, values);
  }

  /**
   * Sync employees to Google Sheets
   */
  async syncEmployees(employees: any[]): Promise<void> {
    const sheetName = 'Employees';

    // Prepare header row
    const headers = [
      'ID',
      'First Name',
      'Last Name',
      'Email',
      'Role',
      'Department',
      'Position',
      'Employment Type',
      'Hire Date',
      'Phone',
      'Status',
      'Created At',
    ];

    // Prepare data rows
    const rows = employees.map(e => [
      e.id,
      e.firstName,
      e.lastName,
      e.email,
      e.role,
      e.department || '',
      e.position || '',
      e.employmentType || '',
      e.hireDate || '',
      e.phone || '',
      e.isActive ? 'Active' : 'Inactive',
      e.createdAt ? new Date(e.createdAt).toLocaleString() : '',
    ]);

    // Combine headers and data
    const values = [headers, ...rows];

    await this.clearAndWriteSheet(sheetName, values);
  }

  /**
   * Sync interviews to Google Sheets
   */
  async syncInterviews(interviews: any[]): Promise<void> {
    const sheetName = 'Interviews';

    // Prepare header row
    const headers = [
      'ID',
      'Candidate ID',
      'Interviewer ID',
      'Scheduled At',
      'Duration (min)',
      'Type',
      'Status',
      'Location',
      'Meeting Link',
      'Rating',
      'Recommendation',
      'Created At',
    ];

    // Prepare data rows
    const rows = interviews.map(i => [
      i.id,
      i.candidateId,
      i.interviewerId || '',
      i.scheduledAt ? new Date(i.scheduledAt).toLocaleString() : '',
      i.duration || 60,
      i.type,
      i.status,
      i.location || '',
      i.meetingLink || '',
      i.rating || '',
      i.recommendation || '',
      i.createdAt ? new Date(i.createdAt).toLocaleString() : '',
    ]);

    // Combine headers and data
    const values = [headers, ...rows];

    await this.clearAndWriteSheet(sheetName, values);
  }

  /**
   * Clear sheet and write new data
   */
  private async clearAndWriteSheet(sheetName: string, values: any[][]): Promise<void> {
    try {
      // Ensure sheet exists
      await this.ensureSheetExists(sheetName);

      // Clear existing data
      await this.sheets.spreadsheets.values.clear({
        spreadsheetId: this.spreadsheetId,
        range: `${sheetName}!A1:Z`,
      });

      // Write new data
      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: `${sheetName}!A1`,
        valueInputOption: 'RAW',
        requestBody: {
          values,
        },
      });

      console.log(`✅ Successfully synced ${values.length - 1} rows to ${sheetName}`);
    } catch (error) {
      console.error(`❌ Error syncing ${sheetName}:`, error);
      throw error;
    }
  }

  /**
   * Ensure sheet exists, create if not
   */
  private async ensureSheetExists(sheetName: string): Promise<void> {
    try {
      const response = await this.sheets.spreadsheets.get({
        spreadsheetId: this.spreadsheetId,
      });

      const sheets = response.data.sheets || [];
      const sheetExists = sheets.some(s => s.properties?.title === sheetName);

      if (!sheetExists) {
        await this.sheets.spreadsheets.batchUpdate({
          spreadsheetId: this.spreadsheetId,
          requestBody: {
            requests: [
              {
                addSheet: {
                  properties: {
                    title: sheetName,
                  },
                },
              },
            ],
          },
        });
        console.log(`✅ Created new sheet: ${sheetName}`);
      }
    } catch (error) {
      console.error(`❌ Error ensuring sheet exists: ${sheetName}`, error);
      throw error;
    }
  }

  /**
   * Read data from Google Sheets
   */
  async readFromSheet(sheetName: string, range: string): Promise<any[][]> {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: `${sheetName}!${range}`,
      });

      return response.data.values || [];
    } catch (error) {
      console.error(`❌ Error reading from ${sheetName}:`, error);
      throw error;
    }
  }

  /**
   * Append data to sheet
   */
  async appendToSheet(sheetName: string, values: any[][]): Promise<void> {
    try {
      await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: `${sheetName}!A1`,
        valueInputOption: 'RAW',
        requestBody: {
          values,
        },
      });

      console.log(`✅ Appended ${values.length} rows to ${sheetName}`);
    } catch (error) {
      console.error(`❌ Error appending to ${sheetName}:`, error);
      throw error;
    }
  }
}
