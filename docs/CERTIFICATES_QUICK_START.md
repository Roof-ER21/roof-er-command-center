# Training Certificates - Quick Start Guide

## What Are Training Certificates?

Training certificates are digital credentials awarded to users who complete training modules, entire curriculum, or achieve mastery in roleplay scenarios. Each certificate has:

- **Unique UUID** for public verification
- **User information** (name, email)
- **Achievement details** (title, description, score)
- **Metadata** (XP earned, difficulty, module count, etc.)
- **Verification URL** for third-party validation
- **Download options** (text, JSON, and future PDF)

## Certificate Types

### 1. Module Certificate
Awarded for completing a single training module.

**Example:**
```json
{
  "title": "Sales Fundamentals Completion",
  "certificateType": "module",
  "moduleId": "5",
  "score": 95,
  "metadata": {
    "moduleTitle": "Sales Fundamentals",
    "difficulty": "intermediate",
    "xpEarned": 100
  }
}
```

### 2. Curriculum Certificate
Awarded for completing all training modules.

**Example:**
```json
{
  "title": "Roofing Sales Professional",
  "certificateType": "curriculum",
  "score": 92,
  "metadata": {
    "completedModulesCount": 12,
    "totalXpEarned": 1200
  }
}
```

### 3. Roleplay Mastery Certificate
Awarded for demonstrating excellence in roleplay scenarios.

**Example:**
```json
{
  "title": "Roleplay Mastery - Advanced Level",
  "certificateType": "roleplay_mastery",
  "metadata": {
    "sessionsCompleted": 25,
    "averageScore": 87
  }
}
```

## Quick Start: Using the API

### 1. Generate a Certificate

```bash
curl -X POST http://localhost:3001/api/training/certificates/generate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "certificateType": "module",
    "title": "Sales Fundamentals Completion",
    "description": "Successfully completed all sales fundamentals lessons",
    "moduleId": "5",
    "score": 95
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "certificate": {
      "id": 1,
      "certificateId": "550e8400-e29b-41d4-a716-446655440000",
      "title": "Sales Fundamentals Completion",
      "type": "module",
      "score": 95,
      "issuedAt": "2025-01-18T10:30:00Z",
      "verificationUrl": "https://example.com/api/training/certificates/550e8400.../verify",
      "userName": "John Doe",
      "metadata": {...}
    }
  }
}
```

### 2. View Your Certificates

```bash
curl http://localhost:3001/api/training/certificates \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 3. Verify a Certificate (No Auth Required)

```bash
curl http://localhost:3001/api/training/certificates/550e8400-e29b-41d4-a716-446655440000/verify
```

### 4. Download Certificate

**Text format:**
```bash
curl "http://localhost:3001/api/training/certificates/550e8400.../download?format=text" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -o certificate.txt
```

**JSON format:**
```bash
curl "http://localhost:3001/api/training/certificates/550e8400.../download?format=json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -o certificate.json
```

## Frontend Integration Examples

### React Hook for Certificates

```typescript
import { useState, useEffect } from 'react';

