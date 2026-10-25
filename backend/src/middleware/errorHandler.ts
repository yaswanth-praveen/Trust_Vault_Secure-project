import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import { env } from '../config/env.js';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  logger.error(`Error processing ${req.method} ${req.originalUrl}: ${err.message}`, {
    stack: err.stack,
    body: req.body,
    user: req.user?.id,
  });

  // Handle Multer upload errors
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        status: 'error',
        message: 'File size exceeds maximum allowed limit (50MB)',
      });
    }
    return res.status(400).json({
      status: 'error',
      message: `Upload error: ${err.message}`,
    });
  }

  // Handle Prisma unique constraint errors (P2002)
  if (err.code === 'P2002') {
    return res.status(409).json({
      status: 'error',
      message: 'A record with this unique field already exists',
      target: err.meta?.target,
    });
  }

  // Handle operational AppErrors
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      status: 'error',
      message: err.message,
      details: err.details,
    });
  }

  // Unhandled / server errors
  const isDev = env.NODE_ENV === 'development';
  return res.status(500).json({
    status: 'error',
    message: isDev ? err.message : 'An unexpected internal server error occurred',
    ...(isDev && { stack: err.stack }),
  });
};
