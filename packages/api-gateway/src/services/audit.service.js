"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditService = void 0;
const logger_1 = require("../utils/logger");
const crypto_1 = __importDefault(require("crypto"));
class AuditService {
    constructor(redisService) {
        this.redisService = redisService;
    }
    /**
     * Log user activity for audit purposes
     */
    async logActivity(userId, action, resource, resourceId, details, req, severity = 'low') {
        try {
            const auditLog = {
                id: crypto_1.default.randomUUID(),
                userId,
                userEmail: details.userEmail,
                action,
                resource,
                resourceId,
                details: this.sanitizeDetails(details),
                ipAddress: this.getClientIP(req),
                userAgent: req.get('User-Agent') || 'Unknown',
                organizationId: details.organizationId || 'unknown',
                timestamp: new Date(),
                severity,
            };
            // Store in database (mock implementation)
            await this.storeAuditLog(auditLog);
            // Store in Redis for real-time monitoring
            await this.redisService.lpush('audit_logs:recent', JSON.stringify(auditLog));
            // Keep only last 1000 recent logs in Redis
            await this.redisService.ltrim('audit_logs:recent', 0, 999);
            // Log high severity events immediately
            if (severity === 'high' || severity === 'critical') {
                logger_1.logger.warn('High severity audit event:', auditLog);
                await this.triggerSecurityAlert(auditLog);
            }
            logger_1.logger.info('Audit log created:', {
                id: auditLog.id,
                userId,
                action,
                resource,
                severity,
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to log audit activity:', error);
            // Don't throw error to avoid breaking the main flow
        }
    }
    /**
     * Log security events
     */
    async logSecurityEvent(type, userId, description, metadata, req, severity = 'medium') {
        try {
            const securityEvent = {
                id: crypto_1.default.randomUUID(),
                type,
                userId,
                description,
                metadata: this.sanitizeDetails(metadata),
                ipAddress: this.getClientIP(req),
                userAgent: req.get('User-Agent') || 'Unknown',
                severity,
                resolved: false,
                createdAt: new Date(),
            };
            // Store in database
            await this.storeSecurityEvent(securityEvent);
            // Store in Redis for real-time monitoring
            await this.redisService.lpush('security_events:recent', JSON.stringify(securityEvent));
            // Keep only last 500 recent events in Redis
            await this.redisService.ltrim('security_events:recent', 0, 499);
            // Trigger immediate alerts for high severity events
            if (severity === 'high' || severity === 'critical') {
                await this.triggerSecurityAlert(securityEvent);
            }
            logger_1.logger.info('Security event logged:', {
                id: securityEvent.id,
                type,
                userId,
                severity,
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to log security event:', error);
        }
    }
    /**
     * Get recent audit logs
     */
    async getRecentAuditLogs(limit = 100) {
        try {
            const logs = await this.redisService.lrange('audit_logs:recent', 0, limit - 1);
            return logs.map(log => JSON.parse(log));
        }
        catch (error) {
            logger_1.logger.error('Failed to get recent audit logs:', error);
            return [];
        }
    }
    /**
     * Get recent security events
     */
    async getRecentSecurityEvents(limit = 50) {
        try {
            const events = await this.redisService.lrange('security_events:recent', 0, limit - 1);
            return events.map(event => JSON.parse(event));
        }
        catch (error) {
            logger_1.logger.error('Failed to get recent security events:', error);
            return [];
        }
    }
    /**
     * Search audit logs by criteria
     */
    async searchAuditLogs(criteria) {
        try {
            // This would be implemented with actual database queries
            // For now, return mock data
            return {
                logs: [],
                total: 0,
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to search audit logs:', error);
            return { logs: [], total: 0 };
        }
    }
    /**
     * Export audit logs
     */
    async exportAuditLogs(criteria) {
        try {
            // Get logs from database based on criteria
            const logs = await this.getAuditLogsByCriteria(criteria);
            switch (criteria.format) {
                case 'csv':
                    return this.formatLogsAsCSV(logs);
                case 'syslog':
                    return this.formatLogsAsSyslog(logs);
                case 'json':
                default:
                    return JSON.stringify(logs, null, 2);
            }
        }
        catch (error) {
            logger_1.logger.error('Failed to export audit logs:', error);
            throw error;
        }
    }
    /**
     * Track failed login attempts
     */
    async trackFailedLogin(email, ipAddress, userAgent) {
        try {
            const key = `failed_logins:${email}:${ipAddress}`;
            const attempts = await this.redisService.incr(key);
            // Set expiration for 1 hour
            if (attempts === 1) {
                await this.redisService.expire(key, 3600);
            }
            // Log security event if too many attempts
            if (attempts >= 5) {
                await this.logSecurityEvent('failed_login', undefined, `Multiple failed login attempts for ${email}`, { email, attempts, ipAddress, userAgent }, { get: () => userAgent, ip: ipAddress }, 'high');
            }
        }
        catch (error) {
            logger_1.logger.error('Failed to track failed login:', error);
        }
    }
    /**
     * Check if IP is suspicious
     */
    async isSuspiciousIP(ipAddress) {
        try {
            const suspiciousIPs = await this.redisService.smembers('suspicious_ips');
            return suspiciousIPs.includes(ipAddress);
        }
        catch (error) {
            logger_1.logger.error('Failed to check suspicious IP:', error);
            return false;
        }
    }
    /**
     * Add IP to suspicious list
     */
    async markIPAsSuspicious(ipAddress, reason) {
        try {
            await this.redisService.sadd('suspicious_ips', ipAddress);
            await this.redisService.setex(`suspicious_ip_reason:${ipAddress}`, 24 * 60 * 60, // 24 hours
            reason);
            logger_1.logger.warn(`IP marked as suspicious: ${ipAddress} - ${reason}`);
        }
        catch (error) {
            logger_1.logger.error('Failed to mark IP as suspicious:', error);
        }
    }
    /**
     * Get client IP address from request
     */
    getClientIP(req) {
        return (req.ip ||
            req.connection.remoteAddress ||
            req.socket.remoteAddress ||
            req.connection?.socket?.remoteAddress ||
            'unknown');
    }
    /**
     * Sanitize sensitive data from details
     */
    sanitizeDetails(details) {
        const sanitized = { ...details };
        // Remove sensitive fields
        const sensitiveFields = ['password', 'token', 'secret', 'key', 'authorization'];
        for (const field of sensitiveFields) {
            if (sanitized[field]) {
                sanitized[field] = '[REDACTED]';
            }
        }
        // Truncate long values
        for (const [key, value] of Object.entries(sanitized)) {
            if (typeof value === 'string' && value.length > 1000) {
                sanitized[key] = value.substring(0, 1000) + '... [TRUNCATED]';
            }
        }
        return sanitized;
    }
    /**
     * Trigger security alert
     */
    async triggerSecurityAlert(event) {
        try {
            // Store alert in Redis for immediate processing
            await this.redisService.lpush('security_alerts', JSON.stringify({
                ...event,
                alertTriggered: new Date(),
            }));
            // In a real implementation, this would:
            // - Send notifications to security team
            // - Trigger automated responses
            // - Update security dashboards
            logger_1.logger.warn('Security alert triggered:', event);
        }
        catch (error) {
            logger_1.logger.error('Failed to trigger security alert:', error);
        }
    }
    /**
     * Format logs as CSV
     */
    formatLogsAsCSV(logs) {
        const headers = [
            'ID', 'Timestamp', 'User ID', 'User Email', 'Action', 'Resource',
            'Resource ID', 'IP Address', 'User Agent', 'Severity'
        ];
        const rows = logs.map(log => [
            log.id,
            log.timestamp.toISOString(),
            log.userId || '',
            log.userEmail || '',
            log.action,
            log.resource,
            log.resourceId || '',
            log.ipAddress,
            log.userAgent,
            log.severity,
        ]);
        return [headers, ...rows]
            .map(row => row.map(cell => `"${cell}"`).join(','))
            .join('\n');
    }
    /**
     * Format logs as syslog
     */
    formatLogsAsSyslog(logs) {
        return logs.map(log => {
            const timestamp = log.timestamp.toISOString();
            const priority = this.getSyslogPriority(log.severity);
            return `<${priority}>${timestamp} voxlink-audit: ${log.action} ${log.resource} by ${log.userEmail || log.userId} from ${log.ipAddress}`;
        }).join('\n');
    }
    /**
     * Get syslog priority based on severity
     */
    getSyslogPriority(severity) {
        switch (severity) {
            case 'critical': return 2; // Critical
            case 'high': return 3; // Error
            case 'medium': return 4; // Warning
            case 'low': return 6; // Info
            default: return 6;
        }
    }
    // Mock database operations (replace with actual database calls)
    async storeAuditLog(auditLog) {
        // This would store the audit log in the database
        logger_1.logger.debug('Storing audit log:', auditLog.id);
    }
    async storeSecurityEvent(securityEvent) {
        // This would store the security event in the database
        logger_1.logger.debug('Storing security event:', securityEvent.id);
    }
    async getAuditLogsByCriteria(criteria) {
        // This would query the database for audit logs
        return [];
    }
}
exports.AuditService = AuditService;
