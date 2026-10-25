import fs from 'fs';
import path from 'path';
import { env } from './env.js';

export const storageConfig = {
  driver: env.STORAGE_DRIVER,
  localBasePath: path.resolve(process.cwd(), env.STORAGE_LOCAL_PATH),
  maxFileSizeBytes: 50 * 1024 * 1024, // 50MB
  allowedMimeTypes: [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // docx
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // xlsx
    'application/vnd.openxmlformats-officedocument.presentationml.presentation', // pptx
    'text/plain',
    'text/csv',
    'image/png',
    'image/jpeg',
    'application/json',
  ],
};

// Ensure vault directory exists
if (storageConfig.driver === 'local') {
  if (!fs.existsSync(storageConfig.localBasePath)) {
    fs.mkdirSync(storageConfig.localBasePath, { recursive: true });
  }
}
