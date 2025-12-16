"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = require("http");
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const config_1 = require("./config/config");
const logger_1 = require("./utils/logger");
const auth_1 = require("./middleware/auth");
const rate_limit_1 = require("./middleware/rate-limit");
const error_handler_1 = require("./middleware/error-handler");
const request_logger_1 = require("./middleware/request-logger");
const security_1 = require("./middleware/security");
const proxy_1 = require("./middleware/proxy");
const performance_monitoring_middleware_1 = require("./middleware/performance-monitoring.middleware");
const health_1 = require("./routes/health");
const auth_2 = require("./routes/auth");
const api_keys_1 = require("./routes/api-keys");
const performance_1 = require("./routes/performance");
const websocket_1 = require("./routes/websocket");
const integrations_1 = require("./routes/integrations");
const security_2 = require("./routes/security");
const redis_service_1 = require("./services/redis.service");
const auth_service_1 = require("./services/auth.service");
const websocket_service_1 = require("./services/websocket.service");
// Import performance optimization system
const performance_2 = __importStar(require("@voxlink/shared/performance"));
const app = (0, express_1.default)();
const server = (0, http_1.createServer)(app);
// Initialize services
const redisService = new redis_service_1.RedisService();
const authService = new auth_service_1.AuthService(redisService);
// Initialize performance optimization system
async function initializePerformanceSystem() {
    try {
        await performance_2.default.initialize();
        logger_1.logger.info('Performance optimization system initialized');
    }
    catch (error) {
        logger_1.logger.error('Failed to initialize performance system:', error);
        // Continue without performance optimization if it fails
    }
}
// Initialize security services
authService.initializeSecurity().catch(error => {
    logger_1.logger.error('Failed to initialize security services:', error);
});
// Initialize WebSocket service
websocket_service_1.webSocketService.initialize(server);
// Initialize performance system
initializePerformanceSystem();
// Get performance middleware (with fallback if not initialized)
let perfMiddleware = null;
try {
    perfMiddleware = (0, performance_2.getPerformanceMiddleware)();
}
catch (error) {
    logger_1.logger.warn('Performance middleware not available, continuing without optimization');
}
// Performance middleware - apply early for maximum benefit
if (perfMiddleware) {
    app.use(perfMiddleware.compression);
    app.use(perfMiddleware.responseTime);
    app.use(perfMiddleware.requestSizeLimit);
    app.use(perfMiddleware.cacheHeaders);
    app.use(perfMiddleware.conditionalRequests);
    app.use(perfMiddleware.staticAssets);
}
// Security middleware
app.use((0, helmet_1.default)({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"],
            fontSrc: ["'self'"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"],
        },
    },
    crossOriginEmbedderPolicy: false,
}));
// Additional security headers from performance middleware
if (perfMiddleware) {
    app.use(perfMiddleware.security);
}
app.use((0, cors_1.default)({
    origin: config_1.config.cors.allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-Request-ID'],
}));
// Performance monitoring
app.use((0, performance_monitoring_middleware_1.createPerformanceMonitoringMiddleware)());
// Body parsing
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// Request logging
app.use(request_logger_1.requestLogger);
// Global rate limiting
app.use((0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // Limit each IP to 1000 requests per windowMs
    message: {
        error: 'Too many requests from this IP, please try again later.',
        code: 'RATE_LIMIT_EXCEEDED',
    },
    standardHeaders: true,
    legacyHeaders: false,
}));
// Security middleware
app.use(security_1.securityMiddleware);
// API optimization for JSON responses
if (perfMiddleware) {
    app.use('/api', perfMiddleware.apiOptimization);
}
// Caching middleware for different routes
if (perfMiddleware && perfMiddleware.cache) {
    // Cache number search results with short TTL
    app.use('/api/v1/numbers/search', perfMiddleware.cache.shortTerm);
    app.use('/api/v1/numbers/available', perfMiddleware.cache.mediumTerm);
    // Cache analytics and reports with longer TTL
    app.use('/api/v1/analytics', perfMiddleware.cache.analytics);
    // Cache static content
    app.use('/static', perfMiddleware.cache.staticContent);
}
// Health check (no auth required) - enhanced with performance metrics
app.use('/health', health_1.healthRouter);
// Authentication routes
app.use('/auth', (0, auth_2.authRouter)(authService));
// API key management routes
app.use('/api-keys', (0, auth_1.authMiddleware)(authService), (0, api_keys_1.apiKeyRouter)(authService));
// Performance monitoring routes (admin only)
app.use('/performance', (0, auth_1.authMiddleware)(authService), (0, performance_1.createPerformanceRouter)());
// WebSocket management routes (admin only)
app.use('/websocket', (0, auth_1.authMiddleware)(authService), websocket_1.webSocketRouter);
// Security management routes (admin only)
app.use('/security', (0, auth_1.authMiddleware)(authService), (0, security_2.securityRouter)(authService));
// Performance optimization endpoints (admin only)
app.post('/api/admin/optimize', (0, auth_1.authMiddleware)(authService), async (req, res) => {
    try {
        if (performance_2.default) {
            const performanceService = performance_2.default.getService();
            const result = await performanceService.optimizePerformance();
            res.json({
                success: true,
                message: 'Performance optimization completed',
                result,
            });
        }
        else {
            res.status(503).json({
                success: false,
                error: 'Performance system not available',
            });
        }
    }
    catch (error) {
        logger_1.logger.error('Performance optimization failed:', error);
        res.status(500).json({
            success: false,
            error: 'Performance optimization failed',
        });
    }
});
// Cache management endpoints (admin only)
app.post('/api/admin/cache/warm', (0, auth_1.authMiddleware)(authService), async (req, res) => {
    try {
        const { entries } = req.body;
        if (!Array.isArray(entries)) {
            return res.status(400).json({ error: 'Entries must be an array' });
        }
        await performance_2.cacheUtils.warm(entries);
        res.json({
            success: true,
            message: `Cache warmed with ${entries.length} entries`,
        });
    }
    catch (error) {
        logger_1.logger.error('Cache warming failed:', error);
        res.status(500).json({
            success: false,
            error: 'Cache warming failed',
        });
    }
});
app.post('/api/admin/cache/invalidate', (0, auth_1.authMiddleware)(authService), async (req, res) => {
    try {
        const { pattern } = req.body;
        if (!pattern) {
            return res.status(400).json({ error: 'Pattern is required' });
        }
        await performance_2.cacheUtils.invalidate(pattern);
        res.json({
            success: true,
            message: `Cache invalidated for pattern: ${pattern}`,
        });
    }
    catch (error) {
        logger_1.logger.error('Cache invalidation failed:', error);
        res.status(500).json({
            success: false,
            error: 'Cache invalidation failed',
        });
    }
});
// Integrations routes
app.use('/api/v1/integrations', (0, rate_limit_1.rateLimitMiddleware)('analytics'), // Use analytics rate limit as fallback
(0, auth_1.authMiddleware)(authService), integrations_1.integrationsRouter);
// Service proxying with authentication and performance monitoring
app.use('/api/v1/numbers', (0, rate_limit_1.rateLimitMiddleware)('numbers'), (0, auth_1.authMiddleware)(authService), (req, res, next) => {
    performance_2.performanceUtils.recordMetric('proxy.request', 1, 'count', { service: 'number-service' });
    next();
}, (0, proxy_1.proxyMiddleware)(config_1.config.services.numberService));
app.use('/api/v1/billing', (0, rate_limit_1.rateLimitMiddleware)('billing'), (0, auth_1.authMiddleware)(authService), (req, res, next) => {
    performance_2.performanceUtils.recordMetric('proxy.request', 1, 'count', { service: 'billing-service' });
    next();
}, (0, proxy_1.proxyMiddleware)(config_1.config.services.billingService));
app.use('/api/v1/notifications', (0, rate_limit_1.rateLimitMiddleware)('notifications'), (0, auth_1.authMiddleware)(authService), (req, res, next) => {
    performance_2.performanceUtils.recordMetric('proxy.request', 1, 'count', { service: 'notification-service' });
    next();
}, (0, proxy_1.proxyMiddleware)(config_1.config.services.notificationService));
app.use('/api/v1/analytics', (0, rate_limit_1.rateLimitMiddleware)('analytics'), (0, auth_1.authMiddleware)(authService), (req, res, next) => {
    performance_2.performanceUtils.recordMetric('proxy.request', 1, 'count', { service: 'analytics-service' });
    next();
}, (0, proxy_1.proxyMiddleware)(config_1.config.services.analyticsService));
app.use('/api/v1/ai-agents', (0, rate_limit_1.rateLimitMiddleware)('ai-agents'), (0, auth_1.authMiddleware)(authService), (req, res, next) => {
    performance_2.performanceUtils.recordMetric('proxy.request', 1, 'count', { service: 'ai-agent-service' });
    next();
}, (0, proxy_1.proxyMiddleware)(config_1.config.services.aiAgentService));
app.use('/api/v1/voice-workflows', (0, rate_limit_1.rateLimitMiddleware)('voice-workflows'), (0, auth_1.authMiddleware)(authService), (req, res, next) => {
    performance_2.performanceUtils.recordMetric('proxy.request', 1, 'count', { service: 'ai-agent-service' });
    next();
}, (0, proxy_1.proxyMiddleware)(config_1.config.services.aiAgentService));
// Catch-all for undefined routes
app.use('*', (req, res) => {
    res.status(404).json({
        error: {
            code: 'ROUTE_NOT_FOUND',
            message: 'The requested endpoint does not exist',
            path: req.originalUrl,
            method: req.method,
        },
    });
});
// Error handling
app.use(error_handler_1.errorHandler);
// Graceful shutdown with performance system cleanup
process.on('SIGTERM', async () => {
    logger_1.logger.info('SIGTERM received, shutting down gracefully');
    server.close(async () => {
        try {
            await redisService.disconnect();
            if (performance_2.default) {
                await performance_2.default.shutdown();
                logger_1.logger.info('Performance system shut down');
            }
            process.exit(0);
        }
        catch (error) {
            logger_1.logger.error('Error during shutdown:', error);
            process.exit(1);
        }
    });
});
process.on('SIGINT', async () => {
    logger_1.logger.info('SIGINT received, shutting down gracefully');
    server.close(async () => {
        try {
            await redisService.disconnect();
            if (performance_2.default) {
                await performance_2.default.shutdown();
                logger_1.logger.info('Performance system shut down');
            }
            process.exit(0);
        }
        catch (error) {
            logger_1.logger.error('Error during shutdown:', error);
            process.exit(1);
        }
    });
});
const PORT = config_1.config.port || 3001;
server.listen(PORT, () => {
    logger_1.logger.info(`API Gateway with WebSocket running on port ${PORT}`);
    logger_1.logger.info(`Environment: ${config_1.config.nodeEnv}`);
    logger_1.logger.info(`CORS origins: ${config_1.config.cors.allowedOrigins.join(', ')}`);
    logger_1.logger.info(`WebSocket service initialized and ready for connections`);
});
exports.default = app;
