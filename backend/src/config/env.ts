import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('5000').transform((val) => parseInt(val, 10)),
  CLIENT_URL: z.string().default('http://localhost:5173'),
  DATABASE_URL: z.string().default('file:./dev.db'),
  SESSION_SECRET: z.string().min(16).default('super_secure_vault_session_secret_key_1234567890'),
  COOKIE_DOMAIN: z.string().default('localhost'),
  COOKIE_SECURE: z.string().default('false').transform((val) => val === 'true'),
  STORAGE_DRIVER: z.enum(['local', 's3']).default('local'),
  STORAGE_LOCAL_PATH: z.string().default('./vault_storage'),
  RATE_LIMIT_WINDOW_MS: z.string().default('900000').transform((val) => parseInt(val, 10)),
  RATE_LIMIT_MAX_REQUESTS: z.string().default('1000').transform((val) => parseInt(val, 10)),
});

export const env = envSchema.parse(process.env);
