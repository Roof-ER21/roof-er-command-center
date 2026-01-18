# PDF Report Generation for Field Module

## Overview

The Field module now includes professional PDF report generation for roof damage assessments and inspections. Reports are automatically formatted with company branding, professional styling, and comprehensive information.

## Features

- Professional PDF reports with branded headers and footers
- Damage assessment reports with AI analysis results
- Inspection reports with findings and cost estimates
- Severity indicators with color coding
- Insurance claim support documentation
- Automatic report generation logging
- Download-ready PDFs with proper headers

## API Endpoints

### 1. Generate Damage Assessment Report

**Endpoint:** `POST /api/field/reports/damage-assessment`

**Authentication:** Required (session-based)

**Request Body:**

```json
{
  "analysisId": 123,
  "customerName": "John Smith",
  "propertyAddress": "123 Main Street, Richmond, VA 23220",
  "inspectionDate": "2025-01-18",
  "analysisResult": {
    "damageType": "Hail Damage",
    "severity": "Moderate",
    "confidence": 0.92,
    "affectedArea": "North-facing slope (approximately 400 sq ft)",
    "recommendations": [
      "Full roof replacement recommended due to extent of damage",
      "File insurance claim immediately",
      "Temporary tarping to prevent water infiltration"
    ],
    "estimatedCost": {
      "min": 8500,
      "max": 12000
    },
    "urgencyLevel": "High - Address within 2 weeks",
    "insuranceArguments": [
      "Damage consistent with recent hail storm event",
      "Multiple impact points visible on shingles",
      "Granule loss exceeding manufacturer specifications"
    ]
  },
  "notes": "Customer reported hearing loud impacts during storm.",
  "photos": []
}
```

**Response:**

Returns a PDF file with headers:
- `Content-Type: application/pdf`
- `Content-Disposition: attachment; filename="roof-damage-assessment-John-Smith-2025-01-18.pdf"`

**Required Fields:**
- `customerName` (string)
- `propertyAddress` (string)
- `inspectionDate` (string)
- `analysisResult` (object with all sub-fields)
  - `damageType`
  - `severity`
  - `confidence`
  - `affectedArea`
  - `recommendations` (array)
  - `estimatedCost` (object with `min` and `max`)
  - `urgencyLevel`
  - `insuranceArguments` (array)

**Optional Fields:**
- `analysisId` (number) - Reference to saved analysis
- `notes` (string) - Additional notes
- `photos` (array) - Base64 encoded or URLs (future feature)

### 2. Generate Inspection Report

**Endpoint:** `POST /api/field/reports/inspection`

**Authentication:** Required (session-based)

**Request Body:**

```json
{
  "customerName": "Jane Doe",
  "propertyAddress": "456 Oak Avenue, Baltimore, MD 21201",
  "inspectionDate": "2025-01-18",
  "inspectorName": "Mike Johnson",
  "findings": [
    {
      "area": "Main Roof",
      "condition": "Good",
      "notes": "Shingles in good condition. No visible damage."
    },
    {
      "area": "Chimney Flashing",
      "condition": "Moderate",
      "notes": "Flashing showing signs of aging. Minor gaps detected."
    }
  ],
  "recommendations": [
    "Clean and repair gutters immediately",
    "Reseal chimney flashing within 3 months"
  ],
  "estimatedCosts": [
    { "item": "Gutter cleaning and repair", "cost": 450 },
    { "item": "Chimney flashing reseal", "cost": 850 }
  ]
}
```

**Response:**

Returns a PDF file with headers:
- `Content-Type: application/pdf`
- `Content-Disposition: attachment; filename="roof-inspection-Jane-Doe-2025-01-18.pdf"`

**Required Fields:**
- `customerName` (string)
- `propertyAddress` (string)
- `inspectionDate` (string)
- `inspectorName` (string)
- `findings` (array of objects)
  - Each finding must have: `area`, `condition`, `notes`

**Optional Fields:**
- `recommendations` (array of strings)
- `estimatedCosts` (array of objects with `item` and `cost`)

## PDF Report Contents

### Damage Assessment Report

**Page 1:**
1. Header with Roof ER branding
2. Report metadata (date, ID)
3. Customer information
4. Damage analysis
   - Damage type
   - Severity (with color indicator)
   - AI confidence level
   - Affected area
   - Urgency level
5. Estimated repair cost (highlighted box)
6. Recommended actions
7. Insurance claim support
8. Additional notes
9. Footer with page number and disclaimer

**Page 2:**
1. Next steps for customer
2. Important disclaimer
3. Contact information

### Inspection Report

**Page 1+:**
1. Header with Roof ER branding
2. Report metadata
3. Property information
4. Inspection findings
   - Area-by-area breakdown
   - Condition indicators
   - Detailed notes
