"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.securityRouter = securityRouter;
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const logger_1 = require("../utils/logger");
function securityRouter(authService) {
    const router = (0, express_1.Router)();
    const auditService = authService.getAuditService();
    const rbacService = authService.getRBACService();
    // Get security events
    router.get('/events', (0, auth_1.authMiddleware)(authService), (0, auth_1.requirePermission)('security:read')(authService), async (req, res) => {
        try {
            const events = await auditService.getRecentSecurityEvents(50);
            res.json(events);
        }
        catch (error) {
            logger_1.logger.error('Failed to get security events:', error);
            res.status(500).json({
                error: {
                    code: 'SECURITY_EVENTS_ERROR',
                    message: 'Failed to retrieve security events',
                },
            });
        }
    });
    // Get audit logs
    router.get('/audit-logs', (0, auth_1.authMiddleware)(authService), (0, auth_1.requirePermission)('security:read')(authService), async (req, res) => {
        try {
            const logs = await auditService.getRecentAuditLogs(100);
            res.json(logs);
        }
        catch (error) {
            logger_1.logger.error('Failed to get audit logs:', error);
            res.status(500).json({
                error: {
                    code: 'AUDIT_LOGS_ERROR',
                    message: 'Failed to retrieve audit logs',
                },
            });
        }
    });
    // Get security statistics
    router.get('/stats', (0, auth_1.authMiddleware)(authService), (0, auth_1.requirePermission)('security:read')(authService), async (req, res) => {
        try {
            // Mock security statistics - in a real implementation, these would come from the database
            const stats = {
                totalUsers: 150,
                mfaEnabledUsers: 85,
                activeSecurityEvents: 3,
                recentAuditLogs: 1250,
                failedLoginAttempts: 12,
                lockedAccounts: 2,
            };
            res.json(stats);
        }
        catch (error) {
            logger_1.logger.error('Failed to get security stats:', error);
            res.status(500).json({
                error: {
                    code: 'SECURITY_STATS_ERROR',
                    message: 'Failed to retrieve security statistics',
                },
            });
        }
    });
    // Resolve security event
    router.post('/events/:eventId/resolve', (0, auth_1.authMiddleware)(authService), (0, auth_1.requirePermission)('security:write')(authService), async (req, res) => {
        try {
            const { eventId } = req.params;
            // In a real implementation, this would update the security event in the database
            await auditService.logActivity(req.user.id, 'resolve_security_event', 'security_events', eventId, { eventId, resolvedBy: req.user.id }, req, 'medium');
            res.json({ message: 'Security event resolved successfully' });
        }
        catch (error) {
            logger_1.logger.error('Failed to resolve security event:', error);
            res.status(500).json({
                error: {
                    code: 'RESOLVE_EVENT_ERROR',
                    message: 'Failed to resolve security event',
                },
            });
        }
    });
    // Search audit logs
    router.post('/audit-logs/search', (0, auth_1.authMiddleware)(authService), (0, auth_1.requirePermission)('security:read')(authService), async (req, res) => {
        try {
            const { userId, action, resource, startDate, endDate, severity, limit = 100, offset = 0 } = req.body;
            const criteria = {
                userId,
                action,
                resource,
                startDate: startDate ? new Date(startDate) : undefined,
                endDate: endDate ? new Date(endDate) : undefined,
                severity,
                limit,
                offset,
            };
            const result = await auditService.searchAuditLogs(criteria);
            res.json(result);
        }
        catch (error) {
            logger_1.logger.error('Failed to search audit logs:', error);
            res.status(500).json({
                error: {
                    code: 'SEARCH_AUDIT_LOGS_ERROR',
                    message: 'Failed to search audit logs',
                },
            });
        }
    });
    // Export audit logs
    router.post('/audit-logs/export', (0, auth_1.authMiddleware)(authService), (0, auth_1.requirePermission)('security:export')(authService), async (req, res) => {
        try {
            const { startDate, endDate, format = 'json', userId, resource } = req.body;
            if (!startDate || !endDate) {
                return res.status(400).json({
                    error: {
                        code: 'MISSING_DATE_RANGE',
                        message: 'Start date and end date are required',
                    },
                });
            }
            const criteria = {
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                format: format,
                userId,
                resource,
            };
            const exportData = await auditService.exportAuditLogs(criteria);
            // Set appropriate content type and filename
            const contentTypes = {
                json: 'application/json',
                csv: 'text/csv',
                syslog: 'text/plain',
            };
            const extensions = {
                json: 'json',
                csv: 'csv',
                syslog: 'log',
            };
            const filename = `audit-logs-${startDate}-${endDate}.${extensions[format]}`;
            res.setHeader('Content-Type', contentTypes[format]);
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            res.send(exportData);
            // Log the export activity
            await auditService.logActivity(req.user.id, 'export_audit_logs', 'audit_logs', undefined, { format, startDate, endDate, userId, resource }, req, 'medium');
        }
        catch (error) {
            logger_1.logger.error('Failed to export audit logs:', error);
            res.status(500).json({
                error: {
                    code: 'EXPORT_AUDIT_LOGS_ERROR',
                    message: 'Failed to export audit logs',
                },
            });
        }
    });
    // Get user permissions
    router.get('/permissions/:userId', (0, auth_1.authMiddleware)(authService), (0, auth_1.requirePermission)('security:read')(authService), async (req, res) => {
        try {
            const { userId } = req.params;
            // Check if user can view other users' permissions
            if (userId !== req.user.id) {
                const canViewOthers = await authService.hasPermission(req.user, 'users', 'read');
                if (!canViewOthers) {
                    return res.status(403).json({
                        error: {
                            code: 'FORBIDDEN',
                            message: 'Cannot view other users permissions',
                        },
                    });
                }
            }
            const permissions = await rbacService.getUserPermissions(userId);
            res.json({ permissions });
        }
        catch (error) {
            logger_1.logger.error('Failed to get user permissions:', error);
            res.status(500).json({
                error: {
                    code: 'GET_PERMISSIONS_ERROR',
                    message: 'Failed to retrieve user permissions',
                },
            });
        }
    });
    // Update user role
    router.post('/users/:userId/role', (0, auth_1.authMiddleware)(authService), (0, auth_1.requirePermission)('users:write')(authService), async (req, res) => {
        try {
            const { userId } = req.params;
            const { role } = req.body;
            if (!role) {
                return res.status(400).json({
                    error: {
                        code: 'MISSING_ROLE',
                        message: 'Role is required',
                    },
                });
            }
            await rbacService.assignRoleToUser(userId, role);
            // Log the role change
            await auditService.logActivity(req.user.id, 'update_user_role', 'users', userId, { userId, newRole: role, changedBy: req.user.id }, req, 'high');
            res.json({ message: 'User role updated successfully' });
        }
        catch (error) {
            logger_1.logger.error('Failed to update user role:', error);
            res.status(500).json({
                error: {
                    code: 'UPDATE_ROLE_ERROR',
                    message: 'Failed to update user role',
                },
            });
        }
    });
    // Lock user account
    router.post('/users/:userId/lock', (0, auth_1.authMiddleware)(authService), (0, auth_1.requirePermission)('users:write')(authService), async (req, res) => {
        try {
            const { userId } = req.params;
            const { reason } = req.body;
            if (!reason) {
                return res.status(400).json({
                    error: {
                        code: 'MISSING_REASON',
                        message: 'Reason for locking account is required',
                    },
                });
            }
            await authService.lockAccount(userId, reason, req);
            res.json({ message: 'User account locked successfully' });
        }
        catch (error) {
            logger_1.logger.error('Failed to lock user account:', error);
            res.status(500).json({
                error: {
                    code: 'LOCK_ACCOUNT_ERROR',
                    message: 'Failed to lock user account',
                },
            });
        }
    });
    // Unlock user account
    router.post('/users/:userId/unlock', (0, auth_1.authMiddleware)(authService), (0, auth_1.requirePermission)('users:write')(authService), async (req, res) => {
        try {
            const { userId } = req.params;
            await authService.unlockAccount(userId, req);
            res.json({ message: 'User account unlocked successfully' });
        }
        catch (error) {
            logger_1.logger.error('Failed to unlock user account:', error);
            res.status(500).json({
                error: {
                    code: 'UNLOCK_ACCOUNT_ERROR',
                    message: 'Failed to unlock user account',
                },
            });
        }
    });
    return router;
}
