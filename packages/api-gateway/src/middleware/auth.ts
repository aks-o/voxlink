import { Request, Response, NextFunction } from 'express';
import { AuthService, ApiKey } from '../services/auth.service';
import { User } from '@voxlink/shared';
import { logger } from '../utils/logger';

export interface AuthenticatedRequest extends Request {
  user?: User;
  apiKey?: ApiKey;
  authType?: 'jwt' | 'apikey';
}

export function authMiddleware(authService: AuthService) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;
      const apiKeyHeader = req.headers['x-api-key'] as string;

      // Check for JWT token
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);

        try {
          const payload = await authService.verifyToken(token);
          const user = await authService['getUserById'](payload.sub);

          if (user && user.isActive) {
            req.user = user;
            req.authType = 'jwt';
            return next();
          }
        } catch (error) {
          logger.warn('JWT token verification failed:', error as any);
        }
      }

      // Check for API key
      if (apiKeyHeader) {
        try {
          const apiKey = await authService.verifyApiKey(apiKeyHeader);

          if (apiKey) {
            req.apiKey = apiKey;
            req.authType = 'apikey';
            return next();
          }
        } catch (error) {
          logger.warn('API key verification failed:', error as any);
        }
      }

      // No valid authentication found
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required. Provide a valid JWT token or API key.',
        },
      });
    } catch (error) {
      logger.error('Authentication middleware error:', error as any);
      return res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Authentication service error',
        },
      });
    }
  };
}

export function requirePermission(permission: string) {
  return (authService: AuthService) => {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      const user = req.user || req.apiKey;

      if (!user) {
        return res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        });
      }

      if (!authService.hasPermission(user, permission, 'read')) {
        return res.status(403).json({
          error: {
            code: 'FORBIDDEN',
            message: `Insufficient permissions. Required: ${permission}`,
          },
        });
      }

      next();
    };
  };
}

export function requireAnyPermission(permissions: string[]) {
  return (authService: AuthService) => {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      const user = req.user || req.apiKey;

      if (!user) {
        return res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        });
      }

      const permissionObjects = permissions.map(p => ({ resource: p, action: 'read' }));
      if (!authService.hasAnyPermission(user, permissionObjects)) {
        return res.status(403).json({
          error: {
            code: 'FORBIDDEN',
            message: `Insufficient permissions. Required one of: ${permissions.join(', ')}`,
          },
        });
      }

      next();
    };
  };
}

export function requireRole(role: string) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'User authentication required',
        },
      });
    }

    if (req.user.role !== role && req.user.role !== 'admin') {
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: `Insufficient role. Required: ${role}`,
        },
      });
    }

    next();
  };
}

export function optionalAuth(authService: AuthService) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;
      const apiKeyHeader = req.headers['x-api-key'] as string;

      // Try JWT token
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);

        try {
          const payload = await authService.verifyToken(token);
          const user = await authService['getUserById'](payload.sub);

          if (user && user.isActive) {
            req.user = user;
            req.authType = 'jwt';
          }
        } catch (error) {
          // Ignore authentication errors for optional auth
        }
      }

      // Try API key
      if (apiKeyHeader && !req.user) {
        try {
          const apiKey = await authService.verifyApiKey(apiKeyHeader);

          if (apiKey) {
            req.apiKey = apiKey;
            req.authType = 'apikey';
          }
        } catch (error) {
          // Ignore authentication errors for optional auth
        }
      }

      next();
    } catch (error) {
      logger.error('Optional auth middleware error:', error as any);
      next(); // Continue without authentication
    }
  };
}