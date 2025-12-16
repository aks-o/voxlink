import { RedisService } from './redis.service';
import { MFASetup, MFAVerification, User } from '../../../shared/src/types/security';
export declare class MFAService {
    private redisService;
    constructor(redisService: RedisService);
    /**
     * Generate MFA setup for a user
     */
    generateMFASetup(user: User): Promise<MFASetup>;
    /**
     * Verify MFA setup and enable MFA for user
     */
    verifyAndEnableMFA(userId: string, token: string): Promise<{
        backupCodes: string[];
    }>;
    /**
     * Verify MFA token during login
     */
    verifyMFAToken(userId: string, verification: MFAVerification): Promise<boolean>;
    /**
     * Disable MFA for a user
     */
    disableMFA(userId: string): Promise<void>;
    /**
     * Generate new backup codes
     */
    generateNewBackupCodes(userId: string): Promise<string[]>;
    /**
     * Check if user has MFA enabled
     */
    isMFAEnabled(userId: string): Promise<boolean>;
    /**
     * Generate backup codes
     */
    private generateBackupCodes;
    /**
     * Verify backup code
     */
    private verifyBackupCode;
    /**
     * Hash backup code for secure storage
     */
    private hashBackupCode;
    private getUserById;
    private enableMFAForUser;
    private disableMFAForUser;
    private logSecurityEvent;
}
