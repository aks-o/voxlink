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
const billing_1 = require("./routes/billing");
const webhooks_1 = require("./routes/webhooks");
const database_service_1 = require("./services/database.service");
const redis_service_1 = require("./services/redis.service");
const billing_jobs_1 = require("./jobs/billing-jobs");
async function startServer() {
    const app = (0, express_1.default)();
    // Security middleware
    app.use((0, helmet_1.default)());
    app.use((0, cors_1.default)({
        origin: config_1.config.cors.allowedOrigins,
        credentials: true,
    }));
    // Webhook routes need raw body for signature verification
    app.use('/webhooks', express_1.default.raw({ type: 'application/json' }));
    app.use('/webhooks', webhooks_1.webhooksRouter);
    // Body parsing middleware for other routes
    app.use(express_1.default.json({ limit: '10mb' }));
    app.use(express_1.default.urlencoded({ extended: true }));
    // Logging middleware
    app.use(request_logger_1.requestLogger);
    // Health check (before authentication)
    app.use('/health', health_1.healthRouter);
    // API routes
    app.use('/api/v1/billing', billing_1.billingRouter);
    // Serve static files (PDFs)
    app.use('/invoices', express_1.default.static(config_1.config.pdf.storagePath));
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
        process.exit(1);
    }
    // Start scheduled jobs
    const billingJobs = new billing_jobs_1.BillingJobs();
    billingJobs.start();
    // Start server
    const port = config_1.config.server.port;
    const server = app.listen(port, () => {
        logger_1.logger.info(`Billing Service running on port ${port}`);
        logger_1.logger.info(`Environment: ${config_1.config.env}`);
        logger_1.logger.info(`PDF storage: ${config_1.config.pdf.storagePath}`);
    });
    // Graceful shutdown
    const shutdown = async (signal) => {
        logger_1.logger.info(`${signal} received, shutting down gracefully`);
        // Stop accepting new connections
        server.close(() => {
            logger_1.logger.info('HTTP server closed');
        });
        // Stop scheduled jobs
        billingJobs.stop();
        // Close database and Redis connections
        await database_service_1.DatabaseService.disconnect();
        await redis_service_1.RedisService.disconnect();
        process.exit(0);
    };
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
        logger_1.logger.error('Uncaught exception', { error: error.message, stack: error.stack });
        process.exit(1);
    });
    process.on('unhandledRejection', (reason, promise) => {
        logger_1.logger.error('Unhandled rejection', { reason, promise });
        process.exit(1);
    });
}
startServer().catch((error) => {
    logger_1.logger.error('Failed to start server:', error);
    process.exit(1);
});
