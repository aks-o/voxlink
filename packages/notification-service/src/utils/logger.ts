import { createLogger, measurePerformance } from '@voxlink/shared';

// Create logger instance for Notification Service
export const logger = createLogger('notification-service');

// Re-export performance measurement utility
export { measurePerformance };