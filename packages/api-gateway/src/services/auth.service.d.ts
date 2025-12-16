import { RedisService } from './redis.service';
import { MFAService } from './mfa.service';
import { AuditService } from './audit.service';
import { RBACService } from './rbac.service';
import { User, MFAVerification, SecurityEventType } from '../../../shared/src/types/security';
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
    sub: string;
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
export declare class AuthService {
    private redisService;
    private mfaService;
    private auditService;
    private rbacService;
    constructor(redisService: RedisService);
    generateTokens(user: User): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    verifyToken(token: string): Promise<JWTPayload>;
    refreshToken(refreshToken: string): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    revokeToken(userId: string): Promise<void>;
    authenticateUser(email: string, password: string, mfaVerification?: MFAVerification, req?: Request): Promise<{
        user: User | null;
        requiresMFA: boolean;
        mfaSetupRequired?: boolean;
    }>;
    generateApiKey(userId: string, name: string, permissions: string[]): Promise<ApiKey>;
    verifyApiKey(key: string): Promise<ApiKey | null>;
    revokeApiKey(keyId: string): Promise<void>;
    hasPermission(user: User | ApiKey, resource: string, action: string, context?: Record<string, any>): Promise<boolean>;
    hasAnyPermission(user: User | ApiKey, permissions: Array<{
        resource: string;
        action: string;
    }>, context?: Record<string, any>): Promise<boolean>;
    setupMFA(userId: string): Promise<import("../../../shared/src/types/security").MFASetup>;
    enableMFA(userId: string, token: string): Promise<{
        backupCodes: string[];
    }>;
    disableMFA(userId: string, req?: Request): Promise<void>;
    generateBackupCodes(userId: string): Promise<string[]>;
    logSecurityEvent(type: SecurityEventType, userId: string | undefined, description: string, metadata: Record<string, any>, req: Request, severity?: 'low' | 'medium' | 'high' | 'critical'): Promise<void>;
    changePassword(userId: string, currentPassword: string, newPassword: string, req?: Request): Promise<void>;
    lockAccount(userId: string, reason: string, req?: Request): Promise<void>;
    unlockAccount(userId: string, req?: Request): Promise<void>;
    private getLoginAttempts;
    private incrementLoginAttempts;
    private resetLoginAttempts;
    private getUserById;
    private getUserByEmail;
    private verifyPassword;
    private updateLastLogin;
    private storeApiKey;
    private getApiKeyById;
    private getApiKeyByKey;
    private updateApiKeyLastUsed;
    private deactivateApiKey;
    private isMFASetupRequired;
    private validatePasswordStrength;
    private isPasswordReused;
    private updateUserPassword;
    private revokeAllUserSessions;
    private updateUserStatus;
    private getUserEmail;
    initializeSecurity(): Promise<void>;
    getMFAService(): MFAService;
    getAuditService(): AuditService;
    getRBACService(): RBACService;
}
