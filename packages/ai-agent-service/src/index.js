"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const config_1 = require("./config/config");
const logger_1 = require("./utils/logger");
const error_handler_1 = require("./middleware/error-handler");
const request_logger_1 = require("./middleware/request-logger");
const health_1 = require("./routes/health");
const ai_agents_1 = require("./routes/ai-agents");
const voice_workflows_1 = require("./routes/voice-workflows");
const app = (0, express_1.default)();
// Security middleware
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: config_1.config.cors.allowedOrigins,
    credentials: true,
}));
// Body parsing
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// Request logging
app.use(request_logger_1.requestLogger);
// Rate limiting
app.use((0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // Limit each IP to 1000 requests per windowMs
    message: {
        error: 'Too many requests from this IP, please try again later.',
        code: 'RATE_LIMIT_EXCEEDED',
    },
}));
// Routes
app.use('/health', health_1.healthRouter);
app.use('/ai-agents', ai_agents_1.aiAgentsRouter);
app.use('/voice-workflows', voice_workflows_1.voiceWorkflowsRouter);
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
const PORT = config_1.config.port || 3006;
app.listen(PORT, () => {
    logger_1.logger.info(`AI Agent Service running on port ${PORT}`);
    logger_1.logger.info(`Environment: ${config_1.config.nodeEnv}`);
});
exports.default = app;
