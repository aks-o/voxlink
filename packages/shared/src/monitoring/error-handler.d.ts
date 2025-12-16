import { Request, Response, NextFunction } from 'express';
export interface ApiError extends Error {
    statusCode?: number;
    code?: string;
    details?: any;
    isOperational?: boolean;
}
export declare class VoxLinkError extends Error implements ApiError {
    readonly statusCode: number;
    readonly code: string;
    readonly details?: any;
    readonly isOperational: boolean;
    constructor(message: string, statusCode?: number, code?: string, details?: any, isOperational?: boolean);
    private getDefaultCode;
}
export declare class ValidationError extends VoxLinkError {
    constructor(message: string, details?: any);
}
export declare class NotFoundError extends VoxLinkError {
    constructor(resource: string, identifier?: string);
}
export declare class ConflictError extends VoxLinkError {
    constructor(message: string, details?: any);
}
export declare class UnauthorizedError extends VoxLinkError {
    constructor(message?: string);
}
export declare class ForbiddenError extends VoxLinkError {
    constructor(message?: string);
}
export declare class ServiceUnavailableError extends VoxLinkError {
    constructor(service: string, details?: any);
}
export declare class ExternalServiceError extends VoxLinkError {
    constructor(service: string, originalError?: Error);
}
export declare function errorHandler(serviceName: string): (error: ApiError, req: Request, res: Response, next: NextFunction) => void;
export declare function asyncHandler(fn: Function): (req: Request, res: Response, next: NextFunction) => void;
export declare function setupGlobalErrorHandlers(serviceName: string): void;
export declare const createError: {
    validation: (message: string, details?: any) => ValidationError;
    notFound: (resource: string, identifier?: string) => NotFoundError;
    conflict: (message: string, details?: any) => ConflictError;
    unauthorized: (message?: string) => UnauthorizedError;
    forbidden: (message?: string) => ForbiddenError;
    serviceUnavailable: (service: string, details?: any) => ServiceUnavailableError;
    externalService: (service: string, originalError?: Error) => ExternalServiceError;
    custom: (message: string, statusCode: number, code?: string, details?: any) => VoxLinkError;
};
