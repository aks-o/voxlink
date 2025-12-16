"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRouter = authRouter;
const express_1 = require("express");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const auth_1 = require("../middleware/auth");
const logger_1 = require("../utils/logger");
const config_1 = require("../config/config");
function authRouter(authService) {
    const router = (0, express_1.Router)();
    // Rate limiting for auth endpoints
    const authRateLimit = (0, express_rate_limit_1.default)({
        windowMs: config_1.config.rateLimit.auth.windowMs,
        max: config_1.config.rateLimit.auth.max,
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
    router.post('/login', authRateLimit, async (req, res) => {
        try {
            const { email, password, mfaToken, backupCode } = req.body;
            if (!email || !password) {
                await authService.logSecurityEvent('failed_login', undefined, 'Login attempt with missing credentials', { email, ip: req.ip }, req, 'low');
                return res.status(400).json({
                    error: {
                        code: 'MISSING_CREDENTIALS',
                        message: 'Email and password are required',
                    },
                });
            }
            // Prepare MFA verification if provided
            let mfaVerification;
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
        }
        catch (error) {
            logger_1.logger.error('Login error', {
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
    router.post('/refresh', authRateLimit, async (req, res) => {
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
        }
        catch (error) {
            logSecurityEvent('token_refresh_failed', 'medium', {
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
    router.post('/logout', async (req, res) => {
        try {
            const authHeader = req.headers.authorization;
            if (authHeader && authHeader.startsWith('Bearer ')) {
                const token = authHeader.substring(7);
                try {
                    const payload = await authService.verifyToken(token);
                    await authService.revokeToken(payload.sub);
                    logSecurityEvent('logout_successful', 'low', {
                        userId: payload.sub,
                        ip: req.ip,
                        userAgent: req.get('User-Agent'),
                    });
                }
                catch (error) {
                    // Token might be invalid, but that's okay for logout
                }
            }
            res.json({ message: 'Logged out successfully' });
        }
        catch (error) {
            logger_1.logger.error('Logout error', {
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
    router.get('/verify', async (req, res) => {
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
        }
        catch (error) {
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
    router.post('/password-reset', authRateLimit, async (req, res) => {
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
            logSecurityEvent('password_reset_requested', 'low', {
                email,
                ip: req.ip,
                userAgent: req.get('User-Agent'),
            });
            // Always return success to prevent email enumeration
            res.json({
                message: 'If an account with that email exists, a password reset link has been sent.',
            });
        }
        catch (error) {
            logger_1.logger.error('Password reset error', {
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
    router.post('/change-password', authRateLimit, (0, auth_1.authMiddleware)(authService), async (req, res) => {
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
        }
        catch (error) {
            logger_1.logger.error('Change password error', {
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
    router.post('/mfa/setup', (0, auth_1.authMiddleware)(authService), async (req, res) => {
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
        }
        catch (error) {
            logger_1.logger.error('MFA setup error', {
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
    router.post('/mfa/enable', (0, auth_1.authMiddleware)(authService), async (req, res) => {
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
        }
        catch (error) {
            logger_1.logger.error('MFA enable error', {
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
    router.post('/mfa/disable', (0, auth_1.authMiddleware)(authService), async (req, res) => {
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
        }
        catch (error) {
            logger_1.logger.error('MFA disable error', {
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
    router.post('/mfa/backup-codes', (0, auth_1.authMiddleware)(authService), async (req, res) => {
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
        }
        catch (error) {
            logger_1.logger.error('Backup codes generation error', {
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
