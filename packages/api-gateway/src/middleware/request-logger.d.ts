import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth';
export declare const requestLogger: (req: any, res: any, next: any) => void;
export declare function auditLogger(action: string, resource: string, details?: any): (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
