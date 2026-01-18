// @ts-ignore - pdfkit types issue with ESM
import PDFDocument from 'pdfkit';
import type { Response } from 'express';

interface RoofDamageAnalysis {
  damageType: string;
  severity: string;
  confidence: number;
  affectedArea: string;
  recommendations: string[];
  estimatedCost: { min: number; max: number };
  urgencyLevel: string;
  insuranceArguments: string[];
}

interface DamageAssessmentRequest {
  analysisId?: number;
  customerName: string;
  propertyAddress: string;
  inspectionDate: string;
  analysisResult: RoofDamageAnalysis;
  photos?: string[];
  notes?: string;
}

interface InspectionFinding {
  area: string;
  condition: string;
  notes: string;
  photos?: string[];
}

interface CostEstimate {
  item: string;
  cost: number;
}

interface InspectionReportRequest {
  customerName: string;
  propertyAddress: string;
  inspectionDate: string;
  inspectorName: string;
  findings: InspectionFinding[];
  recommendations: string[];
  estimatedCosts?: CostEstimate[];
}

// Color scheme
const COLORS = {
  primary: '#1E3A8A', // Dark blue
  secondary: '#3B82F6', // Blue
  success: '#10B981', // Green
  warning: '#F59E0B', // Orange
  danger: '#EF4444', // Red
  text: '#1F2937', // Dark gray
  lightText: '#6B7280', // Medium gray
  border: '#E5E7EB', // Light gray
  background: '#F9FAFB', // Very light gray
};

// Severity colors
function getSeverityColor(severity: string): string {
  const severityLower = severity.toLowerCase();
  if (severityLower.includes('critical') || severityLower.includes('severe')) {
    return COLORS.danger;
  }
  if (severityLower.includes('moderate') || severityLower.includes('medium')) {
    return COLORS.warning;
  }
  return COLORS.success;
}

// Format currency
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// Add header to PDF
function addHeader(doc: PDFKit.PDFDocument, title: string) {
  // Blue header bar
  doc
    .rect(0, 0, doc.page.width, 100)
    .fill(COLORS.primary);

  // Logo placeholder (white box)
  doc
    .rect(40, 20, 60, 60)
    .fill('#FFFFFF');

  doc
    .fontSize(10)
    .fillColor(COLORS.primary)
    .text('ROOF ER', 45, 45, { width: 50, align: 'center' });

  // Title
  doc
    .fontSize(24)
    .fillColor('#FFFFFF')
    .text(title, 120, 35, { width: doc.page.width - 160 });

  // Reset position
  doc.y = 120;
}

// Add footer to PDF
function addFooter(doc: PDFKit.PDFDocument, pageNumber: number) {
  const bottomY = doc.page.height - 50;

  doc
    .fontSize(9)
    .fillColor(COLORS.lightText)
    .text(
      'Roof ER | Your Trusted Roofing Partner',
      50,
      bottomY,
      { align: 'center', width: doc.page.width - 100 }
    );

  doc
    .fontSize(8)
    .text(
      `Page ${pageNumber}`,
      50,
      bottomY + 15,
      { align: 'center', width: doc.page.width - 100 }
    );

  doc
    .fontSize(7)
    .fillColor(COLORS.lightText)
    .text(
      'This report is for informational purposes only. Final repair costs may vary.',
      50,
      bottomY + 28,
      { align: 'center', width: doc.page.width - 100 }
    );
}

// Add section header
function addSectionHeader(doc: PDFKit.PDFDocument, title: string) {
  doc
    .fontSize(16)
    .fillColor(COLORS.primary)
    .text(title, { underline: true })
    .moveDown(0.5);
}

// Add key-value pair
function addKeyValue(doc: PDFKit.PDFDocument, key: string, value: string) {
  doc
    .fontSize(11)
    .fillColor(COLORS.text)
    .font('Helvetica-Bold')
    .text(`${key}: `, { continued: true })
    .font('Helvetica')
    .fillColor(COLORS.lightText)
    .text(value)
    .moveDown(0.3);
}

// Add severity indicator
function addSeverityIndicator(doc: PDFKit.PDFDocument, severity: string, x: number, y: number) {
  const color = getSeverityColor(severity);

  // Draw circle
  doc
    .circle(x, y, 8)
    .fill(color);

  // Add label
  doc
    .fontSize(10)
    .fillColor(COLORS.text)
    .text(severity, x + 15, y - 5);
}

