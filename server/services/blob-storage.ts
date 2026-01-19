import { put, del, list } from '@vercel/blob';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

// ============================================================================
// Storage Service Interface
// ============================================================================
export interface StorageService {
  uploadFile(file: Buffer, filename: string, folder: string): Promise<string>;
  deleteFile(urlOrPath: string): Promise<void>;
  listFiles(folder: string): Promise<string[]>;
  downloadFile(urlOrPath: string): Promise<Buffer>;
  getStorageType(): 'blob' | 'local';
}

// ============================================================================
// Vercel Blob Storage Service
// ============================================================================
export class BlobStorageService implements StorageService {
  async uploadFile(file: Buffer, filename: string, folder: string): Promise<string> {
    try {
      // Sanitize filename to prevent path traversal
      const sanitizedFilename = path.basename(filename);
      const blobPath = `${folder}/${sanitizedFilename}`;

      console.log(`📤 Uploading to Vercel Blob: ${blobPath} (${file.length} bytes)`);

      const blob = await put(blobPath, file, {
        access: 'public',
        addRandomSuffix: true, // Prevent filename conflicts
      });

      console.log(`✅ Blob upload successful: ${blob.url}`);
      return blob.url;
    } catch (error) {
      console.error('❌ Blob upload failed:', error);
      throw new Error(`Failed to upload file to Vercel Blob: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async deleteFile(url: string): Promise<void> {
    try {
      console.log(`🗑️ Deleting from Vercel Blob: ${url}`);
      await del(url);
      console.log(`✅ Blob deletion successful: ${url}`);
    } catch (error) {
      console.error('❌ Blob deletion failed:', error);
      throw new Error(`Failed to delete file from Vercel Blob: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async listFiles(folder: string): Promise<string[]> {
    try {
      const { blobs } = await list({ prefix: folder });
      return blobs.map(b => b.url);
    } catch (error) {
      console.error('❌ Blob list failed:', error);
      throw new Error(`Failed to list files from Vercel Blob: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async downloadFile(url: string): Promise<Buffer> {
    try {
      console.log(`⬇️ Downloading from Vercel Blob: ${url}`);
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (error) {
      console.error('❌ Blob download failed:', error);
      throw new Error(`Failed to download file from Vercel Blob: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  getStorageType(): 'blob' | 'local' {
    return 'blob';
  }
}

// ============================================================================
// Local Storage Service (Fallback)
// ============================================================================
export class LocalStorageService implements StorageService {
  private baseDir: string;

  constructor(baseDir?: string) {
    this.baseDir = baseDir || path.join(process.cwd(), 'uploads');
    this.ensureBaseDir();
  }

  private ensureBaseDir() {
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true });
    }
  }

  private ensureFolderExists(folder: string) {
    const folderPath = path.join(this.baseDir, folder);
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }
    return folderPath;
  }

  async uploadFile(file: Buffer, filename: string, folder: string): Promise<string> {
    try {
      const folderPath = this.ensureFolderExists(folder);

      // Generate unique filename to prevent conflicts
      const uniqueSuffix = crypto.randomBytes(8).toString('hex');
      const ext = path.extname(filename);
      const baseName = path.basename(filename, ext);
      const uniqueFilename = `${baseName}-${uniqueSuffix}${ext}`;

      const filePath = path.join(folderPath, uniqueFilename);

      console.log(`💾 Saving to local storage: ${filePath} (${file.length} bytes)`);
      fs.writeFileSync(filePath, file);
      console.log(`✅ Local save successful: ${filePath}`);

      // Return relative path from base dir (used as identifier)
      return path.join(folder, uniqueFilename);
    } catch (error) {
      console.error('❌ Local storage save failed:', error);
      throw new Error(`Failed to save file locally: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async deleteFile(filePath: string): Promise<void> {
    try {
      const fullPath = path.join(this.baseDir, filePath);

      if (fs.existsSync(fullPath)) {
        console.log(`🗑️ Deleting from local storage: ${fullPath}`);
        fs.unlinkSync(fullPath);
        console.log(`✅ Local deletion successful: ${fullPath}`);
      } else {
        console.warn(`⚠️ File not found for deletion: ${fullPath}`);
      }
    } catch (error) {
      console.error('❌ Local deletion failed:', error);
      throw new Error(`Failed to delete file locally: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async listFiles(folder: string): Promise<string[]> {
    try {
      const folderPath = path.join(this.baseDir, folder);

      if (!fs.existsSync(folderPath)) {
        return [];
      }

      const files = fs.readdirSync(folderPath);
      return files.map(f => path.join(folder, f));
    } catch (error) {
      console.error('❌ Local list failed:', error);
      throw new Error(`Failed to list local files: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async downloadFile(filePath: string): Promise<Buffer> {
    try {
      const fullPath = path.join(this.baseDir, filePath);

      console.log(`⬇️ Reading from local storage: ${fullPath}`);

      if (!fs.existsSync(fullPath)) {
        throw new Error(`File not found: ${fullPath}`);
      }

      return fs.readFileSync(fullPath);
    } catch (error) {
      console.error('❌ Local read failed:', error);
      throw new Error(`Failed to read local file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  getStorageType(): 'blob' | 'local' {
    return 'local';
  }

  getFullPath(filePath: string): string {
    return path.join(this.baseDir, filePath);
  }
}

// ============================================================================
// Storage Service Factory
// ============================================================================
let storageServiceInstance: StorageService | null = null;

export function getStorageService(): StorageService {
  if (storageServiceInstance) {
    return storageServiceInstance;
  }

  // Check if Vercel Blob is configured
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    console.log('📦 Using Vercel Blob storage');
    storageServiceInstance = new BlobStorageService();
  } else {
    console.log('⚠️ BLOB_READ_WRITE_TOKEN not set - using local storage fallback');
    storageServiceInstance = new LocalStorageService();
  }

  return storageServiceInstance;
}

// Reset storage service (useful for testing)
export function resetStorageService() {
  storageServiceInstance = null;
}

// Helper function to check if a path is a URL
export function isUrl(pathOrUrl: string): boolean {
  try {
    const url = new URL(pathOrUrl);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}
