import { createLogger, measurePerformance } from '@voxlink/shared';

// Create logger instance for Number Service
export const logger = createLogger('number-service');

// Re-export performance measurement utility
export { measurePerformance };