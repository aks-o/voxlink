"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const crypto_1 = __importDefault(require("crypto"));
const config_1 = require("../config/config");
const mfa_service_1 = require("./mfa.service");
const audit_service_1 = require("./audit.service");
const rbac_service_1 = require("./rbac.service");
const logger_1 = require("../utils/logger");
class AuthService {
    constructor(redisService) {
        this.redisService = redisService;
        this.mfaService = new mfa_service_1.MFAService(redisService);
        this.auditService = new audit_service_1.AuditService(redisService);
        this.rbacService = new rbac_service_1.RBACService(redisService);
    }
    // JWT Token Management
    async generateTokens(user) {
        const payload = {
            sub: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            permissions: user.permissions,
            organizationId: user.organizationId,
        };
        const accessToken = jsonwebtoken_1.default.sign(payload, config_1.config.jwt.secret, {
            expiresIn: config_1.config.jwt.expiresIn,
            issuer: config_1.config.jwt.issuer,
            audience: config_1.config.jwt.audience,
        });
        const refreshToken = jsonwebtoken_1.default.sign({ sub: user.id, type: 'refresh' }, config_1.config.jwt.secret, {
            expiresIn: config_1.config.jwt.refreshExpiresIn,
            issuer: config_1.config.jwt.issuer,
            audience: config_1.config.jwt.audience,
        });
        // Store refresh token in Redis
        await this.redisService.setex(`refresh_token:${user.id}`, 7 * 24 * 60 * 60, // 7 days
        refreshToken);
        // Update last login
        await this.updateLastLogin(user.id);
        return { accessToken, refreshToken };
    }
    async verifyToken(token) {
        try {
            const decoded = jsonwebtoken_1.default.verify(token, config_1.config.jwt.secret, {
                issuer: config_1.config.jwt.issuer,
                audience: config_1.config.jwt.audience,
            });
            // Check if user is still active
            const user = await this.getUserById(decoded.sub);
            if (!user || !user.isActive) {
                throw new Error('User is inactive');
            }
            return decoded;
        }
        catch (error) {
            logger_1.logger.error('Token verification failed:', error);
            throw new Error('Invalid token');
        }
    }
    async refreshToken(refreshToken) {
        try {
            const decoded = jsonwebtoken_1.default.verify(refreshToken, config_1.config.jwt.secret);
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
        }
        catch (error) {
            logger_1.logger.error('Token refresh failed:', error);
            throw new Error('Invalid refresh token');
        }
    }
    async revokeToken(userId) {
        await this.redisService.del(`refresh_token:${userId}`);
    }
    // Enhanced User Authentication with MFA
    async authenticateUser(email, password, mfaVerification, req) {
        try {
            // Check rate limiting
            const attempts = await this.getLoginAttempts(email);
            if (attempts >= config_1.config.security.maxLoginAttempts) {
                if (req) {
                    await this.auditService.logSecurityEvent('account_locked', undefined, `Account locked due to too many failed attempts: ${email}`, { email, attempts }, req, 'high');
                }
                throw new Error('Account temporarily locked due to too many failed attempts');
            }
            const user = await this.getUserByEmail(email);
            if (!user || !user.isActive) {
                await this.incrementLoginAttempts(email);
                if (req) {
                    await this.auditService.trackFailedLogin(email, req.ip || 'unknown', req.get('User-Agent') || 'unknown');
                }
                return { user: null, requiresMFA: false };
            }
            // Verify password
            const isValidPassword = await this.verifyPassword(password, user.id);
            if (!isValidPassword) {
                await this.incrementLoginAttempts(email);
                if (req) {
                    await this.auditService.trackFailedLogin(email, req.ip || 'unknown', req.get('User-Agent') || 'unknown');
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
                        await this.auditService.logSecurityEvent('failed_login', user.id, 'Invalid MFA token provided', { email, mfaMethod: mfaVerification.backupCode ? 'backup_code' : 'totp' }, req, 'medium');
                    }
                    return { user: null, requiresMFA: true };
                }
            }
            // Reset login attempts on successful login
            await this.resetLoginAttempts(email);
            // Log successful login
            if (req) {
                await this.auditService.logActivity(user.id, 'login', 'authentication', user.id, { email: user.email, userAgent: req.get('User-Agent') }, req, 'low');
            }
            // Check if MFA setup is required for this role
            const mfaSetupRequired = await this.isMFASetupRequired(user) && !user.mfaEnabled;
            return { user, requiresMFA: false, mfaSetupRequired };
        }
        catch (error) {
            logger_1.logger.error('User authentication failed:', error);
            throw error;
        }
    }
    // API Key Management
    async generateApiKey(userId, name, permissions) {
        const key = crypto_1.default.randomBytes(config_1.config.security.apiKeyLength).toString('hex');
        const hashedKey = await bcrypt_1.default.hash(key, config_1.config.security.bcryptRounds);
        const apiKey = {
            id: crypto_1.default.randomUUID(),
            name,
            key: `vxl_${key}`, // Prefix for identification
            hashedKey,
            userId,
            permissions,
            isActive: true,
            createdAt: new Date(),
        };
        // Store in Redis for fast lookup
        await this.redisService.setex(`api_key:${apiKey.key}`, 365 * 24 * 60 * 60, // 1 year
        JSON.stringify(apiKey));
        // In a real implementation, you would also store in the database
        await this.storeApiKey(apiKey);
        return apiKey;
    }
    async verifyApiKey(key) {
        try {
            // Check Redis first
            const cached = await this.redisService.get(`api_key:${key}`);
            if (cached) {
                const apiKey = JSON.parse(cached);
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
                await this.redisService.setex(`api_key:${key}`, 60 * 60, // 1 hour
                JSON.stringify(apiKey));
                await this.updateApiKeyLastUsed(apiKey.id);
                return apiKey;
            }
            return null;
        }
        catch (error) {
            logger_1.logger.error('API key verification failed:', error);
            return null;
        }
    }
    async revokeApiKey(keyId) {
        const apiKey = await this.getApiKeyById(keyId);
        if (apiKey) {
            // Remove from Redis
            await this.redisService.del(`api_key:${apiKey.key}`);
            // Mark as inactive in database
            await this.deactivateApiKey(keyId);
        }
    }
    // Enhanced Role-Based Access Control
    async hasPermission(user, resource, action, context) {
        if ('role' in user && user.role === 'super_admin') {
            return true; // Super admins have all permissions
        }
        // Use RBAC service for detailed permission checking
        if ('id' in user) {
            return await this.rbacService.hasPermission(user.id, resource, action, context);
        }
        // Fallback for API keys
        return user.permissions.includes(`${resource}:${action}`) ||
            user.permissions.includes('*');
    }
    async hasAnyPermission(user, permissions, context) {
        if ('role' in user && user.role === 'super_admin') {
            return true;
        }
        if ('id' in user) {
            return await this.rbacService.hasAnyPermission(user.id, permissions, context);
        }
        // Fallback for API keys
        return permissions.some(permission => user.permissions.includes(`${permission.resource}:${permission.action}`) ||
            user.permissions.includes('*'));
    }
    // MFA Management
    async setupMFA(userId) {
        const user = await this.getUserById(userId);
        if (!user) {
            throw new Error('User not found');
        }
        return await this.mfaService.generateMFASetup(user);
    }
    async enableMFA(userId, token) {
        return await this.mfaService.verifyAndEnableMFA(userId, token);
    }
    async disableMFA(userId, req) {
        await this.mfaService.disableMFA(userId);
        if (req) {
            await this.auditService.logSecurityEvent('mfa_disabled', userId, 'Multi-factor authentication disabled', {}, req, 'medium');
        }
    }
    async generateBackupCodes(userId) {
        return await this.mfaService.generateNewBackupCodes(userId);
    }
    // Security Event Logging
    async logSecurityEvent(type, userId, description, metadata, req, severity = 'medium') {
        await this.auditService.logSecurityEvent(type, userId, description, metadata, req, severity);
    }
    // Password Security
    async changePassword(userId, currentPassword, newPassword, req) {
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
            await this.auditService.logSecurityEvent('password_changed', userId, 'User password changed', { userId }, req, 'medium');
        }
        // Invalidate all existing sessions
        await this.revokeAllUserSessions(userId);
    }
    // Account Security
    async lockAccount(userId, reason, req) {
        await this.updateUserStatus(userId, false);
        if (req) {
            await this.auditService.logSecurityEvent('account_locked', userId, `Account locked: ${reason}`, { reason }, req, 'high');
        }
    }
    async unlockAccount(userId, req) {
        await this.updateUserStatus(userId, true);
        await this.resetLoginAttempts(await this.getUserEmail(userId));
        if (req) {
            await this.auditService.logSecurityEvent('account_locked', userId, 'Account unlocked', {}, req, 'medium');
        }
    }
    // Rate Limiting Helpers
    async getLoginAttempts(email) {
        const attempts = await this.redisService.get(`login_attempts:${email}`);
        return attempts ? parseInt(attempts, 10) : 0;
    }
    async incrementLoginAttempts(email) {
        const key = `login_attempts:${email}`;
        const attempts = await this.getLoginAttempts(email);
        await this.redisService.setex(key, config_1.config.security.lockoutDuration / 1000, (attempts + 1).toString());
    }
    async resetLoginAttempts(email) {
        await this.redisService.del(`login_attempts:${email}`);
    }
    // Mock database operations (replace with actual database calls)
    async getUserById(id) {
        // Mock user data - replace with actual database query
        const mockUsers = [
            {
                id: '1',
                email: 'admin@voxlink.com',
                name: 'Admin User',
                role: 'admin',
                permissions: ['*'],
                organizationId: 'org-1',
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                id: '2',
                email: 'user@voxlink.com',
                name: 'Regular User',
                role: 'user',
                permissions: ['numbers:read', 'numbers:write', 'billing:read', 'analytics:read'],
                organizationId: 'org-1',
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        ];
        return mockUsers.find(user => user.id === id) || null;
    }
    async getUserByEmail(email) {
        // Mock user data - replace with actual database query
        const mockUsers = [
            {
                id: '1',
                email: 'admin@voxlink.com',
                name: 'Admin User',
                role: 'admin',
                permissions: ['*'],
                organizationId: 'org-1',
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                id: '2',
                email: 'user@voxlink.com',
                name: 'Regular User',
                role: 'user',
                permissions: ['numbers:read', 'numbers:write', 'billing:read', 'analytics:read'],
                organizationId: 'org-1',
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        ];
        return mockUsers.find(user => user.email === email) || null;
    }
    async verifyPassword(password, userId) {
        // Mock password verification - replace with actual password hash verification
        return password === 'password123'; // Demo password
    }
    async updateLastLogin(userId) {
        // Mock implementation - replace with actual database update
        logger_1.logger.info(`Updated last login for user ${userId}`);
    }
    async storeApiKey(apiKey) {
        // Mock implementation - replace with actual database storage
        logger_1.logger.info(`Stored API key ${apiKey.id} for user ${apiKey.userId}`);
    }
    async getApiKeyById(id) {
        // Mock implementation - replace with actual database query
        return null;
    }
    async getApiKeyByKey(key) {
        // Mock implementation - replace with actual database query
        return null;
    }
    async updateApiKeyLastUsed(keyId) {
        // Mock implementation - replace with actual database update
        logger_1.logger.info(`Updated last used timestamp for API key ${keyId}`);
    }
    async deactivateApiKey(keyId) {
        // Mock implementation - replace with actual database update
        logger_1.logger.info(`Deactivated API key ${keyId}`);
    }
    // Additional security helper methods
    async isMFASetupRequired(user) {
        // Check if MFA is required for this user's role
        const mfaRequiredRoles = ['super_admin', 'admin'];
        return mfaRequiredRoles.includes(user.role);
    }
    validatePasswordStrength(password) {
        const minLength = config_1.config.security.passwordPolicy?.minLength || 8;
        const requireUppercase = config_1.config.security.passwordPolicy?.requireUppercase ?? true;
        const requireLowercase = config_1.config.security.passwordPolicy?.requireLowercase ?? true;
        const requireNumbers = config_1.config.security.passwordPolicy?.requireNumbers ?? true;
        const requireSpecialChars = config_1.config.security.passwordPolicy?.requireSpecialChars ?? true;
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
    async isPasswordReused(userId, newPassword) {
        // Check against password history
        // This would query the database for recent password hashes
        return false; // Mock implementation
    }
    async updateUserPassword(userId, newPassword) {
        const hashedPassword = await bcrypt_1.default.hash(newPassword, config_1.config.security.bcryptRounds);
        // This would update the user's password in the database
        logger_1.logger.info(`Password updated for user ${userId}`);
    }
    async revokeAllUserSessions(userId) {
        // Revoke all refresh tokens for the user
        await this.redisService.del(`refresh_token:${userId}`);
        // In a more sophisticated implementation, you would:
        // 1. Maintain a list of active sessions per user
        // 2. Add revoked tokens to a blacklist
        // 3. Notify all active sessions to re-authenticate
        logger_1.logger.info(`All sessions revoked for user ${userId}`);
    }
    async updateUserStatus(userId, isActive) {
        // This would update the user's active status in the database
        logger_1.logger.info(`User ${userId} status updated: ${isActive ? 'active' : 'inactive'}`);
    }
    async getUserEmail(userId) {
        const user = await this.getUserById(userId);
        return user?.email || '';
    }
    // Initialize security services
    async initializeSecurity() {
        try {
            await this.rbacService.initializeSystemRoles();
            logger_1.logger.info('Security services initialized');
        }
        catch (error) {
            logger_1.logger.error('Failed to initialize security services:', error);
            throw error;
        }
    }
    // Get services for external use
    getMFAService() {
        return this.mfaService;
    }
    getAuditService() {
        return this.auditService;
    }
    getRBACService() {
        return this.rbacService;
    }
}
exports.AuthService = AuthService;
