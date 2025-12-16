import { Router, Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { AuthenticatedRequest, requirePermission } from '../middleware/auth';
import { auditLogger } from '../middleware/request-logger';
import { logger } from '../utils/logger';

export function apiKeyRouter(authService: AuthService): Router {
  const router = Router();

  // List API keys for the authenticated user
  router.get('/', async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: {
            code: 'USER_AUTH_REQUIRED',
            message: 'User authentication required for API key management',
          },
        });
      }

      // In a real implementation, you would fetch from database
      const apiKeys = [
        {
          id: 'key-1',
          name: 'Production API Key',
          keyPrefix: 'vxl_prod_****',
          permissions: ['numbers:read', 'numbers:write', 'billing:read'],
          isActive: true,
          lastUsedAt: '2024-01-15T10:30:00Z',
          createdAt: '2024-01-01T00:00:00Z',
          expiresAt: null,
        },
        {
          id: 'key-2',
          name: 'Analytics API Key',
          keyPrefix: 'vxl_analytics_****',
          permissions: ['analytics:read'],
          isActive: true,
          lastUsedAt: '2024-01-14T15:45:00Z',
          createdAt: '2024-01-10T00:00:00Z',
          expiresAt: '2024-12-31T23:59:59Z',
        },
      ];

      res.json({
        apiKeys: apiKeys.map(key => ({
          ...key,
          // Never return the actual key
          key: undefined,
        })),
      });

    } catch (error: any) {
      logger.error('List API keys error', {
        error: error.message,
        userId: req.user?.id,
      });

      res.status(500).json({
        error: {
          code: 'LIST_API_KEYS_ERROR',
          message: 'An error occurred while fetching API keys',
        },
      });
    }
  });

  // Create new API key
  router.post('/',
    requirePermission('api-keys:create')(authService),
    auditLogger('create', 'api-key'),
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        if (!req.user) {
          return res.status(401).json({
            error: {
              code: 'USER_AUTH_REQUIRED',
              message: 'User authentication required for API key creation',
            },
          });
        }

        const { name, permissions, expiresAt } = req.body;

        if (!name || !permissions || !Array.isArray(permissions)) {
          return res.status(400).json({
            error: {
              code: 'INVALID_REQUEST',
              message: 'Name and permissions array are required',
            },
          });
        }

        // Validate permissions
        const validPermissions = [
          'numbers:read',
          'numbers:write',
          'billing:read',
          'billing:write',
          'analytics:read',
          'notifications:read',
          'notifications:write',
        ];

        const invalidPermissions = permissions.filter(
          (perm: string) => !validPermissions.includes(perm)
        );

        if (invalidPermissions.length > 0) {
          return res.status(400).json({
            error: {
              code: 'INVALID_PERMISSIONS',
              message: `Invalid permissions: ${invalidPermissions.join(', ')}`,
              validPermissions,
            },
          });
        }

        // Check if user has permission to grant these permissions
        const hasGrantPermission = await authService.hasPermission(req.user!, 'api_keys', 'grant', {});
        if (!hasGrantPermission) {
          return res.status(403).json({
            error: {
              code: 'PERMISSION_DENIED',
              message: 'You do not have permission to grant API key permissions',
            },
          });
        }
        
        const permissionChecks = permissions.map((perm: string) => ({
          perm,
          hasPermission: true
        }));
        
        const unauthorizedPermissions = permissionChecks
          .filter(check => !check.hasPermission)
          .map(check => check.perm);

        if (unauthorizedPermissions.length > 0) {
          return res.status(403).json({
            error: {
              code: 'INSUFFICIENT_PERMISSIONS',
              message: `You don't have permission to grant: ${unauthorizedPermissions.join(', ')}`,
            },
          });
        }

        const apiKey = await authService.generateApiKey(req.user.id, name, permissions);

        logger.info('API key created', {
          userId: req.user.id,
          apiKeyId: apiKey.id,
          apiKeyName: name,
          permissions,
          ip: req.ip,
          userAgent: req.get('User-Agent'),
        });

        res.status(201).json({
          apiKey: {
            id: apiKey.id,
            name: apiKey.name,
            key: apiKey.key, // Only return the key on creation
            permissions: apiKey.permissions,
            isActive: apiKey.isActive,
            expiresAt: apiKey.expiresAt,
            createdAt: apiKey.createdAt,
          },
          warning: 'This is the only time the API key will be displayed. Please store it securely.',
        });

      } catch (error: any) {
        logger.error('Create API key error', {
          error: error.message,
          userId: req.user?.id,
        });

        res.status(500).json({
          error: {
            code: 'CREATE_API_KEY_ERROR',
            message: 'An error occurred while creating the API key',
          },
        });
      }
    }
  );

  // Update API key (name, permissions, expiration)
  router.put('/:keyId',
    requirePermission('api-keys:write')(authService),
    auditLogger('update', 'api-key'),
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        if (!req.user) {
          return res.status(401).json({
            error: {
              code: 'USER_AUTH_REQUIRED',
              message: 'User authentication required',
            },
          });
        }

        const { keyId } = req.params;
        const { name, permissions, isActive, expiresAt } = req.body;

        // In a real implementation, you would:
        // 1. Fetch the API key from database
        // 2. Verify ownership
        // 3. Update the fields
        // 4. Invalidate cache if needed

        logger.info('API key updated', {
          userId: req.user.id,
          apiKeyId: keyId,
          changes: { name, permissions, isActive, expiresAt },
          ip: req.ip,
          userAgent: req.get('User-Agent'),
        });

        res.json({
          message: 'API key updated successfully',
          apiKey: {
            id: keyId,
            name: name || 'Updated API Key',
            permissions: permissions || ['numbers:read'],
            isActive: isActive !== undefined ? isActive : true,
            expiresAt,
            updatedAt: new Date().toISOString(),
          },
        });

      } catch (error: any) {
        logger.error('Update API key error', {
          error: error.message,
          userId: req.user?.id,
          keyId: req.params.keyId,
        });

        res.status(500).json({
          error: {
            code: 'UPDATE_API_KEY_ERROR',
            message: 'An error occurred while updating the API key',
          },
        });
      }
    }
  );

  // Revoke API key
  router.delete('/:keyId',
    requirePermission('api-keys:delete')(authService),
    auditLogger('revoke', 'api-key'),
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        if (!req.user) {
          return res.status(401).json({
            error: {
              code: 'USER_AUTH_REQUIRED',
              message: 'User authentication required',
            },
          });
        }

        const { keyId } = req.params;

        await authService.revokeApiKey(keyId);

        logger.warn('API key revoked', {
          userId: req.user.id,
          apiKeyId: keyId,
          ip: req.ip,
          userAgent: req.get('User-Agent'),
        });

        res.json({
          message: 'API key revoked successfully',
        });

      } catch (error: any) {
        logger.error('Revoke API key error', {
          error: error.message,
          userId: req.user?.id,
          keyId: req.params.keyId,
        });

        res.status(500).json({
          error: {
            code: 'REVOKE_API_KEY_ERROR',
            message: 'An error occurred while revoking the API key',
          },
        });
      }
    }
  );

  // Get API key usage statistics
  router.get('/:keyId/usage', async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: {
            code: 'USER_AUTH_REQUIRED',
            message: 'User authentication required',
          },
        });
      }

      const { keyId } = req.params;
      const { period = '30d' } = req.query;

      // In a real implementation, you would fetch usage statistics from database/analytics
      const usageStats = {
        keyId,
        period,
        totalRequests: 1247,
        successfulRequests: 1198,
        failedRequests: 49,
        averageResponseTime: 156,
        requestsByEndpoint: {
          '/api/v1/numbers': 856,
          '/api/v1/billing': 234,
          '/api/v1/analytics': 157,
        },
        requestsByDay: [
          { date: '2024-01-01', requests: 45 },
          { date: '2024-01-02', requests: 52 },
          { date: '2024-01-03', requests: 48 },
          // ... more data
        ],
        lastUsedAt: '2024-01-15T10:30:00Z',
      };

      res.json({ usage: usageStats });

    } catch (error: any) {
      logger.error('Get API key usage error', {
        error: error.message,
        userId: req.user?.id,
        keyId: req.params.keyId,
      });

      res.status(500).json({
        error: {
          code: 'GET_USAGE_ERROR',
          message: 'An error occurred while fetching usage statistics',
        },
      });
    }
  });

  // Regenerate API key
  router.post('/:keyId/regenerate',
    requirePermission('api-keys:write')(authService),
    auditLogger('regenerate', 'api-key'),
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        if (!req.user) {
          return res.status(401).json({
            error: {
              code: 'USER_AUTH_REQUIRED',
              message: 'User authentication required',
            },
          });
        }

        const { keyId } = req.params;

        // In a real implementation, you would:
        // 1. Fetch the existing API key
        // 2. Generate a new key
        // 3. Update the database
        // 4. Invalidate the old key from cache

        const newApiKey = await authService.generateApiKey(
          req.user.id,
          'Regenerated API Key',
          ['numbers:read', 'numbers:write']
        );

        logger.warn('API key regenerated', {
          userId: req.user.id,
          oldKeyId: keyId,
          newKeyId: newApiKey.id,
          ip: req.ip,
          userAgent: req.get('User-Agent'),
        });

        res.json({
          message: 'API key regenerated successfully',
          apiKey: {
            id: newApiKey.id,
            key: newApiKey.key, // Only return the key on regeneration
            name: newApiKey.name,
            permissions: newApiKey.permissions,
            isActive: newApiKey.isActive,
            createdAt: newApiKey.createdAt,
          },
          warning: 'The old API key has been revoked. Update your applications with the new key.',
        });

      } catch (error: any) {
        logger.error('Regenerate API key error', {
          error: error.message,
          userId: req.user?.id,
          keyId: req.params.keyId,
        });

        res.status(500).json({
          error: {
            code: 'REGENERATE_API_KEY_ERROR',
            message: 'An error occurred while regenerating the API key',
          },
        });
      }
    }
  );

  return router;
}