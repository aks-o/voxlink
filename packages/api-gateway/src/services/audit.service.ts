import { Request } from 'express';
import { RedisService } from './redis.service';
import { logger } from '../utils/logger';
import { AuditLog, SecurityEvent, SecurityEventType, User } from '@voxlink/shared';
import crypto from 'crypto';

export class AuditService {
  constructor(private redisService: RedisService) { }

  /**
   * Log user activity for audit purposes
   */
  async logActivity(
    userId: string | undefined,
    action: string,
    resource: string,
    resourceId: string | undefined,
    details: Record<string, any>,
    req: Request,
    severity: 'low' | 'medium' | 'high' | 'critical' = 'low'
  ): Promise<void> {
    try {
      const auditLog: AuditLog = {
        id: crypto.randomUUID(),
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
      await this.redisService.lpush(
        'audit_logs:recent',
        JSON.stringify(auditLog)
      );

      // Keep only last 1000 recent logs in Redis
      await this.redisService.ltrim('audit_logs:recent', 0, 999);

      // Log high severity events immediately
      if (severity === 'high' || severity === 'critical') {
        logger.warn('High severity audit event:', auditLog);
        await this.triggerSecurityAlert(auditLog);
      }

      logger.info('Audit log created:', {
        id: auditLog.id,
        userId,
        action,
        resource,
        severity,
      });
    } catch (error) {
      logger.error('Failed to log audit activity:', error as any);
      // Don't throw error to avoid breaking the main flow
    }
  }

  /**
   * Log security events
   */
  async logSecurityEvent(
    type: SecurityEventType,
    userId: string | undefined,
    description: string,
    metadata: Record<string, any>,
    req: Request,
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
  ): Promise<void> {
    try {
      const securityEvent: SecurityEvent = {
        id: crypto.randomUUID(),
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
      await this.redisService.lpush(
        'security_events:recent',
        JSON.stringify(securityEvent)
      );

      // Keep only last 500 recent events in Redis
      await this.redisService.ltrim('security_events:recent', 0, 499);

      // Trigger immediate alerts for high severity events
      if (severity === 'high' || severity === 'critical') {
        await this.triggerSecurityAlert(securityEvent);
      }

      logger.info('Security event logged:', {
        id: securityEvent.id,
        type,
        userId,
        severity,
      });
    } catch (error) {
      logger.error('Failed to log security event:', error as any);
    }
  }

  /**
   * Get recent audit logs
   */
  async getRecentAuditLogs(limit: number = 100): Promise<AuditLog[]> {
    try {
      const logs = await this.redisService.lrange('audit_logs:recent', 0, limit - 1);
      return logs.map(log => JSON.parse(log) as AuditLog);
    } catch (error) {
      logger.error('Failed to get recent audit logs:', error as any);
      return [];
    }
  }

  /**
   * Get recent security events
   */
  async getRecentSecurityEvents(limit: number = 50): Promise<SecurityEvent[]> {
    try {
      const events = await this.redisService.lrange('security_events:recent', 0, limit - 1);
      return events.map(event => JSON.parse(event) as SecurityEvent);
    } catch (error) {
      logger.error('Failed to get recent security events:', error as any);
      return [];
    }
  }

  /**
   * Search audit logs by criteria
   */
  async searchAuditLogs(criteria: {
    userId?: string;
    action?: string;
    resource?: string;
    startDate?: Date;
    endDate?: Date;
    severity?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ logs: AuditLog[]; total: number }> {
    try {
      // This would be implemented with actual database queries
      // For now, return mock data
      return {
        logs: [],
        total: 0,
      };
    } catch (error) {
      logger.error('Failed to search audit logs:', error as any);
      return { logs: [], total: 0 };
    }
  }

  /**
   * Export audit logs
   */
  async exportAuditLogs(
    criteria: {
      startDate: Date;
      endDate: Date;
      format: 'json' | 'csv' | 'syslog';
      userId?: string;
      resource?: string;
    }
  ): Promise<string> {
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
    } catch (error) {
      logger.error('Failed to export audit logs:', error as any);
      throw error;
    }
  }

  /**
   * Track failed login attempts
   */
  async trackFailedLogin(email: string, ipAddress: string, userAgent: string): Promise<void> {
    try {
      const key = `failed_logins:${email}:${ipAddress}`;
      const attempts = await this.redisService.incr(key);

      // Set expiration for 1 hour
      if (attempts === 1) {
        await this.redisService.expire(key, 3600);
      }

      // Log security event if too many attempts
      if (attempts >= 5) {
        await this.logSecurityEvent(
          'failed_login',
          undefined,
          `Multiple failed login attempts for ${email}`,
          { email, attempts, ipAddress, userAgent },
          { get: () => userAgent, ip: ipAddress } as any,
          'high'
        );
      }
    } catch (error) {
      logger.error('Failed to track failed login:', error as any);
    }
  }

  /**
   * Check if IP is suspicious
   */
  async isSuspiciousIP(ipAddress: string): Promise<boolean> {
    try {
      const suspiciousIPs = await this.redisService.smembers('suspicious_ips');
      return suspiciousIPs.includes(ipAddress);
    } catch (error) {
      logger.error('Failed to check suspicious IP:', error as any);
      return false;
    }
  }

  /**
   * Add IP to suspicious list
   */
  async markIPAsSuspicious(ipAddress: string, reason: string): Promise<void> {
    try {
      await this.redisService.sadd('suspicious_ips', ipAddress);
      await this.redisService.setex(
        `suspicious_ip_reason:${ipAddress}`,
        24 * 60 * 60, // 24 hours
        reason
      );

      logger.warn(`IP marked as suspicious: ${ipAddress} - ${reason}`);
    } catch (error) {
      logger.error('Failed to mark IP as suspicious:', error as any);
    }
  }

  /**
   * Get client IP address from request
   */
  private getClientIP(req: Request): string {
    return (
      req.ip ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      (req.connection as any)?.socket?.remoteAddress ||
      'unknown'
    );
  }

  /**
   * Sanitize sensitive data from details
   */
  private sanitizeDetails(details: Record<string, any>): Record<string, any> {
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
  private async triggerSecurityAlert(event: AuditLog | SecurityEvent): Promise<void> {
    try {
      // Store alert in Redis for immediate processing
      await this.redisService.lpush(
        'security_alerts',
        JSON.stringify({
          ...event,
          alertTriggered: new Date(),
        })
      );

      // In a real implementation, this would:
      // - Send notifications to security team
      // - Trigger automated responses
      // - Update security dashboards

      logger.warn('Security alert triggered:', event);
    } catch (error) {
      logger.error('Failed to trigger security alert:', error as any);
    }
  }

  /**
   * Format logs as CSV
   */
  private formatLogsAsCSV(logs: AuditLog[]): string {
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
  private formatLogsAsSyslog(logs: AuditLog[]): string {
    return logs.map(log => {
      const timestamp = log.timestamp.toISOString();
      const priority = this.getSyslogPriority(log.severity);
      return `<${priority}>${timestamp} voxlink-audit: ${log.action} ${log.resource} by ${log.userEmail || log.userId} from ${log.ipAddress}`;
    }).join('\n');
  }

  /**
   * Get syslog priority based on severity
   */
  private getSyslogPriority(severity: string): number {
    switch (severity) {
      case 'critical': return 2; // Critical
      case 'high': return 3; // Error
      case 'medium': return 4; // Warning
      case 'low': return 6; // Info
      default: return 6;
    }
  }

  // Mock database operations (replace with actual database calls)
  private async storeAuditLog(auditLog: AuditLog): Promise<void> {
    // This would store the audit log in the database
    logger.debug('Storing audit log:', { auditLogId: auditLog.id });
  }

  private async storeSecurityEvent(securityEvent: SecurityEvent): Promise<void> {
    // This would store the security event in the database
    logger.debug('Storing security event:', { securityEventId: securityEvent.id });
  }

  private async getAuditLogsByCriteria(criteria: any): Promise<AuditLog[]> {
    // This would query the database for audit logs
    return [];
  }
}