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
    port: parseInt(process.env.PORT || '3001', 10),
    // JWT Configuration
    jwt: {
        secret: process.env.JWT_SECRET || 'voxlink-super-secret-key-change-in-production',
        expiresIn: process.env.JWT_EXPIRES_IN || '24h',
        refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
        issuer: process.env.JWT_ISSUER || 'voxlink-api-gateway',
        audience: process.env.JWT_AUDIENCE || 'voxlink-services',
    },
    // Redis Configuration
    redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
        password: process.env.REDIS_PASSWORD,
        db: parseInt(process.env.REDIS_DB || '0', 10),
        keyPrefix: process.env.REDIS_KEY_PREFIX || 'voxlink:gateway:',
    },
    // CORS Configuration
    cors: {
        allowedOrigins: process.env.CORS_ALLOWED_ORIGINS?.split(',') || [
            'http://localhost:3000',
            'http://localhost:5173',
            'https://dashboard.voxlink.com',
        ],
    },
    // Rate Limiting Configuration
    rateLimit: {
        global: {
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 1000, // requests per window
        },
        auth: {
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 10, // login attempts per window
        },
        numbers: {
            windowMs: 1 * 60 * 1000, // 1 minute
            max: 100, // requests per window
        },
        billing: {
            windowMs: 1 * 60 * 1000, // 1 minute
            max: 50, // requests per window
        },
        notifications: {
            windowMs: 1 * 60 * 1000, // 1 minute
            max: 200, // requests per window
        },
        analytics: {
            windowMs: 1 * 60 * 1000, // 1 minute
            max: 100, // requests per window
        },
        'ai-agents': {
            windowMs: 1 * 60 * 1000, // 1 minute
            max: 100, // requests per window
        },
        'voice-workflows': {
            windowMs: 1 * 60 * 1000, // 1 minute
            max: 100, // requests per window
        },
    },
    // Service URLs
    services: {
        numberService: {
            url: process.env.NUMBER_SERVICE_URL || 'http://localhost:3002',
            timeout: parseInt(process.env.NUMBER_SERVICE_TIMEOUT || '30000', 10),
        },
        billingService: {
            url: process.env.BILLING_SERVICE_URL || 'http://localhost:3003',
            timeout: parseInt(process.env.BILLING_SERVICE_TIMEOUT || '30000', 10),
        },
        notificationService: {
            url: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3004',
            timeout: parseInt(process.env.NOTIFICATION_SERVICE_TIMEOUT || '30000', 10),
        },
        analyticsService: {
            url: process.env.ANALYTICS_SERVICE_URL || 'http://localhost:3005',
            timeout: parseInt(process.env.ANALYTICS_SERVICE_TIMEOUT || '30000', 10),
        },
        aiAgentService: {
            url: process.env.AI_AGENT_SERVICE_URL || 'http://localhost:3006',
            timeout: parseInt(process.env.AI_AGENT_SERVICE_TIMEOUT || '30000', 10),
        },
    },
    // Enhanced Security Configuration
    security: {
        bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12', 10),
        apiKeyLength: parseInt(process.env.API_KEY_LENGTH || '32', 10),
        sessionTimeout: parseInt(process.env.SESSION_TIMEOUT || '3600000', 10), // 1 hour
        maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5', 10),
        lockoutDuration: parseInt(process.env.LOCKOUT_DURATION || '900000', 10), // 15 minutes
        encryptionKey: process.env.ENCRYPTION_KEY || 'default-encryption-key-32-bytes-long',
        defaultSalt: process.env.DEFAULT_SALT || 'voxlink-default-salt',
        backupCodeSalt: process.env.BACKUP_CODE_SALT || 'voxlink-backup-code-salt',
        // Password Policy
        passwordPolicy: {
            minLength: parseInt(process.env.PASSWORD_MIN_LENGTH || '8', 10),
            requireUppercase: process.env.PASSWORD_REQUIRE_UPPERCASE !== 'false',
            requireLowercase: process.env.PASSWORD_REQUIRE_LOWERCASE !== 'false',
            requireNumbers: process.env.PASSWORD_REQUIRE_NUMBERS !== 'false',
            requireSpecialChars: process.env.PASSWORD_REQUIRE_SPECIAL !== 'false',
            maxAge: parseInt(process.env.PASSWORD_MAX_AGE || '90', 10), // days
            preventReuse: parseInt(process.env.PASSWORD_PREVENT_REUSE || '5', 10),
            lockoutThreshold: parseInt(process.env.PASSWORD_LOCKOUT_THRESHOLD || '5', 10),
            lockoutDuration: parseInt(process.env.PASSWORD_LOCKOUT_DURATION || '15', 10), // minutes
        },
        // MFA Policy
        mfaPolicy: {
            required: process.env.MFA_REQUIRED === 'true',
            requiredForRoles: (process.env.MFA_REQUIRED_ROLES || 'super_admin,admin').split(','),
            allowedMethods: (process.env.MFA_ALLOWED_METHODS || 'totp,sms,email').split(','),
            backupCodesCount: parseInt(process.env.MFA_BACKUP_CODES_COUNT || '10', 10),
            gracePeriod: parseInt(process.env.MFA_GRACE_PERIOD || '7', 10), // days
        },
        // Session Policy
        sessionPolicy: {
            maxDuration: parseInt(process.env.SESSION_MAX_DURATION || '480', 10), // minutes
            idleTimeout: parseInt(process.env.SESSION_IDLE_TIMEOUT || '30', 10), // minutes
            maxConcurrentSessions: parseInt(process.env.SESSION_MAX_CONCURRENT || '3', 10),
            requireReauthForSensitive: process.env.SESSION_REQUIRE_REAUTH !== 'false',
        },
        // Encryption Policy
        encryptionPolicy: {
            dataAtRest: process.env.ENCRYPTION_DATA_AT_REST !== 'false',
            dataInTransit: process.env.ENCRYPTION_DATA_IN_TRANSIT !== 'false',
            keyRotationInterval: parseInt(process.env.ENCRYPTION_KEY_ROTATION || '90', 10), // days
            algorithm: process.env.ENCRYPTION_ALGORITHM || 'aes-256-gcm',
            keySize: parseInt(process.env.ENCRYPTION_KEY_SIZE || '256', 10),
        },
        // Audit Policy
        auditPolicy: {
            enabled: process.env.AUDIT_ENABLED !== 'false',
            retentionPeriod: parseInt(process.env.AUDIT_RETENTION_PERIOD || '365', 10), // days
            logLevel: process.env.AUDIT_LOG_LEVEL || 'standard',
            realTimeAlerts: process.env.AUDIT_REAL_TIME_ALERTS !== 'false',
            exportFormat: process.env.AUDIT_EXPORT_FORMAT || 'json',
        },
    },
    // Logging Configuration
    logging: {
        level: process.env.LOG_LEVEL || 'info',
        format: process.env.LOG_FORMAT || 'json',
        enableConsole: process.env.ENABLE_CONSOLE_LOGGING !== 'false',
        enableFile: process.env.ENABLE_FILE_LOGGING === 'true',
        logFile: process.env.LOG_FILE || 'logs/api-gateway.log',
    },
    // Database Configuration (for user management)
    database: {
        url: process.env.DATABASE_URL || 'postgresql://localhost:5432/voxlink_gateway',
        ssl: process.env.DATABASE_SSL === 'true',
        maxConnections: parseInt(process.env.DATABASE_MAX_CONNECTIONS || '10', 10),
    },
};
