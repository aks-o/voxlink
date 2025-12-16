export declare const config: {
    env: string;
    server: {
        port: number;
        host: string;
    };
    database: {
        url: string;
    };
    redis: {
        url: string;
    };
    cors: {
        allowedOrigins: string[];
    };
    email: {
        smtp: {
            host: string;
            port: number;
            secure: boolean;
            auth: {
                user: string;
                pass: string;
            };
        };
        from: {
            name: string;
            address: string;
        };
    };
    sms: {
        twilio: {
            accountSid: string;
            authToken: string;
            fromNumber: string;
        };
    };
    push: {
        firebase: {
            serverKey: string;
            projectId: string;
        };
    };
    websocket: {
        enabled: boolean;
        cors: {
            origin: string[];
            credentials: boolean;
        };
    };
    queue: {
        redis: {
            host: string;
            port: number;
            password: string | undefined;
        };
        defaultJobOptions: {
            removeOnComplete: number;
            removeOnFail: number;
            attempts: number;
            backoff: {
                type: string;
                delay: number;
            };
        };
    };
    retry: {
        maxAttempts: number;
        baseDelay: number;
        maxDelay: number;
    };
    rateLimit: {
        email: {
            perMinute: number;
            perHour: number;
        };
        sms: {
            perMinute: number;
            perHour: number;
        };
        webhook: {
            perMinute: number;
            perHour: number;
        };
    };
    templates: {
        defaultLanguage: string;
        supportedLanguages: string[];
    };
};
