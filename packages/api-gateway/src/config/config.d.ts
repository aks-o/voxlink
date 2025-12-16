export declare const config: {
    nodeEnv: string;
    port: number;
    jwt: {
        secret: string;
        expiresIn: string;
        refreshExpiresIn: string;
        issuer: string;
        audience: string;
    };
    redis: {
        host: string;
        port: number;
        password: string | undefined;
        db: number;
        keyPrefix: string;
    };
    cors: {
        allowedOrigins: string[];
    };
    rateLimit: {
        global: {
            windowMs: number;
            max: number;
        };
        auth: {
            windowMs: number;
            max: number;
        };
        numbers: {
            windowMs: number;
            max: number;
        };
        billing: {
            windowMs: number;
            max: number;
        };
        notifications: {
            windowMs: number;
            max: number;
        };
        analytics: {
            windowMs: number;
            max: number;
        };
        'ai-agents': {
            windowMs: number;
            max: number;
        };
        'voice-workflows': {
            windowMs: number;
            max: number;
        };
    };
    services: {
        numberService: {
            url: string;
            timeout: number;
        };
        billingService: {
            url: string;
            timeout: number;
        };
        notificationService: {
            url: string;
            timeout: number;
        };
        analyticsService: {
            url: string;
            timeout: number;
        };
        aiAgentService: {
            url: string;
            timeout: number;
        };
    };
    security: {
        bcryptRounds: number;
        apiKeyLength: number;
        sessionTimeout: number;
        maxLoginAttempts: number;
        lockoutDuration: number;
        encryptionKey: string;
        defaultSalt: string;
        backupCodeSalt: string;
        passwordPolicy: {
            minLength: number;
            requireUppercase: boolean;
            requireLowercase: boolean;
            requireNumbers: boolean;
            requireSpecialChars: boolean;
            maxAge: number;
            preventReuse: number;
            lockoutThreshold: number;
            lockoutDuration: number;
        };
        mfaPolicy: {
            required: boolean;
            requiredForRoles: string[];
            allowedMethods: string[];
            backupCodesCount: number;
            gracePeriod: number;
        };
        sessionPolicy: {
            maxDuration: number;
            idleTimeout: number;
            maxConcurrentSessions: number;
            requireReauthForSensitive: boolean;
        };
        encryptionPolicy: {
            dataAtRest: boolean;
            dataInTransit: boolean;
            keyRotationInterval: number;
            algorithm: string;
            keySize: number;
        };
        auditPolicy: {
            enabled: boolean;
            retentionPeriod: number;
            logLevel: string;
            realTimeAlerts: boolean;
            exportFormat: string;
        };
    };
    logging: {
        level: string;
        format: string;
        enableConsole: boolean;
        enableFile: boolean;
        logFile: string;
    };
    database: {
        url: string;
        ssl: boolean;
        maxConnections: number;
    };
};