5. Recommendations
6. Cost estimates table (if provided)
7. Footer with page number and disclaimer

## Color Scheme

The PDF reports use a professional color scheme:

- **Primary (Dark Blue):** #1E3A8A - Headers and main text
- **Secondary (Blue):** #3B82F6 - Section headers
- **Success (Green):** #10B981 - Good conditions
- **Warning (Orange):** #F59E0B - Moderate conditions
- **Danger (Red):** #EF4444 - Critical/severe conditions
- **Text (Dark Gray):** #1F2937 - Body text
- **Light Text (Medium Gray):** #6B7280 - Metadata
- **Border (Light Gray):** #E5E7EB - Table borders
- **Background (Very Light Gray):** #F9FAFB - Highlight boxes

## Severity Indicators

Reports include visual severity indicators:
- **Good/Minor:** Green circle
- **Moderate/Medium:** Orange circle
- **Critical/Severe:** Red circle

## Database Logging

All report generations are logged in the `report_gen_log` table:

```sql
CREATE TABLE report_gen_log (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  report_type VARCHAR(50) NOT NULL,
  customer_name VARCHAR(255) NOT NULL,
  property_address TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);
```

**Tracked Fields:**
- User who generated the report
- Report type (`damage_assessment` or `inspection`)
- Customer name
- Property address
- Metadata (analysis details, inspector name, etc.)
- Generation timestamp

## Testing

Test PDF generation using the provided test script:

```bash
npx tsx scripts/test-pdf-generation.ts
```

This generates two sample PDFs:
1. `test-damage-assessment.pdf`
2. `test-inspection-report.pdf`

## Frontend Integration

### Damage Assessment Report

```javascript
async function generateDamageAssessmentPDF(analysisData) {
  const response = await fetch('/api/field/reports/damage-assessment', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      customerName: analysisData.customerName,
      propertyAddress: analysisData.address,
      inspectionDate: new Date().toLocaleDateString(),
      analysisResult: analysisData.analysis,
      notes: analysisData.notes,
    }),
  });

  if (response.ok) {
    // Trigger download
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = response.headers.get('Content-Disposition')
      .split('filename=')[1]
      .replace(/"/g, '');
    document.body.appendChild(a);
    a.click();
    a.remove();
  }
}
```

### Inspection Report

```javascript
async function generateInspectionPDF(inspectionData) {
  const response = await fetch('/api/field/reports/inspection', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      customerName: inspectionData.customerName,
      propertyAddress: inspectionData.address,
      inspectionDate: new Date().toLocaleDateString(),
      inspectorName: inspectionData.inspector,
      findings: inspectionData.findings,
      recommendations: inspectionData.recommendations,
      estimatedCosts: inspectionData.costs,
    }),
  });

  if (response.ok) {
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = response.headers.get('Content-Disposition')
      .split('filename=')[1]
      .replace(/"/g, '');
    document.body.appendChild(a);
    a.click();
    a.remove();
  }
}
```

## Error Handling

The endpoints return appropriate error responses:

**400 Bad Request:**
- Missing required fields
- Invalid data structure
- Empty arrays where data is required

**500 Internal Server Error:**
- PDF generation failure
- Database logging failure (non-critical)

Example error response:

```json
{
  "success": false,
  "error": "Missing required fields: customerName, propertyAddress, inspectionDate, analysisResult"
}
```

## Future Enhancements

Potential improvements for future versions:

1. **Photo Integration:**
   - Embed base64 images in PDFs
   - Multi-page photo galleries
   - Before/after comparisons

2. **Custom Branding:**
   - Upload company logo
   - Configurable colors
   - Custom disclaimers

3. **Email Integration:**
   - Send PDFs directly to customers
   - Attach to email templates
   - Track email opens

4. **Report Templates:**
   - Multiple report styles
   - State-specific templates
   - Insurance company formats

5. **Digital Signatures:**
   - Contractor signatures
   - Customer approval signatures
   - Timestamp verification

6. **Report Analytics:**
   - Track report views/downloads
   - Most common damage types
   - Average cost estimates

## Dependencies

- `pdfkit` - PDF generation library
- `@types/pdfkit` - TypeScript definitions

## Files

- `/server/utils/pdf-generator.ts` - PDF generation logic
- `/server/routes/field/index.ts` - API endpoints (lines 1432-1629)
- `/shared/schema.ts` - Database schema (reportGenLog table)
- `/migrations/0001_add_report_gen_log.sql` - Database migration
- `/scripts/test-pdf-generation.ts` - Test suite
- `/scripts/migrate-report-gen-log.ts` - Migration runner

## Support

For issues or questions about PDF report generation:

1. Check the test suite runs successfully
2. Verify database migration was applied
3. Check server logs for detailed error messages
4. Ensure all required fields are provided in requests
