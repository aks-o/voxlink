import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth';
interface ServiceConfig {
    url: string;
    timeout: number;
}
export declare function proxyMiddleware(serviceConfig: ServiceConfig): (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
export declare function healthCheckProxy(serviceConfig: ServiceConfig): (req: Request, res: Response) => Promise<void>;
export declare function circuitBreakerMiddleware(serviceConfig: ServiceConfig, failureThreshold?: number, recoveryTimeout?: number): (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
export {};
