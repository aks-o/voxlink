import { Request, Response, NextFunction } from 'express';
import { 
  errorHandler as sharedErrorHandler, 
  setupGlobalErrorHandlers,
  createError,
  ApiError
} from '@voxlink/shared';

// Setup global error handlers for the API Gateway service
setupGlobalErrorHandlers('api-gateway');

// Export the shared error handler configured for API Gateway
export const errorHandler = sharedErrorHandler('api-gateway');

export function notFoundHandler(req: Request, res: Response) {
  const requestId = req.get('X-Request-ID') || 'unknown';
  
  res.status(404).json({
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: 'The requested endpoint does not exist',
      path: req.path,
      method: req.method,
      requestId,
      timestamp: new Date().toISOString(),
    },
  });
}

export function validationErrorHandler(errors: any[]) {
  return createError.validation('Validation failed', errors.map(error => ({
    field: error.path,
    message: error.message,
    value: error.value,
  })));
}

// Re-export shared error types and utilities
export { ApiError, createError } from '@voxlink/shared';