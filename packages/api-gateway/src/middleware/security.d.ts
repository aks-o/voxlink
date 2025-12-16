import { Request, Response, NextFunction } from 'express';
export declare function securityMiddleware(req: Request, res: Response, next: NextFunction): Response<any, Record<string, any>> | undefined;
export declare function validateApiKey(req: Request, res: Response, next: NextFunction): Response<any, Record<string, any>> | undefined;
export declare function csrfProtection(req: Request, res: Response, next: NextFunction): void | Response<any, Record<string, any>>;
export declare function ipWhitelist(allowedIPs: string[]): (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export declare function requireHttps(req: Request, res: Response, next: NextFunction): Response<any, Record<string, any>> | undefined;
