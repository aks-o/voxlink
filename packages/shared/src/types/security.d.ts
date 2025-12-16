export interface User {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    permissions: Permission[];
    organizationId: string;
    isActive: boolean;
    mfaEnabled: boolean;
    mfaSecret?: string;
    lastLoginAt?: Date;
    passwordChangedAt?: Date;
    failedLoginAttempts: number;
    lockedUntil?: Date;
    createdAt: Date;
    updatedAt: Date;
}
export type UserRole = 'super_admin' | 'admin' | 'manager' | 'agent' | 'viewer' | 'api';
export interface Permission {
    id: string;
    name: string;
    resource: string;
    action: string;
    conditions?: Record<string, any>;
}
export interface Role {
    id: string;
    name: string;
    description: string;
    permissions: Permission[];
    isSystem: boolean;
    organizationId?: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface MFASetup {
    secret: string;
    qrCode: string;
    backupCodes: string[];
}
export interface MFAVerification {
    token: string;
    backupCode?: string;
}
export interface AuditLog {
    id: string;
    userId?: string;
    userEmail?: string;
    action: string;
    resource: string;
    resourceId?: string;
    details: Record<string, any>;
    ipAddress: string;
    userAgent: string;
    organizationId: string;
    timestamp: Date;
    severity: 'low' | 'medium' | 'high' | 'critical';
}
export interface SecurityEvent {
    id: string;
    type: SecurityEventType;
    userId?: string;
    description: string;
    metadata: Record<string, any>;
    ipAddress: string;
    userAgent: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    resolved: boolean;
    resolvedAt?: Date;
    resolvedBy?: string;
    createdAt: Date;
}
export type SecurityEventType = 'failed_login' | 'account_locked' | 'password_changed' | 'mfa_enabled' | 'mfa_disabled' | 'suspicious_activity' | 'data_access' | 'permission_escalation' | 'api_key_created' | 'api_key_revoked';
export interface DataEncryption {
    algorithm: string;
    keyId: string;
    encryptedData: string;
    iv: string;
    tag?: string;
}
export interface CallRecordingConsent {
    id: string;
    callId: string;
    participantId: string;
    participantNumber: string;
    consentGiven: boolean;
    consentMethod: 'verbal' | 'dtmf' | 'web' | 'api';
    consentTimestamp: Date;
    recordingStarted?: Date;
    recordingEnded?: Date;
    retentionPeriod: number;
    autoDeleteAt: Date;
    metadata: Record<string, any>;
}
export interface CompliancePolicy {
    id: string;
    name: string;
    type: 'data_retention' | 'call_recording' | 'data_encryption' | 'access_control';
    rules: ComplianceRule[];
    organizationId: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface ComplianceRule {
    id: string;
    condition: string;
    action: string;
    parameters: Record<string, any>;
    priority: number;
}
export interface DataRetentionPolicy {
    id: string;
    resourceType: string;
    retentionPeriod: number;
    autoDelete: boolean;
    archiveBeforeDelete: boolean;
    archiveLocation?: string;
    organizationId: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface EncryptionKey {
    id: string;
    alias: string;
    algorithm: string;
    keySize: number;
    purpose: 'data_encryption' | 'communication_encryption' | 'backup_encryption';
    isActive: boolean;
    expiresAt?: Date;
    rotatedAt?: Date;
    organizationId: string;
    createdAt: Date;
}
export interface SecurityConfiguration {
    passwordPolicy: PasswordPolicy;
    mfaPolicy: MFAPolicy;
    sessionPolicy: SessionPolicy;
    encryptionPolicy: EncryptionPolicy;
    auditPolicy: AuditPolicy;
}
export interface PasswordPolicy {
    minLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumbers: boolean;
    requireSpecialChars: boolean;
    maxAge: number;
    preventReuse: number;
    lockoutThreshold: number;
    lockoutDuration: number;
}
export interface MFAPolicy {
    required: boolean;
    requiredForRoles: UserRole[];
    allowedMethods: MFAMethod[];
    backupCodesCount: number;
    gracePeriod: number;
}
export type MFAMethod = 'totp' | 'sms' | 'email' | 'hardware_token';
export interface SessionPolicy {
    maxDuration: number;
    idleTimeout: number;
    maxConcurrentSessions: number;
    requireReauthForSensitive: boolean;
}
export interface EncryptionPolicy {
    dataAtRest: boolean;
    dataInTransit: boolean;
    keyRotationInterval: number;
    algorithm: string;
    keySize: number;
}
export interface AuditPolicy {
    enabled: boolean;
    retentionPeriod: number;
    logLevel: 'minimal' | 'standard' | 'detailed';
    realTimeAlerts: boolean;
    exportFormat: 'json' | 'csv' | 'syslog';
}
