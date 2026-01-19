# Cloud Document Storage with Vercel Blob

This document describes the cloud document storage implementation using Vercel Blob for the Roof ER Command Center.

## Overview

The application now supports **dual storage modes**:
- **Vercel Blob Storage** (Cloud) - Automatic when `BLOB_READ_WRITE_TOKEN` is set
- **Local File Storage** (Fallback) - Used when Vercel Blob is not configured

The system automatically detects which storage backend to use and seamlessly handles file operations (upload, download, delete) regardless of the storage type.

## Architecture

### Files Created/Modified

#### New Files
1. **`server/services/blob-storage.ts`** - Storage service abstraction layer
   - `BlobStorageService` - Vercel Blob implementation
   - `LocalStorageService` - Local file system implementation
   - `getStorageService()` - Factory function that returns the appropriate service
   - `isUrl()` - Helper to detect if a path is a URL

#### Modified Files
1. **`server/routes/field/index.ts`** - Updated document endpoints
   - `POST /api/field/documents/upload` - Now uses storage service
   - `GET /api/field/documents/:id/download` - Handles both URLs and paths
   - `DELETE /api/field/documents/:id` - Deletes from correct storage

2. **`server/index.ts`** - Server startup logging
   - Displays storage mode on server startup
   - Shows either "☁️ Vercel Blob" or "💾 Local Storage"

3. **`package.json`** - Added dependency
   - `@vercel/blob` - Vercel's official Blob Storage SDK

### Database Schema

The existing `fieldDocuments` table already supports both storage types:
```typescript
fieldDocuments {
  id: serial
  userId: integer
  filename: text          // Filename (extracted from path/URL)
  originalName: text      // Original uploaded filename
  mimeType: text          // File MIME type
  fileSize: integer       // File size in bytes
  category: text          // Document category
  tags: text[]            // Search tags
  description: text       // Optional description
  analysisResult: jsonb   // AI analysis result
  storagePath: text       // ⭐ Can be either a Blob URL or local path
  uploadedAt: timestamp
  lastAccessedAt: timestamp
}
```

The `storagePath` column is the key - it stores:
- **Blob mode**: `https://[account].public.blob.vercel-storage.com/documents/[filename]`
- **Local mode**: `documents/[filename]`

## Configuration

### Environment Variables

Add to your `.env` file:

```bash
# Vercel Blob Storage (optional)
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxxxxxxxx

# If not set, local storage will be used automatically
```

### Getting Your Vercel Blob Token

