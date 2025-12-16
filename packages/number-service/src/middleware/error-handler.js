"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ForbiddenError = exports.UnauthorizedError = exports.ConflictError = exports.NotFoundError = exports.ValidationError = exports.asyncHandler = exports.createError = exports.errorHandler = void 0;
const shared_1 = require("@voxlink/shared");
Object.defineProperty(exports, "createError", { enumerable: true, get: function () { return shared_1.createError; } });
Object.defineProperty(exports, "asyncHandler", { enumerable: true, get: function () { return shared_1.asyncHandler; } });
Object.defineProperty(exports, "ValidationError", { enumerable: true, get: function () { return shared_1.ValidationError; } });
Object.defineProperty(exports, "NotFoundError", { enumerable: true, get: function () { return shared_1.NotFoundError; } });
Object.defineProperty(exports, "ConflictError", { enumerable: true, get: function () { return shared_1.ConflictError; } });
Object.defineProperty(exports, "UnauthorizedError", { enumerable: true, get: function () { return shared_1.UnauthorizedError; } });
Object.defineProperty(exports, "ForbiddenError", { enumerable: true, get: function () { return shared_1.ForbiddenError; } });
// Setup global error handlers for the Number Service
(0, shared_1.setupGlobalErrorHandlers)('number-service');
// Export the shared error handler configured for Number Service
exports.errorHandler = (0, shared_1.errorHandler)('number-service');
