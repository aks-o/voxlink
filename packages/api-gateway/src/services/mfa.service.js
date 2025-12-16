"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MFAService = void 0;
const speakeasy_1 = __importDefault(require("speakeasy"));
const qrcode_1 = __importDefault(require("qrcode"));
const crypto_1 = __importDefault(require("crypto"));
const config_1 = require("../config/config");
const logger_1 = require("../utils/logger");
class MFAService {
    constructor(redisService) {
        this.redisService = redisService;
    }
    /**
     * Generate MFA setup for a user
     */
    async generateMFASetup(user) {
        try {
            // Generate secret
            const secret = speakeasy_1.default.generateSecret({
                name: `VoxLink (${user.email})`,
                issuer: 'VoxLink',
                length: 32,
            });
            // Generate QR code
            const qrCode = await qrcode_1.default.toDataURL(secret.otpauth_url);
            // Generate backup codes
            const backupCodes = this.generateBackupCodes();
            // Store temporary setup in Redis (expires in 10 minutes)
            await this.redisService.setex(`mfa_setup:${user.id}`, 600, // 10 minutes
            JSON.stringify({
                secret: secret.base32,
                backupCodes,
            }));
            return {
                secret: secret.base32,
                qrCode,
                backupCodes,
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to generate MFA setup:', error);
            throw new Error('Failed to generate MFA setup');
        }
    }
    /**
     * Verify MFA setup and enable MFA for user
     */
    async verifyAndEnableMFA(userId, token) {
        try {
            // Get temporary setup from Redis
            const setupData = await this.redisService.get(`mfa_setup:${userId}`);
            if (!setupData) {
                throw new Error('MFA setup not found or expired');
            }
            const { secret, backupCodes } = JSON.parse(setupData);
            // Verify the token
            const verified = speakeasy_1.default.totp.verify({
                secret,
                encoding: 'base32',
                token,
                window: 2, // Allow 2 time steps (60 seconds) of drift
            });
            if (!verified) {
                throw new Error('Invalid MFA token');
            }
            // Enable MFA for user (this would update the database)
            await this.enableMFAForUser(userId, secret, backupCodes);
            // Clean up temporary setup
            await this.redisService.del(`mfa_setup:${userId}`);
            return { backupCodes };
        }
        catch (error) {
            logger_1.logger.error('Failed to verify and enable MFA:', error);
            throw error;
        }
    }
    /**
     * Verify MFA token during login
     */
    async verifyMFAToken(userId, verification) {
        try {
            const user = await this.getUserById(userId);
            if (!user || !user.mfaEnabled || !user.mfaSecret) {
                throw new Error('MFA not enabled for user');
            }
            // Check if using backup code
            if (verification.backupCode) {
                return await this.verifyBackupCode(userId, verification.backupCode);
            }
            // Verify TOTP token
            const verified = speakeasy_1.default.totp.verify({
                secret: user.mfaSecret,
                encoding: 'base32',
                token: verification.token,
                window: 2,
            });
            if (verified) {
                // Log successful MFA verification
                await this.logSecurityEvent(userId, 'mfa_verified', {
                    method: 'totp',
                    timestamp: new Date(),
                });
            }
            return verified;
        }
        catch (error) {
            logger_1.logger.error('Failed to verify MFA token:', error);
            return false;
        }
    }
    /**
     * Disable MFA for a user
     */
    async disableMFA(userId) {
        try {
            // Disable MFA in database
            await this.disableMFAForUser(userId);
            // Remove backup codes from Redis
            await this.redisService.del(`backup_codes:${userId}`);
            // Log security event
            await this.logSecurityEvent(userId, 'mfa_disabled', {
                timestamp: new Date(),
            });
            logger_1.logger.info(`MFA disabled for user ${userId}`);
        }
        catch (error) {
            logger_1.logger.error('Failed to disable MFA:', error);
            throw error;
        }
    }
    /**
     * Generate new backup codes
     */
    async generateNewBackupCodes(userId) {
        try {
            const backupCodes = this.generateBackupCodes();
            // Store hashed backup codes in Redis
            const hashedCodes = await Promise.all(backupCodes.map(code => this.hashBackupCode(code)));
            await this.redisService.setex(`backup_codes:${userId}`, 365 * 24 * 60 * 60, // 1 year
            JSON.stringify(hashedCodes));
            // Log security event
            await this.logSecurityEvent(userId, 'backup_codes_generated', {
                count: backupCodes.length,
                timestamp: new Date(),
            });
            return backupCodes;
        }
        catch (error) {
            logger_1.logger.error('Failed to generate backup codes:', error);
            throw error;
        }
    }
    /**
     * Check if user has MFA enabled
     */
    async isMFAEnabled(userId) {
        try {
            const user = await this.getUserById(userId);
            return user?.mfaEnabled || false;
        }
        catch (error) {
            logger_1.logger.error('Failed to check MFA status:', error);
            return false;
        }
    }
    /**
     * Generate backup codes
     */
    generateBackupCodes(count = 10) {
        const codes = [];
        for (let i = 0; i < count; i++) {
            // Generate 8-character alphanumeric code
            const code = crypto_1.default.randomBytes(4).toString('hex').toUpperCase();
            codes.push(code);
        }
        return codes;
    }
    /**
     * Verify backup code
     */
    async verifyBackupCode(userId, backupCode) {
        try {
            const storedCodes = await this.redisService.get(`backup_codes:${userId}`);
            if (!storedCodes) {
                return false;
            }
            const hashedCodes = JSON.parse(storedCodes);
            const hashedInput = await this.hashBackupCode(backupCode);
            const codeIndex = hashedCodes.findIndex(code => code === hashedInput);
            if (codeIndex === -1) {
                return false;
            }
            // Remove used backup code
            hashedCodes.splice(codeIndex, 1);
            await this.redisService.setex(`backup_codes:${userId}`, 365 * 24 * 60 * 60, JSON.stringify(hashedCodes));
            // Log security event
            await this.logSecurityEvent(userId, 'backup_code_used', {
                codesRemaining: hashedCodes.length,
                timestamp: new Date(),
            });
            return true;
        }
        catch (error) {
            logger_1.logger.error('Failed to verify backup code:', error);
            return false;
        }
    }
    /**
     * Hash backup code for secure storage
     */
    async hashBackupCode(code) {
        return crypto_1.default.createHash('sha256').update(code + config_1.config.security.backupCodeSalt).digest('hex');
    }
    // Mock database operations (replace with actual database calls)
    async getUserById(id) {
        // This would be replaced with actual database query
        return null;
    }
    async enableMFAForUser(userId, secret, backupCodes) {
        // This would update the user record in the database
        logger_1.logger.info(`Enabled MFA for user ${userId}`);
        // Store hashed backup codes
        const hashedCodes = await Promise.all(backupCodes.map(code => this.hashBackupCode(code)));
        await this.redisService.setex(`backup_codes:${userId}`, 365 * 24 * 60 * 60, JSON.stringify(hashedCodes));
    }
    async disableMFAForUser(userId) {
        // This would update the user record in the database
        logger_1.logger.info(`Disabled MFA for user ${userId}`);
    }
    async logSecurityEvent(userId, event, metadata) {
        // This would log to the audit system
        logger_1.logger.info(`Security event: ${event} for user ${userId}`, metadata);
    }
}
exports.MFAService = MFAService;
