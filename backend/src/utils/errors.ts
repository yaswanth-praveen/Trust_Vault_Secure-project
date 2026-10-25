export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;
  public details?: any;

  constructor(message: string, statusCode = 500, details?: any) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.isOperational = true;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found', details?: any) {
    super(message, 404, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required', details?: any) {
    super(message, 401, details);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Access denied', details?: any) {
    super(message, 403, details);
  }
}

export class BadRequestError extends AppError {
  constructor(message = 'Invalid request payload', details?: any) {
    super(message, 400, details);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Resource conflict', details?: any) {
    super(message, 409, details);
  }
}
