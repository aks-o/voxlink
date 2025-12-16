"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestLogger = void 0;
exports.auditLogger = auditLogger;
const shared_1 = require("@voxlink/shared");
// Export the shared request logger configured for API Gateway
exports.requestLogger = (0, shared_1.createRequestLogger)('api-gateway');
const logger_1 = require("../utils/logger");
function auditLogger(action, resource, details) {
    return (req, res, next) => {
        const originalJson = res.json;
        res.json = function (data) {
            // Only log successful operations for audit
            if (res.statusCode < 400) {
                logger_1.logger.logAuditEvent(action, resource, req.user?.id, {
                    userEmail: req.user?.email,
                    apiKeyId: req.apiKey?.id,
                    requestId: req.get('X-Request-ID'),
                    ip: req.ip,
                    userAgent: req.get('User-Agent'),
                    details,
                });
            }
            return originalJson.call(this, data);
        };
        next();
    };
}
