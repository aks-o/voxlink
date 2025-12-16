import { createLogger, measurePerformance } from '@voxlink/shared';

// Create logger instance for API Gateway
export const logger = createLogger('api-gateway');

// Re-export performance measurement utility
export { measurePerformance };