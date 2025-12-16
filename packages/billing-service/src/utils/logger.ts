import { createLogger, measurePerformance } from '@voxlink/shared';

// Create logger instance for Billing Service
export const logger = createLogger('billing-service');

// Re-export performance measurement utility
export { measurePerformance };