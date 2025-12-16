import { 
  errorHandler as sharedErrorHandler, 
  setupGlobalErrorHandlers,
  createError,
  ApiError,
  asyncHandler,
  ValidationError,
  NotFoundError,
  ConflictError,
  UnauthorizedError,
  ForbiddenError
} from '@voxlink/shared';

// Setup global error handlers for the Number Service
setupGlobalErrorHandlers('number-service');

// Export the shared error handler configured for Number Service
export const errorHandler = sharedErrorHandler('number-service');

// Re-export shared error types and utilities
export { 
  ApiError, 
  createError, 
  asyncHandler,
  ValidationError,
  NotFoundError,
  ConflictError,
  UnauthorizedError,
  ForbiddenError
};