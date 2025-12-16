"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createError = exports.errorHandler = void 0;
exports.notFoundHandler = notFoundHandler;
exports.validationErrorHandler = validationErrorHandler;
const shared_1 = require("@voxlink/shared");
// Setup global error handlers for the API Gateway service
(0, shared_1.setupGlobalErrorHandlers)('api-gateway');
// Export the shared error handler configured for API Gateway
exports.errorHandler = (0, shared_1.errorHandler)('api-gateway');
function notFoundHandler(req, res) {
    const requestId = req.get('X-Request-ID') || 'unknown';
    res.status(404).json({
        error: {
            code: 'ROUTE_NOT_FOUND',
            message: 'The requested endpoint does not exist',
            path: req.path,
            method: req.method,
            requestId,
            timestamp: new Date().toISOString(),
        },
    });
}
function validationErrorHandler(errors) {
    return shared_1.createError.validation('Validation failed', errors.map(error => ({
        field: error.path,
        message: error.message,
        value: error.value,
    })));
}
// Re-export shared error types and utilities
var shared_2 = require("@voxlink/shared");
Object.defineProperty(exports, "createError", { enumerable: true, get: function () { return shared_2.createError; } });