// Generate Damage Assessment PDF
export async function generateDamageAssessmentPDF(
  data: DamageAssessmentRequest,
  res: Response
): Promise<void> {
  const doc = new PDFDocument({ margin: 50, size: 'LETTER' });

  // Set response headers for PDF download
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="roof-damage-assessment-${data.customerName.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf"`
  );

  // Pipe PDF to response
  doc.pipe(res);

  let pageNumber = 1;

  // Page 1: Header and Report Info
  addHeader(doc, 'Roof Damage Assessment Report');

  // Report metadata
  doc
    .fontSize(10)
    .fillColor(COLORS.lightText)
    .text(`Report Date: ${new Date().toLocaleDateString()}`, { align: 'right' })
    .text(`Report ID: RDA-${Date.now()}`, { align: 'right' })
    .moveDown(2);

  // Customer Information Section
  addSectionHeader(doc, 'Customer Information');
  addKeyValue(doc, 'Customer Name', data.customerName);
  addKeyValue(doc, 'Property Address', data.propertyAddress);
  addKeyValue(doc, 'Inspection Date', data.inspectionDate);
  doc.moveDown(1.5);

  // Damage Analysis Section
  addSectionHeader(doc, 'Damage Analysis');

  // Damage type and severity
  doc
    .fontSize(12)
    .fillColor(COLORS.text)
    .font('Helvetica-Bold')
    .text('Damage Type: ', { continued: true })
    .font('Helvetica')
    .text(data.analysisResult.damageType)
    .moveDown(0.5);

  // Severity with colored indicator
  const severityY = doc.y + 5;
  doc
    .fontSize(12)
    .font('Helvetica-Bold')
    .text('Severity Level: ', 50, severityY);

  addSeverityIndicator(doc, data.analysisResult.severity, 165, severityY + 5);
  doc.moveDown(1.5);

  // Confidence and urgency
  addKeyValue(doc, 'AI Confidence', `${Math.round(data.analysisResult.confidence * 100)}%`);
  addKeyValue(doc, 'Affected Area', data.analysisResult.affectedArea);
  addKeyValue(doc, 'Urgency Level', data.analysisResult.urgencyLevel);
  doc.moveDown(1.5);

  // Cost Estimate
  addSectionHeader(doc, 'Estimated Repair Cost');

  // Cost range box
  const costBoxY = doc.y;
  doc
    .rect(50, costBoxY, 500, 80)
    .fillAndStroke(COLORS.background, COLORS.border);

  doc
    .fontSize(11)
    .fillColor(COLORS.lightText)
    .text('Estimated Cost Range', 60, costBoxY + 15);

  doc
    .fontSize(20)
    .fillColor(COLORS.primary)
    .font('Helvetica-Bold')
    .text(
      `${formatCurrency(data.analysisResult.estimatedCost.min)} - ${formatCurrency(data.analysisResult.estimatedCost.max)}`,
      60,
      costBoxY + 35
    );

  doc
    .fontSize(9)
    .fillColor(COLORS.lightText)
    .font('Helvetica')
    .text('*Final cost may vary based on detailed inspection', 60, costBoxY + 60);

  doc.y = costBoxY + 95;
  doc.moveDown(1);

  // Recommendations Section
  addSectionHeader(doc, 'Recommended Actions');

  data.analysisResult.recommendations.forEach((rec, index) => {
    doc
      .fontSize(11)
      .fillColor(COLORS.text)
      .font('Helvetica')
      .text(`${index + 1}. ${rec}`, { indent: 10 })
      .moveDown(0.5);
  });

  doc.moveDown(1);

  // Insurance Arguments Section
  if (data.analysisResult.insuranceArguments.length > 0) {
    addSectionHeader(doc, 'Insurance Claim Support');

    doc
      .fontSize(10)
      .fillColor(COLORS.lightText)
      .text('Key points to support your insurance claim:')
      .moveDown(0.5);

    data.analysisResult.insuranceArguments.forEach((arg, index) => {
      doc
        .fontSize(10)
        .fillColor(COLORS.text)
        .text(`• ${arg}`, { indent: 10 })
        .moveDown(0.3);
    });

    doc.moveDown(1);
  }

  // Notes Section
  if (data.notes) {
    addSectionHeader(doc, 'Additional Notes');
    doc
      .fontSize(10)
      .fillColor(COLORS.text)
      .text(data.notes, { align: 'justify' })
      .moveDown(1);
  }

  // Add footer
  addFooter(doc, pageNumber);

  // Page 2: Disclaimer and Next Steps
  doc.addPage();
  pageNumber++;

  addHeader(doc, 'Next Steps & Disclaimer');

  // Next Steps
  addSectionHeader(doc, 'Recommended Next Steps');

  const nextSteps = [
    'Contact your insurance company to file a claim',
    'Schedule a detailed inspection with Roof ER',
    'Document all damage with photographs',
    'Keep this report for your insurance adjuster',
    'Do not make temporary repairs without consulting your insurance company',
    'Obtain multiple estimates if required by your insurer',
  ];

  nextSteps.forEach((step, index) => {
    doc
      .fontSize(11)
      .fillColor(COLORS.text)
      .text(`${index + 1}. ${step}`, { indent: 10 })
      .moveDown(0.5);
  });

  doc.moveDown(2);

  // Disclaimer
  addSectionHeader(doc, 'Important Disclaimer');

  doc
    .fontSize(9)
    .fillColor(COLORS.lightText)
    .text(
      'This assessment is based on visual inspection and AI-assisted analysis. It is intended as a preliminary evaluation only. ' +
      'Final repair scope and costs can only be determined through a comprehensive on-site inspection by a licensed roofing professional. ' +
      'This report does not constitute a warranty or guarantee. Roof ER is not responsible for insurance claim outcomes. ' +
      'All repair work should be performed by licensed and insured contractors in accordance with local building codes.',
      { align: 'justify' }
    );

  doc.moveDown(2);

  // Contact Information
  addSectionHeader(doc, 'Contact Roof ER');

  doc
    .fontSize(11)
    .fillColor(COLORS.text)
    .text('For questions about this report or to schedule an inspection:')
    .moveDown(0.5);

  addKeyValue(doc, 'Phone', '(555) 123-4567');
  addKeyValue(doc, 'Email', 'info@roofer.com');
  addKeyValue(doc, 'Website', 'www.roofer.com');

  addFooter(doc, pageNumber);

  // Finalize PDF
  doc.end();
}

// Generate Inspection Report PDF
export async function generateInspectionReportPDF(
  data: InspectionReportRequest,
  res: Response
): Promise<void> {
  const doc = new PDFDocument({ margin: 50, size: 'LETTER' });

  // Set response headers
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="roof-inspection-${data.customerName.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf"`
  );

  doc.pipe(res);

  let pageNumber = 1;

  // Page 1: Header and Info
  addHeader(doc, 'Roof Inspection Report');

  // Report metadata
  doc
    .fontSize(10)
    .fillColor(COLORS.lightText)
    .text(`Report Date: ${new Date().toLocaleDateString()}`, { align: 'right' })
    .text(`Report ID: RI-${Date.now()}`, { align: 'right' })
    .moveDown(2);

  // Customer Information
  addSectionHeader(doc, 'Property Information');
  addKeyValue(doc, 'Customer Name', data.customerName);
  addKeyValue(doc, 'Property Address', data.propertyAddress);
  addKeyValue(doc, 'Inspection Date', data.inspectionDate);
  addKeyValue(doc, 'Inspector', data.inspectorName);
  doc.moveDown(1.5);

  // Findings Section
  addSectionHeader(doc, 'Inspection Findings');

  data.findings.forEach((finding, index) => {
    // Finding header
    doc
      .fontSize(13)
      .fillColor(COLORS.secondary)
      .font('Helvetica-Bold')
      .text(`${index + 1}. ${finding.area}`)
      .moveDown(0.3);

    // Condition
    const conditionY = doc.y;
    doc
      .fontSize(11)
      .fillColor(COLORS.text)
      .font('Helvetica-Bold')
      .text('Condition: ', 50, conditionY);

    addSeverityIndicator(doc, finding.condition, 120, conditionY + 5);
    doc.moveDown(1);

    // Notes
    if (finding.notes) {
      doc
        .fontSize(10)
        .fillColor(COLORS.text)
        .font('Helvetica')
        .text(finding.notes, { indent: 10, align: 'justify' })
        .moveDown(1);
    }

    // Check if we need a new page
    if (doc.y > doc.page.height - 150) {
      addFooter(doc, pageNumber);
      doc.addPage();
      pageNumber++;
      addHeader(doc, 'Roof Inspection Report (cont.)');
    }
  });

  // Recommendations Section
  if (data.recommendations.length > 0) {
    doc.moveDown(1);
    addSectionHeader(doc, 'Recommendations');

    data.recommendations.forEach((rec, index) => {
      doc
        .fontSize(11)
        .fillColor(COLORS.text)
        .font('Helvetica')
        .text(`${index + 1}. ${rec}`, { indent: 10 })
        .moveDown(0.5);
    });
  }

  // Cost Estimates Table
  if (data.estimatedCosts && data.estimatedCosts.length > 0) {
    doc.moveDown(1.5);
    addSectionHeader(doc, 'Estimated Costs');

    const tableTop = doc.y + 10;
    const itemX = 50;
    const costX = 400;

    // Table header
    doc
      .rect(50, tableTop, 500, 30)
      .fill(COLORS.primary);

    doc
      .fontSize(11)
      .fillColor('#FFFFFF')
      .font('Helvetica-Bold')
      .text('Item', itemX + 10, tableTop + 10)
      .text('Estimated Cost', costX + 10, tableTop + 10);

    let currentY = tableTop + 40;
    let totalCost = 0;

    // Table rows
    data.estimatedCosts.forEach((item, index) => {
      const rowColor = index % 2 === 0 ? COLORS.background : '#FFFFFF';

      doc
        .rect(50, currentY, 500, 30)
        .fill(rowColor);

      doc
        .fontSize(10)
        .fillColor(COLORS.text)
        .font('Helvetica')
        .text(item.item, itemX + 10, currentY + 10, { width: 330 })
        .text(formatCurrency(item.cost), costX + 10, currentY + 10);

      totalCost += item.cost;
      currentY += 30;
    });

    // Total row
    doc
      .rect(50, currentY, 500, 35)
      .fill(COLORS.secondary);

    doc
      .fontSize(12)
      .fillColor('#FFFFFF')
      .font('Helvetica-Bold')
      .text('Total Estimated Cost', itemX + 10, currentY + 10)
      .text(formatCurrency(totalCost), costX + 10, currentY + 10);

    doc.y = currentY + 50;
  }

  addFooter(doc, pageNumber);

  // Finalize
  doc.end();
}