1. Go to your Vercel project dashboard
2. Navigate to **Storage** tab
3. Create a new **Blob Store** (if you haven't already)
4. Copy the `BLOB_READ_WRITE_TOKEN`
5. Add it to your environment variables

### Vercel Deployment

When deploying to Vercel:

1. **Add Environment Variable** in Vercel Dashboard:
   ```
   BLOB_READ_WRITE_TOKEN = [your token]
   ```

2. **Redeploy** your application

3. The server will automatically detect Vercel Blob and use it

## Storage Service API

### Common Interface

Both storage services implement the same interface:

```typescript
interface StorageService {
  uploadFile(file: Buffer, filename: string, folder: string): Promise<string>;
  deleteFile(urlOrPath: string): Promise<void>;
  listFiles(folder: string): Promise<string[]>;
  downloadFile(urlOrPath: string): Promise<Buffer>;
  getStorageType(): 'blob' | 'local';
}
```

### Usage Examples

```typescript
import { getStorageService } from './services/blob-storage.js';

const storage = getStorageService();

// Upload a file
const url = await storage.uploadFile(
  fileBuffer,
  'document.pdf',
  'documents'
);

// Download a file
const buffer = await storage.downloadFile(url);

// Delete a file
await storage.deleteFile(url);

// List files in a folder
const files = await storage.listFiles('documents');

// Check storage type
const type = storage.getStorageType(); // 'blob' or 'local'
```

## How It Works

### Upload Flow

1. **Client** uploads file via `POST /api/field/documents/upload`
2. **Multer** captures file in memory (using `uploadMemory`)
3. **Storage Service** is retrieved via `getStorageService()`
4. **File Upload** happens:
   - **Blob mode**: Uploads to Vercel Blob, returns public URL
   - **Local mode**: Saves to `uploads/documents/`, returns relative path
5. **Database Record** is created with `storagePath` containing the URL or path
6. **Response** includes storage type for client awareness

### Download Flow

1. **Client** requests `GET /api/field/documents/:id/download`
2. **Database Query** retrieves document record
3. **Path Detection** checks if `storagePath` is a URL using `isUrl()`
4. **File Retrieval**:
   - **Blob mode**: Redirects client to the public Blob URL
   - **Local mode**: Streams file from local disk
5. **Client** receives the file

### Delete Flow

1. **Client** sends `DELETE /api/field/documents/:id`
2. **Database Query** retrieves document record
3. **Storage Service** deletes file:
   - **Blob mode**: Calls Vercel Blob `del()` API
   - **Local mode**: Deletes file from disk using `fs.unlinkSync()`
4. **Database Record** is deleted
5. **Response** confirms deletion

## Features

### Automatic Failover

If Vercel Blob is configured but upload fails, the error is propagated to the client. The system does **not** automatically fall back to local storage during runtime to maintain data consistency.

### URL Detection

The `isUrl()` helper function detects whether a storage path is a URL:
```typescript
isUrl('https://blob.vercel-storage.com/file.pdf')  // true
isUrl('documents/file.pdf')                          // false
```

This allows the download endpoint to handle both storage types correctly.

### Random Suffix

Both storage services add random suffixes to filenames to prevent conflicts:
- **Blob mode**: Uses Vercel Blob's `addRandomSuffix: true` option
- **Local mode**: Appends 8-byte hex string (e.g., `document-a1b2c3d4.pdf`)

### Logging

The storage service logs all operations:
```
📤 Uploading to Vercel Blob: documents/report.pdf (524288 bytes)
✅ Blob upload successful: https://[...].blob.vercel-storage.com/[...]
```

Or for local storage:
```
💾 Saving to local storage: /path/to/uploads/documents/report.pdf (524288 bytes)
✅ Local save successful: /path/to/uploads/documents/report.pdf
```

## Migration Strategy

### Existing Local Files

If you have existing documents stored locally and want to migrate to Vercel Blob:

1. **Migration Script** (not yet implemented):
   ```typescript
   // Future: scripts/migrate-to-blob.ts
   // - Query all fieldDocuments with local paths
   // - Upload each file to Vercel Blob
   // - Update storagePath in database
   // - Optionally delete local files
   ```

2. **Hybrid Mode**: The system can handle mixed storage:
   - Old documents remain as local paths
   - New documents use Blob URLs
   - Both work seamlessly

### Testing Migration

1. **Start with local storage** (no `BLOB_READ_WRITE_TOKEN`)
2. **Upload test documents**
3. **Add Vercel Blob token**
4. **Restart server**
5. **Upload new documents** - they'll go to Blob
6. **Old documents** still download from local storage
7. **Both types** work side-by-side

## Troubleshooting

### Server doesn't detect Vercel Blob

**Symptom**: Server logs show "💾 Local Storage" even with token set

**Solutions**:
1. Check `.env` file has `BLOB_READ_WRITE_TOKEN` set
2. Restart the server completely
3. Verify token is not expired
4. Check Vercel dashboard for token validity

### Upload fails with Blob storage

**Symptom**: Upload returns 500 error

**Solutions**:
1. Check Vercel Blob dashboard for quota limits
2. Verify token has write permissions
3. Check file size (default limit: 10MB)
4. Review server logs for specific error message

### Download fails for Blob URLs

**Symptom**: 404 error when downloading document

**Solutions**:
1. Verify URL in database is valid
2. Check Vercel Blob dashboard - file may have been deleted
3. Check if Blob storage was deleted/recreated
4. Review CORS settings if accessing from different domain

### Mixed storage mode confusion

**Symptom**: Some files download, others don't

**Solutions**:
1. Check `storagePath` column in database
2. URLs starting with `https://` are Blob storage
3. Relative paths are local storage
4. Ensure local uploads directory exists if using mixed mode

## Performance Considerations

### Vercel Blob
- ✅ **Fast global CDN**
- ✅ **No server disk usage**
- ✅ **Scalable storage**
- ✅ **Automatic backups**
- ❌ **Costs money** (beyond free tier)
- ❌ **Requires internet** for access

### Local Storage
- ✅ **Free**
- ✅ **Works offline**
- ✅ **No external dependencies**
- ❌ **Single point of failure** (server disk)
- ❌ **Limited by disk space**
- ❌ **No CDN benefits**

## Security

### Vercel Blob
- Files are stored with public access by default
- URLs are long and hard to guess (includes random tokens)
- No authentication required to access files (by design)
- Suitable for: documents that need to be shared/accessed easily

### Local Storage
- Files are protected by your server's security
- Requires authentication to download (enforced by endpoint)
- Files are not directly accessible
- Suitable for: sensitive documents requiring strict access control

**Recommendation**: For sensitive documents, consider:
1. Using local storage mode
2. Or implementing signed URLs with Vercel Blob (future enhancement)

## Future Enhancements

Possible improvements:

1. **Signed URLs**: Temporary access URLs for Blob storage
2. **Migration Script**: Automated local → Blob migration
3. **S3 Support**: Add AWS S3 as third storage option
4. **Compression**: Automatic compression before upload
5. **Thumbnails**: Generate thumbnails for images
6. **Virus Scanning**: Scan uploads for malware
7. **Versioning**: Keep multiple versions of documents

## API Reference

### Upload Document
```
POST /api/field/documents/upload
Content-Type: multipart/form-data

Body:
- document: File (required)
- category: string (optional)
- tags: string[] (optional)
- description: string (optional)
- analyzeWithAI: boolean (optional)

Response:
{
  "success": true,
  "data": {
    "id": 123,
    "filename": "document.pdf",
    "category": "insurance",
    "size": 524288,
    "uploadedAt": "2026-01-19T...",
    "hasAnalysis": false,
    "storageType": "blob"  // or "local"
  }
}
```

### Download Document
```
GET /api/field/documents/:id/download

Response:
- For Blob: HTTP 302 redirect to Blob URL
- For Local: Binary file stream
```

### Delete Document
```
DELETE /api/field/documents/:id

Response:
{
  "success": true,
  "data": {
    "message": "Document deleted successfully"
  }
}
```

## Summary

This implementation provides:
- ✅ **Seamless cloud storage** with Vercel Blob
- ✅ **Automatic fallback** to local storage
- ✅ **Zero config changes** required for existing code
- ✅ **Backward compatible** with existing local files
- ✅ **Production ready** with proper error handling
- ✅ **Easy deployment** on Vercel platform

The storage layer is completely abstracted - future storage backends can be added without changing the API endpoints.
