import { Request, Response, NextFunction } from 'express';
import { ApiError } from '@voxlink/shared';
export declare const errorHandler: (error: ApiError, req: Request, res: Response, next: NextFunction) => void;
export declare function notFoundHandler(req: Request, res: Response): void;
export declare function validationErrorHandler(errors: any[]): import("@voxlink/shared").ValidationError;
export { ApiError, createError } from '@voxlink/shared';
