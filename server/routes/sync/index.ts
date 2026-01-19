import { Router } from 'express';
import { db } from '../../db.js';
import { candidates, users, interviews } from '../../../shared/schema.js';
import { GoogleSheetsService } from '../../services/google-sheets.js';
import { eq } from 'drizzle-orm';

const router = Router();

/**
 * POST /api/sync/google-sheets
 * Sync data to Google Sheets
 */
router.post('/google-sheets', async (req, res) => {
  try {
    const { syncType } = req.body;

    // Validate syncType
    const validSyncTypes = ['candidates', 'employees', 'interviews', 'all'];
    if (!syncType || !validSyncTypes.includes(syncType)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid syncType. Must be one of: candidates, employees, interviews, all',
      });
    }

    // Check if Google Sheets is configured
    if (!process.env.GOOGLE_SERVICE_ACCOUNT || !process.env.GOOGLE_SPREADSHEET_ID) {
      return res.status(503).json({
        success: false,
        error: 'Google Sheets integration is not configured. Please set GOOGLE_SERVICE_ACCOUNT and GOOGLE_SPREADSHEET_ID environment variables.',
      });
    }

    const sheetsService = new GoogleSheetsService();
    const synced: string[] = [];
    const errors: string[] = [];

    // Sync candidates
    if (syncType === 'candidates' || syncType === 'all') {
      try {
        const candidatesData = await db.select().from(candidates);
        await sheetsService.syncCandidates(candidatesData);
        synced.push(`candidates (${candidatesData.length} rows)`);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`candidates: ${message}`);
        console.error('Error syncing candidates:', error);
      }
    }

    // Sync employees
    if (syncType === 'employees' || syncType === 'all') {
      try {
        const employeesData = await db
          .select()
          .from(users)
          .where(eq(users.isActive, true));
        await sheetsService.syncEmployees(employeesData);
        synced.push(`employees (${employeesData.length} rows)`);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`employees: ${message}`);
        console.error('Error syncing employees:', error);
      }
    }

    // Sync interviews
    if (syncType === 'interviews' || syncType === 'all') {
      try {
        const interviewsData = await db.select().from(interviews);
        await sheetsService.syncInterviews(interviewsData);
        synced.push(`interviews (${interviewsData.length} rows)`);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`interviews: ${message}`);
        console.error('Error syncing interviews:', error);
      }
    }

    // Return response
    if (errors.length > 0 && synced.length === 0) {
      return res.status(500).json({
        success: false,
        error: 'All sync operations failed',
        details: errors,
      });
    }

    res.json({
      success: true,
      message: `Successfully synced ${synced.join(', ')}`,
      synced,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('Sync error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
});

/**
 * GET /api/sync/status
 * Check Google Sheets integration status
 */
router.get('/status', async (req, res) => {
  const hasServiceAccount = !!process.env.GOOGLE_SERVICE_ACCOUNT;
  const hasSpreadsheetId = !!process.env.GOOGLE_SPREADSHEET_ID;

  res.json({
    configured: hasServiceAccount && hasSpreadsheetId,
    hasServiceAccount,
    hasSpreadsheetId,
    spreadsheetId: hasSpreadsheetId ? process.env.GOOGLE_SPREADSHEET_ID : null,
  });
});

export default router;
