"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConflictError = exports.UnauthorizedError = exports.NotFoundError = exports.ValidationError = exports.asyncHandler = exports.createError = exports.errorHandler = void 0;
const shared_1 = require("@voxlink/shared");
Object.defineProperty(exports, "createError", { enumerable: true, get: function () { return shared_1.createError; } });
Object.defineProperty(exports, "asyncHandler", { enumerable: true, get: function () { return shared_1.asyncHandler; } });
Object.defineProperty(exports, "ValidationError", { enumerable: true, get: function () { return shared_1.ValidationError; } });
Object.defineProperty(exports, "NotFoundError", { enumerable: true, get: function () { return shared_1.NotFoundError; } });
Object.defineProperty(exports, "UnauthorizedError", { enumerable: true, get: function () { return shared_1.UnauthorizedError; } });
Object.defineProperty(exports, "ConflictError", { enumerable: true, get: function () { return shared_1.ConflictError; } });
// Setup global error handlers for the Billing Service
(0, shared_1.setupGlobalErrorHandlers)('billing-service');
// Export the shared error handler configured for Billing Service
exports.errorHandler = (0, shared_1.errorHandler)('billing-service');
