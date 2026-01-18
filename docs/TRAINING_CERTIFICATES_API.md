# Training Certificates API Documentation

## Overview

The Training Certificates system allows users to generate, verify, and download certificates for completing training modules, entire curriculum, or achieving roleplay mastery.

## Database Schema

### Table: `training_certificates`

| Column | Type | Description |
|--------|------|-------------|
| `id` | serial | Primary key |
| `certificateId` | text (unique) | UUID for public verification |
| `userId` | integer | Foreign key to users table |
| `certificateType` | text | Type: 'module', 'curriculum', or 'roleplay_mastery' |
| `title` | text | Certificate title |
| `description` | text (nullable) | Additional description |
| `moduleId` | text (nullable) | Module ID if type is 'module' |
| `score` | integer (nullable) | Final score achieved |
| `issuedAt` | timestamp | When certificate was issued |
| `expiresAt` | timestamp (nullable) | Optional expiration date |
| `metadata` | jsonb | Additional certificate data |
| `createdAt` | timestamp | Record creation time |
| `updatedAt` | timestamp | Record update time |

### Metadata Structure

```typescript
{
  verificationUrl?: string;        // Public URL to verify certificate
  completionDate?: string;          // ISO date string
  moduleTitle?: string;             // For module certificates
  difficulty?: string;              // For module certificates
  xpEarned?: number;                // XP earned
  completedModulesCount?: number;   // For curriculum certificates
  totalXpEarned?: number;           // For curriculum certificates
  sessionsCompleted?: number;       // For roleplay mastery
  averageScore?: number;            // For roleplay mastery
  achievements?: string[];          // List of achievements
}
```

## API Endpoints

### 1. Generate Certificate

**POST** `/api/training/certificates/generate`

**Authentication:** Required

**Request Body:**
```json
{
  "certificateType": "module" | "curriculum" | "roleplay_mastery",
  "title": "Certificate Title",
  "description": "Optional description",
  "moduleId": "optional-module-id",
  "score": 85
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "certificate": {
      "id": 1,
      "certificateId": "550e8400-e29b-41d4-a716-446655440000",
      "title": "Roofing Sales Professional",
      "description": "Completed all curriculum modules",
      "type": "curriculum",
      "score": 92,
      "issuedAt": "2025-01-18T10:30:00Z",
      "verificationUrl": "https://example.com/api/training/certificates/550e8400.../verify",
      "userName": "John Doe",
      "metadata": {
        "verificationUrl": "https://...",
        "completionDate": "2025-01-18T10:30:00Z",
        "completedModulesCount": 12,
        "totalXpEarned": 1200
      }
    }
  }
}
```

**Certificate Type Details:**

#### Module Certificate
- Requires `moduleId`
- Metadata includes: moduleTitle, difficulty, xpEarned
- Generated when a user completes a training module

#### Curriculum Certificate
- No moduleId required
- Metadata includes: completedModulesCount, totalXpEarned
- Generated when user completes all curriculum modules

#### Roleplay Mastery Certificate
- No moduleId required
- Metadata includes: sessionsCompleted, averageScore
- Generated when user achieves mastery in roleplay scenarios

### 2. Get All Certificates

**GET** `/api/training/certificates`

**Authentication:** Required

**Response:**
```json
{
  "success": true,
  "data": {
    "certificates": [
      {
        "id": 1,
        "certificateId": "550e8400-e29b-41d4-a716-446655440000",
        "title": "Module Completion: Sales Fundamentals",
        "description": "Successfully completed sales fundamentals training",
        "type": "module",
        "score": 95,
        "issuedAt": "2025-01-18T10:30:00Z",
        "expiresAt": null,
        "userName": "John Doe",
        "metadata": {...}
      }
    ],
    "total": 1
  }
}
```

### 3. Verify Certificate (Public)

**GET** `/api/training/certificates/:certificateId/verify`

**Authentication:** Not required (public endpoint)

**Response:**
```json
{
  "success": true,
  "valid": true,
  "data": {
    "certificateId": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Roofing Sales Professional",
    "description": "Completed all curriculum modules",
    "type": "curriculum",
    "recipientName": "John Doe",
    "recipientEmail": "john@example.com",
    "score": 92,
    "issuedAt": "2025-01-18T10:30:00Z",
    "expiresAt": null,
    "isExpired": false,
    "metadata": {...}
  }
}
```

**Invalid/Not Found Response:**
```json
{
  "success": false,
  "error": "Certificate not found",
  "valid": false
}
```

### 4. Download Certificate

**GET** `/api/training/certificates/:certificateId/download?format=text|json`

**Authentication:** Required

**Query Parameters:**
- `format`: `text` or `json` (default: `json`)

