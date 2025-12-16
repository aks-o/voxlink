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

// Setup global error handlers for the Billing Service
setupGlobalErrorHandlers('billing-service');

// Export the shared error handler configured for Billing Service
export const errorHandler = sharedErrorHandler('billing-service');

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