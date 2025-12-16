"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const config_1 = require("./config/config");
const logger_1 = require("./utils/logger");
const error_handler_1 = require("./middleware/error-handler");
const request_logger_1 = require("./middleware/request-logger");
const health_1 = require("./routes/health");
const numbers_1 = require("./routes/numbers");
const activation_1 = require("./routes/activation");
const configuration_1 = require("./routes/configuration");
const dashboard_1 = require("./routes/dashboard");
const porting_1 = require("./routes/porting");
const database_service_1 = require("./services/database.service");
const redis_service_1 = require("./services/redis.service");
async function startServer() {
    const app = (0, express_1.default)();
    // Security middleware
    app.use((0, helmet_1.default)());
    app.use((0, cors_1.default)({
        origin: config_1.config.cors.allowedOrigins,
        credentials: true,
    }));
    // Body parsing middleware
    app.use(express_1.default.json({ limit: '10mb' }));
    app.use(express_1.default.urlencoded({ extended: true }));
    // Logging middleware
    app.use(request_logger_1.requestLogger);
    // Health check (before authentication)
    app.use('/health', health_1.healthRouter);
    // API routes
    app.use('/api/v1/numbers', numbers_1.numbersRouter);
    app.use('/api/v1/activation', activation_1.activationRouter);
    app.use('/api/v1/configuration', configuration_1.configurationRouter);
    app.use('/api/v1/dashboard', dashboard_1.dashboardRouter);
    app.use('/api/v1/porting', porting_1.portingRouter);
    // Error handling middleware (must be last)
    app.use(error_handler_1.errorHandler);
    // Initialize services
    try {
        await database_service_1.DatabaseService.initialize();
        await redis_service_1.RedisService.initialize();
        logger_1.logger.info('Database and Redis connections established');
    }
    catch (error) {
        logger_1.logger.error('Failed to initialize services:', error);
        logger_1.logger.warn('Continuing without database/Redis for testing purposes');
        // In development, we can continue without DB for basic API testing
        // process.exit(1);
    }
    // Start server
    const port = config_1.config.server.port;
    app.listen(port, () => {
        logger_1.logger.info(`Number Management Service running on port ${port}`);
        logger_1.logger.info(`Environment: ${config_1.config.env}`);
    });
    // Graceful shutdown
    process.on('SIGTERM', async () => {
        logger_1.logger.info('SIGTERM received, shutting down gracefully');
        await database_service_1.DatabaseService.disconnect();
        await redis_service_1.RedisService.disconnect();
        process.exit(0);
    });
    process.on('SIGINT', async () => {
        logger_1.logger.info('SIGINT received, shutting down gracefully');
        await database_service_1.DatabaseService.disconnect();
        await redis_service_1.RedisService.disconnect();
        process.exit(0);
    });
}
startServer().catch((error) => {
    logger_1.logger.error('Failed to start server:', error);
    process.exit(1);
});
