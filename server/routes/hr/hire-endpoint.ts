import { Router, Request, Response } from 'express';
import { db } from '../../db.js';
import { candidates } from '../../../shared/schema.js';
import { eq } from 'drizzle-orm';
import { executeHireAutomation } from '../../services/hire-automation.js';

/**
 * HIRE ENDPOINT
 *
 * POST /api/hr/candidates/:id/hire
 *
 * Executes the complete HIRE automation chain:
 * 1. Creates user account with temp password TRD2026!
 * 2. Creates PTO policy (17 days for W2 non-Sales, 0 for 1099/Sales)
 * 3. Assigns welcome package (if provided)
 * 4. Creates equipment receipt with signing token
 * 5. Creates 6 onboarding tasks
 * 6. Sends welcome email
 *
 * Also updates candidate status to HIRED.
 */

const router = Router();

interface HireRequest {
  role: string;             // User role (from modal)
  startDate: string;        // YYYY-MM-DD
  employmentType: 'W2' | '1099';
  department?: string;
  salary?: string;
  welcomePackageId?: number;
}

router.post('/candidates/:id/hire', async (req: Request, res: Response) => {
  try {
    const candidateId = parseInt(req.params.id, 10);
    if (Number.isNaN(candidateId)) {
      return res.status(400).json({ error: 'Invalid candidate id' });
    }

    // Validate request body
    const {
      role,
      startDate,
      employmentType,
      department,
      salary,
      welcomePackageId,
    }: HireRequest = req.body;

    if (!role || !startDate || !employmentType) {
      return res.status(400).json({
        error: 'Missing required fields: role, startDate, employmentType',
      });
    }

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
      return res.status(400).json({
        error: 'Invalid startDate format. Expected YYYY-MM-DD',
      });
    }

    // Validate employment type
    if (!['W2', '1099'].includes(employmentType)) {
      return res.status(400).json({
        error: 'Invalid employmentType. Expected W2 or 1099',
      });
    }

    // Get candidate
    const [candidate] = await db.select().from(candidates)
      .where(eq(candidates.id, candidateId))
      .limit(1);

    if (!candidate) {
      return res.status(404).json({ error: 'Candidate not found' });
    }

    // Check if already hired
    if (candidate.status === 'hired' || candidate.status === 'HIRED') {
      return res.status(400).json({
        error: 'Candidate already hired',
        userId: null, // Could query users table to find existing user
      });
    }

    console.log('🎯 Starting HIRE automation...');
    console.log(`   Candidate: ${candidate.firstName} ${candidate.lastName}`);
    console.log(`   Role: ${role}`);
    console.log(`   Start Date: ${startDate}`);
    console.log(`   Employment Type: ${employmentType}`);

    // Execute hire automation
    const result = await executeHireAutomation({
      candidateId,
      role,
      startDate,
      employmentType,
      position: candidate.position,
      department,
      salary,
      welcomePackageId,
    });

    // Update candidate status to HIRED
    await db.update(candidates)
      .set({
        status: 'hired',
        updatedAt: new Date(),
      })
      .where(eq(candidates.id, candidateId));

    console.log('✅ HIRE automation complete');
    console.log(`   Steps completed: ${Object.values(result.steps).filter(Boolean).length}/6`);
    console.log(`   Warnings: ${result.warnings.length}`);
    console.log(`   Errors: ${result.errors.length}`);

    // Return result
    if (result.success) {
      return res.status(200).json({
        success: true,
        message: 'Candidate hired successfully',
        userId: result.userId,
        steps: result.steps,
        warnings: result.warnings,
        errors: result.errors,
      });
    } else {
      // Partial failure
      return res.status(500).json({
        success: false,
        message: 'Hire automation failed',
        userId: result.userId,
        steps: result.steps,
        warnings: result.warnings,
        errors: result.errors,
      });
    }

  } catch (error: any) {
    console.error('Hire endpoint error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error during hire process',
      details: error.message,
    });
  }
});

export default router;
