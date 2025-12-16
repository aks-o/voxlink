import { RedisService } from './redis.service';
import { Role, Permission, UserRole } from '../../../shared/src/types/security';
export declare class RBACService {
    private redisService;
    constructor(redisService: RedisService);
    /**
     * Create a new role
     */
    createRole(name: string, description: string, permissions: Permission[], organizationId?: string): Promise<Role>;
    /**
     * Update role permissions
     */
    updateRolePermissions(roleId: string, permissions: Permission[]): Promise<Role>;
    /**
     * Assign role to user
     */
    assignRoleToUser(userId: string, role: UserRole): Promise<void>;
    /**
     * Check if user has permission
     */
    hasPermission(userId: string, resource: string, action: string, context?: Record<string, any>): Promise<boolean>;
    /**
     * Check if user has any of the specified permissions
     */
    hasAnyPermission(userId: string, permissions: Array<{
        resource: string;
        action: string;
    }>, context?: Record<string, any>): Promise<boolean>;
    /**
     * Check if user has all specified permissions
     */
    hasAllPermissions(userId: string, permissions: Array<{
        resource: string;
        action: string;
    }>, context?: Record<string, any>): Promise<boolean>;
    /**
     * Get user's effective permissions
     */
    getUserPermissions(userId: string): Promise<Permission[]>;
    /**
     * Get permissions for a role
     */
    getRolePermissions(role: UserRole): Promise<Permission[]>;
    /**
     * Create system roles with default permissions
     */
    initializeSystemRoles(): Promise<void>;
    /**
     * Validate permission context conditions
     */
    private evaluateConditions;
    /**
     * Remove duplicate permissions
     */
    private deduplicatePermissions;
    /**
     * Invalidate user permission cache
     */
    private invalidateUserPermissionCache;
    /**
     * Invalidate user cache
     */
    private invalidateUserCache;
    private storeRole;
    private cacheRole;
    private getRoleById;
    private getRoleByName;
    private getUserById;
    private updateUserRole;
    private getPermissionsForRole;
}
