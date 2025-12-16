"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.config = {
    env: process.env.NODE_ENV || 'development',
    server: {
        port: parseInt(process.env.PORT || '3003', 10),
        host: process.env.HOST || 'localhost',
    },
    database: {
        url: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/voxlink_notifications',
    },
    redis: {
        url: process.env.REDIS_URL || 'redis://localhost:6379',
    },
    cors: {
        allowedOrigins: process.env.CORS_ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    },
    // Email configuration (Nodemailer)
    email: {
        smtp: {
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.SMTP_PORT || '587', 10),
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER || '',
                pass: process.env.SMTP_PASS || '',
            },
        },
        from: {
            name: process.env.EMAIL_FROM_NAME || 'VoxLink',
            address: process.env.EMAIL_FROM_ADDRESS || 'noreply@voxlink.com',
        },
    },
    // SMS configuration (Twilio)
    sms: {
        twilio: {
            accountSid: process.env.TWILIO_ACCOUNT_SID || '',
            authToken: process.env.TWILIO_AUTH_TOKEN || '',
            fromNumber: process.env.TWILIO_FROM_NUMBER || '',
        },
    },
    // Push notification configuration
    push: {
        firebase: {
            serverKey: process.env.FIREBASE_SERVER_KEY || '',
            projectId: process.env.FIREBASE_PROJECT_ID || '',
        },
    },
    // WebSocket configuration
    websocket: {
        enabled: process.env.WEBSOCKET_ENABLED !== 'false',
        cors: {
            origin: process.env.WEBSOCKET_CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
            credentials: true,
        },
    },
    // Queue configuration
    queue: {
        redis: {
            host: process.env.QUEUE_REDIS_HOST || 'localhost',
            port: parseInt(process.env.QUEUE_REDIS_PORT || '6379', 10),
            password: process.env.QUEUE_REDIS_PASSWORD,
        },
        defaultJobOptions: {
            removeOnComplete: 100,
            removeOnFail: 50,
            attempts: 3,
            backoff: {
                type: 'exponential',
                delay: 2000,
            },
        },
    },
    // Retry configuration
    retry: {
        maxAttempts: parseInt(process.env.MAX_RETRY_ATTEMPTS || '3', 10),
        baseDelay: parseInt(process.env.RETRY_BASE_DELAY || '1000', 10), // milliseconds
        maxDelay: parseInt(process.env.RETRY_MAX_DELAY || '30000', 10), // milliseconds
    },
    // Rate limiting
    rateLimit: {
        email: {
            perMinute: parseInt(process.env.EMAIL_RATE_LIMIT_PER_MINUTE || '60', 10),
            perHour: parseInt(process.env.EMAIL_RATE_LIMIT_PER_HOUR || '1000', 10),
        },
        sms: {
            perMinute: parseInt(process.env.SMS_RATE_LIMIT_PER_MINUTE || '10', 10),
            perHour: parseInt(process.env.SMS_RATE_LIMIT_PER_HOUR || '100', 10),
        },
        webhook: {
            perMinute: parseInt(process.env.WEBHOOK_RATE_LIMIT_PER_MINUTE || '100', 10),
            perHour: parseInt(process.env.WEBHOOK_RATE_LIMIT_PER_HOUR || '5000', 10),
        },
    },
    // Template configuration
    templates: {
        defaultLanguage: process.env.DEFAULT_LANGUAGE || 'en',
        supportedLanguages: process.env.SUPPORTED_LANGUAGES?.split(',') || ['en'],
    },
};
