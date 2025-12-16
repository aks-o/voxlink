import { Response, NextFunction } from 'express';
import { createRequestLogger } from '@voxlink/shared';
import { AuthenticatedRequest } from './auth';

// Export the shared request logger configured for API Gateway
export const requestLogger = createRequestLogger('api-gateway');

import { logger } from '../utils/logger';

export function auditLogger(action: string, resource: string, details?: any) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const originalJson = res.json;
    
    res.json = function(data: any) {
      // Only log successful operations for audit
      if (res.statusCode < 400) {
        logger.logAuditEvent(action, resource, req.user?.id, {
          userEmail: req.user?.email,
          apiKeyId: req.apiKey?.id,
          requestId: req.get('X-Request-ID'),
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          details,
        });
      }

      return originalJson.call(this, data);
    };

    next();
  };
}