# Document Library Backend - Testing Guide

## Implementation Summary

### Database Schema
- **Table**: `field_documents`
- **Location**: `/shared/schema.ts` (lines 917-931)
- **Fields**:
  - `id`: Serial primary key
  - `userId`: Foreign key to users table
  - `filename`: Stored filename (with hash)
  - `originalName`: User's original filename
  - `mimeType`: File MIME type
  - `fileSize`: Size in bytes
  - `category`: Enum (insurance, inspection, estimate, contract, photo, other)
  - `tags`: Array of strings
  - `description`: Optional text description
  - `analysisResult`: JSONB for AI analysis results
  - `storagePath`: Full path to file on disk
  - `uploadedAt`: Creation timestamp
  - `lastAccessedAt`: Last access timestamp

### API Endpoints

#### 1. POST /api/field/documents/upload
Upload a document with optional AI analysis.

**Request**:
- Content-Type: multipart/form-data
- Fields:
  - `document`: File (required, max 10MB)
  - `category`: String (optional, default: 'other')
  - `tags`: JSON array or comma-separated string (optional)
  - `description`: String (optional)
  - `analyzeWithAI`: Boolean string 'true'/'false' (optional)

**Response**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "filename": "Insurance Policy.pdf",
    "category": "insurance",
    "size": 524288,
    "uploadedAt": "2025-01-18T...",
    "hasAnalysis": true
  }
}
```

#### 2. GET /api/field/documents/list
List all documents for the current user.

**Query Parameters**:
- `category`: Filter by category (optional)
- `search`: Search term for filename/description/tags (optional)
- `limit`: Number of results (default: 20)
- `offset`: Pagination offset (default: 0)

**Response**:
```json
{
  "success": true,
  "data": {
    "documents": [
      {
        "id": 1,
        "filename": "Insurance Policy.pdf",
        "category": "insurance",
        "tags": ["policy", "2025"],
        "description": "Annual insurance policy",
        "size": 524288,
        "uploadedAt": "2025-01-18T...",
        "lastAccessedAt": null,
        "hasAnalysis": true
      }
    ],
    "total": 1
  }
}
```

#### 3. GET /api/field/documents/:id
Get details for a specific document.

**Response**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "filename": "Insurance Policy.pdf",
    "category": "insurance",
    "tags": ["policy", "2025"],
    "description": "Annual insurance policy",
    "size": 524288,
    "mimeType": "application/pdf",
    "uploadedAt": "2025-01-18T...",
    "lastAccessedAt": "2025-01-18T...",
    "analysisResult": {
      "summary": "...",
      "keyPoints": ["..."]
    }
  }
}
```

#### 4. GET /api/field/documents/:id/download
Download the actual file.

**Response**: File download with original filename

#### 5. DELETE /api/field/documents/:id
Delete a document (both file and database record).

**Response**:
```json
{
  "success": true,
  "data": {
    "message": "Document deleted successfully"
  }
}
```

## File Storage
- **Directory**: `/uploads/documents/`
- **Naming**: `{timestamp}-{random-hash}.{ext}`
- **Example**: `1705583400000-a1b2c3d4e5f6g7h8i9j0.pdf`

## Security Features
- Authentication required (requireAuth middleware)
- Module access check (requireModuleAccess('field'))
- User can only access their own documents
- File type validation (PDF, Word, Excel, images only)
- File size limit: 10MB
- Automatic file cleanup on failed uploads

## Testing with curl

### Upload a document
```bash
curl -X POST http://localhost:3000/api/field/documents/upload \
  -H "Cookie: session=YOUR_SESSION_TOKEN" \
  -F "document=@/path/to/file.pdf" \
  -F "category=insurance" \
  -F "tags=[\"policy\", \"2025\"]" \
  -F "description=Test upload" \
  -F "analyzeWithAI=true"
```

### List documents
```bash
curl http://localhost:3000/api/field/documents/list \
  -H "Cookie: session=YOUR_SESSION_TOKEN"
```

### Get document details
```bash
curl http://localhost:3000/api/field/documents/1 \
  -H "Cookie: session=YOUR_SESSION_TOKEN"
```

### Download document
```bash
curl http://localhost:3000/api/field/documents/1/download \
  -H "Cookie: session=YOUR_SESSION_TOKEN" \
  -o downloaded_file.pdf
```

### Delete document
```bash
curl -X DELETE http://localhost:3000/api/field/documents/1 \
  -H "Cookie: session=YOUR_SESSION_TOKEN"
```

## Next Steps for Frontend Integration
1. Update `DocumentsPage.tsx` to call these endpoints
2. Add upload modal with category/tag selection
3. Display document list with filtering/search
4. Add document preview/download buttons
5. Implement delete confirmation dialog
6. Show AI analysis results in document details

## Database Migration Status
✅ Schema created successfully
✅ Table `field_documents` created
✅ Foreign key constraint added
✅ Ready for use
