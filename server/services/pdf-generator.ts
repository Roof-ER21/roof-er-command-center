import PDFDocument from 'pdfkit';

/**
 * PDF Generator Service
 *
 * Generates PDF documents for various HR purposes including offer letters,
 * contracts, and other official documents.
 */

export interface OfferLetterData {
  candidateName: string;
  position: string;
  department: string;
  startDate: Date;
  salary: number;
  salaryType: 'hourly' | 'annual' | 'per_project';
  employmentType: 'W2' | '1099' | 'CONTRACTOR' | 'SUB_CONTRACTOR';
  benefits?: string[];
  reportingTo?: string;
  workLocation?: string;
  offerExpirationDate?: Date;
}

/**
 * Format date to readable string
 */
function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Format salary with proper currency
 */
function formatSalary(amount: number, type: string): string {
  const formattedAmount = amount.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  switch (type) {
    case 'hourly':
      return `${formattedAmount} per hour`;
    case 'annual':
      return `${formattedAmount} per year`;
    case 'per_project':
      return `${formattedAmount} per project`;
    default:
      return formattedAmount;
  }
}

/**
 * Generate Offer Letter PDF
 *
 * Creates a professional offer letter PDF with company branding
 * and all necessary employment details.
 */
export async function generateOfferLetterPDF(data: OfferLetterData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    const doc = new PDFDocument({
      size: 'LETTER',
      margins: {
        top: 72,
        bottom: 72,
        left: 72,
        right: 72
      }
    });

    // Collect PDF chunks
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', (error) => reject(error));

    try {
      // ============================================
      // HEADER SECTION
      // ============================================

      // Company logo placeholder (if logo exists)
      // Uncomment and adjust path if you have a logo
      // doc.image('path/to/logo.png', 72, 45, { width: 150 });

      // Company name
      doc
        .fontSize(24)
        .font('Helvetica-Bold')
        .fillColor('#667eea')
        .text('ROOF ER', { align: 'center' })
        .moveDown(0.5);

      // Document title
      doc
        .fontSize(18)
        .font('Helvetica-Bold')
        .fillColor('#333333')
        .text('OFFER OF EMPLOYMENT', { align: 'center' })
        .moveDown(1.5);

      // Date
      doc
        .fontSize(11)
        .font('Helvetica')
        .fillColor('#666666')
        .text(`Date: ${formatDate(new Date())}`, { align: 'right' })
        .moveDown(2);

      // ============================================
      // GREETING
      // ============================================

      doc
        .fontSize(12)
        .fillColor('#000000')
        .text(`Dear ${data.candidateName},`, { align: 'left' })
        .moveDown(1);

      // Opening paragraph
      doc
        .fontSize(11)
        .fillColor('#333333')
        .text(
          `We are pleased to offer you the position of ${data.position} in our ${data.department} department at Roof ER. We believe your skills and experience will be a valuable asset to our team.`,
          { align: 'justify', lineGap: 4 }
        )
        .moveDown(1.5);

      // ============================================
      // POSITION DETAILS SECTION
      // ============================================

      doc
        .fontSize(14)
        .font('Helvetica-Bold')
        .fillColor('#667eea')
        .text('Position Details', { underline: true })
        .moveDown(0.5);

      const detailsStartY = doc.y;

      doc
        .fontSize(11)
        .font('Helvetica')
        .fillColor('#333333');

      // Position details list
      const details = [
        { label: 'Position', value: data.position },
        { label: 'Department', value: data.department },
        { label: 'Employment Type', value: data.employmentType },
        { label: 'Start Date', value: formatDate(data.startDate) },
        { label: 'Compensation', value: formatSalary(data.salary, data.salaryType) },
      ];

      if (data.reportingTo) {
        details.push({ label: 'Reporting To', value: data.reportingTo });
      }

      if (data.workLocation) {
        details.push({ label: 'Work Location', value: data.workLocation });
      }

      details.forEach(({ label, value }) => {
        doc
          .font('Helvetica-Bold')
          .text(`${label}: `, { continued: true })
          .font('Helvetica')
          .text(value)
          .moveDown(0.3);
      });

      doc.moveDown(1);

      // ============================================
      // BENEFITS SECTION (if provided)
      // ============================================

      if (data.benefits && data.benefits.length > 0) {
        doc
          .fontSize(14)
          .font('Helvetica-Bold')
          .fillColor('#667eea')
          .text('Benefits Package', { underline: true })
          .moveDown(0.5);

        doc
          .fontSize(11)
          .font('Helvetica')
          .fillColor('#333333');

        data.benefits.forEach((benefit, index) => {
          doc
            .text(`• ${benefit}`, { indent: 20 })
            .moveDown(0.3);
        });

        doc.moveDown(1);
      }

      // ============================================
      // TERMS SECTION
      // ============================================

      doc
        .fontSize(14)
        .font('Helvetica-Bold')
        .fillColor('#667eea')
        .text('Terms and Conditions', { underline: true })
        .moveDown(0.5);

      const terms = [
        'This offer is contingent upon successful completion of background checks and reference verification.',
        'You will be required to sign a confidentiality agreement and company policies acknowledgment.',
        `${data.employmentType === 'W2' ? 'As a W-2 employee, you will be eligible for company benefits as outlined in our employee handbook.' : 'As a contractor, you will be responsible for your own taxes, insurance, and benefits.'}`,
        'This position is at-will, meaning either party may terminate employment at any time with or without cause or notice.',
      ];

      doc
        .fontSize(11)
        .font('Helvetica')
        .fillColor('#333333');

      terms.forEach((term, index) => {
        doc
          .text(`${index + 1}. ${term}`, { align: 'justify', lineGap: 4 })
          .moveDown(0.5);
      });

      doc.moveDown(1);

      // ============================================
      // OFFER EXPIRATION
      // ============================================

      if (data.offerExpirationDate) {
        doc
          .fontSize(11)
          .font('Helvetica-Bold')
          .fillColor('#dc2626')
          .text(
            `This offer expires on ${formatDate(data.offerExpirationDate)}. Please sign and return by this date to accept.`,
            { align: 'justify' }
          )
          .moveDown(1.5);
      }

      // ============================================
      // CLOSING
      // ============================================

      doc
        .fontSize(11)
        .font('Helvetica')
        .fillColor('#333333')
        .text(
          'We are excited about the possibility of you joining our team and look forward to your positive response.',
          { align: 'justify', lineGap: 4 }
        )
        .moveDown(2);

      // ============================================
      // SIGNATURE SECTION
      // ============================================

      doc
        .fontSize(14)
        .font('Helvetica-Bold')
        .fillColor('#667eea')
        .text('Acceptance', { underline: true })
        .moveDown(1);

      doc
        .fontSize(11)
        .font('Helvetica')
        .fillColor('#333333')
        .text(
          'Please sign below to indicate your acceptance of this offer:',
          { align: 'left' }
        )
        .moveDown(2);

      // Candidate signature line
      doc
        .fontSize(11)
        .moveTo(72, doc.y)
        .lineTo(300, doc.y)
        .stroke()
        .moveDown(0.3);

      doc
        .fontSize(10)
        .fillColor('#666666')
        .text('Candidate Signature', 72, doc.y)
        .moveDown(0.1);

      doc
        .text('Date: ___________________', 72, doc.y)
        .moveDown(2);

      // Company signature line
      doc
        .fontSize(11)
        .fillColor('#333333')
        .moveTo(72, doc.y)
        .lineTo(300, doc.y)
        .stroke()
        .moveDown(0.3);

      doc
        .fontSize(10)
        .fillColor('#666666')
        .text('Roof ER Representative', 72, doc.y)
        .moveDown(0.1);

      doc
        .text('Date: ___________________', 72, doc.y)
        .moveDown(2);

      // ============================================
      // FOOTER
      // ============================================

      doc
        .fontSize(9)
        .font('Helvetica')
        .fillColor('#999999')
        .text(
          'This is an official offer letter from Roof ER. Please retain this document for your records.',
          {
            align: 'center',
            lineGap: 2
          }
        )
        .moveDown(0.5);

      doc
        .fontSize(8)
        .text(
          `© ${new Date().getFullYear()} Roof ER. All rights reserved.`,
          { align: 'center' }
        );

      // Finalize PDF
      doc.end();

    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Generate simple employment contract PDF
 * (Can be expanded for other document types)
 */
export async function generateEmploymentContractPDF(data: any): Promise<Buffer> {
  // Placeholder for future implementation
  throw new Error('Employment contract generation not yet implemented');
}

/**
 * Generate document with custom content
 */
export async function generateCustomPDF(
  title: string,
  content: string
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    const doc = new PDFDocument();

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', (error) => reject(error));

    try {
      doc
        .fontSize(20)
        .text(title, { align: 'center' })
        .moveDown(2);

      doc
        .fontSize(12)
        .text(content, { align: 'justify' });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
