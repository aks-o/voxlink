"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = authMiddleware;
exports.requirePermission = requirePermission;
exports.requireAnyPermission = requireAnyPermission;
exports.requireRole = requireRole;
exports.optionalAuth = optionalAuth;
const logger_1 = require("../utils/logger");
function authMiddleware(authService) {
    return async (req, res, next) => {
        try {
            const authHeader = req.headers.authorization;
            const apiKeyHeader = req.headers['x-api-key'];
            // Check for JWT token
            if (authHeader && authHeader.startsWith('Bearer ')) {
                const token = authHeader.substring(7);
                try {
                    const payload = await authService.verifyToken(token);
                    const user = await authService['getUserById'](payload.sub);
                    if (user && user.isActive) {
                        req.user = user;
                        req.authType = 'jwt';
                        return next();
                    }
                }
                catch (error) {
                    logger_1.logger.warn('JWT token verification failed:', error);
                }
            }
            // Check for API key
            if (apiKeyHeader) {
                try {
                    const apiKey = await authService.verifyApiKey(apiKeyHeader);
                    if (apiKey) {
                        req.apiKey = apiKey;
                        req.authType = 'apikey';
                        return next();
                    }
                }
                catch (error) {
                    logger_1.logger.warn('API key verification failed:', error);
                }
            }
            // No valid authentication found
            return res.status(401).json({
                error: {
                    code: 'UNAUTHORIZED',
                    message: 'Authentication required. Provide a valid JWT token or API key.',
                },
            });
        }
        catch (error) {
            logger_1.logger.error('Authentication middleware error:', error);
            return res.status(500).json({
                error: {
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'Authentication service error',
                },
            });
        }
    };
}
function requirePermission(permission) {
    return (authService) => {
        return (req, res, next) => {
            const user = req.user || req.apiKey;
            if (!user) {
                return res.status(401).json({
                    error: {
                        code: 'UNAUTHORIZED',
                        message: 'Authentication required',
                    },
                });
            }
            if (!authService.hasPermission(user, permission)) {
                return res.status(403).json({
                    error: {
                        code: 'FORBIDDEN',
                        message: `Insufficient permissions. Required: ${permission}`,
                    },
                });
            }
            next();
        };
    };
}
function requireAnyPermission(permissions) {
    return (authService) => {
        return (req, res, next) => {
            const user = req.user || req.apiKey;
            if (!user) {
                return res.status(401).json({
                    error: {
                        code: 'UNAUTHORIZED',
                        message: 'Authentication required',
                    },
                });
            }
            if (!authService.hasAnyPermission(user, permissions)) {
                return res.status(403).json({
                    error: {
                        code: 'FORBIDDEN',
                        message: `Insufficient permissions. Required one of: ${permissions.join(', ')}`,
                    },
                });
            }
            next();
        };
    };
}
function requireRole(role) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                error: {
                    code: 'UNAUTHORIZED',
                    message: 'User authentication required',
                },
            });
        }
        if (req.user.role !== role && req.user.role !== 'admin') {
            return res.status(403).json({
                error: {
                    code: 'FORBIDDEN',
                    message: `Insufficient role. Required: ${role}`,
                },
            });
        }
        next();
    };
}
function optionalAuth(authService) {
    return async (req, res, next) => {
        try {
            const authHeader = req.headers.authorization;
            const apiKeyHeader = req.headers['x-api-key'];
            // Try JWT token
            if (authHeader && authHeader.startsWith('Bearer ')) {
                const token = authHeader.substring(7);
                try {
                    const payload = await authService.verifyToken(token);
                    const user = await authService['getUserById'](payload.sub);
                    if (user && user.isActive) {
                        req.user = user;
                        req.authType = 'jwt';
                    }
                }
                catch (error) {
                    // Ignore authentication errors for optional auth
                }
            }
            // Try API key
            if (apiKeyHeader && !req.user) {
                try {
                    const apiKey = await authService.verifyApiKey(apiKeyHeader);
                    if (apiKey) {
                        req.apiKey = apiKey;
                        req.authType = 'apikey';
                    }
                }
                catch (error) {
                    // Ignore authentication errors for optional auth
                }
            }
            next();
        }
        catch (error) {
            logger_1.logger.error('Optional auth middleware error:', error);
            next(); // Continue without authentication
        }
    };
}
