"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const socket_io_1 = require("socket.io");
const http_1 = require("http");
const config_1 = require("./config/config");
const logger_1 = require("./utils/logger");
const error_handler_1 = require("./middleware/error-handler");
const health_1 = require("./routes/health");
const notifications_1 = require("./routes/notifications");
const database_service_1 = require("./services/database.service");
const template_service_1 = require("./services/template.service");
async function startServer() {
    const app = (0, express_1.default)();
    const server = (0, http_1.createServer)(app);
    // Security middleware
    app.use((0, helmet_1.default)());
    app.use((0, cors_1.default)({
        origin: config_1.config.cors.allowedOrigins,
        credentials: true,
    }));
    // Body parsing middleware
    app.use(express_1.default.json({ limit: '10mb' }));
    app.use(express_1.default.urlencoded({ extended: true }));
    // Health check (before authentication)
    app.use('/health', health_1.healthRouter);
    // API routes
    app.use('/api/v1/notifications', notifications_1.notificationsRouter);
    // Error handling middleware (must be last)
    app.use(error_handler_1.errorHandler);
    // Initialize WebSocket if enabled
    let io = null;
    if (config_1.config.websocket.enabled) {
        io = new socket_io_1.Server(server, {
            cors: config_1.config.websocket.cors,
        });
        io.on('connection', (socket) => {
            logger_1.logger.info('WebSocket client connected', { socketId: socket.id });
            socket.on('join', (userId) => {
                socket.join(`user:${userId}`);
                logger_1.logger.debug('User joined notification room', { userId, socketId: socket.id });
            });
            socket.on('disconnect', () => {
                logger_1.logger.info('WebSocket client disconnected', { socketId: socket.id });
            });
        });
        logger_1.logger.info('WebSocket server initialized');
    }
    // Initialize services
    try {
        await database_service_1.DatabaseService.initialize();
        // Initialize default templates
        const prisma = database_service_1.DatabaseService.getClient();
        const templateService = new template_service_1.TemplateService(prisma);
        await templateService.initializeDefaultTemplates();
        logger_1.logger.info('Database connection and templates initialized');
    }
    catch (error) {
        logger_1.logger.error('Failed to initialize services:', error);
        process.exit(1);
    }
    // Start server
    const port = config_1.config.server.port;
    server.listen(port, () => {
        logger_1.logger.info(`Notification Service running on port ${port}`);
        logger_1.logger.info(`Environment: ${config_1.config.env}`);
        logger_1.logger.info(`WebSocket enabled: ${config_1.config.websocket.enabled}`);
    });
    // Graceful shutdown
    const shutdown = async (signal) => {
        logger_1.logger.info(`${signal} received, shutting down gracefully`);
        // Close WebSocket server
        if (io) {
            io.close();
        }
        // Stop accepting new connections
        server.close(() => {
            logger_1.logger.info('HTTP server closed');
        });
        // Close database connection
        await database_service_1.DatabaseService.disconnect();
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
    return { app, server, io };
}
startServer().catch((error) => {
    logger_1.logger.error('Failed to start server:', error);
    process.exit(1);
});
