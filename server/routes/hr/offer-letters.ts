import { Router, Request, Response } from 'express';
import { db } from '../../db.js';
import { candidates } from '../../../shared/schema.js';
import { eq } from 'drizzle-orm';
import { generateOfferLetterPDF, type OfferLetterData } from '../../services/pdf-generator.js';

const router = Router();

/**
 * Generate and download offer letter PDF for a candidate
 *
 * GET /api/hr/candidates/:id/offer-letter
 *
 * Query parameters (optional):
 * - department: Department name (defaults to candidate's applied department or 'Operations')
 * - startDate: ISO date string (defaults to 2 weeks from now)
 * - salary: Number (required)
 * - salaryType: 'hourly' | 'annual' | 'per_project' (defaults to 'annual')
 * - employmentType: 'W2' | '1099' | 'CONTRACTOR' | 'SUB_CONTRACTOR' (defaults to 'W2')
 * - benefits: Comma-separated list of benefits
 * - reportingTo: Name of supervisor/manager
 * - workLocation: Work location address
 * - offerExpirationDays: Days until offer expires (defaults to 7)
 */
router.get('/candidates/:id/offer-letter', async (req: Request, res: Response) => {
  try {
    const candidateId = parseInt(req.params.id, 10);

    if (Number.isNaN(candidateId)) {
      return res.status(400).json({ error: 'Invalid candidate ID' });
    }

    // Fetch candidate from database
    const [candidate] = await db
      .select()
      .from(candidates)
      .where(eq(candidates.id, candidateId))
      .limit(1);

    if (!candidate) {
      return res.status(404).json({ error: 'Candidate not found' });
    }

    // Extract query parameters for offer details
    const {
      department = 'Operations',
      startDate,
      salary,
      salaryType = 'annual',
      employmentType = 'W2',
      benefits,
      reportingTo,
      workLocation,
      offerExpirationDays = '7',
    } = req.query;

    // Validate required parameters
    if (!salary) {
      return res.status(400).json({
        error: 'Salary is required',
        message: 'Please provide salary as a query parameter (e.g., ?salary=75000)',
      });
    }

    const salaryNumber = parseFloat(salary as string);
    if (Number.isNaN(salaryNumber) || salaryNumber <= 0) {
      return res.status(400).json({
        error: 'Invalid salary',
        message: 'Salary must be a positive number',
      });
    }

    // Parse start date (default to 2 weeks from now)
    let parsedStartDate: Date;
    if (startDate) {
      parsedStartDate = new Date(startDate as string);
      if (isNaN(parsedStartDate.getTime())) {
        return res.status(400).json({
          error: 'Invalid start date',
          message: 'Start date must be a valid ISO date string',
        });
      }
    } else {
      parsedStartDate = new Date();
      parsedStartDate.setDate(parsedStartDate.getDate() + 14); // Default: 2 weeks from now
    }

    // Parse benefits (comma-separated)
    let benefitsList: string[] | undefined;
    if (benefits) {
      benefitsList = (benefits as string)
        .split(',')
        .map((b) => b.trim())
        .filter((b) => b.length > 0);
    }

    // Parse offer expiration date
    const expirationDaysNumber = parseInt(offerExpirationDays as string, 10);
    const offerExpirationDate = new Date();
    offerExpirationDate.setDate(
      offerExpirationDate.getDate() + (isNaN(expirationDaysNumber) ? 7 : expirationDaysNumber)
    );

    // Validate employment type
    const validEmploymentTypes = ['W2', '1099', 'CONTRACTOR', 'SUB_CONTRACTOR'];
    if (!validEmploymentTypes.includes(employmentType as string)) {
      return res.status(400).json({
        error: 'Invalid employment type',
        message: `Employment type must be one of: ${validEmploymentTypes.join(', ')}`,
      });
    }

    // Validate salary type
    const validSalaryTypes = ['hourly', 'annual', 'per_project'];
    if (!validSalaryTypes.includes(salaryType as string)) {
      return res.status(400).json({
        error: 'Invalid salary type',
        message: `Salary type must be one of: ${validSalaryTypes.join(', ')}`,
      });
    }

    // Prepare offer letter data
    const offerData: OfferLetterData = {
      candidateName: `${candidate.firstName} ${candidate.lastName}`,
      position: candidate.position,
      department: department as string,
      startDate: parsedStartDate,
      salary: salaryNumber,
      salaryType: salaryType as 'hourly' | 'annual' | 'per_project',
      employmentType: employmentType as 'W2' | '1099' | 'CONTRACTOR' | 'SUB_CONTRACTOR',
      benefits: benefitsList,
      reportingTo: reportingTo as string | undefined,
      workLocation: workLocation as string | undefined,
      offerExpirationDate,
    };

    // Generate PDF
    const pdfBuffer = await generateOfferLetterPDF(offerData);

    // Set response headers for PDF download
    const fileName = `offer-letter-${candidate.lastName}-${candidate.firstName}.pdf`
      .replace(/\s+/g, '-')
      .toLowerCase();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    // Send PDF
    res.send(pdfBuffer);

    console.log(`✅ Generated offer letter PDF for candidate ${candidateId} (${candidate.firstName} ${candidate.lastName})`);
  } catch (error) {
    console.error('❌ Error generating offer letter PDF:', error);
    res.status(500).json({
      error: 'Failed to generate offer letter',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Preview offer letter data (without generating PDF)
 *
 * GET /api/hr/candidates/:id/offer-letter/preview
 */
router.get('/candidates/:id/offer-letter/preview', async (req: Request, res: Response) => {
  try {
    const candidateId = parseInt(req.params.id, 10);

    if (Number.isNaN(candidateId)) {
      return res.status(400).json({ error: 'Invalid candidate ID' });
    }

    const [candidate] = await db
      .select()
      .from(candidates)
      .where(eq(candidates.id, candidateId))
      .limit(1);

    if (!candidate) {
      return res.status(404).json({ error: 'Candidate not found' });
    }

    // Return candidate info and template for offer letter
    res.json({
      candidate: {
        id: candidate.id,
        name: `${candidate.firstName} ${candidate.lastName}`,
        position: candidate.position,
        email: candidate.email,
        phone: candidate.phone,
      },
      template: {
        department: 'Operations',
        startDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 2 weeks from now
        salaryType: 'annual',
        employmentType: 'W2',
        offerExpirationDays: 7,
      },
      parameters: {
        salary: 'required - number',
        department: 'optional - string (default: Operations)',
        startDate: 'optional - ISO date string (default: 2 weeks from now)',
        salaryType: 'optional - hourly|annual|per_project (default: annual)',
        employmentType: 'optional - W2|1099|CONTRACTOR|SUB_CONTRACTOR (default: W2)',
        benefits: 'optional - comma-separated list',
        reportingTo: 'optional - supervisor name',
        workLocation: 'optional - work location',
        offerExpirationDays: 'optional - number of days (default: 7)',
      },
      example: {
        url: `/api/hr/candidates/${candidateId}/offer-letter?salary=75000&department=Sales&employmentType=W2&benefits=Health Insurance,401k,PTO`,
      },
    });
  } catch (error) {
    console.error('Error fetching offer letter preview:', error);
    res.status(500).json({ error: 'Failed to fetch offer letter preview' });
  }
});

export default router;
