import { Request, Response, NextFunction } from 'express';
import { AuthService, User, ApiKey } from '../services/auth.service';
export interface AuthenticatedRequest extends Request {
    user?: User;
    apiKey?: ApiKey;
    authType?: 'jwt' | 'apikey';
}
export declare function authMiddleware(authService: AuthService): (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
export declare function requirePermission(permission: string): (authService: AuthService) => (req: AuthenticatedRequest, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export declare function requireAnyPermission(permissions: string[]): (authService: AuthService) => (req: AuthenticatedRequest, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export declare function requireRole(role: string): (req: AuthenticatedRequest, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export declare function optionalAuth(authService: AuthService): (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