**Response (format=text):**
```
Content-Type: text/plain
Content-Disposition: attachment; filename="certificate-550e8400.txt"

╔══════════════════════════════════════════════════════════════╗
║                    CERTIFICATE OF COMPLETION                 ║
╚══════════════════════════════════════════════════════════════╝

This certifies that

    John Doe

has successfully completed

    Roofing Sales Professional Curriculum

Final Score: 92

Date Issued: 1/18/2025
Certificate ID: 550e8400-e29b-41d4-a716-446655440000

Verification URL: https://example.com/api/training/certificates/...

═════════════════════════════════════════════════════════════════
             Roof-ER Command Center Training System
═════════════════════════════════════════════════════════════════
```

**Response (format=json):**
```json
Content-Type: application/json
Content-Disposition: attachment; filename="certificate-550e8400.json"

{
  "certificate": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Roofing Sales Professional",
    "description": "Completed all curriculum modules",
    "type": "curriculum",
    "recipient": {
      "name": "John Doe",
      "email": "john@example.com"
    },
    "score": 92,
    "issuedAt": "2025-01-18T10:30:00Z",
    "expiresAt": null,
    "metadata": {...}
  }
}
```

## Usage Examples

### Example 1: Generate Certificate After Module Completion

```javascript
// After user completes a module
const response = await fetch('/api/training/certificates/generate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    certificateType: 'module',
    title: 'Sales Fundamentals Completion',
    description: 'Successfully completed all sales fundamentals lessons',
    moduleId: '5',
    score: 95
  })
});

const data = await response.json();
console.log('Certificate ID:', data.data.certificate.certificateId);
console.log('Verification URL:', data.data.certificate.verificationUrl);
```

### Example 2: Generate Curriculum Certificate

```javascript
// When user completes all curriculum modules
const response = await fetch('/api/training/certificates/generate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    certificateType: 'curriculum',
    title: 'Roofing Sales Professional',
    description: 'Completed all 12 curriculum modules with excellence',
    score: 92
  })
});
```

### Example 3: Generate Roleplay Mastery Certificate

```javascript
// When user achieves mastery in roleplay
const response = await fetch('/api/training/certificates/generate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    certificateType: 'roleplay_mastery',
    title: 'Roleplay Mastery - Advanced Level',
    description: 'Demonstrated exceptional roleplay skills across multiple scenarios'
  })
});
```

### Example 4: Verify Certificate (Public)

```javascript
// Anyone can verify a certificate with the UUID
const certificateId = '550e8400-e29b-41d4-a716-446655440000';
const response = await fetch(`/api/training/certificates/${certificateId}/verify`);
const data = await response.json();

if (data.valid && !data.data.isExpired) {
  console.log('Valid certificate for:', data.data.recipientName);
  console.log('Issued:', data.data.issuedAt);
} else {
  console.log('Invalid or expired certificate');
}
```

### Example 5: Download Certificate

```javascript
// Download as text file
window.location.href = `/api/training/certificates/${certificateId}/download?format=text`;

// Download as JSON
window.location.href = `/api/training/certificates/${certificateId}/download?format=json`;
```

### Example 6: Display User's Certificates

```javascript
const response = await fetch('/api/training/certificates', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const data = await response.json();
data.data.certificates.forEach(cert => {
  console.log(`${cert.title} - Issued: ${new Date(cert.issuedAt).toLocaleDateString()}`);
});
```

## Security Considerations

1. **UUID Generation**: Certificates use cryptographically secure UUIDs (randomUUID) to prevent guessing
2. **Authentication**: Generate and download endpoints require authentication
3. **Public Verification**: Verify endpoint is public to allow third-party validation
4. **Foreign Key Constraints**: Ensures certificates are always linked to valid users
5. **Expiration Support**: Optional expiration dates can be set for time-limited certificates

## Integration Points

### With Training Module Completion

```javascript
// In training module completion handler
router.post("/modules/:moduleId/complete", async (req, res) => {
  // ... existing completion logic ...

  // Auto-generate certificate if score is high enough
  if (score >= 80) {
    await fetch('/api/training/certificates/generate', {
      method: 'POST',
      body: JSON.stringify({
        certificateType: 'module',
        title: `Module Completion: ${module.title}`,
        moduleId: moduleId.toString(),
        score
      })
    });
  }
});
```

### With Curriculum Completion

```javascript
// Check if all modules completed
const allModulesCompleted = await checkAllModulesComplete(userId);

if (allModulesCompleted) {
  await generateCertificate({
    certificateType: 'curriculum',
    title: 'Complete Curriculum Mastery',
    score: calculateOverallScore(userId)
  });
}
```

## Future Enhancements

1. **PDF Generation**: Add PDF certificate generation with professional templates
2. **Email Delivery**: Automatically email certificates to users
3. **Social Sharing**: Add social media sharing capabilities
4. **QR Codes**: Generate QR codes for easy mobile verification
5. **Badge Integration**: Link certificates to digital badges
6. **Bulk Generation**: Generate certificates for multiple users at once
7. **Templates**: Customizable certificate templates
8. **Analytics**: Track certificate generation and verification metrics

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error message description"
}
```

Common error scenarios:
- Missing required fields (400)
- Invalid certificate type (400)
- User not found (404)
- Certificate not found (404)
- Unauthorized access (401)
- Server error (500)
