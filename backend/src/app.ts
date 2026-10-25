import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import { globalRateLimiter } from './middleware/rateLimiter.js';
import { errorHandler } from './middleware/errorHandler.js';
import { NotFoundError } from './utils/errors.js';

import authRoutes from './modules/auth/auth.routes.js';
import orgRoutes from './modules/organizations/org.routes.js';
import userRoutes from './modules/users/user.routes.js';
import docRoutes from './modules/documents/document.routes.js';
import shareRoutes from './modules/shares/share.routes.js';
import auditRoutes from './modules/audit/audit.routes.js';

export const app = express();

// Security HTTP headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// CORS configuration
app.use(cors({
  origin: env.CLIENT_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Parsers
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Global Rate Limiter
app.use('/api', globalRateLimiter);

// Health check endpoint
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'trustvault-backend',
  });
});

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/organizations', orgRoutes);
app.use('/api/organizations/:organizationId', userRoutes);
app.use('/api/documents', docRoutes);
app.use('/api/documents/:documentId/shares', shareRoutes);
app.use('/api/audit-events', auditRoutes);

// Catch 404 for unhandled API endpoints
app.use('/api/*', (_req, _res, next) => {
  next(new NotFoundError('API endpoint not found'));
});

// Global error handler
app.use(errorHandler);
