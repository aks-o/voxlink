"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RBACService = void 0;
const logger_1 = require("../utils/logger");
const crypto_1 = __importDefault(require("crypto"));
class RBACService {
    constructor(redisService) {
        this.redisService = redisService;
    }
    /**
     * Create a new role
     */
    async createRole(name, description, permissions, organizationId) {
        try {
            const role = {
                id: crypto_1.default.randomUUID(),
                name,
                description,
                permissions,
                isSystem: false,
                organizationId,
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            await this.storeRole(role);
            await this.cacheRole(role);
            logger_1.logger.info(`Role created: ${role.id} - ${name}`);
            return role;
        }
        catch (error) {
            logger_1.logger.error('Failed to create role:', error);
            throw error;
        }
    }
    /**
     * Update role permissions
     */
    async updateRolePermissions(roleId, permissions) {
        try {
            const role = await this.getRoleById(roleId);
            if (!role) {
                throw new Error('Role not found');
            }
            if (role.isSystem) {
                throw new Error('Cannot modify system role');
            }
            role.permissions = permissions;
            role.updatedAt = new Date();
            await this.storeRole(role);
            await this.cacheRole(role);
            await this.invalidateUserPermissionCache(roleId);
            logger_1.logger.info(`Role permissions updated: ${roleId}`);
            return role;
        }
        catch (error) {
            logger_1.logger.error('Failed to update role permissions:', error);
            throw error;
        }
    }
    /**
     * Assign role to user
     */
    async assignRoleToUser(userId, role) {
        try {
            await this.updateUserRole(userId, role);
            await this.invalidateUserCache(userId);
            logger_1.logger.info(`Role assigned to user: ${userId} -> ${role}`);
        }
        catch (error) {
            logger_1.logger.error('Failed to assign role to user:', error);
            throw error;
        }
    }
    /**
     * Check if user has permission
     */
    async hasPermission(userId, resource, action, context) {
        try {
            // Check cache first
            const cacheKey = `user_permissions:${userId}`;
            const cached = await this.redisService.get(cacheKey);
            let userPermissions;
            if (cached) {
                userPermissions = JSON.parse(cached);
            }
            else {
                userPermissions = await this.getUserPermissions(userId);
                // Cache for 5 minutes
                await this.redisService.setex(cacheKey, 300, JSON.stringify(userPermissions));
            }
            // Check for exact permission match
            const hasExactPermission = userPermissions.some(permission => permission.resource === resource &&
                permission.action === action &&
                this.evaluateConditions(permission.conditions, context));
            if (hasExactPermission) {
                return true;
            }
            // Check for wildcard permissions
            const hasWildcardPermission = userPermissions.some(permission => (permission.resource === '*' || permission.resource === resource) &&
                (permission.action === '*' || permission.action === action) &&
                this.evaluateConditions(permission.conditions, context));
            return hasWildcardPermission;
        }
        catch (error) {
            logger_1.logger.error('Failed to check user permission:', error);
            return false; // Default to deny on error
        }
    }
    /**
     * Check if user has any of the specified permissions
     */
    async hasAnyPermission(userId, permissions, context) {
        try {
            for (const permission of permissions) {
                if (await this.hasPermission(userId, permission.resource, permission.action, context)) {
                    return true;
                }
            }
            return false;
        }
        catch (error) {
            logger_1.logger.error('Failed to check any permission:', error);
            return false;
        }
    }
    /**
     * Check if user has all specified permissions
     */
    async hasAllPermissions(userId, permissions, context) {
        try {
            for (const permission of permissions) {
                if (!(await this.hasPermission(userId, permission.resource, permission.action, context))) {
                    return false;
                }
            }
            return true;
        }
        catch (error) {
            logger_1.logger.error('Failed to check all permissions:', error);
            return false;
        }
    }
    /**
     * Get user's effective permissions
     */
    async getUserPermissions(userId) {
        try {
            const user = await this.getUserById(userId);
            if (!user) {
                return [];
            }
            // Get role-based permissions
            const rolePermissions = await this.getRolePermissions(user.role);
            // Combine with user-specific permissions
            const allPermissions = [...rolePermissions, ...user.permissions];
            // Remove duplicates
            const uniquePermissions = this.deduplicatePermissions(allPermissions);
            return uniquePermissions;
        }
        catch (error) {
            logger_1.logger.error('Failed to get user permissions:', error);
            return [];
        }
    }
    /**
     * Get permissions for a role
     */
    async getRolePermissions(role) {
        try {
            // Check cache first
            const cacheKey = `role_permissions:${role}`;
            const cached = await this.redisService.get(cacheKey);
            if (cached) {
                return JSON.parse(cached);
            }
            const permissions = await this.getPermissionsForRole(role);
            // Cache for 10 minutes
            await this.redisService.setex(cacheKey, 600, JSON.stringify(permissions));
            return permissions;
        }
        catch (error) {
            logger_1.logger.error('Failed to get role permissions:', error);
            return [];
        }
    }
    /**
     * Create system roles with default permissions
     */
    async initializeSystemRoles() {
        try {
            const systemRoles = [
                {
                    name: 'super_admin',
                    description: 'Super Administrator with full system access',
                    permissions: [
                        { id: '1', name: 'all', resource: '*', action: '*' }
                    ]
                },
                {
                    name: 'admin',
                    description: 'Administrator with organization-wide access',
                    permissions: [
                        { id: '2', name: 'manage_users', resource: 'users', action: '*' },
                        { id: '3', name: 'manage_roles', resource: 'roles', action: '*' },
                        { id: '4', name: 'view_analytics', resource: 'analytics', action: 'read' },
                        { id: '5', name: 'manage_numbers', resource: 'numbers', action: '*' },
                        { id: '6', name: 'manage_billing', resource: 'billing', action: '*' },
                    ]
                },
                {
                    name: 'manager',
                    description: 'Manager with team oversight capabilities',
                    permissions: [
                        { id: '6', name: 'view_team_analytics', resource: 'analytics', action: 'read', conditions: { scope: 'team' } },
                        { id: '7', name: 'manage_team_users', resource: 'users', action: 'read' },
                        { id: '8', name: 'view_call_logs', resource: 'calls', action: 'read' },
                        { id: '9', name: 'manage_campaigns', resource: 'campaigns', action: '*' },
                    ]
                },
                {
                    name: 'agent',
                    description: 'Agent with call handling capabilities',
                    permissions: [
                        { id: '10', name: 'make_calls', resource: 'calls', action: 'create' },
                        { id: '11', name: 'view_own_calls', resource: 'calls', action: 'read', conditions: { owner: 'self' } },
                        { id: '12', name: 'send_messages', resource: 'messages', action: 'create' },
                        { id: '13', name: 'view_own_messages', resource: 'messages', action: 'read', conditions: { owner: 'self' } },
                    ]
                },
                {
                    name: 'viewer',
                    description: 'Read-only access to reports and analytics',
                    permissions: [
                        { id: '14', name: 'view_reports', resource: 'reports', action: 'read' },
                        { id: '15', name: 'view_analytics', resource: 'analytics', action: 'read' },
                    ]
                },
                {
                    name: 'api',
                    description: 'API access for integrations',
                    permissions: [
                        { id: '16', name: 'api_access', resource: 'api', action: '*' },
                        { id: '17', name: 'webhook_access', resource: 'webhooks', action: '*' },
                    ]
                }
            ];
            for (const roleData of systemRoles) {
                const existingRole = await this.getRoleByName(roleData.name);
                if (!existingRole) {
                    const role = {
                        id: crypto_1.default.randomUUID(),
                        name: roleData.name,
                        description: roleData.description,
                        permissions: roleData.permissions,
                        isSystem: true,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    };
                    await this.storeRole(role);
                    await this.cacheRole(role);
                }
            }
            logger_1.logger.info('System roles initialized');
        }
        catch (error) {
            logger_1.logger.error('Failed to initialize system roles:', error);
            throw error;
        }
    }
    /**
     * Validate permission context conditions
     */
    evaluateConditions(conditions, context) {
        if (!conditions) {
            return true; // No conditions means permission is granted
        }
        if (!context) {
            return false; // Conditions exist but no context provided
        }
        // Evaluate each condition
        for (const [key, expectedValue] of Object.entries(conditions)) {
            const actualValue = context[key];
            if (expectedValue === 'self' && actualValue !== context.userId) {
                return false;
            }
            if (expectedValue !== actualValue && expectedValue !== '*') {
                return false;
            }
        }
        return true;
    }
    /**
     * Remove duplicate permissions
     */
    deduplicatePermissions(permissions) {
        const seen = new Set();
        return permissions.filter(permission => {
            const key = `${permission.resource}:${permission.action}`;
            if (seen.has(key)) {
                return false;
            }
            seen.add(key);
            return true;
        });
    }
    /**
     * Invalidate user permission cache
     */
    async invalidateUserPermissionCache(roleId) {
        // This would invalidate cache for all users with this role
        // For now, we'll just log it
        logger_1.logger.debug(`Invalidating permission cache for role: ${roleId}`);
    }
    /**
     * Invalidate user cache
     */
    async invalidateUserCache(userId) {
        await this.redisService.del(`user_permissions:${userId}`);
        await this.redisService.del(`user:${userId}`);
    }
    // Mock database operations (replace with actual database calls)
    async storeRole(role) {
        logger_1.logger.debug(`Storing role: ${role.id}`);
    }
    async cacheRole(role) {
        await this.redisService.setex(`role:${role.id}`, 3600, // 1 hour
        JSON.stringify(role));
    }
    async getRoleById(roleId) {
        // Check cache first
        const cached = await this.redisService.get(`role:${roleId}`);
        if (cached) {
            return JSON.parse(cached);
        }
        // This would query the database
        return null;
    }
    async getRoleByName(name) {
        // This would query the database
        return null;
    }
    async getUserById(userId) {
        // This would query the database
        return null;
    }
    async updateUserRole(userId, role) {
        // This would update the user's role in the database
        logger_1.logger.debug(`Updating user role: ${userId} -> ${role}`);
    }
    async getPermissionsForRole(role) {
        // This would get permissions for the role from the database
        // For now, return default permissions based on role
        const defaultPermissions = {
            super_admin: [
                { id: '1', name: 'all', resource: '*', action: '*' }
            ],
            admin: [
                { id: '2', name: 'manage_users', resource: 'users', action: '*' },
                { id: '3', name: 'manage_roles', resource: 'roles', action: '*' },
                { id: '4', name: 'view_analytics', resource: 'analytics', action: 'read' },
                { id: '5', name: 'manage_numbers', resource: 'numbers', action: '*' },
                { id: '6', name: 'manage_billing', resource: 'billing', action: '*' },
            ],
            manager: [
                { id: '7', name: 'view_team_analytics', resource: 'analytics', action: 'read', conditions: { scope: 'team' } },
                { id: '8', name: 'manage_team_users', resource: 'users', action: 'read' },
                { id: '9', name: 'view_call_logs', resource: 'calls', action: 'read' },
                { id: '10', name: 'manage_campaigns', resource: 'campaigns', action: '*' },
            ],
            agent: [
                { id: '11', name: 'make_calls', resource: 'calls', action: 'create' },
                { id: '12', name: 'view_own_calls', resource: 'calls', action: 'read', conditions: { owner: 'self' } },
                { id: '13', name: 'send_messages', resource: 'messages', action: 'create' },
                { id: '14', name: 'view_own_messages', resource: 'messages', action: 'read', conditions: { owner: 'self' } },
            ],
            viewer: [
                { id: '15', name: 'view_reports', resource: 'reports', action: 'read' },
                { id: '16', name: 'view_analytics', resource: 'analytics', action: 'read' },
            ],
            api: [
                { id: '17', name: 'api_access', resource: 'api', action: '*' },
                { id: '18', name: 'webhook_access', resource: 'webhooks', action: '*' },
            ]
        };
        return defaultPermissions[role] || [];
    }
}
exports.RBACService = RBACService;
