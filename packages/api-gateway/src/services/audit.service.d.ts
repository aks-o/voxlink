import { Request } from 'express';
import { RedisService } from './redis.service';
import { AuditLog, SecurityEvent, SecurityEventType } from '../../../shared/src/types/security';
export declare class AuditService {
    private redisService;
    constructor(redisService: RedisService);
    /**
     * Log user activity for audit purposes
     */
    logActivity(userId: string | undefined, action: string, resource: string, resourceId: string | undefined, details: Record<string, any>, req: Request, severity?: 'low' | 'medium' | 'high' | 'critical'): Promise<void>;
    /**
     * Log security events
     */
    logSecurityEvent(type: SecurityEventType, userId: string | undefined, description: string, metadata: Record<string, any>, req: Request, severity?: 'low' | 'medium' | 'high' | 'critical'): Promise<void>;
    /**
     * Get recent audit logs
     */
    getRecentAuditLogs(limit?: number): Promise<AuditLog[]>;
    /**
     * Get recent security events
     */
    getRecentSecurityEvents(limit?: number): Promise<SecurityEvent[]>;
    /**
     * Search audit logs by criteria
     */
    searchAuditLogs(criteria: {
        userId?: string;
        action?: string;
        resource?: string;
        startDate?: Date;
        endDate?: Date;
        severity?: string;
        limit?: number;
        offset?: number;
    }): Promise<{
        logs: AuditLog[];
        total: number;
    }>;
    /**
     * Export audit logs
     */
    exportAuditLogs(criteria: {
        startDate: Date;
        endDate: Date;
        format: 'json' | 'csv' | 'syslog';
        userId?: string;
        resource?: string;
    }): Promise<string>;
    /**
     * Track failed login attempts
     */
    trackFailedLogin(email: string, ipAddress: string, userAgent: string): Promise<void>;
    /**
     * Check if IP is suspicious
     */
    isSuspiciousIP(ipAddress: string): Promise<boolean>;
    /**
     * Add IP to suspicious list
     */
    markIPAsSuspicious(ipAddress: string, reason: string): Promise<void>;
    /**
     * Get client IP address from request
     */
    private getClientIP;
    /**
     * Sanitize sensitive data from details
     */
    private sanitizeDetails;
    /**
     * Trigger security alert
     */
    private triggerSecurityAlert;
    /**
     * Format logs as CSV
     */
    private formatLogsAsCSV;
    /**
     * Format logs as syslog
     */
    private formatLogsAsSyslog;
    /**
     * Get syslog priority based on severity
     */
    private getSyslogPriority;
    private storeAuditLog;
    private storeSecurityEvent;
    private getAuditLogsByCriteria;
}
