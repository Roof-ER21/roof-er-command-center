import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { LocalStorageService, isUrl, resetStorageService } from '../blob-storage';
import fs from 'fs';
import path from 'path';

describe('Blob Storage Service', () => {
  describe('isUrl helper', () => {
    it('should detect HTTP URLs', () => {
      expect(isUrl('http://example.com/file.pdf')).toBe(true);
      expect(isUrl('https://blob.vercel-storage.com/file.pdf')).toBe(true);
    });

    it('should reject local paths', () => {
      expect(isUrl('documents/file.pdf')).toBe(false);
      expect(isUrl('/absolute/path/file.pdf')).toBe(false);
      expect(isUrl('file.pdf')).toBe(false);
    });

    it('should reject invalid inputs', () => {
      expect(isUrl('')).toBe(false);
      expect(isUrl('not a url')).toBe(false);
      expect(isUrl('ftp://example.com/file')).toBe(false);
    });
  });

  describe('LocalStorageService', () => {
    let service: LocalStorageService;
    let testDir: string;

    beforeEach(() => {
      // Create a temporary test directory
      testDir = path.join(process.cwd(), 'test-uploads');
      service = new LocalStorageService(testDir);
    });

    afterEach(() => {
      // Clean up test directory
      if (fs.existsSync(testDir)) {
        fs.rmSync(testDir, { recursive: true, force: true });
      }
      resetStorageService();
    });

    it('should create base directory on initialization', () => {
      expect(fs.existsSync(testDir)).toBe(true);
    });

    it('should upload file and return path', async () => {
      const fileBuffer = Buffer.from('test content');
      const filename = 'test.txt';
      const folder = 'documents';

      const storagePath = await service.uploadFile(fileBuffer, filename, folder);

      expect(storagePath).toContain('documents/');
      expect(storagePath).toContain('test');
      expect(storagePath).toContain('.txt');

      // Verify file exists
      const fullPath = service.getFullPath(storagePath);
      expect(fs.existsSync(fullPath)).toBe(true);

      // Verify content
      const savedContent = fs.readFileSync(fullPath, 'utf-8');
      expect(savedContent).toBe('test content');
    });

    it('should generate unique filenames for multiple uploads', async () => {
      const fileBuffer = Buffer.from('test content');
      const filename = 'test.txt';
      const folder = 'documents';

      const path1 = await service.uploadFile(fileBuffer, filename, folder);
      const path2 = await service.uploadFile(fileBuffer, filename, folder);

      expect(path1).not.toBe(path2);
    });

    it('should download file correctly', async () => {
      const originalContent = 'test download content';
      const fileBuffer = Buffer.from(originalContent);
      const filename = 'download-test.txt';
      const folder = 'documents';

      const storagePath = await service.uploadFile(fileBuffer, filename, folder);
      const downloadedBuffer = await service.downloadFile(storagePath);

      expect(downloadedBuffer.toString('utf-8')).toBe(originalContent);
    });

    it('should delete file correctly', async () => {
      const fileBuffer = Buffer.from('delete test');
      const filename = 'delete-test.txt';
      const folder = 'documents';

      const storagePath = await service.uploadFile(fileBuffer, filename, folder);
      const fullPath = service.getFullPath(storagePath);

      expect(fs.existsSync(fullPath)).toBe(true);

      await service.deleteFile(storagePath);

      expect(fs.existsSync(fullPath)).toBe(false);
    });

    it('should list files in folder', async () => {
      const folder = 'documents';

      // Upload multiple files
      await service.uploadFile(Buffer.from('file 1'), 'file1.txt', folder);
      await service.uploadFile(Buffer.from('file 2'), 'file2.txt', folder);
      await service.uploadFile(Buffer.from('file 3'), 'file3.txt', folder);

      const files = await service.listFiles(folder);

      expect(files).toHaveLength(3);
      expect(files.every(f => f.startsWith('documents/'))).toBe(true);
    });

    it('should return empty array for non-existent folder', async () => {
      const files = await service.listFiles('non-existent-folder');
      expect(files).toEqual([]);
    });

    it('should handle special characters in filenames', async () => {
      const fileBuffer = Buffer.from('special chars');
      const filename = 'test file (1) [copy].txt';
      const folder = 'documents';

      const storagePath = await service.uploadFile(fileBuffer, filename, folder);
      expect(storagePath).toBeTruthy();

      const downloadedBuffer = await service.downloadFile(storagePath);
      expect(downloadedBuffer.toString('utf-8')).toBe('special chars');
    });

    it('should return correct storage type', () => {
      expect(service.getStorageType()).toBe('local');
    });

    it('should throw error when downloading non-existent file', async () => {
      await expect(
        service.downloadFile('documents/non-existent-file.txt')
      ).rejects.toThrow();
    });

    it('should create nested folders if needed', async () => {
      const fileBuffer = Buffer.from('nested test');
      const filename = 'nested.txt';
      const folder = 'documents/subfolder/deep';

      const storagePath = await service.uploadFile(fileBuffer, filename, folder);
      expect(storagePath).toContain('documents/subfolder/deep/');

      const fullPath = service.getFullPath(storagePath);
      expect(fs.existsSync(fullPath)).toBe(true);
    });
  });
});
