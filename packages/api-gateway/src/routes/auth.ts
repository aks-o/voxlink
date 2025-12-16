import { Router, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { AuthService } from '../services/auth.service';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';
import { logger } from '../utils/logger';
import { config } from '../config/config';
import { MFAVerification } from '@voxlink/shared';

export function authRouter(authService: AuthService): Router {
  const router = Router();

  // Rate limiting for auth endpoints
  const authRateLimit = rateLimit({
    windowMs: config.rateLimit.auth.windowMs,
    max: config.rateLimit.auth.max,
    message: {
      error: {
        code: 'AUTH_RATE_LIMIT_EXCEEDED',
        message: 'Too many authentication attempts. Please try again later.',
      },
    },
    standardHeaders: true,
    legacyHeaders: false,
  });

  // Enhanced login endpoint with MFA support
  router.post('/login', authRateLimit, async (req: Request, res: Response) => {
    try {
      const { email, password, mfaToken, backupCode } = req.body;

      if (!email || !password) {
        await authService.logSecurityEvent(
          'failed_login',
          undefined,
          'Login attempt with missing credentials',
          { email, ip: req.ip },
          req,
          'low'
        );

        return res.status(400).json({
          error: {
            code: 'MISSING_CREDENTIALS',
            message: 'Email and password are required',
          },
        });
      }

      // Prepare MFA verification if provided
      let mfaVerification: MFAVerification | undefined;
      if (mfaToken || backupCode) {
        mfaVerification = {
          token: mfaToken || '',
          backupCode: backupCode,
        };
      }

      const authResult = await authService.authenticateUser(email, password, mfaVerification, req);

      if (!authResult.user && authResult.requiresMFA) {
        return res.status(200).json({
          requiresMFA: true,
          message: 'Multi-factor authentication required',
        });
      }

      if (!authResult.user) {
        return res.status(401).json({
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Invalid email or password',
          },
        });
      }

      const tokens = await authService.generateTokens(authResult.user);

      res.json({
        user: {
          id: authResult.user.id,
          email: authResult.user.email,
          name: authResult.user.name,
          role: authResult.user.role,
          organizationId: authResult.user.organizationId,
          mfaEnabled: authResult.user.mfaEnabled,
        },
        tokens,
        mfaSetupRequired: authResult.mfaSetupRequired,
      });

    } catch (error: any) {
      logger.error('Login error', {
        error: error.message,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
      });

      res.status(500).json({
        error: {
          code: 'LOGIN_ERROR',
          message: 'An error occurred during login',
        },
      });
    }
  });

  // Token refresh endpoint
  router.post('/refresh', authRateLimit, async (req: Request, res: Response) => {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({
          error: {
            code: 'MISSING_REFRESH_TOKEN',
            message: 'Refresh token is required',
          },
        });
      }

      const tokens = await authService.refreshToken(refreshToken);

      res.json({ tokens });

    } catch (error: any) {
      logger.warn('Token refresh failed', {
        error: error.message,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
      });

      res.status(401).json({
        error: {
          code: 'INVALID_REFRESH_TOKEN',
          message: 'Invalid or expired refresh token',
        },
      });
    }
  });

  // Logout endpoint
  router.post('/logout', async (req: Request, res: Response) => {
    try {
      const authHeader = req.headers.authorization;

      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);

        try {
          const payload = await authService.verifyToken(token);
          await authService.revokeToken(payload.sub);

          logger.info('Logout successful', {
            userId: payload.sub,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
          });
        } catch (error) {
          // Token might be invalid, but that's okay for logout
        }
      }

      res.json({ message: 'Logged out successfully' });

    } catch (error: any) {
      logger.error('Logout error', {
        error: error.message,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
      });

      res.status(500).json({
        error: {
          code: 'LOGOUT_ERROR',
          message: 'An error occurred during logout',
        },
      });
    }
  });

  // Verify token endpoint
  router.get('/verify', async (req: Request, res: Response) => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          error: {
            code: 'MISSING_TOKEN',
            message: 'Authorization token is required',
          },
        });
      }

      const token = authHeader.substring(7);
      const payload = await authService.verifyToken(token);

      res.json({
        valid: true,
        user: {
          id: payload.sub,
          email: payload.email,
          name: payload.name,
          role: payload.role,
          permissions: payload.permissions,
          organizationId: payload.organizationId,
        },
        expiresAt: new Date(payload.exp * 1000).toISOString(),
      });

    } catch (error: any) {
      res.status(401).json({
        valid: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Token is invalid or expired',
        },
      });
    }
  });

  // Password reset request (placeholder)
  router.post('/password-reset', authRateLimit, async (req: Request, res: Response) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          error: {
            code: 'MISSING_EMAIL',
            message: 'Email is required',
          },
        });
      }

      // In a real implementation, you would:
      // 1. Check if user exists
      // 2. Generate a secure reset token
      // 3. Send reset email
      // 4. Store reset token with expiration

      logger.info('Password reset requested', {
        email,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
      });

      // Always return success to prevent email enumeration
      res.json({
        message: 'If an account with that email exists, a password reset link has been sent.',
      });

    } catch (error: any) {
      logger.error('Password reset error', {
        error: error.message,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
      });

      res.status(500).json({
        error: {
          code: 'PASSWORD_RESET_ERROR',
          message: 'An error occurred while processing your request',
        },
      });
    }
  });

  // Enhanced change password endpoint
  router.post('/change-password', authRateLimit, authMiddleware(authService), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          error: {
            code: 'MISSING_PASSWORDS',
            message: 'Current password and new password are required',
          },
        });
      }

      if (!req.user) {
        return res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'User authentication required',
          },
        });
      }

      await authService.changePassword(req.user.id, currentPassword, newPassword, req);

      res.json({
        message: 'Password changed successfully',
      });

    } catch (error: any) {
      logger.error('Change password error', {
        error: error.message,
        userId: req.user?.id,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
      });

      res.status(400).json({
        error: {
          code: 'CHANGE_PASSWORD_ERROR',
          message: error.message || 'An error occurred while changing your password',
        },
      });
    }
  });

  // MFA setup endpoint
  router.post('/mfa/setup', authMiddleware(authService), async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'User authentication required',
          },
        });
      }

      const mfaSetup = await authService.setupMFA(req.user.id);

      res.json({
        secret: mfaSetup.secret,
        qrCode: mfaSetup.qrCode,
        backupCodes: mfaSetup.backupCodes,
      });

    } catch (error: any) {
      logger.error('MFA setup error', {
        error: error.message,
        userId: req.user?.id,
      });

      res.status(500).json({
        error: {
          code: 'MFA_SETUP_ERROR',
          message: 'An error occurred while setting up MFA',
        },
      });
    }
  });

  // MFA enable endpoint
  router.post('/mfa/enable', authMiddleware(authService), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { token } = req.body;

      if (!token) {
        return res.status(400).json({
          error: {
            code: 'MISSING_TOKEN',
            message: 'MFA token is required',
          },
        });
      }

      if (!req.user) {
        return res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'User authentication required',
          },
        });
      }

      const result = await authService.enableMFA(req.user.id, token);

      res.json({
        message: 'MFA enabled successfully',
        backupCodes: result.backupCodes,
      });

    } catch (error: any) {
      logger.error('MFA enable error', {
        error: error.message,
        userId: req.user?.id,
      });

      res.status(400).json({
        error: {
          code: 'MFA_ENABLE_ERROR',
          message: error.message || 'An error occurred while enabling MFA',
        },
      });
    }
  });

  // MFA disable endpoint
  router.post('/mfa/disable', authMiddleware(authService), async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'User authentication required',
          },
        });
      }

      await authService.disableMFA(req.user.id, req);

      res.json({
        message: 'MFA disabled successfully',
      });

    } catch (error: any) {
      logger.error('MFA disable error', {
        error: error.message,
        userId: req.user?.id,
      });

      res.status(500).json({
        error: {
          code: 'MFA_DISABLE_ERROR',
          message: 'An error occurred while disabling MFA',
        },
      });
    }
  });

  // Generate new backup codes
  router.post('/mfa/backup-codes', authMiddleware(authService), async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'User authentication required',
          },
        });
      }

      const backupCodes = await authService.generateBackupCodes(req.user.id);

      res.json({
        backupCodes,
        message: 'New backup codes generated. Store them securely.',
      });

    } catch (error: any) {
      logger.error('Backup codes generation error', {
        error: error.message,
        userId: req.user?.id,
      });

      res.status(500).json({
        error: {
          code: 'BACKUP_CODES_ERROR',
          message: 'An error occurred while generating backup codes',
        },
      });
    }
  });

  return router;
}