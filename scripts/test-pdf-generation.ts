/**
 * Test script for PDF report generation
 * Run with: npx tsx scripts/test-pdf-generation.ts
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Mock Response object for testing
class MockResponse {
  private headers: Record<string, string> = {};
  private stream: fs.WriteStream;

  constructor(filePath: string) {
    this.stream = fs.createWriteStream(filePath);
  }

  setHeader(name: string, value: string) {
    this.headers[name] = value;
  }

  pipe(source: any) {
    source.pipe(this.stream);
    return this.stream;
  }

  write(chunk: any) {
    return this.stream.write(chunk);
  }

  end() {
    return this.stream.end();
  }

  // Make it match the Response interface
  on(event: string, callback: Function) {
    return this;
  }

  once(event: string, callback: Function) {
    return this;
  }

  emit(event: string, ...args: any[]) {
    return true;
  }
}

async function testDamageAssessmentPDF() {
  console.log('🧪 Testing Damage Assessment PDF generation...');

  const testData = {
    customerName: 'John Smith',
    propertyAddress: '123 Main Street, Richmond, VA 23220',
    inspectionDate: new Date().toLocaleDateString(),
    analysisResult: {
      damageType: 'Hail Damage',
      severity: 'Moderate',
      confidence: 0.92,
      affectedArea: 'North-facing slope (approximately 400 sq ft)',
      recommendations: [
        'Full roof replacement recommended due to extent of damage',
        'File insurance claim immediately',
        'Temporary tarping to prevent water infiltration',
        'Document all damage with photographs',
      ],
      estimatedCost: {
        min: 8500,
        max: 12000,
      },
      urgencyLevel: 'High - Address within 2 weeks',
      insuranceArguments: [
        'Damage consistent with recent hail storm event',
        'Multiple impact points visible on shingles',
        'Granule loss exceeding manufacturer specifications',
        'Wind-driven rain intrusion risk',
      ],
    },
    notes: 'Customer reported hearing loud impacts during storm on March 15th. Water stains visible in attic.',
  };

  try {
    // Dynamic import to avoid TypeScript compilation issues
    const { generateDamageAssessmentPDF } = await import('../server/utils/pdf-generator.js');

    const outputPath = path.join(__dirname, '../test-damage-assessment.pdf');
    const mockRes = new MockResponse(outputPath) as any;

    await generateDamageAssessmentPDF(testData, mockRes);

    // Wait for file to be written
    await new Promise(resolve => setTimeout(resolve, 1000));

    if (fs.existsSync(outputPath)) {
      const stats = fs.statSync(outputPath);
      console.log(`✅ PDF generated successfully: ${outputPath}`);
      console.log(`   File size: ${(stats.size / 1024).toFixed(2)} KB`);
    } else {
      console.log('❌ PDF file was not created');
    }
  } catch (error: any) {
    console.error('❌ Error generating PDF:', error.message);
    console.error(error.stack);
  }
}

async function testInspectionPDF() {
  console.log('\n🧪 Testing Inspection Report PDF generation...');

  const testData = {
    customerName: 'Jane Doe',
    propertyAddress: '456 Oak Avenue, Baltimore, MD 21201',
    inspectionDate: new Date().toLocaleDateString(),
    inspectorName: 'Mike Johnson',
    findings: [
      {
        area: 'Main Roof',
        condition: 'Good',
        notes: 'Shingles in good condition. No visible damage. Proper ventilation observed.',
      },
      {
        area: 'Chimney Flashing',
        condition: 'Moderate',
        notes: 'Flashing showing signs of aging. Minor gaps detected. Recommend resealing to prevent leaks.',
      },
      {
        area: 'Gutters',
        condition: 'Critical',
        notes: 'Significant debris buildup. Several downspouts disconnected. Immediate cleaning and repair required.',
      },
    ],
    recommendations: [
      'Clean and repair gutters immediately',
      'Reseal chimney flashing within 3 months',
      'Schedule annual roof inspection',
      'Trim overhanging tree branches',
    ],
    estimatedCosts: [
      { item: 'Gutter cleaning and repair', cost: 450 },
      { item: 'Chimney flashing reseal', cost: 850 },
      { item: 'Downspout reconnection', cost: 200 },
    ],
  };

  try {
    const { generateInspectionReportPDF } = await import('../server/utils/pdf-generator.js');

    const outputPath = path.join(__dirname, '../test-inspection-report.pdf');
    const mockRes = new MockResponse(outputPath) as any;

    await generateInspectionReportPDF(testData, mockRes);

    // Wait for file to be written
    await new Promise(resolve => setTimeout(resolve, 1000));

    if (fs.existsSync(outputPath)) {
      const stats = fs.statSync(outputPath);
      console.log(`✅ PDF generated successfully: ${outputPath}`);
      console.log(`   File size: ${(stats.size / 1024).toFixed(2)} KB`);
    } else {
      console.log('❌ PDF file was not created');
    }
  } catch (error: any) {
    console.error('❌ Error generating PDF:', error.message);
    console.error(error.stack);
  }
}

async function main() {
  console.log('🚀 PDF Generation Test Suite\n');

  await testDamageAssessmentPDF();
  await testInspectionPDF();

  console.log('\n✨ Test suite complete!');
}

main();
