import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { config } from '../config/config';
import { RedisService } from './redis.service';
import { MFAService } from './mfa.service';
import { AuditService } from './audit.service';
import { RBACService } from './rbac.service';
import { logger } from '../utils/logger';
import { User, MFAVerification, SecurityEventType } from '@voxlink/shared';
import { Request } from 'express';

export interface ApiKey {
  id: string;
  name: string;
  key: string;
  hashedKey: string;
  userId: string;
  permissions: string[];
  isActive: boolean;
  expiresAt?: Date;
  lastUsedAt?: Date;
  createdAt: Date;
}

export interface JWTPayload {
  sub: string; // user ID
  email: string;
  name: string;
  role: string;
  permissions: string[];
  organizationId: string;
  iat: number;
  exp: number;
  iss: string;
  aud: string;
}

export class AuthService {
  private mfaService: MFAService;
  private auditService: AuditService;
  private rbacService: RBACService;

  constructor(private redisService: RedisService) {
    this.mfaService = new MFAService(redisService);
    this.auditService = new AuditService(redisService);
    this.rbacService = new RBACService(redisService);
  }

  // JWT Token Management
  async generateTokens(user: User): Promise<{ accessToken: string; refreshToken: string }> {
    const payload: Omit<JWTPayload, 'iat' | 'exp' | 'iss' | 'aud'> = {
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      permissions: user.permissions as any,
      organizationId: user.organizationId,
    };

    const accessToken = jwt.sign(payload, config.jwt.secret as jwt.Secret, {
      expiresIn: config.jwt.expiresIn,
      issuer: config.jwt.issuer,
      audience: config.jwt.audience,
    } as jwt.SignOptions);

    const refreshToken = jwt.sign(
      { sub: user.id, type: 'refresh' },
      config.jwt.secret as jwt.Secret,
      {
        expiresIn: config.jwt.refreshExpiresIn,
        issuer: config.jwt.issuer,
        audience: config.jwt.audience,
      } as jwt.SignOptions
    );

    // Store refresh token in Redis
    await this.redisService.setex(
      `refresh_token:${user.id}`,
      7 * 24 * 60 * 60, // 7 days
      refreshToken
    );

    // Update last login
    await this.updateLastLogin(user.id);

    return { accessToken, refreshToken };
  }

  async verifyToken(token: string): Promise<JWTPayload> {
    try {
      const decoded = jwt.verify(token, config.jwt.secret, {
        issuer: config.jwt.issuer,
        audience: config.jwt.audience,
      }) as JWTPayload;

      // Check if user is still active
      const user = await this.getUserById(decoded.sub);
      if (!user || !user.isActive) {
        throw new Error('User is inactive');
      }

      return decoded;
    } catch (error) {
      logger.error('Token verification failed:', error as any);
      throw new Error('Invalid token');
    }
  }

  async refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      const decoded = jwt.verify(refreshToken, config.jwt.secret) as any;

      if (decoded.type !== 'refresh') {
        throw new Error('Invalid refresh token');
      }

      // Check if refresh token exists in Redis
      const storedToken = await this.redisService.get(`refresh_token:${decoded.sub}`);
      if (storedToken !== refreshToken) {
        throw new Error('Refresh token not found or expired');
      }

      const user = await this.getUserById(decoded.sub);
      if (!user || !user.isActive) {
        throw new Error('User is inactive');
      }

      // Generate new tokens
      const tokens = await this.generateTokens(user);

      // Invalidate old refresh token
      await this.redisService.del(`refresh_token:${decoded.sub}`);

