import { createError, ApiError, asyncHandler, ValidationError, NotFoundError, ConflictError, UnauthorizedError, ForbiddenError } from '@voxlink/shared';
export declare const errorHandler: (error: ApiError, req: import("express").Request, res: import("express").Response, next: import("express").NextFunction) => void;
export { ApiError, createError, asyncHandler, ValidationError, NotFoundError, ConflictError, UnauthorizedError, ForbiddenError };
