import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { storageConfig } from '../../config/storage.js';
import { BadRequestError, NotFoundError } from '../../utils/errors.js';

export class StorageService {
  /**
   * Generates a collision-resistant unique storage key with tenant isolation prefix.
   */
  public static generateStorageKey(organizationId: string, extension: string): string {
    const cleanExt = extension.replace(/[^a-zA-Z0-9]/g, '');
    const randomHex = crypto.randomBytes(24).toString('hex');
    return `${organizationId}_${Date.now()}_${randomHex}.${cleanExt}`;
  }

  /**
   * Sanitizes and resolves absolute file path inside the private vault.
   * Defends strictly against directory traversal attacks.
   */
  private static resolveSafePath(storageKey: string): string {
    const safeKey = path.basename(storageKey);
    const resolvedPath = path.resolve(storageConfig.localBasePath, safeKey);

    if (!resolvedPath.startsWith(storageConfig.localBasePath)) {
      throw new BadRequestError('Path traversal violation detected');
    }

    return resolvedPath;
  }

  /**
   * Persists an uploaded file buffer into the private vault.
   */
  public static async saveFile(
    storageKey: string,
    buffer: Buffer
  ): Promise<{ fileHashSha256: string; fileSizeBytes: number }> {
    const safePath = this.resolveSafePath(storageKey);
    await fs.promises.writeFile(safePath, buffer);

    const hash = crypto.createHash('sha256').update(buffer).digest('hex');
    return {
      fileHashSha256: hash,
      fileSizeBytes: buffer.length,
    };
  }

  /**
   * Returns a readable stream to stream private file contents directly to an authorized client.
   */
  public static getFileStream(storageKey: string): { stream: fs.ReadStream; size: number } {
    const safePath = this.resolveSafePath(storageKey);
    if (!fs.existsSync(safePath)) {
      throw new NotFoundError('Storage file not found in private vault');
    }

    const stat = fs.statSync(safePath);
    const stream = fs.createReadStream(safePath);
    return { stream, size: stat.size };
  }

  /**
   * Deletes a file from the vault.
   */
  public static async deleteFile(storageKey: string): Promise<void> {
    try {
      const safePath = this.resolveSafePath(storageKey);
      if (fs.existsSync(safePath)) {
        await fs.promises.unlink(safePath);
      }
    } catch {
      // Ignore if file doesn't exist on disk
    }
  }
}
