"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.proxyMiddleware = proxyMiddleware;
exports.healthCheckProxy = healthCheckProxy;
exports.circuitBreakerMiddleware = circuitBreakerMiddleware;
const axios_1 = __importDefault(require("axios"));
const logger_1 = require("../utils/logger");
function proxyMiddleware(serviceConfig) {
    return async (req, res, next) => {
        try {
            const targetUrl = `${serviceConfig.url}${req.path}`;
            // Prepare headers to forward
            const forwardHeaders = {
                'Content-Type': req.get('Content-Type') || 'application/json',
                'User-Agent': req.get('User-Agent') || 'VoxLink-Gateway/1.0',
                'X-Request-ID': req.get('X-Request-ID') || '',
                'X-Forwarded-For': req.ip,
                'X-Forwarded-Proto': req.protocol,
                'X-Forwarded-Host': req.get('Host') || '',
            };
            // Add user context headers
            if (req.user) {
                forwardHeaders['X-User-ID'] = req.user.id;
                forwardHeaders['X-User-Email'] = req.user.email;
                forwardHeaders['X-User-Role'] = req.user.role;
                forwardHeaders['X-User-Org'] = req.user.organizationId;
                forwardHeaders['X-User-Permissions'] = req.user.permissions.join(',');
            }
            else if (req.apiKey) {
                forwardHeaders['X-API-Key-ID'] = req.apiKey.id;
                forwardHeaders['X-API-Key-User'] = req.apiKey.userId;
                forwardHeaders['X-API-Key-Permissions'] = req.apiKey.permissions.join(',');
            }
            // Remove sensitive headers
            delete forwardHeaders['authorization'];
            delete forwardHeaders['x-api-key'];
            const startTime = Date.now();
            let response;
            try {
                response = await (0, axios_1.default)({
                    method: req.method,
                    url: targetUrl,
                    headers: forwardHeaders,
                    params: req.query,
                    data: req.body,
                    timeout: serviceConfig.timeout,
                    validateStatus: () => true, // Don't throw on HTTP error status codes
                });
            }
            catch (error) {
                const duration = Date.now() - startTime;
                logger_1.logger.error('Service proxy error', {
                    targetUrl,
                    method: req.method,
                    duration,
                    error: error.message,
                    code: error.code,
                    userId: req.user?.id,
                    apiKeyId: req.apiKey?.id,
                });
                if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
                    return res.status(503).json({
                        error: {
                            code: 'SERVICE_UNAVAILABLE',
                            message: 'The requested service is currently unavailable',
                        },
                    });
                }
                if (error.code === 'ECONNABORTED') {
                    return res.status(504).json({
                        error: {
                            code: 'GATEWAY_TIMEOUT',
                            message: 'The service request timed out',
                        },
                    });
                }
                return res.status(502).json({
                    error: {
                        code: 'BAD_GATEWAY',
                        message: 'Error communicating with the service',
                    },
                });
            }
            const duration = Date.now() - startTime;
            // Log the proxy request
            logger_1.logger.info('Service proxy request', {
                targetUrl,
                method: req.method,
                statusCode: response.status,
                duration,
                userId: req.user?.id,
                apiKeyId: req.apiKey?.id,
                requestId: req.get('X-Request-ID'),
            });
            // Forward response headers (excluding sensitive ones)
            const responseHeaders = { ...response.headers };
            delete responseHeaders['set-cookie'];
            delete responseHeaders['authorization'];
            // Add proxy headers
            responseHeaders['X-Proxy-Duration'] = duration.toString();
            responseHeaders['X-Proxy-Service'] = serviceConfig.url;
            res.set(responseHeaders);
            res.status(response.status).json(response.data);
        }
        catch (error) {
            logger_1.logger.error('Proxy middleware error', {
                error: error instanceof Error ? error.message : 'Unknown error',
                targetService: serviceConfig.url,
                method: req.method,
                path: req.path,
                userId: req.user?.id,
                apiKeyId: req.apiKey?.id,
            });
            res.status(500).json({
                error: {
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'An error occurred while processing your request',
                },
            });
        }
    };
}
function healthCheckProxy(serviceConfig) {
    return async (req, res) => {
        try {
            const healthUrl = `${serviceConfig.url}/health`;
            const startTime = Date.now();
            const response = await axios_1.default.get(healthUrl, {
                timeout: 5000,
                validateStatus: () => true,
            });
            const duration = Date.now() - startTime;
            const isHealthy = response.status === 200;
            res.status(isHealthy ? 200 : 503).json({
                service: serviceConfig.url,
                status: isHealthy ? 'healthy' : 'unhealthy',
                responseTime: duration,
                statusCode: response.status,
                timestamp: new Date().toISOString(),
                data: response.data,
            });
        }
        catch (error) {
            const duration = Date.now() - Date.now();
            res.status(503).json({
                service: serviceConfig.url,
                status: 'unhealthy',
                responseTime: duration,
                error: error.message,
                timestamp: new Date().toISOString(),
            });
        }
    };
}
function circuitBreakerMiddleware(serviceConfig, failureThreshold = 5, recoveryTimeout = 60000) {
    let failureCount = 0;
    let lastFailureTime = 0;
    let circuitOpen = false;
    return async (req, res, next) => {
        const now = Date.now();
        // Check if circuit should be reset
        if (circuitOpen && now - lastFailureTime > recoveryTimeout) {
            circuitOpen = false;
            failureCount = 0;
            logger_1.logger.info('Circuit breaker reset', { service: serviceConfig.url });
        }
        // If circuit is open, reject immediately
        if (circuitOpen) {
            logger_1.logger.warn('Circuit breaker open', {
                service: serviceConfig.url,
                failureCount,
                lastFailureTime: new Date(lastFailureTime).toISOString(),
            });
            return res.status(503).json({
                error: {
                    code: 'CIRCUIT_BREAKER_OPEN',
                    message: 'Service is temporarily unavailable due to repeated failures',
                    retryAfter: Math.ceil((recoveryTimeout - (now - lastFailureTime)) / 1000),
                },
            });
        }
        // Wrap the original response methods to detect failures
        const originalJson = res.json;
        const originalStatus = res.status;
        let statusCode = 200;
        res.status = function (code) {
            statusCode = code;
            return originalStatus.call(this, code);
        };
        res.json = function (data) {
            // Consider 5xx status codes as failures
            if (statusCode >= 500) {
                failureCount++;
                lastFailureTime = now;
                if (failureCount >= failureThreshold) {
                    circuitOpen = true;
                    logger_1.logger.error('Circuit breaker opened', {
                        service: serviceConfig.url,
                        failureCount,
                        threshold: failureThreshold,
                    });
                }
            }
            else if (statusCode < 400) {
                // Reset failure count on successful request
                failureCount = 0;
            }
            return originalJson.call(this, data);
        };
        next();
    };
}
