"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.config = {
    nodeEnv: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '3006', 10),
    // Database Configuration
    database: {
        url: process.env.DATABASE_URL || 'postgresql://localhost:5432/voxlink_ai_agents',
        ssl: process.env.DATABASE_SSL === 'true',
        maxConnections: parseInt(process.env.DATABASE_MAX_CONNECTIONS || '10', 10),
    },
    // CORS Configuration
    cors: {
        allowedOrigins: process.env.CORS_ALLOWED_ORIGINS?.split(',') || [
            'http://localhost:3000',
            'http://localhost:5173',
            'https://dashboard.voxlink.com',
        ],
    },
    // Logging Configuration
    logging: {
        level: process.env.LOG_LEVEL || 'info',
        format: process.env.LOG_FORMAT || 'json',
        enableConsole: process.env.ENABLE_CONSOLE_LOGGING !== 'false',
        enableFile: process.env.ENABLE_FILE_LOGGING === 'true',
        logFile: process.env.LOG_FILE || 'logs/ai-agent-service.log',
    },
    // AI Configuration
    ai: {
        voiceProvider: process.env.AI_VOICE_PROVIDER || 'google',
        apiKey: process.env.AI_API_KEY || '',
        defaultLanguage: process.env.AI_DEFAULT_LANGUAGE || 'en-US',
        maxCallDuration: parseInt(process.env.AI_MAX_CALL_DURATION || '900', 10), // 15 minutes
        responseTimeout: parseInt(process.env.AI_RESPONSE_TIMEOUT || '10', 10), // 10 seconds
    },
};
