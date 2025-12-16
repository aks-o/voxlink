import { 
  errorHandler as sharedErrorHandler, 
  setupGlobalErrorHandlers,
  createError,
  ApiError,
  asyncHandler,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ConflictError
} from '@voxlink/shared';

// Setup global error handlers for the Notification Service
setupGlobalErrorHandlers('notification-service');

// Export the shared error handler configured for Notification Service
export const errorHandler = sharedErrorHandler('notification-service');

// Re-export shared error types and utilities
export { 
  ApiError, 
  createError, 
  asyncHandler,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ConflictError
};