export function useCertificates() {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCertificates() {
      const response = await fetch('/api/training/certificates', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setCertificates(data.data.certificates);
      setLoading(false);
    }
    fetchCertificates();
  }, []);

  return { certificates, loading };
}
```

### Generate Certificate After Module Completion

```typescript
async function completeModule(moduleId: number, score: number) {
  // Complete the module
  await fetch(`/api/training/modules/${moduleId}/complete`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ score })
  });

  // Auto-generate certificate if score is high enough
  if (score >= 80) {
    await fetch('/api/training/certificates/generate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        certificateType: 'module',
        title: `Module ${moduleId} Completion`,
        moduleId: moduleId.toString(),
        score
      })
    });
  }
}
```

### Display Certificates in UI

```typescript
function CertificatesPage() {
  const { certificates, loading } = useCertificates();

  if (loading) return <div>Loading...</div>;

  return (
    <div className="certificates-grid">
      {certificates.map(cert => (
        <div key={cert.id} className="certificate-card">
          <h3>{cert.title}</h3>
          <p>{cert.description}</p>
          <div className="certificate-meta">
            <span>Score: {cert.score}</span>
            <span>Type: {cert.type}</span>
            <span>Issued: {new Date(cert.issuedAt).toLocaleDateString()}</span>
          </div>
          <button onClick={() => downloadCertificate(cert.certificateId)}>
            Download
          </button>
          <button onClick={() => verifyCertificate(cert.certificateId)}>
            Verify
          </button>
        </div>
      ))}
    </div>
  );
}
```

### Certificate Verification Badge

```typescript
function CertificateVerificationBadge({ certificateId }: { certificateId: string }) {
  const [verified, setVerified] = useState<boolean | null>(null);

  useEffect(() => {
    async function verify() {
      const response = await fetch(
        `/api/training/certificates/${certificateId}/verify`
      );
      const data = await response.json();
      setVerified(data.valid && !data.data.isExpired);
    }
    verify();
  }, [certificateId]);

  if (verified === null) return <span>Verifying...</span>;
  if (verified) return <span className="badge verified">✓ Verified</span>;
  return <span className="badge invalid">✗ Invalid</span>;
}
```

## Testing the System

### Run Automated Tests

```bash
cd /Users/a21/roof-er-command-center
DATABASE_URL=postgresql://localhost:5432/roof_er_command_center npx tsx scripts/test-certificates.ts
```

This will:
1. Create test certificates for all three types
2. Verify certificates can be retrieved
3. Test verification logic
4. Generate sample text certificates
5. Output test results

### Manual Testing with cURL

See examples above or refer to the full API documentation at:
`/docs/TRAINING_CERTIFICATES_API.md`

## Common Use Cases

### 1. Automatic Certificate Generation on Module Completion

Add to your module completion logic:

```typescript
// After module is completed successfully
if (score >= passingScore) {
  await generateCertificate({
    certificateType: 'module',
    title: `${module.title} Completion`,
    description: `Successfully completed ${module.title} with score ${score}`,
    moduleId: module.id.toString(),
    score
  });
}
```

### 2. Curriculum Completion Check

```typescript
async function checkCurriculumCompletion(userId: number) {
  const completedModules = await db
    .select()
    .from(trainingProgress)
    .where(and(
      eq(trainingProgress.userId, userId),
      eq(trainingProgress.status, 'completed')
    ));

  const totalModules = await db.select().from(trainingModules);

  if (completedModules.length === totalModules.length) {
    // Generate curriculum certificate
    const avgScore = completedModules.reduce((sum, m) => sum + (m.score || 0), 0) / completedModules.length;

    await generateCertificate({
      certificateType: 'curriculum',
      title: 'Complete Curriculum Mastery',
      description: 'Completed all training modules',
      score: Math.round(avgScore)
    });
  }
}
```

### 3. Roleplay Mastery Achievement

```typescript
async function checkRoleplayMastery(userId: number) {
  const sessions = await db
    .select()
    .from(roleplaySessions)
    .where(and(
      eq(roleplaySessions.userId, userId),
      sql`${roleplaySessions.completedAt} IS NOT NULL`
    ));

  if (sessions.length < 20) return; // Need at least 20 sessions

  const avgScore = sessions.reduce((sum, s) => sum + (s.score || 0), 0) / sessions.length;

  if (avgScore >= 85) {
    await generateCertificate({
      certificateType: 'roleplay_mastery',
      title: 'Roleplay Mastery - Advanced',
      description: 'Demonstrated exceptional roleplay skills'
    });
  }
}
```

### 4. Share Certificate on Social Media

```typescript
function shareCertificateOnLinkedIn(certificate: Certificate) {
  const url = encodeURIComponent(certificate.metadata.verificationUrl);
  const title = encodeURIComponent(certificate.title);
  const summary = encodeURIComponent(certificate.description);

  window.open(
    `https://www.linkedin.com/sharing/share-offsite/?url=${url}&title=${title}&summary=${summary}`,
    '_blank'
  );
}
```

## Security Best Practices

1. **Always validate** certificate ownership before allowing downloads
2. **Use HTTPS** in production for verification URLs
3. **Rate limit** the public verification endpoint
4. **Log verification attempts** for audit trails
5. **Never expose** user email in public verification (already handled)

## Troubleshooting

### Certificate Generation Fails

**Error:** "User not found"
- Ensure user is authenticated
- Check user ID is valid

**Error:** "Invalid certificate type"
- Must be one of: 'module', 'curriculum', 'roleplay_mastery'

### Certificate Verification Returns 404

- Check the UUID is correct
- Ensure certificate was successfully created
- Verify database connection

### Download Returns Empty File

- Ensure authentication token is valid
- Check certificate belongs to authenticated user
- Verify certificateId matches

## File Locations

- **API Routes:** `/Users/a21/roof-er-command-center/server/routes/training/index.ts`
- **Schema:** `/Users/a21/roof-er-command-center/shared/schema.ts`
- **Documentation:** `/Users/a21/roof-er-command-center/docs/TRAINING_CERTIFICATES_API.md`
- **Implementation Details:** `/Users/a21/roof-er-command-center/CERTIFICATE_SYSTEM_IMPLEMENTATION.md`
- **Test Script:** `/Users/a21/roof-er-command-center/scripts/test-certificates.ts`
- **Migration:** `/Users/a21/roof-er-command-center/scripts/create-certificates-table.ts`

## Next Steps

1. **Frontend UI:** Build React components to display certificates
2. **PDF Generation:** Add PDF certificate generation
3. **Email Delivery:** Auto-send certificates via email
4. **Social Sharing:** Integrate LinkedIn/Twitter sharing
5. **Analytics:** Track certificate generation and verification metrics

## Support

For questions or issues:
- Check the full API documentation: `/docs/TRAINING_CERTIFICATES_API.md`
- Review implementation details: `/CERTIFICATE_SYSTEM_IMPLEMENTATION.md`
- Run tests to verify system: `npx tsx scripts/test-certificates.ts`

---

**Built with:**
- PostgreSQL (database)
- Drizzle ORM (database access)
- Express.js (API endpoints)
- TypeScript (type safety)
- crypto.randomUUID() (secure certificate IDs)