      return tokens;
    } catch (error) {
      logger.error('Token refresh failed:', error as any);
      throw new Error('Invalid refresh token');
    }
  }

  async revokeToken(userId: string): Promise<void> {
    await this.redisService.del(`refresh_token:${userId}`);
  }

  // Enhanced User Authentication with MFA
  async authenticateUser(
    email: string,
    password: string,
    mfaVerification?: MFAVerification,
    req?: Request
  ): Promise<{ user: User | null; requiresMFA: boolean; mfaSetupRequired?: boolean }> {
    try {
      // Check rate limiting
      const attempts = await this.getLoginAttempts(email);
      if (attempts >= config.security.maxLoginAttempts) {
        if (req) {
          await this.auditService.logSecurityEvent(
            'account_locked',
            undefined,
            `Account locked due to too many failed attempts: ${email}`,
            { email, attempts },
            req,
            'high'
          );
        }
        throw new Error('Account temporarily locked due to too many failed attempts');
      }

      const user = await this.getUserByEmail(email);
      if (!user || !user.isActive) {
        await this.incrementLoginAttempts(email);
        if (req) {
          await this.auditService.trackFailedLogin(
            email,
            req.ip || 'unknown',
            req.get('User-Agent') || 'unknown'
          );
        }
        return { user: null, requiresMFA: false };
      }

      // Verify password
      const isValidPassword = await this.verifyPassword(password, user.id);
      if (!isValidPassword) {
        await this.incrementLoginAttempts(email);
        if (req) {
          await this.auditService.trackFailedLogin(
            email,
            req.ip || 'unknown',
            req.get('User-Agent') || 'unknown'
          );
        }
        return { user: null, requiresMFA: false };
      }

      // Check if MFA is enabled
      if (user.mfaEnabled) {
        if (!mfaVerification) {
          return { user: null, requiresMFA: true };
        }

        // Verify MFA token
        const mfaValid = await this.mfaService.verifyMFAToken(user.id, mfaVerification);
        if (!mfaValid) {
          await this.incrementLoginAttempts(email);
          if (req) {
            await this.auditService.logSecurityEvent(
              'failed_login',
              user.id,
              'Invalid MFA token provided',
              { email, mfaMethod: mfaVerification.backupCode ? 'backup_code' : 'totp' },
              req,
              'medium'
            );
          }
          return { user: null, requiresMFA: true };
        }
      }

      // Reset login attempts on successful login
      await this.resetLoginAttempts(email);

      // Log successful login
      if (req) {
        await this.auditService.logActivity(
          user.id,
          'login',
          'authentication',
          user.id,
          { email: user.email, userAgent: req.get('User-Agent') },
          req,
          'low'
        );
      }

      // Check if MFA setup is required for this role
      const mfaSetupRequired = await this.isMFASetupRequired(user) && !user.mfaEnabled;

      return { user, requiresMFA: false, mfaSetupRequired };
    } catch (error) {
      logger.error('User authentication failed:', error as any);
      throw error;
    }
  }

  // API Key Management
  async generateApiKey(userId: string, name: string, permissions: string[]): Promise<ApiKey> {
    const key = crypto.randomBytes(config.security.apiKeyLength).toString('hex');
    const hashedKey = await bcrypt.hash(key, config.security.bcryptRounds);

    const apiKey: ApiKey = {
      id: crypto.randomUUID(),
      name,
      key: `vxl_${key}`, // Prefix for identification
      hashedKey,
      userId,
      permissions,
      isActive: true,
      createdAt: new Date(),
    };

    // Store in Redis for fast lookup
    await this.redisService.setex(
      `api_key:${apiKey.key}`,
      365 * 24 * 60 * 60, // 1 year
      JSON.stringify(apiKey)
    );

    // In a real implementation, you would also store in the database
    await this.storeApiKey(apiKey);

    return apiKey;
  }

  async verifyApiKey(key: string): Promise<ApiKey | null> {
    try {
      // Check Redis first
      const cached = await this.redisService.get(`api_key:${key}`);
      if (cached) {
        const apiKey = JSON.parse(cached) as ApiKey;
        if (apiKey.isActive && (!apiKey.expiresAt || new Date() < new Date(apiKey.expiresAt))) {
          // Update last used timestamp
          await this.updateApiKeyLastUsed(apiKey.id);
          return apiKey;
        }
      }

      // Fallback to database lookup
      const apiKey = await this.getApiKeyByKey(key);
      if (apiKey && apiKey.isActive && (!apiKey.expiresAt || new Date() < apiKey.expiresAt)) {
        // Cache for future requests
        await this.redisService.setex(
          `api_key:${key}`,
          60 * 60, // 1 hour
          JSON.stringify(apiKey)
        );
        await this.updateApiKeyLastUsed(apiKey.id);
        return apiKey;
      }

      return null;
    } catch (error) {
      logger.error('API key verification failed:', error as any);
      return null;
    }
  }

  async revokeApiKey(keyId: string): Promise<void> {
    const apiKey = await this.getApiKeyById(keyId);
    if (apiKey) {
      // Remove from Redis
      await this.redisService.del(`api_key:${apiKey.key}`);
      // Mark as inactive in database
      await this.deactivateApiKey(keyId);
    }
  }

  // Enhanced Role-Based Access Control
  async hasPermission(
    user: User | ApiKey,
    resource: string,
    action: string,
    context?: Record<string, any>
  ): Promise<boolean> {
    if ('role' in user && user.role === 'super_admin') {
      return true; // Super admins have all permissions
    }

    // Use RBAC service for detailed permission checking
    if ('role' in user) {
      return await this.rbacService.hasPermission(user.id, resource, action, context);
    }

    // Fallback for API keys
    const apiKey = user as ApiKey;
    return apiKey.permissions.includes(`${resource}:${action}`) ||
      apiKey.permissions.includes('*');
  }

  async hasAnyPermission(
    user: User | ApiKey,
    permissions: Array<{ resource: string; action: string }>,
    context?: Record<string, any>
  ): Promise<boolean> {
    if ('role' in user && user.role === 'super_admin') {
      return true;
    }

    if ('role' in user) {
      return await this.rbacService.hasAnyPermission(user.id, permissions, context);
    }

    // Fallback for API keys
    const apiKey = user as ApiKey;
    return permissions.some(permission =>
      apiKey.permissions.includes(`${permission.resource}:${permission.action}`) ||
      apiKey.permissions.includes('*')
    );
  }

  // MFA Management
  async setupMFA(userId: string) {
    const user = await this.getUserById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    return await this.mfaService.generateMFASetup(user);
  }

  async enableMFA(userId: string, token: string) {
    return await this.mfaService.verifyAndEnableMFA(userId, token);
  }

  async disableMFA(userId: string, req?: Request) {
    await this.mfaService.disableMFA(userId);

    if (req) {
      await this.auditService.logSecurityEvent(
        'mfa_disabled',
        userId,
        'Multi-factor authentication disabled',
        {},
        req,
        'medium'
      );
    }
  }

  async generateBackupCodes(userId: string) {
    return await this.mfaService.generateNewBackupCodes(userId);
  }

  // Security Event Logging
  async logSecurityEvent(
    type: SecurityEventType,
    userId: string | undefined,
    description: string,
    metadata: Record<string, any>,
    req: Request,
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
  ) {
    await this.auditService.logSecurityEvent(type, userId, description, metadata, req, severity);
  }

  // Password Security
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
    req?: Request
  ): Promise<void> {
    const user = await this.getUserById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Verify current password
    const isValidPassword = await this.verifyPassword(currentPassword, userId);
    if (!isValidPassword) {
      throw new Error('Current password is incorrect');
    }

    // Validate new password strength
    this.validatePasswordStrength(newPassword);

    // Check password history (prevent reuse)
    const isPasswordReused = await this.isPasswordReused(userId, newPassword);
    if (isPasswordReused) {
      throw new Error('Cannot reuse recent passwords');
    }

    // Hash and store new password
    await this.updateUserPassword(userId, newPassword);

    // Log password change
    if (req) {
      await this.auditService.logSecurityEvent(
        'password_changed',
        userId,
        'User password changed',
        { userId },
        req,
        'medium'
      );
    }

    // Invalidate all existing sessions
    await this.revokeAllUserSessions(userId);
  }

  // Account Security
  async lockAccount(userId: string, reason: string, req?: Request): Promise<void> {
    await this.updateUserStatus(userId, false);

    if (req) {
      await this.auditService.logSecurityEvent(
        'account_locked',
        userId,
        `Account locked: ${reason}`,
        { reason },
        req,
        'high'
      );
    }
  }

  async unlockAccount(userId: string, req?: Request): Promise<void> {
    await this.updateUserStatus(userId, true);
    await this.resetLoginAttempts(await this.getUserEmail(userId));

    if (req) {
      await this.auditService.logSecurityEvent(
        'account_locked',
        userId,
        'Account unlocked',
        {},
        req,
        'medium'
      );
    }
  }

  // Rate Limiting Helpers
  private async getLoginAttempts(email: string): Promise<number> {
    const attempts = await this.redisService.get(`login_attempts:${email}`);
    return attempts ? parseInt(attempts, 10) : 0;
  }

  private async incrementLoginAttempts(email: string): Promise<void> {
    const key = `login_attempts:${email}`;
    const attempts = await this.getLoginAttempts(email);
    await this.redisService.setex(key, config.security.lockoutDuration / 1000, (attempts + 1).toString());
  }

  private async resetLoginAttempts(email: string): Promise<void> {
    await this.redisService.del(`login_attempts:${email}`);
  }

  // Mock database operations (replace with actual database calls)
  private async getUserById(id: string): Promise<User | null> {
    // Mock user data - replace with actual database query
    const mockUsers: User[] = [
      {
        id: '1',
        email: 'admin@voxlink.com',
        name: 'Admin User',
        role: 'admin',
        permissions: ['*'] as any,
        organizationId: 'org-1',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        mfaEnabled: false,
        failedLoginAttempts: 0
      },
      {
        id: '2',
        email: 'user@voxlink.com',
        name: 'Regular User',
        role: 'user' as any,
        permissions: ['numbers:read', 'numbers:write', 'billing:read', 'analytics:read'] as any,
        organizationId: 'org-1',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        mfaEnabled: false,
        failedLoginAttempts: 0
      },
    ];

    return mockUsers.find(user => user.id === id) || null;
  }

  private async getUserByEmail(email: string): Promise<User | null> {
    // Mock user data - replace with actual database query
    const mockUsers: User[] = [
      {
        id: '1',
        email: 'admin@voxlink.com',
        name: 'Admin User',
        role: 'admin',
        permissions: ['*'] as any,
        organizationId: 'org-1',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        mfaEnabled: false,
        failedLoginAttempts: 0
      },
      {
        id: '2',
        email: 'user@voxlink.com',
        name: 'Regular User',
        role: 'user' as any,
        permissions: ['numbers:read', 'numbers:write', 'billing:read', 'analytics:read'] as any,
        organizationId: 'org-1',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        mfaEnabled: false,
        failedLoginAttempts: 0
      },
    ];

    return mockUsers.find(user => user.email === email) || null;
  }

  private async verifyPassword(password: string, userId: string): Promise<boolean> {
    // Mock password verification - replace with actual password hash verification
    return password === 'password123'; // Demo password
  }

  private async updateLastLogin(userId: string): Promise<void> {
    // Mock implementation - replace with actual database update
    logger.info(`Updated last login for user ${userId}`);
  }

  private async storeApiKey(apiKey: ApiKey): Promise<void> {
    // Mock implementation - replace with actual database storage
    logger.info(`Stored API key ${apiKey.id} for user ${apiKey.userId}`);
  }

  private async getApiKeyById(id: string): Promise<ApiKey | null> {
    // Mock implementation - replace with actual database query
    return null;
  }

  private async getApiKeyByKey(key: string): Promise<ApiKey | null> {
    // Mock implementation - replace with actual database query
    return null;
  }

  private async updateApiKeyLastUsed(keyId: string): Promise<void> {
    // Mock implementation - replace with actual database update
    logger.info(`Updated last used timestamp for API key ${keyId}`);
  }

  private async deactivateApiKey(keyId: string): Promise<void> {
    // Mock implementation - replace with actual database update
    logger.info(`Deactivated API key ${keyId}`);
  }

  // Additional security helper methods
  private async isMFASetupRequired(user: User): Promise<boolean> {
    // Check if MFA is required for this user's role
    const mfaRequiredRoles = ['super_admin', 'admin'];
    return mfaRequiredRoles.includes(user.role);
  }

  private validatePasswordStrength(password: string): void {
    const minLength = config.security.passwordPolicy?.minLength || 8;
    const requireUppercase = config.security.passwordPolicy?.requireUppercase ?? true;
    const requireLowercase = config.security.passwordPolicy?.requireLowercase ?? true;
    const requireNumbers = config.security.passwordPolicy?.requireNumbers ?? true;
    const requireSpecialChars = config.security.passwordPolicy?.requireSpecialChars ?? true;

    if (password.length < minLength) {
      throw new Error(`Password must be at least ${minLength} characters long`);
    }

    if (requireUppercase && !/[A-Z]/.test(password)) {
      throw new Error('Password must contain at least one uppercase letter');
    }

    if (requireLowercase && !/[a-z]/.test(password)) {
      throw new Error('Password must contain at least one lowercase letter');
    }

    if (requireNumbers && !/\d/.test(password)) {
      throw new Error('Password must contain at least one number');
    }

    if (requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      throw new Error('Password must contain at least one special character');
    }
  }

  private async isPasswordReused(userId: string, newPassword: string): Promise<boolean> {
    // Check against password history
    // This would query the database for recent password hashes
    return false; // Mock implementation
  }

  private async updateUserPassword(userId: string, newPassword: string): Promise<void> {
    const hashedPassword = await bcrypt.hash(newPassword, config.security.bcryptRounds);
    // This would update the user's password in the database
    logger.info(`Password updated for user ${userId}`);
  }

  private async revokeAllUserSessions(userId: string): Promise<void> {
    // Revoke all refresh tokens for the user
    await this.redisService.del(`refresh_token:${userId}`);

    // In a more sophisticated implementation, you would:
    // 1. Maintain a list of active sessions per user
    // 2. Add revoked tokens to a blacklist
    // 3. Notify all active sessions to re-authenticate

    logger.info(`All sessions revoked for user ${userId}`);
  }

  private async updateUserStatus(userId: string, isActive: boolean): Promise<void> {
    // This would update the user's active status in the database
    logger.info(`User ${userId} status updated: ${isActive ? 'active' : 'inactive'}`);
  }

  private async getUserEmail(userId: string): Promise<string> {
    const user = await this.getUserById(userId);
    return user?.email || '';
  }

  // Initialize security services
  async initializeSecurity(): Promise<void> {
    try {
      await this.rbacService.initializeSystemRoles();
      logger.info('Security services initialized');
    } catch (error) {
      logger.error('Failed to initialize security services:', error as any);
      throw error;
    }
  }

  // Get services for external use
  getMFAService(): MFAService {
    return this.mfaService;
  }

  getAuditService(): AuditService {
    return this.auditService;
  }

  getRBACService(): RBACService {
    return this.rbacService;
  }
}