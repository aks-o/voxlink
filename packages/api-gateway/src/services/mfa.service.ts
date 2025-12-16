import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import crypto from 'crypto';
import { config } from '../config/config';
import { RedisService } from './redis.service';
import { logger } from '../utils/logger';
import { MFASetup, MFAVerification, User } from '@voxlink/shared';

export class MFAService {
  constructor(private redisService: RedisService) { }

  /**
   * Generate MFA setup for a user
   */
  async generateMFASetup(user: User): Promise<MFASetup> {
    try {
      // Generate secret
      const secret = speakeasy.generateSecret({
        name: `VoxLink (${user.email})`,
        issuer: 'VoxLink',
        length: 32,
      });

      // Generate QR code
      const qrCode = await QRCode.toDataURL(secret.otpauth_url!);

      // Generate backup codes
      const backupCodes = this.generateBackupCodes();

      // Store temporary setup in Redis (expires in 10 minutes)
      await this.redisService.setex(
        `mfa_setup:${user.id}`,
        600, // 10 minutes
        JSON.stringify({
          secret: secret.base32,
          backupCodes,
        })
      );

      return {
        secret: secret.base32,
        qrCode,
        backupCodes,
      };
    } catch (error) {
      logger.error('Failed to generate MFA setup:', { error } as any);
      throw new Error('Failed to generate MFA setup');
    }
  }

  /**
   * Verify MFA setup and enable MFA for user
   */
  async verifyAndEnableMFA(userId: string, token: string): Promise<{ backupCodes: string[] }> {
    try {
      // Get temporary setup from Redis
      const setupData = await this.redisService.get(`mfa_setup:${userId}`);
      if (!setupData) {
        throw new Error('MFA setup not found or expired');
      }

      const { secret, backupCodes } = JSON.parse(setupData);

      // Verify the token
      const verified = speakeasy.totp.verify({
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
    } catch (error) {
      logger.error('Failed to verify and enable MFA:', { error } as any);
      throw error;
    }
  }

  /**
   * Verify MFA token during login
   */
  async verifyMFAToken(userId: string, verification: MFAVerification): Promise<boolean> {
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
      const verified = speakeasy.totp.verify({
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
    } catch (error) {
      logger.error('Failed to verify MFA token:', { error } as any);
      return false;
    }
  }

  /**
   * Disable MFA for a user
   */
  async disableMFA(userId: string): Promise<void> {
    try {
      // Disable MFA in database
      await this.disableMFAForUser(userId);

      // Remove backup codes from Redis
      await this.redisService.del(`backup_codes:${userId}`);

      // Log security event
      await this.logSecurityEvent(userId, 'mfa_disabled', {
        timestamp: new Date(),
      });

      logger.info(`MFA disabled for user ${userId}`);
    } catch (error) {
      logger.error('Failed to disable MFA:', { error } as any);
      throw error;
    }
  }

  /**
   * Generate new backup codes
   */
  async generateNewBackupCodes(userId: string): Promise<string[]> {
    try {
      const backupCodes = this.generateBackupCodes();

      // Store hashed backup codes in Redis
      const hashedCodes = await Promise.all(
        backupCodes.map(code => this.hashBackupCode(code))
      );

      await this.redisService.setex(
        `backup_codes:${userId}`,
        365 * 24 * 60 * 60, // 1 year
        JSON.stringify(hashedCodes)
      );

      // Log security event
      await this.logSecurityEvent(userId, 'backup_codes_generated', {
        count: backupCodes.length,
        timestamp: new Date(),
      });

      return backupCodes;
    } catch (error) {
      logger.error('Failed to generate backup codes:', { error } as any);
      throw error;
    }
  }

  /**
   * Check if user has MFA enabled
   */
  async isMFAEnabled(userId: string): Promise<boolean> {
    try {
      const user = await this.getUserById(userId);
      return user?.mfaEnabled || false;
    } catch (error) {
      logger.error('Failed to check MFA status:', { error } as any);
      return false;
    }
  }

  /**
   * Generate backup codes
   */
  private generateBackupCodes(count: number = 10): string[] {
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      // Generate 8-character alphanumeric code
      const code = crypto.randomBytes(4).toString('hex').toUpperCase();
      codes.push(code);
    }
    return codes;
  }

  /**
   * Verify backup code
   */
  private async verifyBackupCode(userId: string, backupCode: string): Promise<boolean> {
    try {
      const storedCodes = await this.redisService.get(`backup_codes:${userId}`);
      if (!storedCodes) {
        return false;
      }

      const hashedCodes = JSON.parse(storedCodes) as string[];
      const hashedInput = await this.hashBackupCode(backupCode);

      const codeIndex = hashedCodes.findIndex(code => code === hashedInput);
      if (codeIndex === -1) {
        return false;
      }

      // Remove used backup code
      hashedCodes.splice(codeIndex, 1);
      await this.redisService.setex(
        `backup_codes:${userId}`,
        365 * 24 * 60 * 60,
        JSON.stringify(hashedCodes)
      );

      // Log security event
      await this.logSecurityEvent(userId, 'backup_code_used', {
        codesRemaining: hashedCodes.length,
        timestamp: new Date(),
      });

      return true;
    } catch (error) {
      logger.error('Failed to verify backup code:', { error } as any);
      return false;
    }
  }

  /**
   * Hash backup code for secure storage
   */
  private async hashBackupCode(code: string): Promise<string> {
    return crypto.createHash('sha256').update(code + config.security.backupCodeSalt).digest('hex');
  }

  // Mock database operations (replace with actual database calls)
  private async getUserById(id: string): Promise<User | null> {
    // This would be replaced with actual database query
    return null;
  }

  private async enableMFAForUser(userId: string, secret: string, backupCodes: string[]): Promise<void> {
    // This would update the user record in the database
    logger.info(`Enabled MFA for user ${userId}`);

    // Store hashed backup codes
    const hashedCodes = await Promise.all(
      backupCodes.map(code => this.hashBackupCode(code))
    );

    await this.redisService.setex(
      `backup_codes:${userId}`,
      365 * 24 * 60 * 60,
      JSON.stringify(hashedCodes)
    );
  }

  private async disableMFAForUser(userId: string): Promise<void> {
    // This would update the user record in the database
    logger.info(`Disabled MFA for user ${userId}`);
  }

  private async logSecurityEvent(userId: string, event: string, metadata: Record<string, any>): Promise<void> {
    // This would log to the audit system
    logger.info(`Security event: ${event} for user ${userId}`, metadata);
  }
}

